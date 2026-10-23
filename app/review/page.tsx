"use client";
import { useProductStorage } from "@/lib/use-product-storage";

import { AnimatePresence, motion } from "framer-motion";
import { Brain, CheckCircle2, XCircle } from "lucide-react";
import { useLayoutEffect, useMemo, useState } from "react";

import { SectionHeader } from "@/components/SectionHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { useStreak } from "@/context/StreakContext";
import { getAllQuestionIds, getAllQuestions, getQuestionById } from "@/lib/allQuestions";
import { getDueIds, intervalLabel, masteryLevel, recordAnswer } from "@/lib/srs";
import type { SRSCard } from "@/lib/srs";
import { createReviewSaveController, readReviewCards, type ReviewSaveTicket } from "@/lib/review-save";
import { cn } from "@/lib/utils";

// Confetti particle
function Confetti({ active }: { active: boolean }) {
  const colors = ["var(--cf-grape)", "var(--cf-area-rewards)", "var(--cf-area-progress)", "var(--cf-accent)", "var(--cf-area-learn)", "var(--cf-area-care)"];
  const count = 32;
  return (
    <AnimatePresence>
      {active && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
          {Array.from({ length: count }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-3 w-3 rounded-sm"
              style={{
                left: `${5 + ((i * 97) % 90)}%`,
                top: "-12px",
                backgroundColor: colors[i % colors.length],
                rotate: `${(i * 37) % 360}deg`,
              }}
              animate={{
                y: ["0vh", "110vh"],
                x: [0, ((i % 2 === 0 ? 1 : -1) * (i * 13)) % 120],
                rotate: [`${(i * 37) % 360}deg`, `${(i * 37 + 360) % 720}deg`],
                opacity: [1, 1, 0],
              }}
              transition={{ duration: 2 + (i % 5) * 0.3, delay: i * 0.04, ease: "easeIn" }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// Mastery dots indicator
function MasteryDots({ level }: { level: 0 | 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex gap-1" aria-label={`Mastery level ${level} of 4`}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 w-5 rounded-full transition",
            i < level ? "bg-primary" : "bg-primary/15"
          )}
        />
      ))}
    </div>
  );
}

const reviewCopy = {
  en: {
    eyebrow: "Spaced Review",
    title: "Review",
    readText: "Review session. Answer questions to strengthen your memory.",
    allCaughtTitle: "All caught up!",
    allCaughtDescription: "No questions due today. Come back tomorrow - your streak is safe.",
    deckTotal: "Total questions in your deck",
    sessionCompleteTitle: "Session complete!",
    sessionCompleteReadText: "Review session complete.",
    answeredCorrectly: "questions answered correctly",
    accuracy: "accuracy",
    reviewAgain: "Review again",
    description: (current: number, total: number) =>
      `${current} of ${total} - SM-2 algorithm schedules your next review automatically`,
    nextPrefix: "next:",
    correct: "Correct!",
    notQuite: "Not quite",
    nextReview: "Next review:",
    checkAnswer: "Check answer",
    finishSession: "Finish session",
    next: "Next",
    resultSuffix: "...",
  },
  pl: {
    eyebrow: "Powtórki",
    title: "Powtórki",
    readText: "Sesja powtórek. Odpowiadaj na pytania, aby utrwalić wiedzę.",
    allCaughtTitle: "Wszystko powtórzone!",
    allCaughtDescription: "Nie masz dziś pytań do powtórki. Wróć jutro - Twoja seria jest bezpieczna.",
    deckTotal: "Liczba pytań w talii",
    sessionCompleteTitle: "Sesja zakończona!",
    sessionCompleteReadText: "Sesja powtórek zakończona.",
    answeredCorrectly: "poprawnych odpowiedzi",
    accuracy: "skuteczność",
    reviewAgain: "Powtórz jeszcze raz",
    description: (current: number, total: number) =>
      `${current} z ${total} - algorytm SM-2 automatycznie zaplanuje kolejną powtórkę`,
    nextPrefix: "następna:",
    correct: "Dobrze!",
    notQuite: "Jeszcze nie",
    nextReview: "Następna powtórka:",
    checkAnswer: "Sprawdź odpowiedź",
    finishSession: "Zakończ sesję",
    next: "Następne",
    resultSuffix: "...",
  },
  es: {
    eyebrow: "Repaso espaciado",
    title: "Repaso",
    readText: "Sesión de repaso. Responde preguntas para reforzar tu memoria.",
    allCaughtTitle: "¡Todo al día!",
    allCaughtDescription: "Hoy no hay preguntas pendientes. Vuelve mañana: tu racha está a salvo.",
    deckTotal: "Total de preguntas en tu mazo",
    sessionCompleteTitle: "¡Sesión completada!",
    sessionCompleteReadText: "Sesión de repaso completada.",
    answeredCorrectly: "preguntas respondidas correctamente",
    accuracy: "de acierto",
    reviewAgain: "Repasar de nuevo",
    description: (current: number, total: number) =>
      `${current} de ${total} - el algoritmo SM-2 programa tu próximo repaso automáticamente`,
    nextPrefix: "siguiente:",
    correct: "¡Correcto!",
    notQuite: "No del todo",
    nextReview: "Próximo repaso:",
    checkAnswer: "Comprobar respuesta",
    finishSession: "Terminar sesión",
    next: "Siguiente",
    resultSuffix: "...",
  },
  fr: {
    eyebrow: "Révision espacée",
    title: "Révision",
    readText: "Session de révision. Répondez aux questions pour renforcer votre mémoire.",
    allCaughtTitle: "Tout est à jour !",
    allCaughtDescription: "Aucune question à revoir aujourd'hui. Revenez demain : votre série est préservée.",
    deckTotal: "Nombre total de questions dans votre paquet",
    sessionCompleteTitle: "Session terminée !",
    sessionCompleteReadText: "Session de révision terminée.",
    answeredCorrectly: "questions réussies",
    accuracy: "de réussite",
    reviewAgain: "Réviser à nouveau",
    description: (current: number, total: number) =>
      `${current} sur ${total} - l'algorithme SM-2 planifie automatiquement votre prochaine révision`,
    nextPrefix: "suivant :",
    correct: "Bonne réponse !",
    notQuite: "Pas tout à fait",
    nextReview: "Prochaine révision :",
    checkAnswer: "Vérifier la réponse",
    finishSession: "Terminer la session",
    next: "Suivant",
    resultSuffix: "...",
  },
  zh: {
    eyebrow: "间隔复习",
    title: "复习",
    readText: "复习环节。回答问题来巩固记忆。",
    allCaughtTitle: "全部完成！",
    allCaughtDescription: "今天没有到期的题目。明天再来，你的连胜安全无忧。",
    deckTotal: "题库中的题目总数",
    sessionCompleteTitle: "本次复习完成！",
    sessionCompleteReadText: "复习环节已完成。",
    answeredCorrectly: "道题答对",
    accuracy: "正确率",
    reviewAgain: "再复习一次",
    description: (current: number, total: number) =>
      `第 ${current} 题，共 ${total} 题 - SM-2 算法会自动安排你的下次复习`,
    nextPrefix: "下次：",
    correct: "答对了！",
    notQuite: "还差一点",
    nextReview: "下次复习：",
    checkAnswer: "检查答案",
    finishSession: "结束本次复习",
    next: "下一题",
    resultSuffix: "...",
  },
  hi: {
    eyebrow: "अंतराल पर दोहराव",
    title: "दोहराव",
    readText: "दोहराव सत्र। अपनी याददाश्त मज़बूत करने के लिए सवालों के जवाब दें।",
    allCaughtTitle: "सब पूरा हो गया!",
    allCaughtDescription: "आज कोई सवाल बाकी नहीं है। कल वापस आएं, आपकी स्ट्रीक सुरक्षित है।",
    deckTotal: "आपके डेक में कुल सवाल",
    sessionCompleteTitle: "सत्र पूरा हुआ!",
    sessionCompleteReadText: "दोहराव सत्र पूरा हुआ।",
    answeredCorrectly: "सवालों के सही जवाब दिए",
    accuracy: "सटीकता",
    reviewAgain: "फिर से दोहराएं",
    description: (current: number, total: number) =>
      `${current} / ${total} - SM-2 एल्गोरिदम आपका अगला दोहराव अपने आप तय करता है`,
    nextPrefix: "अगला:",
    correct: "सही!",
    notQuite: "पूरी तरह नहीं",
    nextReview: "अगला दोहराव:",
    checkAnswer: "जवाब जांचें",
    finishSession: "सत्र समाप्त करें",
    next: "अगला",
    resultSuffix: "...",
  },
  "pt-BR": {
    eyebrow: "Revisão espaçada",
    title: "Revisão",
    readText: "Sessão de revisão. Responda às perguntas para fortalecer sua memória.",
    allCaughtTitle: "Tudo em dia!",
    allCaughtDescription: "Nenhuma pergunta para hoje. Volte amanhã: sua sequência está a salvo.",
    deckTotal: "Total de perguntas no seu baralho",
    sessionCompleteTitle: "Sessão concluída!",
    sessionCompleteReadText: "Sessão de revisão concluída.",
    answeredCorrectly: "perguntas respondidas corretamente",
    accuracy: "de acerto",
    reviewAgain: "Revisar de novo",
    description: (current: number, total: number) =>
      `${current} de ${total} - o algoritmo SM-2 agenda sua próxima revisão automaticamente`,
    nextPrefix: "próxima:",
    correct: "Correto!",
    notQuite: "Quase",
    nextReview: "Próxima revisão:",
    checkAnswer: "Conferir resposta",
    finishSession: "Encerrar sessão",
    next: "Próxima",
    resultSuffix: "...",
  },
  tr: {
    eyebrow: "Aralıklı tekrar",
    title: "Tekrar",
    readText: "Tekrar oturumu. Hafızanı güçlendirmek için soruları yanıtla.",
    allCaughtTitle: "Hepsi tamam!",
    allCaughtDescription: "Bugün tekrar edilecek soru yok. Yarın gel: serin güvende.",
    deckTotal: "Destendeki toplam soru",
    sessionCompleteTitle: "Oturum tamamlandı!",
    sessionCompleteReadText: "Tekrar oturumu tamamlandı.",
    answeredCorrectly: "soru doğru yanıtlandı",
    accuracy: "doğruluk",
    reviewAgain: "Yeniden tekrar et",
    description: (current: number, total: number) =>
      `${current} / ${total} - SM-2 algoritması bir sonraki tekrarını otomatik planlar`,
    nextPrefix: "sonraki:",
    correct: "Doğru!",
    notQuite: "Tam değil",
    nextReview: "Sonraki tekrar:",
    checkAnswer: "Cevabı kontrol et",
    finishSession: "Oturumu bitir",
    next: "Sonraki",
    resultSuffix: "...",
  },
  ja: {
    eyebrow: "間隔をあけた復習",
    title: "復習",
    readText: "復習セッション。問題に答えて記憶を定着させましょう。",
    allCaughtTitle: "すべて完了！",
    allCaughtDescription: "今日復習する問題はありません。また明日どうぞ。連続記録は守られています。",
    deckTotal: "デッキ内の問題数",
    sessionCompleteTitle: "セッション完了！",
    sessionCompleteReadText: "復習セッションが完了しました。",
    answeredCorrectly: "問正解",
    accuracy: "正答率",
    reviewAgain: "もう一度復習",
    description: (current: number, total: number) =>
      `${current} / ${total} - SM-2アルゴリズムが次の復習を自動で予定します`,
    nextPrefix: "次回：",
    correct: "正解！",
    notQuite: "おしい",
    nextReview: "次の復習：",
    checkAnswer: "答えを確認",
    finishSession: "セッションを終了",
    next: "次へ",
    resultSuffix: "...",
  },
};

function getReviewCopy(locale: string) {
  return (reviewCopy as Record<string, typeof reviewCopy.en>)[locale] ?? reviewCopy.en;
}

function formatReviewInterval(card: SRSCard, locale: string): string {
  if (locale !== "pl") return intervalLabel(card);
  if (card.repetitions === 0) return "nowe";
  if (card.interval === 1) return "jutro";
  if (card.interval < 7) return `${card.interval} dni`;
  if (card.interval < 30) return `${Math.round(card.interval / 7)} tyg.`;
  return `${Math.round(card.interval / 30)} mies.`;
}

export default function ReviewPage() {
  const { storage } = useProductStorage();
  const { locale } = useLanguage();
  const { markActive } = useStreak();
  const copy = getReviewCopy(locale);

  const [dueIds, setDueIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<{ id: string; correct: boolean }[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [saveController] = useState(createReviewSaveController);
  const [saveTicket, setSaveTicket] = useState<ReviewSaveTicket | null>(null);
  const [session, setSession] = useState(0);
  const [cards, setCards] = useState<SRSCard[]>([]);
  const [savedCard, setSavedCard] = useState<SRSCard | null>(null);
  const [loadIssue, setLoadIssue] = useState(false);
  const [saveIssue, setSaveIssue] = useState<"retryable" | "uncertain" | null>(null);
  const persistenceCopy = locale === "pl" ? {
    read: "Nie udało się odczytać danych powtórek. Nie zmieniono zapisanych danych. Spróbuj ponownie.",
    retryable: "Odpowiedź nie została zapisana. Sprawdź dostęp do danych i spróbuj ponownie.",
    uncertain: "Nie udało się potwierdzić zapisu odpowiedzi. Ta sesja jest zablokowana, aby nie powtórzyć zapisu. Odśwież stronę i ponownie odczytaj dane lokalne.",
    retry: "Spróbuj ponownie",
  } : {
    read: "Review data could not be read. Saved data was not changed. Try again.",
    retryable: "The answer was not saved. Check data access and try again.",
    uncertain: "The answer save could not be confirmed. This session is blocked to avoid repeating the write. Reload the page to read local data again.",
    retry: "Try again",
  };
  const persistenceIssue = saveController.issue(storage) ?? saveIssue;

  useLayoutEffect(() => {
    // Retire handlers before reading a new language, owner or explicit session.
    saveController.retire();
    setSaveTicket(null);
    setSaveIssue(saveController.issue(storage));
    setLoadIssue(false);
    setDueIds([]);
    setCards([]);
    setCurrentIndex(0);
    setSelected(null);
    setRevealed(false);
    setSavedCard(null);
    setResults([]);
    setShowConfetti(false);
    setSessionDone(false);
    if (saveController.issue(storage)) return () => { saveController.retire(); };
    try {
      const snapshot = readReviewCards(storage);
      const raw = JSON.stringify(snapshot);
      // The due calculation reads this validated snapshot, never a second unchecked read.
      const ids = getDueIds(getAllQuestionIds(locale), { ...storage,
        getItem: key => key === "coachfi-srs" ? raw : storage.getItem(key) });
      if (!storage.isCurrent()) return;
      const ticket = saveController.begin(storage, { locale, questionId: ids[0] ?? "review-complete", session });
      setSaveTicket(ticket);
      setCards(snapshot);
      setDueIds(ids);
      setSessionDone(ids.length === 0);
    } catch {
      if (storage.isCurrent()) {
        setSaveTicket(saveController.begin(storage, { locale, questionId: "review-read-retry", session }));
        setLoadIssue(true);
      }
    }
    return () => { saveController.retire(); };
  }, [locale, storage, session, saveController]);

  const currentQuestion = useMemo(
    () => (dueIds[currentIndex] ? getQuestionById(dueIds[currentIndex], locale) : null),
    [dueIds, currentIndex, locale]
  );

  const srsCard = currentQuestion ? cards.find(card => card.id === currentQuestion.id) : undefined;
  const level = srsCard ? masteryLevel(srsCard) : 0;

  function handleReveal() {
    if (!saveTicket || !saveController.current(saveTicket, storage)) return;
    if (saveController.issue(storage)) { setSaveIssue("uncertain"); return; }
    if (!selected || !currentQuestion || revealed || !saveController.isOpen(saveTicket, storage)) return;
    const correct = selected === currentQuestion.correctAnswer;
    const acknowledgement: { card?: SRSCard } = {};
    const result = saveController.run(saveTicket, storage, traced => {
      acknowledgement.card = recordAnswer(currentQuestion.id, correct, traced);
    }, correct ? () => markActive() : undefined);
    if (result.status === "uncertain") {
      if (storage.isCurrent()) setSaveIssue("uncertain");
      return;
    }
    if (result.status === "ignored" || result.status === "stopped" || !saveController.current(saveTicket, storage)) return;
    const updated = acknowledgement.card;
    if (result.status !== "saved" || !updated) { setSaveIssue("retryable"); return; }
    // Replace the ticket synchronously before publishing feedback or enabling Next.
    const nextTicket = saveController.begin(storage, { locale, questionId: currentQuestion.id, session });
    setSaveTicket(nextTicket);
    setSaveIssue(null);
    setSavedCard(updated);
    setCards(previous => [...previous.filter(card => card.id !== updated.id), updated]);
    setRevealed(true);
    setResults((r) => [...r, { id: currentQuestion.id, correct }]);
  }

  function handleNext() {
    if (!saveTicket || !saveController.current(saveTicket, storage) || !revealed) return;
    if (saveController.issue(storage)) { setSaveIssue("uncertain"); return; }
    if (persistenceIssue) return;
    saveController.retire(saveTicket);
    if (currentIndex + 1 >= dueIds.length) {
      const completeTicket = saveController.begin(storage, { locale, questionId: "review-complete", session });
      setSaveTicket(completeTicket);
      const allCorrect = results.every((r) => r.correct);
      if (allCorrect) setShowConfetti(true);
      setSessionDone(true);
      setTimeout(() => { if (saveController.current(completeTicket, storage)) setShowConfetti(false); }, 2400);
    } else {
      setSaveTicket(saveController.begin(storage, { locale, questionId: dueIds[currentIndex + 1], session }));
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
      setSavedCard(null);
    }
  }

  function handleRestart() {
    if (!saveTicket || !saveController.current(saveTicket, storage) || saveController.issue(storage)) return;
    saveController.retire(saveTicket);
    setSession(value => value + 1);
  }

  const correct = results.filter((r) => r.correct).length;
  const total = results.length;
  const progress = dueIds.length > 0 ? (currentIndex / dueIds.length) * 100 : 0;

  if (loadIssue || persistenceIssue === "uncertain") {
    return (
      <section aria-labelledby="review-title">
        <SectionHeader eyebrow={copy.eyebrow} title={copy.title} description="" readText={copy.readText} />
        <div className="mx-auto max-w-xl rounded-2xl border border-attention/30 bg-warning/30 p-5">
          <p role="alert" data-testid={persistenceIssue === "uncertain" ? "review-save-alert" : "review-load-alert"} className="font-bold text-text">{persistenceIssue === "uncertain" ? persistenceCopy.uncertain : persistenceCopy.read}</p>
          {loadIssue && persistenceIssue !== "uncertain" && <Button className="mt-4" onClick={() => {
            if (!saveTicket || !saveController.current(saveTicket, storage) || saveController.issue(storage)) return;
            saveController.retire(saveTicket);
            setSession(value => value + 1);
          }}>{persistenceCopy.retry}</Button>}
        </div>
      </section>
    );
  }

  // ── All caught up ──
  if (dueIds.length === 0 && sessionDone) {
    return (
      <section aria-labelledby="review-title">
        <SectionHeader eyebrow={copy.eyebrow} title={copy.title} description="" readText={copy.readText} />
        <div className="mx-auto max-w-lg text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
            <p className="text-6xl">🧠</p>
            <p className="mt-4 text-2xl font-black text-text">{copy.allCaughtTitle}</p>
            <p className="mt-2 text-muted">{copy.allCaughtDescription}</p>
            <div className="mt-6 rounded-2xl bg-primary/5 p-5">
              <p className="text-sm font-bold text-muted">{copy.deckTotal}</p>
              <p className="text-4xl font-black text-primary">{getAllQuestions(locale).length}</p>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  // ── Session complete ──
  if (sessionDone) {
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <section aria-labelledby="review-title">
        <Confetti active={showConfetti} />
        <SectionHeader eyebrow={copy.eyebrow} title={copy.sessionCompleteTitle} description="" readText={copy.sessionCompleteReadText} />
        <div className="mx-auto max-w-lg">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-white p-8 shadow-soft text-center">
            <p className="text-5xl">{pct >= 80 ? "🏆" : pct >= 50 ? "💪" : "📚"}</p>
            <p className="mt-4 text-3xl font-black text-text">{correct} / {total}</p>
            <p className="text-muted mt-1">{copy.answeredCorrectly}</p>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-primary/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn("h-full rounded-full", pct >= 80 ? "bg-success" : pct >= 50 ? "bg-primary" : "bg-warning")}
              />
            </div>
            <p className="mt-2 text-sm font-black text-muted">{pct}% {copy.accuracy}</p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {results.map((r) => {
                const q = getQuestionById(r.id, locale);
                return (
                  <div key={r.id} className={cn("rounded-xl p-3 text-left text-xs font-bold", r.correct ? "bg-success/10 text-success" : "bg-warning text-text")}>
                    {r.correct ? <CheckCircle2 className="mb-1 h-4 w-4" /> : <XCircle className="mb-1 h-4 w-4" />}
                    {q?.question.slice(0, 48)}{copy.resultSuffix}
                  </div>
                );
              })}
            </div>

            <Button data-testid="review-restart" size="lg" className="mt-6 w-full" onClick={handleRestart}>
              {copy.reviewAgain}
            </Button>
          </motion.div>
        </div>
      </section>
    );
  }

  if (!currentQuestion) return null;

  const isCorrect = revealed && selected === currentQuestion.correctAnswer;
  const isWrong = revealed && selected !== currentQuestion.correctAnswer;

  return (
    <section aria-labelledby="review-title">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description(currentIndex + 1, dueIds.length)}
        readText={copy.readText}
      />

      <div className="mx-auto max-w-xl">
        {/* Progress bar */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex-1 h-2.5 overflow-hidden rounded-full bg-primary/10">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
              className="h-full rounded-full bg-primary"
            />
          </div>
          <span className="text-xs font-black tabular-nums text-muted">{currentIndex + 1}/{dueIds.length}</span>
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.25 }}
            data-testid="review-card"
            className="rounded-3xl bg-white p-6 shadow-soft"
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-muted">
                <Brain className="h-4 w-4 text-primary" />
                {currentQuestion.category}
              </div>
              <div className="flex items-center gap-2">
                <MasteryDots level={level as 0 | 1 | 2 | 3 | 4} />
                {srsCard && (
                  <span className="text-xs font-bold text-muted">
                    {copy.nextPrefix} {formatReviewInterval(srsCard, locale)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <p data-testid="review-question" className="flex-1 text-lg font-black leading-7 text-text">{currentQuestion.question}</p>
              <VoiceButton text={currentQuestion.question} variant="icon" label="Przeczytaj pytanie" className="mt-0.5 shrink-0" />
            </div>

            <div className="mt-5 grid gap-2.5">
              {currentQuestion.answers.map((answer) => {
                const isSelected = selected === answer.id;
                const correct = revealed && answer.id === currentQuestion.correctAnswer;
                const wrong = revealed && isSelected && !correct;

                return (
                  <motion.button
                    key={answer.id}
                    data-testid={`review-answer-${answer.id}`}
                    type="button"
                    whileTap={!revealed ? { scale: 0.98 } : {}}
                    disabled={revealed}
                    onClick={() => {
                      if (!saveTicket || !saveController.current(saveTicket, storage)) return;
                      if (saveController.issue(storage)) { setSaveIssue("uncertain"); return; }
                      if (!revealed && saveController.isOpen(saveTicket, storage)) setSelected(answer.id);
                    }}
                    className={cn(
                      "w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      !revealed && !isSelected && "border-primary/10 bg-white text-text hover:border-primary/30 hover:bg-primary/3",
                      !revealed && isSelected && "border-primary bg-primary/8 text-primary",
                      correct && "border-success bg-success/12 text-success",
                      wrong && "border-attention bg-warning text-text"
                    )}
                  >
                    <span className="mr-3 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current/20 bg-current/8 text-xs font-black">
                      {answer.id}
                    </span>
                    {answer.text}
                    {correct && <span className="ml-2">✓</span>}
                    {wrong && <span className="ml-2">✗</span>}
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="overflow-hidden"
                >
                  <div className={cn("mt-4 rounded-2xl p-4 text-sm", isCorrect ? "bg-success/10" : "bg-warning")}>
                    <p className={cn("font-black", isCorrect ? "text-success" : "text-text")}>
                      {isCorrect ? `✓ ${copy.correct}` : `✗ ${copy.notQuite}`}
                    </p>
                    <div className="flex items-start gap-2">
                      <p className="mt-1.5 flex-1 leading-6 text-muted">{currentQuestion.explanation}</p>
                      <VoiceButton text={currentQuestion.explanation} variant="icon" label="Przeczytaj wyjaśnienie" className="mt-1.5 shrink-0" />
                    </div>
                    {savedCard && (
                      <p data-testid="review-saved-date" className="mt-2 text-xs font-black text-muted/70">
                        {copy.nextReview} {savedCard.nextReview}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {persistenceIssue === "retryable" && <p role="alert" data-testid="review-save-alert" className="mt-4 font-bold text-text">{persistenceCopy.retryable}</p>}
            <div className="mt-5 flex gap-3">
              {!revealed ? (
                <Button data-testid="review-check" size="lg" className="w-full" disabled={!selected} onClick={handleReveal}>
                  {copy.checkAnswer}
                </Button>
              ) : (
                <Button data-testid="review-next" size="lg" className="w-full" onClick={handleNext}>
                  {currentIndex + 1 >= dueIds.length ? copy.finishSession : `${copy.next} →`}
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
