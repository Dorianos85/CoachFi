"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useConsent } from "@/context/ConsentContext";
import { useLanguage } from "@/context/LanguageContext";
import { CONSENT_CHANGED_EVENT } from "@/lib/consent";
import { useProductStorage } from "@/lib/use-product-storage";
import { STORAGE_OWNER_CHANGED_EVENT } from "@/lib/product-storage";
import type { Locale } from "@/lib/i18n";
import { createVoiceResources, startLocalSpeech } from "@/lib/client/local-voice";

export interface VoiceSpeakOptions {
  locale?: Locale;
  userInitiated?: boolean;
  voiceId?: string;
  modelId?: string;
  speechLang?: string;
}

interface VoiceContextValue {
  isPlaying: boolean;
  isLoading: boolean;
  currentText: string;
  speak: (text: string, options?: VoiceSpeakOptions) => Promise<void>;
  stop: () => void;
}

const VoiceContext = createContext<VoiceContextValue>({
  isPlaying: false, isLoading: false, currentText: "", speak: async () => {}, stop: () => {},
});

export function VoiceProvider({ children }: { children: ReactNode }) {
  const { storage } = useProductStorage();
  const { locale } = useLanguage();
  const { consent } = useConsent();
  const [resources] = useState(createVoiceResources);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [voiceError, setVoiceError] = useState(false);

  const stop = useCallback(() => {
    resources.cancel();
    setIsLoading(false);
    setIsPlaying(false);
    setCurrentText("");
    setVoiceError(false);
  }, [resources]);

  useEffect(() => {
    const revoke = () => { resources.cancel(true); stop(); };
    const ownerChanged = () => { if (!storage.isCurrent()) revoke(); };
    // A settings update or withdrawal immediately invalidates playback and cache.
    window.addEventListener(CONSENT_CHANGED_EVENT, revoke);
    window.addEventListener(STORAGE_OWNER_CHANGED_EVENT, ownerChanged);
    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, revoke);
      window.removeEventListener(STORAGE_OWNER_CHANGED_EVENT, ownerChanged);
      resources.cancel(true);
    };
  }, [resources, stop, storage]);

  useEffect(() => {
    resources.cancel(true);
    stop();
  }, [consent, resources, stop, storage]);

  const speak = useCallback(async (text: string, options: VoiceSpeakOptions = {}) => {
    if (!storage.isCurrent()) return;
    stop();
    // External AI/TTS is hard-off in P0. Automatic chat replies remain text.
    if (options.userInitiated !== true || !text.trim()) return;
    const cleanText = text.trim().slice(0, 500);
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setVoiceError(true);
      return;
    }
    const generation = resources.generation;
    setIsLoading(true);
    setCurrentText(cleanText);
    try {
      const utterance = startLocalSpeech(cleanText, options.locale ?? locale, true,
        window.speechSynthesis, (value) => new SpeechSynthesisUtterance(value), (value) => {
          const finish = () => {
            if (!storage.isCurrent() || resources.generation !== generation) return;
            setIsPlaying(false);
            setIsLoading(false);
            setCurrentText("");
          };
          value.onstart = () => {
            if (!storage.isCurrent() || resources.generation !== generation) return;
            setIsLoading(false);
            setIsPlaying(true);
          };
          value.onend = finish;
          value.onerror = () => {
            if (!storage.isCurrent() || resources.generation !== generation) return;
            finish();
            setVoiceError(true);
          };
        });
      if (!utterance) {
        setIsLoading(false);
        setCurrentText("");
        setVoiceError(true);
      }
    } catch {
      setIsLoading(false);
      setIsPlaying(false);
      setCurrentText("");
      setVoiceError(true);
    }
  }, [locale, resources, stop, storage]);

  return (
    <VoiceContext.Provider value={{ isPlaying, isLoading, currentText, speak, stop }}>
      {children}
      {voiceError ? (
        <p role="status" aria-live="polite" className="fixed bottom-24 left-1/2 z-[1500] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-primary/20 bg-white p-4 text-sm font-semibold text-text shadow-soft">
          {locale === "pl"
            ? "Zewnętrzny głos Mili jest wyłączony. Brak odpowiedniego lokalnego głosu na tym urządzeniu; możesz czytać tekst."
            : "Mila's external voice is disabled. No suitable local voice is available on this device; you can read the text."}
        </p>
      ) : null}
    </VoiceContext.Provider>
  );
}

export function useVoice() { return useContext(VoiceContext); }
