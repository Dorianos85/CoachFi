import type { Locale } from "@/lib/i18n";

export interface VoiceAction {
  id: string;
  label: string;
  text: string;
}

interface LocalizedContent {
  appSubtitle: string;
  planLabel: string;
  scoreLabel: string;
  currentGoal: string;
  emergencyFund: string;
  activeModule: string;
  purchasingPower: string;
  proofLayer: string;
  certificates: string;
  hearMila: string;
  homeMilaIntro: string;
  demoFeedbackEyebrow: string;
  demoFeedbackTitle: string;
  demoFeedbackNote: string;
  userOpinions: Array<{ name: string; role: string; quote: string; impact: string }>;
  voice: {
    listen: string;
    readAloud: string;
    stop: string;
    loading: string;
    playing: string;
    readQuestion: string;
    readScore: string;
    readLearningPath: string;
    explainInflation: string;
  };
  accessibility: {
    eyebrow: string;
    title: string;
    subtitle: string;
    sectionCopy: string;
    actions: VoiceAction[];
    commandExamples: string;
    commands: string[];
    checklistTitle: string;
    checklistDesc: string;
    checklist: string[];
    numerologyTitle: string;
    dateOfBirth: string;
    calculateStyle: string;
    enterDate: string;
    uniqueStyle: string;
    numerologyDisclaimer: string;
  };
  coach: {
    heroTitle: string;
    heroCopy: string;
    introButton: string;
    introText: string;
    initialMessages: string[];
    quickActions: string[];
    quickReplies: Record<string, string>;
    fallback: string;
    live: string;
    offline: string;
    consentNotice: string;
    changeConsent: string;
    speaking: string;
    answering: string;
    ready: string;
    voiceNote: string;
    freeQuestionNote: string;
    messageLabel: string;
  };
  learn: {
    pathVoice: string;
    stages: Array<{ title: string; nftLabel: string }>;
    answered: string;
  };
  health: {
    scoreVoice: (score: number) => string;
    achievement: string;
    cardDescription: string;
  };
  inflation: {
    title: string;
    description: string;
    amount: string;
    years: string;
    rate: string;
    realValue: (years: number) => string;
    lost: string;
    chartTitle: string;
    chartDescription: string;
    voiceText: (amount: string, years: number, rate: number, realValue: string, lostValue: string) => string;
  };
  common: {
    tokens: string;
    rewardAvailable: string;
    tokenDemo: string;
    nextAction: string;
    firstFocus: string;
    nextLesson: string;
  };
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? Array<U>
    : T[K] extends (...args: infer A) => infer R
      ? (...args: A) => R
      : T[K] extends object
        ? DeepPartial<T[K]>
        : T[K];
};

const en: LocalizedContent = {
  appSubtitle: "Financial confidence coach",
  planLabel: "Your plan",
  scoreLabel: "Financial Health Score",
  currentGoal: "Current goal",
  emergencyFund: "Emergency fund",
  activeModule: "Active module",
  purchasingPower: "Purchasing power",
  proofLayer: "Proof layer",
  certificates: "NFT certificates",
  hearMila: "Hear Mila",
  homeMilaIntro:
    "Welcome to Coach FI. I am Mila, your voice-first financial education coach. I can read your score, explain inflation, guide lessons, read quiz questions and help you take the first small step.",
  demoFeedbackEyebrow: "Demo user feedback",
  demoFeedbackTitle: "What users should feel in the demo",
  demoFeedbackNote: "Sample opinions for hackathon storytelling. They show the intended value of the experience.",
  userOpinions: [
    {
      name: "Anna, 54",
      role: "Low-vision learner",
      quote:
        "The voice buttons make the app feel calmer. I can hear the score and the next step without searching through the whole screen.",
      impact: "Voice-first accessibility",
    },
    {
      name: "Marek, 31",
      role: "First-time saver",
      quote:
        "The inflation example finally made cash risk feel real. It did not push me into investing; it helped me understand why doing nothing is still a choice.",
      impact: "Inflation awareness",
    },
    {
      name: "Julia, 17",
      role: "Student",
      quote: "The quiz reading mode is useful when I am tired. Hearing the question and answers makes it easier to focus.",
      impact: "Quiz narration",
    },
    {
      name: "Piotr, 42",
      role: "Parent",
      quote: "I like that Coach FI does not feel like a trading app. It talks about habits, emergency funds and simple family decisions.",
      impact: "Family finance education",
    },
  ],
  voice: {
    listen: "Listen",
    readAloud: "Read aloud",
    stop: "Stop",
    loading: "Loading voice...",
    playing: "Playing - tap to stop",
    readQuestion: "Read question",
    readScore: "Read my score",
    readLearningPath: "Read learning path",
    explainInflation: "Explain inflation aloud",
  },
  accessibility: {
    eyebrow: "Accessibility Mode",
    title: "Voice-first financial education",
    subtitle: "Designed for blind, low-vision and elderly users.",
    sectionCopy: "Every important learning action can be heard aloud and read visually in the same place.",
    actions: [
      {
        id: "financial-score",
        label: "Read my financial score",
        text: "Your Financial Health Score is 42 out of 100. You have potential to improve. First, we will build your financial awareness and your first saving habit.",
      },
      {
        id: "inflation",
        label: "Explain inflation",
        text: "If you kept twenty thousand Polish zloty in cash for five years with average annual inflation of seven percent, your real purchasing power could fall to about fourteen thousand two hundred sixty zloty. Not acting is also a financial decision.",
      },
      {
        id: "next-lesson",
        label: "Start next lesson",
        text: "Your next lesson is Money Mindset. You will learn why saving is not about being rich. It is about building a simple repeatable system.",
      },
      {
        id: "quiz-question",
        label: "Read quiz question",
        text: "What does inflation mean? A. Money buys more over time. B. Money loses purchasing power over time. C. Banks give free money. D. Prices always go down.",
      },
      {
        id: "progress",
        label: "Show my progress",
        text: "You have completed one stage, earned one hundred twenty five Coach FI Tokens, and unlocked your first education certificate.",
      },
    ],
    commandExamples: "Voice command examples",
    commands: ["Read my financial score", "Start next lesson", "Explain inflation simply", "Repeat the question"],
    checklistTitle: "Accessibility checklist",
    checklistDesc: "WCAG-minded interface decisions included in the MVP.",
    checklist: [
      "Keyboard navigable buttons and forms",
      "Screen-reader labels and live updates",
      "Status labels in text, not color alone",
      "Read aloud controls across major screens",
    ],
    numerologyTitle: "Numerology Bonus",
    dateOfBirth: "Date of birth",
    calculateStyle: "Calculate learning style",
    enterDate: "Enter your date of birth",
    uniqueStyle: "Your financial learning style is unique.",
    numerologyDisclaimer: "Numerology is a motivational feature, not financial advice.",
  },
  coach: {
    heroTitle: "Mila can speak",
    heroCopy:
      "Coach FI reads lessons, quiz questions and financial insights aloud to support blind, low-vision and elderly users.",
    introButton: "Play Mila intro",
    introText:
      "Welcome to Coach FI. You do not need to be rich to start improving your financial future. You need awareness, a simple plan and the first small step.",
    initialMessages: [
      "You do not need to be rich to start saving. You need a system.",
      "Today's task: set aside 5 percent of your income and finish the inflation lesson.",
      "Your goal is not perfection. Your goal is your first repeatable habit.",
      "Public pensions may not be enough. Build your own financial resilience, step by step.",
    ],
    quickActions: [
      "Explain inflation simply",
      "Build my first saving habit",
      "Why do I need an emergency fund?",
      "How to teach kids about money?",
      "Fixed vs variable rate loans",
      "What if I do nothing?",
    ],
    quickReplies: {},
    fallback:
      "Financial confidence starts with basics: spend less than you earn, build an emergency fund, understand inflation and automate one small saving habit. Which step should we start with?",
    live: "Mila AI - live (Claude Haiku)",
    offline: "Mila AI - offline/local mode",
    consentNotice: "External AI mode is off. Mila answers locally without sending the conversation to an AI provider.",
    changeConsent: "Change consent",
    speaking: "Mila is speaking",
    answering: "Mila is answering",
    ready: "Mila is ready",
    voiceNote: "Her voice uses ElevenLabs when configured and your browser voice as a fallback.",
    freeQuestionNote: "Mila understands free questions too. Type anything about personal finance.",
    messageLabel: "Mila message",
  },
  learn: {
    pathVoice:
      "Your learning path starts with Money Mindset, then Saving Habit, Inflation and Purchasing Power, Credit and Interest, Emergency Fund, Long-Term Investing Basics, Retirement and Family Financial Plan.",
    stages: [
      { title: "Money Mindset", nftLabel: "Mindset Pioneer" },
      { title: "Saving Habit", nftLabel: "Habit Builder" },
      { title: "Inflation and Purchasing Power", nftLabel: "Inflation Aware" },
      { title: "Credit, Interest and Rates", nftLabel: "Credit Savvy" },
      { title: "Emergency Fund", nftLabel: "Resilient Saver" },
      { title: "Long-Term Investing Basics", nftLabel: "Investor Badge" },
      { title: "Retirement and Future Security", nftLabel: "Future Planner" },
      { title: "Family Financial Plan", nftLabel: "Family CFO" },
    ],
    answered: "questions answered",
  },
  health: {
    scoreVoice: (score) =>
      `Your Financial Health Score is ${score} out of 100. Your next step is to build a simple saving habit and understand how inflation affects your money.`,
    achievement: "My achievement",
    cardDescription: "Educational diagnosis using demo data.",
  },
  inflation: {
    title: "Cash can feel safe while losing power.",
    description: "Show, emotionally and visually, why not investing is also a financial decision.",
    amount: "Starting amount",
    years: "Period in years",
    rate: "Average annual inflation %",
    realValue: (years) => `Estimated real value after ${years} years`,
    lost: "Purchasing power lost",
    chartTitle: "Cash only vs habits vs investing scenario",
    chartDescription: "Not investing is also a financial decision. Inflation makes that decision expensive.",
    voiceText: (amount, years, rate, realValue, lostValue) =>
      `Starting with ${amount}, after ${years} years at ${rate} percent average annual inflation, estimated real value is ${realValue}. You would lose about ${lostValue} of purchasing power. Not acting is also a financial decision.`,
  },
  common: {
    tokens: "Coach FI Tokens",
    rewardAvailable: "Reward available",
    tokenDemo: "Mock token balance for the demo story.",
    nextAction: "Next recommended action",
    firstFocus: "First focus: starter emergency fund",
    nextLesson: "Next lesson: inflation and purchasing power",
  },
};

const pl: LocalizedContent = {
  ...en,
  appSubtitle: "Coach finansowej pewności",
  planLabel: "Twój plan",
  scoreLabel: "Wynik zdrowia finansowego",
  currentGoal: "Aktualny cel",
  activeModule: "Aktywny moduł",
  proofLayer: "Dowód postępu",
  emergencyFund: "Fundusz awaryjny",
  purchasingPower: "Siła nabywcza",
  certificates: "Certyfikaty NFT",
  hearMila: "Posłuchaj Miły",
  homeMilaIntro:
    "Witaj w Coach FI. Jestem Miła, Twoja głosowa coachka edukacji finansowej. Mogę odczytać wynik, wyjaśnić inflację, poprowadzić lekcje, przeczytać quiz i pomóc zrobić pierwszy mały krok.",
  demoFeedbackEyebrow: "Opinie użytkowników demo",
  demoFeedbackTitle: "Co użytkownik ma poczuć w demo",
  demoFeedbackNote: "Przykładowe opinie do narracji hackathonowej. Pokazują docelową wartość produktu.",
  userOpinions: [
    {
      name: "Anna, 54",
      role: "Użytkowniczka słabowidząca",
      quote: "Przyciski głosowe uspokajają aplikację. Słyszę wynik i kolejny krok bez szukania po ekranie.",
      impact: "Dostępność voice-first",
    },
    {
      name: "Marek, 31",
      role: "Początkujący oszczędzający",
      quote: "Przykład inflacji pokazał mi realne ryzyko gotówki. To nie pcha do inwestowania, tylko tłumaczy bezczynność.",
      impact: "Świadomość inflacji",
    },
    {
      name: "Julia, 17",
      role: "Uczennica",
      quote: "Odczyt quizu pomaga, gdy jestem zmęczona. Łatwiej skupić się na pytaniu i odpowiedziach.",
      impact: "Odczyt quizu",
    },
    {
      name: "Piotr, 42",
      role: "Rodzic",
      quote: "Coach FI nie wygląda jak aplikacja tradingowa. Mówi o nawykach, poduszce finansowej i decyzjach rodzinnych.",
      impact: "Edukacja rodzinna",
    },
  ],
  voice: {
    listen: "Słuchaj",
    readAloud: "Odczytaj",
    stop: "Stop",
    loading: "Ładowanie głosu...",
    playing: "Odtwarzanie - kliknij, aby zatrzymać",
    readQuestion: "Odczytaj pytanie",
    readScore: "Odczytaj wynik",
    readLearningPath: "Odczytaj ścieżkę nauki",
    explainInflation: "Wyjaśnij inflację głosem",
  },
  accessibility: {
    ...en.accessibility,
    eyebrow: "Tryb dostępności",
    title: "Głosowa edukacja finansowa",
    subtitle: "Zaprojektowana dla osób niewidomych, słabowidzących i starszych.",
    sectionCopy: "Każdą ważną akcję edukacyjną można usłyszeć i przeczytać w tym samym miejscu.",
    actions: [
      {
        id: "financial-score",
        label: "Odczytaj mój wynik",
        text: "Twój wynik zdrowia finansowego to 42 na 100. Masz potencjał do poprawy. Najpierw zbudujemy świadomość finansową i pierwszy nawyk oszczędzania.",
      },
      {
        id: "inflation",
        label: "Wyjaśnij inflację",
        text: "Jeśli trzymasz dwadzieścia tysięcy złotych w gotówce przez pięć lat przy średniej inflacji siedem procent, realna siła nabywcza może spaść do około czternastu tysięcy dwustu sześćdziesięciu złotych. Brak działania też jest decyzją finansową.",
      },
      {
        id: "next-lesson",
        label: "Rozpocznij następną lekcję",
        text: "Twoja następna lekcja to nastawienie do pieniędzy. Dowiesz się, że oszczędzanie nie wymaga bogactwa, tylko prostego i powtarzalnego systemu.",
      },
      {
        id: "quiz-question",
        label: "Odczytaj pytanie z quizu",
        text: "Co oznacza inflacja? A. Pieniądze kupują więcej z czasem. B. Pieniądze tracą siłę nabywczą z czasem. C. Banki rozdają darmowe pieniądze. D. Ceny zawsze spadają.",
      },
      {
        id: "progress",
        label: "Pokaż mój postęp",
        text: "Ukończyłeś jeden etap, zdobyłeś sto dwadzieścia pięć tokenów Coach FI i odblokowałeś pierwszy certyfikat edukacyjny.",
      },
    ],
    commandExamples: "Przykłady komend głosowych",
    commands: ["Odczytaj mój wynik", "Rozpocznij następną lekcję", "Wyjaśnij inflację prosto", "Powtórz pytanie"],
    checklistTitle: "Lista dostępności",
    checklistDesc: "Decyzje interfejsu zgodne z duchem WCAG w MVP.",
    checklist: [
      "Przyciski i formularze obsługiwane klawiaturą",
      "Etykiety dla czytników ekranu i aktualizacje live",
      "Statusy opisane tekstem, nie tylko kolorem",
      "Odczyt głosowy na głównych ekranach",
    ],
    numerologyTitle: "Bonus: numerologia",
    dateOfBirth: "Data urodzenia",
    calculateStyle: "Oblicz styl nauki",
    enterDate: "Wpisz datę urodzenia",
    uniqueStyle: "Twój finansowy styl nauki jest unikalny.",
    numerologyDisclaimer: "Numerologia jest funkcją motywacyjną, nie poradą finansową.",
  },
  coach: {
    ...en.coach,
    heroTitle: "Miła mówi głosem",
    heroCopy: "Coach FI czyta lekcje, pytania quizowe i wnioski finansowe, aby wspierać osoby niewidome, słabowidzące i starsze.",
    introButton: "Odtwórz intro Miły",
    introText: "Witaj w Coach FI. Nie musisz być bogaty, żeby zacząć poprawiać swoją przyszłość finansową. Potrzebujesz świadomości, prostego planu i pierwszego małego kroku.",
    initialMessages: [
      "Nie musisz być bogaty, żeby zacząć oszczędzać. Potrzebujesz systemu.",
      "Dzisiejsze zadanie: odłóż 5 procent dochodu i ukończ lekcję o inflacji.",
      "Celem nie jest perfekcja. Celem jest pierwszy powtarzalny nawyk.",
      "Publiczna emerytura może nie wystarczyć. Buduj własną odporność finansową krok po kroku.",
    ],
    quickActions: [
      "Wyjaśnij inflację prosto",
      "Zbuduj pierwszy nawyk oszczędzania",
      "Po co mi fundusz awaryjny?",
      "Jak uczyć dzieci o pieniądzach?",
      "Kredyt stały czy zmienny?",
      "Co jeśli nic nie zrobię?",
    ],
    quickReplies: {},
    fallback:
      "Pewność finansowa zaczyna się od podstaw: wydawaj mniej niż zarabiasz, zbuduj fundusz awaryjny, rozumiej inflację i zautomatyzuj mały nawyk oszczędzania. Od którego kroku zaczynamy?",
    live: "Miła AI - na żywo (Claude Haiku)",
    offline: "Miła AI - tryb lokalny",
    consentNotice: "Zewnętrzny tryb AI jest wyłączony. Miła odpowiada lokalnie bez wysyłania rozmowy do dostawcy AI.",
    changeConsent: "Zmień zgody",
    speaking: "Miła mówi",
    answering: "Miła odpowiada",
    ready: "Miła jest gotowa",
    voiceNote: "Głos używa ElevenLabs po konfiguracji, a w razie potrzeby głosu przeglądarki.",
    freeQuestionNote: "Miła rozumie też swobodne pytania. Napisz cokolwiek o finansach osobistych.",
    messageLabel: "Wiadomość Miły",
  },
  learn: {
    pathVoice:
      "Twoja ścieżka nauki zaczyna się od nastawienia do pieniędzy, potem przechodzi przez nawyk oszczędzania, inflację i siłę nabywczą, kredyt i odsetki, fundusz awaryjny, podstawy inwestowania długoterminowego, emeryturę oraz rodzinny plan finansowy.",
    stages: [
      { title: "Nastawienie do pieniędzy", nftLabel: "Pionier nastawienia" },
      { title: "Nawyk oszczędzania", nftLabel: "Budowniczy nawyku" },
      { title: "Inflacja i siła nabywcza", nftLabel: "Świadomy inflacji" },
      { title: "Kredyt, odsetki i stopy", nftLabel: "Świadomy kredytu" },
      { title: "Fundusz awaryjny", nftLabel: "Odporny oszczędzający" },
      { title: "Podstawy długoterminowego inwestowania", nftLabel: "Odznaka inwestora" },
      { title: "Emerytura i bezpieczeństwo przyszłości", nftLabel: "Planer przyszłości" },
      { title: "Rodzinny plan finansowy", nftLabel: "Rodzinny CFO" },
    ],
    answered: "pytań rozwiązanych",
  },
  health: {
    scoreVoice: (score) =>
      `Twój wynik zdrowia finansowego to ${score} na 100. Następny krok to zbudowanie prostego nawyku oszczędzania i zrozumienie, jak inflacja wpływa na Twoje pieniądze.`,
    achievement: "Moje osiągnięcie",
    cardDescription: "Diagnoza edukacyjna na danych demo.",
  },
  inflation: {
    ...en.inflation,
    title: "Gotówka może wydawać się bezpieczna, gdy traci siłę.",
    description: "Pokaż emocjonalnie i wizualnie, dlaczego brak inwestowania też jest decyzją finansową.",
    amount: "Kwota początkowa",
    years: "Okres w latach",
    rate: "Średnia roczna inflacja %",
    realValue: (years) => `Szacowana realna wartość po ${years} latach`,
    lost: "Utracona siła nabywcza",
    chartTitle: "Sama gotówka kontra nawyki i scenariusz inwestowania",
    chartDescription: "Brak inwestowania też jest decyzją finansową. Inflacja sprawia, że ta decyzja kosztuje.",
    voiceText: (amount, years, rate, realValue, lostValue) =>
      `Zaczynając od kwoty ${amount}, po ${years} latach przy średniej rocznej inflacji ${rate} procent, szacowana realna wartość to ${realValue}. Utracisz około ${lostValue} siły nabywczej. Brak działania też jest decyzją finansową.`,
  },
  common: {
    tokens: "Tokeny Coach FI",
    rewardAvailable: "Nagroda dostępna",
    tokenDemo: "Demo saldo tokenów na potrzeby historii produktu.",
    nextAction: "Następne zalecane działanie",
    firstFocus: "Pierwszy fokus: mały fundusz awaryjny",
    nextLesson: "Następna lekcja: inflacja i siła nabywcza",
  },
};

function adapt(base: LocalizedContent, overrides: DeepPartial<LocalizedContent>): LocalizedContent {
  return {
    ...base,
    ...overrides,
    voice: { ...base.voice, ...overrides.voice },
    accessibility: { ...base.accessibility, ...overrides.accessibility },
    coach: { ...base.coach, ...overrides.coach },
    learn: { ...base.learn, ...overrides.learn },
    health: { ...base.health, ...overrides.health },
    inflation: { ...base.inflation, ...overrides.inflation },
    common: { ...base.common, ...overrides.common },
  } as LocalizedContent;
}

const es = adapt(en, {
  appSubtitle: "Coach de confianza financiera",
  planLabel: "Tu plan",
  scoreLabel: "Puntuación financiera",
  hearMila: "Escuchar a Mila",
  homeMilaIntro: "Bienvenido a Coach FI. Soy Mila, tu coach de educación financiera por voz.",
  voice: { readAloud: "Leer en voz alta", stop: "Detener", readQuestion: "Leer pregunta", readScore: "Leer mi puntuación" },
  accessibility: {
    ...en.accessibility,
    title: "Educación financiera con voz primero",
    subtitle: "Diseñada para personas ciegas, con baja visión y mayores.",
  },
  coach: {
    ...en.coach,
    heroTitle: "Mila puede hablar",
    introButton: "Reproducir intro de Mila",
    ready: "Mila está lista",
    speaking: "Mila está hablando",
    answering: "Mila está respondiendo",
  },
  health: {
    scoreVoice: (score) => `Tu puntuación de salud financiera es ${score} de 100. El siguiente paso es crear un hábito simple de ahorro y entender la inflación.`,
    achievement: "Mi logro",
  },
});

const fr = adapt(es, {
  appSubtitle: "Coach de confiance financière",
  planLabel: "Votre plan",
  scoreLabel: "Score de santé financière",
  hearMila: "Écouter Mila",
  homeMilaIntro: "Bienvenue dans Coach FI. Je suis Mila, votre coach d'éducation financière vocale.",
  accessibility: { ...es.accessibility, title: "Éducation financière vocale", subtitle: "Conçue pour les personnes aveugles, malvoyantes et âgées." },
  coach: { ...es.coach, heroTitle: "Mila peut parler", introButton: "Lire l'introduction de Mila", ready: "Mila est prête" },
  health: { scoreVoice: (score) => `Votre score de santé financière est de ${score} sur 100. La prochaine étape consiste à créer une habitude d'épargne simple et à comprendre l'inflation.`, achievement: "Ma réussite" },
});

const zh = adapt(en, {
  appSubtitle: "财务信心教练",
  planLabel: "你的计划",
  scoreLabel: "财务健康分数",
  hearMila: "听 Mila",
  homeMilaIntro: "欢迎来到 Coach FI。我是 Mila，你的语音优先财务教育教练。",
  voice: { readAloud: "朗读", stop: "停止", readQuestion: "朗读问题", readScore: "朗读分数" },
  accessibility: { ...en.accessibility, title: "语音优先的金融教育", subtitle: "为盲人、低视力和老年用户设计。" },
  coach: { ...en.coach, heroTitle: "Mila 可以说话", introButton: "播放 Mila 介绍", ready: "Mila 已准备好", speaking: "Mila 正在说话", answering: "Mila 正在回答" },
  health: { scoreVoice: (score) => `你的财务健康分数是 ${score} 分，满分 100。下一步是建立简单的储蓄习惯并理解通胀。`, achievement: "我的成就" },
});

const ja = adapt(zh, {
  appSubtitle: "金融自信コーチ",
  planLabel: "あなたの計画",
  scoreLabel: "金融健康スコア",
  hearMila: "Mila を聞く",
  homeMilaIntro: "Coach FI へようこそ。私は Mila、音声優先の金融教育コーチです。",
  voice: { readAloud: "読み上げ", stop: "停止", readQuestion: "質問を読む", readScore: "スコアを読む" },
  accessibility: { ...zh.accessibility, title: "音声優先の金融教育", subtitle: "視覚障害、弱視、高齢のユーザー向けに設計。" },
  coach: { ...zh.coach, heroTitle: "Mila は話せます", introButton: "Mila の紹介を再生", ready: "Mila は準備できています" },
  health: { scoreVoice: (score) => `あなたの金融健康スコアは 100 点中 ${score} 点です。次の一歩は、簡単な貯蓄習慣を作り、インフレを理解することです。`, achievement: "私の実績" },
});

const hi = adapt(en, {
  appSubtitle: "वित्तीय आत्मविश्वास कोच",
  planLabel: "आपकी योजना",
  scoreLabel: "वित्तीय स्वास्थ्य स्कोर",
  hearMila: "Mila को सुनें",
  homeMilaIntro: "Coach FI में आपका स्वागत है। मैं Mila हूँ, आपकी आवाज़-प्रथम वित्तीय शिक्षा कोच।",
  voice: { readAloud: "आवाज़ में पढ़ें", stop: "रोकें", readQuestion: "प्रश्न पढ़ें", readScore: "मेरा स्कोर पढ़ें" },
  accessibility: { ...en.accessibility, title: "आवाज़-प्रथम वित्तीय शिक्षा", subtitle: "अंधे, कम दृष्टि और बुजुर्ग उपयोगकर्ताओं के लिए डिज़ाइन।" },
  coach: { ...en.coach, heroTitle: "Mila बोल सकती है", introButton: "Mila परिचय चलाएँ", ready: "Mila तैयार है", speaking: "Mila बोल रही है", answering: "Mila जवाब दे रही है" },
  health: { scoreVoice: (score) => `आपका वित्तीय स्वास्थ्य स्कोर 100 में से ${score} है। अगला कदम सरल बचत आदत बनाना और महंगाई को समझना है।`, achievement: "मेरी उपलब्धि" },
});

const ptBR = adapt(es, {
  appSubtitle: "Coach de confiança financeira",
  planLabel: "Seu plano",
  scoreLabel: "Score de saúde financeira",
  hearMila: "Ouvir Mila",
  homeMilaIntro: "Bem-vindo ao Coach FI. Eu sou Mila, sua coach de educação financeira com voz primeiro.",
  accessibility: { ...es.accessibility, title: "Educação financeira com voz primeiro", subtitle: "Criada para usuários cegos, com baixa visão e idosos." },
  coach: { ...es.coach, heroTitle: "Mila pode falar", introButton: "Tocar introdução da Mila", ready: "Mila está pronta" },
  health: { scoreVoice: (score) => `Seu score de saúde financeira é ${score} de 100. O próximo passo é criar um hábito simples de poupança e entender a inflação.`, achievement: "Minha conquista" },
});

const tr = adapt(en, {
  appSubtitle: "Finansal güven koçu",
  planLabel: "Planın",
  scoreLabel: "Finansal sağlık skoru",
  hearMila: "Mila'yı dinle",
  homeMilaIntro: "Coach FI'ya hoş geldin. Ben Mila, ses öncelikli finansal eğitim koçun.",
  voice: { readAloud: "Sesli oku", stop: "Durdur", readQuestion: "Soruyu oku", readScore: "Skorumu oku" },
  accessibility: { ...en.accessibility, title: "Ses öncelikli finansal eğitim", subtitle: "Kör, az gören ve yaşlı kullanıcılar için tasarlandı." },
  coach: { ...en.coach, heroTitle: "Mila konuşabilir", introButton: "Mila girişini oynat", ready: "Mila hazır", speaking: "Mila konuşuyor", answering: "Mila cevaplıyor" },
  health: { scoreVoice: (score) => `Finansal sağlık skorun 100 üzerinden ${score}. Sonraki adım basit bir tasarruf alışkanlığı kurmak ve enflasyonu anlamak.`, achievement: "Başarım" },
});

const content: Record<Locale, LocalizedContent> = {
  en,
  pl,
  ja,
};

export function getLocalizedContent(locale: Locale) {
  return content[locale] ?? en;
}
