"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useLayoutEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, ChevronRight, RotateCcw } from "lucide-react";

import type { QuizQuestion } from "@/data/quizQuestions";
import { useLanguage } from "@/context/LanguageContext";
import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getLocalizedContent } from "@/lib/localizedContent";
import { getTopicQuestions, isKnownQuizTopic } from "@/lib/quiz-topic";
import { recordAnswer } from "@/lib/srs";
import { readReviewCards } from "@/lib/review-save";
import { cn } from "@/lib/utils";
import { getVoiceDemoLocale } from "@/lib/voiceDemoScripts";
import { useProductStorage } from "@/lib/use-product-storage";
import { getTokenBalance } from "@/lib/tokens";
import { createQuizLearningSaveController, type QuizLearningSaveReward, type QuizLearningSaveTicket } from "@/lib/quiz-learning-save";

const QUIZ_BATCH_SIZE = 4;
const MAX_QUIZ_VOICE_LENGTH = 500;

function pickQuestions(questions: QuizQuestion[], startQuestionId?: string) {
  if (startQuestionId) {
    const idx = questions.findIndex((q) => q.id === startQuestionId);
    if (idx !== -1) {
      // Start from the specific question, take up to QUIZ_BATCH_SIZE
      return questions.slice(idx, idx + QUIZ_BATCH_SIZE);
    }
  }
  // Shuffle and pick QUIZ_BATCH_SIZE random questions
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, QUIZ_BATCH_SIZE);
}

function limitVoiceText(text: string) {
  if (text.length <= MAX_QUIZ_VOICE_LENGTH) return text;
  return `${text.slice(0, MAX_QUIZ_VOICE_LENGTH - 3).trimEnd()}...`;
}

function buildQuestionVoiceText(question: QuizQuestion) {
  return limitVoiceText([
    question.question,
    ...question.answers.map((answer) => `${answer.id}. ${answer.text}`),
  ].join(" "));
}

interface QuizCardProps {
  onReward?: (amount: number) => void;
  rewardPersistence?: Omit<QuizLearningSaveReward, "amount"> & { confirmed?: (balance: number) => void };
  onComplete?: (correctCount: number, totalCount: number) => void;
  onPersistenceIssue?: () => void;
  startQuestionId?: string;
  topic?: string;
}

export function QuizCard({ onReward, rewardPersistence, onComplete, onPersistenceIssue, startQuestionId, topic }: QuizCardProps) {
  const { storage } = useProductStorage();
  const { locale, t } = useLanguage();
  const copy = getLocalizedContent(locale);
  const voiceLocale = getVoiceDemoLocale(locale);
  const sessionQuestions = useMemo(() => {
    const pool = getTopicQuestions(locale, topic);
    if (isKnownQuizTopic(topic)) return pool;
    return pickQuestions(pool, startQuestionId);
  }, [locale, startQuestionId, topic]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [rewarded, setRewarded] = useState<Set<number>>(new Set());
  const [tokenError, setTokenError] = useState(false);
  const [saveController] = useState(createQuizLearningSaveController);
  const [saveTicket, setSaveTicket] = useState<QuizLearningSaveTicket | null>(null);
  const [session, setSession] = useState(0);
  const [loadIssue, setLoadIssue] = useState(false);
  const [saveIssue, setSaveIssue] = useState<"retryable" | "uncertain" | null>(null);

  const persistenceIssue = saveController.issue(storage) ?? saveIssue;
  const readIssueCopy = locale === "pl"
    ? "Nie udało się odczytać danych quizu. Nie zmieniono zapisanych danych. Spróbuj ponownie."
    : "Quiz data could not be read. Saved data was not changed. Try again.";

  useLayoutEffect(() => {
    saveController.retire();
    setSaveTicket(null);
    setSaveIssue(saveController.issue(storage));
    setLoadIssue(false);
    setSelected("");
    setSubmitted(false);
    setRewarded(new Set());
    setTokenError(false);
    setQuestionIndex(0);
    if (saveController.issue(storage)) {
      setSaveTicket(saveController.begin(storage, { locale, questionId: "quiz-blocked", session }));
      return () => { saveController.retire(); };
    }
    try {
      const cards = readReviewCards(storage);
      const answered = new Set(cards.filter(card => card.repetitions > 0).map(card => card.id));
      const firstFresh = sessionQuestions.findIndex(item => !answered.has(item.id));
      const index = firstFresh > 0 ? firstFresh : 0;
      if (!storage.isCurrent()) return;
      setQuestionIndex(index);
      setSaveTicket(saveController.begin(storage, { locale, questionId: sessionQuestions[index]?.id ?? "quiz-empty", session }));
    } catch {
      if (storage.isCurrent()) {
        setLoadIssue(true);
        setSaveTicket(saveController.begin(storage, { locale, questionId: "quiz-read-retry", session }));
      }
    }
    return () => { saveController.retire(); };
  }, [locale, sessionQuestions, startQuestionId, topic, storage, saveController, session]);

  const question = sessionQuestions[questionIndex];
  const isCorrect = submitted && selected === question?.correctAnswer;
  const isLast = questionIndex === sessionQuestions.length - 1;
  const allDone = submitted && isLast && isCorrect;
  const questionVoiceText = question ? buildQuestionVoiceText(question) : "";

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!saveTicket || !saveController.current(saveTicket, storage)) return;
    if (saveController.issue(storage)) { setSaveIssue("uncertain"); return; }
    if (!question || !selected || submitted || loadIssue || !saveController.isOpen(saveTicket, storage)) return;
    const correct = selected === question.correctAnswer;
    const award = correct && !rewarded.has(questionIndex) && (rewardPersistence || onReward)
      ? { amount: question.reward,
          award: rewardPersistence?.award ?? ((amount: number, traced: Parameters<QuizLearningSaveReward["award"]>[1]) => {
            onReward!(amount);
            return getTokenBalance(traced);
          }),
          activity: rewardPersistence?.activity }
      : undefined;
    const result = saveController.run(saveTicket, storage,
      traced => { recordAnswer(question.id, correct, traced); }, award);
    if (result.status === "uncertain") {
      if (storage.isCurrent()) { setTokenError(false); setSaveIssue("uncertain"); onPersistenceIssue?.(); }
      return;
    }
    if (!saveController.current(saveTicket, storage) || result.status === "ignored" || result.status === "stopped") return;
    const validationRejected = result.reason === "token-validation";
    setTokenError(validationRejected);
    if (result.status !== "saved") {
      setSaveIssue(validationRejected ? null : "retryable");
      onPersistenceIssue?.();
      return;
    }
    const nextTicket = saveController.begin(storage, { locale, questionId: question.id, session });
    setSaveTicket(nextTicket);
    setSaveIssue(null);
    setSubmitted(true);
    if (result.balance !== undefined && saveController.current(nextTicket, storage)) rewardPersistence?.confirmed?.(result.balance);
    if (!saveController.current(nextTicket, storage)) return;
    if (correct && !rewarded.has(questionIndex)) {
      const next = new Set(rewarded).add(questionIndex);
      setRewarded(next);
      if (questionIndex === sessionQuestions.length - 1) onComplete?.(next.size, sessionQuestions.length);
    }
  }

  function handleNext() {
    if (!saveTicket || !saveController.current(saveTicket, storage) || saveController.issue(storage) || !submitted || !isCorrect || isLast) return;
    const nextQuestion = sessionQuestions[questionIndex + 1];
    if (!nextQuestion) return;
    setSaveTicket(saveController.begin(storage, { locale, questionId: nextQuestion.id, session }));
    setSaveIssue(null);
    setQuestionIndex(i => i + 1);
    setSelected("");
    setSubmitted(false);
    setTokenError(false);
  }

  function handleRestart() {
    if (!saveTicket || !saveController.current(saveTicket, storage) || saveController.issue(storage) || !allDone) return;
    saveController.retire(saveTicket);
    setSession(value => value + 1);
  }

  const progress = sessionQuestions.length ? Math.round(((questionIndex + (submitted && isCorrect ? 1 : 0)) / sessionQuestions.length) * 100) : 0;

  if (loadIssue || !question) {
    return <div className="focus-card rounded-lg p-5 md:p-6">
      <p role="alert" data-testid="quiz-load-alert">{readIssueCopy}</p>
      <Button type="button" data-testid="quiz-read-retry" onClick={() => {
        if (!saveTicket || !saveController.current(saveTicket, storage) || saveController.issue(storage)) return;
        saveController.retire(saveTicket);
        setSession(value => value + 1);
      }}>{locale === "pl" ? "Spróbuj ponownie" : "Try again"}</Button>
    </div>;
  }

  return (
    <div data-testid="quiz-card" className="focus-card rounded-lg p-5 md:p-6">
      {/* Progress bar */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-sm font-bold text-muted">
          <span>
            {t.quiz.progress
              .replace("{current}", String(questionIndex + 1))
              .replace("{total}", String(sessionQuestions.length))}
          </span>
          <span>{t.quiz.progressPct.replace("{pct}", String(progress))}</span>
        </div>
        <Progress value={progress} valueLabel={t.quiz.progressPct.replace("{pct}", String(progress))} />
      </div>

      <form onSubmit={handleSubmit}>
        <fieldset>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-black uppercase text-primary">{t.quiz.checkKnowledge}</p>
            <VoiceButton
              text={questionVoiceText}
              label={copy.voice.readQuestion}
              locale={voiceLocale}
              variant="pill"
              className="hidden sm:inline-flex"
            />
            <VoiceButton
              text={questionVoiceText}
              label={copy.voice.readQuestion}
              locale={voiceLocale}
              variant="icon"
              className="sm:hidden"
            />
          </div>
          <legend className="text-2xl font-black leading-tight text-text md:text-3xl break-words hyphens-auto">
            {question.question}
          </legend>

          <AnimatePresence mode="wait">
            <motion.div
              key={questionIndex}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
              className="mt-5 grid gap-3"
            >
              {question.answers.map((answer) => {
                const isSelected = selected === answer.id;
                const showCorrect = submitted && answer.id === question.correctAnswer;
                const showWrong = submitted && isSelected && answer.id !== question.correctAnswer;

                return (
                  <label
                    key={answer.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border p-4 font-bold text-text transition focus-within:ring-2 focus-within:ring-primary",
                      !submitted && "border-primary/15 bg-white/85 hover:border-primary/35 hover:bg-white",
                      !submitted && isSelected && "border-primary bg-primary/5 shadow-sm",
                      showCorrect && "border-success bg-success/15",
                      showWrong && "border-warning bg-warning/10",
                      submitted && !showCorrect && !showWrong && "border-primary/10 bg-white/60 opacity-60"
                    )}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={answer.id}
                      checked={isSelected}
                      data-testid={"quiz-answer-" + answer.id}
                      disabled={submitted || persistenceIssue === "uncertain"}
                      onChange={() => {
                        if (!saveTicket || !saveController.current(saveTicket, storage)) return;
                        if (saveController.issue(storage)) { setSaveIssue("uncertain"); return; }
                        if (submitted || !saveController.isOpen(saveTicket, storage)) return;
                        setSelected(answer.id); setTokenError(false); setSaveIssue(null);
                      }}
                      className="h-5 w-5 shrink-0 accent-primary"
                    />
                    <span className="min-w-0 flex-1 break-words">
                      <span className="mr-2 font-black">{answer.id}.</span>
                      {answer.text}
                    </span>
                    {showCorrect && <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />}
                    {showWrong && <XCircle className="h-5 w-5 shrink-0 text-warning" aria-hidden="true" />}
                  </label>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </fieldset>

        {!submitted && (
          <Button data-testid="quiz-submit" type="submit" size="lg" className="mt-5 w-full" disabled={!selected || persistenceIssue === "uncertain"}>
            {t.quiz.submit}
          </Button>
        )}
      </form>

      {tokenError && (
        <p role="alert" className="mt-5 rounded-lg bg-warning/20 p-4 text-sm font-bold leading-6 text-text">
          {locale === "pl"
            ? "Nie można bezpiecznie zapisać nagrody w lokalnym saldzie punktów. Odpowiedź nie została zapisana. Sprawdź dane lokalne w Ustawieniach."
            : "Your local points balance cannot safely accept this reward. This answer was not saved. Check your local data in Settings."}
        </p>
      )}

      {persistenceIssue && (
        <div role="alert" data-testid="quiz-save-alert" className="mt-5 rounded-lg bg-warning/20 p-4 text-sm font-bold leading-6 text-text">
          <p>{persistenceIssue === "retryable"
            ? locale === "pl" ? "Nie udało się zapisać odpowiedzi. Możesz spróbować ponownie." : "Your answer could not be saved. You can try again."
            : locale === "pl"
              ? "Nie udało się potwierdzić pełnego zapisu. Odpowiedź lub punkty mogły zostać zapisane częściowo. Nie ponawiaj tej odpowiedzi. Odśwież stronę, aby odczytać dane lokalne."
              : "The full save could not be confirmed. Your answer or points may have been partially saved. Do not retry this answer. Reload the page to read your local data."}</p>
          {persistenceIssue === "uncertain" && (
            <Button type="button" variant="outline" className="mt-3" onClick={() => {
              if (saveTicket && saveController.current(saveTicket, storage)) window.location.reload();
            }}>
              {locale === "pl" ? "Odśwież stronę" : "Reload page"}
            </Button>
          )}
        </div>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              "mt-5 rounded-lg p-4 text-sm font-bold leading-6",
              isCorrect ? "bg-success/20 text-text" : "bg-warning/20 text-text"
            )}
            data-testid="quiz-confirmed-feedback"
            aria-live="polite"
          >
            {isCorrect ? question.successMessage : question.retryMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      {submitted && (
        <div className="mt-4 flex gap-3">
          {isCorrect && !isLast && (
            <Button data-testid="quiz-next" type="button" size="lg" className="flex-1" onClick={handleNext}>
              {t.quiz.next}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
          {!isCorrect && (
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="flex-1"
              data-testid="quiz-retry"
              onClick={() => { if (saveTicket && saveController.current(saveTicket, storage) && !saveController.issue(storage) && submitted && !isCorrect) { setSaveTicket(saveController.begin(storage, { locale, questionId: question.id, session })); setSaveIssue(null); setSelected(""); setSubmitted(false); } }}
            >
              {t.quiz.retry}
            </Button>
          )}
          {allDone && (
            <Button data-testid="quiz-restart" type="button" size="lg" variant="outline" onClick={handleRestart}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {t.quiz.restart}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
