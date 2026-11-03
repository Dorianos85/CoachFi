/**
 * Health Check score (0–100). Pure functions, no browser APIs.
 *
 * Five pillars whose weights sum to 100:
 *   Cash flow 20 · Emergency fund 25 · Debt 20 · Future 20 · Habits 15
 *
 * A pillar (or an item inside a pillar) that can't be judged from the answers is "not applicable":
 * it is left out and the remaining weights are scaled back up to 100. So someone with no income
 * (student, retiree, between jobs) isn't punished for a ratio that can't be computed.
 *
 * `calculateHealthScore(form)` accepts the current Health Check form as is (app/health-check/page.tsx
 * `HealthForm`). The optional fields let a future form give more precise answers:
 * non-mortgage monthly debt payments, a mortgage balance to exclude, and whether a credit card
 * balance is carried month to month.
 */

export interface HealthScoreInput {
  /** Monthly take-home pay. */
  monthlyIncome: number;
  /** Monthly (essential) expenses. */
  monthlyExpenses: number;
  /** Savings the user could reach within a few days. */
  savings: number;
  /** Total debt balance as entered in the current form (may include a mortgage). */
  debt: number;
  /** Not used for scoring any more (it penalised a normal emergency fund). Kept for compatibility. */
  cashHeld?: number;
  /** Self-declared. Not scored (it double-counted the emergency-fund ratio). Kept for compatibility. */
  hasEmergencyFund?: boolean;
  understandsInflation: boolean;
  hasRetirementPlan: boolean;
  investsAlready: boolean;
  mainFinancialGoal: string;

  /** Monthly payments on non-mortgage debt. When present, the debt pillar uses a debt-to-income ratio. */
  monthlyDebtPayments?: number;
  /** Mortgage balance included in `debt`; it is excluded from the debt pillar. */
  mortgageBalance?: number;
  /** "Do you carry a credit-card balance from month to month?" */
  carriesCardBalance?: boolean;
  /** "Do you track your spending?" */
  tracksSpending?: boolean;
  /** Has an employer match, an IRA or another retirement plan in place. */
  hasEmployerMatchOrIra?: boolean;
}

export const PILLAR_WEIGHTS = {
  cashFlow: 20,
  emergency: 25,
  debt: 20,
  future: 20,
  habits: 15,
} as const;

export type PillarKey = keyof typeof PILLAR_WEIGHTS;

/** Points earned out of the pillar weight, or null when the pillar doesn't apply. */
export type PillarScores = Record<PillarKey, number | null>;

export interface HealthScoreBreakdown {
  score: number;
  pillars: PillarScores;
  /** Months of expenses covered by savings (null when expenses are 0). */
  emergencyMonths: number | null;
}

function num(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

/** Linear interpolation of y between (x0, y0) and (x1, y1), clamped to the segment. */
function lerp(x: number, x0: number, y0: number, x1: number, y1: number) {
  if (x <= x0) return y0;
  if (x >= x1) return y1;
  return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
}

function cashFlowPoints(income: number, expenses: number): number | null {
  if (income <= 0) return null;
  const rate = (income - expenses) / income;
  return PILLAR_WEIGHTS.cashFlow * clamp01(rate / 0.2);
}

function emergencyPoints(months: number | null): number | null {
  if (months === null) return null;
  // 0 months → 0 · 1 month → 10 · 3+ months → 25. No penalty for more than 6 months.
  if (months <= 1) return 10 * months;
  return lerp(months, 1, 10, 3, PILLAR_WEIGHTS.emergency);
}

function debtPoints(input: HealthScoreInput, income: number): number {
  const max = PILLAR_WEIGHTS.debt;
  let points: number;

  if (input.monthlyDebtPayments !== undefined) {
    const payments = num(input.monthlyDebtPayments);
    if (income <= 0) {
      points = payments === 0 ? max : 0;
    } else {
      // Debt-to-income on non-mortgage payments: ≤10% → 20 · 36% → 5 · ≥43% → 0.
      const dti = payments / income;
      points = dti <= 0.1 ? max : dti <= 0.36 ? lerp(dti, 0.1, max, 0.36, 5) : lerp(dti, 0.36, 5, 0.43, 0);
    }
  } else {
    // Current form: one total balance that may include a mortgage. Mortgages are normal, so a
    // balance alone never drives the pillar below 5 points.
    const balance = Math.max(num(input.debt) - num(input.mortgageBalance), 0);
    if (balance === 0) {
      points = max;
    } else if (income <= 0) {
      points = 5;
    } else {
      const yearsOfIncome = balance / (income * 12);
      points = lerp(yearsOfIncome, 0.25, max, 3, 5);
    }
  }

  if (input.carriesCardBalance) points -= 5;
  return Math.max(0, points);
}

function futurePoints(input: HealthScoreInput, months: number | null, debt: number): number {
  const retirement = input.hasRetirementPlan ? 10 : 0;
  // Investing earns points only on top of the foundations: at least one month of expenses saved,
  // no credit-card balance carried, and debt under control. Investing while carrying 24% APR card
  // debt is not rewarded.
  const invests = input.investsAlready || Boolean(input.hasEmployerMatchOrIra);
  const hasCushion = months === null ? num(input.savings) > 0 : months >= 1;
  const foundations = hasCushion && !input.carriesCardBalance && debt >= PILLAR_WEIGHTS.debt / 2;
  return retirement + (invests && foundations ? 10 : 0);
}

function habitsPoints(input: HealthScoreInput): number {
  const items: Array<boolean | undefined> = [
    input.mainFinancialGoal.trim().length > 0,
    input.understandsInflation,
    input.tracksSpending,
  ];
  const known = items.filter((item) => item !== undefined);
  if (known.length === 0) return 0;
  return (known.filter(Boolean).length / known.length) * PILLAR_WEIGHTS.habits;
}

export function scoreHealthCheck(input: HealthScoreInput): HealthScoreBreakdown {
  const income = num(input.monthlyIncome);
  const expenses = num(input.monthlyExpenses);
  const savings = num(input.savings);
  const emergencyMonths = expenses > 0 ? savings / expenses : null;

  const debt = debtPoints(input, income);
  const pillars: PillarScores = {
    cashFlow: cashFlowPoints(income, expenses),
    emergency: emergencyPoints(emergencyMonths),
    debt,
    future: futurePoints(input, emergencyMonths, debt),
    habits: habitsPoints(input),
  };

  let earned = 0;
  let possible = 0;
  for (const key of Object.keys(PILLAR_WEIGHTS) as PillarKey[]) {
    const points = pillars[key];
    if (points === null) continue;
    earned += points;
    possible += PILLAR_WEIGHTS[key];
  }

  const score = possible > 0 ? Math.round((earned / possible) * 100) : 0;
  return { score: Math.max(0, Math.min(100, score)), pillars, emergencyMonths };
}

/** Same signature as the function the Health Check page used, so the page can import this one. */
export function calculateHealthScore(form: HealthScoreInput): number {
  return scoreHealthCheck(form).score;
}

export type HealthScoreBand = "needsAttention" | "building" | "solid" | "strong";

/** One set of bands for the page and the share card: 0–39, 40–64, 65–81, 82–100. */
export function healthScoreBand(score: number): HealthScoreBand {
  if (score >= 82) return "strong";
  if (score >= 65) return "solid";
  if (score >= 40) return "building";
  return "needsAttention";
}
