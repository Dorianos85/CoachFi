import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { quizQuestions } from "@/data/quizQuestions";
import { getQuestionById } from "@/lib/allQuestions";

const locales = ["pl", "en"] as const;
type Locale = typeof locales[number];
const rewards: Record<string, number> = { "bfg-guarantee": 30, "deposit-guarantee-scope": 30, "eu-dgs": 25 };
const observations: Array<Record<string, unknown>> = [];
function material(id: string, locale: Locale) {
  const canonical = getQuestionById(id, locale), english = quizQuestions.find(row => row.id === id);
  if (!canonical || !english || rewards[id] === undefined) throw Error("Expected existing C35 item " + id);
  const correct = canonical.answers.find(answer => answer.id === canonical.correctAnswer);
  if (!correct) throw Error("Expected correct option " + id);
  expect(canonical.correctAnswer).toBe("B"); expect(canonical.reward).toBe(rewards[id]);
  expect(canonical.answers.map(answer => answer.id)).toEqual(["A", "B", "C", "D"]);
  const text = [canonical.question, correct.text, canonical.explanation].join("\n");
  const endorsed = locale === "en" ? [text, english.successMessage, english.retryMessage].join("\n") : text;
  return { canonical, english, correct, text, endorsed };
}
function record(id: string, locale: Locale, guards: Record<string, boolean>, numeric?: Record<string, string>) {
  observations.push({ id, locale, guards, numeric });
  expect(guards).toEqual(Object.fromEntries(Object.keys(guards).map(key => [key, true])));
}
const standardAmount = (text: string) => /100[\s,.]*000/.test(text) && /EUR|euro|€/.test(text);
const eligible = (text: string) => /uprawnion|kwalifik|eligible|qualifying/i.test(text);

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw Error("C35 finance forbids network"); })));
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
afterAll(() => console.log("C35_FINANCIAL_OBSERVATIONS " + JSON.stringify(observations)));

describe("C35 independent Polish deposit eligibility, aggregation and applicable scheme", () => {
  it.each(locales)("%s BFG standard cap concerns eligible aggregated deposits in a covered institution, not every account", locale => {
    const source = material("bfg-guarantee", locale), text = source.endorsed;
    record("bfg-guarantee", locale, {
      standardEuroAmountPreserved: standardAmount(source.correct.text),
      eligibleDepositorAndCoveredInstitution: eligible(text) && /deponent|depositor/i.test(text) && /objęt|uczestnic|covered|participat/i.test(text) && /bank|instytuc|institution/i.test(text),
      accountsAggregateForOneDepositor: /sum|łącz|aggregat|combin/i.test(text) && /rachunk|account|depozyt|deposit/i.test(text) && /jedn|same|one/i.test(text),
      statutoryPLNLimitNotFixedFX: /złot|PLN/i.test(text) && /NBP/.test(text) && /dnia|dzień|date|day/i.test(text) && /warunk.*gwaranc|guarantee.*(condition|trigger)|guarantee.event/i.test(text),
      ordinaryCapHasConditionalExceptions: /podstawow|standard|ordinary/i.test(text) && /szczególn|wyjątk|exception|special/i.test(text) && /wyższ|higher|enhanced/i.test(text),
      noUnconditionalEarnedReviewReward: !/\+\s*30\s*(token|punkt)/i.test(text),
    });
  });

  it.each(locales)("%s BFG scope follows an eligible deposit contract rather than a bank sales channel or retirement label", locale => {
    const source = material("deposit-guarantee-scope", locale), text = source.endorsed;
    record("deposit-guarantee-scope", locale, {
      PolandBFGScopeWithoutMixedForeignSchemes: /BFG/.test(text) && !/FDIC|FGC/.test(text),
      eligibleDepositNotAllInvestments: eligible(source.correct.text) && /depozyt|deposit/i.test(source.correct.text) && /akcj|stocks|shares/i.test(text) && /jednost|units|fund/i.test(text) && /krypto|crypto/i.test(text),
      contractAndIntermediaryDistinguished: /umow|contract|rodzaj produktu|check the product/i.test(text) && /pośredni|sprzeda|intermediar|sold|selling|sales|kupiono|bought through/i.test(text),
      noBlanketPensionExclusion: !/not stocks, funds, pensions|pensions.*fall outside|nie akcje, fundusze, emerytury/i.test(text),
      bankSaleIsNotCoverageGuarantee: /nie oznacza|nie zapewnia|nie zyskują.*ochrony|does not|do not gain|not automatically/i.test(text) && /bank/i.test(text),
      noUnconditionalEarnedReviewReward: !/\+\s*30\s*(token|punkt)/i.test(text),
    });
  });

  it.each(locales)("%s EU standard is per eligible depositor and institution with home-scheme branch information, not a new limit per brand", locale => {
    const source = material("eu-dgs", locale), text = source.endorsed;
    record("eu-dgs", locale, {
      standardAmountAndEligibility: standardAmount(source.correct.text) && eligible(text),
      oneInstitutionNotOneBrandOrAccount: /instytuc|institution|bank/i.test(text) && /mark|marek|brand/i.test(text) && /nie|not/i.test(text) && /rachunk|account/i.test(text),
      EUBranchUsesHomeScheme: /oddział|branch/i.test(text) && /macierzyst|home/i.test(text) && /system|scheme|DGS/i.test(text),
      verifyLegalInstitutionAndScheme: /sprawd|zweryfik|check|verify/i.test(text) && /umow|informac|dokument|contract|information|document|właściwy system|applicable scheme/i.test(text),
      noUnconditionalEarnedReviewReward: !/\+\s*25\s*(token|punkt)/i.test(text),
    });
  });

  it.each(locales)("%s independent reference aggregation caps sixty plus fifty thousand at one standard hundred thousand limit", locale => {
    const source = material("bfg-guarantee", locale), text = source.endorsed;
    const firstReferenceCents = BigInt("6000000"), secondReferenceCents = BigInt("5000000"), capReferenceCents = BigInt("10000000");
    const totalReferenceCents = firstReferenceCents + secondReferenceCents;
    const standardCoveredCents = totalReferenceCents < capReferenceCents ? totalReferenceCents : capReferenceCents;
    const aboveStandardCents = totalReferenceCents - standardCoveredCents;
    expect(totalReferenceCents).toBe(BigInt("11000000")); expect(standardCoveredCents).toBe(BigInt("10000000")); expect(aboveStandardCents).toBe(BigInt("1000000"));
    record("bfg-guarantee-reference-model", locale, {
      twoReferenceBalancesAndAggregatePresent: /60[\s,.]*000/.test(text) && /50[\s,.]*000/.test(text) && /110[\s,.]*000/.test(text),
      sameEligibleDepositorInstitutionAndInterestStated: eligible(text) && /jedn|same|one/i.test(text) && /deponent|depositor/i.test(text) && /odset|interest/i.test(text),
      ordinaryCapWithoutEnhancedExceptionInExample: standardAmount(text) && /bez|no |without/i.test(text) && /szczególn|wyższ|enhanced|special|higher/i.test(text),
      referenceComparisonNotActualForeignCurrencyPayout: /odniesieni|referenc/i.test(text) && /wypłat|payout/i.test(text) && /nie|not/i.test(text) && /złot|PLN/i.test(text),
    }, { firstReferenceCents: firstReferenceCents.toString(), secondReferenceCents: secondReferenceCents.toString(), totalReferenceCents: totalReferenceCents.toString(), capReferenceCents: capReferenceCents.toString(), standardCoveredCents: standardCoveredCents.toString(), aboveStandardCents: aboveStandardCents.toString() });
  });
});
