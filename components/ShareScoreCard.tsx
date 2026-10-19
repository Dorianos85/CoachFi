"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Copy, Share2, X, Check } from "lucide-react";
import { useState } from "react";

import { useStreak } from "@/context/StreakContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ShareScoreCardProps {
  score: number;
  open: boolean;
  onClose: () => void;
}

const shareScoreCopy: LocalizedMap<
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
  es: {
    shareText: (score, streak) => [
      `Mi puntuación de salud financiera: ${score}/100 🎯`,
      streak > 0 ? `Racha de aprendizaje de ${streak} días 🔥` : "",
      "Creando hábitos de dinero reales con Coach FI.",
      "",
      "Pruébalo gratis → coachfi.app",
    ],
    shareTitle: "Mi puntuación financiera en Coach FI",
    dialogAria: "Comparte tu puntuación financiera",
    close: "Cerrar",
    scoreTitle: "Puntuación de salud financiera",
    status: (score) => (score >= 80 ? "Excelente" : score >= 55 ? "Buen estado" : "En crecimiento"),
    outOf: "de 100 puntos",
    streak: (count) => `Racha de ${count} días`,
    stats: { score: "Puntuación", streak: "Racha", best: "Mejor" },
    poweredBy: "coachfi.app · Con tecnología de Solana",
    share: "Compartir",
    copied: "¡Copiado!",
    copyText: "Copiar texto",
  },
  fr: {
    shareText: (score, streak) => [
      `Mon score de santé financière : ${score}/100 🎯`,
      streak > 0 ? `Série d'apprentissage de ${streak} jours 🔥` : "",
      "Je construis de vraies habitudes d'argent avec Coach FI.",
      "",
      "Essayez gratuitement → coachfi.app",
    ],
    shareTitle: "Mon score financier Coach FI",
    dialogAria: "Partagez votre score financier",
    close: "Fermer",
    scoreTitle: "Score de santé financière",
    status: (score) => (score >= 80 ? "Excellent" : score >= 55 ? "En bonne forme" : "En progrès"),
    outOf: "sur 100 points",
    streak: (count) => `Série de ${count} jours`,
    stats: { score: "Score", streak: "Série", best: "Record" },
    poweredBy: "coachfi.app · Propulsé par Solana",
    share: "Partager",
    copied: "Copié !",
    copyText: "Copier le texte",
  },
  zh: {
    shareText: (score, streak) => [
      `我的财务健康得分：${score}/100 🎯`,
      streak > 0 ? `连续学习 ${streak} 天 🔥` : "",
      "正在用 Coach FI 养成真正的理财习惯。",
      "",
      "免费试用 → coachfi.app",
    ],
    shareTitle: "我的 Coach FI 财务得分",
    dialogAria: "分享你的财务得分",
    close: "关闭",
    scoreTitle: "财务健康得分",
    status: (score) => (score >= 80 ? "优秀" : score >= 55 ? "状态良好" : "成长中"),
    outOf: "满分 100 分",
    streak: (count) => `连续 ${count} 天`,
    stats: { score: "得分", streak: "连胜", best: "最佳" },
    poweredBy: "coachfi.app · 由 Solana 提供支持",
    share: "分享",
    copied: "已复制！",
    copyText: "复制文字",
  },
  hi: {
    shareText: (score, streak) => [
      `मेरा वित्तीय सेहत स्कोर: ${score}/100 🎯`,
      streak > 0 ? `${streak} दिन की सीखने की स्ट्रीक 🔥` : "",
      "Coach FI के साथ पैसे की असली आदतें बना रहा/रही हूं।",
      "",
      "मुफ़्त आज़माएं → coachfi.app",
    ],
    shareTitle: "मेरा Coach FI वित्तीय स्कोर",
    dialogAria: "अपना वित्तीय स्कोर शेयर करें",
    close: "बंद करें",
    scoreTitle: "वित्तीय सेहत स्कोर",
    status: (score) => (score >= 80 ? "बहुत बढ़िया" : score >= 55 ? "अच्छी स्थिति" : "बढ़ रहा है"),
    outOf: "100 पॉइंट में से",
    streak: (count) => `${count} दिन की स्ट्रीक`,
    stats: { score: "स्कोर", streak: "स्ट्रीक", best: "सर्वश्रेष्ठ" },
    poweredBy: "coachfi.app · Solana द्वारा संचालित",
    share: "शेयर करें",
    copied: "कॉपी हो गया!",
    copyText: "टेक्स्ट कॉपी करें",
  },
  "pt-BR": {
    shareText: (score, streak) => [
      `Minha pontuação de saúde financeira: ${score}/100 🎯`,
      streak > 0 ? `Sequência de aprendizado de ${streak} dias 🔥` : "",
      "Criando hábitos financeiros de verdade com o Coach FI.",
      "",
      "Experimente grátis → coachfi.app",
    ],
    shareTitle: "Minha pontuação financeira no Coach FI",
    dialogAria: "Compartilhe sua pontuação financeira",
    close: "Fechar",
    scoreTitle: "Pontuação de saúde financeira",
    status: (score) => (score >= 80 ? "Excelente" : score >= 55 ? "Em boa forma" : "Em evolução"),
    outOf: "de 100 pontos",
    streak: (count) => `Sequência de ${count} dias`,
    stats: { score: "Pontuação", streak: "Sequência", best: "Recorde" },
    poweredBy: "coachfi.app · Com tecnologia Solana",
    share: "Compartilhar",
    copied: "Copiado!",
    copyText: "Copiar texto",
  },
  tr: {
    shareText: (score, streak) => [
      `Finansal sağlık puanım: ${score}/100 🎯`,
      streak > 0 ? `${streak} günlük öğrenme serisi 🔥` : "",
      "Coach FI ile gerçek para alışkanlıkları kuruyorum.",
      "",
      "Ücretsiz dene → coachfi.app",
    ],
    shareTitle: "Coach FI finans puanım",
    dialogAria: "Finans puanını paylaş",
    close: "Kapat",
    scoreTitle: "Finansal sağlık puanı",
    status: (score) => (score >= 80 ? "Mükemmel" : score >= 55 ? "İyi durumda" : "Gelişiyor"),
    outOf: "100 puan üzerinden",
    streak: (count) => `${count} günlük seri`,
    stats: { score: "Puan", streak: "Seri", best: "En iyi" },
    poweredBy: "coachfi.app · Solana altyapısıyla",
    share: "Paylaş",
    copied: "Kopyalandı!",
    copyText: "Metni kopyala",
  },
};

export function ShareScoreCard({ score, open, onClose }: ShareScoreCardProps) {
  const { streak } = useStreak();
  const { locale } = useLanguage();
  const copy = pickLocalized(shareScoreCopy, locale);
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
            className="fixed inset-0 z-50 bg-text/50 backdrop-blur-sm"
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
              <div className="relative bg-surface-brand px-6 pb-8 pt-6 text-text">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={copy.close}
                  className="absolute right-4 top-4 rounded-full p-1 opacity-70 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X className="h-5 w-5" />
                </button>

                <p className="text-xs font-black uppercase tracking-widest opacity-70">Coach FI</p>
                <p className="mt-1 text-sm font-bold opacity-80">{copy.scoreTitle}</p>

                {/* Score ring */}
                <div className="mt-5 flex items-center gap-5">
                  <div className="relative grid h-24 w-24 place-items-center">
                    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r="42" fill="none" stroke="var(--cf-surface)" strokeWidth="8" />
                      <circle
                        cx="48" cy="48" r="42"
                        fill="none"
                        stroke="var(--cf-grape)"
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
