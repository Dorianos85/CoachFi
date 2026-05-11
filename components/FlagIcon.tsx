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
  ja: (
    <svg viewBox="0 0 60 40" className={flagClass}>
      <rect width="60" height="40" fill="#fff" />
      <circle cx="30" cy="20" r="11" fill="#BC002D" />
    </svg>
  ),
};
