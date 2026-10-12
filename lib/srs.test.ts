import { describe, expect, it } from "vitest";

import { calculateNext, type SRSCard } from "@/lib/srs";

function card(partial: Partial<SRSCard> = {}): SRSCard {
  return { id: "q", interval: 1, repetitions: 0, easeFactor: 2.5, nextReview: "", ...partial };
}

describe("SM-2 calculateNext", () => {
  it("first correct answer → 1 day, reps 1, EF up by 0.1", () => {
    const next = calculateNext(card(), true);
    expect(next.interval).toBe(1);
    expect(next.repetitions).toBe(1);
    expect(next.easeFactor).toBeCloseTo(2.6, 5);
  });

  it("second correct answer → 6 days", () => {
    const next = calculateNext(card({ repetitions: 1, interval: 1 }), true);
    expect(next.interval).toBe(6);
    expect(next.repetitions).toBe(2);
  });

  it("third+ correct answer → round(interval * easeFactor)", () => {
    const next = calculateNext(card({ repetitions: 2, interval: 6, easeFactor: 2.6 }), true);
    expect(next.interval).toBe(Math.round(6 * 2.6)); // 16
  });

  it("wrong answer resets reps and interval, drops EF by 0.2", () => {
    const next = calculateNext(card({ repetitions: 5, interval: 60, easeFactor: 2.8 }), false);
    expect(next.repetitions).toBe(0);
    expect(next.interval).toBe(1);
    expect(next.easeFactor).toBeCloseTo(2.6, 5);
  });

  it("EF never drops below 1.3", () => {
    let c = card({ easeFactor: 1.3 });
    for (let i = 0; i < 5; i++) c = calculateNext(c, false);
    expect(c.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("interval is capped at 90 days (MAX_INTERVAL_DAYS)", () => {
    // A high-interval, high-EF card answered correctly must not exceed the cap.
    const next = calculateNext(card({ repetitions: 6, interval: 200, easeFactor: 3.0 }), true);
    expect(next.interval).toBeLessThanOrEqual(90);
  });

  it("repeated correct answers plateau at the 90-day cap, not unbounded growth", () => {
    let c = card();
    for (let i = 0; i < 10; i++) c = calculateNext(c, true);
    expect(c.interval).toBe(90);
  });

  it("nextReview is a valid YYYY-MM-DD string", () => {
    const next = calculateNext(card(), true);
    expect(next.nextReview).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
