"use client";

import { useEffect, useMemo, useState } from "react";
import { InflationChart } from "@/components/InflationChart";
import { SectionHeader } from "@/components/SectionHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { useVoice } from "@/context/VoiceContext";
import {
  buildInflationScenario, calculatePurchasingPowerLoss, calculateRealValue,
  INFLATION_DEFAULTS, INFLATION_LIMITS, InflationCalculationError, parseInflationInput,
} from "@/lib/inflation";
import { formatInflationMoney, getInflationCopy } from "@/lib/inflation-copy";
import { getVoiceDemoLanguage, getVoiceDemoLocale } from "@/lib/voiceDemoScripts";

export default function InflationPage() {
  const { locale, t } = useLanguage();
  const { stop: stopVoice } = useVoice();
  const copy = getInflationCopy(locale);
  // This route is a Poland scenario; changing language does not convert money.
  const currency = "PLN";
  const voiceLocale = getVoiceDemoLocale(locale);
  const voiceLanguage = getVoiceDemoLanguage(voiceLocale);
  const [startingAmount, setStartingAmount] = useState("20000");
  const [years, setYears] = useState("5");
  const [inflationRate, setInflationRate] = useState("7");
  const [contribution, setContribution] = useState(String(INFLATION_DEFAULTS.annualContribution));
  const [nominalReturn, setNominalReturn] = useState(String(INFLATION_DEFAULTS.annualNominalReturnPercent));

  useEffect(() => { stopVoice(); return stopVoice; }, [locale, stopVoice]);

  const calculation = useMemo(() => {
    try {
      const amount = parseInflationInput(startingAmount), period = parseInflationInput(years);
      const rate = parseInflationInput(inflationRate), annualContribution = parseInflationInput(contribution);
      const annualNominalReturnPercent = parseInflationInput(nominalReturn);
      const realValue = calculateRealValue(amount, period, rate);
      const loss = calculatePurchasingPowerLoss(amount, period, rate);
      const change = loss === 0 ? 0 : -loss;
      const chartData = buildInflationScenario(amount, period, rate, { annualContribution, annualNominalReturnPercent });
      return { ok: true as const, amount, period, rate, annualContribution, annualNominalReturnPercent, realValue, change, chartData };
    } catch (error) {
      return { ok: false as const, code: error instanceof InflationCalculationError ? error.code : "invalid-input" };
    }
  }, [startingAmount, years, inflationRate, contribution, nominalReturn]);

  const money = (value: number) => formatInflationMoney(value, currency, locale);
  const percent = (value: number) => new Intl.NumberFormat(locale, { maximumSignificantDigits: 17 }).format(value) + "%";
  const voiceText = calculation.ok ? copy.voiceText({
    amount: money(calculation.amount), years: calculation.period, inflation: percent(calculation.rate),
    realValue: money(calculation.realValue), change: money(calculation.change),
    contribution: money(calculation.annualContribution), nominalReturn: percent(calculation.annualNominalReturnPercent),
  }) : "";
  const changeField = (setter: (value: string) => void) => (value: string) => { stopVoice(); setter(value); };

  return (
    <section aria-label={copy.title} data-testid="inflation-calculator" className="min-w-0">
      {calculation.ok ? (
        <SectionHeader eyebrow={t.inflation.eyebrow} title={copy.title} description={copy.description} readText={voiceText} />
      ) : (
        <div className="mb-7 max-w-3xl">
          <p className="mb-3 text-xs font-black text-muted">{t.inflation.eyebrow}</p>
          <h1 className="text-3xl font-black text-text md:text-5xl">{copy.title}</h1>
          <p className="mt-3 text-base leading-7 text-muted">{copy.description}</p>
        </div>
      )}

      <p id="inflation-decimal-hint" className="mb-4 text-sm text-muted">{copy.decimalHint}</p>
      {!calculation.ok && (
        <p role="alert" id="inflation-error" data-testid="inflation-error" className="mb-4 rounded-lg border border-warning bg-warning/20 p-4 font-bold">
          {calculation.code === "unrepresentable-result" ? copy.resultError : copy.error}
        </p>
      )}

      <div className="grid min-w-0 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="grid min-w-0 gap-4 rounded-lg bg-white p-5 shadow-soft">
          <NumberField name="amount" label={copy.amount} hint={copy.moneyHint} value={startingAmount} onChange={changeField(setStartingAmount)} min={0} max={INFLATION_LIMITS.maxAmount} />
          <NumberField name="years" label={copy.years} hint={copy.yearsHint} value={years} onChange={changeField(setYears)} min={0} max={INFLATION_LIMITS.maxYears} whole />
          <NumberField name="rate" label={copy.rate} hint={copy.inflationHint} value={inflationRate} onChange={changeField(setInflationRate)} min={INFLATION_LIMITS.minInflationRate} max={INFLATION_LIMITS.maxInflationRate} />
          <NumberField name="contribution" label={copy.contribution} hint={copy.moneyHint} value={contribution} onChange={changeField(setContribution)} min={0} max={INFLATION_LIMITS.maxAnnualContribution} />
          <NumberField name="return" label={copy.nominalReturn} hint={copy.returnHint} value={nominalReturn} onChange={changeField(setNominalReturn)} min={INFLATION_LIMITS.minAnnualNominalReturnPercent} max={INFLATION_LIMITS.maxAnnualNominalReturnPercent} />

          {calculation.ok && (
            <div data-testid="inflation-results" className="grid min-w-0 gap-4">
              <div className="min-w-0 rounded-lg bg-accent/20 p-4">
                <p className="text-sm font-bold text-muted">{copy.realValue(calculation.period)}</p>
                <p data-testid="inflation-real-value" className="mt-1 break-words text-3xl font-black text-text [overflow-wrap:anywhere]">{money(calculation.realValue)}</p>
              </div>
              <div className="min-w-0 rounded-lg bg-warning/20 p-4">
                <p className="text-sm font-bold text-muted">{copy.change}</p>
                <p data-testid="inflation-change" className="mt-1 break-words text-3xl font-black text-text [overflow-wrap:anywhere]">{money(calculation.change)}</p>
                <p className="mt-2 text-sm text-muted">{copy.changeHint}</p>
              </div>
              <VoiceButton text={copy.voiceIntro} label={copy.voiceCta} locale={voiceLocale} speechLang={voiceLanguage.speechLang} variant="large" />
            </div>
          )}
        </div>

        <Card className="min-w-0">
          <CardHeader className="gap-4 space-y-0">
            <CardTitle>{copy.chartTitle}</CardTitle>
            <CardDescription>{copy.chartDescription}</CardDescription>
            <p data-testid="inflation-assumptions" className="text-sm leading-6 text-muted">{copy.assumptions}</p>
            {calculation.ok && <p data-testid="inflation-active-assumptions" className="break-words text-sm font-bold [overflow-wrap:anywhere]">{copy.activeAssumptions(money(calculation.annualContribution), percent(calculation.annualNominalReturnPercent))}</p>}
            <p data-testid="inflation-model-limits" className="text-sm leading-6 text-muted">{copy.limits}</p>
            {calculation.ok && <VoiceButton text={voiceText} label={copy.voiceResult} locale={voiceLocale} speechLang={voiceLanguage.speechLang} variant="pill" className="self-start" />}
          </CardHeader>
          {calculation.ok && (
            <CardContent className="min-w-0">
              <div data-testid="inflation-chart"><InflationChart data={calculation.chartData} currency={currency} locale={locale} /></div>
              <div className="mt-5 overflow-x-auto">
                <table data-testid="inflation-summary" className="w-full text-left text-sm">
                  <caption className="mb-3 text-left font-bold">{copy.summary}</caption>
                  <thead><tr><th scope="col" className="p-2">{copy.model}</th><th scope="col" className="p-2">{copy.value}</th></tr></thead>
                  <tbody>
                    {(["Cash only", "Saving habit", "Long-term investing scenario"] as const).map((key, index) => (
                      <tr key={key}><th scope="row" className="p-2 font-medium">{[copy.chartLabels.cash, copy.chartLabels.habit, copy.chartLabels.investing][index]}</th><td className="p-2 tabular-nums">{money(calculation.chartData[calculation.period][key])}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </section>
  );
}

function NumberField({ name, label, hint, value, onChange, min, max, whole = false }: {
  name: string; label: string; hint: string; value: string; onChange: (value: string) => void;
  min: number; max: number; whole?: boolean;
}) {
  const id = "inflation-input-" + name;
  let invalid = false;
  try { const parsed = parseInflationInput(value); invalid = parsed < min || parsed > max || (whole && !Number.isInteger(parsed)); }
  catch { invalid = true; }
  return (
    <div className="grid min-w-0 gap-2 text-sm text-text">
      <label htmlFor={id} className="font-bold">{label}</label>
      <input id={id} data-testid={id} type="text" inputMode={whole ? "numeric" : "decimal"} maxLength={INFLATION_LIMITS.maxInputLength}
        value={value} aria-invalid={invalid || undefined} aria-describedby={id + "-hint inflation-decimal-hint"}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full min-w-0 rounded-input border-2 border-border bg-white px-3 text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
      <p id={id + "-hint"} className="text-xs text-muted">{hint}</p>
    </div>
  );
}
