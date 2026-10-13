"use client";

import { Globe, Users } from "lucide-react";
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

const FALLBACK_PLAYERS: Player[] = [
  { name: "Aleksandra K.", score: 94, streak: 14 },
  { name: "Marek W.", score: 88, streak: 9 },
  { name: "Julia P.", score: 81, streak: 7 },
  { name: "Tomasz R.", score: 76, streak: 5 },
  { name: "Ewa M.", score: 71, streak: 3 },
];

const MEDAL = ["1", "2", "3"];
const COPY: LocalizedMap<
  { global: string; local: string; setup: string; consent: string; change: string; pts: string }
> = {
  en: {
    global: "Global",
    local: "Local",
    setup: "Global leaderboard requires Supabase setup. Showing local rankings.",
    consent: "Your score is not submitted without leaderboard consent.",
    change: "Change consent",
    pts: "pts",
  },
  pl: {
    global: "Globalny",
    local: "Lokalny",
    setup: "Ranking globalny wymaga konfiguracji Supabase. Pokazuję ranking lokalny.",
    consent: "Twój wynik nie jest wysyłany bez zgody na ranking.",
    change: "Zmień zgodę",
    pts: "pkt",
  },
  ja: { global: "グローバル", local: "ローカル", setup: "グローバルランキングには Supabase 設定が必要です。ローカルを表示します。", consent: "ランキング同意なしではスコア送信されません。", change: "同意を変更", pts: "点" },
  es: {
    global: "Global",
    local: "Local",
    setup: "La clasificación global requiere configurar Supabase. Se muestran las clasificaciones locales.",
    consent: "Tu puntuación no se envía sin el consentimiento para la clasificación.",
    change: "Cambiar consentimiento",
    pts: "pts",
  },
  fr: {
    global: "Mondial",
    local: "Local",
    setup: "Le classement mondial nécessite la configuration de Supabase. Affichage des classements locaux.",
    consent: "Votre score n'est pas envoyé sans consentement au classement.",
    change: "Modifier le consentement",
    pts: "pts",
  },
  zh: {
    global: "全球",
    local: "本地",
    setup: "全球排行榜需要配置 Supabase。当前显示本地排名。",
    consent: "未授权排行榜时不会提交你的得分。",
    change: "更改授权",
    pts: "分",
  },
  hi: {
    global: "ग्लोबल",
    local: "स्थानीय",
    setup: "ग्लोबल लीडरबोर्ड के लिए Supabase सेटअप ज़रूरी है। स्थानीय रैंकिंग दिखाई जा रही है।",
    consent: "लीडरबोर्ड सहमति के बिना आपका स्कोर नहीं भेजा जाता।",
    change: "सहमति बदलें",
    pts: "पॉइंट",
  },
  "pt-BR": {
    global: "Global",
    local: "Local",
    setup: "O ranking global exige a configuração da Supabase. Mostrando os rankings locais.",
    consent: "Sua pontuação não é enviada sem o consentimento para o ranking.",
    change: "Alterar consentimento",
    pts: "pts",
  },
  tr: {
    global: "Küresel",
    local: "Yerel",
    setup: "Küresel sıralama için Supabase kurulumu gerekir. Yerel sıralamalar gösteriliyor.",
    consent: "Sıralama onayı olmadan puanın gönderilmez.",
    change: "Onayı değiştir",
    pts: "puan",
  },
};

type Tab = "global" | "local";

export function Leaderboard({ userScore }: { userScore: number }) {
  const { locale, t } = useLanguage();
  const copy = pickLocalized(COPY, locale);
  const { hasOptionalConsent, openSettings } = useConsent();
  const { streak } = useStreak();
  const [tab, setTab] = useState<Tab>("global");
  const [globalPlayers, setGlobalPlayers] = useState<Player[]>([]);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState(t.leaderboard.you);

  useEffect(() => {
    const refreshName = () => setUserName(getUser().name?.trim() || t.leaderboard.you);
    refreshName();
    window.addEventListener("coachfi-user", refreshName);
    return () => window.removeEventListener("coachfi-user", refreshName);
  }, [t.leaderboard.you]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/leaderboard");
        const json = (await res.json()) as { entries: Player[]; configured: boolean };
        setConfigured(json.configured);
        if (json.configured && json.entries.length > 0) {
          setGlobalPlayers(json.entries);
        }
      } catch {
        setConfigured(false);
      } finally {
        setLoading(false);
      }
    }

    async function submit() {
      if (!hasOptionalConsent("leaderboard")) return;
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

    load();
    submit();
  }, [hasOptionalConsent, userName, userScore, streak.currentStreak, t.leaderboard.you]);

  const localPlayers = [
    ...FALLBACK_PLAYERS,
    { name: userName, score: userScore, streak: streak.currentStreak, isYou: true },
  ].sort((a, b) => b.score - a.score);

  const activePlayers: Player[] =
    tab === "global" && configured && globalPlayers.length > 0
      ? globalPlayers.map((player) => ({
          ...player,
          isYou: player.name.toLowerCase() === userName.toLowerCase(),
        }))
      : localPlayers;

  const displayPlayers =
    tab === "global" && configured && !activePlayers.some((player) => player.isYou)
      ? [...activePlayers, { name: userName, score: userScore, streak: streak.currentStreak, isYou: true }]
          .sort((a, b) => b.score - a.score)
          .slice(0, 12)
      : activePlayers;

  const userRank = displayPlayers.findIndex((player) => player.isYou) + 1;

  return (
    <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-text">{t.leaderboard.title}</h2>

        <div className="flex rounded-lg border border-primary/15 p-0.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTab("global")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1.5 transition",
              tab === "global" ? "bg-primary text-on-primary" : "text-muted hover:text-text"
            )}
          >
            <Globe className="h-3 w-3" />
            {copy.global}
          </button>
          <button
            type="button"
            onClick={() => setTab("local")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1.5 transition",
              tab === "local" ? "bg-primary text-on-primary" : "text-muted hover:text-text"
            )}
          >
            <Users className="h-3 w-3" />
            {copy.local}
          </button>
        </div>
      </div>

      {tab === "global" && !configured && (
        <p className="mt-2 rounded-lg bg-primary/5 px-3 py-2 text-xs font-bold text-muted">{copy.setup}</p>
      )}
      {tab === "global" && configured && !hasOptionalConsent("leaderboard") && (
        <p className="mt-2 rounded-lg bg-primary/5 px-3 py-2 text-xs font-bold text-muted">
          {copy.consent}{" "}
          <button type="button" onClick={openSettings} className="text-primary underline">
            {copy.change}
          </button>
        </p>
      )}

      <div className="mt-4 space-y-2">
        {loading && tab === "global" ? (
          <div className="space-y-2">
            {[1, 2, 3].map((index) => (
              <div key={index} className="h-10 animate-pulse rounded-xl bg-primary/5" />
            ))}
          </div>
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
          {tab === "global" && configured && <span className="ml-1 text-primary">- {copy.global}</span>}
        </p>
      )}
    </div>
  );
}
