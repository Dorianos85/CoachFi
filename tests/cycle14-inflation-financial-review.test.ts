import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildInflationScenario, calculatePurchasingPowerLoss, calculateRealValue,
  InflationCalculationError, INFLATION_DEFAULTS, INFLATION_LIMITS, parseInflationInput,
  type InflationAssumptions,
} from "@/lib/inflation";

let network: ReturnType<typeof vi.fn<typeof fetch>>;
beforeEach(() => { network = vi.fn<typeof fetch>(() => { throw new Error("Real network forbidden in inflation financial review."); }); vi.stubGlobal("fetch", network); });
afterEach(() => { expect(network).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });

function failure(operation: () => unknown, code: string) {
  let caught: unknown;
  try { operation(); } catch (error) { caught = error; }
  expect(caught).toBeInstanceOf(InflationCalculationError);
  expect((caught as InflationCalculationError).code).toBe(code);
}
type Q = { n: bigint; d: bigint };
const q = (n: bigint, d = BigInt("1")): Q => ({ n, d });
const add = (a: Q, b: Q): Q => q(a.n * b.d + b.n * a.d, a.d * b.d);
const mul = (a: Q, b: Q): Q => q(a.n * b.n, a.d * b.d);
const div = (a: Q, b: Q): Q => q(a.n * b.d, a.d * b.n);
const pow = (a: Q, years: number): Q => q(a.n ** BigInt(years), a.d ** BigInt(years));
const value = (a: Q) => Number(a.n) / Number(a.d);
// Independent closed-form geometric sum in grosze; no helper recurrence or yearly rounding.
function oracle(initialGrosze: bigint, contributionGrosze: bigint, year: number, price: Q, growth: Q) {
  let contributionTerms = q(BigInt("0"));
  for (let age = 0; age < year; age++) contributionTerms = add(contributionTerms, pow(growth, age));
  const investing = add(mul(q(initialGrosze), pow(growth, year)), mul(q(contributionGrosze), contributionTerms));
  const divisor = mul(q(BigInt("100")), pow(price, year));
  return {
    cash: value(div(q(initialGrosze), divisor)),
    saving: value(div(q(initialGrosze + contributionGrosze * BigInt(year)), divisor)),
    investing: value(div(investing, divisor)),
  };
}

describe("C14 independent plain decimal parser", () => {
  it.each([["0", 0], ["-0", 0], ["+5", 5], [".5", 0.5], [",5", 0.5], ["1.5", 1.5], ["1,5", 1.5], [" \t7.25\n", 7.25], ["1,000", 1]] as const)(
    "plain %s means %s irrespective of display locale; comma is decimal, never grouping", (raw, expected) => {
      expect(parseInflationInput(raw)).toBe(expected);
    });
  it.each([undefined, null, 0, true, {}, [], "", " ", "1e3", "0x10", "1.2.3", "1,2,3", "1,234.56", "1 234", "1_234", "5%", "NaN", "Infinity", "−5", "1.", "1,", " ".repeat(64) + "1"])(
    "malformed or non-string %s is not silently coerced", raw => failure(() => parseInflationInput(raw), "invalid-input"));
  it("length64 is accepted before trim while length65 is rejected without numeric coercion", () => {
    expect(parseInflationInput(" ".repeat(63) + "1")).toBe(1);
    failure(() => parseInflationInput(" ".repeat(64) + "1"), "invalid-input");
    const stringify = vi.fn(() => "1"); failure(() => parseInflationInput({ toString: stringify }), "invalid-input"); expect(stringify).not.toHaveBeenCalled();
  });
});

describe("C14 independent bounded admission", () => {
  const invalid: Array<[unknown, unknown, unknown, string]> = [
    [NaN, 1, 5, "invalid-input"], [Infinity, 1, 5, "invalid-input"], [-Infinity, 1, 5, "invalid-input"],
    ["1000", 1, 5, "invalid-input"], [null, 1, 5, "invalid-input"], [-1, 1, 5, "out-of-range"], [1e12 + 1, 1, 5, "out-of-range"],
    [1000, NaN, 5, "invalid-input"], [1000, Infinity, 5, "invalid-input"], [1000, 2.5, 5, "invalid-input"],
    [1000, -1, 5, "out-of-range"], [1000, 101, 5, "out-of-range"], [1000, 1, NaN, "invalid-input"],
    [1000, 1, Infinity, "invalid-input"], [1000, 1, -100, "out-of-range"], [1000, 1, -101, "out-of-range"], [1000, 1, 101, "out-of-range"],
  ];
  it.each(invalid)("invalid amount/years/rate %s/%s/%s produces only typed %s in all three APIs", (amount, years, rate, code) => {
    const args = [amount, years, rate] as [number, number, number];
    for (const calculate of [calculateRealValue, calculatePurchasingPowerLoss, buildInflationScenario]) failure(() => calculate(...args), code);
  });
  it.each([null, [], {}, { annualContribution: 1 }, { annualContribution: 1, annualNominalReturnPercent: 0, future: 1 }])(
    "invalid assumptions %s cannot introduce hidden defaults or unknown fields", assumptions => {
      failure(() => buildInflationScenario(1000, 1, 5, assumptions as InflationAssumptions), "invalid-input");
    });
  it("inherited-only, accessor and revoked-proxy assumptions are rejected without invoking accessors", () => {
    failure(() => buildInflationScenario(1000, 1, 5, Object.create({ annualContribution: 1, annualNominalReturnPercent: 0 })), "invalid-input");
    const getter = vi.fn(() => 1); const accessor = { get annualContribution() { return getter(); }, annualNominalReturnPercent: 0 };
    failure(() => buildInflationScenario(1000, 1, 5, accessor), "invalid-input"); expect(getter).not.toHaveBeenCalled();
    const proxy = Proxy.revocable({ annualContribution: 1, annualNominalReturnPercent: 0 }, {}); proxy.revoke();
    failure(() => buildInflationScenario(1000, 1, 5, proxy.proxy), "invalid-input");
  });
  it.each([
    [{ annualContribution: -1, annualNominalReturnPercent: 0 }, "out-of-range"],
    [{ annualContribution: 1e12 + 1, annualNominalReturnPercent: 0 }, "out-of-range"],
    [{ annualContribution: NaN, annualNominalReturnPercent: 0 }, "invalid-input"],
    [{ annualContribution: 0, annualNominalReturnPercent: -101 }, "out-of-range"],
    [{ annualContribution: 0, annualNominalReturnPercent: 101 }, "out-of-range"],
    [{ annualContribution: 0, annualNominalReturnPercent: Infinity }, "invalid-input"],
  ] as const)("invalid C/nominal rate %s gets typed %s", (assumptions, code) => {
    failure(() => buildInflationScenario(1000, 1, 5, assumptions), code);
  });
});

describe("C14 independent exact grosze and rational-term financial oracles", () => {
  const cases = [
    { p: BigInt("100000"), c: BigInt("10000"), years: 2, price: q(BigInt("110"), BigInt("100")), growth: q(BigInt("110"), BigInt("100")), inflation: 10, nominal: 10 },
    { p: BigInt("0"), c: BigInt("300000"), years: 3, price: q(BigInt("1")), growth: q(BigInt("211"), BigInt("200")), inflation: 0, nominal: 5.5 },
    { p: BigInt("5000"), c: BigInt("10000"), years: 3, price: q(BigInt("95"), BigInt("100")), growth: q(BigInt("80"), BigInt("100")), inflation: -5, nominal: -20 },
    { p: BigInt("1"), c: BigInt("0"), years: 4, price: q(BigInt("107"), BigInt("100")), growth: q(BigInt("211"), BigInt("200")), inflation: 7, nominal: 5.5 },
    { p: BigInt("100000"), c: BigInt("10000"), years: 3, price: q(BigInt("105"), BigInt("100")), growth: q(BigInt("0")), inflation: 5, nominal: -100 },
    { p: BigInt("100000"), c: BigInt("0"), years: 5, price: q(BigInt("105"), BigInt("100")), growth: q(BigInt("1")), inflation: 5, nominal: 0 },
    { p: BigInt("100000"), c: BigInt("0"), years: 1, price: q(BigInt("110"), BigInt("100")), growth: q(BigInt("105"), BigInt("100")), inflation: 10, nominal: 5 },
  ];
  it.each(cases)("all year-end real series match independent closed-form %o", ({ p, c, years, price, growth, inflation, nominal }) => {
    const options = Object.freeze({ annualContribution: Number(c) / 100, annualNominalReturnPercent: nominal });
    const rows = buildInflationScenario(Number(p) / 100, years, inflation, options);
    expect(rows).toHaveLength(years + 1); expect(Object.isFrozen(rows)).toBe(true);
    for (let year = 0; year <= years; year++) {
      const expected = oracle(p, c, year, price, growth), actual = rows[year];
      expect(actual.year).toBe("Y" + year); expect(Object.keys(actual)).toEqual(["year", "Cash only", "Saving habit", "Long-term investing scenario"]);
      expect(Object.isFrozen(actual)).toBe(true);
      expect(actual["Cash only"]).toBeCloseTo(expected.cash, 9);
      expect(actual["Saving habit"]).toBeCloseTo(expected.saving, 9);
      expect(actual["Long-term investing scenario"]).toBeCloseTo(expected.investing, 9);
      expect(actual["Cash only"]).toBe(calculateRealValue(Number(p) / 100, year, inflation));
    }
    expect(options).toEqual({ annualContribution: Number(c) / 100, annualNominalReturnPercent: nominal });
  });
  it("default2400/5.5 is explicit immutable same-C; initial0 has no artificial first-year lead", () => {
    expect(INFLATION_DEFAULTS).toEqual({ annualContribution: 2400, annualNominalReturnPercent: 5.5 }); expect(Object.isFrozen(INFLATION_DEFAULTS)).toBe(true);
    const rows = buildInflationScenario(0, 2, 0); expect(rows[1]["Saving habit"]).toBe(2400); expect(rows[1]["Long-term investing scenario"]).toBe(2400);
    expect(rows[2]["Saving habit"]).toBe(4800); expect(rows[2]["Long-term investing scenario"]).toBeCloseTo(4932, 9);
  });
  it("hand-check two default years1000: saving3400/5800, investing3455/6045.025 without yearly rounding", () => {
    const rows = buildInflationScenario(1000, 2, 0);
    expect(rows[1]["Saving habit"]).toBe(3400); expect(rows[2]["Saving habit"]).toBe(5800);
    expect(rows[1]["Long-term investing scenario"]).toBeCloseTo(3455, 9); expect(rows[2]["Long-term investing scenario"]).toBeCloseTo(6045.025, 9);
  });
  it("nominal growth can still be a real loss:1050/1.10 is below1000", () => {
    const rows = buildInflationScenario(1000, 1, 10, { annualContribution: 0, annualNominalReturnPercent: 5 });
    expect(rows[1]["Long-term investing scenario"]).toBeCloseTo(105000 / 110, 9); expect(rows[1]["Long-term investing scenario"]).toBeLessThan(1000);
  });
  it("deflation gives a signed negative purchasing-power loss; initial real value increases", () => {
    const real = calculateRealValue(1000, 1, -5), loss = calculatePurchasingPowerLoss(1000, 1, -5);
    expect(real).toBeCloseTo(100000 / 95, 9); expect(loss).toBeCloseTo(-5000 / 95, 9); expect(loss).toBeLessThan(0); expect(real + loss).toBeCloseTo(1000, 9);
  });
  it("zero-year and zero-rate loss are mathematical zero, full nominal wipeout0 is intentional", () => {
    expect(calculateRealValue(1e12, 0, -99)).toBe(1e12); expect(calculatePurchasingPowerLoss(1e12, 0, -99)).toBe(0);
    expect(calculatePurchasingPowerLoss(1000, 100, 0)).toBe(0);
    expect(buildInflationScenario(1000, 1, 0, { annualContribution: 0, annualNominalReturnPercent: -100 })[1]["Long-term investing scenario"]).toBe(0);
  });
  it("bounded year100 produces101 frozen zero rows with no allocation beyond the approved horizon", () => {
    const rows = buildInflationScenario(0, 100, -99, { annualContribution: 0, annualNominalReturnPercent: -100 });
    expect(rows).toHaveLength(101); expect(rows.every(row => Object.isFrozen(row) && row["Cash only"] === 0 && row["Saving habit"] === 0 && row["Long-term investing scenario"] === 0)).toBe(true);
    expect(Object.isFrozen(INFLATION_LIMITS)).toBe(true); expect(INFLATION_LIMITS.maxYears).toBe(100);
  });
  it("tiny positive inflation loss avoids a fabricated zero from cancelling near-equal cash values", () => {
    const actual = calculatePurchasingPowerLoss(1, 1, 1e-14), expected = 1 / Number(BigInt("10000000000000001"));
    expect(actual).toBeGreaterThan(0); expect(Math.abs((actual - expected) / expected)).toBeLessThan(1e-12);
  });
});

describe("C14 independent representability refusals", () => {
  it("nominal investing intermediate over1e12 is refused even if deflated real output would fit", () => {
    failure(() => buildInflationScenario(1e12, 1, 100, { annualContribution: 0, annualNominalReturnPercent: 100 }), "unrepresentable-result");
  });
  it("nominal saving intermediate over1e12 is refused before a misleading inflation discount", () => {
    failure(() => buildInflationScenario(1e12, 1, 100, { annualContribution: 1e12, annualNominalReturnPercent: 0 }), "unrepresentable-result");
  });
  it("real output over1e12 and positive output underflow cannot become valid results", () => {
    failure(() => calculateRealValue(1e12, 1, -50), "unrepresentable-result");
    failure(() => calculatePurchasingPowerLoss(1e12, 1, -50), "unrepresentable-result");
    failure(() => calculateRealValue(Number.MIN_VALUE, 1, 100), "unrepresentable-result");
    failure(() => buildInflationScenario(Number.MIN_VALUE, 1, 0, { annualContribution: 0, annualNominalReturnPercent: -99 }), "unrepresentable-result");
  });
});
