import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { challengeQuestions } from "@/data/challengeQuestions";
import { getQuestionById } from "@/lib/allQuestions";

const locales = ["pl", "en"] as const;
type Locale = typeof locales[number];
const keys: Record<string, string> = { c16: "D", c17: "B", c18: "C", c19: "B", c20: "C" };
const observations: Array<Record<string, unknown>> = [];
function material(id: string, locale: Locale) {
  const canonical = getQuestionById(id, locale), english = challengeQuestions.find(row => row.id === id);
  if (!canonical || !english) throw Error("Expected existing C30 item " + id);
  const correct = canonical.answers.find(answer => answer.id === canonical.correctAnswer);
  if (!correct) throw Error("Expected an existing correct option " + id);
  expect(canonical.correctAnswer).toBe(keys[id]); expect(canonical.reward).toBe(50);
  expect(canonical.answers.map(answer => answer.id)).toEqual(["A", "B", "C", "D"]);
  return { canonical, english, correct, text: [canonical.question, correct.text, canonical.explanation].join("\n") };
}
function record(id: string, locale: Locale, text: string, guards: Record<string, boolean>, numeric?: Record<string, string>) {
  observations.push({ id, locale, text, guards, numeric });
  expect(guards).toEqual(Object.fromEntries(Object.keys(guards).map(key => [key, true])));
}
const essentials = (text: string) => /podstawow|niezbędn|essential(?:s| needs)|basic needs/i.test(text);
const requiredRepayments = (text: string) => /minimum|minimaln|wymagan|required/i.test(text) && /spłat|rat|repay|payment/i.test(text);
const optional = (text: string) => /dobrowol|opcjonal|możesz|optional|voluntar|you (?:can|may)/i.test(text);
const moneyPLN = (text: string) => /PLN|zł/i.test(text) && !/\bUSD\b|\$/.test(text);

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw Error("C30 finance forbids network"); })));
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
afterAll(() => console.log("C30_FINANCIAL_OBSERVATIONS " + JSON.stringify(observations)));

describe("C30 independent survey interpretation and optional-buffer qualifications", () => {
  it.each(locales)("%s c16 interprets reported trust with survey scope rather than certifying institutions", locale => {
    const source = material("c16", locale), text = source.text;
    record("c16", locale, text, {
      surveyScope: /rok|year/i.test(text) && /prób|sample/i.test(text) && /pytan|question|wording/i.test(text),
      reportedTrust: /zauf|trust/i.test(text) && /deklar|reported|respond|ankiet|survey/i.test(text),
      notInstitutionSafetyProof: /bezpiec|safe/i.test(text) && /nie|not|cannot|doesn.t/i.test(text),
      noUnscopedHistoricalPercent: !/(?:15|6)\s*%/.test(text),
    });
  });

  it.each(locales)("%s c17 treats a hypothetical point gap as a score rather than lost wealth or personal worth", locale => {
    const source = material("c17", locale), text = source.text;
    const missingPoints = BigInt("21") - BigInt("13");
    expect(missingPoints).toBe(BigInt("8"));
    record("c17", locale, text, {
      hypotheticalScale: /hipotet|wymyślon|hypothet|invented|made-up/i.test(text),
      actualPointInputs: /21/.test(source.canonical.question) && /13/.test(source.canonical.question),
      gapIsEightPoints: /(?:^|[^\d])8(?:[^\d]|$)/.test(source.correct.text) && /punkt|point/i.test(text),
      noLostOpportunityConversion: !/missing 8 points represent concrete lost opportunities/i.test(text),
      noPersonDiagnosis: (/osob|człowiek|individual|person/i.test(text) && /nie|not|cannot|doesn.t/i.test(text)) || /nie diagnozę majątku|not a wealth diagnosis/i.test(text),
    }, { maximumPoints: "21", achievedPoints: "13", gapPoints: missingPoints.toString() });
  });

  it.each(locales)("%s c18 offers a voluntary affordable step without promising stress relief", locale => {
    const source = material("c18", locale), text = source.text;
    record("c18", locale, text, {
      voluntaryStep: optional(text),
      protectedEssentialsAndRepayments: essentials(text) && requiredRepayments(text),
      acknowledgesStressWithoutGuarantee: /stres|stress/i.test(text) && /nie[^.!?\n]{0,90}gwaran|bez gwarancji|no guarantee|does not guarantee|cannot guarantee|not guaranteed|not a duty or a guarantee of no stress/i.test(text),
      noSurplusAllowsPause: /bez nadwyż|brak nadwyż|without a surplus|no surplus|pause|pauz|wstrzymaj/i.test(text),
      noUnsupportedNationalDiagnosis: !/nearly half of Poles|psychological defense|education must restore/i.test(text),
    });
  });

  it.each(locales)("%s c19 defines the Polish buffer with an individual optional goal after required costs", locale => {
    const source = material("c19", locale), text = source.text;
    record("c19", locale, text, {
      correctPolishTerm: /poduszka finansowa/i.test(source.correct.text),
      emergencyPurpose: /nagł|nieprzewidz|awaryjn|emergency|unexpected|unplanned/i.test(text),
      individualGoal: /sytuac|dopas|wybran|situation|circumstances|adapt|chosen|individual/i.test(text),
      optionalAfterObligations: optional(text) && essentials(text) && requiredRepayments(text),
      notGuaranteedDebtAvoidance: !/without resorting to high.interest borrowing/i.test(text),
    });
  });

  it.each(locales)("%s c20 separates declared attitudes from knowledge behavior and financial circumstances", locale => {
    const source = material("c20", locale), text = source.text;
    record("c20", locale, text, {
      declaredAttitudes: /postaw|nastawien|attitud|orientation/i.test(text) && /deklar|reported|self.report|declar|stated views/i.test(text),
      differentConstructs: /wiedz|knowledge/i.test(text) && /zachowan|behavio/i.test(text) && /sytuac|circumstances|situation|dobrostan|well.?being/i.test(text),
      noUnscopedNationalThreshold: !/26[.,]9\s*%/.test(text),
      noCulturalDiagnosis: !/systemic culture of short.term financial thinking/i.test(text),
      noIndividualJudgment: /osob|individual|person/i.test(text) && /nie|not|cannot|doesn.t/i.test(text),
    });
  });

  it.each(locales)("%s c18 independent grosze preserve forty after an optional ten from fifty already safely available", locale => {
    const source = material("c18", locale), text = source.text;
    const safelyAvailableGrosze = BigInt("5000"), optionalStepGrosze = BigInt("1000");
    const remainingGrosze = safelyAvailableGrosze - optionalStepGrosze;
    expect(remainingGrosze).toBe(BigInt("4000"));
    expect(optionalStepGrosze <= safelyAvailableGrosze).toBe(true);
    record("c18-numeric", locale, text, {
      promptFiftyPLN: /(?:^|[^\d])50(?:[^\d]|$)/.test(source.canonical.question) && moneyPLN(text),
      protectedBeforeStep: essentials(text) && requiredRepayments(text),
      correctChoosesOptionalTen: /(?:^|[^\d])10(?:[^\d]|$)/.test(source.correct.text) && optional(text),
      feedbackLeavesForty: /(?:^|[^\d])40(?:[^\d]|$)/.test(source.canonical.explanation),
    }, { safelyAvailableGrosze: safelyAvailableGrosze.toString(), chosenStepGrosze: optionalStepGrosze.toString(), remainingGrosze: remainingGrosze.toString() });
  });
});
