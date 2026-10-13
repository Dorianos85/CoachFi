"use client";

import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { PiggyBank } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { IncomeJarPlanner } from "@/components/IncomeJarPlanner";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/context/LanguageContext";
import { useMode } from "@/context/ModeContext";
import { useVoice } from "@/context/VoiceContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// ─── constants ────────────────────────────────────────────────────────────────

const MODULE_THEMES = [
  { bg: "from-area-care to-area-care",    icon: "🛒", card: "border-border-subtle bg-white" },
  { bg: "from-area-mila to-area-mila", icon: "🐷", card: "border-border-subtle bg-white" },
  { bg: "from-area-rewards to-area-rewards",   icon: "🎯", card: "border-border-subtle bg-white" },
  { bg: "from-area-progress to-area-progress",   icon: "👛", card: "border-border-subtle bg-white" },
  { bg: "from-area-learn to-area-learn",       icon: "⭐", card: "border-border-subtle bg-white" },
  { bg: "from-area-goals to-area-goals",      icon: "🤝", card: "border-border-subtle bg-white" },
];

const KIDS_PAGE_COPY: LocalizedMap<{
  modeActive: string;
  toGoal: string;
  tip: string;
  milestones: Record<number, string>;
}> = {
  en: {
    modeActive: "Kids Mode is active. Wallet, NFTs, leaderboard and free-form AI Coach are outside this mode.",
    toGoal: "{pct}% of the goal",
    tip: "Every coin you save is a small superpower. The earlier you start, the more it grows!",
    milestones: { 3: "⚡ Great! You earned 3 stars!", 5: "🏅 Young Financier badge unlocked!", 7: "🔥 Amazing! You're on the right track!", 10: "🎉 CHAMPION! You collected all the stars!" },
  },
  pl: {
    modeActive: "Kids Mode aktywny. Portfel, NFT, ranking i swobodny AI Coach są poza tym trybem.",
    toGoal: "{pct}% do celu",
    tip: "Każda zaoszczędzona złotówka to mała supermoc. Im wcześniej zaczniesz — tym więcej urośnie!",
    milestones: { 3: "⚡ Super! Zdobyłeś 3 gwiazdki!", 5: "🏅 Odznaka Młodego Finansisty odblokowana!", 7: "🔥 Niesamowite! Jesteś na dobrej drodze!", 10: "🎉 MISTRZ! Zebrałeś wszystkie gwiazdki!" },
  },
  es: {
    modeActive: "Modo niños activo. El monedero, los NFT, la clasificación y el Coach IA libre quedan fuera de este modo.",
    toGoal: "{pct}% de la meta",
    tip: "Cada moneda que ahorras es un pequeño superpoder. Cuanto antes empieces, ¡más crecerá!",
    milestones: { 3: "⚡ ¡Genial! ¡Has ganado 3 estrellas!", 5: "🏅 ¡Insignia de Joven Financiero desbloqueada!", 7: "🔥 ¡Increíble! ¡Vas por buen camino!", 10: "🎉 ¡CAMPEÓN! ¡Has reunido todas las estrellas!" },
  },
  fr: {
    modeActive: "Mode enfants actif. Le portefeuille, les NFT, le classement et le Coach IA libre sont hors de ce mode.",
    toGoal: "{pct}% de l'objectif",
    tip: "Chaque pièce économisée est un petit super-pouvoir. Plus tu commences tôt, plus elle grandit !",
    milestones: { 3: "⚡ Super ! Tu as gagné 3 étoiles !", 5: "🏅 Badge Jeune Financier débloqué !", 7: "🔥 Incroyable ! Tu es sur la bonne voie !", 10: "🎉 CHAMPION ! Tu as réuni toutes les étoiles !" },
  },
  zh: {
    modeActive: "儿童模式已开启。钱包、NFT、排行榜和自由形式的 AI 教练不在此模式中。",
    toGoal: "已完成目标的 {pct}%",
    tip: "你存下的每一枚硬币都是一个小小的超能力。开始得越早，它长得越多！",
    milestones: { 3: "⚡ 太棒了！你获得了 3 颗星！", 5: "🏅 已解锁“小小理财家”徽章！", 7: "🔥 了不起！你走在正确的路上！", 10: "🎉 冠军！你集齐了所有星星！" },
  },
  ja: {
    modeActive: "キッズモードが有効です。ウォレット、NFT、ランキング、自由なAIコーチはこのモードでは使えません。",
    toGoal: "目標の{pct}%",
    tip: "貯めたお金は小さなスーパーパワー。早く始めるほど、大きく育つよ！",
    milestones: { 3: "⚡ すごい！星を3つ獲得したよ！", 5: "🏅 ヤングファイナンサーのバッジを解放！", 7: "🔥 すばらしい！いい調子だよ！", 10: "🎉 チャンピオン！星を全部集めたよ！" },
  },
  hi: {
    modeActive: "किड्स मोड चालू है। वॉलेट, NFT, लीडरबोर्ड और खुला AI कोच इस मोड में नहीं हैं।",
    toGoal: "लक्ष्य का {pct}%",
    tip: "बचाया हुआ हर सिक्का एक छोटी सुपरपावर है। जितनी जल्दी शुरू करोगे, उतना ज़्यादा बढ़ेगा!",
    milestones: { 3: "⚡ बहुत बढ़िया! तुमने 3 स्टार कमाए!", 5: "🏅 यंग फ़ाइनेंसर बैज अनलॉक हुआ!", 7: "🔥 कमाल! तुम सही रास्ते पर हो!", 10: "🎉 चैंपियन! तुमने सारे स्टार जमा कर लिए!" },
  },
  "pt-BR": {
    modeActive: "Modo infantil ativo. Carteira, NFTs, ranking e Coach IA livre ficam fora deste modo.",
    toGoal: "{pct}% da meta",
    tip: "Cada moeda que você guarda é um pequeno superpoder. Quanto antes você começar, mais ela cresce!",
    milestones: { 3: "⚡ Demais! Você ganhou 3 estrelas!", 5: "🏅 Selo Jovem Financista desbloqueado!", 7: "🔥 Incrível! Você está no caminho certo!", 10: "🎉 CAMPEÃO! Você juntou todas as estrelas!" },
  },
  tr: {
    modeActive: "Çocuk modu etkin. Cüzdan, NFT'ler, sıralama ve serbest AI Koç bu modun dışında.",
    toGoal: "Hedefin %{pct}'i",
    tip: "Biriktirdiğin her kuruş küçük bir süper güçtür. Ne kadar erken başlarsan o kadar çok büyür!",
    milestones: { 3: "⚡ Süper! 3 yıldız kazandın!", 5: "🏅 Genç Finansçı rozeti açıldı!", 7: "🔥 Harika! Doğru yoldasın!", 10: "🎉 ŞAMPİYON! Tüm yıldızları topladın!" },
  },
};

const STAR_MILESTONE_SPEECH: Record<string, Record<number, string>> = {
  en: {
    3:  "Amazing! You earned 3 stars! You're a real money hero!",
    5:  "Wow! Young Financial Expert badge unlocked! Keep going!",
    7:  "Incredible! 7 stars! You're almost a savings champion!",
    10: "You did it! All 10 stars! You are a true money master!",
  },
  pl: {
    3:  "Brawo! Masz już 3 gwiazdki! Jesteś prawdziwym bohaterem oszczędzania!",
    5:  "Wow! Odblokowano odznakę Młodego Finansisty! Tak trzymaj!",
    7:  "Niesamowite! 7 gwiazdek! Jesteś prawie mistrzem oszczędzania!",
    10: "Zrobiłeś to! Wszystkie 10 gwiazdek! Jesteś prawdziwym mistrzem pieniędzy!",
  },
  ja: {
    3:  "すごい！3つの星を獲得しました！お金のヒーローだね！",
    5:  "やった！若き金融エキスパートのバッジ解放！続けよう！",
    7:  "信じられない！7つの星！貯蓄チャンピオンまであと少し！",
    10: "やり遂げた！星10個全部！本当のお金の達人だ！",
  },
  es: {
    3:  "¡Increíble! ¡Has ganado 3 estrellas! ¡Eres un auténtico héroe del dinero!",
    5:  "¡Guau! ¡Insignia de Joven Experto Financiero desbloqueada! ¡Sigue así!",
    7:  "¡Impresionante! ¡7 estrellas! ¡Ya casi eres un campeón del ahorro!",
    10: "¡Lo lograste! ¡Las 10 estrellas! ¡Eres un verdadero maestro del dinero!",
  },
  fr: {
    3:  "Génial ! Tu as gagné 3 étoiles ! Tu es un vrai héros de l'argent !",
    5:  "Waouh ! Badge Jeune Expert Financier débloqué ! Continue comme ça !",
    7:  "Incroyable ! 7 étoiles ! Tu es presque un champion de l'épargne !",
    10: "Tu l'as fait ! Les 10 étoiles ! Tu es un vrai maître de l'argent !",
  },
  zh: {
    3:  "太棒了！你获得了 3 颗星！你是真正的理财小英雄！",
    5:  "哇！已解锁“小小理财专家”徽章！继续加油！",
    7:  "了不起！7 颗星！你快成为储蓄冠军了！",
    10: "你做到了！集齐全部 10 颗星！你是真正的金钱大师！",
  },
  hi: {
    3:  "कमाल! तुमने 3 स्टार कमाए! तुम सच्चे मनी हीरो हो!",
    5:  "वाह! यंग फ़ाइनेंशियल एक्सपर्ट बैज अनलॉक हुआ! ऐसे ही आगे बढ़ो!",
    7:  "अद्भुत! 7 स्टार! तुम लगभग बचत चैंपियन बन गए हो!",
    10: "तुमने कर दिखाया! पूरे 10 स्टार! तुम सच्चे मनी मास्टर हो!",
  },
  "pt-BR": {
    3:  "Incrível! Você ganhou 3 estrelas! Você é um verdadeiro herói do dinheiro!",
    5:  "Uau! Selo Jovem Especialista Financeiro desbloqueado! Continue assim!",
    7:  "Demais! 7 estrelas! Você é quase um campeão da poupança!",
    10: "Você conseguiu! Todas as 10 estrelas! Você é um verdadeiro mestre do dinheiro!",
  },
  tr: {
    3:  "Harika! 3 yıldız kazandın! Sen gerçek bir para kahramanısın!",
    5:  "Vay! Genç Finans Uzmanı rozeti açıldı! Devam et!",
    7:  "İnanılmaz! 7 yıldız! Neredeyse bir birikim şampiyonusun!",
    10: "Başardın! 10 yıldızın tamamı! Sen gerçek bir para ustasısın!",
  },
};

const STAR_EARN_SPEECH: Record<string, string[]> = {
  en: [
    "Great job! One more star for you!",
    "Excellent! You're learning so fast!",
    "You earned a star! Keep saving!",
    "Wonderful! Every star gets you closer to the prize!",
    "Well done! You are amazing!",
  ],
  pl: [
    "Świetna robota! Masz kolejną gwiazdkę!",
    "Doskonale! Uczysz się tak szybko!",
    "Zdobyłeś gwiazdkę! Oszczędzaj dalej!",
    "Wspaniale! Każda gwiazdka przybliża Cię do nagrody!",
    "Brawo! Jesteś niesamowity!",
  ],
  ja: [
    "よくできました！もう1つ星を獲得！",
    "素晴らしい！とても早く覚えているね！",
    "星を獲得！貯め続けよう！",
    "すごい！星を集めるほどご褒美に近づくよ！",
    "よくやった！君はすごい！",
  ],
  es: [
    "¡Buen trabajo! ¡Una estrella más para ti!",
    "¡Excelente! ¡Aprendes rapidísimo!",
    "¡Has ganado una estrella! ¡Sigue ahorrando!",
    "¡Maravilloso! ¡Cada estrella te acerca al premio!",
    "¡Bien hecho! ¡Eres increíble!",
  ],
  fr: [
    "Bravo ! Une étoile de plus pour toi !",
    "Excellent ! Tu apprends tellement vite !",
    "Tu as gagné une étoile ! Continue d'économiser !",
    "Magnifique ! Chaque étoile te rapproche de la récompense !",
    "Bien joué ! Tu es formidable !",
  ],
  zh: [
    "做得好！又多了一颗星！",
    "太棒了！你学得真快！",
    "你赢得了一颗星！继续存钱吧！",
    "真厉害！每颗星都让你离奖励更近！",
    "干得漂亮！你真棒！",
  ],
  hi: [
    "शाबाश! तुम्हारे लिए एक और स्टार!",
    "बहुत बढ़िया! तुम बहुत तेज़ी से सीख रहे हो!",
    "तुमने एक स्टार कमाया! बचत करते रहो!",
    "शानदार! हर स्टार तुम्हें इनाम के करीब ले जाता है!",
    "बहुत अच्छे! तुम कमाल हो!",
  ],
  "pt-BR": [
    "Muito bem! Mais uma estrela para você!",
    "Excelente! Você aprende muito rápido!",
    "Você ganhou uma estrela! Continue poupando!",
    "Que maravilha! Cada estrela deixa você mais perto do prêmio!",
    "Mandou bem! Você é incrível!",
  ],
  tr: [
    "Aferin! Sana bir yıldız daha!",
    "Mükemmel! Çok hızlı öğreniyorsun!",
    "Bir yıldız kazandın! Biriktirmeye devam et!",
    "Harika! Her yıldız seni ödüle yaklaştırıyor!",
    "Tebrikler! Harikasın!",
  ],
};

const JAR_GOAL = 100;
const JAR_SAVED = 45;

// Random positions for burst particles (seeded so stable per-render)
const BURST_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

// ─── sub-components ───────────────────────────────────────────────────────────

function FloatingBg() {
  const items = ["⭐", "💰", "🪙", "✨", "🌟", "💫", "🎀", "🎈"];
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {items.map((emoji, i) => (
        <motion.span
          key={i}
          className="absolute text-2xl select-none opacity-20"
          style={{
            left: `${8 + i * 12}%`,
            top: `${10 + ((i * 17) % 70)}%`,
          }}
          animate={{
            y: [0, -18, 0],
            rotate: [0, i % 2 === 0 ? 12 : -12, 0],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{
            duration: 3 + i * 0.4,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
        >
          {emoji}
        </motion.span>
      ))}
    </div>
  );
}

function StarBurst({ x, y, active }: { x: number; y: number; active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <div className="pointer-events-none fixed z-50" style={{ left: x, top: y }} aria-hidden="true">
          {BURST_ANGLES.map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const dist = 55 + (i % 3) * 20;
            return (
              <motion.span
                key={i}
                className="absolute text-xl"
                initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
                animate={{
                  x: Math.cos(rad) * dist,
                  y: Math.sin(rad) * dist,
                  opacity: 0,
                  scale: 1.4,
                }}
                transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.03 }}
              >
                ⭐
              </motion.span>
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}

function MilestoneToast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: -40, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
          className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-2xl bg-white px-6 py-4 text-center text-lg font-black text-text shadow-2xl"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CoinDrop({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.span
          initial={{ y: -40, opacity: 1, scale: 1 }}
          animate={{ y: 60, opacity: 0, scale: 0.6 }}
          exit={{}}
          transition={{ duration: 0.6, ease: "easeIn" }}
          className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 text-3xl"
          aria-hidden="true"
        >
          🪙
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function KidsPage() {
  const { t, locale } = useLanguage();
  const { isKidsMode } = useMode();
  const pageCopy = pickLocalized(KIDS_PAGE_COPY, locale);
  const { speak } = useVoice();
  const [stars, setStars] = useState(3);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [burst, setBurst] = useState<{ x: number; y: number; id: number } | null>(null);
  const [milestone, setMilestone] = useState<string | null>(null);
  const [coinDrop, setCoinDrop] = useState(false);
  const earnButtonRef = useRef<HTMLButtonElement | null>(null);

  const modules = t.kids.modules.map((mod, i) => ({
    ...mod,
    theme: MODULE_THEMES[i],
  }));

  const handleModuleOpen = useCallback(
    (mod: typeof modules[number], isOpening: boolean) => {
      setActiveModule(isOpening ? mod.id : null);
      if (isOpening) {
        void speak(`${mod.title}. ${mod.copy}`, { locale }).catch(() => {});
      }
    },
    [locale, speak]
  );

  const handleEarnStar = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, id: Date.now() });
      setTimeout(() => setBurst(null), 900);

      setCoinDrop(true);
      setTimeout(() => setCoinDrop(false), 700);

      const next = Math.min(stars + 1, 10);
      setStars(next);
      setActiveModule(null);

      const milestoneSpeech = STAR_MILESTONE_SPEECH[locale]?.[next];
      if (milestoneSpeech) {
        setMilestone(pickLocalized(KIDS_PAGE_COPY, locale).milestones[next] ?? "");
        setTimeout(() => setMilestone(null), 3200);
        void speak(milestoneSpeech, { locale }).catch(() => {});
      } else {
        const phrases = STAR_EARN_SPEECH[locale] ?? STAR_EARN_SPEECH.en ?? [];
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        if (phrase) void speak(phrase, { locale }).catch(() => {});
      }
    },
    [stars, locale, speak]
  );

  return (
    <section aria-labelledby="kids-title" className="relative">
      <FloatingBg />
      {burst && <StarBurst x={burst.x} y={burst.y} active={true} key={burst.id} />}
      <MilestoneToast message={milestone} />

      <SectionHeader
        eyebrow={t.kids.eyebrow}
        title={t.kids.title}
        description={t.kids.description}
        readText={t.kids.readText}
      />

      {isKidsMode && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-text">
          {pageCopy.modeActive}
        </div>
      )}

      <IncomeJarPlanner mode="kids" className="mb-6" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">

        {/* ── Module grid ── */}
        <div>
          <h2 className="mb-4 text-xl font-black text-text">{t.kids.modulesTitle}</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {modules.map((mod, idx) => {
              const isOpen = activeModule === mod.id;
              return (
                <motion.div
                  key={mod.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.07 }}
                  whileHover={{ y: -6, rotate: isOpen ? 0 : 1 }}
                  whileTap={{ scale: 0.97 }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onClick={() => handleModuleOpen(mod, !isOpen)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleModuleOpen(mod, !isOpen);
                    }
                  }}
                  className={cn(
                    "cursor-pointer rounded-3xl border-2 p-5 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isOpen ? "border-primary shadow-glow" : mod.theme.card
                  )}
                >
                  {/* Icon bubble */}
                  <motion.span
                    className={cn(
                      "mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br text-3xl shadow-sm",
                      mod.theme.bg
                    )}
                    animate={isOpen ? { rotate: [0, -8, 8, -4, 0] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    {mod.theme.icon}
                  </motion.span>

                  <span className="block rounded-full bg-white/70 px-2 py-0.5 text-xs font-black uppercase tracking-wide text-muted w-fit">
                    {mod.badge}
                  </span>
                  <span className="mt-2 block text-base font-black text-text">{mod.title}</span>
                  <span className="mt-1 block text-sm leading-5 text-muted">{mod.copy}</span>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="mt-3 rounded-2xl bg-white/80 p-3 text-xs font-bold leading-5 text-text">
                          💡 {mod.example}
                        </p>
                        <Button
                          ref={idx === 0 ? earnButtonRef : undefined}
                          type="button"
                          size="sm"
                          className="mt-3 w-full cf-press rounded-xl bg-area-rewards font-black text-text hover:bg-area-rewards"
                          onClick={handleEarnStar}
                        >
                          {t.kids.earnStar}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="grid gap-5">

          {/* Stars card */}
          <div className="relative overflow-hidden rounded-3xl bg-area-rewards p-5 shadow-soft border-2 border-border-subtle">
            <h2 className="text-xl font-black text-text">{t.kids.starsTitle}</h2>

            <div
              className="mt-4 flex flex-wrap gap-2"
              aria-live="polite"
              aria-label={t.kids.starsCount.replace("{count}", String(stars))}
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={false}
                  animate={
                    i < stars
                      ? { scale: 1, rotate: 0, filter: "brightness(1)" }
                      : { scale: 0.85, rotate: 0, filter: "brightness(0.5) grayscale(0.8)" }
                  }
                  whileHover={i < stars ? { scale: 1.3, rotate: 20 } : {}}
                  transition={
                    i === stars - 1
                      ? { type: "spring", stiffness: 500, damping: 14 }
                      : { duration: 0.2 }
                  }
                  className="grid h-10 w-10 place-items-center rounded-full text-xl"
                  aria-hidden="true"
                >
                  ⭐
                </motion.span>
              ))}
            </div>

            <motion.p
              key={stars}
              initial={{ scale: 1.3, color: "var(--cf-attention)" }}
              animate={{ scale: 1, color: "var(--cf-text)" }}
              transition={{ duration: 0.4 }}
              className="mt-3 text-2xl font-black"
            >
              {t.kids.starsCount.replace("{count}", String(stars))}
            </motion.p>

            <AnimatePresence>
              {stars >= 5 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <motion.p
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="mt-2 rounded-2xl bg-white/70 p-3 text-center text-sm font-black text-text"
                  >
                    {t.kids.badgeUnlocked}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Saving jar */}
          <div className="relative overflow-hidden rounded-3xl bg-area-mila p-5 shadow-soft border-2 border-border-subtle">
            <h2 className="text-xl font-black text-text">{t.kids.jarTitle}</h2>
            <p className="mt-1 text-sm leading-5 text-muted">{t.kids.jarGoalText}</p>

            <div className="relative mt-4 rounded-2xl bg-white/60 p-5 text-center">
              <CoinDrop active={coinDrop} />
              <motion.div
                animate={{ y: [0, -7, 0], rotate: [0, 3, -3, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <PiggyBank className="mx-auto h-20 w-20 text-primary" aria-hidden="true" />
              </motion.div>

              <div className="mt-4">
                <div className="mb-2 flex justify-between text-sm font-bold text-muted">
                  <span>{t.kids.jarSaved}</span>
                  <span className="font-black text-text">
                    {JAR_SAVED} / {JAR_GOAL} {t.currency}
                  </span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-white/80">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(JAR_SAVED / JAR_GOAL) * 100}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                    className="h-full rounded-full bg-grape"
                  />
                </div>
                <p className="mt-2 text-xs font-bold text-muted text-right">
                  {pageCopy.toGoal.replace("{pct}", String(Math.round((JAR_SAVED / JAR_GOAL) * 100)))}
                </p>
              </div>
            </div>

            <p className="mt-3 rounded-2xl bg-white/70 p-3 text-center text-sm font-black text-text">
              {t.kids.jarQuote}
            </p>
          </div>

          {/* Quick tip card */}
          <motion.div
            animate={{ scale: [1, 1.015, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="rounded-3xl bg-area-progress p-5 text-text shadow-soft"
          >
            <p className="text-2xl">🌱</p>
            <p className="mt-2 text-sm font-black leading-6">
              {pageCopy.tip}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
