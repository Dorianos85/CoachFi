"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useStreak } from "@/context/StreakContext";
import { useLanguage } from "@/context/LanguageContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { nextMilestone, reachedMilestone } from "@/lib/streak";
import { cn } from "@/lib/utils";

const streakCopy: LocalizedMap<{
  title: (count: number, hot: boolean) => string;
  aria: (count: number) => string;
  day: (count: number) => string;
  next: (target: number) => string;
  milestone: (count: number) => string;
}> = {
  pl: {
    title: (count, hot) => `${count}-dniowa seria${hot ? " 🔥 W formie!" : ""}`,
    aria: (count) => `${count} dni serii`,
    day: (count) => (count === 1 ? "dzień" : "dni"),
    next: (target) => `Następny cel: ${target} dni`,
    milestone: (count) =>
      count === 66 ? "Kamień milowy: 66 dni! Doceniaj swoją regularność. 🏆" : `Kamień milowy: ${count} dni! 🏆`,
  },
  en: {
    title: (count, hot) => `${count}-day streak${hot ? " 🔥 On fire!" : ""}`,
    aria: (count) => `${count} day streak`,
    day: (count) => (count === 1 ? "day" : "days"),
    next: (target) => `Next milestone: ${target} days`,
    milestone: (count) =>
      count === 66 ? "Milestone: 66 days! Celebrate your consistency. 🏆" : `Milestone: ${count} days! 🏆`,
  },
  ja: {
    title: (count, hot) => `${count}日連続${hot ? " 🔥 好調!" : ""}`,
    aria: (count) => `${count}日連続`,
    day: () => "日",
    next: (target) => `次の目標: ${target}日`,
    milestone: (count) => `マイルストーン: ${count}日! 🏆`,
  },
  es: {
    title: (count, hot) => `Racha de ${count} días${hot ? " 🔥 ¡En llamas!" : ""}`,
    aria: (count) => `Racha de ${count} días`,
    day: (count) => (count === 1 ? "día" : "días"),
    next: (target) => `Próximo hito: ${target} días`,
    milestone: (count) =>
      count === 66 ? "66 días: ¡tu hábito ya es automático! 🏆" : `Hito: ¡${count} días! 🏆`,
  },
  fr: {
    title: (count, hot) => `Série de ${count} jours${hot ? " 🔥 En feu !" : ""}`,
    aria: (count) => `Série de ${count} jours`,
    day: (count) => (count === 1 ? "jour" : "jours"),
    next: (target) => `Prochain palier : ${target} jours`,
    milestone: (count) =>
      count === 66 ? "66 jours : votre habitude est devenue automatique ! 🏆" : `Palier : ${count} jours ! 🏆`,
  },
  zh: {
    title: (count, hot) => `连续 ${count} 天${hot ? " 🔥 势头正旺！" : ""}`,
    aria: (count) => `连续 ${count} 天`,
    day: (count) => (count === 1 ? "天" : "天"),
    next: (target) => `下一个里程碑：${target} 天`,
    milestone: (count) =>
      count === 66 ? "66 天：你的习惯已经自动化！🏆" : `里程碑：${count} 天！🏆`,
  },
  hi: {
    title: (count, hot) => `${count} दिन की स्ट्रीक${hot ? " 🔥 ज़बरदस्त!" : ""}`,
    aria: (count) => `${count} दिन की स्ट्रीक`,
    day: (count) => (count === 1 ? "दिन" : "दिन"),
    next: (target) => `अगला पड़ाव: ${target} दिन`,
    milestone: (count) =>
      count === 66 ? "66 दिन: आपकी आदत अब अपने आप चलती है! 🏆" : `पड़ाव: ${count} दिन! 🏆`,
  },
  "pt-BR": {
    title: (count, hot) => `Sequência de ${count} dias${hot ? " 🔥 Pegando fogo!" : ""}`,
    aria: (count) => `Sequência de ${count} dias`,
    day: (count) => (count === 1 ? "dia" : "dias"),
    next: (target) => `Próximo marco: ${target} dias`,
    milestone: (count) =>
      count === 66 ? "66 dias: seu hábito já é automático! 🏆" : `Marco: ${count} dias! 🏆`,
  },
  tr: {
    title: (count, hot) => `${count} günlük seri${hot ? " 🔥 Alev alev!" : ""}`,
    aria: (count) => `${count} günlük seri`,
    day: (count) => (count === 1 ? "gün" : "gün"),
    next: (target) => `Sonraki hedef: ${target} gün`,
    milestone: (count) =>
      count === 66 ? "66 gün: alışkanlığın artık otomatik! 🏆" : `Hedef: ${count} gün! 🏆`,
  },
};

const streakReadCopy: LocalizedMap<{ loading: string; unavailable: string }> = {
  pl: { loading: "Sprawdzanie serii nauki…", unavailable: "Seria nauki jest niedostępna" },
  en: { loading: "Checking learning streak…", unavailable: "Learning streak unavailable" },
};

export function StreakBadge({ compact = false }: { compact?: boolean }) {
  const { streak, streakStatus } = useStreak();
  const { locale } = useLanguage();
  const copy = pickLocalized(streakCopy, locale);
  const readCopy = pickLocalized(streakReadCopy, locale);
  if (streakStatus === "loading" || streakStatus === "unavailable") {
    const label = readCopy[streakStatus];
    return (
      <span
        role="status"
        aria-label={label}
        title={label}
        className="flex items-center rounded-lg border border-primary/10 bg-white px-3 py-1.5 text-sm font-black text-muted"
      >
        {compact ? "—" : label}
      </span>
    );
  }
  const count = streak.currentStreak;
  const active = count > 0;
  const milestone = reachedMilestone(count);
  const upcoming = nextMilestone(count);
  const tooltip = milestone
    ? copy.milestone(count)
    : upcoming
      ? `${copy.title(count, count >= 7)} • ${copy.next(upcoming)}`
      : copy.title(count, count >= 7);

  return (
    <motion.div
      title={tooltip}
      animate={active ? { scale: [1, 1.08, 1] } : {}}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-black",
        milestone
          ? "border-amber-300 bg-amber-50 text-amber-600 shadow-glow"
          : active
            ? "border-orange-200 bg-orange-50 text-orange-600"
            : "border-primary/10 bg-white text-muted"
      )}
    >
      <span className="text-base leading-none" aria-hidden="true">
        {milestone ? "🏆" : count >= 7 ? "🔥" : count >= 3 ? "⚡" : "✦"}
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={count}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2 }}
          aria-label={copy.aria(count)}
        >
          {count}
          {!compact && <span className="ml-1 text-xs font-bold opacity-70">{copy.day(count)}</span>}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}
