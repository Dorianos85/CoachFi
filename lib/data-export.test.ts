import { describe, expect, it, vi } from "vitest";
import { CONSENT_STORAGE_KEY, createConsentRecord } from "./consent";
import { buildLocalDataExport, collectProductStorage, deleteLocalProductData, LOCAL_PRODUCT_KEYS, sanitizeProductValue } from "./data-export";
import type { PersonalStorageHandle } from "./product-storage";

// All values are synthetic; no browser/user session is opened by these tests.
function fixture(values: Record<string, unknown>, raw: Record<string, string> = {}) {
  const data = new Map(Object.entries(values).map(([key, value]) => [key, JSON.stringify(value)]));
  for (const [key, value] of Object.entries(raw)) data.set(key, value);
  return { data, getItem: vi.fn((key: string) => data.get(key) ?? null), removeItem: vi.fn((key: string) => { data.delete(key); }) };
}
const validCard = { id: "inflation-basics", interval: 7, repetitions: 2, easeFactor: 2.5, nextReview: "2026-10-15" };
const secret = "SYNTHETIC_AUTH_CREDENTIAL_DO_NOT_EXPORT";

describe("selected local data export", () => {
  it("reads exact product keys without enumerating or reading auth and unknown keys", () => {
    const storage = fixture({
      "coachfi-supabase-auth": { access_token: secret }, "cdp-session": secret,
      "coachfi-unknown-future": secret, "sb-test-auth-token": secret, "coachfi-tokens": 25,
    });
    const result = collectProductStorage(storage);
    expect(storage.getItem.mock.calls.map(([key]) => key)).toEqual([...LOCAL_PRODUCT_KEYS]);
    expect(result).toEqual({ "coachfi-tokens": 25 });
    expect(JSON.stringify(result)).not.toContain(secret);
  });

  it("rebuilds every supported schema, excluding nested identity/session credentials", () => {
    const storage = fixture({
      "coachfi-srs": [{ ...validCard, identity: { email: secret, session: { refresh_token: secret } } }, { ...validCard, id: secret }],
      "coachfi-learn-manual": { "money-mindset": "completed", access_token: secret, "saving-habit": { token: secret } },
      "coachfi-lesson-steps": { inflation: 2, identity: { email: secret } },
      "coachfi-streak": { lastActiveDate: "2026-10-14", currentStreak: 2, longestStreak: 4, bearer: secret },
      "coachfi-health-check": { score: 50, createdAt: "2026-10-14T00:00:00.000Z", auth: secret,
        answers: { monthlyIncome: 6000, debt: 500, hasEmergencyFund: false, understandsInflation: true,
          cashHeld: { access_token: secret }, mainFinancialGoal: secret, identity: { email: secret } } },
      "coachfi-avatar": { gender: "female", style: "builder", session: { access_token: secret } },
      "coachfi-user": { setupDone: true, name: secret, goal: secret, identity: { email: secret } },
      "coachfi-challenge": { date: "2026-10-14", jwt: secret },
      "coachfi-mode-v1": { mode: "adult", selectedAt: "2026-10-14T00:00:00.000Z", email: secret },
      [CONSENT_STORAGE_KEY]: { ...createConsentRecord({ voice: true }), token: secret, optional: { voice: true, session: { token: secret } } },
    });
    const result = collectProductStorage(storage);
    expect(result["coachfi-srs"]).toEqual([validCard]);
    expect(result["coachfi-user"]).toEqual({ setupDone: true });
    expect(result["coachfi-health-check"]).toEqual({ score: 50, createdAt: "2026-10-14T00:00:00.000Z", currency: "legacy_unspecified",
      answers: { monthlyIncome: 6000, debt: 500, hasEmergencyFund: false, understandsInflation: true } });
    expect(JSON.stringify(result)).not.toContain(secret);
    expect(JSON.stringify(result)).not.toMatch(/access_token|refresh_token|identity|bearer|jwt/);
  });

  it("does not coerce arbitrary values or copy unsupported raw strings", () => {
    const storage = fixture({ "coachfi-user": { setupDone: secret }, "coachfi-tokens": secret,
      "coachfi-avatar": { gender: { toString: "female", access_token: secret }, style: "builder" },
      [CONSENT_STORAGE_KEY]: { ...createConsentRecord(), version: "2026-05-01" },
    }, { "coachfi-srs": secret, "coachfi-locale-v1": "pl" });
    expect(collectProductStorage(storage)).toEqual({ "coachfi-locale-v1": "pl" });
    expect(sanitizeProductValue("coachfi-tokens", -1)).toBeUndefined();
    expect(sanitizeProductValue("coachfi-tokens", Infinity)).toBeUndefined();
    expect(sanitizeProductValue("coachfi-streak", { lastActiveDate: "2026-02-30", currentStreak: 1, longestStreak: 1 })).toBeUndefined();
  });

  it("omits malformed and oversized values and sanitizes session storage too", () => {
    const local = fixture({}, { "coachfi-user": "x".repeat(262145) });
    const session = fixture({ "coachfi-user": { setupDone: false, refresh_token: secret }, "cdp-session": secret });
    const exported = buildLocalDataExport(local, session);
    expect(exported.scope).toBe("selected_local_product_data");
    expect(exported.localStorage).toEqual({});
    expect(exported.sessionStorage).toEqual({ "coachfi-user": { setupDone: false } });
    expect(JSON.stringify(exported)).not.toContain(secret);
  });

  it("keeps only a strict adult age marker and excludes extra mode identity fields", () => {
    const record = { mode: "adult", selectedAt: "2026-10-14T00:00:00.000Z", adultConfirmedAt: "2026-10-14T00:00:00.000Z", adultAgeRequirement: 18 };
    expect(sanitizeProductValue("coachfi-mode-v1", { ...record, auth: { token: secret } })).toEqual(record);
    expect(sanitizeProductValue("coachfi-mode-v1", { ...record, adultAgeRequirement: secret })).not.toHaveProperty("adultAgeRequirement");
  });

  it("local deletion rejects an unbound raw storage object", () => {
    const storage = fixture({ "coachfi-user": { setupDone: true }, "coachfi-supabase-auth": secret, "unknown": secret });
    expect(deleteLocalProductData(storage as unknown as PersonalStorageHandle)).toBe(false);
    expect(storage.removeItem).not.toHaveBeenCalled();
    expect(storage.data.has("coachfi-user")).toBe(true);
    expect(storage.data.get("coachfi-supabase-auth")).toContain(secret);
    expect(storage.data.has("unknown")).toBe(true);
  });
});
