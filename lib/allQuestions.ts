import { quizQuestions } from "@/data/quizQuestions";
import { challengeQuestions } from "@/data/challengeQuestions";
import type { Locale } from "@/lib/i18n";
import { challengeOverrides } from "@/lib/localizedChallenge";
import { getQuizQuestions } from "@/lib/localizedQuiz";

export interface UnifiedQuestion {
  id: string;
  question: string;
  answers: { id: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  category: string;
  reward: number;
}

type QuestionOverride = Pick<UnifiedQuestion, "question" | "answers" | "explanation" | "category">;

const fromQuiz: UnifiedQuestion[] = quizQuestions.map((q) => ({
  id: q.id,
  question: q.question,
  answers: q.answers,
  correctAnswer: q.correctAnswer,
  explanation: q.retryMessage,
  category: q.category,
  reward: q.reward,
}));

const fromChallenge: UnifiedQuestion[] = challengeQuestions.map((q) => ({
  id: q.id,
  question: q.question,
  answers: q.answers,
  correctAnswer: q.correctAnswer,
  explanation: q.explanation,
  category: "Deep Dive",
  reward: q.reward,
}));

export const allQuestions: UnifiedQuestion[] = [...fromQuiz, ...fromChallenge];

export const allQuestionIds: string[] = allQuestions.map((q) => q.id);

const plQuestionOverrides: Record<string, QuestionOverride> = {
  "inflation-basics": {
    question: "Co oznacza inflacja?",
    answers: [
      { id: "A", text: "Pieniądze kupują więcej z czasem" },
      { id: "B", text: "Pieniądze tracą siłę nabywczą z czasem" },
      { id: "C", text: "Banki rozdają darmowe pieniądze" },
      { id: "D", text: "Ceny zawsze spadają" },
    ],
    explanation: "Inflacja oznacza, że ta sama kwota kupuje z czasem mniej.",
    category: "Inflacja",
  },
  "emergency-fund": {
    question: "Ile miesięcy wydatków powinien obejmować fundusz awaryjny?",
    answers: [
      { id: "A", text: "1 tydzień" },
      { id: "B", text: "1 miesiąc" },
      { id: "C", text: "3-6 miesięcy" },
      { id: "D", text: "10 lat" },
    ],
    explanation: "Praktyczny fundusz awaryjny zwykle pokrywa 3-6 miesięcy podstawowych wydatków.",
    category: "Fundusz awaryjny",
  },
  "saving-habit": {
    question: "Który nawyk oszczędzania jest najskuteczniejszy?",
    answers: [
      { id: "A", text: "Odkładać to, co zostanie na koniec miesiąca" },
      { id: "B", text: "Oszczędzać tylko wtedy, gdy zarabiasz więcej" },
      { id: "C", text: "Automatycznie przelewać stałą kwotę zaraz po wypłacie" },
      { id: "D", text: "Trzymać wszystko w gotówce w domu" },
    ],
    explanation: "Najskuteczniejszy jest automatyczny przelew zaraz po wpływie dochodu.",
    category: "Nawyk oszczędzania",
  },
  "interest-rates": {
    question: "Co zwykle dzieje się z kredytem o zmiennej stopie, gdy stopy procentowe rosną?",
    answers: [
      { id: "A", text: "Rata spada" },
      { id: "B", text: "Nic się nie zmienia" },
      { id: "C", text: "Rata zwykle rośnie" },
      { id: "D", text: "Kredyt automatycznie się refinansuje" },
    ],
    explanation: "Kredyty ze zmienną stopą są powiązane ze stopami rynkowymi, więc rata może wzrosnąć.",
    category: "Kredyt i stopy procentowe",
  },
  "net-worth": {
    question: "Co oznacza wartość netto?",
    answers: [
      { id: "A", text: "Miesięczna pensja po podatku" },
      { id: "B", text: "Aktywa minus zobowiązania" },
      { id: "C", text: "Gotówka w portfelu" },
      { id: "D", text: "Ocena kredytowa" },
    ],
    explanation: "Wartość netto to wszystko, co posiadasz, minus wszystko, co jesteś winien.",
    category: "Nastawienie do pieniędzy",
  },
  "lifestyle-inflation": {
    question: "Co oznacza inflacja stylu życia?",
    answers: [
      { id: "A", text: "Podnoszenie płacy minimalnej przez państwo" },
      { id: "B", text: "Ceny rosną szybciej niż pensje" },
      { id: "C", text: "Wydajesz więcej, gdy więcej zarabiasz, a oszczędności stoją w miejscu" },
      { id: "D", text: "Ubarwianie swojego CV" },
    ],
    explanation: "Inflacja stylu życia oznacza, że każda podwyżka znika w nowych wydatkach.",
    category: "Nastawienie do pieniędzy",
  },
  "pay-yourself-first": {
    question: "Co oznacza zasada zapłać najpierw sobie?",
    answers: [
      { id: "A", text: "Najpierw wydawać na przyjemności" },
      { id: "B", text: "Automatycznie odkładać pieniądze przed innymi wydatkami" },
      { id: "C", text: "Najpierw podnieść sobie pensję" },
      { id: "D", text: "Kupić luksusowe rzeczy przed zakupami spożywczymi" },
    ],
    explanation: "To odkładanie stałej kwoty zaraz po otrzymaniu dochodu, zanim zaczniesz wydawać.",
    category: "Nastawienie do pieniędzy",
  },
  "budget-50-30-20": {
    question: "Na czym polega zasada budżetu 50/30/20?",
    answers: [
      { id: "A", text: "50% oszczędności, 30% potrzeby, 20% zachcianki" },
      { id: "B", text: "50% potrzeby, 30% zachcianki, 20% oszczędności" },
      { id: "C", text: "50% spłata długu, 30% jedzenie, 20% zabawa" },
      { id: "D", text: "50% podatek, 30% czynsz, 20% jedzenie" },
    ],
    explanation: "50% na potrzeby, 30% na zachcianki, 20% na oszczędności i spłatę długu.",
    category: "Nawyk oszczędzania",
  },
  "high-yield-savings": {
    question: "Czym jest wysoko oprocentowane konto oszczędnościowe?",
    answers: [
      { id: "A", text: "Konto, które automatycznie inwestuje w akcje" },
      { id: "B", text: "Konto z wyraźnie wyższym oprocentowaniem niż standardowe" },
      { id: "C", text: "Konto z opłatą za każdą wypłatę" },
      { id: "D", text: "Konto wyłącznie dla firm" },
    ],
    explanation: "Takie konto daje wyższe odsetki niż zwykłe konto oszczędnościowe.",
    category: "Nawyk oszczędzania",
  },
  dca: {
    question: "Czym jest uśrednianie ceny zakupu, czyli DCA?",
    answers: [
      { id: "A", text: "Kupowanie wszystkiego idealnie na dołku" },
      { id: "B", text: "Sprzedawanie wszystkiego, gdy ceny spadają" },
      { id: "C", text: "Inwestowanie stałej kwoty regularnie, niezależnie od ceny" },
      { id: "D", text: "Zamiana wszystkich oszczędności na dolary" },
    ],
    explanation: "DCA oznacza regularne inwestowanie tej samej kwoty bez prób zgadywania idealnego momentu.",
    category: "Nawyk oszczędzania",
  },
  "real-return": {
    question: "Jaka jest realna stopa zwrotu, jeśli inflacja wynosi 5%, a bank daje 2%?",
    answers: [
      { id: "A", text: "+7%" },
      { id: "B", text: "+2%" },
      { id: "C", text: "0%" },
      { id: "D", text: "-3%" },
    ],
    explanation: "Realna stopa zwrotu to oprocentowanie minus inflacja. 2% - 5% = -3%.",
    category: "Inflacja",
  },
  "rule-of-72": {
    question: "Czym jest reguła 72?",
    answers: [
      { id: "A", text: "Potrzebujesz 72 miesięcy, aby spłacić każdy dług" },
      { id: "B", text: "Dzielisz 72 przez roczną stopę zwrotu, aby oszacować czas podwojenia pieniędzy" },
      { id: "C", text: "Trzeba oszczędzać 72% dochodu" },
      { id: "D", text: "Najlepiej przejść na emeryturę w wieku 72 lat" },
    ],
    explanation: "Reguła 72 to szybki sposób na oszacowanie, po ilu latach kapitał może się podwoić.",
    category: "Inflacja",
  },
  "inflation-hedge": {
    question: "Co uważa się za lepszą długoterminową ochronę przed inflacją?",
    answers: [
      { id: "A", text: "Trzymanie gotówki pod materacem" },
      { id: "B", text: "Konto oszczędnościowe na 1%" },
      { id: "C", text: "Szeroko zdywersyfikowane fundusze indeksowe akcji" },
      { id: "D", text: "Losy na loterię" },
    ],
    explanation: "Szerokie fundusze akcyjne historycznie częściej wyprzedzały inflację w długim terminie.",
    category: "Inflacja",
  },
  "debt-avalanche": {
    question: "Na czym polega strategia lawiny zadłużenia?",
    answers: [
      { id: "A", text: "Branie nowych pożyczek na spłatę starych" },
      { id: "B", text: "Spłacanie najmniejszych długów bez względu na oprocentowanie" },
      { id: "C", text: "Spłacanie najpierw długu z najwyższym oprocentowaniem" },
      { id: "D", text: "Ignorowanie długu, aż urośnie" },
    ],
    explanation: "Lawina zadłużenia skupia się najpierw na najwyżej oprocentowanym długu.",
    category: "Kredyt i stopy procentowe",
  },
  "credit-score-factors": {
    question: "Który czynnik ma największy wpływ na ocenę kredytową?",
    answers: [
      { id: "A", text: "Liczba posiadanych kart kredytowych" },
      { id: "B", text: "Historia terminowych płatności" },
      { id: "C", text: "Wiek najstarszego rachunku" },
      { id: "D", text: "Poziom dochodów" },
    ],
    explanation: "Historia płatności jest jednym z najważniejszych czynników oceny kredytowej.",
    category: "Kredyt i stopy procentowe",
  },
  "bond-prices": {
    question: "Co zwykle dzieje się z cenami obligacji, gdy stopy procentowe rosną?",
    answers: [
      { id: "A", text: "Ceny obligacji rosną" },
      { id: "B", text: "Ceny obligacji spadają" },
      { id: "C", text: "Nic się nie zmienia" },
      { id: "D", text: "Ceny obligacji się podwajają" },
    ],
    explanation: "Ceny obligacji i stopy procentowe zwykle poruszają się w przeciwnych kierunkach.",
    category: "Kredyt i stopy procentowe",
  },
  "emergency-fund-characteristics": {
    question: "Co NIE jest cechą dobrego funduszu awaryjnego?",
    answers: [
      { id: "A", text: "Łatwy dostęp do pieniędzy" },
      { id: "B", text: "Pokrycie 3-6 miesięcy wydatków" },
      { id: "C", text: "Inwestowanie w ryzykowne akcje dla maksymalnego wzrostu" },
      { id: "D", text: "Oddzielenie od codziennego konta" },
    ],
    explanation: "Fundusz awaryjny powinien być płynny i bezpieczny, a nie wystawiony na dużą zmienność.",
    category: "Fundusz awaryjny",
  },
  "emergency-fund-start": {
    question: "Jeśli 3-6 miesięcy wydatków wydaje się zbyt trudne, jaki jest pierwszy kamień milowy?",
    answers: [
      { id: "A", text: "10 000 zł niezależnie od wydatków" },
      { id: "B", text: "Jeden miesiąc podstawowych wydatków" },
      { id: "C", text: "Trzy limity kart kredytowych" },
      { id: "D", text: "50% rocznej pensji" },
    ],
    explanation: "Pierwszy realistyczny cel to jeden miesiąc podstawowych wydatków.",
    category: "Fundusz awaryjny",
  },
  "compound-interest": {
    question: "Czym jest procent składany?",
    answers: [
      { id: "A", text: "Odsetki naliczane tylko od początkowej kwoty" },
      { id: "B", text: "Opłata bankowa za wcześniejszą wypłatę" },
      { id: "C", text: "Odsetki od kapitału i wcześniej naliczonych odsetek" },
      { id: "D", text: "Odsetki płacone wyłącznie od kart kredytowych" },
    ],
    explanation: "Procent składany oznacza, że zarabiasz odsetki także od wcześniejszych odsetek.",
    category: "Długoterminowe inwestowanie",
  },
  diversification: {
    question: "Co oznacza dywersyfikacja w inwestowaniu?",
    answers: [
      { id: "A", text: "Włożenie wszystkich pieniędzy w jedną mocną akcję" },
      { id: "B", text: "Rozłożenie inwestycji na różne aktywa, aby ograniczyć ryzyko" },
      { id: "C", text: "Inwestowanie wyłącznie w obligacje skarbowe" },
      { id: "D", text: "Zmienianie portfela co tydzień" },
    ],
    explanation: "Dywersyfikacja zmniejsza ryzyko, że jedna zła inwestycja zniszczy cały portfel.",
    category: "Długoterminowe inwestowanie",
  },
  "index-fund": {
    question: "Jaki typ funduszu automatycznie śledzi indeks rynkowy przy niskich opłatach?",
    answers: [
      { id: "A", text: "Fundusz hedgingowy" },
      { id: "B", text: "Fundusz indeksowy lub ETF" },
      { id: "C", text: "Fundusz venture capital" },
      { id: "D", text: "Fundusz emerytalny" },
    ],
    explanation: "Fundusze indeksowe i ETF-y pasywnie śledzą indeks i zwykle mają niskie opłaty.",
    category: "Długoterminowe inwestowanie",
  },
  "etf-definition": {
    question: "Czym jest ETF?",
    answers: [
      { id: "A", text: "Konto oszczędnościowe z wyższym oprocentowaniem" },
      { id: "B", text: "Elektroniczna opłata za przelew" },
      { id: "C", text: "Fundusz notowany na giełdzie, czyli koszyk aktywów handlowany jak akcja" },
      { id: "D", text: "Państwowy fundusz awaryjny" },
    ],
    explanation: "ETF łączy wiele aktywów w jeden instrument, którym można handlować na giełdzie.",
    category: "Długoterminowe inwestowanie",
  },
  "time-in-market": {
    question: "Która strategia zwykle lepiej działa u inwestorów długoterminowych?",
    answers: [
      { id: "A", text: "Idealne wyczucie rynku" },
      { id: "B", text: "Konsekwentne pozostawanie na rynku przez długi czas" },
      { id: "C", text: "Sprzedaż po spadku rynku o 10%" },
      { id: "D", text: "Inwestowanie wyłącznie w złoto" },
    ],
    explanation: "Dla większości osób czas spędzony na rynku jest ważniejszy niż próba idealnego wejścia i wyjścia.",
    category: "Długoterminowe inwestowanie",
  },
  "retirement-purpose": {
    question: "Jaki jest główny cel konta emerytalnego?",
    answers: [
      { id: "A", text: "Finansowanie wakacji" },
      { id: "B", text: "Zastąpienie dochodu po zakończeniu pracy dzięki wieloletniemu składaniu" },
      { id: "C", text: "Spekulacja na bardzo ryzykownych aktywach" },
      { id: "D", text: "Trzymanie gotówki awaryjnej" },
    ],
    explanation: "Konta emerytalne korzystają z wielu lat procentu składanego. Czas jest kluczowy.",
    category: "Emerytura",
  },
  "retirement-early-start": {
    question: "Jeśli inwestujesz 200 dolarów miesięcznie od 25. roku życia przy 7% rocznie, ile możesz mieć około 65. roku życia?",
    answers: [
      { id: "A", text: "Około 96 000 dolarów" },
      { id: "B", text: "Około 240 000 dolarów" },
      { id: "C", text: "Około 525 000 dolarów" },
      { id: "D", text: "Około 1 200 000 dolarów" },
    ],
    explanation: "Długi czas i procent składany mogą bardzo mocno zwiększyć końcową kwotę.",
    category: "Emerytura",
  },
  "insurance-purpose": {
    question: "Jaki jest główny cel ubezpieczenia na życie?",
    answers: [
      { id: "A", text: "Wzbogacenie się po czyjejś śmierci" },
      { id: "B", text: "Zastąpienie dochodu dla bliskich, jeśli główny żywiciel umrze" },
      { id: "C", text: "Oszczędność podatkowa" },
      { id: "D", text: "Bezpieczne inwestowanie na giełdzie" },
    ],
    explanation: "Ubezpieczenie na życie chroni osoby zależne finansowo od Twojego dochodu.",
    category: "Plan finansowy rodziny",
  },
  "joint-finances": {
    question: "Jakie podejście do finansów jest zalecane dla par?",
    answers: [
      { id: "A", text: "Jedna osoba zajmuje się wszystkim, druga nie musi wiedzieć" },
      { id: "B", text: "Oboje partnerzy rozumieją pełny obraz finansów i planują razem" },
      { id: "C", text: "Finanse zawsze muszą być całkowicie oddzielne" },
      { id: "D", text: "Osoba zarabiająca więcej kontroluje wszystkie decyzje" },
    ],
    explanation: "Wspólna przejrzystość finansowa zmniejsza konflikty i poprawia decyzje.",
    category: "Plan finansowy rodziny",
  },
  "teaching-kids-money": {
    question: "Jaki jest skuteczny sposób uczenia dzieci o pieniądzach?",
    answers: [
      { id: "A", text: "Dawać kieszonkowe bez żadnych zasad" },
      { id: "B", text: "Pozwalać tylko obserwować i nigdy nie rozmawiać o pieniądzach" },
      { id: "C", text: "Dawać kieszonkowe z zasadami oszczędzania, wydawania i dzielenia się" },
      { id: "D", text: "Czekać z rozmową o finansach do 18. roku życia" },
    ],
    explanation: "Małe, realne decyzje finansowe uczą dzieci bez dużego ryzyka.",
    category: "Plan finansowy rodziny",
  },
  c1: {
    question: "Na czym polega zasada budżetu 50/30/20?",
    answers: [
      { id: "A", text: "50% oszczędności, 30% potrzeby, 20% zachcianki" },
      { id: "B", text: "50% potrzeby, 30% zachcianki, 20% oszczędności" },
      { id: "C", text: "50% spłata długu, 30% jedzenie, 20% zabawa" },
      { id: "D", text: "50% podatek, 30% czynsz, 20% jedzenie" },
    ],
    explanation: "50% na potrzeby, 30% na zachcianki, 20% na oszczędności i spłatę długu.",
    category: "Wyzwanie",
  },
  c2: {
    question: "Czym jest procent składany?",
    answers: [
      { id: "A", text: "Odsetki tylko od początkowej kwoty" },
      { id: "B", text: "Opłata bankowa za wcześniejszą wypłatę" },
      { id: "C", text: "Odsetki od kapitału i wcześniejszych odsetek" },
      { id: "D", text: "Odsetki płacone tylko od kart kredytowych" },
    ],
    explanation: "Procent składany oznacza, że zarabiasz odsetki także od wcześniejszych odsetek.",
    category: "Wyzwanie",
  },
  c3: {
    question: "Co oznacza dywersyfikacja w inwestowaniu?",
    answers: [
      { id: "A", text: "Wszystko w jedną mocną akcję" },
      { id: "B", text: "Rozłożenie inwestycji na różne aktywa" },
      { id: "C", text: "Tylko obligacje skarbowe" },
      { id: "D", text: "Zmiana portfela co tydzień" },
    ],
    explanation: "Dywersyfikacja zmniejsza ryzyko, że jedna zła inwestycja zniszczy cały portfel.",
    category: "Wyzwanie",
  },
  c4: {
    question: "Na czym polega strategia lawiny zadłużenia?",
    answers: [
      { id: "A", text: "Nowe pożyczki na stare długi" },
      { id: "B", text: "Najpierw najmniejsze długi bez patrzenia na oprocentowanie" },
      { id: "C", text: "Najpierw najwyżej oprocentowane długi" },
      { id: "D", text: "Ignorowanie długu" },
    ],
    explanation: "Lawina długu minimalizuje koszt odsetek, bo zaczyna od najwyższego oprocentowania.",
    category: "Wyzwanie",
  },
  c5: {
    question: "Jaka jest realna stopa zwrotu, jeśli inflacja wynosi 5%, a bank daje 2%?",
    answers: [
      { id: "A", text: "+7%" },
      { id: "B", text: "+2%" },
      { id: "C", text: "0%" },
      { id: "D", text: "-3%" },
    ],
    explanation: "Realna stopa zwrotu to 2% - 5%, czyli -3%.",
    category: "Wyzwanie",
  },
  c6: {
    question: "Jaki typ funduszu śledzi indeks rynkowy automatycznie przy niskich opłatach?",
    answers: [
      { id: "A", text: "Fundusz hedgingowy" },
      { id: "B", text: "Fundusz indeksowy lub ETF" },
      { id: "C", text: "Fundusz venture capital" },
      { id: "D", text: "Fundusz emerytalny" },
    ],
    explanation: "Fundusze indeksowe i ETF-y pasywnie śledzą indeks i zwykle mają niskie koszty.",
    category: "Wyzwanie",
  },
  c7: {
    question: "Czym jest DCA?",
    answers: [
      { id: "A", text: "Kupowanie wszystkiego na dołku" },
      { id: "B", text: "Sprzedaż przy spadkach" },
      { id: "C", text: "Regularne inwestowanie stałej kwoty" },
      { id: "D", text: "Zamiana oszczędności na dolary" },
    ],
    explanation: "DCA usuwa emocje z decyzji, bo inwestujesz regularnie tę samą kwotę.",
    category: "Wyzwanie",
  },
  c8: {
    question: "Czym jest reguła 72?",
    answers: [
      { id: "A", text: "72 miesiące na spłatę długu" },
      { id: "B", text: "72 podzielone przez roczną stopę zwrotu daje przybliżony czas podwojenia kapitału" },
      { id: "C", text: "Oszczędzaj 72% dochodu" },
      { id: "D", text: "Emerytura w wieku 72 lat" },
    ],
    explanation: "To szybki skrót do szacowania efektu procentu składanego.",
    category: "Wyzwanie",
  },
  c9: {
    question: "Czym jest ETF?",
    answers: [
      { id: "A", text: "Konto oszczędnościowe" },
      { id: "B", text: "Elektroniczna opłata za przelew" },
      { id: "C", text: "Fundusz notowany na giełdzie, czyli koszyk aktywów" },
      { id: "D", text: "Państwowy fundusz awaryjny" },
    ],
    explanation: "ETF łączy wiele aktywów i jest notowany na giełdzie jak pojedynczy instrument.",
    category: "Wyzwanie",
  },
  c10: {
    question: "Co NIE jest cechą dobrego funduszu awaryjnego?",
    answers: [
      { id: "A", text: "Łatwy dostęp" },
      { id: "B", text: "Pokrycie 3-6 miesięcy wydatków" },
      { id: "C", text: "Inwestowanie w ryzykowne akcje" },
      { id: "D", text: "Oddzielenie od codziennego konta" },
    ],
    explanation: "Fundusz awaryjny ma być płynny i bezpieczny, a nie nastawiony na maksymalny wzrost.",
    category: "Wyzwanie",
  },
  c11: {
    question: "Co dzieje się z cenami obligacji, gdy stopy procentowe rosną?",
    answers: [
      { id: "A", text: "Rosną" },
      { id: "B", text: "Spadają" },
      { id: "C", text: "Bez zmian" },
      { id: "D", text: "Podwajają się" },
    ],
    explanation: "Obligacje i stopy procentowe zwykle poruszają się przeciwnie.",
    category: "Wyzwanie",
  },
  c12: {
    question: "Co oznacza inflacja stylu życia?",
    answers: [
      { id: "A", text: "Podnoszenie płacy minimalnej" },
      { id: "B", text: "Ceny rosną szybciej niż pensje" },
      { id: "C", text: "Wydajesz więcej, gdy więcej zarabiasz" },
      { id: "D", text: "Ubarwianie CV" },
    ],
    explanation: "Inflacja stylu życia sprawia, że podwyżki znikają w nowych wydatkach.",
    category: "Wyzwanie",
  },
  c13: {
    question: "Jaki jest główny cel konta emerytalnego?",
    answers: [
      { id: "A", text: "Wakacje" },
      { id: "B", text: "Zastąpienie dochodu po zakończeniu pracy" },
      { id: "C", text: "Spekulacja" },
      { id: "D", text: "Gotówka awaryjna" },
    ],
    explanation: "Konto emerytalne jest długoterminowym narzędziem budowania kapitału na czas bez pracy.",
    category: "Wyzwanie",
  },
  c14: {
    question: "Co oznacza wartość netto?",
    answers: [
      { id: "A", text: "Pensja po podatku" },
      { id: "B", text: "Aktywa minus zobowiązania" },
      { id: "C", text: "Gotówka w portfelu" },
      { id: "D", text: "Ocena kredytowa" },
    ],
    explanation: "Wartość netto pokazuje pełniejszy obraz finansów niż sam dochód.",
    category: "Wyzwanie",
  },

  // ── Makroekonomia (NBP / IMF / Fed) ──────────────────────────────────────
  "nbp-inflation-target": {
    question: "Jaki cel inflacyjny realizuje Narodowy Bank Polski od 2004 roku?",
    answers: [
      { id: "A", text: "0% — ceny nigdy nie powinny rosnąć" },
      { id: "B", text: "2,5% z pasmem odchyleń ±1 punkt procentowy" },
      { id: "C", text: "5%, aby zachęcać do wydawania" },
      { id: "D", text: "Taki, jaki co roku ustali rząd" },
    ],
    explanation: "Od 2004 r. cel NBP to 2,5% (±1 pkt proc.), mierzony roczną zmianą wskaźnika CPI.",
    category: "Makroekonomia",
  },
  "inflation-target-why": {
    question: "Dlaczego banki centralne celują w niską, dodatnią inflację (~2–2,5%), a nie w 0%?",
    answers: [
      { id: "A", text: "Aby waluta szybciej traciła wartość" },
      { id: "B", text: "Mały, stabilny bufor wspiera wzrost i chroni przed groźną deflacją" },
      { id: "C", text: "Bo wyższe ceny są zawsze dobre" },
      { id: "D", text: "Tylko po to, by zwiększyć wpływy z podatków" },
    ],
    explanation: "Niski dodatni cel utrzymuje margines bezpieczeństwa od deflacji i zapewnia przewidywalność cen.",
    category: "Makroekonomia",
  },
  "monetary-policy-tool": {
    question: "Jakie jest główne narzędzie banku centralnego do sterowania inflacją?",
    answers: [
      { id: "A", text: "Drukowanie banknotów dla obywateli" },
      { id: "B", text: "Ustalanie referencyjnych stóp procentowych" },
      { id: "C", text: "Ustalanie ceny chleba" },
      { id: "D", text: "Zakaz importu" },
    ],
    explanation: "Zmieniając stopy referencyjne, bank centralny zmienia koszt kredytu w całej gospodarce.",
    category: "Makroekonomia",
  },
  "rates-and-borrowing": {
    question: "Co zwykle dzieje się, gdy bank centralny podnosi stopy procentowe?",
    answers: [
      { id: "A", text: "Kredyt tanieje i wydatki rosną" },
      { id: "B", text: "Kredyt drożeje, co schładza popyt i inflację" },
      { id: "C", text: "Nic się nie zmienia dla gospodarstw domowych" },
      { id: "D", text: "Konta oszczędnościowe zawsze płacą 0%" },
    ],
    explanation: "Podwyżki stóp podnoszą koszt kredytu, więc wydatki maleją i inflacja hamuje.",
    category: "Makroekonomia",
  },
  "gdp-definition": {
    question: "Co mierzy PKB (Produkt Krajowy Brutto)?",
    answers: [
      { id: "A", text: "Łączne oszczędności obywateli" },
      { id: "B", text: "Wartość wszystkich dóbr i usług wytworzonych w gospodarce" },
      { id: "C", text: "Ilość gotówki w obiegu" },
      { id: "D", text: "Dług publiczny" },
    ],
    explanation: "PKB to łączna wartość rynkowa dóbr i usług wytworzonych w kraju w danym okresie.",
    category: "Makroekonomia",
  },
  "deflation-risk": {
    question: "Dlaczego utrzymująca się deflacja (spadające ceny) jest uważana za groźną?",
    answers: [
      { id: "A", text: "Wszyscy się bogacą i nie ma żadnych minusów" },
      { id: "B", text: "Ludzie odkładają zakupy, popyt spada, a długi robią się realnie cięższe" },
      { id: "C", text: "Zawsze podnosi pensje" },
      { id: "D", text: "Nie ma wpływu na gospodarkę" },
    ],
    explanation: "Przy spadających cenach ludzie zwlekają z zakupami, a realny ciężar długów rośnie — to groźna spirala.",
    category: "Makroekonomia",
  },

  // ── Budżet domowy (CFPB / OECD) ──────────────────────────────────────────
  "zero-based-budget": {
    question: "Czym jest budżet od zera (zero-based budgeting)?",
    answers: [
      { id: "A", text: "Wydawaniem do zera na koncie" },
      { id: "B", text: "Przypisaniem każdej złotówce zadania, aż dochód minus plan = 0" },
      { id: "C", text: "Brakiem oszczędności" },
      { id: "D", text: "Budżetowaniem tylko gotówki" },
    ],
    explanation: "W budżecie od zera każda złotówka ma zadanie — w tym oszczędności — więc nic nie wycieka bez planu.",
    category: "Budżet domowy",
  },
  "track-before-budget": {
    question: "Jaki jest zalecany pierwszy krok przed ułożeniem budżetu domowego?",
    answers: [
      { id: "A", text: "Natychmiastowe anulowanie wszystkich subskrypcji" },
      { id: "B", text: "Śledzenie rzeczywistych wydatków przez około 30 dni" },
      { id: "C", text: "Wzięcie pożyczki na pokrycie braków" },
      { id: "D", text: "Zgadywanie wydatków z pamięci" },
    ],
    explanation: "Najpierw ~30 dni śledzenia wydatków — nie zarządzisz tym, czego nie mierzysz.",
    category: "Budżet domowy",
  },
  "sinking-fund": {
    question: "Czym jest fundusz celowy (sinking fund) w budżecie domowym?",
    answers: [
      { id: "A", text: "Pieniędzmi, które spodziewasz się stracić" },
      { id: "B", text: "Gotówką odkładaną stopniowo na znany przyszły wydatek" },
      { id: "C", text: "Rodzajem ryzykownej inwestycji" },
      { id: "D", text: "Debetem na koncie" },
    ],
    explanation: "Fundusz celowy rozkłada duże znane koszty (serwis auta, wakacje, podatki) na małe miesięczne kwoty.",
    category: "Budżet domowy",
  },
  "impulse-pause": {
    question: "Jaka taktyka skutecznie ogranicza zakupy impulsowe?",
    answers: [
      { id: "A", text: "Kup teraz, zdecyduj później, czy było potrzebne" },
      { id: "B", text: "Okres oczekiwania (24–72h, a przy dużych zakupach 30 dni) przed rzeczami zbędnymi" },
      { id: "C", text: "Zakupy zawsze w stresie" },
      { id: "D", text: "Usunięcie cen, żeby ich nie widzieć" },
    ],
    explanation: "Wbudowana pauza pozwala impulsowi wygasnąć — większość zakupów impulsowych nie przeżywa czekania.",
    category: "Budżet domowy",
  },

  // ── Oszczędzanie i bezpieczeństwo depozytów ──────────────────────────────
  "emergency-first-milestone": {
    question: "Jaki jest realistyczny PIERWSZY cel funduszu awaryjnego, gdy 3–6 miesięcy wydaje się odległe?",
    answers: [
      { id: "A", text: "Nie zaczynaj, dopóki nie odłożysz 6 miesięcy naraz" },
      { id: "B", text: "Jeden miesiąc podstawowych wydatków" },
      { id: "C", text: "Dwa lata wydatków" },
      { id: "D", text: "Dokładnie roczna pensja" },
    ],
    explanation: "Już jeden miesiąc wydatków znacząco obniża ryzyko zaległości w rachunkach — zacznij mało, potem buduj do 3–6 miesięcy.",
    category: "Fundusz awaryjny",
  },
  "bfg-guarantee": {
    question: "Do jakiej kwoty depozyty bankowe w Polsce gwarantuje BFG?",
    answers: [
      { id: "A", text: "Nie ma żadnej gwarancji depozytów" },
      { id: "B", text: "Równowartość 100 000 € na deponenta w danym banku" },
      { id: "C", text: "Dokładnie 10 000 zł łącznie" },
      { id: "D", text: "Bez limitu, zawsze 100%" },
    ],
    explanation: "Bankowy Fundusz Gwarancyjny chroni depozyty do równowartości 100 000 € na osobę w każdym banku, wypłacane w złotych.",
    category: "Nawyk oszczędzania",
  },

  // ── Długoterminowe inwestowanie (SEC / FINRA) ────────────────────────────
  "asset-allocation": {
    question: "Co oznacza alokacja aktywów?",
    answers: [
      { id: "A", text: "Wybór jednej zwycięskiej akcji" },
      { id: "B", text: "Podział inwestycji między akcje, obligacje i gotówkę" },
      { id: "C", text: "Pożyczanie pieniędzy na inwestycje" },
      { id: "D", text: "Trzymanie wszystkiego na rachunku bieżącym" },
    ],
    explanation: "Alokacja aktywów — Twój podział na akcje/obligacje/gotówkę — decyduje o większości długoterminowego ryzyka i zwrotu.",
    category: "Długoterminowe inwestowanie",
  },
  rebalancing: {
    question: "Czym jest rebalancing portfela?",
    answers: [
      { id: "A", text: "Sprzedażą wszystkiego, gdy rynek spada" },
      { id: "B", text: "Okresowym przywracaniem docelowych proporcji portfela" },
      { id: "C", text: "Dokupowaniem tylko najlepszej akcji" },
      { id: "D", text: "Codziennym sprawdzaniem salda" },
    ],
    explanation: "Rebalancing przycina to, co urosło za bardzo, i uzupełnia to, co zmalało — ryzyko zostaje tam, gdzie je zaplanowano.",
    category: "Długoterminowe inwestowanie",
  },
  "fees-ter": {
    question: "Dlaczego niskie opłaty bieżące (TER) są tak ważne w długoterminowym inwestowaniu?",
    answers: [
      { id: "A", text: "Nie są — opłaty są pomijalne" },
      { id: "B", text: "Opłaty składają się przeciwko Tobie i po cichu zjadają dekady zwrotów" },
      { id: "C", text: "Wyższe opłaty zawsze oznaczają wyższe zyski" },
      { id: "D", text: "Opłaty są zwracane na emeryturze" },
    ],
    explanation: "Koszty składają się jak zwroty: 1% vs 0,2% rocznie przez 30 lat potrafi kosztować dużą część końcowego kapitału.",
    category: "Długoterminowe inwestowanie",
  },
  "risk-return": {
    question: "Jaka jest ogólna zależność między ryzykiem a oczekiwanym zwrotem?",
    answers: [
      { id: "A", text: "Wyższy oczekiwany zwrot zwykle wiąże się z wyższym ryzykiem" },
      { id: "B", text: "Wysokie zyski są gwarantowane bez ryzyka" },
      { id: "C", text: "Ryzyko i zwrot nie mają związku" },
      { id: "D", text: "Niższe ryzyko zawsze oznacza wyższy zwrot" },
    ],
    explanation: "Nie ma darmowego obiadu: wyższy potencjalny zwrot wymaga akceptacji większych wahań. Uważaj na oferty „wysoki zysk bez ryzyka”.",
    category: "Długoterminowe inwestowanie",
  },
  "invest-prerequisites": {
    question: "Co warto mieć ZANIM zainwestujesz w zmienne aktywa?",
    answers: [
      { id: "A", text: "Gorący typ giełdowy" },
      { id: "B", text: "Fundusz awaryjny i opanowane drogie długi" },
      { id: "C", text: "Wymaksowaną kartę kredytową" },
      { id: "D", text: "Nic — inwestuj wszystko od razu" },
    ],
    explanation: "Najpierw fundamenty: fundusz awaryjny i spłacone wysoko oprocentowane długi chronią przed sprzedażą w najgorszym momencie.",
    category: "Długoterminowe inwestowanie",
  },
  "speculative-allocation": {
    question: "Jak początkujący powinni traktować wysoce spekulacyjne aktywa, np. kryptowaluty?",
    answers: [
      { id: "A", text: "Włożyć wszystkie oszczędności dla maksymalnych zysków" },
      { id: "B", text: "Ograniczyć do małej części, której utratę mogą w całości zaakceptować" },
      { id: "C", text: "Pożyczyć pieniądze, by kupić więcej" },
      { id: "D", text: "Traktować jako bezpieczny fundusz awaryjny" },
    ],
    explanation: "Aktywa spekulacyjne są bardzo zmienne — trzymaj je jako mały wycinek portfela i tylko za pieniądze, które możesz stracić.",
    category: "Długoterminowe inwestowanie",
  },

  // ── Emerytura w Polsce (IKE / IKZE / PPK) ────────────────────────────────
  "ike-vs-ikze": {
    question: "Jaka jest kluczowa różnica podatkowa między IKE a IKZE?",
    answers: [
      { id: "A", text: "Są identyczne pod każdym względem" },
      { id: "B", text: "IKE: zyski bez podatku przy wypłacie na warunkach; IKZE: odliczasz wpłaty teraz, przy wypłacie 10% ryczałtu" },
      { id: "C", text: "Oba są opodatkowane 19% co roku" },
      { id: "D", text: "Żadne nie daje korzyści podatkowej" },
    ],
    explanation: "IKE nagradza później (zyski bez podatku), IKZE nagradza teraz (odliczenie od dochodu), z 10% ryczałtem przy wypłacie.",
    category: "Emerytura",
  },
  "ppk-employer-match": {
    question: "Ile w PPK dokłada pracodawca do podstawowej wpłaty pracownika (2%)?",
    answers: [
      { id: "A", text: "Nic — płaci tylko pracownik" },
      { id: "B", text: "Podstawowe 1,5% pensji (plus opcjonalnie do 2,5% dodatkowo)" },
      { id: "C", text: "Stałe 100 zł niezależnie od pensji" },
      { id: "D", text: "10% pensji" },
    ],
    explanation: "Pracodawca dokłada podstawowe 1,5% Twojej pensji (może więcej) — to praktycznie darmowe pieniądze na emeryturę.",
    category: "Emerytura",
  },
  "ppk-state-bonus": {
    question: "Jakie dopłaty od państwa otrzymują uczestnicy PPK?",
    answers: [
      { id: "A", text: "Żadnych" },
      { id: "B", text: "250 zł wpłaty powitalnej i 240 zł dopłaty rocznej" },
      { id: "C", text: "Jednorazowo 50 000 zł" },
      { id: "D", text: "Darmowe akcje pracodawcy" },
    ],
    explanation: "Państwo dodaje 250 zł na start oraz 240 zł co roku — dodatkowy zwrot z oszczędzania w PPK.",
    category: "Emerytura",
  },

  // ── Rynki globalne ───────────────────────────────────────────────────────
  "deposit-guarantee-scope": {
    question: "Co tak naprawdę chronią systemy gwarantowania depozytów (BFG, FDIC, unijne DGS, FGC)?",
    answers: [
      { id: "A", text: "Wszystkie inwestycje, w tym akcje i krypto" },
      { id: "B", text: "Depozyty bankowe — nie akcje, fundusze, emerytury ani krypto" },
      { id: "C", text: "Tylko gotówkę trzymaną w domu" },
      { id: "D", text: "Twoją pensję po utracie pracy" },
    ],
    explanation: "Gwarancje depozytów obejmują pieniądze na rachunkach i lokatach. Inwestycje i krypto są poza nimi.",
    category: "Rynki globalne",
  },
  "fdic-coverage": {
    question: "Do jakiej kwoty FDIC ubezpiecza depozyty w USA (na deponenta, na bank)?",
    answers: [
      { id: "A", text: "1 000 dolarów" },
      { id: "B", text: "250 000 dolarów (na kategorię własności)" },
      { id: "C", text: "Bez limitu" },
      { id: "D", text: "W USA nie ma ubezpieczenia depozytów" },
    ],
    explanation: "FDIC ubezpiecza 250 000 USD na deponenta, na bank, dla każdej kategorii własności rachunku.",
    category: "Rynki globalne",
  },
  "eu-dgs": {
    question: "Do jakiej kwoty gwarantowane są depozyty bankowe w całej UE (w tym w Polsce)?",
    answers: [
      { id: "A", text: "1 000 € na kraj" },
      { id: "B", text: "100 000 € na deponenta w danym banku (lub równowartość w walucie krajowej)" },
      { id: "C", text: "Zawsze 1 000 000 €" },
      { id: "D", text: "W UE nic nie jest gwarantowane" },
    ],
    explanation: "Ochrona depozytów w UE jest zharmonizowana: 100 000 € na deponenta w każdym banku.",
    category: "Rynki globalne",
  },
  "us-401k-match": {
    question: "Masz w USA plan 401(k) z dopłatą pracodawcy. Jaki jest najmądrzejszy pierwszy ruch?",
    answers: [
      { id: "A", text: "Pominąć — dopłaty to podstęp" },
      { id: "B", text: "Wpłacać co najmniej tyle, by dostać pełną dopłatę pracodawcy (darmowe pieniądze)" },
      { id: "C", text: "Wpłacać dopiero po 60. roku życia" },
      { id: "D", text: "Wszystko w akcje jednej spółki" },
    ],
    explanation: "Dopłata pracodawcy to natychmiastowy 100% zwrot z tych wpłat — zawsze wykorzystaj ją w całości.",
    category: "Rynki globalne",
  },
  "tax-advantaged-wrapper": {
    question: "Co łączy brytyjskie ISA, japońskie NISA i polskie IKE?",
    answers: [
      { id: "A", text: "Gwarantują stały zysk 10%" },
      { id: "B", text: "To konta z ulgą podatkową, które chronią zyski z inwestycji" },
      { id: "C", text: "To rodzaje kart kredytowych" },
      { id: "D", text: "Są tylko dla milionerów" },
    ],
    explanation: "ISA, NISA i IKE to opakowania podatkowe — pozwalają inwestycjom rosnąć bez zwykłego obciążenia podatkiem.",
    category: "Rynki globalne",
  },
  "rbi-inflation-target": {
    question: "Jaki cel inflacyjny ma bank centralny Indii (RBI)?",
    answers: [
      { id: "A", text: "4% z pasmem tolerancji ±2 punkty procentowe" },
      { id: "B", text: "0%" },
      { id: "C", text: "15%" },
      { id: "D", text: "Nie ma celu" },
    ],
    explanation: "RBI celuje w 4% inflacji z pasmem ±2 pkt proc. (2–6%), utrzymanym na lata 2026–2031.",
    category: "Rynki globalne",
  },
};

function localizeQuestion(question: UnifiedQuestion, locale?: Locale): UnifiedQuestion {
  if (!locale || locale === "en") return question;

  if (locale === "pl") {
    const override = plQuestionOverrides[question.id];
    // Fall back to the English question when no translation exists yet, so newly
    // added questions are still shown (and counted by SRS) for every locale.
    return override ? { ...question, ...override } : question;
  }

  const challengeOverride = challengeOverrides[locale]?.[question.id];
  if (challengeOverride) return { ...question, ...challengeOverride };

  const quizOverride = getQuizQuestions(locale).find((item) => item.id === question.id);
  if (!quizOverride) return question;

  return {
    ...question,
    question: quizOverride.question,
    answers: quizOverride.answers,
    explanation: quizOverride.retryMessage,
    category: quizOverride.category,
    reward: quizOverride.reward,
  };
}

export function getAllQuestions(locale?: Locale): UnifiedQuestion[] {
  return allQuestions
    .map((question) => localizeQuestion(question, locale))
    .filter((question): question is UnifiedQuestion => Boolean(question));
}

export function getAllQuestionIds(locale?: Locale): string[] {
  return getAllQuestions(locale).map((q) => q.id);
}

export function getQuestionById(id: string, locale?: Locale): UnifiedQuestion | undefined {
  const question = allQuestions.find((q) => q.id === id);
  return question ? localizeQuestion(question, locale) : undefined;
}
