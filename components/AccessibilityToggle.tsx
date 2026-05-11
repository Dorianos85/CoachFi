"use client";

import { Eye, Type } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type TextScale = "normal" | "large" | "xlarge";

const COPY: Record<Locale, { contrast: string; textSize: string; normal: string; large: string; xlarge: string }> = {
  en: { contrast: "Contrast", textSize: "Text size", normal: "A", large: "A+", xlarge: "A++" },
  pl: { contrast: "Kontrast", textSize: "Rozmiar tekstu", normal: "A", large: "A+", xlarge: "A++" },
  ja: { contrast: "コントラスト", textSize: "文字サイズ", normal: "A", large: "A+", xlarge: "A++" },
};

const scaleOptions: Array<{ value: TextScale; key: "normal" | "large" | "xlarge" }> = [
  { value: "normal", key: "normal" },
  { value: "large", key: "large" },
  { value: "xlarge", key: "xlarge" },
];

export function AccessibilityToggle({
  highContrast,
  textScale = "normal",
  largeText,
  onToggleContrast,
  onTextScaleChange,
  onToggleLargeText,
  compact = false
}: {
  highContrast: boolean;
  textScale?: TextScale;
  largeText?: boolean;
  onToggleContrast: () => void;
  onTextScaleChange?: (scale: TextScale) => void;
  onToggleLargeText?: () => void;
  compact?: boolean;
}) {
  const { locale } = useLanguage();
  const copy = COPY[locale];
  const activeScale = largeText && textScale === "normal" ? "large" : textScale;

  function handleScale(next: TextScale) {
    if (onTextScaleChange) {
      onTextScaleChange(next);
      return;
    }
    if (next !== "normal") onToggleLargeText?.();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant={highContrast ? "accent" : "outline"}
        size={compact ? "sm" : "default"}
        onClick={onToggleContrast}
        aria-pressed={highContrast}
        aria-label={copy.contrast}
      >
        <Eye className="h-4 w-4" aria-hidden="true" />
        <span className={compact ? "hidden sm:inline" : ""}>{copy.contrast}</span>
      </Button>

      <div
        className="inline-flex min-h-10 flex-wrap items-stretch rounded-lg border border-primary/15 bg-white shadow-sm"
        role="group"
        aria-label={copy.textSize}
      >
        <span className={cn("hidden items-center gap-1.5 px-2 text-xs font-black text-muted md:inline-flex", compact && "sr-only")}>
          <Type className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          {copy.textSize}
        </span>
        {scaleOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleScale(option.value)}
            aria-pressed={activeScale === option.value}
            className={cn(
              "min-h-10 px-3 py-2 text-sm font-black leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              activeScale === option.value ? "bg-primary text-white" : "text-muted hover:bg-primary/8 hover:text-text",
              option.value === "xlarge" && "text-base"
            )}
          >
            {copy[option.key]}
          </button>
        ))}
      </div>
    </div>
  );
}
