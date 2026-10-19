import { notifyCloud } from "@/lib/sync/syncQueue";
import { captureCurrentPersonalStorage, type PersonalStorageHandle } from "@/lib/product-storage";

export const CONSENT_STORAGE_KEY = "coachfi-consent-v1";
// Earlier records used preselected AI/voice. They cannot establish an explicit opt-in.
export const CONSENT_VERSION = "2026-10-14";
export const CONSENT_CHANGED_EVENT = "coachfi-consent-change";

export type OptionalConsentKey = "aiCoach" | "voice" | "leaderboard" | "blockchain";

export interface ConsentRecord {
  version: string;
  acceptedAt: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  optional: Record<OptionalConsentKey, boolean>;
}

export const DEFAULT_OPTIONAL_CONSENTS: Record<OptionalConsentKey, boolean> = {
  aiCoach: false,
  voice: false,
  leaderboard: false,
  blockchain: false,
};

export function normalizeOptionalConsents(value: unknown): Record<OptionalConsentKey, boolean> {
  const input = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  return {
    aiCoach: input.aiCoach === true,
    voice: input.voice === true,
    leaderboard: input.leaderboard === true,
    blockchain: input.blockchain === true,
  };
}

export function createConsentRecord(optional: unknown = DEFAULT_OPTIONAL_CONSENTS): ConsentRecord {
  return {
    version: CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
    termsAccepted: true,
    privacyAccepted: true,
    optional: normalizeOptionalConsents(optional),
  };
}

export function normalizeConsentRecord(value: unknown): ConsentRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    record.version !== CONSENT_VERSION ||
    record.termsAccepted !== true ||
    record.privacyAccepted !== true ||
    typeof record.acceptedAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(record.acceptedAt) ||
    !Number.isFinite(Date.parse(record.acceptedAt)) ||
    new Date(Date.parse(record.acceptedAt)).toISOString() !== record.acceptedAt
  ) return null;

  return {
    version: CONSENT_VERSION,
    acceptedAt: record.acceptedAt,
    termsAccepted: true,
    privacyAccepted: true,
    optional: normalizeOptionalConsents(record.optional),
  };
}

export function hasConsentFor(value: unknown, keys: readonly OptionalConsentKey[]): boolean {
  const record = normalizeConsentRecord(value);
  return record !== null && keys.every((key) => record.optional[key] === true);
}

export function readStoredConsent(storage: PersonalStorageHandle = captureCurrentPersonalStorage()): ConsentRecord | null {
  if (!storage.isCurrent()) return null;
  try {
    const raw = storage.getItem(CONSENT_STORAGE_KEY);
    return raw ? normalizeConsentRecord(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function announceConsentChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
}

export function writeStoredConsent(value: ConsentRecord, storage: PersonalStorageHandle = captureCurrentPersonalStorage()) {
  if (!storage.isCurrent()) throw new Error("Personal storage scope changed");
  const record = normalizeConsentRecord(value);
  if (!record) throw new Error("Invalid current consent record");
  if (!storage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record)) || !storage.isCurrent()) throw new Error("Personal storage scope changed");
  // Stop active provider work synchronously, before React's next effect/render.
  announceConsentChange();
  if (!storage.isCurrent()) throw new Error("Personal storage scope changed");
  notifyCloud("consent");
}

export function clearStoredConsent(storage: PersonalStorageHandle = captureCurrentPersonalStorage()) {
  if (!storage.isCurrent() || !storage.removeItem(CONSENT_STORAGE_KEY) || !storage.isCurrent()) throw new Error("Personal storage scope changed");
  announceConsentChange();
}
