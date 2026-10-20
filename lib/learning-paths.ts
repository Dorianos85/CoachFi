/** Local educational paths are separate from authentication, age and consent. */
export type LearningSegment = "adult" | "family";
export type GoalId = "budget" | "reserve" | "needs" | "shared-goal";
export type AnswerId = "a" | "b" | "c";

export interface PathSession {
  goal: GoalId | null;
  lessonRead: boolean;
  answer: AnswerId | null;
  actionPlanned: boolean;
}

export type LearningPaths = Record<LearningSegment, PathSession>;
export type LearningPathMutation =
  | { type: "goal"; segment: LearningSegment; goal: GoalId }
  | { type: "lesson"; segment: LearningSegment }
  | { type: "answer"; segment: LearningSegment; answer: AnswerId }
  | { type: "action"; segment: LearningSegment };

export function createLearningPaths(): LearningPaths {
  const empty = (): PathSession => ({ goal: null, lessonRead: false, answer: null, actionPlanned: false });
  return { adult: empty(), family: empty() };
}

export function isLearningSegment(value: unknown): value is LearningSegment {
  return value === "adult" || value === "family";
}

export function isGoalForSegment(segment: LearningSegment, value: unknown): value is GoalId {
  return segment === "adult" ? value === "budget" || value === "reserve"
    : segment === "family" && (value === "needs" || value === "shared-goal");
}

/** Each fixed example has answer b; a plan follows demonstrated understanding. */
export function transitionLearningPaths(paths: LearningPaths, mutation: LearningPathMutation): LearningPaths {
  if (!mutation || !isLearningSegment(mutation.segment)) return paths;
  const current = paths[mutation.segment];
  let next: PathSession;
  switch (mutation.type) {
    case "goal":
      if (!isGoalForSegment(mutation.segment, mutation.goal) || current.goal === mutation.goal) return paths;
      next = { goal: mutation.goal, lessonRead: false, answer: null, actionPlanned: false };
      break;
    case "lesson":
      if (!isGoalForSegment(mutation.segment, current.goal) || current.lessonRead) return paths;
      next = { ...current, lessonRead: true };
      break;
    case "answer":
      if (!isGoalForSegment(mutation.segment, current.goal) || !current.lessonRead ||
        (mutation.answer !== "a" && mutation.answer !== "b" && mutation.answer !== "c") ||
        current.answer === mutation.answer) return paths;
      next = { ...current, answer: mutation.answer, actionPlanned: false };
      break;
    case "action":
      if (!isGoalForSegment(mutation.segment, current.goal) || !current.lessonRead ||
        current.answer !== "b" || current.actionPlanned) return paths;
      next = { ...current, actionPlanned: true };
      break;
    default:
      return paths;
  }
  return { ...paths, [mutation.segment]: next };
}

/** Family is a parent-led path. Every legacy product route retains adult context. */
export function isSharedLearningShell(pathname: string): boolean {
  return pathname === "/" || pathname === "/adult" || pathname === "/family" || pathname.startsWith("/family/") ||
    pathname === "/privacy" || pathname === "/terms";
}

export function isPublicLearningEntry(pathname: string): boolean {
  return pathname === "/" || pathname === "/privacy" || pathname === "/terms";
}
