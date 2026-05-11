"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useStreak } from "@/context/StreakContext";
import { useLanguage } from "@/context/LanguageContext";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const streakCopy: Record<
  Locale,
  { title: (count: number, hot: boolean) => string; aria: (count: number) => string; day: (count: number) => string }
> = {
  pl: {
    title: (count, hot) => `${count}-dniowa seria${hot ? " 🔥 W formie!" : ""}`,
    aria: (count) => `${count} dni serii`,
    day: (count) => (count === 1 ? "dzień" : "dni"),
  },
  en: {
    title: (count, hot) => `${count}-day streak${hot ? " 🔥 On fire!" : ""}`,
    aria: (count) => `${count} day streak`,
    day: (count) => (count === 1 ? "day" : "days"),
  },
  ja: {
    title: (count, hot) => `${count}日連続${hot ? " 🔥 好調!" : ""}`,
    aria: (count) => `${count}日連続`,
    day: () => "日",
  },
};

export function StreakBadge({ compact = false }: { compact?: boolean }) {
  const { streak } = useStreak();
  const { locale } = useLanguage();
  const copy = streakCopy[locale];
  const count = streak.currentStreak;
  const active = count > 0;

  return (
    <motion.div
      title={copy.title(count, count >= 7)}
      animate={active ? { scale: [1, 1.08, 1] } : {}}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-black",
        active
          ? "border-orange-200 bg-orange-50 text-orange-600"
          : "border-primary/10 bg-white text-muted"
      )}
    >
      <span className="text-base leading-none" aria-hidden="true">
        {count >= 7 ? "🔥" : count >= 3 ? "⚡" : "✦"}
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
