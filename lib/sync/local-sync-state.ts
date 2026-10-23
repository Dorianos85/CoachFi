import type { PersonalStorageHandle } from "@/lib/product-storage";

/** Server reconciliation has no atomic version precondition yet. */
export const AUTOMATIC_ACCOUNT_WRITES_ENABLED = false;
export const LOCAL_SYNC_MARKER_KEY = "coachfi-learning-rev";
export const LOCAL_SYNC_MARKER_VALUE = "local-unconfirmed-v1";
export const CDP_SYNC_KEYS = ["coachfi-srs", "coachfi-learn-manual", "coachfi-tokens", "coachfi-streak"] as const;
export const SUPABASE_SYNC_KEYS = ["coachfi-user", "coachfi-avatar", "coachfi-voice", "coachfi-mode-v1",
  ...CDP_SYNC_KEYS, "coachfi-challenge", "coachfi-consent-v1"] as const;

export function isAccountSyncKey(provider: "cdp" | "supabase", key: string): boolean {
  return (provider === "cdp" ? CDP_SYNC_KEYS : SUPABASE_SYNC_KEYS).some(candidate => candidate === key);
}

function requireCurrent(storage: PersonalStorageHandle) {
  if (!storage.isCurrent()) throw new Error("Storage session changed");
}

/** Every non-null legacy or unknown marker remains unconfirmed, including an empty string. */
export function hasUnconfirmedSyncMarker(storage: PersonalStorageHandle): boolean {
  requireCurrent(storage);
  if (storage.owner?.kind !== "account") return false;
  const marker = storage.getItem(LOCAL_SYNC_MARKER_KEY);
  requireCurrent(storage);
  return marker !== null;
}

/** Existing bytes cannot be proven acknowledged after a cold start. Never import guest data. */
export function hasUnconfirmedLocalData(storage: PersonalStorageHandle): boolean {
  if (hasUnconfirmedSyncMarker(storage)) return true;
  if (storage.owner?.kind !== "account") return false;
  const keys = storage.owner.provider === "cdp" ? CDP_SYNC_KEYS : SUPABASE_SYNC_KEYS;
  for (const key of keys) {
    const value = storage.getItem(key);
    requireCurrent(storage);
    if (value !== null) return true;
  }
  return false;
}
