import { notifyCloud } from "@/lib/sync/syncQueue";

const KEY = "coachfi-tokens";
const INITIAL_BALANCE = 125;

export function getTokenBalance(): number {
  if (typeof window === "undefined") return INITIAL_BALANCE;
  const raw = localStorage.getItem(KEY);
  if (raw === null) return INITIAL_BALANCE;
  const n = parseInt(raw, 10);
  return isNaN(n) ? INITIAL_BALANCE : n;
}

export function addTokens(amount: number, reason = "Tokens earned", source = "app"): number {
  const delta = Math.max(0, Math.round(amount));
  const next = getTokenBalance() + delta;
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, String(next));
    window.dispatchEvent(new Event("coachfi-tokens"));
    if (delta > 0) notifyCloud("reward", { amount: delta, reason, source });
  }
  return next;
}

export function spendTokens(amount: number): boolean {
  const current = getTokenBalance();
  if (current < amount) return false;
  const delta = Math.round(amount);
  const next = current - delta;
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, String(next));
    window.dispatchEvent(new Event("coachfi-tokens"));
    if (delta > 0) notifyCloud("reward", { amount: -delta, reason: "Tokens spent", source: "app" });
  }
  return true;
}
