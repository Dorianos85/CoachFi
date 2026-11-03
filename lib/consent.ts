import { notifyCloud } from "@/lib/sync/syncQueue";

export const CONSENT_STORAGE_KEY = "coachfi-consent-v1";
export const CONSENT_VERSION = "2026-05-10";

export type OptionalConsentKey = "aiCoach" | "voice" | "leaderboard" | "blockchain";

export interface ConsentRecord {
  version: string;
  acceptedAt: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  optional: Record<OptionalConsentKey, boolean>;
}

// Every optional consent starts OFF. "Accept required" therefore never turns on
// AI, voice, leaderboard or certificates; only "Accept all", an explicit toggle,
// or an inline prompt at the feature (e.g. opening Mila) can.
export const DEFAULT_OPTIONAL_CONSENTS: Record<OptionalConsentKey, boolean> = {
  aiCoach: false,
  voice: false,
  leaderboard: false,
  blockchain: false,
};

export const ALL_OPTIONAL_CONSENTS: Record<OptionalConsentKey, boolean> = {
  aiCoach: true,
  voice: true,
  leaderboard: true,
  blockchain: true,
};

/** Optional consents granted when the user only accepts the required terms. */
export function requiredOnlyConsents(): Record<OptionalConsentKey, boolean> {
  return { ...DEFAULT_OPTIONAL_CONSENTS };
}

/** Grant some optional consents on top of the ones already given. */
export function withOptionalConsents(
  current: Partial<Record<OptionalConsentKey, boolean>> | null | undefined,
  grant: OptionalConsentKey[],
): Record<OptionalConsentKey, boolean> {
  const next = { ...DEFAULT_OPTIONAL_CONSENTS, ...(current ?? {}) };
  for (const key of grant) next[key] = true;
  return next;
}

export function createConsentRecord(
  optional: Record<OptionalConsentKey, boolean>
): ConsentRecord {
  return {
    version: CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
    termsAccepted: true,
    privacyAccepted: true,
    optional,
  };
}

export function normalizeConsentRecord(value: unknown): ConsentRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<ConsentRecord>;
  if (
    record.version !== CONSENT_VERSION ||
    record.termsAccepted !== true ||
    record.privacyAccepted !== true ||
    !record.optional ||
    typeof record.optional !== "object"
  ) {
    return null;
  }

  return {
    version: CONSENT_VERSION,
    acceptedAt:
      typeof record.acceptedAt === "string" ? record.acceptedAt : new Date().toISOString(),
    termsAccepted: true,
    privacyAccepted: true,
    optional: {
      ...DEFAULT_OPTIONAL_CONSENTS,
      ...record.optional,
    },
  };
}

export function readStoredConsent(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    return normalizeConsentRecord(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeStoredConsent(record: ConsentRecord) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  notifyCloud("consent");
}

export function clearStoredConsent() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CONSENT_STORAGE_KEY);
}
