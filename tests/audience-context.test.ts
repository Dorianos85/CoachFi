import { describe, expect, it } from "vitest";
import { createLearningPaths, isGoalForSegment, isPublicLearningEntry, isSharedLearningShell,
  transitionLearningPaths, type LearningPathMutation, type LearningSegment } from "@/lib/learning-paths";

describe("separate local learning paths", () => {
  it("creates fresh independent sessions without a completed step", () => {
    const first = createLearningPaths();
    const second = createLearningPaths();
    expect(first).toEqual({
      adult: { goal: null, lessonRead: false, answer: null, actionPlanned: false },
      family: { goal: null, lessonRead: false, answer: null, actionPlanned: false },
    });
    expect(first.adult).not.toBe(first.family);
    expect(first.adult).not.toBe(second.adult);
  });

  it.each<LearningSegment>(["adult", "family"])("enforces goal → lesson → correct answer → plan in %s", (segment) => {
    let paths = createLearningPaths();
    const original = paths;
    for (const mutation of [{ type: "lesson", segment }, { type: "answer", segment, answer: "b" },
      { type: "action", segment }] as LearningPathMutation[]) {
      expect(transitionLearningPaths(paths, mutation)).toBe(paths);
    }
    paths = transitionLearningPaths(paths, { type: "goal", segment, goal: segment === "adult" ? "budget" : "needs" });
    expect(transitionLearningPaths(paths, { type: "answer", segment, answer: "b" })).toBe(paths);
    paths = transitionLearningPaths(paths, { type: "lesson", segment });
    paths = transitionLearningPaths(paths, { type: "answer", segment, answer: "a" });
    expect(transitionLearningPaths(paths, { type: "action", segment })).toBe(paths);
    paths = transitionLearningPaths(paths, { type: "answer", segment, answer: "b" });
    paths = transitionLearningPaths(paths, { type: "action", segment });
    expect(paths[segment]).toEqual({ goal: segment === "adult" ? "budget" : "needs", lessonRead: true,
      answer: "b", actionPlanned: true });
    expect(original[segment].goal).toBeNull();
    expect(paths[segment === "adult" ? "family" : "adult"]).toBe(original[segment === "adult" ? "family" : "adult"]);
  });

  it("rejects foreign goals, malformed segments and malformed answers at runtime", () => {
    let paths = createLearningPaths();
    for (const mutation of [
      null, { type: "goal", segment: "adult", goal: "needs" }, { type: "goal", segment: "family", goal: "reserve" },
      { type: "goal", segment: "kids", goal: "needs" }, { type: "goal", segment: "__proto__", goal: "budget" },
      { type: "goal", segment: "family", goal: {} }, { type: "finish", segment: "adult" },
    ]) expect(transitionLearningPaths(paths, mutation as LearningPathMutation)).toBe(paths);
    paths = transitionLearningPaths(paths, { type: "goal", segment: "family", goal: "shared-goal" });
    paths = transitionLearningPaths(paths, { type: "lesson", segment: "family" });
    for (const answer of [null, undefined, "B", "correct", true, {}, ["b"]]) {
      expect(transitionLearningPaths(paths, { type: "answer", segment: "family", answer } as LearningPathMutation)).toBe(paths);
    }
    expect(isGoalForSegment("family", "budget")).toBe(false);
    expect(isGoalForSegment("adult", "shared-goal")).toBe(false);
  });

  it("clears later steps only when a valid goal changes", () => {
    let paths = createLearningPaths();
    paths = transitionLearningPaths(paths, { type: "goal", segment: "adult", goal: "budget" });
    paths = transitionLearningPaths(paths, { type: "lesson", segment: "adult" });
    paths = transitionLearningPaths(paths, { type: "answer", segment: "adult", answer: "b" });
    paths = transitionLearningPaths(paths, { type: "action", segment: "adult" });
    expect(transitionLearningPaths(paths, { type: "goal", segment: "adult", goal: "budget" })).toBe(paths);
    const changed = transitionLearningPaths(paths, { type: "goal", segment: "adult", goal: "reserve" });
    expect(changed.adult).toEqual({ goal: "reserve", lessonRead: false, answer: null, actionPlanned: false });
    expect(changed.family).toBe(paths.family);
    expect(transitionLearningPaths(paths, { type: "answer", segment: "adult", answer: "c" }).adult.actionPlanned).toBe(false);
  });

  it("isolates the parent-led and public shells while legacy routes stay adult", () => {
    for (const pathname of ["/", "/adult", "/family", "/family/lesson", "/family/quiz", "/family/action", "/privacy", "/terms"])
      expect(isSharedLearningShell(pathname)).toBe(true);
    for (const pathname of ["/adult/dashboard", "/health-check", "/learn/family-plan", "/quiz", "/family-copy", "/kids"])
      expect(isSharedLearningShell(pathname)).toBe(false);
    for (const pathname of ["/", "/privacy", "/terms"]) expect(isPublicLearningEntry(pathname)).toBe(true);
    for (const pathname of ["/adult", "/family", "/family/lesson"]) expect(isPublicLearningEntry(pathname)).toBe(false);
  });
});
