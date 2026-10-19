import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { quizQuestions } from "@/data/quizQuestions";
import { getQuestionById } from "@/lib/allQuestions";

const locales = ["pl", "en"] as const;
type Locale = typeof locales[number];
const contract: Record<string, { key: string; reward: number }> = {
  "poland-trust-institutions": { key: "D", reward: 25 },
  "poland-oecd-score": { key: "B", reward: 25 },
  "poland-ppk-participation": { key: "C", reward: 30 },
  "financial-wellbeing-components": { key: "B", reward: 25 },
  "financial-resilience": { key: "C", reward: 30 },
  "debt-spiral-cause": { key: "B", reward: 35 },
};
const observations: Array<Record<string, unknown>> = [];
function material(id: string, locale: Locale) {
  const canonical = getQuestionById(id, locale), english = quizQuestions.find(row => row.id === id);
  const expected = contract[id];
  if (!canonical || !english || !expected) throw Error("Expected existing C31 item " + id);
  const correct = canonical.answers.find(answer => answer.id === canonical.correctAnswer);
  if (!correct) throw Error("Expected an existing correct answer " + id);
  expect(canonical.correctAnswer).toBe(expected.key); expect(canonical.reward).toBe(expected.reward);
  expect(canonical.answers.map(answer => answer.id)).toEqual(["A", "B", "C", "D"]);
  const text = [canonical.question, correct.text, canonical.explanation].join("\n");
  const feedback = locale === "en" ? [canonical.explanation, english.successMessage, english.retryMessage].join("\n") : canonical.explanation;
  return { canonical, english, correct, text, feedback, endorsed: text + "\n" + feedback };
}
function record(id: string, locale: Locale, guards: Record<string, boolean>, numeric?: Record<string, string>) {
  observations.push({ id, locale, guards, numeric });
  expect(guards).toEqual(Object.fromEntries(Object.keys(guards).map(key => [key, true])));
}

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw Error("C31 finance forbids network"); })));
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
afterAll(() => console.log("C31_FINANCIAL_OBSERVATIONS " + JSON.stringify(observations)));

describe("C31 independent financial-literacy evidence and contextual-resource qualifications", () => {
  it.each(locales)("%s trust evidence needs survey scope and does not certify an institution", locale => {
    const source = material("poland-trust-institutions", locale), text = source.endorsed;
    record("poland-trust-institutions", locale, {
      surveyScope: /rok|year|dat[aeęy]/i.test(text) && /prób|sample|population|respondent/i.test(text) && /pytan|question|metod|method|pomiar|measurement/i.test(text),
      trustIsDeclared: /zauf|trust/i.test(text) && /deklar|reported|stated|ankiet|survey/i.test(text),
      safetyNotCertified: /bezpiec|safe|certif/i.test(text) && /nie|not|neither|cannot|doesn.t/i.test(text),
      noUnsupportedBiggestBarrier: !/trust is the biggest barrier|profound trust deficit/i.test(text),
    });
  });

  it.each(locales)("%s OECD points require context rather than a monetary lost-opportunity diagnosis", locale => {
    const source = material("poland-oecd-score", locale), text = source.endorsed;
    record("poland-oecd-score", locale, {
      scoreHasMethodContext: /rok|year/i.test(text) && /prób|sample|population/i.test(text) && /klucz|scor|metod|method|instrument|wersj|version/i.test(text),
      pointsNotMoney: /punkt|point/i.test(text) && /oszczędn|mająt|savings|wealth|money|pienięż|kwot/i.test(text) && /nie|not|neither|cannot|doesn.t/i.test(text),
      noOldLostWealthClaim: !/missing 8 points represent lost wealth opportunities|gap to maximum represents real lost savings/i.test(text),
    });
  });

  it.each(locales)("%s participation comparisons distinguish PPK from PPE and identify date and denominator", locale => {
    const source = material("poland-ppk-participation", locale), text = source.endorsed;
    record("poland-ppk-participation", locale, {
      distinctPrograms: /PPK/.test(text) && /PPE/.test(text) && /odrębn|różn|distinct|separate|different/i.test(text),
      participationScope: /dat|rok|date|year/i.test(text) && /grup|mianownik|group|denominator|population/i.test(text),
      noIlliteracyCauseClaim: !/largely because people don.t understand compound interest|direct consequence of compound interest illiteracy/i.test(text),
    });
  });

  it.each(locales)("%s financial wellbeing includes choices and context without a universal three-part guarantee", locale => {
    const source = material("financial-wellbeing-components", locale), text = source.endorsed;
    record("financial-wellbeing-components", locale, {
      choicesAsWellAsGoals: /wybor|choice|freedom|swobod/i.test(text) && /cel|goal|future|przyszł/i.test(text),
      currentObligationsAndShocks: /zobowiąz|obligation|bieżąc|current|daily/i.test(text) && /szok|wstrząs|shock|nagł|unexpected/i.test(text),
      contextualResources: /kontekst|context|sytuac|circumstance|zasob|resource|doch[oó]d|income/i.test(text),
      noThreePartOutcomePromise: !/measured by three components|master all three to achieve real financial well.being/i.test(text),
    });
  });

  it.each(locales)("%s resilience retains coping and recovery while acknowledging resources and support", locale => {
    const source = material("financial-resilience", locale), text = source.endorsed;
    record("financial-resilience", locale, {
      copingAndRecovery: /radzen|odbudow|recover|cope|handle|rebuild|resilien|odporn/i.test(source.correct.text),
      realResourcesMatter: /zasob|resource|doch[oó]d|income|saving|oszczędn/i.test(text),
      supportOrAccessMatters: /pomoc|wspar|support|access|dostęp/i.test(text),
      noBlanketWealthExclusion: !/not about wealth|not wealth level/i.test(text),
    });
  });

  it.each(locales)("%s a debt-cost mechanism does not diagnose one knowledge gap or personal blame", locale => {
    const source = material("debt-spiral-cause", locale), text = source.endorsed;
    record("debt-spiral-cause", locale, {
      interestMechanism: (/odset|interest/i.test(text) && /kapital|compound|nalicz|accru/i.test(text)) || (/10\s*%/.test(text) && /dopisywane do długu|added to the debt/i.test(text) && /1[.,]10\s*[×x*]\s*1[.,]10/.test(text)),
      otherCausesPossible: /doch[oó]d|income/i.test(text) && /koszt|opłat|cost|fee/i.test(text) && /zdarz|szok|nagł|event|shock|unexpected|sytuac/i.test(text),
      noIndividualDiagnosis: /win|osob|blame|person|diagnoz|diagnos/i.test(text) && /nie|not|neither|cannot|doesn.t/i.test(text),
      noUnqualifiedIlliteracyCause: !/primary financial literacy gap that leads to|debt spirals are caused by not understanding|debt spirals happen when people don.t realize/i.test(text),
    });
  });

  it.each(locales)("%s independent two-period debt model capitalises hypothetical ten percent without payments or fees", locale => {
    const source = material("debt-spiral-cause", locale), text = source.endorsed;
    const principalGrosze = BigInt("100000"), firstBalanceGrosze = principalGrosze * BigInt("110") / BigInt("100");
    const secondBalanceGrosze = firstBalanceGrosze * BigInt("110") / BigInt("100");
    expect(firstBalanceGrosze).toBe(BigInt("110000")); expect(secondBalanceGrosze).toBe(BigInt("121000"));
    expect(secondBalanceGrosze - firstBalanceGrosze).toBe(BigInt("11000"));
    record("debt-spiral-cause-numeric", locale, {
      hypotheticalPrincipalAndRate: /1[\s,.\u00a0\u202f]?000/.test(source.canonical.question) && /10\s*%/.test(source.canonical.question) && /hipotet|model|hypothet|illustrat/i.test(text),
      twoPeriodsAndCapitalisation: /(?:2|dwa|dwóch|two)/i.test(source.canonical.question) && /okres|period/i.test(text) && /stał|fixed|constant/i.test(text) && (/kapital|compound/i.test(text) || (/dopisywane do długu|added to the debt/i.test(text) && /1[.,]10\s*[×x*]\s*1[.,]10/.test(text))),
      noFlowsAndFees: /bez|brak|without|no /i.test(text) && /spłat|repay|payment/i.test(text) && /opłat|fee/i.test(text) && /nowego długu|new debt|new borrowing/i.test(text),
      correctIndependentPLNAmount: /1[\s,.\u00a0\u202f]?210/.test(source.correct.text) && /PLN|zł/i.test(text) && !/\bUSD\b|\$/.test(text),
    }, { principalGrosze: principalGrosze.toString(), firstBalanceGrosze: firstBalanceGrosze.toString(), secondBalanceGrosze: secondBalanceGrosze.toString(), secondPeriodInterestGrosze: (secondBalanceGrosze - firstBalanceGrosze).toString() });
  });
});
