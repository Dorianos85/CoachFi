import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { quizQuestions } from "@/data/quizQuestions";
import { getAllQuestionIds, getAllQuestions, getQuestionById } from "@/lib/allQuestions";
import { getTopicQuestions } from "@/lib/quiz-topic";
import { STAGE_QUESTION_IDS } from "@/lib/learningProgress";

const ID = "us-401k-match", LOCALES = ["pl", "en"] as const;
type Locale = typeof LOCALES[number];
const observations: Array<Record<string, unknown>> = [];
function material(locale: Locale) {
  const canonical = getQuestionById(ID, locale), english = quizQuestions.find(row => row.id === ID);
  if (!canonical || !english) throw Error("Expected existing us-401k-match");
  const correct = canonical.answers.find(answer => answer.id === "B");
  if (!correct) throw Error("Expected existing option B");
  return { canonical, english, correct, feedback: locale === "en"
    ? [{ field: "successMessage", text: english.successMessage }, { field: "retryMessage", text: english.retryMessage }]
    : [{ field: "explanation", text: canonical.explanation }] };
}
function record(locale: Locale, topic: string, guards: Record<string, boolean>, extra: Record<string, unknown> = {}) {
  observations.push({ locale, topic, guards, ...extra });
  expect(guards).toEqual(Object.fromEntries(Object.keys(guards).map(key => [key, true])));
}
const noFreeCertainPriority = (text: string) => !/free money|darmow\w* pieni\w*|instant\s*100\s*%|natychmiast\w*\s*100\s*%|always\s+(?:capture|contribute)|zawsze\s+(?:wykorzyst|wpłac)|\+\s*30\s*(?:token|punkt)/i.test(text);
beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw Error("C53 semantic fixtures forbid network"); })));
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
afterAll(() => {
  console.log("C53_FINANCIAL_OBSERVATIONS " + JSON.stringify(observations));
  console.log("C53_BANK_OBSERVATION " + JSON.stringify(LOCALES.map(locale => {
    const rows = getAllQuestions(locale), target = rows.find(row => row.id === ID)!;
    return { locale, ids: rows.map(row => row.id), metadata: rows.map(({ id, correctAnswer, reward }) => ({ id, correctAnswer, reward })),
      nonTargetRows: rows.filter(row => row.id !== ID), targetMetadata: { id: target.id, correctAnswer: target.correctAnswer, reward: target.reward,
        category: target.category, optionIds: target.answers.map(answer => answer.id), untouchedOptions: target.answers.filter(answer => answer.id !== "B") },
      defaultPool: getTopicQuestions(locale), stagePools: STAGE_QUESTION_IDS };
  })));
});

describe("C53 conditional US employer match semantics, not a personal plan recommendation", () => {
  it.each(LOCALES)("%s question limits option B to an eligible affordable scenario after necessities", locale => {
    const source = material(locale), question = source.canonical.question, endorsed = [question, source.correct.text, ...source.feedback.map(row => row.text)].join("\n");
    record(locale, "conditional-scenario", {
      existingUSPlanExplicit: /401\s*\(?k\)?/i.test(question) && /\bUSA?\b|United States|Stan\w* Zjednoczon|amerykańsk/i.test(question),
      eligibilityInScenario: /eligib|uprawn|spełni\w*.*warunk|prawo.*dopłat|warunk.*udział/i.test(question),
      affordableAvailableFunds: /afford|surplus|available funds|nadwyż|stać|dostępn\w* środk|możesz.*wpłat|mieści.*budżec/i.test(question),
      essentialsReservedFirst: /essential|basic needs|podstawow\w* potrzeb|niezbędn\w* (?:koszt|wydatk)/i.test(question),
      debtMinimumsReserved: /minimum.*(?:debt|payment)|required.*(?:minimum|debt payments)|wymagan\w* minimaln|minimaln\w* spłat|wymagan\w* spłat.*dług/i.test(question),
      correctOptionUsesEmployerPlanRules: /employer|pracodawc|dopłat|match/i.test(question + " " + source.correct.text) && /plan/i.test(source.correct.text) && /rule|term|warunk|zasad/i.test(source.correct.text),
      noBlanketSmartestFirstMove: !/smartest first move|najmądrzejszy pierwszy/i.test(question),
      noFreeInstantCertainPriorityOrReviewReward: noFreeCertainPriority(endorsed),
    }, { question, correct: source.correct.text });
  });

  it.each(LOCALES)("%s every feedback uses a hypothetical fifty-percent match and plan-specific formula, cap and eligibility", locale => {
    const source = material(locale);
    const employeeCents = BigInt("10000"), percent = BigInt("50"), employerCents = employeeCents * percent / BigInt("100");
    expect(employerCents).toBe(BigInt("5000"));
    for (const feedback of source.feedback) {
      const text = feedback.text;
      record(locale, "formula-model-" + feedback.field, {
        hypotheticalNotQuotedOffer: /hypothet|illustrat|example|hipotet|przykład/i.test(text),
        fiftyPercentRate: /50\s*%/.test(text),
        hundredUSDContributionAndFiftyUSDAddition: /USD\s*100(?:[.,]00)?\b|\b100(?:[.,]00)?\s*USD/i.test(text) && /USD\s*50(?:[.,]00)?\b|\b50(?:[.,]00)?\s*USD/i.test(text),
        employerAdditionNamed: /employer|pracodawc/i.test(text),
        formulaSpecifiedByPlan: /formula|formuł|wz[oó]r|spos[oó]b (?:wylicz|nalicza)/i.test(text) && /plan/i.test(text),
        planCapAndEligibility: /cap|limit/i.test(text) && /eligib|uprawn|kwalifik|warunk.*(?:uczest|udział)/i.test(text),
        termsDependOnPlan: /depend|zależ|określ|według|rule|zasad/i.test(text) && /plan/i.test(text),
        noFreeInstantCertainPriorityOrReviewReward: noFreeCertainPriority(text),
      }, { field: feedback.field, text, employeeCents: employeeCents.toString(), ratePercent: percent.toString(), employerCents: employerCents.toString() });
    }
  });

  it.each(LOCALES)("%s feedback separates employer vesting and possible forfeiture from investment returns and Polish PPK", locale => {
    const source = material(locale);
    for (const feedback of source.feedback) {
      const text = feedback.text;
      record(locale, "vesting-country-" + feedback.field, {
        employerRightsMayVestOverTime: /employer|pracodawc/i.test(text) && /vesting|nabywan\w* (?:praw|uprawnień)|nabyci\w* praw|praw.*nabyw|nabyw.*praw/i.test(text) && /may|can|mog|moż/i.test(text) && /over time|with time|z czasem|czas|years|lat/i.test(text),
        unvestedRightsCanBeLost: /unvested|nienabyt|przed.*nabyci|nie.*naby\w* praw/i.test(text) && /forfeit|utrac|przepad|straci/i.test(text),
        lossLimitedToUnvestedPortion: /unvested (?:portion|part|amount|contribution).*forfeit|forfeit.*unvested|utrac.*(?:tylko|wyłącznie|nienabyt)|(?:tylko|wyłącznie|nienabyt).*utrac/i.test(text),
        notGuaranteedInvestmentReturn: /(?:not|no).*guarant|nie.*gwarant|bez.*gwaranc/i.test(text) && /investment|inwestyc|return|zwrot|zysk/i.test(text),
        notUniversalBudgetPriority: /(?:not|no).*priority|nie.*priorytet|nie.*(?:nakaz|obowiązek).*wpłat|not.*(?:rule|instruction).*every/i.test(text),
        USExampleNotPolishPPK: /PPK/.test(text) && /not|nie|different|odrębn/i.test(text) && /\bUSA?\b|United States|Stan\w* Zjednoczon/i.test(source.canonical.question + " " + text),
        noFreeInstantCertainPriorityOrReviewReward: noFreeCertainPriority(text),
      }, { field: feedback.field, text });
    }
  });

  it("retains bank82 ID/order/key/reward, untouched A/C/D options and existing quiz pools", () => {
    const expectedOptions = {
      en: [{ id: "A", text: "Skip it — matches are a trick" }, { id: "C", text: "Only contribute after age 60" }, { id: "D", text: "Put it all into a single company stock" }],
      pl: [{ id: "A", text: "Pominąć — dopłaty to podstęp" }, { id: "C", text: "Wpłacać dopiero po 60. roku życia" }, { id: "D", text: "Wszystko w akcje jednej spółki" }],
    };
    const englishIds = getAllQuestionIds("en"); expect(englishIds).toHaveLength(82); expect(new Set(englishIds).size).toBe(82);
    for (const locale of LOCALES) {
      const source = material(locale); expect(getAllQuestionIds(locale)).toEqual(englishIds);
      expect(getAllQuestionIds(locale).filter(id => id === ID)).toEqual([ID]);
      expect(source.canonical).toMatchObject({ id: ID, correctAnswer: "B", reward: 30 });
      expect(source.canonical.answers.map(answer => answer.id)).toEqual(["A", "B", "C", "D"]);
      expect(source.canonical.answers.filter(answer => answer.id !== "B")).toEqual(expectedOptions[locale]);
      expect(getTopicQuestions(locale).map(question => question.id)).toEqual(["inflation-basics", "emergency-fund", "saving-habit", "interest-rates"]);
      expect(Object.values(STAGE_QUESTION_IDS).flat()).not.toContain(ID);
    }
  });
});
