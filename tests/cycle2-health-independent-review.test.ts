import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { getHealthCheck, HEALTH_STORAGE_KEY, normalizeHealthCheckResult, saveHealthCheck } from "@/lib/healthCheck";
import { CONSENT_STORAGE_KEY, CONSENT_VERSION } from "@/lib/consent";
import { registerCloudPusher, type SyncEntity } from "@/lib/sync/syncQueue";
import { beginStorageOwner } from "@/lib/product-storage";
import {
  calculateFinancialScore,
  validateFinancialScoreInput,
  FinancialScoreValidationError,
  FINANCIAL_SCORE_MAX,
  FINANCIAL_SCORE_VERSION,
  type FinancialScoreInput,
} from "@/lib/financial-score";

// EXPECTED values were derived before reading the helper implementation.
// These verify the agreed legacy heuristic; they do not validate its financial meaning.
const base: FinancialScoreInput = {
  monthlyIncome: 0, monthlyExpenses: 0, savings: 0, debt: 0, cashHeld: 0,
  hasEmergencyFund: false, understandsInflation: false,
  hasRetirementPlan: false, investsAlready: false, mainFinancialGoal: "",
};
const boundary: FinancialScoreInput = {
  ...base, monthlyIncome: 1000, monthlyExpenses: 750,
  savings: 1125, debt: 1000, cashHeld: 2000, mainFinancialGoal: "abcdefgh",
};
const fixtures: Array<{ name: string; input: FinancialScoreInput; score: number; raw: number; groups: [number, number, number] }> = [
  { name: "all explicit zeros", input: base, score: 10, raw: 10, groups: [8, 2, 0] },
  { name: "old mock is 36 rather than the hardcoded example 42", input: { ...base, monthlyIncome: 6000, monthlyExpenses: 5200, savings: 3000, debt: 8000, cashHeld: 20000, mainFinancialGoal: "Emergency fund" }, score: 36, raw: 6967 / 195, groups: [5407 / 195, 8, 0] },
  { name: "maximum legacy weights total 98", input: { monthlyIncome: 4000, monthlyExpenses: 2000, savings: 6000, debt: 0, cashHeld: 0, hasEmergencyFund: true, understandsInflation: true, hasRetirementPlan: true, investsAlready: true, mainFinancialGoal: "Emergency fund" }, score: 98, raw: 98, groups: [60, 32, 6] },
  { name: "cash equals twice income, goal is eight characters", input: boundary, score: 49, raw: 49, groups: [47, 2, 0] },
  { name: "cash above twice income changes four points", input: { ...boundary, cashHeld: 2000.01 }, score: 45, raw: 45, groups: [43, 2, 0] },
  { name: "goal of nine characters changes six points", input: { ...boundary, mainFinancialGoal: "abcdefghi" }, score: 55, raw: 55, groups: [47, 8, 0] },
  { name: "no income uses the stated fallback", input: { ...base, monthlyExpenses: 1000, savings: 3000 }, score: 28, raw: 28, groups: [26, 2, 0] },
  { name: "no expenses does not invent emergency coverage", input: { ...base, monthlyIncome: 1000, savings: 1000 }, score: 44, raw: 44, groups: [42, 2, 0] },
  { name: "deficit is not negative savings score", input: { ...base, monthlyIncome: 1000, monthlyExpenses: 2000, debt: 1000 }, score: 22, raw: 22, groups: [20, 2, 0] },
  { name: "round exact half upward", input: { ...base, monthlyIncome: 1000, monthlyExpenses: 1000, debt: 625 }, score: 24, raw: 23.5, groups: [21.5, 2, 0] },
  { name: "round below half downward", input: { ...base, monthlyIncome: 1000, monthlyExpenses: 1000, debt: 626 }, score: 23, raw: 23.496, groups: [21.496, 2, 0] },
  { name: "upper boundary remains finite", input: { ...base, monthlyIncome: 1e12, monthlyExpenses: 1e12, savings: 1e12, debt: 1e12, cashHeld: 1e12 }, score: 28, raw: 28, groups: [26, 2, 0] },
];

describe("independent financial-score arithmetic", () => {
  it.each(fixtures)("$name", ({ input, score, raw, groups }) => {
    const result = calculateFinancialScore(input);
    expect(result.score).toBe(score);
    expect(result.rawScore).toBeCloseTo(raw, 10);
    expect(result.scoreMax).toBe(98);
    expect(result.formulaVersion).toBe("legacy-weights-98-v1");
    expect(result.groups.cashFlowAndRisk.points).toBeCloseTo(groups[0], 10);
    expect(result.groups.cashFlowAndRisk.maxPoints).toBe(60);
    expect(result.groups.planningDeclarations.points).toBeCloseTo(groups[1], 10);
    expect(result.groups.planningDeclarations.maxPoints).toBe(32);
    expect(result.groups.knowledgeDeclaration.points).toBe(groups[2]);
    expect(result.groups.knowledgeDeclaration.maxPoints).toBe(6);
    expect(Object.values(result.components).reduce((sum, value) => sum + value, 0)).toBeCloseTo(raw, 10);
    expect(Number.isInteger(result.score)).toBe(true);
  });

  it("version/max metadata match the agreed unscaled heuristic", () => {
    expect(FINANCIAL_SCORE_VERSION).toBe("legacy-weights-98-v1");
    expect(FINANCIAL_SCORE_MAX).toBe(98);
  });

  it("missing denominators are visible as null, not invented finite UI ratios", () => {
    const zeroIncome = calculateFinancialScore({ ...base, monthlyExpenses: 1000 });
    expect(zeroIncome.ratios.savingsRate).toBeNull();
    expect(zeroIncome.ratios.debtPressure).toBeNull();
    const zeroExpenses = calculateFinancialScore({ ...base, monthlyIncome: 1000 });
    expect(zeroExpenses.ratios.emergencyCoverage).toBeNull();
    expect(zeroExpenses.ratios.cushionMonths).toBeNull();
  });

  it("does not mutate the input or reward whitespace padded short goals", () => {
    const input = Object.freeze({ ...boundary, mainFinancialGoal: "  abcdefgh  " });
    expect(calculateFinancialScore(input).score).toBe(49);
    expect(input.mainFinancialGoal).toBe("  abcdefgh  ");
  });

  it("subnormal denominators keep capped points while exposing only finite-or-null UI ratios", () => {
    const result = calculateFinancialScore({ ...base, monthlyIncome: Number.MIN_VALUE, monthlyExpenses: Number.MIN_VALUE, savings: 1e12, debt: 1e12 });
    expect(result.score).toBe(28);
    expect(result.components.emergencyCoverage).toBe(18);
    expect(result.components.debtPressure).toBe(0);
    expect(result.ratios.emergencyCoverage).toBeNull();
    expect(result.ratios.debtPressure).toBeNull();
    expect(result.ratios.cushionMonths).toBeNull();
    expect(Object.values(result.ratios).every((value) => value === null || Number.isFinite(value))).toBe(true);
  });
});

describe("independent runtime input validation", () => {
  const numericFields = ["monthlyIncome", "monthlyExpenses", "savings", "debt", "cashHeld"] as const;
  for (const field of numericFields) {
    it.each([-1, 1e12 + 1, NaN, Infinity, -Infinity, "0", "", null, undefined])(`${field} rejects invalid value %s`, (value) => {
      const input = { ...base, [field]: value };
      expect(validateFinancialScoreInput(input).ok).toBe(false);
      expect(() => calculateFinancialScore(input)).toThrow(FinancialScoreValidationError);
    });
  }
  for (const field of ["hasEmergencyFund", "understandsInflation", "hasRetirementPlan", "investsAlready"] as const) {
    it.each(["false", "true", 0, 1, null, undefined])(`${field} requires an actual boolean, received %s`, (value) => {
      expect(validateFinancialScoreInput({ ...base, [field]: value }).ok).toBe(false);
    });
  }
  it.each([null, [], {}, { ...base, unexpected: "synthetic" }, { ...base, mainFinancialGoal: "a".repeat(1001) }, { ...base, mainFinancialGoal: null }])("rejects incomplete records, extra keys and malformed goals", (input) => {
    expect(validateFinancialScoreInput(input).ok).toBe(false);
    expect(() => calculateFinancialScore(input)).toThrow(FinancialScoreValidationError);
  });
  it("accepts explicit zeros and the maximum goal length", () => {
    expect(validateFinancialScoreInput(base).ok).toBe(true);
    expect(validateFinancialScoreInput({ ...base, mainFinancialGoal: "a".repeat(1000) }).ok).toBe(true);
  });
});

describe("independent local persistence and read/recompute migration", () => {
  const createdAt = "2026-10-14T00:00:00.000Z";
  let stored: Map<string, string>;
  let setItem: ReturnType<typeof vi.fn>;
  let dispatch: ReturnType<typeof vi.fn>;
  let pusher: Mock<(entity: SyncEntity, payload?: unknown) => void>;
  let outbound: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    stored = new Map([[CONSENT_STORAGE_KEY, JSON.stringify({ version: CONSENT_VERSION, acceptedAt: createdAt, termsAccepted: true, privacyAccepted: true,
      optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } })]]);
    setItem = vi.fn((key: string, value: string) => { stored.set(key, value); });
    dispatch = vi.fn(() => true);
    vi.stubGlobal("window", { localStorage: { getItem: (key: string) => stored.get(key) ?? null, setItem }, dispatchEvent: dispatch });
    beginStorageOwner({ kind: "guest" }).publishReady({ localOnly: true });
    setItem.mockClear(); dispatch.mockClear(); // Start operation counters after explicit owner bootstrap.
    pusher = vi.fn((_entity: SyncEntity, _payload?: unknown): void => {}); registerCloudPusher(pusher);
    outbound = vi.fn(() => { throw new Error("No provider call is authorized in an independent local health test."); });
    vi.stubGlobal("fetch", outbound);
  });
  afterEach(() => {
    expect(pusher).not.toHaveBeenCalled();
    expect(outbound).not.toHaveBeenCalled();
    registerCloudPusher(null); vi.unstubAllGlobals();
  });

  it("recomputes a complete legacy record without trusting the stored score or rewriting it", () => {
    const original = JSON.stringify({ score: 99, answers: boundary, createdAt });
    stored.set(HEALTH_STORAGE_KEY, original);
    const result = getHealthCheck();
    expect(result?.score).toBe(49);
    expect(result?.scoreMax).toBe(98);
    expect(result?.source).toBe("legacy_recomputed");
    expect(result?.currency).toBe("legacy_unspecified");
    expect(result?.createdAt).toBe(createdAt);
    expect(stored.get(HEALTH_STORAGE_KEY)).toBe(original);
    expect(setItem).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("current metadata cannot replace score/components derived from answers", () => {
    const result = normalizeHealthCheckResult({ schemaVersion: 2, formulaVersion: FINANCIAL_SCORE_VERSION, createdAt, source: "local_diagnosis", currency: "PLN",
      score: 98, scoreMax: 100, rawScore: 98, components: { savingsRate: 999 }, answers: boundary });
    expect(result?.score).toBe(49);
    expect(result?.scoreMax).toBe(98);
    expect(result?.components.savingsRate).toBe(18);
    expect(result?.currency).toBe("PLN");
  });

  it("legacy read is idempotent and does not infer PLN from an unversioned claim", () => {
    const original = { score: 99, createdAt, answers: boundary, currency: "PLN", source: "local_diagnosis" };
    const first = normalizeHealthCheckResult(original);
    expect(first?.source).toBe("legacy_recomputed");
    expect(first?.currency).toBe("legacy_unspecified");
    expect(first?.answers).toEqual(boundary);
    expect(first?.score).toBe(49);
    expect(normalizeHealthCheckResult(first)).toEqual(first);
    expect(setItem).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it.each([
    ["local_diagnosis", undefined], ["local_diagnosis", "USD"], ["local_diagnosis", "legacy_unspecified"],
    ["legacy_recomputed", "PLN"], ["legacy_recomputed", undefined], ["legacy_recomputed", "USD"],
    ["future_source", "PLN"],
  ])("rejects unsupported current source/currency pair %s/%s", (source, currency) => {
    expect(normalizeHealthCheckResult({ schemaVersion: 2, formulaVersion: FINANCIAL_SCORE_VERSION, createdAt,
      answers: boundary, source, currency })).toBeNull();
  });

  it("incomplete legacy, unsupported version and noncanonical timestamps are unavailable", () => {
    for (const record of [
      { score: 42, createdAt, answers: {} },
      { schemaVersion: 2, formulaVersion: "unreviewed-future-version", createdAt, answers: boundary, source: "local_diagnosis" },
      { score: 42, createdAt: "2026-10-14", answers: boundary },
      { score: 42, createdAt, answers: { ...boundary, debt: -1 } },
    ]) expect(normalizeHealthCheckResult(record)).toBeNull();
  });

  it("saves a complete local result only after storage succeeds, with no cloud notification", () => {
    const result = saveHealthCheck(boundary);
    expect(result.score).toBe(49);
    expect(result.schemaVersion).toBe(2);
    expect(result.source).toBe("local_diagnosis");
    expect(result.currency).toBe("PLN");
    expect(JSON.parse(stored.get(HEALTH_STORAGE_KEY)!)).toEqual(result);
    expect(setItem).toHaveBeenCalledOnce();
    expect(dispatch).toHaveBeenCalledOnce();
    expect((dispatch.mock.calls[0][0] as Event).type).toBe("coachfi-health-check");
  });

  it("a quota failure preserves prior persisted data and emits no success event", () => {
    stored.set(HEALTH_STORAGE_KEY, "synthetic previous record");
    setItem.mockImplementationOnce(() => { throw new Error("Synthetic quota failure"); });
    expect(() => saveHealthCheck(boundary)).toThrow("Synthetic quota failure");
    expect(stored.get(HEALTH_STORAGE_KEY)).toBe("synthetic previous record");
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("missing required consent cannot read or save a score, and optional permissions are unnecessary", () => {
    stored.set(HEALTH_STORAGE_KEY, JSON.stringify({ score: 99, answers: boundary, createdAt }));
    stored.delete(CONSENT_STORAGE_KEY);
    expect(getHealthCheck()).toBeNull();
    expect(() => saveHealthCheck(boundary)).toThrow();
    expect(setItem).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });
});
