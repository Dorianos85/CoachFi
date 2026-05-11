"use client";

import { CalendarDays, CheckCircle2, ShieldAlert, Volume2 } from "lucide-react";
import { useState } from "react";

import { AccessibilityToggle, type TextScale } from "@/components/AccessibilityToggle";
import { SectionHeader } from "@/components/SectionHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import type { Locale } from "@/lib/i18n";
import { getLocalizedContent } from "@/lib/localizedContent";
import { calculateLifePathNumber, numerologyStyles } from "@/lib/numerology";
import { getVoiceDemoLanguage, getVoiceDemoLocale, voiceDemoScripts } from "@/lib/voiceDemoScripts";

const accessibilityVoiceCopy: Record<
  Locale,
  {
    title: string;
    subtitle: string;
    shortcuts: string;
    ariaLabel: string;
    ariaSuffix: string;
    actions: string[];
  }
> = {
  pl: {
    title: "Tryb dostępności voice-first",
    subtitle: "Zaprojektowany dla osób niewidomych, słabowidzących i starszych.",
    shortcuts: "Skróty odczytu głosowego",
    ariaLabel: "Tryb dostępności voice-first",
    ariaSuffix: "Zaprojektowany dla osób niewidomych, słabowidzących i starszych.",
    actions: [
      "Odczytaj mój wynik finansowy",
      "Wyjaśnij inflację",
      "Rozpocznij następną lekcję",
      "Odczytaj pytanie z quizu",
      "Pokaż mój postęp",
    ],
  },
  en: {
    title: "Voice-first Accessibility Mode",
    subtitle: "Designed for blind, low-vision and elderly users.",
    shortcuts: "Read-aloud shortcuts",
    ariaLabel: "Voice-first Accessibility Mode",
    ariaSuffix: "Designed for blind, low-vision and elderly users.",
    actions: [
      "Read my financial score",
      "Explain inflation",
      "Start next lesson",
      "Read quiz question",
      "Show my progress",
    ],
  },
  ja: {
    title: "音声優先アクセシビリティモード",
    subtitle: "視覚障害、弱視、高齢のユーザー向けに設計されています。",
    shortcuts: "読み上げショートカット",
    ariaLabel: "音声優先アクセシビリティモード",
    ariaSuffix: "視覚障害、弱視、高齢のユーザー向けに設計されています。",
    actions: [
      "ファイナンシャルスコアを読む",
      "インフレを説明する",
      "次のレッスンを始める",
      "クイズの質問を読む",
      "進捗を表示する",
    ],
  },
};

export default function AccessibilityPage() {
  const { locale, t } = useLanguage();
  const copy = getLocalizedContent(locale).accessibility;
  const voiceCopy = accessibilityVoiceCopy[locale];
  const voiceLocale = getVoiceDemoLocale(locale);
  const voiceLanguage = getVoiceDemoLanguage(voiceLocale);
  const voiceScripts = voiceDemoScripts[voiceLocale];
  const voiceFirstActions = [
    { id: "financial-score", label: voiceCopy.actions[0], text: voiceScripts.financialScore },
    { id: "inflation", label: voiceCopy.actions[1], text: voiceScripts.inflationWakeUp },
    { id: "next-lesson", label: voiceCopy.actions[2], text: voiceScripts.milaIntro },
    { id: "quiz-question", label: voiceCopy.actions[3], text: voiceScripts.kidsCoach },
    { id: "progress", label: voiceCopy.actions[4], text: voiceScripts.certificateUnlock },
  ];
  const [highContrast, setHighContrast] = useState(false);
  const [textScale, setTextScale] = useState<TextScale>("normal");
  const [birthDate, setBirthDate] = useState("");
  const [lifePath, setLifePath] = useState<number | null>(null);

  return (
    <section aria-labelledby="accessibility-title">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.subtitle}
        readText={`${copy.title}. ${copy.subtitle}`}
      />

      <div className={highContrast ? "high-contrast rounded-lg p-3" : ""}>
        <div className={textScale === "large" ? "text-scale-large" : textScale === "xlarge" ? "text-scale-xlarge" : ""}>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-lg bg-white p-6 shadow-soft">
              <AccessibilityToggle
                highContrast={highContrast}
                textScale={textScale}
                onToggleContrast={() => setHighContrast((value) => !value)}
                onTextScaleChange={setTextScale}
              />

              <div className="mt-6 rounded-lg border border-primary/15 bg-primary/5 p-6">
                <div className="flex items-center gap-4">
                  <span className="grid h-16 w-16 place-items-center rounded-lg bg-primary text-white">
                    <Volume2 className="h-8 w-8" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-2xl font-black text-text">{voiceCopy.title}</h2>
                    <p className="mt-2 text-base leading-7 text-muted">{voiceCopy.subtitle}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4" aria-label={voiceCopy.ariaLabel}>
                {voiceFirstActions.map((action) => (
                  <div
                    key={action.id}
                    className="rounded-lg border border-primary/12 bg-white p-4 shadow-sm"
                  >
                    <VoiceButton
                      text={action.text}
                      label={action.label}
                      variant="large"
                      locale={voiceLocale}
                      speechLang={voiceLanguage.speechLang}
                      ariaLabel={`${action.label}. ${voiceCopy.ariaSuffix}`}
                    />
                    <p className="mt-3 rounded-lg bg-primary/5 p-4 text-sm font-semibold leading-6 text-text">
                      {action.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3">
                <p className="text-sm font-black uppercase text-primary">{voiceCopy.shortcuts}</p>
                {copy.commands.map((command) => (
                  <Button key={command} type="button" variant="outline" size="lg" className="justify-start">
                    <Volume2 className="h-5 w-5 text-primary" aria-hidden="true" />
                    "{command}"
                  </Button>
                ))}
              </div>
            </div>

            <Card>
              <CardHeader>
                <ShieldAlert className="h-8 w-8 text-primary" aria-hidden="true" />
                <CardTitle>{copy.checklistTitle}</CardTitle>
                <CardDescription>{copy.checklistDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3 text-sm font-bold leading-6 text-text">
                  {copy.checklist.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div id="numerology" className="mt-8 grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-lg bg-white p-5 shadow-soft">
          <p className="mb-2 text-sm font-black uppercase text-primary">{copy.numerologyTitle}</p>
          <label className="grid gap-2 text-sm font-bold text-text">
            {copy.dateOfBirth}
            <input
              type="date"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              className="min-h-12 rounded-lg border border-primary/15 bg-white px-3 text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </label>
          <Button
            type="button"
            size="lg"
            className="mt-4 w-full"
            onClick={() => setLifePath(calculateLifePathNumber(birthDate))}
          >
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
            {copy.calculateStyle}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{lifePath !== null ? `${copy.numerologyTitle} ${lifePath}` : copy.enterDate}</CardTitle>
            <CardDescription>
              {lifePath !== null
                ? (numerologyStyles[lifePath] ?? copy.uniqueStyle)
                : `${t.accessibility.numerologyDesc}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-warning/20 p-4 text-sm font-bold leading-6 text-text">
              {copy.numerologyDisclaimer}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
