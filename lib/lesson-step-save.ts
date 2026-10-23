import { moneyMindsetLesson } from "@/data/moneyMindsetLesson";
import { stageLessons } from "@/data/stageLessons";
import type { PersonalStorageHandle } from "@/lib/product-storage";

const STEPS_KEY = "coachfi-lesson-steps";
export type LessonStepSaveStatus = "retryable" | "uncertain" | "stopped";
export class LessonStepSaveError extends Error {
  readonly status: LessonStepSaveStatus;
  constructor(status: LessonStepSaveStatus) { super(status === "stopped" ? "Storage session changed" : `Lesson step save ${status}`); this.name = "LessonStepSaveError"; this.status = status; }
}
export type LessonStepState = { readonly status: "ready"; readonly steps: Readonly<Record<string, number>> } |
  { readonly status: "unavailable" };

function requireSynchronous(value: unknown) {
  if (value === null || (typeof value !== "object" && typeof value !== "function") ||
    typeof (value as { then?: unknown }).then !== "function") return;
  if (value instanceof Promise) void Promise.prototype.then.call(value, undefined, () => undefined);
  throw new Error("Lesson step operations must be synchronous");
}
function storageIsCurrent(storage: PersonalStorageHandle) {
  const value = storage.isCurrent(); requireSynchronous(value); return value === true;
}
function validCounts(counts: Readonly<Record<string, number>>) {
  const actual = { "money-mindset": moneyMindsetLesson.en.steps.length,
    ...Object.fromEntries(Object.entries(stageLessons).map(([id, lesson]) => [id, lesson.copy.en.steps.length])) };
  if (!counts || typeof counts !== "object" || Array.isArray(counts) || Object.keys(counts).length !== Object.keys(actual).length) return false;
  return Object.entries(actual).every(([id, count]) => Object.hasOwn(counts, id) &&
    Number.isSafeInteger(counts[id]) && counts[id] > 0 && counts[id] === count);
}

/** Strict data admission; an unavailable cache is never a writable empty cache. */
export function readLessonStepState(storage: PersonalStorageHandle, counts: Readonly<Record<string, number>>): LessonStepState {
  const unavailable = (): LessonStepState => Object.freeze({ status: "unavailable" });
  try {
    if (typeof window === "undefined" || !storageIsCurrent(storage) || !validCounts(counts)) return unavailable();
    const raw = storage.getItem(STEPS_KEY); requireSynchronous(raw);
    if (typeof window === "undefined" || !storageIsCurrent(storage)) return unavailable();
    if (raw === null) return Object.freeze({ status: "ready", steps: Object.freeze({}) });
    if (typeof raw !== "string") return unavailable();
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return unavailable();
    for (const [id, value] of Object.entries(parsed)) {
      if (!Object.hasOwn(counts, id) || typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > counts[id]) return unavailable();
    }
    return Object.freeze({ status: "ready", steps: Object.freeze({ ...parsed }) as Readonly<Record<string, number>> });
  } catch { return unavailable(); }
}

function sameSteps(state: LessonStepState, expected: Readonly<Record<string, number>>) {
  return state.status === "ready" && Object.keys(state.steps).length === Object.keys(expected).length &&
    Object.entries(expected).every(([id, value]) => Object.hasOwn(state.steps, id) && state.steps[id] === value);
}

/** Synchronous owner-bound mutation; failures report uncertainty, never rollback. */
export function saveLessonStep(stageId: string, step: number, storage: PersonalStorageHandle,
  counts: Readonly<Record<string, number>>, notify: () => void): void {
  let active = true, mutationAttempted = false, mutationFault = false, readFault = false;
  const current = () => { try { return storageIsCurrent(storage); } catch { return false; } };
  const requireCurrent = () => {
    if (!active || !current()) throw new LessonStepSaveError("stopped");
    if (typeof window === "undefined") throw new LessonStepSaveError(mutationAttempted ? "uncertain" : "retryable");
  };
  try {
    requireCurrent();
    if (!validCounts(counts) || typeof stageId !== "string" || !Object.hasOwn(counts, stageId) ||
      typeof step !== "number" || !Number.isSafeInteger(step) || step < 1 || step > counts[stageId]) throw new Error("Invalid lesson step input");
    const traced: PersonalStorageHandle = Object.freeze({
      owner: storage.owner, revision: storage.revision, area: storage.area, isCurrent: () => active && current(),
      getItem: (key: string) => {
        try { requireCurrent(); const value = storage.getItem(key); requireSynchronous(value); requireCurrent();
          if (value !== null && typeof value !== "string") throw new Error("Invalid storage read"); return value;
        } catch (error) { readFault = true; throw error; }
      },
      setItem: (key: string, value: string) => {
        mutationAttempted = true;
        try { requireCurrent(); if (readFault) throw new Error("Lesson step read failed");
          const written = storage.setItem(key, value); requireSynchronous(written); if (written !== true) mutationFault = true;
          requireCurrent(); return written === true;
        } catch (error) { mutationFault = true; throw error; }
      },
      removeItem: (key: string) => {
        mutationAttempted = true;
        try { requireCurrent(); if (readFault) throw new Error("Lesson step read failed");
          const removed = storage.removeItem(key); requireSynchronous(removed); if (removed !== true) mutationFault = true;
          requireCurrent(); return removed === true;
        } catch (error) { mutationFault = true; throw error; }
      },
      release: () => { requireCurrent(); storage.release(); },
    });
    const state = readLessonStepState(traced, counts); requireCurrent();
    if (state.status !== "ready" || readFault) throw new Error("Lesson step cache unavailable");
    if ((state.steps[stageId] ?? 0) >= step) return;
    const expected = { ...state.steps, [stageId]: step };
    if (!traced.setItem(STEPS_KEY, JSON.stringify(expected))) throw new Error("Lesson step writer refused");
    if (mutationFault || readFault || !sameSteps(readLessonStepState(traced, counts), expected)) throw new Error("Lesson step write unconfirmed");
    requireCurrent(); requireSynchronous(notify()); requireCurrent();
    if (mutationFault || readFault || !sameSteps(readLessonStepState(traced, counts), expected)) throw new Error("Lesson step changed after notification");
    requireCurrent();
  } catch {
    throw new LessonStepSaveError(!current() ? "stopped" : mutationAttempted ? "uncertain" : "retryable");
  } finally { active = false; }
}
