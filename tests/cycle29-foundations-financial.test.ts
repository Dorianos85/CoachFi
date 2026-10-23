import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { challengeQuestions } from "@/data/challengeQuestions";
import { getQuestionById } from "@/lib/allQuestions";

const locales = ["pl", "en"] as const;
type Locale = typeof locales[number];
const keys: Record<string, string> = { c7: "C", c8: "B", c9: "C", c10: "C", c11: "B", c12: "C", c13: "B", c14: "B" };
const observations: Array<Record<string, unknown>> = [];

function material(id: string, locale: Locale) {
  const canonical = getQuestionById(id, locale), english = challengeQuestions.find(row => row.id === id);
  if (!canonical || !english) throw Error("Expected existing C29 item " + id);
  const correct = canonical.answers.find(answer => answer.id === canonical.correctAnswer);
  if (!correct) throw Error("Expected one existing correct option " + id);
  expect(canonical.correctAnswer).toBe(keys[id]); expect(canonical.reward).toBe(50);
  expect(canonical.answers.map(answer => answer.id)).toEqual(["A", "B", "C", "D"]);
  // False distractors are reviewed manually; they are not treated as endorsed statements.
  return { canonical, english, correct, text: [canonical.question, correct.text, canonical.explanation].join("\n") };
}
function record(id: string, locale: Locale, text: string, guards: Record<string, boolean>, numeric?: Record<string, string>) {
  observations.push({ id, locale, text, guards, numeric });
  expect(guards).toEqual(Object.fromEntries(Object.keys(guards).map(key => [key, true])));
}
const basics = (text: string) => /podstawow|niezbędn|essentials|basic needs/i.test(text);
const minima = (text: string) => /minimum|minimaln|wymagan|required/i.test(text) && /spłat|rat|repay|payment/i.test(text);
const cost = (text: string) => /koszt|opłat|fees?|costs?/i.test(text);
const noGuarantee = (text: string) => /(?:nie|bez|no|not|cannot|doesn.t)[^.!?\n]{0,95}(?:gwaran|guarantee|zapewnia|ensure)|guarantees?\s+(?:neither|no)\b|(?:ryzyk|risk|strat|loss)/i.test(text);
const moneyPLN = (text: string) => /PLN|zł/i.test(text) && !/\bUSD\b|\$|401\s*\(?k\)?|\bIRA\b/i.test(text);

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw Error("C29 finance forbids network"); })));
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
afterAll(() => console.log("C29_FINANCIAL_OBSERVATIONS " + JSON.stringify(observations)));

describe("C29 independent eight-foundation financial qualifications", () => {
  it.each(locales)("%s c7 describes regular equal amounts without claiming emotion or loss elimination", locale => {
    const source = material("c7", locale), text = source.text;
    record("c7", locale, text, {
      equalRegularAmounts: /stał|równ|fixed|equal|same amount/i.test(source.correct.text) && /regular|odstęp|interval/i.test(text),
      outcomeLimited: noGuarantee(text) && /ryzyk|risk|strat|loss/i.test(text),
      costsMatter: cost(text),
      essentialsProtected: basics(text) && minima(text),
      noEmotionEliminationPromise: !/usuwa\s+emocj|remov(?:es|ing)\s+emotion/i.test(text),
    });
  });

  it.each(locales)("%s c8 scopes rule72 to a hypothetical nominal compound estimate", locale => {
    const source = material("c8", locale), text = source.text;
    record("c8", locale, text, {
      estimate: /szacun|przybliż|około|estimate|approx|about/i.test(text),
      fixedAnnualNominalRate: /stał|fixed|constant/i.test(text) && /nominal/i.test(text) && /roczn|annual|a year|per year/i.test(text),
      compounding: /kapitaliz|compound/i.test(text),
      noRealWorldGuarantee: /nie[^.!?\n]{0,70}prognoz|not[^.!?\n]{0,70}forecast|bez gwarancji|no guarantee|does not guarantee/i.test(text),
      inflationNotRealDoubling: /inflac|inflation|sił[^.!?\n]{0,12}nabywcz|purchasing power/i.test(text),
    });
  });

  it.each(locales)("%s c9 distinguishes exchange trading from an automatic diversification or cost guarantee", locale => {
    const source = material("c9", locale), text = source.text;
    record("c9", locale, text, {
      exchangeTradedFund: /fundusz|fund/i.test(source.correct.text) && /giełd|exchange.traded/i.test(text),
      activePossible: /aktywn|active/i.test(text),
      holdingsMatter: /skład|portfel|holdings|portfolio|concentrat/i.test(text),
      costsAndLosses: cost(text) && /ryzyk|risk|strat|loss/i.test(text),
      noAutomaticSafety: noGuarantee(text),
    });
  });

  it.each(locales)("%s c10 prioritizes accessible reserve funds with a chosen affordable target", locale => {
    const source = material("c10", locale), text = source.text;
    record("c10", locale, text, {
      volatileGrowthIsNotTheGoal: /akcj|stocks?|ryzyk|risky|volatile/i.test(source.correct.text),
      accessMatters: /dostęp|płynn|access|liquid/i.test(text),
      targetIsIndividual: /dopas|sytuac|wybran|chosen|situation|circumstances|adapt|individual/i.test(text),
      riskIsLimitedRatherThanEliminated: /ograniczon[^.!?\n]{0,20}ryzyk|limited[^.!?\n]{0,20}risk/i.test(text),
      smallOrPausedStartPossible: /mał|mniejsz|small|pause|pauz|odłóż|bez nadwyż|no surplus|without a surplus/i.test(text),
    });
  });

  it.each(locales)("%s c11 limits the inverse bond relationship to fixed cashflows and secondary prices", locale => {
    const source = material("c11", locale), text = source.text;
    record("c11", locale, text, {
      fixedCashflows: /stał|fixed/i.test(text) && /kupon|coupon|przepływ|cash.?flow|payment/i.test(text),
      secondaryMarketAndYield: /wtór|secondary|przed wykup|before maturity/i.test(text) && /rentown|yield/i.test(text),
      otherThingsEqual: /pozostał|inne czynn|bez zmian|other.{0,20}(?:equal|unchanged)|all else/i.test(text),
      nominalOrMaturitySeparated: /nominał|principal|face value|wykup|maturity/i.test(text),
      defaultAndLiquiditySeparate: /niewypłacal|default|credit risk|issuer/i.test(text) && /płynn|liquid|sprzeda|sell/i.test(text),
    });
  });

  it.each(locales)("%s c12 treats discretionary raise spending as a choice after essential obligations", locale => {
    const source = material("c12", locale), text = source.text;
    const remainingGrosze = BigInt("20000") - BigInt("18000");
    expect(remainingGrosze).toBe(BigInt("2000"));
    record("c12", locale, text, {
      discretionaryRatherThanNecessary: /dobrowol|uznaniow|wybran|discretionary|optional|chosen/i.test(text),
      essentialsAndMinimumsProtected: basics(text) && minima(text),
      sameModelInputs: /200/.test(text) && /180/.test(text) && moneyPLN(text),
      modelDifferenceExplained: /(?:^|[^\d])20(?:[^\d]|$)/.test(text),
      noAutomaticSaveEveryRaiseRule: !/save the raise before|każd[^.!?\n]{0,30}podwyżk[^.!?\n]{0,20}musisz/i.test(text),
    }, { raiseGrosze: "20000", chosenExtraExpenseGrosze: "18000", remainingGrosze: remainingGrosze.toString() });
  });

  it.each(locales)("%s c13 explains future-needs planning without universal account or growth promises", locale => {
    const source = material("c13", locale), text = source.text;
    record("c13", locale, text, {
      futureNeedsAndWork: /przysz|future/i.test(text) && /prac|work|retire|emeryt/i.test(text),
      outcomeLimited: noGuarantee(text),
      protectedCurrentNeeds: basics(text) && minima(text),
      noUniversalUSAccountAssumption: !/contributions grow tax.advantaged|401\s*\(?k\)?|\bIRA\b/i.test(text),
      noUnscopedAgeDoublingClaim: !/starting at 25 vs 35|2\s*[×x]\s*the final balance/i.test(text),
    });
  });

  it.each(locales)("%s c14 keeps the net-worth snapshot separate from liquidity and personal worth", locale => {
    const source = material("c14", locale), text = source.text;
    const netGrosze = BigInt("5000000") - BigInt("2000000");
    expect(netGrosze).toBe(BigInt("3000000"));
    record("c14", locale, text, {
      completeSubtractionModel: /50[\s,]?000/.test(text) && /20[\s,]?000/.test(text) && /30[\s,]?000/.test(text) && moneyPLN(text),
      assetsAndLiabilities: /aktywa|assets/i.test(text) && /zobowiąz|liabilit|debts/i.test(text),
      liquiditySeparate: /płynn|liquid|gotówk|cash flow|available cash/i.test(text),
      notPersonalWorth: /osob|człowiek|human|person|self.worth/i.test(text) && /nie|not|doesn.t/i.test(text),
      noSoleHealthMetric: !/the real measure of financial health/i.test(text),
    }, { assetsGrosze: "5000000", liabilitiesGrosze: "2000000", netGrosze: netGrosze.toString() });
  });

  it.each(locales)("%s c8 independent annual powers separate the rule72 estimate from actual doubling", locale => {
    const source = material("c8", locale), text = source.text;
    const initialGrosze = BigInt("100000"), factor = BigInt("108"), denominator = BigInt("100");
    // Exact integer inequalities avoid rounding an annual balance up to a doubled amount.
    const ninthNumerator = initialGrosze * factor ** BigInt("9"), ninthDenominator = denominator ** BigInt("9");
    const tenthNumerator = initialGrosze * factor ** BigInt("10"), tenthDenominator = denominator ** BigInt("10");
    expect(BigInt("72") / BigInt("8")).toBe(BigInt("9"));
    expect(ninthNumerator < initialGrosze * BigInt("2") * ninthDenominator).toBe(true);
    expect(tenthNumerator > initialGrosze * BigInt("2") * tenthDenominator).toBe(true);
    const roundedNinthGrosze = (ninthNumerator + ninthDenominator / BigInt("2")) / ninthDenominator;
    expect(roundedNinthGrosze).toBe(BigInt("199900"));
    record("c8-numeric", locale, text, {
      annualEightPercent: /8\s*%/.test(text) && /roczn|annual|a year|per year/i.test(text),
      correctIsEstimateNineYears: /9/.test(source.correct.text) && /około|przybliż|about|approx|estimate/i.test(source.correct.text),
      flowsFeesTaxExplicit: /przepływ|dopłat|flows?|contributions/i.test(text) && cost(text) && /podat|tax/i.test(text),
      nineBalanceShown: /1[\s,]?999(?:[,.]00)?/.test(text),
      tenthAnnualPostingDistinguished: /10/.test(source.canonical.explanation) && /roczn|annual/i.test(source.canonical.explanation),
    }, { estimateYears: "9", ninthRoundedGrosze: roundedNinthGrosze.toString(), ninthBelowDouble: "true", tenthAboveDouble: "true" });
  });
});
