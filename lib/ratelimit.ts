import { createHash } from "node:crypto";

/**
 * Shared, durable rate limiting for paid endpoints.
 *
 * Backend: Upstash Redis over its REST API (plain fetch, no SDK). One atomic Lua
 * script checks every rule first and only increments when all of them pass, so a
 * request that is rejected by its per-IP rule never eats into the global budget.
 *
 * Fallback: when UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are missing or
 * Upstash errors, a per-instance in-memory limiter is used. In production that
 * fallback is "strict": every limit is scaled down (RATE_LIMIT_STRICT_FACTOR,
 * default 0.2) and a warning is logged, so a missing env var never fails open silently.
 */

export type LimitRule = {
  /** Short rule id, used in the Redis key and in 429 responses (e.g. "tts:ip:chars"). */
  name: string;
  /** Subject of the rule: hashed IP, user id or "global". */
  subject: string;
  limit: number;
  windowSec: number;
  /** Units consumed by this request (1 per request, or e.g. characters for TTS). */
  cost?: number;
};

export type LimitDecision =
  | { ok: true; backend: LimitBackend }
  | { ok: false; backend: LimitBackend; rule: string; retryAfterSec: number };

export type LimitBackend = "upstash" | "memory" | "memory-strict";

const KEY_PREFIX = "coachfi:{rl}";
const UPSTASH_TIMEOUT_MS = 1500;

const CHECK_AND_INCR = `
local n = #KEYS
for i = 1, n do
  local limit = tonumber(ARGV[(i - 1) * 3 + 1])
  local cost = tonumber(ARGV[(i - 1) * 3 + 2])
  local current = tonumber(redis.call('GET', KEYS[i]) or '0')
  if current + cost > limit then
    return {i, redis.call('TTL', KEYS[i])}
  end
end
for i = 1, n do
  local cost = tonumber(ARGV[(i - 1) * 3 + 2])
  local ttl = tonumber(ARGV[(i - 1) * 3 + 3])
  redis.call('INCRBY', KEYS[i], cost)
  if redis.call('TTL', KEYS[i]) < 0 then redis.call('EXPIRE', KEYS[i], ttl) end
end
return {0, 0}
`;

type MemoryBucket = { count: number; resetAt: number };
const memory = new Map<string, MemoryBucket>();
const warned = new Set<string>();

function warnOnce(key: string, message: string) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}

function upstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function strictFactor() {
  const value = Number(process.env.RATE_LIMIT_STRICT_FACTOR);
  return Number.isFinite(value) && value > 0 && value <= 1 ? value : 0.2;
}

function normalizedCost(rule: LimitRule) {
  const cost = Math.ceil(rule.cost ?? 1);
  return Number.isFinite(cost) && cost > 0 ? cost : 1;
}

function windowBucket(windowSec: number, now: number) {
  return Math.floor(now / 1000 / windowSec);
}

export function limitKey(rule: LimitRule, now = Date.now()) {
  return `${KEY_PREFIX}:${rule.name}:${rule.subject}:${windowBucket(rule.windowSec, now)}`;
}

/** Positive integer from env, or the fallback. `0` disables nothing: it is treated as invalid. */
export function limitFromEnv(name: string, fallback: number) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Math.floor(Number(raw));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * Client IP as seen by the platform. On Vercel `x-real-ip` and `x-forwarded-for`
 * are set by the edge and cannot be overridden by the client.
 * IPv6 addresses are reduced to their /64 prefix (one household / one VPS).
 */
export function clientIp(req: Request) {
  const raw =
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local";
  return raw.includes(":") ? ipv6Prefix(raw) : raw;
}

function ipv6Prefix(address: string) {
  const clean = address.replace(/^\[|\]$/g, "").split("%")[0];
  if (/^::ffff:\d+\.\d+\.\d+\.\d+$/i.test(clean)) return clean.slice(7);
  const [head, tail = ""] = clean.split("::");
  const headParts = head ? head.split(":") : [];
  const tailParts = clean.includes("::") && tail ? tail.split(":") : [];
  const missing = Math.max(0, 8 - headParts.length - tailParts.length);
  const parts = clean.includes("::") ? [...headParts, ...Array(missing).fill("0"), ...tailParts] : headParts;
  return `${parts.slice(0, 4).map((part) => (part || "0").toLowerCase()).join(":")}::/64`;
}

/** Hashed client IP: rate-limit keys never store raw addresses. */
export function ipSubject(req: Request) {
  return `ip_${createHash("sha256").update(clientIp(req)).digest("base64url").slice(0, 22)}`;
}

export function userSubject(userId: string) {
  return `u_${createHash("sha256").update(userId).digest("base64url").slice(0, 22)}`;
}

function memoryCheck(rules: LimitRule[], strict: boolean, now: number): LimitDecision {
  const backend: LimitBackend = strict ? "memory-strict" : "memory";
  if (memory.size > 10_000) {
    for (const [key, bucket] of memory) if (bucket.resetAt <= now) memory.delete(key);
  }
  const entries = rules.map((rule) => {
    const key = limitKey(rule, now);
    const limit = strict ? Math.max(1, Math.floor(rule.limit * strictFactor())) : rule.limit;
    const bucket = memory.get(key);
    const current = bucket && bucket.resetAt > now ? bucket.count : 0;
    const resetAt = (windowBucket(rule.windowSec, now) + 1) * rule.windowSec * 1000;
    return { rule, key, limit, current, resetAt, cost: normalizedCost(rule) };
  });
  const blocked = entries.find((entry) => entry.current + entry.cost > entry.limit);
  if (blocked) {
    return {
      ok: false,
      backend,
      rule: blocked.rule.name,
      retryAfterSec: Math.max(1, Math.ceil((blocked.resetAt - now) / 1000)),
    };
  }
  for (const entry of entries) {
    memory.set(entry.key, { count: entry.current + entry.cost, resetAt: entry.resetAt });
  }
  return { ok: true, backend };
}

async function upstashCommand(config: { url: string; token: string }, command: (string | number)[]) {
  const res = await fetch(config.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command.map(String)),
    cache: "no-store",
    signal: AbortSignal.timeout(UPSTASH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);
  const data = (await res.json()) as { result?: unknown; error?: string };
  if (data.error) throw new Error(`Upstash error: ${data.error}`);
  return data.result;
}

async function upstashCheck(config: { url: string; token: string }, rules: LimitRule[], now: number): Promise<LimitDecision> {
  const keys = rules.map((rule) => limitKey(rule, now));
  const args = rules.flatMap((rule) => [rule.limit, normalizedCost(rule), rule.windowSec + 60]);
  const result = await upstashCommand(config, ["EVAL", CHECK_AND_INCR, keys.length, ...keys, ...args]);
  if (!Array.isArray(result)) throw new Error("Upstash: unexpected script result");
  const index = Number(result[0]);
  if (index === 0) return { ok: true, backend: "upstash" };
  const rule = rules[index - 1];
  const ttl = Number(result[1]);
  return {
    ok: false,
    backend: "upstash",
    rule: rule?.name ?? "unknown",
    retryAfterSec: ttl > 0 ? ttl : rule?.windowSec ?? 60,
  };
}

/** Checks every rule and, only if all pass, consumes `cost` from each. */
export async function enforceLimits(rules: LimitRule[], now = Date.now()): Promise<LimitDecision> {
  if (rules.length === 0) return { ok: true, backend: "memory" };
  const config = upstashConfig();
  if (config) {
    try {
      return await upstashCheck(config, rules, now);
    } catch (error) {
      console.error("[ratelimit] Upstash unavailable, using in-memory limits", error instanceof Error ? error.message : error);
      return memoryCheck(rules, isProduction(), now);
    }
  }
  if (isProduction()) {
    warnOnce(
      "no-upstash",
      "[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN missing in production: using strict per-instance in-memory limits. Configure Upstash for shared limits.",
    );
    return memoryCheck(rules, true, now);
  }
  return memoryCheck(rules, false, now);
}

/** Gives back units consumed by `enforceLimits` (e.g. after a failed mint). Best effort. */
export async function refundLimits(rules: LimitRule[], now = Date.now()) {
  const config = upstashConfig();
  if (config) {
    try {
      for (const rule of rules) await upstashCommand(config, ["DECRBY", limitKey(rule, now), normalizedCost(rule)]);
      return;
    } catch (error) {
      console.error("[ratelimit] refund failed", error instanceof Error ? error.message : error);
    }
  }
  for (const rule of rules) {
    const bucket = memory.get(limitKey(rule, now));
    if (bucket) bucket.count = Math.max(0, bucket.count - normalizedCost(rule));
  }
}

export function limitExceededResponse(decision: Extract<LimitDecision, { ok: false }>, message = "Too many requests") {
  console.warn("[ratelimit] blocked", decision.rule, decision.backend);
  return Response.json(
    { ok: false, error: message, limit: decision.rule },
    { status: 429, headers: { "Retry-After": String(decision.retryAfterSec), "Cache-Control": "no-store" } },
  );
}

/** Test helper. */
export function __resetMemoryLimiter() {
  memory.clear();
  warned.clear();
}
