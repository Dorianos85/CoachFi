import { afterEach, describe, expect, it, vi } from "vitest";
import { CONSENT_CHANGED_EVENT, CONSENT_STORAGE_KEY, CONSENT_VERSION, createConsentRecord,
  DEFAULT_OPTIONAL_CONSENTS, hasConsentFor, normalizeConsentRecord, normalizeOptionalConsents,
  readStoredConsent, writeStoredConsent } from "./consent";

afterEach(() => vi.unstubAllGlobals());

describe("explicit consent", () => {
  it("required-only starts with every optional purpose off", () => {
    expect(createConsentRecord().optional).toEqual({ aiCoach: false, voice: false, leaderboard: false, blockchain: false });
    expect(DEFAULT_OPTIONAL_CONSENTS).toEqual(createConsentRecord().optional);
    expect(hasConsentFor(createConsentRecord(), [])).toBe(true);
    expect(hasConsentFor(createConsentRecord(), ["voice"])).toBe(false);
  });

  it.each([null, undefined, false, [], "true", {}])("missing/invalid optional record grants nothing: %s", (value) => {
    expect(normalizeOptionalConsents(value)).toEqual(DEFAULT_OPTIONAL_CONSENTS);
  });

  it("accepts only literal true, excludes unknown fields and string booleans", () => {
    expect(normalizeOptionalConsents({ aiCoach: "false", voice: "true", leaderboard: 1, blockchain: true, tracking: true }))
      .toEqual({ aiCoach: false, voice: false, leaderboard: false, blockchain: true });
    expect(normalizeConsentRecord({ ...createConsentRecord(), optional: { voice: true, auth: { access_token: "synthetic" } } })?.optional)
      .toEqual({ aiCoach: false, voice: true, leaderboard: false, blockchain: false });
  });

  it("invalidates the ambiguous May version instead of migrating preselected grants", () => {
    expect(normalizeConsentRecord({ ...createConsentRecord({ aiCoach: true, voice: true }), version: "2026-05-01" })).toBeNull();
  });

  it.each([
    { version: "unknown" }, { termsAccepted: "true" }, { privacyAccepted: false },
    { acceptedAt: undefined }, { acceptedAt: "2026-02-30T00:00:00.000Z" },
  ])("rejects invalid required metadata without inventing acceptance: %s", (override) => {
    expect(normalizeConsentRecord({ ...createConsentRecord(), ...override })).toBeNull();
  });

  it("reads only the product consent key and synchronously announces withdrawal", () => {
    const events = new EventTarget();
    const values = new Map<string, string>();
    const getItem = vi.fn((key: string) => values.get(key) ?? null);
    vi.stubGlobal("window", Object.assign(events, { localStorage: {
      getItem, setItem: (key: string, value: string) => values.set(key, value),
    } }));
    const observed: boolean[] = [];
    events.addEventListener(CONSENT_CHANGED_EVENT, () => observed.push(hasConsentFor(readStoredConsent(), ["voice"])));
    writeStoredConsent(createConsentRecord({ voice: true }));
    writeStoredConsent(createConsentRecord());
    expect(observed).toEqual([true, false]);
    expect(getItem.mock.calls.every(([key]) => key === CONSENT_STORAGE_KEY)).toBe(true);
    expect(JSON.parse(values.get(CONSENT_STORAGE_KEY)!).version).toBe(CONSENT_VERSION);
  });
});
