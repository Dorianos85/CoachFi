"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useLayoutEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { stageLessons } from "@/data/stageLessons";
import { pickLocalized } from "@/lib/i18n";
import { recordLessonStep } from "@/lib/signInGate";
import { useProductStorage } from "@/lib/use-product-storage";

export default function StageLessonPage() {
  const params = useParams<{ stage: string }>();
  if (typeof params.stage !== "string" || !Object.hasOwn(stageLessons, params.stage)) notFound();
  const lesson = stageLessons[params.stage];
  if (!lesson) notFound();
  return <StageLessonBody key={params.stage} stage={params.stage} />;
}

function StageLessonBody({ stage }: { stage: string }) {
  const { storage } = useProductStorage();
  const { locale } = useLanguage();
  const lesson = stageLessons[stage];
  const copy = pickLocalized(lesson.copy, locale);
  const [stepIndex, setStepIndex] = useState(0);
  const [navigation] = useState(() => ({ version: 0, active: false, blocked: false, saving: false }));
  const [ticket, setTicket] = useState(0);
  const [saveIssue, setSaveIssue] = useState(false);
  const step = copy.steps[stepIndex];

  function isCurrentStep() {
    try { return navigation.active && ticket === navigation.version && storage.isCurrent(); }
    catch { return false; }
  }

  useLayoutEffect(() => {
    const version = ++navigation.version;
    navigation.active = true;
    navigation.blocked = false;
    setTicket(version);
    setStepIndex(0);
    setSaveIssue(false);
    return () => {
      if (navigation.version === version) {
        navigation.active = false;
        navigation.version += 1;
      }
    };
  }, [stage, storage, navigation]);

  useLayoutEffect(() => {
    if (!isCurrentStep() || navigation.blocked || navigation.saving) return;
    navigation.saving = true;
    try {
      recordLessonStep(stage, stepIndex + 1, storage);
      if (!isCurrentStep()) return;
      setSaveIssue(false);
    } catch {
      if (!isCurrentStep()) return;
      navigation.blocked = true;
      setSaveIssue(true);
    } finally {
      navigation.saving = false;
    }
  }, [stage, stepIndex, storage, ticket, navigation]);
  const isLast = stepIndex === copy.steps.length - 1;
  const cannotContinue = saveIssue || navigation.blocked || navigation.saving || !isCurrentStep();

  function handleNext() {
    if (saveIssue || navigation.blocked || navigation.saving || !isCurrentStep() || isLast) return;
    setStepIndex(index => isCurrentStep() && !navigation.blocked && !navigation.saving && index === stepIndex
      ? Math.min(index + 1, copy.steps.length - 1) : index);
  }

  return (
    <section aria-labelledby="stage-lesson-title">
      <p className="mb-3 text-sm font-black text-primary">{copy.stepLabel(stepIndex + 1, copy.steps.length)}</p>
      <h1 id="stage-lesson-title" className="text-3xl font-black leading-tight text-text md:text-4xl">
        {copy.title}
      </h1>
      {saveIssue && (
        <p role="alert" className="mt-4 rounded-lg border border-warning/40 bg-warning/15 p-4 text-sm text-text">
          {locale === "pl"
            ? "Nie udało się potwierdzić zapisu kroku lekcji. Przejście dalej jest zablokowane. Odśwież stronę, aby ponownie odczytać dane lokalne."
            : "The lesson step save could not be confirmed. Continuing is blocked. Reload the page to read the local data again."}
        </p>
      )}
      <Card className="mt-6 border-primary/15 bg-white">
        <CardContent className="p-5 md:p-6">
          <h2 className="text-2xl font-black leading-tight text-text">{step.title}</h2>
          <p className="mt-4 text-base font-semibold leading-7 text-text">{step.body}</p>
          <div className="mt-6">
            {isLast ? (
              cannotContinue ? <Button type="button" size="lg" className="w-full" disabled>{copy.quiz}</Button> : (
                <Button asChild size="lg" className="w-full">
                  <Link href={lesson.quizHref} onClick={event => {
                    if (navigation.blocked || navigation.saving || !isCurrentStep()) event.preventDefault();
                  }}>{copy.quiz}</Link>
                </Button>
              )
            ) : (
              <Button type="button" size="lg" className="w-full" onClick={handleNext} disabled={cannotContinue}>
                {copy.next}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
