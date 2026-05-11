"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechState = "idle" | "listening";

interface Options {
  lang?: string;
  onResult: (text: string) => void;
  onError?: (msg: string) => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onstart: (() => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

export function useSpeechInput({ lang = "pl-PL", onResult, onError }: Options) {
  const [state, setState] = useState<SpeechState>("idle");
  const [isSupported, setIsSupported] = useState(false);
  const ref = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    setIsSupported("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  }, []);

  const start = useCallback(() => {
    if (!isSupported) {
      onError?.("Rozpoznawanie mowy niedostępne. Użyj Chrome.");
      return;
    }
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setState("listening");
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const text = e.results[0][0].transcript;
      setState("idle");
      onResult(text);
    };
    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      setState("idle");
      if (e.error === "not-allowed") {
        onError?.("Zezwól na mikrofon: kliknij kłódkę w pasku adresu Chrome → Mikrofon → Zezwól.");
      } else if (e.error === "no-speech") {
        onError?.("Nie wykryto mowy. Spróbuj ponownie.");
      } else {
        onError?.(`Błąd mikrofonu: ${e.error}`);
      }
    };
    recognition.onend = () => setState("idle");

    ref.current = recognition;
    recognition.start();
  }, [isSupported, lang, onResult, onError]);

  const stop = useCallback(() => {
    ref.current?.stop();
    setState("idle");
  }, []);

  useEffect(() => () => { ref.current?.abort(); }, []);

  return { isListening: state === "listening", isSupported, start, stop };
}
