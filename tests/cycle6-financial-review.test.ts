import { describe, expect, it } from "vitest";
import metadata from "@/docs/coachfi/cycle-6/content-metadata.json";
import { getQuestionById } from "@/lib/allQuestions";

// Independent numeric oracle over published educational inputs, not the
// author's calculation helpers. Exact integer minor units avoid float rounding.
const minor = (value: number) => {
  const result = Math.round(value * 100);
  if (!Number.isFinite(value) || !Number.isSafeInteger(result) || Math.abs(result / 100 - value) > 1e-10) {
    throw new Error("Invalid review amount");
  }
  return result;
};
const expected = [
  { id: "net-worth", answer: "B", reward: 25 },
  { id: "lifestyle-inflation", answer: "C", reward: 25 },
  { id: "pay-yourself-first", answer: "B", reward: 20 },
] as const;

describe("C6 independent financial content integrity (PL/EN, Poland)", () => {
  it("published net-worth example is assets minus complete same-date liabilities in PLN", () => {
    const example = metadata.questions.find(item => item.id === "net-worth")!.calculation_assumptions;
    if (!("currency" in example && "same_valuation_date" in example && "assumed_complete_liabilities" in example &&
      "assets" in example && typeof example.assets === "number" &&
      "liabilities" in example && typeof example.liabilities === "number" &&
      "expected_net_worth" in example && typeof example.expected_net_worth === "number")) {
      throw new Error("Missing numeric net-worth review inputs");
    }
    expect(example.currency).toBe("PLN");
    expect(example.same_valuation_date).toBe(true);
    expect(example.assumed_complete_liabilities).toBe(true);
    const calculated = minor(example.assets) - minor(example.liabilities);
    expect(calculated).toBe(300000);
    expect(minor(example.expected_net_worth)).toBe(calculated);
  });

  it.each(metadata.review_scenarios_not_additional_quiz_items)("independently bounds affordable transfer in $id", (scenario) => {
    expect(scenario.currency).toBe("PLN");
    const signedRemaining = minor(scenario.income_available) - minor(scenario.essentials_reserved) - minor(scenario.minimum_payments_reserved);
    const affordableMaximum = Math.max(0, signedRemaining);
    expect(minor(scenario.available_surplus)).toBe(affordableMaximum);
    expect(minor(scenario.chosen_transfer)).toBeGreaterThanOrEqual(0);
    expect(minor(scenario.chosen_transfer)).toBeLessThanOrEqual(affordableMaximum);
    if (signedRemaining <= 0) expect(scenario.chosen_transfer).toBe(0);
    // Zero affordable savings does not erase an essential-expense shortfall.
    if (scenario.id === "essentials_shortfall_no_transfer") expect(signedRemaining).toBe(-5000);
    if (scenario.id === "positive_surplus_optional_part") {
      expect(signedRemaining).toBe(20000);
      expect(minor(scenario.chosen_transfer)).toBe(5000);
    }
  });

  for (const locale of ["pl", "en"] as const) {
    it.each(expected)(`${locale}: preserves independently reviewed key/reward and all distractor rationales for $id`, (reviewed) => {
      const question = getQuestionById(reviewed.id, locale)!;
      const record = metadata.questions.find(item => item.id === reviewed.id)!;
      expect(question.correctAnswer).toBe(reviewed.answer);
      expect(question.reward).toBe(reviewed.reward);
      expect(question.answers.map(item => item.id)).toEqual(["A", "B", "C", "D"]);
      expect(question.answers.filter(item => item.id === question.correctAnswer)).toHaveLength(1);
      expect(record.country).toBe("PL");
      expect(record.correct_answer).toBe(reviewed.answer);
      const wrongIds = question.answers.filter(item => item.id !== question.correctAnswer).map(item => item.id);
      expect(Object.keys(record.wrong_option_explanations).sort()).toEqual(wrongIds.sort());
      for (const rationale of Object.values(record.wrong_option_explanations)) {
        if (!rationale) throw new Error("Missing distractor rationale");
        expect(rationale[locale].trim().length).toBeGreaterThan(10);
      }
    });
  }
});
