"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useLanguage } from "@/context/LanguageContext";

type VoiceLocale = "pl" | "en" | "ja";

export interface VoiceSpeakOptions {
  locale?: VoiceLocale;
  voiceId?: string;
  modelId?: string;
  speechLang?: string;
}

export const ELEVENLABS_VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", gender: "female" as const, accent: "Calm" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella",  gender: "female" as const, accent: "Soft" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi",   gender: "female" as const, accent: "Strong" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam",   gender: "male"   as const, accent: "Deep" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", gender: "male"   as const, accent: "Warm" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh",   gender: "male"   as const, accent: "Young" },
];

const VOICE_KEY = "coachfi-voice";
const DEFAULT_VOICE = ELEVENLABS_VOICES[0].id;
const TTS_TIMEOUT_MS = 6500;
const MAX_TTS_TEXT_LENGTH = 500;

const SPEECH_LANG_BY_LOCALE: Record<VoiceLocale, string> = {
  pl: "pl-PL",
  en: "en-US",
  ja: "ja-JP",
};

interface VoiceContextValue {
  voiceId: string;
  setVoiceId: (id: string) => void;
  isPlaying: boolean;
  isLoading: boolean;
  currentText: string;
  speak: (text: string, options?: VoiceSpeakOptions) => Promise<void>;
  stop: () => void;
}

const VoiceContext = createContext<VoiceContextValue>({
  voiceId: DEFAULT_VOICE,
  setVoiceId: () => {},
  isPlaying: false,
  isLoading: false,
  currentText: "",
  speak: async () => {},
  stop: () => {},
});

export function VoiceProvider({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();
  const [voiceId, setVoiceIdState] = useState(DEFAULT_VOICE);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Map<string, string>>(new Map());
  const playbackIdRef = useRef(0);

  useEffect(() => {
    const stored = localStorage.getItem(VOICE_KEY);
    if (stored) setVoiceIdState(stored);
  }, []);

  useEffect(() => {
    return () => {
      playbackIdRef.current += 1;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== "undefined") {
        try {
          window.speechSynthesis?.cancel();
        } catch {
          // Browser speech engines can throw during teardown.
        }
      }
      for (const url of audioCacheRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      audioCacheRef.current.clear();
    };
  }, []);

  function setVoiceId(id: string) {
    setVoiceIdState(id);
    localStorage.setItem(VOICE_KEY, id);
  }

  function stop() {
    playbackIdRef.current += 1;
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined") {
      try {
        window.speechSynthesis?.cancel();
      } catch {
        // Browser speech engines can throw during teardown; stopping must stay silent.
      }
    }
    setIsLoading(false);
    setIsPlaying(false);
    setCurrentText("");
  }

  function finishPlayback(playbackId: number) {
    if (playbackIdRef.current !== playbackId) return;
    setIsLoading(false);
    setIsPlaying(false);
    setCurrentText("");
  }

  function pickBrowserVoice(lang: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
    const langPrefix = lang.slice(0, 2).toLowerCase();
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((voice) => voice.lang.toLowerCase() === lang.toLowerCase()) ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith(langPrefix)) ??
      voices.find((voice) => voice.default) ??
      voices[0] ??
      null
    );
  }

  function speakWithBrowser(text: string, lang: string, playbackId: number) {
    return new Promise<void>((resolve) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        resolve();
        return;
      }

      const synth = window.speechSynthesis;
      const utter = new SpeechSynthesisUtterance(text);
      const voice = pickBrowserVoice(lang);

      utter.lang = lang;
      utter.rate = 0.96;
      utter.pitch = 1;
      utter.volume = 1;
      if (voice) utter.voice = voice;

      utter.onend = () => resolve();
      utter.onerror = () => resolve();

      try {
        synth.cancel();
        if (playbackIdRef.current === playbackId) {
          setIsLoading(false);
          setIsPlaying(true);
        }
        synth.speak(utter);
        synth.resume();
      } catch {
        resolve();
        return;
      }

      // Chromium can remain paused after cancel/resume on some Windows setups.
      window.setTimeout(() => {
        try {
          synth.resume();
        } catch {
          resolve();
        }
      }, 250);
    });
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
    const playbackId = playbackIdRef.current + 1;
    playbackIdRef.current = playbackId;
    const selectedLocale = options.locale ?? locale;
    const selectedVoiceId = options.voiceId?.trim() || undefined;
    const selectedModelId = options.modelId?.trim() || undefined;
    const speechLang = options.speechLang ?? SPEECH_LANG_BY_LOCALE[selectedLocale];
    const cacheKey = [
      selectedLocale,
      selectedVoiceId ?? "default",
      selectedModelId ?? "default",
      cleanText,
    ].join("::");

    setIsLoading(true);
    setIsPlaying(false);
    setCurrentText(cleanText);

    try {
      const cachedUrl = audioCacheRef.current.get(cacheKey);
      if (cachedUrl) {
        try {
          await playAudioUrl(cachedUrl, playbackId);
          return;
        } catch {
          audioCacheRef.current.delete(cacheKey);
        }
      }

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: cleanText,
            locale: selectedLocale,
            ...(selectedVoiceId ? { voiceId: selectedVoiceId } : {}),
            ...(selectedModelId ? { modelId: selectedModelId } : {}),
          }),
          signal: controller.signal,
        });
      } finally {
        window.clearTimeout(timeout);
      }

      const contentType = res.headers.get("Content-Type") ?? "";
      if (!res.ok || contentType.includes("application/json")) throw new Error("fallback");
      if (playbackIdRef.current !== playbackId) return;

      const blob = await res.blob();
      if (blob.size === 0) throw new Error("empty audio");
      if (playbackIdRef.current !== playbackId) return;

      const url = URL.createObjectURL(blob);
      audioCacheRef.current.set(cacheKey, url);
      await playAudioUrl(url, playbackId);
    } catch {
      await speakWithBrowser(cleanText, speechLang, playbackId);
      finishPlayback(playbackId);
    }
  }

  return (
    <VoiceContext.Provider value={{ voiceId, setVoiceId, isPlaying, isLoading, currentText, speak, stop }}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  return useContext(VoiceContext);
}
