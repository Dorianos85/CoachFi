import { describe, expect, it } from "vitest";

import {
  ALL_OPTIONAL_CONSENTS,
  CONSENT_VERSION,
  DEFAULT_OPTIONAL_CONSENTS,
  normalizeConsentRecord,
  requiredOnlyConsents,
  withOptionalConsents,
} from "@/lib/consent";

describe("optional consents", () => {
  it("are all OFF by default", () => {
    expect(Object.values(DEFAULT_OPTIONAL_CONSENTS).every((value) => value === false)).toBe(true);
  });

  it("'Accept required' never enables AI coach or voice", () => {
    const optional = requiredOnlyConsents();
    expect(optional.aiCoach).toBe(false);
    expect(optional.voice).toBe(false);
    expect(optional.leaderboard).toBe(false);
    expect(optional.blockchain).toBe(false);
  });

  it("'Accept all' enables every optional consent", () => {
    expect(Object.values(ALL_OPTIONAL_CONSENTS).every(Boolean)).toBe(true);
  });

  it("an inline grant adds only the requested consents", () => {
    const next = withOptionalConsents({ aiCoach: false, voice: false, leaderboard: true, blockchain: false }, ["aiCoach", "voice"]);
    expect(next).toEqual({ aiCoach: true, voice: true, leaderboard: true, blockchain: false });
  });

  it("a stored record without optional flags stays OFF", () => {
    const record = normalizeConsentRecord({
      version: CONSENT_VERSION,
      acceptedAt: "2026-11-01T00:00:00.000Z",
      termsAccepted: true,
      privacyAccepted: true,
      optional: {},
    });
    expect(record?.optional.aiCoach).toBe(false);
    expect(record?.optional.voice).toBe(false);
  });
});
