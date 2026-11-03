"use client";

import { useEffect, useState } from "react";

import { getHealthCheck } from "@/lib/healthCheck";
import { getTokenBalance } from "@/lib/tokens";

/**
 * The single illustrative score used wherever a placeholder is shown before the
 * user has run the Health Check (always next to an "Example" label). Every
 * surface — sidebar, home, achievement, Mila — uses the user's real score once
 * it exists, and this value otherwise, so the numbers never disagree.
 */
export const EXAMPLE_SCORE = 62;

export type HealthAnswers = {
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
  debt: number;
  cashHeld: number;
  hasEmergencyFund: boolean;
  hasRetirementPlan: boolean;
  investsAlready: boolean;
};

export type HealthSnapshot = {
  score: number;
  answers: HealthAnswers | null;
  createdAt: string;
};

function num(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function readHealthSnapshot(): HealthSnapshot | null {
  const stored = getHealthCheck();
  if (!stored) return null;
  const a = stored.answers as Record<string, unknown> | undefined;
  const answers: HealthAnswers | null =
    a && a.monthlyExpenses !== undefined && a.monthlyIncome !== undefined
      ? {
          monthlyIncome: num(a.monthlyIncome),
          monthlyExpenses: num(a.monthlyExpenses),
          savings: num(a.savings),
          debt: num(a.debt),
          cashHeld: num(a.cashHeld),
          hasEmergencyFund: a.hasEmergencyFund === true,
          hasRetirementPlan: a.hasRetirementPlan === true,
          investsAlready: a.investsAlready === true,
        }
      : null;
  return { score: stored.score, answers, createdAt: stored.createdAt };
}

/** The user's real Health Check result on this device, or null before they run it. */
export function useHealthSnapshot(): HealthSnapshot | null {
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  useEffect(() => {
    const read = () => setSnapshot(readHealthSnapshot());
    read();
    window.addEventListener("coachfi-health-check", read);
    window.addEventListener("coachfi-cloud-synced", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("coachfi-health-check", read);
      window.removeEventListener("coachfi-cloud-synced", read);
      window.removeEventListener("storage", read);
    };
  }, []);
  return snapshot;
}

/** Points shown in the UI; follows every reward, sync and sign-in/out. */
export function useTokenBalance(): number {
  const [balance, setBalance] = useState(0);
  useEffect(() => {
    const read = () => setBalance(getTokenBalance());
    read();
    window.addEventListener("coachfi-tokens", read);
    window.addEventListener("coachfi-learning", read);
    window.addEventListener("coachfi-cloud-synced", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("coachfi-tokens", read);
      window.removeEventListener("coachfi-learning", read);
      window.removeEventListener("coachfi-cloud-synced", read);
      window.removeEventListener("storage", read);
    };
  }, []);
  return balance;
}

/** Score band shared with analytics and lead capture (no raw amounts). */
export type ScoreBand = "0-39" | "40-69" | "70-100";

export function scoreBand(score: number): ScoreBand {
  if (score < 40) return "0-39";
  if (score < 70) return "40-69";
  return "70-100";
}
