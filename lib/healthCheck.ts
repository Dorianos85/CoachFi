import { notifyCloud } from "@/lib/sync/syncQueue";

const HEALTH_KEY = "coachfi-health-check";

export interface HealthCheckResult {
  score: number;
  /** Raw answers, so the result can be explained or recomputed later. */
  answers: Record<string, number | boolean | string>;
  createdAt: string;
}

export function getHealthCheck(): HealthCheckResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(HEALTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HealthCheckResult;
    return typeof parsed?.score === "number" ? parsed : null;
  } catch {
    return null;
  }
}

export function saveHealthCheck(
  score: number,
  answers: Record<string, number | boolean | string>
): HealthCheckResult {
  const result: HealthCheckResult = {
    score: Math.max(0, Math.min(100, Math.round(score))),
    answers,
    createdAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(HEALTH_KEY, JSON.stringify(result));
    notifyCloud("healthCheck", result);
    // Let the shell (score ring, home dashboard) re-read without a reload.
    window.dispatchEvent(new Event("coachfi-health-check"));
  }
  return result;
}

/** True once the user has run the diagnosis at least once on this device. */
export function hasHealthCheck(): boolean {
  return getHealthCheck() !== null;
}
