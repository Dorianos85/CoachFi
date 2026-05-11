const DEFAULT_WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

export function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

export async function readJsonWithLimit<T>(req: Request, maxBytes = 4096): Promise<T> {
  const text = await req.text();
  if (text.length > maxBytes) throw new Error("Payload too large");
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

export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return;
  const host = req.headers.get("host");
  if (!host) throw new Error("Missing host");
  if (new URL(origin).host !== host) throw new Error("Cross-origin request blocked");
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
