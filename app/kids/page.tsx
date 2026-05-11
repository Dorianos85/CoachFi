"use client";

import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { PiggyBank } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/context/LanguageContext";
import { useVoice } from "@/context/VoiceContext";
import { cn } from "@/lib/utils";

// ─── constants ────────────────────────────────────────────────────────────────

const MODULE_THEMES = [
  { bg: "from-rose-400 to-orange-300",    icon: "🛒", card: "border-rose-200 bg-rose-50" },
  { bg: "from-violet-500 to-fuchsia-400", icon: "🐷", card: "border-violet-200 bg-violet-50" },
  { bg: "from-amber-400 to-yellow-300",   icon: "🎯", card: "border-amber-200 bg-amber-50" },
  { bg: "from-emerald-400 to-teal-300",   icon: "👛", card: "border-emerald-200 bg-emerald-50" },
  { bg: "from-sky-400 to-blue-300",       icon: "⭐", card: "border-sky-200 bg-sky-50" },
  { bg: "from-pink-400 to-rose-300",      icon: "🤝", card: "border-pink-200 bg-pink-50" },
];

const STAR_MILESTONES: Record<number, string> = {
  3:  "⚡ Super! Zdobyłeś 3 gwiazdki!",
  5:  "🏅 Odznaka Młodego Finansisty odblokowana!",
  7:  "🔥 Niesamowite! Jesteś na dobrej drodze!",
  10: "🎉 MISTRZ! Zebrałeś wszystkie gwiazdki!",
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
        setMilestone(STAR_MILESTONES[next] ?? "");
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
                          className="mt-3 w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 font-black text-white shadow-md hover:from-amber-500 hover:to-orange-500"
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
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 to-yellow-50 p-5 shadow-soft border-2 border-amber-100">
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
              initial={{ scale: 1.3, color: "#f59e0b" }}
              animate={{ scale: 1, color: "#1a1a2e" }}
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
                    className="mt-2 rounded-2xl bg-amber-400/25 p-3 text-center text-sm font-black text-amber-800"
                  >
                    {t.kids.badgeUnlocked}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Saving jar */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-50 to-fuchsia-50 p-5 shadow-soft border-2 border-violet-100">
            <h2 className="text-xl font-black text-text">{t.kids.jarTitle}</h2>
            <p className="mt-1 text-sm leading-5 text-muted">{t.kids.jarGoalText}</p>

            <div className="relative mt-4 rounded-2xl bg-white/60 p-5 text-center">
              <CoinDrop active={coinDrop} />
              <motion.div
                animate={{ y: [0, -7, 0], rotate: [0, 3, -3, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <PiggyBank className="mx-auto h-20 w-20 text-violet-500" aria-hidden="true" />
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
                    className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400"
                  />
                </div>
                <p className="mt-2 text-xs font-bold text-muted text-right">
                  {Math.round((JAR_SAVED / JAR_GOAL) * 100)}% do celu
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
            className="rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-400 p-5 text-white shadow-soft"
          >
            <p className="text-2xl">🌱</p>
            <p className="mt-2 text-sm font-black leading-6">
              Każda zaoszczędzona złotówka to mała supermoc. Im wcześniej zaczniesz — tym więcej urośnie!
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
