import { describe, expect, it } from "vitest";
import { sanitizeProductValue } from "./data-export";

const input = { monthlyIncome: 4000, monthlyExpenses: 3000, savings: 9000, debt: 0, cashHeld: 0,
  hasEmergencyFund: true, understandsInflation: true, hasRetirementPlan: true, investsAlready: true,
  mainFinancialGoal: "TEST_FREE_TEXT_MARKER" };
const record = { schemaVersion: 2, formulaVersion: "legacy-weights-98-v1",
  source: "local_diagnosis", currency: "PLN", createdAt: "2026-10-14T00:00:00.000Z", answers: input };

describe("schema2 selected local export", () => {
  it("recomputes known score metadata while excluding free text and injected fields", () => {
    const clean = sanitizeProductValue("coachfi-health-check", { ...record,
      score: 1, rawScore: 100000, scoreMax: 100, token: "TEST_NESTED_MARKER",
      components: { accessToken: "TEST_NESTED_MARKER" }, groups: { identity: "TEST_NESTED_MARKER" },
      ratios: { refreshToken: "TEST_NESTED_MARKER" },
      answers: { ...input, session: { refreshToken: "TEST_NESTED_MARKER" } },
    }) as Record<string, unknown>;
    expect(clean.score).toBe(98);
    expect(clean.scoreMax).toBe(98);
    expect(clean.rawScore).toBe(98);
    expect(clean.schemaVersion).toBe(2);
    expect(clean.currency).toBe("PLN");
    expect(clean.groups).toEqual({ cashFlowAndRisk: { points: 60, maxPoints: 60 },
      planningDeclarations: { points: 32, maxPoints: 32 }, knowledgeDeclaration: { points: 6, maxPoints: 6 } });
    expect(JSON.stringify(clean)).not.toMatch(/TEST_FREE_TEXT_MARKER|TEST_NESTED_MARKER|accessToken|refreshToken|session/);
  });

  it.each([
    { schemaVersion: 3 }, { formulaVersion: "unknown-formula" }, { createdAt: "TEST_TIMESTAMP_MARKER" },
    { currency: "USD" }, { currency: undefined }, { currency: "TEST_CURRENCY_MARKER" },
    { source: "legacy_recomputed" },
    { answers: { ...input, monthlyIncome: "TEST_AMOUNT_MARKER" } },
    { answers: { ...input, investsAlready: "true" } }, { answers: { ...input, monthlyExpenses: -1 } },
  ])("omits unsupported or invalid v2 data instead of copying its raw record", (change) => {
    expect(sanitizeProductValue("coachfi-health-check", { ...record, ...change })).toBeUndefined();
  });

  it("retains existing selected legacy fields without claiming a schema2 migration", () => {
    expect(sanitizeProductValue("coachfi-health-check", { score: 50, createdAt: record.createdAt,
      answers: { monthlyIncome: 4000, savings: 1000, mainFinancialGoal: "TEST_FREE_TEXT_MARKER" } })).toEqual({
        score: 50, createdAt: record.createdAt, currency: "legacy_unspecified", answers: { monthlyIncome: 4000, savings: 1000 },
      });
  });

  it("exports undefined zero-denominator ratios as null, never serialized infinity", () => {
    const clean = sanitizeProductValue("coachfi-health-check", { ...record,
      answers: { ...input, monthlyIncome: 0, monthlyExpenses: 0, savings: 0, debt: 0, cashHeld: 0 } }) as { ratios: Record<string, number | null> };
    expect(clean.ratios).toEqual({ monthlyFree: 0, savingsRate: null, emergencyCoverage: null,
      debtPressure: null, cushionMonths: null });
  });

  it("keeps normalized legacy units explicit without labeling them as PLN", () => {
    const clean = sanitizeProductValue("coachfi-health-check", { ...record,
      source: "legacy_recomputed", currency: "legacy_unspecified" }) as { currency: string; source: string; score: number };
    expect(clean.currency).toBe("legacy_unspecified");
    expect(clean.source).toBe("legacy_recomputed");
    expect(clean.score).toBe(98);
  });
});
