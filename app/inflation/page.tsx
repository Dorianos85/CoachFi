"use client";

import { useMemo, useState } from "react";

import { InflationChart } from "@/components/InflationChart";
import { SectionHeader } from "@/components/SectionHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { mockUser } from "@/data/mockUser";
import type { Locale } from "@/lib/i18n";
import {
  buildInflationScenario,
  calculatePurchasingPowerLoss,
  calculateRealValue
} from "@/lib/inflation";
import { getLocalizedContent } from "@/lib/localizedContent";
import { formatCurrency } from "@/lib/utils";
import { getVoiceDemoLanguage, getVoiceDemoLocale, voiceDemoScripts } from "@/lib/voiceDemoScripts";

const inflationVoiceCta: Record<Locale, string> = {
  pl: "Posłuchaj, dlaczego inflacja ma znaczenie",
  en: "Hear why inflation matters",
  ja: "インフレが重要な理由を聞く",
};

export default function InflationPage() {
  const { locale, t } = useLanguage();
  const copy = getLocalizedContent(locale);
  const voiceLocale = getVoiceDemoLocale(locale);
  const voiceLanguage = getVoiceDemoLanguage(voiceLocale);
  const inflationWakeUpText = voiceDemoScripts[voiceLocale].inflationWakeUp;
  const [startingAmount, setStartingAmount] = useState(mockUser.cashHeld);
  const [years, setYears] = useState(5);
  const [inflationRate, setInflationRate] = useState(7);

  const realValue = useMemo(
    () => calculateRealValue(startingAmount, years, inflationRate),
    [inflationRate, startingAmount, years]
  );
  const lostValue = useMemo(
    () => calculatePurchasingPowerLoss(startingAmount, years, inflationRate),
    [inflationRate, startingAmount, years]
  );
  const chartData = useMemo(
    () => buildInflationScenario(startingAmount, years, inflationRate),
    [inflationRate, startingAmount, years]
  );
  const inflationVoiceText = copy.inflation.voiceText(
    formatCurrency(startingAmount, t.currency, locale),
    years,
    inflationRate,
    formatCurrency(realValue, t.currency, locale),
    formatCurrency(lostValue, t.currency, locale)
  );

  return (
    <section aria-labelledby="inflation-title">
      <SectionHeader
        eyebrow={t.inflation.eyebrow}
        title={copy.inflation.title}
        description={copy.inflation.description}
        readText={inflationVoiceText}
      />

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="grid gap-4 rounded-lg bg-white p-5 shadow-soft">
          <NumberField label={copy.inflation.amount} value={startingAmount} onChange={setStartingAmount} />
          <NumberField label={copy.inflation.years} value={years} onChange={setYears} />
          <NumberField label={copy.inflation.rate} value={inflationRate} onChange={setInflationRate} />
          <div className="rounded-lg bg-accent/20 p-4">
            <p className="text-sm font-bold text-muted">{copy.inflation.realValue(years)}</p>
            <p className="mt-1 text-3xl font-black text-text">{formatCurrency(realValue, t.currency, locale)}</p>
          </div>
          <div className="rounded-lg bg-warning/20 p-4">
            <p className="text-sm font-bold text-muted">{copy.inflation.lost}</p>
            <p className="mt-1 text-3xl font-black text-text">{formatCurrency(lostValue, t.currency, locale)}</p>
          </div>
          <VoiceButton
            text={inflationWakeUpText}
            label={inflationVoiceCta[locale]}
            locale={voiceLocale}
            speechLang={voiceLanguage.speechLang}
            variant="large"
          />
        </div>

        <Card>
          <CardHeader className="gap-4 space-y-0 md:flex md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>{copy.inflation.chartTitle}</CardTitle>
              <CardDescription>
                {copy.inflation.chartDescription}
              </CardDescription>
            </div>
            <VoiceButton
              text={inflationVoiceText}
              label={copy.voice.explainInflation}
              locale={voiceLocale}
              speechLang={voiceLanguage.speechLang}
              variant="pill"
              className="shrink-0"
            />
          </CardHeader>
          <CardContent>
            <InflationChart data={chartData} currency={t.currency} locale={locale} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-text">
      {label}
      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="min-h-12 rounded-lg border border-primary/15 bg-white px-3 text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
    </label>
  );
}
