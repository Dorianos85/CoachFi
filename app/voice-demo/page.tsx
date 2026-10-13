"use client";

import { BadgeCheck, BarChart3, Coins, Languages, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { VoiceButton } from "@/components/VoiceButton";
import { useLanguage } from "@/context/LanguageContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import {
  getVoiceDemoLocale,
  voiceDemoLanguages,
  voiceDemoScripts,
  type VoiceDemoLocale,
  type VoiceDemoScriptKey,
} from "@/lib/voiceDemoScripts";
import { cn } from "@/lib/utils";

const demoCardMeta = [
  {
    key: "milaIntro",
    icon: Sparkles,
    tone: "bg-area-mila border-border-subtle",
  },
  {
    key: "financialScore",
    icon: BarChart3,
    tone: "bg-area-learn border-border-subtle",
  },
  {
    key: "inflationWakeUp",
    icon: Languages,
    tone: "bg-area-goals border-border-subtle",
  },
  {
    key: "kidsCoach",
    icon: Coins,
    tone: "bg-area-progress border-border-subtle",
  },
  {
    key: "certificateUnlock",
    icon: BadgeCheck,
    tone: "bg-area-care border-border-subtle",
  },
] satisfies Array<{
  key: VoiceDemoScriptKey;
  icon: LucideIcon;
  tone: string;
}>;

const voiceDemoCopy: LocalizedMap<
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    selectorLabel: string;
    playIn: (language: string) => string;
    playAria: (card: string, language: string) => string;
    note: string;
    cards: Record<VoiceDemoScriptKey, string>;
  }
> = {
  pl: {
    eyebrow: "Demo ElevenLabs Creator plan",
    title: "Coach FI mówi edukację finansową w Twoim języku",
    subtitle:
      "Edukacja finansowa voice-first dla dorosłych, dzieci, rodzin oraz osób niewidomych i słabowidzących.",
    selectorLabel: "Wybór języka demo głosowego",
    playIn: (language) => `Odtwórz po ${language}`,
    playAria: (card, language) => `Odtwórz ${card} po ${language}`,
    note: "Krótkie skrypty i cache ograniczają zużycie planu ElevenLabs Creator.",
    cards: {
      milaIntro: "Mila wita użytkownika",
      financialScore: "Wynik finansowy",
      inflationWakeUp: "Inflacja bez złudzeń",
      kidsCoach: "Coach dla dzieci",
      certificateUnlock: "Odblokowanie certyfikatu",
    },
  },
  en: {
    eyebrow: "ElevenLabs Creator plan demo",
    title: "Coach FI speaks financial education in your language",
    subtitle: "Voice-first financial education for adults, children, families and blind or low-vision users.",
    selectorLabel: "Voice demo language selector",
    playIn: (language) => `Play in ${language}`,
    playAria: (card, language) => `Play ${card} in ${language}`,
    note: "Short scripts and caching keep ElevenLabs Creator plan usage low.",
    cards: {
      milaIntro: "Mila welcomes you",
      financialScore: "Financial Score",
      inflationWakeUp: "Inflation Wake-up",
      kidsCoach: "Kids Coach",
      certificateUnlock: "Certificate Unlock",
    },
  },
  ja: {
    eyebrow: "ElevenLabs Creatorプラン デモ",
    title: "Coach FIはあなたの言語で金融教育を話します",
    subtitle: "大人、子ども、家族、視覚障害や弱視のユーザー向けの音声優先の金融教育です。",
    selectorLabel: "音声デモの言語選択",
    playIn: (language) => `${language}で再生`,
    playAria: (card, language) => `${card}を${language}で再生`,
    note: "短いスクリプトとキャッシュにより、ElevenLabs Creatorプランの使用量を抑えます。",
    cards: {
      milaIntro: "Milaからの挨拶",
      financialScore: "ファイナンシャルスコア",
      inflationWakeUp: "インフレの気づき",
      kidsCoach: "子ども向けコーチ",
      certificateUnlock: "証明書の解除",
    },
  },
  es: {
    eyebrow: "Demo del plan Creator de ElevenLabs",
    title: "Coach FI habla de educación financiera en tu idioma",
    subtitle: "Educación financiera con voz primero para adultos, niños, familias y personas ciegas o con baja visión.",
    selectorLabel: "Selector de idioma de la demo de voz",
    playIn: (language) => `Reproducir en ${language}`,
    playAria: (card, language) => `Reproducir ${card} en ${language}`,
    note: "Los guiones cortos y la caché mantienen bajo el uso del plan Creator de ElevenLabs.",
    cards: {
      milaIntro: "Mila te da la bienvenida",
      financialScore: "Puntuación financiera",
      inflationWakeUp: "La inflación te despierta",
      kidsCoach: "Coach para niños",
      certificateUnlock: "Certificado desbloqueado",
    },
  },
  fr: {
    eyebrow: "Démo du forfait Creator d'ElevenLabs",
    title: "Coach FI parle d'éducation financière dans votre langue",
    subtitle: "Une éducation financière axée sur la voix pour les adultes, les enfants, les familles et les personnes aveugles ou malvoyantes.",
    selectorLabel: "Sélecteur de langue de la démo vocale",
    playIn: (language) => `Écouter en ${language}`,
    playAria: (card, language) => `Écouter ${card} en ${language}`,
    note: "Des scripts courts et la mise en cache limitent l'usage du forfait Creator d'ElevenLabs.",
    cards: {
      milaIntro: "Mila vous accueille",
      financialScore: "Score financier",
      inflationWakeUp: "Le réveil de l'inflation",
      kidsCoach: "Coach pour enfants",
      certificateUnlock: "Certificat débloqué",
    },
  },
  zh: {
    eyebrow: "ElevenLabs Creator 套餐演示",
    title: "Coach FI 用你的语言讲财商教育",
    subtitle: "面向成人、儿童、家庭以及盲人或低视力用户的语音优先财商教育。",
    selectorLabel: "语音演示语言选择",
    playIn: (language) => `用${language}播放`,
    playAria: (card, language) => `用${language}播放${card}`,
    note: "简短的脚本和缓存让 ElevenLabs Creator 套餐的用量保持在较低水平。",
    cards: {
      milaIntro: "Mila 欢迎你",
      financialScore: "财务得分",
      inflationWakeUp: "通胀提醒",
      kidsCoach: "儿童教练",
      certificateUnlock: "解锁证书",
    },
  },
  hi: {
    eyebrow: "ElevenLabs Creator प्लान डेमो",
    title: "Coach FI आपकी भाषा में वित्तीय शिक्षा बोलता है",
    subtitle: "वयस्कों, बच्चों, परिवारों और दृष्टिबाधित या कम दृष्टि वाले उपयोगकर्ताओं के लिए वॉइस-फ़र्स्ट वित्तीय शिक्षा।",
    selectorLabel: "वॉइस डेमो भाषा चयन",
    playIn: (language) => `${language} में चलाएं`,
    playAria: (card, language) => `${card} को ${language} में चलाएं`,
    note: "छोटी स्क्रिप्ट और कैशिंग से ElevenLabs Creator प्लान का उपयोग कम रहता है।",
    cards: {
      milaIntro: "Mila आपका स्वागत करती है",
      financialScore: "वित्तीय स्कोर",
      inflationWakeUp: "महंगाई की चेतावनी",
      kidsCoach: "किड्स कोच",
      certificateUnlock: "सर्टिफ़िकेट अनलॉक",
    },
  },
  "pt-BR": {
    eyebrow: "Demo do plano Creator da ElevenLabs",
    title: "O Coach FI fala de educação financeira no seu idioma",
    subtitle: "Educação financeira com voz em primeiro lugar para adultos, crianças, famílias e pessoas cegas ou com baixa visão.",
    selectorLabel: "Seletor de idioma da demo de voz",
    playIn: (language) => `Tocar em ${language}`,
    playAria: (card, language) => `Tocar ${card} em ${language}`,
    note: "Roteiros curtos e cache mantêm baixo o uso do plano Creator da ElevenLabs.",
    cards: {
      milaIntro: "A Mila dá as boas-vindas",
      financialScore: "Pontuação financeira",
      inflationWakeUp: "O alerta da inflação",
      kidsCoach: "Coach infantil",
      certificateUnlock: "Certificado desbloqueado",
    },
  },
  tr: {
    eyebrow: "ElevenLabs Creator planı demosu",
    title: "Coach FI finansal eğitimi senin dilinde anlatır",
    subtitle: "Yetişkinler, çocuklar, aileler ve görme engelli veya az gören kullanıcılar için ses öncelikli finansal eğitim.",
    selectorLabel: "Ses demosu dil seçici",
    playIn: (language) => `${language} dilinde oynat`,
    playAria: (card, language) => `${card} kartını ${language} dilinde oynat`,
    note: "Kısa metinler ve önbellekleme, ElevenLabs Creator planı kullanımını düşük tutar.",
    cards: {
      milaIntro: "Mila seni karşılıyor",
      financialScore: "Finans puanı",
      inflationWakeUp: "Enflasyon uyarısı",
      kidsCoach: "Çocuk koçu",
      certificateUnlock: "Sertifika açıldı",
    },
  },
};

export default function VoiceDemoPage() {
  const { locale } = useLanguage();
  const copy = pickLocalized(voiceDemoCopy, locale);
  const [selectedLocale, setSelectedLocale] = useState<VoiceDemoLocale>(() => getVoiceDemoLocale(locale));
  const selectedLanguage =
    voiceDemoLanguages.find((language) => language.code === selectedLocale) ?? voiceDemoLanguages[0];
  const scripts = voiceDemoScripts[selectedLocale];

  useEffect(() => {
    setSelectedLocale(getVoiceDemoLocale(locale));
  }, [locale]);

  return (
    <section aria-labelledby="voice-demo-title" className="space-y-7 pb-6">
      <div className="rounded-lg border border-primary/10 bg-white/90 p-6 shadow-soft md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex rounded-lg border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-black uppercase tracking-normal text-primary">
              {copy.eyebrow}
            </p>
            <h1 id="voice-demo-title" className="text-3xl font-black leading-[1.04] text-text md:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-muted md:text-lg">{copy.subtitle}</p>
          </div>

          <div aria-label={copy.selectorLabel} className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
            {voiceDemoLanguages.map((language) => {
              const isSelected = selectedLocale === language.code;

              return (
                <button
                  key={language.code}
                  type="button"
                  onClick={() => setSelectedLocale(language.code)}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex min-h-12 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    isSelected
                      ? "border-primary bg-primary text-on-primary shadow-glow"
                      : "border-primary/15 bg-white text-text hover:border-primary/35 hover:bg-primary/5"
                  )}
                >
                  <span aria-hidden="true">{language.flag}</span>
                  {language.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {demoCardMeta.map((card) => {
          const Icon = card.icon;
          const script = scripts[card.key];
          const title = copy.cards[card.key];

          return (
            <article
              key={card.key}
              className={cn("rounded-lg border p-5 shadow-soft transition hover:-translate-y-0.5", card.tone)}
            >
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-white text-primary shadow-sm">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-black text-text">{title}</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-muted">{script}</p>
                </div>
              </div>

              <div className="mt-5">
                <VoiceButton
                  text={script}
                  label={copy.playIn(selectedLanguage.label)}
                  locale={selectedLocale}
                  speechLang={selectedLanguage.speechLang}
                  variant="large"
                  ariaLabel={copy.playAria(title, selectedLanguage.label)}
                />
              </div>
            </article>
          );
        })}
      </div>

      <p className="rounded-lg border border-primary/10 bg-primary/5 p-4 text-sm font-black text-primary">
        {copy.note}
      </p>
    </section>
  );
}
