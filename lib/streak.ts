const STREAK_KEY = "coachfi-streak";

export interface StreakData {
  lastActiveDate: string;
  currentStreak: number;
  longestStreak: number;
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function yesterday(): string {
  return new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
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

export function markActiveToday(): StreakData {
  const t = today();
  const data = getStreak();
  if (data.lastActiveDate === t) return data;

  const newStreak = data.lastActiveDate === yesterday() ? data.currentStreak + 1 : 1;
  const next: StreakData = {
    lastActiveDate: t,
    currentStreak: newStreak,
    longestStreak: Math.max(newStreak, data.longestStreak),
  };
  localStorage.setItem(STREAK_KEY, JSON.stringify(next));
  return next;
}

export function isStreakAtRisk(): boolean {
  const data = getStreak();
  const t = today();
  if (data.lastActiveDate === t) return false;
  // at risk after 18:00
  return new Date().getHours() >= 18;
}
