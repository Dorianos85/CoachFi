"use client";

import { ProgressPath } from "@/components/ProgressPath";
import { IncomeJarPlanner } from "@/components/IncomeJarPlanner";
import { SectionHeader } from "@/components/SectionHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { useLanguage } from "@/context/LanguageContext";
import { getLocalizedContent } from "@/lib/localizedContent";

export default function LearnPage() {
  const { locale, t } = useLanguage();
  const copy = getLocalizedContent(locale);
  const scopeDescription = locale === "pl"
    ? "Ukończ etapy, sprawdź zrozumienie w quizach i zbieraj punkty za naukę."
    : "Complete stages, check your understanding in quizzes and earn learning points.";
  const pathVoice = locale === "pl"
    ? "Zacznij od nastawienia do pieniędzy. Kolejne etapy obejmują oszczędzanie, inflację, kredyt, fundusz awaryjny, inwestowanie długoterminowe, emeryturę i plan finansowy."
    : "Start with your money mindset. The next stages cover saving, inflation, credit, emergency funds, long-term investing, retirement and a financial plan.";

  return (
    <section aria-labelledby="learn-title">
      <SectionHeader
        eyebrow={t.learn.eyebrow}
        title={t.learn.title}
        description={scopeDescription}
        readText={`${t.learn.title}. ${scopeDescription}`}
      />

      <div className="mb-5 rounded-lg border border-primary/10 bg-white p-4 shadow-soft">
        <VoiceButton
          text={pathVoice}
          label={copy.voice.readLearningPath}
          variant="pill"
          className="py-2.5"
        />
        <p className="mt-3 text-sm font-semibold leading-6 text-muted">
          {pathVoice}
        </p>
      </div>

      <IncomeJarPlanner mode="adult" className="mb-5" />

      <ProgressPath />
    </section>
  );
}
