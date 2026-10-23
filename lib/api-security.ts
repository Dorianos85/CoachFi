const DEFAULT_WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

export function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

export async function readJsonWithLimit<T>(req: Request, maxBytes = 4096): Promise<T> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error("Invalid body limit");
  const length = req.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes)) {
    void req.body?.cancel().catch(() => {});
    throw new Error("Payload too large");
  }
  if (!req.body) throw new SyntaxError("Invalid JSON");
  const reader = req.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        throw new Error("Payload too large");
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } catch (error) {
    // Release unread data on decoding/stream errors too. A cancellation failure
    // must not hide the original size-limit decision from the caller.
    try { await reader.cancel(); } catch { /* preserve the original error */ }
    throw error;
  } finally {
    reader.releaseLock();
  }
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
  if (req.headers.get("sec-fetch-site") === "cross-site") {
    throw new Error("Cross-origin request blocked");
  }
  const origin = req.headers.get("origin");
  if (!origin) return;
  try {
    const supplied = new URL(origin);
    const canonical = new URL(req.url);
    if (
      !["http:", "https:"].includes(supplied.protocol) ||
      supplied.username || supplied.password || supplied.search || supplied.hash ||
      supplied.pathname !== "/" || supplied.origin !== canonical.origin
    ) {
      throw new Error("Cross-origin request blocked");
    }
  } catch {
    throw new Error("Cross-origin request blocked");
  }
}

export function requireConsentHeader(req: Request, value: string) {
  if (req.headers.get("x-coachfi-consent") !== value) {
    throw new Error("Missing user consent");
  }
}

export function rateLimit(req: Request, key: string, max = 30, windowMs = DEFAULT_WINDOW_MS) {
  // Local process load-shedding only. Never an identity, durable quota or budget.
  // Untrusted forwarding/IP headers must not mint new buckets.
  const bucketKey = `${key}:${req.method}`;
  const now = Date.now();
  for (const [existingKey, existing] of buckets) {
    if (existing.resetAt <= now) buckets.delete(existingKey);
  }
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
