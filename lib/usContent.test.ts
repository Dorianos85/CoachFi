import { describe, expect, it } from "vitest";

import { challengeQuestions } from "@/data/challengeQuestions";
import { quizQuestions } from "@/data/quizQuestions";
import { getStoryCards } from "@/data/storyCards";
import { stageLessons } from "@/data/stageLessons";
import { getAllQuestions, getQuestionById } from "@/lib/allQuestions";
import { translations } from "@/lib/i18n";
import { getLocalizedContent } from "@/lib/localizedContent";
import { getQuizQuestions } from "@/lib/localizedQuiz";

// Markers of Poland-specific content that must not reach the US audience (English and Spanish).
const POLISH_MARKERS =
  /\bPol(?:and|es|ish|onia|acos?|acas?|aco)\b|polac|PPK|\bIKZE?\b|\bBFG\b|\bNBP\b|złot|zlot|eslot|\bPLN\b|poduszka|\bOECD\b|\bOCDE\b|WIBOR|\bZUS\b|\bBIK\b|🇵🇱/i;

// Question ids are kept stable across locales (Polish overrides use them), so they are excluded from the check.
function text(value: unknown): string {
  if (value && typeof value === "object" && !Array.isArray(value) && "id" in value) {
    const { id: _id, ...rest } = value as Record<string, unknown>;
    return JSON.stringify(rest);
  }
  return JSON.stringify(value);
}

describe("US content for English and Spanish", () => {
  it.each(["en", "es"] as const)("has no Poland-specific review, quiz or challenge questions in %s", (locale) => {
    const offenders = getAllQuestions(locale).filter((q) => POLISH_MARKERS.test(text(q)));
    expect(offenders.map((q) => q.id)).toEqual([]);
    const quiz = getQuizQuestions(locale).filter((q) => POLISH_MARKERS.test(text(q)));
    expect(quiz.map((q) => q.id)).toEqual([]);
  });

  it("has no Poland-specific English source questions", () => {
    expect(quizQuestions.filter((q) => POLISH_MARKERS.test(text(q))).map((q) => q.id)).toEqual([]);
    expect(challengeQuestions.filter((q) => POLISH_MARKERS.test(text(q))).map((q) => q.id)).toEqual([]);
  });

  it.each(["en", "es"] as const)("shows US knowledge cards in %s", (locale) => {
    const cards = getStoryCards(locale);
    expect(cards.filter((card) => POLISH_MARKERS.test(text(card))).map((card) => card.id)).toEqual([]);
    expect(cards.map((card) => card.id)).not.toContain("solana-certs");
    expect(cards.map((card) => card.bigStat)).toEqual(expect.arrayContaining(["$250,000", "$24,500", "Weekly"]));
  });

  it.each(["en", "es"] as const)("uses US terms in the %s UI strings and read-aloud text", (locale) => {
    const t = translations[locale];
    expect(t.currencySymbol).toBe("$");
    expect(POLISH_MARKERS.test(text(t.home))).toBe(false);
    expect(POLISH_MARKERS.test(text(getLocalizedContent(locale).accessibility))).toBe(false);
    expect(POLISH_MARKERS.test(text(getLocalizedContent(locale).coach))).toBe(false);
    for (const lesson of Object.values(stageLessons)) {
      expect(POLISH_MARKERS.test(text(lesson.copy[locale]))).toBe(false);
    }
  });

  it("states the corrected late-start retirement figure consistently", () => {
    const question = quizQuestions.find((q) => q.id === "retirement-early-start")!;
    expect(question.successMessage).toContain("about $1,000 a month");
    expect(question.retryMessage).toContain("about $1,000 a month");
    expect(question.successMessage).not.toContain("$800");
    expect(question.question).toMatch(/hypothetical 7%/);
  });

  it("keeps every question answerable (correct answer exists among the answers)", () => {
    for (const locale of ["en", "es", "pl"] as const) {
      for (const q of getAllQuestions(locale)) {
        expect(q.answers.map((a) => a.id)).toContain(q.correctAnswer);
      }
    }
  });
});

describe("Polish content stays for Polish users", () => {
  it("keeps the Polish retirement and deposit questions", () => {
    expect(getQuestionById("ike-vs-ikze", "pl")?.question).toMatch(/IKE/);
    expect(getQuestionById("bfg-guarantee", "pl")?.question).toMatch(/BFG/);
    expect(getQuestionById("c19", "pl")?.answers.map((a) => a.text).join(" ")).toMatch(/[Pp]oduszka/);
  });

  it("keeps the Polish knowledge cards", () => {
    const ids = getStoryCards("pl").map((card) => card.id);
    expect(ids).toContain("poland-ppk-gap");
    expect(ids).toHaveLength(16);
  });
});
