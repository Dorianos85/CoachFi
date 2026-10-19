import { persistLearningState } from "@/lib/account-sync";
import { assertCurrentPersonalStorage, captureCurrentPersonalStorage, type PersonalStorageHandle } from "@/lib/product-storage";
import { notifyCloud } from "@/lib/sync/syncQueue";

const STREAK_KEY = "coachfi-streak";

export interface StreakData {
  lastActiveDate: string;
  currentStreak: number;
  longestStreak: number;
}

// Research basis (Lally et al. 2010, see docs/LEARNING_SCIENCE.md): habits take a
// median ~66 days to automate, and a single missed day does not derail formation.
// So we forgive one missed day (a "grace day") and only reset after two+ misses.
export const STREAK_MILESTONES = [3, 7, 14, 30, 66, 100, 365] as const;

function today(): string {
  return new Date().toISOString().split("T")[0];
}

/** Whole-day gap between two YYYY-MM-DD dates (Infinity if either is missing/invalid). */
function dayGap(fromStr: string, toStr: string): number {
  if (!fromStr || !toStr) return Infinity;
  const from = Date.parse(`${fromStr}T00:00:00Z`);
  const to = Date.parse(`${toStr}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return Infinity;
  return Math.round((to - from) / 86_400_000);
}

export type StreakReadState =
  | { status: "available"; data: StreakData }
  | { status: "unavailable"; data: null };

/** A failed read remains unknown; it is never evidence of an empty streak. */
export function readStreakState(storage: PersonalStorageHandle = captureCurrentPersonalStorage()): StreakReadState {
  try {
    if (typeof window === "undefined" || storage.isCurrent() !== true) {
      return { status: "unavailable", data: null };
    }
    const data = readStreakForWrite(storage, today());
    if (storage.isCurrent() !== true) return { status: "unavailable", data: null };
    return { status: "available", data };
  } catch {
    return { status: "unavailable", data: null };
  }
}

/** Legacy fallback shape; callers needing availability must use readStreakState. */
export function getStreak(storage: PersonalStorageHandle = captureCurrentPersonalStorage()): StreakData {
  return readStreakState(storage).data ?? { lastActiveDate: "", currentStreak: 0, longestStreak: 0 };
}

/**
 * Pure streak transition — testable without localStorage.
 * - same day            → no change (returns the same object reference)
 * - gap of 1 day        → +1 (consecutive day)
 * - gap of 2 days       → +1 (one missed day is forgiven: grace day)
 * - gap of 3+ days / none→ reset to 1
 */
export function computeStreak(data: StreakData, todayStr: string): StreakData {
  if (data.lastActiveDate === todayStr) return data;
  const gap = dayGap(data.lastActiveDate, todayStr);
  const continues = gap >= 1 && gap <= 2;
  const currentStreak = continues ? data.currentStreak + 1 : 1;
  return {
    lastActiveDate: todayStr,
    currentStreak,
    longestStreak: Math.max(currentStreak, data.longestStreak),
  };
}

/** Shared read admission; callers choose fallback display or strict mutation errors. */
function readStreakForWrite(storage: PersonalStorageHandle, todayStr: string): StreakData {
  const raw = storage.getItem(STREAK_KEY);
  assertCurrentPersonalStorage(storage);
  if (raw === null) return { lastActiveDate: "", currentStreak: 0, longestStreak: 0 };
  if (typeof raw !== "string") throw new Error("Stored streak is malformed");
  const value: unknown = JSON.parse(raw);
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Stored streak is malformed");
  }
  const data = value as Record<string, unknown>;
  if (!["lastActiveDate", "currentStreak", "longestStreak"].every((key) => Object.prototype.hasOwnProperty.call(data, key))) {
    throw new Error("Stored streak is malformed");
  }
  const { lastActiveDate, currentStreak, longestStreak } = data;
  if (typeof lastActiveDate !== "string" ||
      typeof currentStreak !== "number" || !Number.isSafeInteger(currentStreak) || currentStreak < 0 ||
      typeof longestStreak !== "number" || !Number.isSafeInteger(longestStreak) || longestStreak < currentStreak) {
    throw new Error("Stored streak is malformed");
  }
  if (lastActiveDate === "") {
    // This is the existing initial StreakData convention, not a repaired cache.
    if (currentStreak !== 0 || longestStreak !== 0) throw new Error("Stored streak is malformed");
  } else {
    const timestamp = Date.parse(lastActiveDate + "T00:00:00Z");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastActiveDate) || !Number.isFinite(timestamp) ||
        new Date(timestamp).toISOString().slice(0, 10) !== lastActiveDate || lastActiveDate > todayStr) {
      throw new Error("Stored streak is malformed");
    }
  }
  // Spread retains unknown own JSON members, including an own __proto__ key.
  return { ...data, lastActiveDate, currentStreak, longestStreak };
}

/** Local synchronous outcome of the existing writer, not a durable storage acknowledgement. */
export interface StreakActivityReceipt {
  readonly data: StreakData;
  readonly advanced: boolean;
}

export function markActiveTodayWithReceipt(storage: PersonalStorageHandle = captureCurrentPersonalStorage()): StreakActivityReceipt {
  assertCurrentPersonalStorage(storage);
  const todayStr = today();
  const data = readStreakForWrite(storage, todayStr);
  const computed = computeStreak(data, todayStr);
  if (computed === data) return { data, advanced: false }; // already counted today, retain exact stored bytes
  if (!Number.isSafeInteger(computed.currentStreak) || computed.currentStreak < 0 ||
      !Number.isSafeInteger(computed.longestStreak) || computed.longestStreak < computed.currentStreak) {
    throw new Error("Streak would exceed the safe integer range");
  }
  const next = { ...data, ...computed };
  assertCurrentPersonalStorage(storage);
  if (!storage.setItem(STREAK_KEY, JSON.stringify(next))) throw new Error("Storage session changed");
  assertCurrentPersonalStorage(storage);
  notifyCloud("streak");
  assertCurrentPersonalStorage(storage);
  persistLearningState("streak", storage);
  return { data: next, advanced: true };
}

export function markActiveToday(storage: PersonalStorageHandle = captureCurrentPersonalStorage()): StreakData {
  return markActiveTodayWithReceipt(storage).data;
}

export function isStreakAtRisk(): boolean {
  const data = getStreak();
  if (data.lastActiveDate === today()) return false;
  // at risk after 18:00
  return new Date().getHours() >= 18;
}

/** Returns the milestone hit exactly by this streak value, or null. */
export function reachedMilestone(streak: number): number | null {
  return (STREAK_MILESTONES as readonly number[]).includes(streak) ? streak : null;
}

/** Returns the next milestone above the current streak, or null if past the last one. */
export function nextMilestone(streak: number): number | null {
  return STREAK_MILESTONES.find((m) => m > streak) ?? null;
}
