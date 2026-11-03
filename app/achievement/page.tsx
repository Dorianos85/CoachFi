"use client";

import { APP_HOST } from "@/components/brand";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Download, Trophy } from "lucide-react";

import { VoiceButton } from "@/components/VoiceButton";
import { SocialShare } from "@/components/SocialShare";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { getDisplayName, getUser } from "@/lib/user";
import { resolveCssColor } from "@/lib/cssColor";
import { getStreak } from "@/lib/streak";
import { getHealthCheck } from "@/lib/healthCheck";
import Link from "next/link";

const BADGE_COLORS = [
  { score: 80, label: "Financial Champion", emoji: "🏆", from: "var(--cf-area-rewards)", to: "var(--cf-area-rewards)" },
  { score: 60, label: "Money Master", emoji: "💰", from: "var(--cf-area-mila)", to: "var(--cf-area-mila)" },
  { score: 40, label: "Habit Builder", emoji: "📈", from: "var(--cf-area-progress)", to: "var(--cf-area-progress)" },
  { score: 0, label: "Financial Learner", emoji: "🌱", from: "var(--cf-area-goals)", to: "var(--cf-area-goals)" },
];

function getBadge(score: number) {
  return BADGE_COLORS.find((b) => score >= b.score) ?? BADGE_COLORS[BADGE_COLORS.length - 1];
}

type AchievementCopy = {
  achievement: string;
  financialScore: string;
  dayStreak: string;
  title: string;
  download: string;
  shareTitle: string;
  shareText: (score: number, badge: string) => string;
  badgeLabels: string[];
};

const achievementCopy: LocalizedMap<AchievementCopy> = {
  pl: {
    achievement: "Osiągnięcie Coach FI",
    financialScore: "Wynik finansowy",
    dayStreak: "Seria dni",
    title: "Twoje osiągnięcie",
    download: "Pobierz jako obraz",
    shareTitle: "Moje osiągnięcie Coach FI",
    shareText: (score, badge) => `Zdobyłem ${score}/100 w diagnozie finansowej Coach FI! 💰 ${badge} - sprawdź swój wynik:`,
    badgeLabels: ["Finansowy mistrz", "Mistrz pieniędzy", "Budowniczy nawyków", "Uczeń finansów"],
  },
  en: {
    achievement: "Coach FI Achievement",
    financialScore: "Financial Score",
    dayStreak: "Day Streak",
    title: "Your Achievement",
    download: "Download as image",
    shareTitle: "My Coach FI Achievement",
    shareText: (score, badge) => `I scored ${score}/100 on Coach FI's Financial Health Check! 💰 ${badge} - check your score:`,
    badgeLabels: ["Financial Champion", "Money Master", "Habit Builder", "Financial Learner"],
  },
  ja: {
    achievement: "Coach FIの実績",
    financialScore: "金融スコア",
    dayStreak: "連続日数",
    title: "あなたの実績",
    download: "画像としてダウンロード",
    shareTitle: "Coach FIの実績",
    shareText: (score, badge) => `Coach FIの金融診断で${score}/100を獲得しました! 💰 ${badge} - あなたのスコアも確認:`,
    badgeLabels: ["金融チャンピオン", "お金の達人", "習慣ビルダー", "金融学習者"],
  },
  es: {
    achievement: "Logro de Coach FI",
    financialScore: "Puntuación financiera",
    dayStreak: "Racha de días",
    title: "Tu logro",
    download: "Descargar como imagen",
    shareTitle: "Mi logro en Coach FI",
    shareText: (score, badge) => `¡He sacado ${score}/100 en el Chequeo de salud financiera de Coach FI! 💰 ${badge} - mira tu puntuación:`,
    badgeLabels: ["Campeón financiero", "Maestro del dinero", "Constructor de hábitos", "Aprendiz financiero"],
  },
  fr: {
    achievement: "Réussite Coach FI",
    financialScore: "Score financier",
    dayStreak: "Série de jours",
    title: "Votre réussite",
    download: "Télécharger en image",
    shareTitle: "Ma réussite Coach FI",
    shareText: (score, badge) => `J'ai obtenu ${score}/100 au Bilan de santé financière de Coach FI ! 💰 ${badge} - découvrez votre score :`,
    badgeLabels: ["Champion financier", "Maître de l'argent", "Bâtisseur d'habitudes", "Apprenant financier"],
  },
  zh: {
    achievement: "Coach FI 成就",
    financialScore: "财务得分",
    dayStreak: "连续天数",
    title: "你的成就",
    download: "下载为图片",
    shareTitle: "我的 Coach FI 成就",
    shareText: (score, badge) => `我在 Coach FI 财务健康检查中获得了 ${score}/100！💰 ${badge} - 来看看你的得分：`,
    badgeLabels: ["理财冠军", "金钱大师", "习惯养成者", "理财学习者"],
  },
  hi: {
    achievement: "Coach FI उपलब्धि",
    financialScore: "वित्तीय स्कोर",
    dayStreak: "दिनों की स्ट्रीक",
    title: "आपकी उपलब्धि",
    download: "इमेज के रूप में डाउनलोड करें",
    shareTitle: "मेरी Coach FI उपलब्धि",
    shareText: (score, badge) => `मैंने Coach FI की वित्तीय सेहत जांच में ${score}/100 पाए! 💰 ${badge} - अपना स्कोर देखें:`,
    badgeLabels: ["वित्तीय चैंपियन", "मनी मास्टर", "आदत निर्माता", "वित्तीय शिक्षार्थी"],
  },
  "pt-BR": {
    achievement: "Conquista Coach FI",
    financialScore: "Pontuação financeira",
    dayStreak: "Sequência de dias",
    title: "Sua conquista",
    download: "Baixar como imagem",
    shareTitle: "Minha conquista no Coach FI",
    shareText: (score, badge) => `Fiz ${score}/100 no Check-up de saúde financeira do Coach FI! 💰 ${badge} - veja a sua pontuação:`,
    badgeLabels: ["Campeão financeiro", "Mestre do dinheiro", "Construtor de hábitos", "Aprendiz financeiro"],
  },
  tr: {
    achievement: "Coach FI Başarısı",
    financialScore: "Finans puanı",
    dayStreak: "Günlük seri",
    title: "Başarın",
    download: "Görsel olarak indir",
    shareTitle: "Coach FI başarım",
    shareText: (score, badge) => `Coach FI Finansal Sağlık Kontrolü'nde ${score}/100 aldım! 💰 ${badge} - sen de puanına bak:`,
    badgeLabels: ["Finans Şampiyonu", "Para Ustası", "Alışkanlık Kurucu", "Finans Öğrencisi"],
  },
};

const NO_SCORE_COPY: LocalizedMap<{ title: string; body: string; cta: string }> = {
  en: { title: "No score yet", body: "Your achievement card uses your real Financial Health Score. Run the free Health Check to get it.", cta: "Run the free Health Check" },
  pl: { title: "Nie masz jeszcze wyniku", body: "Karta osiągnięcia pokazuje Twój prawdziwy wynik zdrowia finansowego. Zrób darmową diagnozę, aby go poznać.", cta: "Zrób darmową diagnozę" },
  es: { title: "Aún no tienes puntuación", body: "Tu tarjeta de logro usa tu puntuación real de salud financiera. Haz el chequeo gratuito para obtenerla.", cta: "Hacer el chequeo gratuito" },
  fr: { title: "Pas encore de score", body: "Votre carte de réussite utilise votre vrai score de santé financière. Faites le bilan gratuit pour l'obtenir.", cta: "Faire le bilan gratuit" },
  zh: { title: "还没有得分", body: "成就卡片使用你真实的财务健康得分。完成免费的财务检查即可获得。", cta: "进行免费检查" },
  ja: { title: "まだスコアがありません", body: "実績カードには実際のファイナンシャルヘルススコアを使います。無料診断でスコアを取得してください。", cta: "無料診断を受ける" },
  hi: { title: "अभी कोई स्कोर नहीं", body: "आपका उपलब्धि कार्ड आपके असली वित्तीय स्वास्थ्य स्कोर का उपयोग करता है। इसे पाने के लिए मुफ़्त जांच करें।", cta: "मुफ़्त जांच करें" },
  "pt-BR": { title: "Ainda sem pontuação", body: "Seu cartão de conquista usa sua pontuação real de saúde financeira. Faça o check-up gratuito para obtê-la.", cta: "Fazer o check-up gratuito" },
  tr: { title: "Henüz puanın yok", body: "Başarı kartın gerçek Finansal Sağlık Puanını kullanır. Puanını almak için ücretsiz kontrolü yap.", cta: "Ücretsiz kontrolü yap" },
};

function getBadgeLabel(score: number, labels: string[]) {
  const index = BADGE_COLORS.findIndex((badge) => score >= badge.score);
  return labels[index === -1 ? labels.length - 1 : index] ?? labels[labels.length - 1] ?? "";
}

function AchievementCard({
  name,
  score,
  streak,
  badge,
  badgeLabel,
  copy,
}: {
  name: string;
  score: number;
  streak: number;
  badge: (typeof BADGE_COLORS)[0];
  badgeLabel: string;
  copy: AchievementCopy;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border-2 border-primary-border p-8 text-text"
      style={{ background: `linear-gradient(135deg, ${badge.from}, ${badge.to})` }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-20">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${60 + i * 40}px`,
              height: `${60 + i * 40}px`,
              top: `${-20 + i * 15}%`,
              right: `${-10 + i * 5}%`,
              opacity: 0.15 - i * 0.02,
            }}
          />
        ))}
      </div>

      <div className="relative">
        <div className="text-5xl">{badge.emoji}</div>
        <p className="mt-4 text-sm font-black uppercase tracking-widest opacity-80">{copy.achievement}</p>
        <p className="mt-2 text-4xl font-black leading-tight">{name}</p>
        <p className="mt-1 text-lg font-bold opacity-90">{badgeLabel}</p>

        <div className="mt-6 flex gap-6">
          <div>
            <p className="text-5xl font-black leading-none">{score}</p>
            <p className="mt-1 text-sm font-bold opacity-80">{copy.financialScore}</p>
          </div>
          <div className="w-px bg-text/30" />
          <div>
            <p className="text-5xl font-black leading-none">{streak}</p>
            <p className="mt-1 text-sm font-bold opacity-80">{copy.dayStreak} 🔥</p>
          </div>
        </div>

        <p className="mt-6 text-xs font-bold opacity-60">{APP_HOST}</p>
      </div>
    </div>
  );
}

function AchievementPageContent() {
  const { locale } = useLanguage();
  const copy = pickLocalized(achievementCopy, locale);
  const searchParams = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const paramName = searchParams.get("name");
  const paramScore = searchParams.get("score");
  const paramStreak = searchParams.get("streak");

  const [name, setName] = useState(paramName ?? "");
  const [score, setScore] = useState<number | null>(paramScore !== null && Number.isFinite(Number(paramScore)) ? Math.max(0, Math.min(100, Math.round(Number(paramScore)))) : null);
  const [scoreLoaded, setScoreLoaded] = useState(paramScore !== null);
  const noScore = pickLocalized(NO_SCORE_COPY, locale);
  const [streak, setStreak] = useState(paramStreak ? Number(paramStreak) : 0);

  useEffect(() => {
    if (!paramName) {
      const refreshName = () => setName(getDisplayName(getUser()));
      refreshName();
      window.addEventListener("coachfi-user", refreshName);
      return () => window.removeEventListener("coachfi-user", refreshName);
    }
  }, [paramName]);

  useEffect(() => {
    if (!paramScore) {
      // The user's own Health Check result — never an invented number.
      setScore(getHealthCheck()?.score ?? null);
      setScoreLoaded(true);
    }
    if (!paramStreak) {
      setStreak(getStreak().currentStreak);
    }
  }, [paramScore, paramStreak]);

  const badge = getBadge(score ?? 0);
  const badgeLabel = getBadgeLabel(score ?? 0, copy.badgeLabels);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/achievement?name=${encodeURIComponent(name)}&score=${score}&streak=${streak}`
    : `/achievement?name=${encodeURIComponent(name)}&score=${score}&streak=${streak}`;

  const shareText = `${copy.shareText(score ?? 0, `${badge.emoji} ${badgeLabel}`)}`;

  async function downloadCard() {
    if (score === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 800, H = 420;
    canvas.width = W;
    canvas.height = H;

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, resolveCssColor(badge.from));
    grad.addColorStop(1, resolveCssColor(badge.to));
    ctx.fillStyle = grad;
    ctx.beginPath();
    const r = 32;
    if (typeof (ctx as CanvasRenderingContext2D & { roundRect?: unknown }).roundRect === "function") {
      ctx.roundRect(0, 0, W, H, r);
    } else {
      ctx.moveTo(r, 0);
      ctx.lineTo(W - r, 0);
      ctx.arcTo(W, 0, W, r, r);
      ctx.lineTo(W, H - r);
      ctx.arcTo(W, H, W - r, H, r);
      ctx.lineTo(r, H);
      ctx.arcTo(0, H, 0, H - r, r);
      ctx.lineTo(0, r);
      ctx.arcTo(0, 0, r, 0, r);
      ctx.closePath();
    }
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.35)";
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(W * 0.85 + i * 30, H * 0.1 + i * 40, 80 + i * 50, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = resolveCssColor("var(--cf-text)");
    ctx.font = "bold 14px system-ui";
    ctx.fillText(copy.achievement.toUpperCase(), 48, 72);

    ctx.font = "bold 48px system-ui";
    ctx.fillText(name, 48, 140);

    ctx.font = "bold 22px system-ui";
    ctx.globalAlpha = 0.85;
    ctx.fillText(`${badge.emoji}  ${badgeLabel}`, 48, 180);
    ctx.globalAlpha = 1;

    ctx.font = "black 96px system-ui";
    ctx.fillText(String(score), 48, 300);
    ctx.font = "bold 16px system-ui";
    ctx.globalAlpha = 0.7;
    ctx.fillText(copy.financialScore.toUpperCase(), 48, 328);
    ctx.globalAlpha = 1;

    ctx.globalAlpha = 0.3;
    ctx.fillRect(200, 228, 1, 100);
    ctx.globalAlpha = 1;

    ctx.font = "black 96px system-ui";
    ctx.fillText(String(streak), 228, 300);
    ctx.font = "bold 16px system-ui";
    ctx.globalAlpha = 0.7;
    ctx.fillText(`${copy.dayStreak.toUpperCase()} 🔥`, 228, 328);
    ctx.globalAlpha = 1;

    ctx.font = "bold 13px system-ui";
    ctx.globalAlpha = 0.5;
    ctx.fillText(APP_HOST, 48, H - 28);
    ctx.globalAlpha = 1;

    const link = document.createElement("a");
    link.download = "coachfi-achievement.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  if (score === null) {
    return (
      <section className="mx-auto max-w-lg" aria-labelledby="achievement-title">
        <div className="mb-6 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 id="achievement-title" className="text-xl font-black text-text">{copy.title}</h1>
        </div>
        {scoreLoaded ? (
          <div className="rounded-3xl border-2 border-dashed border-primary/25 bg-white p-8 text-center" data-testid="achievement-no-score">
            <p className="text-2xl font-black text-text">{noScore.title}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted">{noScore.body}</p>
            <Link
              href="/health-check"
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-black text-on-primary transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {noScore.cta}
            </Link>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-lg" aria-labelledby="achievement-title">
      <div className="mb-6 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" aria-hidden="true" />
        <h1 id="achievement-title" className="text-xl font-black text-text">{copy.title}</h1>
        <VoiceButton
          text={`${copy.title}. ${name}. ${badgeLabel}. ${copy.financialScore}: ${score}. ${copy.dayStreak}: ${streak}.`}
          locale={locale}
          variant="icon"
          className="ml-auto"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <AchievementCard name={name} score={score} streak={streak} badge={badge} badgeLabel={badgeLabel} copy={copy} />
      </motion.div>

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      <div className="mt-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="mb-4 w-full gap-2"
          onClick={downloadCard}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {copy.download}
        </Button>

        <SocialShare
          text={shareText}
          url={shareUrl}
          title={copy.shareTitle}
        />
      </div>
    </section>
  );
}

export default function AchievementPage() {
  return (
    <Suspense>
      <AchievementPageContent />
    </Suspense>
  );
}
