"use client";

import {
  ArrowRight,
  Banknote,
  BookOpenCheck,
  BrainCircuit,
  Calculator,
  ChartNoAxesCombined,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Landmark,
  Mic,
  PiggyBank,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { mockUser } from "@/data/mockUser";
import type { Locale } from "@/lib/i18n";
import { dashboardCopy } from "@/lib/dashboardCopy";
import { formatCurrency, formatNumber, LOCALE_INTL } from "@/lib/utils";

type DashboardCopy = (typeof dashboardCopy)[Locale];

const routeVisuals = [
  { icon: ShieldCheck, progress: 53, tone: "#7668E8" },
  { icon: WalletCards, progress: 68, tone: "#7DD3DC" },
  { icon: Landmark, progress: 42, tone: "#F6A66D" },
  { icon: TrendingUp, progress: 28, tone: "#A89CF6" },
  { icon: PiggyBank, progress: 18, tone: "#E8C878" },
] satisfies Array<{
  icon: LucideIcon;
  progress: number;
  tone: string;
}>;

const lessonIcons = [CreditCard, ChartNoAxesCombined, PiggyBank] satisfies LucideIcon[];

const spendingSignalsData = [
  { value: 132, change: -18, tone: "#7668E8" },
  { value: 640, change: 96, tone: "#F6A66D" },
  { value: 418, change: 0, tone: "#7DD3DC" },
  { value: 840, change: 140, tone: "#55B893" },
];

type ChartDatum = {
  year: string;
  cash: number;
  invest: number;
};

export default function Page() {
  const { t, locale } = useLanguage();
  const copy = dashboardCopy[locale];
  const intlLocale = LOCALE_INTL[locale] ?? "en-US";
  const fmt = (v: number) => formatCurrency(v, t.currency, intlLocale);

  const metrics = copy.metrics.map((metric) => ({
    ...metric,
    value: metric.value === "dynamic" ? fmt(840) : metric.value,
  }));

  const spendingSignals = spendingSignalsData.map((signal, index) => ({
    label: copy.budget.signals[index] ?? "",
    tone: signal.tone,
    value: fmt(signal.value),
    change: signal.change === 0 ? "0" : `${signal.change > 0 ? "+" : "-"}${fmt(Math.abs(signal.change))}`,
  }));

  return (
    <div className="space-y-8 pb-6" aria-labelledby="dashboard-title">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
        <div className="overflow-hidden rounded-lg border border-primary/10 bg-white/90 shadow-soft">
          <div className="grid gap-0 2xl:grid-cols-[minmax(0,1fr)_310px]">
            <div className="p-5 md:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-black uppercase text-primary">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {copy.hero.mapLabel}
                </span>
                <span className="rounded-lg bg-accent/55 px-3 py-1.5 text-xs font-black uppercase text-[#6D5216]">
                  {copy.hero.todayStep}
                </span>
              </div>

              <div className="mt-5 flex items-start gap-3">
                <h1
                  id="dashboard-title"
                  className="max-w-3xl break-words text-4xl font-black leading-[1.05] text-text hyphens-auto md:text-5xl"
                >
                  {copy.hero.title}
                </h1>
                <VoiceButton
                  text={`${copy.hero.title}. ${copy.hero.description}`}
                  locale={locale}
                  variant="icon"
                  className="mt-1 shrink-0"
                />
              </div>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-muted md:text-lg">
                {copy.hero.description}
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <Metric key={metric.label} {...metric} />
                ))}
              </div>

              <div className="mt-7 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,11.5rem),1fr))]">
                <Button asChild size="lg" className="w-full px-4 text-sm font-black leading-tight shadow-none md:text-[15px]">
                  <Link href="/health-check">
                    <Calculator className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 whitespace-normal [overflow-wrap:normal] [word-break:normal]">
                      {copy.hero.diagnosis}
                    </span>
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full px-4 text-sm font-black leading-tight md:text-[15px]">
                  <Link href="/learn">
                    <Play className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 whitespace-normal [overflow-wrap:normal] [word-break:normal]">
                      {copy.hero.continueLearning}
                    </span>
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full px-4 text-sm font-black leading-tight md:text-[15px]">
                  <Link href="/voice-demo">
                    <Mic className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 whitespace-normal [overflow-wrap:normal] [word-break:normal]">
                      {copy.hero.voiceDemo}
                    </span>
                  </Link>
                </Button>
              </div>
            </div>

            <div className="border-t border-primary/10 bg-[#EEF2FF] p-5 text-text md:p-6 2xl:border-l 2xl:border-t-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase text-muted">{copy.score.title}</p>
                  <p className="mt-2 text-6xl font-black leading-none text-text">62</p>
                  <p className="mt-1 text-sm font-bold text-muted">{copy.score.outOf}</p>
                </div>
                <div
                  className="grid h-24 w-24 shrink-0 place-items-center rounded-full"
                  style={{
                    background:
                      "conic-gradient(#7668E8 0deg 223deg, rgba(118,104,232,.16) 223deg 360deg)",
                  }}
                  aria-hidden="true"
                >
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-lg font-black text-primary">
                    {copy.score.delta}
                  </div>
                </div>
              </div>

              <div className="mt-7 rounded-lg bg-white/72 p-4">
                <p className="text-sm font-black text-text">{copy.score.nextTitle}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-muted">{copy.score.nextText(fmt(500))}</p>
                <Link
                  href="/coach"
                  className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-black text-white transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {copy.score.askMila}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <CoachPocket copy={copy.coachPocket} />
      </section>

      <FinanceRoute copy={copy} fmt={fmt} />

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_420px]">
        <DecisionSimulator copy={copy} fmt={fmt} />

        <div className="grid gap-6">
          <section className="rounded-lg border border-primary/10 bg-white/90 p-5 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-primary">{copy.budget.eyebrow}</p>
                <h2 className="mt-1 text-2xl font-black text-text">{copy.budget.title}</h2>
              </div>
              <Button size="icon" variant="outline" aria-label={copy.budget.addExpense}>
                <Plus className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>

            <div className="mt-5 space-y-3">
              {spendingSignals.map((signal) => (
                <SignalRow key={signal.label} {...signal} />
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-primary/10 bg-white/90 p-5 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-primary">{copy.lessons.eyebrow}</p>
                <h2 className="mt-1 text-2xl font-black text-text">{copy.lessons.title}</h2>
              </div>
              <Link href="/learn" className="text-sm font-black text-primary hover:underline">
                {copy.lessons.all}
              </Link>
            </div>

            <div className="mt-5 grid gap-3">
              {copy.lessons.items.map((lesson, index) => (
                <LessonCard key={lesson.title} {...lesson} icon={lessonIcons[index] ?? PiggyBank} />
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-primary/10 bg-[#F3F5FF] px-3 py-3">
      <p className="whitespace-nowrap text-[10px] font-black uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1.5 whitespace-nowrap text-xl font-black leading-none text-text">{value}</p>
      <p className="mt-1 whitespace-nowrap text-xs font-bold text-muted">{caption}</p>
    </div>
  );
}

function CoachPocket({ copy }: { copy: DashboardCopy["coachPocket"] }) {
  const coachActions = copy.actions.map((action, index) => ({
    ...action,
    icon: [BrainCircuit, Banknote, BookOpenCheck][index] ?? BrainCircuit,
  }));

  return (
    <aside
      className="self-start rounded-lg border border-primary/10 bg-white/90 p-5 shadow-soft"
      aria-labelledby="coach-pocket-title"
    >
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary/10">
          <img src="/coach-fi-avatar.svg" alt={copy.alt} className="h-14 w-14 object-contain" />
        </div>
        <div>
          <p className="text-xs font-black uppercase text-primary">{copy.eyebrow}</p>
          <h2 id="coach-pocket-title" className="text-2xl font-black text-text">
            {copy.title}
          </h2>
        </div>
      </div>

      <div className="mt-5 rounded-lg bg-[#F3F5FF] p-4">
        <p className="text-sm font-semibold leading-6 text-muted">{copy.briefing}</p>
      </div>

      <div className="mt-5 grid gap-3">
        {coachActions.map((action) => (
          <CoachAction key={action.href} href={action.href} icon={action.icon} label={action.label} />
        ))}
      </div>
    </aside>
  );
}

function CoachAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-primary/10 bg-white px-4 py-3 text-sm font-black text-text transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
        {label}
      </span>
      <ArrowRight className="h-4 w-4 text-muted" aria-hidden="true" />
    </Link>
  );
}

function FinanceRoute({ copy, fmt }: { copy: DashboardCopy; fmt: (value: number) => string }) {
  const steps = copy.route.steps.map((step, index) => ({
    ...step,
    ...routeVisuals[index],
    subtitle: step.surplus ? `${fmt(840)} ${step.subtitle}` : step.subtitle,
  }));

  return (
    <section className="rounded-lg border border-primary/10 bg-white/88 p-5 shadow-soft" aria-labelledby="route-title">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-primary">{copy.route.eyebrow}</p>
          <h2 id="route-title" className="mt-1 text-2xl font-black text-text">
            {copy.route.title}
          </h2>
        </div>
        <p className="max-w-xl text-sm font-semibold leading-6 text-muted">{copy.route.description}</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {steps.map((step, index) => (
          <RouteStep key={step.title} step={step} index={index} total={steps.length} />
        ))}
      </div>
    </section>
  );
}

function RouteStep({
  step,
  index,
  total,
}: {
  step: {
    title: string;
    subtitle: string;
    icon: LucideIcon;
    progress: number;
    tone: string;
  };
  index: number;
  total: number;
}) {
  const Icon = step.icon;

  return (
    <article className="relative rounded-lg border border-primary/10 bg-[#F3F5FF] p-4">
      {index < total - 1 && (
        <span
          className="absolute left-[calc(100%-2px)] top-8 hidden h-0.5 w-4 bg-primary/20 md:block"
          aria-hidden="true"
        />
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg text-white" style={{ backgroundColor: step.tone }}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="text-xs font-black uppercase text-muted">0{index + 1}</span>
      </div>
      <h3 className="mt-4 text-lg font-black text-text">{step.title}</h3>
      <p className="mt-1 text-sm font-bold text-muted">{step.subtitle}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full" style={{ width: `${step.progress}%`, backgroundColor: step.tone }} />
      </div>
    </article>
  );
}

function DecisionSimulator({ copy, fmt }: { copy: DashboardCopy; fmt: (value: number) => string }) {
  const [monthlySaving, setMonthlySaving] = useState(900);
  const [years, setYears] = useState(15);
  const [overpayment, setOverpayment] = useState(400);

  const simulation = useMemo(() => {
    const monthlyExpenses = mockUser.monthlyExpenses;
    const emergencyTarget = monthlyExpenses * 6;
    const emergencyGap = Math.max(emergencyTarget - mockUser.savings, 0);
    const monthsToEmergency = Math.max(1, Math.ceil(emergencyGap / monthlySaving));
    const monthlyRate = 0.055 / 12;
    const months = years * 12;
    const futureValue =
      monthlyRate === 0
        ? monthlySaving * months
        : monthlySaving * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    const conservativeValue = monthlySaving * months;
    const estimatedInterestSaved = overpayment * 12 * Math.min(years, 12) * 0.42;
    const chartData = Array.from({ length: years + 1 }, (_, year) => {
      const month = year * 12;
      const invested =
        month === 0 ? 0 : monthlySaving * ((Math.pow(1 + monthlyRate, month) - 1) / monthlyRate);

      return {
        year: copy.simulator.yearTick(year),
        cash: monthlySaving * month,
        invest: Math.round(invested),
      };
    }).filter(
      (_, index) => index === 0 || index === years || index % Math.max(1, Math.floor(years / 5)) === 0
    );

    return {
      emergencyTarget,
      monthsToEmergency,
      futureValue,
      conservativeValue,
      estimatedInterestSaved,
      chartData,
    };
  }, [copy.simulator, monthlySaving, overpayment, years]);

  return (
    <section className="rounded-lg border border-primary/10 bg-white/90 p-5 shadow-soft" aria-labelledby="sim-title">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-primary">{copy.simulator.eyebrow}</p>
          <h2 id="sim-title" className="mt-1 text-2xl font-black text-text">
            {copy.simulator.title}
          </h2>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-success/40 px-3 py-2 text-xs font-black uppercase text-[#276A55]">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {copy.simulator.badge}
        </span>
      </div>

      <div className="mt-6 grid gap-6 2xl:grid-cols-[310px_minmax(0,1fr)]">
        <div className="space-y-5">
          <SliderControl
            id="monthly-saving"
            label={copy.simulator.monthlySaving}
            value={monthlySaving}
            min={100}
            max={2500}
            step={50}
            formatted={fmt(monthlySaving)}
            onChange={setMonthlySaving}
          />
          <SliderControl
            id="investment-years"
            label={copy.simulator.years}
            value={years}
            min={3}
            max={30}
            step={1}
            formatted={copy.simulator.yearsValue(years)}
            onChange={setYears}
          />
          <SliderControl
            id="overpayment"
            label={copy.simulator.overpayment}
            value={overpayment}
            min={0}
            max={2000}
            step={50}
            formatted={fmt(overpayment)}
            onChange={setOverpayment}
          />
        </div>

        <div className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <ResultTile
              icon={ShieldCheck}
              label={copy.simulator.results.emergency}
              value={copy.simulator.results.months(simulation.monthsToEmergency)}
            />
            <ResultTile icon={TrendingUp} label={copy.simulator.results.growth} value={fmt(simulation.futureValue)} />
            <ResultTile
              icon={CircleDollarSign}
              label={copy.simulator.results.overpayment}
              value={fmt(simulation.estimatedInterestSaved)}
            />
          </div>

          <GrowthChart data={simulation.chartData} labels={copy.simulator} />
        </div>
      </div>
    </section>
  );
}

function SliderControl({
  id,
  label,
  value,
  min,
  max,
  step,
  formatted,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatted: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-black text-text">
          {label}
        </label>
        <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-black text-primary">{formatted}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 h-2 w-full cursor-pointer"
        style={{ accentColor: "#7668E8" }}
      />
    </div>
  );
}

function ResultTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-primary/10 bg-[#F3F5FF] p-4">
      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
      <p className="mt-3 text-xs font-black uppercase text-muted">{label}</p>
      <p className="mt-1 text-xl font-black text-text">{value}</p>
    </div>
  );
}

function SignalRow({
  label,
  value,
  change,
  tone,
}: {
  label: string;
  value: string;
  change: string;
  tone: string;
}) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-4 rounded-lg border border-primary/10 bg-[#F3F5FF] px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tone }} />
        <p className="font-black text-text">{label}</p>
      </div>
      <div className="text-right">
        <p className="font-black text-text">{value}</p>
        <p className="text-xs font-bold text-muted">{change}</p>
      </div>
    </div>
  );
}

function GrowthChart({
  data,
  labels,
}: {
  data: ChartDatum[];
  labels: Pick<DashboardCopy["simulator"], "chartTitle" | "chartCash" | "chartInvest">;
}) {
  const width = 640;
  const height = 260;
  const left = 46;
  const right = 20;
  const top = 24;
  const bottom = 42;
  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;
  const maxValue = Math.max(...data.map((item) => item.invest), 1);
  const pointsFor = (key: "cash" | "invest") =>
    data.map((item, index) => {
      const x = left + (index / Math.max(data.length - 1, 1)) * innerWidth;
      const y = top + innerHeight - (item[key] / maxValue) * innerHeight;
      return { ...item, x, y, value: item[key] };
    });
  const cashPoints = pointsFor("cash");
  const investPoints = pointsFor("invest");
  const line = (points: Array<{ x: number; y: number }>) =>
    points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = (points: Array<{ x: number; y: number }>) =>
    `M ${points.map((point) => `${point.x} ${point.y}`).join(" L ")} L ${
      points[points.length - 1].x
    } ${top + innerHeight} L ${points[0].x} ${top + innerHeight} Z`;

  return (
    <div className="rounded-lg border border-primary/10 bg-[#F3F5FF] p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-sm font-black text-text">{labels.chartTitle}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs font-black text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
            {labels.chartCash}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            {labels.chartInvest}
          </span>
        </div>
      </div>
      <svg
        role="img"
        aria-label={`${labels.chartTitle}: ${labels.chartCash} vs ${labels.chartInvest}`}
        viewBox={`0 0 ${width} ${height}`}
        className="h-64 w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="coachfi-cash-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7DD3DC" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#7DD3DC" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="coachfi-invest-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7668E8" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#7668E8" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = top + innerHeight - tick * innerHeight;
          return (
            <g key={tick}>
              <line x1={left} x2={width - right} y1={y} y2={y} stroke="#DCE2F8" strokeDasharray="5 6" />
              <text x={8} y={y + 4} fill="#66758F" fontSize="12" fontWeight="800">
                {formatNumber((maxValue * tick) / 1000)}k
              </text>
            </g>
          );
        })}
        <path d={area(cashPoints)} fill="url(#coachfi-cash-area)" />
        <path d={area(investPoints)} fill="url(#coachfi-invest-area)" />
        <polyline points={line(cashPoints)} fill="none" stroke="#7DD3DC" strokeWidth="4" strokeLinecap="round" />
        <polyline points={line(investPoints)} fill="none" stroke="#7668E8" strokeWidth="4" strokeLinecap="round" />
        {investPoints.map((point, index) => (
          <g key={`${point.year}-${point.value}`}>
            <circle cx={point.x} cy={point.y} r="5" fill="#7668E8" stroke="#F3F5FF" strokeWidth="3" />
            <text
              x={point.x}
              y={height - 14}
              fill="#66758F"
              fontSize="12"
              fontWeight="800"
              textAnchor={index === 0 ? "start" : index === investPoints.length - 1 ? "end" : "middle"}
            >
              {point.year}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function LessonCard({
  title,
  time,
  tag,
  icon: Icon,
}: {
  title: string;
  time: string;
  tag: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href="/learn"
      className="flex min-h-20 items-center gap-4 rounded-lg border border-primary/10 bg-[#F3F5FF] p-4 transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary text-white">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-black uppercase text-primary">
          {tag} - {time}
        </span>
        <span className="mt-1 block text-base font-black leading-tight text-text">{title}</span>
      </span>
      <ArrowRight className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
    </Link>
  );
}
