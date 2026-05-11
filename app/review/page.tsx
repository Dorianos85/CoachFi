"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Brain, CheckCircle2, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SectionHeader } from "@/components/SectionHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { useStreak } from "@/context/StreakContext";
import { getAllQuestionIds, getAllQuestions, getQuestionById } from "@/lib/allQuestions";
import { getDueIds, getCardById, intervalLabel, masteryLevel, recordAnswer, calculateNext } from "@/lib/srs";
import type { SRSCard } from "@/lib/srs";
import { cn } from "@/lib/utils";

// Confetti particle
function Confetti({ active }: { active: boolean }) {
  const colors = ["#6C47FF", "#F59E0B", "#10B981", "#EF4444", "#3B82F6", "#EC4899"];
  const count = 32;
  return (
    <AnimatePresence>
      {active && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
          {Array.from({ length: count }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-3 w-3 rounded-sm"
              style={{
                left: `${5 + ((i * 97) % 90)}%`,
                top: "-12px",
                backgroundColor: colors[i % colors.length],
                rotate: `${(i * 37) % 360}deg`,
              }}
              animate={{
                y: ["0vh", "110vh"],
                x: [0, ((i % 2 === 0 ? 1 : -1) * (i * 13)) % 120],
                rotate: [`${(i * 37) % 360}deg`, `${(i * 37 + 360) % 720}deg`],
                opacity: [1, 1, 0],
              }}
              transition={{ duration: 2 + (i % 5) * 0.3, delay: i * 0.04, ease: "easeIn" }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// Mastery dots indicator
function MasteryDots({ level }: { level: 0 | 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex gap-1" aria-label={`Mastery level ${level} of 4`}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 w-5 rounded-full transition",
            i < level ? "bg-primary" : "bg-primary/15"
          )}
        />
      ))}
    </div>
  );
}

const reviewCopy = {
  en: {
    eyebrow: "Spaced Review",
    title: "Review",
    readText: "Review session. Answer questions to strengthen your memory.",
    allCaughtTitle: "All caught up!",
    allCaughtDescription: "No questions due today. Come back tomorrow - your streak is safe.",
    deckTotal: "Total questions in your deck",
    sessionCompleteTitle: "Session complete!",
    sessionCompleteReadText: "Review session complete.",
    answeredCorrectly: "questions answered correctly",
    accuracy: "accuracy",
    reviewAgain: "Review again",
    description: (current: number, total: number) =>
      `${current} of ${total} - SM-2 algorithm schedules your next review automatically`,
    nextPrefix: "next:",
    correct: "Correct!",
    notQuite: "Not quite",
    nextReview: "Next review:",
    checkAnswer: "Check answer",
    finishSession: "Finish session",
    next: "Next",
    resultSuffix: "...",
  },
  pl: {
    eyebrow: "Powtórki",
    title: "Powtórki",
    readText: "Sesja powtórek. Odpowiadaj na pytania, aby utrwalić wiedzę.",
    allCaughtTitle: "Wszystko powtórzone!",
    allCaughtDescription: "Nie masz dziś pytań do powtórki. Wróć jutro - Twoja seria jest bezpieczna.",
    deckTotal: "Liczba pytań w talii",
    sessionCompleteTitle: "Sesja zakończona!",
    sessionCompleteReadText: "Sesja powtórek zakończona.",
    answeredCorrectly: "poprawnych odpowiedzi",
    accuracy: "skuteczność",
    reviewAgain: "Powtórz jeszcze raz",
    description: (current: number, total: number) =>
      `${current} z ${total} - algorytm SM-2 automatycznie zaplanuje kolejną powtórkę`,
    nextPrefix: "następna:",
    correct: "Dobrze!",
    notQuite: "Jeszcze nie",
    nextReview: "Następna powtórka:",
    checkAnswer: "Sprawdź odpowiedź",
    finishSession: "Zakończ sesję",
    next: "Następne",
    resultSuffix: "...",
  },
};

function getReviewCopy(locale: string) {
  return locale === "pl" ? reviewCopy.pl : reviewCopy.en;
}

function formatReviewInterval(card: SRSCard, locale: string): string {
  if (locale !== "pl") return intervalLabel(card);
  if (card.repetitions === 0) return "nowe";
  if (card.interval === 1) return "jutro";
  if (card.interval < 7) return `${card.interval} dni`;
  if (card.interval < 30) return `${Math.round(card.interval / 7)} tyg.`;
  return `${Math.round(card.interval / 30)} mies.`;
}

export default function ReviewPage() {
  const { locale } = useLanguage();
  const { markActive } = useStreak();
  const copy = getReviewCopy(locale);

  const [dueIds, setDueIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<{ id: string; correct: boolean }[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);

  useEffect(() => {
    const ids = getDueIds(getAllQuestionIds(locale));
    setDueIds(ids);
    setCurrentIndex(0);
    setSelected(null);
    setRevealed(false);
    setResults([]);
    if (ids.length === 0) setSessionDone(true);
    else setSessionDone(false);
  }, [locale]);

  const currentQuestion = useMemo(
    () => (dueIds[currentIndex] ? getQuestionById(dueIds[currentIndex], locale) : null),
    [dueIds, currentIndex, locale]
  );

  const srsCard = currentQuestion ? getCardById(currentQuestion.id) : undefined;
  const level = srsCard ? masteryLevel(srsCard) : 0;

  const handleReveal = useCallback(() => {
    if (!selected || !currentQuestion) return;
    setRevealed(true);
    const correct = selected === currentQuestion.correctAnswer;
    recordAnswer(currentQuestion.id, correct);
    setResults((r) => [...r, { id: currentQuestion.id, correct }]);
    if (correct) markActive();
  }, [selected, currentQuestion, markActive]);

  function handleNext() {
    if (currentIndex + 1 >= dueIds.length) {
      const correctCount = results.filter((r) => r.correct).length + (selected === currentQuestion?.correctAnswer ? 0 : 0);
      const allCorrect = results.every((r) => r.correct);
      if (allCorrect) setShowConfetti(true);
      setSessionDone(true);
      setTimeout(() => setShowConfetti(false), 2400);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    }
  }

  const correct = results.filter((r) => r.correct).length;
  const total = results.length;
  const progress = dueIds.length > 0 ? (currentIndex / dueIds.length) * 100 : 0;

  // ── All caught up ──
  if (dueIds.length === 0 && sessionDone) {
    return (
      <section aria-labelledby="review-title">
        <SectionHeader eyebrow={copy.eyebrow} title={copy.title} description="" readText={copy.readText} />
        <div className="mx-auto max-w-lg text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
            <p className="text-6xl">🧠</p>
            <p className="mt-4 text-2xl font-black text-text">{copy.allCaughtTitle}</p>
            <p className="mt-2 text-muted">{copy.allCaughtDescription}</p>
            <div className="mt-6 rounded-2xl bg-primary/5 p-5">
              <p className="text-sm font-bold text-muted">{copy.deckTotal}</p>
              <p className="text-4xl font-black text-primary">{getAllQuestions(locale).length}</p>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  // ── Session complete ──
  if (sessionDone) {
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <section aria-labelledby="review-title">
        <Confetti active={showConfetti} />
        <SectionHeader eyebrow={copy.eyebrow} title={copy.sessionCompleteTitle} description="" readText={copy.sessionCompleteReadText} />
        <div className="mx-auto max-w-lg">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-white p-8 shadow-soft text-center">
            <p className="text-5xl">{pct >= 80 ? "🏆" : pct >= 50 ? "💪" : "📚"}</p>
            <p className="mt-4 text-3xl font-black text-text">{correct} / {total}</p>
            <p className="text-muted mt-1">{copy.answeredCorrectly}</p>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-primary/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn("h-full rounded-full", pct >= 80 ? "bg-success" : pct >= 50 ? "bg-primary" : "bg-warning")}
              />
            </div>
            <p className="mt-2 text-sm font-black text-muted">{pct}% {copy.accuracy}</p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {results.map((r) => {
                const q = getQuestionById(r.id, locale);
                return (
                  <div key={r.id} className={cn("rounded-xl p-3 text-left text-xs font-bold", r.correct ? "bg-success/10 text-success" : "bg-rose-50 text-rose-600")}>
                    {r.correct ? <CheckCircle2 className="mb-1 h-4 w-4" /> : <XCircle className="mb-1 h-4 w-4" />}
                    {q?.question.slice(0, 48)}{copy.resultSuffix}
                  </div>
                );
              })}
            </div>

            <Button size="lg" className="mt-6 w-full" onClick={() => { setSessionDone(false); setCurrentIndex(0); setResults([]); setSelected(null); setRevealed(false); const ids = getDueIds(getAllQuestionIds(locale)); setDueIds(ids); }}>
              {copy.reviewAgain}
            </Button>
          </motion.div>
        </div>
      </section>
    );
  }

  if (!currentQuestion) return null;

  const isCorrect = revealed && selected === currentQuestion.correctAnswer;
  const isWrong = revealed && selected !== currentQuestion.correctAnswer;

  return (
    <section aria-labelledby="review-title">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description(currentIndex + 1, dueIds.length)}
        readText={copy.readText}
      />

      <div className="mx-auto max-w-xl">
        {/* Progress bar */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex-1 h-2.5 overflow-hidden rounded-full bg-primary/10">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
              className="h-full rounded-full bg-primary"
            />
          </div>
          <span className="text-xs font-black tabular-nums text-muted">{currentIndex + 1}/{dueIds.length}</span>
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl bg-white p-6 shadow-soft"
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-muted">
                <Brain className="h-4 w-4 text-primary" />
                {currentQuestion.category}
              </div>
              <div className="flex items-center gap-2">
                <MasteryDots level={level as 0 | 1 | 2 | 3 | 4} />
                {srsCard && (
                  <span className="text-xs font-bold text-muted">
                    {copy.nextPrefix} {formatReviewInterval(srsCard, locale)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <p className="flex-1 text-lg font-black leading-7 text-text">{currentQuestion.question}</p>
              <VoiceButton text={currentQuestion.question} variant="icon" label="Przeczytaj pytanie" className="mt-0.5 shrink-0" />
            </div>

            <div className="mt-5 grid gap-2.5">
              {currentQuestion.answers.map((answer) => {
                const isSelected = selected === answer.id;
                const correct = revealed && answer.id === currentQuestion.correctAnswer;
                const wrong = revealed && isSelected && !correct;

                return (
                  <motion.button
                    key={answer.id}
                    type="button"
                    whileTap={!revealed ? { scale: 0.98 } : {}}
                    onClick={() => !revealed && setSelected(answer.id)}
                    className={cn(
                      "w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      !revealed && !isSelected && "border-primary/10 bg-white text-text hover:border-primary/30 hover:bg-primary/3",
                      !revealed && isSelected && "border-primary bg-primary/8 text-primary",
                      correct && "border-success bg-success/12 text-success",
                      wrong && "border-rose-400 bg-rose-50 text-rose-600"
                    )}
                  >
                    <span className="mr-3 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current/20 bg-current/8 text-xs font-black">
                      {answer.id}
                    </span>
                    {answer.text}
                    {correct && <span className="ml-2">✓</span>}
                    {wrong && <span className="ml-2">✗</span>}
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="overflow-hidden"
                >
                  <div className={cn("mt-4 rounded-2xl p-4 text-sm", isCorrect ? "bg-success/10" : "bg-rose-50")}>
                    <p className={cn("font-black", isCorrect ? "text-success" : "text-rose-600")}>
                      {isCorrect ? `✓ ${copy.correct}` : `✗ ${copy.notQuite}`}
                    </p>
                    <div className="flex items-start gap-2">
                      <p className="mt-1.5 flex-1 leading-6 text-muted">{currentQuestion.explanation}</p>
                      <VoiceButton text={currentQuestion.explanation} variant="icon" label="Przeczytaj wyjaśnienie" className="mt-1.5 shrink-0" />
                    </div>
                    {srsCard && (
                      <p className="mt-2 text-xs font-black text-muted/70">
                        {copy.nextReview} {formatReviewInterval(calculateNextForDisplay(srsCard, isCorrect), locale)}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-5 flex gap-3">
              {!revealed ? (
                <Button size="lg" className="w-full" disabled={!selected} onClick={handleReveal}>
                  {copy.checkAnswer}
                </Button>
              ) : (
                <Button size="lg" className="w-full" onClick={handleNext}>
                  {currentIndex + 1 >= dueIds.length ? copy.finishSession : `${copy.next} →`}
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

// display-only helper — does not persist
function calculateNextForDisplay(card: Parameters<typeof calculateNext>[0], correct: boolean) {
  return calculateNext(card, correct);
}
