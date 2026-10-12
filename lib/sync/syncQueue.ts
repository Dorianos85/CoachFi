// Lightweight bridge between synchronous localStorage writers (lib/*, context/*)
// and the cloud sync layer. Keeps the existing localStorage-first code intact:
// modules just call `notifyCloud(...)` after writing locally. When a user is
// signed in, AuthContext registers a pusher that mirrors the change to Supabase.
// When signed out (or on the server), it is a no-op.

export type SyncEntity =
  | "profile" // name / goal / setupDone / avatar / voice / mode / onboarding
  | "srs" // coachfi-srs cards
  | "stages" // coachfi-learn-manual overrides
  | "streak" // coachfi-streak
  | "reward" // token delta (payload: { amount, reason, source })
  | "challenge" // daily challenge completion
  | "healthCheck" // financial health score result
  | "consent"; // coachfi-consent-v1

export interface RewardDelta {
  amount: number;
  reason: string;
  source?: string;
}

type Pusher = (entity: SyncEntity, payload?: unknown) => void;

let pusher: Pusher | null = null;

/** AuthContext calls this with a real pusher on sign-in, and null on sign-out. */
export function registerCloudPusher(next: Pusher | null): void {
  pusher = next;
}

/** Called by localStorage writers after a successful local write. */
export function notifyCloud(entity: SyncEntity, payload?: unknown): void {
  if (typeof window === "undefined") return;
  try {
    pusher?.(entity, payload);
  } catch {
    // Cloud mirroring must never break the local-first write path.
  }
}
