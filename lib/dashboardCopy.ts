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
  es: {
    hero: {
      mapLabel: "Salud financiera familiar",
      todayStep: "diagnóstico gratuito",
      title: "Ganas dinero. ¿Tu familia tiene un sistema?",
      description:
        "Coach FI ayuda a las familias a convertir sus ingresos en un sistema tranquilo: gasto consciente, ahorro automático, educación de los hijos y nada de ruido de trading.",
      diagnosis: "Hacer diagnóstico gratuito",
      continueLearning: "Ver plan",
      voiceDemo: "Prueba de Mila",
    },
    metrics: [
      { label: "Colchón", value: "53%", caption: "del objetivo" },
      { label: "Excedente", value: "dynamic", caption: "mayo" },
      { label: "Lecciones", value: "7/24", caption: "sprint" },
    ],
    score: {
      title: "Estabilidad financiera",
      outOf: "de 100",
      delta: "+8",
      nextTitle: "El mejor siguiente paso",
      nextText: (amount) =>
        `Programa una transferencia automática mensual de ${amount} a tu fondo de emergencia antes de aumentar el riesgo de inversión.`,
      askMila: "Preguntar a Mila",
    },
    coachPocket: {
      alt: "Mila, coach financiera",
      eyebrow: "Mila IA",
      title: "Informe familiar",
      briefing:
        "El diagnóstico es gratuito. La puntuación completa, el plan familiar y la guía de voz de Mila se desbloquean al aceptar las condiciones. Premium lo convierte en un sistema diario.",
      actions: [
        { href: "/health-check", label: "Hacer diagnóstico" },
        { href: "/coach", label: "Preguntar a Mila" },
        { href: "/kids", label: "Modo niños" },
      ],
    },
    route: {
      eyebrow: "Mapa de progreso",
      title: "Del diagnóstico a un sistema familiar",
      description: "Cada etapa tiene una lección, la voz de Mila y una acción en tu presupuesto real.",
      steps: [
        { title: "Fondo de emergencia", subtitle: "3,2 / 6 meses" },
        { title: "Presupuesto", subtitle: "excedente", surplus: true },
        { title: "Crédito", subtitle: "riesgo bajo" },
        { title: "Inversión", subtitle: "inicio con ETF/bonos" },
        { title: "Jubilación", subtitle: "plan a más de 15 años" },
      ],
    },
    simulator: {
      eyebrow: "Simulador de decisiones",
      title: "Lo que puede lograr un pequeño gesto mensual",
      badge: "educativo, no es asesoramiento",
      monthlySaving: "Ahorro mensual",
      years: "Horizonte",
      yearsValue: (years) => `${years} años`,
      overpayment: "Amortización anticipada",
      results: {
        emergency: "Colchón de 6 meses",
        months: (months) => `${months} meses`,
        growth: "Capital al 5,5%",
        overpayment: "Efecto de la amortización",
      },
      chartTitle: "Aportaciones frente al escenario del 5,5%",
      chartCash: "Aportaciones",
      chartInvest: "5.5%",
      yearTick: (year) => `A${year}`,
    },
    budget: {
      eyebrow: "Radar del presupuesto",
      title: "Qué ha cambiado este mes",
      addExpense: "Añadir gasto",
      signals: ["Suscripciones", "Comer fuera", "Transporte", "Ahorro"],
    },
    lessons: {
      eyebrow: "Microlecciones",
      title: "Aprende a través de decisiones",
      all: "Todas",
      items: [
        { title: "¿Amortizar el préstamo o invertir?", time: "4 min", tag: "Crédito" },
        { title: "ETF, bonos y depósitos sin jerga", time: "6 min", tag: "Inversión" },
        { title: "Cómo automatizar el ahorro", time: "3 min", tag: "Hábito" },
      ],
    },
  },
  fr: {
    hero: {
      mapLabel: "Santé financière de la famille",
      todayStep: "diagnostic gratuit",
      title: "Vous gagnez de l'argent. Votre famille a-t-elle un système ?",
      description:
        "Coach FI aide les familles à transformer leurs revenus en un système serein : dépenses conscientes, épargne automatique, éducation des enfants et aucun bruit de trading.",
      diagnosis: "Lancer le diagnostic gratuit",
      continueLearning: "Voir le plan",
      voiceDemo: "Essai de Mila",
    },
    metrics: [
      { label: "Matelas", value: "53%", caption: "de l'objectif" },
      { label: "Excédent", value: "dynamic", caption: "mai" },
      { label: "Leçons", value: "7/24", caption: "sprint" },
    ],
    score: {
      title: "Stabilité financière",
      outOf: "sur 100",
      delta: "+8",
      nextTitle: "Meilleure prochaine étape",
      nextText: (amount) =>
        `Programmez un virement automatique mensuel de ${amount} vers votre épargne de précaution avant d'augmenter le risque d'investissement.`,
      askMila: "Demander à Mila",
    },
    coachPocket: {
      alt: "Mila, coach financière",
      eyebrow: "Mila IA",
      title: "Point famille",
      briefing:
        "Le diagnostic est gratuit. Le score complet, le plan familial et l'accompagnement vocal de Mila se débloquent après acceptation des conditions. Premium en fait un système quotidien.",
      actions: [
        { href: "/health-check", label: "Lancer le diagnostic" },
        { href: "/coach", label: "Demander à Mila" },
        { href: "/kids", label: "Mode enfants" },
      ],
    },
    route: {
      eyebrow: "Carte de progression",
      title: "Du diagnostic à un système familial",
      description: "Chaque étape comprend une leçon, la voix de Mila et une action dans votre budget réel.",
      steps: [
        { title: "Épargne de précaution", subtitle: "3,2 / 6 mois" },
        { title: "Budget", subtitle: "excédent", surplus: true },
        { title: "Crédit", subtitle: "risque faible" },
        { title: "Investissement", subtitle: "début ETF/obligations" },
        { title: "Retraite", subtitle: "plan sur 15 ans et plus" },
      ],
    },
    simulator: {
      eyebrow: "Simulateur de décisions",
      title: "Ce qu'un petit geste mensuel peut changer",
      badge: "éducatif, pas un conseil",
      monthlySaving: "Épargne mensuelle",
      years: "Horizon",
      yearsValue: (years) => `${years} ans`,
      overpayment: "Remboursement anticipé",
      results: {
        emergency: "Matelas de 6 mois",
        months: (months) => `${months} mois`,
        growth: "Capital à 5,5 %",
        overpayment: "Effet du remboursement anticipé",
      },
      chartTitle: "Versements face au scénario à 5,5 %",
      chartCash: "Versements",
      chartInvest: "5.5%",
      yearTick: (year) => `A${year}`,
    },
    budget: {
      eyebrow: "Radar du budget",
      title: "Ce qui a changé ce mois-ci",
      addExpense: "Ajouter une dépense",
      signals: ["Abonnements", "Restaurants", "Transport", "Épargne"],
    },
    lessons: {
      eyebrow: "Micro-leçons",
      title: "Apprendre par les décisions",
      all: "Toutes",
      items: [
        { title: "Rembourser son prêt ou investir ?", time: "4 min", tag: "Crédit" },
        { title: "ETF, obligations et dépôts sans jargon", time: "6 min", tag: "Investissement" },
        { title: "Comment automatiser l'épargne", time: "3 min", tag: "Habitude" },
      ],
    },
  },
  zh: {
    hero: {
      mapLabel: "家庭财务健康",
      todayStep: "免费诊断",
      title: "你在赚钱。你的家庭有一套系统吗？",
      description:
        "Coach FI 帮助家庭把收入变成从容的系统：有意识的消费、自动储蓄、孩子的教育，没有交易噪音。",
      diagnosis: "开始免费诊断",
      continueLearning: "查看计划",
      voiceDemo: "试用 Mila",
    },
    metrics: [
      { label: "缓冲", value: "53%", caption: "目标完成度" },
      { label: "结余", value: "dynamic", caption: "5月" },
      { label: "课程", value: "7/24", caption: "冲刺" },
    ],
    score: {
      title: "财务稳定性",
      outOf: "满分 100",
      delta: "+8",
      nextTitle: "下一步最佳行动",
      nextText: (amount) =>
        `在提高投资风险之前，先设置每月自动向应急基金转入 ${amount}。`,
      askMila: "问问 Mila",
    },
    coachPocket: {
      alt: "Mila，财务教练",
      eyebrow: "Mila AI",
      title: "家庭简报",
      briefing:
        "诊断免费。接受条款后即可解锁完整得分、家庭计划和 Mila 语音指导。高级版把这一切变成每日系统。",
      actions: [
        { href: "/health-check", label: "开始诊断" },
        { href: "/coach", label: "问问 Mila" },
        { href: "/kids", label: "儿童模式" },
      ],
    },
    route: {
      eyebrow: "进度地图",
      title: "从诊断到家庭系统",
      description: "每个阶段都有一节课、Mila 的语音和一个落实到真实预算中的行动。",
      steps: [
        { title: "应急基金", subtitle: "3.2 / 6 个月" },
        { title: "预算", subtitle: "结余", surplus: true },
        { title: "信贷", subtitle: "低风险" },
        { title: "投资", subtitle: "从 ETF/债券起步" },
        { title: "退休", subtitle: "15 年以上计划" },
      ],
    },
    simulator: {
      eyebrow: "决策模拟器",
      title: "每月一个小动作能带来什么",
      badge: "仅供学习，非投资建议",
      monthlySaving: "每月储蓄",
      years: "期限",
      yearsValue: (years) => `${years} 年`,
      overpayment: "提前还贷",
      results: {
        emergency: "6 个月缓冲",
        months: (months) => `${months} 个月`,
        growth: "按 5.5% 计算的本金",
        overpayment: "提前还贷效果",
      },
      chartTitle: "投入金额与 5.5% 情景对比",
      chartCash: "投入金额",
      chartInvest: "5.5%",
      yearTick: (year) => `第${year}年`,
    },
    budget: {
      eyebrow: "预算雷达",
      title: "本月有什么变化",
      addExpense: "添加支出",
      signals: ["订阅", "外出就餐", "交通", "储蓄"],
    },
    lessons: {
      eyebrow: "微课程",
      title: "在决策中学习",
      all: "全部",
      items: [
        { title: "提前还贷还是投资？", time: "4 分钟", tag: "信贷" },
        { title: "不带术语的 ETF、债券和存款", time: "6 分钟", tag: "投资" },
        { title: "如何让储蓄自动化", time: "3 分钟", tag: "习惯" },
      ],
    },
  },
  hi: {
    hero: {
      mapLabel: "पारिवारिक वित्तीय सेहत",
      todayStep: "मुफ़्त जांच",
      title: "आप पैसा कमाते हैं। क्या आपके परिवार के पास कोई सिस्टम है?",
      description:
        "Coach FI परिवारों को आय को एक शांत सिस्टम में बदलने में मदद करता है: सोच-समझकर खर्च, स्वचालित बचत, बच्चों की शिक्षा और ट्रेडिंग का कोई शोर नहीं।",
      diagnosis: "मुफ़्त जांच करें",
      continueLearning: "योजना देखें",
      voiceDemo: "Mila ट्रायल",
    },
    metrics: [
      { label: "कुशन", value: "53%", caption: "लक्ष्य का" },
      { label: "बचत", value: "dynamic", caption: "मई" },
      { label: "पाठ", value: "7/24", caption: "स्प्रिंट" },
    ],
    score: {
      title: "वित्तीय स्थिरता",
      outOf: "100 में से",
      delta: "+8",
      nextTitle: "अगला सबसे अच्छा कदम",
      nextText: (amount) =>
        `निवेश का जोखिम बढ़ाने से पहले अपने आपातकालीन फंड में ${amount} का मासिक स्वचालित ट्रांसफ़र सेट करें।`,
      askMila: "Mila से पूछें",
    },
    coachPocket: {
      alt: "Mila, वित्तीय कोच",
      eyebrow: "Mila AI",
      title: "पारिवारिक ब्रीफ़िंग",
      briefing:
        "जांच मुफ़्त है। पूरा स्कोर, पारिवारिक योजना और Mila की आवाज़ में मार्गदर्शन शर्तें स्वीकार करने के बाद खुलते हैं। Premium इसे रोज़ का सिस्टम बना देता है।",
      actions: [
        { href: "/health-check", label: "जांच करें" },
        { href: "/coach", label: "Mila से पूछें" },
        { href: "/kids", label: "किड्स मोड" },
      ],
    },
    route: {
      eyebrow: "प्रगति का नक्शा",
      title: "जांच से पारिवारिक सिस्टम तक",
      description: "हर चरण में एक पाठ, Mila की आवाज़ और आपके असली बजट में एक काम है।",
      steps: [
        { title: "आपातकालीन फंड", subtitle: "3.2 / 6 महीने" },
        { title: "बजट", subtitle: "बचत", surplus: true },
        { title: "क्रेडिट", subtitle: "कम जोखिम" },
        { title: "निवेश", subtitle: "ETF/बॉन्ड से शुरुआत" },
        { title: "रिटायरमेंट", subtitle: "15+ साल की योजना" },
      ],
    },
    simulator: {
      eyebrow: "निर्णय सिम्युलेटर",
      title: "हर महीने का एक छोटा कदम क्या कर सकता है",
      badge: "शैक्षिक, सलाह नहीं",
      monthlySaving: "मासिक बचत",
      years: "अवधि",
      yearsValue: (years) => `${years} साल`,
      overpayment: "लोन का अतिरिक्त भुगतान",
      results: {
        emergency: "6 महीने का कुशन",
        months: (months) => `${months} महीने`,
        growth: "5.5% पर पूंजी",
        overpayment: "अतिरिक्त भुगतान का असर",
      },
      chartTitle: "योगदान बनाम 5.5% की स्थिति",
      chartCash: "योगदान",
      chartInvest: "5.5%",
      yearTick: (year) => `साल ${year}`,
    },
    budget: {
      eyebrow: "बजट रडार",
      title: "इस महीने क्या बदला",
      addExpense: "खर्च जोड़ें",
      signals: ["सब्सक्रिप्शन", "बाहर खाना", "यातायात", "बचत"],
    },
    lessons: {
      eyebrow: "माइक्रो-पाठ",
      title: "फ़ैसलों से सीखें",
      all: "सभी",
      items: [
        { title: "लोन का अतिरिक्त भुगतान करें या निवेश?", time: "4 मिनट", tag: "क्रेडिट" },
        { title: "बिना जटिल शब्दों के ETF, बॉन्ड और जमा", time: "6 मिनट", tag: "निवेश" },
        { title: "बचत को स्वचालित कैसे करें", time: "3 मिनट", tag: "आदत" },
      ],
    },
  },
  "pt-BR": {
    hero: {
      mapLabel: "Saúde financeira da família",
      todayStep: "diagnóstico gratuito",
      title: "Você ganha dinheiro. Sua família tem um sistema?",
      description:
        "O Coach FI ajuda famílias a transformar a renda em um sistema tranquilo: gastos conscientes, poupança automática, educação dos filhos e nada de ruído de trading.",
      diagnosis: "Fazer diagnóstico gratuito",
      continueLearning: "Ver plano",
      voiceDemo: "Teste da Mila",
    },
    metrics: [
      { label: "Colchão", value: "53%", caption: "da meta" },
      { label: "Sobra", value: "dynamic", caption: "maio" },
      { label: "Aulas", value: "7/24", caption: "sprint" },
    ],
    score: {
      title: "Estabilidade financeira",
      outOf: "de 100",
      delta: "+8",
      nextTitle: "Melhor próximo passo",
      nextText: (amount) =>
        `Programe uma transferência automática mensal de ${amount} para a sua reserva de emergência antes de aumentar o risco dos investimentos.`,
      askMila: "Perguntar à Mila",
    },
    coachPocket: {
      alt: "Mila, coach financeira",
      eyebrow: "Mila IA",
      title: "Resumo da família",
      briefing:
        "O diagnóstico é gratuito. A pontuação completa, o plano familiar e a orientação por voz da Mila são liberados após a aceitação dos termos. O Premium transforma isso em um sistema diário.",
      actions: [
        { href: "/health-check", label: "Fazer diagnóstico" },
        { href: "/coach", label: "Perguntar à Mila" },
        { href: "/kids", label: "Modo infantil" },
      ],
    },
    route: {
      eyebrow: "Mapa de progresso",
      title: "Do diagnóstico a um sistema familiar",
      description: "Cada etapa tem uma aula, a voz da Mila e uma ação no seu orçamento real.",
      steps: [
        { title: "Reserva de emergência", subtitle: "3,2 / 6 meses" },
        { title: "Orçamento", subtitle: "sobra", surplus: true },
        { title: "Crédito", subtitle: "risco baixo" },
        { title: "Investimentos", subtitle: "início com ETF/títulos" },
        { title: "Aposentadoria", subtitle: "plano de 15+ anos" },
      ],
    },
    simulator: {
      eyebrow: "Simulador de decisões",
      title: "O que um pequeno passo mensal pode fazer",
      badge: "educacional, não é recomendação",
      monthlySaving: "Poupança mensal",
      years: "Horizonte",
      yearsValue: (years) => `${years} anos`,
      overpayment: "Amortização extra",
      results: {
        emergency: "Colchão de 6 meses",
        months: (months) => `${months} meses`,
        growth: "Capital a 5,5%",
        overpayment: "Efeito da amortização",
      },
      chartTitle: "Aportes versus cenário de 5,5%",
      chartCash: "Aportes",
      chartInvest: "5.5%",
      yearTick: (year) => `A${year}`,
    },
    budget: {
      eyebrow: "Radar do orçamento",
      title: "O que mudou neste mês",
      addExpense: "Adicionar despesa",
      signals: ["Assinaturas", "Comer fora", "Transporte", "Poupança"],
    },
    lessons: {
      eyebrow: "Microaulas",
      title: "Aprenda por meio de decisões",
      all: "Todas",
      items: [
        { title: "Amortizar o empréstimo ou investir?", time: "4 min", tag: "Crédito" },
        { title: "ETFs, títulos e depósitos sem jargão", time: "6 min", tag: "Investimentos" },
        { title: "Como automatizar a poupança", time: "3 min", tag: "Hábito" },
      ],
    },
  },
  tr: {
    hero: {
      mapLabel: "Aile finansal sağlığı",
      todayStep: "ücretsiz teşhis",
      title: "Para kazanıyorsun. Ailenin bir sistemi var mı?",
      description:
        "Coach FI, ailelerin gelirini sakin bir sisteme dönüştürmesine yardım eder: bilinçli harcama, otomatik birikim, çocukların eğitimi ve al-sat gürültüsü yok.",
      diagnosis: "Ücretsiz teşhisi başlat",
      continueLearning: "Planı gör",
      voiceDemo: "Mila denemesi",
    },
    metrics: [
      { label: "Yastık", value: "53%", caption: "hedefin" },
      { label: "Fazla", value: "dynamic", caption: "Mayıs" },
      { label: "Dersler", value: "7/24", caption: "sprint" },
    ],
    score: {
      title: "Finansal istikrar",
      outOf: "100 üzerinden",
      delta: "+8",
      nextTitle: "En iyi sonraki adım",
      nextText: (amount) =>
        `Yatırım riskini artırmadan önce acil durum fonuna aylık ${amount} tutarında otomatik transfer kur.`,
      askMila: "Mila'ya sor",
    },
    coachPocket: {
      alt: "Mila, finans koçu",
      eyebrow: "Mila AI",
      title: "Aile özeti",
      briefing:
        "Teşhis ücretsizdir. Tam puan, aile planı ve Mila'nın sesli rehberliği koşullar kabul edildikten sonra açılır. Premium bunu günlük bir sisteme dönüştürür.",
      actions: [
        { href: "/health-check", label: "Teşhisi başlat" },
        { href: "/coach", label: "Mila'ya sor" },
        { href: "/kids", label: "Çocuk modu" },
      ],
    },
    route: {
      eyebrow: "İlerleme haritası",
      title: "Teşhisten aile sistemine",
      description: "Her aşamada bir ders, Mila'nın sesi ve gerçek bütçende bir eylem var.",
      steps: [
        { title: "Acil durum fonu", subtitle: "3,2 / 6 ay" },
        { title: "Bütçe", subtitle: "fazla", surplus: true },
        { title: "Kredi", subtitle: "düşük risk" },
        { title: "Yatırım", subtitle: "ETF/tahvil başlangıcı" },
        { title: "Emeklilik", subtitle: "15+ yıllık plan" },
      ],
    },
    simulator: {
      eyebrow: "Karar simülatörü",
      title: "Küçük bir aylık adım neler yapabilir",
      badge: "eğitim amaçlı, tavsiye değil",
      monthlySaving: "Aylık birikim",
      years: "Vade",
      yearsValue: (years) => `${years} yıl`,
      overpayment: "Kredi erken ödemesi",
      results: {
        emergency: "6 aylık yastık",
        months: (months) => `${months} ay`,
        growth: "%5,5 ile sermaye",
        overpayment: "Erken ödeme etkisi",
      },
      chartTitle: "Katkılar ve %5,5 senaryosu",
      chartCash: "Katkılar",
      chartInvest: "5.5%",
      yearTick: (year) => `Y${year}`,
    },
    budget: {
      eyebrow: "Bütçe radarı",
      title: "Bu ay neler değişti",
      addExpense: "Gider ekle",
      signals: ["Abonelikler", "Dışarıda yemek", "Ulaşım", "Birikim"],
    },
    lessons: {
      eyebrow: "Mikro dersler",
      title: "Kararlarla öğren",
      all: "Tümü",
      items: [
        { title: "Krediyi erken ödemek mi, yatırım mı?", time: "4 dk", tag: "Kredi" },
        { title: "Jargonsuz ETF, tahvil ve mevduat", time: "6 dk", tag: "Yatırım" },
        { title: "Birikim nasıl otomatikleştirilir", time: "3 dk", tag: "Alışkanlık" },
      ],
    },
  },
};
