"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Banknote,
  Brain,
  ChartLine,
  CreditCard,
  HeartHandshake,
  Landmark,
  Lock,
  PiggyBank,
  ShieldCheck,
} from "lucide-react";
import { useLayoutEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/context/LanguageContext";
import {
  markStageStarted,
  type StageProgress,
  type StageStatus,
} from "@/lib/learningProgress";
import { getLocalizedContent } from "@/lib/localizedContent";
import { isFeatureEnabled } from "@/lib/product-scope";
import { useProductStorage } from "@/lib/use-product-storage";
import { readStageProgress } from "@/lib/learning-progress-read";

const STAGE_ICONS = [Brain, Banknote, ChartLine, CreditCard, PiggyBank, Landmark, ShieldCheck, HeartHandshake];

const STAGE_DATA = [
  { id: "money-mindset", reward: 25 },
  { id: "saving-habit", reward: 35 },
  { id: "inflation", reward: 40 },
  { id: "credit-rates", reward: 45 },
  { id: "emergency-fund", reward: 50 },
  { id: "long-term-investing", reward: 60 },
  { id: "retirement", reward: 70 },
  { id: "family-plan", reward: 100 },
];

const STAGE_QUIZ_LINK: Record<string, string> = {
  "money-mindset": "/learn/money-mindset",
  "saving-habit": "/learn/saving-habit",
  inflation: "/learn/inflation",
  "credit-rates": "/learn/credit-rates",
  "emergency-fund": "/learn/emergency-fund",
  "long-term-investing": "/learn/long-term-investing",
  retirement: "/learn/retirement",
  "family-plan": "/learn/family-plan",
};

function statusBadgeVariant(status: StageStatus) {
  if (status === "completed") return "success" as const;
  if (status === "inProgress") return "default" as const;
  if (status === "current") return "accent" as const;
  return "muted" as const;
}

export function ProgressPath() {
  const { storage } = useProductStorage();
  const { locale, t } = useLanguage();
  const copy = getLocalizedContent(locale);
  const [progress, setProgress] = useState<StageProgress[] | null>(null);
  const [readIssue, setReadIssue] = useState<"read" | "start" | null>(null);
  const [readVersion, setReadVersion] = useState(0);
  const [readScope, setReadScope] = useState<{ active: boolean; issue: boolean } | null>(null);

  useLayoutEffect(() => {
    const view = { active: true, issue: false };
    const current = () => view.active && storage.isCurrent();
    setReadScope(view);
    const refresh = () => {
      if (!current()) return;
      try {
        const next = readStageProgress(storage);
        if (!current()) return;
        view.issue = false;
        setProgress(next);
        setReadIssue(null);
      } catch {
        if (!current()) return;
        view.issue = true;
        setProgress(null);
        setReadIssue("read");
      }
    };
    refresh();
    window.addEventListener("coachfi-learning", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      view.active = false;
      window.removeEventListener("coachfi-learning", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [locale, storage, readVersion]);

  function getLabel(status: StageStatus): string {
    if (status === "completed") return t.learn.statusCompleted;
    if (status === "inProgress") return t.learn.statusInProgress;
    if (status === "current") return t.learn.statusCurrent;
    return t.learn.statusLocked;
  }

  function handleStart(event: { preventDefault(): void }, stageId: string) {
    const current = () => readScope?.active && storage.isCurrent();
    if (!current() || readScope?.issue) { event.preventDefault(); return; }
    let startAttempted = false;
    try {
      readStageProgress(storage);
      if (!current()) { event.preventDefault(); return; }
      startAttempted = true;
      markStageStarted(stageId, storage);
      const next = readStageProgress(storage);
      if (!current()) { event.preventDefault(); return; }
      setProgress(next);
      setReadIssue(null);
    } catch {
      event.preventDefault();
      if (!current()) return;
      readScope!.issue = true;
      setProgress(null);
      setReadIssue(startAttempted ? "start" : "read");
    }
  }

  if (readIssue) {
    return <div role="alert" data-testid="path-progress-alert" className="rounded-lg bg-warning/20 p-4 text-sm font-bold">
      <p>{readIssue === "start"
        ? locale === "pl" ? "Nie udało się potwierdzić rozpoczęcia lekcji. Dane lokalne mogły zostać zapisane częściowo. Odczytaj je ponownie przed kontynuacją." : "Starting the lesson could not be confirmed. Local data may have been partially saved. Read it again before continuing."
        : locale === "pl" ? "Nie udało się odczytać postępu nauki. Spróbuj odczytać dane ponownie." : "Learning progress could not be read. Try reading your data again."}</p>
      <Button type="button" data-testid="path-progress-retry" variant="outline" className="mt-3" onClick={() => {
        if (!readScope?.active || !readScope.issue || !storage.isCurrent()) return;
        readScope.active = false;
        setReadVersion(value => value + 1);
      }}>{locale === "pl" ? "Spróbuj ponownie" : "Try again"}</Button>
    </div>;
  }
  if (!progress) return <p role="status" data-testid="path-progress-loading">{locale === "pl" ? "Odczytywanie postępu nauki…" : "Reading learning progress…"}</p>;

  return (
    <div data-testid="path-progress-grid" className="grid gap-4 xl:grid-cols-2">
      {STAGE_DATA.map((stage, index) => {
        const p = progress[index];
        const status: StageStatus = p?.status ?? (index === 0 ? "current" : "locked");
        const pct = p?.progressPct ?? 0;
        const answered = p?.answeredCount ?? 0;
        const total = p?.totalCount ?? 0;
        const locked = status === "locked";
        const completed = status === "completed";
        const active = status === "current" || status === "inProgress";
        const Icon = STAGE_ICONS[index];
        const localizedStage = copy.learn.stages[index];
        const title = localizedStage?.title ?? stage.id;
        const nft = completed ? localizedStage?.nftLabel ?? t.rewards.locked : t.rewards.locked;
        const link = STAGE_QUIZ_LINK[stage.id] ?? "/review";

        return (
          <motion.div
            key={stage.id}
            data-testid={"progress-stage-" + stage.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.06 }}
          >
            <Card
              className={
                completed
                  ? "border-success/25 bg-white"
                  : active
                    ? "border-primary/30 bg-white shadow-glow"
                    : "border-primary/10 bg-white/70 opacity-80"
              }
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <motion.span
                    whileHover={!locked ? { scale: 1.08 } : {}}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={
                      completed
                        ? "grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-success/15 text-success"
                        : active
                          ? "grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-on-primary shadow-glow"
                          : "grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/8 text-muted"
                    }
                  >
                    {locked ? (
                      <Lock className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    )}
                  </motion.span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-background px-2 py-1 text-xs font-black text-muted">
                        {t.learn.stageLabel} {index + 1}
                      </span>
                      <Badge variant={statusBadgeVariant(status)}>{getLabel(status)}</Badge>
                    </div>

                    <h2 className="mt-3 text-xl font-black leading-tight text-text">{title}</h2>

                    <div className="mt-4">
                      <div className="mb-1.5 flex justify-between text-xs font-bold text-muted">
                        <span>
                          {answered}/{total} {copy.learn.answered}
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <Progress value={pct} valueLabel={`${title} ${pct}%`} />
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-lg bg-primary/5 px-3 py-2.5">
                        <p className="text-xs font-black uppercase text-muted">{t.learn.reward}</p>
                        <p className="mt-0.5 font-black text-text">
                          {stage.reward} {t.common.tokenUnit}
                        </p>
                      </div>
                      {isFeatureEnabled("web3") && <div className={`rounded-lg px-3 py-2.5 ${completed ? "bg-success/10" : "bg-accent/15"}`}>
                        <p className="text-xs font-black uppercase text-muted">{t.learn.nftStatus}</p>
                        <p className={`mt-0.5 font-black ${completed ? "text-success" : "text-muted"}`}>
                          {completed ? nft : locked ? t.rewards.locked : nft}
                        </p>
                      </div>}
                    </div>

                    {!locked && (
                      <div className="mt-4">
                        {completed ? (
                          <Link
                            href={link}
                            className="inline-flex items-center gap-1.5 text-sm font-bold text-success hover:underline"
                          >
                            {t.learn.statusCompleted} - {t.learn.continueLesson} -&gt;
                          </Link>
                        ) : (
                          <Button asChild size="sm" className="w-full" onClick={(event) => handleStart(event, stage.id)}>
                            <Link href={link}>
                              {pct > 0 ? t.learn.continueLesson : t.learn.startLesson} -&gt;
                            </Link>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
