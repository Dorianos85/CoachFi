export interface InflationScenario {
  readonly year: string;
  readonly "Cash only": number;
  readonly "Saving habit": number;
  readonly "Long-term investing scenario": number;
}

export interface InflationAssumptions {
  readonly annualContribution: number;
  readonly annualNominalReturnPercent: number;
}

export const INFLATION_DEFAULTS: Readonly<InflationAssumptions> = Object.freeze({
  annualContribution: 2400,
  annualNominalReturnPercent: 5.5,
});
export const INFLATION_LIMITS = Object.freeze({
  maxAmount: 1e12,
  maxAnnualContribution: 1e12,
  maxYears: 100,
  minInflationRate: -99,
  maxInflationRate: 100,
  minAnnualNominalReturnPercent: -100,
  maxAnnualNominalReturnPercent: 100,
  maxAbsoluteMonetaryValue: 1e12,
  maxInputLength: 64,
});
export type InflationCalculationErrorCode = "invalid-input" | "out-of-range" | "unrepresentable-result";
export class InflationCalculationError extends Error {
  readonly code: InflationCalculationErrorCode;
  constructor(code: InflationCalculationErrorCode) {
    super(`Inflation calculation ${code}`);
    this.name = "InflationCalculationError"; this.code = code;
  }
}
function invalid(code: InflationCalculationErrorCode): never { throw new InflationCalculationError(code); }
function finiteNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return invalid("invalid-input");
  return value === 0 ? 0 : value;
}
function within(value: unknown, minimum: number, maximum: number): number {
  const number = finiteNumber(value);
  if (number < minimum || number > maximum) return invalid("out-of-range");
  return number;
}
function inputs(amount: number, years: number, rate: number) {
  const checkedAmount = within(amount, 0, INFLATION_LIMITS.maxAmount);
  const checkedYears = within(years, 0, INFLATION_LIMITS.maxYears);
  if (!Number.isSafeInteger(checkedYears)) return invalid("invalid-input");
  return { amount: checkedAmount, years: checkedYears,
    rate: within(rate, INFLATION_LIMITS.minInflationRate, INFLATION_LIMITS.maxInflationRate) };
}
function monetary(value: number, positiveExpected = false) {
  if (!Number.isFinite(value) || Math.abs(value) > INFLATION_LIMITS.maxAbsoluteMonetaryValue ||
    positiveExpected && value === 0) return invalid("unrepresentable-result");
  return value === 0 ? 0 : value;
}
function inflationLog(years: number, rate: number) { return years * Math.log1p(rate / 100); }
function inflationFactor(years: number, rate: number) {
  const factor = Math.exp(inflationLog(years, rate));
  if (!Number.isFinite(factor) || factor <= 0) return invalid("unrepresentable-result");
  return factor;
}
function realValue(amount: number, years: number, rate: number) {
  return monetary(amount / inflationFactor(years, rate), amount > 0);
}
function assumptions(value: Readonly<InflationAssumptions>) {
  try {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return invalid("invalid-input");
  const names = Object.getOwnPropertyNames(value);
  if (Object.getOwnPropertySymbols(value).length !== 0 || names.length !== 2 ||
    !names.includes("annualContribution") || !names.includes("annualNominalReturnPercent")) return invalid("invalid-input");
  const contribution = Object.getOwnPropertyDescriptor(value, "annualContribution");
  const nominalReturn = Object.getOwnPropertyDescriptor(value, "annualNominalReturnPercent");
  if (!contribution || !("value" in contribution) || !nominalReturn || !("value" in nominalReturn)) return invalid("invalid-input");
  return { annualContribution: within(contribution.value, 0, INFLATION_LIMITS.maxAnnualContribution),
    annualNominalReturnPercent: within(nominalReturn.value, INFLATION_LIMITS.minAnnualNominalReturnPercent, INFLATION_LIMITS.maxAnnualNominalReturnPercent) };
  } catch (error) {
    if (error instanceof InflationCalculationError) throw error;
    return invalid("invalid-input");
  }
}

/** Both dot and comma mean a decimal separator, independently of display locale. */
export function parseInflationInput(raw: unknown): number {
  if (typeof raw !== "string" || raw.length > INFLATION_LIMITS.maxInputLength) return invalid("invalid-input");
  const text = raw.trim();
  if (!/^[+-]?(?:[0-9]+(?:[.,][0-9]+)?|[.,][0-9]+)$/.test(text)) return invalid("invalid-input");
  const value = Number(text.replace(",", "."));
  if (!Number.isFinite(value) || value === 0 && /[1-9]/.test(text)) return invalid("unrepresentable-result");
  return value === 0 ? 0 : value;
}

export function calculateRealValue(amount: number, years: number, annualInflationRate: number): number {
  const checked = inputs(amount, years, annualInflationRate);
  return realValue(checked.amount, checked.years, checked.rate);
}

/** Signed change: a negative value means purchasing power increased under assumed deflation. */
export function calculatePurchasingPowerLoss(amount: number, years: number, annualInflationRate: number): number {
  const checked = inputs(amount, years, annualInflationRate);
  realValue(checked.amount, checked.years, checked.rate);
  if (checked.amount === 0 || checked.years === 0 || checked.rate === 0) return 0;
  // expm1 avoids a fabricated zero from subtracting nearly equal values at tiny rates.
  return monetary(-checked.amount * Math.expm1(-inflationLog(checked.years, checked.rate)), true);
}

/** Fixed hypothetical nominal return, annual compounding, equal end-of-year contributions.
 * Cash has no contributions; saving earns zero nominal return. Fees/tax are omitted.
 * The model is an illustration, not a forecast, guarantee or product recommendation.
 */
export function buildInflationScenario(startingAmount: number, years: number, annualInflationRate: number,
  scenarioAssumptions: Readonly<InflationAssumptions> = INFLATION_DEFAULTS): readonly InflationScenario[] {
  const checked = inputs(startingAmount, years, annualInflationRate), chosen = assumptions(scenarioAssumptions);
  const growth = 1 + chosen.annualNominalReturnPercent / 100;
  let saving = checked.amount, investing = checked.amount;
  const result: InflationScenario[] = [];
  for (let year = 0; year <= checked.years; year++) {
    if (year > 0) {
      saving = monetary(saving + chosen.annualContribution);
      const grown = monetary(investing * growth, investing > 0 && growth > 0);
      investing = monetary(grown + chosen.annualContribution);
    }
    const factor = inflationFactor(year, checked.rate);
    result.push(Object.freeze({ year: `Y${year}`,
      "Cash only": monetary(checked.amount / factor, checked.amount > 0),
      "Saving habit": monetary(saving / factor, saving > 0),
      "Long-term investing scenario": monetary(investing / factor, investing > 0),
    }));
  }
  return Object.freeze(result);
}
