"use client";

import { useState } from "react";

import { Share2, Trophy } from "lucide-react";
import Link from "next/link";

import { FinancialScoreCard } from "@/components/FinancialScoreCard";
import { ShareScoreCard } from "@/components/ShareScoreCard";
import { SectionHeader } from "@/components/SectionHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { getDisplayName, getUser } from "@/lib/user";
import { getStreak } from "@/lib/streak";
import { useLanguage } from "@/context/LanguageContext";
import { useStreak } from "@/context/StreakContext";
import { mockUser } from "@/data/mockUser";
import { getLocalizedContent } from "@/lib/localizedContent";

interface HealthForm {
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
  debt: number;
  cashHeld: number;
  hasEmergencyFund: boolean;
  understandsInflation: boolean;
  hasRetirementPlan: boolean;
  investsAlready: boolean;
  mainFinancialGoal: string;
}

const inputClass =
  "min-h-12 rounded-lg border border-primary/15 bg-white px-3 text-text shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export default function HealthCheckPage() {
  const { locale, t } = useLanguage();
  const copy = getLocalizedContent(locale);
  const { markActive } = useStreak();
  const [shareOpen, setShareOpen] = useState(false);
  const [form, setForm] = useState<HealthForm>({
    monthlyIncome: mockUser.monthlyIncome,
    monthlyExpenses: mockUser.monthlyExpenses,
    savings: mockUser.savings,
    debt: mockUser.debt,
    cashHeld: mockUser.cashHeld,
    hasEmergencyFund: false,
    understandsInflation: false,
    hasRetirementPlan: false,
    investsAlready: mockUser.investsAlready,
    mainFinancialGoal: mockUser.mainFinancialGoal,
  });
  const [score, setScore] = useState(mockUser.financialHealthScore);
  const [submitted, setSubmitted] = useState(false);

  const diagnosis =
    score < 40
      ? t.healthCheck.interpretation.poor
      : score < 65
        ? t.healthCheck.interpretation.fair
        : score < 82
          ? t.healthCheck.interpretation.good
          : t.healthCheck.interpretation.excellent;
  const scoreVoiceText = copy.health.scoreVoice(score);

  function updateBool(field: keyof HealthForm, val: string) {
    setForm((f) => ({ ...f, [field]: val === "yes" }));
  }

  function updateNum(field: keyof HealthForm, val: string) {
    setForm((f) => ({ ...f, [field]: Number(val) }));
  }

  return (
    <section aria-labelledby="health-title">
      <SectionHeader
        eyebrow={t.healthCheck.eyebrow}
        title={t.healthCheck.title}
        description={t.healthCheck.description}
        readText={`${t.healthCheck.scoreTitle}: ${score} ${t.healthCheck.scoreLabel}. ${diagnosis}`}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setScore(calculateHealthScore(form));
            setSubmitted(true);
            markActive();
          }}
          className="focus-card rounded-lg p-5 md:p-6"
        >
          <div className="mb-5">
            <p className="text-sm font-black uppercase text-primary">{t.healthCheck.eyebrow}</p>
            <h2 className="mt-1 text-2xl font-black text-text">{t.healthCheck.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{t.healthCheck.description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <NumberField
              label={t.healthCheck.labelIncome}
              value={form.monthlyIncome}
              onChange={(v) => updateNum("monthlyIncome", v)}
              currency={t.currencySymbol}
            />
            <NumberField
              label={t.healthCheck.labelExpenses}
              value={form.monthlyExpenses}
              onChange={(v) => updateNum("monthlyExpenses", v)}
              currency={t.currencySymbol}
            />
            <NumberField
              label={t.healthCheck.labelSavings}
              value={form.savings}
              onChange={(v) => updateNum("savings", v)}
              currency={t.currencySymbol}
            />
            <NumberField
              label={t.healthCheck.labelDebt}
              value={form.debt}
              onChange={(v) => updateNum("debt", v)}
              currency={t.currencySymbol}
            />
            <NumberField
              label={t.healthCheck.labelCash}
              value={form.cashHeld}
              onChange={(v) => updateNum("cashHeld", v)}
              currency={t.currencySymbol}
            />

            <YesNoField
              label={t.healthCheck.labelHasEmergencyFund}
              value={form.hasEmergencyFund}
              onChange={(v) => updateBool("hasEmergencyFund", v)}
              yes={t.healthCheck.yes}
              no={t.healthCheck.no}
            />
            <YesNoField
              label={t.healthCheck.labelUnderstandsInflation}
              value={form.understandsInflation}
              onChange={(v) => updateBool("understandsInflation", v)}
              yes={t.healthCheck.yes}
              no={t.healthCheck.no}
            />
            <YesNoField
              label={t.healthCheck.labelHasRetirementPlan}
              value={form.hasRetirementPlan}
              onChange={(v) => updateBool("hasRetirementPlan", v)}
              yes={t.healthCheck.yes}
              no={t.healthCheck.no}
            />

            <label className="grid gap-1.5 text-sm font-bold text-text md:col-span-2">
              {t.healthCheck.labelGoal}
              <input
                value={form.mainFinancialGoal}
                onChange={(e) => setForm((f) => ({ ...f, mainFinancialGoal: e.target.value }))}
                className={inputClass}
              />
            </label>
          </div>

          <Button type="submit" size="lg" className="mt-6 w-full">
            {t.healthCheck.submit}
          </Button>

          {submitted && (
            <div className="mt-4 flex flex-col gap-2">
              <p
                className="rounded-lg bg-success/20 p-3 text-center text-sm font-bold text-text"
                aria-live="polite"
              >
                ✓ {t.healthCheck.nextStep}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={() => setShareOpen(true)}
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  {t.healthCheck.shareScore}
                </Button>
                <Link
                  href={`/achievement?name=${encodeURIComponent(getDisplayName(getUser()))}&score=${score}&streak=${getStreak().currentStreak}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Trophy className="h-4 w-4" aria-hidden="true" />
                  {copy.health.achievement}
                </Link>
              </div>
            </div>
          )}
        </form>

        <div className="grid content-start gap-3">
          <FinancialScoreCard score={score} diagnosis={diagnosis} />
          <VoiceButton text={scoreVoiceText} label={copy.voice.readScore} variant="pill" className="justify-center py-2.5" />
        </div>
      </div>

      <ShareScoreCard score={score} open={shareOpen} onClose={() => setShareOpen(false)} />
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
  currency,
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
  currency: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-text">
      {label} <span className="font-semibold text-muted">({currency})</span>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </label>
  );
}

function YesNoField({
  label,
  value,
  onChange,
  yes,
  no,
}: {
  label: string;
  value: boolean;
  onChange: (v: string) => void;
  yes: string;
  no: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-text">
      {label}
      <select
        value={value ? "yes" : "no"}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        <option value="no">{no}</option>
        <option value="yes">{yes}</option>
      </select>
    </label>
  );
}

function calculateHealthScore(form: HealthForm) {
  const monthlyFree = Math.max(form.monthlyIncome - form.monthlyExpenses, 0);
  const savingsRate = form.monthlyIncome > 0 ? monthlyFree / form.monthlyIncome : 0;
  const emergencyCoverage =
    form.monthlyExpenses > 0 ? form.savings / (form.monthlyExpenses * 3) : 0;
  const debtPressure =
    form.monthlyIncome > 0 ? form.debt / (form.monthlyIncome * 4) : 1;

  const savingsRateScore = Math.min(savingsRate / 0.25, 1) * 18;
  const emergencyScore = Math.min(emergencyCoverage, 1) * 18;
  const debtScore = Math.max(0, 1 - debtPressure) * 16;
  const cashAwarenessScore =
    form.cashHeld > form.monthlyIncome * 2 && !form.investsAlready ? 4 : 8;
  const investingScore = form.investsAlready ? 10 : 2;
  const goalScore = form.mainFinancialGoal.trim().length > 8 ? 6 : 0;
  const awarenessScore =
    (form.hasEmergencyFund ? 8 : 0) +
    (form.understandsInflation ? 6 : 0) +
    (form.hasRetirementPlan ? 8 : 0);

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        savingsRateScore +
          emergencyScore +
          debtScore +
          cashAwarenessScore +
          investingScore +
          goalScore +
          awarenessScore
      )
    )
  );
}
