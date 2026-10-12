import type { LocalizedMap } from "@/lib/i18n";

export const dashboardCopy: LocalizedMap<
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
      mapLabel: "Zdrowie finansowe rodziny",
      todayStep: "darmowa diagnoza",
      title: "Masz dochód, ale pieniądze znikają?",
      description:
        "Coach FI pomaga rodzinom zamienić dochód w spokojny system: świadome wydatki, automatyczne odkładanie, edukację dzieci i plan bez tradingowego szumu.",
      diagnosis: "Zrób darmową diagnozę",
      continueLearning: "Zobacz plan",
      voiceDemo: "Trial Mili",
    },
    metrics: [
      { label: "Poduszka", value: "53%", caption: "celu" },
      { label: "Nadwyżka", value: "dynamic", caption: "maj" },
      { label: "Lekcje", value: "7/24", caption: "sprint" },
    ],
    score: {
      title: "Zdrowie finansowe",
      outOf: "na 100",
      delta: "+8",
      nextTitle: "Następny najlepszy krok",
      nextText: (amount) =>
        `Ustaw automatyczne ${amount} miesięcznie na fundusz bezpieczeństwa, zanim zaczniesz zwiększać ryzyko inwestycji.`,
      askMila: "Zapytaj Milę",
    },
    coachPocket: {
      alt: "Mila, coach finansowy",
      eyebrow: "Mila AI",
      title: "Rodzinny briefing",
      briefing:
        "Diagnoza jest darmowa. Pełny wynik, rodzinny plan i głosowe prowadzenie Mili odblokowujesz po akceptacji zasad. Premium rozwija codzienny system bez presji.",
      actions: [
        { href: "/health-check", label: "Zrób diagnozę" },
        { href: "/coach", label: "Zapytaj Milę" },
        { href: "/kids", label: "Kids Mode" },
      ],
    },
    route: {
      eyebrow: "Mapa postepu",
      title: "Od diagnozy do rodzinnego systemu",
      description: "Każdy etap ma lekcję, głos Mili i jedną akcję w realnym budżecie.",
      steps: [
        { title: "Poduszka", subtitle: "3.2 / 6 mies." },
        { title: "Budżet", subtitle: "surplus", surplus: true },
        { title: "Kredyty", subtitle: "ryzyko niskie" },
        { title: "Inwestycje", subtitle: "start ETF/obligacje" },
        { title: "Emerytura", subtitle: "plan 15+ lat" },
      ],
    },
    simulator: {
      eyebrow: "Symulator decyzji",
      title: "Co daje mały ruch powtarzany co miesiąc",
      badge: "edukacyjnie, bez rekomendacji",
      monthlySaving: "Odkładam miesięcznie",
      years: "Horyzont",
      yearsValue: (years) => `${years} lat`,
      overpayment: "Nadpłata kredytu",
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
      title: "Co zmieniło się w tym miesiącu",
      addExpense: "Dodaj wydatek",
      signals: ["Subskrypcje", "Jedzenie poza domem", "Transport", "Oszczędności"],
    },
    lessons: {
      eyebrow: "Mikrolekcje",
      title: "Nauka przez decyzje",
      all: "Wszystkie",
      items: [
        { title: "Nadpłacać kredyt czy inwestować?", time: "4 min", tag: "Kredyty" },
        { title: "ETF, obligacje i lokata bez żargonu", time: "6 min", tag: "Inwestycje" },
        { title: "Jak ustawić automatyczne oszczędzanie", time: "3 min", tag: "Nawyk" },
      ],
    },
  },
  en: {
    hero: {
      mapLabel: "Family financial health",
      todayStep: "free diagnosis",
      title: "You earn money. Does your family have a system?",
      description:
        "Coach FI helps families turn income into a calm system: conscious spending, automatic saving, children's education and no trading noise.",
      diagnosis: "Run free diagnosis",
      continueLearning: "See plan",
      voiceDemo: "Mila trial",
    },
    metrics: [
      { label: "Cushion", value: "53%", caption: "of goal" },
      { label: "Surplus", value: "dynamic", caption: "May" },
      { label: "Lessons", value: "7/24", caption: "sprint" },
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
      title: "Family briefing",
      briefing:
        "Diagnosis is free. Full score, family plan and Mila voice guidance unlock after terms acceptance. Premium turns this into a daily system.",
      actions: [
        { href: "/health-check", label: "Run diagnosis" },
        { href: "/coach", label: "Ask Mila" },
        { href: "/kids", label: "Kids Mode" },
      ],
    },
    route: {
      eyebrow: "Progress map",
      title: "From diagnosis to a family system",
      description: "Each stage has a lesson, Mila voice and one action in your real budget.",
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
