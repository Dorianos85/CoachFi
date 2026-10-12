import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { getAvatar, saveAvatar, type AvatarData } from "@/lib/avatar";
import { getAllCards, saveCards, type SRSCard } from "@/lib/srs";
import { getUser, saveUser } from "@/lib/user";
import { readStoredConsent, type OptionalConsentKey } from "@/lib/consent";
import type { HealthCheckResult } from "@/lib/healthCheck";
import type { RewardDelta, SyncEntity } from "@/lib/sync/syncQueue";

export interface ChallengePayload {
  questionId: string;
  isCorrect: boolean;
  reward: number;
}

// OptionalConsentKey (local) → consents.doc_type (DB enum)
const CONSENT_DOC_MAP: Record<OptionalConsentKey, string> = {
  aiCoach: "ai",
  voice: "voice",
  leaderboard: "ranking",
  blockchain: "blockchain",
};

type DB = SupabaseClient<Database>;

const STREAK_KEY = "coachfi-streak";
const MANUAL_KEY = "coachfi-learn-manual";
const TOKENS_KEY = "coachfi-tokens";
const VOICE_KEY = "coachfi-voice";
const MODE_KEY = "coachfi-mode-v1";

interface LocalStreak {
  lastActiveDate: string;
  currentStreak: number;
  longestStreak: number;
}
type ManualOverrides = Record<string, "started" | "completed">;

// ── tiny localStorage helpers for keys without dedicated setters ─────────────
function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}
function readTokens(): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(TOKENS_KEY);
  const n = raw === null ? NaN : parseInt(raw, 10);
  return Number.isNaN(n) ? 0 : n;
}
function writeTokens(n: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKENS_KEY, String(Math.round(n)));
  window.dispatchEvent(new Event("coachfi-tokens"));
}
function readMode(): string | null {
  const rec = readJson<{ mode?: string } | null>(MODE_KEY, null);
  return rec?.mode ?? null;
}

// ── per-entity push (mirror a single local change to the cloud) ──────────────

async function pushProfile(db: DB, userId: string): Promise<void> {
  const user = getUser();
  const avatar = getAvatar();
  const voiceId = typeof window !== "undefined" ? localStorage.getItem(VOICE_KEY) : null;
  await db.from("profiles").upsert({
    id: userId,
    name: user.name,
    goal: user.goal,
    onboarding_done: user.setupDone,
    avatar_gender: avatar.gender,
    avatar_style: avatar.style,
    voice_id: voiceId,
    mode: readMode() ?? "adult",
  });
}

async function pushSrs(db: DB, userId: string): Promise<void> {
  const cards = getAllCards();
  if (cards.length === 0) return;
  await db.from("srs_cards").upsert(
    cards.map((c) => ({
      user_id: userId,
      question_id: c.id,
      interval_days: Math.max(1, Math.round(c.interval)),
      repetitions: c.repetitions,
      ease_factor: Number(c.easeFactor.toFixed(2)),
      next_review: c.nextReview,
    })),
    { onConflict: "user_id,question_id" }
  );
}

async function pushStages(db: DB, userId: string): Promise<void> {
  const overrides = readJson<ManualOverrides>(MANUAL_KEY, {});
  const rows = Object.entries(overrides).map(([stage_id, status]) => ({
    user_id: userId,
    stage_id,
    status,
  }));
  if (rows.length === 0) return;
  await db.from("stage_progress").upsert(rows, { onConflict: "user_id,stage_id" });
}

async function pushStreak(db: DB, userId: string): Promise<void> {
  const s = readJson<LocalStreak | null>(STREAK_KEY, null);
  if (!s) return;
  await db.from("streaks").upsert({
    user_id: userId,
    last_active_date: s.lastActiveDate || null,
    current_streak: s.currentStreak,
    longest_streak: s.longestStreak,
  });
}

async function pushReward(db: DB, userId: string, delta: RewardDelta): Promise<void> {
  if (!delta || !delta.amount) return;
  await db.from("reward_ledger").insert({
    user_id: userId,
    unit: "coin",
    amount: Math.round(delta.amount),
    reason: delta.reason || "app",
    source: delta.source ?? "app",
  });
}

async function pushChallenge(db: DB, userId: string, p: ChallengePayload): Promise<void> {
  if (!p || !p.questionId) return;
  // One row per user per day (unique user_id, challenge_date). challenge_date
  // defaults to current_date server-side; ignore a second attempt the same day.
  await db.from("daily_challenges").upsert(
    {
      user_id: userId,
      question_id: p.questionId,
      is_correct: Boolean(p.isCorrect),
      reward_coins: Math.max(0, Math.round(p.reward || 0)),
    },
    { onConflict: "user_id,challenge_date", ignoreDuplicates: true }
  );
}

async function pushHealthCheck(db: DB, userId: string, p: HealthCheckResult): Promise<void> {
  if (!p || typeof p.score !== "number") return;
  await db.from("health_checks").insert({
    user_id: userId,
    score: p.score,
    answers: (p.answers ?? {}) as never,
    is_final: true,
  });
}

async function pushConsent(db: DB, userId: string): Promise<void> {
  const rec = readStoredConsent();
  if (!rec) return;
  // consents is an append-only audit log — record the current acceptance snapshot.
  const rows = [
    { user_id: userId, doc_type: "terms", doc_version: rec.version, granted: rec.termsAccepted },
    { user_id: userId, doc_type: "privacy", doc_version: rec.version, granted: rec.privacyAccepted },
    ...Object.entries(rec.optional).map(([key, value]) => ({
      user_id: userId,
      doc_type: CONSENT_DOC_MAP[key as OptionalConsentKey],
      doc_version: rec.version,
      granted: value,
    })),
  ];
  await db.from("consents").insert(rows);
}

/** Mirror a single local change to the cloud. Errors are swallowed by caller. */
export async function pushEntity(
  db: DB,
  userId: string,
  entity: SyncEntity,
  payload?: unknown
): Promise<void> {
  switch (entity) {
    case "profile":
      return pushProfile(db, userId);
    case "srs":
      return pushSrs(db, userId);
    case "stages":
      return pushStages(db, userId);
    case "streak":
      return pushStreak(db, userId);
    case "reward":
      return pushReward(db, userId, payload as RewardDelta);
    case "challenge":
      return pushChallenge(db, userId, payload as ChallengePayload);
    case "healthCheck":
      return pushHealthCheck(db, userId, payload as HealthCheckResult);
    case "consent":
      return pushConsent(db, userId);
    default:
      return;
  }
}

// ── login reconciliation (cloud wins if present, otherwise seed from local) ──

export async function syncOnLogin(db: DB, userId: string): Promise<void> {
  await Promise.all([
    reconcileProfile(db, userId),
    reconcileSrs(db, userId),
    reconcileStages(db, userId),
    reconcileStreak(db, userId),
    reconcileTokens(db, userId),
  ]);
}

async function reconcileProfile(db: DB, userId: string): Promise<void> {
  const { data } = await db
    .from("profiles")
    .select("name, goal, onboarding_done, avatar_gender, avatar_style, voice_id")
    .eq("id", userId)
    .maybeSingle();

  const local = getUser();
  if (data && (data.name || data.onboarding_done)) {
    // Cloud profile exists — adopt it locally.
    saveUser({
      name: data.name || local.name,
      goal: data.goal || local.goal,
      setupDone: data.onboarding_done || local.setupDone,
    });
    if (data.avatar_gender && data.avatar_style) {
      saveAvatar({
        gender: data.avatar_gender as AvatarData["gender"],
        style: data.avatar_style as AvatarData["style"],
      });
    }
    if (data.voice_id && typeof window !== "undefined") {
      localStorage.setItem(VOICE_KEY, data.voice_id);
    }
  } else {
    // Cloud empty — seed from local device.
    await pushProfile(db, userId);
  }
}

async function reconcileSrs(db: DB, userId: string): Promise<void> {
  const { data } = await db
    .from("srs_cards")
    .select("question_id, interval_days, repetitions, ease_factor, next_review")
    .eq("user_id", userId);

  const cloud: SRSCard[] = (data ?? []).map((r) => ({
    id: r.question_id,
    interval: r.interval_days,
    repetitions: r.repetitions,
    easeFactor: Number(r.ease_factor),
    nextReview: r.next_review,
  }));
  const local = getAllCards();

  // Union by id, preferring the more-practiced card (higher repetitions).
  const merged = new Map<string, SRSCard>();
  for (const c of [...cloud, ...local]) {
    const prev = merged.get(c.id);
    if (!prev || c.repetitions > prev.repetitions) merged.set(c.id, c);
  }
  const result = [...merged.values()];
  saveCards(result);
  if (result.length > 0) await pushSrs(db, userId);
}

async function reconcileStages(db: DB, userId: string): Promise<void> {
  const { data } = await db
    .from("stage_progress")
    .select("stage_id, status")
    .eq("user_id", userId);

  const local = readJson<ManualOverrides>(MANUAL_KEY, {});
  const merged: ManualOverrides = { ...local };
  for (const row of data ?? []) {
    const status = row.status as "started" | "completed";
    // "completed" always beats "started".
    if (merged[row.stage_id] !== "completed") merged[row.stage_id] = status;
  }
  writeJson(MANUAL_KEY, merged);
  if (Object.keys(merged).length > 0) await pushStages(db, userId);
}

async function reconcileStreak(db: DB, userId: string): Promise<void> {
  const { data } = await db
    .from("streaks")
    .select("last_active_date, current_streak, longest_streak")
    .eq("user_id", userId)
    .maybeSingle();

  const local = readJson<LocalStreak | null>(STREAK_KEY, null);
  const cloudCurrent = data?.current_streak ?? 0;
  const localCurrent = local?.currentStreak ?? 0;

  // Keep whichever side has the longer active streak as the winner.
  const winner =
    cloudCurrent >= localCurrent
      ? {
          lastActiveDate: data?.last_active_date ?? "",
          currentStreak: cloudCurrent,
          longestStreak: data?.longest_streak ?? 0,
        }
      : local!;

  const merged: LocalStreak = {
    lastActiveDate: winner.lastActiveDate,
    currentStreak: winner.currentStreak,
    longestStreak: Math.max(data?.longest_streak ?? 0, local?.longestStreak ?? 0),
  };
  writeJson(STREAK_KEY, merged);
  await db.from("streaks").upsert({
    user_id: userId,
    last_active_date: merged.lastActiveDate || null,
    current_streak: merged.currentStreak,
    longest_streak: merged.longestStreak,
  });
}

async function reconcileTokens(db: DB, userId: string): Promise<void> {
  const { data } = await db
    .from("reward_balances")
    .select("balance")
    .eq("user_id", userId)
    .eq("unit", "coin")
    .is("child_id", null)
    .maybeSingle();

  const cloudBalance = data?.balance ?? null;
  const localBalance = readTokens();

  if (cloudBalance === null || cloudBalance === 0) {
    // No cloud ledger yet — seed it from the local balance.
    if (localBalance > 0) {
      await db.from("reward_ledger").insert({
        user_id: userId,
        unit: "coin",
        amount: localBalance,
        reason: "Initial balance synced from device",
        source: "manual",
      });
    }
    // Local stays as the source of truth in this branch.
  } else {
    // Cloud ledger is authoritative across devices.
    writeTokens(Number(cloudBalance));
  }
}
