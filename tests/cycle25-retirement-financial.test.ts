import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stageLessons } from "@/data/stageLessons";
import { quizQuestions } from "@/data/quizQuestions";
import { getQuestionById } from "@/lib/allQuestions";

const locales = ["pl", "en"] as const;
type Locale = typeof locales[number];
const observations: Array<Record<string, unknown>> = [];

function material(locale: Locale, id: string, index: number, key: string, reward: number) {
  const lesson = stageLessons.retirement;
  if (!lesson) throw Error("Expected existing retirement lesson");
  const copy = lesson.copy[locale];
  if (!copy) throw Error("Expected existing retirement locale " + locale);
  const step = copy.steps[index];
  const canonical = getQuestionById(id, locale);
  const english = quizQuestions.find(question => question.id === id);
  if (!step || !canonical || !english) throw Error("Expected existing retirement material " + id);
  expect(canonical.correctAnswer).toBe(key); expect(canonical.reward).toBe(reward);
  expect(canonical.answers.map(answer => answer.id)).toEqual(["A", "B", "C", "D"]);
  return {
    step, canonical, english,
    text: [step.body, canonical.question, ...canonical.answers.map(answer => answer.text), canonical.explanation,
      ...(locale === "en" ? [english.successMessage, english.retryMessage] : [])].join("\n"),
  };
}

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw Error("C25 finance forbids network"); })));
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
afterAll(() => console.log("C25_FINANCIAL_OBSERVATIONS " + JSON.stringify(observations)));

describe("C25 independent retirement financial qualifications", () => {
  it.each(locales)("%s actual future-income planning protects current essentials and minimum repayments before optional saving", locale => {
    const purpose = material(locale, "retirement-purpose", 0, "B", 25);
    const guards = locale === "pl" ? {
      futureNeeds: /przysz|emeryt|po[^.!?\n]{0,35}pracy/i.test(purpose.text),
      essentialsFirst: /podstawow|niezbędn|potrzeb/i.test(purpose.text),
      minimumRepayments: /(?:minimaln|minimum|wymagan)[^.!?\n]{0,50}(?:spłat|rat)|(?:spłat|rat)[^.!?\n]{0,35}(?:minimaln|minimum|wymagan)/i.test(purpose.text),
      noSurplusAllowsPause: /bez nadwyż|brak nadwyż/i.test(purpose.text) && /pauz|wstrzym|nie musisz|bez obowiąz/i.test(purpose.text),
    } : {
      futureNeeds: /future|retire|after[^.!?\n]{0,35}work/i.test(purpose.text),
      essentialsFirst: /essential|basic needs/i.test(purpose.text),
      minimumRepayments: /minimum(?:\s+\w+){0,3}\s+(?:repayments?|payments?)|required\s+repayments?/i.test(purpose.text),
      noSurplusAllowsPause: /no surplus|without surplus/i.test(purpose.text) && /pause|no obligation|no investment required|need not|do not have to/i.test(purpose.text),
    };
    observations.push({ locale, scope: "future-income-planning", guards, purpose });
    expect(guards).toEqual({ futureNeeds: true, essentialsFirst: true, minimumRepayments: true, noSurplusAllowsPause: true });
  });

  it.each(locales)("%s actual growth illustration uses hypothetical PLN assumptions with costs and uncertainty made explicit", locale => {
    const growth = material(locale, "retirement-early-start", 1, "C", 35);
    const guards = locale === "pl" ? {
      polishCurrency: /zł|PLN/i.test(growth.text),
      foreignCurrencyAbsent: !/\$|\bUSD\b|dolar/i.test(growth.text),
      hypotheticalAssumptions: /hipotet|założ/i.test(growth.text),
      costsTaxInflationExplicit: /opłat|koszt/i.test(growth.text) && /podat/i.test(growth.text) && /inflac/i.test(growth.text),
      uncertainOutcome: /(?:nie|bez)[^.!?\n]{0,65}(?:gwaran|prognoz)|(?:strat|ryzyk)/i.test(growth.text),
    } : {
      polishCurrency: /\bPLN\b/.test(growth.text),
      foreignCurrencyAbsent: !/\$|\bUSD\b|dollars?/i.test(growth.text),
      hypotheticalAssumptions: /hypothet|assum/i.test(growth.text),
      costsTaxInflationExplicit: /fees?|costs?/i.test(growth.text) && /tax/i.test(growth.text) && /inflation/i.test(growth.text),
      uncertainOutcome: /(?:not|no)[^.!?\n]{0,65}(?:guarantee|forecast)|loss|risk/i.test(growth.text),
    };
    observations.push({ locale, scope: "conditional-growth-model", guards, growth });
    expect(guards).toEqual({ polishCurrency: true, foreignCurrencyAbsent: true, hypotheticalAssumptions: true,
      costsTaxInflationExplicit: true, uncertainOutcome: true });
  });

  it("actual EN feedback omits context-free age multipliers and catch-up payment comparisons", () => {
    const ids = ["retirement-purpose", "retirement-early-start"];
    const records = ids.map(id => {
      const question = quizQuestions.find(row => row.id === id);
      if (!question) throw Error("Expected existing retirement bank record " + id);
      return question;
    });
    const text = records.flatMap(question => [question.successMessage, question.retryMessage]).join("\n");
    const oldClaims = ["Starting at 25 vs 35 can mean 2× the final balance", "Starting at 45 would require ~$800/month for the same result"];
    const remaining = oldClaims.filter(claim => text.includes(claim));
    observations.push({ scope: "unqualified-age-comparisons", text, remaining });
    expect(remaining, "Remove comparisons without a complete shared model; this does not deny conditional compounding").toEqual([]);
  });
});
