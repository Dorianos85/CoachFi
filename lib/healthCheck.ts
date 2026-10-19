import { calculateFinancialScore, FinancialScoreValidationError, FINANCIAL_SCORE_VERSION, type FinancialScoreCalculation,
  type FinancialScoreInput, validateFinancialScoreInput } from "@/lib/financial-score";
import { hasConsentFor, readStoredConsent } from "@/lib/consent";
import { captureCurrentPersonalStorage, type PersonalStorageHandle } from "@/lib/product-storage";

export const HEALTH_STORAGE_KEY = "coachfi-health-check";
export interface HealthCheckResult extends FinancialScoreCalculation {
  schemaVersion: 2;
  answers: FinancialScoreInput;
  createdAt: string;
  source: "local_diagnosis" | "legacy_recomputed";
  currency: "PLN" | "legacy_unspecified";
}

function validDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

/** Read/recompute migration only. A stored score never overrides its inputs. */
export function normalizeHealthCheckResult(value: unknown): HealthCheckResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const legacy = record.schemaVersion === undefined && record.formulaVersion === undefined;
  if (!legacy && (record.schemaVersion !== 2 || record.formulaVersion !== FINANCIAL_SCORE_VERSION)) return null;
  if (!legacy && !(
    (record.source === "local_diagnosis" && record.currency === "PLN") ||
    (record.source === "legacy_recomputed" && record.currency === "legacy_unspecified")
  )) return null;
  if (!validDate(record.createdAt)) return null;
  const valid = validateFinancialScoreInput(record.answers);
  if (!valid.ok) return null;
  return { ...calculateFinancialScore(valid.input), schemaVersion: 2, answers: valid.input,
    createdAt: record.createdAt,
    source: legacy || record.source === "legacy_recomputed" ? "legacy_recomputed" : "local_diagnosis",
    currency: legacy || record.source === "legacy_recomputed" ? "legacy_unspecified" : "PLN" };
}

export function getHealthCheck(storage: PersonalStorageHandle = captureCurrentPersonalStorage()): HealthCheckResult | null {
  if (!storage.isCurrent() || !hasConsentFor(readStoredConsent(storage), [])) return null;
  try {
    const raw = storage.getItem(HEALTH_STORAGE_KEY);
    return raw ? normalizeHealthCheckResult(JSON.parse(raw)) : null;
  } catch { return null; }
}

/** New diagnosis is local-only. No account, marketing, trial or cloud write. */
export function saveHealthCheck(answers: FinancialScoreInput, storage: PersonalStorageHandle = captureCurrentPersonalStorage()): HealthCheckResult {
  if (!storage.isCurrent()) throw new Error("Personal storage scope changed");
  if (!hasConsentFor(readStoredConsent(storage), [])) throw new Error("Required terms have not been accepted");
  const valid = validateFinancialScoreInput(answers);
  if (!valid.ok) throw new FinancialScoreValidationError(valid.errors);
  const result: HealthCheckResult = { ...calculateFinancialScore(valid.input), schemaVersion: 2,
    answers: valid.input, createdAt: new Date().toISOString(), source: "local_diagnosis", currency: "PLN" };
  // Storage exceptions propagate. UI cannot claim a saved result after failure.
  if (!storage.setItem(HEALTH_STORAGE_KEY, JSON.stringify(result)) || !storage.isCurrent()) throw new Error("Personal storage scope changed");
  window.dispatchEvent(new Event("coachfi-health-check"));
  if (!storage.isCurrent()) throw new Error("Personal storage scope changed");
  return result;
}
export function hasHealthCheck(storage: PersonalStorageHandle = captureCurrentPersonalStorage()): boolean { return getHealthCheck(storage) !== null; }
