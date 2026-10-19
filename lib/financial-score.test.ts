import { describe, expect, it } from "vitest";
import { calculateFinancialScore, FINANCIAL_SCORE_MAX, FinancialScoreValidationError, validateFinancialScoreInput } from "./financial-score";

export const zero = { monthlyIncome: 0, monthlyExpenses: 0, savings: 0, debt: 0, cashHeld: 0,
  hasEmergencyFund: false, understandsInflation: false, hasRetirementPlan: false, investsAlready: false, mainFinancialGoal: "" };

describe("existing financial score, explicit 98-point scale", () => {
  it("keeps legacy zero rules without calling them a zero-risk situation", () => {
    const result = calculateFinancialScore(zero);
    expect(result.score).toBe(10); expect(result.scoreMax).toBe(98);
    expect(result.ratios).toEqual({ monthlyFree: 0, savingsRate: null, emergencyCoverage: null, debtPressure: null, cushionMonths: null });
    expect(result.groups.knowledgeDeclaration).toEqual({ points: 0, maxPoints: 6 });
  });
  it("reaches 98 only at the existing maxima and exposes every group", () => {
    const result = calculateFinancialScore({ ...zero, monthlyIncome: 4000, monthlyExpenses: 2000, savings: 6000,
      hasEmergencyFund: true, understandsInflation: true, hasRetirementPlan: true, investsAlready: true, mainFinancialGoal: "A clear long goal" });
    expect(result.score).toBe(FINANCIAL_SCORE_MAX);
    expect(result.groups).toEqual({ cashFlowAndRisk: { points: 60, maxPoints: 60 }, planningDeclarations: { points: 32, maxPoints: 32 }, knowledgeDeclaration: { points: 6, maxPoints: 6 } });
    expect(Object.values(result.components).reduce((sum, value) => sum + value, 0)).toBe(98);
  });
  it("recalculates the old demo inputs instead of returning the placeholder 42", () => {
    const result = calculateFinancialScore({ ...zero, monthlyIncome: 6000, monthlyExpenses: 5200, savings: 3000,
      debt: 8000, cashHeld: 20000, mainFinancialGoal: "Build an emergency fund, then learn long-term investing." });
    expect(result.score).toBe(36); expect(result.rawScore).toBeCloseTo(6967 / 195, 12);
  });
  it("handles the cash and goal cutoffs without changing weights", () => {
    const base = { ...zero, monthlyIncome: 1000, monthlyExpenses: 750, savings: 1125, debt: 1000, cashHeld: 2000, mainFinancialGoal: "12345678" };
    expect(calculateFinancialScore(base).score).toBe(49);
    expect(calculateFinancialScore({ ...base, cashHeld: 2000.01 }).score).toBe(45);
    expect(calculateFinancialScore({ ...base, mainFinancialGoal: "123456789" }).score).toBe(55);
  });
  it("does not conflate declared knowledge with the cash-flow subtotal", () => {
    const before = calculateFinancialScore(zero);
    const after = calculateFinancialScore({ ...zero, understandsInflation: true });
    expect(after.groups.cashFlowAndRisk).toEqual(before.groups.cashFlowAndRisk);
    expect(after.groups.planningDeclarations).toEqual(before.groups.planningDeclarations);
    expect(after.groups.knowledgeDeclaration.points - before.groups.knowledgeDeclaration.points).toBe(6);
  });
  it("bounds points and emits finite-or-null ratios for subnormal denominators", () => {
    const result = calculateFinancialScore({ ...zero, monthlyIncome: Number.MIN_VALUE, monthlyExpenses: Number.MIN_VALUE, savings: 1e12, debt: 1e12 });
    expect(Number.isFinite(result.rawScore)).toBe(true);
    expect(result.score).toBeLessThanOrEqual(98);
    expect(result.ratios.emergencyCoverage).toBeNull(); expect(result.ratios.debtPressure).toBeNull();
    expect(result.ratios.cushionMonths).toBeNull(); expect(result.components.emergencyCoverage).toBe(18);
    expect(result.components.debtPressure).toBe(0);
  });
  it.each([undefined, null, "", "0", -1, NaN, Infinity, -Infinity, 1e12 + 1])("rejects absent/non-numeric/out-of-range income %s", (monthlyIncome) => {
    expect(validateFinancialScoreInput({ ...zero, monthlyIncome }).ok).toBe(false);
    expect(() => calculateFinancialScore({ ...zero, monthlyIncome })).toThrow(FinancialScoreValidationError);
  });
  it.each(["false", "true", 0, 1, undefined, null])("rejects non-boolean declarations %s", (investsAlready) => {
    expect(validateFinancialScoreInput({ ...zero, investsAlready }).ok).toBe(false);
  });
  it("rejects unknown fields, invalid records and overly long goals", () => {
    for (const value of [null, [], { ...zero, session: "synthetic" }, { ...zero, mainFinancialGoal: "x".repeat(1001) }])
      expect(validateFinancialScoreInput(value).ok).toBe(false);
  });
});
