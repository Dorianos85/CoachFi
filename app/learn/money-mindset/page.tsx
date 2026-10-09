"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { MONEY_MINDSET_QUIZ, moneyMindsetLesson } from "@/data/moneyMindsetLesson";

export default function MoneyMindsetLessonPage() {
  const { locale } = useLanguage();
  const copy = moneyMindsetLesson[locale];
  const [stepIndex, setStepIndex] = useState(0);
  const step = copy.steps[stepIndex];
  const isLast = stepIndex === copy.steps.length - 1;

  return (
    <section aria-labelledby="money-mindset-lesson-title">
      <p className="mb-3 text-sm font-black text-primary">{copy.stepLabel(stepIndex + 1, copy.steps.length)}</p>
      <h1 id="money-mindset-lesson-title" className="text-3xl font-black leading-tight text-text md:text-4xl">
        {copy.title}
      </h1>
      <Card className="mt-6 border-primary/15 bg-white">
        <CardContent className="p-5 md:p-6">
          <h2 className="text-2xl font-black leading-tight text-text">{step.title}</h2>
          <p className="mt-4 text-base font-semibold leading-7 text-text">{step.body}</p>
          <div className="mt-6">
            {isLast ? (
              <Button asChild size="lg" className="w-full">
                <Link href={MONEY_MINDSET_QUIZ}>{copy.quiz}</Link>
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
