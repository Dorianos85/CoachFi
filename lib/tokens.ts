import { persistLearningState } from "@/lib/account-sync";
import { assertCurrentPersonalStorage, captureCurrentPersonalStorage, type PersonalStorageHandle } from "@/lib/product-storage";
import { notifyCloud } from "@/lib/sync/syncQueue";

const KEY = "coachfi-tokens";
const INITIAL_BALANCE = 125;

export class TokenMutationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenMutationError";
  }
}

type BalanceRead = { valid: true; balance: number } | { valid: false; reason: "malformed" | "unavailable" | "stale" };

function readBalance(storage: PersonalStorageHandle): BalanceRead {
  try {
    if (!storage.isCurrent()) return { valid: false, reason: "stale" };
    const raw = storage.getItem(KEY);
    if (!storage.isCurrent()) return { valid: false, reason: "stale" };
    if (raw === null) return { valid: true, balance: INITIAL_BALANCE };
    if (typeof raw !== "string" || !/^(0|[1-9][0-9]*)$/.test(raw)) return { valid: false, reason: "malformed" };
    const balance = Number(raw);
    // The round-trip also rejects a final newline allowed by JavaScript's $ anchor.
    if (!Number.isSafeInteger(balance) || balance < 0 || String(balance) !== raw) {
      return { valid: false, reason: "malformed" };
    }
    return { valid: true, balance };
  } catch {
    return { valid: false, reason: "unavailable" };
  }
}

function roundedDelta(amount: number): number | null {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) return null;
  const delta = Math.round(amount);
  return Number.isSafeInteger(delta) && delta >= 0 ? delta : null;
}

export function getTokenBalance(storage: PersonalStorageHandle = captureCurrentPersonalStorage()): number {
  const result = readBalance(storage);
  return result.valid ? result.balance : 0;
}

/** Pure eligibility check; no storage mutation, events, cloud notification or acknowledgement. */
export function canAwardTokens(amount: number, storage: PersonalStorageHandle = captureCurrentPersonalStorage()): boolean {
  const delta = roundedDelta(amount);
  if (delta === null || (delta > 0 && typeof window === "undefined")) return false;
  const result = readBalance(storage);
  return result.valid && delta <= Number.MAX_SAFE_INTEGER - result.balance;
}

export function addTokens(amount: number, reason = "Tokens earned", source = "app", storage: PersonalStorageHandle = captureCurrentPersonalStorage()): number {
  assertCurrentPersonalStorage(storage);
  const delta = roundedDelta(amount);
  if (delta === null) throw new TokenMutationError("Invalid token amount");
  const result = readBalance(storage);
  assertCurrentPersonalStorage(storage);
  if (!result.valid) throw new TokenMutationError(result.reason === "malformed" ? "Token balance is malformed" : "Token balance is unavailable");
  if (delta > Number.MAX_SAFE_INTEGER - result.balance) throw new TokenMutationError("Token balance would exceed the safe integer range");
  if (delta === 0) return result.balance;
  if (typeof window === "undefined") throw new TokenMutationError("Token storage is unavailable outside the browser");
  const next = result.balance + delta;
  if (!storage.setItem(KEY, String(next))) throw new Error("Storage session changed");
  assertCurrentPersonalStorage(storage);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("coachfi-tokens"));
  assertCurrentPersonalStorage(storage);
  notifyCloud("reward", { amount: delta, reason, source });
  assertCurrentPersonalStorage(storage);
  persistLearningState("tokens", storage);
  assertCurrentPersonalStorage(storage);
  return next;
}

export function spendTokens(amount: number, storage: PersonalStorageHandle = captureCurrentPersonalStorage()): boolean {
  const delta = roundedDelta(amount);
  if (delta === null) return false;
  const result = readBalance(storage);
  if (!result.valid || delta > result.balance) return false;
  if (delta === 0) return true;
  if (typeof window === "undefined") return false;
  const next = result.balance - delta;
  if (!storage.setItem(KEY, String(next)) || !storage.isCurrent()) return false;
  if (typeof window !== "undefined") window.dispatchEvent(new Event("coachfi-tokens"));
  if (!storage.isCurrent()) return false;
  notifyCloud("reward", { amount: -delta, reason: "Tokens spent", source: "app" });
  if (!storage.isCurrent()) return false;
  persistLearningState("tokens", storage);
  return storage.isCurrent();
}
