import type { Locale } from "@/lib/i18n";

export interface StoryCard {
  id: string;
  category: string;
  emoji: string;
  bigStat: string;
  statLabel: string;
  headline: string;
  tip: string;
  source: string;
  gradient: { from: string; via: string; to: string };
  textLight: boolean;
}

export const storyCards: StoryCard[] = [
  {
    id: "illiteracy-cost",
    category: "Big picture",
    emoji: "💸",
    bigStat: "$246B",
    statLabel: "lost annually due to financial illiteracy in the US",
    headline: "Poor financial knowledge costs the average American $948 every single year.",
    tip: "You're already ahead — knowing the problem exists is step one.",
    source: "WalletHub 2026",
    gradient: { from: "#6C47FF", via: "#8B5CF6", to: "#A78BFA" },
    textLight: true,
  },
  {
    id: "global-illiteracy",
    category: "Global",
    emoji: "🌍",
    bigStat: "3.5B",
    statLabel: "adults worldwide are financially illiterate",
    headline: "Half the planet can't correctly answer basic questions about interest, inflation or risk.",
    tip: "Understanding compound interest alone puts you ahead of most of the world.",
    source: "Global Financial Literacy Survey 2025",
    gradient: { from: "#0EA5E9", via: "#0284C7", to: "#0369A1" },
    textLight: true,
  },
  {
    id: "gen-z-score",
    category: "Gen Z",
    emoji: "📱",
    bigStat: "38%",
    statLabel: "correct answers — Gen Z's financial literacy score",
    headline: "Gen Z scored the lowest of any generation — yet they face the most complex financial world.",
    tip: "10 minutes of financial learning per day = more knowledge than 95% of your peers in a year.",
    source: "TIAA Institute / GFLEC 2025",
    gradient: { from: "#F59E0B", via: "#EF4444", to: "#EC4899" },
    textLight: true,
  },
  {
    id: "compound-power",
    category: "Investing",
    emoji: "📈",
    bigStat: "Rule of 72",
    statLabel: "divide 72 by your annual return to see when money doubles",
    headline: "At 8% return your money doubles every 9 years. At 6% — every 12 years.",
    tip: "Start at 25 instead of 35 and you could end up with 2× the retirement balance.",
    source: "Personal Finance Fundamentals",
    gradient: { from: "#10B981", via: "#059669", to: "#047857" },
    textLight: true,
  },
  {
    id: "emergency-fund",
    category: "Safety net",
    emoji: "🛡️",
    bigStat: "3–6",
    statLabel: "months of expenses — your emergency fund target",
    headline: "57% of Americans can't cover a $1,000 emergency without going into debt.",
    tip: "Even $500 in an emergency account reduces financial stress dramatically. Start there.",
    source: "Federal Reserve Survey 2025",
    gradient: { from: "#EC4899", via: "#DB2777", to: "#BE185D" },
    textLight: true,
  },
  {
    id: "inflation-silent",
    category: "Inflation",
    emoji: "🔥",
    bigStat: "−3%",
    statLabel: "real return on savings when inflation is 5% and your bank gives 2%",
    headline: "Cash under the mattress doesn't just sit there — it silently shrinks every single day.",
    tip: "Any return below inflation = losing money in real terms. Always compare to CPI.",
    source: "Coach FI Inflation Calculator",
    gradient: { from: "#EF4444", via: "#DC2626", to: "#B91C1C" },
    textLight: true,
  },
  {
    id: "saving-rate",
    category: "Habits",
    emoji: "🐷",
    bigStat: "20%",
    statLabel: "of your income — the savings target in the 50/30/20 rule",
    headline: "The 50/30/20 rule: 50% needs, 30% wants, 20% savings. Simple. Proven. Life-changing.",
    tip: "Automate the 20% transfer the moment your paycheck hits. Never test your willpower.",
    source: "Senator Elizabeth Warren — All Your Worth (2005)",
    gradient: { from: "#8B5CF6", via: "#7C3AED", to: "#6D28D9" },
    textLight: true,
  },
  {
    id: "debt-interest",
    category: "Debt",
    emoji: "⚠️",
    bigStat: "18–29%",
    statLabel: "typical credit card APR eating your purchasing power",
    headline: "A $5,000 credit card balance at 24% APR costs $1,200 per year in interest alone.",
    tip: "Pay off high-interest debt before investing — it's a guaranteed 20%+ return.",
    source: "Federal Reserve Consumer Finance 2025",
    gradient: { from: "#F97316", via: "#EA580C", to: "#C2410C" },
    textLight: true,
  },
  {
    id: "index-funds",
    category: "Investing",
    emoji: "📊",
    bigStat: "~10%",
    statLabel: "S&P 500 average annual return over last 30 years",
    headline: "Over any 20-year period the S&P 500 has never lost money. Time in market beats timing the market.",
    tip: "Low-cost index ETFs beat 92% of actively managed funds over 15 years — per S&P SPIVA Report.",
    source: "S&P SPIVA Report 2025",
    gradient: { from: "#06B6D4", via: "#0891B2", to: "#0E7490" },
    textLight: true,
  },
  {
    id: "solana-certs",
    category: "Web3",
    emoji: "⛓️",
    bigStat: "<$0.001",
    statLabel: "cost per NFT certificate on Solana — nearly free",
    headline: "Blockchain credentials are becoming the new standard. Universities & employers are already adopting them.",
    tip: "Your Coach FI certificate on Solana is yours forever — no institution can revoke it.",
    source: "Solana Ecosystem Report Feb 2026",
    gradient: { from: "#1a1a2e", via: "#16213e", to: "#0f3460" },
    textLight: true,
  },
];

const localizedStoryCardText: Record<
  Locale,
  Array<Pick<StoryCard, "category" | "statLabel" | "headline" | "tip">>
> = {
  en: storyCards.map(({ category, statLabel, headline, tip }) => ({ category, statLabel, headline, tip })),
  pl: [
    {
      category: "Duży obraz",
      statLabel: "tracone rocznie przez brak wiedzy finansowej w USA",
      headline: "Słaba wiedza finansowa kosztuje przeciętnego Amerykanina 948 dolarów rocznie.",
      tip: "Już jesteś krok do przodu, bo wiesz, że problem istnieje.",
    },
    {
      category: "Globalnie",
      statLabel: "dorosłych na świecie nie ma podstawowej wiedzy finansowej",
      headline: "Połowa świata nie odpowiada poprawnie na proste pytania o odsetki, inflację lub ryzyko.",
      tip: "Samo zrozumienie procentu składanego daje przewagę nad większością ludzi.",
    },
    {
      category: "Gen Z",
      statLabel: "poprawnych odpowiedzi w teście wiedzy finansowej Gen Z",
      headline: "Gen Z ma najniższy wynik spośród pokoleń, a jednocześnie najtrudniejsze środowisko finansowe.",
      tip: "10 minut nauki dziennie może dać więcej wiedzy niż ma 95% rówieśników po roku.",
    },
    {
      category: "Inwestowanie",
      statLabel: "podziel 72 przez roczny zwrot, aby oszacować podwojenie pieniędzy",
      headline: "Przy 8% zwrotu pieniądze podwajają się co 9 lat. Przy 6% co 12 lat.",
      tip: "Start w wieku 25 zamiast 35 lat może oznaczać nawet dwa razy większy kapitał emerytalny.",
    },
    {
      category: "Poduszka",
      statLabel: "miesięcy wydatków jako cel funduszu awaryjnego",
      headline: "57% Amerykanów nie pokryje nagłego wydatku 1000 dolarów bez zadłużenia.",
      tip: "Nawet 500 dolarów na koncie awaryjnym wyraźnie zmniejsza stres finansowy. Zacznij tam.",
    },
    {
      category: "Inflacja",
      statLabel: "realnego zwrotu z oszczędności przy 5% inflacji i 2% odsetek",
      headline: "Gotówka pod materacem nie stoi w miejscu. Każdego dnia po cichu traci siłę.",
      tip: "Zwrot poniżej inflacji oznacza realną stratę. Porównuj oprocentowanie z CPI.",
    },
    {
      category: "Nawyki",
      statLabel: "dochodu jako cel oszczędzania w regule 50/30/20",
      headline: "Reguła 50/30/20: 50% potrzeby, 30% zachcianki, 20% oszczędności. Prosta i skuteczna.",
      tip: "Zautomatyzuj przelew 20% po wypłacie. Nie testuj swojej silnej woli.",
    },
    {
      category: "Dług",
      statLabel: "typowe APR kart kredytowych zjadające siłę nabywczą",
      headline: "Saldo 5000 dolarów na karcie przy 24% APR kosztuje 1200 dolarów odsetek rocznie.",
      tip: "Spłać drogi dług przed inwestowaniem. To jak gwarantowany zwrot powyżej 20%.",
    },
    {
      category: "Inwestowanie",
      statLabel: "średni roczny zwrot S&P 500 z ostatnich 30 lat",
      headline: "W horyzoncie 20 lat S&P 500 historycznie nie kończył ze stratą. Czas w rynku wygrywa z timingiem.",
      tip: "Tanie ETF-y indeksowe pokonują większość aktywnie zarządzanych funduszy w długim terminie.",
    },
    {
      category: "Web3",
      statLabel: "koszt certyfikatu NFT na Solanie, prawie za darmo",
      headline: "Cyfrowe poświadczenia stają się standardem. Uczelnie i pracodawcy już je wdrażają.",
      tip: "Certyfikat Coach FI na Solanie należy do Ciebie na zawsze. Instytucja nie może go cofnąć.",
    },
  ],
  ja: [
    {
      category: "全体像",
      statLabel: "米国で金融リテラシー不足により毎年失われる金額",
      headline: "金融知識の不足は、平均的な米国人に毎年948ドルの損失をもたらします。",
      tip: "問題の存在を知っているだけで、すでに第一歩を踏み出しています。",
    },
    {
      category: "グローバル",
      statLabel: "世界の成人が金融リテラシー不足",
      headline: "世界の半数は、利息、インフレ、リスクの基本問題に正しく答えられません。",
      tip: "複利を理解するだけで、多くの人より一歩先に進めます。",
    },
    {
      category: "Gen Z",
      statLabel: "Gen Zの金融リテラシー正答率",
      headline: "Gen Zは世代別で最も低いスコアですが、最も複雑な金融環境に直面しています。",
      tip: "1日10分の学習で、1年後には多くの同世代より知識が増えます。",
    },
    {
      category: "投資",
      statLabel: "72を年間リターンで割ると、お金が倍になる年数の目安",
      headline: "8%のリターンなら約9年で倍になります。6%なら約12年です。",
      tip: "35歳ではなく25歳で始めると、退職資金に大きな差が生まれます。",
    },
    {
      category: "安全網",
      statLabel: "生活費の月数が緊急資金の目標",
      headline: "米国人の57%は、1000ドルの緊急支出を借金なしで賄えません。",
      tip: "緊急口座に500ドルあるだけでも、金融ストレスは大きく下がります。",
    },
    {
      category: "インフレ",
      statLabel: "インフレ5%、銀行利息2%のときの実質リターン",
      headline: "現金は置いておくだけではありません。毎日静かに価値が減ります。",
      tip: "インフレを下回るリターンは実質的な損失です。CPIと比べましょう。",
    },
    {
      category: "習慣",
      statLabel: "50/30/20ルールで貯蓄に回す収入の目安",
      headline: "50/30/20ルール: 50%は必要費、30%は欲しいもの、20%は貯蓄。シンプルで強力です。",
      tip: "給料日に20%を自動送金しましょう。意志力に頼らない仕組みが大切です。",
    },
    {
      category: "借金",
      statLabel: "一般的なクレジットカードAPR",
      headline: "5000ドルのカード残高を24% APRで持つと、年間1200ドルの利息がかかります。",
      tip: "投資より先に高金利の借金を返しましょう。20%以上の確実な効果に近いです。",
    },
    {
      category: "投資",
      statLabel: "過去30年のS&P 500平均年間リターン",
      headline: "20年単位では、S&P 500は歴史的に損失で終わっていません。市場にいる時間が重要です。",
      tip: "低コストのインデックスETFは、長期で多くのアクティブファンドを上回ります。",
    },
    {
      category: "Web3",
      statLabel: "Solana上のNFT証明書1件あたりのコスト",
      headline: "ブロックチェーン証明書は新しい標準になりつつあります。大学や雇用主も導入しています。",
      tip: "Solana上のCoach FI証明書はあなたのものです。機関が取り消すことはできません。",
    },
  ],
};

export function getStoryCards(locale: Locale): StoryCard[] {
  const localized = localizedStoryCardText[locale] ?? localizedStoryCardText.en;
  return storyCards.map((card, index) => ({
    ...card,
    ...(localized[index] ?? {}),
  }));
}
