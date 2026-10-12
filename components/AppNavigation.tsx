"use client";

import { motion } from "framer-motion";
import { useGetAccessToken, useIsInitialized, useIsSignedIn, useSignOut } from "@coinbase/cdp-hooks";
import {
  Baby,
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  ChevronDown,
  ChevronRight,
  Coins,
  Gift,
  HeartPulse,
  Home,
  Info,
  LayoutGrid,
  LifeBuoy,
  Loader2,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Swords,
  TrendingUp,
  Trophy,
  Volume2,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { getUser, getDisplayName } from "@/lib/user";
import { getHealthCheck } from "@/lib/healthCheck";
import { getDueCount } from "@/lib/srs";
import { getAllQuestionIds } from "@/lib/allQuestions";

import { AccessibilityToggle, type TextScale } from "@/components/AccessibilityToggle";
import { ConsentManager } from "@/components/ConsentManager";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AccountButton } from "@/components/AccountButton";
import { ModeGate } from "@/components/ModeGate";
import { NotificationBanner } from "@/components/NotificationBanner";
import { OnboardingModal } from "@/components/OnboardingModal";
import { StreakBadge } from "@/components/StreakBadge";
import { Badge } from "@/components/ui/badge";
import { useConsent } from "@/context/ConsentContext";
import { useLanguage } from "@/context/LanguageContext";
import { useMode } from "@/context/ModeContext";
import { clearSignedInName, endLearningSession } from "@/lib/account-sync";
import { pickLocalized, type Locale, type LocalizedMap } from "@/lib/i18n";
import { getLocalizedContent } from "@/lib/localizedContent";
import { hideSavedProgress, isProgressVisible } from "@/lib/progress-visibility";
import { requestSignIn } from "@/lib/signInGate";
import { getTokenBalance } from "@/lib/tokens";
import { cn } from "@/lib/utils";

const cdpEnabled = Boolean(process.env.NEXT_PUBLIC_CDP_PROJECT_ID?.trim());

const ACCOUNT_COPY: LocalizedMap<{ signIn: string; signOut: string }> = {
  en: { signIn: "Sign in", signOut: "Sign out" },
  pl: { signIn: "Zaloguj", signOut: "Wyloguj" },
  ja: { signIn: "ログイン", signOut: "ログアウト" },
};

const navIcons: Record<string, LucideIcon> = {
  home: Home,
  healthCheck: HeartPulse,
  inflation: BarChart3,
  shopping: ShoppingBag,
  crisis: LifeBuoy,
  learn: BookOpen,
  coach: Bot,
  quiz: Trophy,
  challenge: Swords,
  review: RefreshCw,
  cards: LayoutGrid,
  rewards: Gift,
  kids: Baby,
  accessibility: Volume2,
  partner: Building2,
  vault: TrendingUp,
};

const navHrefs: Record<string, string> = {
  home: "/",
  healthCheck: "/health-check",
  inflation: "/inflation",
  shopping: "/shopping",
  crisis: "/crisis",
  learn: "/learn",
  coach: "/coach",
  quiz: "/quiz",
  challenge: "/challenge",
  review: "/review",
  cards: "/cards",
  rewards: "/rewards",
  kids: "/kids",
  accessibility: "/accessibility",
  partner: "/partner",
  vault: "/vault",
};

const scoreMilestones = [25, 50, 75, 100];

type NavKey = keyof typeof navHrefs;

const NAV_LABEL_OVERRIDES: Partial<Record<NavKey, LocalizedMap<string>>> = {
  shopping: {
    en: "Shopping Hygiene",
    pl: "Higiena zakupowa",
    es: "Higiene de compras",
    fr: "Hygiene d'achat",
    zh: "购物卫生",
    ja: "購入衛生",
    hi: "खरीद अनुशासन",
    "pt-BR": "Higiene de compras",
    tr: "Alisveris hijyeni",
  },
  crisis: {
    en: "Crisis Plan",
    pl: "Plan kryzysowy",
    es: "Plan de crisis",
    fr: "Plan de crise",
    zh: "危机计划",
    ja: "危機プラン",
    hi: "संकट योजना",
    "pt-BR": "Plano de crise",
    tr: "Kriz plani",
  },
};

// Primary loop: the 6 destinations a new user needs, always expanded.
// Everything else lives behind a single "More" disclosure — one collapsed
// section beats three, and Partner Portal (B2B) is deliberately absent from
// this consumer sidebar; it's reachable only via a direct link.
const NAV_GROUPS: Array<{
  id: string;
  label: LocalizedMap<string>;
  keys: NavKey[];
  defaultOpen?: boolean;
}> = [
  {
    id: "start",
    label: {
      en: "Start",
      pl: "Start",
      ja: "Daily",
    },
    keys: ["home", "healthCheck", "challenge", "coach", "rewards", "kids"],
    defaultOpen: true,
  },
  {
    id: "more",
    label: {
      en: "More",
      pl: "Więcej",
      ja: "その他",
    },
    keys: ["quiz", "learn", "review", "cards", "inflation", "shopping", "vault", "accessibility"],
  },
];

const KIDS_NAV_GROUPS: Array<{
  id: string;
  label: LocalizedMap<string>;
  keys: NavKey[];
  defaultOpen?: boolean;
}> = [
  {
    id: "kids",
    label: {
      en: "Kids Mode",
      pl: "Kids Mode",
      ja: "Kids Mode",
    },
    keys: ["kids"],
    defaultOpen: true,
  },
];

const FOOTER_COPY: LocalizedMap<{ disclaimer: string; terms: string; privacy: string; consents: string }> = {
  en: {
    disclaimer:
      "Coach FI is an educational application. It does not provide financial advice, investment recommendations or guaranteed returns. It does not teach trading, leverage, futures or speculation. The goal is confidence, saving habits and long-term financial awareness.",
    terms: "Terms",
    privacy: "Privacy",
    consents: "Consents",
  },
  pl: {
    disclaimer:
      "Coach FI to aplikacja edukacyjna. Nie udziela porad finansowych, rekomendacji inwestycyjnych ani gwarancji zysku. Nie uczy tradingu, dźwigni, kontraktów futures ani spekulacji. Celem jest pewność, nawyki oszczędzania i długoterminowa świadomość finansowa.",
    terms: "Regulamin",
    privacy: "Prywatność",
    consents: "Zgody",
  },
  ja: {
    disclaimer:
      "Coach FI は教育アプリです。金融アドバイス、投資推奨、保証されたリターンは提供しません。取引、レバレッジ、先物、投機を教えるものではありません。",
    terms: "規約",
    privacy: "プライバシー",
    consents: "同意",
  },
};

const SHELL_COPY: LocalizedMap<
  {
    skip: string;
    homeAria: string;
    primaryNav: string;
    mobileNav: string;
    mvpBadge: string;
    kidsMode: string;
    changeMode: string;
    demoBadge: string;
  }
> = {
  en: {
    skip: "Skip to main content",
    homeAria: "Go to Coach FI home",
    primaryNav: "Primary navigation",
    mobileNav: "Mobile navigation",
    mvpBadge: "Hackathon MVP",
    kidsMode: "Kids Mode",
    changeMode: "Change mode",
    demoBadge: "Example",
  },
  pl: {
    skip: "Przejdź do głównej treści",
    homeAria: "Przejdź do strony głównej Coach FI",
    primaryNav: "Główna nawigacja",
    mobileNav: "Nawigacja mobilna",
    mvpBadge: "MVP hackathonu",
    kidsMode: "Kids Mode",
    changeMode: "Zmień tryb",
    demoBadge: "Przykład",
  },
  ja: {
    skip: "メインコンテンツへ移動",
    homeAria: "Coach FIホームへ移動",
    primaryNav: "メインナビゲーション",
    mobileNav: "モバイルナビゲーション",
    mvpBadge: "ハッカソンMVP",
    kidsMode: "Kids Mode",
    changeMode: "Change mode",
    demoBadge: "サンプル",
  },
};

/** Illustrative score shown in the sidebar until the user runs the Health Check. */
const DEMO_PLAN_SCORE = 42;
const ACCESSIBILITY_STORAGE_KEY = "coachfi-accessibility-v1";
const TEXT_SCALES: TextScale[] = ["normal", "large", "xlarge"];

export function AppNavigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale, t } = useLanguage();
  const copy = getLocalizedContent(locale);
  const shellCopy = pickLocalized(SHELL_COPY, locale);
  const { requiredAccepted, openSettings } = useConsent();
  const { loaded: modeLoaded, modeRecord, isKidsMode, openSettings: openModeSettings } = useMode();
  const [highContrast, setHighContrast] = useState(false);
  const [textScale, setTextScale] = useState<TextScale>("normal");
  const [accessibilityLoaded, setAccessibilityLoaded] = useState(false);
  const [userName, setUserName] = useState("Your");

  const [reviewDue, setReviewDue] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);
  // null until the user runs the Health Check — the sidebar then shows a demo value.
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const planScore = healthScore ?? DEMO_PLAN_SCORE;
  const footer = pickLocalized(FOOTER_COPY, locale);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { highContrast?: unknown; textScale?: unknown };
        setHighContrast(parsed.highContrast === true);
        if (isTextScale(parsed.textScale)) {
          setTextScale(parsed.textScale);
        }
      }
    } catch {
      // Accessibility preferences still work for the current session if storage is blocked.
    } finally {
      setAccessibilityLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!accessibilityLoaded) return;
    try {
      window.localStorage.setItem(
        ACCESSIBILITY_STORAGE_KEY,
        JSON.stringify({ highContrast, textScale })
      );
    } catch {
      // Ignore persistence errors; the visible controls remain usable.
    }
  }, [accessibilityLoaded, highContrast, textScale]);

  useEffect(() => {
    const user = getUser();
    setUserName(getDisplayName(user));
    setReviewDue(isProgressVisible() ? getDueCount(getAllQuestionIds(locale)) : 0);
    setTokenBalance(getTokenBalance());
    setHealthScore(getHealthCheck()?.score ?? null);
    const onStorage = () => {
      setUserName(getDisplayName(getUser()));
      setTokenBalance(getTokenBalance());
      setReviewDue(isProgressVisible() ? getDueCount(getAllQuestionIds(locale)) : 0);
      setHealthScore(getHealthCheck()?.score ?? null);
    };
    window.addEventListener("coachfi-health-check", onStorage);
    window.addEventListener("storage", onStorage);
    window.addEventListener("coachfi-user", onStorage);
    window.addEventListener("coachfi-tokens", onStorage);
    window.addEventListener("coachfi-cloud-synced", onStorage);
    window.addEventListener("coachfi-learning", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("coachfi-user", onStorage);
      window.removeEventListener("coachfi-tokens", onStorage);
      window.removeEventListener("coachfi-cloud-synced", onStorage);
      window.removeEventListener("coachfi-learning", onStorage);
      window.removeEventListener("coachfi-health-check", onStorage);
    };
  }, [locale]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("text-scale-large", "text-scale-xlarge");

    if (textScale !== "normal") {
      root.classList.add(textScale === "large" ? "text-scale-large" : "text-scale-xlarge");
    }

    return () => {
      root.classList.remove("text-scale-large", "text-scale-xlarge");
    };
  }, [textScale]);

  const getNavItem = (key: NavKey) => {
    const labelOverride = NAV_LABEL_OVERRIDES[key];

    return {
      key,
      href: navHrefs[key],
      label: labelOverride ? pickLocalized(labelOverride, locale) : t.nav[key as keyof typeof t.nav],
      icon: navIcons[key],
    };
  };
  const navGroups = isKidsMode ? KIDS_NAV_GROUPS : NAV_GROUPS;
  const mobileNavKeys: NavKey[] = isKidsMode ? ["kids"] : ["home", "healthCheck", "challenge", "coach", "kids"];
  const mobileNavItems = mobileNavKeys.map(getNavItem);

  return (
    <div
      className={cn(
        "app-shell min-h-screen bg-background text-text",
        highContrast && "high-contrast",
        textScale === "large" && "text-scale-large",
        textScale === "xlarge" && "text-scale-xlarge"
      )}
    >
      <div className="app-grid pointer-events-none fixed inset-x-0 top-0 h-[520px]" aria-hidden="true" />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:font-bold focus:text-text"
      >
        {shellCopy.skip}
      </a>

      <header className="sticky top-0 z-40 border-b border-white/70 bg-background/72 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-2 px-4 py-3 lg:gap-3 lg:px-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3 rounded-lg p-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={shellCopy.homeAria}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary text-base font-black text-white shadow-glow">
              FI
            </span>
            <span className="min-w-0 overflow-hidden">
              <span className="block whitespace-nowrap text-lg font-black leading-tight">Coach FI</span>
              <span className="hidden truncate text-xs font-bold text-muted sm:block">{copy.appSubtitle}</span>
            </span>
          </Link>

          <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2 lg:gap-3">
            {isKidsMode ? (
              <button
                type="button"
                onClick={openModeSettings}
                className="hidden min-h-10 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-black text-text shadow-sm transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:flex"
              >
                <Baby className="h-4 w-4 text-amber-600" aria-hidden="true" />
                {shellCopy.kidsMode}
              </button>
            ) : null}
            {cdpEnabled ? (
              <HeaderProgress tokenBalance={tokenBalance} tokenUnit={t.common.tokenUnit} />
            ) : (
              <>
                <div className="hidden items-center gap-2 rounded-lg border border-primary/10 bg-white/75 px-3 py-2 text-sm font-bold text-text shadow-sm md:flex">
                  <Coins className="h-4 w-4 text-primary" aria-hidden="true" />
                  {tokenBalance} {t.common.tokenUnit}
                </div>
                <StreakBadge compact />
              </>
            )}
            {cdpEnabled ? <HeaderAccount locale={locale} /> : null}
            <LanguageSwitcher />
            <AccessibilityToggle
              highContrast={highContrast}
              textScale={textScale}
              onToggleContrast={() => setHighContrast((value) => !value)}
              onTextScaleChange={setTextScale}
              compact
            />
            <AccountButton />
          </div>
        </div>
      </header>

      <div className="relative mx-auto flex max-w-[1480px] gap-6 px-4 pb-28 pt-6 lg:px-6">
        <aside className="hidden w-64 shrink-0 lg:block" aria-label={shellCopy.primaryNav}>
          <div className="glass-panel sticky top-24 rounded-lg p-3">
            {cdpEnabled ? (
              <SignedInPlanScore
                copy={copy}
                planScore={planScore}
                healthScore={healthScore}
                demoBadge={shellCopy.demoBadge}
              />
            ) : (
              <PlanScoreCard
                copy={copy}
                planScore={planScore}
                healthScore={healthScore}
                demoBadge={shellCopy.demoBadge}
              />
            )}

            <div className="space-y-1.5">
              {navGroups.map((group) => {
                const groupActive = group.keys.some((key) => getIsActive(pathname, navHrefs[key]));
                const links = (
                  <div className="space-y-0.5 px-2 pb-2">
                    {group.keys.map((key) => {
                      const item = getNavItem(key);
                      return (
                        <NavLink
                          key={item.href}
                          item={item}
                          active={getIsActive(pathname, item.href)}
                          badge={key === "review" && reviewDue > 0 ? reviewDue : undefined}
                        />
                      );
                    })}
                  </div>
                );

                return (
                  <details
                    key={group.id}
                    open={groupActive || group.defaultOpen}
                    className="group rounded-lg border border-primary/10 bg-white/55"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      {pickLocalized(group.label, locale)}
                      <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    {links}
                  </details>
                );
              })}
            </div>
          </div>
        </aside>

        <motion.main
          key={pathname}
          id="main-content"
          className="min-w-0 flex-1"
          tabIndex={-1}
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.main>
      </div>

      <nav
        className="fixed bottom-3 left-3 right-3 z-[1100] rounded-lg border border-primary/15 bg-white/95 p-2 shadow-soft backdrop-blur lg:hidden"
        aria-label={shellCopy.mobileNav}
      >
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${Math.max(1, mobileNavItems.length)}, minmax(0, 1fr))` }}
        >
          {mobileNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-center text-[11px] font-bold leading-tight text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                getIsActive(pathname, item.href) && "bg-primary text-white"
              )}
              aria-current={getIsActive(pathname, item.href) ? "page" : undefined}
              aria-label={item.label}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <ModeGate />
      <OnboardingModal
        enabled={requiredAccepted && modeLoaded && modeRecord?.mode === "adult"}
        onDone={() => setUserName(getDisplayName(getUser()))}
      />
      {modeRecord?.mode === "adult" && <NotificationBanner />}
      <ConsentManager />

      <footer className="relative border-t border-primary/10 bg-white/70 px-4 py-6 text-sm leading-6 text-muted backdrop-blur lg:px-6">
        <div className="mx-auto max-w-[1480px] space-y-4">
          <p className="text-xs">{footer.disclaimer}</p>

          {/* Partner badges */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://elevenlabs.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-black px-3 py-1.5 text-[11px] font-black text-white transition hover:opacity-80"
            >
              <Volume2 className="h-3 w-3" aria-hidden="true" />
              Powered by ElevenLabs
            </a>
            <a
              href="https://solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#9945FF]/20 bg-gradient-to-r from-[#9945FF] to-[#14F195] px-3 py-1.5 text-[11px] font-black text-white transition hover:opacity-80"
            >
              <svg className="h-3 w-3" viewBox="0 0 397 311" fill="none" aria-hidden="true">
                <path d="M64.6 237.9a11 11 0 0 1 7.8-3.2h317.4c4.9 0 7.4 5.9 3.9 9.4l-62.7 62.7a11 11 0 0 1-7.8 3.2H5.8c-4.9 0-7.4-5.9-3.9-9.4l62.7-62.7zm0-164.7A11 11 0 0 1 72.4 70h317.4c4.9 0 7.4 5.9 3.9 9.4l-62.7 62.7a11 11 0 0 1-7.8 3.2H5.8c-4.9 0-7.4-5.9-3.9-9.4L64.6 73.2zM330 3.2A11 11 0 0 0 322.2 0H4.8C-.1 0-2.6 5.9.9 9.4l62.7 62.7a11 11 0 0 0 7.8 3.2h317.4c4.9 0 7.4-5.9 3.9-9.4L330 3.2z" fill="white"/>
              </svg>
              Powered by Solana
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/terms" className="font-bold text-primary hover:underline">
              {footer.terms}
            </Link>
            <Link href="/privacy" className="font-bold text-primary hover:underline">
              {footer.privacy}
            </Link>
            <button
              type="button"
              onClick={openSettings}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/15 bg-white px-3 py-1.5 font-bold text-primary transition hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              {footer.consents}
            </button>
            <button
              type="button"
              onClick={openModeSettings}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/15 bg-white px-3 py-1.5 font-bold text-primary transition hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Baby className="h-3.5 w-3.5" aria-hidden="true" />
              {shellCopy.changeMode}
            </button>
            <Badge variant="muted">
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
              {shellCopy.mvpBadge}
            </Badge>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PlanScoreCard({
  copy,
  planScore,
  healthScore,
  demoBadge,
}: {
  copy: { planLabel: string; scoreLabel: string };
  planScore: number;
  healthScore: number | null;
  demoBadge: string;
}) {
  return (
    <div className="mb-4 rounded-lg bg-primary p-4 text-white shadow-glow">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black">{copy.planLabel}</p>
        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <p className="text-4xl font-black leading-none">{planScore}</p>
        {healthScore === null && (
          <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">
            {demoBadge}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm font-bold text-white/82">{copy.scoreLabel}</p>
      <div className="mt-4">
        <div
          className="relative h-3 rounded-full bg-white/25"
          role="progressbar"
          aria-label={copy.scoreLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={planScore}
        >
          <div
            className="h-full rounded-full bg-accent shadow-[0_0_18px_rgba(247,223,166,0.65)]"
            style={{ width: `${planScore}%` }}
          />
          {scoreMilestones.map((milestone) => {
            const reached = planScore >= milestone;
            return (
              <span
                key={milestone}
                className={cn(
                  "absolute top-1/2 grid h-5 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 text-[9px] font-black",
                  reached
                    ? "border-white bg-accent text-text"
                    : "border-white/80 bg-primary text-white/85"
                )}
                style={{ left: `${milestone}%` }}
                aria-hidden="true"
              >
                {milestone === 100 ? "*" : ""}
              </span>
            );
          })}
        </div>
        <div className="mt-2 grid grid-cols-4 text-[10px] font-black text-white/80">
          {scoreMilestones.map((milestone) => (
            <span key={milestone} className="text-center">
              {milestone}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SignedInPlanScore({
  copy,
  planScore,
  healthScore,
  demoBadge,
}: {
  copy: { planLabel: string; scoreLabel: string };
  planScore: number;
  healthScore: number | null;
  demoBadge: string;
}) {
  const { isInitialized } = useIsInitialized();
  const { isSignedIn } = useIsSignedIn();
  if (!isInitialized || !isSignedIn) return null;
  return (
    <PlanScoreCard copy={copy} planScore={planScore} healthScore={healthScore} demoBadge={demoBadge} />
  );
}

function HeaderProgress({ tokenBalance, tokenUnit }: { tokenBalance: number; tokenUnit: string }) {
  const { isInitialized } = useIsInitialized();
  const { isSignedIn } = useIsSignedIn();
  if (!isInitialized || !isSignedIn) return null;
  return (
    <>
      <div className="hidden items-center gap-2 rounded-lg border border-primary/10 bg-white/75 px-3 py-2 text-sm font-bold text-text shadow-sm md:flex">
        <Coins className="h-4 w-4 text-primary" aria-hidden="true" />
        {tokenBalance} {tokenUnit}
      </div>
      <StreakBadge compact />
    </>
  );
}

function HeaderAccount({ locale }: { locale: Locale }) {
  const { isInitialized } = useIsInitialized();
  const { isSignedIn } = useIsSignedIn();
  const { signOut } = useSignOut();
  const { getAccessToken } = useGetAccessToken();
  const copy = ACCOUNT_COPY[locale] ?? ACCOUNT_COPY.en;

  if (isSignedIn) {
    return (
      <button
        type="button"
        onClick={() => {
          hideSavedProgress();
          void clearSignedInName(getAccessToken)
            .then(() => endLearningSession())
            .finally(() => signOut());
        }}
        className="shrink-0 whitespace-nowrap rounded-lg border border-primary/15 bg-white px-3 py-2 text-sm font-black text-text transition hover:border-destructive/40 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {copy.signOut}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={!isInitialized}
      onClick={() => requestSignIn()}
      className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-3 py-2 text-sm font-black text-white transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
    >
      {!isInitialized ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {copy.signIn}
    </button>
  );
}

function NavLink({
  item,
  active,
  badge,
}: {
  item: { href: string; label: string; icon: LucideIcon };
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-bold text-muted transition hover:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        active && "bg-white text-primary shadow-soft"
      )}
    >
      <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {item.label}
      {badge !== undefined && (
        <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-black text-white">
          {badge}
        </span>
      )}
      {active && !badge && <ChevronRight className="ml-auto h-4 w-4" aria-hidden="true" />}
    </Link>
  );
}

function getIsActive(pathname: string, href: string) {
  if (href.includes("#")) return false;
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href.split("#")[0]);
}

function isTextScale(value: unknown): value is TextScale {
  return typeof value === "string" && TEXT_SCALES.includes(value as TextScale);
}
