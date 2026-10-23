import { addTokens, canAwardTokens, getTokenBalance } from "@/lib/tokens";
import type { PersonalStorageHandle } from "@/lib/product-storage";

const ACTION_KEY = "coachfi-crisis-actions";
export const CRISIS_ACTION_IDS = Object.freeze([
  "write-close-person", "call-creditor", "book-free-legal", "contact-mops", "sell-unused",
] as const);
export type CrisisActionId = (typeof CRISIS_ACTION_IDS)[number];
export const CRISIS_ACTION_REWARD = 15;
const ACTION_IDS: ReadonlySet<string> = new Set(CRISIS_ACTION_IDS);
export type CrisisActionsRead = { readonly status: "ready"; readonly completed: readonly CrisisActionId[] } |
  { readonly status: "unavailable" };
export type CrisisActionSaveStatus = "saved" | "already-done" | "retryable" | "uncertain" | "stopped" | "ignored";
export interface CrisisActionSaveResult {
  readonly status: CrisisActionSaveStatus;
  readonly completed?: readonly CrisisActionId[];
  readonly balance?: number;
}
export interface CrisisActionSaveController {
  version(): number;
  reset(): number;
  isOpen(ticket: number, id?: CrisisActionId): boolean;
  run(ticket: number, storage: PersonalStorageHandle, id: CrisisActionId): CrisisActionSaveResult;
}

function requireSynchronous(value: unknown) {
  if (value === null || (typeof value !== "object" && typeof value !== "function") ||
    typeof (value as { then?: unknown }).then !== "function") return;
  if (value instanceof Promise) void Promise.prototype.then.call(value, undefined, () => undefined);
  throw new Error("Crisis action save operations must be synchronous");
}
function isActionId(id: unknown): id is CrisisActionId { return typeof id === "string" && ACTION_IDS.has(id); }
function storageIsCurrent(storage: PersonalStorageHandle) {
  const value = storage.isCurrent(); requireSynchronous(value); return value === true;
}

/** Unknown bytes remain unavailable; no repair, sorting, migration or write. */
export function readCrisisActions(storage: PersonalStorageHandle): CrisisActionsRead {
  const unavailable = (): CrisisActionsRead => Object.freeze({ status: "unavailable" });
  try {
    if (typeof window === "undefined" || !storageIsCurrent(storage)) return unavailable();
    const raw = storage.getItem(ACTION_KEY);
    requireSynchronous(raw);
    if (typeof window === "undefined" || !storageIsCurrent(storage)) return unavailable();
    if (raw === null) return Object.freeze({ status: "ready", completed: Object.freeze([]) });
    if (typeof raw !== "string") return unavailable();
    const completed: unknown = JSON.parse(raw);
    if (!Array.isArray(completed) || completed.length > CRISIS_ACTION_IDS.length ||
      !completed.every(isActionId) || new Set(completed).size !== completed.length) return unavailable();
    return Object.freeze({ status: "ready", completed: Object.freeze([...completed]) as readonly CrisisActionId[] });
  } catch { return unavailable(); }
}

function matchesActions(state: CrisisActionsRead, expected: readonly CrisisActionId[]) {
  return state.status === "ready" && state.completed.length === expected.length &&
    state.completed.every((id, index) => id === expected[index]);
}

/** Per-action terminal tickets, but uncertainty quarantines all actions in this RAM instance. */
export function createCrisisActionSaveController(): CrisisActionSaveController {
  let epoch = 0, inFlight = false, blocked = false;
  const committed = new Set<CrisisActionId>();
  const result = (status: CrisisActionSaveStatus, completed?: readonly CrisisActionId[], balance?: number): CrisisActionSaveResult => {
    const value: CrisisActionSaveResult = { status, ...(completed ? { completed: Object.freeze([...completed]) } : {}),
      ...(balance === undefined ? {} : { balance }) };
    return Object.freeze(value);
  };

  function run(ticket: number, storage: PersonalStorageHandle, id: CrisisActionId): CrisisActionSaveResult {
    if (ticket !== epoch || inFlight) return result("ignored");
    inFlight = true;
    let active = true, mutationAttempted = false, mutationFault = false, readFault = false;
    const current = () => {
      if (ticket !== epoch) return false;
      try { return storageIsCurrent(storage) && ticket === epoch; } catch { return false; }
    };
    const requireTraceCurrent = () => {
      if (!active || !current()) throw new Error("Storage session changed");
      if (typeof window === "undefined") throw new Error("Crisis action save requires a browser");
    };
    const failure = (): CrisisActionSaveResult => {
      if (mutationAttempted && ticket === epoch) blocked = true;
      if (!current()) return result("stopped");
      return result(mutationAttempted ? "uncertain" : "retryable");
    };

    try {
      if (!current()) return result("stopped");
      if (blocked) return result("uncertain");
      if (!isActionId(id)) return result("retryable");
      if (committed.has(id)) return result("ignored");
      if (typeof window === "undefined") return result("retryable");
      const traced: PersonalStorageHandle = Object.freeze({
        owner: storage.owner, revision: storage.revision, area: storage.area,
        isCurrent: () => active && current(),
        getItem: (key: string) => {
          try {
            requireTraceCurrent(); const value = storage.getItem(key); requireSynchronous(value); requireTraceCurrent();
            if (value !== null && typeof value !== "string") throw new Error("Invalid storage read");
            return value;
          } catch (error) { readFault = true; throw error; }
        },
        setItem: (key: string, value: string) => {
          mutationAttempted = true;
          try {
            requireTraceCurrent(); if (readFault) throw new Error("Crisis action save read failed");
            const written = storage.setItem(key, value); requireSynchronous(written);
            if (written !== true) mutationFault = true; requireTraceCurrent(); return written === true;
          } catch (error) { mutationFault = true; throw error; }
        },
        removeItem: (key: string) => {
          mutationAttempted = true;
          try {
            requireTraceCurrent(); if (readFault) throw new Error("Crisis action save read failed");
            const removed = storage.removeItem(key); requireSynchronous(removed);
            if (removed !== true) mutationFault = true; requireTraceCurrent(); return removed === true;
          } catch (error) { mutationFault = true; throw error; }
        },
        release: () => { requireTraceCurrent(); storage.release(); },
      });
      const state = readCrisisActions(traced);
      requireTraceCurrent();
      if (state.status !== "ready" || readFault) return failure();
      if (state.completed.includes(id)) {
        committed.add(id);
        return result("already-done", state.completed); // A stored action does not prove its historical reward.
      }
      const balanceBefore = getTokenBalance(traced);
      requireSynchronous(balanceBefore);
      const eligible = canAwardTokens(CRISIS_ACTION_REWARD, traced);
      requireSynchronous(eligible); requireTraceCurrent();
      if (eligible !== true || readFault) return failure();
      const expectedBalance = balanceBefore + CRISIS_ACTION_REWARD;
      if (!Number.isSafeInteger(expectedBalance) || expectedBalance < CRISIS_ACTION_REWARD) return failure();
      const completed = Object.freeze([...state.completed, id]);
      if (!traced.setItem(ACTION_KEY, JSON.stringify(completed))) throw new Error("Storage session changed");
      if (mutationFault || readFault || !matchesActions(readCrisisActions(traced), completed)) throw new Error("Crisis action marker could not be confirmed");
      requireTraceCurrent();
      const balance = addTokens(CRISIS_ACTION_REWARD, "Tokens earned", "app", traced);
      requireSynchronous(balance); requireTraceCurrent();
      if (typeof balance !== "number" || balance !== expectedBalance || readFault || mutationFault ||
        traced.getItem("coachfi-tokens") !== String(expectedBalance)) throw new Error("Crisis action reward could not be confirmed");
      if (!matchesActions(readCrisisActions(traced), completed) || readFault || mutationFault) throw new Error("Crisis action marker changed");
      requireTraceCurrent();
      committed.add(id);
      return result("saved", completed, balance);
    } catch { return failure(); }
    finally { active = false; inFlight = false; }
  }

  return Object.freeze({
    version: () => epoch,
    reset: () => { epoch += 1; committed.clear(); blocked = false; return epoch; },
    isOpen: (ticket: number, id?: CrisisActionId) => ticket === epoch && !blocked && !inFlight &&
      (id === undefined || (isActionId(id) && !committed.has(id))),
    run,
  });
}
