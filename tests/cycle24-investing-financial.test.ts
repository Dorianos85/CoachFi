import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stageLessons } from "@/data/stageLessons";
import { quizQuestions } from "@/data/quizQuestions";
import { getQuestionById } from "@/lib/allQuestions";

const locales = ["pl", "en"] as const;
type Locale = typeof locales[number];
const observations: Array<Record<string, unknown>> = [];

function material(locale: Locale, id: string, index: number, key: string, reward: number) {
  const lesson = stageLessons["long-term-investing"];
  if (!lesson) throw Error("Expected existing long-term lesson");
  const copy = lesson.copy[locale];
  if (!copy) throw Error("Expected existing lesson locale " + locale);
  const step = copy.steps[index];
  if (!step) throw Error("Expected existing lesson step " + index);
  const canonical = getQuestionById(id, locale);
  const english = quizQuestions.find(question => question.id === id);
  if (!canonical || !english) throw Error("Expected existing canonical investment question " + id);
  expect(canonical.correctAnswer).toBe(key); expect(canonical.reward).toBe(reward);
  expect(canonical.answers.map(answer => answer.id)).toEqual(["A", "B", "C", "D"]);
  return {
    step, canonical, english,
    text: [step.body, canonical.question, canonical.explanation,
      ...(locale === "en" ? [english.successMessage, english.retryMessage] : [])].join("\n"),
  };
}

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw Error("C24 finance forbids network"); })));
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
afterAll(() => console.log("C24_FINANCIAL_OBSERVATIONS " + JSON.stringify(observations)));

describe("C24 independent investing financial qualifications", () => {
  it.each(locales)("%s actual index and ETF material separates strategy from wrapper and qualifies costs", locale => {
    const index = material(locale, "index-fund", 2, "B", 25);
    const etf = material(locale, "etf-definition", 3, "C", 25);
    const text = index.text + "\n" + etf.text;
    const guards = locale === "pl" ? {
      indexTracksBenchmark: /(?:śled|odwzor|naślad)[^.!?\n]{0,70}indeks/i.test(text),
      etfCanBeActive: /ETF[^.!?\n]{0,80}(?:może|mogą|bywa)[^.!?\n]{0,65}aktywn|aktywn[^.!?\n]{0,65}ETF/i.test(text),
      actualCostsNeedChecking: /(?:sprawd|porówn|nie każdy|nie zawsze)[^.!?\n]{0,100}(?:koszt|opłat)|(?:koszt|opłat)[^.!?\n]{0,65}(?:różn|sprawd|porówn)/i.test(text),
    } : {
      indexTracksBenchmark: /(?:track|follow|replicat)[^.!?\n]{0,70}(?:index|benchmark)/i.test(text),
      etfCanBeActive: /ETF[^.!?\n]{0,80}(?:can|may|either)[^.!?\n]{0,65}activ|activ[^.!?\n]{0,65}ETF/i.test(text),
      actualCostsNeedChecking: /(?:check|compare|not all|not always)[^.!?\n]{0,100}(?:cost|fee)|(?:cost|fee)[^.!?\n]{0,65}(?:vary|differ|check|compare)/i.test(text),
    };
    observations.push({ locale, scope: "index-and-etf", guards, index, etf });
    expect(guards).toEqual({ indexTracksBenchmark: true, etfCanBeActive: true, actualCostsNeedChecking: true });
  });

  it.each(locales)("%s actual compounding and diversification state model assumptions and remaining loss risk", locale => {
    const compound = material(locale, "compound-interest", 0, "C", 30);
    const diversified = material(locale, "diversification", 1, "B", 25);
    const guards = locale === "pl" ? {
      compoundingIsConditional: /hipotet|założ|przy[^.!?\n]{0,60}(?:stop|oprocentowan)/i.test(compound.text),
      diversificationCannotRemoveLoss: /(?:nie|nadal|wciąż)[^.!?\n]{0,100}(?:strat|ryzyk[^.!?\n]{0,25}rynk)/i.test(diversified.text),
    } : {
      compoundingIsConditional: /hypothet|assum|(?:if|given|at a)[^.!?\n]{0,60}(?:rate|interest)/i.test(compound.text),
      diversificationCannotRemoveLoss: /(?:cannot|can't|does not|doesn't|not guarantee|no guarantee)[^.!?\n]{0,100}(?:loss|market risk)|(?:loss|market risk)[^.!?\n]{0,65}(?:can still|may still|remain)/i.test(diversified.text),
    };
    observations.push({ locale, scope: "compound-and-diversification", guards, compound, diversified });
    expect(guards).toEqual({ compoundingIsConditional: true, diversificationCannotRemoveLoss: true });
  });

  it.each(locales)("%s actual long-horizon material requires a revisitable risk-aware plan rather than a universal winning strategy", locale => {
    const horizon = material(locale, "time-in-market", 4, "B", 30);
    const guards = locale === "pl" ? {
      goalOrTimeHorizon: /cel|horyzont|potrzeb[^.!?\n]{0,45}pieni/i.test(horizon.text),
      remainingRisk: /ryzyk|strat/i.test(horizon.text),
      reassessablePlan: /plan/i.test(horizon.text) && /przegląd|ponown|sprawd|dostos|zmian/i.test(horizon.text),
    } : {
      goalOrTimeHorizon: /goal|horizon|need[^.!?\n]{0,45}(?:money|funds)/i.test(horizon.text),
      remainingRisk: /risk|loss/i.test(horizon.text),
      reassessablePlan: /plan/i.test(horizon.text) && /review|reassess|adjust|change/i.test(horizon.text),
    };
    observations.push({ locale, scope: "time-horizon", guards, horizon });
    expect(guards).toEqual({ goalOrTimeHorizon: true, remainingRisk: true, reassessablePlan: true });
  });

  it("actual EN feedback omits the unsupported best-ten-days effect and unconditional strategy-superiority claims", () => {
    const question = quizQuestions.find(row => row.id === "time-in-market");
    if (!question) throw Error("Expected existing time-in-market record");
    const text = [question.question, question.successMessage, question.retryMessage].join("\n");
    const oldClaims = [
      "missing just 10 best days in 20 years can cut returns in half",
      "Consistent, patient investing outperforms most active strategies",
      "Studies show that for long-term investors, which strategy tends to outperform?",
    ];
    const remaining = oldClaims.filter(claim => text.includes(claim));
    observations.push({ scope: "unqualified-performance-claims", text, remaining });
    expect(remaining, "This bounded rewrite removes unqualified claims; it does not disprove historical studies").toEqual([]);
  });
});
