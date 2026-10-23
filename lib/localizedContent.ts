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

const en: LocalizedContent = {
  appSubtitle: "Financial confidence coach",
  planLabel: "Your plan",
  scoreLabel: "Financial Health Score",
  currentGoal: "Current goal",
  emergencyFund: "Emergency fund",
  activeModule: "Active module",
  purchasingPower: "Purchasing power",
  proofLayer: "Proof layer",
  certificates: "certificates",
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
        text: "You have completed one stage, earned one hundred twenty five Coach FI Points, and unlocked your first education certificate.",
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
    tokens: "Coach FI Points",
    rewardAvailable: "Reward available",
    tokenDemo: "Mock point balance for the demo story.",
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
  certificates: "Certyfikaty",
  hearMila: "Posłuchaj Mili",
  homeMilaIntro:
    "Witaj w Coach FI. Jestem Mila, Twoja głosowa coachka edukacji finansowej. Mogę odczytać wynik, wyjaśnić inflację, poprowadzić lekcje, przeczytać quiz i pomóc zrobić pierwszy mały krok.",
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
        text: "Ukończyłeś jeden etap, zdobyłeś sto dwadzieścia pięć punktów Coach FI i odblokowałeś pierwszy certyfikat edukacyjny.",
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
    heroTitle: "Mila mówi głosem",
    heroCopy: "Coach FI czyta lekcje, pytania quizowe i wnioski finansowe, aby wspierać osoby niewidome, słabowidzące i starsze.",
    introButton: "Odtwórz intro Mili",
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
    live: "Mila AI - na żywo (Claude Haiku)",
    offline: "Mila AI - tryb lokalny",
    consentNotice: "Zewnętrzny tryb AI jest wyłączony. Mila odpowiada lokalnie bez wysyłania rozmowy do dostawcy AI.",
    changeConsent: "Zmień zgody",
    speaking: "Mila mówi",
    answering: "Mila odpowiada",
    ready: "Mila jest gotowa",
    voiceNote: "Głos używa ElevenLabs po konfiguracji, a w razie potrzeby głosu przeglądarki.",
    freeQuestionNote: "Mila rozumie też swobodne pytania. Napisz cokolwiek o finansach osobistych.",
    messageLabel: "Wiadomość Mili",
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
    tokens: "Punkty Coach FI",
    rewardAvailable: "Nagroda dostępna",
    tokenDemo: "Demo saldo punktów na potrzeby historii produktu.",
    nextAction: "Następne zalecane działanie",
    firstFocus: "Pierwszy fokus: mały fundusz awaryjny",
    nextLesson: "Następna lekcja: inflacja i siła nabywcza",
  },
};

const es: LocalizedContent = {
  appSubtitle: "Coach de confianza financiera",
  planLabel: "Tu plan",
  scoreLabel: "Puntuación de salud financiera",
  currentGoal: "Objetivo actual",
  emergencyFund: "Fondo de emergencia",
  activeModule: "Módulo activo",
  purchasingPower: "Poder adquisitivo",
  proofLayer: "Capa de prueba",
  certificates: "certificados",
  hearMila: "Escucha a Mila",
  homeMilaIntro:
    "Te damos la bienvenida a Coach FI. Soy Mila, tu coach de educación financiera con voz primero. Puedo leer tu puntuación, explicar la inflación, guiarte en las lecciones, leer las preguntas del quiz y ayudarte a dar el primer pequeño paso.",
  demoFeedbackEyebrow: "Opiniones de usuarios de la demo",
  demoFeedbackTitle: "Lo que los usuarios deberían sentir en la demo",
  demoFeedbackNote: "Opiniones de ejemplo para la narrativa del hackathon. Muestran el valor que busca la experiencia.",
  userOpinions: [
    {
      name: "Anna, 54",
      role: "Estudiante con baja visión",
      quote:
        "Los botones de voz hacen que la app se sienta más tranquila. Puedo escuchar la puntuación y el siguiente paso sin buscar por toda la pantalla.",
      impact: "Accesibilidad con voz primero",
    },
    {
      name: "Marek, 31",
      role: "Ahorrador principiante",
      quote:
        "El ejemplo de la inflación por fin hizo que el riesgo del efectivo pareciera real. No me empujó a invertir; me ayudó a entender que no hacer nada también es una elección.",
      impact: "Conciencia sobre la inflación",
    },
    {
      name: "Julia, 17",
      role: "Estudiante",
      quote: "El modo de lectura del quiz es útil cuando estoy cansada. Escuchar la pregunta y las respuestas me ayuda a concentrarme.",
      impact: "Narración del quiz",
    },
    {
      name: "Piotr, 42",
      role: "Padre",
      quote: "Me gusta que Coach FI no parezca una app de trading. Habla de hábitos, fondos de emergencia y decisiones familiares sencillas.",
      impact: "Educación financiera familiar",
    },
  ],
  voice: {
    listen: "Escuchar",
    readAloud: "Leer en voz alta",
    stop: "Detener",
    loading: "Cargando voz...",
    playing: "Reproduciendo: toca para detener",
    readQuestion: "Leer pregunta",
    readScore: "Leer mi puntuación",
    readLearningPath: "Leer la ruta de aprendizaje",
    explainInflation: "Explicar la inflación en voz alta",
  },
  accessibility: {
    eyebrow: "Modo accesibilidad",
    title: "Educación financiera con voz primero",
    subtitle: "Diseñado para personas ciegas, con baja visión y mayores.",
    sectionCopy: "Cada acción de aprendizaje importante puede escucharse en voz alta y leerse en el mismo lugar.",
    actions: [
      {
        id: "financial-score",
        label: "Lee mi puntuación financiera",
        text: "Tu puntuación de salud financiera es 42 de 100. Tienes potencial para mejorar. Primero construiremos tu conciencia financiera y tu primer hábito de ahorro.",
      },
      {
        id: "inflation",
        label: "Explica la inflación",
        text: "Si guardaras veinte mil eslotis polacos en efectivo durante cinco años con una inflación media anual del siete por ciento, tu poder adquisitivo real podría bajar a unos catorce mil doscientos sesenta eslotis. No actuar también es una decisión financiera.",
      },
      {
        id: "next-lesson",
        label: "Empieza la siguiente lección",
        text: "Tu próxima lección es Mentalidad financiera. Aprenderás por qué ahorrar no consiste en ser rico, sino en construir un sistema sencillo y repetible.",
      },
      {
        id: "quiz-question",
        label: "Lee la pregunta del quiz",
        text: "¿Qué significa la inflación? A. El dinero compra más con el tiempo. B. El dinero pierde poder adquisitivo con el tiempo. C. Los bancos regalan dinero. D. Los precios siempre bajan.",
      },
      {
        id: "progress",
        label: "Muestra mi progreso",
        text: "Has completado una etapa, has ganado ciento veinticinco Puntos Coach FI y has desbloqueado tu primer certificado educativo.",
      },
    ],
    commandExamples: "Ejemplos de comandos de voz",
    commands: ["Lee mi puntuación financiera", "Empieza la siguiente lección", "Explica la inflación de forma sencilla", "Repite la pregunta"],
    checklistTitle: "Lista de accesibilidad",
    checklistDesc: "Decisiones de interfaz pensadas con WCAG incluidas en el MVP.",
    checklist: [
      "Botones y formularios navegables con teclado",
      "Etiquetas para lectores de pantalla y actualizaciones en vivo",
      "Estados indicados con texto, no solo con color",
      "Controles de lectura en voz alta en las pantallas principales",
    ],
    numerologyTitle: "Bonus de numerología",
    dateOfBirth: "Fecha de nacimiento",
    calculateStyle: "Calcular estilo de aprendizaje",
    enterDate: "Introduce tu fecha de nacimiento",
    uniqueStyle: "Tu estilo de aprendizaje financiero es único.",
    numerologyDisclaimer: "La numerología es una función motivacional, no un consejo financiero.",
  },
  coach: {
    heroTitle: "Mila puede hablar",
    heroCopy:
      "Coach FI lee en voz alta lecciones, preguntas del quiz e ideas financieras para apoyar a personas ciegas, con baja visión y mayores.",
    introButton: "Reproducir la presentación de Mila",
    introText:
      "Te damos la bienvenida a Coach FI. No necesitas ser rico para empezar a mejorar tu futuro financiero. Necesitas conciencia, un plan sencillo y el primer pequeño paso.",
    initialMessages: [
      "No necesitas ser rico para empezar a ahorrar. Necesitas un sistema.",
      "Tarea de hoy: aparta el 5 por ciento de tus ingresos y termina la lección sobre la inflación.",
      "Tu objetivo no es la perfección. Tu objetivo es tu primer hábito repetible.",
      "Las pensiones públicas pueden no ser suficientes. Construye tu propia resiliencia financiera, paso a paso.",
    ],
    quickActions: [
      "Explica la inflación de forma sencilla",
      "Crear mi primer hábito de ahorro",
      "¿Por qué necesito un fondo de emergencia?",
      "¿Cómo enseñar a los niños sobre el dinero?",
      "Préstamos a tipo fijo o variable",
      "¿Y si no hago nada?",
    ],
    quickReplies: {},
    fallback:
      "La confianza financiera empieza por lo básico: gastar menos de lo que ganas, crear un fondo de emergencia, entender la inflación y automatizar un pequeño hábito de ahorro. ¿Por qué paso empezamos?",
    live: "Mila IA - en vivo (Claude Haiku)",
    offline: "Mila IA - modo sin conexión/local",
    consentNotice: "El modo de IA externa está desactivado. Mila responde localmente sin enviar la conversación a un proveedor de IA.",
    changeConsent: "Cambiar consentimiento",
    speaking: "Mila está hablando",
    answering: "Mila está respondiendo",
    ready: "Mila está lista",
    voiceNote: "Su voz usa ElevenLabs cuando está configurado y la voz de tu navegador como alternativa.",
    freeQuestionNote: "Mila también entiende preguntas libres. Escribe cualquier cosa sobre finanzas personales.",
    messageLabel: "Mensaje de Mila",
  },
  learn: {
    pathVoice:
      "Tu ruta de aprendizaje empieza con Mentalidad financiera y sigue con Hábito de ahorro, Inflación y poder adquisitivo, Crédito e intereses, Fondo de emergencia, Fundamentos de la inversión a largo plazo, Jubilación y Plan financiero familiar.",
    stages: [
      { title: "Mentalidad financiera", nftLabel: "Pionero de la mentalidad" },
      { title: "Hábito de ahorro", nftLabel: "Constructor de hábitos" },
      { title: "Inflación y poder adquisitivo", nftLabel: "Consciente de la inflación" },
      { title: "Crédito, intereses y tipos", nftLabel: "Experto en crédito" },
      { title: "Fondo de emergencia", nftLabel: "Ahorrador resiliente" },
      { title: "Fundamentos de la inversión a largo plazo", nftLabel: "Insignia de inversor" },
      { title: "Jubilación y seguridad futura", nftLabel: "Planificador del futuro" },
      { title: "Plan financiero familiar", nftLabel: "Director financiero familiar" },
    ],
    answered: "preguntas respondidas",
  },
  health: {
    scoreVoice: (score) =>
      `Tu puntuación de salud financiera es ${score} de 100. Tu siguiente paso es crear un hábito de ahorro sencillo y entender cómo afecta la inflación a tu dinero.`,
    achievement: "Mi logro",
    cardDescription: "Diagnóstico educativo con datos de demostración.",
  },
  inflation: {
    title: "El efectivo puede parecer seguro mientras pierde valor.",
    description: "Mostrar, de forma emocional y visual, por qué no invertir también es una decisión financiera.",
    amount: "Importe inicial",
    years: "Periodo en años",
    rate: "Inflación media anual %",
    realValue: (years) => `Valor real estimado tras ${years} años`,
    lost: "Poder adquisitivo perdido",
    chartTitle: "Solo efectivo, hábitos o escenario de inversión",
    chartDescription: "No invertir también es una decisión financiera. La inflación hace que esa decisión salga cara.",
    voiceText: (amount, years, rate, realValue, lostValue) =>
      `Partiendo de ${amount}, tras ${years} años con una inflación media anual del ${rate} por ciento, el valor real estimado es ${realValue}. Perderías aproximadamente ${lostValue} de poder adquisitivo. No actuar también es una decisión financiera.`,
  },
  common: {
    tokens: "Puntos Coach FI",
    rewardAvailable: "Recompensa disponible",
    tokenDemo: "Saldo de puntos simulado para la historia de la demo.",
    nextAction: "Siguiente acción recomendada",
    firstFocus: "Primer foco: fondo de emergencia inicial",
    nextLesson: "Siguiente lección: inflación y poder adquisitivo",
  },
};

const fr: LocalizedContent = {
  appSubtitle: "Coach de confiance financière",
  planLabel: "Votre plan",
  scoreLabel: "Score de santé financière",
  currentGoal: "Objectif actuel",
  emergencyFund: "Épargne de précaution",
  activeModule: "Module actif",
  purchasingPower: "Pouvoir d'achat",
  proofLayer: "Couche de preuve",
  certificates: "certificats",
  hearMila: "Écouter Mila",
  homeMilaIntro:
    "Bienvenue sur Coach FI. Je suis Mila, votre coach d'éducation financière axée sur la voix. Je peux lire votre score, expliquer l'inflation, vous guider dans les leçons, lire les questions du quiz et vous aider à faire le premier petit pas.",
  demoFeedbackEyebrow: "Avis d'utilisateurs de la démo",
  demoFeedbackTitle: "Ce que les utilisateurs devraient ressentir dans la démo",
  demoFeedbackNote: "Avis fictifs pour le récit du hackathon. Ils illustrent la valeur recherchée par l'expérience.",
  userOpinions: [
    {
      name: "Anna, 54",
      role: "Apprenante malvoyante",
      quote:
        "Les boutons vocaux rendent l'application plus apaisante. Je peux entendre le score et la prochaine étape sans chercher dans tout l'écran.",
      impact: "Accessibilité axée sur la voix",
    },
    {
      name: "Marek, 31",
      role: "Épargnant débutant",
      quote:
        "L'exemple de l'inflation m'a enfin fait sentir le risque de garder des espèces. Il ne m'a pas poussé à investir ; il m'a aidé à comprendre que ne rien faire reste un choix.",
      impact: "Conscience de l'inflation",
    },
    {
      name: "Julia, 17",
      role: "Étudiante",
      quote: "Le mode de lecture du quiz est utile quand je suis fatiguée. Entendre la question et les réponses m'aide à me concentrer.",
      impact: "Narration du quiz",
    },
    {
      name: "Piotr, 42",
      role: "Parent",
      quote: "J'aime que Coach FI ne ressemble pas à une application de trading. Il parle d'habitudes, d'épargne de précaution et de décisions familiales simples.",
      impact: "Éducation financière familiale",
    },
  ],
  voice: {
    listen: "Écouter",
    readAloud: "Lire à voix haute",
    stop: "Arrêter",
    loading: "Chargement de la voix...",
    playing: "Lecture en cours : touchez pour arrêter",
    readQuestion: "Lire la question",
    readScore: "Lire mon score",
    readLearningPath: "Lire le parcours d'apprentissage",
    explainInflation: "Expliquer l'inflation à voix haute",
  },
  accessibility: {
    eyebrow: "Mode accessibilité",
    title: "Une éducation financière axée sur la voix",
    subtitle: "Conçu pour les personnes aveugles, malvoyantes et âgées.",
    sectionCopy: "Chaque action d'apprentissage importante peut être entendue à voix haute et lue au même endroit.",
    actions: [
      {
        id: "financial-score",
        label: "Lis mon score financier",
        text: "Votre score de santé financière est de 42 sur 100. Vous avez une marge de progression. Nous allons d'abord construire votre conscience financière et votre première habitude d'épargne.",
      },
      {
        id: "inflation",
        label: "Explique l'inflation",
        text: "Si vous gardiez vingt mille zlotys polonais en espèces pendant cinq ans avec une inflation annuelle moyenne de sept pour cent, votre pouvoir d'achat réel pourrait tomber à environ quatorze mille deux cent soixante zlotys. Ne pas agir est aussi une décision financière.",
      },
      {
        id: "next-lesson",
        label: "Commence la leçon suivante",
        text: "Votre prochaine leçon est État d'esprit financier. Vous apprendrez pourquoi épargner ne consiste pas à être riche, mais à construire un système simple et répétable.",
      },
      {
        id: "quiz-question",
        label: "Lis la question du quiz",
        text: "Que signifie l'inflation ? A. L'argent achète plus avec le temps. B. L'argent perd du pouvoir d'achat avec le temps. C. Les banques donnent de l'argent gratuitement. D. Les prix baissent toujours.",
      },
      {
        id: "progress",
        label: "Montre ma progression",
        text: "Vous avez terminé une étape, gagné cent vingt-cinq Points Coach FI et débloqué votre premier certificat éducatif.",
      },
    ],
    commandExamples: "Exemples de commandes vocales",
    commands: ["Lis mon score financier", "Commence la leçon suivante", "Explique l'inflation simplement", "Répète la question"],
    checklistTitle: "Liste d'accessibilité",
    checklistDesc: "Choix d'interface pensés selon les WCAG et inclus dans le MVP.",
    checklist: [
      "Boutons et formulaires utilisables au clavier",
      "Libellés pour lecteurs d'écran et mises à jour en direct",
      "États indiqués par du texte, pas seulement par la couleur",
      "Commandes de lecture à voix haute sur les principaux écrans",
    ],
    numerologyTitle: "Bonus numérologie",
    dateOfBirth: "Date de naissance",
    calculateStyle: "Calculer le style d'apprentissage",
    enterDate: "Saisissez votre date de naissance",
    uniqueStyle: "Votre style d'apprentissage financier est unique.",
    numerologyDisclaimer: "La numérologie est une fonction de motivation, pas un conseil financier.",
  },
  coach: {
    heroTitle: "Mila peut parler",
    heroCopy:
      "Coach FI lit à voix haute les leçons, les questions du quiz et les éclairages financiers pour accompagner les personnes aveugles, malvoyantes et âgées.",
    introButton: "Écouter la présentation de Mila",
    introText:
      "Bienvenue sur Coach FI. Vous n'avez pas besoin d'être riche pour commencer à améliorer votre avenir financier. Il vous faut de la lucidité, un plan simple et un premier petit pas.",
    initialMessages: [
      "Vous n'avez pas besoin d'être riche pour commencer à épargner. Il vous faut un système.",
      "Tâche du jour : mettez de côté 5 pour cent de vos revenus et terminez la leçon sur l'inflation.",
      "Votre objectif n'est pas la perfection. Votre objectif est votre première habitude répétable.",
      "Les retraites publiques pourraient ne pas suffire. Construisez votre propre résilience financière, pas à pas.",
    ],
    quickActions: [
      "Explique l'inflation simplement",
      "Créer ma première habitude d'épargne",
      "Pourquoi ai-je besoin d'une épargne de précaution ?",
      "Comment parler d'argent aux enfants ?",
      "Prêts à taux fixe ou variable",
      "Et si je ne fais rien ?",
    ],
    quickReplies: {},
    fallback:
      "La confiance financière commence par les bases : dépenser moins que ce que l'on gagne, constituer une épargne de précaution, comprendre l'inflation et automatiser une petite habitude d'épargne. Par quelle étape commençons-nous ?",
    live: "Mila IA - en direct (Claude Haiku)",
    offline: "Mila IA - mode hors ligne/local",
    consentNotice: "Le mode IA externe est désactivé. Mila répond localement sans envoyer la conversation à un fournisseur d'IA.",
    changeConsent: "Modifier le consentement",
    speaking: "Mila parle",
    answering: "Mila répond",
    ready: "Mila est prête",
    voiceNote: "Sa voix utilise ElevenLabs lorsqu'il est configuré, et la voix de votre navigateur en secours.",
    freeQuestionNote: "Mila comprend aussi les questions libres. Écrivez ce que vous voulez sur les finances personnelles.",
    messageLabel: "Message de Mila",
  },
  learn: {
    pathVoice:
      "Votre parcours d'apprentissage commence par État d'esprit financier, puis Habitude d'épargne, Inflation et pouvoir d'achat, Crédit et intérêts, Épargne de précaution, Bases de l'investissement à long terme, Retraite et Plan financier familial.",
    stages: [
      { title: "État d'esprit financier", nftLabel: "Pionnier de l'état d'esprit" },
      { title: "Habitude d'épargne", nftLabel: "Bâtisseur d'habitudes" },
      { title: "Inflation et pouvoir d'achat", nftLabel: "Conscient de l'inflation" },
      { title: "Crédit, intérêts et taux", nftLabel: "Expert du crédit" },
      { title: "Épargne de précaution", nftLabel: "Épargnant résilient" },
      { title: "Les bases de l'investissement à long terme", nftLabel: "Badge investisseur" },
      { title: "Retraite et sécurité future", nftLabel: "Planificateur d'avenir" },
      { title: "Plan financier familial", nftLabel: "Directeur financier de la famille" },
    ],
    answered: "questions répondues",
  },
  health: {
    scoreVoice: (score) =>
      `Votre score de santé financière est de ${score} sur 100. Votre prochaine étape : créer une habitude d'épargne simple et comprendre comment l'inflation affecte votre argent.`,
    achievement: "Ma réussite",
    cardDescription: "Diagnostic éducatif à partir de données de démonstration.",
  },
  inflation: {
    title: "Les espèces peuvent sembler sûres tout en perdant de la valeur.",
    description: "Montrer, de façon émotionnelle et visuelle, pourquoi ne pas investir est aussi une décision financière.",
    amount: "Montant de départ",
    years: "Durée en années",
    rate: "Inflation annuelle moyenne %",
    realValue: (years) => `Valeur réelle estimée après ${years} ans`,
    lost: "Pouvoir d'achat perdu",
    chartTitle: "Espèces seules, habitudes ou scénario d'investissement",
    chartDescription: "Ne pas investir est aussi une décision financière. L'inflation rend cette décision coûteuse.",
    voiceText: (amount, years, rate, realValue, lostValue) =>
      `En partant de ${amount}, après ${years} ans avec une inflation annuelle moyenne de ${rate} pour cent, la valeur réelle estimée est de ${realValue}. Vous perdriez environ ${lostValue} de pouvoir d'achat. Ne pas agir est aussi une décision financière.`,
  },
  common: {
    tokens: "Points Coach FI",
    rewardAvailable: "Récompense disponible",
    tokenDemo: "Solde de points fictif pour le récit de la démo.",
    nextAction: "Prochaine action recommandée",
    firstFocus: "Première priorité : une épargne de précaution de départ",
    nextLesson: "Leçon suivante : inflation et pouvoir d'achat",
  },
};

const zh: LocalizedContent = {
  appSubtitle: "财务自信教练",
  planLabel: "你的计划",
  scoreLabel: "财务健康得分",
  currentGoal: "当前目标",
  emergencyFund: "应急基金",
  activeModule: "当前模块",
  purchasingPower: "购买力",
  proofLayer: "证明层",
  certificates: "张证书",
  hearMila: "听 Mila 说",
  homeMilaIntro:
    "欢迎来到 Coach FI。我是 Mila，你的语音优先财商教育教练。我可以朗读你的得分、讲解通胀、带你学习课程、朗读测验题目，并帮你迈出第一小步。",
  demoFeedbackEyebrow: "演示用户反馈",
  demoFeedbackTitle: "用户在演示中应有的感受",
  demoFeedbackNote: "用于黑客松讲述的示例评价，展示这项体验希望带来的价值。",
  userOpinions: [
    {
      name: "Anna, 54",
      role: "低视力学习者",
      quote:
        "语音按钮让应用显得更从容。我不用在整个屏幕上寻找，就能听到得分和下一步。",
      impact: "语音优先的无障碍体验",
    },
    {
      name: "Marek, 31",
      role: "第一次存钱的人",
      quote:
        "通胀的例子终于让我感受到持有现金的风险。它没有催我去投资，而是让我明白：什么都不做也是一种选择。",
      impact: "通胀意识",
    },
    {
      name: "Julia, 17",
      role: "学生",
      quote: "累的时候，测验朗读模式很有用。听到题目和选项让我更容易集中注意力。",
      impact: "测验朗读",
    },
    {
      name: "Piotr, 42",
      role: "家长",
      quote: "我喜欢 Coach FI 不像一个交易应用。它讲的是习惯、应急基金和简单的家庭决策。",
      impact: "家庭财商教育",
    },
  ],
  voice: {
    listen: "收听",
    readAloud: "朗读",
    stop: "停止",
    loading: "正在加载语音...",
    playing: "播放中：点击停止",
    readQuestion: "朗读题目",
    readScore: "朗读我的得分",
    readLearningPath: "朗读学习路径",
    explainInflation: "朗读讲解通胀",
  },
  accessibility: {
    eyebrow: "无障碍模式",
    title: "语音优先的财商教育",
    subtitle: "为盲人、低视力和年长用户设计。",
    sectionCopy: "每一个重要的学习操作都可以在同一处听到朗读并看到文字。",
    actions: [
      {
        id: "financial-score",
        label: "朗读我的财务得分",
        text: "你的财务健康得分是 42 分（满分 100）。你有提升的潜力。我们先来建立你的财务意识和第一个储蓄习惯。",
      },
      {
        id: "inflation",
        label: "讲解通胀",
        text: "如果你把两万波兰兹罗提以现金形式存放五年，年均通胀率为百分之七，你的实际购买力可能降到大约一万四千二百六十兹罗提。不行动也是一种财务决定。",
      },
      {
        id: "next-lesson",
        label: "开始下一课",
        text: "你的下一课是“金钱心态”。你会了解到储蓄的关键不在于有钱，而在于建立一个简单、可重复的系统。",
      },
      {
        id: "quiz-question",
        label: "朗读测验题目",
        text: "通胀是什么意思？A. 钱随着时间能买到更多东西。B. 钱随着时间失去购买力。C. 银行免费送钱。D. 物价总是下降。",
      },
      {
        id: "progress",
        label: "显示我的进度",
        text: "你已完成一个阶段，获得一百二十五 Coach FI 积分，并解锁了第一张教育证书。",
      },
    ],
    commandExamples: "语音指令示例",
    commands: ["朗读我的财务得分", "开始下一课", "简单讲解通胀", "重复题目"],
    checklistTitle: "无障碍清单",
    checklistDesc: "MVP 中包含的、遵循 WCAG 理念的界面设计决策。",
    checklist: [
      "可用键盘操作的按钮和表单",
      "屏幕阅读器标签与实时更新",
      "状态用文字标示，而不只靠颜色",
      "主要页面都有朗读控件",
    ],
    numerologyTitle: "数字命理彩蛋",
    dateOfBirth: "出生日期",
    calculateStyle: "计算学习风格",
    enterDate: "输入你的出生日期",
    uniqueStyle: "你的理财学习风格独一无二。",
    numerologyDisclaimer: "数字命理是一项激励功能，不是理财建议。",
  },
  coach: {
    heroTitle: "Mila 会说话",
    heroCopy:
      "Coach FI 会朗读课程、测验题目和理财洞见，帮助盲人、低视力和年长用户。",
    introButton: "播放 Mila 的自我介绍",
    introText:
      "欢迎来到 Coach FI。你不需要很有钱才能开始改善财务未来。你需要的是觉察、一个简单的计划和第一小步。",
    initialMessages: [
      "你不需要很有钱才能开始存钱。你需要的是一个系统。",
      "今日任务：留出收入的 5%，并完成通胀课程。",
      "你的目标不是完美。你的目标是第一个可重复的习惯。",
      "公共养老金可能不够。一步一步建立你自己的财务韧性。",
    ],
    quickActions: [
      "简单讲解通胀",
      "建立我的第一个储蓄习惯",
      "我为什么需要应急基金？",
      "怎样教孩子理财？",
      "固定利率与浮动利率贷款",
      "如果我什么都不做会怎样？",
    ],
    quickReplies: {},
    fallback:
      "财务自信从基础开始：花得比赚得少、建立应急基金、了解通胀，并让一个小的储蓄习惯自动化。我们从哪一步开始？",
    live: "Mila AI - 在线（Claude Haiku）",
    offline: "Mila AI - 离线/本地模式",
    consentNotice: "外部 AI 模式已关闭。Mila 在本地回答，不会把对话发送给 AI 服务商。",
    changeConsent: "更改授权",
    speaking: "Mila 正在说话",
    answering: "Mila 正在回答",
    ready: "Mila 已就绪",
    voiceNote: "已配置时她的声音使用 ElevenLabs，否则使用浏览器语音作为备用。",
    freeQuestionNote: "Mila 也能理解自由提问。关于个人理财，想问什么都可以输入。",
    messageLabel: "Mila 的消息",
  },
  learn: {
    pathVoice:
      "你的学习路径从“金钱心态”开始，接着是储蓄习惯、通胀与购买力、信贷与利息、应急基金、长期投资基础、退休，以及家庭财务计划。",
    stages: [
      { title: "金钱心态", nftLabel: "心态先锋" },
      { title: "储蓄习惯", nftLabel: "习惯养成者" },
      { title: "通胀与购买力", nftLabel: "通胀觉察者" },
      { title: "信贷、利息与利率", nftLabel: "信贷达人" },
      { title: "应急基金", nftLabel: "稳健储蓄者" },
      { title: "长期投资基础", nftLabel: "投资者徽章" },
      { title: "退休与未来保障", nftLabel: "未来规划师" },
      { title: "家庭财务计划", nftLabel: "家庭 CFO" },
    ],
    answered: "道题已作答",
  },
  health: {
    scoreVoice: (score) =>
      `你的财务健康得分是 ${score} 分（满分 100）。下一步是养成一个简单的储蓄习惯，并了解通胀如何影响你的钱。`,
    achievement: "我的成就",
    cardDescription: "使用演示数据的教育性诊断。",
  },
  inflation: {
    title: "现金看似安全，却在悄悄贬值。",
    description: "从情感和视觉上展示：不投资同样是一种财务决定。",
    amount: "起始金额",
    years: "年限",
    rate: "年均通胀率 %",
    realValue: (years) => `${years} 年后的预计实际价值`,
    lost: "损失的购买力",
    chartTitle: "仅现金、储蓄习惯与投资情景对比",
    chartDescription: "不投资也是一种财务决定。通胀让这个决定代价高昂。",
    voiceText: (amount, years, rate, realValue, lostValue) =>
      `以 ${amount} 起步，经过 ${years} 年、年均通胀率 ${rate}%，预计实际价值为 ${realValue}。你将损失约 ${lostValue} 的购买力。不行动也是一种财务决定。`,
  },
  common: {
    tokens: "Coach FI 积分",
    rewardAvailable: "奖励可领取",
    tokenDemo: "用于演示故事的模拟积分余额。",
    nextAction: "下一步建议行动",
    firstFocus: "首要重点：起步应急基金",
    nextLesson: "下一课：通胀与购买力",
  },
};

const ja: LocalizedContent = {
  appSubtitle: "お金の自信を育てるコーチ",
  planLabel: "あなたのプラン",
  scoreLabel: "家計の健康スコア",
  currentGoal: "現在の目標",
  emergencyFund: "緊急資金",
  activeModule: "学習中のモジュール",
  purchasingPower: "購買力",
  proofLayer: "証明レイヤー",
  certificates: "件の証明書",
  hearMila: "Milaの声を聞く",
  homeMilaIntro:
    "Coach FIへようこそ。私はMila、音声を中心にした金融教育コーチです。スコアの読み上げ、インフレの説明、レッスンの案内、クイズの読み上げ、そして最初の小さな一歩のお手伝いができます。",
  demoFeedbackEyebrow: "デモユーザーの声",
  demoFeedbackTitle: "デモでユーザーに感じてほしいこと",
  demoFeedbackNote: "ハッカソンでの紹介用のサンプルの声です。この体験が目指す価値を示しています。",
  userOpinions: [
    {
      name: "Anna, 54",
      role: "弱視の学習者",
      quote:
        "音声ボタンのおかげで、アプリを落ち着いて使えます。画面全体を探さなくても、スコアと次のステップを聞けます。",
      impact: "音声中心のアクセシビリティ",
    },
    {
      name: "Marek, 31",
      role: "はじめて貯蓄する人",
      quote:
        "インフレの例で、現金のリスクをやっと実感できました。投資を急かされることはなく、何もしないことも一つの選択だと理解できました。",
      impact: "インフレへの気づき",
    },
    {
      name: "Julia, 17",
      role: "学生",
      quote: "疲れているときはクイズの読み上げモードが便利です。問題と選択肢を聞くと集中しやすくなります。",
      impact: "クイズの読み上げ",
    },
    {
      name: "Piotr, 42",
      role: "保護者",
      quote: "Coach FIがトレーディングアプリのように感じられないところが好きです。習慣、緊急資金、家族のシンプルな判断について話してくれます。",
      impact: "家族の金融教育",
    },
  ],
  voice: {
    listen: "聞く",
    readAloud: "読み上げる",
    stop: "停止",
    loading: "音声を読み込み中...",
    playing: "再生中：タップで停止",
    readQuestion: "問題を読み上げる",
    readScore: "スコアを読み上げる",
    readLearningPath: "学習パスを読み上げる",
    explainInflation: "インフレを音声で説明",
  },
  accessibility: {
    eyebrow: "アクセシビリティモード",
    title: "音声中心の金融教育",
    subtitle: "視覚障害のある方、弱視の方、高齢の方のために設計されています。",
    sectionCopy: "大切な学習操作はすべて、同じ場所で音声でも文字でも確認できます。",
    actions: [
      {
        id: "financial-score",
        label: "スコアを読み上げて",
        text: "あなたの家計の健康スコアは100点中42点です。伸びしろがあります。まずはお金への意識と最初の貯蓄習慣を作りましょう。",
      },
      {
        id: "inflation",
        label: "インフレを説明して",
        text: "2万ポーランドズロチを現金のまま5年間持ち、年平均インフレ率が7パーセントだった場合、実質的な購買力は約1万4260ズロチまで下がる可能性があります。行動しないことも、お金に関する一つの判断です。",
      },
      {
        id: "next-lesson",
        label: "次のレッスンを始めて",
        text: "次のレッスンは「お金のマインドセット」です。貯蓄はお金持ちになることではなく、シンプルで続けられる仕組みを作ることだと学びます。",
      },
      {
        id: "quiz-question",
        label: "クイズの問題を読んで",
        text: "インフレとは何でしょう？A. 時間とともにお金で買えるものが増える。B. 時間とともにお金の購買力が下がる。C. 銀行が無料でお金をくれる。D. 物価は常に下がる。",
      },
      {
        id: "progress",
        label: "進み具合を表示して",
        text: "1つのステージを完了し、125 Coach FIポイントを獲得して、最初の学習証明書を解放しました。",
      },
    ],
    commandExamples: "音声コマンドの例",
    commands: ["スコアを読み上げて", "次のレッスンを始めて", "インフレをわかりやすく説明して", "問題をもう一度"],
    checklistTitle: "アクセシビリティのチェックリスト",
    checklistDesc: "MVPに含まれる、WCAGを意識した画面設計の判断です。",
    checklist: [
      "キーボードで操作できるボタンとフォーム",
      "スクリーンリーダー用ラベルとライブ更新",
      "状態は色だけでなく文字でも表示",
      "主要な画面すべてに読み上げ操作",
    ],
    numerologyTitle: "数秘術ボーナス",
    dateOfBirth: "生年月日",
    calculateStyle: "学習スタイルを調べる",
    enterDate: "生年月日を入力してください",
    uniqueStyle: "あなたのお金の学び方は、あなただけのものです。",
    numerologyDisclaimer: "数秘術は意欲を高めるための機能で、金融アドバイスではありません。",
  },
  coach: {
    heroTitle: "Milaは話せます",
    heroCopy:
      "Coach FIは、視覚障害のある方、弱視の方、高齢の方を支えるために、レッスン、クイズの問題、お金のヒントを読み上げます。",
    introButton: "Milaの自己紹介を再生",
    introText:
      "Coach FIへようこそ。お金の未来を良くし始めるのに、お金持ちである必要はありません。必要なのは気づきと、シンプルな計画と、最初の小さな一歩です。",
    initialMessages: [
      "貯蓄を始めるのにお金持ちである必要はありません。必要なのは仕組みです。",
      "今日の課題：収入の5パーセントを取り分けて、インフレのレッスンを終えましょう。",
      "目標は完璧ではありません。最初の続けられる習慣が目標です。",
      "公的年金だけでは足りないかもしれません。一歩ずつ、自分自身のお金の備えを築きましょう。",
    ],
    quickActions: [
      "インフレをわかりやすく説明して",
      "最初の貯蓄習慣を作りたい",
      "なぜ緊急資金が必要？",
      "子どもにお金をどう教える？",
      "固定金利と変動金利のローン",
      "何もしなかったらどうなる？",
    ],
    quickReplies: {},
    fallback:
      "お金の自信は基本から始まります。収入より少なく使う、緊急資金を作る、インフレを理解する、小さな貯蓄習慣を自動化する。どのステップから始めましょうか？",
    live: "Mila AI - ライブ（Claude Haiku）",
    offline: "Mila AI - オフライン/ローカルモード",
    consentNotice: "外部AIモードはオフです。Milaは会話をAIプロバイダーに送らず、ローカルで答えます。",
    changeConsent: "同意を変更",
    speaking: "Milaが話しています",
    answering: "Milaが回答中です",
    ready: "Milaの準備ができました",
    voiceNote: "設定されている場合はElevenLabsの音声を使い、それ以外はブラウザの音声を使います。",
    freeQuestionNote: "Milaは自由な質問にも答えます。家計やお金について何でも入力してください。",
    messageLabel: "Milaのメッセージ",
  },
  learn: {
    pathVoice:
      "学習パスは「お金のマインドセット」から始まり、貯蓄の習慣、インフレと購買力、クレジットと金利、緊急資金、長期投資の基礎、老後、そして家族のマネープランへと進みます。",
    stages: [
      { title: "お金のマインドセット", nftLabel: "マインドセットの先駆者" },
      { title: "貯蓄の習慣", nftLabel: "習慣ビルダー" },
      { title: "インフレと購買力", nftLabel: "インフレを知る人" },
      { title: "クレジット、金利とレート", nftLabel: "クレジット上手" },
      { title: "緊急資金", nftLabel: "しなやかな貯蓄家" },
      { title: "長期投資の基礎", nftLabel: "投資家バッジ" },
      { title: "老後と将来の安心", nftLabel: "未来プランナー" },
      { title: "家族のマネープラン", nftLabel: "家族のCFO" },
    ],
    answered: "問に回答済み",
  },
  health: {
    scoreVoice: (score) =>
      `あなたの家計の健康スコアは100点中${score}点です。次のステップは、シンプルな貯蓄習慣を作り、インフレがお金にどう影響するかを理解することです。`,
    achievement: "私の実績",
    cardDescription: "デモデータを使った学習用の診断です。",
  },
  inflation: {
    title: "現金は安全に見えても、価値を失っていきます。",
    description: "投資しないこともお金に関する判断だということを、感情と視覚の両方で伝えます。",
    amount: "開始金額",
    years: "期間（年）",
    rate: "年平均インフレ率 %",
    realValue: (years) => `${years}年後の推定実質価値`,
    lost: "失われた購買力",
    chartTitle: "現金のみ・貯蓄習慣・投資シナリオの比較",
    chartDescription: "投資しないことも、お金に関する判断です。インフレはその判断を高くつくものにします。",
    voiceText: (amount, years, rate, realValue, lostValue) =>
      `${amount}から始めて、年平均インフレ率${rate}パーセントで${years}年たつと、推定実質価値は${realValue}になります。約${lostValue}の購買力を失うことになります。行動しないことも、お金に関する一つの判断です。`,
  },
  common: {
    tokens: "Coach FIポイント",
    rewardAvailable: "報酬を受け取れます",
    tokenDemo: "デモ用のサンプルのポイント残高です。",
    nextAction: "次のおすすめアクション",
    firstFocus: "最初の重点：はじめの緊急資金",
    nextLesson: "次のレッスン：インフレと購買力",
  },
};

const hi: LocalizedContent = {
  appSubtitle: "वित्तीय आत्मविश्वास कोच",
  planLabel: "आपकी योजना",
  scoreLabel: "वित्तीय सेहत स्कोर",
  currentGoal: "मौजूदा लक्ष्य",
  emergencyFund: "आपातकालीन फंड",
  activeModule: "सक्रिय मॉड्यूल",
  purchasingPower: "क्रय शक्ति",
  proofLayer: "प्रमाण परत",
  certificates: "सर्टिफ़िकेट",
  hearMila: "Mila को सुनें",
  homeMilaIntro:
    "Coach FI में आपका स्वागत है। मैं Mila हूं, आपकी वॉइस-फ़र्स्ट वित्तीय शिक्षा कोच। मैं आपका स्कोर पढ़ सकती हूं, महंगाई समझा सकती हूं, पाठों में मार्गदर्शन कर सकती हूं, क्विज़ के सवाल पढ़ सकती हूं और पहला छोटा कदम उठाने में आपकी मदद कर सकती हूं।",
  demoFeedbackEyebrow: "डेमो उपयोगकर्ताओं की राय",
  demoFeedbackTitle: "डेमो में उपयोगकर्ताओं को क्या महसूस होना चाहिए",
  demoFeedbackNote: "हैकथॉन की कहानी के लिए नमूना राय। ये इस अनुभव का अपेक्षित मूल्य दिखाती हैं।",
  userOpinions: [
    {
      name: "Anna, 54",
      role: "कम दृष्टि वाली शिक्षार्थी",
      quote:
        "वॉइस बटन ऐप को ज़्यादा शांत महसूस कराते हैं। मैं पूरी स्क्रीन खोजे बिना स्कोर और अगला कदम सुन सकती हूं।",
      impact: "वॉइस-फ़र्स्ट सुलभता",
    },
    {
      name: "Marek, 31",
      role: "पहली बार बचत करने वाला",
      quote:
        "महंगाई के उदाहरण ने आखिरकार नकदी का जोखिम असली महसूस कराया। इसने मुझे निवेश की ओर नहीं धकेला; इसने समझाया कि कुछ न करना भी एक चुनाव है।",
      impact: "महंगाई की समझ",
    },
    {
      name: "Julia, 17",
      role: "छात्रा",
      quote: "थकान होने पर क्विज़ पढ़कर सुनाने वाला मोड काम आता है। सवाल और जवाब सुनने से ध्यान लगाना आसान हो जाता है।",
      impact: "क्विज़ का वर्णन",
    },
    {
      name: "Piotr, 42",
      role: "अभिभावक",
      quote: "मुझे अच्छा लगता है कि Coach FI ट्रेडिंग ऐप जैसा नहीं लगता। यह आदतों, आपातकालीन फंड और परिवार के सरल फ़ैसलों की बात करता है।",
      impact: "पारिवारिक वित्तीय शिक्षा",
    },
  ],
  voice: {
    listen: "सुनें",
    readAloud: "ज़ोर से पढ़ें",
    stop: "रोकें",
    loading: "आवाज़ लोड हो रही है...",
    playing: "चल रहा है: रोकने के लिए टैप करें",
    readQuestion: "सवाल पढ़ें",
    readScore: "मेरा स्कोर पढ़ें",
    readLearningPath: "सीखने का रास्ता पढ़ें",
    explainInflation: "महंगाई बोलकर समझाएं",
  },
  accessibility: {
    eyebrow: "सुलभता मोड",
    title: "वॉइस-फ़र्स्ट वित्तीय शिक्षा",
    subtitle: "दृष्टिबाधित, कम दृष्टि वाले और बुज़ुर्ग उपयोगकर्ताओं के लिए बनाया गया।",
    sectionCopy: "सीखने का हर ज़रूरी काम एक ही जगह पर सुना भी जा सकता है और पढ़ा भी जा सकता है।",
    actions: [
      {
        id: "financial-score",
        label: "मेरा वित्तीय स्कोर पढ़ो",
        text: "आपका वित्तीय सेहत स्कोर 100 में से 42 है। आपमें सुधार की संभावना है। पहले हम आपकी वित्तीय जागरूकता और बचत की पहली आदत बनाएंगे।",
      },
      {
        id: "inflation",
        label: "महंगाई समझाओ",
        text: "अगर आप बीस हज़ार पोलिश ज़्लॉटी को पांच साल तक नकद रखें और औसत सालाना महंगाई सात प्रतिशत हो, तो आपकी असली क्रय शक्ति घटकर लगभग चौदह हज़ार दो सौ साठ ज़्लॉटी रह सकती है। कुछ न करना भी एक वित्तीय फ़ैसला है।",
      },
      {
        id: "next-lesson",
        label: "अगला पाठ शुरू करो",
        text: "आपका अगला पाठ है पैसे की सोच। आप सीखेंगे कि बचत अमीर होने के बारे में नहीं है। यह एक सरल, दोहराई जा सकने वाली व्यवस्था बनाने के बारे में है।",
      },
      {
        id: "quiz-question",
        label: "क्विज़ का सवाल पढ़ो",
        text: "महंगाई का क्या मतलब है? A. समय के साथ पैसा ज़्यादा खरीदता है। B. समय के साथ पैसे की क्रय शक्ति घटती है। C. बैंक मुफ़्त पैसा देते हैं। D. कीमतें हमेशा घटती हैं।",
      },
      {
        id: "progress",
        label: "मेरी प्रगति दिखाओ",
        text: "आपने एक चरण पूरा किया है, एक सौ पच्चीस Coach FI पॉइंट कमाए हैं और अपना पहला शिक्षा सर्टिफ़िकेट अनलॉक किया है।",
      },
    ],
    commandExamples: "वॉइस कमांड के उदाहरण",
    commands: ["मेरा वित्तीय स्कोर पढ़ो", "अगला पाठ शुरू करो", "महंगाई सरल शब्दों में समझाओ", "सवाल दोहराओ"],
    checklistTitle: "सुलभता चेकलिस्ट",
    checklistDesc: "MVP में शामिल, WCAG को ध्यान में रखकर लिए गए इंटरफ़ेस के फ़ैसले।",
    checklist: [
      "कीबोर्ड से चलने वाले बटन और फ़ॉर्म",
      "स्क्रीन रीडर के लेबल और लाइव अपडेट",
      "स्थिति सिर्फ़ रंग से नहीं, टेक्स्ट से भी बताई जाती है",
      "मुख्य स्क्रीन पर ज़ोर से पढ़ने के नियंत्रण",
    ],
    numerologyTitle: "अंक ज्योतिष बोनस",
    dateOfBirth: "जन्मतिथि",
    calculateStyle: "सीखने की शैली निकालें",
    enterDate: "अपनी जन्मतिथि डालें",
    uniqueStyle: "आपकी वित्तीय सीखने की शैली अनोखी है।",
    numerologyDisclaimer: "अंक ज्योतिष एक प्रेरक सुविधा है, वित्तीय सलाह नहीं।",
  },
  coach: {
    heroTitle: "Mila बोल सकती है",
    heroCopy:
      "Coach FI दृष्टिबाधित, कम दृष्टि वाले और बुज़ुर्ग उपयोगकर्ताओं की मदद के लिए पाठ, क्विज़ के सवाल और वित्तीय जानकारी ज़ोर से पढ़ता है।",
    introButton: "Mila का परिचय चलाएं",
    introText:
      "Coach FI में आपका स्वागत है। अपना वित्तीय भविष्य बेहतर बनाना शुरू करने के लिए आपको अमीर होने की ज़रूरत नहीं है। आपको जागरूकता, एक सरल योजना और पहला छोटा कदम चाहिए।",
    initialMessages: [
      "बचत शुरू करने के लिए अमीर होना ज़रूरी नहीं है। आपको एक व्यवस्था चाहिए।",
      "आज का काम: अपनी आय का 5 प्रतिशत अलग रखें और महंगाई वाला पाठ पूरा करें।",
      "आपका लक्ष्य पूर्णता नहीं है। आपका लक्ष्य आपकी पहली दोहराई जा सकने वाली आदत है।",
      "सरकारी पेंशन काफ़ी नहीं हो सकती। कदम-दर-कदम अपनी वित्तीय मज़बूती खुद बनाएं।",
    ],
    quickActions: [
      "महंगाई सरल शब्दों में समझाओ",
      "मेरी बचत की पहली आदत बनाओ",
      "मुझे आपातकालीन फंड क्यों चाहिए?",
      "बच्चों को पैसे के बारे में कैसे सिखाएं?",
      "फ़िक्स्ड बनाम फ़्लोटिंग दर वाले लोन",
      "अगर मैं कुछ न करूं तो क्या होगा?",
    ],
    quickReplies: {},
    fallback:
      "वित्तीय आत्मविश्वास बुनियादी बातों से शुरू होता है: कमाई से कम खर्च करें, आपातकालीन फंड बनाएं, महंगाई को समझें और बचत की एक छोटी आदत को स्वचालित करें। हम किस कदम से शुरू करें?",
    live: "Mila AI - लाइव (Claude Haiku)",
    offline: "Mila AI - ऑफ़लाइन/स्थानीय मोड",
    consentNotice: "बाहरी AI मोड बंद है। Mila बातचीत को किसी AI प्रदाता को भेजे बिना स्थानीय रूप से जवाब देती है।",
    changeConsent: "सहमति बदलें",
    speaking: "Mila बोल रही है",
    answering: "Mila जवाब दे रही है",
    ready: "Mila तैयार है",
    voiceNote: "कॉन्फ़िगर होने पर उसकी आवाज़ ElevenLabs का उपयोग करती है, नहीं तो आपके ब्राउज़र की आवाज़ का।",
    freeQuestionNote: "Mila खुले सवाल भी समझती है। व्यक्तिगत वित्त के बारे में कुछ भी लिखें।",
    messageLabel: "Mila का संदेश",
  },
  learn: {
    pathVoice:
      "आपका सीखने का रास्ता पैसे की सोच से शुरू होता है, फिर बचत की आदत, महंगाई और क्रय शक्ति, क्रेडिट और ब्याज, आपातकालीन फंड, लंबी अवधि के निवेश की बुनियाद, रिटायरमेंट और पारिवारिक वित्तीय योजना आते हैं।",
    stages: [
      { title: "पैसे की सोच", nftLabel: "सोच के अग्रदूत" },
      { title: "बचत की आदत", nftLabel: "आदत निर्माता" },
      { title: "महंगाई और क्रय शक्ति", nftLabel: "महंगाई के प्रति जागरूक" },
      { title: "क्रेडिट, ब्याज और दरें", nftLabel: "क्रेडिट के जानकार" },
      { title: "आपातकालीन फंड", nftLabel: "मज़बूत बचतकर्ता" },
      { title: "लंबी अवधि के निवेश की बुनियाद", nftLabel: "निवेशक बैज" },
      { title: "रिटायरमेंट और भविष्य की सुरक्षा", nftLabel: "भविष्य के योजनाकार" },
      { title: "पारिवारिक वित्तीय योजना", nftLabel: "परिवार के CFO" },
    ],
    answered: "सवालों के जवाब दिए",
  },
  health: {
    scoreVoice: (score) =>
      `आपका वित्तीय सेहत स्कोर 100 में से ${score} है। आपका अगला कदम बचत की एक सरल आदत बनाना और यह समझना है कि महंगाई आपके पैसे पर कैसे असर डालती है।`,
    achievement: "मेरी उपलब्धि",
    cardDescription: "डेमो डेटा पर आधारित शैक्षिक जांच।",
  },
  inflation: {
    title: "नकदी सुरक्षित लग सकती है, जबकि उसकी ताकत घटती रहती है।",
    description: "भावनात्मक और दृश्य रूप से दिखाएं कि निवेश न करना भी एक वित्तीय फ़ैसला है।",
    amount: "शुरुआती राशि",
    years: "अवधि (साल में)",
    rate: "औसत सालाना महंगाई %",
    realValue: (years) => `${years} साल बाद अनुमानित असली मूल्य`,
    lost: "खोई हुई क्रय शक्ति",
    chartTitle: "सिर्फ़ नकदी बनाम आदतें बनाम निवेश की स्थिति",
    chartDescription: "निवेश न करना भी एक वित्तीय फ़ैसला है। महंगाई इस फ़ैसले को महंगा बना देती है।",
    voiceText: (amount, years, rate, realValue, lostValue) =>
      `${amount} से शुरू करने पर, ${years} साल बाद ${rate} प्रतिशत औसत सालाना महंगाई के साथ अनुमानित असली मूल्य ${realValue} है। आप लगभग ${lostValue} क्रय शक्ति खो देंगे। कुछ न करना भी एक वित्तीय फ़ैसला है।`,
  },
  common: {
    tokens: "Coach FI पॉइंट",
    rewardAvailable: "इनाम उपलब्ध है",
    tokenDemo: "डेमो की कहानी के लिए नमूना पॉइंट बैलेंस।",
    nextAction: "अगला सुझाया गया कदम",
    firstFocus: "पहला ध्यान: शुरुआती आपातकालीन फंड",
    nextLesson: "अगला पाठ: महंगाई और क्रय शक्ति",
  },
};

const ptBR: LocalizedContent = {
  appSubtitle: "Coach de confiança financeira",
  planLabel: "Seu plano",
  scoreLabel: "Pontuação de saúde financeira",
  currentGoal: "Meta atual",
  emergencyFund: "Reserva de emergência",
  activeModule: "Módulo ativo",
  purchasingPower: "Poder de compra",
  proofLayer: "Camada de prova",
  certificates: "certificados",
  hearMila: "Ouça a Mila",
  homeMilaIntro:
    "Boas-vindas ao Coach FI. Eu sou a Mila, sua coach de educação financeira com voz em primeiro lugar. Posso ler sua pontuação, explicar a inflação, guiar as aulas, ler as perguntas do quiz e ajudar você a dar o primeiro pequeno passo.",
  demoFeedbackEyebrow: "Opiniões de usuários da demo",
  demoFeedbackTitle: "O que os usuários devem sentir na demo",
  demoFeedbackNote: "Opiniões de exemplo para a narrativa do hackathon. Elas mostram o valor que a experiência pretende entregar.",
  userOpinions: [
    {
      name: "Anna, 54",
      role: "Aluna com baixa visão",
      quote:
        "Os botões de voz deixam o app mais tranquilo. Consigo ouvir a pontuação e o próximo passo sem procurar pela tela inteira.",
      impact: "Acessibilidade com voz em primeiro lugar",
    },
    {
      name: "Marek, 31",
      role: "Poupador de primeira viagem",
      quote:
        "O exemplo da inflação finalmente fez o risco do dinheiro parado parecer real. Não me empurrou para investir; me ajudou a entender que não fazer nada também é uma escolha.",
      impact: "Consciência sobre a inflação",
    },
    {
      name: "Julia, 17",
      role: "Estudante",
      quote: "O modo de leitura do quiz é útil quando estou cansada. Ouvir a pergunta e as respostas me ajuda a manter o foco.",
      impact: "Narração do quiz",
    },
    {
      name: "Piotr, 42",
      role: "Pai",
      quote: "Gosto que o Coach FI não parece um app de trading. Ele fala de hábitos, reserva de emergência e decisões simples da família.",
      impact: "Educação financeira familiar",
    },
  ],
  voice: {
    listen: "Ouvir",
    readAloud: "Ler em voz alta",
    stop: "Parar",
    loading: "Carregando voz...",
    playing: "Tocando: toque para parar",
    readQuestion: "Ler pergunta",
    readScore: "Ler minha pontuação",
    readLearningPath: "Ler a trilha de aprendizado",
    explainInflation: "Explicar a inflação em voz alta",
  },
  accessibility: {
    eyebrow: "Modo acessibilidade",
    title: "Educação financeira com voz em primeiro lugar",
    subtitle: "Pensado para pessoas cegas, com baixa visão e idosas.",
    sectionCopy: "Toda ação importante de aprendizado pode ser ouvida em voz alta e lida no mesmo lugar.",
    actions: [
      {
        id: "financial-score",
        label: "Leia minha pontuação financeira",
        text: "Sua pontuação de saúde financeira é 42 de 100. Você tem potencial para melhorar. Primeiro vamos construir sua consciência financeira e seu primeiro hábito de poupar.",
      },
      {
        id: "inflation",
        label: "Explique a inflação",
        text: "Se você guardasse vinte mil zlotys poloneses em dinheiro por cinco anos com inflação média anual de sete por cento, seu poder de compra real poderia cair para cerca de quatorze mil duzentos e sessenta zlotys. Não agir também é uma decisão financeira.",
      },
      {
        id: "next-lesson",
        label: "Comece a próxima aula",
        text: "Sua próxima aula é Mentalidade financeira. Você vai aprender por que poupar não é questão de ser rico, e sim de construir um sistema simples e repetível.",
      },
      {
        id: "quiz-question",
        label: "Leia a pergunta do quiz",
        text: "O que significa inflação? A. O dinheiro compra mais com o tempo. B. O dinheiro perde poder de compra com o tempo. C. Os bancos dão dinheiro de graça. D. Os preços sempre caem.",
      },
      {
        id: "progress",
        label: "Mostre meu progresso",
        text: "Você concluiu uma etapa, ganhou cento e vinte e cinco Pontos Coach FI e desbloqueou seu primeiro certificado educacional.",
      },
    ],
    commandExamples: "Exemplos de comandos de voz",
    commands: ["Leia minha pontuação financeira", "Comece a próxima aula", "Explique a inflação de forma simples", "Repita a pergunta"],
    checklistTitle: "Checklist de acessibilidade",
    checklistDesc: "Decisões de interface pensadas com base nas WCAG incluídas no MVP.",
    checklist: [
      "Botões e formulários navegáveis pelo teclado",
      "Rótulos para leitores de tela e atualizações ao vivo",
      "Status indicado em texto, não só por cor",
      "Controles de leitura em voz alta nas principais telas",
    ],
    numerologyTitle: "Bônus de numerologia",
    dateOfBirth: "Data de nascimento",
    calculateStyle: "Calcular estilo de aprendizado",
    enterDate: "Digite sua data de nascimento",
    uniqueStyle: "Seu estilo de aprendizado financeiro é único.",
    numerologyDisclaimer: "A numerologia é um recurso motivacional, não um conselho financeiro.",
  },
  coach: {
    heroTitle: "A Mila fala",
    heroCopy:
      "O Coach FI lê em voz alta aulas, perguntas do quiz e ideias financeiras para apoiar pessoas cegas, com baixa visão e idosas.",
    introButton: "Tocar a apresentação da Mila",
    introText:
      "Boas-vindas ao Coach FI. Você não precisa ser rico para começar a melhorar seu futuro financeiro. Precisa de consciência, um plano simples e o primeiro pequeno passo.",
    initialMessages: [
      "Você não precisa ser rico para começar a poupar. Precisa de um sistema.",
      "Tarefa de hoje: separe 5 por cento da sua renda e conclua a aula sobre inflação.",
      "Sua meta não é a perfeição. Sua meta é o seu primeiro hábito repetível.",
      "A previdência pública pode não ser suficiente. Construa sua própria resiliência financeira, passo a passo.",
    ],
    quickActions: [
      "Explique a inflação de forma simples",
      "Criar meu primeiro hábito de poupar",
      "Por que preciso de uma reserva de emergência?",
      "Como ensinar crianças sobre dinheiro?",
      "Empréstimos com taxa fixa ou variável",
      "E se eu não fizer nada?",
    ],
    quickReplies: {},
    fallback:
      "A confiança financeira começa pelo básico: gastar menos do que você ganha, montar uma reserva de emergência, entender a inflação e automatizar um pequeno hábito de poupar. Por qual passo começamos?",
    live: "Mila IA - ao vivo (Claude Haiku)",
    offline: "Mila IA - modo offline/local",
    consentNotice: "O modo de IA externa está desligado. A Mila responde localmente, sem enviar a conversa a um provedor de IA.",
    changeConsent: "Alterar consentimento",
    speaking: "A Mila está falando",
    answering: "A Mila está respondendo",
    ready: "A Mila está pronta",
    voiceNote: "A voz dela usa a ElevenLabs quando configurada e a voz do seu navegador como alternativa.",
    freeQuestionNote: "A Mila também entende perguntas livres. Digite qualquer coisa sobre finanças pessoais.",
    messageLabel: "Mensagem da Mila",
  },
  learn: {
    pathVoice:
      "Sua trilha de aprendizado começa com Mentalidade financeira e segue com Hábito de poupar, Inflação e poder de compra, Crédito e juros, Reserva de emergência, Fundamentos do investimento de longo prazo, Aposentadoria e Plano financeiro familiar.",
    stages: [
      { title: "Mentalidade financeira", nftLabel: "Pioneiro da mentalidade" },
      { title: "Hábito de poupar", nftLabel: "Construtor de hábitos" },
      { title: "Inflação e poder de compra", nftLabel: "Atento à inflação" },
      { title: "Crédito, juros e taxas", nftLabel: "Craque do crédito" },
      { title: "Reserva de emergência", nftLabel: "Poupador resiliente" },
      { title: "Fundamentos do investimento de longo prazo", nftLabel: "Selo de investidor" },
      { title: "Aposentadoria e segurança futura", nftLabel: "Planejador do futuro" },
      { title: "Plano financeiro familiar", nftLabel: "CFO da família" },
    ],
    answered: "perguntas respondidas",
  },
  health: {
    scoreVoice: (score) =>
      `Sua pontuação de saúde financeira é ${score} de 100. Seu próximo passo é criar um hábito simples de poupar e entender como a inflação afeta o seu dinheiro.`,
    achievement: "Minha conquista",
    cardDescription: "Diagnóstico educacional com dados de demonstração.",
  },
  inflation: {
    title: "O dinheiro parado pode parecer seguro enquanto perde valor.",
    description: "Mostrar, de forma emocional e visual, por que não investir também é uma decisão financeira.",
    amount: "Valor inicial",
    years: "Período em anos",
    rate: "Inflação média anual %",
    realValue: (years) => `Valor real estimado após ${years} anos`,
    lost: "Poder de compra perdido",
    chartTitle: "Só dinheiro parado, hábitos ou cenário de investimento",
    chartDescription: "Não investir também é uma decisão financeira. A inflação torna essa decisão cara.",
    voiceText: (amount, years, rate, realValue, lostValue) =>
      `Começando com ${amount}, depois de ${years} anos com inflação média anual de ${rate} por cento, o valor real estimado é ${realValue}. Você perderia cerca de ${lostValue} de poder de compra. Não agir também é uma decisão financeira.`,
  },
  common: {
    tokens: "Pontos Coach FI",
    rewardAvailable: "Recompensa disponível",
    tokenDemo: "Saldo de pontos fictício para a história da demo.",
    nextAction: "Próxima ação recomendada",
    firstFocus: "Primeiro foco: reserva de emergência inicial",
    nextLesson: "Próxima aula: inflação e poder de compra",
  },
};

const tr: LocalizedContent = {
  appSubtitle: "Finansal özgüven koçu",
  planLabel: "Planın",
  scoreLabel: "Finansal sağlık puanı",
  currentGoal: "Mevcut hedef",
  emergencyFund: "Acil durum fonu",
  activeModule: "Etkin modül",
  purchasingPower: "Alım gücü",
  proofLayer: "Kanıt katmanı",
  certificates: "sertifika",
  hearMila: "Mila'yı dinle",
  homeMilaIntro:
    "Coach FI'a hoş geldin. Ben Mila, ses öncelikli finansal eğitim koçunum. Puanını okuyabilir, enflasyonu açıklayabilir, derslerde yol gösterebilir, quiz sorularını okuyabilir ve ilk küçük adımı atmana yardım edebilirim.",
  demoFeedbackEyebrow: "Demo kullanıcı görüşleri",
  demoFeedbackTitle: "Kullanıcılar demoda ne hissetmeli",
  demoFeedbackNote: "Hackathon anlatımı için örnek görüşler. Deneyimin hedeflediği değeri gösterir.",
  userOpinions: [
    {
      name: "Anna, 54",
      role: "Az gören öğrenci",
      quote:
        "Ses düğmeleri uygulamayı daha sakin hissettiriyor. Tüm ekranı aramadan puanı ve bir sonraki adımı dinleyebiliyorum.",
      impact: "Ses öncelikli erişilebilirlik",
    },
    {
      name: "Marek, 31",
      role: "İlk kez birikim yapan",
      quote:
        "Enflasyon örneği, nakit riskini sonunda gerçek hissettirdi. Beni yatırıma itmedi; hiçbir şey yapmamanın da bir seçim olduğunu anlamamı sağladı.",
      impact: "Enflasyon farkındalığı",
    },
    {
      name: "Julia, 17",
      role: "Öğrenci",
      quote: "Quiz okuma modu yorgun olduğumda işe yarıyor. Soruyu ve cevapları dinlemek odaklanmayı kolaylaştırıyor.",
      impact: "Quiz seslendirmesi",
    },
    {
      name: "Piotr, 42",
      role: "Ebeveyn",
      quote: "Coach FI'ın bir al-sat uygulaması gibi hissettirmemesini seviyorum. Alışkanlıklardan, acil durum fonundan ve basit aile kararlarından bahsediyor.",
      impact: "Aile finans eğitimi",
    },
  ],
  voice: {
    listen: "Dinle",
    readAloud: "Sesli oku",
    stop: "Durdur",
    loading: "Ses yükleniyor...",
    playing: "Oynatılıyor: durdurmak için dokun",
    readQuestion: "Soruyu oku",
    readScore: "Puanımı oku",
    readLearningPath: "Öğrenme yolunu oku",
    explainInflation: "Enflasyonu sesli açıkla",
  },
  accessibility: {
    eyebrow: "Erişilebilirlik modu",
    title: "Ses öncelikli finansal eğitim",
    subtitle: "Görme engelli, az gören ve yaşlı kullanıcılar için tasarlandı.",
    sectionCopy: "Her önemli öğrenme adımı aynı yerde hem sesli dinlenebilir hem de okunabilir.",
    actions: [
      {
        id: "financial-score",
        label: "Finans puanımı oku",
        text: "Finansal sağlık puanın 100 üzerinden 42. Gelişme potansiyelin var. Önce finansal farkındalığını ve ilk birikim alışkanlığını kuracağız.",
      },
      {
        id: "inflation",
        label: "Enflasyonu açıkla",
        text: "Yirmi bin Polonya zlotisini yıllık ortalama yüzde yedi enflasyonla beş yıl nakit tutsaydın, gerçek alım gücün yaklaşık on dört bin iki yüz altmış zlotiye düşebilirdi. Harekete geçmemek de finansal bir karardır.",
      },
      {
        id: "next-lesson",
        label: "Sonraki derse başla",
        text: "Bir sonraki dersin Para Zihniyeti. Biriktirmenin zengin olmakla değil, basit ve tekrarlanabilir bir sistem kurmakla ilgili olduğunu öğreneceksin.",
      },
      {
        id: "quiz-question",
        label: "Quiz sorusunu oku",
        text: "Enflasyon ne demektir? A. Para zamanla daha fazla şey satın alır. B. Para zamanla alım gücünü kaybeder. C. Bankalar bedava para verir. D. Fiyatlar her zaman düşer.",
      },
      {
        id: "progress",
        label: "İlerlememi göster",
        text: "Bir aşamayı tamamladın, yüz yirmi beş Coach FI Puanı kazandın ve ilk eğitim sertifikanı açtın.",
      },
    ],
    commandExamples: "Sesli komut örnekleri",
    commands: ["Finans puanımı oku", "Sonraki derse başla", "Enflasyonu basitçe açıkla", "Soruyu tekrarla"],
    checklistTitle: "Erişilebilirlik kontrol listesi",
    checklistDesc: "MVP'ye dahil edilen, WCAG gözetilerek alınmış arayüz kararları.",
    checklist: [
      "Klavyeyle gezilebilen düğmeler ve formlar",
      "Ekran okuyucu etiketleri ve canlı güncellemeler",
      "Durumlar yalnızca renkle değil, metinle de belirtilir",
      "Ana ekranların hepsinde sesli okuma kontrolleri",
    ],
    numerologyTitle: "Numeroloji bonusu",
    dateOfBirth: "Doğum tarihi",
    calculateStyle: "Öğrenme stilini hesapla",
    enterDate: "Doğum tarihini gir",
    uniqueStyle: "Finansal öğrenme stilin sana özgü.",
    numerologyDisclaimer: "Numeroloji motive edici bir özelliktir, finansal tavsiye değildir.",
  },
  coach: {
    heroTitle: "Mila konuşabiliyor",
    heroCopy:
      "Coach FI; görme engelli, az gören ve yaşlı kullanıcıları desteklemek için dersleri, quiz sorularını ve finansal çıkarımları sesli okur.",
    introButton: "Mila'nın tanıtımını oynat",
    introText:
      "Coach FI'a hoş geldin. Finansal geleceğini iyileştirmeye başlamak için zengin olman gerekmiyor. Farkındalığa, basit bir plana ve ilk küçük adıma ihtiyacın var.",
    initialMessages: [
      "Biriktirmeye başlamak için zengin olman gerekmez. Bir sisteme ihtiyacın var.",
      "Bugünün görevi: gelirinin yüzde 5'ini ayır ve enflasyon dersini bitir.",
      "Hedefin mükemmellik değil. Hedefin ilk tekrarlanabilir alışkanlığın.",
      "Devlet emekliliği yeterli olmayabilir. Kendi finansal dayanıklılığını adım adım kur.",
    ],
    quickActions: [
      "Enflasyonu basitçe açıkla",
      "İlk birikim alışkanlığımı kur",
      "Neden acil durum fonuna ihtiyacım var?",
      "Çocuklara para nasıl öğretilir?",
      "Sabit ve değişken faizli krediler",
      "Hiçbir şey yapmazsam ne olur?",
    ],
    quickReplies: {},
    fallback:
      "Finansal özgüven temellerle başlar: kazandığından az harca, acil durum fonu oluştur, enflasyonu anla ve küçük bir birikim alışkanlığını otomatikleştir. Hangi adımla başlayalım?",
    live: "Mila AI - canlı (Claude Haiku)",
    offline: "Mila AI - çevrimdışı/yerel mod",
    consentNotice: "Harici AI modu kapalı. Mila, konuşmayı bir AI sağlayıcısına göndermeden yerel olarak yanıt verir.",
    changeConsent: "Onayı değiştir",
    speaking: "Mila konuşuyor",
    answering: "Mila yanıtlıyor",
    ready: "Mila hazır",
    voiceNote: "Sesi, yapılandırıldığında ElevenLabs'i, yedek olarak da tarayıcının sesini kullanır.",
    freeQuestionNote: "Mila serbest soruları da anlar. Kişisel finansla ilgili istediğini yaz.",
    messageLabel: "Mila mesajı",
  },
  learn: {
    pathVoice:
      "Öğrenme yolun Para Zihniyeti ile başlar; ardından Birikim Alışkanlığı, Enflasyon ve Alım Gücü, Kredi ve Faiz, Acil Durum Fonu, Uzun Vadeli Yatırımın Temelleri, Emeklilik ve Aile Finans Planı gelir.",
    stages: [
      { title: "Para Zihniyeti", nftLabel: "Zihniyet Öncüsü" },
      { title: "Birikim Alışkanlığı", nftLabel: "Alışkanlık Kurucu" },
      { title: "Enflasyon ve Alım Gücü", nftLabel: "Enflasyon Bilinci" },
      { title: "Kredi, Faiz ve Oranlar", nftLabel: "Kredi Ustası" },
      { title: "Acil Durum Fonu", nftLabel: "Dayanıklı Birikimci" },
      { title: "Uzun Vadeli Yatırımın Temelleri", nftLabel: "Yatırımcı Rozeti" },
      { title: "Emeklilik ve Gelecek Güvencesi", nftLabel: "Gelecek Planlayıcı" },
      { title: "Aile Finans Planı", nftLabel: "Aile CFO'su" },
    ],
    answered: "soru yanıtlandı",
  },
  health: {
    scoreVoice: (score) =>
      `Finansal sağlık puanın 100 üzerinden ${score}. Sıradaki adımın basit bir birikim alışkanlığı kurmak ve enflasyonun paranı nasıl etkilediğini anlamak.`,
    achievement: "Başarım",
    cardDescription: "Demo verileriyle eğitim amaçlı teşhis.",
  },
  inflation: {
    title: "Nakit, değer kaybederken güvenli görünebilir.",
    description: "Yatırım yapmamanın da finansal bir karar olduğunu duygusal ve görsel olarak göster.",
    amount: "Başlangıç tutarı",
    years: "Yıl cinsinden süre",
    rate: "Yıllık ortalama enflasyon %",
    realValue: (years) => `${years} yıl sonra tahmini gerçek değer`,
    lost: "Kaybedilen alım gücü",
    chartTitle: "Yalnızca nakit, alışkanlıklar ve yatırım senaryosu",
    chartDescription: "Yatırım yapmamak da finansal bir karardır. Enflasyon bu kararı pahalı hale getirir.",
    voiceText: (amount, years, rate, realValue, lostValue) =>
      `${amount} ile başlayıp ${years} yıl boyunca yıllık ortalama yüzde ${rate} enflasyonla tahmini gerçek değer ${realValue} olur. Yaklaşık ${lostValue} alım gücü kaybedersin. Harekete geçmemek de finansal bir karardır.`,
  },
  common: {
    tokens: "Coach FI Puanları",
    rewardAvailable: "Ödül hazır",
    tokenDemo: "Demo hikâyesi için örnek puan bakiyesi.",
    nextAction: "Önerilen sonraki adım",
    firstFocus: "İlk odak: başlangıç acil durum fonu",
    nextLesson: "Sonraki ders: enflasyon ve alım gücü",
  },
};

const content: Record<Locale, LocalizedContent> = {
  en,
  pl,
  es,
  fr,
  zh,
  ja,
  hi,
  "pt-BR": ptBR,
  tr,
};

export function getLocalizedContent(locale: Locale) {
  return content[locale] ?? en;
}
