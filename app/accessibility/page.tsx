"use client";

import { CheckCircle2, ShieldAlert, Volume2 } from "lucide-react";
import { useState } from "react";

import { AccessibilityToggle, type TextScale } from "@/components/AccessibilityToggle";
import { SectionHeader } from "@/components/SectionHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { getLocalizedContent } from "@/lib/localizedContent";
import { getVoiceDemoLanguage, getVoiceDemoLocale, voiceDemoScripts } from "@/lib/voiceDemoScripts";

const accessibilityVoiceCopy: LocalizedMap<
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
  es: {
    title: "Modo accesibilidad con voz primero",
    subtitle: "Diseñado para personas ciegas, con baja visión y mayores.",
    shortcuts: "Atajos de lectura en voz alta",
    ariaLabel: "Modo accesibilidad con voz primero",
    ariaSuffix: "Diseñado para personas ciegas, con baja visión y mayores.",
    actions: [
      "Lee mi puntuación financiera",
      "Explica la inflación",
      "Empieza la siguiente lección",
      "Lee la pregunta del quiz",
      "Muestra mi progreso",
    ],
  },
  fr: {
    title: "Mode accessibilité axé sur la voix",
    subtitle: "Conçu pour les personnes aveugles, malvoyantes et âgées.",
    shortcuts: "Raccourcis de lecture à voix haute",
    ariaLabel: "Mode accessibilité axé sur la voix",
    ariaSuffix: "Conçu pour les personnes aveugles, malvoyantes et âgées.",
    actions: [
      "Lis mon score financier",
      "Explique l'inflation",
      "Commence la leçon suivante",
      "Lis la question du quiz",
      "Montre ma progression",
    ],
  },
  zh: {
    title: "语音优先的无障碍模式",
    subtitle: "为盲人、低视力和年长用户设计。",
    shortcuts: "朗读快捷方式",
    ariaLabel: "语音优先的无障碍模式",
    ariaSuffix: "为盲人、低视力和年长用户设计。",
    actions: [
      "朗读我的财务得分",
      "讲解通胀",
      "开始下一课",
      "朗读测验题目",
      "显示我的进度",
    ],
  },
  hi: {
    title: "वॉइस-फ़र्स्ट सुलभता मोड",
    subtitle: "दृष्टिबाधित, कम दृष्टि वाले और बुज़ुर्ग उपयोगकर्ताओं के लिए बनाया गया।",
    shortcuts: "ज़ोर से पढ़ने के शॉर्टकट",
    ariaLabel: "वॉइस-फ़र्स्ट सुलभता मोड",
    ariaSuffix: "दृष्टिबाधित, कम दृष्टि वाले और बुज़ुर्ग उपयोगकर्ताओं के लिए बनाया गया।",
    actions: [
      "मेरा वित्तीय स्कोर पढ़ो",
      "महंगाई समझाओ",
      "अगला पाठ शुरू करो",
      "क्विज़ का सवाल पढ़ो",
      "मेरी प्रगति दिखाओ",
    ],
  },
  "pt-BR": {
    title: "Modo acessibilidade com voz em primeiro lugar",
    subtitle: "Pensado para pessoas cegas, com baixa visão e idosas.",
    shortcuts: "Atalhos de leitura em voz alta",
    ariaLabel: "Modo acessibilidade com voz em primeiro lugar",
    ariaSuffix: "Pensado para pessoas cegas, com baixa visão e idosas.",
    actions: [
      "Leia minha pontuação financeira",
      "Explique a inflação",
      "Comece a próxima aula",
      "Leia a pergunta do quiz",
      "Mostre meu progresso",
    ],
  },
  tr: {
    title: "Ses öncelikli Erişilebilirlik Modu",
    subtitle: "Görme engelli, az gören ve yaşlı kullanıcılar için tasarlandı.",
    shortcuts: "Sesli okuma kısayolları",
    ariaLabel: "Ses öncelikli Erişilebilirlik Modu",
    ariaSuffix: "Görme engelli, az gören ve yaşlı kullanıcılar için tasarlandı.",
    actions: [
      "Finans puanımı oku",
      "Enflasyonu açıkla",
      "Sonraki derse başla",
      "Quiz sorusunu oku",
      "İlerlememi göster",
    ],
  },
};

export default function AccessibilityPage() {
  const { locale } = useLanguage();
  const copy = getLocalizedContent(locale).accessibility;
  const voiceCopy = pickLocalized(accessibilityVoiceCopy, locale);
  const voiceLocale = getVoiceDemoLocale(locale);
  const voiceLanguage = getVoiceDemoLanguage(voiceLocale);
  const voiceScripts = voiceDemoScripts[voiceLocale];
  const voiceFirstActions = [
    { id: "financial-score", label: voiceCopy.actions[0], text: voiceScripts.financialScore },
    { id: "inflation", label: voiceCopy.actions[1], text: voiceScripts.inflationWakeUp },
    { id: "next-lesson", label: voiceCopy.actions[2], text: voiceScripts.milaIntro },
  ];
  const [highContrast, setHighContrast] = useState(false);
  const [textScale, setTextScale] = useState<TextScale>("normal");

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
                  <span className="grid h-16 w-16 place-items-center rounded-lg bg-primary text-on-primary">
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

    </section>
  );
}
