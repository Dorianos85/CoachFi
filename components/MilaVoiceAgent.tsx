"use client";

import Script from "next/script";
import { Mic } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useConsent } from "@/context/ConsentContext";
import { useLanguage } from "@/context/LanguageContext";
import { mockUser } from "@/data/mockUser";
import { beginAgentConversation, endAgentConversation } from "@/lib/signInGate";
import { getTokenBalance } from "@/lib/tokens";
import { getDisplayName, getUser } from "@/lib/user";

const TEXT_ONLY_KEY = "coachfi-agent-text-only";
const INVITE_CODE_KEY = "coachfi-invite-code";

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

type VoicePhase = "idle" | "loading" | "ready" | "denied";

export function MilaVoiceFab() {
  const router = useRouter();
  const pathname = usePathname();
  const widgetRef = useRef<HTMLElement | null>(null);
  const voiceWatchRef = useRef<number | null>(null);
  const { locale, t } = useLanguage();
  const { loaded, requiredAccepted, hasOptionalConsent } = useConsent();
  const [signedUrl, setSignedUrl] = useState("");
  const [tokenBalance, setTokenBalance] = useState(mockUser.tokenBalance);
  const [userName, setUserName] = useState(mockUser.name);
  const [userGoal, setUserGoal] = useState(mockUser.mainFinancialGoal);
  const [textOnly, setTextOnly] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  // Voice session is gated behind an invite code with a hard one-conversation
  // limit, enforced server-side. The signed URL (and thus code consumption)
  // is only ever fetched after an explicit user click — never on mount.
  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [deniedMessage, setDeniedMessage] = useState("");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
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
    const fromQuery = new URLSearchParams(window.location.search).get("code")?.trim().toUpperCase();
    if (fromQuery) {
      localStorage.setItem(INVITE_CODE_KEY, fromQuery);
      setInviteCode(fromQuery);
      return;
    }
    const stored = localStorage.getItem(INVITE_CODE_KEY)?.trim().toUpperCase();
    setInviteCode(stored || null);
  }, []);

  const startVoice = async () => {
    if (!inviteCode || phase === "loading") return;
    setPhase("loading");
    try {
      const res = await fetch(`/api/mila-token?code=${encodeURIComponent(inviteCode)}`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { signedUrl?: string };
        const url = data.signedUrl?.trim();
        if (url) {
          setSignedUrl(url);
          setPhase("ready");
          return;
        }
        setDeniedMessage("Głos chwilowo niedostępny");
        setPhase("denied");
        return;
      }
      if (res.status === 429) {
        setDeniedMessage("Wykorzystałeś już swoją rozmowę głosową");
      } else if (res.status === 403) {
        setDeniedMessage("Nieprawidłowy kod");
      } else {
        setDeniedMessage("Głos chwilowo niedostępny");
      }
      setPhase("denied");
    } catch {
      setDeniedMessage("Głos chwilowo niedostępny");
      setPhase("denied");
    }
  };

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

  // Client tools read the context through a ref so the widget effect below does
  // not re-run (re-attaching listeners/observers) on every token/path change.
  const agentContextRef = useRef(agentContext);
  useEffect(() => {
    agentContextRef.current = agentContext;
  }, [agentContext]);

  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget || !enabled || phase !== "ready") return;

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
        getCoachFIContext: () => {
          const context = agentContextRef.current;
          return {
            ok: true,
            context,
            readable_summary:
              `User is on ${context.current_page}. Financial Health Score is ${context.financial_health_score}. ` +
              `Current stage is ${context.current_stage}. Savings goal is ${context.savings_goal}.`,
          };
        },
        setCoachFIAgentTextMode: (args) => {
          const enabledTextOnly = args?.enabled !== false;
          setTextOnly(enabledTextOnly);
          localStorage.setItem(TEXT_ONLY_KEY, String(enabledTextOnly));
          return { ok: true, text_only_mode: enabledTextOnly };
        },
      };
    };

    widget.addEventListener("elevenlabs-convai:call", handleCall);

    // Watch shadow DOM for the specific ElevenLabs quota error message.
    // The widget animates constantly, so mutations arrive in high-frequency
    // bursts — reading root.textContent on every mutation froze the renderer.
    // Coalesce bursts into one debounced check per second and disconnect for
    // good once the quota message is found.
    let observer: MutationObserver | null = null;
    let quotaTimer: ReturnType<typeof setTimeout> | null = null;
    const attachObserver = (root: ShadowRoot) => {
      observer = new MutationObserver(() => {
        if (quotaTimer) return;
        quotaTimer = setTimeout(() => {
          quotaTimer = null;
          if ((root.textContent ?? "").includes("exceeds your quota limit")) {
            observer?.disconnect();
            observer = null;
            setQuotaExceeded(true);
          }
        }, 1000);
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
  }, [enabled, phase, router]);

  if (!enabled) return null;

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

  if (phase === "denied") {
    return (
      <div className="fixed bottom-6 right-6 z-50 max-w-[280px] rounded-2xl border border-primary/15 bg-white px-5 py-4 shadow-soft">
        <p className="text-sm font-black text-text">Mila — głos niedostępny</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-muted">{deniedMessage}</p>
        <button
          type="button"
          onClick={() => setPhase("idle")}
          className="mt-3 text-xs font-black text-primary underline"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  if (phase === "ready" && signedUrl) {
    return (
      <>
        <Script
          id="elevenlabs-convai-widget"
          src="https://unpkg.com/@elevenlabs/convai-widget-embed"
          strategy="afterInteractive"
        />
        <elevenlabs-convai
          ref={widgetRef}
          key={`${signedUrl}-${locale}-${textOnly ? "text" : "voice"}`}
          signed-url={signedUrl}
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
      </>
    );
  }

  if (!inviteCode) {
    return (
      <div className="fixed bottom-6 right-6 z-50 max-w-[240px] rounded-2xl border border-primary/15 bg-white px-5 py-4 shadow-soft">
        <p className="text-xs font-semibold leading-5 text-muted">Potrzebujesz kodu zaproszeniowego</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startVoice}
      disabled={phase === "loading"}
      title={t.voiceAgent.title}
      aria-label="Rozpocznij rozmowę z Milą"
      className="cf-press fixed bottom-6 right-6 z-50 flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black text-on-primary transition hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-[length:var(--cfx-ring-width)] focus-visible:ring-focus disabled:opacity-60"
    >
      <Mic className="h-4 w-4" aria-hidden="true" />
      {phase === "loading" ? "Łączenie…" : "Rozpocznij rozmowę z Milą"}
    </button>
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
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
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
