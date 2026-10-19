/** Existing CoachFI weights, exposed without claiming scientific validation. */
export const FINANCIAL_SCORE_VERSION = "legacy-weights-98-v1" as const;
export const FINANCIAL_SCORE_MAX = 98 as const;
export const FINANCIAL_AMOUNT_MAX = 1e12;

export interface FinancialScoreInput {
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
  debt: number;
  cashHeld: number;
  hasEmergencyFund: boolean;
  understandsInflation: boolean;
  hasRetirementPlan: boolean;
  investsAlready: boolean;
  mainFinancialGoal: string;
}

const NUMBERS = ["monthlyIncome", "monthlyExpenses", "savings", "debt", "cashHeld"] as const;
const BOOLEANS = ["hasEmergencyFund", "understandsInflation", "hasRetirementPlan", "investsAlready"] as const;
const FIELDS = [...NUMBERS, ...BOOLEANS, "mainFinancialGoal"];
export type FinancialInputError = "required" | "finite_number" | "nonnegative" | "amount_limit" | "boolean" | "text" | "text_limit" | "record" | "unknown_fields";
export type FinancialInputErrors = Partial<Record<keyof FinancialScoreInput | "_record", FinancialInputError>>;

export function validateFinancialScoreInput(value: unknown):
  { ok: true; input: FinancialScoreInput } | { ok: false; errors: FinancialInputErrors } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: { _record: "record" } };
  const record = value as Record<string, unknown>;
  const errors: FinancialInputErrors = {};
  if (Object.keys(record).some((key) => !FIELDS.includes(key))) errors._record = "unknown_fields";
  for (const key of NUMBERS) {
    const number = record[key];
    if (number === undefined || number === null || number === "") errors[key] = "required";
    else if (typeof number !== "number" || !Number.isFinite(number)) errors[key] = "finite_number";
    else if (number < 0) errors[key] = "nonnegative";
    else if (number > FINANCIAL_AMOUNT_MAX) errors[key] = "amount_limit";
  }
  for (const key of BOOLEANS) {
    if (record[key] === undefined || record[key] === null || record[key] === "") errors[key] = "required";
    else if (typeof record[key] !== "boolean") errors[key] = "boolean";
  }
  if (typeof record.mainFinancialGoal !== "string") errors.mainFinancialGoal = "text";
  else if (record.mainFinancialGoal.length > 1000) errors.mainFinancialGoal = "text_limit";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, input: {
    monthlyIncome: record.monthlyIncome as number, monthlyExpenses: record.monthlyExpenses as number,
    savings: record.savings as number, debt: record.debt as number, cashHeld: record.cashHeld as number,
    hasEmergencyFund: record.hasEmergencyFund as boolean, understandsInflation: record.understandsInflation as boolean,
    hasRetirementPlan: record.hasRetirementPlan as boolean, investsAlready: record.investsAlready as boolean,
    mainFinancialGoal: (record.mainFinancialGoal as string).trim(),
  } };
}

export class FinancialScoreValidationError extends Error {
  constructor(public readonly errors: FinancialInputErrors) {
    super("Invalid financial score inputs"); this.name = "FinancialScoreValidationError";
  }
}

export function calculateFinancialScore(value: unknown) {
  const valid = validateFinancialScoreInput(value);
  if (!valid.ok) throw new FinancialScoreValidationError(valid.errors);
  const form = valid.input;
  const monthlyFree = Math.max(form.monthlyIncome - form.monthlyExpenses, 0);
  const savingsRate = form.monthlyIncome > 0 ? monthlyFree / form.monthlyIncome : null;
  const emergencyCoverage = form.monthlyExpenses > 0 ? form.savings / (form.monthlyExpenses * 3) : null;
  const debtPressure = form.monthlyIncome > 0 ? form.debt / (form.monthlyIncome * 4) : null;
  const components = {
    savingsRate: Math.min((savingsRate ?? 0) / 0.25, 1) * 18,
    emergencyCoverage: Math.min(emergencyCoverage ?? 0, 1) * 18,
    debtPressure: Math.max(0, 1 - (debtPressure ?? 1)) * 16,
    cashAwareness: form.cashHeld > form.monthlyIncome * 2 && !form.investsAlready ? 4 : 8,
    investingDeclaration: form.investsAlready ? 10 : 2,
    goalDeclaration: form.mainFinancialGoal.trim().length > 8 ? 6 : 0,
    emergencyDeclaration: form.hasEmergencyFund ? 8 : 0,
    inflationKnowledgeDeclaration: form.understandsInflation ? 6 : 0,
    retirementDeclaration: form.hasRetirementPlan ? 8 : 0,
  };
  const groups = {
    cashFlowAndRisk: { points: components.savingsRate + components.emergencyCoverage + components.debtPressure + components.cashAwareness, maxPoints: 60 as const },
    planningDeclarations: { points: components.investingDeclaration + components.goalDeclaration + components.emergencyDeclaration + components.retirementDeclaration, maxPoints: 32 as const },
    knowledgeDeclaration: { points: components.inflationKnowledgeDeclaration, maxPoints: 6 as const },
  };
  const rawScore = Object.values(components).reduce((sum, points) => sum + points, 0);
  const finiteRatio = (ratio: number | null) => ratio !== null && Number.isFinite(ratio) ? ratio : null;
  return { formulaVersion: FINANCIAL_SCORE_VERSION,
    score: Math.max(0, Math.min(FINANCIAL_SCORE_MAX, Math.round(rawScore))), rawScore, scoreMax: FINANCIAL_SCORE_MAX,
    components, groups, ratios: { monthlyFree, savingsRate: finiteRatio(savingsRate),
      emergencyCoverage: finiteRatio(emergencyCoverage), debtPressure: finiteRatio(debtPressure),
      cushionMonths: finiteRatio(form.monthlyExpenses > 0 ? form.savings / form.monthlyExpenses : null) },
  };
}
export type FinancialScoreCalculation = ReturnType<typeof calculateFinancialScore>;
