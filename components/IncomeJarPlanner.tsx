"use client";

import {
  BookOpenCheck,
  Gift,
  Heart,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { VoiceButton } from "@/components/VoiceButton";
import { useLanguage } from "@/context/LanguageContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { cn, formatCurrency, LOCALE_INTL } from "@/lib/utils";

type PlannerMode = "adult" | "kids";
type JarKey = "necessities" | "education" | "longTerm" | "fun" | "investing" | "giving";

type PlannerCopy = {
  eyebrow: string;
  title: string;
  description: string;
  incomeLabel: string;
  incomeHelp: string;
  readLabel: string;
  totalLabel: string;
  jars: Record<JarKey, { title: string; description: string }>;
  voiceIntro: (amount: string) => string;
};

const JARS: Array<{ key: JarKey; percent: number; icon: LucideIcon; color: string }> = [
  { key: "necessities", percent: 55, icon: WalletCards, color: "#7DD3DC" },
  { key: "education", percent: 10, icon: BookOpenCheck, color: "#A89CF6" },
  { key: "longTerm", percent: 10, icon: PiggyBank, color: "#F7DFA6" },
  { key: "fun", percent: 10, icon: Gift, color: "#F59E0B" },
  { key: "investing", percent: 10, icon: TrendingUp, color: "#10B981" },
  { key: "giving", percent: 5, icon: Heart, color: "#F472B6" },
];

const ADULT_PL: PlannerCopy = {
  eyebrow: "Podział dochodu",
  title: "Model 6 słoików Ekera",
  description:
    "Wpisz miesięczny dochód i zobacz prosty podział na utrzymanie, edukację, większe wydatki, przyjemności, inwestycje i hojność.",
  incomeLabel: "Miesięczny dochód",
  incomeHelp: "To narzędzie edukacyjne. Dostosuj procenty do swojej sytuacji, ale zacznij od jasnego systemu.",
  readLabel: "Odczytaj podział dochodu",
  totalLabel: "Razem",
  jars: {
    necessities: {
      title: "Wydatki konieczne",
      description: "Rachunki, czynsz, jedzenie, transport, kredyty i ubezpieczenia.",
    },
    education: {
      title: "Edukacja",
      description: "Książki, kursy, szkolenia, konferencje oraz edukacja dzieci.",
    },
    longTerm: {
      title: "Długoterminowe wydatki",
      description: "Większe planowane zakupy: AGD, wakacje, naprawa samochodu.",
    },
    fun: {
      title: "Przyjemności",
      description: "Restauracja, hobby, kino, masaż i rzeczy, które dają radość bez poczucia winy.",
    },
    investing: {
      title: "Inwestycje",
      description: "Kapitał na giełdę, nieruchomości, fundusze, biznes lub inne aktywa.",
    },
    giving: {
      title: "Pomoc innym",
      description: "Prezenty, fundacje, akcje charytatywne, schroniska i wsparcie potrzebujących.",
    },
  },
  voiceIntro: (amount) => `Podział dochodu według modelu 6 słoików dla kwoty ${amount}.`,
};

const KIDS_PL: PlannerCopy = {
  ...ADULT_PL,
  eyebrow: "Słoiki na kieszonkowe",
  title: "Podziel pieniądze na 6 misji",
  description:
    "Wpisz kieszonkowe albo prezent i zobacz, ile pieniędzy trafia do każdego słoika.",
  incomeLabel: "Kieszonkowe lub prezent",
  incomeHelp: "Dziecko widzi prosty system: wydaj, ucz się, odkładaj, baw się, inwestuj i pomagaj.",
  readLabel: "Odczytaj moje słoiki",
  jars: {
    necessities: {
      title: "Potrzebne rzeczy",
      description: "Jedzenie w szkole, bilet, zeszyty albo coś naprawdę potrzebnego.",
    },
    education: {
      title: "Nauka",
      description: "Książki, kursy, języki, zajęcia albo edukacyjne gry.",
    },
    longTerm: {
      title: "Duży cel",
      description: "Rower, konsola, wakacje albo większe marzenie, na które trzeba poczekać.",
    },
    fun: {
      title: "Przyjemności",
      description: "Małe radości: kino, lody, zabawka albo hobby.",
    },
    investing: {
      title: "Rośnij",
      description: "Pieniądze, których nie ruszamy, żeby uczyć się budowania przyszłości.",
    },
    giving: {
      title: "Pomaganie",
      description: "Prezent, pomoc komuś bliskiemu albo wsparcie dobrej sprawy.",
    },
  },
  voiceIntro: (amount) => `Podział kieszonkowego na 6 słoików dla kwoty ${amount}.`,
};

const COPY: LocalizedMap<Record<PlannerMode, PlannerCopy>> = {
  en: {
    adult: {
      eyebrow: "Income split",
      title: "Eker 6 jar model",
      description:
        "Enter monthly income and split it into necessities, education, long-term spending, fun, investing and giving.",
      incomeLabel: "Monthly income",
      incomeHelp: "Educational model only. Adjust it to your situation, but start with a clear system.",
      readLabel: "Read income split",
      totalLabel: "Total",
      jars: {
        necessities: { title: "Necessities", description: "Bills, rent, food, transport, loans and insurance." },
        education: { title: "Education", description: "Books, courses, training, conferences and children's education." },
        longTerm: { title: "Long-term spending", description: "Larger planned purchases, holidays or car repairs without debt." },
        fun: { title: "Fun", description: "Money you intentionally spend on joy, hobbies and healthy rewards." },
        investing: { title: "Investing", description: "Capital for stocks, real estate, funds, business or other assets." },
        giving: { title: "Giving", description: "Gifts, charities, foundations, shelters and support for people in need." },
      },
      voiceIntro: (amount) => `Income split using the 6 jar model for ${amount}.`,
    },
    kids: {
      eyebrow: "Pocket money jars",
      title: "Split money into 6 missions",
      description: "Enter pocket money or a gift and see how much goes into each jar.",
      incomeLabel: "Pocket money or gift",
      incomeHelp: "A simple system for kids: spend, learn, save, enjoy, grow and give.",
      readLabel: "Read my jars",
      totalLabel: "Total",
      jars: {
        necessities: { title: "Needs", description: "School food, tickets, notebooks or something truly needed." },
        education: { title: "Learning", description: "Books, courses, languages, classes or educational games." },
        longTerm: { title: "Big goal", description: "A bike, console, holiday or a bigger dream that takes time." },
        fun: { title: "Fun", description: "Small joys like cinema, ice cream, toys or hobbies." },
        investing: { title: "Grow", description: "Money you do not touch, so you learn to build the future." },
        giving: { title: "Helping", description: "A gift, helping someone close or supporting a good cause." },
      },
      voiceIntro: (amount) => `Pocket money split into 6 jars for ${amount}.`,
    },
  },
  pl: { adult: ADULT_PL, kids: KIDS_PL },
  es: {
    adult: {
      ...ADULT_PL,
      eyebrow: "Division de ingresos",
      title: "Modelo de 6 frascos",
      description: "Divide tus ingresos en necesidades, educacion, gastos planificados, placer, inversion y ayuda.",
      incomeLabel: "Ingreso mensual",
      incomeHelp: "Modelo educativo. Ajustalo a tu situacion, pero empieza con un sistema claro.",
      readLabel: "Leer division de ingresos",
      totalLabel: "Total",
      voiceIntro: (amount) => `Division de ingresos con el modelo de 6 frascos para ${amount}.`,
    },
    kids: {
      ...KIDS_PL,
      eyebrow: "Frascos de dinero",
      title: "Divide el dinero en 6 misiones",
      description: "Introduce tu mesada o regalo y mira cuanto va a cada frasco.",
      incomeLabel: "Mesada o regalo",
      incomeHelp: "Sistema simple: gastar, aprender, ahorrar, disfrutar, crecer y ayudar.",
      readLabel: "Leer mis frascos",
      totalLabel: "Total",
      voiceIntro: (amount) => `Division de mesada en 6 frascos para ${amount}.`,
    },
  },
  fr: {
    adult: {
      ...ADULT_PL,
      eyebrow: "Repartition du revenu",
      title: "Modele des 6 bocaux",
      description: "Repartissez le revenu entre besoins, education, depenses planifiees, plaisir, investissement et generosite.",
      incomeLabel: "Revenu mensuel",
      incomeHelp: "Modele educatif. Adaptez-le a votre situation.",
      readLabel: "Lire la repartition",
      totalLabel: "Total",
      voiceIntro: (amount) => `Repartition du revenu en 6 bocaux pour ${amount}.`,
    },
    kids: {
      ...KIDS_PL,
      eyebrow: "Bocaux d'argent",
      title: "6 missions pour ton argent",
      description: "Entre ton argent de poche ou un cadeau et vois la repartition.",
      incomeLabel: "Argent de poche ou cadeau",
      incomeHelp: "Un systeme simple: depenser, apprendre, economiser, profiter, grandir et aider.",
      readLabel: "Lire mes bocaux",
      totalLabel: "Total",
      voiceIntro: (amount) => `Argent de poche reparti en 6 bocaux pour ${amount}.`,
    },
  },
  zh: {
    adult: {
      ...ADULT_PL,
      eyebrow: "收入分配",
      title: "6 个罐子模型",
      description: "把收入分配到必要支出、教育、长期支出、快乐、投资和帮助他人。",
      incomeLabel: "月收入",
      incomeHelp: "这是教育模型，可按个人情况调整。",
      readLabel: "朗读收入分配",
      totalLabel: "总计",
      voiceIntro: (amount) => `按 6 个罐子模型分配 ${amount}。`,
    },
    kids: {
      ...KIDS_PL,
      eyebrow: "零花钱罐子",
      title: "把钱分成 6 个任务",
      description: "输入零花钱或礼物金额，看看每个罐子有多少。",
      incomeLabel: "零花钱或礼物",
      incomeHelp: "简单系统：花、学、存、玩、成长、帮助。",
      readLabel: "朗读我的罐子",
      totalLabel: "总计",
      voiceIntro: (amount) => `把 ${amount} 零花钱分成 6 个罐子。`,
    },
  },
  ja: {
    adult: {
      ...ADULT_PL,
      eyebrow: "収入の分配",
      title: "6つのジャーモデル",
      description: "収入を生活費、教育、長期支出、楽しみ、投資、寄付に分けます。",
      incomeLabel: "月収",
      incomeHelp: "教育用モデルです。状況に合わせて調整できます。",
      readLabel: "収入配分を読み上げる",
      totalLabel: "合計",
      voiceIntro: (amount) => `${amount} を6つのジャーで分配します。`,
    },
    kids: {
      ...KIDS_PL,
      eyebrow: "おこづかいジャー",
      title: "お金を6つのミッションに分けよう",
      description: "おこづかいやプレゼントを入力して、配分を見ます。",
      incomeLabel: "おこづかい・プレゼント",
      incomeHelp: "使う、学ぶ、貯める、楽しむ、育てる、助ける。",
      readLabel: "ジャーを読み上げる",
      totalLabel: "合計",
      voiceIntro: (amount) => `${amount} のおこづかいを6つのジャーに分けます。`,
    },
  },
  hi: {
    adult: {
      ...ADULT_PL,
      eyebrow: "आय विभाजन",
      title: "6 जार मॉडल",
      description: "आय को जरूरत, शिक्षा, बड़े खर्च, आनंद, निवेश और मदद में बांटें।",
      incomeLabel: "मासिक आय",
      incomeHelp: "यह शैक्षणिक मॉडल है। अपनी स्थिति के अनुसार बदलें।",
      readLabel: "आय विभाजन सुनें",
      totalLabel: "कुल",
      voiceIntro: (amount) => `${amount} को 6 जार मॉडल से बांटा गया।`,
    },
    kids: {
      ...KIDS_PL,
      eyebrow: "पॉकेट मनी जार",
      title: "पैसे को 6 मिशन में बांटें",
      description: "पॉकेट मनी या उपहार लिखें और हर जार की राशि देखें।",
      incomeLabel: "पॉकेट मनी या उपहार",
      incomeHelp: "सरल सिस्टम: खर्च, सीखना, बचत, आनंद, बढ़ना और मदद।",
      readLabel: "मेरे जार सुनें",
      totalLabel: "कुल",
      voiceIntro: (amount) => `${amount} पॉकेट मनी को 6 जार में बांटा गया।`,
    },
  },
  "pt-BR": {
    adult: {
      ...ADULT_PL,
      eyebrow: "Divisao da renda",
      title: "Modelo dos 6 potes",
      description: "Divida a renda em necessidades, educacao, gastos planejados, prazer, investimento e generosidade.",
      incomeLabel: "Renda mensal",
      incomeHelp: "Modelo educativo. Ajuste para sua situacao.",
      readLabel: "Ler divisao da renda",
      totalLabel: "Total",
      voiceIntro: (amount) => `Divisao da renda em 6 potes para ${amount}.`,
    },
    kids: {
      ...KIDS_PL,
      eyebrow: "Potes da mesada",
      title: "Divida o dinheiro em 6 missoes",
      description: "Digite a mesada ou presente e veja quanto vai para cada pote.",
      incomeLabel: "Mesada ou presente",
      incomeHelp: "Sistema simples: gastar, aprender, poupar, curtir, crescer e ajudar.",
      readLabel: "Ler meus potes",
      totalLabel: "Total",
      voiceIntro: (amount) => `Mesada dividida em 6 potes para ${amount}.`,
    },
  },
  tr: {
    adult: {
      ...ADULT_PL,
      eyebrow: "Gelir bolumu",
      title: "6 kavanoz modeli",
      description: "Geliri zorunlu gider, egitim, uzun vadeli harcama, keyif, yatirim ve yardim olarak bol.",
      incomeLabel: "Aylik gelir",
      incomeHelp: "Egitim modeli. Kendi durumuna gore ayarla.",
      readLabel: "Gelir bolumunu oku",
      totalLabel: "Toplam",
      voiceIntro: (amount) => `${amount} icin 6 kavanoz gelir bolumu.`,
    },
    kids: {
      ...KIDS_PL,
      eyebrow: "Harclik kavanozlari",
      title: "Parayi 6 goreve bol",
      description: "Harclik veya hediye miktarini yaz ve her kavanozu gor.",
      incomeLabel: "Harclik veya hediye",
      incomeHelp: "Basit sistem: harca, ogren, biriktir, eglen, buyut ve yardim et.",
      readLabel: "Kavanozlarimi oku",
      totalLabel: "Toplam",
      voiceIntro: (amount) => `${amount} harclik 6 kavanoza bolundu.`,
    },
  },
};

const INTL_LOCALES: Record<string, string> = {
  ...LOCALE_INTL,
  es: "es-ES",
  fr: "fr-FR",
  zh: "zh-CN",
  hi: "hi-IN",
  "pt-BR": "pt-BR",
  tr: "tr-TR",
};

export function IncomeJarPlanner({
  mode,
  className,
}: {
  mode: PlannerMode;
  className?: string;
}) {
  const { locale, t } = useLanguage();
  const copy = pickLocalized(COPY, locale)[mode];
  const [income, setIncome] = useState(mode === "kids" ? 100 : 5000);
  const intlLocale = INTL_LOCALES[locale] ?? "en-US";
  const formattedIncome = formatCurrency(income, t.currency, intlLocale);

  const jarRows = useMemo(
    () =>
      JARS.map((jar) => ({
        ...jar,
        amount: (income * jar.percent) / 100,
        copy: copy.jars[jar.key],
      })),
    [copy.jars, income]
  );

  const voiceText = [
    copy.voiceIntro(formattedIncome),
    ...jarRows.map((jar) => {
      const amount = formatCurrency(jar.amount, t.currency, intlLocale);
      return `${jar.copy.title}: ${jar.percent} percent, ${amount}. ${jar.copy.description}`;
    }),
  ].join(" ");

  return (
    <section className={cn("rounded-lg border border-primary/15 bg-card/88 p-5 shadow-soft", className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase text-primary">{copy.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-black leading-tight text-text md:text-3xl">{copy.title}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-muted md:text-base">{copy.description}</p>
        </div>
        <VoiceButton text={voiceText} label={copy.readLabel} locale={locale} variant="pill" className="shrink-0" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-lg border border-primary/15 bg-background/55 p-4">
          <label className="grid gap-2 text-sm font-black text-text">
            {copy.incomeLabel}
            <input
              type="number"
              min={0}
              step={10}
              value={income}
              onChange={(event) => setIncome(Math.max(0, Number(event.target.value) || 0))}
              className="min-h-12 rounded-lg border border-primary/20 bg-background/70 px-3 text-xl font-black text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </label>
          <div className="mt-4 rounded-lg bg-primary/10 p-4">
            <p className="text-xs font-black uppercase text-primary">{copy.totalLabel}</p>
            <p className="mt-1 text-3xl font-black text-text">{formattedIncome}</p>
            <p className="mt-2 text-xs font-bold leading-5 text-muted">{copy.incomeHelp}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {jarRows.map((jar) => {
            const Icon = jar.icon;
            const amount = formatCurrency(jar.amount, t.currency, intlLocale);

            return (
              <article key={jar.key} className="rounded-lg border border-primary/10 bg-background/45 p-4">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-background"
                    style={{ backgroundColor: jar.color }}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-accent/18 px-2.5 py-1 text-xs font-black text-accent">
                    {jar.percent}%
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-black leading-tight text-text">{jar.copy.title}</h3>
                <p className="mt-1 text-2xl font-black text-text">{amount}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${jar.percent}%`, backgroundColor: jar.color }} />
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-muted">{jar.copy.description}</p>
              </article>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/10 p-3 text-sm font-black text-accent">
        <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
        55% + 10% + 10% + 10% + 10% + 5% = 100%
      </div>
    </section>
  );
}
