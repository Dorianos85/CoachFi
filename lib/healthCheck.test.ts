import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createConsentRecord, CONSENT_STORAGE_KEY } from "./consent";
import { getHealthCheck, HEALTH_STORAGE_KEY, normalizeHealthCheckResult, saveHealthCheck } from "./healthCheck";
import { registerCloudPusher } from "./sync/syncQueue";

const answers = { monthlyIncome: 4000, monthlyExpenses: 2000, savings: 6000, debt: 0, cashHeld: 0,
  hasEmergencyFund: true, understandsInflation: true, hasRetirementPlan: true, investsAlready: true, mainFinancialGoal: "A clear long goal" };
const createdAt = "2026-10-14T00:00:00.000Z";
let data: Map<string, string>; let setItem: ReturnType<typeof vi.fn>; let dispatch: ReturnType<typeof vi.fn>;
beforeEach(() => {
  data = new Map([[CONSENT_STORAGE_KEY, JSON.stringify(createConsentRecord())]]);
  setItem = vi.fn((key: string, value: string) => { data.set(key, value); });
  dispatch = vi.fn();
  vi.stubGlobal("window", { localStorage: { getItem: (key: string) => data.get(key) ?? null, setItem }, dispatchEvent: dispatch });
});
afterEach(() => { registerCloudPusher(null); vi.unstubAllGlobals(); });

describe("local-only versioned health result", () => {
  it("recomputes complete legacy answers and preserves creation date without a write", () => {
    const raw = JSON.stringify({ score: 42, answers, createdAt }); data.set(HEALTH_STORAGE_KEY, raw);
    const result = getHealthCheck();
    expect(result?.score).toBe(98); expect(result?.schemaVersion).toBe(2);
    expect(result?.source).toBe("legacy_recomputed"); expect(result?.createdAt).toBe(createdAt);
    expect(result?.currency).toBe("legacy_unspecified");
    expect(setItem).not.toHaveBeenCalled(); expect(data.get(HEALTH_STORAGE_KEY)).toBe(raw);
  });
  it("rejects incomplete, malformed and unknown-version stored results", () => {
    for (const record of [{ score: 42, createdAt, answers: {} }, { score: 42, createdAt: "invalid", answers },
      { schemaVersion: 3, formulaVersion: "future", createdAt, answers }, { score: 42, createdAt, answers: { ...answers, investsAlready: "false" } }])
      expect(normalizeHealthCheckResult(record)).toBeNull();
  });
  it("rebuilds v2 calculation metadata instead of trusting a tampered score or breakdown", () => {
    const saved = saveHealthCheck(answers);
    const normalized = normalizeHealthCheckResult({ ...saved, score: 100, scoreMax: 100, groups: { knowledgeDeclaration: { points: 100 } }, tokens: "synthetic" });
    expect(normalized?.score).toBe(98); expect(normalized?.scoreMax).toBe(98);
    expect(normalized?.groups.knowledgeDeclaration).toEqual({ points: 6, maxPoints: 6 });
    expect(normalized).not.toHaveProperty("tokens");
  });
  it("saves locally and notifies the shell only after storage succeeds, without cloud push", () => {
    const push = vi.fn(); registerCloudPusher(push);
    const saved = saveHealthCheck(answers);
    expect(saved.source).toBe("local_diagnosis"); expect(saved.scoreMax).toBe(98);
    expect(data.get(HEALTH_STORAGE_KEY)).toBe(JSON.stringify(saved));
    expect(dispatch).toHaveBeenCalledOnce(); expect(setItem.mock.invocationCallOrder[0]).toBeLessThan(dispatch.mock.invocationCallOrder[0]);
    expect(push).not.toHaveBeenCalled();
    expect(saved.currency).toBe("PLN");
  });
  it("does not emit success on storage failure", () => {
    setItem.mockImplementation(() => { throw new DOMException("Synthetic blocked storage", "QuotaExceededError"); });
    expect(() => saveHealthCheck(answers)).toThrow(); expect(dispatch).not.toHaveBeenCalled();
    expect(data.has(HEALTH_STORAGE_KEY)).toBe(false);
  });
  it("does not save or reveal a cached result without current required terms", () => {
    data.set(HEALTH_STORAGE_KEY, JSON.stringify({ score: 42, answers, createdAt })); data.delete(CONSENT_STORAGE_KEY);
    expect(() => saveHealthCheck(answers)).toThrow("Required terms"); expect(getHealthCheck()).toBeNull();
    expect(setItem).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
  });
  it("returns null after required terms are revoked while a valid saved v2 result remains", () => {
    saveHealthCheck(answers);
    expect(getHealthCheck()?.score).toBe(98);
    data.set(CONSENT_STORAGE_KEY, JSON.stringify({ ...createConsentRecord(), privacyAccepted: false }));
    expect(getHealthCheck()).toBeNull();
    expect(data.has(HEALTH_STORAGE_KEY)).toBe(true);
  });
  it("preserves normalized legacy uncertainty and rejects other v2 currency/source combinations", () => {
    const legacy = normalizeHealthCheckResult({ score: 42, answers, createdAt });
    expect(normalizeHealthCheckResult(legacy)).toEqual(legacy);
    const current = saveHealthCheck(answers);
    for (const record of [{ ...current, currency: undefined }, { ...current, currency: "USD" },
      { ...current, currency: "legacy_unspecified" }, { ...current, source: "legacy_recomputed" },
      { ...current, source: "synthetic-untrusted" }]) expect(normalizeHealthCheckResult(record)).toBeNull();
  });
});
