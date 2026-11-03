import { createClient } from "@supabase/supabase-js";

import { getOptionalEnv } from "@/lib/server-env";

// POST /api/leads — stores the Health Check email gate submission.
// Stored: email, locale, marketing-consent flag + timestamp, score band, source.
// Never stored: raw income/expense/savings/debt amounts or the exact score.

const MAX_BODY_BYTES = 2048;
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 5;
const SCORE_BANDS = new Set(["0-39", "40-69", "70-100"]);
const LOCALE_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const hits = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip")?.trim() || "unknown";
}

function rateLimited(ip: string, now = Date.now()) {
  const entry = hits.get(ip);
  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    if (hits.size > 5000) {
      for (const [key, value] of hits) if (value.resetAt <= now) hits.delete(key);
    }
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return Boolean(host) && new URL(origin).host === host;
  } catch {
    return false;
  }
}

function json(body: Record<string, unknown>, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

type LeadInput = {
  email?: unknown;
  locale?: unknown;
  marketingConsent?: unknown;
  scoreBand?: unknown;
  source?: unknown;
};

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ ok: false, error: "Request blocked" }, 403);
  if (rateLimited(clientIp(req))) return json({ ok: false, error: "Too many requests" }, 429);

  let input: LeadInput;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return json({ ok: false, error: "Payload too large" }, 413);
    input = JSON.parse(text) as LeadInput;
  } catch {
    return json({ ok: false, error: "Invalid payload" }, 400);
  }
  if (!input || typeof input !== "object") return json({ ok: false, error: "Invalid payload" }, 400);

  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return json({ ok: false, error: "Invalid email" }, 400);
  }
  const locale = typeof input.locale === "string" && LOCALE_PATTERN.test(input.locale) ? input.locale : "en";
  const marketingConsent = input.marketingConsent === true;
  const scoreBand = typeof input.scoreBand === "string" && SCORE_BANDS.has(input.scoreBand) ? input.scoreBand : null;
  const source = input.source === "health-check" ? "health-check" : "other";

  const url = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY");
  // Leads are written with the service role only (RLS blocks anon/auth roles).
  if (!url || !serviceKey) return json({ ok: false, configured: false, error: "Lead storage is not configured" }, 503);

  const now = new Date().toISOString();
  try {
    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase.from("leads").upsert(
      {
        email,
        locale,
        marketing_consent: marketingConsent,
        marketing_consent_at: now,
        score_band: scoreBand,
        source,
        updated_at: now,
      },
      { onConflict: "email" },
    );
    if (error) {
      console.error("[leads] insert failed", error.code ?? "unknown");
      return json({ ok: false, error: "Could not save" }, 500);
    }
  } catch (error) {
    console.error("[leads] insert failed", error instanceof Error ? error.name : "unknown");
    return json({ ok: false, error: "Could not save" }, 500);
  }

  return json({ ok: true }, 200);
}
