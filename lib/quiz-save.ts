import type { PersonalStorageHandle } from "@/lib/product-storage";

export type QuizSaveStatus = "saved" | "retryable" | "uncertain" | "stopped" | "ignored";
export interface QuizSaveResult { readonly status: QuizSaveStatus }
export interface QuizSaveController {
  version(): number;
  reset(): number;
  run(ticket: number, storage: PersonalStorageHandle, record: (tracedStorage: PersonalStorageHandle) => void,
    reward?: () => void): QuizSaveResult;
}

function requireSynchronous(value: unknown) {
  if (value === null || (typeof value !== "object" && typeof value !== "function") ||
    typeof (value as { then?: unknown }).then !== "function") return;
  // No await/replay. Observe rejection only for a native promise, not arbitrary thenables.
  if (value instanceof Promise) void Promise.prototype.then.call(value, undefined, () => undefined);
  throw new Error("Quiz save callbacks must be synchronous");
}

/** One in-memory attempt per ticket; uncertainty is quarantine, never a rollback claim. */
export function createQuizSaveController(): QuizSaveController {
  let epoch = 0, inFlight = false, committed = false, blocked = false;
  const result = (status: QuizSaveStatus): QuizSaveResult => Object.freeze({ status });

  function run(ticket: number, storage: PersonalStorageHandle, record: (tracedStorage: PersonalStorageHandle) => void,
    reward?: () => void): QuizSaveResult {
    if (ticket !== epoch || committed || inFlight) return result("ignored");
    inFlight = true;
    let active = true, mutationAttempted = false, mutationFault = false, readFault = false;
    const current = () => {
      if (ticket !== epoch) return false;
      try { return storage.isCurrent() === true && ticket === epoch; } catch { return false; }
    };
    const requireTraceCurrent = () => {
      if (!active || !current()) throw new Error("Storage session changed");
      if (typeof window === "undefined") throw new Error("Quiz save requires a browser");
    };
    const failure = (): QuizSaveResult => {
      if (mutationAttempted && ticket === epoch) blocked = true;
      if (!current()) return result("stopped");
      return result(mutationAttempted ? "uncertain" : "retryable");
    };

    try {
      if (!current()) return result("stopped");
      if (blocked) return result("uncertain");
      if (typeof window === "undefined") return result("retryable");
      // Access probe only. Existing helpers own their value/schema rules.
      for (const key of ["coachfi-srs", "coachfi-tokens"]) {
        storage.getItem(key);
        if (!current()) return result("stopped");
      }
      if (typeof window === "undefined") return result("retryable");
      const traced: PersonalStorageHandle = Object.freeze({
        owner: storage.owner, revision: storage.revision, area: storage.area,
        isCurrent: () => active && current(),
        getItem: (key: string) => {
          try {
            requireTraceCurrent();
            const value = storage.getItem(key);
            requireTraceCurrent();
            return value;
          } catch (error) { readFault = true; throw error; }
        },
        setItem: (key: string, value: string) => {
          mutationAttempted = true;
          try {
            requireTraceCurrent();
            if (readFault) throw new Error("Quiz save read failed");
            const written = storage.setItem(key, value);
            if (!written) mutationFault = true;
            requireTraceCurrent();
            return written;
          } catch (error) { mutationFault = true; throw error; }
        },
        removeItem: (key: string) => {
          mutationAttempted = true;
          try {
            requireTraceCurrent();
            if (readFault) throw new Error("Quiz save read failed");
            const removed = storage.removeItem(key);
            if (!removed) mutationFault = true;
            requireTraceCurrent();
            return removed;
          } catch (error) { mutationFault = true; throw error; }
        },
        release: () => { requireTraceCurrent(); storage.release(); },
      });

      requireSynchronous(record(traced));
      if (!current()) return failure();
      if (readFault || mutationFault) throw new Error("Quiz save storage access failed");
      // The untraced reward is safe to classify only because recordAnswer attempts SRS first.
      if (!mutationAttempted) throw new Error("Quiz save record must use traced storage");
      if (reward) {
        if (typeof window === "undefined") throw new Error("Quiz save requires a browser");
        requireSynchronous(reward());
        if (!current()) return failure();
      }
      committed = true; // Set before callers update feedback, navigation or completion UI.
      return result("saved");
    } catch {
      return failure();
    } finally {
      active = false;
      inFlight = false;
    }
  }

  return Object.freeze({
    version: () => epoch,
    reset: () => { epoch += 1; committed = false; blocked = false; return epoch; },
    run,
  });
}
