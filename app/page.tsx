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
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { mockUser } from "@/data/mockUser";
import { EXAMPLE_SCORE, useHealthSnapshot, type HealthAnswers } from "@/context/progressHooks";
import { getAllQuestionIds } from "@/lib/allQuestions";
import { getAllStageProgress } from "@/lib/learningProgress";
import { getAllCards } from "@/lib/srs";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { dashboardCopy } from "@/lib/dashboardCopy";
import { formatCurrency, formatNumber, LOCALE_INTL } from "@/lib/utils";

type DashboardCopy = (typeof dashboardCopy)["en"];

// The dashboard ships with illustrative figures. Until the user runs the free
// Health Check we must label them clearly as an example — never as their data.
const demoCopy: LocalizedMap<{ badge: string; note: string; yourScore: string }> = {
  en: {
    badge: "Example",
    note: "Sample data — run the free Health Check to see your own numbers.",
    yourScore: "Your score",
  },
  pl: {
    badge: "Przykład",
    note: "Dane przykładowe — zrób darmową diagnozę, aby zobaczyć swoje liczby.",
    yourScore: "Twój wynik",
  },
  es: {
    badge: "Ejemplo",
    note: "Datos de ejemplo: haz el diagnóstico gratuito para ver tus cifras.",
    yourScore: "Tu puntuación",
  },
  fr: {
    badge: "Exemple",
    note: "Données d'exemple — faites le diagnostic gratuit pour voir vos chiffres.",
    yourScore: "Votre score",
  },
  ja: {
    badge: "サンプル",
    note: "サンプルデータです。無料診断を実行すると実際の数値が表示されます。",
    yourScore: "あなたのスコア",
  },
  zh: {
    badge: "示例",
    note: "示例数据：完成免费的财务诊断即可查看你自己的数据。",
    yourScore: "你的得分",
  },
  hi: {
    badge: "उदाहरण",
    note: "नमूना डेटा: अपने आंकड़े देखने के लिए मुफ़्त वित्तीय जांच करें।",
    yourScore: "आपका स्कोर",
  },
  "pt-BR": {
    badge: "Exemplo",
    note: "Dados de exemplo: faça o Check-up gratuito para ver os seus números.",
    yourScore: "Sua pontuação",
  },
  tr: {
    badge: "Örnek",
    note: "Örnek veriler: kendi rakamlarını görmek için ücretsiz Finans Kontrolü'nü yap.",
    yourScore: "Puanın",
  },
};

// Copy for values derived from the user's own Health Check answers.
const realCopy: LocalizedMap<{
  nextNoSurplus: string;
  nextCushionDone: string;
  risk: { none: string; low: string; medium: string; high: string };
  budgetNote: string;
}> = {
  en: {
    nextNoSurplus: "Your expenses are at or above your income. Start by finding one regular cost you can cut this month.",
    nextCushionDone: "Your emergency fund covers about 6 months. Next, learn how long-term investing works before taking any risk.",
    risk: { none: "no debt", low: "low debt load", medium: "medium debt load", high: "high debt load" },
    budgetNote: "Example categories — Coach FI does not read your bank data.",
  },
  pl: {
    nextNoSurplus: "Wydatki są równe dochodom lub je przekraczają. Zacznij od znalezienia jednego stałego kosztu do obcięcia w tym miesiącu.",
    nextCushionDone: "Poduszka finansowa pokrywa ok. 6 miesięcy. Teraz poznaj zasady długoterminowego inwestowania, zanim podejmiesz ryzyko.",
    risk: { none: "brak długu", low: "niskie zadłużenie", medium: "średnie zadłużenie", high: "wysokie zadłużenie" },
    budgetNote: "Przykładowe kategorie — Coach FI nie czyta danych z Twojego banku.",
  },
  es: {
    nextNoSurplus: "Tus gastos igualan o superan tus ingresos. Empieza por encontrar un gasto fijo que puedas recortar este mes.",
    nextCushionDone: "Tu fondo de emergencia cubre unos 6 meses. Ahora aprende cómo funciona la inversión a largo plazo antes de asumir riesgos.",
    risk: { none: "sin deudas", low: "deuda baja", medium: "deuda media", high: "deuda alta" },
    budgetNote: "Categorías de ejemplo: Coach FI no lee tus datos bancarios.",
  },
  fr: {
    nextNoSurplus: "Vos dépenses égalent ou dépassent vos revenus. Commencez par repérer une dépense régulière à réduire ce mois-ci.",
    nextCushionDone: "Votre épargne de précaution couvre environ 6 mois. Découvrez maintenant l'investissement à long terme avant de prendre des risques.",
    risk: { none: "aucune dette", low: "endettement faible", medium: "endettement moyen", high: "endettement élevé" },
    budgetNote: "Catégories d'exemple — Coach FI ne lit pas vos données bancaires.",
  },
  zh: {
    nextNoSurplus: "你的支出已等于或超过收入。先找出本月可以削减的一项固定开支。",
    nextCushionDone: "你的应急基金大约可覆盖 6 个月。下一步，在承担风险前先了解长期投资的原理。",
    risk: { none: "无负债", low: "负债较低", medium: "负债中等", high: "负债较高" },
    budgetNote: "示例类别 — Coach FI 不会读取你的银行数据。",
  },
  ja: {
    nextNoSurplus: "支出が収入と同じか上回っています。まず今月削れる固定費を1つ見つけましょう。",
    nextCushionDone: "緊急資金は約6か月分あります。次はリスクを取る前に長期投資のしくみを学びましょう。",
    risk: { none: "借入なし", low: "借入は少なめ", medium: "借入は中程度", high: "借入が多め" },
    budgetNote: "カテゴリはサンプルです。Coach FIは銀行データを読み取りません。",
  },
  hi: {
    nextNoSurplus: "आपका खर्च आपकी आय के बराबर या उससे ज़्यादा है। इस महीने घटाने लायक एक नियमित खर्च ढूंढकर शुरुआत करें।",
    nextCushionDone: "आपका इमरजेंसी फ़ंड लगभग 6 महीने का है। अब जोखिम लेने से पहले लंबी अवधि के निवेश को समझें।",
    risk: { none: "कोई कर्ज़ नहीं", low: "कम कर्ज़", medium: "मध्यम कर्ज़", high: "ज़्यादा कर्ज़" },
    budgetNote: "उदाहरण श्रेणियां — Coach FI आपका बैंक डेटा नहीं पढ़ता।",
  },
  "pt-BR": {
    nextNoSurplus: "Seus gastos igualam ou superam sua renda. Comece encontrando um custo fixo que você possa cortar este mês.",
    nextCushionDone: "Sua reserva de emergência cobre cerca de 6 meses. Agora aprenda como funciona o investimento de longo prazo antes de correr riscos.",
    risk: { none: "sem dívidas", low: "dívida baixa", medium: "dívida média", high: "dívida alta" },
    budgetNote: "Categorias de exemplo — o Coach FI não lê seus dados bancários.",
  },
  tr: {
    nextNoSurplus: "Giderlerin gelirine eşit ya da daha fazla. Bu ay kısabileceğin bir düzenli gideri bularak başla.",
    nextCushionDone: "Acil durum fonun yaklaşık 6 ayı karşılıyor. Risk almadan önce uzun vadeli yatırımın nasıl işlediğini öğren.",
    risk: { none: "borç yok", low: "düşük borç", medium: "orta borç", high: "yüksek borç" },
    budgetNote: "Örnek kategoriler — Coach FI banka verilerini okumaz.",
  },
};

type DebtLevel = "none" | "low" | "medium" | "high";

/** Plain-number view of the user's own Health Check answers. */
function deriveFromAnswers(answers: HealthAnswers) {
  const surplus = answers.monthlyIncome - answers.monthlyExpenses;
  const cushionMonths = answers.monthlyExpenses > 0 ? answers.savings / answers.monthlyExpenses : 0;
  const savingsRate = answers.monthlyIncome > 0 ? Math.max(0, surplus) / answers.monthlyIncome : 0;
  // Same debt-pressure measure the Health Check score uses.
  const debtPressure = answers.monthlyIncome > 0 ? answers.debt / (answers.monthlyIncome * 4) : answers.debt > 0 ? 1 : 0;
  const debtLevel: DebtLevel =
    answers.debt <= 0 ? "none" : debtPressure < 0.25 ? "low" : debtPressure < 0.75 ? "medium" : "high";
  // A monthly transfer the user can actually afford: half of the surplus, rounded to 10.
  const suggestedTransfer = surplus > 0 ? Math.max(10, Math.round((surplus * 0.5) / 10) * 10) : 0;
  return { surplus, cushionMonths, savingsRate, debtPressure, debtLevel, suggestedTransfer };
}

function ExampleBadge({ label }: { label: string }) {
  return (
    <span className="shrink-0 whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-amber-700">
      {label}
    </span>
  );
}

const routeVisuals = [
  { icon: ShieldCheck, progress: 53, tone: "var(--cf-area-mila)" },
  { icon: WalletCards, progress: 68, tone: "var(--cf-area-learn)" },
  { icon: Landmark, progress: 42, tone: "var(--cf-area-goals)" },
  { icon: TrendingUp, progress: 28, tone: "var(--cf-area-progress)" },
  { icon: PiggyBank, progress: 18, tone: "var(--cf-area-rewards)" },
] satisfies Array<{
  icon: LucideIcon;
  progress: number;
  tone: string;
}>;

const lessonIcons = [CreditCard, ChartNoAxesCombined, PiggyBank] satisfies LucideIcon[];

const spendingSignalsData = [
  { value: 132, change: -18, tone: "var(--cf-chart-1)" },
  { value: 640, change: 96, tone: "var(--cf-chart-3)" },
  { value: 418, change: 0, tone: "var(--cf-chart-2)" },
  { value: 840, change: 140, tone: "var(--cf-chart-highlight)" },
];

type ChartDatum = {
  year: string;
  cash: number;
  invest: number;
};

export default function Page() {
  const { t, locale } = useLanguage();
  const copy = pickLocalized(dashboardCopy, locale);
  const intlLocale = LOCALE_INTL[locale] ?? "en-US";
  const fmt = (v: number) => formatCurrency(v, t.currency, intlLocale);
  const demo = pickLocalized(demoCopy, locale);

  const real = pickLocalized(realCopy, locale);

  // Real score + metrics once the user has run the diagnosis; labelled examples until then.
  const health = useHealthSnapshot();
  const realScore = health?.score ?? null;
  const answers = health?.answers ?? null;
  const derived = answers ? deriveFromAnswers(answers) : null;
  const [lessonsDone, setLessonsDone] = useState(0);
  const [lessonsTotal, setLessonsTotal] = useState(0);
  const [stageProgress, setStageProgress] = useState<Record<string, number>>({});
  useEffect(() => {
    const read = () => {
      const ids = getAllQuestionIds(locale);
      setLessonsTotal(ids.length);
      const seen = new Set(getAllCards().filter((c) => c.repetitions > 0).map((c) => c.id));
      setLessonsDone(ids.filter((id) => seen.has(id)).length);
      setStageProgress(Object.fromEntries(getAllStageProgress().map((stage) => [stage.stageId, stage.progressPct])));
    };
    read();
    window.addEventListener("coachfi-learning", read);
    window.addEventListener("coachfi-cloud-synced", read);
    return () => {
      window.removeEventListener("coachfi-learning", read);
      window.removeEventListener("coachfi-cloud-synced", read);
    };
  }, [locale]);
  const isDemo = realScore === null;
  const shownScore = realScore ?? EXAMPLE_SCORE;
  const scoreArc = Math.round((Math.max(0, Math.min(100, shownScore)) / 100) * 360);

  // Derive the headline metrics from the user's own Health Check answers once
  // they exist; the hardcoded figures are only a labelled example before that.
  const metrics = copy.metrics.map((metric, index) => {
    if (!answers || !derived) {
      return { ...metric, value: metric.value === "dynamic" ? fmt(840) : metric.value };
    }
    if (index === 0) {
      // Cushion: savings as a share of a 6-month emergency-fund goal.
      const pct = Math.max(0, Math.min(100, Math.round((derived.cushionMonths / 6) * 100)));
      return { ...metric, value: `${pct}%` };
    }
    if (index === 1) {
      // Monthly surplus: income minus expenses.
      return { ...metric, value: fmt(derived.surplus) };
    }
    return { ...metric, value: `${lessonsDone}/${lessonsTotal}` };
  });

  const nextStepText = !derived
    ? copy.score.nextText(fmt(500))
    : derived.surplus <= 0
      ? real.nextNoSurplus
      : derived.cushionMonths >= 6
        ? real.nextCushionDone
        : copy.score.nextText(fmt(derived.suggestedTransfer));

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
                <span className="rounded-lg bg-accent px-3 py-1.5 text-xs font-black uppercase text-text">
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

              <div className="mt-7">
                {isDemo && (
                  <p className="mb-2 flex items-center gap-2 text-xs font-bold text-muted">
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-amber-700">
                      {demo.badge}
                    </span>
                    {demo.note}
                  </p>
                )}
                <div className="grid gap-3 sm:grid-cols-3">
                  {metrics.map((metric) => (
                    <Metric key={metric.label} {...metric} />
                  ))}
                </div>
              </div>

              {/* One primary action above the fold — which one depends on
                  whether the user already has a score. A second, secondary
                  link covers the next-best action instead of three
                  competing buttons. */}
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
                {isDemo ? (
                  <>
                    <Button asChild size="lg" className="px-6 text-sm font-black shadow-none md:text-[15px]">
                      <Link href="/health-check">
                        <Calculator className="h-5 w-5 shrink-0" aria-hidden="true" />
                        {copy.hero.diagnosis}
                      </Link>
                    </Button>
                    <Link
                      href="/coach"
                      className="inline-flex items-center gap-1.5 text-sm font-black text-primary hover:underline"
                    >
                      <Mic className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {copy.hero.voiceDemo}
                    </Link>
                  </>
                ) : (
                  <>
                    <Button asChild size="lg" className="px-6 text-sm font-black shadow-none md:text-[15px]">
                      <Link href="/coach">
                        <Mic className="h-5 w-5 shrink-0" aria-hidden="true" />
                        {copy.score.askMila}
                      </Link>
                    </Button>
                    <Link
                      href="/learn"
                      className="inline-flex items-center gap-1.5 text-sm font-black text-primary hover:underline"
                    >
                      {copy.hero.continueLearning}
                      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-primary/10 bg-surface-brand p-5 text-text md:p-6 2xl:border-l 2xl:border-t-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-black uppercase text-muted">
                      {isDemo ? copy.score.title : demo.yourScore}
                    </p>
                    {isDemo && <ExampleBadge label={demo.badge} />}
                  </div>
                  <p className="mt-2 text-6xl font-black leading-none text-text" data-testid="home-score">
                    {shownScore}
                  </p>
                  <p className="mt-1 text-sm font-bold text-muted">{copy.score.outOf}</p>
                </div>
                <div
                  className="grid h-24 w-24 shrink-0 place-items-center rounded-full"
                  style={{
                    background: `conic-gradient(var(--cf-grape) 0deg ${scoreArc}deg, var(--cf-surface) ${scoreArc}deg 360deg)`,
                  }}
                  aria-hidden="true"
                >
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-primary">
                    <ShieldCheck className="h-7 w-7" aria-hidden="true" />
                  </div>
                </div>
              </div>

              {isDemo && (
                <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-800">
                  {demo.note}
                </p>
              )}

              <div className="mt-7 rounded-lg bg-white/72 p-4">
                <p className="text-sm font-black text-text">{copy.score.nextTitle}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-muted" data-testid="home-next-step">{nextStepText}</p>
                <Link
                  href="/coach"
                  className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg cf-press bg-primary px-4 py-2 text-sm font-black text-on-primary transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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

      <FinanceRoute
        copy={copy}
        fmt={fmt}
        intlLocale={intlLocale}
        derived={derived}
        stageProgress={stageProgress}
        riskLabels={real.risk}
        exampleLabel={demo.badge}
        exampleNote={demo.note}
      />

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_420px]">
        <DecisionSimulator copy={copy} fmt={fmt} answers={answers} />

        <div className="grid gap-6">
          <section className="rounded-lg border border-primary/10 bg-white/90 p-5 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-primary">{copy.budget.eyebrow}</p>
                <h2 className="mt-1 text-2xl font-black text-text">{copy.budget.title}</h2>
              </div>
              <ExampleBadge label={demo.badge} />
            </div>
            {/* No spending data is ever collected, so this section is always an example. */}
            <p className="mt-2 text-xs font-bold text-muted">{real.budgetNote}</p>

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
    <div className="min-w-0 overflow-hidden rounded-lg border border-primary/10 bg-background px-3 py-3">
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
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-area-mila">
          <img src="/brand/mila/mila-head-neutral.svg" alt={copy.alt} className="h-14 w-14 object-contain" />
        </div>
        <div>
          <p className="text-xs font-black uppercase text-primary">{copy.eyebrow}</p>
          <h2 id="coach-pocket-title" className="text-2xl font-black text-text">
            {copy.title}
          </h2>
        </div>
      </div>

      <div className="mt-5 rounded-lg bg-background p-4">
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

function FinanceRoute({
  copy,
  fmt,
  intlLocale,
  derived,
  stageProgress,
  riskLabels,
  exampleLabel,
  exampleNote,
}: {
  copy: DashboardCopy;
  fmt: (value: number) => string;
  intlLocale: string;
  derived: ReturnType<typeof deriveFromAnswers> | null;
  stageProgress: Record<string, number>;
  riskLabels: Record<DebtLevel, string>;
  exampleLabel: string;
  exampleNote: string;
}) {
  const clampPct = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
  const steps = copy.route.steps.map((step, index) => {
    const visual = routeVisuals[index];
    if (!derived) {
      // Illustrative example, labelled as such above the grid.
      return { ...step, ...visual, subtitle: step.surplus ? `${fmt(840)} ${step.subtitle}` : step.subtitle };
    }
    if (index === 0) {
      const months = Math.round(derived.cushionMonths * 10) / 10;
      return {
        ...step,
        ...visual,
        subtitle: `${months.toLocaleString(intlLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} / ${copy.simulator.results.months(6)}`,
        progress: clampPct((derived.cushionMonths / 6) * 100),
      };
    }
    if (index === 1) {
      return {
        ...step,
        ...visual,
        subtitle: `${fmt(derived.surplus)} ${step.subtitle}`,
        // Share of income left over, against a 20% target.
        progress: clampPct((derived.savingsRate / 0.2) * 100),
      };
    }
    if (index === 2) {
      return {
        ...step,
        ...visual,
        subtitle: riskLabels[derived.debtLevel],
        progress: clampPct((1 - Math.min(1, derived.debtPressure)) * 100),
      };
    }
    // Investing / retirement: the stage description, with progress from the matching lessons.
    const stageId = index === 3 ? "long-term-investing" : "retirement";
    return { ...step, ...visual, progress: clampPct(stageProgress[stageId] ?? 0) };
  });

  return (
    <section className="rounded-lg border border-primary/10 bg-white/88 p-5 shadow-soft" aria-labelledby="route-title">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-black uppercase text-primary">{copy.route.eyebrow}</p>
            {!derived && <ExampleBadge label={exampleLabel} />}
          </div>
          <h2 id="route-title" className="mt-1 text-2xl font-black text-text">
            {copy.route.title}
          </h2>
        </div>
        <p className="max-w-xl text-sm font-semibold leading-6 text-muted">
          {derived ? copy.route.description : exampleNote}
        </p>
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
    <article className="relative rounded-lg border border-primary/10 bg-background p-4">
      {index < total - 1 && (
        <span
          className="absolute left-[calc(100%-2px)] top-8 hidden h-0.5 w-4 bg-primary/20 md:block"
          aria-hidden="true"
        />
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg text-on-area" style={{ backgroundColor: step.tone }}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="text-xs font-black uppercase text-muted">0{index + 1}</span>
      </div>
      <h3 className="mt-4 text-lg font-black text-text">{step.title}</h3>
      <p className="mt-1 text-sm font-bold text-muted">{step.subtitle}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-grape" style={{ width: `${step.progress}%` }} />
      </div>
    </article>
  );
}

function DecisionSimulator({
  copy,
  fmt,
  answers,
}: {
  copy: DashboardCopy;
  fmt: (value: number) => string;
  answers: HealthAnswers | null;
}) {
  const [monthlySaving, setMonthlySaving] = useState(900);
  const [years, setYears] = useState(15);
  const [overpayment, setOverpayment] = useState(400);

  const simulation = useMemo(() => {
    // The user's own expenses and savings once they ran the Health Check;
    // a sample household until then (this is a what-if simulator).
    const monthlyExpenses = answers ? answers.monthlyExpenses : mockUser.monthlyExpenses;
    const savings = answers ? answers.savings : mockUser.savings;
    const emergencyTarget = monthlyExpenses * 6;
    const emergencyGap = Math.max(emergencyTarget - savings, 0);
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
  }, [answers, copy.simulator, monthlySaving, overpayment, years]);

  return (
    <section className="rounded-lg border border-primary/10 bg-white/90 p-5 shadow-soft" aria-labelledby="sim-title">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-primary">{copy.simulator.eyebrow}</p>
          <h2 id="sim-title" className="mt-1 text-2xl font-black text-text">
            {copy.simulator.title}
          </h2>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-success px-3 py-2 text-xs font-black uppercase text-text">
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
        style={{ accentColor: "var(--cf-grape)" }}
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
    <div className="rounded-lg border border-primary/10 bg-background p-4">
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
    <div className="flex min-h-16 items-center justify-between gap-4 rounded-lg border border-primary/10 bg-background px-4 py-3">
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
    <div className="rounded-lg border border-primary/10 bg-background p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-sm font-black text-text">{labels.chartTitle}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs font-black text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-chart-highlight" />
            {labels.chartCash}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-grape" />
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
            <stop offset="0%" stopColor="var(--cf-chart-highlight)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--cf-chart-highlight)" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="coachfi-invest-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--cf-chart-1)" stopOpacity="0.26" />
            <stop offset="100%" stopColor="var(--cf-chart-1)" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = top + innerHeight - tick * innerHeight;
          return (
            <g key={tick}>
              <line x1={left} x2={width - right} y1={y} y2={y} stroke="var(--cf-border-subtle)" strokeDasharray="5 6" />
              <text x={8} y={y + 4} fill="var(--cf-text-muted)" fontSize="12" fontWeight="800">
                {formatNumber((maxValue * tick) / 1000)}k
              </text>
            </g>
          );
        })}
        <path d={area(cashPoints)} fill="url(#coachfi-cash-area)" />
        <path d={area(investPoints)} fill="url(#coachfi-invest-area)" />
        <polyline points={line(cashPoints)} fill="none" stroke="var(--cf-chart-highlight)" strokeWidth="4" strokeLinecap="round" />
        <polyline points={line(investPoints)} fill="none" stroke="var(--cf-chart-1)" strokeWidth="4" strokeLinecap="round" />
        {investPoints.map((point, index) => (
          <g key={`${point.year}-${point.value}`}>
            <circle cx={point.x} cy={point.y} r="5" fill="var(--cf-chart-1)" stroke="var(--cf-bg)" strokeWidth="3" />
            <text
              x={point.x}
              y={height - 14}
              fill="var(--cf-text-muted)"
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
      className="flex min-h-20 items-center gap-4 rounded-lg border border-primary/10 bg-background p-4 transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary text-on-primary">
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
