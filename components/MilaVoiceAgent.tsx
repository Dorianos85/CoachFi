"use client";

import Script from "next/script";
import { Mic, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { MilaAvatar } from "@/components/MilaAvatar";
import { useConsent } from "@/context/ConsentContext";
import { useLanguage } from "@/context/LanguageContext";
import { mockUser } from "@/data/mockUser";
import { localeAgentLanguage } from "@/lib/i18n";
import { beginAgentConversation, endAgentConversation } from "@/lib/signInGate";
import { getTokenBalance } from "@/lib/tokens";
import { getDisplayName, getUser } from "@/lib/user";
import { getMilaAgentId } from "@/lib/mila-voice";
import { getApiCredentials } from "@/lib/client/api-credentials";
import { CONSENT_CHANGED_EVENT, hasConsentFor, readStoredConsent } from "@/lib/consent";
import { useProductStorage } from "@/lib/use-product-storage";

// P0: no durable consent/quota ledger yet. Never load a live provider widget.
const LIVE_VOICE_ENABLED = false;

const AGENT_ID = getMilaAgentId();
const TEXT_ONLY_KEY = "coachfi-agent-text-only";
const LAUNCHER_DOCK_CLASS = "mila-launcher-dock pointer-events-none fixed bottom-[calc(7rem+env(safe-area-inset-bottom,0px))] right-[calc(1rem+env(safe-area-inset-right,0px))] z-[45] max-w-[calc(100vw-2rem)] md:right-[calc(1.5rem+env(safe-area-inset-right,0px))] lg:bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))]";

const agentRoutes = {
  home: "/",
  diagnosis: "/health-check",
  healthCheck: "/health-check",
  learn: "/learn",
  learning: "/learn",
  coach: "/coach",
  inflation: "/inflation",
  quiz: "/quiz",
  review: "/review",
  rewards: "/rewards",
  accessibility: "/accessibility",
  voiceDemo: "/voice-demo",
  kids: "/kids",
  partner: "/partner",
  vault: "/vault",
} as const;

const pageLabels: Record<string, string> = {
  "/": "home dashboard",
  "/health-check": "financial diagnosis",
  "/learn": "learning path",
  "/coach": "AI coach chat",
  "/inflation": "inflation simulator",
  "/quiz": "quiz",
  "/review": "spaced repetition review",
  "/rewards": "rewards and certificates",
  "/accessibility": "accessibility mode",
  "/voice-demo": "voice demo",
  "/kids": "kids mode",
  "/partner": "partner portal",
  "/vault": "long-term vault",
};

type AgentRouteKey = keyof typeof agentRoutes;

type ConvaiConfig = {
  clientTools?: Record<string, (args?: Record<string, unknown>) => unknown>;
};

type ConvaiCallEvent = Event & {
  detail?: {
    config?: ConvaiConfig;
  };
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "elevenlabs-convai": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "agent-id"?: string;
          "signed-url"?: string;
          "dynamic-variables"?: string;
          "override-language"?: string;
          "override-first-message"?: string;
          "override-text-only"?: string;
          "server-location"?: string;
          "text-input"?: string;
          "text-contents"?: string;
          transcript?: string;
          "mic-muting"?: string;
          dismissible?: string;
          "end-confirmation"?: string;
          "worklet-path-raw-audio-processor"?: string;
          "worklet-path-audio-concat-processor"?: string;
          "worklet-path-libsamplerate"?: string;
          "override-config"?: string;
          "avatar-image-url"?: string;
          variant?: string;
        },
        HTMLElement
      >;
    }
  }
}

function normalizeRouteKey(value: string) {
  return value.trim().replace(/[\s_-]/g, "").toLowerCase();
}

function resolveAgentPath(args?: Record<string, unknown>) {
  const rawRoute = typeof args?.route === "string" ? args.route : undefined;
  const rawPage = typeof args?.page === "string" ? args.page : undefined;
  const rawPath = typeof args?.path === "string" ? args.path : undefined;
  const requested = rawRoute ?? rawPage ?? rawPath ?? "home";
  const normalized = normalizeRouteKey(requested);

  const matchedRoute = Object.entries(agentRoutes).find(
    ([key, path]) => normalizeRouteKey(key) === normalized || normalizeRouteKey(path) === normalized
  );

  if (matchedRoute) return matchedRoute[1];

  if (requested.startsWith("/") && Object.values(agentRoutes).includes(requested as (typeof agentRoutes)[AgentRouteKey])) {
    return requested;
  }

  return null;
}

const WIDGET_FRAME_STYLE = `
  :host {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 1300;
    pointer-events: none;
  }
  elevenlabs-convai {
    opacity: 0;
    pointer-events: none;
  }
  :host([data-open]) {
    display: block;
    pointer-events: auto;
  }
  :host([data-open]) elevenlabs-convai {
    opacity: 1;
    pointer-events: auto;
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100dvh;
    transform: none !important;
    z-index: 1300 !important;
  }
`;

const WIDGET_MODAL_STYLE = `
  .overlay {
    align-items: center !important;
    justify-content: center !important;
  }
  .sheet {
    position: relative !important;
    inset: auto !important;
    flex-shrink: 0 !important;
    margin: auto !important;
    width: min(56rem, calc(100vw - 3rem)) !important;
    max-width: min(56rem, calc(100vw - 3rem)) !important;
    height: min(40rem, calc(100dvh - 5rem)) !important;
    max-height: min(40rem, calc(100dvh - 5rem)) !important;
  }
  .sheet .scale-\\[0\\.1667\\] {
    scale: 0.25 !important;
    top: 8px !important;
    left: 12px !important;
  }
`;

function MilaWidgetFrame({
  children,
  onReady,
  open,
}: {
  children: React.ReactNode;
  onReady: () => void;
  open: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!shadowRef.current) {
      shadowRef.current = host.attachShadow({ mode: "closed" });
    }
    setShadowRoot(shadowRef.current);
    onReady();
  }, [onReady]);

  return (
    <div ref={hostRef} data-mila-voice="" data-open={open ? "" : undefined}>
      {shadowRoot
        ? createPortal(
            <>
              <style>{WIDGET_FRAME_STYLE}</style>
              {children}
            </>,
            shadowRoot
          )
        : null}
    </div>
  );
}

function widgetRoot(widget: HTMLElement) {
  return widget.shadowRoot;
}

function widgetIsShowing(widget: HTMLElement) {
  const root = widgetRoot(widget);
  if (!root) return false;
  return [...root.querySelectorAll("button, h1, p")].some((node) => {
    if (!(node instanceof HTMLElement)) return false;
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return (
      rect.width > 8 &&
      rect.height > 8 &&
      rect.bottom > 0 &&
      rect.top < window.innerHeight &&
      rect.right > 0 &&
      rect.left < window.innerWidth &&
      style.display !== "none" &&
      style.visibility !== "hidden"
    );
  });
}

const NEUTRAL_FRAME = 'url("/brand/mila/mila-head-neutral.svg")';
const TALK_FRAME = 'url("/brand/mila/mila-head-talk.svg")';
const MOUTH_FRAME_MS = 1000 / 7;

function startMouthAnimation(root: ShadowRoot) {
  if (root.querySelector("[data-mila-mouth]")) return;
  const marker = document.createElement("span");
  marker.dataset.milaMouth = "";
  marker.hidden = true;
  root.appendChild(marker);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let mouthOpen = true;
  let lastFlip = 0;

  const tick = (now: number) => {
    if (!marker.isConnected) return;
    window.requestAnimationFrame(tick);

    const faces = [...root.querySelectorAll<HTMLElement>('div[style*="mila-head"]')];
    const speaking = faces.some((face) => {
      const ring = face.previousElementSibling;
      if (!(ring instanceof HTMLElement)) return false;
      const scale = /scale\(([\d.]+)\)/.exec(ring.style.transform);
      return !!scale && Number(scale[1]) > 1.001;
    });

    if (!speaking) mouthOpen = true;
    else if (!reduceMotion && now - lastFlip >= MOUTH_FRAME_MS) {
      mouthOpen = !mouthOpen;
      lastFlip = now;
    }

    const frame = speaking && (reduceMotion || mouthOpen) ? TALK_FRAME : NEUTRAL_FRAME;
    const wantsTalk = frame === TALK_FRAME;
    for (const face of faces) {
      if (face.style.backgroundImage.includes("mila-head-talk") !== wantsTalk) {
        face.style.backgroundImage = frame;
      }
    }
  };

  window.requestAnimationFrame(tick);
}

function applyConversationLayout(widget: HTMLElement) {
  const root = widgetRoot(widget);
  if (!root) return;
  if (!root.querySelector("style[data-mila-modal]")) {
    const style = document.createElement("style");
    style.dataset.milaModal = "";
    style.textContent = WIDGET_MODAL_STYLE;
    root.appendChild(style);
  }
  startMouthAnimation(root);
}

function revealWidget(widget: HTMLElement) {
  applyConversationLayout(widget);
  widget.style.setProperty("opacity", "1", "important");
  widget.style.setProperty("visibility", "visible", "important");
  widget.style.setProperty("pointer-events", "auto", "important");
  const root = widget.getRootNode();
  if (root instanceof ShadowRoot && root.host instanceof HTMLElement) {
    root.host.dataset.open = "";
  }
}

function hideWidget(widget: HTMLElement) {
  widget.style.removeProperty("opacity");
  widget.style.removeProperty("visibility");
  widget.style.removeProperty("pointer-events");
  const root = widget.getRootNode();
  if (root instanceof ShadowRoot && root.host instanceof HTMLElement) {
    delete root.host.dataset.open;
  }
}

function clickStartCall(widget: HTMLElement, startLabel: string) {
  const root = widgetRoot(widget);
  if (!root) return false;
  const normalizeLabel = (value: string) => value.trim().replace(/\s+/g, " ");
  const label = normalizeLabel(startLabel);
  if (!label) return false;
  const start = [...root.querySelectorAll("button")].find((button) =>
    !button.disabled && (
      normalizeLabel(button.getAttribute("aria-label") ?? "") === label ||
      normalizeLabel(button.textContent ?? "") === label
    )
  );
  // Match only the requested idle voice or text start control, never an end-call button.
  if (!start) return false;
  start.click();
  return true;
}

export function MilaVoiceFab() {
  const { locale } = useLanguage();
  if (!LIVE_VOICE_ENABLED) return (
    <p role="status" className="sr-only" data-testid="mila-live-disabled">
      {locale === "pl" ? "Rozmowy głosowe Mili są wyłączone w tej wersji. Skorzystaj z lokalnego czatu tekstowego; odczyt lokalnym głosem wymaga kliknięcia." : "Mila live voice conversations are disabled in this version. Use the local text chat; local voice reading requires a click."}
    </p>
  );
  return <LiveMilaVoiceFab />;
}

// Not mounted while P0 hard-off is active: no storage-derived provider payload.
function LiveMilaVoiceFab() {
  const { storage } = useProductStorage();
  const router = useRouter();
  const pathname = usePathname();
  const widgetRef = useRef<HTMLElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const lastClosedWidgetRef = useRef<HTMLElement | null>(null);
  const launchTimerRef = useRef<number | null>(null);
  const voiceWatchRef = useRef<number | null>(null);
  const tokenRequestRef = useRef<AbortController | null>(null);
  const { locale, t } = useLanguage();
  const { loaded, requiredAccepted, hasOptionalConsent } = useConsent();
  const [signedUrl, setSignedUrl] = useState("");
  const [agentId, setAgentId] = useState(AGENT_ID);
  const [widgetConfig, setWidgetConfig] = useState("");
  const [tokenBalance, setTokenBalance] = useState(mockUser.tokenBalance);
  const [userName, setUserName] = useState(mockUser.name);
  const [userGoal, setUserGoal] = useState(mockUser.mainFinancialGoal);
  const [textOnly, setTextOnly] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [widgetFrameReady, setWidgetFrameReady] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [callStatus, setCallStatus] = useState("");
  const [widgetEpoch, setWidgetEpoch] = useState(0);
  const closeConversation = useCallback((reason = "", expectedWidget?: HTMLElement) => {
    const widget = widgetRef.current;
    if (expectedWidget && expectedWidget !== widget) return;
    if (widget && lastClosedWidgetRef.current === widget) return;
    lastClosedWidgetRef.current = widget;
    if (launchTimerRef.current != null) window.clearInterval(launchTimerRef.current);
    launchTimerRef.current = null;
    if (voiceWatchRef.current != null) window.clearInterval(voiceWatchRef.current);
    voiceWatchRef.current = null;
    if (widget) hideWidget(widget);
    if (storage.isCurrent()) endAgentConversation("voice", storage);
    setCallOpen(false);
    setCallStatus(reason === "error" ? t.common.error : "");
    // Disconnecting the old custom element invokes SDK session/media cleanup.
    setWidgetEpoch((epoch) => epoch + 1);
    window.requestAnimationFrame(() => { if (storage.isCurrent()) launcherRef.current?.focus({ preventScroll: true }); });
  }, [t.common.error, storage]);
  const markWidgetFrameReady = useCallback(() => setWidgetFrameReady(true), []);
  const enabled = LIVE_VOICE_ENABLED && storage.isCurrent() && loaded && requiredAccepted && hasOptionalConsent("aiCoach") && hasOptionalConsent("voice");
  const currentPage = pageLabels[pathname] ?? (pathname.replace("/", "") || "home dashboard");

  useEffect(() => {
    const refreshLocalContext = () => {
      if (!storage.isCurrent()) return;
      const user = getUser(storage);
      setUserName(getDisplayName(user));
      setUserGoal(user.goal.trim() || mockUser.mainFinancialGoal);
      setTokenBalance(getTokenBalance(storage));
      setTextOnly(storage.getItem(TEXT_ONLY_KEY) === "true");
    };

    refreshLocalContext();
    window.addEventListener("storage", refreshLocalContext);
    window.addEventListener("coachfi-user", refreshLocalContext);
    window.addEventListener("coachfi-tokens", refreshLocalContext);
    return () => {
      window.removeEventListener("storage", refreshLocalContext);
      window.removeEventListener("coachfi-user", refreshLocalContext);
      window.removeEventListener("coachfi-tokens", refreshLocalContext);
    };
  }, [storage]);

  useEffect(() => {
    const clearSession = () => {
      tokenRequestRef.current?.abort();
      tokenRequestRef.current = null;
      setSignedUrl("");
      setWidgetConfig("");
      closeConversation();
    };
    const onConsentChange = () => {
      if (!storage.isCurrent() || !hasConsentFor(readStoredConsent(storage), ["aiCoach", "voice"])) clearSession();
    };
    window.addEventListener(CONSENT_CHANGED_EVENT, onConsentChange);
    if (!enabled) clearSession();
    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, onConsentChange);
      tokenRequestRef.current?.abort();
    };
  }, [enabled, closeConversation, storage]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    tokenRequestRef.current = controller;
    void (async () => {
      const credentials = await getApiCredentials(["aiCoach", "voice"], controller.signal);
      if (!storage.isCurrent() || !credentials || controller.signal.aborted) return;
      try {
        const response = await fetch("/api/mila-token", {
          method: "POST",
          cache: "no-store",
          headers: credentials.headers,
          body: JSON.stringify({ consent: credentials.consent }),
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = await response.json() as { signedUrl?: string; agentId?: string; widgetConfig?: unknown };
        if (!storage.isCurrent() || controller.signal.aborted || !hasConsentFor(readStoredConsent(storage), ["aiCoach", "voice"])) return;
        setSignedUrl(data.signedUrl?.trim() ?? "");
        setAgentId(data.agentId?.trim() || AGENT_ID);
        setWidgetConfig(data.widgetConfig ? JSON.stringify(data.widgetConfig) : "");
      } catch {
        if (storage.isCurrent() && !controller.signal.aborted) {
          setSignedUrl("");
          setWidgetConfig("");
        }
      }
    })();
    return () => {
      controller.abort();
      if (tokenRequestRef.current === controller) tokenRequestRef.current = null;
    };
  }, [enabled, storage]);

  const agentContext = useMemo(
    () => ({
      app_name: "Coach FI",
      locale,
      current_path: pathname,
      current_page: currentPage,
      accessibility_mode: pathname.startsWith("/accessibility"),
      text_only_mode: textOnly,
      user_name: userName,
      user_goal: userGoal,
      financial_health_score: mockUser.financialHealthScore,
      current_stage: mockUser.currentStage,
      savings_goal: mockUser.savingsGoal,
      completed_stages: mockUser.completedStages,
      token_balance: tokenBalance,
      agent_role:
        "Support, reading and financial education assistant. Explain calmly, avoid financial advice, and guide users to Coach FI pages.",
    }),
    [currentPage, locale, pathname, textOnly, tokenBalance, userGoal, userName]
  );

  const dynamicVariables = useMemo(() => JSON.stringify(agentContext), [agentContext]);
  const widgetTextContents = useMemo(
    () => JSON.stringify({ start_call: t.voiceAgent.fab, start_chat: t.voiceAgent.startChat, end_call: t.voiceAgent.end }),
    [t.voiceAgent.fab, t.voiceAgent.startChat, t.voiceAgent.end]
  );
  const widgetKey = `${signedUrl || agentId}-${locale}-${textOnly ? "text" : "voice"}-${widgetConfig ? "cfg" : "nocfg"}-${widgetEpoch}`;

  useEffect(() => {
    if (!callOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      closeConversation();
    };
    window.addEventListener("keydown", onEscape, true);
    return () => window.removeEventListener("keydown", onEscape, true);
  }, [callOpen, closeConversation]);

  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget || !enabled) return;
    const frameRoot = widget.getRootNode();

    const navigate = (path: string) => {
      router.push(path);
      return { ok: true, path, page: pageLabels[path] ?? path };
    };

    const handleCall = (event: Event) => {
      const callEvent = event as ConvaiCallEvent;
      const config = callEvent.detail?.config;
      if (!config) return;

      if (voiceWatchRef.current == null) {
        let idleTicks = 0;
        if (!storage.isCurrent()) return;
        beginAgentConversation("voice", storage);
        voiceWatchRef.current = window.setInterval(() => {
          if (++idleTicks >= 40) closeConversation("error", widget);
        }, 500);
      }

      config.clientTools = {
        ...config.clientTools,
        navigateToCoachFIPage: (args) => {
          const path = resolveAgentPath(args);
          if (!path) {
            return {
              ok: false,
              error: "Unsupported Coach FI route",
              allowed_routes: Object.keys(agentRoutes),
            };
          }
          return navigate(path);
        },
        openHealthCheck: () => navigate("/health-check"),
        openInflation: () => navigate("/inflation"),
        openLearningPath: () => navigate("/learn"),
        openQuiz: () => navigate("/quiz"),
        openRewards: () => navigate("/rewards"),
        openAccessibilityMode: () => navigate("/accessibility"),
        openVoiceDemo: () => navigate("/voice-demo"),
        getCoachFIContext: () => ({
          ok: true,
          context: agentContext,
          readable_summary:
            `User is on ${agentContext.current_page}. Financial Health Score is ${agentContext.financial_health_score}. ` +
            `Current stage is ${agentContext.current_stage}. Savings goal is ${agentContext.savings_goal}.`,
        }),
        setCoachFIAgentTextMode: (args) => {
          const enabledTextOnly = args?.enabled !== false;
          if (!storage.isCurrent() || !storage.setItem(TEXT_ONLY_KEY, String(enabledTextOnly)) || !storage.isCurrent()) return { ok: false, error: "Session changed" };
          setTextOnly(enabledTextOnly);
          return { ok: true, text_only_mode: enabledTextOnly };
        },
      };
    };

    // These are CoachFI adapter events, not undocumented provider event names.
    const handleStatus = (event: Event) => {
      if (widgetRef.current !== widget) return;
      const status = (event as CustomEvent<{ status?: string }>).detail?.status;
      if (status === "connected") {
        if (voiceWatchRef.current != null) window.clearInterval(voiceWatchRef.current);
        voiceWatchRef.current = null;
      } else if (status === "disconnected") {
        closeConversation("", widget);
      }
    };
    const handleEnded = (event: Event) => {
      closeConversation((event as CustomEvent<{ reason?: string }>).detail?.reason, widget);
    };
    const handleDismiss = (event: Event) => {
      const button = event.composedPath().find((node) => node instanceof HTMLButtonElement);
      if (!(button instanceof HTMLButtonElement) || button.getAttribute("aria-label") !== "Dismiss") return;
      event.preventDefault();
      event.stopPropagation();
      closeConversation("", widget);
    };

    widget.addEventListener("elevenlabs-convai:call", handleCall);
    widget.addEventListener("coachfi-mila:status", handleStatus);
    widget.addEventListener("coachfi-mila:ended", handleEnded);
    widget.addEventListener("click", handleDismiss, true);

    // Watch shadow DOM for the specific ElevenLabs quota error message
    let observer: MutationObserver | null = null;
    let quotaTimer: ReturnType<typeof setTimeout> | null = null;
    const attachObserver = (root: ShadowRoot) => {
      observer = new MutationObserver(() => {
        const text = root.textContent ?? "";
        if (text.includes("exceeds your quota limit")) {
          if (quotaTimer) return;
          quotaTimer = setTimeout(() => {
            if ((root.textContent ?? "").includes("exceeds your quota limit")) {
              setQuotaExceeded(true);
            }
            quotaTimer = null;
          }, 1500);
        }
      });
      observer.observe(root, { subtree: true, childList: true, characterData: true });
    };
    const pollForShadow = window.setInterval(() => {
      if (widget.shadowRoot) {
        attachObserver(widget.shadowRoot);
        window.clearInterval(pollForShadow);
      }
    }, 200);
    setTimeout(() => window.clearInterval(pollForShadow), 10000);

    return () => {
      widget.removeEventListener("elevenlabs-convai:call", handleCall);
      widget.removeEventListener("coachfi-mila:status", handleStatus);
      widget.removeEventListener("coachfi-mila:ended", handleEnded);
      widget.removeEventListener("click", handleDismiss, true);
      observer?.disconnect();
      if (quotaTimer) clearTimeout(quotaTimer);
      window.clearInterval(pollForShadow);
      queueMicrotask(() => {
        if (widget.isConnected) return;
        // A new keyed widget must not inherit an open, idle full-screen frame.
        if (frameRoot instanceof ShadowRoot && frameRoot.host instanceof HTMLElement) {
          delete frameRoot.host.dataset.open;
        }
        if (lastClosedWidgetRef.current !== widget) {
          setCallOpen(false);
          setCallStatus("");
        }
        if (voiceWatchRef.current == null) return;
        window.clearInterval(voiceWatchRef.current);
        voiceWatchRef.current = null;
        if (storage.isCurrent()) endAgentConversation("voice", storage);
      });
    };
  }, [agentContext, enabled, router, widgetFrameReady, widgetKey, closeConversation, storage]);

  if (!AGENT_ID || !enabled || !signedUrl) return null;

  if (quotaExceeded) {
    return (
      <div className={LAUNCHER_DOCK_CLASS}>
        <div className="pointer-events-auto max-w-[280px] rounded-2xl border border-primary/15 bg-white px-5 py-4 shadow-soft">
          <p className="text-sm font-black text-text">{t.voiceAgent.title} — {t.common.error}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-muted">
            {t.voiceAgent.statusDisconnected}{" "}
            <a href="/coach" className="font-black text-primary underline">
              {t.nav.coach} →
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        id="elevenlabs-convai-widget"
        src="/elevenlabs/convai-widget.js?v=coachfi-close-20261013"
        strategy="afterInteractive"
      />
      {!callOpen && (
        <div className={LAUNCHER_DOCK_CLASS}>
          <div className="pointer-events-auto flex flex-col items-end gap-2">
            <button
              type="button"
              ref={launcherRef}
              data-testid="mila-launcher"
              aria-label={t.voiceAgent.openAriaLabel}
              title={t.voiceAgent.fab}
              onClick={() => {
                const widget = widgetRef.current;
                if (!widget || !widgetRoot(widget)) {
                  setCallStatus(t.common.loading);
                  return;
                }
                revealWidget(widget);
                setCallOpen(true);
                const startLabel = textOnly ? t.voiceAgent.startChat : t.voiceAgent.fab;
                let opened = clickStartCall(widget, startLabel);
                const startedAt = Date.now();
                const timer = window.setInterval(() => {
                  const current = widgetRef.current;
                  if (current !== widget) {
                    window.clearInterval(timer);
                    launchTimerRef.current = null;
                    return;
                  }
                  revealWidget(current);
                  if (!opened) opened = clickStartCall(current, startLabel);
                  if (opened && widgetIsShowing(current)) {
                    window.clearInterval(timer);
                    launchTimerRef.current = null;
                    setCallStatus("");
                    setCallOpen(true);
                    return;
                  }
                  if (Date.now() - startedAt > 4000) {
                    window.clearInterval(timer);
                    launchTimerRef.current = null;
                    closeConversation("error", current);
                  }
                }, 200);
                launchTimerRef.current = timer;
              }}
              className="grid h-14 w-14 place-items-center rounded-full bg-black text-white shadow-lg transition hover:bg-black/85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus focus-visible:ring-offset-2"
            >
              <MilaAvatar size="sm" className="shadow-sm ring-2 ring-white" />
              <span className="sr-only">
                {t.voiceAgent.fab}
              </span>
            </button>
            {callStatus ? (
              <p role="status" aria-live="polite" className="max-w-[280px] rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-text shadow-lg">
                {callStatus}
              </p>
            ) : null}
          </div>
        </div>
      )}
      {callOpen ? (
        <button
          type="button"
          data-testid="mila-end-conversation"
          aria-label={t.voiceAgent.endAriaLabel}
          onClick={() => closeConversation()}
          className="fixed right-[calc(1rem+env(safe-area-inset-right,0px))] top-[calc(1rem+env(safe-area-inset-top,0px))] z-[1500] inline-flex min-h-12 items-center gap-2 rounded-full bg-black px-4 py-3 text-sm font-black text-white shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          <X className="h-5 w-5" aria-hidden="true" />
          {t.voiceAgent.end}
        </button>
      ) : null}
      <MilaWidgetFrame onReady={markWidgetFrameReady} open={callOpen}>
      <elevenlabs-convai
        ref={widgetRef}
        key={widgetKey}
        {...(widgetConfig ? { "override-config": widgetConfig } : {})}
        signed-url={signedUrl}
        server-location="us"
        avatar-image-url="/brand/mila/mila-head-neutral.svg"
        dynamic-variables={dynamicVariables}
        override-language={localeAgentLanguage[locale]}
        override-first-message={t.voiceAgent.firstMessage}
        text-input="true"
        text-contents={widgetTextContents}
        transcript="true"
        mic-muting="true"
        dismissible="true"
        end-confirmation="false"
        {...(textOnly ? { "override-text-only": "true" } : {})}
        worklet-path-raw-audio-processor="/elevenlabs-worklets/rawAudioProcessor.js"
        worklet-path-audio-concat-processor="/elevenlabs-worklets/audioConcatProcessor.js"
      />
      </MilaWidgetFrame>
    </>
  );
}

export function MilaVoiceAgent({ compact: _compact = false }: { compact?: boolean }) {
  const { locale, t } = useLanguage();
  const va = t.voiceAgent;

  return (
    <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-soft">
      <h2 className="flex items-center gap-2 text-base font-black text-text">
        <Mic className="h-4 w-4 text-primary" aria-hidden="true" />
        {va.title}
      </h2>
      <p className="mt-3 text-sm font-semibold leading-6 text-muted">
        {locale === "pl" ? "Rozmowy głosowe z zewnętrzną Milą są teraz wyłączone. W czacie możesz korzystać z lokalnych przykładów i odczytu na kliknięcie, jeśli urządzenie ma lokalny głos." : "External Mila voice conversations are currently disabled. Chat offers local examples and click-to-read when a local device voice is available."}
      </p>
      <div className="mt-4 flex items-center gap-3 rounded-xl bg-primary/5 p-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white">
          <Mic className="h-5 w-5" />
        </div>
        <p className="text-xs font-bold text-text">
          {va.fab}
          <span className="mt-0.5 block text-[11px] font-semibold text-muted">
            {locale === "pl" ? "Bez połączenia z dostawcą głosu" : "No connection to a voice provider"}
          </span>
        </p>
      </div>
    </div>
  );
}
