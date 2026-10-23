import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { challengeQuestions } from "@/data/challengeQuestions";
import { getQuestionById } from "@/lib/allQuestions";

const locales = ["pl", "en"] as const;
type Locale = typeof locales[number];
const observations: Array<Record<string, unknown>> = [];

function material(locale: Locale) {
  const english = challengeQuestions.find(question => question.id === "c15");
  const canonical = getQuestionById("c15", locale);
  if (!english || !canonical) throw Error("Expected existing c15 challenge");
  const correct = canonical.answers.find(answer => answer.id === canonical.correctAnswer);
  if (!correct) throw Error("Expected existing c15 correct answer");
  expect(canonical.correctAnswer).toBe("C"); expect(canonical.reward).toBe(50);
  expect(canonical.answers.map(answer => answer.id)).toEqual(["A", "B", "C", "D"]);
  // A deliberately incorrect distractor is not an endorsed financial claim.
  const text = [canonical.question, correct.text, canonical.explanation].join("\n");
  return { english, canonical, correct, text };
}

function statesPLNAmount(text: string, wholePLN: string): boolean {
  return new RegExp("(?:\\bPLN\\s*" + wholePLN + "(?:\\D|$)|\\b" + wholePLN + "\\s*(?:zł|PLN))", "i").test(text);
}

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw Error("C27 finance forbids network"); })));
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
afterAll(() => console.log("C27_FINANCIAL_OBSERVATIONS " + JSON.stringify(observations)));

describe("C27 independent applied financial-knowledge challenge", () => {
  it("actual EN explanation removes unmatched ranking and pension-participation causality", () => {
    const source = material("en");
    const oldClaims = ["This is the #1 knowledge gap", "explains why only 47%"];
    const remaining = oldClaims.filter(claim => source.english.explanation.includes(claim));
    observations.push({ scope: "specific-unmatched-causal-claims", remaining, explanation: source.english.explanation });
    expect(remaining, "The scoped descriptive OECD evidence does not establish these ranking and causal claims").toEqual([]);
  });

  it.each(locales)("%s actual hypothetical monthly budget protects existing needs and repayments and identifies the PLN shortfall", locale => {
    const source = material(locale);
    const availableGrosze = BigInt("10000"), newPaymentGrosze = BigInt("15000");
    const missingGrosze = newPaymentGrosze - availableGrosze;
    expect(missingGrosze).toBe(BigInt("5000"));
    const guards = {
      hypothetical: /hypothet|hipotet|założ/i.test(source.text),
      sameMonthlyPeriod: /month|miesi[ąę]/i.test(source.text),
      polishCurrencyAmounts: statesPLNAmount(source.canonical.question, "100") && statesPLNAmount(source.canonical.question, "150"),
      shortfallInCorrectOption: statesPLNAmount(source.correct.text, (missingGrosze / BigInt("100")).toString()),
      essentialsProtected: /essential|basic needs|podstawow|niezbędn/i.test(source.text),
      existingRepaymentsProtected: /required[^.!?\n]{0,35}(?:repay|payment)|minimum[^.!?\n]{0,35}(?:repay|payment)|wymagan[^.!?\n]{0,35}(?:spłat|rat)|minimaln[^.!?\n]{0,35}(?:spłat|rat)/i.test(source.text),
      fullCostsConsidered: /cost|koszt/i.test(source.text),
    };
    observations.push({ locale, scope: "applied-monthly-budget", shortfallGrosze: missingGrosze.toString(), guards, canonical: source.canonical });
    expect(guards).toEqual({ hypothetical: true, sameMonthlyPeriod: true, polishCurrencyAmounts: true,
      shortfallInCorrectOption: true, essentialsProtected: true, existingRepaymentsProtected: true, fullCostsConsidered: true });
  });

  it.each(locales)("%s actual feedback does not treat knowledge alone as proof of repayment capacity", locale => {
    const source = material(locale);
    const guards = locale === "pl" ? {
      knowledgeIdentified: /wiedz|rozumieni|znajomoś/i.test(source.text),
      guaranteeLimited: /nie[^.!?\n]{0,60}(?:gwarant|zapewni|dowodz|oznacz|zastępuj)/i.test(source.text),
      realRepaymentContext: /spłat|rat|dług|budżet/i.test(source.text),
    } : {
      knowledgeIdentified: /knowledge|understand|knowing/i.test(source.text),
      guaranteeLimited: /does\s+not|cannot|not\s+(?:proof|prove|guarantee|ensure|replace)|no\s+guarantee/i.test(source.text),
      realRepaymentContext: /repay|payment|debt|budget/i.test(source.text),
    };
    observations.push({ locale, scope: "knowledge-not-repayment-proof", guards, text: source.text });
    expect(guards).toEqual({ knowledgeIdentified: true, guaranteeLimited: true, realRepaymentContext: true });
  });
});
