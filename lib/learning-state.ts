import type { AccountSnapshot } from "@/lib/account-snapshot";

export const LEARNING_FIELDS = ["srs", "learnManual", "tokens", "streak"] as const;

export type LearningField = (typeof LEARNING_FIELDS)[number];

export const LEARNING_STORAGE_KEYS = {
  srs: "coachfi-srs",
  learnManual: "coachfi-learn-manual",
  tokens: "coachfi-tokens",
  streak: "coachfi-streak",
} as const;

export interface LocalLearningFields {
  srs?: unknown;
  learnManual?: unknown;
  tokens?: number;
  streak?: unknown;
  srsPresent: boolean;
  learnManualPresent: boolean;
  tokensPresent: boolean;
  streakPresent: boolean;
}

export function learningStorageWrites(state: AccountSnapshot) {
  return [
    {
      field: "srs" as const,
      key: LEARNING_STORAGE_KEYS.srs,
      value: state.srs === undefined ? null : JSON.stringify(state.srs),
    },
    {
      field: "learnManual" as const,
      key: LEARNING_STORAGE_KEYS.learnManual,
      value: state.learnManual === undefined ? null : JSON.stringify(state.learnManual),
    },
    {
      field: "tokens" as const,
      key: LEARNING_STORAGE_KEYS.tokens,
      value: storedTokenValue(state.tokens),
    },
    {
      field: "streak" as const,
      key: LEARNING_STORAGE_KEYS.streak,
      value: state.streak === undefined ? null : JSON.stringify(state.streak),
    },
  ];
}

export function mergeLearningFields(
  base: AccountSnapshot,
  local: LocalLearningFields,
  fields: readonly LearningField[],
): AccountSnapshot {
  const next: AccountSnapshot = { ...base, version: 1 };
  if (fields.includes("srs")) {
    if (local.srsPresent) next.srs = local.srs;
    else delete next.srs;
  }
  if (fields.includes("learnManual")) {
    if (local.learnManualPresent) next.learnManual = local.learnManual;
    else delete next.learnManual;
  }
  if (fields.includes("tokens")) {
    if (local.tokensPresent && typeof local.tokens === "number" && Number.isFinite(local.tokens)) {
      next.tokens = Math.max(0, Math.min(1_000_000_000, Math.trunc(local.tokens)));
    } else {
      delete next.tokens;
    }
  }
  if (fields.includes("streak")) {
    if (local.streakPresent) next.streak = local.streak;
    else delete next.streak;
  }
  return next;
}

function storedTokenValue(tokens: number | undefined) {
  if (typeof tokens !== "number" || !Number.isFinite(tokens)) return null;
  return String(Math.max(0, Math.min(1_000_000_000, Math.trunc(tokens))));
}
