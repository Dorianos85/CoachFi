import { describe, expect, it } from "vitest";

import {
  computeStreak,
  nextMilestone,
  reachedMilestone,
  type StreakData,
} from "@/lib/streak";

function s(partial: Partial<StreakData> = {}): StreakData {
  return { lastActiveDate: "", currentStreak: 0, longestStreak: 0, ...partial };
}

describe("computeStreak (grace-day logic)", () => {
  it("same day is a no-op (returns same reference)", () => {
    const data = s({ lastActiveDate: "2026-06-13", currentStreak: 5, longestStreak: 5 });
    expect(computeStreak(data, "2026-06-13")).toBe(data);
  });

  it("consecutive day (gap 1) increments the streak", () => {
    const next = computeStreak(s({ lastActiveDate: "2026-06-12", currentStreak: 5, longestStreak: 5 }), "2026-06-13");
    expect(next.currentStreak).toBe(6);
  });

  it("ONE missed day (gap 2) is forgiven — streak continues", () => {
    const next = computeStreak(s({ lastActiveDate: "2026-06-11", currentStreak: 5, longestStreak: 5 }), "2026-06-13");
    expect(next.currentStreak).toBe(6);
  });

  it("TWO+ missed days (gap 3) resets the streak to 1", () => {
    const next = computeStreak(s({ lastActiveDate: "2026-06-10", currentStreak: 5, longestStreak: 5 }), "2026-06-13");
    expect(next.currentStreak).toBe(1);
  });

  it("first ever activity (no prior date) starts at 1", () => {
    const next = computeStreak(s(), "2026-06-13");
    expect(next.currentStreak).toBe(1);
  });

  it("longestStreak is preserved when current resets", () => {
    const next = computeStreak(s({ lastActiveDate: "2026-06-01", currentStreak: 9, longestStreak: 9 }), "2026-06-13");
    expect(next.currentStreak).toBe(1);
    expect(next.longestStreak).toBe(9);
  });

  it("longestStreak grows with current", () => {
    const next = computeStreak(s({ lastActiveDate: "2026-06-12", currentStreak: 9, longestStreak: 9 }), "2026-06-13");
    expect(next.longestStreak).toBe(10);
  });
});

describe("streak milestones", () => {
  it("66-day milestone exists (Lally automaticity)", () => {
    expect(reachedMilestone(66)).toBe(66);
  });
  it("non-milestone values return null", () => {
    expect(reachedMilestone(65)).toBeNull();
  });
  it("nextMilestone points to the next threshold", () => {
    expect(nextMilestone(7)).toBe(14);
    expect(nextMilestone(30)).toBe(66);
  });
  it("nextMilestone is null past the last milestone", () => {
    expect(nextMilestone(1000)).toBeNull();
  });
});
