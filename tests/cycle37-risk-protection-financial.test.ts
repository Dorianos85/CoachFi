import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { quizQuestions } from "@/data/quizQuestions";
import { getQuestionById } from "@/lib/allQuestions";

const locales = ["pl", "en"] as const;
type Locale = typeof locales[number];
const keys: Record<string, string> = { "insurance-purpose": "B", "risk-return": "A", "speculative-allocation": "B" };
const observations: Array<Record<string, unknown>> = [];

function material(id: string, locale: Locale) {
  const canonical = getQuestionById(id, locale), english = quizQuestions.find(row => row.id === id);
  if (!canonical || !english || !keys[id]) throw Error("Expected existing C37 item " + id);
  const correct = canonical.answers.find(answer => answer.id === canonical.correctAnswer);
  if (!correct) throw Error("Expected correct option " + id);
  expect(canonical.correctAnswer).toBe(keys[id]); expect(canonical.reward).toBe(25);
  expect(canonical.answers.map(answer => answer.id)).toEqual(["A", "B", "C", "D"]);
  const text = [canonical.question, correct.text, canonical.explanation].join("\n");
  const endorsed = locale === "en" ? [text, english.successMessage, english.retryMessage].join("\n") : text;
  return { canonical, english, correct, text, endorsed };
}
function record(id: string, locale: Locale, guards: Record<string, boolean>) {
  observations.push({ id, locale, guards });
  expect(guards).toEqual(Object.fromEntries(Object.keys(guards).map(key => [key, true])));
}

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw Error("C37 finance forbids network"); })));
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
afterAll(() => console.log("C37_FINANCIAL_OBSERVATIONS " + JSON.stringify(observations)));

describe("C37 independent conditional protection, expected risk and optional speculation", () => {
  it.each(locales)("%s protective life-insurance purpose depends on agreed cover and eligible beneficiaries, without a universal purchase rule", locale => {
    const source = material("insurance-purpose", locale), text = source.endorsed;
    record("insurance-purpose", locale, {
      protectiveDeathPurpose: /śmier|zgon|death|dies/i.test(text) && /pomoc|wspar|ochron|support|protect|benefit/i.test(source.correct.text),
      entitledRecipientNotAutomaticHouseholdIncome: /uprawnion|uposaż|beneficiar|entitl/i.test(text),
      contractAndExclusionsAreMaterial: /umow|contract|policy.terms|OWU/i.test(text) && /wyłącze|exclusion/i.test(text),
      insuredBenefitAmountMatters: /sum[ayę]|kwot|insured.amount|sum.(assured|insured)|benefit.amount|coverage.amount/i.test(text),
      noUniversalNeedOrFullIncomeGuarantee: /nie.*(ustala|nakaz|musi|obowiąz)|not.*(decide|require)|no.*(obligation|requirement)/i.test(text) && /nie.*gwaran|nie.*automatycz|not.*guarant|no.*guarant|not.*automat|does.not.*replace/i.test(text),
      noUnconditionalEarnedReviewReward: !/\+\s*25\s*(token|point|punkt)/i.test(text),
    });
  });

  it.each(locales)("%s the existing higher-expected-return relationship remains conditional and includes possible capital loss beyond price fluctuations", locale => {
    const source = material("risk-return", locale), text = source.endorsed;
    record("risk-return", locale, {
      correctExpectedRelationshipRetained: /wyższ|higher/i.test(source.correct.text) && /oczekiw|expected/i.test(source.correct.text) && /ryzyk|risk/i.test(source.correct.text),
      expectationDoesNotGuaranteeRealizedReturn: /oczekiw|expected|potential/i.test(text) && /nie.*(gwaran|wynik|obietnic)|not.*(guarant|realised.result|realized.result|promise)|no.*guarant/i.test(text),
      capitalCanBeLost: /strat|utrat|loss|lose/i.test(text) && /kapitał|capital|pieniędz|money|invest/i.test(text),
      riskIsNotJustVolatility: (/nie.tylko|nie.ogranicza|not.only|more.than/i.test(text) && /waha|zmienno|fluct|volatil/i.test(text)) || /płynn|liquid|niewypłacal|default|credit.risk/i.test(text),
      noUnconditionalEarnedReviewReward: !/\+\s*25\s*(token|point|punkt)/i.test(text),
    });
  });

  it.each(locales)("%s speculation may be zero and must not consume essentials, minimum repayments, emergency reserves or borrowed money", locale => {
    const source = material("speculative-allocation", locale), text = source.endorsed;
    record("speculative-allocation", locale, {
      noParticipationIsAValidChoice: /zero|\b0\b|rezygn|not.*particip|do.not.need|nie.*spekul|możesz.*nie|may.*avoid/i.test(text),
      wholeLossCannotDisplaceEssentials: /całoś|całkow|entire|all|complete/i.test(text) && /strac|utrat|lose|loss/i.test(text) && /podstawow|niezbędn|essential|basic/i.test(text),
      requiredMinimumRepaymentsProtected: /wymagan.*minimaln.*spłat|obowiązkow.*spłat|required.*minimum.*repay|minimum.*repay|required.*repay/i.test(text),
      reserveIsKeptSeparate: /rezerw|poduszk|emergency|reserve/i.test(text),
      noBorrowingForSpeculation: /nie.*pożycz|nie.*zadłuż|bez.*pożycz|bez.*dług|do.not.*borrow|not.*borrow|no.*borrow|without.*borrow/i.test(text),
      noUnconditionalEarnedReviewReward: !/\+\s*25\s*(token|point|punkt)/i.test(text),
    });
  });
});
