const KEY = "coachfi-tokens";
const INITIAL_BALANCE = 125;

export function getTokenBalance(): number {
  if (typeof window === "undefined") return INITIAL_BALANCE;
  const raw = localStorage.getItem(KEY);
  if (raw === null) return INITIAL_BALANCE;
  const n = parseInt(raw, 10);
  return isNaN(n) ? INITIAL_BALANCE : n;
}

export function addTokens(amount: number): number {
  const next = getTokenBalance() + Math.max(0, Math.round(amount));
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, String(next));
    window.dispatchEvent(new Event("coachfi-tokens"));
  }
  return next;
}

export function spendTokens(amount: number): boolean {
  const current = getTokenBalance();
  if (current < amount) return false;
  const next = current - Math.round(amount);
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, String(next));
    window.dispatchEvent(new Event("coachfi-tokens"));
  }
  return true;
}
