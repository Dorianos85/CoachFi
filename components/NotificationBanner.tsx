"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useEffect, useState } from "react";

import { requestPermission } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import type { Locale } from "@/lib/i18n";

const COPY: Record<Locale, { aria: string; dismiss: string; title: string; body: string; enable: string; later: string }> = {
  en: {
    aria: "Enable reminders",
    dismiss: "Dismiss",
    title: "Stay on track",
    body: "Get daily reminders to complete your quiz and keep your streak alive.",
    enable: "Enable",
    later: "Not now",
  },
  pl: {
    aria: "Włącz przypomnienia",
    dismiss: "Zamknij",
    title: "Trzymaj rytm",
    body: "Włącz codzienne przypomnienia o quizie i utrzymaj swoją serię.",
    enable: "Włącz",
    later: "Nie teraz",
  },
  ja: {
    aria: "リマインダーを有効にする",
    dismiss: "閉じる",
    title: "ペースを保つ",
    body: "毎日のリマインダーでクイズを完了し、連続記録を守りましょう。",
    enable: "有効にする",
    later: "今はしない",
  },
};

export function NotificationBanner() {
  const { locale } = useLanguage();
  const copy = COPY[locale];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (
      typeof Notification === "undefined" ||
      Notification.permission !== "default" ||
      sessionStorage.getItem("coachfi-notif-dismissed")
    ) return;
    const timer = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    sessionStorage.setItem("coachfi-notif-dismissed", "1");
    setVisible(false);
  }

  async function enable() {
    await requestPermission();
    dismiss();
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="fixed bottom-24 left-3 right-3 z-50 mx-auto max-w-sm rounded-xl border border-primary/15 bg-white p-4 shadow-2xl lg:bottom-6"
          role="alertdialog"
          aria-label={copy.aria}
        >
          <button
            type="button"
            onClick={dismiss}
            aria-label={copy.dismiss}
            className="absolute right-3 top-3 rounded-full p-1 text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black text-text">{copy.title}</p>
              <p className="mt-0.5 text-xs text-muted">
                {copy.body}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button size="sm" onClick={enable} className="w-full">
              {copy.enable}
            </Button>
            <Button size="sm" variant="outline" onClick={dismiss} className="w-full">
              {copy.later}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
