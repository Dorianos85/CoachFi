"use client";
import { useProductStorage } from "@/lib/use-product-storage";

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
import { useEffect, useRef, useState } from "react";

import { getUser, getDisplayName } from "@/lib/user";
import { getHealthCheck } from "@/lib/healthCheck";
import { FINANCIAL_SCORE_MAX } from "@/lib/financial-score";
import { CONSENT_CHANGED_EVENT } from "@/lib/consent";
import { getDueCount } from "@/lib/srs";
import { readReviewCards } from "@/lib/review-save";
import { getAllQuestionIds } from "@/lib/allQuestions";

import { AccessibilityToggle, type TextScale } from "@/components/AccessibilityToggle";
import { ConsentManager } from "@/components/ConsentManager";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LearningPathNavigation } from "@/components/LearningPathNavigation";
import { AccountButton } from "@/components/AccountButton";
import { ModeGate } from "@/components/ModeGate";
import { ScopeUnavailable } from "@/components/ScopeUnavailable";

import { Logo } from "@/components/Logo";

import { NotificationBanner } from "@/components/NotificationBanner";
import { OnboardingModal } from "@/components/OnboardingModal";
import { StreakBadge } from "@/components/StreakBadge";
import { Badge } from "@/components/ui/badge";
import { useConsent } from "@/context/ConsentContext";
import { useLanguage } from "@/context/LanguageContext";
import { useMode } from "@/context/ModeContext";
import { endLearningSession } from "@/lib/account-sync";
import { getStorageOwnershipSnapshot, subscribeStorageOwnership } from "@/lib/product-storage";
import { pickLocalized, type Locale, type LocalizedMap } from "@/lib/i18n";
import { getLocalizedContent } from "@/lib/localizedContent";
import { isProgressVisible } from "@/lib/progress-visibility";
import { requestSignIn } from "@/lib/signInGate";
import { getTokenBalance } from "@/lib/tokens";
import { isFeatureEnabled, isRouteEnabled } from "@/lib/product-scope";
import { isPublicLearningEntry, isSharedLearningShell } from "@/lib/learning-paths";
import { cn } from "@/lib/utils";

const cdpEnabled = Boolean(process.env.NEXT_PUBLIC_CDP_PROJECT_ID?.trim());

const ACCOUNT_COPY: LocalizedMap<{ signIn: string; signOut: string }> = {
  en: { signIn: "Sign in", signOut: "Sign out" },
  pl: { signIn: "Zaloguj", signOut: "Wyloguj" },
  ja: { signIn: "ログイン", signOut: "ログアウト" },
  es: { signIn: "Iniciar sesión", signOut: "Cerrar sesión" },
  fr: { signIn: "Se connecter", signOut: "Se déconnecter" },
  zh: { signIn: "登录", signOut: "退出登录" },
  hi: { signIn: "साइन इन करें", signOut: "साइन आउट करें" },
  "pt-BR": { signIn: "Entrar", signOut: "Sair" },
  tr: { signIn: "Giriş yap", signOut: "Çıkış yap" },
};

const HEADER_LOGOUT_COPY: LocalizedMap<{ pending: string; error: string; retry: string }> = {
  en: {
    pending: "Signing out...",
    error: "Sign-out could not be completed. Try again.",
    retry: "Retry sign-out",
  },
  pl: {
    pending: "Trwa wylogowywanie...",
    error: "Nie udało się zakończyć wylogowania. Spróbuj ponownie.",
    retry: "Spróbuj wylogować ponownie",
  },
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
  home: "/adult/dashboard",
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
      es: "Inicio",
      fr: "Démarrer",
      zh: "开始",
      hi: "शुरुआत",
      "pt-BR": "Início",
      tr: "Başlangıç",
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
      es: "Más",
      fr: "Plus",
      zh: "更多",
      hi: "और",
      "pt-BR": "Mais",
      tr: "Daha fazla",
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
      es: "Modo niños",
      fr: "Mode enfants",
      zh: "儿童模式",
      hi: "किड्स मोड",
      "pt-BR": "Modo infantil",
      tr: "Çocuk modu",
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
  es: {
    disclaimer:
      "Coach FI es una aplicación educativa. No ofrece asesoramiento financiero, recomendaciones de inversión ni rendimientos garantizados. No enseña trading, apalancamiento, futuros ni especulación. El objetivo es ganar confianza, hábitos de ahorro y conciencia financiera a largo plazo.",
    terms: "Términos",
    privacy: "Privacidad",
    consents: "Consentimientos",
  },
  fr: {
    disclaimer:
      "Coach FI est une application éducative. Elle ne fournit ni conseil financier, ni recommandation d'investissement, ni rendement garanti. Elle n'enseigne ni le trading, ni l'effet de levier, ni les contrats à terme, ni la spéculation. L'objectif : la confiance, des habitudes d'épargne et une conscience financière à long terme.",
    terms: "Conditions",
    privacy: "Confidentialité",
    consents: "Consentements",
  },
  zh: {
    disclaimer:
      "Coach FI 是一款教育应用。它不提供理财建议、投资推荐或收益保证，也不教授交易、杠杆、期货或投机。目标是建立信心、储蓄习惯和长期的财务意识。",
    terms: "条款",
    privacy: "隐私",
    consents: "授权",
  },
  hi: {
    disclaimer:
      "Coach FI एक शैक्षिक ऐप है। यह वित्तीय सलाह, निवेश की सिफ़ारिशें या गारंटीड रिटर्न नहीं देता। यह ट्रेडिंग, लीवरेज, फ़्यूचर्स या सट्टेबाज़ी नहीं सिखाता। लक्ष्य है आत्मविश्वास, बचत की आदतें और लंबी अवधि की वित्तीय जागरूकता।",
    terms: "शर्तें",
    privacy: "गोपनीयता",
    consents: "सहमतियां",
  },
  "pt-BR": {
    disclaimer:
      "O Coach FI é um aplicativo educacional. Não oferece consultoria financeira, recomendações de investimento nem retornos garantidos. Não ensina trading, alavancagem, futuros nem especulação. O objetivo é confiança, hábitos de poupança e consciência financeira de longo prazo.",
    terms: "Termos",
    privacy: "Privacidade",
    consents: "Consentimentos",
  },
  tr: {
    disclaimer:
      "Coach FI bir eğitim uygulamasıdır. Finansal tavsiye, yatırım önerisi veya garantili getiri sunmaz. Al-sat, kaldıraç, vadeli işlemler veya spekülasyon öğretmez. Amaç özgüven, birikim alışkanlıkları ve uzun vadeli finansal farkındalıktır.",
    terms: "Koşullar",
    privacy: "Gizlilik",
    consents: "Onaylar",
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
  es: {
    skip: "Saltar al contenido principal",
    homeAria: "Ir al inicio de Coach FI",
    primaryNav: "Navegación principal",
    mobileNav: "Navegación móvil",
    mvpBadge: "MVP de hackathon",
    kidsMode: "Modo niños",
    changeMode: "Cambiar modo",
    demoBadge: "Ejemplo",
  },
  fr: {
    skip: "Aller au contenu principal",
    homeAria: "Aller à l'accueil de Coach FI",
    primaryNav: "Navigation principale",
    mobileNav: "Navigation mobile",
    mvpBadge: "MVP de hackathon",
    kidsMode: "Mode enfants",
    changeMode: "Changer de mode",
    demoBadge: "Exemple",
  },
  zh: {
    skip: "跳到主要内容",
    homeAria: "前往 Coach FI 首页",
    primaryNav: "主导航",
    mobileNav: "移动端导航",
    mvpBadge: "黑客松 MVP",
    kidsMode: "儿童模式",
    changeMode: "切换模式",
    demoBadge: "示例",
  },
  hi: {
    skip: "मुख्य सामग्री पर जाएं",
    homeAria: "Coach FI होम पर जाएं",
    primaryNav: "मुख्य नेविगेशन",
    mobileNav: "मोबाइल नेविगेशन",
    mvpBadge: "हैकथॉन MVP",
    kidsMode: "किड्स मोड",
    changeMode: "मोड बदलें",
    demoBadge: "उदाहरण",
  },
  "pt-BR": {
    skip: "Pular para o conteúdo principal",
    homeAria: "Ir para o início do Coach FI",
    primaryNav: "Navegação principal",
    mobileNav: "Navegação móvel",
    mvpBadge: "MVP de hackathon",
    kidsMode: "Modo infantil",
    changeMode: "Trocar de modo",
    demoBadge: "Exemplo",
  },
  tr: {
    skip: "Ana içeriğe geç",
    homeAria: "Coach FI ana sayfasına git",
    primaryNav: "Ana gezinme",
    mobileNav: "Mobil gezinme",
    mvpBadge: "Hackathon MVP",
    kidsMode: "Çocuk modu",
    changeMode: "Modu değiştir",
    demoBadge: "Örnek",
  },
};

/** Illustrative score shown in the sidebar until the user runs the Health Check. */
const DEMO_PLAN_SCORE = 42;
const ACCESSIBILITY_STORAGE_KEY = "coachfi-accessibility-v1";
const TEXT_SCALES: TextScale[] = ["normal", "large", "xlarge"];

export function AppNavigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return isSharedLearningShell(pathname)
    ? <SharedLearningShell>{children}</SharedLearningShell>
    : <AdultAppNavigation>{children}</AdultAppNavigation>;
}

/** This shell never mounts adult balances, diagnosis, review badges or streak cards. */
function SharedLearningShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const { openSettings } = useConsent();
  const { openSettings: openModeSettings } = useMode();
  const modeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [highContrast, setHighContrast] = useState(false);
  const [textScale, setTextScale] = useState<TextScale>("normal");
  const [accessibilityLoaded, setAccessibilityLoaded] = useState(false);
  const pl = locale === "pl";
  const footer = pickLocalized(FOOTER_COPY, locale);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
      if (raw) {
        const value = JSON.parse(raw) as { highContrast?: unknown; textScale?: unknown };
        setHighContrast(value.highContrast === true);
        if (isTextScale(value.textScale)) setTextScale(value.textScale);
      }
    } catch { /* Device controls remain available for this visit. */ }
    setAccessibilityLoaded(true);
  }, []);
  useEffect(() => {
    if (!accessibilityLoaded) return;
    try { window.localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify({ highContrast, textScale })); }
    catch { /* Device controls remain available when storage is blocked. */ }
  }, [accessibilityLoaded, highContrast, textScale]);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("text-scale-large", "text-scale-xlarge");
    if (textScale !== "normal") root.classList.add(textScale === "large" ? "text-scale-large" : "text-scale-xlarge");
    return () => root.classList.remove("text-scale-large", "text-scale-xlarge");
  }, [textScale]);
  return <div className={cn("app-shell min-h-screen bg-background text-text", highContrast && "high-contrast",
    textScale === "large" && "text-scale-large", textScale === "xlarge" && "text-scale-xlarge")}>
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:font-bold focus:text-text">
      {pl ? "Przejdź do głównej treści" : "Skip to main content"}
    </a>
    <header className="border-b border-border-subtle bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" aria-label={pl ? "Strona główna Coach FI" : "Coach FI home"}
          className="rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Logo size={30} /></Link>
        <div className="flex flex-wrap items-center gap-2">
          <LanguageSwitcher />
          <AccessibilityToggle compact highContrast={highContrast} textScale={textScale}
            onToggleContrast={() => setHighContrast((value) => !value)} onTextScaleChange={setTextScale} />
        </div>
        <div className="w-full"><LearningPathNavigation /></div>
      </div>
    </header>
    <main id="main-content" tabIndex={-1} className="mx-auto min-w-0 max-w-6xl px-4 py-6 sm:py-10">
      {isRouteEnabled(pathname) ? children : <ScopeUnavailable />}
    </main>
    <footer className="border-t border-border-subtle bg-surface px-4 py-6 text-sm leading-6 text-muted">
      <div className="mx-auto max-w-6xl space-y-3">
        <p className="text-xs">{footer.disclaimer}</p>
        <div className="flex flex-wrap gap-3">
          <Link className="min-h-11 content-center font-bold text-primary underline" href="/terms">{footer.terms}</Link>
          <Link className="min-h-11 content-center font-bold text-primary underline" href="/privacy">{footer.privacy}</Link>
          <button type="button" className="min-h-11 rounded-lg border border-primary/20 px-3 font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={openSettings}>{footer.consents}</button>
          <button type="button" ref={modeTriggerRef} className="min-h-11 rounded-lg border border-primary/20 px-3 font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={openModeSettings}>
            {pl ? "Potwierdzenie wieku 18+" : "Age confirmation 18+"}
          </button>
        </div>
      </div>
    </footer>
    <ModeGate returnFocusRef={modeTriggerRef} />
    <ConsentManager deferPrompt={isPublicLearningEntry(pathname)} />
  </div>;
}

function AdultAppNavigation({ children }: { children: React.ReactNode }) {
  const { storage } = useProductStorage();
  const modeTriggerRef = useRef<HTMLButtonElement | null>(null);
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
    if (!storage.isCurrent()) return;
    const user = getUser(storage);
    setUserName(getDisplayName(user));
    const updateReviewDue = () => {
      if (!isProgressVisible()) { if (storage.isCurrent()) setReviewDue(0); return; }
      try {
        const raw = JSON.stringify(readReviewCards(storage));
        const due = getDueCount(getAllQuestionIds(locale), { ...storage,
          getItem: key => key === "coachfi-srs" ? raw : storage.getItem(key) });
        if (storage.isCurrent()) setReviewDue(due);
      } catch {
        // The optional badge must not prevent Review from explaining a read error.
        if (storage.isCurrent()) setReviewDue(0);
      }
    };
    updateReviewDue();
    setTokenBalance(getTokenBalance(storage));
    setHealthScore(getHealthCheck(storage)?.score ?? null);
    const onStorage = () => {
      if (!storage.isCurrent()) return;
      setUserName(getDisplayName(getUser(storage)));
      setTokenBalance(getTokenBalance(storage));
      updateReviewDue();
      setHealthScore(getHealthCheck(storage)?.score ?? null);
    };
    window.addEventListener("coachfi-health-check", onStorage);
    window.addEventListener(CONSENT_CHANGED_EVENT, onStorage);
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
      window.removeEventListener(CONSENT_CHANGED_EVENT, onStorage);
    };
  }, [locale, storage]);

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
  const navGroups = (isKidsMode ? KIDS_NAV_GROUPS : NAV_GROUPS)
    .map((group) => ({ ...group, keys: group.keys.filter((key) => isRouteEnabled(navHrefs[key])) }))
    .filter((group) => group.keys.length > 0);
  const mobileNavKeys: NavKey[] = ["home", "healthCheck", "learn", "coach"];
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

      <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-2 px-4 py-3 lg:gap-3 lg:px-6">

          <Link
            href="/"
            className="flex shrink-0 items-center gap-3 rounded-lg p-1 text-left focus-visible:outline-none focus-visible:ring-[length:var(--cfx-ring-width)] focus-visible:ring-focus focus-visible:ring-offset-2"
            aria-label={shellCopy.homeAria}
          >
            <span className="cf-logo-tile inline-flex items-center rounded-lg px-2 py-1.5">
              <Logo size={26} />
            </span>
            <span className="hidden max-w-[14rem] truncate text-xs font-bold text-muted sm:block">{copy.appSubtitle}</span>
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
            {cdpEnabled ? <HeaderAccount locale={locale} /> : <AccountButton />}
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
          <div className="glass-panel sticky top-24 rounded-card p-3">
            <div className="mb-4"><LearningPathNavigation /></div>
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
                    className="group rounded-card border border-border-subtle bg-surface/80"
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
          <div className="mb-5 lg:hidden"><LearningPathNavigation /></div>
          {isRouteEnabled(pathname) ? children : <ScopeUnavailable />}
        </motion.main>
      </div>

      <nav
        className="fixed bottom-3 left-3 right-3 z-40 rounded-card border border-border-subtle bg-surface p-2 shadow-soft lg:hidden"
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
                "flex min-h-16 flex-col items-center justify-center gap-1 rounded-card px-1.5 py-2 text-center text-[11px] font-bold leading-tight text-muted focus-visible:outline-none focus-visible:ring-[length:var(--cfx-ring-width)] focus-visible:ring-focus",
                getIsActive(pathname, item.href) && "bg-area-learn text-text"
              )}
              aria-current={getIsActive(pathname, item.href) ? "page" : undefined}
              aria-label={item.label}
            >
              <item.icon className={cn("h-5 w-5", getIsActive(pathname, item.href) && "text-grape")} aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <ModeGate returnFocusRef={modeTriggerRef} />
      <OnboardingModal
        returnFocusRef={modeTriggerRef}
        enabled={pathname !== "/adult" && requiredAccepted && modeLoaded && modeRecord?.mode === "adult"}
        onDone={() => { if (storage.isCurrent()) setUserName(getDisplayName(getUser(storage))); }}
      />
      {modeRecord?.mode === "adult" && <NotificationBanner />}
      <ConsentManager />

      <footer className="relative border-t border-border-subtle bg-surface px-4 py-6 text-sm leading-6 text-muted lg:px-6">
        <div className="mx-auto max-w-[1480px] space-y-4">
          <p className="text-xs">{footer.disclaimer}</p>

          {/* Partner badges */}
          <div className="flex flex-wrap items-center gap-3">
            {isFeatureEnabled("web3") && <a
              href="https://solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-primary-border bg-white px-3 py-1.5 text-[11px] font-black text-text transition hover:bg-primary/10"
            >
              <svg className="h-3 w-3" viewBox="0 0 397 311" fill="none" aria-hidden="true">
                <path d="M64.6 237.9a11 11 0 0 1 7.8-3.2h317.4c4.9 0 7.4 5.9 3.9 9.4l-62.7 62.7a11 11 0 0 1-7.8 3.2H5.8c-4.9 0-7.4-5.9-3.9-9.4l62.7-62.7zm0-164.7A11 11 0 0 1 72.4 70h317.4c4.9 0 7.4 5.9 3.9 9.4l-62.7 62.7a11 11 0 0 1-7.8 3.2H5.8c-4.9 0-7.4-5.9-3.9-9.4L64.6 73.2zM330 3.2A11 11 0 0 0 322.2 0H4.8C-.1 0-2.6 5.9.9 9.4l62.7 62.7a11 11 0 0 0 7.8 3.2h317.4c4.9 0 7.4-5.9 3.9-9.4L330 3.2z" fill="currentColor"/>
              </svg>
              Powered by Solana
            </a>}
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/15 bg-white px-3 py-1.5 font-bold text-primary transition hover:bg-primary hover:text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              {footer.consents}
            </button>
            <button
              type="button"
              onClick={openModeSettings}
              ref={modeTriggerRef}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 py-1.5 font-bold text-grape transition hover:bg-primary hover:text-on-primary focus-visible:outline-none focus-visible:ring-[length:var(--cfx-ring-width)] focus-visible:ring-focus"
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
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
  const { locale } = useLanguage();
  const scoreMax = healthScore === null ? 100 : FINANCIAL_SCORE_MAX;
  const milestones = healthScore === null ? scoreMilestones : [25, 50, 75, FINANCIAL_SCORE_MAX];
  const scoreLabel = healthScore === null ? copy.scoreLabel : locale === "pl" ? "Lokalny indeks edukacyjny" : "Local educational index";
  return (
    <div className="mb-4 rounded-lg bg-primary p-4 text-on-primary shadow-glow">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black">{copy.planLabel}</p>
        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <p className="text-4xl font-black leading-none">{planScore}<span className="text-lg">/{scoreMax}</span></p>
        {healthScore === null && (
          <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">
            {demoBadge}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm font-bold text-on-primary/80">{scoreLabel}</p>

      <div className="mt-4">
        <div
          className="relative h-3 rounded-full bg-white/70"
          role="progressbar"
          aria-label={scoreLabel}
          aria-valuemin={0}
          aria-valuemax={scoreMax}
          aria-valuenow={planScore}
        >
          <div
            className="h-full rounded-full bg-accent shadow-[0_0_18px_rgba(247,223,166,0.65)]"
            style={{ width: `${(planScore / scoreMax) * 100}%` }}

          />
          {milestones.map((milestone) => {
            const reached = planScore >= milestone;
            return (
              <span
                key={milestone}
                className={cn(
                  "absolute top-1/2 grid h-5 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 text-[9px] font-black",
                  reached
                    ? "border-on-primary bg-accent text-text"
                    : "border-on-primary/60 bg-white text-on-primary/85"
                )}
                style={{ left: `${(milestone / scoreMax) * 100}%` }}
                aria-hidden="true"
              >
                {milestone === scoreMax ? "*" : ""}
              </span>
            );
          })}
        </div>
        <div className="mt-2 grid grid-cols-4 text-[10px] font-black text-on-primary/80">
          {milestones.map((milestone) => (
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
  const { storage } = useProductStorage();
  const { isInitialized } = useIsInitialized();
  const { isSignedIn } = useIsSignedIn();
  const { signOut } = useSignOut();
  const { getAccessToken } = useGetAccessToken();
  const copy = ACCOUNT_COPY[locale] ?? ACCOUNT_COPY.en;
  const logoutCopy = pickLocalized(HEADER_LOGOUT_COPY, locale);
  const [logoutStatus, setLogoutStatus] = useState<"idle" | "pending" | "error">("idle");
  type LogoutAttempt = {
    mount: object;
    guest: ReturnType<typeof getStorageOwnershipSnapshot> | null;
    pending: boolean;
  };
  const lifecycle = useRef<object | null>(null);
  const logoutAttempt = useRef<LogoutAttempt | null>(null);

  useEffect(() => {
    const generation = {};
    lifecycle.current = generation;
    const unsubscribe = subscribeStorageOwnership(() => {
      if (lifecycle.current !== generation) return;
      const attempt = logoutAttempt.current;
      // The synchronous detach publishes its guest before we capture it.
      if (!attempt?.guest || getStorageOwnershipSnapshot() === attempt.guest) return;
      logoutAttempt.current = null;
      setLogoutStatus("idle");
    });
    return () => {
      if (lifecycle.current === generation) {
        lifecycle.current = null;
        logoutAttempt.current = null;
      }
      unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    const mount = lifecycle.current;
    if (!mount || logoutAttempt.current?.pending || !storage.isCurrent()) return;
    const attempt: LogoutAttempt = { mount, guest: null, pending: true };
    logoutAttempt.current = attempt;
    setLogoutStatus("pending");
    const finish = (status: "idle" | "error") => {
      if (lifecycle.current !== mount || logoutAttempt.current !== attempt) return;
      if (!attempt.guest || getStorageOwnershipSnapshot() !== attempt.guest) {
        logoutAttempt.current = null;
        setLogoutStatus("idle");
        return;
      }
      attempt.pending = false;
      if (status === "idle") logoutAttempt.current = null;
      setLogoutStatus(status);
    };
    try {
      const detached = endLearningSession(undefined, storage);
      const guest = getStorageOwnershipSnapshot();
      if (guest.status === "ready" && guest.owner?.kind === "guest") attempt.guest = guest;
      await detached;
      if (lifecycle.current !== mount || logoutAttempt.current !== attempt ||
        !attempt.guest || getStorageOwnershipSnapshot() !== attempt.guest) {
        finish("idle");
        return;
      }
      await signOut();
      finish("idle");
    } catch {
      finish("error");
    }
  }

  if (logoutStatus === "pending" || logoutStatus === "error") {
    return (
      <div className="flex max-w-xs flex-col items-start gap-2">
        {logoutStatus === "error" ? (
          <p role="alert" className="text-sm font-bold text-attention">{logoutCopy.error}</p>
        ) : null}
        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={logoutStatus === "pending"}
          aria-busy={logoutStatus === "pending" || undefined}
          className="shrink-0 rounded-lg border border-primary/15 bg-white px-3 py-2 text-sm font-black text-text transition hover:border-destructive/40 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
        >
          {logoutStatus === "pending" ? <span role="status">{logoutCopy.pending}</span> : logoutCopy.retry}
        </button>
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <button
        type="button"
        onClick={() => void handleSignOut()}
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
      onClick={() => { if (storage.isCurrent()) requestSignIn(); }}
      className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-button cf-press bg-primary px-3 py-2 text-sm font-black text-on-primary transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60"
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
        "flex min-h-12 w-full items-center gap-3 rounded-card px-3 py-3 text-left text-sm font-bold text-muted transition hover:bg-surface focus-visible:outline-none focus-visible:ring-[length:var(--cfx-ring-width)] focus-visible:ring-focus",
        active && "bg-area-learn text-text shadow-soft"
      )}
    >
      <item.icon className={cn("h-5 w-5 shrink-0", active && "text-grape")} aria-hidden="true" />
      {item.label}
      {badge !== undefined && (
        <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-black text-on-primary">
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
