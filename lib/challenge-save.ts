import { markChallengeCompleted } from "@/data/challengeQuestions";
import { addTokens, canAwardTokens } from "@/lib/tokens";
import type { PersonalStorageHandle } from "@/lib/product-storage";

const CHALLENGE_KEY = "coachfi-challenge";
export type DailyChallengeState = "available" | "completed" | "unavailable";
export type ChallengeSaveStatus = "saved" | "wrong" | "completed" | "retryable" | "uncertain" | "stopped" | "ignored";
export interface ChallengeSaveCommand {
  readonly questionId: string;
  readonly selectedAnswer: string;
  readonly correctAnswer: string;
  readonly reward: number;
}
export interface ChallengeSaveResult { readonly status: ChallengeSaveStatus; readonly earned?: number }
export interface ChallengeSaveController {
  version(): number;
  isOpen(ticket: number): boolean;
  reset(): number;
  run(ticket: number, storage: PersonalStorageHandle, command: ChallengeSaveCommand,
    activity?: () => void): ChallengeSaveResult;
}

/** Preserve unknown bytes. The existing completion day remains UTC; no migration. */
export function readDailyChallengeState(storage: PersonalStorageHandle): DailyChallengeState {
  try {
    if (typeof window === "undefined" || storage.isCurrent() !== true) return "unavailable";
    const raw = storage.getItem(CHALLENGE_KEY);
    if (typeof window === "undefined" || storage.isCurrent() !== true) return "unavailable";
    if (raw === null) return "available";
    if (typeof raw !== "string") return "unavailable";
    const marker: unknown = JSON.parse(raw);
    if (marker === null || typeof marker !== "object" || Array.isArray(marker) ||
      Object.keys(marker).length !== 1 || !Object.prototype.hasOwnProperty.call(marker, "date")) return "unavailable";
    const date = (marker as { date: unknown }).date;
    if (typeof date !== "string" || date.length !== 10 || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)) return "unavailable";
    const parsed = new Date(`${date}T00:00:00.000Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return "unavailable";
    const today = new Date().toISOString().slice(0, 10);
    if (date > today) return "unavailable";
    return date === today ? "completed" : "available";
  } catch { return "unavailable"; }
}

function requireSynchronous(value: unknown) {
  if (value === null || (typeof value !== "object" && typeof value !== "function") ||
    typeof (value as { then?: unknown }).then !== "function") return;
  if (value instanceof Promise) void Promise.prototype.then.call(value, undefined, () => undefined);
  throw new Error("Challenge save operations must be synchronous");
}

/** Bounded RAM quarantine; no rollback, journal or cross-tab/reload exactly-once claim. */
export function createChallengeSaveController(): ChallengeSaveController {
  let epoch = 0, inFlight = false, committed = false, blocked = false;
  const result = (status: ChallengeSaveStatus, earned?: number): ChallengeSaveResult =>
    Object.freeze(earned === undefined ? { status } : { status, earned });

  function run(ticket: number, storage: PersonalStorageHandle, command: ChallengeSaveCommand,
    activity?: () => void): ChallengeSaveResult {
    if (ticket !== epoch || committed || inFlight) return result("ignored");
    inFlight = true;
    let active = true, mutationAttempted = false, mutationFault = false, readFault = false;
    const current = () => {
      if (ticket !== epoch) return false;
      try { return storage.isCurrent() === true && ticket === epoch; } catch { return false; }
    };
    const requireTraceCurrent = () => {
      if (!active || !current()) throw new Error("Storage session changed");
      if (typeof window === "undefined") throw new Error("Challenge save requires a browser");
    };
    const failure = (): ChallengeSaveResult => {
      if (mutationAttempted && ticket === epoch) blocked = true;
      if (!current()) return result("stopped");
      return result(mutationAttempted ? "uncertain" : "retryable");
    };

    try {
      if (!current()) return result("stopped");
      if (blocked) return result("uncertain");
      if (typeof window === "undefined") return result("retryable");
      const traced: PersonalStorageHandle = Object.freeze({
        owner: storage.owner, revision: storage.revision, area: storage.area,
        isCurrent: () => active && current(),
        getItem: (key: string) => {
          try {
            requireTraceCurrent();
            const value = storage.getItem(key);
            requireSynchronous(value);
            requireTraceCurrent();
            if (value !== null && typeof value !== "string") throw new Error("Invalid storage read");
            return value;
          } catch (error) { readFault = true; throw error; }
        },
        setItem: (key: string, value: string) => {
          mutationAttempted = true;
          try {
            requireTraceCurrent();
            if (readFault) throw new Error("Challenge save read failed");
            const written = storage.setItem(key, value);
            requireSynchronous(written);
            if (written !== true) mutationFault = true;
            requireTraceCurrent();
            return written === true;
          } catch (error) { mutationFault = true; throw error; }
        },
        removeItem: (key: string) => {
          mutationAttempted = true;
          try {
            requireTraceCurrent();
            if (readFault) throw new Error("Challenge save read failed");
            const removed = storage.removeItem(key);
            requireSynchronous(removed);
            if (removed !== true) mutationFault = true;
            requireTraceCurrent();
            return removed === true;
          } catch (error) { mutationFault = true; throw error; }
        },
        release: () => { requireTraceCurrent(); storage.release(); },
      });
      const state = readDailyChallengeState(traced);
      if (!current()) return failure();
      if (state === "unavailable" || readFault) return failure();
      if (state === "completed") { committed = true; return result("completed"); }
      const { questionId, selectedAnswer, correctAnswer, reward } = command;
      requireTraceCurrent();
      if (typeof questionId !== "string" || questionId.trim().length === 0 ||
        typeof selectedAnswer !== "string" || !/^[A-D]$/.test(selectedAnswer) ||
        typeof correctAnswer !== "string" || !/^[A-D]$/.test(correctAnswer) ||
        typeof reward !== "number" || !Number.isSafeInteger(reward) || reward < 0) return failure();
      if (selectedAnswer !== correctAnswer) { committed = true; return result("wrong"); }
      const eligible = canAwardTokens(reward, traced);
      requireSynchronous(eligible);
      requireTraceCurrent();
      if (eligible !== true || readFault) return failure();
      const previousBalanceBytes = traced.getItem("coachfi-tokens");
      const confirmedBalance = addTokens(reward, "Daily challenge", "daily_challenge", traced);
      requireSynchronous(confirmedBalance);
      requireTraceCurrent();
      if (readFault || mutationFault || typeof confirmedBalance !== "number" ||
        !Number.isSafeInteger(confirmedBalance) || confirmedBalance < 0) throw new Error("Challenge save storage access failed");
      const rewardBalanceBytes = traced.getItem("coachfi-tokens");
      if (reward > 0 ? rewardBalanceBytes !== String(confirmedBalance) : rewardBalanceBytes !== previousBalanceBytes) {
        throw new Error("Challenge reward could not be confirmed");
      }
      requireSynchronous(markChallengeCompleted(traced));
      requireTraceCurrent();
      if (readFault || mutationFault) throw new Error("Challenge save storage access failed");
      if (activity) { requireSynchronous(activity()); requireTraceCurrent(); }
      const finalBalanceBytes = traced.getItem("coachfi-tokens");
      // The existing synchronous activity may award an additional streak milestone bonus.
      const finalBalance = finalBalanceBytes === null ? null : Number(finalBalanceBytes);
      const missingZeroBalance = reward === 0 && previousBalanceBytes === null && finalBalanceBytes === null;
      if (!missingZeroBalance && (finalBalanceBytes === null || finalBalance === null ||
        !Number.isSafeInteger(finalBalance) || finalBalance < confirmedBalance || String(finalBalance) !== finalBalanceBytes)) {
        throw new Error("Challenge reward could not be confirmed");
      }
      if (readDailyChallengeState(traced) !== "completed" || readFault || mutationFault) {
        throw new Error("Challenge completion could not be confirmed");
      }
      requireTraceCurrent();
      committed = true;
      return result("saved", reward);
    } catch { return failure(); }
    finally { active = false; inFlight = false; }
  }

  return Object.freeze({
    version: () => epoch,
    isOpen: (ticket: number) => ticket === epoch && !committed && !blocked && !inFlight,
    reset: () => { epoch += 1; committed = false; blocked = false; return epoch; },
    run,
  });
}
