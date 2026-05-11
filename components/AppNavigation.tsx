"use client";

import { motion } from "framer-motion";
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
  RefreshCw,
  ShieldCheck,
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
import { getDueCount } from "@/lib/srs";
import { getAllQuestionIds } from "@/lib/allQuestions";

import { AccessibilityToggle, type TextScale } from "@/components/AccessibilityToggle";
import { ConsentManager } from "@/components/ConsentManager";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NotificationBanner } from "@/components/NotificationBanner";
import { OnboardingModal } from "@/components/OnboardingModal";
import { StreakBadge } from "@/components/StreakBadge";
import { Badge } from "@/components/ui/badge";
import { useConsent } from "@/context/ConsentContext";
import { useLanguage } from "@/context/LanguageContext";
import { getTokenBalance } from "@/lib/tokens";
import { getLocalizedContent } from "@/lib/localizedContent";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const navIcons: Record<string, LucideIcon> = {
  home: Home,
  healthCheck: HeartPulse,
  inflation: BarChart3,
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

const NAV_GROUPS: Array<{
  id: string;
  label: Record<Locale, string>;
  keys: NavKey[];
  defaultOpen?: boolean;
}> = [
  {
    id: "demo",
    label: {
      en: "Demo flow",
      pl: "Demo",
      ja: "デモ",
    },
    keys: ["home", "healthCheck", "learn", "coach", "accessibility"],
    defaultOpen: true,
  },
  {
    id: "tools",
    label: {
      en: "Tools",
      pl: "Narzędzia",
      ja: "ツール",
    },
    keys: ["inflation", "quiz", "review"],
  },
  {
    id: "proof",
    label: {
      en: "Progress",
      pl: "Postęp",
      ja: "進捗",
    },
    keys: ["rewards", "vault"],
  },
  {
    id: "more",
    label: {
      en: "More",
      pl: "Więcej",
      ja: "その他",
    },
    keys: ["challenge", "cards", "kids", "partner"],
  },
];

const FOOTER_COPY: Record<Locale, { disclaimer: string; terms: string; privacy: string; consents: string }> = {
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

const SHELL_COPY: Record<
  Locale,
  {
    skip: string;
    homeAria: string;
    primaryNav: string;
    mobileNav: string;
    mvpBadge: string;
  }
> = {
  en: {
    skip: "Skip to main content",
    homeAria: "Go to Coach FI home",
    primaryNav: "Primary navigation",
    mobileNav: "Mobile navigation",
    mvpBadge: "Hackathon MVP",
  },
  pl: {
    skip: "Przejdź do głównej treści",
    homeAria: "Przejdź do strony głównej Coach FI",
    primaryNav: "Główna nawigacja",
    mobileNav: "Nawigacja mobilna",
    mvpBadge: "MVP hackathonu",
  },
  ja: {
    skip: "メインコンテンツへ移動",
    homeAria: "Coach FIホームへ移動",
    primaryNav: "メインナビゲーション",
    mobileNav: "モバイルナビゲーション",
    mvpBadge: "ハッカソンMVP",
  },
};

export function AppNavigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale, t } = useLanguage();
  const copy = getLocalizedContent(locale);
  const shellCopy = SHELL_COPY[locale];
  const { requiredAccepted, openSettings } = useConsent();
  const [highContrast, setHighContrast] = useState(false);
  const [textScale, setTextScale] = useState<TextScale>("normal");
  const [userName, setUserName] = useState("Your");

  const [reviewDue, setReviewDue] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);
  const footer = FOOTER_COPY[locale];

  useEffect(() => {
    const user = getUser();
    setUserName(getDisplayName(user));
    setReviewDue(getDueCount(getAllQuestionIds(locale)));
    setTokenBalance(getTokenBalance());
    const onStorage = () => {
      setUserName(getDisplayName(getUser()));
      setTokenBalance(getTokenBalance());
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("coachfi-tokens", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("coachfi-tokens", onStorage);
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

  const getNavItem = (key: NavKey) => ({
    key,
    href: navHrefs[key],
    label: t.nav[key as keyof typeof t.nav],
    icon: navIcons[key],
  });
  const mobileNavItems = NAV_GROUPS[0].keys.map(getNavItem);

  return (
    <div
      className={cn(
        "min-h-screen bg-background text-text",
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
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-2 px-4 py-3 lg:gap-3 lg:px-6">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3 rounded-lg p-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={shellCopy.homeAria}
          >
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-base font-black text-white shadow-glow">
              FI
            </span>
            <span>
              <span className="block text-lg font-black leading-tight">Coach FI</span>
              <span className="hidden text-xs font-bold text-muted sm:block">{copy.appSubtitle}</span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2 lg:gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-primary/10 bg-white/75 px-3 py-2 text-sm font-bold text-text shadow-sm md:flex">
              <Coins className="h-4 w-4 text-primary" aria-hidden="true" />
              {tokenBalance} {t.common.tokenUnit}
            </div>
            <StreakBadge compact />
            <LanguageSwitcher />
            <AccessibilityToggle
              highContrast={highContrast}
              textScale={textScale}
              onToggleContrast={() => setHighContrast((value) => !value)}
              onTextScaleChange={setTextScale}
              compact
            />
          </div>
        </div>
      </header>

      <div className="relative mx-auto flex max-w-[1480px] gap-6 px-4 pb-28 pt-6 lg:px-6">
        <aside className="hidden w-64 shrink-0 lg:block" aria-label={shellCopy.primaryNav}>
          <div className="glass-panel sticky top-24 rounded-lg p-3">
            <div className="mb-4 rounded-lg bg-primary p-4 text-white shadow-glow">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black">{copy.planLabel}</p>
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-3 text-4xl font-black leading-none">{42}</p>
              <p className="mt-1 text-sm font-bold text-white/82">{copy.scoreLabel}</p>
              <div className="mt-4">
                <div
                  className="relative h-3 rounded-full bg-white/25"
                  role="progressbar"
                  aria-label={copy.scoreLabel}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={42}
                >
                  <div
                    className="h-full rounded-full bg-accent shadow-[0_0_18px_rgba(247,223,166,0.65)]"
                    style={{ width: `${42}%` }}
                  />
                  {scoreMilestones.map((milestone) => {
                    const reached = 42 >= milestone;
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

            <div className="space-y-1.5">
              {NAV_GROUPS.map((group) => {
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
                      {group.label[locale]}
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
        className="fixed bottom-3 left-3 right-3 z-50 rounded-lg border border-primary/15 bg-white/95 p-2 shadow-soft backdrop-blur lg:hidden"
        aria-label={shellCopy.mobileNav}
      >
        <div className="grid grid-cols-5 gap-1">
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

      <OnboardingModal enabled={requiredAccepted} onDone={() => setUserName(getDisplayName(getUser()))} />
      <NotificationBanner />
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
