import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { DEFAULT_AVATAR } from "@/lib/avatar";
import type { SyncEntity } from "@/lib/sync/syncQueue";
import type { SyncSession } from "@/lib/sync/session-sync";
import { AUTOMATIC_ACCOUNT_WRITES_ENABLED, hasUnconfirmedLocalData, hasUnconfirmedSyncMarker } from "@/lib/sync/local-sync-state";

export interface ChallengePayload { questionId: string; isCorrect: boolean; reward: number; }
type DB = SupabaseClient<Database>;
const STREAK_KEY = "coachfi-streak";
const MANUAL_KEY = "coachfi-learn-manual";
const TOKENS_KEY = "coachfi-tokens";
const VOICE_KEY = "coachfi-voice";

function isCurrent(session: SyncSession | undefined, userId: string): session is SyncSession {
  return !!session && session.userId === userId && !session.signal.aborted && session.isCurrent() &&
    !!session.storage?.isCurrent() && session.storage.owner?.kind === "account" &&
    session.storage.owner.provider === "supabase" && session.storage.owner.userId === userId;
}
function canHydrate(session: SyncSession) {
  return isCurrent(session, session.userId) && !hasUnconfirmedSyncMarker(session.storage);
}
async function runQuery<T>(session: SyncSession, userId: string,
  create: (signal: AbortSignal) => PromiseLike<{ data: T; error: unknown }>) {
  if (!isCurrent(session, userId)) return null;
  const request = create(session.signal);
  if (!isCurrent(session, userId)) return null;
  const result = await request;
  if (!isCurrent(session, userId)) return null;
  if (result.error) throw new Error("Cloud sync unavailable");
  return { data: result.data };
}
function writeJson(session: SyncSession, key: string, value: unknown) {
  if (!canHydrate(session) || typeof window === "undefined") return false;
  const serialized = JSON.stringify(value);
  if (!canHydrate(session)) return false;
  if (!session.storage.setItem(key, serialized)) return false;
  return canHydrate(session);
}
function emit(session: SyncSession, event: string) {
  if (!canHydrate(session) || typeof window === "undefined") return false;
  window.dispatchEvent(new Event(event));
  return canHydrate(session);
}
const finite = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;

/** Hard-off precedes database, guard and payload access, including direct callers. */
export async function pushEntity(_db: DB, _userId: string, _entity: SyncEntity, _payload?: unknown, _session?: SyncSession): Promise<void> {
  if (!AUTOMATIC_ACCOUNT_WRITES_ENABLED) return;
  // Flipping a flag cannot reactivate the former unacknowledged append/upsert path.
  throw new Error("Automatic account writes require a reconciliation contract");
}

/** Initial read into an empty owned namespace only; never an acknowledgement. */
export async function syncOnLogin(db: DB, userId: string, session?: SyncSession): Promise<boolean> {
  if (!isCurrent(session, userId) || hasUnconfirmedLocalData(session.storage)) return false;
  const [profile, cards, stages, streak, tokens] = await Promise.all([
    runQuery(session, userId, (signal) => db.from("profiles").select("name, goal, onboarding_done, avatar_gender, avatar_style, voice_id").eq("id", userId).abortSignal(signal).maybeSingle()),
    runQuery(session, userId, (signal) => db.from("srs_cards").select("question_id, interval_days, repetitions, ease_factor, next_review").eq("user_id", userId).abortSignal(signal)),
    runQuery(session, userId, (signal) => db.from("stage_progress").select("stage_id, status").eq("user_id", userId).abortSignal(signal)),
    runQuery(session, userId, (signal) => db.from("streaks").select("last_active_date, current_streak, longest_streak").eq("user_id", userId).abortSignal(signal).maybeSingle()),
    runQuery(session, userId, (signal) => db.from("reward_balances").select("balance").eq("user_id", userId).eq("unit", "coin").is("child_id", null).abortSignal(signal).maybeSingle()),
  ]);
  // All reads succeed before mutation, then recheck changes made during the await.
  if (!isCurrent(session, userId) || !profile || !cards || !stages || !streak || !tokens ||
    hasUnconfirmedLocalData(session.storage)) return false;
  const account = profile.data;
  if (!writeJson(session, "coachfi-user", {
    name: account?.name ?? "", goal: account?.goal ?? "", setupDone: account?.onboarding_done ?? false,
  })) return false;
  if (!emit(session, "coachfi-user")) return false;
  // Private hydration does not mark these reads as public local edits. Every
  // mutation still checks the marker because event listeners can edit/reenter.
  if (!writeJson(session, "coachfi-avatar", {
    gender: account?.avatar_gender === "female" || account?.avatar_gender === "male" ? account.avatar_gender : DEFAULT_AVATAR.gender,
    style: account?.avatar_style === "warrior" || account?.avatar_style === "explorer" || account?.avatar_style === "builder"
      ? account.avatar_style : DEFAULT_AVATAR.style,
  })) return false;
  if (!canHydrate(session) || typeof window === "undefined") return false;
  if (!session.storage.setItem(VOICE_KEY, account?.voice_id ?? "")) return false;
  if (!canHydrate(session)) return false;
  if (!writeJson(session, "coachfi-srs", (cards.data ?? []).map((row) => ({
    id: row.question_id, interval: row.interval_days, repetitions: row.repetitions,
    easeFactor: Number(row.ease_factor), nextReview: row.next_review,
  })))) return false;
  const progress: Record<string, "started" | "completed"> = Object.create(null) as Record<string, "started" | "completed">;
  for (const row of stages.data ?? []) if (row.status === "started" || row.status === "completed") progress[row.stage_id] = row.status;
  if (!writeJson(session, MANUAL_KEY, progress)) return false;
  if (!writeJson(session, STREAK_KEY, {
    lastActiveDate: streak.data?.last_active_date ?? "", currentStreak: finite(streak.data?.current_streak),
    longestStreak: finite(streak.data?.longest_streak),
  })) return false;
  if (!emit(session, "coachfi-learning")) return false;
  if (!canHydrate(session) || typeof window === "undefined") return false;
  if (!session.storage.setItem(TOKENS_KEY, String(Math.round(finite(Number(tokens.data?.balance ?? 0)))))) return false;
  return emit(session, "coachfi-tokens") && canHydrate(session);
}
