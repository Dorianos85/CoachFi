import { AUTOMATIC_ACCOUNT_WRITES_ENABLED } from "@/lib/sync/local-sync-state";

// Local writers retain this bridge, but automatic account writes are disabled
// until an acknowledged reconciliation/idempotency contract exists.

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

/** Compatibility bridge: hard-off keeps the pusher null, including on sign-in. */
export function registerCloudPusher(next: Pusher | null): void {
  pusher = AUTOMATIC_ACCOUNT_WRITES_ENABLED ? next : null;
}

/** Called by localStorage writers after a successful local write. */
export function notifyCloud(entity: SyncEntity, payload?: unknown): void {
  if (!AUTOMATIC_ACCOUNT_WRITES_ENABLED || typeof window === "undefined") return;
  try {
    pusher?.(entity, payload);
  } catch {
    // Cloud mirroring must never break the local-first write path.
  }
}
