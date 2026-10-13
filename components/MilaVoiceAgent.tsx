"use client";

import Script from "next/script";
import { Mic, Phone } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useConsent } from "@/context/ConsentContext";
import { useLanguage } from "@/context/LanguageContext";
import { mockUser } from "@/data/mockUser";
import { beginAgentConversation, endAgentConversation } from "@/lib/signInGate";
import { getTokenBalance } from "@/lib/tokens";
import { getDisplayName, getUser } from "@/lib/user";

const DEFAULT_AGENT_ID = "agent_2301krbsttc8f21ra1h5vge02071";
const AGENT_ID = (process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ?? DEFAULT_AGENT_ID).trim();
const TEXT_ONLY_KEY = "coachfi-agent-text-only";

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
          "override-text-only"?: string;
          "server-location"?: string;
          "text-input"?: string;
          transcript?: string;
          "mic-muting"?: string;
          dismissible?: string;
          "worklet-path-raw-audio-processor"?: string;
          "worklet-path-audio-concat-processor"?: string;
          "worklet-path-libsamplerate"?: string;
          "override-config"?: string;
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
    pointer-events: auto;
  }
  :host([data-open]) elevenlabs-convai {
    opacity: 1;
    pointer-events: auto;
    z-index: 1300 !important;
  }
  @media (max-width: 1023px) {
    elevenlabs-convai {
      transform: translateY(calc(-8.5rem - env(safe-area-inset-bottom, 0px)));
    }
  }
  @media (min-width: 1024px) {
    elevenlabs-convai {
      transform: translateY(-2rem);
    }
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

function revealWidget(widget: HTMLElement) {
  widget.style.setProperty("opacity", "1", "important");
  widget.style.setProperty("visibility", "visible", "important");
  widget.style.setProperty("pointer-events", "auto", "important");
  const root = widget.getRootNode();
  if (root instanceof ShadowRoot && root.host instanceof HTMLElement) {
    root.host.dataset.open = "";
  }
}

function clickStartCall(widget: HTMLElement) {
  const root = widgetRoot(widget);
  if (!root) return false;
  const start = [...root.querySelectorAll("button")].find((button) =>
    /call|rozmow|połącz|通話/i.test(`${button.getAttribute("aria-label") ?? ""} ${button.textContent ?? ""}`)
  );
  if (!start) return false;
  start.click();
  return true;
}

export function MilaVoiceFab() {
  const router = useRouter();
  const pathname = usePathname();
  const widgetRef = useRef<HTMLElement | null>(null);
  const voiceWatchRef = useRef<number | null>(null);
  const { locale } = useLanguage();
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
  const markWidgetFrameReady = useCallback(() => setWidgetFrameReady(true), []);
  const enabled = loaded && requiredAccepted && hasOptionalConsent("aiCoach") && hasOptionalConsent("voice");
  const currentPage = pageLabels[pathname] ?? (pathname.replace("/", "") || "home dashboard");

  useEffect(() => {
    const refreshLocalContext = () => {
      const user = getUser();
      setUserName(getDisplayName(user));
      setUserGoal(user.goal.trim() || mockUser.mainFinancialGoal);
      setTokenBalance(getTokenBalance());
      setTextOnly(localStorage.getItem(TEXT_ONLY_KEY) === "true");
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

  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget || !enabled) return;

    const navigate = (path: string) => {
      router.push(path);
      return { ok: true, path, page: pageLabels[path] ?? path };
    };

    const buttonLabels = () => {
      const root = widget.shadowRoot;
      if (!root) return null;
      return [...root.querySelectorAll("button")]
        .map((button) => button.getAttribute("aria-label") ?? "")
        .filter(Boolean)
        .sort()
        .join("|");
    };

    let idleLabels = buttonLabels();

    const handleCall = (event: Event) => {
      const callEvent = event as ConvaiCallEvent;
      const config = callEvent.detail?.config;
      if (!config) return;

      if (voiceWatchRef.current == null) {
        const idleAtStart = idleLabels ?? buttonLabels() ?? "";
        let leftIdle = false;
        let idleTicks = 0;
        beginAgentConversation("voice");
        voiceWatchRef.current = window.setInterval(() => {
          const current = buttonLabels();
          if (current == null) return;
          if (!leftIdle) {
            idleTicks += 1;
            if (current !== idleAtStart) leftIdle = true;
            else if (idleTicks >= 40) {
              endAgentConversation("voice");
              if (voiceWatchRef.current != null) window.clearInterval(voiceWatchRef.current);
              voiceWatchRef.current = null;
            }
            return;
          }
            if (current === idleAtStart) {
              endAgentConversation("voice");
              widget.style.removeProperty("opacity");
              widget.style.removeProperty("visibility");
              widget.style.removeProperty("pointer-events");
              setCallOpen(false);
              if (voiceWatchRef.current != null) window.clearInterval(voiceWatchRef.current);
              voiceWatchRef.current = null;
              idleLabels = current;
            }
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
          setTextOnly(enabledTextOnly);
          localStorage.setItem(TEXT_ONLY_KEY, String(enabledTextOnly));
          return { ok: true, text_only_mode: enabledTextOnly };
        },
      };
    };

    widget.addEventListener("elevenlabs-convai:call", handleCall);

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
      observer?.disconnect();
      if (quotaTimer) clearTimeout(quotaTimer);
      window.clearInterval(pollForShadow);
      queueMicrotask(() => {
        if (widget.isConnected || voiceWatchRef.current == null) return;
        window.clearInterval(voiceWatchRef.current);
        voiceWatchRef.current = null;
        endAgentConversation("voice");
      });
    };
  }, [agentContext, enabled, router, widgetFrameReady]);

  if (!AGENT_ID || !enabled) return null;

  if (quotaExceeded) {
    return (
      <div className="fixed bottom-6 right-6 z-50 max-w-[280px] rounded-2xl border border-primary/15 bg-white px-5 py-4 shadow-soft">
        <p className="text-sm font-black text-text">Mila — voice unavailable</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-muted">
          Voice agent quota reached. Chat with Mila in{" "}
          <a href="/coach" className="font-black text-primary underline">
            text mode →
          </a>
        </p>
      </div>
    );
  }

  return (
    <>
      <Script
        id="elevenlabs-convai-widget"
        src="/elevenlabs/convai-widget.js"
        strategy="afterInteractive"
      />
      {!callOpen && (
        <div className="fixed right-3 z-[1400] flex items-center gap-2 rounded-full border border-black/10 bg-white py-1.5 pl-3 pr-1.5 shadow-lg bottom-[calc(7.5rem+env(safe-area-inset-bottom))] lg:bottom-8">
          <span className="text-sm font-semibold text-text">Need help?</span>
          <button
            type="button"
            onClick={() => {
              const widget = widgetRef.current;
              if (!widget || !widgetRoot(widget)) {
                setCallStatus("Mila is still loading. Try again in a moment.");
                return;
              }
              revealWidget(widget);
              let opened = clickStartCall(widget);
              const startedAt = Date.now();
              const timer = window.setInterval(() => {
                const current = widgetRef.current;
                if (!current) return;
                revealWidget(current);
                if (!opened) opened = clickStartCall(current);
                if (widgetIsShowing(current)) {
                  window.clearInterval(timer);
                  setCallStatus("");
                  setCallOpen(true);
                  return;
                }
                if (Date.now() - startedAt > 4000) {
                  window.clearInterval(timer);
                  current.style.removeProperty("opacity");
                  current.style.removeProperty("visibility");
                  current.style.removeProperty("pointer-events");
                  setCallStatus("Mila didn't open. Reload the page and try again.");
                }
              }, 200);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-bold text-white"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Start a call
          </button>
        </div>
      )}
      {callStatus && !callOpen && (
        <p className="fixed right-3 z-[1400] max-w-[16rem] rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-text shadow-lg bottom-[calc(11rem+env(safe-area-inset-bottom))] lg:bottom-24">
          {callStatus}
        </p>
      )}
      <MilaWidgetFrame onReady={markWidgetFrameReady} open={callOpen}>
      <elevenlabs-convai
        ref={widgetRef}
        key={`${signedUrl || agentId}-${locale}-${textOnly ? "text" : "voice"}-${widgetConfig ? "cfg" : "nocfg"}`}
        {...(widgetConfig ? { "override-config": widgetConfig } : {})}
        {...(signedUrl ? { "signed-url": signedUrl } : { "agent-id": agentId })}
        server-location="us"
        dynamic-variables={dynamicVariables}
        override-language={locale}
        text-input="true"
        transcript="true"
        mic-muting="true"
        dismissible="true"
        {...(textOnly ? { "override-text-only": "true" } : {})}
        worklet-path-raw-audio-processor="/elevenlabs-worklets/rawAudioProcessor.js"
        worklet-path-audio-concat-processor="/elevenlabs-worklets/audioConcatProcessor.js"
      />
      </MilaWidgetFrame>
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
