"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { FlagIcon } from "@/components/FlagIcon";
import { useLanguage } from "@/context/LanguageContext";
import { localeLabels, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const locales = Object.keys(localeLabels) as Locale[];
const switcherCopy: Record<Locale, { current: string; select: string }> = {
  pl: { current: "Język", select: "Wybierz język" },
  en: { current: "Language", select: "Select language" },
  ja: { current: "言語", select: "言語を選択" },
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const copy = switcherCopy[locale];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`${copy.current}: ${localeLabels[locale]}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-10 items-center gap-1.5 rounded-lg border border-primary/15 bg-white px-3 py-1.5 text-sm font-bold text-text shadow-sm transition hover:border-primary/40 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Globe className="h-4 w-4 text-primary" aria-hidden="true" />
        <FlagIcon locale={locale} className="h-[14px] w-[21px]" />
        <span className="hidden sm:inline">{localeLabels[locale]}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label={copy.select}
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-1 max-h-[70vh] w-56 overflow-y-auto rounded-xl border border-primary/10 bg-white shadow-lg"
          >
            {locales.map((loc) => (
              <li key={loc}>
                <button
                  type="button"
                  role="option"
                  aria-selected={locale === loc}
                  onClick={() => { setLocale(loc); setOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-sm font-bold transition hover:bg-primary/5",
                    locale === loc ? "bg-primary/10 text-primary" : "text-text"
                  )}
                >
                  <FlagIcon locale={loc} />
                  <span>{localeLabels[loc]}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
