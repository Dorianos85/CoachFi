"use client";

import Link from "next/link";
import { BookOpen, Check, HeartHandshake, MessageCircle, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { useConsent } from "@/context/ConsentContext";
import { useMode } from "@/context/ModeContext";
import { useLearningPaths } from "@/context/LearningPathsContext";
import { hasAdultConfirmation } from "@/lib/product-scope";
import {
  FAMILY_CORRECT_ANSWER,
  FAMILY_EXAMPLE,
  getFamilyLearningContent,
  type FamilyAnswer,
  type FamilyGoal,
} from "@/lib/family-learning-content";

const goals: readonly FamilyGoal[] = ["needs", "shared-goal"];
const answers: readonly FamilyAnswer[] = ["a", "b", "c"];
const panelClass = "rounded-card border border-border-subtle bg-card p-5 text-text shadow-soft sm:p-7";

export function FamilyLearningPath() {
  const { locale } = useLanguage();
  const copy = getFamilyLearningContent(locale);
  const { loaded: consentLoaded, requiredAccepted, openSettings } = useConsent();
  const { loaded: modeLoaded, modeRecord } = useMode();
  const ready = consentLoaded && requiredAccepted && modeLoaded && hasAdultConfirmation(modeRecord);
  const { paths, chooseGoal, markLessonRead, answerQuestion, markActionPlanned } = useLearningPaths();
  const session = paths.family;
  const goal = ready && (session.goal === "needs" || session.goal === "shared-goal") ? session.goal : null;
  const selectedGoal = goal ? copy.goals[goal] : null;
  const correct = session.answer === FAMILY_CORRECT_ANSWER;
  const steps = [goal !== null, ready && session.lessonRead, ready && correct, ready && session.actionPlanned];
  const completed = steps.filter(Boolean).length;

  return (
    <div className="learning-path-surface mx-auto w-full max-w-6xl space-y-7 rounded-card bg-background px-4 py-8 text-text sm:px-6 sm:py-12" data-learning-path="family">
      <header className="rounded-card border border-border-subtle bg-card p-6 text-text shadow-soft sm:p-9">
        <p className="mb-4 flex items-center gap-2 text-sm font-extrabold text-primary"><HeartHandshake aria-hidden="true" className="h-5 w-5 shrink-0" />{copy.badge}</p>
        <h1 className="max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl">{copy.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed">{copy.introduction}</p>
        <p className="mt-5 text-sm font-bold text-primary">{copy.scope}</p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed">{copy.privacy}</p>
      </header>

      {!ready ? <section className={panelClass} aria-label={copy.privacyButton}><p className="text-sm leading-relaxed">{copy.readiness}</p>{!requiredAccepted ? <Button type="button" variant="outline" onClick={openSettings} className="mt-4">{copy.privacyButton}</Button> : null}</section> : null}

      <section className={panelClass} aria-labelledby="family-goal-heading">
        <h2 id="family-goal-heading" className="text-xl font-extrabold">{copy.chooseHeading}</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">{copy.chooseHelp}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2" role="group" aria-labelledby="family-goal-heading">
          {goals.map((choice) => (
            <button
              key={choice}
              type="button"
              aria-pressed={goal === choice}
              disabled={!ready}
              onClick={() => { if (ready) chooseGoal("family", choice); }}
              className={`min-h-28 rounded-card border-2 p-5 text-left text-text transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${goal === choice ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"}`}
            >
              <span className="flex items-center justify-between gap-3 text-base font-extrabold">{copy.goals[choice].title}{goal === choice ? <Check aria-label={copy.selected} className="h-5 w-5 shrink-0 text-primary" /> : null}</span>
              <span className="mt-2 block text-sm leading-relaxed text-muted">{copy.goals[choice].summary}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-7">
          {selectedGoal ? (
            <>
              <section className={panelClass} aria-labelledby="family-lesson-heading">
                <p className="flex items-center gap-2 text-sm font-bold text-primary"><BookOpen aria-hidden="true" className="h-5 w-5" />{copy.lessonHeading}</p>
                <h2 id="family-lesson-heading" className="mt-3 text-2xl font-extrabold">{selectedGoal.lessonTitle}</h2>
                <p className="mt-4 leading-relaxed">{selectedGoal.lessonLead}</p>
                <p className="mt-3 leading-relaxed text-muted">{selectedGoal.lessonDetail}</p>

                <div className="mt-6 rounded-lg border border-border-subtle bg-background p-5 text-text">
                  <h3 className="font-extrabold">{copy.exampleHeading}</h3>
                  <p className="mt-2 text-sm leading-relaxed">{copy.exampleIntroduction}</p>
                  <dl className="mt-4 space-y-2 text-sm">
                    {(["available", "necessary", "setAside", "optional"] as const).map((key) => (
                      <div key={key} className={`flex items-start justify-between gap-4 ${key === "optional" ? "border-t border-border-subtle pt-2 font-extrabold" : ""}`}>
                        <dt>{copy.exampleRows[key]}</dt><dd className="shrink-0">{FAMILY_EXAMPLE[key]} PLN</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-4 font-extrabold">{copy.exampleEquation}</p>
                  <p className="mt-3 text-sm leading-relaxed">{copy.exampleConclusion}</p>
                </div>

                <h3 className="mt-6 flex items-center gap-2 font-extrabold"><MessageCircle aria-hidden="true" className="h-5 w-5 shrink-0" />{copy.conversationHeading}</h3>
                <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted">{selectedGoal.conversation.map((prompt) => <li key={prompt}>{prompt}</li>)}</ol>
                <Button type="button" variant="outline" className="mt-6 w-full bg-primary text-on-primary shadow-press hover:bg-primary/90" onClick={() => markLessonRead("family")} disabled={session.lessonRead}>{session.lessonRead ? copy.readDone : copy.readButton}</Button>
                <p className="mt-2 text-xs leading-relaxed text-muted">{copy.readHelp}</p>
              </section>

              <section className={panelClass} aria-labelledby="family-quiz-heading">
                <h2 id="family-quiz-heading" className="text-xl font-extrabold">{copy.quizHeading}</h2>
                {session.lessonRead ? (
                  <form key={goal} className="mt-4" onSubmit={(event) => {
                    event.preventDefault();
                    const answer = new FormData(event.currentTarget).get("family-answer");
                    if (answer === "a" || answer === "b" || answer === "c") answerQuestion("family", answer);
                  }}>
                    <fieldset>
                      <legend className="leading-relaxed">{copy.quizPrompt}</legend>
                      <div className="mt-4 grid gap-3">
                        {answers.map((answer) => (
                          <label key={answer} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition hover:border-primary/50 hover:bg-primary/5 focus-within:ring-2 focus-within:ring-focus focus-within:ring-offset-2">
                            <input type="radio" name="family-answer" value={answer} required defaultChecked={session.answer === answer} className="h-5 w-5 shrink-0 accent-primary" />
                            <span className="font-bold">{copy.quizOptions[answer]}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <Button type="submit" variant="outline" className="mt-4 w-full bg-primary text-on-primary shadow-press hover:bg-primary/90">{copy.quizSubmit}</Button>
                  </form>
                ) : <p className="mt-3 text-sm text-muted">{copy.quizLocked}</p>}
                <div role="status" aria-live="polite" aria-atomic="true">
                  {session.answer ? <div className={`mt-4 rounded-lg border p-4 text-sm leading-relaxed text-text ${correct ? "border-success/30 bg-success/10" : "border-warning/30 bg-warning/10"}`}><p className="font-bold">{correct ? copy.quizSuccess : copy.quizRetry}</p><p className="mt-2">{copy.quizExplanations[session.answer]}</p></div> : null}
                </div>
              </section>

              <section className={panelClass} aria-labelledby="family-action-heading">
                <h2 id="family-action-heading" className="text-xl font-extrabold">{copy.actionHeading}</h2>
                {correct ? <>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{copy.actionHelp}</p>
                  <h3 className="mt-5 flex items-center gap-2 font-extrabold"><PencilLine aria-hidden="true" className="h-5 w-5 shrink-0" />{selectedGoal.actionTitle}</h3>
                  <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed">{selectedGoal.actionSteps.map((step) => <li key={step}>{step}</li>)}</ol>
                  <Button type="button" variant="outline" className="mt-5 w-full bg-primary text-on-primary shadow-press hover:bg-primary/90" onClick={() => markActionPlanned("family")} disabled={session.actionPlanned}>{session.actionPlanned ? copy.actionDone : copy.actionButton}</Button>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{copy.actionDisclosure}</p>
                </> : <p className="mt-3 text-sm text-muted">{copy.actionLocked}</p>}
              </section>
            </>
          ) : null}
        </div>

        <aside className="space-y-5" aria-label={copy.progressHeading}>
          <section className={panelClass} aria-labelledby="family-progress-heading">
            <h2 id="family-progress-heading" className="text-lg font-extrabold">{copy.progressHeading}</h2>
            <p className="mt-3 text-3xl font-extrabold text-primary">{completed}<span className="text-base font-bold text-muted"> / 4</span></p>
            <progress className="mt-3 h-3 w-full accent-primary" max={4} value={completed} aria-label={copy.progressLabel} />
            <ol className="mt-4 space-y-3 text-sm">{copy.progressSteps.map((step, index) => <li key={step} className="flex items-start gap-2"><span aria-hidden="true" className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${steps[index] ? "border-primary-border bg-primary text-on-primary" : "border-border"}`}>{steps[index] ? "✓" : index + 1}</span><span>{step}<span className="block text-xs text-muted">{steps[index] ? copy.progressDone : copy.progressPending}</span></span></li>)}</ol>
            <p className="mt-5 text-xs leading-relaxed text-muted">{copy.progressNote}</p>
            <div role="status" aria-live="polite">{completed === 4 ? <p className="mt-4 rounded-lg bg-success/10 p-3 text-sm font-bold text-text">{copy.completion}</p> : null}</div>
          </section>
          {selectedGoal ? <section className="rounded-card border border-primary/15 bg-area-mila p-5 text-text shadow-soft" aria-labelledby="family-mila-heading"><h2 id="family-mila-heading" className="font-extrabold text-primary">{copy.milaHeading}</h2><p className="mt-3 text-sm leading-relaxed">{selectedGoal.mila}</p><p className="mt-4 border-t border-primary/15 pt-3 text-xs leading-relaxed text-muted">{copy.milaDisclosure}</p></section> : null}
          <Link href="/" className="inline-flex min-h-12 items-center rounded-button px-3 text-sm font-bold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2">{copy.back}</Link>
        </aside>
      </div>
    </div>
  );
}
