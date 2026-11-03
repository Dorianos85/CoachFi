const DEFAULT_WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

export function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

export async function readJsonWithLimit<T>(req: Request, maxBytes = 4096): Promise<T> {
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) throw new Error("Payload too large");
  const text = await req.text();
  if (new TextEncoder().encode(text).length > maxBytes) throw new Error("Payload too large");
  return JSON.parse(text) as T;
}

export function sanitizeDisplayName(value: unknown, fallback = "Coach FI user") {
  const raw = typeof value === "string" ? value : fallback;
  return raw
    .replace(/[^\p{L}\p{N}\s._-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 32) || fallback;
}

export function clampNumber(value: unknown, min: number, max: number) {
  const number = typeof value === "number" && Number.isFinite(value) ? value : min;
  return Math.max(min, Math.min(max, number));
}

const PRODUCTION_HOSTS = ["coachfiai.com", "www.coachfiai.com"];

function hostOf(value: string | null | undefined) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    return new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`).host.toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Hosts a browser request may come from: the request's own host (same origin, which also covers
 * every Vercel preview URL), NEXT_PUBLIC_APP_URL, the production domains, Vercel's system URLs
 * and an optional comma-separated COACHFI_ALLOWED_ORIGINS list.
 */
export function allowedOriginHosts(req: Request) {
  const hosts = new Set<string>(PRODUCTION_HOSTS);
  const add = (value: string | null | undefined) => {
    const host = hostOf(value);
    if (host) hosts.add(host);
  };
  add(req.headers.get("host"));
  try {
    add(new URL(req.url).host);
  } catch {
    /* relative URL in tests */
  }
  add(process.env.NEXT_PUBLIC_APP_URL);
  add(process.env.VERCEL_URL);
  add(process.env.VERCEL_BRANCH_URL);
  add(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  for (const item of (process.env.COACHFI_ALLOWED_ORIGINS ?? "").split(",")) add(item);
  return hosts;
}

/**
 * Browser-only endpoint guard (CSRF / cross-site abuse from other web pages).
 * - With an Origin header: it must be one of `allowedOriginHosts`.
 * - Without Origin (same-origin GET in most browsers): `Sec-Fetch-Site: same-origin`
 *   or a Referer from an allowed host is required.
 * - Neither (curl, scripts, server-to-server): blocked.
 * Non-browser clients can forge these headers, so this is not authentication; the
 * shared rate limits in lib/ratelimit.ts are the cost control.
 */
export function assertSameOrigin(req: Request) {
  const allowed = allowedOriginHosts(req);
  const origin = req.headers.get("origin");
  if (origin) {
    if (allowed.has(hostOf(origin)) && origin !== "null") return;
    throw new Error("Cross-origin request blocked");
  }
  const site = req.headers.get("sec-fetch-site");
  if (site === "same-origin") return;
  if (site) throw new Error("Cross-origin request blocked");
  const refererHost = hostOf(req.headers.get("referer"));
  if (refererHost && allowed.has(refererHost)) return;
  throw new Error("Cross-origin request blocked");
}

export function requireConsentHeader(req: Request, value: string) {
  if (req.headers.get("x-coachfi-consent") !== value) {
    throw new Error("Missing user consent");
  }
}

export function rateLimit(req: Request, key: string, max = 30, windowMs = DEFAULT_WINDOW_MS) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || req.headers.get("x-real-ip") || "local";
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const bucket = buckets.get(bucketKey);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
  if (bucket.count > max) {
    throw new Error("Too many requests");
  }
}

export function isLikelySolanaAddress(value: unknown) {
  return typeof value === "string" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}
