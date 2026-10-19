import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { quizQuestions } from "@/data/quizQuestions";
import { getQuestionById } from "@/lib/allQuestions";

const locales = ["pl", "en"] as const;
type Locale = typeof locales[number];
const rewards: Record<string, number> = { "nbp-inflation-target": 30, "inflation-target-why": 30, "monetary-policy-tool": 25, "rates-and-borrowing": 25, "gdp-definition": 25, "deflation-risk": 30 };
const observations: Array<Record<string, unknown>> = [];
function material(id: string, locale: Locale) {
  const canonical = getQuestionById(id, locale), english = quizQuestions.find(row => row.id === id);
  if (!canonical || !english || rewards[id] === undefined) throw Error("Expected existing C34 item " + id);
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
const delayedAndUncertain = (text: string) => /opóźni|lag|delay/i.test(text) && /niepewn|uncertain/i.test(text);
const conditional = (text: string) => /może|mogą|możliwe|can |may |possible|typically|zwykle/i.test(text);

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw Error("C34 finance forbids network"); })));
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
afterAll(() => console.log("C34_FINANCIAL_OBSERVATIONS " + JSON.stringify(observations)));

describe("C34 independent macroeconomic definitions and conditional policy mechanisms", () => {
  it.each(locales)("%s NBP target is medium-term annual CPI rather than a guaranteed current reading", locale => {
    const source = material("nbp-inflation-target", locale), text = source.endorsed;
    record("nbp-inflation-target", locale, {
      correctPolishTargetAndPercentagePoints: /2[,.]5\s*%/.test(source.correct.text) && /±\s*1/.test(source.correct.text) && /punkt procentow|percentage point/i.test(source.correct.text),
      annualCpiAndMediumTerm: /CPI/.test(text) && /roczn|annual/i.test(text) && /średni|medium.term/i.test(text),
      targetNotObservedForecastOrMonthlyPromise: /nie bieżąca|not current/i.test(text) && /prognoz|forecast/i.test(text) && /gwaranc|guarant/i.test(text),
      basketNotIdenticalIndividualPrices: /koszyk|basket/i.test(text) && /nie identyczn|not the same/i.test(text),
      bandNotLoanOrDepositYield: /nie oznacza oprocentowania|not a loan or deposit interest rate/i.test(text),
    });
  });

  it.each(locales)("%s a positive inflation buffer is a policy rationale without universal growth or price guarantees", locale => {
    const source = material("inflation-target-why", locale), text = source.endorsed;
    record("inflation-target-why", locale, {
      marginAgainstDeflationRisk: /margines|bufor|margin|buffer/i.test(source.correct.text) && /deflac|deflation/i.test(source.correct.text) && /ryzyk|risk/i.test(source.correct.text),
      mechanismIsConditional: conditional(source.correct.text),
      noGrowthOrEveryPriceGuarantee: /nie gwarant|not guarantee|no guarantee/i.test(text) && /wzrost.*gospod|economic growth/i.test(text),
      positiveInflationStillRaisesGeneralLevel: /dodatni|positive/i.test(text) && /nadal rośnie|still rising|continues to rise/i.test(text) && /poziom|level/i.test(text),
      centralBankTargetsCanDiffer: /różni|differ/i.test(text) && /bank|banks/i.test(text),
    });
  });

  it.each(locales)("%s policy rates are a main indirect tool with other instruments and uncertain lags", locale => {
    const source = material("monetary-policy-tool", locale), text = source.endorsed;
    record("monetary-policy-tool", locale, {
      mainRateInstrumentPreserved: /stóp|stopy|rate/i.test(source.correct.text) && /referencyjn|benchmark/i.test(source.correct.text),
      notTheOnlyInstrument: /nie jedyn|not its only|not the only/i.test(text) && /otwartego rynku|open market/i.test(text),
      delayedUncertainTransmission: delayedAndUncertain(text),
      notEveryCommercialContractOrPriceSet: /nie ustala|does not.*set/i.test(text) && /umow|contract/i.test(text) && /cen|price/i.test(text),
    });
  });

  it.each(locales)("%s higher rates describe a conditional contract-dependent channel rather than instant falling prices", locale => {
    const source = material("rates-and-borrowing", locale), text = source.endorsed;
    record("rates-and-borrowing", locale, {
      borrowingDemandChannelConditional: conditional(source.correct.text) && /popyt|demand/i.test(source.correct.text) && /kredyt|borrow/i.test(source.correct.text),
      effectDelayedAndUncertain: delayedAndUncertain(text),
      repricingDependsOnContract: /umow|contract/i.test(text) && /termin|timing/i.test(text) && /stałej stop|fixed.rate/i.test(text),
      slowerPositiveInflationIsNotPriceFall: /wolniejsz|slower/i.test(text) && /dodatni|positive/i.test(text) && /nie ich spadek|not that they fall|not a fall in prices/i.test(text),
      notAPaymentForecast: /nie prognoza rat|not a payment forecast/i.test(text),
    });
  });

  it.each(locales)("%s GDP measures final production over a period without double-counting or equating welfare", locale => {
    const source = material("gdp-definition", locale), text = source.endorsed;
    record("gdp-definition", locale, {
      finalOutputAndPeriodInCorrectOption: /finaln|final/i.test(source.correct.text) && /okres|period/i.test(source.correct.text) && /gospodar|economy/i.test(source.correct.text),
      grossValueAddedWithProductTaxesLessSubsidies: /wartość dodaną brutto|gross value added/i.test(text) && /podatki od produktów|taxes on products/i.test(text) && /pomniejszone o dotacje|less subsidies/i.test(text),
      intermediateOutputNotAddedAgain: /pośrednich|intermediate/i.test(text) && /nie dodaje się drugi raz|not added again|not double.count/i.test(text),
      notFullWellbeingOrPersonalIncome: /nie jest|is not/i.test(text) && /dobrost|dobrobyt|wellbeing|well.being/i.test(text) && /osobist.*dochod|personal income/i.test(text),
    });
  });

  it.each(locales)("%s deflation risk concerns persistent broad declines and is not advice to delay urgent needs", locale => {
    const source = material("deflation-risk", locale), text = source.endorsed;
    record("deflation-risk", locale, {
      persistentGeneralPriceFall: /utrzymując|trwał|persistent/i.test(text) && /ogólnego poziomu cen|general price level/i.test(text),
      possibleMechanismNotEveryInevitableSpiral: conditional(source.correct.text) && /nie nieuchronna|not an inevitable/i.test(text),
      realBurdenOfUnchangedNominalDebt: /realn|real burden/i.test(text) && /nominaln|nominal debt/i.test(text) && /niezmienion|unchanged/i.test(text),
      singleDiscountAndSlowerPositiveInflationDistinguished: /pojedyncza promocja|single discount/i.test(text) && /wolniejsza dodatnia inflacja|slower positive inflation/i.test(text) && /nie oznacz|does not mean/i.test(text),
      urgentNeedsAndRequiredRepaymentsProtected: /piln|urgent/i.test(text) && /podstawow|essential/i.test(text) && /wymagan|require/i.test(text) && /spłat|repay/i.test(text) && /nie jest to zachęta|not a reason/i.test(text),
    });
  });

  it.each(locales)("%s independent percentage-point arithmetic gives one-point-five and three-point-five percent band edges", locale => {
    const source = material("nbp-inflation-target", locale), text = source.endorsed;
    const centerBasisPoints = BigInt("250"), deviationBasisPoints = BigInt("100");
    const lowerBasisPoints = centerBasisPoints - deviationBasisPoints, upperBasisPoints = centerBasisPoints + deviationBasisPoints;
    expect(lowerBasisPoints).toBe(BigInt("150")); expect(upperBasisPoints).toBe(BigInt("350"));
    expect(upperBasisPoints - lowerBasisPoints).toBe(BigInt("200"));
    record("nbp-inflation-target-numeric", locale, {
      targetAndOnePointDeviationStated: /2[,.]5\s*%/.test(text) && /±\s*1/.test(text) && /punkt procentow|percentage point/i.test(text),
      edgesArePercentageRates: /1[,.]5\s*%/.test(text) && /3[,.]5\s*%/.test(text),
      mediumTermPolicyNotForecastOrInterestRate: /średni|medium.term/i.test(text) && /prognoz|forecast/i.test(text) && /nie bieżąca|not current/i.test(text) && /nie oznacza oprocentowania|not a loan or deposit interest rate/i.test(text),
    }, { centerBasisPoints: centerBasisPoints.toString(), deviationBasisPoints: deviationBasisPoints.toString(), lowerBasisPoints: lowerBasisPoints.toString(), upperBasisPoints: upperBasisPoints.toString(), fullWidthBasisPoints: (upperBasisPoints - lowerBasisPoints).toString() });
  });
});
