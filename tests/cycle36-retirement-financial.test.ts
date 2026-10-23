import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { quizQuestions } from "@/data/quizQuestions";
import { getQuestionById } from "@/lib/allQuestions";

const locales = ["pl", "en"] as const;
type Locale = typeof locales[number];
const rewards: Record<string, number> = { "ike-vs-ikze": 35, "ppk-employer-match": 30, "ppk-state-bonus": 25 };
const observations: Array<Record<string, unknown>> = [];
function material(id: string, locale: Locale) {
  const canonical = getQuestionById(id, locale), english = quizQuestions.find(row => row.id === id);
  if (!canonical || !english || rewards[id] === undefined) throw Error("Expected existing C36 item " + id);
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
const statutoryBase = (text: string) => /podstaw|base|basis/i.test(text) && /PPK/.test(text);

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw Error("C36 finance forbids network"); })));
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
afterAll(() => console.log("C36_FINANCIAL_OBSERVATIONS " + JSON.stringify(observations)));

describe("C36 independent Polish retirement tax distinctions and conditional PPK support", () => {
  it.each(locales)("%s IKE and IKZE separate conditional relief, whole qualifying payout tax and earlier return", locale => {
    const source = material("ike-vs-ikze", locale), text = source.endorsed;
    record("ike-vs-ikze", locale, {
      conditionalIKERelief: /IKE/.test(text) && /warunk|qualif|statutory/i.test(text) && /zwoln|tax.free|exempt/i.test(text),
      IKZEDeductionHasAnnualCapAndTaxBase: /IKZE/.test(text) && /odlicz|deduct/i.test(text) && /limi[tc]|cap/i.test(text) && /roczn|annual/i.test(text) && /dochod|dochód|przych[oó]d|income|revenue/i.test(text),
      benefitDependsOnPersonalTaxSituation: /zależy|zależ|depend/i.test(text) && /sytuac|dochod|dochód|income|tax/i.test(text),
      tenPercentAppliesToWholeQualifyingPayout: /10\s*%/.test(text) && /całej wypłaty|cał.*kwot.*wypłat|whole.*(payout|withdrawal)|entire.*(payout|withdrawal)|full.*(payout|withdrawal)/i.test(text) && /warunk|qualif/i.test(text),
      earlierIKZEReturnUsesDifferentScale: /wcześniejsz.*zwrot|early.*return/i.test(text) && /skal|PIT.scale|tax.scale|progressive|ordinary.*income/i.test(text),
      noUnconditionalEarnedReviewReward: !/\+\s*35\s*(token|punkt)/i.test(text),
    });
  });

  it.each(locales)("%s PPK employer payments use a contribution base and may affect PIT rather than guarantee a free return", locale => {
    const source = material("ppk-employer-match", locale), text = source.endorsed;
    record("ppk-employer-match", locale, {
      basicAndAdditionalEmployerRatesPreserved: /1[,.]5\s*%/.test(source.correct.text) && /2[,.]5\s*%/.test(source.correct.text),
      additionalRateIsOptionalNotAlwaysFourPercent: /dodatkow|additional/i.test(text) && /może|dobrowol|opcjonal|may|optional/i.test(text),
      statutoryContributionBaseNotNetPay: statutoryBase(text) && /wynagrodz|remuneration|salary|pay/i.test(text),
      employeeReductionIsConditional: /obniż|reduc/i.test(text) && /warunk|condition/i.test(text),
      employerContributionIsTaxRelevantIncome: /przych[oó]d|income/i.test(text) && /PIT/.test(text),
      illustrationNotNetPayrollOrInvestmentPromise: /nie.*netto|not.*net.pay|not.*take.home|not.*payroll/i.test(text) && /nie.*gwaran|not.*guarant|no.*guarant/i.test(text),
      noUnconditionalEarnedReviewReward: !/\+\s*30\s*(token|punkt)/i.test(text),
    });
  });

  it.each(locales)("%s PPK state additions distinguish once-only welcome support and conditional annual support from profit", locale => {
    const source = material("ppk-state-bonus", locale), text = source.endorsed;
    record("ppk-state-bonus", locale, {
      correctStateAmountsPreserved: /250/.test(source.correct.text) && /240/.test(source.correct.text) && /zł|PLN/.test(text),
      welcomeIsOnceOnly: /powital|welcome/i.test(text) && /jednoraz|raz|once|one.off/i.test(text),
      annualSupportDependsOnConditions: /roczn|annual/i.test(text) && /warunk|condition|eligib/i.test(text),
      additionNotGuaranteedReturn: /nie.*gwaran|not.*guarant|no.*guarant/i.test(text) && /zysk|stop.*zwrot|return|profit/i.test(text),
      annualSupportStopsAfterWithdrawalsAtSixty: /roczn|annual/i.test(text) && /60/.test(text) && /rozpoczę|begin|start/i.test(text) && /wypłat|withdrawal/i.test(text) && /nie przysługuje|stop|not payable|no longer/i.test(text),
      noUnconditionalEarnedReviewReward: !/\+\s*25\s*(token|punkt)/i.test(text),
    });
  });

  it.each(locales)("%s independent six-thousand-PLN base model keeps employee, basic employer and optional extra amounts separate", locale => {
    const source = material("ppk-employer-match", locale), text = source.endorsed;
    const baseGrosze = BigInt("600000"), denominator = BigInt("10000");
    const employeeGrosze = baseGrosze * BigInt("200") / denominator;
    const employerBasicGrosze = baseGrosze * BigInt("150") / denominator;
    const employerExtraGrosze = baseGrosze * BigInt("250") / denominator;
    const employerMaximumGrosze = employerBasicGrosze + employerExtraGrosze;
    expect(employeeGrosze).toBe(BigInt("12000")); expect(employerBasicGrosze).toBe(BigInt("9000"));
    expect(employerExtraGrosze).toBe(BigInt("15000")); expect(employerMaximumGrosze).toBe(BigInt("24000"));
    record("ppk-employer-reference-model", locale, {
      sameHypotheticalOnePeriodBase: /6[\s,.]*000/.test(text) && statutoryBase(text) && /hipotet|hypothet|illustrat|przykład|example/i.test(text) && /okres|period/i.test(text),
      employeeAndEmployerAmountsDistinguished: /120/.test(text) && /90/.test(text) && /150/.test(text) && /240/.test(text) && /pracownik|employee/i.test(text) && /pracodawc|employer/i.test(text),
      fullEmployeeBasicAndOptionalEmployerExtraAssumed: /2\s*%/.test(text) && /1[,.]5\s*%/.test(text) && /2[,.]5\s*%/.test(text) && /opcjonal|dobrowol|optional|may/i.test(text),
      noNetTaxOrReturnQuote: /nie.*netto|not.*net.pay|not.*take.home|not.*payroll/i.test(text) && /PIT/.test(text) && /nie.*gwaran|not.*guarant|no.*guarant/i.test(text),
    }, { baseGrosze: baseGrosze.toString(), employeeGrosze: employeeGrosze.toString(), employerBasicGrosze: employerBasicGrosze.toString(), employerExtraGrosze: employerExtraGrosze.toString(), employerMaximumGrosze: employerMaximumGrosze.toString() });
  });
});
