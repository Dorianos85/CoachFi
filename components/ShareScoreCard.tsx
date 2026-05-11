"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Copy, Share2, X, Check } from "lucide-react";
import { useState } from "react";

import { useStreak } from "@/context/StreakContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ShareScoreCardProps {
  score: number;
  open: boolean;
  onClose: () => void;
}

const shareScoreCopy: Record<
  Locale,
  {
    shareText: (score: number, streak: number) => string[];
    shareTitle: string;
    dialogAria: string;
    close: string;
    scoreTitle: string;
    status: (score: number) => string;
    outOf: string;
    streak: (count: number) => string;
    stats: { score: string; streak: string; best: string };
    poweredBy: string;
    share: string;
    copied: string;
    copyText: string;
  }
> = {
  pl: {
    shareText: (score, streak) => [
      `Mój wynik zdrowia finansowego: ${score}/100 🎯`,
      streak > 0 ? `${streak}-dniowa seria nauki 🔥` : "",
      "Buduję prawdziwe nawyki finansowe z Coach FI.",
      "",
      "Wypróbuj bezpłatnie → coachfi.app",
    ],
    shareTitle: "Mój wynik finansowy Coach FI",
    dialogAria: "Udostępnij swój wynik finansowy",
    close: "Zamknij",
    scoreTitle: "Wynik zdrowia finansowego",
    status: (score) => (score >= 80 ? "Świetnie" : score >= 55 ? "Dobra forma" : "Rozwój"),
    outOf: "na 100 punktów",
    streak: (count) => `${count}-dniowa seria`,
    stats: { score: "Wynik", streak: "Seria", best: "Najlepiej" },
    poweredBy: "coachfi.app · Powered by Solana",
    share: "Udostępnij",
    copied: "Skopiowano!",
    copyText: "Kopiuj tekst",
  },
  en: {
    shareText: (score, streak) => [
      `My financial health score: ${score}/100 🎯`,
      streak > 0 ? `${streak}-day learning streak 🔥` : "",
      "Building real money habits with Coach FI.",
      "",
      "Try it free → coachfi.app",
    ],
    shareTitle: "My Coach FI Financial Score",
    dialogAria: "Share your financial score",
    close: "Close",
    scoreTitle: "Financial Health Score",
    status: (score) => (score >= 80 ? "Excellent" : score >= 55 ? "Good shape" : "Growing"),
    outOf: "out of 100 points",
    streak: (count) => `${count}-day streak`,
    stats: { score: "Score", streak: "Streak", best: "Best" },
    poweredBy: "coachfi.app · Powered by Solana",
    share: "Share",
    copied: "Copied!",
    copyText: "Copy text",
  },
  ja: {
    shareText: (score, streak) => [
      `私の金融ヘルススコア: ${score}/100 🎯`,
      streak > 0 ? `${streak}日連続学習 🔥` : "",
      "Coach FIでお金の習慣を作っています。",
      "",
      "無料で試す → coachfi.app",
    ],
    shareTitle: "Coach FIの金融スコア",
    dialogAria: "金融スコアを共有",
    close: "閉じる",
    scoreTitle: "金融ヘルススコア",
    status: (score) => (score >= 80 ? "優秀" : score >= 55 ? "良好" : "成長中"),
    outOf: "100点中",
    streak: (count) => `${count}日連続`,
    stats: { score: "スコア", streak: "連続", best: "最高" },
    poweredBy: "coachfi.app · Powered by Solana",
    share: "共有",
    copied: "コピーしました!",
    copyText: "テキストをコピー",
  },
};

export function ShareScoreCard({ score, open, onClose }: ShareScoreCardProps) {
  const { streak } = useStreak();
  const { locale } = useLanguage();
  const copy = shareScoreCopy[locale];
  const [copied, setCopied] = useState(false);

  const shareText = copy
    .shareText(score, streak.currentStreak)
    .filter((line) => line !== "")
    .join("\n");

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: copy.shareTitle,
          text: shareText,
          url: window.location.origin,
        });
      } catch {
        // user cancelled — do nothing
      }
    } else {
      await copyToClipboard();
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // clipboard blocked — silently ignore
    }
  }

  const ring = score >= 80 ? "text-success" : score >= 55 ? "text-primary" : "text-warning";
  const label = copy.status(score);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={copy.dialogAria}
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 24 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 px-4"
          >
            {/* The shareable card */}
            <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
              {/* Card header — gradient */}
              <div className="relative bg-gradient-to-br from-primary via-primary/90 to-accent px-6 pb-8 pt-6 text-white">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={copy.close}
                  className="absolute right-4 top-4 rounded-full p-1 opacity-70 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <X className="h-5 w-5" />
                </button>

                <p className="text-xs font-black uppercase tracking-widest opacity-70">Coach FI</p>
                <p className="mt-1 text-sm font-bold opacity-80">{copy.scoreTitle}</p>

                {/* Score ring */}
                <div className="mt-5 flex items-center gap-5">
                  <div className="relative grid h-24 w-24 place-items-center">
                    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r="42" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="8" />
                      <circle
                        cx="48" cy="48" r="42"
                        fill="none"
                        stroke="white"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${(score / 100) * 263.9} 263.9`}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <span className="text-3xl font-black">{score}</span>
                  </div>
                  <div>
                    <p className="text-2xl font-black">{label}</p>
                    <p className="mt-1 text-sm font-bold opacity-75">{copy.outOf}</p>
                    {streak.currentStreak > 0 && (
                      <p className="mt-2 flex items-center gap-1 text-sm font-black">
                        🔥 {copy.streak(streak.currentStreak)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div className="px-6 py-5">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: copy.stats.score, value: `${score}/100`, icon: "🎯" },
                    { label: copy.stats.streak, value: `${streak.currentStreak}d`, icon: "🔥" },
                    { label: copy.stats.best, value: `${streak.longestStreak}d`, icon: "⭐" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl bg-primary/5 px-3 py-3 text-center">
                      <p className="text-lg">{stat.icon}</p>
                      <p className="mt-1 text-base font-black text-text">{stat.value}</p>
                      <p className="text-xs font-bold text-muted">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-center text-xs font-bold text-muted">
                  {copy.poweredBy}
                </p>

                {/* Action buttons */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleShare}
                    className="gap-2"
                  >
                    <Share2 className="h-4 w-4" aria-hidden="true" />
                    {copy.share}
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    onClick={copyToClipboard}
                    className={cn("gap-2 transition", copied && "border-success text-success")}
                  >
                    {copied ? (
                      <><Check className="h-4 w-4" aria-hidden="true" /> {copy.copied}</>
                    ) : (
                      <><Copy className="h-4 w-4" aria-hidden="true" /> {copy.copyText}</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
