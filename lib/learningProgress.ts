import { persistLearningState } from "@/lib/account-sync";
import { isProgressVisible } from "@/lib/progress-visibility";

import { getAllCards } from "./srs";

const MANUAL_KEY = "coachfi-learn-manual";

// Questions IDs that belong to each learning stage
export const STAGE_QUESTION_IDS: Record<string, string[]> = {
  "money-mindset":        ["net-worth", "lifestyle-inflation", "pay-yourself-first"],
  "saving-habit":         ["saving-habit", "budget-50-30-20", "high-yield-savings", "dca"],
  "inflation":            ["inflation-basics", "real-return", "rule-of-72", "inflation-hedge"],
  "credit-rates":         ["interest-rates", "debt-avalanche", "credit-score-factors", "bond-prices"],
  "emergency-fund":       ["emergency-fund", "emergency-fund-characteristics", "emergency-fund-start"],
  "long-term-investing":  ["compound-interest", "diversification", "index-fund", "etf-definition", "time-in-market"],
  "retirement":           ["retirement-purpose", "retirement-early-start"],
  "family-plan":          ["insurance-purpose", "joint-finances", "teaching-kids-money"],
};

export type StageStatus = "completed" | "inProgress" | "current" | "locked";

export interface StageProgress {
  stageId: string;
  status: StageStatus;
  progressPct: number;
  answeredCount: number;
  totalCount: number;
}

function getManualOverrides(): Record<string, "started" | "completed"> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(MANUAL_KEY);
    return raw ? (JSON.parse(raw) as Record<string, "started" | "completed">) : {};
  } catch {
    return {};
  }
}

export function markStageStarted(stageId: string): void {
  if (typeof window === "undefined") return;
  const overrides = getManualOverrides();
  if (!overrides[stageId]) {
    overrides[stageId] = "started";
    localStorage.setItem(MANUAL_KEY, JSON.stringify(overrides));
    persistLearningState("learnManual");
  }
}

export function markStageCompleted(stageId: string): void {
  if (typeof window === "undefined") return;
  const overrides = getManualOverrides();
  overrides[stageId] = "completed";
  localStorage.setItem(MANUAL_KEY, JSON.stringify(overrides));
  persistLearningState("learnManual");
}

function emptyStageProgress(): StageProgress[] {
  return Object.keys(STAGE_QUESTION_IDS).map((stageId, index) => ({
    stageId,
    status: index === 0 ? "current" : "locked",
    progressPct: 0,
    answeredCount: 0,
    totalCount: STAGE_QUESTION_IDS[stageId].length,
  }));
}

export function getAllStageProgress(): StageProgress[] {
  if (typeof window !== "undefined" && !isProgressVisible()) return emptyStageProgress();
  const cards = getAllCards();
  const cardMap = new Map(cards.map((c) => [c.id, c]));
  const overrides = getManualOverrides();
  const stageIds = Object.keys(STAGE_QUESTION_IDS);

  return stageIds.map((stageId, index) => {
    const questionIds = STAGE_QUESTION_IDS[stageId];
    const answeredCount = questionIds.filter(
      (id) => (cardMap.get(id)?.repetitions ?? 0) > 0
    ).length;
    const totalCount = questionIds.length;
    const rawPct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

    const isManuallyCompleted = overrides[stageId] === "completed";
    const isManuallyStarted = overrides[stageId] === "started";

    if (isManuallyCompleted || rawPct >= 80) {
      return { stageId, status: "completed", progressPct: 100, answeredCount, totalCount };
    }

    if (rawPct > 0 || isManuallyStarted) {
      return {
        stageId,
        status: "inProgress",
        progressPct: Math.max(rawPct, isManuallyStarted ? 5 : 0),
        answeredCount,
        totalCount,
      };
    }

    // No SRS progress — determine if unlocked (current) or locked
    if (index === 0) {
      return { stageId, status: "current", progressPct: 0, answeredCount, totalCount };
    }

    const prevId = stageIds[index - 1];
    const prevOverride = overrides[prevId];
    const prevHasSrsProgress = STAGE_QUESTION_IDS[prevId].some(
      (id) => (cardMap.get(id)?.repetitions ?? 0) > 0
    );
    const prevStarted =
      prevOverride === "started" || prevOverride === "completed" || prevHasSrsProgress;

    return {
      stageId,
      status: prevStarted ? "current" : "locked",
      progressPct: 0,
      answeredCount,
      totalCount,
    };
  });
}
