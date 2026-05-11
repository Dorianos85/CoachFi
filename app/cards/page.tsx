"use client";

import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight, Copy, Check, Share2, Download } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { SectionHeader } from "@/components/SectionHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { getStoryCards, type StoryCard } from "@/data/storyCards";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const DRAG_THRESHOLD = 80;
const cardsCopy: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    description: string;
    readText: string;
    source: string;
    learnMore: string;
    quickTip: string;
    cardAria: (headline: string) => string;
    regionAria: string;
    goTo: (index: number) => string;
    previous: string;
    next: string;
    copied: string;
    copy: string;
    share: string;
    download: string;
    footer: string;
    shareTitle: string;
  }
> = {
  pl: {
    eyebrow: "Karty wiedzy",
    title: "Przesuwaj i ucz się",
    description: "10 faktów finansowych, które powinien znać każdy dorosły. Oparte na danych i gotowe do udostępnienia.",
    readText: "Karty wiedzy. Przesuwaj, aby poznawać fakty finansowe.",
    source: "Źródło",
    learnMore: "Dowiedz się więcej",
    quickTip: "Szybka wskazówka",
    cardAria: (headline) => `Karta wiedzy: ${headline}`,
    regionAria: "Karta wiedzy",
    goTo: (index) => `Przejdź do karty ${index}`,
    previous: "Poprzednia karta",
    next: "Następna karta",
    copied: "Skopiowano!",
    copy: "Kopiuj",
    share: "Udostępnij",
    download: "Pobierz jako PNG",
    footer: "Przesuwaj w lewo/prawo lub użyj strzałek · Pobierz jako PNG",
    shareTitle: "Coach FI - karta wiedzy",
  },
  en: {
    eyebrow: "Knowledge Cards",
    title: "Swipe to learn",
    description: "10 financial facts every adult should know - backed by real data. Share them with friends.",
    readText: "Knowledge cards. Swipe to browse financial facts.",
    source: "Source",
    learnMore: "Learn more",
    quickTip: "Quick tip",
    cardAria: (headline) => `Knowledge card: ${headline}`,
    regionAria: "Knowledge card",
    goTo: (index) => `Go to card ${index}`,
    previous: "Previous card",
    next: "Next card",
    copied: "Copied!",
    copy: "Copy",
    share: "Share",
    download: "Download as PNG",
    footer: "Swipe left/right or use arrows · Download as PNG",
    shareTitle: "Coach FI - Knowledge Card",
  },
  ja: {
    eyebrow: "知識カード",
    title: "スワイプして学ぶ",
    description: "大人が知っておきたい10の金融ファクト。実データに基づき、共有できます。",
    readText: "知識カード。スワイプして金融ファクトを閲覧します。",
    source: "出典",
    learnMore: "詳しく見る",
    quickTip: "クイックヒント",
    cardAria: (headline) => `知識カード: ${headline}`,
    regionAria: "知識カード",
    goTo: (index) => `カード${index}へ移動`,
    previous: "前のカード",
    next: "次のカード",
    copied: "コピーしました!",
    copy: "コピー",
    share: "共有",
    download: "PNGとしてダウンロード",
    footer: "左右にスワイプ、または矢印を使用 · PNGとしてダウンロード",
    shareTitle: "Coach FI - 知識カード",
  },
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, width, height, radius);
    return;
  }

  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function buildShareText(cards: StoryCard[], idx: number, copy: (typeof cardsCopy)[Locale]): string {
  const card = cards[idx];
  if (!card) return "";
  return [
    `${card.emoji} ${card.bigStat} - ${card.statLabel}`,
    ``,
    card.headline,
    ``,
    `💡 ${card.tip}`,
    ``,
    `${copy.source}: ${card.source}`,
    `${copy.learnMore} -> coachfi.app`,
  ].join("\n");
}

// Draw card to canvas for download
async function exportCard(
  cardEl: HTMLElement | null,
  filename: string,
  cards: StoryCard[],
  copy: (typeof cardsCopy)[Locale]
) {
  if (!cardEl) return;
  // Fallback: just download the share text as a .txt
  const card = cards.find((c) => cardEl.dataset.cardId === c.id);
  if (!card) return;

  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, 600, 1000);
  grad.addColorStop(0, card.gradient.from);
  grad.addColorStop(0.5, card.gradient.via);
  grad.addColorStop(1, card.gradient.to);
  ctx.fillStyle = grad;
  ctx.beginPath();
  drawRoundedRect(ctx, 0, 0, 600, 1000, 40);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.arc(480, 120, 180, 0, Math.PI * 2);
  ctx.fill();

  const white = "#ffffff";
  const whiteAlpha = "rgba(255,255,255,0.6)";

  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("Coach FI  -  " + card.category, 48, 72);

  ctx.font = "bold 90px system-ui, sans-serif";
  ctx.fillStyle = white;
  const statFontSize = card.bigStat.length > 6 ? 54 : 90;
  ctx.font = `bold ${statFontSize}px system-ui, sans-serif`;
  ctx.fillText(card.bigStat, 48, 200);

  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.fillStyle = whiteAlpha;
  ctx.fillText(card.statLabel, 48, 238);

  // Divider
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(48, 270, 504, 2);

  // Headline (word wrap)
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.fillStyle = white;
  wrapText(ctx, card.headline, 48, 320, 504, 40);

  // Tip
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  wrapText(ctx, `💡 ${card.tip}`, 48, 560, 504, 28);

  // Source
  ctx.font = "16px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillText(`${copy.source}: ${card.source}`, 48, 900);
  ctx.fillText("coachfi.app", 48, 930);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, currentY);
}

// Individual card
function KnowledgeCard({ card, copy, style, onDragEnd }: {
  card: StoryCard;
  copy: (typeof cardsCopy)[Locale];
  style?: React.CSSProperties;
  onDragEnd?: (dir: "left" | "right") => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={cardRef}
      data-card-id={card.id}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, rotate, ...style }}
      onDragEnd={(_, info) => {
        if (info.offset.x < -DRAG_THRESHOLD) onDragEnd?.("left");
        else if (info.offset.x > DRAG_THRESHOLD) onDragEnd?.("right");
      }}
      className="absolute inset-0 cursor-grab select-none active:cursor-grabbing"
      aria-label={copy.cardAria(card.headline)}
    >
      <div
        className="h-full w-full overflow-hidden rounded-3xl shadow-2xl"
        style={{ background: `linear-gradient(135deg, ${card.gradient.from}, ${card.gradient.via}, ${card.gradient.to})` }}
      >
        {/* Decorative blob */}
        <div
          className="absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-20"
          style={{ background: "white" }}
        />
        <div
          className="absolute -bottom-16 -left-8 h-56 w-56 rounded-full opacity-10"
          style={{ background: "white" }}
        />

        <div className="relative flex h-full flex-col p-8 text-white">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest opacity-70">Coach FI</p>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black">{card.category}</span>
          </div>

          {/* Emoji + stat */}
          <div className="mt-8">
            <p className="text-5xl">{card.emoji}</p>
            <p className={cn("mt-3 font-black leading-none", card.bigStat.length > 6 ? "text-5xl" : "text-7xl")}>
              {card.bigStat}
            </p>
            <p className="mt-2 text-sm font-bold opacity-70">{card.statLabel}</p>
          </div>

          {/* Divider */}
          <div className="my-6 h-px bg-white/20" />

          {/* Headline */}
          <p className="text-lg font-black leading-7">{card.headline}</p>

          {/* Tip */}
          <div className="mt-4 rounded-2xl bg-white/15 p-4">
            <p className="text-xs font-black uppercase tracking-wide opacity-60">💡 {copy.quickTip}</p>
            <p className="mt-1 text-sm font-bold leading-6">{card.tip}</p>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-4">
            <p className="text-xs opacity-40">
              {copy.source}: {card.source}
            </p>
            <p className="text-xs font-black opacity-50">coachfi.app</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CardsPage() {
  const { locale } = useLanguage();
  const copy = cardsCopy[locale];
  const cards = getStoryCards(locale);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [copied, setCopied] = useState(false);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  const card = cards[current] ?? cards[0];

  const go = useCallback((dir: "left" | "right") => {
    setDirection(dir);
    if (dir === "right") setCurrent((i) => Math.min(i + 1, cards.length - 1));
    else setCurrent((i) => Math.max(i - 1, 0));
  }, [cards.length]);

  async function handleShare() {
    const text = buildShareText(cards, current, copy);
    if (navigator.share) {
      try { await navigator.share({ title: copy.shareTitle, text, url: "https://coachfi.app" }); }
      catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildShareText(cards, current, copy));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const el = cardContainerRef.current?.querySelector("[data-card-id]") as HTMLElement | null;
    if (card) void exportCard(el, `coachfi-card-${card.id}.png`, cards, copy);
  }

  if (!card) return null;

  return (
    <section aria-labelledby="cards-title">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        readText={copy.readText}
      />

      {/* Card stack */}
      <div className="mx-auto max-w-sm">
        {/* Counter */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-black text-muted">{current + 1} / {cards.length}</p>
          <div className="flex gap-1.5">
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > current ? "right" : "left"); setCurrent(i); }}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === current ? "w-6 bg-primary" : "w-1.5 bg-primary/20"
                )}
                aria-label={copy.goTo(i + 1)}
              />
            ))}
          </div>
        </div>

        {/* Stack */}
        <div ref={cardContainerRef} className="relative h-[520px]" role="region" aria-label={copy.regionAria}>
          {/* Background peek cards */}
          {current + 1 < cards.length && (
            <div
              className="absolute inset-x-3 bottom-0 top-3 overflow-hidden rounded-3xl opacity-40"
              style={{ background: `linear-gradient(135deg, ${cards[current + 1].gradient.from}, ${cards[current + 1].gradient.to})` }}
            />
          )}
          {current + 2 < cards.length && (
            <div
              className="absolute inset-x-6 bottom-0 top-6 overflow-hidden rounded-3xl opacity-20"
              style={{ background: `linear-gradient(135deg, ${cards[current + 2].gradient.from}, ${cards[current + 2].gradient.to})` }}
            />
          )}

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={{
                enter: (dir: string) => ({ x: dir === "right" ? 200 : -200, opacity: 0, scale: 0.92 }),
                center: { x: 0, opacity: 1, scale: 1 },
                exit: (dir: string) => ({ x: dir === "right" ? -200 : 200, opacity: 0, scale: 0.92 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <KnowledgeCard
                card={card}
                copy={copy}
                onDragEnd={(dir) => {
                  if (dir === "left" && current < cards.length - 1) go("right");
                  if (dir === "right" && current > 0) go("left");
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Voice + Nav buttons */}
        <div className="mt-4 flex justify-center">
          <VoiceButton
            text={`${card.bigStat} ${card.statLabel}. ${card.headline}. ${card.tip}`}
            locale={locale}
            variant="pill"
          />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            onClick={() => go("left")}
            disabled={current === 0}
            className="grid h-11 w-11 place-items-center rounded-full border border-primary/15 bg-white shadow-sm transition hover:bg-primary/5 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={copy.previous}
          >
            <ChevronLeft className="h-5 w-5 text-primary" />
          </button>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              {copied ? copy.copied : copy.copy}
            </Button>
            <Button type="button" size="sm" className="gap-1.5" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              {copy.share}
            </Button>
            <Button type="button" size="sm" variant="outline" className="gap-1.5 px-3" onClick={handleDownload} title={copy.download}>
              <Download className="h-4 w-4" />
            </Button>
          </div>

          <button
            onClick={() => go("right")}
            disabled={current === cards.length - 1}
            className="grid h-11 w-11 place-items-center rounded-full border border-primary/15 bg-white shadow-sm transition hover:bg-primary/5 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={copy.next}
          >
            <ChevronRight className="h-5 w-5 text-primary" />
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-muted">{copy.footer}</p>
      </div>
    </section>
  );
}
