import { describe, expect, it } from "vitest";
import { getTopicQuestions, isKnownQuizTopic } from "@/lib/quiz-topic";
import { getQuestionById } from "@/lib/allQuestions";
import { getQuizQuestions } from "@/lib/localizedQuiz";
import { quizQuestions } from "@/data/quizQuestions";

const IDs = ["inflation-basics", "real-return", "rule-of-72", "inflation-hedge"];
describe("C15 canonical inflation topic integration author", () => {
  it.each(["pl", "en"] as const)("%s retains four canonical IDs, keys, rewards and complete feedback", locale => {
    const shown = getTopicQuestions(locale, "inflation");
    expect(shown.map(q => q.id)).toEqual(IDs);
    expect(shown.map(q => q.correctAnswer)).toEqual(["B", "D", "B", "C"]);
    expect(shown.map(q => q.reward)).toEqual([25, 30, 30, 25]);
    expect(shown.reduce((sum, q) => sum + q.reward, 0)).toBe(110);
    for (const q of shown) {
      const canonical = getQuestionById(q.id, locale)!;
      expect(q.question).toBe(canonical.question); expect(q.answers).toEqual(canonical.answers);
      expect(q.retryMessage).toBe(canonical.explanation); expect(q.category).toBe(canonical.category);
      expect(q.answers.map(a => a.id)).toEqual(["A", "B", "C", "D"]);
      expect(q.successMessage.trim().length).toBeGreaterThan(0);
      if (locale === "pl") expect(q.question).not.toBe(getQuestionById(q.id, "en")!.question);
      else expect(q.successMessage).toBe(quizQuestions.find(item => item.id === q.id)!.successMessage);
    }
  });
  it("does not grow the plain quiz or open unknown and prototype topics", () => {
    expect(getTopicQuestions("pl").map(q => q.id)).toEqual(["inflation-basics", "emergency-fund", "saving-habit", "interest-rates"]);
    for (const topic of ["__proto__", "constructor", "toString", "unknown"]) {
      expect(isKnownQuizTopic(topic)).toBe(false); expect(getTopicQuestions("pl", topic)).toBe(getQuizQuestions("pl"));
    }
  });
  it("preserves existing other-topic and unreviewed-language behavior", () => {
    expect(getTopicQuestions("pl", "retirement").map(q => q.id)).toEqual(["retirement-purpose", "retirement-early-start"]);
    expect(getTopicQuestions("ja", "inflation")[1]).toBe(quizQuestions.find(q => q.id === "real-return"));
  });
});
