"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, ChevronRight, RotateCcw } from "lucide-react";

import type { QuizQuestion } from "@/data/quizQuestions";
import { useLanguage } from "@/context/LanguageContext";
import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getLocalizedContent } from "@/lib/localizedContent";
import { getQuizQuestions } from "@/lib/localizedQuiz";
import { cn } from "@/lib/utils";
import { getVoiceDemoLocale } from "@/lib/voiceDemoScripts";

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
  onComplete?: (correctCount: number, totalCount: number) => void;
  startQuestionId?: string;
}

export function QuizCard({ onReward, onComplete, startQuestionId }: QuizCardProps) {
  const { locale, t } = useLanguage();
  const copy = getLocalizedContent(locale);
  const voiceLocale = getVoiceDemoLocale(locale);
  const sessionQuestions = useMemo(
    () => pickQuestions(getQuizQuestions(locale), startQuestionId),
    [locale, startQuestionId]
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [rewarded, setRewarded] = useState<Set<number>>(new Set());

  useEffect(() => {
    setQuestionIndex(0);
    setSelected("");
    setSubmitted(false);
    setRewarded(new Set());
  }, [locale, startQuestionId]);

  const question = sessionQuestions[questionIndex];
  const isCorrect = submitted && selected === question.correctAnswer;
  const isLast = questionIndex === sessionQuestions.length - 1;
  const allDone = submitted && isLast && isCorrect;
  const questionVoiceText = buildQuestionVoiceText(question);

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!selected || submitted) return;
    setSubmitted(true);
    if (selected === question.correctAnswer && !rewarded.has(questionIndex)) {
      onReward?.(question.reward);
      const next = new Set(rewarded).add(questionIndex);
      setRewarded(next);
      if (questionIndex === sessionQuestions.length - 1) {
        onComplete?.(next.size, sessionQuestions.length);
      }
    }
  }

  function handleNext() {
    setQuestionIndex((i) => i + 1);
    setSelected("");
    setSubmitted(false);
  }

  function handleRestart() {
    setQuestionIndex(0);
    setSelected("");
    setSubmitted(false);
    setRewarded(new Set());
  }

  const progress = Math.round(((questionIndex + (submitted && isCorrect ? 1 : 0)) / sessionQuestions.length) * 100);

  return (
    <div className="focus-card rounded-lg p-5 md:p-6">
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
                      disabled={submitted}
                      onChange={() => setSelected(answer.id)}
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
          <Button type="submit" size="lg" className="mt-5 w-full" disabled={!selected}>
            {t.quiz.submit}
          </Button>
        )}
      </form>

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
            <Button type="button" size="lg" className="flex-1" onClick={handleNext}>
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
              onClick={() => { setSelected(""); setSubmitted(false); }}
            >
              {t.quiz.retry}
            </Button>
          )}
          {allDone && (
            <Button type="button" size="lg" variant="outline" onClick={handleRestart}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {t.quiz.restart}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
