"use client";

import Script from "next/script";
import { Mic, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { MilaAvatar } from "@/components/MilaAvatar";
import { useConsent } from "@/context/ConsentContext";
import { useLanguage } from "@/context/LanguageContext";
import { readHealthSnapshot } from "@/context/progressHooks";
import { withOptionalConsents } from "@/lib/consent";
import { getAllStageProgress } from "@/lib/learningProgress";
import { localeAgentLanguage, pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { beginAgentConversation, endAgentConversation } from "@/lib/signInGate";
import { getTokenBalance } from "@/lib/tokens";
import { getDisplayName, getUser } from "@/lib/user";
import { getMilaAgentId } from "@/lib/mila-voice";

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
  // Yield Vault and Partner are hidden from menus, so Mila does not steer users there either.
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

const STAGE_LABELS: Record<string, string> = {
  "money-mindset": "Money Mindset",
  "saving-habit": "Saving Habit",
  inflation: "Inflation & Purchasing Power",
  "credit-rates": "Credit & Interest Rates",
  "emergency-fund": "Emergency Fund",
  "long-term-investing": "Long-term Investing",
  retirement: "Retirement",
  "family-plan": "Family Plan",
};

/** Real learning context for Mila — never demo values. */
function readLearningContext() {
  const health = readHealthSnapshot();
  const stages = getAllStageProgress();
  const completed = stages.filter((stage) => stage.status === "completed");
  const current = stages.find((stage) => stage.status !== "completed" && stage.status !== "locked");
  return {
    score: health ? health.score : null,
    scoreDate: health ? health.createdAt.slice(0, 10) : null,
    completedStages: completed.length,
    currentStage: current ? (STAGE_LABELS[current.stageId] ?? current.stageId) : null,
  };
}

const CONSENT_PROMPT: LocalizedMap<{ title: string; body: string; enable: string; later: string; settings: string }> = {
  en: {
    title: "Talk to Mila?",
    body: "Mila answers with AI (Anthropic) and speaks with ElevenLabs. To start, allow the AI coach and voice consents. You can turn them off any time under Consents.",
    enable: "Allow and start",
    later: "Not now",
    settings: "Consent settings",
  },
  pl: {
    title: "Porozmawiać z Milą?",
    body: "Mila odpowiada dzięki AI (Anthropic) i mówi głosem ElevenLabs. Aby zacząć, włącz zgody na coacha AI i głos. Możesz je wyłączyć w każdej chwili w Zgodach.",
    enable: "Zgadzam się i zaczynam",
    later: "Nie teraz",
    settings: "Ustawienia zgód",
  },
  es: {
    title: "¿Hablar con Mila?",
    body: "Mila responde con IA (Anthropic) y habla con ElevenLabs. Para empezar, permite los consentimientos de coach IA y voz. Puedes desactivarlos cuando quieras en Consentimientos.",
    enable: "Permitir y empezar",
    later: "Ahora no",
    settings: "Ajustes de consentimiento",
  },
  fr: {
    title: "Parler à Mila ?",
    body: "Mila répond grâce à l'IA (Anthropic) et parle avec ElevenLabs. Pour commencer, autorisez le coach IA et la voix. Vous pouvez les désactiver à tout moment dans Consentements.",
    enable: "Autoriser et commencer",
    later: "Pas maintenant",
    settings: "Réglages des consentements",
  },
  zh: {
    title: "和 Mila 聊聊？",
    body: "Mila 使用 AI（Anthropic）回答，并通过 ElevenLabs 发声。开始前请允许 AI 教练和语音授权。你可以随时在“授权”中关闭。",
    enable: "允许并开始",
    later: "以后再说",
    settings: "授权设置",
  },
  ja: {
    title: "Milaと話しますか？",
    body: "MilaはAI（Anthropic）で回答し、ElevenLabsの音声で話します。始めるにはAIコーチと音声の同意を許可してください。「同意」からいつでもオフにできます。",
    enable: "許可して始める",
    later: "今はしない",
    settings: "同意の設定",
  },
  hi: {
    title: "Mila से बात करें?",
    body: "Mila AI (Anthropic) से जवाब देती है और ElevenLabs की आवाज़ में बोलती है। शुरू करने के लिए AI कोच और आवाज़ की सहमति दें। आप इन्हें कभी भी सहमतियों में बंद कर सकते हैं।",
    enable: "अनुमति दें और शुरू करें",
    later: "अभी नहीं",
    settings: "सहमति सेटिंग्स",
  },
  "pt-BR": {
    title: "Conversar com a Mila?",
    body: "A Mila responde com IA (Anthropic) e fala com a ElevenLabs. Para começar, permita os consentimentos de coach de IA e voz. Você pode desativá-los a qualquer momento em Consentimentos.",
    enable: "Permitir e começar",
    later: "Agora não",
    settings: "Configurações de consentimento",
  },
  tr: {
    title: "Mila ile konuşalım mı?",
    body: "Mila yapay zekâ (Anthropic) ile yanıt verir ve ElevenLabs sesiyle konuşur. Başlamak için AI koç ve ses onaylarını ver. Onayları istediğin zaman kapatabilirsin.",
    enable: "İzin ver ve başla",
    later: "Şimdi değil",
    settings: "Onay ayarları",
  },
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
  const router = useRouter();
  const pathname = usePathname();
  const widgetRef = useRef<HTMLElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const lastClosedWidgetRef = useRef<HTMLElement | null>(null);
  const launchTimerRef = useRef<number | null>(null);
  const voiceWatchRef = useRef<number | null>(null);
  const { locale, t } = useLanguage();
  const { loaded, requiredAccepted, hasOptionalConsent, consent, updateOptional, openSettings } = useConsent();
  const consentPrompt = pickLocalized(CONSENT_PROMPT, locale);
  const [consentAsk, setConsentAsk] = useState(false);
  // The ~460 kB vendor widget is only fetched once the user shows intent to
  // talk to Mila (hover, focus or tap on the launcher), not on every route.
  const [scriptWanted, setScriptWanted] = useState(false);
  const pendingOpenRef = useRef(false);
  const [pendingTick, setPendingTick] = useState(0);
  const openConversationRef = useRef<() => void>(() => {});
  const [signedUrl, setSignedUrl] = useState("");
  const [agentId, setAgentId] = useState(AGENT_ID);
  const [widgetConfig, setWidgetConfig] = useState("");
  const [tokenBalance, setTokenBalance] = useState(0);
  const [userName, setUserName] = useState("");
  const [userGoal, setUserGoal] = useState("");
  const [learning, setLearning] = useState<ReturnType<typeof readLearningContext>>({
    score: null,
    scoreDate: null,
    completedStages: 0,
    currentStage: null,
  });
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
    endAgentConversation("voice");
    setCallOpen(false);
    setCallStatus(reason === "error" ? t.common.error : "");
    // Disconnecting the old custom element invokes SDK session/media cleanup.
    setWidgetEpoch((epoch) => epoch + 1);
    window.requestAnimationFrame(() => launcherRef.current?.focus({ preventScroll: true }));
  }, [t.common.error]);
  const markWidgetFrameReady = useCallback(() => setWidgetFrameReady(true), []);
  const consentsGiven = hasOptionalConsent("aiCoach") && hasOptionalConsent("voice");
  const enabled = loaded && requiredAccepted && consentsGiven;
  // With only the required terms accepted, the launcher still shows and asks
  // for the AI coach + voice consents inline instead of disappearing.
  const launcherVisible = loaded && requiredAccepted;
  const currentPage = pageLabels[pathname] ?? (pathname.replace("/", "") || "home dashboard");

  useEffect(() => {
    const refreshLocalContext = () => {
      const user = getUser();
      setUserName(getDisplayName(user));
      setUserGoal(user.goal.trim());
      setTokenBalance(getTokenBalance());
      setLearning(readLearningContext());
      setTextOnly(localStorage.getItem(TEXT_ONLY_KEY) === "true");
    };

    refreshLocalContext();
    window.addEventListener("storage", refreshLocalContext);
    window.addEventListener("coachfi-user", refreshLocalContext);
    window.addEventListener("coachfi-tokens", refreshLocalContext);
    window.addEventListener("coachfi-learning", refreshLocalContext);
    window.addEventListener("coachfi-health-check", refreshLocalContext);
    window.addEventListener("coachfi-cloud-synced", refreshLocalContext);
    return () => {
      window.removeEventListener("storage", refreshLocalContext);
      window.removeEventListener("coachfi-user", refreshLocalContext);
      window.removeEventListener("coachfi-tokens", refreshLocalContext);
      window.removeEventListener("coachfi-learning", refreshLocalContext);
      window.removeEventListener("coachfi-health-check", refreshLocalContext);
      window.removeEventListener("coachfi-cloud-synced", refreshLocalContext);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    fetch("/api/mila-token", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { signedUrl?: string; agentId?: string; widgetConfig?: unknown }) => {
        if (cancelled) return;
        setSignedUrl(data.signedUrl?.trim() ?? "");
        setAgentId(data.agentId?.trim() || AGENT_ID);
        setWidgetConfig(data.widgetConfig ? JSON.stringify(data.widgetConfig) : "");
      })
      .catch(() => {
        if (!cancelled) {
          setSignedUrl("");
          setAgentId(AGENT_ID);
          setWidgetConfig("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const agentContext = useMemo(
    () => ({
      app_name: "Coach FI",
      locale,
      current_path: pathname,
      current_page: currentPage,
      accessibility_mode: pathname.startsWith("/accessibility"),
      text_only_mode: textOnly,
      user_name: userName || "not provided",
      user_goal: userGoal || "not provided",
      // Real values only. "none" tells Mila the user has not run the Health Check yet.
      financial_health_score: learning.score === null ? "none" : learning.score,
      financial_health_score_date: learning.scoreDate ?? "none",
      current_stage: learning.currentStage ?? "none",
      savings_goal: userGoal || "none",
      completed_stages: learning.completedStages,
      token_balance: tokenBalance,
      agent_role:
        "Support, reading and financial education assistant. Explain calmly, avoid financial advice, and guide users to Coach FI pages.",
    }),
    [currentPage, learning, locale, pathname, textOnly, tokenBalance, userGoal, userName]
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
        beginAgentConversation("voice");
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
            `User is on ${agentContext.current_page}. ` +
            (agentContext.financial_health_score === "none"
              ? "The user has not run the Financial Health Check yet, so there is no score. "
              : `Financial Health Score is ${agentContext.financial_health_score} out of 100. `) +
            (agentContext.current_stage === "none"
              ? "No learning stage started yet."
              : `Current learning stage is ${agentContext.current_stage}; ${agentContext.completed_stages} stage(s) completed.`),
        }),
        setCoachFIAgentTextMode: (args) => {
          const enabledTextOnly = args?.enabled !== false;
          setTextOnly(enabledTextOnly);
          localStorage.setItem(TEXT_ONLY_KEY, String(enabledTextOnly));
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
        endAgentConversation("voice");
      });
    };
  }, [agentContext, enabled, router, widgetFrameReady, widgetKey, closeConversation]);

  // Open Mila as soon as the lazily loaded widget is ready, when the user asked
  // for her before the script (or the consents) were in place.
  useEffect(() => {
    if (!enabled || !scriptWanted || !pendingOpenRef.current) return;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (!pendingOpenRef.current) {
        window.clearInterval(timer);
        return;
      }
      const widget = widgetRef.current;
      const root = widget ? widgetRoot(widget) : null;
      if (widget && root && root.querySelector("button")) {
        pendingOpenRef.current = false;
        window.clearInterval(timer);
        openConversationRef.current();
        return;
      }
      if (Date.now() - startedAt > 15000) {
        pendingOpenRef.current = false;
        window.clearInterval(timer);
        setCallStatus(t.common.error);
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [enabled, scriptWanted, widgetKey, pendingTick, t.common.error]);

  function openConversation() {
    const widget = widgetRef.current;
    if (!widget || !widgetRoot(widget)) {
      // Widget script not loaded yet: load it and open as soon as it is ready.
      pendingOpenRef.current = true;
      setPendingTick((tick) => tick + 1);
      setScriptWanted(true);
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
  }
  openConversationRef.current = openConversation;

  if (!AGENT_ID || !launcherVisible) return null;

  if (enabled && quotaExceeded) {
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

  const warmUp = () => {
    if (enabled) setScriptWanted(true);
  };

  return (
    <>
      {enabled && scriptWanted ? (
        <Script
          id="elevenlabs-convai-widget"
          src="/elevenlabs/convai-widget.js?v=coachfi-close-20261013"
          strategy="afterInteractive"
        />
      ) : null}
      {!callOpen && (
        <div className={LAUNCHER_DOCK_CLASS}>
          <div className="pointer-events-auto flex flex-col items-end gap-2">
            {consentAsk && !enabled ? (
              <div
                role="dialog"
                aria-labelledby="mila-consent-title"
                data-testid="mila-consent-prompt"
                className="max-w-[300px] rounded-2xl border border-primary/15 bg-white p-4 text-left shadow-lg"
              >
                <p id="mila-consent-title" className="text-sm font-black text-text">{consentPrompt.title}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-muted">{consentPrompt.body}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateOptional(withOptionalConsents(consent?.optional, ["aiCoach", "voice"]));
                      setConsentAsk(false);
                      pendingOpenRef.current = true;
      setPendingTick((tick) => tick + 1);
                      setScriptWanted(true);
                      setCallStatus(t.common.loading);
                    }}
                    className="rounded-full bg-primary px-3 py-2 text-xs font-black text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    {consentPrompt.enable}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsentAsk(false)}
                    className="rounded-full border border-primary/20 px-3 py-2 text-xs font-black text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    {consentPrompt.later}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setConsentAsk(false);
                    openSettings();
                  }}
                  className="mt-2 text-xs font-bold text-primary underline"
                >
                  {consentPrompt.settings}
                </button>
              </div>
            ) : null}
            <button
              type="button"
              ref={launcherRef}
              data-testid="mila-launcher"
              aria-label={t.voiceAgent.openAriaLabel}
              title={t.voiceAgent.fab}
              aria-expanded={consentAsk && !enabled ? true : undefined}
              onPointerEnter={warmUp}
              onFocus={warmUp}
              onTouchStart={warmUp}
              onClick={() => {
                if (!enabled) {
                  setConsentAsk((open) => !open);
                  return;
                }
                openConversation();
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
      {enabled ? (
      <MilaWidgetFrame onReady={markWidgetFrameReady} open={callOpen}>
      <elevenlabs-convai
        ref={widgetRef}
        key={widgetKey}
        {...(widgetConfig ? { "override-config": widgetConfig } : {})}
        {...(signedUrl ? { "signed-url": signedUrl } : { "agent-id": agentId })}
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
      ) : null}
    </>
  );
}

export function MilaVoiceAgent({ compact: _compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();
  const va = t.voiceAgent;

  return (
    <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-soft">
      <h2 className="flex items-center gap-2 text-base font-black text-text">
        <Mic className="h-4 w-4 text-primary" aria-hidden="true" />
        {va.title}
      </h2>
      <p className="mt-3 text-sm font-semibold leading-6 text-muted">
        {va.hint}
      </p>
      <div className="mt-4 flex items-center gap-3 rounded-xl bg-primary/5 p-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white">
          <Mic className="h-5 w-5" />
        </div>
        <p className="text-xs font-bold text-text">
          {va.fab}
          <span className="mt-0.5 block text-[11px] font-semibold text-muted">
            {va.poweredBy}
          </span>
        </p>
      </div>
    </div>
  );
}
