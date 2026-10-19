"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { readStreakState, markActiveTodayWithReceipt, reachedMilestone, type StreakData } from "@/lib/streak";
import { addTokens } from "@/lib/tokens";
import { cancelScheduledNotifications, scheduleStreakReminder } from "@/lib/notifications";
import { useProductStorage } from "@/lib/use-product-storage";

// Coin bonus per milestone day (3→15 … 66→330). Awarded once, when the streak
// first reaches the milestone — computeStreak is a no-op for repeat same-day calls.
const MILESTONE_BONUS_MULTIPLIER = 5;

interface StreakContextValue {
  streak: StreakData;
  streakStatus: "loading" | "available" | "unavailable";
  markActive: () => void;
}

const StreakContext = createContext<StreakContextValue>({
  streak: { lastActiveDate: "", currentStreak: 0, longestStreak: 0 },
  streakStatus: "loading",
  markActive: () => {},
});

export function StreakProvider({ children }: { children: ReactNode }) {
  const { storage } = useProductStorage();
  const [streak, setStreak] = useState<StreakData>({
    lastActiveDate: "",
    currentStreak: 0,
    longestStreak: 0,
  });
  const [readState, setReadState] = useState<{
    revision: number;
    status: StreakContextValue["streakStatus"];
  }>({ revision: storage.revision, status: "loading" });

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (!active || !storage.isCurrent()) return;
      const result = readStreakState(storage);
      if (!active || !storage.isCurrent()) return;
      if (result.status === "available") {
        setStreak(result.data);
        setReadState({ revision: storage.revision, status: "available" });
        scheduleStreakReminder(result.data.currentStreak, storage);
      } else {
        setReadState({ revision: storage.revision, status: "unavailable" });
        cancelScheduledNotifications(storage);
      }
    };
    refresh();
    window.addEventListener("coachfi-cloud-synced", refresh);
    window.addEventListener("coachfi-learning", refresh);
    return () => {
      active = false;
      cancelScheduledNotifications(storage);
      window.removeEventListener("coachfi-cloud-synced", refresh);
      window.removeEventListener("coachfi-learning", refresh);
    };
  }, [storage]);

  const markActive = useCallback(() => {
    if (!storage.isCurrent()) return;
    let receipt: ReturnType<typeof markActiveTodayWithReceipt>;
    try {
      receipt = markActiveTodayWithReceipt(storage);
    } catch (error) {
      if (storage.isCurrent()) {
        setReadState({ revision: storage.revision, status: "unavailable" });
        cancelScheduledNotifications(storage);
      }
      throw error;
    }
    const { data: next, advanced } = receipt;
    if (!storage.isCurrent()) return;
    setStreak(next);
    setReadState({ revision: storage.revision, status: "available" });
    scheduleStreakReminder(next.currentStreak, storage);

    // Award a one-time coin bonus when the streak first hits a milestone.
    if (advanced) {
      const milestone = reachedMilestone(next.currentStreak);
      if (milestone) {
        addTokens(
          milestone * MILESTONE_BONUS_MULTIPLIER,
          `Streak milestone: ${milestone} days`,
          "streak_bonus", storage
        );
      }
    }
  }, [storage]);

  const streakStatus: StreakContextValue["streakStatus"] =
    readState.revision !== storage.revision || readState.status === "loading"
      ? "loading"
      : storage.isCurrent() ? readState.status : "unavailable";
  // The legacy shape is a placeholder while unknown, never confirmed zero.
  const visibleStreak = streakStatus === "available"
    ? streak
    : { lastActiveDate: "", currentStreak: 0, longestStreak: 0 };

  return (
    <StreakContext.Provider value={{ streak: visibleStreak, streakStatus, markActive }}>
      {children}
    </StreakContext.Provider>
  );
}

export function useStreak() {
  return useContext(StreakContext);
}
