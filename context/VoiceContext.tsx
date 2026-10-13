"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useLanguage } from "@/context/LanguageContext";
import { pickLocalized, type Locale } from "@/lib/i18n";

export interface VoiceSpeakOptions {
  locale?: Locale;
  /** Legacy options are accepted for callers; Mila's voice is resolved on the server. */
  voiceId?: string;
  modelId?: string;
  speechLang?: string;
}

const TTS_TIMEOUT_MS = 22000;
const MAX_TTS_TEXT_LENGTH = 500;
const VOICE_UNAVAILABLE = {
  en: "Mila's voice is temporarily unavailable. You can continue reading and try the audio again.",
  pl: "Głos Mili jest chwilowo niedostępny. Możesz czytać dalej i ponownie spróbować odsłuchu.",
  ja: "Mila の音声は一時的に利用できません。テキストを読み続けて、音声をもう一度お試しください。",
  es: "La voz de Mila no está disponible temporalmente. Puedes seguir leyendo y volver a probar el audio.",
  fr: "La voix de Mila est temporairement indisponible. Vous pouvez continuer à lire et réessayer l'audio.",
  zh: "Mila 的语音暂时不可用。你可以继续阅读，稍后再试音频。",
  hi: "Mila की आवाज़ फ़िलहाल उपलब्ध नहीं है। आप पढ़ना जारी रख सकते हैं और ऑडियो फिर से आज़मा सकते हैं।",
  "pt-BR": "A voz da Mila está temporariamente indisponível. Você pode continuar lendo e tentar o áudio de novo.",
  tr: "Mila'nın sesi geçici olarak kullanılamıyor. Okumaya devam edebilir ve sesi yeniden deneyebilirsin.",
};

interface VoiceContextValue {
  isPlaying: boolean;
  isLoading: boolean;
  currentText: string;
  speak: (text: string, options?: VoiceSpeakOptions) => Promise<void>;
  stop: () => void;
}

const VoiceContext = createContext<VoiceContextValue>({
  isPlaying: false,
  isLoading: false,
  currentText: "",
  speak: async () => {},
  stop: () => {},
});

export function VoiceProvider({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [voiceError, setVoiceError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const audioCacheRef = useRef<Map<string, string>>(new Map());
  const playbackIdRef = useRef(0);

  useEffect(() => {
    return () => {
      playbackIdRef.current += 1;
      requestRef.current?.abort();
      audioRef.current?.pause();
      for (const url of audioCacheRef.current.values()) URL.revokeObjectURL(url);
      audioCacheRef.current.clear();
    };
  }, []);

  function stop() {
    playbackIdRef.current += 1;
    requestRef.current?.abort();
    requestRef.current = null;
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsLoading(false);
    setIsPlaying(false);
    setCurrentText("");
    setVoiceError(false);
  }

  function finishPlayback(playbackId: number) {
    if (playbackIdRef.current !== playbackId) return;
    setIsLoading(false);
    setIsPlaying(false);
    setCurrentText("");
  }

  async function playAudioUrl(url: string, playbackId: number) {
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.volume = 1;
    audio.onended = () => {
      if (playbackIdRef.current !== playbackId) return;
      audioRef.current = null;
      finishPlayback(playbackId);
    };
    audio.onerror = () => {
      if (playbackIdRef.current !== playbackId) return;
      audioRef.current = null;
      setVoiceError(true);
      finishPlayback(playbackId);
    };
    await audio.play();
    if (playbackIdRef.current !== playbackId) {
      audio.pause();
      return;
    }
    setIsLoading(false);
    setIsPlaying(true);
  }

  async function speak(text: string, options: VoiceSpeakOptions = {}) {
    const cleanText = text.trim().slice(0, MAX_TTS_TEXT_LENGTH);
    if (!cleanText) return;
    stop();
    const playbackId = ++playbackIdRef.current;
    const selectedLocale = options.locale ?? locale;
    const cacheKey = [selectedLocale, cleanText].join("::");
    setIsLoading(true);
    setCurrentText(cleanText);

    try {
      const cachedUrl = audioCacheRef.current.get(cacheKey);
      if (cachedUrl) {
        try {
          await playAudioUrl(cachedUrl, playbackId);
          return;
        } catch {
          URL.revokeObjectURL(cachedUrl);
          audioCacheRef.current.delete(cacheKey);
        }
      }
      const controller = new AbortController();
      requestRef.current = controller;
      const timeout = window.setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: cleanText, locale: selectedLocale }),
          signal: controller.signal,
        });
      } finally {
        window.clearTimeout(timeout);
        if (requestRef.current === controller) requestRef.current = null;
      }
      if (!res.ok || !(res.headers.get("Content-Type") ?? "").startsWith("audio/")) {
        throw new Error("Mila voice unavailable");
      }
      if (playbackIdRef.current !== playbackId) return;
      const blob = await res.blob();
      if (blob.size === 0) throw new Error("Empty audio");
      if (playbackIdRef.current !== playbackId) return;
      const url = URL.createObjectURL(blob);
      audioCacheRef.current.set(cacheKey, url);
      await playAudioUrl(url, playbackId);
    } catch {
      if (playbackIdRef.current !== playbackId) return;
      // Keep Mila's identity consistent: recovery is visible text, never a different browser voice.
      setVoiceError(true);
      finishPlayback(playbackId);
    }
  }

  return (
    <VoiceContext.Provider value={{ isPlaying, isLoading, currentText, speak, stop }}>
      {children}
      {voiceError ? (
        <p role="status" aria-live="polite" className="fixed bottom-24 left-1/2 z-[1500] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-primary/20 bg-white p-4 text-sm font-semibold text-text shadow-soft">
          {pickLocalized(VOICE_UNAVAILABLE, locale)}
        </p>
      ) : null}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  return useContext(VoiceContext);
}
