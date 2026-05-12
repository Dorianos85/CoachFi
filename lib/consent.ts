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

export const DEFAULT_OPTIONAL_CONSENTS: Record<OptionalConsentKey, boolean> = {
  aiCoach: true,
  voice: true,
  leaderboard: false,
  blockchain: false,
};

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
}

export function clearStoredConsent() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CONSENT_STORAGE_KEY);
}
