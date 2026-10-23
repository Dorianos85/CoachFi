import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateFinancialScore, type FinancialScoreInput } from "../lib/financial-score";
import { normalizeHealthCheckResult, saveHealthCheck, HEALTH_STORAGE_KEY } from "../lib/healthCheck";
import { sanitizeProductValue } from "../lib/data-export";
import { pushEntity } from "../lib/sync/cloudSync";
import { CONSENT_STORAGE_KEY, createConsentRecord } from "../lib/consent";
import { beginStorageOwner } from "../lib/product-storage";

// Independent integer/rational oracle, using amounts in cents. Algebraically:
// flow points=min(72*free/income,18)+min(6*savings/expenses,18)
//             +max(16-4*debt/income,0)+cash points.
// No production calculation, returned components or stored score is used here.
type Q = { n: bigint; d: bigint };
const q = (n: number | bigint, d: number | bigint = 1): Q => ({ n: BigInt(n), d: BigInt(d) });
const add = (a: Q, b: Q): Q => q(a.n * b.d + b.n * a.d, a.d * b.d);
const cap = (a: Q, ceiling: number): Q => a.n > BigInt(ceiling) * a.d ? q(ceiling) : a;
const floorZero = (a: Q): Q => a.n < BigInt(0) ? q(0) : a;
const numeric = (a: Q) => Number(a.n) / Number(a.d);
const rounded = (a: Q) => Number((BigInt(2) * a.n + a.d) / (BigInt(2) * a.d));
const declared = { hasEmergencyFund: false, understandsInflation: false, hasRetirementPlan: false, investsAlready: false, mainFinancialGoal: "" };
type Cents = { income: number; expenses: number; savings: number; debt: number; cash: number };
function reference(c: Cents, flags: typeof declared) {
  const net = Math.max(c.income - c.expenses, 0);
  const incomePoints = c.income === 0 ? q(0) : cap(q(72 * net, c.income), 18);
  const bufferPoints = c.expenses === 0 ? q(0) : cap(q(6 * c.savings, c.expenses), 18);
  const debtPoints = c.income === 0 ? q(0) : floorZero(q(16 * c.income - 4 * c.debt, c.income));
  const cashPoints = c.cash > 2 * c.income && !flags.investsAlready ? 4 : 8;
  const flow = add(add(incomePoints, bufferPoints), add(debtPoints, q(cashPoints)));
  const plan = (flags.investsAlready ? 10 : 2) + (flags.mainFinancialGoal.trim().length > 8 ? 6 : 0)
    + (flags.hasEmergencyFund ? 8 : 0) + (flags.hasRetirementPlan ? 8 : 0);
  const knowledge = flags.understandsInflation ? 6 : 0;
  const total = add(flow, q(plan + knowledge));
  return { score: rounded(total), raw: numeric(total), flow: numeric(flow), plan, knowledge };
}
function input(c: Cents, flags: typeof declared): FinancialScoreInput {
  return { monthlyIncome: c.income / 100, monthlyExpenses: c.expenses / 100, savings: c.savings / 100,
    debt: c.debt / 100, cashHeld: c.cash / 100, ...flags };
}
const complete = { monthlyIncome: 4000, monthlyExpenses: 2000, savings: 6000, debt: 0, cashHeld: 0,
  hasEmergencyFund: true, understandsInflation: true, hasRetirementPlan: true, investsAlready: true,
  mainFinancialGoal: "SYNTHETIC_FREE_TEXT_NOT_FOR_EXPORT" };
const createdAt = "2026-10-14T00:00:00.000Z";
let outbound: ReturnType<typeof vi.fn>;
beforeEach(() => {
  outbound = vi.fn(() => { throw new Error("No provider or cloud call allowed in review"); });
  vi.stubGlobal("fetch", outbound);
});
afterEach(() => { expect(outbound).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });

describe("independent rational arithmetic and diagnosis data boundaries", () => {
  it("matches 96 independently computed cent-based scenarios and all three groups", () => {
    for (let i = 0; i < 96; i++) {
      const income = i % 12 === 0 ? 0 : 120000 + i * 625;
      const expenses = i % 11 === 0 ? 0 : 45000 + (i % 8) * 19000;
      const amounts = { income, expenses, savings: expenses * (i % 5), debt: income * (i % 6),
        cash: i % 3 === 0 ? 2 * income : 2 * income + 1 };
      const flags = { hasEmergencyFund: (i & 1) !== 0, understandsInflation: (i & 2) !== 0,
        hasRetirementPlan: (i & 4) !== 0, investsAlready: (i & 8) !== 0,
        mainFinancialGoal: i % 2 === 0 ? "12345678" : "123456789" };
      const expected = reference(amounts, flags);
      const result = calculateFinancialScore(input(amounts, flags));
      expect(result.score, `scenario ${i}`).toBe(expected.score);
      expect(result.rawScore).toBeCloseTo(expected.raw, 10);
      expect(result.groups.cashFlowAndRisk.points).toBeCloseTo(expected.flow, 10);
      expect(result.groups.planningDeclarations.points).toBe(expected.plan);
      expect(result.groups.knowledgeDeclaration.points).toBe(expected.knowledge);
      expect(result.scoreMax).toBe(98);
      expect(Object.values(result.ratios).every((v) => v === null || Number.isFinite(v))).toBe(true);
    }
  });

  it("legacy read migration recalculates 6967/195 rather than trusting cached42/100 metadata", () => {
    const answers = { ...declared, monthlyIncome: 6000, monthlyExpenses: 5200, savings: 3000,
      debt: 8000, cashHeld: 20000, mainFinancialGoal: "Emergency fund" };
    const legacy = { score: 42, scoreMax: 100, rawScore: 42, createdAt, answers, token: "SYNTHETIC_CREDENTIAL" };
    const before = JSON.stringify(legacy);
    const result = normalizeHealthCheckResult(legacy);
    expect(result?.rawScore).toBeCloseTo(6967 / 195, 10); expect(result?.score).toBe(36);
    expect(result?.scoreMax).toBe(98); expect(result?.source).toBe("legacy_recomputed");
    expect(result?.currency).toBe("legacy_unspecified");
    expect(result?.createdAt).toBe(createdAt); expect(result).not.toHaveProperty("token");
    expect(JSON.stringify(legacy)).toBe(before);
  });

  it("v2 export recomputes tampered metadata, strips credentials and does not mutate source answers", () => {
    const raw = { schemaVersion: 2, formulaVersion: "legacy-weights-98-v1", source: "local_diagnosis", currency: "PLN",
      createdAt, score: 42, scoreMax: 100, rawScore: -1, components: { session: "SYNTHETIC_AUTH" },
      ratios: { bearer: "SYNTHETIC_AUTH" }, answers: { ...complete, identity: { token: "SYNTHETIC_AUTH" } } };
    const original = JSON.stringify(raw);
    const clean = sanitizeProductValue("coachfi-health-check", raw) as Record<string, unknown>;
    expect(clean.score).toBe(98); expect(clean.rawScore).toBe(98); expect(clean.scoreMax).toBe(98);
    expect(clean.currency).toBe("PLN");
    expect(JSON.stringify(clean)).not.toMatch(/SYNTHETIC_AUTH|SYNTHETIC_FREE_TEXT|identity|bearer|session/);
    expect(JSON.stringify(raw)).toBe(original);
  });

  it("exported partial legacy data is not labeled as a recalculated schema2 diagnosis", () => {
    const clean = sanitizeProductValue("coachfi-health-check", { score: 42, createdAt,
      answers: { monthlyIncome: 4000, mainFinancialGoal: "SYNTHETIC_GOAL" } }) as Record<string, unknown>;
    expect(clean).toEqual({ score: 42, createdAt, currency: "legacy_unspecified", answers: { monthlyIncome: 4000 } });
    expect(clean).not.toHaveProperty("schemaVersion");
    expect(normalizeHealthCheckResult(clean)).toBeNull();
  });

  it.each(["healthCheck"] as const)("legacy queued %s event cannot inspect storage/payload or touch the DB", async (entity) => {
    const from = vi.fn(() => { throw new Error("No database use allowed"); });
    const db = { from } as unknown as Parameters<typeof pushEntity>[0];
    const payload = new Proxy({}, { get() { throw new Error("No payload access allowed"); } });
    const getItem = vi.fn(() => { throw new Error("No storage access allowed"); });
    vi.stubGlobal("window", { localStorage: { getItem } });
    await pushEntity(db, "synthetic-user", entity, payload);
    expect(from).not.toHaveBeenCalled(); expect(getItem).not.toHaveBeenCalled();
  });

  it("storage failure preserves the previous diagnosis without dispatching a new success", () => {
    const previous = JSON.stringify({ score: 42, createdAt, answers: complete });
    const map = new Map([[CONSENT_STORAGE_KEY, JSON.stringify(createConsentRecord())], [HEALTH_STORAGE_KEY, previous]]);
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", { localStorage: { getItem: (key: string) => map.get(key) ?? null,
      setItem: () => { throw new Error("Synthetic quota failure"); } }, dispatchEvent });
    beginStorageOwner({ kind: "guest" }).publishReady({ localOnly: true });
    dispatchEvent.mockClear(); // Bootstrap events are setup, not diagnosis success.
    expect(() => saveHealthCheck(complete)).toThrow("Synthetic quota failure");
    expect(map.get(HEALTH_STORAGE_KEY)).toBe(previous); expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it("legacy normalization is idempotent and never converts an unknown unit to PLN", () => {
    const legacy = { score: 42, createdAt, answers: complete };
    const once = normalizeHealthCheckResult(legacy);
    const twice = normalizeHealthCheckResult(once);
    expect(once?.currency).toBe("legacy_unspecified");
    expect(once?.source).toBe("legacy_recomputed");
    expect(twice).toEqual(once);
    const exported = sanitizeProductValue("coachfi-health-check", once) as Record<string, unknown>;
    expect(exported.currency).toBe("legacy_unspecified");
    expect(exported.source).toBe("legacy_recomputed");
    expect(exported.score).toBe(98);
  });

  it("rejects absent/foreign/mismatched currency for both versioned source types", () => {
    const combinations = [
      ["local_diagnosis", undefined], ["local_diagnosis", "USD"], ["local_diagnosis", "legacy_unspecified"],
      ["legacy_recomputed", undefined], ["legacy_recomputed", "USD"], ["legacy_recomputed", "PLN"],
    ];
    for (const [source, currency] of combinations) {
      const record = { schemaVersion: 2, formulaVersion: "legacy-weights-98-v1", source, currency,
        createdAt, answers: complete };
      expect(normalizeHealthCheckResult(record)).toBeNull();
      expect(sanitizeProductValue("coachfi-health-check", record)).toBeUndefined();
    }
  });

  it("new local writes carry an explicit PLN marker without requiring optional grants", () => {
    const values = new Map([[CONSENT_STORAGE_KEY, JSON.stringify(createConsentRecord())]]);
    vi.stubGlobal("window", { localStorage: { getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); } }, dispatchEvent: vi.fn() });
    const saved = saveHealthCheck(complete);
    expect(saved.currency).toBe("PLN"); expect(saved.source).toBe("local_diagnosis");
    expect(normalizeHealthCheckResult(JSON.parse(values.get(HEALTH_STORAGE_KEY)!))).toEqual(saved);
    expect(Object.values(createConsentRecord().optional)).toEqual([false, false, false, false]);
  });
});
