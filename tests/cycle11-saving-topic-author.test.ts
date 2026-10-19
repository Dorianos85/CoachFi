import { describe, expect, it } from "vitest";
import { getTopicQuestions, isKnownQuizTopic } from "@/lib/quiz-topic";
import { getQuestionById } from "@/lib/allQuestions";
import { quizQuestions } from "@/data/quizQuestions";
import { getQuizQuestions } from "@/lib/localizedQuiz";

describe("B06 saving topic integration author", () => {
  it.each(["pl", "en"] as const)("%s resolves all four canonical IDs and complete feedback", locale => {
    const questions = getTopicQuestions(locale, "saving");
    expect(questions.map(q => q.id)).toEqual(["saving-habit", "budget-50-30-20", "high-yield-savings", "dca"]);
    expect(questions.map(q => q.correctAnswer)).toEqual(["C", "B", "B", "C"]);
    expect(questions.map(q => q.reward)).toEqual([25, 25, 20, 30]);
    for (const question of questions) {
      const canonical = getQuestionById(question.id, locale)!;
      expect(question.question).toBe(canonical.question);
      expect(question.answers).toEqual(canonical.answers);
      expect(question.retryMessage).toBe(canonical.explanation);
      expect(question.category).toBe(canonical.category);
      expect(question.answers.map(a => a.id)).toEqual(["A", "B", "C", "D"]);
      expect(question.successMessage.trim().length).toBeGreaterThan(0);
      if (locale === "pl") expect(question.question).not.toBe(getQuestionById(question.id, "en")!.question);
      else expect(question.successMessage).toBe(quizQuestions.find(q => q.id === question.id)!.successMessage);
    }
  });
  it("preserves ordinary quiz IDs and closed prototype queries", () => {
    expect(getTopicQuestions("pl").map(q => q.id)).toEqual(["inflation-basics", "emergency-fund", "saving-habit", "interest-rates"]);
    for (const topic of ["__proto__", "constructor", "toString", "unknown"]) {
      expect(isKnownQuizTopic(topic)).toBe(false);
      expect(getTopicQuestions("pl", topic)).toBe(getQuizQuestions("pl"));
    }
  });
  it("retains other topic and legacy-language resolver behavior", () => {
    expect(getTopicQuestions("pl", "retirement").map(q => q.id)).toEqual(["retirement-purpose", "retirement-early-start"]);
    expect(getTopicQuestions("ja", "saving")[1]).toBe(quizQuestions.find(q => q.id === "budget-50-30-20"));
  });
});
