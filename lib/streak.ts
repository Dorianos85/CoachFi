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

export function getStreak(): StreakData {
  if (typeof window === "undefined") return { lastActiveDate: "", currentStreak: 0, longestStreak: 0 };
  try {
    const stored = localStorage.getItem(STREAK_KEY);
    if (!stored) return { lastActiveDate: "", currentStreak: 0, longestStreak: 0 };
    return JSON.parse(stored) as StreakData;
  } catch {
    return { lastActiveDate: "", currentStreak: 0, longestStreak: 0 };
  }
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

export function markActiveToday(): StreakData {
  const data = getStreak();
  const next = computeStreak(data, today());
  if (next === data) return data; // already counted today
  localStorage.setItem(STREAK_KEY, JSON.stringify(next));
  notifyCloud("streak");
  return next;
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
