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
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { addTokens, getTokenBalance } from "@/lib/tokens";
import { getDisplayName, getUser } from "@/lib/user";

type QuizUiCopy = {
  accepted: string;
  scored: (name: string, score: string) => string;
  toBeat: string;
  result: (score: number) => string;
  share: (score: number) => string;
  shareTitle: string;
};

const QUIZ_UI: LocalizedMap<QuizUiCopy> = {
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
  es: {
    accepted: "¡Reto aceptado!",
    scored: (name: string, score: string) => `${name} ha conseguido ${score} pts. ¿Puedes superarlo?`,
    toBeat: "A superar",
    result: (score: number) => `Has conseguido ${score} / 100. ¡Reta a tus amigos!`,
    share: (score: number) => `¡He conseguido ${score} pts en el quiz financiero de Coach FI! ¿Crees que puedes ganarme? Pruébalo:`,
    shareTitle: "Reto del quiz de Coach FI",
  },
  fr: {
    accepted: "Défi accepté !",
    scored: (name: string, score: string) => `${name} a obtenu ${score} pts. Pouvez-vous faire mieux ?`,
    toBeat: "À battre",
    result: (score: number) => `Vous avez obtenu ${score} / 100. Défiez vos amis !`,
    share: (score: number) => `J'ai obtenu ${score} pts au quiz financier de Coach FI ! Vous pensez pouvoir me battre ? Essayez :`,
    shareTitle: "Défi quiz Coach FI",
  },
  zh: {
    accepted: "挑战已接受！",
    scored: (name: string, score: string) => `${name} 得了 ${score} 分，你能超过吗？`,
    toBeat: "需超过",
    result: (score: number) => `你得了 ${score} / 100，快去挑战朋友吧！`,
    share: (score: number) => `我在 Coach FI 财务测验中得了 ${score} 分！你能超过我吗？来试试：`,
    shareTitle: "Coach FI 测验挑战",
  },
  hi: {
    accepted: "चुनौती स्वीकार!",
    scored: (name: string, score: string) => `${name} ने ${score} पॉइंट बनाए। क्या आप उनसे आगे निकल सकते हैं?`,
    toBeat: "पार करना है",
    result: (score: number) => `आपने ${score} / 100 बनाए। अपने दोस्तों को चुनौती दें!`,
    share: (score: number) => `मैंने Coach FI के वित्तीय क्विज़ में ${score} पॉइंट बनाए! लगता है आप मुझसे आगे निकल सकते हैं? आज़माएं:`,
    shareTitle: "Coach FI क्विज़ चुनौती",
  },
  "pt-BR": {
    accepted: "Desafio aceito!",
    scored: (name: string, score: string) => `${name} fez ${score} pts. Você consegue superar?`,
    toBeat: "Para superar",
    result: (score: number) => `Você fez ${score} / 100. Desafie seus amigos!`,
    share: (score: number) => `Fiz ${score} pts no quiz financeiro do Coach FI! Acha que consegue me superar? Tente:`,
    shareTitle: "Desafio do quiz Coach FI",
  },
  tr: {
    accepted: "Meydan okuma kabul edildi!",
    scored: (name: string, score: string) => `${name} ${score} puan aldı. Onu geçebilir misin?`,
    toBeat: "Geçilecek puan",
    result: (score: number) => `${score} / 100 aldın. Arkadaşlarına meydan oku!`,
    share: (score: number) => `Coach FI finans quizinde ${score} puan aldım! Beni geçebileceğini mi düşünüyorsun? Dene:`,
    shareTitle: "Coach FI Quiz Meydan Okuması",
  },
};

function ChallengeBanner({
  from,
  score,
  copy,
}: {
  from: string;
  score: string;
  copy: QuizUiCopy;
}) {
  const decodedFrom = decodeURIComponent(from);

  return (
    <div className="mb-6 flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary/10 p-5 shadow-soft">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-on-primary shadow-glow">
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
  const copy = pickLocalized(QUIZ_UI, locale);
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
          <QuizCard
            onReward={handleReward}
            onComplete={handleComplete}
            startQuestionId={startQuestionId}
            topic={searchParams.get("topic") ?? undefined}
          />

          {quizDone && (
            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5">
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
