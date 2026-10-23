import { quizQuestions } from "@/data/quizQuestions";
import { challengeQuestions } from "@/data/challengeQuestions";
import { CONSENT_STORAGE_KEY, normalizeConsentRecord } from "@/lib/consent";
import { normalizeHealthCheckResult } from "@/lib/healthCheck";
import { eraseCurrentPersonalData, type PersonalStorageHandle } from "@/lib/product-storage";

// Exact keys only. Auth/SDK/session keys and unconstrained strings are never copied.
export const LOCAL_PRODUCT_KEYS = [
  "coachfi-srs", "coachfi-learn-manual", "coachfi-lesson-steps", "coachfi-tokens",
  "coachfi-streak", "coachfi-health-check", "coachfi-locale-v1", "coachfi-avatar",
  "coachfi-user", "coachfi-challenge", "coachfi-mode-v1", CONSENT_STORAGE_KEY,
] as const;

type ProductKey = (typeof LOCAL_PRODUCT_KEYS)[number];
type StorageReader = Pick<Storage, "getItem">;
const QUESTION_IDS = new Set([...quizQuestions, ...challengeQuestions].map((q) => q.id));
const STAGES = ["money-mindset", "saving-habit", "inflation", "credit-rates",
  "emergency-fund", "long-term-investing", "retirement", "family-plan"] as const;
const LOCALES = ["pl", "en", "es", "fr", "zh", "ja", "hi", "pt-BR", "tr"];
const MAX_VALUE_CHARS = 262144;

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function number(value: unknown, min = 0, max = 1e12): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max
    ? value : undefined;
}
function day(value: unknown): string | undefined {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const parsed = Date.parse(value + "T00:00:00.000Z");
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value
    ? value : undefined;
}
function timestamp(value: unknown): string | undefined {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value ? value : undefined;
}
function numericFields(value: Record<string, unknown>, fields: readonly string[]) {
  const output: Record<string, number> = {};
  for (const field of fields) {
    const clean = number(value[field]);
    if (clean !== undefined) output[field] = clean;
  }
  return output;
}

/** Rebuild a product value from known fields; never recursively copy arbitrary records. */
export function sanitizeProductValue(key: ProductKey, value: unknown): unknown | undefined {
  switch (key) {
    case CONSENT_STORAGE_KEY:
      return normalizeConsentRecord(value) ?? undefined;
    case "coachfi-locale-v1":
      return typeof value === "string" && LOCALES.includes(value) ? value : undefined;
    case "coachfi-tokens":
      return Number.isSafeInteger(value) ? number(value, 0, 1e9) : undefined;
    case "coachfi-srs":
      if (!Array.isArray(value)) return undefined;
      return value.slice(0, 1000).flatMap((card) => {
        if (!record(card) || typeof card.id !== "string" || !QUESTION_IDS.has(card.id)) return [];
        const interval = Number.isSafeInteger(card.interval) ? number(card.interval, 1, 90) : undefined;
        const repetitions = Number.isSafeInteger(card.repetitions) ? number(card.repetitions, 0, 100000) : undefined;
        const easeFactor = number(card.easeFactor, 1.3, 1000);
        const nextReview = day(card.nextReview);
        if (interval === undefined || repetitions === undefined || easeFactor === undefined || !nextReview) return [];
        return [{ id: card.id, interval, repetitions, easeFactor, nextReview }];
      });
    case "coachfi-learn-manual":
    case "coachfi-lesson-steps": {
      if (!record(value)) return undefined;
      const output: Record<string, string | number> = {};
      for (const id of STAGES) {
        const field = value[id];
        if (key === "coachfi-learn-manual" && (field === "started" || field === "completed")) output[id] = field;
        if (key === "coachfi-lesson-steps") {
          const count = number(field, 0, 100);
          if (count !== undefined && Number.isInteger(count)) output[id] = count;
        }
      }
      return output;
    }
    case "coachfi-streak": {
      if (!record(value)) return undefined;
      const lastActiveDate = day(value.lastActiveDate);
      const currentStreak = number(value.currentStreak, 0, 100000);
      const longestStreak = number(value.longestStreak, 0, 100000);
      if (!lastActiveDate || currentStreak === undefined || longestStreak === undefined ||
          !Number.isSafeInteger(currentStreak) || !Number.isSafeInteger(longestStreak) ||
          longestStreak < currentStreak) return undefined;
      return { lastActiveDate, currentStreak, longestStreak };
    }
    case "coachfi-health-check": {
      if (!record(value)) return undefined;
      if (value.schemaVersion !== undefined || value.formulaVersion !== undefined) {
        if (!record(value.answers)) return undefined;
        const answers = numericFields(value.answers,
          ["monthlyIncome", "monthlyExpenses", "savings", "debt", "cashHeld"]);
        const input: Record<string, unknown> = { ...answers };
        for (const field of ["hasEmergencyFund", "understandsInflation", "hasRetirementPlan", "investsAlready"]) {
          if (typeof value.answers[field] === "boolean") input[field] = value.answers[field];
        }
        // The existing goal affects this legacy model. Read it only to recompute
        // known numbers; never include its free text in the export.
        input.mainFinancialGoal = value.answers.mainFinancialGoal;
        const clean = normalizeHealthCheckResult({ schemaVersion: value.schemaVersion,
          formulaVersion: value.formulaVersion, createdAt: value.createdAt,
          source: value.source, currency: value.currency, answers: input });
        if (!clean) return undefined;
        const safeAnswers: Record<string, number | boolean> = numericFields(clean.answers as unknown as Record<string, unknown>,
          ["monthlyIncome", "monthlyExpenses", "savings", "debt", "cashHeld"]);
        for (const field of ["hasEmergencyFund", "understandsInflation", "hasRetirementPlan", "investsAlready"] as const) safeAnswers[field] = clean.answers[field];
        return { schemaVersion: 2, formulaVersion: clean.formulaVersion, score: clean.score,
          rawScore: clean.rawScore, scoreMax: clean.scoreMax, createdAt: clean.createdAt,
          source: clean.source, currency: clean.currency, answers: safeAnswers,
          components: numericFields(clean.components, ["savingsRate", "emergencyCoverage", "debtPressure",
            "cashAwareness", "investingDeclaration", "goalDeclaration", "emergencyDeclaration",
            "inflationKnowledgeDeclaration", "retirementDeclaration"]),
          groups: {
            cashFlowAndRisk: { points: clean.groups.cashFlowAndRisk.points, maxPoints: 60 },
            planningDeclarations: { points: clean.groups.planningDeclarations.points, maxPoints: 32 },
            knowledgeDeclaration: { points: clean.groups.knowledgeDeclaration.points, maxPoints: 6 },
          },
          ratios: { monthlyFree: clean.ratios.monthlyFree, savingsRate: clean.ratios.savingsRate,
            emergencyCoverage: clean.ratios.emergencyCoverage, debtPressure: clean.ratios.debtPressure,
            cushionMonths: clean.ratios.cushionMonths },
        };
      }
      const score = number(value.score, 0, 100);
      const createdAt = timestamp(value.createdAt);
      if (score === undefined || !createdAt || !record(value.answers)) return undefined;
      const answers: Record<string, number | boolean> = numericFields(value.answers,
        ["monthlyIncome", "monthlyExpenses", "savings", "debt", "cashHeld"]);
      for (const field of ["hasEmergencyFund", "understandsInflation", "hasRetirementPlan", "investsAlready"]) {
        if (typeof value.answers[field] === "boolean") answers[field] = value.answers[field];
      }
      return { score, createdAt, currency: "legacy_unspecified", answers };
    }
    case "coachfi-avatar":
      if (!record(value) || typeof value.gender !== "string" || typeof value.style !== "string" ||
          !["male", "female"].includes(value.gender) ||
          !["warrior", "explorer", "builder"].includes(value.style)) return undefined;
      return { gender: value.gender, style: value.style };
    case "coachfi-user":
      // Names/goals are free text: not copied because secrets could be hidden in them.
      return record(value) && typeof value.setupDone === "boolean" ? { setupDone: value.setupDone } : undefined;
    case "coachfi-challenge":
      return record(value) && day(value.date) ? { date: day(value.date) } : undefined;
    case "coachfi-mode-v1": {
      if (!record(value) || (value.mode !== "adult" && value.mode !== "kids")) return undefined;
      const selectedAt = timestamp(value.selectedAt);
      if (!selectedAt) return undefined;
      const adultConfirmedAt = timestamp(value.adultConfirmedAt);
      return { mode: value.mode, selectedAt, ...(adultConfirmedAt ? { adultConfirmedAt } : {}),
        ...(value.mode === "adult" && value.adultAgeRequirement === 18 ? { adultAgeRequirement: 18 } : {}) };
    }
  }
}

export function collectProductStorage(storage: StorageReader) {
  const output: Partial<Record<ProductKey, unknown>> = {};
  for (const key of LOCAL_PRODUCT_KEYS) {
    // Storage access failures must be reported; malformed values alone are omitted.
    const raw = storage.getItem(key);
    if (raw === null || raw.length > MAX_VALUE_CHARS) continue;
    try {
      const value = key === "coachfi-locale-v1" && LOCALES.includes(raw) ? raw : JSON.parse(raw);
      const clean = sanitizeProductValue(key, value);
      if (clean !== undefined) output[key] = clean;
    } catch {
      // Corrupt or unsupported data is omitted, never copied as a raw string.
    }
  }
  return output;
}

export function buildLocalDataExport(local: StorageReader, session: StorageReader) {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    scope: "selected_local_product_data",
    omitted: ["authentication_and_sessions", "unknown_keys_and_fields", "free_text_profile_and_goals"],
    localStorage: collectProductStorage(local),
    sessionStorage: collectProductStorage(session),
  };
}

/** The UI exports one captured owner from both storage areas; identity stays out of the file. */
export function buildOwnedLocalDataExport(local: PersonalStorageHandle, session: PersonalStorageHandle) {
  const current = () => local.isCurrent() && session.isCurrent() && local.area === "local" &&
    session.area === "session" && local.revision === session.revision && local.owner !== null &&
    session.owner !== null && local.owner.kind === session.owner.kind &&
    (local.owner.kind === "guest" || (session.owner.kind === "account" &&
      local.owner.provider === session.owner.provider && local.owner.userId === session.owner.userId));
  if (!current()) throw new Error("Storage owner changed");
  const payload = buildLocalDataExport(local, session);
  if (!current()) throw new Error("Storage owner changed");
  return { ...payload, version: 2, ownerKind: local.owner!.kind,
    scope: "selected_current_owner_local_product_data", devicePreferencesIncluded: ["locale"] };
}

export function deleteLocalProductData(expectedReadyHandle: PersonalStorageHandle): boolean {
  return eraseCurrentPersonalData(expectedReadyHandle);
}
