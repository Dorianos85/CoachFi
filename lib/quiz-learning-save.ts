import type { PersonalStorageHandle } from "@/lib/product-storage";
import { createReviewSaveController, type ReviewSaveContext, type ReviewSaveStatus, type ReviewSaveTicket } from "@/lib/review-save";
import { canAwardTokens, getTokenBalance } from "@/lib/tokens";

export type QuizLearningSaveTicket = ReviewSaveTicket;
export type QuizLearningSaveContext = ReviewSaveContext;
export type QuizLearningSaveStatus = ReviewSaveStatus;
export interface QuizLearningSaveReward {
  readonly amount: number;
  readonly award: (amount: number, tracedStorage: PersonalStorageHandle) => number;
  readonly activity?: (tracedStorage: PersonalStorageHandle) => void;
}
export interface QuizLearningSaveResult {
  readonly status: QuizLearningSaveStatus;
  readonly reason?: "token-validation";
  readonly balance?: number;
}
export interface QuizLearningSaveController {
  begin(storage: PersonalStorageHandle, context: QuizLearningSaveContext): QuizLearningSaveTicket;
  retire(ticket?: QuizLearningSaveTicket): void;
  current(ticket: QuizLearningSaveTicket, storage: PersonalStorageHandle): boolean;
  isOpen(ticket: QuizLearningSaveTicket, storage: PersonalStorageHandle): boolean;
  issue(storage: PersonalStorageHandle): "uncertain" | null;
  run(ticket: QuizLearningSaveTicket, storage: PersonalStorageHandle,
    record: (tracedStorage: PersonalStorageHandle) => void, reward?: QuizLearningSaveReward): QuizLearningSaveResult;
}

const TOKENS = "coachfi-tokens";
function requireCurrent(storage: PersonalStorageHandle) {
  if (typeof window === "undefined" || storage.isCurrent() !== true) throw new Error("Storage session changed");
}
function requireSynchronous(value: unknown) {
  if (value === null || (typeof value !== "object" && typeof value !== "function") ||
    typeof (value as { then?: unknown }).then !== "function") return;
  if (value instanceof Promise) void Promise.prototype.then.call(value, undefined, () => undefined);
  throw new Error("Quiz reward phases must be synchronous");
}
function tokenSnapshot(storage: PersonalStorageHandle, amount: number) {
  requireCurrent(storage);
  const raw = storage.getItem(TOKENS);
  requireCurrent(storage);
  // Reuse the existing token schema and rounding rules on this exact captured read.
  const snapshot: PersonalStorageHandle = Object.freeze({ ...storage,
    getItem: (key: string) => key === TOKENS ? raw : storage.getItem(key),
  });
  if (!canAwardTokens(amount, snapshot)) throw new Error("Quiz reward token validation rejected");
  const balance = getTokenBalance(snapshot);
  requireCurrent(storage);
  const delta = Math.round(amount), expected = balance + delta;
  if (!Number.isSafeInteger(expected) || expected < 0) throw new Error("Quiz reward balance is unavailable");
  return Object.freeze({ raw, balance, delta, expected });
}

/** Phased reward receipt inside the existing strict SRS admission and RAM quarantine. */
export function createQuizLearningSaveController(): QuizLearningSaveController {
  const delegate = createReviewSaveController();
  return Object.freeze({
    begin: delegate.begin,
    retire: delegate.retire,
    current: delegate.current,
    isOpen: delegate.isOpen,
    issue: delegate.issue,
    run(ticket: QuizLearningSaveTicket, storage: PersonalStorageHandle,
      record: (tracedStorage: PersonalStorageHandle) => void, reward?: QuizLearningSaveReward): QuizLearningSaveResult {
      let tokenRejected = false;
      let prepared: { trace: PersonalStorageHandle; reward: QuizLearningSaveReward;
        before: ReturnType<typeof tokenSnapshot> } | undefined;
      let confirmedBalance: number | undefined;
      const result = delegate.run(ticket, storage, traced => {
        if (reward !== undefined) {
          try {
            const amount = reward.amount, award = reward.award, activity = reward.activity;
            if (typeof award !== "function" || (activity !== undefined && typeof activity !== "function")) {
              throw new Error("Quiz reward phases are unavailable");
            }
            const before = tokenSnapshot(traced, amount);
            prepared = { trace: traced, before, reward: Object.freeze({ amount, award, activity }) };
          } catch (error) { tokenRejected = true; throw error; }
        }
        return record(traced);
      }, reward === undefined ? undefined : () => {
        if (!prepared) throw new Error("Quiz reward preflight is unavailable");
        const { trace, before, reward: phases } = prepared;
        const beforeAward = tokenSnapshot(trace, 0);
        if (beforeAward.raw !== before.raw) throw new Error("Quiz reward balance changed after preflight");
        const receipt: unknown = phases.award(phases.amount, trace);
        requireSynchronous(receipt);
        requireCurrent(trace);
        if (typeof receipt !== "number" || receipt !== before.expected || !Number.isSafeInteger(receipt)) {
          throw new Error("Quiz reward receipt was not confirmed");
        }
        const awarded = tokenSnapshot(trace, 0);
        const expectedRaw = before.delta === 0 ? before.raw : String(before.expected);
        if (awarded.raw !== expectedRaw) throw new Error("Quiz reward write was not confirmed");
        // A streak bonus can increase the balance, but cannot stand in for the reward above.
        if (phases.activity) {
          requireCurrent(trace);
          requireSynchronous(phases.activity(trace));
          requireCurrent(trace);
        }
        const final = tokenSnapshot(trace, 0);
        if ((final.raw === null && !(before.raw === null && before.delta === 0)) || final.balance < before.expected) {
          throw new Error("Quiz reward balance changed before completion");
        }
        confirmedBalance = final.balance;
      });
      if (result.status === "retryable" && tokenRejected) return Object.freeze({ status: "retryable", reason: "token-validation" });
      if (result.status === "saved" && confirmedBalance !== undefined) return Object.freeze({ status: "saved", balance: confirmedBalance });
      return Object.freeze({ status: result.status });
    },
  });
}
