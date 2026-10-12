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
      count === 66 ? "66 dni — nawyk stał się automatyczny! 🏆" : `Kamień milowy: ${count} dni! 🏆`,
  },
  en: {
    title: (count, hot) => `${count}-day streak${hot ? " 🔥 On fire!" : ""}`,
    aria: (count) => `${count} day streak`,
    day: (count) => (count === 1 ? "day" : "days"),
    next: (target) => `Next milestone: ${target} days`,
    milestone: (count) =>
      count === 66 ? "66 days — your habit is automatic! 🏆" : `Milestone: ${count} days! 🏆`,
  },
  ja: {
    title: (count, hot) => `${count}日連続${hot ? " 🔥 好調!" : ""}`,
    aria: (count) => `${count}日連続`,
    day: () => "日",
    next: (target) => `次の目標: ${target}日`,
    milestone: (count) => `マイルストーン: ${count}日! 🏆`,
  },
};

export function StreakBadge({ compact = false }: { compact?: boolean }) {
  const { streak } = useStreak();
  const { locale } = useLanguage();
  const copy = pickLocalized(streakCopy, locale);
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
