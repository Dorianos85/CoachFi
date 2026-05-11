"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useVoice } from "@/context/VoiceContext";
import { Button } from "@/components/ui/button";
import { getLocalizedContent } from "@/lib/localizedContent";

interface ReadAloudButtonProps {
  text: string;
  onRead?: (message: string) => void;
}

export function ReadAloudButton({ text, onRead }: ReadAloudButtonProps) {
  const { locale } = useLanguage();
  const { isPlaying, currentText, speak, stop } = useVoice();
  const copy = getLocalizedContent(locale).voice;
  const isThisPlaying = isPlaying && currentText === text;

  function handleClick() {
    if (isThisPlaying) {
      stop();
    } else {
      void speak(text).catch(() => {});
      onRead?.(copy.readAloud);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      aria-label={isThisPlaying ? copy.stop : copy.readAloud}
      className="gap-1.5 shrink-0"
    >
      {isThisPlaying ? (
        <VolumeX className="h-4 w-4 animate-pulse" aria-hidden="true" />
      ) : (
        <Volume2 className="h-4 w-4" aria-hidden="true" />
      )}
      {isThisPlaying ? copy.stop : copy.readAloud}
    </Button>
  );
}
