import { FINANCIAL_AMOUNT_MAX } from "@/lib/financial-score";

export interface IncomeAllocation {
  readonly totalCents: number;
  readonly jarCents: readonly number[];
}

export function allocateIncomeCents(income: number, percentages: readonly number[]): IncomeAllocation | null {
  if (!Number.isFinite(income) || income < 0 || income > FINANCIAL_AMOUNT_MAX) return null;
  const rawCents = Math.round(income * 100);
  if (!Number.isSafeInteger(rawCents) || rawCents / 100 !== income) return null;
  const totalCents = rawCents === 0 ? 0 : rawCents;
  if (!Array.isArray(percentages) || percentages.length !== 6 ||
    !percentages.every((percent) => Number.isSafeInteger(percent) && percent >= 0 && percent <= 100) ||
    percentages.reduce((sum, percent) => sum + percent, 0) !== 100) return null;

  const products = percentages.map((percent) => totalCents * percent);
  if (!products.every(Number.isSafeInteger)) return null;
  const remainders = products.map((product) => product % 100);
  const jarCents = products.map((product, index) => (product - remainders[index]) / 100);
  const remaining = totalCents - jarCents.reduce((sum, cents) => sum + cents, 0);
  if (!Number.isSafeInteger(remaining) || remaining < 0 || remaining >= percentages.length) return null;
  const remainderOrder = remainders
    .map((remainder, index) => ({ remainder, index }))
    .sort((left, right) => right.remainder - left.remainder || left.index - right.index);
  for (const { index } of remainderOrder.slice(0, remaining)) jarCents[index] += 1;
  return Object.freeze({ totalCents, jarCents: Object.freeze(jarCents) });
}
