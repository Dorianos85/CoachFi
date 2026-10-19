"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Send, Sparkles, Volume2, Zap } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { SectionHeader } from "@/components/SectionHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { MilaAvatar } from "@/components/MilaAvatar";
import { Button } from "@/components/ui/button";
import { useConsent } from "@/context/ConsentContext";
import { useVoice } from "@/context/VoiceContext";
import { useLanguage } from "@/context/LanguageContext";
import { getLocalizedContent } from "@/lib/localizedContent";
import { beginAgentConversation, endAgentConversation, getAgentConversationStatus, subscribeSignInProgress } from "@/lib/signInGate";
import { cn } from "@/lib/utils";
import { getApiCredentials } from "@/lib/client/api-credentials";
import { CONSENT_CHANGED_EVENT, hasConsentFor, readStoredConsent } from "@/lib/consent";
import { useProductStorage } from "@/lib/use-product-storage";
import { STORAGE_OWNER_CHANGED_EVENT, type PersonalStorageHandle } from "@/lib/product-storage";

// External providers stay disabled until durable consent and quota controls exist.
const EXTERNAL_CHAT_ENABLED = false;

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
  onFallback: () => void,
  signal: AbortSignal
) {
  try {
    const credentials = await getApiCredentials(["aiCoach"], signal);
    if (!credentials || signal.aborted) { if (!signal.aborted) onFallback(); return; }
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: credentials.headers,
      body: JSON.stringify({ message, history, locale, mode: "external", consent: credentials.consent }),
      signal,
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

    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done || signal.aborted) break;
      onChunk(decoder.decode(value, { stream: true }));
    }
    if (signal.aborted) { await reader.cancel(); return; }
    onDone();
  } catch {
    if (!signal.aborted) onFallback();
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
  const { storage } = useProductStorage();
  const { locale, t } = useLanguage();
  const copy = getLocalizedContent(locale).coach;
  const { hasOptionalConsent, openSettings } = useConsent();
  const { isPlaying: voicePlaying, currentText: spokenText, stop: stopVoice } = useVoice();
  const [messages, setMessages] = useState<ChatMessage[]>(
    copy.initialMessages.map((text) => ({ role: "coach", text }))
  );
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLive, setIsLive] = useState<boolean | null>(null); // null = unknown
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const agentConversation = useRef(false);
  const timePaused = useRef(false);
  const [timeWarning, setTimeWarning] = useState(false);
  const [view] = useState(() => ({ version: 0, active: false, owner: null as PersonalStorageHandle | null }));
  const [viewTicket, setViewTicket] = useState(0);
  const workGeneration = useRef(0);
  const workActive = useRef(false);
  const sendTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localStreamStop = useRef<(() => void) | null>(null);
  const chatRequest = useRef<AbortController | null>(null);

  // API history for context (only user/assistant pairs)
  const apiHistory = useRef<{ role: "user" | "assistant"; content: string }[]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    setMessages(copy.initialMessages.map((text) => ({ role: "coach", text })));
    apiHistory.current = [];
  }, [locale, storage]);

  const cancelWork = useCallback(() => {
    workGeneration.current += 1;
    if (sendTimer.current !== null) clearTimeout(sendTimer.current);
    sendTimer.current = null;
    localStreamStop.current?.();
    localStreamStop.current = null;
    chatRequest.current?.abort();
    chatRequest.current = null;
    workActive.current = false;
  }, []);

  function isCurrentView() {
    try { return view.active && view.owner === storage && viewTicket === view.version && storage.isCurrent(); }
    catch { return false; }
  }

  useLayoutEffect(() => {
    const version = ++view.version;
    view.active = true;
    setViewTicket(version);
    if (view.owner !== storage) {
      view.owner = storage;
      cancelWork();
      agentConversation.current = false;
      timePaused.current = false;
      setTimeWarning(false);
      setInput("");
      setMessages(copy.initialMessages.map(text => ({ role: "coach", text })));
      apiHistory.current = [];
    }
    return () => {
      if (view.version === version) { view.active = false; view.version += 1; }
    };
  }, [locale, storage, view, cancelWork]);

  useEffect(() => {
    const updateTime = () => {
      if (!view.active || view.owner !== storage) return;
      try {
        if (!storage.isCurrent()) return;
        const status = getAgentConversationStatus(storage);
        if (status === "ready" || status === "counting") return;
      } catch { /* A failed counter leaves local educational replies available. */ }
      timePaused.current = true;
      agentConversation.current = false;
      setTimeWarning(true);
    };
    const unsubscribe = subscribeSignInProgress(updateTime);
    updateTime();
    return unsubscribe;
  }, [storage, view]);

  useEffect(() => {
    const revoke = () => {
      if (!view.active || view.owner !== storage) return;
      cancelWork();
      stopVoice();
      setIsTyping(false);
      setIsLive(false);
      setMessages((previous) => previous.map((message) => message.streaming ? { ...message, streaming: false } : message));
    };
    const ownerChanged = () => { if (!storage.isCurrent()) revoke(); };
    window.addEventListener(CONSENT_CHANGED_EVENT, revoke);
    window.addEventListener(STORAGE_OWNER_CHANGED_EVENT, ownerChanged);
    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, revoke);
      window.removeEventListener(STORAGE_OWNER_CHANGED_EVENT, ownerChanged);
      if (view.owner === storage) {
        cancelWork();
        if (agentConversation.current) {
          agentConversation.current = false;
          try { if (storage.isCurrent()) endAgentConversation("coach", storage); }
          catch { timePaused.current = true; }
        }
      }
    };
  }, [cancelWork, stopVoice, storage, view]);

  useEffect(() => {
    cancelWork();
    setIsTyping(false);
  }, [locale, cancelWork]);

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

  function finalizeMessage() {
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last?.streaming) {
        updated[updated.length - 1] = { ...last, streaming: false };
      }
      return updated;
    });
  }

  function addStreamingPlaceholder() {
    setMessages((prev) => [...prev, { role: "coach", text: "", streaming: true }]);
  }

  function sendMessage(userText: string) {
    if (!userText.trim() || workActive.current || !isCurrentView()) return;
    workActive.current = true;
    const generation = ++workGeneration.current;
    const active = () => isCurrentView() && workGeneration.current === generation;
    if (!agentConversation.current && !timePaused.current) {
      try {
        beginAgentConversation("coach", storage);
        if (!active()) { workActive.current = false; return; }
        agentConversation.current = true;
      } catch {
        timePaused.current = true;
        agentConversation.current = false;
        if (!active()) { workActive.current = false; return; }
        setTimeWarning(true);
      }
    }
    if (!active()) { workActive.current = false; return; }
    setInput("");
    setMessages((previous) => [...previous, { role: "user", text: userText }]);
    apiHistory.current.push({ role: "user", content: userText });
    setIsTyping(true);
    sendTimer.current = setTimeout(() => {
      sendTimer.current = null;
      if (!active()) return;
      addStreamingPlaceholder();
      const localReply = () => {
        if (!active()) return;
        setIsLive(false);
        const fallback = copy.quickReplies[userText] ?? copy.fallback;
        localStreamStop.current = simulateStream(fallback,
          (chunk) => { if (active()) appendChunk(chunk); },
          () => {
            if (!active()) return;
            localStreamStop.current = null;
            apiHistory.current.push({ role: "assistant", content: fallback });
            finalizeMessage();
            workActive.current = false;
            setIsTyping(false);
          });
      };

      if (!EXTERNAL_CHAT_ENABLED || !hasConsentFor(readStoredConsent(storage), ["aiCoach"])) {
        localReply();
        return;
      }
      const controller = new AbortController();
      chatRequest.current = controller;
      const historySnapshot = [...apiHistory.current.slice(0, -1)];
      let liveReply = "";
      void streamFromAPI(userText, locale, historySnapshot,
        (chunk) => { if (active()) { liveReply += chunk; appendChunk(chunk); } },
        () => {
          if (!active()) return;
          chatRequest.current = null;
          setIsLive(true);
          apiHistory.current.push({ role: "assistant", content: liveReply });
          finalizeMessage();
          workActive.current = false;
          setIsTyping(false);
        },
        localReply, controller.signal);
    }, 500);
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
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary text-on-primary">
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

      <p role="status" data-testid="mila-provider-disabled" className="mb-4 rounded-lg bg-primary/5 p-3 text-sm text-muted">
        {locale === "pl" ? "Mila odpowiada teraz lokalnymi przykładami edukacyjnymi. Zewnętrzne AI, rozmowy na żywo i mikrofon są wyłączone. Odczyt na kliknięcie działa tylko z lokalnym głosem urządzenia." : "Mila currently replies with local educational examples. External AI, live conversations and microphone input are disabled. Click-to-read uses only a local device voice."}
      </p>
      {timeWarning && (
        <p role="alert" data-testid="coach-time-warning" className="mb-4 rounded-lg border border-warning/40 bg-warning/15 p-3 text-sm text-text">
          {locale === "pl"
            ? "Nie udało się potwierdzić naliczania czasu rozmowy. Licznik w tej rozmowie jest wstrzymany. Lokalne przykłady edukacyjne są nadal dostępne."
            : "Conversation time could not be confirmed. The timer is paused for this conversation. Local educational examples are still available."}
        </p>
      )}
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
                          ? "rounded-tr-sm bg-primary text-on-primary"
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
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => { if (isCurrentView()) setInput(e.target.value); }}
                placeholder={t.coach.placeholder}
                disabled={isTyping}
                aria-label={t.coach.placeholder}
                className="min-h-11 flex-1 rounded-input border-2 border-border bg-white px-4 text-sm font-semibold text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
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
