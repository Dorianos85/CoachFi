import { describe, expect, it, vi } from "vitest";
import { buildInflationScenario, calculatePurchasingPowerLoss, calculateRealValue, InflationCalculationError,
  INFLATION_DEFAULTS, INFLATION_LIMITS, parseInflationInput, type InflationAssumptions } from "@/lib/inflation";
function errorCode(call: () => unknown, code: string) {
  try { call(); throw new Error("MISSING_ERROR"); }
  catch (error) { expect(error).toBeInstanceOf(InflationCalculationError); expect((error as InflationCalculationError).code).toBe(code); }
}
const zeroGrowth = Object.freeze({ annualContribution: 0, annualNominalReturnPercent: 0 });

describe("C14 author strict raw parser", () => {
  it.each([{ raw: "0", value: 0 }, { raw: "-0", value: 0 }, { raw: " 12.50 ", value: 12.5 },
    { raw: "12,50", value: 12.5 }, { raw: "+7", value: 7 }, { raw: "-.5", value: -0.5 },
    { raw: ",5", value: 0.5 }, { raw: "1,000", value: 1 }, { raw: "1.000", value: 1 },
    { raw: "0".repeat(64), value: 0 }])("parses $raw as literal decimal $value without locale dependence", ({ raw, value }) => {
    expect(parseInflationInput(raw)).toBe(value);
  });
  it.each(["", " ", ".", ",", "-", "1.", "1,", "1 000", "1,000.00", "1.000,00", "1_000", "1e2", "0x10", "Infinity", "NaN", "7junk", "++1", "1\n2", "٠١", "0".repeat(65), 7, null, undefined, false, {}, new String("7")])("rejects invalid raw %s without coercion", raw => {
    errorCode(() => parseInflationInput(raw), "invalid-input");
  });
});

describe("C14 author input ranges before computation/allocation", () => {
  it.each([NaN, Infinity, -Infinity, "7", null, false, undefined])("rejects nonfinite/nonnumber amount %s in all public calculators", bad => {
    errorCode(() => calculateRealValue(bad as number, 1, 7), "invalid-input");
    errorCode(() => calculatePurchasingPowerLoss(bad as number, 1, 7), "invalid-input");
    errorCode(() => buildInflationScenario(bad as number, 1, 7), "invalid-input");
  });
  it.each([-1, 1e12 + 1])("rejects out-of-range amount %s", amount => {
    errorCode(() => calculateRealValue(amount, 0, 0), "out-of-range"); errorCode(() => buildInflationScenario(amount, 0, 0), "out-of-range");
  });
  it.each([{ years: NaN, code: "invalid-input" }, { years: Infinity, code: "invalid-input" },
    { years: -1, code: "out-of-range" }, { years: 101, code: "out-of-range" }, { years: 1e9, code: "out-of-range" },
    { years: 0.5, code: "invalid-input" }, { years: 5.5, code: "invalid-input" }])("rejects years $years safely without scenario allocation", ({ years, code }) => {
    const spy = vi.spyOn(Array, "from");
    try { errorCode(() => calculateRealValue(1000, years, 7), code); errorCode(() => buildInflationScenario(1000, years, 7), code); expect(spy).not.toHaveBeenCalled(); }
    finally { spy.mockRestore(); }
  });
  it.each([{ rate: NaN, code: "invalid-input" }, { rate: Infinity, code: "invalid-input" },
    { rate: -100, code: "out-of-range" }, { rate: -99.001, code: "out-of-range" }, { rate: 100.001, code: "out-of-range" }])("rejects inflation rate $rate even at horizon0", ({ rate, code }) => {
    errorCode(() => calculateRealValue(1000, 0, rate), code); errorCode(() => buildInflationScenario(1000, 0, rate), code);
  });
  it.each([-99, 0, 7.5, 100])("admits inflation rate boundary %s", rate => {
    expect(calculateRealValue(100, 1, rate)).toBeCloseTo(100 / (1 + rate / 100), 8);
  });
  it.each([{ annualContribution: -1, annualNominalReturnPercent: 0, code: "out-of-range" },
    { annualContribution: 1e12 + 1, annualNominalReturnPercent: 0, code: "out-of-range" },
    { annualContribution: NaN, annualNominalReturnPercent: 0, code: "invalid-input" },
    { annualContribution: 0, annualNominalReturnPercent: Infinity, code: "invalid-input" },
    { annualContribution: 0, annualNominalReturnPercent: -100.001, code: "out-of-range" },
    { annualContribution: 0, annualNominalReturnPercent: 100.001, code: "out-of-range" }])("rejects scenario assumptions $code", ({ code, ...options }) => {
    errorCode(() => buildInflationScenario(1000, 0, 0, options), code);
  });
  it.each([null, [], {}, { annualContribution: 0 }, { annualContribution: 0, annualNominalReturnPercent: 0, extra: true },
    Object.create({ annualContribution: 0, annualNominalReturnPercent: 0 })])("rejects incomplete/unknown/prototype assumptions %s", bad => {
    errorCode(() => buildInflationScenario(1000, 0, 0, bad as unknown as InflationAssumptions), "invalid-input");
  });
  it("rejects accessor assumptions without invoking the getter", () => {
    const read = vi.fn(() => 0), options = { get annualContribution() { return read(); }, annualNominalReturnPercent: 0 };
    errorCode(() => buildInflationScenario(1000, 1, 0, options), "invalid-input"); expect(read).not.toHaveBeenCalled();
  });
  it("reports typed invalid input for a revoked options proxy", () => {
    const { proxy, revoke } = Proxy.revocable({ ...zeroGrowth }, {}); revoke();
    errorCode(() => buildInflationScenario(1000, 1, 0, proxy), "invalid-input");
  });
});

describe("C14 author deterministic monetary math and explicit comparison", () => {
  it("discounts compound10percent inflation over two years, with signed loss identity", () => {
    const value = calculateRealValue(1000, 2, 10), loss = calculatePurchasingPowerLoss(1000, 2, 10);
    expect(value).toBeCloseTo(1000 / 1.21, 10); expect(loss).toBeCloseTo(1000 - 1000 / 1.21, 10); expect(value + loss).toBeCloseTo(1000, 10);
  });
  it("deflation is permitted and signed loss is negative", () => {
    expect(calculateRealValue(1000, 1, -50)).toBe(2000); expect(calculatePurchasingPowerLoss(1000, 1, -50)).toBe(-1000);
  });
  it.each([{ amount: 0, years: 5, rate: 7 }, { amount: 1000, years: 0, rate: 7 }, { amount: 1000, years: 5, rate: 0 }])("correct mathematical zero loss is not fabricated for $amount/$years/$rate", ({ amount, years, rate }) => {
    expect(calculatePurchasingPowerLoss(amount, years, rate)).toBe(0);
  });
  it("equal2400 year-end contributions include growth of previous deposits only", () => {
    const rows = buildInflationScenario(1000, 2, 0);
    expect(rows[0]).toEqual({ year: "Y0", "Cash only": 1000, "Saving habit": 1000, "Long-term investing scenario": 1000 });
    expect(rows[1]["Saving habit"]).toBe(3400); expect(rows[1]["Long-term investing scenario"]).toBeCloseTo(3455, 10);
    expect(rows[2]["Saving habit"]).toBe(5800); expect(rows[2]["Long-term investing scenario"]).toBeCloseTo(6045.025, 8);
  });
  it("zero nominal return makes the two contributed series identical", () => {
    const rows = buildInflationScenario(1000, 5, 7, { annualContribution: 100, annualNominalReturnPercent: 0 });
    rows.forEach((row, year) => { expect(row["Saving habit"]).toBe(row["Long-term investing scenario"]); expect(row["Saving habit"]).toBeCloseTo((1000 + year * 100) / 1.07 ** year, 9); });
  });
  it.each([-50, -100])("hypothetical return %s may lose capital without promising protection", rate => {
    const rows = buildInflationScenario(1000, 2, 0, { annualContribution: 0, annualNominalReturnPercent: rate });
    expect(rows[2]["Long-term investing scenario"]).toBe(rate === -100 ? 0 : 250); expect(rows[2]["Long-term investing scenario"]).toBeLessThan(rows[2]["Cash only"]);
  });
  it("full100percent loss happens before each valid year-end contribution", () => {
    const rows = buildInflationScenario(1000, 2, 0, { annualContribution: 100, annualNominalReturnPercent: -100 });
    expect(rows[1]["Long-term investing scenario"]).toBe(100); expect(rows[2]["Long-term investing scenario"]).toBe(100);
  });
  it("positive tiny inflation produces nonzero stable signed loss instead of cancellation zero", () => {
    expect(calculatePurchasingPowerLoss(1000, 1, 1e-20)).toBeGreaterThan(0);
  });
  it("default100year scenario is bounded to101rows and final cash matches scalar", () => {
    const rows = buildInflationScenario(1000, 100, 7); expect(rows.length).toBe(101); expect(rows[100].year).toBe("Y100");
    expect(rows[100]["Cash only"]).toBe(calculateRealValue(1000, 100, 7));
    rows.forEach(row => { expect(Object.keys(row)).toEqual(["year", "Cash only", "Saving habit", "Long-term investing scenario"]); Object.values(row).filter(value => typeof value === "number").forEach(value => { expect(Number.isFinite(value)).toBe(true); expect(Math.abs(value as number)).toBeLessThanOrEqual(1e12); }); });
  });
});

describe("C14 author output safety and immutable model", () => {
  it("admitted inclusive monetary max remains valid when no growth or deposits exceed it", () => {
    expect(calculateRealValue(1e12, 0, -99)).toBe(1e12);
    expect(buildInflationScenario(1e12, 1, 0, zeroGrowth)[1]["Long-term investing scenario"]).toBe(1e12);
    expect(buildInflationScenario(0, 1, 0, { annualContribution: 1e12, annualNominalReturnPercent: 100 })[1]["Saving habit"]).toBe(1e12);
  });
  it("unsafe real value under deflation is rejected instead of clamping", () => {
    errorCode(() => calculateRealValue(1e12, 1, -99), "unrepresentable-result"); errorCode(() => calculatePurchasingPowerLoss(1e12, 1, -99), "unrepresentable-result");
    errorCode(() => buildInflationScenario(1e12, 1, -99, zeroGrowth), "unrepresentable-result");
  });
  it("monetary intermediate cap blocks oversize deposits or growth even if discount would hide it", () => {
    errorCode(() => buildInflationScenario(1e12, 1, 100, { annualContribution: 1, annualNominalReturnPercent: 0 }), "unrepresentable-result");
    errorCode(() => buildInflationScenario(1e12, 1, 100, { annualContribution: 0, annualNominalReturnPercent: 100 }), "unrepresentable-result");
  });
  it("positive division/multiplication underflow never becomes fabricated zero; genuine full loss does", () => {
    errorCode(() => calculateRealValue(Number.MIN_VALUE, 1, 100), "unrepresentable-result");
    errorCode(() => buildInflationScenario(Number.MIN_VALUE, 1, 0, { annualContribution: 0, annualNominalReturnPercent: -99 }), "unrepresentable-result");
    expect(buildInflationScenario(Number.MIN_VALUE, 1, 0, { annualContribution: 0, annualNominalReturnPercent: -100 })[1]["Long-term investing scenario"]).toBe(0);
  });
  it("default assumptions, limits and every returned row/array are frozen", () => {
    expect(INFLATION_DEFAULTS).toEqual({ annualContribution: 2400, annualNominalReturnPercent: 5.5 }); expect(Object.isFrozen(INFLATION_DEFAULTS)).toBe(true); expect(Object.isFrozen(INFLATION_LIMITS)).toBe(true);
    const chosen = Object.freeze({ annualContribution: 10, annualNominalReturnPercent: 2 }), before = JSON.stringify(chosen);
    const first = buildInflationScenario(1000, 2, 7, chosen), second = buildInflationScenario(1000, 2, 7, chosen);
    expect(first).toEqual(second); expect(JSON.stringify(chosen)).toBe(before); expect(Object.isFrozen(first)).toBe(true); expect(first.every(Object.isFrozen)).toBe(true);
    expect(() => (first as unknown as Array<unknown>).push({})).toThrow(); expect(() => { (first[0] as unknown as { year: string }).year = "BROKEN"; }).toThrow();
  });
});
