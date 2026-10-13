"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  CheckCircle2,
  Coins,
  LockKeyhole,
  Mic,
  PiggyBank,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { addTokens } from "@/lib/tokens";
import { cn, formatCurrency, LOCALE_INTL } from "@/lib/utils";

type PlanVariant = "stabilize" | "build" | "optimize";

type PlanStep = {
  id: string;
  day: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  reward: number;
  icon: typeof ShieldCheck;
};

type FamilyActionPlanProps = {
  score: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
  goal: string;
  trialActive: boolean;
  onStartTrial: () => void;
};

type PlanCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  scoreBand: Record<PlanVariant, { title: string; description: string }>;
  metrics: {
    surplus: string;
    cushion: string;
    firstJar: string;
  };
  trial: {
    title: string;
    description: string;
    active: string;
    inactive: string;
    fairUse: string;
  };
  readPlan: string;
  checklist: string;
  completed: string;
  earned: string;
  disclaimer: string;
  steps: Record<PlanVariant, Array<Omit<PlanStep, "icon">>>;
};

const PLAN_KEY = "coachfi-family-plan-actions-v1";

const PLAN_COPY: LocalizedMap<PlanCopy> = {
  en: {
    eyebrow: "Family plan",
    title: "Your first 30 days with Coach FI",
    subtitle: "A simple path from awareness to a calmer family money system.",
    scoreBand: {
      stabilize: {
        title: "First: stabilize cash pressure",
        description: "Do not add complexity yet. Protect cash flow, reduce pressure and use the free support path if needed.",
      },
      build: {
        title: "First: build the system",
        description: "Your income can start working better. Focus on automatic saving, fewer leaks and one family routine.",
      },
      optimize: {
        title: "First: optimize and teach",
        description: "You have a base. Now turn it into a family operating system: investing education, kids habits and shareable progress.",
      },
    },
    metrics: {
      surplus: "Estimated monthly surplus",
      cushion: "Safety cushion",
      firstJar: "First 10% education/investing jar",
    },
    trial: {
      title: "Mila Voice Coach trial",
      description: "Use Mila for score narration, daily learning and family money conversations for 7 days.",
      active: "Trial active",
      inactive: "Start 7-day trial",
      fairUse: "Premium removes daily learning limits and keeps fair-use protection for AI, voice and OCR.",
    },
    readPlan: "Read my family plan",
    checklist: "30-day checklist",
    completed: "Completed",
    earned: "Earned",
    disclaimer: "Educational plan only. Coach FI does not provide personalized investment, legal or tax advice.",
    steps: {
      stabilize: [
        {
          id: "cash-map",
          day: "Day 1",
          title: "Map income, bills and the biggest leak",
          description: "Write the three expenses that create the most pressure and choose one to reduce this week.",
          href: "/health-check",
          cta: "Review diagnosis",
          reward: 20,
        },
        {
          id: "shopping-pause",
          day: "Day 3",
          title: "Run a 24-hour buying pause",
          description: "Use Shopping Hygiene before the next non-essential purchase. Return or sell one thing if it no longer makes sense.",
          href: "/shopping",
          cta: "Open shopping hygiene",
          reward: 30,
        },
        {
          id: "jar-start",
          day: "Day 7",
          title: "Start with the smallest safe jar",
          description: "Split money manually first. Even a small automatic transfer builds the habit.",
          href: "/learn",
          cta: "Open jars",
          reward: 35,
        },
        {
          id: "family-talk",
          day: "Day 14",
          title: "Have one family money conversation",
          description: "Talk about needs, wants and the next shared goal without blame or pressure.",
          href: "/kids",
          cta: "Open Kids Mode",
          reward: 40,
        },
      ],
      build: [
        {
          id: "jars-payday",
          day: "Day 1",
          title: "Plan the 6-jar payday split",
          description: "Use 55% needs, 10% education, 10% long-term spending, 10% fun, 10% investing and 5% generosity.",
          href: "/learn",
          cta: "Open jars",
          reward: 30,
        },
        {
          id: "receipt-check",
          day: "Day 7",
          title: "Check receipts against your list",
          description: "Paste one receipt or invoice and mark what was planned, needed or impulsive.",
          href: "/shopping",
          cta: "Analyze shopping",
          reward: 35,
        },
        {
          id: "daily-lesson",
          day: "Day 14",
          title: "Complete one daily lesson streak",
          description: "Let Mila explain one concept and finish the daily challenge for a reward loop.",
          href: "/challenge",
          cta: "Do challenge",
          reward: 40,
        },
        {
          id: "kids-routine",
          day: "Day 21",
          title: "Create a child-safe money routine",
          description: "Use Kids Mode for needs vs wants, saving jar and stars.",
          href: "/kids",
          cta: "Open Kids Mode",
          reward: 45,
        },
      ],
      optimize: [
        {
          id: "investing-education",
          day: "Day 1",
          title: "Turn surplus into a learning system",
          description: "Before adding risk, review inflation, emergency fund and long-term investing basics.",
          href: "/learn",
          cta: "Open learning path",
          reward: 30,
        },
        {
          id: "subscription-audit",
          day: "Day 7",
          title: "Audit subscriptions and impulse triggers",
          description: "Cancel, pause or unfollow anything that drains money or attention without real value.",
          href: "/shopping",
          cta: "Open shopping hygiene",
          reward: 35,
        },
        {
          id: "share-progress",
          day: "Day 14",
          title: "Share progress, not private numbers",
          description: "Use a score or certificate card to celebrate learning without exposing sensitive financial data.",
          href: "/rewards",
          cta: "Open rewards",
          reward: 40,
        },
        {
          id: "family-voice",
          day: "Day 21",
          title: "Use Mila for one family lesson",
          description: "Let Mila read a short lesson aloud and turn it into a family conversation.",
          href: "/coach",
          cta: "Ask Mila",
          reward: 45,
        },
      ],
    },
  },
  pl: {
    eyebrow: "Plan rodzinny",
    title: "Pierwsze 30 dni z Coach FI",
    subtitle: "Prosta droga od diagnozy do spokojniejszego systemu pieniędzy w rodzinie.",
    scoreBand: {
      stabilize: {
        title: "Najpierw: stabilizacja presji na gotówkę",
        description: "Nie dokładaj jeszcze złożoności. Zabezpiecz przepływ pieniędzy, zmniejsz presję i użyj bezpłatnej ścieżki pomocy, jeśli jest potrzebna.",
      },
      build: {
        title: "Najpierw: budowa systemu",
        description: "Dochód może pracować lepiej. Skup się na automatycznym odkładaniu, mniejszych wyciekach i jednej rodzinnej rutynie.",
      },
      optimize: {
        title: "Najpierw: optymalizacja i nauka rodziny",
        description: "Masz bazę. Teraz zamień ją w rodzinny system: edukacja inwestycyjna, nawyki dzieci i postęp, którym można się pochwalić.",
      },
    },
    metrics: {
      surplus: "Szacowana nadwyżka miesięczna",
      cushion: "Poduszka bezpieczeństwa",
      firstJar: "Pierwszy słoik 10% edukacja/inwestycje",
    },
    trial: {
      title: "Trial głosowej Mili",
      description: "Użyj Mili przez 7 dni do odczytu wyniku, nauki dziennej i rodzinnych rozmów o pieniądzach.",
      active: "Trial aktywny",
      inactive: "Włącz 7-dniowy trial",
      fairUse: "Premium usuwa dzienne limity nauki i zachowuje fair-use dla AI, głosu i OCR.",
    },
    readPlan: "Odczytaj mój plan rodzinny",
    checklist: "Checklist 30 dni",
    completed: "Ukończono",
    earned: "Zdobyto",
    disclaimer: "Plan edukacyjny. Coach FI nie świadczy indywidualnego doradztwa inwestycyjnego, prawnego ani podatkowego.",
    steps: {
      stabilize: [
        {
          id: "cash-map",
          day: "Dzień 1",
          title: "Rozpisz dochód, rachunki i największy wyciek",
          description: "Wypisz trzy wydatki, które tworzą największą presję, i wybierz jeden do ograniczenia w tym tygodniu.",
          href: "/health-check",
          cta: "Wróć do diagnozy",
          reward: 20,
        },
        {
          id: "shopping-pause",
          day: "Dzień 3",
          title: "Zrób 24-godzinną pauzę zakupową",
          description: "Użyj Higieny zakupowej przed kolejnym niekoniecznym zakupem. Zwróć albo sprzedaj jedną rzecz, jeśli nie ma sensu.",
          href: "/shopping",
          cta: "Otwórz higienę zakupową",
          reward: 30,
        },
        {
          id: "jar-start",
          day: "Dzień 7",
          title: "Zacznij od najmniejszego bezpiecznego słoika",
          description: "Najpierw podziel pieniądze ręcznie. Nawet mały automatyczny przelew buduje nawyk.",
          href: "/learn",
          cta: "Otwórz słoiki",
          reward: 35,
        },
        {
          id: "family-talk",
          day: "Dzień 14",
          title: "Zrób jedną rodzinną rozmowę o pieniądzach",
          description: "Porozmawiaj o potrzebach, zachciankach i wspólnym celu bez oceniania i presji.",
          href: "/kids",
          cta: "Otwórz Kids Mode",
          reward: 40,
        },
      ],
      build: [
        {
          id: "jars-payday",
          day: "Dzień 1",
          title: "Zaplanuj podział wypłaty na 6 słoików",
          description: "Użyj modelu: 55% potrzeby, 10% edukacja, 10% większe cele, 10% przyjemności, 10% inwestycje i 5% hojność.",
          href: "/learn",
          cta: "Otwórz słoiki",
          reward: 30,
        },
        {
          id: "receipt-check",
          day: "Dzień 7",
          title: "Sprawdź paragon względem listy",
          description: "Wklej jeden paragon albo fakturę i oznacz, co było zaplanowane, potrzebne albo impulsywne.",
          href: "/shopping",
          cta: "Analizuj zakupy",
          reward: 35,
        },
        {
          id: "daily-lesson",
          day: "Dzień 14",
          title: "Zrób jedną serię dziennej nauki",
          description: "Niech Mila wyjaśni jedno pojęcie, a potem ukończ wyzwanie dnia za nagrodę.",
          href: "/challenge",
          cta: "Zrób wyzwanie",
          reward: 40,
        },
        {
          id: "kids-routine",
          day: "Dzień 21",
          title: "Stwórz bezpieczną rutynę dla dziecka",
          description: "Użyj Kids Mode do potrzeb, zachcianek, słoika i gwiazdek.",
          href: "/kids",
          cta: "Otwórz Kids Mode",
          reward: 45,
        },
      ],
      optimize: [
        {
          id: "investing-education",
          day: "Dzień 1",
          title: "Zamień nadwyżkę w system nauki",
          description: "Zanim zwiększysz ryzyko, przejdź inflację, fundusz awaryjny i podstawy inwestowania długoterminowego.",
          href: "/learn",
          cta: "Otwórz ścieżkę nauki",
          reward: 30,
        },
        {
          id: "subscription-audit",
          day: "Dzień 7",
          title: "Przejrzyj subskrypcje i bodźce zakupowe",
          description: "Anuluj, zatrzymaj albo wycisz to, co zabiera pieniądze lub uwagę bez realnej wartości.",
          href: "/shopping",
          cta: "Otwórz higienę zakupową",
          reward: 35,
        },
        {
          id: "share-progress",
          day: "Dzień 14",
          title: "Pochwal się postępem, nie prywatnymi liczbami",
          description: "Użyj karty wyniku albo certyfikatu, żeby pokazać naukę bez ujawniania wrażliwych danych.",
          href: "/rewards",
          cta: "Otwórz nagrody",
          reward: 40,
        },
        {
          id: "family-voice",
          day: "Dzień 21",
          title: "Użyj Mili do jednej lekcji rodzinnej",
          description: "Niech Mila odczyta krótką lekcję i zamieni ją w rozmowę w rodzinie.",
          href: "/coach",
          cta: "Zapytaj Milę",
          reward: 45,
        },
      ],
    },
  },
};

const STEP_ICONS = [ShieldCheck, ShoppingBasket, PiggyBank, Users] as const;

function getVariant(score: number): PlanVariant {
  if (score < 40) return "stabilize";
  if (score < 70) return "build";
  return "optimize";
}

function readCompleted(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function writeCompleted(next: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAN_KEY, JSON.stringify(next));
}

export function FamilyActionPlan({
  score,
  monthlyIncome,
  monthlyExpenses,
  savings,
  goal,
  trialActive,
  onStartTrial,
}: FamilyActionPlanProps) {
  const { locale, t } = useLanguage();
  const copy = pickLocalized(PLAN_COPY, locale);
  const intlLocale = LOCALE_INTL[locale] ?? "en-US";
  const variant = getVariant(score);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [earnedThisSession, setEarnedThisSession] = useState(0);

  useEffect(() => {
    setCompleted(readCompleted());
  }, []);

  const steps = useMemo(
    () =>
      copy.steps[variant].map((step, index) => ({
        ...step,
        icon: STEP_ICONS[index] ?? ShieldCheck,
      })),
    [copy.steps, variant]
  );

  const completedCount = steps.filter((step) => completed[step.id]).length;
  const surplus = Math.max(0, monthlyIncome - monthlyExpenses);
  const cushionMonths = monthlyExpenses > 0 ? savings / monthlyExpenses : 0;
  const firstJar = Math.max(0, monthlyIncome * 0.1);

  const planVoice = [
    copy.title,
    copy.scoreBand[variant].title,
    copy.scoreBand[variant].description,
    ...steps.map((step) => `${step.day}. ${step.title}. ${step.description}`),
    copy.trial.fairUse,
  ].join(". ");

  function toggleStep(step: PlanStep) {
    const alreadyDone = Boolean(completed[step.id]);
    const next = { ...completed, [step.id]: !alreadyDone };
    setCompleted(next);
    writeCompleted(next);

    if (!alreadyDone) {
      addTokens(step.reward, step.title, "family_action_plan");
      setEarnedThisSession((value) => value + step.reward);
    }
  }

  return (
    <section className="rounded-lg border border-primary/10 bg-white p-5 shadow-soft md:p-6" aria-labelledby="family-plan-title">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase text-primary">{copy.eyebrow}</p>
          <h2 id="family-plan-title" className="mt-1 text-2xl font-black leading-tight text-text">
            {copy.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-muted">{copy.subtitle}</p>
        </div>
        <VoiceButton text={planVoice} label={copy.readPlan} variant="pill" locale={locale} className="justify-center" />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-lg border border-primary/10 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-black text-text">{copy.scoreBand[variant].title}</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-muted">{copy.scoreBand[variant].description}</p>
              {goal.trim() && <p className="mt-3 rounded-lg bg-white/80 p-3 text-sm font-bold text-text">{goal}</p>}
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <Metric label={copy.metrics.surplus} value={formatCurrency(surplus, t.currency, intlLocale)} />
          <Metric label={copy.metrics.cushion} value={`${cushionMonths.toFixed(1)} m`} />
          <Metric label={copy.metrics.firstJar} value={formatCurrency(firstJar, t.currency, intlLocale)} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <Mic className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div>
            <p className="font-black text-text">{copy.trial.title}</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-muted">{copy.trial.description}</p>
            <p className="mt-1 text-xs font-bold text-amber-800">{copy.trial.fairUse}</p>
          </div>
        </div>
        <Button type="button" variant={trialActive ? "success" : "default"} onClick={onStartTrial}>
          {trialActive ? copy.trial.active : copy.trial.inactive}
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-primary">{copy.checklist}</p>
          <p className="text-sm font-semibold text-muted">
            {completedCount}/{steps.length} {copy.completed}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-primary/10 bg-primary/5 px-3 py-2 text-sm font-black text-primary">
          <Coins className="h-4 w-4" aria-hidden="true" />
          {copy.earned}: +{earnedThisSession}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {steps.map((step) => {
          const Icon = step.icon;
          const checked = Boolean(completed[step.id]);

          return (
            <article
              key={step.id}
              className={cn(
                "rounded-lg border p-4 transition",
                checked ? "border-success/30 bg-success/10" : "border-primary/10 bg-background/35"
              )}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggleStep(step)}
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    checked ? "border-success bg-success text-text" : "border-primary/15 bg-white text-primary hover:bg-primary/5"
                  )}
                  aria-label={`${checked ? copy.completed : "Complete"}: ${step.title}`}
                >
                  {checked ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : <Icon className="h-5 w-5" aria-hidden="true" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-white px-2 py-1 text-xs font-black uppercase text-primary">{step.day}</span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-accent/55 px-2 py-1 text-xs font-black text-[#6D5216]">
                      <Coins className="h-3.5 w-3.5" aria-hidden="true" />
                      +{step.reward}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-black leading-tight text-text">{step.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-muted">{step.description}</p>
                  <Link
                    href={step.href}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-black text-primary transition hover:text-primary/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {step.cta}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/10 bg-white/70 p-3 text-xs font-bold leading-5 text-muted">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        {copy.disclaimer}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-primary/10 bg-white/85 p-3">
      <p className="text-xs font-black uppercase text-muted">{label}</p>
      <p className="mt-1 text-lg font-black text-text">{value}</p>
    </div>
  );
}
