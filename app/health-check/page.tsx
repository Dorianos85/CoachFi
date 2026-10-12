"use client";

import { useState } from "react";

import { CheckCircle2, LifeBuoy, LockKeyhole, Mail, Share2, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";

import { FamilyActionPlan } from "@/components/FamilyActionPlan";
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
import { getHealthCheck, saveHealthCheck } from "@/lib/healthCheck";
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
  // Start from the last saved result on this device (falls back to the demo value).
  const [score, setScore] = useState(() => getHealthCheck()?.score ?? mockUser.financialHealthScore);
  const [submitted, setSubmitted] = useState(false);
  const [scoreUnlocked, setScoreUnlocked] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [trialActive, setTrialActive] = useState(false);

  const diagnosis =
    score < 40
      ? t.healthCheck.interpretation.poor
      : score < 65
        ? t.healthCheck.interpretation.fair
        : score < 82
          ? t.healthCheck.interpretation.good
          : t.healthCheck.interpretation.excellent;
  const scoreVoiceText = copy.health.scoreVoice(score);
  const previewInsights = getPreviewInsights(form, locale);
  const canUnlock = submitted && loginEmail.includes("@") && termsAccepted;
  const showEmergencyPath = scoreUnlocked && score < 40;

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
            const nextScore = calculateHealthScore(form);
            setScore(nextScore);
            // Persist locally (+ push to health_checks when signed in) so the
            // result survives navigation and feeds the home dashboard.
            saveHealthCheck(nextScore, { ...form });
            setSubmitted(true);
            setScoreUnlocked(false);
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

          {submitted && !scoreUnlocked && (
            <div className="mt-5 rounded-lg border border-primary/15 bg-primary/5 p-4" aria-live="polite">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-black text-text">
                    {locale === "pl" ? "Wstępna diagnoza jest gotowa" : "Your preview diagnosis is ready"}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-muted">
                    {locale === "pl"
                      ? "Pełny wynik i plan rodzinny pokażemy po logowaniu oraz akceptacji regulaminu i polityki prywatności."
                      : "The full score and family plan unlock after login and Terms/Privacy acceptance."}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                {previewInsights.map((insight) => (
                  <p key={insight} className="rounded-lg bg-white/80 p-3 text-sm font-bold text-text">
                    {insight}
                  </p>
                ))}
              </div>

              <div className="mt-4 grid gap-3">
                <label className="grid gap-1.5 text-sm font-bold text-text">
                  {locale === "pl" ? "Email do logowania" : "Login email"}
                  <span className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={`${inputClass} pl-10`}
                    />
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-lg bg-white/80 p-3 text-sm font-bold text-text">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <span>
                    {locale === "pl"
                      ? "Akceptuję regulamin, politykę prywatności i rozumiem, że Coach FI ma charakter edukacyjny."
                      : "I accept Terms, Privacy Policy and understand Coach FI is educational."}
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-lg bg-white/80 p-3 text-sm font-bold text-text">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <span>
                    {locale === "pl"
                      ? "Chcę otrzymywać edukacyjne materiały i informacje o premierze. To zgoda dobrowolna."
                      : "I want educational launch emails. This consent is optional."}
                  </span>
                </label>

                <Button
                  type="button"
                  size="lg"
                  disabled={!canUnlock}
                  onClick={() => setScoreUnlocked(true)}
                >
                  {locale === "pl" ? "Odblokuj wynik i plan" : "Unlock score and plan"}
                </Button>
              </div>
            </div>
          )}

          {submitted && scoreUnlocked && (
            <div className="mt-4 flex flex-col gap-2">
              <p
                className="rounded-lg bg-success/20 p-3 text-center text-sm font-bold text-text"
                aria-live="polite"
              >
                <CheckCircle2 className="mr-2 inline h-4 w-4" aria-hidden="true" />
                {t.healthCheck.nextStep}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
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
          {scoreUnlocked ? (
            <>
              <FinancialScoreCard score={score} diagnosis={diagnosis} />
              <VoiceButton text={scoreVoiceText} label={copy.voice.readScore} variant="pill" className="justify-center py-2.5" />
              <div className="rounded-lg border border-accent/40 bg-accent/35 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#7A5A00]" aria-hidden="true" />
                  <div>
                    <p className="font-black text-text">
                      {trialActive
                        ? locale === "pl"
                          ? "Trial Mili aktywny"
                          : "Mila trial active"
                        : "Mila Voice Coach Trial"}
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-muted">
                      {locale === "pl"
                        ? "7 dni testu z limitami rozmów głosowych, analiz i lekcji rodzinnych. Premium ma pełny dostęp z zasadami fair-use."
                        : "7-day test with limits for voice sessions, analyses and family lessons. Premium has full access with fair-use."}
                    </p>
                    <Button type="button" size="sm" className="mt-3" onClick={() => setTrialActive(true)}>
                      {trialActive
                        ? locale === "pl"
                          ? "Trial aktywny"
                          : "Trial active"
                        : locale === "pl"
                          ? "Włącz trial"
                          : "Start trial"}
                    </Button>
                  </div>
                </div>
              </div>
              {showEmergencyPath && (
                <div className="rounded-lg border border-warning/30 bg-warning/15 p-4">
                  <p className="text-sm font-bold leading-6 text-text">
                    {locale === "pl"
                      ? "Wynik wskazuje napięcie finansowe. Ścieżka bezpłatnej pomocy jest dostępna, ale nie jest głównym produktem Coach FI."
                      : "The score suggests financial pressure. Free help is available, but it is not the main Coach FI product."}
                  </p>
                  <Link
                    href="/crisis"
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-primary/15 bg-white px-4 py-2 text-sm font-black text-primary transition hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <LifeBuoy className="h-4 w-4" aria-hidden="true" />
                    {locale === "pl" ? "Pokaż bezpłatną pomoc" : "Show free help"}
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-primary/15 bg-white p-5 shadow-soft">
              <div className="grid h-20 w-20 place-items-center rounded-lg bg-primary/10 text-primary">
                <LockKeyhole className="h-9 w-9" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-2xl font-black text-text">
                {locale === "pl" ? "Wynik jest zablokowany" : "Score is locked"}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">
                {locale === "pl"
                  ? "Zrób darmową analizę. Pełny wynik i rozwiązanie pokażemy po logowaniu oraz akceptacji zasad."
                  : "Run the free analysis. Full score and solution unlock after login and terms acceptance."}
              </p>
            </div>
          )}
        </div>
      </div>

      {submitted && scoreUnlocked && (
        <div className="mt-6">
          <FamilyActionPlan
            score={score}
            monthlyIncome={form.monthlyIncome}
            monthlyExpenses={form.monthlyExpenses}
            savings={form.savings}
            goal={form.mainFinancialGoal}
            trialActive={trialActive}
            onStartTrial={() => setTrialActive(true)}
          />
        </div>
      )}

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

function getPreviewInsights(form: HealthForm, locale: string) {
  const isPolish = locale === "pl";
  const spendingRatio = form.monthlyIncome > 0 ? form.monthlyExpenses / form.monthlyIncome : 1;
  const cushionMonths = form.monthlyExpenses > 0 ? form.savings / form.monthlyExpenses : 0;
  const insights: string[] = [];

  insights.push(
    spendingRatio > 0.75
      ? isPolish
        ? "Wydatki są wysokie względem dochodu. To pierwszy obszar do sprawdzenia."
        : "Spending is high compared with income. This is the first area to check."
      : isPolish
        ? "Masz przestrzeń do zbudowania systemu i regularnego planu."
        : "You have room to build a system and a regular plan."
  );

  insights.push(
    cushionMonths < 3
      ? isPolish
        ? "Poduszka finansowa wymaga wzmocnienia, zanim zwiększysz ryzyko."
        : "Your safety cushion needs strengthening before taking more risk."
      : isPolish
        ? "Poduszka finansowa daje dobry start do kolejnych nawyków."
        : "Your financial cushion gives you a good base for the next habits."
  );

  if (!form.investsAlready || !form.hasRetirementPlan) {
    insights.push(
      isPolish
        ? "Brakuje regularnego planu przyszłości: edukacja, inwestowanie lub emerytura."
        : "A regular future plan is missing: education, investing or retirement."
    );
  }

  return insights.slice(0, 3);
}
