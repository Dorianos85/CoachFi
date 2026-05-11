"use client";

import { Loader2, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";

import { useLanguage } from "@/context/LanguageContext";
import { useVoice } from "@/context/VoiceContext";
import { getLocalizedContent } from "@/lib/localizedContent";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  text: string;
  className?: string;
  variant?: "icon" | "pill" | "large";
  label?: string;
  ariaLabel?: string;
  locale?: "pl" | "en" | "ja";
  voiceId?: string;
  modelId?: string;
  speechLang?: string;
}

export function VoiceButton({
  text,
  className,
  variant = "icon",
  label,
  ariaLabel,
  locale: voiceLocale,
  voiceId,
  modelId,
  speechLang,
}: VoiceButtonProps) {
  const { locale } = useLanguage();
  const { isPlaying, isLoading, currentText, speak, stop } = useVoice();
  const copy = getLocalizedContent(locale).voice;
  const [pendingText, setPendingText] = useState<string | null>(null);
  const isThisPlaying = isPlaying && currentText === text;
  const isThisLoading = (isLoading && currentText === text) || (pendingText === text && !isThisPlaying);

  async function handleClick() {
    if (isThisPlaying || isThisLoading) {
      setPendingText(null);
      stop();
    } else {
      setPendingText(text);
      try {
        await speak(text, {
          locale: voiceLocale ?? locale,
          voiceId,
          modelId,
          speechLang,
        });
      } catch {
        // Playback errors are handled by VoiceContext; keep the UI from surfacing raw browser events.
      } finally {
        setPendingText((value) => (value === text ? null : value));
      }
    }
  }

  const displayLabel = label ?? copy.listen;
  const computedAriaLabel = ariaLabel ?? (isThisPlaying ? `${copy.stop}: ${displayLabel}` : `${copy.readAloud}: ${displayLabel}`);
  const icon = isThisLoading ? (
    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
  ) : isThisPlaying ? (
    <VolumeX className="h-4 w-4 animate-pulse" aria-hidden="true" />
  ) : (
    <Volume2 className="h-4 w-4" aria-hidden="true" />
  );

  if (variant === "large") {
    return (
      <button
        type="button"
        onClick={() => void handleClick()}
        aria-label={computedAriaLabel}
        aria-busy={isThisLoading}
        aria-pressed={isThisPlaying}
        aria-live="polite"
        className={cn(
          "flex min-h-14 w-full items-center justify-between gap-4 rounded-lg border px-5 py-4 text-left text-lg font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-4",
          isThisPlaying
            ? "border-primary bg-primary text-white shadow-glow"
            : "border-primary/20 bg-white text-text hover:border-primary/45 hover:bg-primary/5",
          className
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
              isThisPlaying ? "bg-white/18 text-white" : "bg-primary/10 text-primary"
            )}
          >
            {icon}
          </span>
          <span className="min-w-0">
            <span className="block leading-tight">{displayLabel}</span>
            <span className={cn("mt-1 block text-xs font-bold", isThisPlaying ? "text-white/85" : "text-muted")}>
              {isThisLoading ? copy.loading : isThisPlaying ? copy.playing : copy.readAloud}
            </span>
          </span>
        </span>
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={() => void handleClick()}
        aria-label={computedAriaLabel}
        aria-busy={isThisLoading}
        aria-pressed={isThisPlaying}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isThisPlaying
            ? "border-primary bg-primary text-white"
            : "border-primary/20 bg-white text-muted hover:border-primary/40 hover:text-primary",
          className
        )}
      >
        {icon}
        {isThisLoading ? copy.loading : isThisPlaying ? copy.stop : displayLabel}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      aria-label={computedAriaLabel}
      aria-busy={isThisLoading}
      aria-pressed={isThisPlaying}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isThisPlaying
          ? "border-primary bg-primary text-white"
          : "border-primary/20 bg-white text-muted hover:border-primary/40 hover:text-primary",
        className
      )}
    >
      {icon}
    </button>
  );
}
