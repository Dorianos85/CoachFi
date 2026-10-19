import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { quizQuestions } from "@/data/quizQuestions";
import { getQuestionById } from "@/lib/allQuestions";

const locales = ["pl", "en"] as const;
type Locale = typeof locales[number];
const rewards: Record<string, number> = { "asset-allocation": 25, rebalancing: 25, "fees-ter": 30, "invest-prerequisites": 30 };
const observations: Array<Record<string, unknown>> = [];
function material(id: string, locale: Locale) {
  const canonical = getQuestionById(id, locale), english = quizQuestions.find(row => row.id === id);
  if (!canonical || !english || rewards[id] === undefined) throw Error("Expected existing C33 item " + id);
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
const noGuarantee = (text: string) => /nie gwarant|no guarantee|not guarantee|cannot guarantee|without guarantee/i.test(text);
const essentialsAndMinimums = (text: string) => /podstawow|niezbędn|essential|basic needs/i.test(text) && /minimaln|minimum/i.test(text) && /spłat|repay|payment/i.test(text);

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw Error("C33 finance forbids network"); })));
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
afterAll(() => console.log("C33_FINANCIAL_OBSERVATIONS " + JSON.stringify(observations)));

describe("C33 independent allocation, cost and affordability qualifications", () => {
  it.each(locales)("%s allocation is a goal-dependent mix rather than a universal risk or return promise", locale => {
    const source = material("asset-allocation", locale), text = source.endorsed;
    record("asset-allocation", locale, {
      assetCategoriesRemainExamples: /akcj|stock/i.test(source.correct.text) && /obligac|bond/i.test(source.correct.text) && /gotów|cash/i.test(source.correct.text),
      goalTimeAndLossCapacity: /cel|goal/i.test(text) && /czas|horyzont|timeframe|time horizon/i.test(text) && /możliwo|zdolno|ability|capacity/i.test(text) && /strat|loss/i.test(text),
      allocationDoesNotGuaranteeOutcomes: noGuarantee(text) && /ryzyk|risk/i.test(text),
      noUniversalCorrectMix: /nie ma jednego|not one|no single|no universal/i.test(text) && /proporcj|mix|allocation/i.test(text),
      noUnscopedMajorityAttribution: !/drives most of|decyduje o większości/i.test(text),
    });
  });

  it.each(locales)("%s rebalancing restores proportions while costs and changing risk remain relevant", locale => {
    const source = material("rebalancing", locale), text = source.endorsed;
    record("rebalancing", locale, {
      restoresTargetMix: /przywr|powr|adjust|restor|return/i.test(source.correct.text) && /docelow|target/i.test(source.correct.text),
      costsAndPossibleTaxes: /koszt|cost|fee/i.test(text) && /podat|tax/i.test(text),
      contributionsAreAnAlternative: /wpłat|contribut/i.test(text),
      noConstantRiskOrProfitGuarantee: noGuarantee(text) && /ryzyk|risk/i.test(text) && /strat|loss/i.test(text),
      noAutomaticPriceChangeOrder: /nie nakaz|nie musi|not an instruction|need not|not a requirement/i.test(text),
    });
  });

  it.each(locales)("%s a fund cost ratio has a documented scope and cannot promise investment profits", locale => {
    const source = material("fees-ter", locale), text = source.endorsed;
    record("fees-ter", locale, {
      feeDragRemainsConditional: /pomniejsz|obniża|reduce|lower/i.test(source.correct.text),
      terHasAnExplainedMeaning: /\bTER\b/i.test(text) && /wskaźnik|ratio|expense indicator|cost indicator/i.test(text) && /fundusz|fund/i.test(text),
      notAllInvestorCosts: /nie obejmuje wszystkich|does not cover all|not all|nie jest sumą|not the total/i.test(text),
      inspectDocumentsAndTransactions: /dokument|document|disclosure/i.test(text) && /transakcyjn|transaction/i.test(text),
      lowerCostsDoNotGuaranteeProfit: noGuarantee(text),
      noUnspecifiedThirtyYearEstimate: !/over 30 years|przez 30 lat/i.test(text),
    });
  });

  it.each(locales)("%s preparation protects required spending without obliging investment or guaranteeing a sale-free future", locale => {
    const source = material("invest-prerequisites", locale), text = source.endorsed;
    record("invest-prerequisites", locale, {
      reserveAndDebtRemainConsiderations: /awaryjn|rezerw|emergency|reserv/i.test(text) && /dług|debt/i.test(text),
      protectsEssentialsAndMinimumRepayments: essentialsAndMinimums(text),
      optionalWithNoSurplusOrVariableIncome: /dobrowol|opcjonal|voluntar|optional/i.test(text) && /braku? nadwyż|bez nadwyż|no surplus|without a surplus/i.test(text) && /zmienn|nieregular|variable income|irregular/i.test(text),
      postponementAllowed: /odłoż|odłoży|postpon|defer|pause/i.test(text),
      noGuaranteedAvoidanceOfBadTimeSale: noGuarantee(text) && /sprzedaż|sale|selling/i.test(text) && /niekorzystn|unfavourable|unfavorable|bad time/i.test(text),
    });
  });

  it.each(locales)("%s independent same-base one-year fee illustration leaves nine hundred ninety or nine hundred ninety-eight PLN", locale => {
    const source = material("fees-ter", locale), text = source.endorsed;
    const baseGrosze = BigInt("100000"), basisPointDenominator = BigInt("10000");
    const firstCharge = baseGrosze * BigInt("100") / basisPointDenominator;
    const secondCharge = baseGrosze * BigInt("20") / basisPointDenominator;
    expect(firstCharge).toBe(BigInt("1000")); expect(secondCharge).toBe(BigInt("200"));
    expect(baseGrosze - firstCharge).toBe(BigInt("99000")); expect(baseGrosze - secondCharge).toBe(BigInt("99800"));
    expect(firstCharge - secondCharge).toBe(BigInt("800"));
    record("fees-ter-numeric", locale, {
      sameBaseAndRatesAreStated: /1[\s,.\u00a0\u202f]?000/.test(text) && /\b1\s*%/.test(text) && /0[,.]2\s*%/.test(text) && /tej baz|this base|same base|stałej baz|fixed base/i.test(text),
      oneYearEndChargeWithZeroGrossReturn: /koniec roku|year.end/i.test(text) && /jednorazow|one |single/i.test(text) && /brutto\s*0\s*%|gross return\s*0\s*%/i.test(text),
      omittedFlowsOtherCostsTaxInflation: /wpłat|contribution/i.test(text) && /wypłat|withdrawal/i.test(text) && /innych koszt|other cost/i.test(text) && /podat|tax/i.test(text) && /inflac|inflation/i.test(text) && /bez|no |without/i.test(text),
      balancesAndPlnUnitsAgree: /990/.test(text) && /998/.test(text) && /PLN|zł/i.test(text) && !/\bUSD\b|\$/.test(text),
      illustrationIsNotTerChargingMethod: /uproszcz|simplif|illustrat/i.test(text) && /nie metoda|not the TER|not.*method/i.test(text),
    }, { baseGrosze: baseGrosze.toString(), firstChargeGrosze: firstCharge.toString(), secondChargeGrosze: secondCharge.toString(), firstBalanceGrosze: (baseGrosze - firstCharge).toString(), secondBalanceGrosze: (baseGrosze - secondCharge).toString(), differenceGrosze: (firstCharge - secondCharge).toString() });
  });
});
