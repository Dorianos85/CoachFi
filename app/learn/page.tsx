"use client";

import { ProgressPath } from "@/components/ProgressPath";
import { SectionHeader } from "@/components/SectionHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { useLanguage } from "@/context/LanguageContext";
import { getLocalizedContent } from "@/lib/localizedContent";

export default function LearnPage() {
  const { locale, t } = useLanguage();
  const copy = getLocalizedContent(locale);

  return (
    <section aria-labelledby="learn-title">
      <SectionHeader
        eyebrow={t.learn.eyebrow}
        title={t.learn.title}
        description={t.learn.description}
        readText={t.learn.readText}
      />

      <div className="mb-5 rounded-lg border border-primary/10 bg-white p-4 shadow-soft">
        <VoiceButton
          text={copy.learn.pathVoice}
          label={copy.voice.readLearningPath}
          variant="pill"
          className="py-2.5"
        />
        <p className="mt-3 text-sm font-semibold leading-6 text-muted">
          {copy.learn.pathVoice}
        </p>
      </div>

      <ProgressPath />
    </section>
  );
}
