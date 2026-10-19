"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";

import { SectionHeader } from "@/components/SectionHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { useStreak } from "@/context/StreakContext";
import {
  getDailyQuestion,
  getSecondsUntilMidnight,
  type ChallengeQuestion,
} from "@/data/challengeQuestions";
import { getQuestionById } from "@/lib/allQuestions";
import { createChallengeSaveController, readDailyChallengeState } from "@/lib/challenge-save";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useProductStorage } from "@/lib/use-product-storage";

const challengeCopy: LocalizedMap<{ earnedThisSession: string }> = {
  en: { earnedThisSession: "Points earned during this session" },
  pl: { earnedThisSession: "Punkty zdobyte podczas tej sesji" },
  es: { earnedThisSession: "Tokens ganados en esta sesión" },
  fr: { earnedThisSession: "Jetons gagnés dans cette session" },
  ja: { earnedThisSession: "このセッションで獲得したトークン" },
  zh: { earnedThisSession: "本次获得的积分" },
  hi: { earnedThisSession: "इस सत्र में कमाए गए पॉइंट" },
  "pt-BR": { earnedThisSession: "Pontos ganhos nesta sessão" },
  tr: { earnedThisSession: "Bu oturumda kazanılan puanlar" },
};

const saveCopy = {
  pl: {
    unavailable: "Nie można odczytać danych wyzwania. Nie przyznano nowych punktów. Sprawdź odczyt ponownie.",
    check: "Sprawdź odczyt ponownie",
    retryable: "Nie udało się zapisać odpowiedzi. Nie przyznano nowych punktów. Możesz spróbować ponownie.",
    uncertain: "Nie udało się potwierdzić pełnego zapisu. Punkty lub ukończenie wyzwania mogły zostać zapisane częściowo. Nie ponawiaj tej odpowiedzi. Zmiana języka nie odblokuje ponowienia.",
  },
  en: {
    unavailable: "The challenge data could not be read. No new points were awarded. Check the data again.",
    check: "Check the data again",
    retryable: "Your answer could not be saved. No new points were awarded. You can try again.",
    uncertain: "The full save could not be confirmed. Points or challenge completion may have been partially saved. Do not retry this answer. Changing the language will not unlock another attempt.",
  },
};

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
  const { storage } = useProductStorage();
  const { locale, t } = useLanguage();
  const { markActive } = useStreak();

  const [question, setQuestion] = useState<ChallengeQuestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [saveController] = useState(createChallengeSaveController);
  const [saveTicket, setSaveTicket] = useState(() => saveController.version());
  const [saveIssue, setSaveIssue] = useState<"unavailable" | "retryable" | "uncertain" | null>("unavailable");
  const copy = locale === "pl" ? saveCopy.pl : saveCopy.en;

  function isCurrentAttempt() {
    try { return storage.isCurrent() && saveTicket === saveController.version(); }
    catch { return false; }
  }

  useLayoutEffect(() => {
    const ticket = saveController.reset();
    setSaveTicket(ticket);
    setSelected(null);
    setSubmitted(false);
    setTokenBalance(0);
    const state = readDailyChallengeState(storage);
    setAlreadyDone(state === "completed");
    setSaveIssue(state === "unavailable" ? "unavailable" : null);
    return () => { saveController.reset(); };
  }, [storage, saveController]);

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
    setCountdown(getSecondsUntilMidnight());
  }, [locale]);

  // countdown tick
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  function handleSubmit() {
    if (!selected || !question || submitted || alreadyDone ||
      saveIssue === "unavailable" || saveIssue === "uncertain" || !isCurrentAttempt() || !saveController.isOpen(saveTicket)) return;
    const result = saveController.run(saveTicket, storage, {
      questionId: question.id,
      selectedAnswer: selected,
      correctAnswer: question.correctAnswer,
      reward: question.reward,
    }, markActive);
    if (!isCurrentAttempt() || result.status === "ignored" || result.status === "stopped") return;
    if (result.status === "uncertain" || result.status === "retryable") {
      setSaveIssue(result.status);
      // Refresh readers only; this event cannot replay the reward or mark success.
      try { window.dispatchEvent(new Event("coachfi-tokens")); } catch { /* Keep the save warning. */ }
      return;
    }
    setSaveIssue(null);
    if (result.status === "completed") {
      setAlreadyDone(true);
      return;
    }
    if (result.status === "saved") {
      setTokenBalance((balance) => balance + (result.earned ?? 0));
      setAlreadyDone(true);
    }
    setSubmitted(true);
  }

  function handleCheckRead() {
    if (saveIssue !== "unavailable" || !isCurrentAttempt() || !saveController.isOpen(saveTicket)) return;
    const state = readDailyChallengeState(storage);
    if (!isCurrentAttempt()) return;
    setAlreadyDone(state === "completed");
    setSaveIssue(state === "unavailable" ? "unavailable" : null);
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
        {saveIssue && (
          <div role="alert" className="mb-4 rounded-xl border border-warning/40 bg-warning/15 p-4 text-sm text-text">
            <p>{copy[saveIssue]}</p>
            {saveIssue === "unavailable" && (
              <Button type="button" className="mt-3" onClick={handleCheckRead}>{copy.check}</Button>
            )}
          </div>
        )}
        {/* Reward badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3 rounded-2xl border-2 border-primary-border bg-area-rewards px-5 py-4 text-text"
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
            data-testid="daily-challenge-question"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-primary/10 bg-white p-6 shadow-soft"
          >
            <div className="flex items-start gap-3">
              <p className="flex-1 text-lg font-black leading-7 text-text">{question.question}</p>
              <VoiceButton
                text={[question.question, ...question.answers.map((a) => `${a.id}. ${a.text}`)].join(". ")}
                locale={locale}
                variant="icon"
                className="mt-0.5 shrink-0"
              />
            </div>

            <div className="mt-5 grid gap-3">
              {question.answers.map((answer) => {
                const isSelected = selected === answer.id;
                const correct = submitted && answer.id === question.correctAnswer;
                const wrong = submitted && isSelected && answer.id !== question.correctAnswer;

                return (
                  <motion.button
                    key={answer.id}
                    type="button"
                    disabled={submitted || saveIssue === "unavailable" || saveIssue === "uncertain"}
                    whileTap={!submitted && !saveIssue ? { scale: 0.98 } : {}}
                    onClick={() => {
                      if (!submitted && saveIssue !== "unavailable" && saveIssue !== "uncertain" && isCurrentAttempt() && saveController.isOpen(saveTicket)) setSelected(answer.id);
                    }}
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
                      isCorrect ? "bg-success/15 text-success" : "bg-warning text-text"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <p className="flex-1">{isCorrect ? t.challenge.correctBanner : t.challenge.wrongBanner}</p>
                      <VoiceButton
                        text={`${isCorrect ? t.challenge.correctBanner : t.challenge.wrongBanner}. ${question.explanation}`}
                        locale={locale}
                        variant="icon"
                        className="shrink-0"
                      />
                    </div>
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
                disabled={!selected || saveIssue === "unavailable" || saveIssue === "uncertain"}
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
            data-testid="daily-challenge-earned"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-2xl bg-primary/5 px-5 py-4 text-center"
          >
            <p className="text-sm font-bold text-muted">{pickLocalized(challengeCopy, locale).earnedThisSession}</p>
            <p className="text-3xl font-black text-primary">+{tokenBalance}</p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
