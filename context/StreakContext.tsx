"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { getStreak, markActiveToday, type StreakData } from "@/lib/streak";
import { scheduleStreakReminder } from "@/lib/notifications";

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
    const data = getStreak();
    setStreak(data);
    scheduleStreakReminder(data.currentStreak);
  }, []);

  const markActive = useCallback(() => {
    const next = markActiveToday();
    setStreak(next);
    scheduleStreakReminder(next.currentStreak);
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
