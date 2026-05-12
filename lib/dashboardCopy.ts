import type { Locale } from "@/lib/i18n";

export const dashboardCopy: Record<
  Locale,
  {
    hero: {
      mapLabel: string;
      todayStep: string;
      title: string;
      description: string;
      diagnosis: string;
      continueLearning: string;
      voiceDemo: string;
    };
    metrics: Array<{ label: string; value: string; caption: string }>;
    score: {
      title: string;
      outOf: string;
      delta: string;
      nextTitle: string;
      nextText: (amount: string) => string;
      askMila: string;
    };
    coachPocket: {
      alt: string;
      eyebrow: string;
      title: string;
      briefing: string;
      actions: Array<{ href: string; label: string }>;
    };
    route: {
      eyebrow: string;
      title: string;
      description: string;
      steps: Array<{ title: string; subtitle: string; surplus?: boolean }>;
    };
    simulator: {
      eyebrow: string;
      title: string;
      badge: string;
      monthlySaving: string;
      years: string;
      yearsValue: (years: number) => string;
      overpayment: string;
      results: {
        emergency: string;
        months: (months: number) => string;
        growth: string;
        overpayment: string;
      };
      chartTitle: string;
      chartCash: string;
      chartInvest: string;
      yearTick: (year: number) => string;
    };
    budget: {
      eyebrow: string;
      title: string;
      addExpense: string;
      signals: string[];
    };
    lessons: {
      eyebrow: string;
      title: string;
      all: string;
      items: Array<{ title: string; time: string; tag: string }>;
    };
  }
> = {
  pl: {
    hero: {
      mapLabel: "Mapa Finansowa",
      todayStep: "dzis: 1 najlepszy krok",
      title: "Spokojny system do decyzji o pieniadzach.",
      description:
        "Coach FI laczy oszczedzanie, kredyty i inwestowanie w jeden dzienny plan. Bez presji, bez tradingowego szumu, z jasnym kolejnym ruchem.",
      diagnosis: "Zrob diagnoze",
      continueLearning: "Kontynuuj nauke",
      voiceDemo: "Wyprobuj demo glosowe",
    },
    metrics: [
      { label: "Poduszka", value: "53%", caption: "celu" },
      { label: "Nadwyzka", value: "dynamic", caption: "w maju" },
      { label: "Lekcje", value: "7/24", caption: "aktywny sprint" },
    ],
    score: {
      title: "Stabilnosc finansowa",
      outOf: "na 100",
      delta: "+8",
      nextTitle: "Nastepny najlepszy krok",
      nextText: (amount) =>
        `Ustaw automatyczne ${amount} miesiecznie na fundusz awaryjny, zanim zaczniesz zwiekszac ryzyko inwestycji.`,
      askMila: "Zapytaj Mile",
    },
    coachPocket: {
      alt: "Mila, coach finansowy",
      eyebrow: "Mila AI",
      title: "Twoj dzienny briefing",
      briefing:
        "Masz dobra nadwyzke, ale fundusz awaryjny jest jeszcze za niski. Najpierw zabezpiecz 3 miesiace kosztow, potem porownamy nadplate kredytu z inwestowaniem pasywnym.",
      actions: [
        { href: "/coach", label: "Zapytaj o decyzje" },
        { href: "/inflation", label: "Sprawdz sile gotowki" },
        { href: "/review", label: "Powtorz 6 kart" },
      ],
    },
    route: {
      eyebrow: "Mapa postepu",
      title: "Od spokoju gotowkowego do dlugoterminowego planu",
      description: "Kazdy etap ma lekcje, symulator i jedna akcje w realnym budzecie.",
      steps: [
        { title: "Poduszka", subtitle: "3.2 / 6 mies." },
        { title: "Budzet", subtitle: "surplus", surplus: true },
        { title: "Kredyty", subtitle: "ryzyko niskie" },
        { title: "Inwestycje", subtitle: "start ETF/obligacje" },
        { title: "Emerytura", subtitle: "plan 15+ lat" },
      ],
    },
    simulator: {
      eyebrow: "Symulator decyzji",
      title: "Co daje maly ruch powtarzany co miesiac",
      badge: "edukacyjnie, bez rekomendacji",
      monthlySaving: "Odkladam miesiecznie",
      years: "Horyzont",
      yearsValue: (years) => `${years} lat`,
      overpayment: "Nadplata kredytu",
      results: {
        emergency: "Poduszka 6 mies.",
        months: (months) => `${months} mies.`,
        growth: "Kapital przy 5.5%",
        overpayment: "Efekt nadplaty",
      },
      chartTitle: "Wplaty kontra scenariusz 5.5%",
      chartCash: "Wplaty",
      chartInvest: "5.5%",
      yearTick: (year) => `${year}r`,
    },
    budget: {
      eyebrow: "Radar budzetu",
      title: "Co zmienilo sie w tym miesiacu",
      addExpense: "Dodaj wydatek",
      signals: ["Subskrypcje", "Jedzenie poza domem", "Transport", "Oszczednosci"],
    },
    lessons: {
      eyebrow: "Mikrolekcje",
      title: "Nauka przez decyzje",
      all: "Wszystkie",
      items: [
        { title: "Nadplacac kredyt czy inwestowac?", time: "4 min", tag: "Kredyty" },
        { title: "ETF, obligacje i lokata bez zargonu", time: "6 min", tag: "Inwestycje" },
        { title: "Jak ustawic automatyczne oszczedzanie", time: "3 min", tag: "Nawyk" },
      ],
    },
  },
  en: {
    hero: {
      mapLabel: "Financial Map",
      todayStep: "today: 1 best step",
      title: "A calm system for money decisions.",
      description:
        "Coach FI connects saving, credit and investing into one daily plan. No pressure, no trading noise, just the next clear move.",
      diagnosis: "Run diagnosis",
      continueLearning: "Continue learning",
      voiceDemo: "Try voice demo",
    },
    metrics: [
      { label: "Emergency fund", value: "53%", caption: "of goal" },
      { label: "Surplus", value: "dynamic", caption: "in May" },
      { label: "Lessons", value: "7/24", caption: "active sprint" },
    ],
    score: {
      title: "Financial stability",
      outOf: "out of 100",
      delta: "+8",
      nextTitle: "Next best step",
      nextText: (amount) =>
        `Set an automatic ${amount} monthly transfer to your emergency fund before increasing investment risk.`,
      askMila: "Ask Mila",
    },
    coachPocket: {
      alt: "Mila, financial coach",
      eyebrow: "Mila AI",
      title: "Your daily briefing",
      briefing:
        "You have a good surplus, but your emergency fund is still too low. First secure 3 months of costs, then compare loan overpayment with passive investing.",
      actions: [
        { href: "/coach", label: "Ask about a decision" },
        { href: "/inflation", label: "Check cash power" },
        { href: "/review", label: "Review 6 cards" },
      ],
    },
    route: {
      eyebrow: "Progress map",
      title: "From cash calm to a long-term plan",
      description: "Each stage has a lesson, a simulator and one action in your real budget.",
      steps: [
        { title: "Emergency fund", subtitle: "3.2 / 6 mo." },
        { title: "Budget", subtitle: "surplus", surplus: true },
        { title: "Credit", subtitle: "low risk" },
        { title: "Investing", subtitle: "ETF/bonds start" },
        { title: "Retirement", subtitle: "15+ year plan" },
      ],
    },
    simulator: {
      eyebrow: "Decision simulator",
      title: "What one small monthly move can do",
      badge: "educational, not advice",
      monthlySaving: "Monthly saving",
      years: "Horizon",
      yearsValue: (years) => `${years} years`,
      overpayment: "Loan overpayment",
      results: {
        emergency: "6-month cushion",
        months: (months) => `${months} mo.`,
        growth: "Capital at 5.5%",
        overpayment: "Overpayment effect",
      },
      chartTitle: "Contributions versus 5.5% scenario",
      chartCash: "Contributions",
      chartInvest: "5.5%",
      yearTick: (year) => `Y${year}`,
    },
    budget: {
      eyebrow: "Budget radar",
      title: "What changed this month",
      addExpense: "Add expense",
      signals: ["Subscriptions", "Eating out", "Transport", "Savings"],
    },
    lessons: {
      eyebrow: "Micro-lessons",
      title: "Learn through decisions",
      all: "All",
      items: [
        { title: "Overpay a loan or invest?", time: "4 min", tag: "Credit" },
        { title: "ETFs, bonds and deposits without jargon", time: "6 min", tag: "Investing" },
        { title: "How to automate saving", time: "3 min", tag: "Habit" },
      ],
    },
  },
  ja: {
    hero: {
      mapLabel: "ファイナンシャルマップ",
      todayStep: "今日: 最善の一歩",
      title: "お金の判断を落ち着いて進めるシステム。",
      description:
        "Coach FIは貯蓄、信用、投資を一日の計画につなげます。プレッシャーも取引ノイズもなく、次の行動を明確にします。",
      diagnosis: "診断を始める",
      continueLearning: "学習を続ける",
      voiceDemo: "音声デモを試す",
    },
    metrics: [
      { label: "緊急資金", value: "53%", caption: "達成" },
      { label: "余剰", value: "dynamic", caption: "5月" },
      { label: "レッスン", value: "7/24", caption: "進行中" },
    ],
    score: {
      title: "金融安定度",
      outOf: "100点中",
      delta: "+8",
      nextTitle: "次の最善ステップ",
      nextText: (amount) =>
        `投資リスクを増やす前に、毎月 ${amount} を緊急資金へ自動で積み立てましょう。`,
      askMila: "Milaに聞く",
    },
    coachPocket: {
      alt: "金融コーチのMila",
      eyebrow: "Mila AI",
      title: "今日のブリーフィング",
      briefing:
        "余剰はありますが、緊急資金はまだ不足しています。まず3か月分の支出を確保し、その後ローン繰上げとパッシブ投資を比較しましょう。",
      actions: [
        { href: "/coach", label: "判断を相談する" },
        { href: "/inflation", label: "現金の力を確認" },
        { href: "/review", label: "6枚を復習" },
      ],
    },
    route: {
      eyebrow: "進捗マップ",
      title: "現金の安心から長期計画へ",
      description: "各ステージにはレッスン、シミュレーター、実際の予算での行動があります。",
      steps: [
        { title: "緊急資金", subtitle: "3.2 / 6か月" },
        { title: "予算", subtitle: "余剰", surplus: true },
        { title: "信用", subtitle: "低リスク" },
        { title: "投資", subtitle: "ETF/債券を開始" },
        { title: "退職", subtitle: "15年以上の計画" },
      ],
    },
    simulator: {
      eyebrow: "判断シミュレーター",
      title: "毎月の小さな行動が生む効果",
      badge: "教育用、助言ではありません",
      monthlySaving: "毎月の貯蓄",
      years: "期間",
      yearsValue: (years) => `${years}年`,
      overpayment: "ローン繰上げ",
      results: {
        emergency: "6か月分の備え",
        months: (months) => `${months}か月`,
        growth: "5.5%での資産",
        overpayment: "繰上げ効果",
      },
      chartTitle: "積立額と5.5%シナリオ",
      chartCash: "積立",
      chartInvest: "5.5%",
      yearTick: (year) => `${year}年`,
    },
    budget: {
      eyebrow: "予算レーダー",
      title: "今月変わったこと",
      addExpense: "支出を追加",
      signals: ["サブスク", "外食", "交通", "貯蓄"],
    },
    lessons: {
      eyebrow: "ミニレッスン",
      title: "判断しながら学ぶ",
      all: "すべて",
      items: [
        { title: "ローン繰上げか投資か？", time: "4分", tag: "信用" },
        { title: "ETF、債券、預金をやさしく理解", time: "6分", tag: "投資" },
        { title: "貯蓄を自動化する方法", time: "3分", tag: "習慣" },
      ],
    },
  },
};
