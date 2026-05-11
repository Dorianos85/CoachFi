"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Swords, Trophy } from "lucide-react";

import { Leaderboard } from "@/components/Leaderboard";
import { QuizCard } from "@/components/QuizCard";
import { SectionHeader } from "@/components/SectionHeader";
import { SocialShare } from "@/components/SocialShare";
import { TokenRewardCard } from "@/components/TokenRewardCard";
import { useLanguage } from "@/context/LanguageContext";
import { useStreak } from "@/context/StreakContext";
import type { Locale } from "@/lib/i18n";
import { addTokens, getTokenBalance } from "@/lib/tokens";
import { getDisplayName, getUser } from "@/lib/user";

const QUIZ_UI: Record<
  Locale,
  {
    accepted: string;
    scored: (name: string, score: string) => string;
    toBeat: string;
    result: (score: number) => string;
    share: (score: number) => string;
    shareTitle: string;
  }
> = {
  en: {
    accepted: "Challenge accepted!",
    scored: (name: string, score: string) => `${name} scored ${score} pts - can you beat them?`,
    toBeat: "To beat",
    result: (score: number) => `You scored ${score} / 100 - challenge your friends!`,
    share: (score: number) => `I scored ${score} pts on Coach FI's financial quiz! Think you can beat me? Try it:`,
    shareTitle: "Coach FI Quiz Challenge",
  },
  pl: {
    accepted: "Wyzwanie przyjęte!",
    scored: (name: string, score: string) => `${name} zdobył(a) ${score} pkt - pobijesz ten wynik?`,
    toBeat: "Do pobicia",
    result: (score: number) => `Twój wynik to ${score} / 100 - rzuć wyzwanie znajomym!`,
    share: (score: number) => `Zdobyłem/am ${score} pkt w quizie finansowym Coach FI! Pobijesz mnie? Spróbuj:`,
    shareTitle: "Wyzwanie quizowe Coach FI",
  },
  ja: {
    accepted: "チャレンジを受けました！",
    scored: (name: string, score: string) => `${name} さんは ${score} 点 - 超えられますか？`,
    toBeat: "目標",
    result: (score: number) => `あなたのスコアは ${score} / 100 - 友だちに挑戦しましょう！`,
    share: (score: number) => `Coach FI の金融クイズで ${score} 点を取りました！超えられますか？試してみてください：`,
    shareTitle: "Coach FI クイズチャレンジ",
  },
};

function ChallengeBanner({
  from,
  score,
  copy,
}: {
  from: string;
  score: string;
  copy: (typeof QUIZ_UI)[Locale];
}) {
  const decodedFrom = decodeURIComponent(from);

  return (
    <div className="mb-6 flex items-center gap-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 p-5 shadow-soft">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-white shadow-glow">
        <Swords className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black uppercase tracking-wide text-primary">{copy.accepted}</p>
        <p className="mt-0.5 text-lg font-black leading-tight text-text">
          {copy.scored(decodedFrom, score)}
        </p>
      </div>
      <div className="hidden shrink-0 rounded-xl border border-primary/15 bg-white/80 px-4 py-2 text-center sm:block">
        <p className="text-xs font-bold text-muted">{copy.toBeat}</p>
        <p className="text-2xl font-black text-primary">{score}</p>
      </div>
    </div>
  );
}

function QuizPageContent() {
  const { locale, t } = useLanguage();
  const copy = QUIZ_UI[locale];
  const { markActive } = useStreak();
  const searchParams = useSearchParams();
  const challengeFrom = searchParams.get("from");
  const challengeScore = searchParams.get("score");
  const startQuestionId = searchParams.get("challenge") ?? undefined;

  const [tokenBalance, setTokenBalance] = useState(() => getTokenBalance());
  const [solved, setSolved] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  const [myScore, setMyScore] = useState(0);

  function handleReward(amount: number) {
    const next = addTokens(amount);
    setTokenBalance(next);
    setSolved(true);
    markActive();
  }

  function handleComplete(correctCount: number, totalCount: number) {
    const pts = Math.round((correctCount / totalCount) * 100);
    setMyScore(pts);
    setQuizDone(true);
  }

  const myName = getDisplayName(getUser());
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/quiz?from=${encodeURIComponent(myName)}&score=${myScore}`
      : `/quiz?from=${encodeURIComponent(myName)}&score=${myScore}`;
  const shareText = copy.share(myScore);

  return (
    <section aria-labelledby="quiz-title">
      <SectionHeader
        eyebrow={t.quiz.eyebrow}
        title={t.quiz.title}
        description={t.quiz.description}
        readText={t.quiz.readText}
      />

      {challengeFrom && challengeScore && (
        <ChallengeBanner from={challengeFrom} score={challengeScore} copy={copy} />
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-5">
          <QuizCard onReward={handleReward} onComplete={handleComplete} startQuestionId={startQuestionId} />

          {quizDone && (
            <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-accent/5 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" aria-hidden="true" />
                <p className="font-black text-text">{copy.result(myScore)}</p>
              </div>
              <SocialShare text={shareText} url={shareUrl} title={copy.shareTitle} />
            </div>
          )}
        </div>

        <div className="grid gap-5">
          <TokenRewardCard balance={tokenBalance} status={solved ? t.quiz.checkKnowledge : t.rewards.tokens} />
          <Leaderboard userScore={42} />
        </div>
      </div>
    </section>
  );
}

export default function QuizPage() {
  return (
    <Suspense>
      <QuizPageContent />
    </Suspense>
  );
}
