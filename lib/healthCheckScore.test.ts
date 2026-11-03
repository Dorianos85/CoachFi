import { describe, expect, it } from "vitest";

import { calculateHealthScore, healthScoreBand, PILLAR_WEIGHTS, scoreHealthCheck, type HealthScoreInput } from "./healthCheckScore";

/** Shape of the current Health Check form (app/health-check/page.tsx HealthForm). */
function form(overrides: Partial<HealthScoreInput> = {}): HealthScoreInput {
  return {
    monthlyIncome: 5000,
    monthlyExpenses: 3500,
    savings: 3500,
    debt: 0,
    cashHeld: 0,
    hasEmergencyFund: false,
    understandsInflation: false,
    hasRetirementPlan: false,
    investsAlready: false,
    mainFinancialGoal: "",
    ...overrides,
  };
}

describe("Health Check score", () => {
  it("has pillar weights that sum to 100", () => {
    expect(Object.values(PILLAR_WEIGHTS).reduce((sum, weight) => sum + weight, 0)).toBe(100);
  });

  it("reaches 100 for a strong profile (so the scale really is out of 100)", () => {
    const strong = form({
      monthlyIncome: 5000,
      monthlyExpenses: 3000,
      savings: 18000,
      debt: 0,
      understandsInflation: true,
      hasRetirementPlan: true,
      investsAlready: true,
      mainFinancialGoal: "Save $3,000 for emergencies",
    });
    expect(calculateHealthScore(strong)).toBe(100);
    expect(calculateHealthScore({ ...strong, tracksSpending: true, monthlyDebtPayments: 0 })).toBe(100);
  });

  it("does not score 0 on debt with zero income and zero debt", () => {
    const result = scoreHealthCheck(form({ monthlyIncome: 0, monthlyExpenses: 0, savings: 0, debt: 0 }));
    expect(result.pillars.debt).toBe(PILLAR_WEIGHTS.debt);
    expect(result.pillars.cashFlow).toBeNull();
    expect(result.pillars.emergency).toBeNull();
    expect(result.score).toBeGreaterThan(0);
  });

  it("does not punish a debt-free retiree with no paycheck", () => {
    const retiree = form({
      monthlyIncome: 0,
      monthlyExpenses: 3000,
      savings: 30000,
      debt: 0,
      hasRetirementPlan: true,
      understandsInflation: true,
      mainFinancialGoal: "Stay debt-free",
    });
    expect(calculateHealthScore(retiree)).toBeGreaterThanOrEqual(82);
  });

  it("does not zero the debt pillar because of a mortgage", () => {
    // Typical homeowner: $300k mortgage entered as total debt in the current form.
    const homeowner = scoreHealthCheck(form({ monthlyIncome: 6000, debt: 300000 }));
    expect(homeowner.pillars.debt).toBeGreaterThan(0);
    // When the mortgage balance is known, it's excluded entirely.
    const known = scoreHealthCheck(form({ monthlyIncome: 6000, debt: 300000, mortgageBalance: 300000 }));
    expect(known.pillars.debt).toBe(PILLAR_WEIGHTS.debt);
    // With the more precise form, only non-mortgage payments count.
    const precise = scoreHealthCheck(form({ monthlyIncome: 6000, debt: 300000, monthlyDebtPayments: 300 }));
    expect(precise.pillars.debt).toBe(PILLAR_WEIGHTS.debt);
  });

  it("scores debt-to-income on non-mortgage payments (≤10% full, ≥43% zero)", () => {
    const at = (payments: number) => scoreHealthCheck(form({ monthlyIncome: 5000, monthlyDebtPayments: payments })).pillars.debt;
    expect(at(500)).toBe(20);
    expect(at(1800)).toBeCloseTo(5, 5);
    expect(at(2150)).toBe(0);
    expect(at(1000)!).toBeGreaterThan(at(1500)!);
  });

  it("does not let an investing bonus override high-interest card debt", () => {
    const base = {
      monthlyIncome: 5000,
      monthlyExpenses: 3000,
      savings: 9000,
      investsAlready: true,
      hasRetirementPlan: false,
    };
    const withCardDebt = scoreHealthCheck(form({ ...base, carriesCardBalance: true, debt: 6000 }));
    const withoutCardDebt = scoreHealthCheck(form({ ...base, carriesCardBalance: false, debt: 0 }));
    expect(withCardDebt.pillars.future).toBe(0);
    expect(withoutCardDebt.pillars.future).toBe(10);
    // The investor carrying a card balance scores below the same person without it.
    expect(withCardDebt.score).toBeLessThan(withoutCardDebt.score);
    // And no better than someone with the same card debt who doesn't invest.
    const sameDebtNoInvesting = scoreHealthCheck(form({ ...base, investsAlready: false, carriesCardBalance: true, debt: 6000 }));
    expect(withCardDebt.score).toBe(sameDebtNoInvesting.score);
  });

  it("gives no investing bonus without at least one month of savings", () => {
    const result = scoreHealthCheck(form({ monthlyExpenses: 3000, savings: 1000, investsAlready: true }));
    expect(result.pillars.future).toBe(0);
  });

  it("does not penalise a large emergency fund or cash", () => {
    const sixMonths = scoreHealthCheck(form({ monthlyExpenses: 3000, savings: 18000, cashHeld: 18000 }));
    const twelveMonths = scoreHealthCheck(form({ monthlyExpenses: 3000, savings: 36000, cashHeld: 36000 }));
    expect(sixMonths.pillars.emergency).toBe(25);
    expect(twelveMonths.score).toBe(sixMonths.score);
  });

  it("follows the emergency curve: 0 → 0, 1 month → 10, 3+ months → 25", () => {
    const at = (months: number) => scoreHealthCheck(form({ monthlyExpenses: 1000, savings: months * 1000 })).pillars.emergency;
    expect(at(0)).toBe(0);
    expect(at(1)).toBe(10);
    expect(at(2)).toBeCloseTo(17.5, 5);
    expect(at(3)).toBe(25);
  });

  it("counts a goal written as a number", () => {
    const withAmount = scoreHealthCheck(form({ mainFinancialGoal: "50000" }));
    const empty = scoreHealthCheck(form({ mainFinancialGoal: "   " }));
    expect(withAmount.pillars.habits!).toBeGreaterThan(empty.pillars.habits!);
  });

  it("treats missing or invalid numbers as zero without crashing", () => {
    const broken = form({ monthlyIncome: Number.NaN, monthlyExpenses: -5, savings: Number("") });
    expect(() => calculateHealthScore(broken)).not.toThrow();
    expect(calculateHealthScore(broken)).toBeGreaterThanOrEqual(0);
  });

  it("stays within 0–100 for extreme inputs", () => {
    const bad = form({ monthlyIncome: 1000, monthlyExpenses: 5000, savings: 0, debt: 1e9, carriesCardBalance: true });
    const score = calculateHealthScore(bad);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("uses one set of bands", () => {
    expect(healthScoreBand(39)).toBe("needsAttention");
    expect(healthScoreBand(40)).toBe("building");
    expect(healthScoreBand(65)).toBe("solid");
    expect(healthScoreBand(82)).toBe("strong");
  });
});
