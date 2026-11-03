import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  __resetMemoryLimiter,
  clientIp,
  enforceLimits,
  ipSubject,
  limitFromEnv,
  limitKey,
  refundLimits,
  type LimitRule,
} from "./ratelimit";

const NOW = Date.UTC(2026, 10, 3, 12, 0, 0);

function req(headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/x", { headers });
}

beforeEach(() => {
  __resetMemoryLimiter();
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  vi.stubEnv("NODE_ENV", "test");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("in-memory fallback", () => {
  const rules = (cost = 1): LimitRule[] => [
    { name: "t:ip", subject: "ip_a", limit: 3, windowSec: 60 },
    { name: "t:global", subject: "global", limit: 100, windowSec: 86_400, cost },
  ];

  it("allows up to the limit, then blocks with a Retry-After inside the window", async () => {
    for (let i = 0; i < 3; i++) expect((await enforceLimits(rules(), NOW)).ok).toBe(true);
    const blocked = await enforceLimits(rules(), NOW + 1_000);
    expect(blocked).toMatchObject({ ok: false, rule: "t:ip", backend: "memory" });
    if (!blocked.ok) expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(blocked.ok || blocked.retryAfterSec <= 60).toBe(true);
    // Next window opens again.
    expect((await enforceLimits(rules(), NOW + 61_000)).ok).toBe(true);
  });

  it("does not charge the global budget for requests rejected by another rule", async () => {
    const tight: LimitRule[] = [
      { name: "t:ip", subject: "ip_b", limit: 1, windowSec: 60 },
      { name: "t:global", subject: "global", limit: 2, windowSec: 86_400 },
    ];
    expect((await enforceLimits(tight, NOW)).ok).toBe(true);
    for (let i = 0; i < 10; i++) expect((await enforceLimits(tight, NOW)).ok).toBe(false);
    // Another IP still has global budget left (1 of 2 used).
    const other: LimitRule[] = [{ ...tight[0], subject: "ip_c" }, tight[1]];
    expect((await enforceLimits(other, NOW)).ok).toBe(true);
  });

  it("supports weighted costs (characters) and refunds", async () => {
    const chars = (cost: number): LimitRule[] => [{ name: "t:chars", subject: "ip_d", limit: 1000, windowSec: 86_400, cost }];
    expect((await enforceLimits(chars(600), NOW)).ok).toBe(true);
    expect((await enforceLimits(chars(500), NOW)).ok).toBe(false);
    await refundLimits(chars(600), NOW);
    expect((await enforceLimits(chars(500), NOW)).ok).toBe(true);
  });

  it("uses strict, scaled-down limits and warns when Upstash is missing in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const rule: LimitRule[] = [{ name: "t:strict", subject: "ip_e", limit: 10, windowSec: 60 }];
    expect((await enforceLimits(rule, NOW)).ok).toBe(true);
    expect((await enforceLimits(rule, NOW)).ok).toBe(true);
    const third = await enforceLimits(rule, NOW);
    expect(third).toMatchObject({ ok: false, backend: "memory-strict" });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("UPSTASH_REDIS_REST_URL"));
  });
});

describe("Upstash backend", () => {
  beforeEach(() => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example-redis.upstash.io/");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "qa-token");
  });

  it("runs one atomic EVAL with every key and parses an allow", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ result: [0, 0] }));
    vi.stubGlobal("fetch", fetchMock);
    const rules: LimitRule[] = [
      { name: "chat:ip:min", subject: "ip_x", limit: 6, windowSec: 60 },
      { name: "chat:global:day", subject: "global", limit: 3000, windowSec: 86_400, cost: 2 },
    ];
    const decision = await enforceLimits(rules, NOW);
    expect(decision).toEqual({ ok: true, backend: "upstash" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://example-redis.upstash.io");
    expect((init as RequestInit).headers).toMatchObject({ Authorization: "Bearer qa-token" });
    const command = JSON.parse((init as RequestInit).body as string);
    expect(command[0]).toBe("EVAL");
    expect(command[2]).toBe("2");
    expect(command.slice(3, 5)).toEqual([limitKey(rules[0], NOW), limitKey(rules[1], NOW)]);
    expect(command.slice(5)).toEqual(["6", "1", "120", "3000", "2", "86460"]);
  });

  it("maps a blocked rule index and TTL to a 429 decision", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ result: [2, 321] })));
    const decision = await enforceLimits(
      [
        { name: "a", subject: "s", limit: 1, windowSec: 60 },
        { name: "b", subject: "global", limit: 1, windowSec: 86_400 },
      ],
      NOW,
    );
    expect(decision).toEqual({ ok: false, backend: "upstash", rule: "b", retryAfterSec: 321 });
  });

  it("falls back to strict in-memory limits (not fail-open) when Upstash errors in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("down", { status: 500 })));
    const rule: LimitRule[] = [{ name: "t:down", subject: "ip_f", limit: 5, windowSec: 60 }];
    expect((await enforceLimits(rule, NOW)).ok).toBe(true);
    expect(await enforceLimits(rule, NOW)).toMatchObject({ ok: false, backend: "memory-strict" });
  });
});

describe("helpers", () => {
  it("reads positive integer limits from env", () => {
    vi.stubEnv("LIMIT_QA", "25");
    expect(limitFromEnv("LIMIT_QA", 5)).toBe(25);
    vi.stubEnv("LIMIT_QA", "0");
    expect(limitFromEnv("LIMIT_QA", 5)).toBe(5);
    vi.stubEnv("LIMIT_QA", "abc");
    expect(limitFromEnv("LIMIT_QA", 5)).toBe(5);
    expect(limitFromEnv("LIMIT_QA_MISSING", 7)).toBe(7);
  });

  it("prefers the platform IP header and groups IPv6 by /64", () => {
    expect(clientIp(req({ "x-real-ip": "203.0.113.9", "x-forwarded-for": "198.51.100.1" }))).toBe("203.0.113.9");
    expect(clientIp(req({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" }))).toBe("198.51.100.1");
    expect(clientIp(req({ "x-real-ip": "2001:db8:1:2:aaaa::1" }))).toBe("2001:db8:1:2::/64");
    expect(clientIp(req({ "x-real-ip": "2001:db8:1:2:ffff:1:2:3" }))).toBe("2001:db8:1:2::/64");
    expect(clientIp(req({ "x-real-ip": "::ffff:192.0.2.7" }))).toBe("192.0.2.7");
    expect(ipSubject(req({ "x-real-ip": "2001:db8:1:2::1" }))).toBe(ipSubject(req({ "x-real-ip": "2001:db8:1:2::2" })));
  });

  it("never puts a raw IP in a key", () => {
    const subject = ipSubject(req({ "x-real-ip": "203.0.113.9" }));
    expect(subject).not.toContain("203.0.113.9");
    expect(limitKey({ name: "n", subject, limit: 1, windowSec: 60 }, NOW)).toMatch(/^coachfi:\{rl\}:n:ip_/);
  });
});
