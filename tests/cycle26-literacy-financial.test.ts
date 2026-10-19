import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { quizQuestions } from "@/data/quizQuestions";
import { getQuestionById } from "@/lib/allQuestions";

const locales = ["pl", "en"] as const;
type Locale = typeof locales[number];
const observations: Array<Record<string, unknown>> = [];

function material(locale: Locale) {
  const english = quizQuestions.find(question => question.id === "poland-compound-gap");
  const canonical = getQuestionById("poland-compound-gap", locale);
  if (!english || !canonical) throw Error("Expected existing financial-literacy question");
  const correct = canonical.answers.find(answer => answer.id === canonical.correctAnswer);
  if (!correct) throw Error("Expected existing correct answer");
  expect(canonical.correctAnswer).toBe("C");
  expect(canonical.reward).toBe(30);
  expect(canonical.answers.map(answer => answer.id)).toEqual(["A", "B", "C", "D"]);
  // Wrong options are not claims endorsed by the author. Inspect the stem,
  // correct answer and actual feedback rather than searching every distractor.
  const text = [canonical.question, correct.text, canonical.explanation,
    ...(locale === "en" ? [english.successMessage, english.retryMessage] : [])].join("\n");
  return { english, canonical, text };
}

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw Error("C26 finance forbids network"); })));
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
afterAll(() => console.log("C26_FINANCIAL_OBSERVATIONS " + JSON.stringify(observations)));

describe("C26 independent financial-literacy evidence qualifications", () => {
  it("actual EN success removes the unsupported direct debt and pension causal sentence", () => {
    const source = material("en");
    const exactOldClaim = "This gap leads directly to debt spirals and low pension savings.";
    const remaining = source.english.successMessage.includes(exactOldClaim);
    observations.push({ scope: "specific-direct-causal-claim", remaining, success: source.english.successMessage });
    expect(remaining, "A descriptive knowledge response percentage alone does not establish this direct causal claim").toBe(false);
  });

  it.each(locales)("%s actual national-percentage claim supplies survey context or omits the unverified percentage", locale => {
    const source = material(locale);
    const nationalContext = /Poles|Polish|Poland|Polak|Polsc|Polski|OECD/i.test(source.text);
    const percentage = /\d+(?:[.,]\d+)?\s*(?:%|per\s+cent\b|percent(?:age)?\b)|\b1\s+in\s+3\b|one\s+in\s+three|co\s+trzeci|jedn\w*\s+trzeci/i.test(source.text);
    const guards = {
      year: /\b20\d{2}\b/.test(source.text),
      sampledPopulation: /sample|respondents?|participants?|prób[ayę]|respondent|uczestni/i.test(source.text),
      particularMeasure: /question|item|scor|punkt|pytan|miar/i.test(source.text),
      denominator: /denominator|out\s+of|among|mianownik|spośród|wśród/i.test(source.text),
    };
    const qualifiedOrRemoved = !nationalContext || !percentage || Object.values(guards).every(Boolean);
    observations.push({ locale, scope: "national-percentage-context", nationalContext, percentage, guards, text: source.text });
    expect(qualifiedOrRemoved, "A national percentage needs its period, sample, measured item and denominator; removing that statistic is also valid").toBe(true);
  });

  it.each(locales)("%s actual feedback separates knowledge answers from proof of behavior and financial outcomes", locale => {
    const source = material(locale);
    const guards = locale === "pl" ? {
      knowledgeMeasure: /wiedz|odpowiedz|pytan|badani/i.test(source.text),
      inferenceLimited: /nie\s+(?:jest[^.!?\n]{0,24})?(?:dowod|dowodz|gwarant|oznacz|potwierdz)|nie\s+można[^.!?\n]{0,50}(?:wniosk|stwierdz)/i.test(source.text),
      distinctOutcome: /zachowa|sytuacj|zadłuż|dług|oszczęd|przyczyn/i.test(source.text),
    } : {
      knowledgeMeasure: /knowledge|answers?|questions?|survey/i.test(source.text),
      inferenceLimited: /does\s+not|do\s+not|cannot|not\s+(?:proof|prove|establish|guarantee|mean)|no\s+(?:proof|guarantee)/i.test(source.text),
      distinctOutcome: /behavio[u]?r|financial\s+(?:outcome|situation)|debt|saving|caus/i.test(source.text),
    };
    observations.push({ locale, scope: "knowledge-not-outcome-proof", guards, text: source.text });
    expect(guards).toEqual({ knowledgeMeasure: true, inferenceLimited: true, distinctOutcome: true });
  });
});
