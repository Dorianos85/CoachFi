"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Shield, User, Volume2 } from "lucide-react";

import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { ELEVENLABS_VOICES, useVoice } from "@/context/VoiceContext";
import { AVATAR_STYLES, type AvatarGender, type AvatarStyle, getAvatar, saveAvatar } from "@/lib/avatar";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const AVATAR_COPY: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    description: string;
    readText: string;
    livePreview: string;
    save: string;
    saved: string;
    chooseCharacter: string;
    female: string;
    male: string;
    archetype: string;
    milaVoice: string;
    voiceDescription: string;
    poweredBy: string;
    preview: string;
    stopPreview: string;
    testVoiceText: string;
  }
> = {
  en: {
    eyebrow: "Personalization",
    title: "Your Financial Avatar",
    description: "Choose your character, build your financial shield and pick the voice of your AI coach Mila.",
    readText: "Create your personalized financial avatar and choose Mila's voice.",
    livePreview: "Live preview",
    save: "Save avatar",
    saved: "Saved!",
    chooseCharacter: "Choose character",
    female: "Female",
    male: "Male",
    archetype: "Financial archetype",
    milaVoice: "Mila's Voice",
    voiceDescription:
      "Choose the voice your AI coach Mila will use. ElevenLabs is used when configured; otherwise Coach FI falls back to your browser voice.",
    poweredBy: "Powered by ElevenLabs",
    preview: "Preview voice",
    stopPreview: "Stop preview",
    testVoiceText: "Hello! I'm Mila, your financial coach. Together we'll build lasting money habits.",
  },
  pl: {
    eyebrow: "Personalizacja",
    title: "Twój finansowy avatar",
    description: "Wybierz postać, zbuduj tarczę finansową i wybierz głos coachki AI Miły.",
    readText: "Stwórz swój finansowy avatar i wybierz głos Miły.",
    livePreview: "Podgląd na żywo",
    save: "Zapisz avatar",
    saved: "Zapisano!",
    chooseCharacter: "Wybierz postać",
    female: "Kobieta",
    male: "Mężczyzna",
    archetype: "Archetyp finansowy",
    milaVoice: "Głos Miły",
    voiceDescription:
      "Wybierz głos, którego użyje Miła. ElevenLabs działa po konfiguracji, a bez niego Coach FI użyje głosu przeglądarki.",
    poweredBy: "Powered by ElevenLabs",
    preview: "Odsłuchaj głos",
    stopPreview: "Zatrzymaj podgląd",
    testVoiceText: "Cześć! Jestem Miła, Twoja coachka finansowa. Razem zbudujemy trwałe nawyki finansowe.",
  },
  ja: {
    eyebrow: "パーソナライズ",
    title: "あなたの金融アバター",
    description: "キャラクター、金融シールド、Mila の声を選びます。",
    readText: "金融アバターを作成し、Mila の声を選びます。",
    livePreview: "ライブプレビュー",
    save: "保存",
    saved: "保存しました",
    chooseCharacter: "キャラクターを選択",
    female: "女性",
    male: "男性",
    archetype: "金融タイプ",
    milaVoice: "Mila の声",
    voiceDescription: "Mila が使う声を選びます。設定済みなら ElevenLabs、なければブラウザ音声を使います。",
    poweredBy: "ElevenLabs 提供",
    preview: "声を試す",
    stopPreview: "停止",
    testVoiceText: "こんにちは、Mila です。あなたの金融コーチとして、長く続くお金の習慣を一緒に作ります。",
  },
};

const STYLE_COPY: Record<Locale, Record<AvatarStyle, { title: string; desc: string }>> = {
  en: {
    warrior: { title: "Warrior", desc: "Fights debt head-on, disciplined and determined." },
    explorer: { title: "Explorer", desc: "Curious investor, discovers new opportunities." },
    builder: { title: "Builder", desc: "Methodical, builds wealth brick by brick." },
  },
  pl: {
    warrior: { title: "Wojownik", desc: "Walczysz z długiem wprost, z dyscypliną i determinacją." },
    explorer: { title: "Badacz", desc: "Ciekawy inwestor, który odkrywa nowe możliwości." },
    builder: { title: "Budowniczy", desc: "Metodycznie budujesz majątek krok po kroku." },
  },
  ja: {
    warrior: { title: "戦士", desc: "負債に正面から向き合うタイプ。" },
    explorer: { title: "探検家", desc: "新しい機会を探す好奇心型。" },
    builder: { title: "ビルダー", desc: "一歩ずつ資産を作るタイプ。" },
  },
};

export default function AvatarPage() {
  const { locale } = useLanguage();
  const copy = AVATAR_COPY[locale];
  const [gender, setGender] = useState<AvatarGender>("female");
  const [style, setStyle] = useState<AvatarStyle>("warrior");
  const [saved, setSaved] = useState(false);
  const { voiceId, setVoiceId, isPlaying, speak, stop } = useVoice();

  useEffect(() => {
    const storedAvatar = getAvatar();
    setGender(storedAvatar.gender);
    setStyle(storedAvatar.style);
  }, []);

  function handleSave() {
    saveAvatar({ gender, style });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section aria-labelledby="avatar-title">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        readText={copy.readText}
      />

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          {/* Profile card — replaces cartoon avatar */}
          <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-soft">
            <p className="mb-4 text-sm font-black text-text">{copy.livePreview}</p>
            <div className="flex flex-col items-center gap-4">
              {/* Avatar icon */}
              <div
                className="relative grid h-24 w-24 place-items-center rounded-2xl shadow-glow"
                style={{
                  background: style === "warrior"
                    ? "linear-gradient(135deg,#6C47FF,#4338CA)"
                    : style === "explorer"
                    ? "linear-gradient(135deg,#10B981,#059669)"
                    : "linear-gradient(135deg,#F59E0B,#D97706)",
                }}
              >
                <User className="h-12 w-12 text-white/90" aria-hidden="true" />
                <span className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-white text-base shadow-sm">
                  {gender === "female" ? "👩" : "👨"}
                </span>
              </div>

              {/* Archetype badge */}
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-widest text-muted">
                  {STYLE_COPY[locale][style].title}
                </p>
                <p className="mt-1 text-xs font-semibold text-muted">
                  {STYLE_COPY[locale][style].desc}
                </p>
              </div>

              {/* Stats strip */}
              <div className="grid w-full grid-cols-3 gap-2 text-center">
                {[
                  { label: "Saving", val: "67%" },
                  { label: "Investing", val: "40%" },
                  { label: "Credit", val: "80%" },
                ].map(({ label, val }) => (
                  <div key={label} className="rounded-xl bg-primary/5 p-2">
                    <p className="text-sm font-black text-primary">{val}</p>
                    <p className="text-[10px] font-bold text-muted">{label}</p>
                  </div>
                ))}
              </div>

              <div className="flex w-full items-center gap-2 rounded-xl bg-primary/5 px-3 py-2">
                <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="text-xs font-bold text-text">Financial Shield</span>
                <span className="ml-auto text-xs font-black text-primary">62 / 100</span>
              </div>
            </div>
          </div>

          <Button type="button" size="lg" className="w-full gap-2" onClick={handleSave}>
            {saved ? (
              <>
                <Check className="h-5 w-5" />
                {copy.saved}
              </>
            ) : (
              <>
                <User className="h-5 w-5" />
                {copy.save}
              </>
            )}
          </Button>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-soft">
            <h2 className="mb-3 text-base font-black text-text">{copy.chooseCharacter}</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "female" as const, label: copy.female },
                { id: "male" as const, label: copy.male },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGender(item.id)}
                  className={cn(
                    "flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition",
                    gender === item.id ? "border-primary bg-primary/5" : "border-primary/10 hover:border-primary/30"
                  )}
                >
                  <span className="text-sm font-black text-text">{item.label}</span>
                  {gender === item.id && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-soft">
            <h2 className="mb-3 text-base font-black text-text">{copy.archetype}</h2>
            <div className="grid gap-3">
              {AVATAR_STYLES.map((avatarStyle) => {
                const styleText = STYLE_COPY[locale][avatarStyle.id];
                return (
                  <motion.button
                    key={avatarStyle.id}
                    type="button"
                    onClick={() => setStyle(avatarStyle.id)}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border-2 p-4 text-left transition",
                      style === avatarStyle.id
                        ? "border-primary bg-primary/5"
                        : "border-primary/10 hover:border-primary/30"
                    )}
                  >
                    <span
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${avatarStyle.from}, ${avatarStyle.to})` }}
                    >
                      {avatarStyle.emoji}
                    </span>
                    <div className="flex-1">
                      <p className="font-black text-text">{styleText.title}</p>
                      <p className="text-xs font-semibold text-muted">{styleText.desc}</p>
                    </div>
                    {style === avatarStyle.id && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-soft">
            <div className="mb-1 flex items-center justify-between gap-3">
              <h2 className="text-base font-black text-text">{copy.milaVoice}</h2>
              <a
                href="https://elevenlabs.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#111] px-3 py-1 text-[10px] font-black text-white transition hover:opacity-80"
                aria-label={copy.poweredBy}
              >
                <Volume2 className="h-3 w-3" aria-hidden="true" />
                {copy.poweredBy}
              </a>
            </div>
            <p className="mb-4 text-xs font-semibold text-muted">{copy.voiceDescription}</p>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ELEVENLABS_VOICES.map((voice) => (
                <button
                  key={voice.id}
                  type="button"
                  onClick={() => setVoiceId(voice.id)}
                  className={cn(
                    "flex flex-col gap-1 rounded-xl border-2 p-3 text-left transition",
                    voiceId === voice.id ? "border-primary bg-primary/5" : "border-primary/10 hover:border-primary/30"
                  )}
                >
                  <span className="text-sm font-black text-text">{voice.name}</span>
                  <span className="text-[10px] font-semibold text-muted">{voice.accent}</span>
                  {voiceId === voice.id && (
                    <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 w-full gap-2"
              onClick={() => (
                isPlaying ? stop() : void speak(copy.testVoiceText, { locale, voiceId }).catch(() => {})
              )}
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              {isPlaying ? copy.stopPreview : copy.preview}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
