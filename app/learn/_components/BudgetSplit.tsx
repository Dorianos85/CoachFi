"use client";

import { PiggyBank, ShieldCheck, Smile, WalletCards } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { VoiceButton } from "@/components/VoiceButton";
import { useLanguage } from "@/context/LanguageContext";
import { cn, formatCurrency } from "@/lib/utils";

/**
 * 50/30/20 budget split for the US audience (English and Spanish).
 * The Polish version of the Learn page keeps the 6-jar planner.
 */

type BucketKey = "needs" | "wants" | "savings";

type SplitCopy = {
  eyebrow: string;
  title: string;
  description: string;
  incomeLabel: string;
  incomeHelp: string;
  readLabel: string;
  totalLabel: string;
  buckets: Record<BucketKey, { title: string; description: string }>;
  voiceIntro: (amount: string) => string;
  percentWord: string;
};

const BUCKETS: Array<{ key: BucketKey; percent: number; icon: LucideIcon; color: string }> = [
  { key: "needs", percent: 50, icon: WalletCards, color: "#7DD3DC" },
  { key: "wants", percent: 30, icon: Smile, color: "#F59E0B" },
  { key: "savings", percent: 20, icon: PiggyBank, color: "#10B981" },
];

const COPY: Record<"en" | "es", SplitCopy> = {
  en: {
    eyebrow: "Budget split",
    title: "The 50/30/20 rule",
    description:
      "Enter your monthly take-home pay and see a simple starting split: needs, wants, and savings plus extra debt payments.",
    incomeLabel: "Monthly take-home pay",
    incomeHelp: "A rule of thumb, not a rule. If rent takes more than half your pay, adjust the split to your real costs.",
    readLabel: "Read my budget split",
    totalLabel: "Take-home pay",
    buckets: {
      needs: { title: "Needs", description: "Rent or mortgage, groceries, utilities, transportation, insurance and minimum debt payments." },
      wants: { title: "Wants", description: "Eating out, streaming, hobbies, travel and other things you could live without." },
      savings: {
        title: "Savings & extra debt payments",
        description: "Emergency fund, retirement (like a 401(k) or IRA) and paying down debt faster than the minimum.",
      },
    },
    voiceIntro: (amount) => `50 30 20 budget split for ${amount} of monthly take-home pay.`,
    percentWord: "percent",
  },
  es: {
    eyebrow: "Reparto del presupuesto",
    title: "La regla 50/30/20",
    description:
      "Escribe tu ingreso neto mensual y mira un reparto sencillo para empezar: necesidades, deseos, y ahorro más pagos extra de deudas.",
    incomeLabel: "Ingreso neto mensual",
    incomeHelp: "Es una guía, no una regla. Si el alquiler se lleva más de la mitad de tu sueldo, ajusta el reparto a tus gastos reales.",
    readLabel: "Leer mi presupuesto",
    totalLabel: "Ingreso neto",
    buckets: {
      needs: { title: "Necesidades", description: "Alquiler o hipoteca, comida, servicios, transporte, seguros y pagos mínimos de deudas." },
      wants: { title: "Deseos", description: "Comer fuera, streaming, pasatiempos, viajes y otras cosas de las que podrías prescindir." },
      savings: {
        title: "Ahorro y pagos extra de deudas",
        description: "Fondo de emergencia, jubilación (como un 401(k) o una IRA) y pagar deudas más rápido que el mínimo.",
      },
    },
    voiceIntro: (amount) => `Presupuesto 50 30 20 para un ingreso neto mensual de ${amount}.`,
    percentWord: "por ciento",
  },
};

export function BudgetSplit({ className }: { className?: string }) {
  const { locale, t } = useLanguage();
  const copy = locale === "es" ? COPY.es : COPY.en;
  const intlLocale = locale === "es" ? "es-US" : "en-US";
  const [income, setIncome] = useState(4000);
  const formattedIncome = formatCurrency(income, "USD", intlLocale);

  const rows = useMemo(
    () => BUCKETS.map((bucket) => ({ ...bucket, amount: (income * bucket.percent) / 100, copy: copy.buckets[bucket.key] })),
    [copy.buckets, income]
  );

  const voiceText = [
    copy.voiceIntro(formattedIncome),
    ...rows.map(
      (row) => `${row.copy.title}: ${row.percent} ${copy.percentWord}, ${formatCurrency(row.amount, "USD", intlLocale)}. ${row.copy.description}`
    ),
    copy.incomeHelp,
  ].join(" ");

  return (
    <section className={cn("rounded-lg border border-primary/15 bg-card/88 p-5 shadow-soft", className)} data-testid="budget-split">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase text-primary">{copy.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-black leading-tight text-text md:text-3xl">{copy.title}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-muted md:text-base">{copy.description}</p>
        </div>
        <VoiceButton text={voiceText} label={copy.readLabel} locale={locale} variant="pill" className="shrink-0" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-lg border border-primary/15 bg-background/55 p-4">
          <label className="grid gap-2 text-sm font-black text-text">
            {copy.incomeLabel} ({t.currencySymbol})
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={50}
              value={income}
              onChange={(event) => setIncome(Math.max(0, Number(event.target.value) || 0))}
              className="min-h-12 rounded-lg border border-primary/20 bg-background/70 px-3 text-xl font-black text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </label>
          <div className="mt-4 rounded-lg bg-primary/10 p-4">
            <p className="text-xs font-black uppercase text-primary">{copy.totalLabel}</p>
            <p className="mt-1 text-3xl font-black text-text">{formattedIncome}</p>
            <p className="mt-2 text-xs font-bold leading-5 text-muted">{copy.incomeHelp}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <article key={row.key} className="rounded-lg border border-primary/10 bg-background/45 p-4">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-background"
                    style={{ backgroundColor: row.color }}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-accent/18 px-2.5 py-1 text-xs font-black text-accent">{row.percent}%</span>
                </div>
                <h3 className="mt-4 text-lg font-black leading-tight text-text">{row.copy.title}</h3>
                <p className="mt-1 text-2xl font-black text-text">{formatCurrency(row.amount, "USD", intlLocale)}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${row.percent}%`, backgroundColor: row.color }} />
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-muted">{row.copy.description}</p>
              </article>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/10 p-3 text-sm font-black text-accent">
        <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
        50% + 30% + 20% = 100%
      </div>
    </section>
  );
}
