import { createClient } from "@supabase/supabase-js";

import {
  assertSameOrigin,
  clampNumber,
  jsonError,
  rateLimit,
  readJsonWithLimit,
  requireConsentHeader,
} from "@/lib/api-security";
import { enforceLimits, limitExceededResponse } from "@/lib/ratelimit";
import { escapeLikePattern, leaderboardName } from "@/lib/server/leaderboard";
import { leaderboardWriteRules } from "@/lib/server/limits";
import { getOptionalEnv } from "@/lib/server-env";

function getTableName() {
  return getOptionalEnv("SUPABASE_LEADERBOARD_TABLE") ?? "leaderboard";
}

function getClient() {
  const supabaseUrl = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey =
    getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY") ?? getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export interface LeaderboardEntry {
  id?: string;
  name: string;
  score: number;
  streak: number;
  updated_at?: string;
}

// GET /api/leaderboard — returns top 20
export async function GET(req: Request) {
  try {
    rateLimit(req, "leaderboard-read", 60);
  } catch {
    return jsonError("Too many requests", 429);
  }
  const supabase = getClient();
  if (!supabase) {
    return Response.json({ entries: [], configured: false });
  }
  const table = getTableName();

  const { data, error } = await supabase
    .from(table)
    .select("id, name, score, streak, updated_at")
    .order("score", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[leaderboard GET]", error.message);
    return Response.json({ entries: [], configured: true, error: "Leaderboard unavailable" });
  }

  return Response.json({ entries: data ?? [], configured: true });
}

// POST /api/leaderboard — upsert a score by display name.
// Anonymous writes stay (the Leaderboard UI posts without sign-in), so they are bound by shared
// per-IP/global write limits, name sanitising, a reserved-name filter and exact-name matching.
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    requireConsentHeader(req, "leaderboard");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request blocked";
    return jsonError(message, 403);
  }

  const supabase = getClient();
  if (!supabase) {
    return Response.json({ ok: false, configured: false });
  }
  const table = getTableName();

  let body: LeaderboardEntry;
  try {
    body = await readJsonWithLimit<LeaderboardEntry>(req, 1200);
  } catch {
    return jsonError("Invalid payload", 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) return jsonError("Invalid payload", 400);
  const name = leaderboardName(body.name);
  const score = clampNumber(body.score, 0, 100);
  const streak = clampNumber(body.streak, 0, 3650);
  if (!name || typeof body.score !== "number") {
    return Response.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const decision = await enforceLimits(leaderboardWriteRules(req));
  if (!decision.ok) return limitExceededResponse(decision);

  // Upsert: case-insensitive exact name match (wildcards escaped), update only if score is higher
  const { data: existing, error: lookupError } = await supabase
    .from(table)
    .select("id, score")
    .ilike("name", escapeLikePattern(name))
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    console.error("[leaderboard POST lookup]", lookupError.message);
    return Response.json({ ok: false, error: "Leaderboard unavailable" }, { status: 500 });
  }

  if (existing && existing.score >= score) {
    // Don't downgrade the score
    return Response.json({ ok: true, updated: false });
  }

  const { error } = existing
    ? await supabase
        .from(table)
        .update({ score, streak, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
    : await supabase
        .from(table)
        .insert({ name, score, streak });

  if (error) {
    console.error("[leaderboard POST]", error.message);
    return Response.json({ ok: false, error: "Leaderboard unavailable" }, { status: 500 });
  }

  return Response.json({ ok: true, updated: true });
}
