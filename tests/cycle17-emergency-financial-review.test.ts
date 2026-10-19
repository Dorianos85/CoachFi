import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stageLessons } from "@/data/stageLessons";
import { quizQuestions } from "@/data/quizQuestions";
import { getAllQuestions, getQuestionById } from "@/lib/allQuestions";
import { STAGE_QUESTION_IDS } from "@/lib/learningProgress";
import metadata from "../docs/coachfi/cycle-17/content-metadata.json";

const locales = ["pl", "en"] as const;
type Locale = typeof locales[number];
const expected = [["emergency-fund", "C", 25], ["emergency-fund-characteristics", "C", 25], ["emergency-fund-start", "B", 20]] as const;
beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw new Error("C17 finance acceptance forbids network"); })));
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });

function checkedQuestion(id: string, locale: Locale) {
  const q = getQuestionById(id, locale);
  if (!q) throw new Error("Expected actual canonical emergency question: " + id + "/" + locale);
  return q;
}
function checkedAnswer(id: string, locale: Locale, option: string) {
  const answer = checkedQuestion(id, locale).answers.find(row => row.id === option);
  if (!answer) throw new Error("Expected emergency answer: " + id + "/" + option);
  return answer;
}
function checkedEnglish(id: string) {
  const q = quizQuestions.find(row => row.id === id);
  if (!q) throw new Error("Expected English emergency question: " + id);
  return q;
}
function checkedMetadataQuestion(id: string) {
  const q = metadata.questions.find(row => row.id === id);
  if (!q) throw new Error("Expected reviewed emergency metadata: " + id);
  return q;
}
function checkedMetadataCopy(id: string, locale: Locale) {
  const copy = checkedMetadataQuestion(id).copy[locale];
  if (!copy) throw new Error("Expected reviewed question language: " + id + "/" + locale);
  return copy;
}
function checkedMetadataStep(id: string) {
  const step = metadata.steps.find(row => row.question_id === id);
  if (!step) throw new Error("Expected reviewed emergency metadata step: " + id);
  return step;
}
function checkedMetadataStepCopy(id: string, locale: Locale) {
  const copy = checkedMetadataStep(id).copy[locale];
  if (!copy) throw new Error("Expected reviewed step language: " + id + "/" + locale);
  return copy;
}
function checkedLesson(locale: Locale) {
  const lesson = stageLessons["emergency-fund"];
  if (!lesson) throw new Error("Expected emergency lesson");
  const copy = lesson.copy[locale];
  if (!copy) throw new Error("Expected emergency lesson locale: " + locale);
  return copy;
}
function checkedStep(locale: Locale, index: number) {
  const step = checkedLesson(locale).steps[index];
  if (!step) throw new Error("Expected actual emergency step: " + locale + "/" + index);
  return step;
}
function checkedRationale(id: string, option: string, locale: Locale) {
  const reasons = checkedMetadataQuestion(id).wrong_option_explanations as Record<string, { pl: string; en: string } | undefined>;
  const row = reasons[option];
  if (!row) throw new Error("Expected wrong-option rationale: " + id + "/" + option);
  const reason = row[locale];
  if (!reason) throw new Error("Expected rationale language: " + locale);
  return reason;
}
function assumptions(id: string) { return checkedMetadataQuestion(id).calculation_assumptions as Record<string, unknown>; }
function wholePLNGrosze(text: string) {
  const normalized = text.replace(/^PLN /, "").replace(/ zł$/, "").replace(/[ ,]/g, "");
  if (!/^\d+$/.test(normalized)) throw new Error("Expected a whole PLN amount: " + text);
  return BigInt(normalized) * BigInt("100");
}

// Independent hypothetical operands in whole grosze, not read from the content metadata.
const monthlyCosts = BigInt("200000");
const chosenGoal = BigInt("3") * monthlyCosts;
const alternativeGoal = BigInt("6") * monthlyCosts;
const afterAccess = BigInt("20000") - BigInt("15000") - BigInt("2000");
const available = BigInt("100000") - BigInt("90000") - BigInt("8000");
const optionalTransfer = BigInt("1000"), smallGoal = BigInt("5000");
const zeroSurplus = BigInt("98000") - BigInt("90000") - BigInt("8000");
const negativeSurplus = BigInt("97000") - BigInt("90000") - BigInt("8000");

const distractors = [
  { id: "emergency-fund", option: "A", answer: [/^2 000 zł$/, /^PLN 2,000$/], reason: [/jednemu miesiącowi/, /one month/] },
  { id: "emergency-fund", option: "B", answer: [/^4 000 zł$/, /^PLN 4,000$/], reason: [/dwóm miesiącom/, /two months/] },
  { id: "emergency-fund", option: "D", answer: [/^12 000 zł$/, /^PLN 12,000$/], reason: [/sześć miesięcy.*nie wybrane trzy/, /six months.*not the three months chosen/] },
  { id: "emergency-fund-characteristics", option: "A", answer: [/Sprawdzenie czasu dostępu/, /Check access timing/], reason: [/nie gwarantuje natychmiastowej wypłaty/, /does not guarantee instant withdrawal/] },
  { id: "emergency-fund-characteristics", option: "B", answer: [/Sprawdzenie opłat i zakresu ochrony/, /Check fees and protection scope/], reason: [/ochrona zależy od podmiotu i produktu/, /protection depends on the institution and product/] },
  { id: "emergency-fund-characteristics", option: "D", answer: [/Odróżnienie rezerwy od planowanych wydatków/, /Distinguish reserves from planned spending/], reason: [/nie wymaga nowego produktu lub konta/, /no new product or account is required/] },
  { id: "emergency-fund-start", option: "A", answer: [/Przelać 100 zł.*20 zł/, /Transfer PLN 100.*PLN 20/], reason: [/przekracza.*20 zł.*narusza środki/, /exceeds.*PLN 20 surplus.*reserved/] },
  { id: "emergency-fund-start", option: "C", answer: [/Pożyczyć na oszczędzanie/, /Borrow to save/], reason: [/Nowy dług.*dodaje zobowiązanie/, /Borrowing to save adds a liability/] },
  { id: "emergency-fund-start", option: "D", answer: [/miesiąc kosztów za obowiązkowy próg/, /one month of costs as a required first threshold/], reason: [/nie jest obowiązkowym pierwszym progiem/, /not a required first threshold/] },
] as const;

describe("C17 actual canonical questions and independent wrong-option meaning", () => {
  it.each(expected.flatMap(row => locales.map(locale => [row[0], row[1], row[2], locale] as const)))("%s/%s/%s/%s delivers the reviewed ID/key/reward/ABCD and canonical language", (id, key, reward, locale) => {
    const q = checkedQuestion(id, locale), copy = checkedMetadataCopy(id, locale);
    expect(q.id).toBe(id); expect(q.correctAnswer).toBe(key); expect(q.reward).toBe(reward);
    expect(q.answers.map(answer => answer.id)).toEqual(["A", "B", "C", "D"]);
    expect(q.answers.filter(answer => answer.id === key)).toHaveLength(1);
    expect(q.question).toBe(copy.question); expect(q.answers).toEqual(copy.answers); expect(q.explanation).toBe(copy.retryMessage); expect(q.category).toBe(copy.category);
    expect(checkedMetadataQuestion(id).correct_answer).toBe(key); expect(checkedMetadataQuestion(id).reward).toBe(reward);
    expect(quizQuestions.filter(row => row.id === id)).toHaveLength(1);
    if (locale === "en") expect(checkedEnglish(id).successMessage).toBe(copy.successMessage);
  });
  it.each(distractors)("$id/$option has the independently reviewed wrong-answer reason in both languages", row => {
    const q = checkedMetadataQuestion(row.id);
    expect(row.option).not.toBe(q.correct_answer);
    expect(Object.keys(q.wrong_option_explanations).sort()).toEqual(["A", "B", "C", "D"].filter(option => option !== q.correct_answer));
    for (const [index, locale] of locales.entries()) {
      const answerOracle = row.answer[index], reasonOracle = row.reason[index];
      if (!answerOracle || !reasonOracle) throw new Error("Expected bilingual distractor oracle");
      expect(checkedAnswer(row.id, locale, row.option).text).toMatch(answerOracle);
      expect(checkedRationale(row.id, row.option, locale)).toMatch(reasonOracle);
    }
  });
  it("three existing IDs retain70 points,82 canonical IDs and Poland-only source assumptions", () => {
    expect(STAGE_QUESTION_IDS["emergency-fund"]).toEqual(expected.map(row => row[0]));
    expect(metadata.questions.map(row => row.id)).toEqual(expected.map(row => row[0]));
    expect(metadata.steps.map(row => row.question_id)).toEqual(expected.map(row => row[0]));
    expect(metadata.distinct_existing_questions).toBe(3); expect(metadata.language_versions).toBe(6); expect(metadata.new_question_ids).toBe(0);
    expect(expected.reduce((total, row) => total + row[2], 0)).toBe(70); expect(metadata.reward_total).toBe(70);
    expect(metadata.canonical_union_count_unchanged).toBe(82); expect(metadata.market_country).toBe("PL"); expect(metadata.languages).toEqual(["pl", "en"]);
    expect(quizQuestions).toHaveLength(62);
    for (const locale of locales) { const ids = getAllQuestions(locale).map(q => q.id); expect(ids).toHaveLength(82); expect(new Set(ids).size).toBe(82); }
    const sourceIds = new Set(metadata.sources.map(source => source.id));
    for (const row of [...metadata.questions, ...metadata.steps]) {
      expect(row.country).toBe("PL"); expect(row.version).toBe(metadata.version); expect(row.created_date).toBe("2026-10-15");
      expect(row.source_ids.length).toBeGreaterThan(0);
      for (const id of row.source_ids) expect(sourceIds.has(id)).toBe(true);
    }
    expect(checkedMetadataQuestion("emergency-fund").source_ids).toContain("cfpb-emergency");
    expect(checkedMetadataQuestion("emergency-fund-characteristics").source_ids).toContain("knf-risk");
    expect(checkedMetadataQuestion("emergency-fund-characteristics").source_ids).toContain("bfg-scope");
    expect(checkedMetadataQuestion("emergency-fund-start").source_ids).toContain("cfpb-emergency");
    for (const source of metadata.sources) { expect(source.url).toMatch(/^https:\/\//); expect(source.checked_date).toBe("2026-10-15"); expect(source.limits.length).toBeGreaterThan(20); }
  });
});

describe("C17 independent emergency arithmetic and qualified PL/EN guidance", () => {
  it.each(locales)("%s chosen3times2000 is6000 while6months is12000 without mandatory coverage or timeline", locale => {
    const q = checkedQuestion("emergency-fund", locale), body = checkedStep(locale, 0).body;
    expect(chosenGoal).toBe(BigInt("600000")); expect(alternativeGoal).toBe(BigInt("1200000"));
    expect(wholePLNGrosze(checkedAnswer("emergency-fund", locale, "C").text)).toBe(chosenGoal);
    expect(q.answers.map(answer => wholePLNGrosze(answer.text))).toEqual([monthlyCosts, BigInt("2") * monthlyCosts, chosenGoal, alternativeGoal]);
    expect(q.answers.filter(answer => wholePLNGrosze(answer.text) === chosenGoal)).toHaveLength(1);
    expect(q.question).toMatch(/wybierasz 3 miesiące|you choose 3 months/); expect(q.question).toMatch(/stałych kosztach|constant costs/);
    expect(q.question).toMatch(/minimum długu, liczone raz|debt minimums included once/);
    expect(body).toMatch(/Kwota zależy od potrzeb, zobowiązań i niepewności dochodów|amount depends on needs, commitments and income uncertainty/);
    expect(body).toMatch(/Zakres 3–6 miesięcy można wybrać orientacyjnie|3–6 month range can be an indicative choice/);
    expect(body).toMatch(/nie jest obowiązkiem ani gwarancją|not a duty or guarantee/);
    expect(body).toMatch(/nie termin zebrania kwoty|does not give a completion date/);
    expect(body).toMatch(/bez odsetek i opłat|no interest or fees/); expect(body).toMatch(/12 000 zł|PLN 12,000/);
    expect(q.explanation).toMatch(/minimum długu już uwzględnionym raz|debt minimums already included once/);
    expect(assumptions("emergency-fund")).toMatchObject({ currency: "PLN", illustrative_monthly_essential_costs: Number(monthlyCosts) / 100, required_minimum_repayments_already_included: true, minimum_repayments_counted_once: true, chosen_months: 3, chosen_goal: Number(chosenGoal) / 100, alternative_six_month_goal: Number(alternativeGoal) / 100, monthly_costs_constant: true, interest_assumed: 0, fees_assumed: 0, not_actual_household_data: true, not_a_required_minimum_or_safety_guarantee: true, goal_arithmetic_not_savings_timeline: true });
  });
  it.each(locales)("%s access cost leaves30 PLN and limited volatility does not promise loss-free instant access", locale => {
    const q = checkedQuestion("emergency-fund-characteristics", locale), body = checkedStep(locale, 1).body;
    expect(afterAccess).toBe(BigInt("3000")); expect(Number(afterAccess) / 100).toBe(30);
    expect(body).toContain("200 − 150 − 20 = 30"); expect(body).toMatch(/hipotetyczną opłatę dostępu 20 zł|hypothetical PLN 20 access fee/);
    expect(body).toMatch(/jeśli środki są dostępne na czas|if funds are available in time/);
    expect(q.question).toMatch(/Która decyzja przeczy|Which decision conflicts/);
    expect(checkedAnswer("emergency-fund-characteristics", locale, "C").text).toMatch(/Cała rezerwa w zmiennych akcjach|entire reserve in volatile shares/);
    expect(body).toMatch(/czas wypłaty, opłaty i warunki|withdrawal timing, fees and terms/);
    expect(body).toMatch(/nie oznacza braku strat, kosztów lub opóźnień|does not mean no losses, costs or delays/);
    expect(q.explanation).toMatch(/Ochrona depozytu zależy od podmiotu i produktu|Deposit protection depends on the institution and product/);
    expect(q.explanation).toMatch(/nie każda inwestycja jest objęta ochroną|does not cover every investment/);
    expect(body).toMatch(/bez zakupu lub otwierania konta|without buying or opening an account/);
    expect(assumptions("emergency-fund-characteristics")).toMatchObject({ currency: "PLN", illustrative_reserve: 200, unexpected_cost: 150, hypothetical_access_fee: 20, remainder: Number(afterAccess) / 100, cost_available_in_time_assumed_for_arithmetic: true, no_market_return_assumed: true, no_product_recommended: true, low_risk_not_zero_loss_or_zero_cost_or_instant_access: true, deposit_coverage_requires_checking_institution_and_product: true, no_coverage_amount_or_legal_advice: true });
  });
  it.each(locales)("%s20 PLN surplus permits optional10 with10 left and does not require a one-month first milestone", locale => {
    const q = checkedQuestion("emergency-fund-start", locale), body = checkedStep(locale, 2).body;
    expect(available).toBe(BigInt("2000")); expect(available - optionalTransfer).toBe(BigInt("1000")); expect(optionalTransfer).toBeLessThanOrEqual(available);
    expect(smallGoal).toBe(BigInt("5000"));
    expect(q.question).toMatch(/potrzeby 900 zł, wymagane minima 80 zł|PLN 900 essentials, PLN 80 required minimums/);
    expect(q.question).toMatch(/brak innych kosztów i opłat|no other costs or fees/);
    expect(checkedAnswer("emergency-fund-start", locale, "B").text).toMatch(/Dobrowolnie odłożyć 10 zł, pozostawiając 10 zł|Optionally save PLN 10, leaving PLN 10/);
    expect(body).toMatch(/Nie trzeba zaczynać od miesiąca wydatków|One month of expenses is not a required first milestone/);
    expect(body).toMatch(/przykładowy cel 50 zł|illustrative PLN 50 goal/);
    expect(q.explanation).toMatch(/nie ma obowiązku przelewu|no transfer is required/);
    expect(body).toMatch(/nie pożyczaj, żeby oszczędzać|do not borrow to save/);
    expect(assumptions("emergency-fund-start")).toMatchObject({ currency: "PLN", illustrative_income: 1000, essential_costs_excluding_debt_minimums: 900, required_minimum_repayments: 80, other_required_costs: 0, available_surplus: Number(available) / 100, optional_chosen_transfer: Number(optionalTransfer) / 100, uncommitted_surplus_left: Number(available - optionalTransfer) / 100, illustrative_small_goal: Number(smallGoal) / 100, one_month_not_required_first_goal: true, fees_assumed: 0, borrowing_to_save: 0, transfer_required: false, no_surplus_transfer: 0, irregular_income_requires_fresh_check: true, no_completion_date_or_months_of_coverage_promised: true });
  });
  it("zero and negative surplus have zero optional transfer; arithmetic does not invent an obligation or date", () => {
    expect(zeroSurplus).toBe(BigInt("0")); expect(negativeSurplus).toBe(BigInt("-1000"));
    const scenarios = metadata.review_scenarios_not_additional_quiz_items;
    expect(scenarios.map(row => [row.income, row.raw_surplus, row.chosen_transfer])).toEqual([[1000, Number(available) / 100, Number(optionalTransfer) / 100], [980, Number(zeroSurplus) / 100, 0], [970, Number(negativeSurplus) / 100, 0]]);
    for (const row of scenarios) { expect(row.chosen_transfer).toBeGreaterThanOrEqual(0); expect(row.chosen_transfer).toBeLessThanOrEqual(Math.max(0, row.raw_surplus)); }
    for (const locale of locales) {
      const q = checkedQuestion("emergency-fund-start", locale), body = checkedStep(locale, 2).body;
      expect(q.explanation).toMatch(/Przy 980 zł wpływu nadwyżka to 0 zł|At PLN 980 income, surplus is PLN 0/);
      expect(body).toMatch(/przelew 0 zł|transfer PLN 0/);
      expect(checkedMetadataStep("emergency-fund-start").irregular_income[locale]).toMatch(/zerowej lub ujemnej nadwyżce wybierz 0 zł|zero or negative surplus choose PLN 0/);
    }
  });
  it.each(locales)("%s three actual lessons deliver optional low-pressure Polish-market content without a most-shocks claim", locale => {
    const steps = checkedLesson(locale).steps;
    expect(steps).toHaveLength(3);
    for (const [index, row] of expected.entries()) {
      const step = checkedStep(locale, index);
      expect(step).toEqual(checkedMetadataStepCopy(row[0], locale));
      expect(step.body).toMatch(/Ćwiczenie:|Try:/); expect(step.body).toMatch(/Działanie: opcjonalnie|Action: optionally/);
      expect(step.body).toMatch(/nieregularnym dochodzie|irregular income/); expect(step.body).toMatch(/Po przerwie|After a break|lub przerwie|After using the reserve or taking a break/);
      expect(step.body).not.toMatch(/covers most|most common emergencies|pokrywa większość|USD|\$|FICO|FDIC|SIPC/);
    }
    expect(stageLessons["emergency-fund"].quizHref).toBe("/quiz?topic=emergency");
    for (const id of expected.map(row => row[0])) expect(checkedQuestion(id, locale).explanation).not.toMatch(/covers most|most common emergencies|pokrywa większość|USD|\$/);
  });
});
