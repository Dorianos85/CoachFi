"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { translations, type Locale, type Translations } from "@/lib/i18n";

const LANGUAGE_STORAGE_KEY = "coachfi-locale-v1";
const SUPPORTED_LOCALES = Object.keys(translations) as Locale[];

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const storedLocale = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (isSupportedLocale(storedLocale)) {
        setLocaleState(storedLocale);
      }
    } catch {
      // Language persistence is optional; the app should still render when storage is blocked.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function setLocale(next: Locale) {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      // Ignore storage failures and keep the in-memory locale for this session.
    }
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

function isSupportedLocale(value: string | null): value is Locale {
  return !!value && SUPPORTED_LOCALES.includes(value as Locale);
}
