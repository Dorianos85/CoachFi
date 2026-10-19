import { challengeQuestions } from "@/data/challengeQuestions";
import { quizQuestions, type QuizQuestion } from "@/data/quizQuestions";
import { getQuestionById } from "@/lib/allQuestions";
import type { Locale } from "@/lib/i18n";
import { STAGE_QUESTION_IDS } from "@/lib/learningProgress";
import { getQuizQuestions } from "@/lib/localizedQuiz";

const TOPIC_STAGE: Record<string, string> = {
  mindset: "money-mindset", saving: "saving-habit", inflation: "inflation", credit: "credit-rates",
  emergency: "emergency-fund", investing: "long-term-investing", retirement: "retirement", family: "family-plan",
};

export function isKnownQuizTopic(topic?: string): boolean {
  return typeof topic === "string" && Object.hasOwn(TOPIC_STAGE, topic);
}

/** Reviewed PL/EN modules use their canonical questions; other topic pools retain their contract. */
export function getTopicQuestions(locale: Locale, topic?: string): QuizQuestion[] {
  const localeQuestions = getQuizQuestions(locale);
  if (!isKnownQuizTopic(topic)) return localeQuestions;
  const stageId = TOPIC_STAGE[topic!];
  if ((stageId === "money-mindset" || stageId === "saving-habit" || stageId === "inflation" || stageId === "credit-rates" || stageId === "emergency-fund" || stageId === "long-term-investing" || stageId === "retirement") && (locale === "pl" || locale === "en")) {
    return STAGE_QUESTION_IDS[stageId].map(id => {
      const question = getQuestionById(id, locale);
      const english = quizQuestions.find(candidate => candidate.id === id);
      if (!question || !english) throw new Error("Reviewed topic question unavailable");
      return { id: question.id, question: question.question, answers: question.answers,
        correctAnswer: question.correctAnswer, reward: question.reward, category: question.category,
        successMessage: locale === "en" ? english.successMessage : question.explanation,
        retryMessage: question.explanation };
    });
  }
  const localizedById = new Map(localeQuestions.map(question => [question.id, question]));
  const challengeById = new Map(challengeQuestions.map(question => [question.id, {
    id: question.id, question: question.question, answers: question.answers, correctAnswer: question.correctAnswer,
    reward: question.reward, successMessage: question.explanation, retryMessage: question.explanation, category: "Challenge",
  } satisfies QuizQuestion]));
  const staged = STAGE_QUESTION_IDS[stageId]
    .map(id => localizedById.get(id) ?? quizQuestions.find(question => question.id === id) ?? challengeById.get(id))
    .filter((question): question is QuizQuestion => Boolean(question));
  return staged.length > 0 ? staged : localeQuestions;
}
