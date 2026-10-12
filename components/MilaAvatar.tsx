"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { useLanguage } from "@/context/LanguageContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface MilaAvatarProps {
  className?: string;
  isSpeaking?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-10 w-10",
  md: "h-36 w-36",
  lg: "h-48 w-48",
};

const avatarCopy: LocalizedMap<{ speaking: string; idle: string }> = {
  pl: { speaking: "Mila mówi", idle: "Avatar Mili, coacha finansowego AI" },
  en: { speaking: "Mila is speaking", idle: "Mila AI financial coach avatar" },
  ja: { speaking: "Milaが話しています", idle: "Mila AI金融コーチのアバター" },
};

const NEUTRAL_FRAME = "/brand/mila/mila-head-neutral.svg";
const TALK_FRAME = "/brand/mila/mila-head-talk.svg";
// DESIGN.md §2.3: talking swaps the talk and neutral frames at ~7 fps.
const MOUTH_FRAME_MS = 1000 / 7;

export function MilaAvatar({ className, isSpeaking = false, size = "md" }: MilaAvatarProps) {
  const { locale } = useLanguage();
  const copy = pickLocalized(avatarCopy, locale);
  const id = useId().replace(/:/g, "");
  const compact = size === "sm";
  const panelId = `mila-panel-${id}`;
  const faceId = `mila-face-${id}`;
  const suitId = `mila-suit-${id}`;
  const glowId = `mila-glow-${id}`;
  const copy = avatarCopy[locale];
  const reduceMotion = useReducedMotion();
  const [mouthOpen, setMouthOpen] = useState(true);

  useEffect(() => {
    if (!isSpeaking || reduceMotion) {
      setMouthOpen(true);
      return;
    }
    const timer = window.setInterval(() => setMouthOpen((open) => !open), MOUTH_FRAME_MS);
    return () => window.clearInterval(timer);
  }, [isSpeaking, reduceMotion]);

  return (
    <div
      role="img"
      aria-label={isSpeaking ? copy.speaking : copy.idle}
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-area-mila",
        sizes[size],
        className
      )}
    >
      <img
        src={isSpeaking && mouthOpen ? TALK_FRAME : NEUTRAL_FRAME}
        alt=""
        className="h-full w-full object-contain p-[8%]"
      />
    </div>
  );
}
