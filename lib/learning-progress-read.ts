import { getAllStageProgress, type StageProgress } from "@/lib/learningProgress";
import type { PersonalStorageHandle } from "@/lib/product-storage";
import { readReviewCards } from "@/lib/review-save";

const SRS_KEY = "coachfi-srs";
const MANUAL_KEY = "coachfi-learn-manual";

function observeNativePromise(value: unknown): void {
  if (value instanceof Promise) void Promise.prototype.then.call(value, undefined, () => undefined);
}

/** Strict read-only boundary; unavailable data never becomes confirmed empty progress. */
export function readStageProgress(storage: PersonalStorageHandle): StageProgress[] {
  let failure: string | null = null;
  const fail = (message = "Learning progress read unavailable"): never => {
    failure ??= message;
    throw new Error(failure);
  };
  const requireCurrent = (): void => {
    if (failure !== null) throw new Error(failure);
    if (typeof window === "undefined") fail("Storage session changed");
    let current: unknown;
    try { current = storage.isCurrent(); } catch { fail("Storage session changed"); }
    observeNativePromise(current);
    if (current !== true) fail("Storage session changed");
  };
  const readRaw = (key: string): string | null => {
    requireCurrent();
    let value: unknown;
    try { value = storage.getItem(key); } catch {
      requireCurrent();
      return fail();
    }
    observeNativePromise(value);
    requireCurrent();
    if (value !== null && typeof value !== "string") return fail();
    return value;
  };

  requireCurrent();
  const metadata = { owner: storage.owner, revision: storage.revision, area: storage.area };
  requireCurrent();
  const readonlyHandle = (read: (key: string) => string | null): PersonalStorageHandle => Object.freeze({
    ...metadata,
    isCurrent: () => { requireCurrent(); return true; },
    getItem: read,
    setItem: () => fail("Learning progress snapshot is read only"),
    removeItem: () => fail("Learning progress snapshot is read only"),
    release: () => fail("Learning progress snapshot is read only"),
  });

  let srsRaw: string | null = null;
  let srsCaptured = false;
  readReviewCards(readonlyHandle(key => {
    if (key !== SRS_KEY || srsCaptured) return fail();
    srsRaw = readRaw(key);
    srsCaptured = true;
    return srsRaw;
  }));
  requireCurrent();

  const manualRaw = readRaw(MANUAL_KEY);
  if (manualRaw !== null) {
    let manual: unknown;
    try { manual = JSON.parse(manualRaw); } catch { return fail(); }
    if (manual === null || typeof manual !== "object" || Array.isArray(manual) ||
      Object.getPrototypeOf(manual) !== Object.prototype ||
      !Object.values(manual).every(value => value === "started" || value === "completed")) {
      return fail();
    }
  }
  requireCurrent();

  const snapshot = readonlyHandle(key => {
    requireCurrent();
    if (key !== SRS_KEY && key !== MANUAL_KEY) return fail();
    const value = key === SRS_KEY ? srsRaw : manualRaw;
    requireCurrent();
    return value;
  });
  const progress = getAllStageProgress(snapshot);
  requireCurrent();
  return progress;
}
