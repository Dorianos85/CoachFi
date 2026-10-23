import { persistLearningState } from "@/lib/account-sync";
import { assertCurrentPersonalStorage, captureCurrentPersonalStorage, type PersonalStorageHandle } from "@/lib/product-storage";

import { getAllCards } from "./srs";
import { notifyCloud } from "@/lib/sync/syncQueue";

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

function getManualOverrides(storage: PersonalStorageHandle): Record<string, "started" | "completed"> {
  if (typeof window === "undefined") return {};
  try {
    const raw = storage.getItem(MANUAL_KEY);
    return raw ? (JSON.parse(raw) as Record<string, "started" | "completed">) : {};
  } catch {
    return {};
  }
}

function readManualOverridesForWrite(storage: PersonalStorageHandle): Record<string, "started" | "completed"> {
  if (typeof window === "undefined") throw new Error("Manual learning progress is unavailable");
  const raw: unknown = storage.getItem(MANUAL_KEY);
  if (raw instanceof Promise) void Promise.prototype.then.call(raw, undefined, () => undefined);
  assertCurrentPersonalStorage(storage);
  if (raw === null) return {};
  if (typeof raw !== "string") throw new Error("Manual learning progress is unavailable");
  const overrides: unknown = JSON.parse(raw);
  if (overrides === null || typeof overrides !== "object" || Array.isArray(overrides) ||
    Object.getPrototypeOf(overrides) !== Object.prototype ||
    !Object.values(overrides).every(value => value === "started" || value === "completed")) {
    throw new Error("Manual learning progress is unavailable");
  }
  return overrides as Record<string, "started" | "completed">;
}

export function markStageStarted(stageId: string, storage = captureCurrentPersonalStorage()): void {
  assertCurrentPersonalStorage(storage);
  const overrides = readManualOverridesForWrite(storage);
  if (!overrides[stageId]) {
    overrides[stageId] = "started";
    if (!storage.setItem(MANUAL_KEY, JSON.stringify(overrides))) throw new Error("Storage session changed");
    assertCurrentPersonalStorage(storage);
    notifyCloud("stages");
    assertCurrentPersonalStorage(storage);
    persistLearningState("learnManual", storage);
  }
}

export function markStageCompleted(stageId: string, storage = captureCurrentPersonalStorage()): void {
  assertCurrentPersonalStorage(storage);
  const overrides = readManualOverridesForWrite(storage);
  overrides[stageId] = "completed";
  if (!storage.setItem(MANUAL_KEY, JSON.stringify(overrides))) throw new Error("Storage session changed");
  assertCurrentPersonalStorage(storage);
  notifyCloud("stages");
  assertCurrentPersonalStorage(storage);
  persistLearningState("learnManual", storage);
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

export function getAllStageProgress(storage = captureCurrentPersonalStorage()): StageProgress[] {
  if (!storage.isCurrent()) return emptyStageProgress();
  const cards = getAllCards(storage);
  const cardMap = new Map(cards.map((c) => [c.id, c]));
  const overrides = getManualOverrides(storage);
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
