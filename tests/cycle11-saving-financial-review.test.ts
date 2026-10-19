import { describe, expect, it } from "vitest";
import { stageLessons } from "@/data/stageLessons";
import { quizQuestions } from "@/data/quizQuestions";
import { getQuestionById } from "@/lib/allQuestions";
import { getQuizQuestions } from "@/lib/localizedQuiz";
import { getTopicQuestions } from "@/lib/quiz-topic";
import metadata from "@/docs/coachfi/cycle-11/content-metadata.json";

const EXPECTED = [
  { id: "saving-habit", key: "C", reward: 25 },
  { id: "budget-50-30-20", key: "B", reward: 25 },
  { id: "high-yield-savings", key: "B", reward: 20 },
  { id: "dca", key: "C", reward: 30 },
] as const;

// Review oracles use integer grosze and integer rational fractions. They do not
// import or call the author's arithmetic helpers or the app's financial score.
const GROSZE = Object.freeze({ income: 250000, essentialReserve: 210000, minimumDebt: 30000,
  optionalTransfer: 5000, budgetIncome: 400000, firstContribution: 10000, secondContribution: 10000,
  firstUnitPrice: 1000, secondUnitPrice: 2000, finalUnitPrice: 800 });
const cents = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || !Number.isSafeInteger(value * 100)) throw new Error("Review example must use exact integral PLN inputs");
  return value * 100;
};
const assumptions = (id: string): Record<string, unknown> => {
  const record = metadata.questions.find(item => item.id === id);
  if (!record || typeof record.calculation_assumptions !== "object") throw new Error("Missing published review assumptions");
  return record.calculation_assumptions as unknown as Record<string, unknown>;
};

for (const locale of ["pl", "en"] as const) {
  describe(`C11 independent saving-habit financial/localization ${locale}`, () => {
    it("four canonical IDs, keys and rewards are unchanged across runtime question and topic selection", () => {
      const topic = getTopicQuestions(locale, "saving");
      expect(topic.map(item => item.id)).toEqual(EXPECTED.map(item => item.id));
      for (const item of EXPECTED) {
        const q = getQuestionById(item.id, locale)!;
        expect(q).toBeDefined(); expect(q.correctAnswer).toBe(item.key); expect(q.reward).toBe(item.reward);
        expect(q.answers.map(answer => answer.id)).toEqual(["A", "B", "C", "D"]);
        expect(q.answers.filter(answer => answer.id === q.correctAnswer)).toHaveLength(1);
        expect(new Set(q.answers.map(answer => answer.text)).size).toBe(4);
        const shown = topic.find(candidate => candidate.id === item.id)!;
        expect(shown.question).toBe(q.question); expect(shown.answers).toEqual(q.answers);
        expect(shown.correctAnswer).toBe(q.correctAnswer); expect(shown.reward).toBe(q.reward);
        expect(shown.retryMessage).toBe(q.explanation);
      }
      expect(topic.reduce((total, question) => total + question.reward, 0)).toBe(100);
    });

    it("all four lessons stay on Poland/PLN without adding a new item or US product promise", () => {
      const lesson = stageLessons["saving-habit"];
      expect(lesson.quizHref).toBe("/quiz?topic=saving"); expect(lesson.copy[locale]!.steps).toHaveLength(4);
      const text = lesson.copy[locale]!.steps.map(step => `${step.title} ${step.body}`).join(" ");
      expect(text).toMatch(locale === "pl" ? /PLN|zł/ : /PLN/); expect(text).not.toMatch(/FDIC|\$[0-9]|401\(k\)|ISA/);
      expect(text).not.toMatch(/strongest habit|simple and proven|najmocniejszy nawyk|naukowo zwalidowan/i);
    });

    it("reserve needs and minimum debt precede optional transfer, including irregular income and no-surplus case", () => {
      const body = stageLessons["saving-habit"].copy[locale]!.steps[0].body;
      expect(body).toMatch(locale === "pl" ? /potrzeb|niezbędn|podstawow/ : /essential/i);
      expect(body).toMatch(locale === "pl" ? /minimaln/ : /minimum/i);
      expect(body).toMatch(locale === "pl" ? /nieregularn/ : /irregular/i);
      expect(body).toMatch(locale === "pl" ? /opcjonaln|dobrowoln|możesz/ : /optional|may choose/i);
      expect(body).toMatch(locale === "pl" ? /brak.*nadwyż|bez nadwyż/i : /no surplus|without.*surplus/i);
      const surplus = GROSZE.income - GROSZE.essentialReserve - GROSZE.minimumDebt;
      expect(surplus).toBe(10000); expect(GROSZE.optionalTransfer).toBeLessThanOrEqual(surplus);
      expect(surplus - GROSZE.optionalTransfer).toBe(5000);
      // Match the actual lesson's educational amounts, allowing PL separators.
      const compact = body.replace(/[\s\u00a0\u202f,]/g, "");
      for (const amount of [2500, 2100, 300, 100, 50]) expect(compact).toContain(String(amount));
    });

    it("50/30/20 is an adaptable take-home guideline; minimum payments are counted once and extra payments distinguished", () => {
      const step = stageLessons["saving-habit"].copy[locale]!.steps[1], body = step.body;
      expect(`${step.title} ${body}`).toMatch(locale === "pl" ? /wskazów|punkt wyjścia|ramy|orientacyjn/ : /guide|starting point/i);
      expect(body).toMatch(locale === "pl" ? /netto|na rękę/ : /take.home|net income/i);
      expect(body).toMatch(locale === "pl" ? /dodatkow/ : /extra|additional/i);
      expect(body).toMatch(locale === "pl" ? /raz|podwójn/ : /once|double.count/i);
      const needs = GROSZE.budgetIncome * 1 / 2, wants = GROSZE.budgetIncome * 3 / 10, goals = GROSZE.budgetIncome * 1 / 5;
      expect([needs, wants, goals]).toEqual([200000, 120000, 80000]);
      expect(needs + wants + goals).toBe(GROSZE.budgetIncome);
      const compact = body.replace(/[\s\u00a0\u202f,]/g, "");
      for (const amount of [4000, 2000, 1200, 800]) expect(compact).toContain(String(amount));
    });

    it("bank-account comparison covers duration/fees/access/protection and inflation without guaranteed real gain", () => {
      const body = stageLessons["saving-habit"].copy[locale]!.steps[2].body;
      expect(body).toMatch(/BFG/);
      expect(body).toMatch(locale === "pl" ? /opłat|koszt/ : /fees|costs/i);
      expect(body).toMatch(locale === "pl" ? /okres|czas/ : /period|duration|how long/i);
      expect(body).toMatch(locale === "pl" ? /dostęp|wypłat/ : /access|withdrawal/i);
      expect(body).toMatch(locale === "pl" ? /inflac/ : /inflation/i);
      expect(body).toMatch(locale === "pl" ? /nie gwarant|nie zapewn/ : /does not guarantee|not guarantee/i);
      expect(body).not.toMatch(/4[–-]5.?×|4[–-]5 times|FDIC|100.?000.*PLN.*gwaranc/i);
    });

    it("deposit comparison asks for the most complete checklist rather than marking legitimate partial due diligence as wrong", () => {
      const question = getQuestionById("high-yield-savings", locale)!;
      expect(question.question).toMatch(locale === "pl" ? /najpełniejsz|najbardziej komplet/i : /most complete|most comprehensive/i);
      expect(question.correctAnswer).toBe("B"); expect(question.reward).toBe(20);
      const actualB = question.answers.find(answer => answer.id === "B")!.text;
      expect(actualB).toMatch(locale === "pl" ? /warunk/ : /conditions/i);
      expect(actualB).toMatch(locale === "pl" ? /opłat/ : /fees/i);
      expect(actualB).toMatch(locale === "pl" ? /dostęp/ : /access/i);
    });

    it("DCA investment retains loss risk; independent two-contribution example has15units and80PLN loss", () => {
      const body = stageLessons["saving-habit"].copy[locale]!.steps[3].body;
      expect(body).toMatch(locale === "pl" ? /inwest/ : /invest/i);
      expect(body).toMatch(locale === "pl" ? /nie gwarant|nie chroni/ : /does not guarantee|does not prevent|not guarantee/i);
      expect(body).toMatch(locale === "pl" ? /strat/ : /loss/i);
      const firstUnits = GROSZE.firstContribution / GROSZE.firstUnitPrice;
      const secondUnits = GROSZE.secondContribution / GROSZE.secondUnitPrice;
      expect([firstUnits, secondUnits]).toEqual([10, 5]);
      const invested = GROSZE.firstContribution + GROSZE.secondContribution;
      const terminalValue = (firstUnits + secondUnits) * GROSZE.finalUnitPrice;
      expect(terminalValue).toBe(12000); expect(invested).toBe(20000); expect(terminalValue - invested).toBe(-8000);
      // Exact return fraction (12000-20000)/20000 = -2/5, not a guaranteed gain.
      expect((terminalValue - invested) * 5).toBe(invested * -2);
      const compact = body.replace(/[\s\u00a0\u202f,]/g, "");
      for (const amount of [100, 10, 20, 8, 120, 200, 80]) expect(compact).toContain(String(amount));
    });

    it("ordinary localized saving question and its feedback agree with canonical actual content", () => {
      const ordinary = getQuizQuestions(locale).find(item => item.id === "saving-habit")!;
      const canonical = getQuestionById("saving-habit", locale)!;
      expect(ordinary.question).toBe(canonical.question); expect(ordinary.answers).toEqual(canonical.answers);
      expect(ordinary.correctAnswer).toBe("C"); expect(ordinary.reward).toBe(25);
      expect(ordinary.retryMessage).toBe(canonical.explanation);
      expect(`${ordinary.successMessage} ${ordinary.retryMessage}`).not.toMatch(/strongest|most effective habit|najskuteczniejszy|najsłabsz|spend what.?s left/i);
    });

    it("all12 distractor rationales cover exactly the actual wrong IDs and correct feedback is localized", () => {
      for (const expected of EXPECTED) {
        const actual = getQuestionById(expected.id, locale)!, record = metadata.questions.find(item => item.id === expected.id)!;
        expect(record.country).toBe("PL"); expect(record.correct_answer).toBe(expected.key); expect(record.reward).toBe(expected.reward);
        const wrong = actual.answers.filter(answer => answer.id !== expected.key).map(answer => answer.id).sort();
        expect(Object.keys(record.wrong_option_explanations).sort()).toEqual(wrong);
        for (const explanation of Object.values(record.wrong_option_explanations)) expect(explanation![locale].length).toBeGreaterThan(15);
        expect(record.correct_option_explanation[locale]).toBe(actual.explanation);
      }
      // Independently parse all four numeric budget alternatives from real UI data.
      const question = getQuestionById("budget-50-30-20", locale)!;
      const alternatives = question.answers.map(answer => cents(Number(answer.text.replace(/[^0-9]/g, ""))));
      expect(alternatives).toEqual([120000, 80000, 200000, 400000]);
      expect(alternatives[1] * 5).toBe(GROSZE.budgetIncome);
    });
  });
}

describe("C11 independent canonical source identity", () => {
  it("four IDs remain unique canonical records; corrected English feedback contains no old universal claims", () => {
    for (const item of EXPECTED) {
      const matches = quizQuestions.filter(candidate => candidate.id === item.id); expect(matches).toHaveLength(1);
      expect(matches[0].correctAnswer).toBe(item.key); expect(matches[0].reward).toBe(item.reward);
      expect(`${matches[0].successMessage} ${matches[0].retryMessage}`).not.toMatch(/strongest habit|simple and proven|4[–-]5.?×|removes emotion/i);
    }
  });

  it("published metadata surplus and optional chosen transfer reconcile to independent integer grosze", () => {
    const a = assumptions("saving-habit");
    const remaining = cents(a.income_available) - cents(a.essentials_reserved) - cents(a.minimum_payments_reserved);
    expect(remaining).toBe(10000); expect(cents(a.available_surplus)).toBe(remaining);
    expect(cents(a.chosen_transfer)).toBe(5000); expect(remaining - cents(a.chosen_transfer)).toBe(cents(a.remaining_unallocated));
    for (const sample of metadata.review_scenarios_not_additional_quiz_items) {
      const signed = cents(sample.income_available) - cents(sample.essentials_reserved) - cents(sample.minimum_payments_reserved);
      expect(cents(sample.available_surplus)).toBe(signed);
      expect(cents(sample.chosen_transfer)).toBeGreaterThanOrEqual(0);
      expect(cents(sample.chosen_transfer)).toBeLessThanOrEqual(Math.max(0, signed));
    }
  });

  it("published budget disjoint buckets total income; editorial debt convention is explicitly separate from CFPB", () => {
    const a = assumptions("budget-50-30-20");
    const income = cents(a.take_home_income);
    expect(income).toBe(400000); expect(cents(a.needs) * 2).toBe(income);
    expect(cents(a.wants) * 10).toBe(income * 3); expect(cents(a.savings_and_extra_repayments) * 5).toBe(income);
    expect(cents(a.needs) + cents(a.wants) + cents(a.savings_and_extra_repayments)).toBe(income);
    expect(a.required_minimum_debt_counted_once_in).toBe("needs"); expect(a.extra_debt_counted_in).toBe("savings_and_extra_repayments");
    expect(a.classification_is_our_illustration_not_literal_CFPB_definition).toBe(true); expect(a.percentages_are_not_requirements).toBe(true);
  });

  it("published DCA arithmetic independently yields15units,120PLN terminal value and80PLN loss with fee/tax assumptions explicit", () => {
    const a = assumptions("dca");
    const contribution = cents(a.cash_per_purchase), firstPrice = cents(a.unit_price_first), secondPrice = cents(a.unit_price_second);
    expect(contribution).toBe(10000); expect(contribution % firstPrice).toBe(0); expect(contribution % secondPrice).toBe(0);
    const units = contribution / firstPrice + contribution / secondPrice;
    expect(units).toBe(15); expect(a.total_units).toBe(units); expect(a.units_first).toBe(10); expect(a.units_second).toBe(5);
    const terminal = units * cents(a.final_unit_price), invested = contribution * 2;
    expect(terminal).toBe(12000); expect(cents(a.final_value)).toBe(terminal); expect(cents(a.total_contributions)).toBe(invested);
    expect(invested - terminal).toBe(8000); expect(cents(a.loss)).toBe(invested - terminal);
    expect(a.fees_assumed).toBe(0); expect(a.taxes_assumed).toBe(0); expect(a.loss_is_illustrative_not_forecast).toBe(true);
  });
});
