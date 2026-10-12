import type { ReactElement } from "react";

import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function FlagIcon({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <span
      className={cn("inline-flex h-4 w-6 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10", className)}
      aria-hidden="true"
    >
      {flagSvgs[locale]}
    </span>
  );
}

const flagClass = "h-full w-full";

const flagSvgs: Record<Locale, ReactElement> = {
  en: (
    <svg viewBox="0 0 60 40" className={flagClass}>
      <rect width="60" height="40" fill="#fff" />
      {Array.from({ length: 7 }).map((_, index) => (
        <rect key={index} width="60" height="3.1" y={index * 6.15} fill="#B22234" />
      ))}
      <rect width="26" height="21.5" fill="#3C3B6E" />
      {Array.from({ length: 5 }).map((_, y) =>
        Array.from({ length: 6 }).map((__, x) => (
          <circle key={`${x}-${y}`} cx={3 + x * 4} cy={3 + y * 4} r="0.8" fill="#fff" />
        ))
      )}
    </svg>
  ),
  pl: (
    <svg viewBox="0 0 60 40" className={flagClass}>
      <rect width="60" height="20" fill="#fff" />
      <rect width="60" height="20" y="20" fill="#DC143C" />
    </svg>
  ),
  es: (
    <svg viewBox="0 0 60 40" className={flagClass}>
      <rect width="60" height="40" fill="#AA151B" />
      <rect width="60" height="20" y="10" fill="#F1BF00" />
    </svg>
  ),
  fr: (
    <svg viewBox="0 0 60 40" className={flagClass}>
      <rect width="20" height="40" fill="#0055A4" />
      <rect width="20" height="40" x="20" fill="#fff" />
      <rect width="20" height="40" x="40" fill="#EF4135" />
    </svg>
  ),
  zh: (
    <svg viewBox="0 0 60 40" className={flagClass}>
      <rect width="60" height="40" fill="#DE2910" />
      <polygon points="12,7 14,13 20,13 15,16 17,22 12,18 7,22 9,16 4,13 10,13" fill="#FFDE00" />
    </svg>
  ),
  ja: (
    <svg viewBox="0 0 60 40" className={flagClass}>
      <rect width="60" height="40" fill="#fff" />
      <circle cx="30" cy="20" r="11" fill="#BC002D" />
    </svg>
  ),
  hi: (
    <svg viewBox="0 0 60 40" className={flagClass}>
      <rect width="60" height="13.33" fill="#FF9933" />
      <rect width="60" height="13.34" y="13.33" fill="#fff" />
      <rect width="60" height="13.33" y="26.67" fill="#138808" />
      <circle cx="30" cy="20" r="4.5" fill="none" stroke="#000080" strokeWidth="1.4" />
    </svg>
  ),
  "pt-BR": (
    <svg viewBox="0 0 60 40" className={flagClass}>
      <rect width="60" height="40" fill="#009B3A" />
      <polygon points="30,6 53,20 30,34 7,20" fill="#FFDF00" />
      <circle cx="30" cy="20" r="8" fill="#002776" />
    </svg>
  ),
  tr: (
    <svg viewBox="0 0 60 40" className={flagClass}>
      <rect width="60" height="40" fill="#E30A17" />
      <circle cx="24" cy="20" r="10" fill="#fff" />
      <circle cx="28" cy="20" r="8" fill="#E30A17" />
      <polygon points="39,14 40.7,18 45,18 41.5,20.5 42.9,25 39,22.4 35.1,25 36.5,20.5 33,18 37.3,18" fill="#fff" />
    </svg>
  ),
};
