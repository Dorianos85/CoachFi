import { persistLearningState } from "@/lib/account-sync";
import { isProgressVisible } from "@/lib/progress-visibility";
import { notifyCloud } from "@/lib/sync/syncQueue";

const KEY = "coachfi-tokens";
// New users start at zero: every point shown must have been earned.
const INITIAL_BALANCE = 0;

/** Raw balance stored on this device, regardless of whether it is currently shown. */
function readStoredBalance(): number {
  if (typeof window === "undefined") return INITIAL_BALANCE;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return INITIAL_BALANCE;
  }
  if (raw === null) return INITIAL_BALANCE;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : INITIAL_BALANCE;
}

function writeBalance(next: number) {
  localStorage.setItem(KEY, String(next));
  window.dispatchEvent(new Event("coachfi-tokens"));
}

/** Balance to display. Hidden account progress (signed-out session) shows as 0. */
export function getTokenBalance(): number {
  if (typeof window === "undefined") return INITIAL_BALANCE;
  if (!isProgressVisible()) return 0;
  return readStoredBalance();
}

export function addTokens(amount: number, reason = "Tokens earned", source = "app"): number {
  const delta = Math.max(0, Math.round(Number.isFinite(amount) ? amount : 0));
  // Always add to the stored balance, never to the displayed one: a hidden
  // balance must not be overwritten with `0 + delta`.
  const next = readStoredBalance() + delta;
  if (typeof window !== "undefined") {
    writeBalance(next);
    if (delta > 0) notifyCloud("reward", { amount: delta, reason, source });
    persistLearningState("tokens");
  }
  return next;
}

export function spendTokens(amount: number): boolean {
  const current = readStoredBalance();
  const delta = Math.max(0, Math.round(amount));
  if (current < delta) return false;
  const next = current - delta;
  if (typeof window !== "undefined") {
    writeBalance(next);
    if (delta > 0) notifyCloud("reward", { amount: -delta, reason: "Tokens spent", source: "app" });
    persistLearningState("tokens");
  }
  return true;
}
