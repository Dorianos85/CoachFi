"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { createLearningPaths, transitionLearningPaths, type AnswerId, type GoalId,
  type LearningPathMutation, type LearningPaths, type LearningSegment } from "@/lib/learning-paths";
import { useProductStorage } from "@/lib/use-product-storage";

interface LearningPathsValue {
  paths: LearningPaths;
  chooseGoal: (segment: LearningSegment, goal: GoalId) => void;
  markLessonRead: (segment: LearningSegment) => void;
  answerQuestion: (segment: LearningSegment, answer: AnswerId) => void;
  markActionPlanned: (segment: LearningSegment) => void;
}

const LearningPathsContext = createContext<LearningPathsValue | null>(null);

/** RAM only: survives route navigation, ends with this owner or document. */
export function LearningPathsProvider({ children }: { children: ReactNode }) {
  const { snapshot, storage } = useProductStorage();
  const [session, setSession] = useState(() => ({ revision: snapshot.revision, paths: createLearningPaths() }));
  if (session.revision !== snapshot.revision) {
    setSession({ revision: snapshot.revision, paths: createLearningPaths() });
  }
  const paths = session.revision === snapshot.revision && snapshot.status === "ready"
    ? session.paths : createLearningPaths();

  const value = useMemo<LearningPathsValue>(() => {
    const mutate = (mutation: LearningPathMutation) => {
      // A retained handler cannot borrow a later owner's handle, even before React renders.
      if (!storage.isCurrent()) return;
      setSession((previous) => {
        if (!storage.isCurrent() || previous.revision !== storage.revision) return previous;
        const next = transitionLearningPaths(previous.paths, mutation);
        return next === previous.paths ? previous : { ...previous, paths: next };
      });
    };
    return {
      paths,
      chooseGoal: (segment, goal) => mutate({ type: "goal", segment, goal }),
      markLessonRead: (segment) => mutate({ type: "lesson", segment }),
      answerQuestion: (segment, answer) => mutate({ type: "answer", segment, answer }),
      markActionPlanned: (segment) => mutate({ type: "action", segment }),
    };
  }, [paths, storage]);
  return <LearningPathsContext.Provider value={value}>{children}</LearningPathsContext.Provider>;
}

export function useLearningPaths() {
  const value = useContext(LearningPathsContext);
  if (!value) throw new Error("LearningPathsProvider is required");
  return value;
}
