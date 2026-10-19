import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stageLessons } from "@/data/stageLessons";
import { getQuestionById } from "@/lib/allQuestions";
import { quizQuestions } from "@/data/quizQuestions";
import metadata from "../docs/coachfi/cycle-15/content-metadata.json";

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw new Error("C15 financial review forbids real network"); })));
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
const locales = ["pl", "en"] as const;
const expected = [["inflation-basics", "B", 25], ["real-return", "D", 30], ["rule-of-72", "B", 30], ["inflation-hedge", "C", 25]] as const;
const question = (id: string, locale: "pl" | "en") => { const q = getQuestionById(id, locale); expect(q, id).toBeDefined(); return q!; };
const m = (id: string) => { const q = metadata.questions.find(row => row.id === id); expect(q, id).toBeDefined(); return q!; };
const percent = (text: string) => { const result = text.match(/[−+-]?\d+(?:[.,]\d+)?%/); expect(result).not.toBeNull(); return Number(result![0].replace("−", "-").replace(",", ".").replace("%", "")); };
const round = (value: number) => Number(value.toFixed(2));
function checkedLessonCopy(locale: "pl" | "en") {
  const copy = stageLessons.inflation.copy[locale];
  if (!copy) throw new Error("Expected inflation lesson copy: " + locale);
  return copy;
}
function checkedLessonStep(locale: "pl" | "en", index: number) {
  const step = checkedLessonCopy(locale).steps[index];
  if (!step) throw new Error("Expected inflation lesson step: " + locale + "/" + index);
  return step;
}
function checkedMetadataStep(index: number, locale: "pl" | "en") {
  const step = metadata.steps[index];
  if (!step) throw new Error("Expected reviewed metadata step: " + index);
  const copy = step.copy[locale];
  if (!copy) throw new Error("Expected reviewed metadata step copy: " + locale + "/" + index);
  return copy;
}

// Exact fractions in grosze, independent of application calculators and content metadata.
const principal = BigInt("100000"), priceFactorNumerator = BigInt("105"), priceFactorDenominator = BigInt("100");
const finalNominalGrosze = principal * BigInt("102") / BigInt("100");
const finalRealGroszeNumerator = finalNominalGrosze * priceFactorDenominator;
const realPLN = Number(finalRealGroszeNumerator) / Number(priceFactorNumerator) / 100;
const realRate = Number(finalRealGroszeNumerator - principal * priceFactorNumerator) / Number(principal * priceFactorNumerator) * 100;

describe("C15 independent existing question identity and reviewed metadata delivery", () => {
  it.each(expected.flatMap(row => locales.map(locale => [row[0], row[1], row[2], locale] as const)))("%s/%s/%s/%s retains ID/key/reward/ABCD and canonical localized feedback", (id, key, reward, locale) => {
    const q = question(id, locale), documented = m(id).copy[locale];
    expect(q.id).toBe(id); expect(q.correctAnswer).toBe(key); expect(q.reward).toBe(reward);
    expect(q.answers.map(answer => answer.id)).toEqual(["A", "B", "C", "D"]);
    expect(q.question).toBe(documented.question); expect(q.answers).toEqual(documented.answers); expect(q.explanation).toBe(documented.retryMessage);
    if (locale === "en") { const en = quizQuestions.find(candidate => candidate.id === id)!; expect(en.successMessage).toBe(documented.successMessage); }
    expect(m(id).correct_answer).toBe(key); expect(m(id).reward).toBe(reward);
  });
  it("four IDs have eight language versions and unchanged110 total, with explicit country/source/version assumptions", () => {
    expect(metadata.questions.map(row => row.id)).toEqual(expected.map(row => row[0])); expect(new Set(metadata.questions.map(row => row.id)).size).toBe(4);
    expect(metadata.distinct_existing_questions).toBe(4); expect(metadata.language_versions).toBe(8); expect(metadata.new_question_ids).toBe(0);
    expect(expected.reduce((sum, row) => sum + row[2], 0)).toBe(110); expect(metadata.reward_total).toBe(110);
    expect(metadata.market_country).toBe("PL"); expect(metadata.languages).toEqual(["pl", "en"]);
    for (const row of metadata.questions) { expect(row.country).toBe("PL"); expect(row.version).toBe("inflation-pl-en-v1"); expect(row.source_ids.length).toBeGreaterThan(0); expect(row.created_date).toBe("2026-10-15"); }
  });
  it.each(expected)("%s has precisely its three wrong options with bilingual rationale, rather than a second correct key", id => {
    const row = m(id), wrong = row.wrong_option_explanations;
    expect(Object.keys(wrong).sort()).toEqual(["A", "B", "C", "D"].filter(key => key !== row.correct_answer));
    for (const explanation of Object.values(wrong)) { expect(explanation!.pl.length).toBeGreaterThan(20); expect(explanation!.en.length).toBeGreaterThan(20); }
    for (const locale of locales) expect(question(id, locale).answers.filter(answer => answer.id === row.correct_answer)).toHaveLength(1);
  });
});

describe("C15 independent numeric and financial meaning", () => {
  it.each(locales)("%s basket arithmetic and broad definition distinguish individual and household prices", locale => {
    const increase = Number((BigInt("105000") - BigInt("100000")) * BigInt("100")) / Number(BigInt("100000"));
    expect(increase).toBe(5); const q = question("inflation-basics", locale), body = checkedLessonStep(locale, 0).body;
    expect(percent(q.answers.find(answer => answer.id === "B")!.text)).toBe(increase);
    expect(q.explanation).toMatch(/weighted basket|ważonego koszyka/); expect(q.explanation).toMatch(/households|Gospodarstwa/);
    expect(body).toMatch(/Some prices can fall|Niektóre ceny mogą spadać/); expect(body).toMatch(/household|gospodarstwa/);
    expect(body).toMatch(/hypothetical|hipotetyczny/); expect(body).toMatch(/PLN|zł/);
  });
  it.each(locales)("%s real return is exact-ratio minus2.86 rounded; minus3 is only a subtraction estimate", locale => {
    const q = question("real-return", locale), gold = q.answers.find(answer => answer.id === "D")!.text, body = checkedLessonStep(locale, 1).body;
    expect(realRate).toBeCloseTo(-100 / 35, 12); expect(round(realPLN)).toBe(971.43);
    expect(percent(gold)).toBe(round(realRate)); expect(gold).toMatch(/Approximately|Około/);
    expect(q.answers.filter(answer => percent(answer.text) === round(realRate))).toHaveLength(1);
    expect(q.question).toMatch(/one year|Przez rok/); expect(q.question).toMatch(/no fees, tax or cash flows|bez opłat, podatku i przepływów/);
    expect(q.explanation).toContain(locale === "pl" ? "971,43" : "971.43"); expect(q.explanation).toMatch(/only a subtraction estimate|tylko przybliżeniem/);
    expect(body).toContain(locale === "pl" ? "−2,86%" : "−2.86%"); expect(body).toMatch(/approximation −3%|przybliżenie −3%/);
    const assumption = m("real-return").calculation_assumptions as Record<string, unknown>;
    expect(assumption.final_nominal_amount).toBe(Number(finalNominalGrosze) / 100); expect(assumption.final_real_amount_rounded).toBe(round(realPLN)); expect(assumption.real_return_percent_rounded).toBe(round(realRate));
  });
  it.each(locales)("%s rule72 estimates nominal doubling from positive fixed compound rate with no cash flows or guarantee", locale => {
    const q = question("rule-of-72", locale), body = checkedLessonStep(locale, 2).body, gold = q.answers.find(answer => answer.id === "B")!.text;
    expect(72 / 6).toBe(12); expect(72 / 8).toBe(9);
    expect(gold).toMatch(/About 12|Około 12/); expect(gold).toMatch(/without a guarantee|bez gwarancji/);
    expect(q.question).toMatch(/fixed 6% nominal|stałe nominalne 6%/); expect(q.question).toMatch(/annual compounding|roczną kapitalizację/);
    expect(q.explanation).toMatch(/positive annual|dodatnia roczna/); expect(q.explanation).toMatch(/inflation is excluded|pomijamy inflację/);
    expect(body).toMatch(/no deposits or withdrawals|bez dopłat i wypłat/); expect(body).toMatch(/reinvestment|reinwestowaniu/); expect(body).toMatch(/fees, taxes and inflation|opłaty, podatki i inflację/);
    expect(body).toMatch(/8%.*9/); expect(body).toMatch(/do not have to invest|nie musisz inwestować/);
    const twelveYearGrowth = Number(BigInt("106") ** BigInt("12")) / Number(BigInt("100") ** BigInt("12"));
    expect(twelveYearGrowth).toBeGreaterThan(2); expect(twelveYearGrowth).not.toBe(2);
    const nineYearGrowth = Number(BigInt("108") ** BigInt("9")) / Number(BigInt("100") ** BigInt("9")); expect(nineYearGrowth).toBeLessThan(2);
    const assumption = m("rule-of-72").calculation_assumptions as Record<string, unknown>;
    expect(assumption.estimated_years).toBe(12); expect(assumption.constant_positive_rate).toBe(true); expect(assumption.additional_contributions).toBe(0); expect(assumption.withdrawals).toBe(0);
  });
  it.each(locales)("%s critical-risk response replaces best-hedge promotion and independently proves a10percent nominal loss", locale => {
    const q = question("inflation-hedge", locale), body = checkedLessonStep(locale, 3).body, gold = q.answers.find(answer => answer.id === "C")!.text;
    expect(q.question).not.toMatch(/best|lepsz|najlepsz/i); expect(gold).toMatch(/loss risk|ryzyko straty/); expect(gold).toMatch(/costs and access|koszty i dostęp/);
    const lossGrosze = BigInt("100000") - BigInt("90000"); expect(Number(lossGrosze) / 100).toBe(100); expect(Number(lossGrosze) / Number(BigInt("100000")) * 100).toBe(10);
    expect(body).toContain("10%"); expect(body).toMatch(/diversification does not remove all risk|dywersyfikacja nie usuwa całego ryzyka/);
    expect(q.explanation).toMatch(/not guarantees|nie są gwarancją/); expect(body).toMatch(/essential spending and required minimum|niezbędne wydatki i wymagane minimalne/);
    expect(body).toMatch(/irregular income|nieregularnym dochodzie/); expect(body).toMatch(/does not require a purchase|nie wymaga zakupu/);
    const assumption = m("inflation-hedge").calculation_assumptions as Record<string, unknown>; expect(assumption.nominal_loss).toBe(100); expect(assumption.nominal_loss_percent).toBe(10);
  });
  it.each(locales)("%s four reviewed steps have small exercises/actions and a calm return without product or market expansion", locale => {
    const steps = checkedLessonCopy(locale).steps; expect(steps).toHaveLength(4);
    for (const [index, step] of steps.entries()) { expect(step).toEqual(checkedMetadataStep(index, locale)); expect(step.body).toMatch(/Try:|Ćwiczenie:/); expect(step.body).toMatch(/Action:|Działanie:/); expect(step.body).toMatch(/After a break|Po przerwie/); expect(step.body).not.toMatch(/USD|S&P|FDIC|SIPC/); }
    expect(stageLessons.inflation.quizHref).toBe("/quiz?topic=inflation");
  });
});
