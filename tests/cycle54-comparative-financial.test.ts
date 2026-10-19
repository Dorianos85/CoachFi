import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { quizQuestions } from "@/data/quizQuestions";
import { getAllQuestionIds, getAllQuestions, getQuestionById } from "@/lib/allQuestions";
import { getTopicQuestions } from "@/lib/quiz-topic";
import { STAGE_QUESTION_IDS } from "@/lib/learningProgress";

const ID = "tax-advantaged-wrapper", LOCALES = ["pl", "en"] as const;
type Locale = typeof LOCALES[number];
const observations: Array<Record<string, unknown>> = [];
function material(locale: Locale) {
  const canonical = getQuestionById(ID, locale), english = quizQuestions.find(row => row.id === ID);
  if (!canonical || !english) throw Error("Expected existing tax-advantaged-wrapper");
  const correct = canonical.answers.find(answer => answer.id === "B");
  if (!correct) throw Error("Expected existing option B");
  return { canonical, correct, feedback: locale === "en"
    ? [{ field: "successMessage", text: english.successMessage }, { field: "retryMessage", text: english.retryMessage }]
    : [{ field: "explanation", text: canonical.explanation }] };
}
function observe(locale: Locale, topic: string, field: string, text: string, guards: Record<string, boolean>) {
  observations.push({ locale, topic, field, text, guards });
  return guards;
}
function allTrue(groups: Array<Record<string, boolean>>) {
  for (const guards of groups) expect(guards).toEqual(Object.fromEntries(Object.keys(guards).map(key => [key, true])));
}
const noReviewRewardClaim = (text: string) => !/\+\s*30\s*(?:token|punkt)/i.test(text);
beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw Error("C54 semantic fixtures forbid network"); })));
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });

afterAll(() => {
  console.log("C54_FINANCIAL_OBSERVATIONS " + JSON.stringify(observations));
  console.log("C54_BANK_OBSERVATION " + JSON.stringify(LOCALES.map(locale => {
    const rows = getAllQuestions(locale), target = rows.find(row => row.id === ID)!;
    return { locale, ids: rows.map(row => row.id), metadata: rows.map(({ id, correctAnswer, reward }) => ({ id, correctAnswer, reward })),
      nonTargetRows: rows.filter(row => row.id !== ID), targetMetadata: { id: target.id, question: target.question,
        correctAnswer: target.correctAnswer, reward: target.reward, category: target.category,
        optionIds: target.answers.map(answer => answer.id), untouchedOptions: target.answers.filter(answer => answer.id !== "B") },
      defaultPool: getTopicQuestions(locale), stagePools: STAGE_QUESTION_IDS };
  })));
});

describe("C54 existing tax-wrapper comparison distinguishes tax relief from investment protection", () => {
  it.each(LOCALES)("%s endorses country-dependent tax advantages without guaranteed gains or protection from loss", locale => {
    const source = material(locale), option = source.correct.text;
    const groups = [observe(locale, "tax-treatment-and-risk", "B", option, {
      taxAdvantage: /tax.advantag|tax benefit|korzyści.*podatkow|ulg.*podatkow/i.test(option),
      countryRules: /countr|national|kraj/i.test(option) && /rule|term|zasad|warunk/i.test(option),
      noGuaranteedReturn: /without.*guarant|no.*guarant|bez.*gwaranc|nie.*gwarant/i.test(option) && /return|gain|profit|zysk|zwrot/i.test(option),
    })];
    for (const feedback of source.feedback) {
      const text = feedback.text;
      groups.push(observe(locale, "tax-treatment-and-risk", feedback.field, text, {
        UK_ISA_Japan_NISA_Poland_IKE: /ISA.*(?:UK|United Kingdom|Britain|Wielk\w* Brytanii)/i.test(text)
          && /NISA.*(?:Japan|Japoni)/i.test(text) && /IKE.*(?:Poland|Polsk|Polsc)/i.test(text),
        nationalRulesAndLimitsDiffer: /different|differ|różn/i.test(text) && /national|countr|kraj/i.test(text)
          && /rule|zasad/i.test(text) && /limit/i.test(text),
        taxReliefIsNotInvestmentGainGuarantee: /(?:does not|cannot|not).*guarant|nie.*gwarant|bez.*gwaranc/i.test(text)
          && /investment gains|investment returns|zysk|zwrot.*inwestyc/i.test(text),
        noProtectionFromInvestmentLoss: /(?:does not|cannot|not).*protect.*loss|nie.*ochron.*strat|bez.*ochron.*strat/i.test(text),
        noEarnedReviewReward: noReviewRewardClaim(text),
      }));
    }
    allTrue(groups);
  });

  it.each(LOCALES)("%s conditions IKE income exemption on statutory withdrawal and distinguishes early return and account access", locale => {
    const source = material(locale), groups: Array<Record<string, boolean>> = [];
    for (const feedback of source.feedback) {
      const text = feedback.text;
      groups.push(observe(locale, "withdrawal-and-access", feedback.field, text, {
        IKEExemptionConditionalOnStatutoryWithdrawal: /IKE/i.test(text) && /exempt|zwoln/i.test(text)
          && /depend|condition|zależ|warunk/i.test(text) && /statutor|ustawow/i.test(text) && /withdraw|wypłat/i.test(text),
        earlyReturnCanTaxIncome: /(?:earl\w*.*return|wcześniejsz\w*.*zwrot)/i.test(text)
          && /can|may|moż/i.test(text) && /income.*tax|tax.*income|podatek\s+od\s+dochodu|opodatkow\w*.*dochod/i.test(text),
        noClaimThatEarlyReturnTaxesWholeBalance: !/tax(?:es|able)?\s+(?:the\s+)?(?:whole|entire)\s+(?:balance|capital)|podatek\s+od\s+cał\w*\s+(?:sald|kapitał)|opodatkow\w*\s+cał\w*\s+(?:sald|kapitał)/i.test(text),
        accessAssetsAndWithdrawalsDiffer: /eligib|access|warunk.*dostęp/i.test(text)
          && /permitted assets|eligible assets|dozwolon\w* aktyw/i.test(text) && /withdraw|wypłat/i.test(text) && /differ|różni|różn/i.test(text),
        notEveryAccountAvailableToPolishResident: /(?:does not|not).*imply|nie.*oznacza|nie.*każd/i.test(text)
          && /every account|each account|każde konto|każd\w* rachun/i.test(text)
          && /available|dostępn/i.test(text) && /Polish resident|resident.*Poland|mieszkańc\w* Polski|rezydent\w* Polski/i.test(text),
        noEarnedReviewReward: noReviewRewardClaim(text),
      }));
    }
    allTrue(groups);
  });

  it("retains bank82 ID/order/key/reward, literal question/A/C/D/category and existing quiz pools", () => {
    const expected = {
      en: { question: "What do a UK ISA, a Japanese NISA and a Polish IKE have in common?", category: "Global Markets",
        options: [{ id: "A", text: "They guarantee a fixed 10% return" }, { id: "C", text: "They are types of credit card" }, { id: "D", text: "They are only for millionaires" }] },
      pl: { question: "Co łączy brytyjskie ISA, japońskie NISA i polskie IKE?", category: "Rynki globalne",
        options: [{ id: "A", text: "Gwarantują stały zysk 10%" }, { id: "C", text: "To rodzaje kart kredytowych" }, { id: "D", text: "Są tylko dla milionerów" }] },
    };
    const englishIds = getAllQuestionIds("en"); expect(englishIds).toHaveLength(82); expect(new Set(englishIds).size).toBe(82);
    for (const locale of LOCALES) {
      const source = material(locale); expect(getAllQuestionIds(locale)).toEqual(englishIds);
      expect(getAllQuestionIds(locale).filter(id => id === ID)).toEqual([ID]);
      expect(source.canonical).toMatchObject({ id: ID, correctAnswer: "B", reward: 30, question: expected[locale].question, category: expected[locale].category });
      expect(source.canonical.answers.map(answer => answer.id)).toEqual(["A", "B", "C", "D"]);
      expect(source.canonical.answers.filter(answer => answer.id !== "B")).toEqual(expected[locale].options);
      expect(getAllQuestions(locale).filter(row => row.id !== ID)).toHaveLength(81);
      expect(getTopicQuestions(locale).map(question => question.id)).toEqual(["inflation-basics", "emergency-fund", "saving-habit", "interest-rates"]);
      expect(Object.values(STAGE_QUESTION_IDS).flat()).not.toContain(ID);
    }
  });
});
