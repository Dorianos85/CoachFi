import { describe, expect, it } from "vitest";
import { getTopicQuestions, isKnownQuizTopic } from "@/lib/quiz-topic";
import { getQuestionById } from "@/lib/allQuestions";
import { getQuizQuestions } from "@/lib/localizedQuiz";
import { quizQuestions } from "@/data/quizQuestions";

const IDs = ["interest-rates", "debt-avalanche", "credit-score-factors", "bond-prices"];
describe("C16 canonical credit topic integration author", () => {
  it.each(["pl", "en"] as const)("%s delivers four canonical IDs, keys, rewards and full localized feedback", locale => {
    const shown = getTopicQuestions(locale, "credit");
    expect(shown.map(q => q.id)).toEqual(IDs);
    expect(shown.map(q => q.correctAnswer)).toEqual(["C", "C", "B", "B"]);
    expect(shown.map(q => q.reward)).toEqual([25, 30, 25, 30]);
    expect(shown.reduce((total, q) => total + q.reward, 0)).toBe(110);
    for (const q of shown) {
      const canonical = getQuestionById(q.id, locale);
      expect(canonical).toBeDefined();
      expect(q.question).toBe(canonical!.question);
      expect(q.answers).toEqual(canonical!.answers);
      expect(q.retryMessage).toBe(canonical!.explanation);
      expect(q.category).toBe(canonical!.category);
      expect(q.answers.map(a => a.id)).toEqual(["A", "B", "C", "D"]);
      expect(q.successMessage.trim().length).toBeGreaterThan(0);
      if (locale === "pl") expect(q.question).not.toBe(getQuestionById(q.id, "en")!.question);
      else expect(q.successMessage).toBe(quizQuestions.find(row => row.id === q.id)!.successMessage);
    }
  });
  it("retains plain-pool counts and rejects unknown and prototype topics", () => {
    expect(getTopicQuestions("pl").map(q => q.id)).toEqual(["inflation-basics", "emergency-fund", "saving-habit", "interest-rates"]);
    expect(getTopicQuestions("en")).toHaveLength(4);
    for (const topic of ["__proto__", "constructor", "toString", "unknown"]) {
      expect(isKnownQuizTopic(topic)).toBe(false);
      expect(getTopicQuestions("pl", topic)).toBe(getQuizQuestions("pl"));
    }
  });
  it("preserves reviewed inflation and unreviewed locale/topic pool behavior", () => {
    expect(getTopicQuestions("pl", "inflation").map(q => q.id)).toEqual(["inflation-basics", "real-return", "rule-of-72", "inflation-hedge"]);
    expect(getTopicQuestions("pl", "retirement").map(q => q.id)).toEqual(["retirement-purpose", "retirement-early-start"]);
    expect(getTopicQuestions("ja", "credit")[1]).toBe(quizQuestions.find(q => q.id === "debt-avalanche"));
  });
});
