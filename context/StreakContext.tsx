"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { getStreak, markActiveToday, reachedMilestone, type StreakData } from "@/lib/streak";
import { addTokens } from "@/lib/tokens";
import { scheduleStreakReminder } from "@/lib/notifications";

// Coin bonus per milestone day (3→15 … 66→330). Awarded once, when the streak
// first reaches the milestone — computeStreak is a no-op for repeat same-day calls.
const MILESTONE_BONUS_MULTIPLIER = 5;

interface StreakContextValue {
  streak: StreakData;
  markActive: () => void;
}

const StreakContext = createContext<StreakContextValue>({
  streak: { lastActiveDate: "", currentStreak: 0, longestStreak: 0 },
  markActive: () => {},
});

export function StreakProvider({ children }: { children: ReactNode }) {
  const [streak, setStreak] = useState<StreakData>({
    lastActiveDate: "",
    currentStreak: 0,
    longestStreak: 0,
  });

  useEffect(() => {
    const refresh = () => {
      const data = getStreak();
      setStreak(data);
      scheduleStreakReminder(data.currentStreak);
    };
    refresh();
    window.addEventListener("coachfi-cloud-synced", refresh);
    window.addEventListener("coachfi-learning", refresh);
    return () => {
      window.removeEventListener("coachfi-cloud-synced", refresh);
      window.removeEventListener("coachfi-learning", refresh);
    };
  }, []);

  const markActive = useCallback(() => {
    const before = getStreak();
    const next = markActiveToday();
    setStreak(next);
    scheduleStreakReminder(next.currentStreak);

    // Award a one-time coin bonus when the streak first hits a milestone.
    if (next.currentStreak !== before.currentStreak) {
      const milestone = reachedMilestone(next.currentStreak);
      if (milestone) {
        addTokens(
          milestone * MILESTONE_BONUS_MULTIPLIER,
          `Streak milestone: ${milestone} days`,
          "streak_bonus"
        );
      }
    }
  }, []);

  return (
    <StreakContext.Provider value={{ streak, markActive }}>
      {children}
    </StreakContext.Provider>
  );
}

export function useStreak() {
  return useContext(StreakContext);
}
