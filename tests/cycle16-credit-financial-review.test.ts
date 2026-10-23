import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stageLessons } from "@/data/stageLessons";
import { quizQuestions } from "@/data/quizQuestions";
import { getQuestionById } from "@/lib/allQuestions";
import { STAGE_QUESTION_IDS } from "@/lib/learningProgress";
import metadata from "../docs/coachfi/cycle-16/content-metadata.json";

const locales = ["pl", "en"] as const;
type Locale = typeof locales[number];
const expected = [["interest-rates", "C", 25], ["debt-avalanche", "C", 30], ["credit-score-factors", "B", 25], ["bond-prices", "B", 30]] as const;

beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw new Error("C16 financial review forbids real network"); })));
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });

function checkedQuestion(id: string, locale: Locale) {
  const row = getQuestionById(id, locale);
  if (!row) throw new Error("Expected actual canonical question, without plain substitution: " + id + "/" + locale);
  return row;
}
function checkedAnswer(id: string, locale: Locale, option: string) {
  const row = checkedQuestion(id, locale).answers.find(answer => answer.id === option);
  if (!row) throw new Error("Expected answer: " + id + "/" + locale + "/" + option);
  return row;
}
function checkedEnglish(id: string) {
  const row = quizQuestions.find(question => question.id === id);
  if (!row) throw new Error("Expected English bank question: " + id);
  return row;
}
function checkedMetadataQuestion(id: string) {
  const row = metadata.questions.find(question => question.id === id);
  if (!row) throw new Error("Expected reviewed metadata question: " + id);
  return row;
}
function checkedMetadataCopy(id: string, locale: Locale) {
  const copy = checkedMetadataQuestion(id).copy[locale];
  if (!copy) throw new Error("Expected metadata copy: " + id + "/" + locale);
  return copy;
}
function checkedMetadataStep(id: string) {
  const row = metadata.steps.find(step => step.question_id === id);
  if (!row) throw new Error("Expected reviewed metadata step: " + id);
  return row;
}
function checkedMetadataStepCopy(id: string, locale: Locale) {
  const copy = checkedMetadataStep(id).copy[locale];
  if (!copy) throw new Error("Expected metadata step copy: " + id + "/" + locale);
  return copy;
}
function checkedLesson(locale: Locale) {
  const lesson = stageLessons["credit-rates"];
  if (!lesson) throw new Error("Expected credit-rates lesson");
  const copy = lesson.copy[locale];
  if (!copy) throw new Error("Expected credit-rates lesson language: " + locale);
  return copy;
}
function checkedStep(locale: Locale, index: number) {
  const step = checkedLesson(locale).steps[index];
  if (!step) throw new Error("Expected credit-rates step: " + locale + "/" + index);
  return step;
}
function checkedRationale(id: string, option: string, locale: Locale) {
  const explanations = checkedMetadataQuestion(id).wrong_option_explanations as Record<string, { pl: string; en: string } | undefined>;
  const row = explanations[option];
  if (!row) throw new Error("Expected wrong-option rationale: " + id + "/" + option);
  const text = row[locale];
  if (!text) throw new Error("Expected rationale language: " + id + "/" + option + "/" + locale);
  return text;
}
function assumptions(id: string) { return checkedMetadataQuestion(id).calculation_assumptions as Record<string, unknown>; }
function numericPercent(text: string) {
  const match = /^([0-9]+)%$/.exec(text);
  if (!match) throw new Error("Expected an unambiguous whole percent answer: " + text);
  const digits = match[1];
  if (!digits) throw new Error("Expected captured percent digits");
  return Number(digits);
}
function roundedPositiveFraction(numerator: bigint, denominator: bigint) {
  if (numerator < BigInt("0") || denominator <= BigInt("0")) throw new Error("Positive rational oracle required");
  return (BigInt("2") * numerator + denominator) / (BigInt("2") * denominator);
}

// Independent hypothetical arithmetic in whole grosze; no application calculator or metadata operand.
const oldRate = BigInt("3") + BigInt("2");
const newRate = BigInt("4") + BigInt("2");
const oneYearInterest = BigInt("100000") * newRate / BigInt("100");
const marginalHigh = BigInt("10000") * BigInt("20") / BigInt("100");
const marginalLow = BigInt("10000") * BigInt("10") / BigInt("100");
const bondAtTen = BigInt("110000") * BigInt("100") / BigInt("110");
const bondAtTwentyNumerator = BigInt("110000") * BigInt("100");
const bondAtTwentyRounded = roundedPositiveFraction(bondAtTwentyNumerator, BigInt("120"));

const distractors = [
  { id: "interest-rates", option: "A", answer: [/^2%$/, /^2%$/], reason: [/pomija wskaźnik|sama marża/, /omits the reference rate|margin alone/] },
  { id: "interest-rates", option: "B", answer: [/^5%$/, /^5%$/], reason: [/poprzednia/, /previous/] },
  { id: "interest-rates", option: "D", answer: [/^9%$/, /^9%$/], reason: [/dawny i nowy wskaźnik|stara wartość/, /both old and new reference rates|old value is replaced/] },
  { id: "debt-avalanche", option: "A", answer: [/Po równo/, /Split equally/], reason: [/Równy podział.*nie jest priorytetem/, /Splitting equally.*not the avalanche priority/] },
  { id: "debt-avalanche", option: "B", answer: [/najmniejszy dług/i, /smallest debt/], reason: [/500 zł.*10%/, /500 debt.*10%/] },
  { id: "debt-avalanche", option: "D", answer: [/Zamiast minimum/, /Instead of another debt's minimum/], reason: [/nie zastępuje.*minimalnej spłaty/, /does not replace.*required minimum/] },
  { id: "credit-score-factors", option: "A", answer: [/gwarantuje/, /guarantees/], reason: [/nie gwarantuje zgody/, /does not guarantee approval/] },
  { id: "credit-score-factors", option: "C", answer: [/Punkty Coachfi zastępują/, /Coachfi points replace/], reason: [/nie są scoringiem BIK ani oceną zdolności/, /neither BIK scoring nor a lender's capacity assessment/] },
  { id: "credit-score-factors", option: "D", answer: [/Dochody nie mają znaczenia/, /Income does not matter/], reason: [/Dochody i wydatki są istotne/, /Income and expenses matter/] },
  { id: "bond-prices", option: "A", answer: [/^Rośnie$/, /^It rises$/], reason: [/niższą, nie wyższą cenę/, /lower, not higher, price/] },
  { id: "bond-prices", option: "C", answer: [/Kupon automatycznie rośnie/, /coupon automatically rises/], reason: [/nie podnosi automatycznie.*kuponu/, /does not automatically raise.*coupon/] },
  { id: "bond-prices", option: "D", answer: [/Nominał.*automatycznie maleje/, /Principal at maturity automatically falls/], reason: [/sam go nie obniża.*Niewypłacalność/, /does not reduce that principal.*Default/] },
] as const;

describe("C16 actual canonical identity and reviewed bilingual delivery", () => {
  it.each(expected.flatMap(row => locales.map(locale => [row[0], row[1], row[2], locale] as const)))("%s/%s/%s/%s preserves canonical ID/key/reward/ABCD and reviewed feedback", (id, key, reward, locale) => {
    const q = checkedQuestion(id, locale), documented = checkedMetadataCopy(id, locale);
    expect(q.id).toBe(id); expect(q.correctAnswer).toBe(key); expect(q.reward).toBe(reward);
    expect(q.answers.map(answer => answer.id)).toEqual(["A", "B", "C", "D"]);
    expect(q.answers.filter(answer => answer.id === key)).toHaveLength(1);
    expect(q.question).toBe(documented.question); expect(q.answers).toEqual(documented.answers); expect(q.explanation).toBe(documented.retryMessage);
    expect(checkedMetadataQuestion(id).correct_answer).toBe(key); expect(checkedMetadataQuestion(id).reward).toBe(reward);
    expect(quizQuestions.filter(row => row.id === id)).toHaveLength(1);
    if (locale === "en") expect(checkedEnglish(id).successMessage).toBe(documented.successMessage);
  });
  it("existing four IDs retain110 points and Poland-only source/version context", () => {
    expect(STAGE_QUESTION_IDS["credit-rates"]).toEqual(expected.map(row => row[0]));
    expect(metadata.questions.map(row => row.id)).toEqual(expected.map(row => row[0]));
    expect(metadata.steps.map(row => row.question_id)).toEqual(expected.map(row => row[0]));
    expect(metadata.distinct_existing_questions).toBe(4); expect(metadata.language_versions).toBe(8); expect(metadata.new_question_ids).toBe(0);
    expect(metadata.canonical_union_count_unchanged).toBe(82);
    expect(expected.reduce((total, row) => total + row[2], 0)).toBe(110); expect(metadata.reward_total).toBe(110);
    expect(metadata.market_country).toBe("PL"); expect(metadata.languages).toEqual(["pl", "en"]);
    const sourceIds = new Set(metadata.sources.map(source => source.id));
    for (const row of [...metadata.questions, ...metadata.steps]) {
      expect(row.country).toBe("PL"); expect(row.version).toBe(metadata.version); expect(row.created_date).toBe("2026-10-15");
      expect(row.source_ids.length).toBeGreaterThan(0);
      for (const id of row.source_ids) expect(sourceIds.has(id), "Missing primary source: " + id).toBe(true);
    }
    expect(checkedMetadataQuestion("interest-rates").source_ids).toContain("knf-rates");
    expect(checkedMetadataQuestion("debt-avalanche").source_ids).toContain("cfpb-worksheet");
    expect(checkedMetadataQuestion("credit-score-factors").source_ids).toContain("bik-score");
    expect(checkedMetadataQuestion("credit-score-factors").source_ids).toContain("bik-capacity");
    expect(checkedMetadataQuestion("bond-prices").source_ids).toContain("sec-bond-risk");
    for (const source of metadata.sources) { expect(source.url).toMatch(/^https:\/\//); expect(source.checked_date).toBe("2026-10-15"); expect(source.limits.length).toBeGreaterThan(20); }
  });
  it.each(distractors)("$id/$option has an independently meaningful wrong option and PL/EN explanation", row => {
    const documented = checkedMetadataQuestion(row.id);
    expect(row.option).not.toBe(documented.correct_answer);
    expect(Object.keys(documented.wrong_option_explanations).sort()).toEqual(["A", "B", "C", "D"].filter(option => option !== documented.correct_answer));
    for (const [index, locale] of locales.entries()) {
      const answerOracle = row.answer[index], reasonOracle = row.reason[index];
      if (!answerOracle || !reasonOracle) throw new Error("Missing independent distractor language oracle");
      expect(checkedAnswer(row.id, locale, row.option).text).toMatch(answerOracle);
      expect(checkedRationale(row.id, row.option, locale)).toMatch(reasonOracle);
    }
  });
});

describe("C16 independent financial arithmetic and country meaning", () => {
  it.each(locales)("%s rate reset uses4+2=6 percent and60 PLN simple interest, with fixed-period qualifications", locale => {
    const q = checkedQuestion("interest-rates", locale), body = checkedStep(locale, 0).body;
    expect(Number(oldRate)).toBe(5); expect(Number(newRate)).toBe(6); expect(Number(oneYearInterest) / 100).toBe(60);
    expect(numericPercent(checkedAnswer("interest-rates", locale, "C").text)).toBe(Number(newRate));
    expect(q.answers.filter(answer => numericPercent(answer.text) === Number(newRate))).toHaveLength(1);
    expect(q.question).toMatch(/umownej aktualizacji|contractual reset/);
    expect(body).toMatch(/hipotetyczny|Hypothetical/); expect(body).toMatch(/60 zł|PLN 60/);
    expect(body).toMatch(/bez spłat, kapitalizacji i opłat|no repayments, compounding or fees/);
    for (const text of [body, q.explanation]) {
      expect(text).toMatch(/stałe lub okresowo stałe|fixed or periodically fixed/);
      expect(text).toMatch(/po tym okresie|po jego końcu|after that period|when it ends/);
      expect(text).toMatch(/warunki umowy|contractual terms/);
      expect(text).toMatch(/nie zamraża.*wszystkich opłat|nie oznacza.*zamrożenia wszystkich opłat|does not freeze every fee/);
    }
    expect(q.explanation).toMatch(/nie oznacza natychmiastowej zmiany każdej raty|does not instantly change every installment/);
    expect(assumptions("interest-rates")).toMatchObject({ currency: "PLN", reference_rate_before_percent: 3, reference_rate_after_percent: 4, fixed_margin_percentage_points: 2, total_rate_before_percent: Number(oldRate), total_rate_after_percent: Number(newRate), illustrative_principal: 1000, simple_interest_one_year_at_new_rate: Number(oneYearInterest) / 100, years: 1, principal_constant: true, repayments: 0, capitalization: false, fees_assumed: 0, hypothetical_not_current_rate: true, loan_repayment_schedule_not_calculated: true });
  });
  it.each(locales)("%s avalanche protects all minimums and bounds20 versus10 PLN to a separate marginal model", locale => {
    const q = checkedQuestion("debt-avalanche", locale), body = checkedStep(locale, 1).body;
    expect(Number(marginalHigh) / 100).toBe(20); expect(Number(marginalLow) / 100).toBe(10);
    expect(marginalHigh - marginalLow).toBe(BigInt("1000"));
    expect(q.question).toMatch(/Po potrzebach i wymaganych minimalnych spłatach|After essentials and required minimums/);
    expect(q.question).toMatch(/1 000 zł ma 20%.*500 zł 10%|1,000 debt charges 20%.*500 debt 10%/);
    expect(q.question).toMatch(/stopy stałe, brak opłat, kar i zaległości|fixed rates, no fees, penalties or arrears/);
    expect(checkedAnswer("debt-avalanche", locale, "C").text).toContain("20%");
    expect(body).toMatch(/Najpierw zabezpiecz podstawowe potrzeby.*minimalne spłaty wszystkich długów|First protect essentials and all debts' required minimum payments/);
    expect(body).toMatch(/Osobny prosty model|Separate simple model/);
    expect(body).toMatch(/początku roku|start of a year/); expect(body).toMatch(/każde saldo co najmniej 100 zł|each balance at least PLN 100/);
    expect(body).toMatch(/bez dalszych przepływów i kapitalizacji|no later cash flows or compounding/);
    expect(body).toMatch(/20 zł wobec 10 zł|PLN 20 versus PLN 10/); expect(body).toMatch(/nie pełny harmonogram ani gwarancja|not a full schedule or guarantee/);
    expect(q.explanation).toMatch(/rzeczywiste warunki nadpłaty.*umowie|actual prepayment terms depend on the contract/);
    expect(q.explanation).toMatch(/Brak nadwyżki nie wymaga nadpłaty|No extra payment is required without a surplus/);
    expect(assumptions("debt-avalanche")).toMatchObject({ currency: "PLN", optional_extra: 100, initial_comparable_balances: [1000, 500], annual_rates_percent: [20, 10], essentials_and_all_required_minimums_already_covered: true, minimum_payments_not_replaced: true, fixed_rates: true, fees_assumed: 0, prepayment_penalties_assumed: 0, arrears_assumed: false, capitalization: false, marginal_interest_difference_high: Number(marginalHigh) / 100, marginal_interest_difference_low: Number(marginalLow) / 100, extra_payment_at_period_start: true, each_comparable_balance_at_least: 100, other_cash_flows_in_marginal_model: 0, marginal_example_separate_from_real_minimum_payment_schedule: true, not_total_schedule_or_guaranteed_savings: true });
  });
  it.each(locales)("%s BIK is distinct from repayment capacity and educational points without weights or approval promises", locale => {
    const q = checkedQuestion("credit-score-factors", locale), body = checkedStep(locale, 2).body, correct = checkedAnswer("credit-score-factors", locale, "B").text;
    expect(q.question).toMatch(/BIK/); expect(q.question).toMatch(/w Polsce|in Poland/);
    expect(correct).toMatch(/Terminowość jest istotna|Timeliness matters/); expect(correct).toMatch(/dochody i wydatki|income and expenses/);
    for (const text of [body, q.explanation, correct]) {
      expect(text).not.toMatch(/35\s*%|FICO|BIGGEST|biggest|largest|największ/i);
      expect(text).not.toMatch(/(?:four|six|4|6)\s+(?:factors|czynnik)/i);
    }
    expect(body).toMatch(/Scoring BIK nie jest tym samym co zdolność kredytowa|BIK scoring is not the same as repayment capacity/);
    expect(body).toMatch(/podejmuje własną decyzję|makes its own decision/);
    expect(q.explanation).toMatch(/Wynik BIK nie gwarantuje kredytu|BIK score does not guarantee a loan/);
    expect(q.explanation).toMatch(/punkty Coachfi nie są oceną BIK|Coachfi points are not a BIK score/);
    expect(body).toMatch(/nieregularne wpływy mogą nie wystarczać.*500 zł|irregular income may not cover a new PLN 500 installment/);
    expect(q.explanation).toMatch(/Nie trzeba brać nowego długu ani kupować raportu|No new debt or paid report is needed/);
    expect(assumptions("credit-score-factors")).toMatchObject({ currency: "PLN", illustrative_new_installment: 500, income_irregular: true, no_numerical_score_or_factor_weights: true, timely_payment_is_relevant_not_sufficient_for_approval: true, creditworthiness_includes_income_and_expenses: true, coachfi_points_are_not_BIK_or_lender_score: true, no_new_debt_or_paid_report_required: true });
  });
  it.each(locales)("%s fixed-flow bond discounts1100 PLN to1000 or916.67 while keeping coupon and principal distinct", locale => {
    const q = checkedQuestion("bond-prices", locale), body = checkedStep(locale, 3).body;
    expect(bondAtTen).toBe(BigInt("100000")); expect(bondAtTwentyRounded).toBe(BigInt("91667"));
    expect(bondAtTwentyNumerator % BigInt("120")).toBe(BigInt("80"));
    expect(bondAtTwentyRounded).toBeLessThan(bondAtTen);
    expect(q.question).toMatch(/Przed wykupem sprzedajesz|before maturity/); expect(q.question).toMatch(/stałych przepływach|fixed-cash-flow/);
    expect(q.question).toMatch(/Wymagana rentowność rynkowa rośnie|Its required market yield rises/);
    expect(q.question).toMatch(/inne czynniki bez zmian|other factors unchanged/);
    expect(checkedAnswer("bond-prices", locale, "B").text).toMatch(/^Spada$|^It falls$/);
    expect(body).toContain(locale === "pl" ? "916,67" : "916.67"); expect(body).toMatch(/1 100 ÷ 1,10 = 1 000 zł|1,100 ÷ 1.10 = PLN 1,000/);
    expect(body).toMatch(/tym samym roku do wykupu, nie prognoza|same one year to maturity; it is not a forecast/);
    expect(q.explanation).toMatch(/rynku wtórnym|secondary-market/); expect(q.explanation).toMatch(/kuponu ani umownego nominału|coupon or contractual principal/);
    expect(q.explanation).toMatch(/nie reguła dla każdej obligacji|not a rule for every bond/);
    expect(body).toMatch(/Emitent może nie zapłacić|issuer may fail to pay/); expect(body).toMatch(/sprzedaż może być trudna|selling may be difficult/);
    expect(body).toMatch(/nie musisz kupować obligacji|no bond purchase is required/);
    expect(assumptions("bond-prices")).toMatchObject({ currency: "PLN", face_value: 1000, fixed_final_coupon: 100, fixed_cash_flow_at_maturity: 1100, years_to_maturity: 1, earlier_cash_flows: 0, required_market_yield_before_percent: 10, required_market_yield_after_percent: 20, initial_model_price: Number(bondAtTen) / 100, later_model_price_rounded: Number(bondAtTwentyRounded) / 100, time_to_maturity_unchanged: true, same_fixed_contractual_cash_flows: true, credit_and_liquidity_factors_held_constant: true, default_assumed_absent_in_calculation: true, default_risk_still_exists: true, fees_assumed: 0, taxes_assumed: 0, hypothetical_not_product_or_forecast: true, secondary_market_sale_not_face_value_change: true });
  });
  it.each(locales)("%s four actual lesson steps deliver reviewed meaning, optional exercises and a calm irregular-income return", locale => {
    const steps = checkedLesson(locale).steps;
    expect(steps).toHaveLength(4);
    for (const [index, row] of expected.entries()) {
      const step = checkedStep(locale, index);
      expect(step).toEqual(checkedMetadataStepCopy(row[0], locale));
      expect(step.body).toMatch(/Ćwiczenie:|Try:/); expect(step.body).toMatch(/Działanie: opcjonalnie|Action: optionally/);
      expect(step.body).toMatch(/Po przerwie|After a break/); expect(step.body).toMatch(/nieregularn|irregular/);
      expect(step.body).not.toMatch(/USD|FICO|FDIC|SIPC|buy now|kup teraz/i);
    }
    expect(stageLessons["credit-rates"].quizHref).toBe("/quiz?topic=credit");
  });
});
