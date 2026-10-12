"use client";

import {
  Check,
  Coins,
  MegaphoneOff,
  PackageCheck,
  Plus,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Undo2,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { SectionHeader } from "@/components/SectionHeader";
import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { cn, formatCurrency } from "@/lib/utils";

type Trigger = "ad" | "sale" | "stress" | "boredom" | "social" | "need";
type DecisionKey = "return" | "sell" | "pause" | "keep";

type ShoppingCopy = {
  eyebrow: string;
  title: string;
  description: string;
  readText: string;
  purchaseTitle: string;
  purchaseDescription: string;
  itemName: string;
  itemPlaceholder: string;
  price: string;
  daysSincePurchase: string;
  returnWindow: string;
  usedTimes: string;
  needLevel: string;
  regretLevel: string;
  trigger: string;
  receipt: string;
  triggers: Record<Trigger, string>;
  low: string;
  high: string;
  decisionTitle: string;
  impulseScore: string;
  returnStatus: string;
  returnOpen: string;
  returnClosed: string;
  recoverableCash: string;
  voiceLabel: string;
  decisions: Record<DecisionKey, { title: string; description: string; voice: string }>;
  unusedTitle: string;
  unusedDescription: string;
  unusedName: string;
  unusedValue: string;
  addItem: string;
  emptyItems: string;
  sellableTotal: string;
  remove: string;
  tipsTitle: string;
  tips: string[];
  adTitle: string;
  adCopy: string;
  disclaimer: string;
};

type UnusedItem = {
  id: number;
  name: string;
  value: number;
};

const EN_SHOPPING_COPY: ShoppingCopy = {
    eyebrow: "Shopping hygiene",
    title: "Stop impulse spending before it becomes your habit.",
    description:
      "Analyze buyer's remorse, returns and unused things. Coach FI helps you recover cash and protect attention from advertising pressure.",
    readText:
      "Shopping hygiene. Analyze a purchase, decide whether to return it, sell unused things and build a calmer buying habit.",
    purchaseTitle: "Purchase analysis",
    purchaseDescription: "Use this after a purchase or before the next impulse buy.",
    itemName: "What did you buy?",
    itemPlaceholder: "Headphones, shoes, gadget...",
    price: "Price",
    daysSincePurchase: "Days since purchase",
    returnWindow: "Return window in days",
    usedTimes: "How many times have you used it?",
    needLevel: "Real need",
    regretLevel: "Buyer's remorse",
    trigger: "What triggered the purchase?",
    receipt: "I still have the receipt or order confirmation",
    triggers: {
      ad: "Ad or influencer",
      sale: "Sale or discount",
      stress: "Stress",
      boredom: "Boredom",
      social: "Social pressure",
      need: "Real planned need",
    },
    low: "Low",
    high: "High",
    decisionTitle: "Coach decision",
    impulseScore: "Impulse score",
    returnStatus: "Return status",
    returnOpen: "Return may still be possible",
    returnClosed: "Return is probably closed",
    recoverableCash: "Potential cash to recover",
    voiceLabel: "Read Coach decision",
    decisions: {
      return: {
        title: "Return it if the policy allows it",
        description:
          "You regret the purchase, the need is low and the return window may still be open. Check the store policy today.",
        voice:
          "The best next step is to return this item if the store policy allows it. You regret the purchase, the need is low and the return window may still be open. Recover the cash and move it to savings.",
      },
      sell: {
        title: "Sell it and turn clutter into cash",
        description:
          "If you cannot return it but you do not use it, list it for sale. Set a fair price and a seven day deadline.",
        voice:
          "The best next step is to sell this item. If you cannot return it and you do not use it, turn clutter into cash. Set a fair price and a seven day deadline.",
      },
      pause: {
        title: "Pause before deciding",
        description: "The signal looks impulsive. Wait 24 hours, remove ad triggers and decide with a calmer head.",
        voice:
          "The best next step is to pause. The purchase looks impulsive. Wait twenty four hours, remove ad triggers and decide with a calmer head.",
      },
      keep: {
        title: "Keep it, but use it intentionally",
        description:
          "This looks closer to a real need. Keep it only if it replaces something, solves a problem or is used regularly.",
        voice:
          "This purchase looks closer to a real need. Keep it only if it replaces something, solves a real problem or is used regularly.",
      },
    },
    unusedTitle: "Unused things audit",
    unusedDescription: "Add things around you that you do not use. The total becomes your recovery target.",
    unusedName: "Unused thing",
    unusedValue: "Estimated sale value",
    addItem: "Add item",
    emptyItems: "Start with one drawer, one shelf or one box. Add the first unused thing.",
    sellableTotal: "Possible cash from unused things",
    remove: "Remove",
    tipsTitle: "Shopping hygiene rules",
    tips: [
      "Use a 24-hour pause for non-essential purchases.",
      "Unsubscribe from stores that trigger impulse buys.",
      "Keep a wish list instead of a checkout basket.",
      "Use the one-in, one-out rule for clothes and gadgets.",
      "Move recovered cash to savings before it disappears again.",
    ],
    adTitle: "Advertising reset",
    adCopy:
      "If ads make you feel behind, poorer or incomplete, that is a signal to mute, unfollow or block the trigger. Your attention is also a financial asset.",
    disclaimer:
      "Educational tool only. Return rights depend on country, store policy and product condition. Always check the seller's terms.",
};

const SHOPPING_COPY: LocalizedMap<ShoppingCopy> = {
  en: EN_SHOPPING_COPY,
  pl: {
    eyebrow: "Higiena zakupowa",
    title: "Zatrzymaj impulsywne zakupy, zanim staną się nawykiem.",
    description:
      "Przeanalizuj kaca zakupowego, zwroty i nieużywane rzeczy. Coach FI pomaga odzyskać gotówkę i ochronić uwagę przed presją reklam.",
    readText:
      "Higiena zakupowa. Przeanalizuj zakup, zdecyduj czy go zwrócić, sprzedaj nieużywane rzeczy i zbuduj spokojniejszy nawyk kupowania.",
    purchaseTitle: "Analiza zakupu",
    purchaseDescription: "Użyj po zakupie albo przed kolejną impulsywną decyzją.",
    itemName: "Co kupiłeś?",
    itemPlaceholder: "Słuchawki, buty, gadżet...",
    price: "Cena",
    daysSincePurchase: "Dni od zakupu",
    returnWindow: "Okno zwrotu w dniach",
    usedTimes: "Ile razy użyte?",
    needLevel: "Realna potrzeba",
    regretLevel: "Kac zakupowy",
    trigger: "Co wywołało zakup?",
    receipt: "Mam paragon albo potwierdzenie zamówienia",
    triggers: {
      ad: "Reklama lub influencer",
      sale: "Promocja lub rabat",
      stress: "Stres",
      boredom: "Nuda",
      social: "Presja otoczenia",
      need: "Realna zaplanowana potrzeba",
    },
    low: "Nisko",
    high: "Wysoko",
    decisionTitle: "Decyzja coacha",
    impulseScore: "Wynik impulsu",
    returnStatus: "Status zwrotu",
    returnOpen: "Zwrot może być jeszcze możliwy",
    returnClosed: "Zwrot prawdopodobnie zamknięty",
    recoverableCash: "Potencjalna gotówka do odzyskania",
    voiceLabel: "Odczytaj decyzję coacha",
    decisions: {
      return: {
        title: "Zwróć, jeśli regulamin na to pozwala",
        description:
          "Żałujesz zakupu, potrzeba jest niska, a okno zwrotu może być nadal otwarte. Sprawdź regulamin sklepu dzisiaj.",
        voice:
          "Najlepszy następny krok to zwrócić ten produkt, jeśli regulamin sklepu na to pozwala. Żałujesz zakupu, potrzeba jest niska, a okno zwrotu może być nadal otwarte. Odzyskaj gotówkę i przenieś ją do oszczędności.",
      },
      sell: {
        title: "Sprzedaj i zamień bałagan na gotówkę",
        description:
          "Jeśli nie możesz zwrócić produktu, ale go nie używasz, wystaw go na sprzedaż. Ustal uczciwą cenę i termin siedmiu dni.",
        voice:
          "Najlepszy następny krok to sprzedać ten przedmiot. Jeśli nie możesz go zwrócić i go nie używasz, zamień bałagan na gotówkę. Ustal uczciwą cenę i termin siedmiu dni.",
      },
      pause: {
        title: "Odczekaj przed decyzją",
        description: "Sygnał wygląda impulsywnie. Odczekaj 24 godziny, usuń bodźce reklamowe i zdecyduj spokojniej.",
        voice:
          "Najlepszy następny krok to pauza. Ten zakup wygląda impulsywnie. Odczekaj dwadzieścia cztery godziny, usuń bodźce reklamowe i zdecyduj spokojniej.",
      },
      keep: {
        title: "Zostaw, ale używaj świadomie",
        description:
          "To wygląda bliżej realnej potrzeby. Zostaw tylko wtedy, gdy rzecz coś zastępuje, rozwiązuje problem albo jest regularnie używana.",
        voice:
          "Ten zakup wygląda bliżej realnej potrzeby. Zostaw go tylko wtedy, gdy coś zastępuje, rozwiązuje realny problem albo jest regularnie używany.",
      },
    },
    unusedTitle: "Audyt nieużywanych rzeczy",
    unusedDescription: "Dodaj rzeczy wokół siebie, których nie używasz. Suma staje się celem odzyskanej gotówki.",
    unusedName: "Nieużywana rzecz",
    unusedValue: "Szacowana wartość sprzedaży",
    addItem: "Dodaj rzecz",
    emptyItems: "Zacznij od jednej szuflady, półki albo pudełka. Dodaj pierwszą nieużywaną rzecz.",
    sellableTotal: "Możliwa gotówka z nieużywanych rzeczy",
    remove: "Usuń",
    tipsTitle: "Zasady higieny zakupowej",
    tips: [
      "Stosuj pauzę 24 godziny przy zakupach niekoniecznych.",
      "Wypisz się ze sklepów, które wywołują impulsywne zakupy.",
      "Trzymaj listę życzeń zamiast koszyka zakupowego.",
      "Używaj zasady jedna rzecz wchodzi, jedna wychodzi przy ubraniach i gadżetach.",
      "Przenieś odzyskaną gotówkę do oszczędności, zanim znowu się rozejdzie.",
    ],
    adTitle: "Reset reklamowy",
    adCopy:
      "Jeśli reklamy sprawiają, że czujesz brak, presję albo porównywanie się z innymi, wycisz, odfollowuj albo zablokuj bodziec. Twoja uwaga też jest aktywem finansowym.",
    disclaimer:
      "To narzędzie edukacyjne. Prawo zwrotu zależy od kraju, regulaminu sklepu i stanu produktu. Zawsze sprawdź warunki sprzedawcy.",
  },
  es: createCompactCopy("Higiene de compras", "Frena compras impulsivas antes de que sean un habito."),
  fr: createCompactCopy("Hygiene d'achat", "Stoppez les achats impulsifs avant qu'ils deviennent une habitude."),
  zh: createCompactCopy("购物卫生", "在冲动消费变成习惯前停下来。"),
  ja: createCompactCopy("購入衛生", "衝動買いが習慣になる前に止める。"),
  hi: createCompactCopy("खरीद अनुशासन", "आवेग में खर्च को आदत बनने से पहले रोकें।"),
  "pt-BR": createCompactCopy("Higiene de compras", "Pare compras impulsivas antes que virem habito."),
  tr: createCompactCopy("Alisveris hijyeni", "Durtusel harcamayi aliskanliga donusmeden durdur."),
};

export default function ShoppingPage() {
  const { locale, t } = useLanguage();
  const copy = pickLocalized(SHOPPING_COPY, locale);
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState(249);
  const [daysSincePurchase, setDaysSincePurchase] = useState(3);
  const [returnWindow, setReturnWindow] = useState(14);
  const [usedTimes, setUsedTimes] = useState(0);
  const [needLevel, setNeedLevel] = useState(2);
  const [regretLevel, setRegretLevel] = useState(4);
  const [trigger, setTrigger] = useState<Trigger>("ad");
  const [hasReceipt, setHasReceipt] = useState(true);
  const [unusedItems, setUnusedItems] = useState<UnusedItem[]>([]);
  const [unusedName, setUnusedName] = useState("");
  const [unusedValue, setUnusedValue] = useState(80);

  const analysis = useMemo(() => {
    const returnOpen = hasReceipt && daysSincePurchase <= returnWindow;
    const impulseTrigger = trigger !== "need";
    const impulseScore = clamp(
      Math.round(
        regretLevel * 17 +
          (6 - needLevel) * 13 +
          (usedTimes === 0 ? 14 : usedTimes <= 1 ? 8 : 0) +
          (impulseTrigger ? 14 : -6) +
          (price >= 500 ? 8 : price >= 150 ? 4 : 0)
      ),
      0,
      100
    );

    const decision: DecisionKey =
      returnOpen && regretLevel >= 4 && needLevel <= 2
        ? "return"
        : needLevel <= 2 && (usedTimes <= 1 || regretLevel >= 3)
          ? "sell"
          : impulseScore >= 55
            ? "pause"
            : "keep";

    const recoverableCash = decision === "return" ? price : Math.round(price * 0.6);

    return { decision, impulseScore, returnOpen, recoverableCash };
  }, [daysSincePurchase, hasReceipt, needLevel, price, regretLevel, returnWindow, trigger, usedTimes]);

  const decisionCopy = copy.decisions[analysis.decision];
  const sellableTotal = unusedItems.reduce((total, item) => total + item.value, 0);
  const purchaseLabel = itemName.trim() || copy.itemPlaceholder.replace("...", "");
  const voiceText = limitVoiceText(
    [
      decisionCopy.voice,
      `${copy.impulseScore}: ${analysis.impulseScore} out of 100.`,
      `${copy.recoverableCash}: ${formatCurrency(analysis.recoverableCash, t.currency, locale)}.`,
      sellableTotal > 0
        ? `${copy.sellableTotal}: ${formatCurrency(sellableTotal, t.currency, locale)}.`
        : copy.emptyItems,
    ].join(" ")
  );

  function addUnusedItem() {
    const cleanName = unusedName.trim();
    if (!cleanName || unusedValue <= 0) return;
    setUnusedItems((items) => [...items, { id: Date.now(), name: cleanName, value: unusedValue }]);
    setUnusedName("");
    setUnusedValue(80);
  }

  return (
    <section>
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        readText={copy.readText}
      />

      <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>{copy.purchaseTitle}</CardTitle>
                <CardDescription>{copy.purchaseDescription}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <TextField
              label={copy.itemName}
              value={itemName}
              placeholder={copy.itemPlaceholder}
              onChange={setItemName}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label={copy.price} value={price} min={0} onChange={setPrice} />
              <NumberField label={copy.usedTimes} value={usedTimes} min={0} onChange={setUsedTimes} />
              <NumberField label={copy.daysSincePurchase} value={daysSincePurchase} min={0} onChange={setDaysSincePurchase} />
              <NumberField label={copy.returnWindow} value={returnWindow} min={1} onChange={setReturnWindow} />
            </div>
            <RangeField
              label={copy.needLevel}
              value={needLevel}
              low={copy.low}
              high={copy.high}
              onChange={setNeedLevel}
            />
            <RangeField
              label={copy.regretLevel}
              value={regretLevel}
              low={copy.low}
              high={copy.high}
              onChange={setRegretLevel}
            />
            <label className="grid gap-2 text-sm font-bold text-text">
              {copy.trigger}
              <select
                value={trigger}
                onChange={(event) => setTrigger(event.target.value as Trigger)}
                className="min-h-12 rounded-lg border border-primary/15 bg-white px-3 text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {(Object.keys(copy.triggers) as Trigger[]).map((key) => (
                  <option key={key} value={key}>
                    {copy.triggers[key]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-primary/10 bg-primary/5 p-3 text-sm font-bold text-text">
              <input
                type="checkbox"
                checked={hasReceipt}
                onChange={(event) => setHasReceipt(event.target.checked)}
                className="mt-1 h-5 w-5 rounded border-primary/30 text-primary"
              />
              <span>{copy.receipt}</span>
            </label>
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card className="overflow-hidden">
            <CardHeader className="gap-4 space-y-0 md:flex md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-normal text-primary">{copy.decisionTitle}</p>
                <CardTitle className="mt-2 text-2xl">{decisionCopy.title}</CardTitle>
                <CardDescription className="mt-2">{decisionCopy.description}</CardDescription>
              </div>
              <VoiceButton
                text={voiceText}
                label={copy.voiceLabel}
                locale={locale}
                variant="pill"
                className="shrink-0"
              />
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "rounded-lg border p-5",
                  analysis.decision === "return" && "border-success/40 bg-success/20",
                  analysis.decision === "sell" && "border-accent/70 bg-accent/30",
                  analysis.decision === "pause" && "border-warning/50 bg-warning/20",
                  analysis.decision === "keep" && "border-primary/20 bg-primary/5"
                )}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-bold text-muted">{purchaseLabel}</p>
                    <p className="mt-1 text-4xl font-black leading-none text-text">
                      {formatCurrency(analysis.recoverableCash, t.currency, locale)}
                    </p>
                    <p className="mt-2 text-sm font-bold text-muted">{copy.recoverableCash}</p>
                  </div>
                  <DecisionIcon decision={analysis.decision} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <MetricBox
              icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
              label={copy.impulseScore}
              value={`${analysis.impulseScore}/100`}
            />
            <MetricBox
              icon={<ReceiptText className="h-5 w-5" aria-hidden="true" />}
              label={copy.returnStatus}
              value={analysis.returnOpen ? copy.returnOpen : copy.returnClosed}
            />
            <MetricBox
              icon={<Coins className="h-5 w-5" aria-hidden="true" />}
              label={copy.sellableTotal}
              value={formatCurrency(sellableTotal, t.currency, locale)}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <CardTitle>{copy.unusedTitle}</CardTitle>
            <CardDescription>{copy.unusedDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
              <TextField label={copy.unusedName} value={unusedName} onChange={setUnusedName} />
              <NumberField label={copy.unusedValue} value={unusedValue} min={0} onChange={setUnusedValue} />
              <Button type="button" onClick={addUnusedItem} className="self-end">
                <Plus className="h-4 w-4" aria-hidden="true" />
                {copy.addItem}
              </Button>
            </div>

            {unusedItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-primary/25 bg-primary/5 p-4 text-sm font-bold leading-6 text-muted">
                {copy.emptyItems}
              </div>
            ) : (
              <div className="grid gap-2">
                {unusedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-lg border border-primary/10 bg-white/75 p-3 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-text">{item.name}</p>
                      <p className="text-sm font-bold text-muted">{formatCurrency(item.value, t.currency, locale)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUnusedItems((items) => items.filter((candidate) => candidate.id !== item.id))}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-primary/15 bg-white px-3 text-sm font-bold text-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {copy.remove}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent/50 text-text">
                <MegaphoneOff className="h-5 w-5" aria-hidden="true" />
              </span>
              <CardTitle>{copy.tipsTitle}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3">
              {copy.tips.map((tip) => (
                <li key={tip} className="flex gap-3 text-sm font-bold leading-6 text-text">
                  <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success/50 text-text">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="rounded-lg border border-primary/10 bg-white p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary/30 text-text">
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-black text-text">{copy.adTitle}</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-muted">{copy.adCopy}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-primary/10 bg-white p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <PackageCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="text-sm font-bold leading-6 text-muted">{copy.disclaimer}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-text">
      {label}
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 rounded-lg border border-primary/15 bg-white px-3 text-text placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-text">
      {label}
      <input
        type="number"
        min={min}
        value={value}
        onChange={(event) => onChange(Math.max(min, Number(event.target.value) || 0))}
        className="min-h-12 rounded-lg border border-primary/15 bg-white px-3 text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
    </label>
  );
}

function RangeField({
  label,
  value,
  low,
  high,
  onChange,
}: {
  label: string;
  value: number;
  low: string;
  high: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-text">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-black text-primary">{value}/5</span>
      </span>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 accent-primary"
      />
      <span className="flex justify-between text-xs font-bold text-muted">
        <span>{low}</span>
        <span>{high}</span>
      </span>
    </label>
  );
}

function MetricBox({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-primary/10 bg-white p-4 shadow-soft">
      <div className="mb-3 inline-grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <p className="text-sm font-bold text-muted">{label}</p>
      <p className="mt-1 text-xl font-black leading-tight text-text">{value}</p>
    </div>
  );
}

function DecisionIcon({ decision }: { decision: DecisionKey }) {
  const className = "h-10 w-10";

  if (decision === "return") {
    return (
      <span className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-white/80 text-text">
        <Undo2 className={className} aria-hidden="true" />
      </span>
    );
  }

  if (decision === "sell") {
    return (
      <span className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-white/80 text-text">
        <Coins className={className} aria-hidden="true" />
      </span>
    );
  }

  if (decision === "pause") {
    return (
      <span className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-white/80 text-text">
        <RotateCcw className={className} aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-white/80 text-primary">
      <PackageCheck className={className} aria-hidden="true" />
    </span>
  );
}

function createCompactCopy(eyebrow: string, title: string): ShoppingCopy {
  return {
    ...EN_SHOPPING_COPY,
    eyebrow,
    title,
    description: EN_SHOPPING_COPY.description,
    readText: EN_SHOPPING_COPY.readText,
  };
}

function limitVoiceText(text: string) {
  if (text.length <= 480) return text;
  return `${text.slice(0, 477).trimEnd()}...`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
