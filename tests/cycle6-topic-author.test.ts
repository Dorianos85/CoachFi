import { describe, expect, it } from "vitest";
import { getTopicQuestions, isKnownQuizTopic } from "@/lib/quiz-topic";
import { getQuizQuestions } from "@/lib/localizedQuiz";
import { getQuestionById } from "@/lib/allQuestions";
import { quizQuestions } from "@/data/quizQuestions";

describe("B06 first module topic integration (author)", () => {
  it.each(["pl", "en"] as const)("%s mindset preserves three stable IDs, keys and rewards with complete localized content", locale => {
    const questions = getTopicQuestions(locale, "mindset");
    expect(questions.map(q => q.id)).toEqual(["net-worth", "lifestyle-inflation", "pay-yourself-first"]);
    expect(questions.map(q => q.correctAnswer)).toEqual(["B", "C", "B"]);
    expect(questions.map(q => q.reward)).toEqual([25, 25, 20]);
    for (const question of questions) {
      const canonical = getQuestionById(question.id, locale)!;
      expect(question.question).toBe(canonical.question); expect(question.answers).toEqual(canonical.answers);
      expect(question.retryMessage).toBe(canonical.explanation); expect(question.category).toBe(canonical.category);
      expect(question.answers.map(a => a.id)).toEqual(["A", "B", "C", "D"]);
      expect(question.successMessage.trim().length).toBeGreaterThan(0);
      if (locale === "pl") expect(question.question).not.toBe(getQuestionById(question.id, "en")!.question);
      else expect(question.successMessage).toBe(quizQuestions.find(q => q.id === question.id)!.successMessage);
    }
  });
  it.each(["__proto__", "constructor", "toString", "hasOwnProperty", "MINDSET", "unknown", ""])("unrecognized query %j cannot become a topic or crash", topic => {
    expect(isKnownQuizTopic(topic)).toBe(false);
    expect(getTopicQuestions("pl", topic)).toBe(getQuizQuestions("pl"));
  });
  it("plain quiz keeps its four existing IDs and does not activate the whole bank", () => {
    expect(getTopicQuestions("pl").map(q => q.id)).toEqual(["inflation-basics", "emergency-fund", "saving-habit", "interest-rates"]);
    expect(getTopicQuestions("en")).toBe(getQuizQuestions("en"));
    expect(isKnownQuizTopic(undefined)).toBe(false);
  });
  it("saving keeps stable IDs with reviewed canonical content; retirement retains fallback", () => {
    expect(getTopicQuestions("pl", "saving").map(q => q.id)).toEqual(["saving-habit", "budget-50-30-20", "high-yield-savings", "dca"]);
    expect(getTopicQuestions("pl", "retirement").map(q => q.id)).toEqual(["retirement-purpose", "retirement-early-start"]);
    const other = getTopicQuestions("pl", "saving");
    expect(other[0].question).toBe(getQuestionById("saving-habit", "pl")!.question);
    expect(other[1].question).toBe(getQuestionById("budget-50-30-20", "pl")!.question);
  });
  it("other legacy locales retain the original mindset resolver", () => {
    const japanese = getTopicQuestions("ja", "mindset");
    expect(japanese.map(q => q.id)).toEqual(["net-worth", "lifestyle-inflation", "pay-yourself-first"]);
    expect(japanese[0]).toBe(quizQuestions.find(q => q.id === "net-worth"));
  });
});
