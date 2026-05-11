"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff, Send, Sparkles, Volume2, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { SectionHeader } from "@/components/SectionHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { MilaAvatar } from "@/components/MilaAvatar";
import { Button } from "@/components/ui/button";
import { useConsent } from "@/context/ConsentContext";
import { useVoice } from "@/context/VoiceContext";
import { useLanguage } from "@/context/LanguageContext";
import { getLocalizedContent } from "@/lib/localizedContent";
import { localeSpeechLang } from "@/lib/i18n";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "coach" | "user";
  text: string;
  streaming?: boolean;
}

async function streamFromAPI(
  message: string,
  locale: string,
  history: { role: "user" | "assistant"; content: string }[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onFallback: () => void
) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CoachFI-Consent": "ai-coach",
      },
      body: JSON.stringify({ message, history, locale }),
    });

    if (!res.ok || !res.body) {
      onFallback();
      return;
    }

    const data = res.headers.get("Content-Type") ?? "";
    if (data.includes("application/json")) {
      onFallback();
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onChunk(decoder.decode(value, { stream: true }));
    }
    onDone();
  } catch {
    onFallback();
  }
}

const TYPING_SPEED = 14;

function simulateStream(text: string, onChunk: (chunk: string) => void, onDone: () => void) {
  let i = 0;
  const interval = setInterval(() => {
    i++;
    onChunk(text.slice(i - 1, i));
    if (i >= text.length) {
      clearInterval(interval);
      onDone();
    }
  }, TYPING_SPEED);
  return () => clearInterval(interval);
}

export default function CoachPage() {
  const { locale, t } = useLanguage();
  const copy = getLocalizedContent(locale).coach;
  const { hasOptionalConsent, openSettings } = useConsent();
  const { isPlaying: voicePlaying, currentText: spokenText, speak } = useVoice();
  const [messages, setMessages] = useState<ChatMessage[]>(
    copy.initialMessages.map((text) => ({ role: "coach", text }))
  );
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLive, setIsLive] = useState<boolean | null>(null); // null = unknown
  const [speechError, setSpeechError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // API history for context (only user/assistant pairs)
  const apiHistory = useRef<{ role: "user" | "assistant"; content: string }[]>([]);

  const { isListening, isSupported: speechSupported, start: startListening, stop: stopListening } = useSpeechInput({
    lang: localeSpeechLang[locale],
    onResult: useCallback((text: string) => {
      setSpeechError(null);
      sendMessage(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
    onError: useCallback((msg: string) => setSpeechError(msg), []),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    setMessages(copy.initialMessages.map((text) => ({ role: "coach", text })));
    apiHistory.current = [];
  }, [locale]);

  function appendChunk(chunk: string) {
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last?.streaming) {
        updated[updated.length - 1] = { ...last, text: last.text + chunk };
      }
      return updated;
    });
  }

  function finalizeMessage(textToSpeak?: string) {
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last?.streaming) {
        updated[updated.length - 1] = { ...last, streaming: false };
      }
      return updated;
    });
    if (textToSpeak?.trim()) {
      speak(textToSpeak, { locale });
    }
  }

  function addStreamingPlaceholder() {
    setMessages((prev) => [...prev, { role: "coach", text: "", streaming: true }]);
  }

  function sendMessage(userText: string) {
    if (!userText.trim() || isTyping) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    apiHistory.current.push({ role: "user", content: userText });
    setIsTyping(true);

    setTimeout(() => {
      addStreamingPlaceholder();

      const historySnapshot = [...apiHistory.current.slice(0, -1)]; // exclude just-added user msg
      let liveReply = "";

      if (!hasOptionalConsent("aiCoach")) {
        setIsLive(false);
        const fallback = copy.quickReplies[userText] ?? copy.fallback;
        simulateStream(fallback, appendChunk, () => {
          apiHistory.current.push({ role: "assistant", content: fallback });
          finalizeMessage(fallback);
          setIsTyping(false);
        });
        return;
      }

      streamFromAPI(
        userText,
        locale,
        historySnapshot,
        (chunk) => {
          liveReply += chunk;
          appendChunk(chunk);
        },
        () => {
          setIsLive(true);
          apiHistory.current.push({ role: "assistant", content: liveReply });
          finalizeMessage(liveReply);
          setIsTyping(false);
        },
        () => {
          setIsLive(false);
          const fallback = copy.quickReplies[userText] ?? copy.fallback;
          simulateStream(fallback, appendChunk, () => {
            apiHistory.current.push({ role: "assistant", content: fallback });
            finalizeMessage(fallback);
            setIsTyping(false);
          });
        }
      );
    }, 500 + Math.random() * 300);
  }

  return (
    <section aria-labelledby="coach-title">
      <SectionHeader
        eyebrow={t.coach.eyebrow}
        title={t.coach.title}
        description={t.coach.description}
        readText={messages[messages.length - 1]?.text ?? t.coach.description}
      />

      <div className="mb-5 rounded-2xl border border-primary/12 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary text-white">
              <Volume2 className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-2xl font-black text-text">{copy.heroTitle}</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-muted">
                {copy.heroCopy}
              </p>
            </div>
          </div>
          <VoiceButton
            text={copy.introText}
            label={copy.introButton}
            variant="pill"
            className="shrink-0"
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Chat area */}
        <div className="flex flex-col rounded-2xl border border-primary/10 bg-white shadow-soft">
          {/* Status bar */}
          {isLive !== null && (
            <div className={cn(
              "flex items-center gap-1.5 border-b px-5 py-2 text-xs font-bold",
              isLive
                ? "border-success/20 bg-success/5 text-success"
                : "border-primary/10 bg-primary/3 text-muted"
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full", isLive ? "bg-success animate-pulse" : "bg-muted")} />
              {isLive ? copy.live : copy.offline}
            </div>
          )}

          <div
            className="flex-1 space-y-4 overflow-y-auto p-5"
            style={{ maxHeight: 500 }}
            aria-live="polite"
            aria-label="Coach chat"
          >
            {messages.map((message, index) => (
              <AnimatePresence key={index} mode="wait">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  {message.role === "coach" && (
                    <MilaAvatar
                      size="sm"
                      isSpeaking={!!message.streaming || (voicePlaying && spokenText === message.text)}
                      className="mr-2 mt-1"
                    />
                  )}
                  <div className="group flex max-w-[82%] flex-col gap-1">
                    <div
                      className={cn(
                        "flex items-start gap-2 rounded-2xl px-4 py-3 text-sm font-semibold leading-6",
                        message.role === "user"
                          ? "rounded-tr-sm bg-primary text-white"
                          : "rounded-tl-sm border border-primary/10 bg-primary/5 text-text"
                      )}
                    >
                      <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">
                        {message.text}
                        {message.streaming && (
                          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
                        )}
                      </span>
                      {message.role === "coach" && !message.streaming && message.text && (
                        <VoiceButton
                          text={message.text}
                          variant="icon"
                          label={copy.messageLabel}
                          className="mt-0.5 shrink-0"
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end gap-2"
              >
                <MilaAvatar size="sm" isSpeaking />
                <div className="flex gap-1 rounded-2xl rounded-tl-sm border border-primary/10 bg-primary/5 px-4 py-3">
                  {[0, 0.15, 0.3].map((delay) => (
                    <motion.span
                      key={delay}
                      className="h-2 w-2 rounded-full bg-primary/40"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="border-t border-primary/10 p-3">
            {!hasOptionalConsent("aiCoach") && (
              <div className="mb-3 rounded-lg border border-primary/10 bg-primary/5 p-3 text-xs font-semibold leading-5 text-muted">
                {copy.consentNotice}{" "}
                <button
                  type="button"
                  onClick={openSettings}
                  className="font-black text-primary underline"
                >
                  {copy.changeConsent}
                </button>
              </div>
            )}
            {speechError && (
              <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">
                {speechError}
              </p>
            )}
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex gap-2"
            >
              {speechSupported && (
                <button
                  type="button"
                  onClick={() => { setSpeechError(null); isListening ? stopListening() : startListening(); }}
                  disabled={isTyping}
                  aria-label={isListening ? "Zatrzymaj" : "Mów do Miły"}
                  className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40",
                    isListening
                      ? "border-red-300 bg-red-50 text-red-500 animate-pulse"
                      : "border-primary/15 bg-white text-muted hover:text-primary"
                  )}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              )}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Słucham…" : t.coach.placeholder}
                disabled={isTyping}
                aria-label={t.coach.placeholder}
                className="min-h-11 flex-1 rounded-xl border border-primary/15 bg-white px-4 text-sm font-semibold text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isTyping}
                aria-label={t.coach.send}
                className="h-11 w-11 shrink-0 rounded-xl"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>
          </div>
        </div>

        {/* Quick actions + status */}
        <div className="grid content-start gap-4">
          <div className="rounded-2xl border border-primary/10 bg-white p-5 text-center shadow-soft">
            <MilaAvatar
              size="lg"
              isSpeaking={isTyping || voicePlaying}
              className="mx-auto"
            />
            <p className="mt-3 text-sm font-black uppercase tracking-normal text-primary">
              {voicePlaying ? copy.speaking : isTyping ? copy.answering : copy.ready}
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-muted">
              {copy.voiceNote}
            </p>
          </div>

          <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-soft">
            <h2 className="flex items-center gap-2 text-base font-black text-text">
              <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
              {t.coach.quickActions}
            </h2>
            <div className="mt-3 grid gap-2">
              {copy.quickActions.map((label) => (
                <button
                  key={label}
                  type="button"
                  disabled={isTyping}
                  onClick={() => sendMessage(label)}
                  className="flex w-full items-center gap-2 rounded-xl border border-primary/12 bg-white px-3 py-2.5 text-left text-sm font-bold text-text transition hover:border-primary/35 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-4 rounded-lg bg-primary/5 p-3 text-xs font-semibold leading-5 text-muted">
              {copy.freeQuestionNote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
