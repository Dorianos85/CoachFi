"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { useStreak } from "@/context/StreakContext";
import {
  getDailyQuestion,
  getSecondsUntilMidnight,
  isChallengeCompletedToday,
  markChallengeCompleted,
  type ChallengeQuestion,
} from "@/data/challengeQuestions";
import { getQuestionById } from "@/lib/allQuestions";
import { cn } from "@/lib/utils";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatCountdown(seconds: number, t: { hours: string; minutes: string; seconds: string }) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${pad(h)}${t.hours} ${pad(m)}${t.minutes} ${pad(s)}${t.seconds}`;
}

export default function ChallengePage() {
  const { locale, t } = useLanguage();
  const { markActive } = useStreak();

  const [question, setQuestion] = useState<ChallengeQuestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);

  useEffect(() => {
    const daily = getDailyQuestion();
    const localized = getQuestionById(daily.id, locale);
    setQuestion(
      localized
        ? {
            ...daily,
            question: localized.question,
            answers: localized.answers,
            explanation: localized.explanation,
            reward: localized.reward,
          }
        : daily
    );
    setAlreadyDone(isChallengeCompletedToday());
    setCountdown(getSecondsUntilMidnight());
  }, [locale]);

  // countdown tick
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  function handleSubmit() {
    if (!selected || !question) return;
    setSubmitted(true);
    if (selected === question.correctAnswer) {
      setTokenBalance((b) => b + question.reward);
      markChallengeCompleted();
      setAlreadyDone(true);
      markActive();
    }
  }

  const isCorrect = submitted && selected === question?.correctAnswer;
  const isWrong = submitted && selected !== question?.correctAnswer;

  return (
    <section aria-labelledby="challenge-title">
      <SectionHeader
        eyebrow={t.challenge.eyebrow}
        title={t.challenge.title}
        description={t.challenge.description}
        readText={t.challenge.readText}
      />

      <div className="mx-auto max-w-2xl">
        {/* Reward badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 px-5 py-4 text-white shadow-lg"
        >
          <Zap className="h-6 w-6 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-black uppercase tracking-wide opacity-80">{t.challenge.reward}</p>
            <p className="text-2xl font-black">{t.challenge.rewardValue}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs font-bold opacity-70">{t.challenge.timerLabel}</p>
            <p className="font-black tabular-nums">{formatCountdown(countdown, t.challenge)}</p>
          </div>
        </motion.div>

        {/* Completed state */}
        <AnimatePresence>
          {alreadyDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl bg-success/15 border border-success/30 p-6 text-center"
            >
              <p className="text-4xl">🏆</p>
              <p className="mt-3 text-xl font-black text-text">{t.challenge.completedTitle}</p>
              <p className="mt-1 text-sm text-muted">{t.challenge.completedDesc}</p>
              <div className="mt-4 rounded-xl bg-white/70 px-4 py-3">
                <p className="text-xs font-bold text-muted">{t.challenge.timerLabel}</p>
                <p className="mt-1 text-2xl font-black tabular-nums text-text">
                  {formatCountdown(countdown, t.challenge)}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question card */}
        {!alreadyDone && question && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-primary/10 bg-white p-6 shadow-soft"
          >
            <p className="text-lg font-black leading-7 text-text">{question.question}</p>

            <div className="mt-5 grid gap-3">
              {question.answers.map((answer) => {
                const isSelected = selected === answer.id;
                const correct = submitted && answer.id === question.correctAnswer;
                const wrong = submitted && isSelected && answer.id !== question.correctAnswer;

                return (
                  <motion.button
                    key={answer.id}
                    type="button"
                    whileTap={!submitted ? { scale: 0.98 } : {}}
                    onClick={() => !submitted && setSelected(answer.id)}
                    className={cn(
                      "w-full rounded-xl border-2 px-4 py-3.5 text-left text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      !submitted && !isSelected && "border-primary/10 bg-white text-text hover:border-primary/30",
                      !submitted && isSelected && "border-primary bg-primary/5 text-primary",
                      correct && "border-success bg-success/10 text-success",
                      wrong && "border-destructive bg-destructive/10 text-destructive",
                    )}
                  >
                    <span className="mr-3 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-current/10 text-xs font-black">
                      {answer.id}
                    </span>
                    {answer.text}
                    {correct && <span className="ml-2">✓</span>}
                    {wrong && <span className="ml-2">✗</span>}
                  </motion.button>
                );
              })}
            </div>

            {/* Result banner */}
            <AnimatePresence>
              {submitted && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="overflow-hidden"
                >
                  <div
                    className={cn(
                      "mt-4 rounded-xl p-4 text-sm font-bold",
                      isCorrect ? "bg-success/15 text-success" : "bg-orange-50 text-orange-700"
                    )}
                  >
                    <p>{isCorrect ? t.challenge.correctBanner : t.challenge.wrongBanner}</p>
                    <p className="mt-2 font-black text-text">{t.challenge.explanation}:</p>
                    <p className="mt-1 font-normal text-muted">{question.explanation}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!submitted && (
              <Button
                type="button"
                size="lg"
                className="mt-5 w-full"
                disabled={!selected}
                onClick={handleSubmit}
              >
                {t.challenge.answerButton}
              </Button>
            )}
          </motion.div>
        )}

        {/* Token balance earned this session */}
        {tokenBalance > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-2xl bg-primary/5 px-5 py-4 text-center"
          >
            <p className="text-sm font-bold text-muted">Zdobyte tokeny tej sesji</p>
            <p className="text-3xl font-black text-primary">+{tokenBalance}</p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
