"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { stageLessons } from "@/data/stageLessons";
import { recordLessonStep } from "@/lib/signInGate";

export default function StageLessonPage() {
  const params = useParams<{ stage: string }>();
  const lesson = stageLessons[params.stage];
  if (!lesson) notFound();
  return <StageLessonBody key={params.stage} stage={params.stage} />;
}

function StageLessonBody({ stage }: { stage: string }) {
  const { locale } = useLanguage();
  const lesson = stageLessons[stage];
  const copy = lesson.copy[locale];
  const [stepIndex, setStepIndex] = useState(0);
  const step = copy.steps[stepIndex];

  useEffect(() => {
    recordLessonStep(stage, stepIndex + 1);
  }, [stage, stepIndex]);
  const isLast = stepIndex === copy.steps.length - 1;

  return (
    <section aria-labelledby="stage-lesson-title">
      <p className="mb-3 text-sm font-black text-primary">{copy.stepLabel(stepIndex + 1, copy.steps.length)}</p>
      <h1 id="stage-lesson-title" className="text-3xl font-black leading-tight text-text md:text-4xl">
        {copy.title}
      </h1>
      <Card className="mt-6 border-primary/15 bg-white">
        <CardContent className="p-5 md:p-6">
          <h2 className="text-2xl font-black leading-tight text-text">{step.title}</h2>
          <p className="mt-4 text-base font-semibold leading-7 text-text">{step.body}</p>
          <div className="mt-6">
            {isLast ? (
              <Button asChild size="lg" className="w-full">
                <Link href={lesson.quizHref}>{copy.quiz}</Link>
              </Button>
            ) : (
              <Button type="button" size="lg" className="w-full" onClick={() => setStepIndex((index) => index + 1)}>
                {copy.next}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
