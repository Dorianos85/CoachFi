"use client";

import { Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { useConsent } from "@/context/ConsentContext";
import { useLanguage } from "@/context/LanguageContext";
import { useStreak } from "@/context/StreakContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { getUser } from "@/lib/user";
import { cn } from "@/lib/utils";

interface Player {
  name: string;
  score: number;
  streak: number;
  isYou?: boolean;
}

const MEDAL = ["1", "2", "3"];
const COPY: LocalizedMap<
  { global: string; empty: string; unavailable: string; consent: string; change: string; pts: string }
> = {
  en: {
    global: "Global",
    empty: "No one is on the leaderboard yet. Finish a quiz and allow the leaderboard consent to be the first.",
    unavailable: "The leaderboard is not available yet. Your quiz results stay on this device.",
    consent: "Your score is not submitted without leaderboard consent.",
    change: "Change consent",
    pts: "pts",
  },
  pl: {
    global: "Globalny",
    empty: "W rankingu nie ma jeszcze nikogo. Ukończ quiz i włącz zgodę na ranking, aby być pierwszą osobą.",
    unavailable: "Ranking nie jest jeszcze dostępny. Twoje wyniki quizów zostają na tym urządzeniu.",
    consent: "Twój wynik nie jest wysyłany bez zgody na ranking.",
    change: "Zmień zgodę",
    pts: "pkt",
  },
  ja: {
    global: "グローバル",
    empty: "まだランキングに参加者がいません。クイズを終えてランキングへの同意をオンにすると最初の参加者になれます。",
    unavailable: "ランキングはまだ利用できません。クイズの結果はこの端末に保存されます。",
    consent: "ランキング同意なしではスコア送信されません。",
    change: "同意を変更",
    pts: "点",
  },
  es: {
    global: "Global",
    empty: "Todavía no hay nadie en la clasificación. Termina un cuestionario y permite el consentimiento para ser el primero.",
    unavailable: "La clasificación aún no está disponible. Tus resultados se quedan en este dispositivo.",
    consent: "Tu puntuación no se envía sin el consentimiento para la clasificación.",
    change: "Cambiar consentimiento",
    pts: "pts",
  },
  fr: {
    global: "Mondial",
    empty: "Personne n'est encore au classement. Terminez un quiz et autorisez le classement pour être le premier.",
    unavailable: "Le classement n'est pas encore disponible. Vos résultats restent sur cet appareil.",
    consent: "Votre score n'est pas envoyé sans consentement au classement.",
    change: "Modifier le consentement",
    pts: "pts",
  },
  zh: {
    global: "全球",
    empty: "排行榜上还没有人。完成一次测验并允许排行榜授权，成为第一名。",
    unavailable: "排行榜暂不可用。你的测验结果保存在此设备上。",
    consent: "未授权排行榜时不会提交你的得分。",
    change: "更改授权",
    pts: "分",
  },
  hi: {
    global: "ग्लोबल",
    empty: "लीडरबोर्ड पर अभी कोई नहीं है। पहले बनने के लिए एक क्विज़ पूरा करें और लीडरबोर्ड सहमति दें।",
    unavailable: "लीडरबोर्ड अभी उपलब्ध नहीं है। आपके क्विज़ नतीजे इसी डिवाइस पर रहते हैं।",
    consent: "लीडरबोर्ड सहमति के बिना आपका स्कोर नहीं भेजा जाता।",
    change: "सहमति बदलें",
    pts: "पॉइंट",
  },
  "pt-BR": {
    global: "Global",
    empty: "Ainda não há ninguém no ranking. Conclua um quiz e permita o consentimento do ranking para ser o primeiro.",
    unavailable: "O ranking ainda não está disponível. Seus resultados ficam neste dispositivo.",
    consent: "Sua pontuação não é enviada sem o consentimento para o ranking.",
    change: "Alterar consentimento",
    pts: "pts",
  },
  tr: {
    global: "Küresel",
    empty: "Sıralamada henüz kimse yok. İlk olmak için bir testi bitir ve sıralama onayını ver.",
    unavailable: "Sıralama henüz kullanılamıyor. Test sonuçların bu cihazda kalır.",
    consent: "Sıralama onayı olmadan puanın gönderilmez.",
    change: "Onayı değiştir",
    pts: "puan",
  },
};

/**
 * Real leaderboard only: rows come from /api/leaderboard. There are no invented
 * players; without data (or without Supabase) the board shows an empty state.
 * `userScore` is the user's latest quiz score, or null before they finish one.
 */
export function Leaderboard({ userScore }: { userScore: number | null }) {
  const { locale, t } = useLanguage();
  const copy = pickLocalized(COPY, locale);
  const { hasOptionalConsent, openSettings } = useConsent();
  const { streak } = useStreak();
  const [globalPlayers, setGlobalPlayers] = useState<Player[]>([]);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState(t.leaderboard.you);
  const canSubmit = hasOptionalConsent("leaderboard");

  useEffect(() => {
    const refreshName = () => setUserName(getUser().name?.trim() || t.leaderboard.you);
    refreshName();
    window.addEventListener("coachfi-user", refreshName);
    return () => window.removeEventListener("coachfi-user", refreshName);
  }, [t.leaderboard.you]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/leaderboard");
        const json = (await res.json()) as { entries?: Player[]; configured?: boolean };
        if (cancelled) return;
        setConfigured(json.configured === true);
        setGlobalPlayers(Array.isArray(json.entries) ? json.entries : []);
      } catch {
        if (!cancelled) setConfigured(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function submit() {
      if (!canSubmit || userScore === null) return;
      if (!userName || userName === t.leaderboard.you) return;
      try {
        await fetch("/api/leaderboard", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CoachFI-Consent": "leaderboard",
          },
          body: JSON.stringify({ name: userName, score: userScore, streak: streak.currentStreak }),
        });
      } catch {
        // Leaderboard is optional and should not block the quiz.
      }
    }

    void submit().finally(load);
    return () => {
      cancelled = true;
    };
  }, [canSubmit, userName, userScore, streak.currentStreak, t.leaderboard.you]);

  const players = globalPlayers.map((player) => ({
    ...player,
    isYou: player.name.toLowerCase() === userName.toLowerCase(),
  }));
  const displayPlayers =
    canSubmit && userScore !== null && !players.some((player) => player.isYou) && players.length > 0
      ? [...players, { name: userName, score: userScore, streak: streak.currentStreak, isYou: true }]
          .sort((a, b) => b.score - a.score)
          .slice(0, 12)
      : players;
  const userRank = displayPlayers.findIndex((player) => player.isYou) + 1;

  return (
    <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-soft" data-testid="leaderboard">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-text">{t.leaderboard.title}</h2>
        <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary">
          <Globe className="h-3 w-3" aria-hidden="true" />
          {copy.global}
        </span>
      </div>

      {configured && !canSubmit && (
        <p className="mt-2 rounded-lg bg-primary/5 px-3 py-2 text-xs font-bold text-muted">
          {copy.consent}{" "}
          <button type="button" onClick={openSettings} className="text-primary underline">
            {copy.change}
          </button>
        </p>
      )}

      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((index) => (
              <div key={index} className="h-10 animate-pulse rounded-xl bg-primary/5" />
            ))}
          </div>
        ) : displayPlayers.length === 0 ? (
          <p className="rounded-xl bg-primary/5 px-3 py-4 text-center text-sm font-semibold text-muted" data-testid="leaderboard-empty">
            {configured ? copy.empty : copy.unavailable}
          </p>
        ) : (
          displayPlayers.slice(0, 10).map((player, index) => {
            const isYou = !!player.isYou;
            return (
              <motion.div
                key={`${player.name}-${index}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold",
                  isYou ? "bg-primary text-on-primary shadow-glow" : "bg-primary/4 text-text"
                )}
              >
                <span className="w-6 shrink-0 text-center text-xs font-black leading-none">
                  {index < 3 ? MEDAL[index] : index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {player.name}
                  {isYou && <span className="ml-1.5 text-xs font-black opacity-75">- {t.leaderboard.you}</span>}
                </span>
                <span className="shrink-0 tabular-nums">
                  {player.score}
                  <span className="ml-0.5 text-xs opacity-60">{copy.pts}</span>
                </span>
                <span className="shrink-0 tabular-nums opacity-70">{player.streak}</span>
              </motion.div>
            );
          })
        )}
      </div>

      {userRank > 0 && (
        <p className="mt-3 text-center text-xs font-bold text-muted">
          {t.leaderboard.rank} #{userRank}
        </p>
      )}
    </div>
  );
}
