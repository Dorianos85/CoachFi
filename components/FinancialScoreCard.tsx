"use client";

import { Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { getLocalizedContent } from "@/lib/localizedContent";

const DESCRIPTION: LocalizedMap<string> = {
  en: "Educational diagnosis based on your answers.",
  pl: "Edukacyjna diagnoza na podstawie Twoich odpowiedzi.",
  es: "Diagnóstico educativo basado en tus respuestas.",
  fr: "Diagnostic éducatif basé sur vos réponses.",
  zh: "基于你的回答的教育性诊断。",
  ja: "あなたの回答にもとづく学習用の診断です。",
  hi: "आपके जवाबों पर आधारित शैक्षिक जांच।",
  "pt-BR": "Diagnóstico educacional com base nas suas respostas.",
  tr: "Yanıtlarına dayanan eğitim amaçlı teşhis.",
};

export function FinancialScoreCard({
  score,
  diagnosis
}: {
  score: number;
  diagnosis: string;
}) {
  const ringStyle = {
    background: `conic-gradient(var(--cf-grape) ${score}%, var(--cf-area-learn) 0)`
  };
  const { locale } = useLanguage();
  const copy = getLocalizedContent(locale);

  return (
    <Card className="border-primary/10 bg-white/90">
      <CardHeader>
        <CardTitle>{copy.scoreLabel}</CardTitle>
        <CardDescription>{pickLocalized(DESCRIPTION, locale)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid place-items-center rounded-lg bg-primary/5 p-6 text-center">
          <div className="grid h-44 w-44 place-items-center rounded-full p-3" style={ringStyle}>
            <div className="grid h-full w-full place-items-center rounded-full bg-white">
              <div>
                <div className="text-6xl font-black leading-none text-primary">{score}</div>
                <div className="text-lg font-black text-text">/100</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <Badge variant={score < 50 ? "warning" : "success"}>
            <Target className="h-3.5 w-3.5" aria-hidden="true" />
            {copy.common.nextAction}
          </Badge>
          <p className="text-base font-bold leading-7 text-text">{diagnosis}</p>
          <div className="grid gap-2 pt-2 text-sm font-bold text-muted">
            <p>{copy.common.firstFocus}</p>
            <p>{copy.common.nextLesson}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
