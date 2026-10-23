import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { challengeQuestions } from "@/data/challengeQuestions";
import { getQuestionById } from "@/lib/allQuestions";

const locales = ["pl", "en"] as const;
type Locale = typeof locales[number];
const keys: Record<string, string> = { c1: "B", c2: "C", c3: "B", c4: "C", c5: "D", c6: "B" };
const observations: Array<Record<string, unknown>> = [];
function material(id: string, locale: Locale) {
  const canonical = getQuestionById(id, locale), english = challengeQuestions.find(row => row.id === id);
  if (!canonical || !english) throw Error("Expected existing foundation " + id);
  const correct = canonical.answers.find(row => row.id === canonical.correctAnswer);
  if (!correct) throw Error("Expected existing correct option " + id);
  expect(canonical.correctAnswer).toBe(keys[id]); expect(canonical.reward).toBe(50);
  expect(canonical.answers.map(row => row.id)).toEqual(["A", "B", "C", "D"]);
  // Deliberately false distractors are reviewed separately, not treated as endorsed claims.
  return { canonical, english, correct, text: [canonical.question, correct.text, canonical.explanation].join("\n") };
}
function record(id: string, locale: Locale, text: string, guards: Record<string, boolean>) {
  observations.push({ id, locale, text, guards });
  expect(guards).toEqual(Object.fromEntries(Object.keys(guards).map(key => [key, true])));
}

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw Error("C28 finance forbids network"); })));
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
afterAll(() => console.log("C28_FINANCIAL_OBSERVATIONS " + JSON.stringify(observations)));

describe("C28 independent six-foundation financial qualifications", () => {
  it.each(locales)("%s c1 treats the percentages as adaptable guidance after essential obligations", locale => {
    const source = material("c1", locale), text = source.text;
    record("c1", locale, text, locale === "pl" ? {
      flexible: /wskazów|elastycz|dopas|orientacyjn/i.test(text),
      netIncome: /netto|po podat|do dyspozycji/i.test(text),
      essentials: /podstawow|niezbędn/i.test(text),
      minima: /minimaln|minimum|wymagan/i.test(text) && /spłat|rat/i.test(text),
      extraRatherThanDoubleCount: /dodatkow|nadpłat/i.test(text) || /nie\s+licz[^.!?\n]{0,35}(?:dwukrotnie|dwa razy)/i.test(text),
    } : {
      flexible: /guideline|flexib|adapt|rule of thumb/i.test(text),
      netIncome: /take.home|after.tax|net income/i.test(text),
      essentials: /essential|basic needs/i.test(text),
      minima: /minimum|required/i.test(text) && /repay|payment/i.test(text),
      extraRatherThanDoubleCount: /extra|additional/i.test(text) || /do\s+not\s+count[^.!?\n]{0,45}twice/i.test(text),
    });
  });

  it.each(locales)("%s c2 explains interest on interest with conditional growth rather than a promised outcome", locale => {
    const source = material("c2", locale), text = source.text;
    record("c2", locale, text, locale === "pl" ? {
      principalAndInterest: (/kapitał|początkow/i.test(text) || /1\s?000\s*zł/i.test(source.canonical.question)) && /odset/i.test(text),
      conditionalModel: /hipotet|założ|jeśli|pod warunkiem/i.test(text),
      outcomeLimited: /nie[^.!?\n]{0,60}gwarant|bez gwarancji|strat|ryzyk/i.test(text),
    } : {
      principalAndInterest: (/principal|original amount/i.test(text) || /PLN\s*1,?000/i.test(source.canonical.question)) && /interest/i.test(text),
      conditionalModel: /hypothet|assum|\bif\b|provided/i.test(text),
      outcomeLimited: /(?:not|no)[^.!?\n]{0,60}guarantee|loss|risk/i.test(text),
    });
  });

  it.each(locales)("%s c3 distinguishes spreading investments from eliminating market losses", locale => {
    const source = material("c3", locale), text = source.text;
    record("c3", locale, text, locale === "pl" ? {
      spreading: /różn|rozłoż|rozpras/i.test(text) && /akty|inwest/i.test(text),
      lossStillPossible: /strat/i.test(text) && /nie|bez gwarancji/i.test(text),
    } : {
      spreading: /different|spread|divers/i.test(text) && /assets?|invest/i.test(text),
      lossStillPossible: /loss|lose/i.test(text) && /cannot|not|no guarantee/i.test(text),
    });
  });

  it.each(locales)("%s c4 applies only optional extra money after essentials and all required payments with fee assumptions", locale => {
    const source = material("c4", locale), text = source.text;
    record("c4", locale, text, locale === "pl" ? {
      essentials: /podstawow|niezbędn/i.test(text),
      minimaOnExistingDebt: /minimum|minimaln|wymagan/i.test(text) && /spłat|rat/i.test(text),
      optionalExtra: /nadwyż|dodatkow|nadpłat/i.test(text),
      highestRate: /najwyższ|najwyżej/i.test(text) && /oprocent|stop/i.test(text),
      feesExplicit: /opłat|prowizj/i.test(text),
      conditional: /założ|warunk|zależ|może/i.test(text),
    } : {
      essentials: /essential|basic needs/i.test(text),
      minimaOnExistingDebt: /minimum|required/i.test(text) && /repay|payment/i.test(text),
      optionalExtra: /extra|surplus|additional/i.test(text),
      highestRate: /highest/i.test(text) && /interest|rate/i.test(text),
      feesExplicit: /fees?|charges?/i.test(text),
      conditional: /assum|depend|conditional|\bif\b|may|with\s+fixed\s+rates\s+and\s+no\s+extra\s+fees/i.test(text),
    });
  });

  it.each(locales)("%s c5 states the same annual model and makes taxes and fees assumptions explicit", locale => {
    const source = material("c5", locale), text = source.text;
    record("c5", locale, text, locale === "pl" ? {
      annualPeriod: /rok|roczn/i.test(text),
      hypothetical: /hipotet|założ/i.test(text),
      fees: /opłat|koszt/i.test(text),
      tax: /podat/i.test(text),
      purchasingPower: /sił[^.!?\n]{0,15}nabywcz|cenach/i.test(text),
    } : {
      annualPeriod: /year|annual/i.test(text),
      hypothetical: /hypothet|assum/i.test(text),
      fees: /fees?|cost/i.test(text),
      tax: /tax/i.test(text),
      purchasingPower: /purchasing power|base.year prices|starting.year prices|initial prices/i.test(text),
    });
  });

  it.each(locales)("%s c6 separates an index strategy from the ETF wrapper and makes actual costs and risk matter", locale => {
    const source = material("c6", locale), text = source.text;
    record("c6", locale, text, locale === "pl" ? {
      correctFund: /fundusz indeksow/i.test(source.correct.text),
      activeETF: /ETF/i.test(text) && /aktywn/i.test(text),
      actualCosts: /opłat|koszt/i.test(text),
      outcomeLimited: /nie[^.!?\n]{0,60}gwarant|strat|ryzyk/i.test(text),
    } : {
      correctFund: /index fund/i.test(source.correct.text),
      activeETF: /ETF/i.test(text) && /active/i.test(text),
      actualCosts: /fees?|cost/i.test(text),
      outcomeLimited: /(?:not|no)[^.!?\n]{0,60}guarantee|loss|risk/i.test(text),
    });
  });

  it.each(locales)("%s c5 correct option rounds the independent exact ratio while subtraction is marked approximate", locale => {
    const source = material("c5", locale);
    // Exact percentage: (102 / 105 - 1) * 100 = -300/105 = -20/7.
    // Round the absolute rational to hundredths, then restore its negative sign.
    const magnitudeNumerator = BigInt("30000"), denominator = BigInt("105");
    const roundedHundredths = -((magnitudeNumerator + denominator / BigInt("2")) / denominator);
    expect(roundedHundredths).toBe(-BigInt("286"));
    const exactRounded = locale === "pl" ? /[−-]\s*2,86\s*%/ : /[−-]\s*2\.86\s*%/;
    const approximation = locale === "pl" ? /przybliż|orientacyjn/i : /approx|rough/i;
    const guards = { correctExactRounded: exactRounded.test(source.correct.text),
      subtractionClearlyApproximate: approximation.test(source.canonical.explanation) && /[−-]\s*3\s*%/.test(source.canonical.explanation) };
    observations.push({ id: "c5", locale, scope: "independent-rational", roundedHundredths: roundedHundredths.toString(), guards, text: source.text });
    expect(guards).toEqual({ correctExactRounded: true, subtractionClearlyApproximate: true });
  });

  it.each(locales)("%s c2 independent two-year nominal model compounds PLN 1000 annually at 5 percent with zero flows and costs", locale => {
    const source = material("c2", locale), prompt = source.canonical.question;
    const initialGrosze = BigInt("100000"), rateFactorNumerator = BigInt("105"), denominator = BigInt("100");
    const yearOne = initialGrosze * rateFactorNumerator / denominator;
    const yearTwo = yearOne * rateFactorNumerator / denominator;
    expect(yearOne).toBe(BigInt("105000")); expect(yearTwo).toBe(BigInt("110250"));
    expect(yearTwo - yearOne).toBe(BigInt("5250"));
    const guards = locale === "pl" ? {
      initialPLN1000: /1\s?000\s*zł/i.test(prompt),
      annualFivePercent: /5\s*%[^.!?\n]{0,20}roczn/i.test(prompt),
      twoYears: /2\s*(?:lata|lat)/i.test(prompt),
      annualCompounding: /kapitalizacj[^.!?\n]{0,15}roczn/i.test(prompt),
      zeroFlows: /bez[^.!?\n]{0,65}dopłat/i.test(prompt) && /wypłat/i.test(prompt),
      zeroFeesAndTax: /bez[^.!?\n]{0,75}opłat/i.test(prompt) && /podat/i.test(prompt),
      correctCompoundBalance: /1\s?102,50\s*zł/i.test(source.correct.text),
    } : {
      initialPLN1000: /PLN\s*1,?000/i.test(prompt),
      annualFivePercent: /5\s*%[^.!?\n]{0,20}(?:a year|annual|per year)/i.test(prompt),
      twoYears: /2\s*years?/i.test(prompt),
      annualCompounding: /annual compounding/i.test(prompt),
      zeroFlows: /no[^.!?\n]{0,65}contributions/i.test(prompt) && /withdrawals/i.test(prompt),
      zeroFeesAndTax: /no[^.!?\n]{0,75}fees/i.test(prompt) && /tax/i.test(prompt),
      correctCompoundBalance: /PLN\s*1,?102\.50/i.test(source.correct.text),
    };
    observations.push({ id: "c2", locale, scope: "independent-numeric-compounding", yearOneGrosze: yearOne.toString(),
      yearTwoGrosze: yearTwo.toString(), guards, text: source.text });
    expect(guards).toEqual({ initialPLN1000: true, annualFivePercent: true, twoYears: true, annualCompounding: true,
      zeroFlows: true, zeroFeesAndTax: true, correctCompoundBalance: true });
  });

  it("actual EN c2 omits the unverified Einstein attribution", () => {
    const source = material("c2", "en"), attributionRemaining = /Einstein|8th wonder|eighth wonder/i.test(source.english.explanation);
    observations.push({ id: "c2", scope: "unverified-attribution", attributionRemaining, explanation: source.english.explanation });
    expect(attributionRemaining).toBe(false);
  });

  it("actual EN c6 omits blanket passive low-fee and historical-outperformance assertions", () => {
    const source = material("c6", "en"), oldClaims = ["Index funds and ETFs passively track a market index", "historically outperform most actively managed funds"];
    const remaining = oldClaims.filter(claim => source.english.explanation.includes(claim));
    observations.push({ id: "c6", scope: "blanket-fund-claims", remaining, explanation: source.english.explanation });
    expect(remaining).toEqual([]);
  });
});
