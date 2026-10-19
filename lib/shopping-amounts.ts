import { FINANCIAL_AMOUNT_MAX } from "@/lib/financial-score";

export function parseShoppingAmountCents(raw: string): number | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) return null;
  const amount = Number(text);
  if (!Number.isFinite(amount) || amount <= 0 || amount > FINANCIAL_AMOUNT_MAX) return null;
  const cents = Math.round(amount * 100);
  if (!Number.isSafeInteger(cents) || cents / 100 !== amount) return null;
  return cents;
}

export function shoppingTotalCents(values: readonly number[]): number | null {
  if (!Array.isArray(values)) return null;
  let total = 0;
  for (const cents of values) {
    if (!Number.isSafeInteger(cents) || cents <= 0) return null;
    total += cents;
    if (!Number.isSafeInteger(total) || total > FINANCIAL_AMOUNT_MAX * 100) return null;
  }
  return total;
}

export function parseShoppingPriceCents(raw: string): number | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) return null;
  const amount = Number(text);
  if (!Number.isFinite(amount) || amount < 0 || amount > FINANCIAL_AMOUNT_MAX) return null;
  if (amount === 0 && /[1-9]/.test(text.replace(/[eE].*$/, ""))) return null;
  const cents = Math.round(amount * 100);
  if (!Number.isSafeInteger(cents) || cents / 100 !== amount) return null;
  return cents === 0 ? 0 : cents;
}
