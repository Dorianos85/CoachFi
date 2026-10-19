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
  "c15": {
    "question": "Hipotetyczny miesiąc: po podstawowych potrzebach i wymaganych spłatach zostaje 100 zł; brak innych środków. Nowa rata to 150 zł. Co wynika z budżetu?",
    "answers": [
      {
        "id": "A",
        "text": "Znajomość procentu składanego pokryje brakujące 50 zł"
      },
      {
        "id": "B",
        "text": "Niepotwierdzona podwyżka gwarantuje spłatę"
      },
      {
        "id": "C",
        "text": "Brakuje 50 zł; przed decyzją sprawdź koszty i możliwość spłaty"
      },
      {
        "id": "D",
        "text": "Pożycz 50 zł i uznaj, że budżet się nie zmienił"
      }
    ],
    "explanation": "100 − 150 = −50 zł. W tym przykładzie podstawowe potrzeby i dotychczasowe wymagane spłaty odjęto już raz. Sama znajomość procentu składanego nie zapewnia dochodu ani spłaty. Przed nowym zobowiązaniem sprawdź pełne koszty, terminy i realny budżet; przy zmiennym dochodzie uwzględnij wahania. Dodatkowa pożyczka nie dowodzi pokrycia raty z podanego budżetu.",
    "category": "Decyzje kredytowe"
  },
  "poland-compound-gap": {
    "question": "Co można wywnioskować z odsetka poprawnych odpowiedzi w badaniu wiedzy o procencie składanym w Polsce?",
    "answers": [
      {
        "id": "A",
        "text": "Każda osoba z błędną odpowiedzią wpadnie w długi"
      },
      {
        "id": "B",
        "text": "Sama wiedza gwarantuje wysoką emeryturę"
      },
      {
        "id": "C",
        "text": "To wynik określonych pytań, próby, roku i punktowania"
      },
      {
        "id": "D",
        "text": "Ten odsetek opisuje wszystkie zachowania finansowe"
      }
    ],
    "explanation": "Sprawdź rok, badaną populację, treść pytań i sposób punktowania. Wynik wiedzy nie jest tym samym co zachowanie ani sytuacja finansowa. Sama zależność statystyczna nie dowodzi, że brak tej wiedzy bezpośrednio powoduje długi lub niskie oszczędności emerytalne.",
    "category": "Wiedza finansowa"
  },
  "inflation-basics": {
    "question": "Ten sam ważony koszyk kosztuje 1 000 zł, potem 1 050 zł. Co pokazuje ten przykład?",
    "answers": [
      {
        "id": "A",
        "text": "Każda cena musi wzrosnąć o 5%"
      },
      {
        "id": "B",
        "text": "Koszyk drożeje o 5%; ta sama gotówka kupuje mniej"
      },
      {
        "id": "C",
        "text": "Koszty każdego gospodarstwa rosną dokładnie o 5%"
      },
      {
        "id": "D",
        "text": "Jedna wyższa cena dowodzi ogólnej inflacji"
      }
    ],
    "explanation": "Inflacja dotyczy ogólnego wzrostu cen ważonego koszyka, nie jednej ceny. Tutaj (1 050 ÷ 1 000 − 1) × 100% = 5%; ta sama gotówka kupuje mniej tego koszyka. Gospodarstwa mają różne koszyki wydatków.",
    "category": "Inflacja"
  },
  "emergency-fund": {
    "question": "W przykładzie wybierasz 3 miesiące po 2 000 zł niezbędnych kosztów (w tym wymagane minimum długu, liczone raz). Ile wynosi cel przy stałych kosztach?",
    "answers": [
      {
        "id": "A",
        "text": "2 000 zł"
      },
      {
        "id": "B",
        "text": "4 000 zł"
      },
      {
        "id": "C",
        "text": "6 000 zł"
      },
      {
        "id": "D",
        "text": "12 000 zł"
      }
    ],
    "explanation": "3 × 2 000 zł = 6 000 zł przy podanych stałych kosztach, z minimum długu już uwzględnionym raz. Wielkość rezerwy zależy od sytuacji; 3–6 miesięcy można wybrać orientacyjnie, bez gwarancji ochrony. To nie termin zebrania kwoty ani obowiązek przelewu.",
    "category": "Fundusz awaryjny"
  },
  "saving-habit": {
  "question": "Który przelew jest bezpieczny przy zmiennym dochodzie?",
  "answers": [
    {
      "id": "A",
      "text": "Odkładać stałą kwotę mimo nieopłaconych rachunków"
    },
    {
      "id": "B",
      "text": "Pożyczać pieniądze, aby oszczędzać co miesiąc"
    },
    {
      "id": "C",
      "text": "Wybrać dostępną kwotę po potrzebach i minimalnych spłatach"
    },
    {
      "id": "D",
      "text": "Przelać cały dochód przed sprawdzeniem przyszłych rachunków"
    }
  ],
  "explanation": "Najpierw zabezpiecz potrzeby i wymagane minimalne spłaty. Następnie wybierz opcjonalny przelew z dostępnej nadwyżki. Przy zmiennym dochodzie sprawdzaj kwotę i termin; bez nadwyżki wstrzymaj przelew.",
  "category": "Nawyk oszczędzania"
},
  "interest-rates": {
    "question": "Hipotetyczny kredyt: wskaźnik 3% + marża 2 pkt proc. Przy umownej aktualizacji wskaźnik rośnie do 4%, marża bez zmian. Jakie jest nowe oprocentowanie?",
    "answers": [
      {
        "id": "A",
        "text": "2%"
      },
      {
        "id": "B",
        "text": "5%"
      },
      {
        "id": "C",
        "text": "6%"
      },
      {
        "id": "D",
        "text": "9%"
      }
    ],
    "explanation": "Nowy wskaźnik zastępuje stary: 4% + niezmieniona marża 2 pkt proc. = 6%. Termin określa umowa; sama decyzja banku centralnego nie oznacza natychmiastowej zmiany każdej raty. Oprocentowanie może być stałe lub okresowo stałe. Sprawdź uzgodniony okres i dalsze warunki umowy po jego końcu; nie oznacza to zamrożenia wszystkich opłat.",
    "category": "Kredyt i stopy procentowe"
  },
  "net-worth": {
    question: "Co oznacza wartość netto?",
    answers: [
      { id: "A", text: "Miesięczna pensja po podatku" },
      { id: "B", text: "Aktywa minus zobowiązania" },
      { id: "C", text: "Gotówka w portfelu" },
      { id: "D", text: "Ocena kredytowa" },
    ],
    explanation: "Wartość netto to aktywa minus zobowiązania na ten sam dzień. Dochód jest przepływem, a gotówka i ocena kredytowa to inne miary. Sama wartość netto nie opisuje płynności ani wartości człowieka.",
    category: "Nastawienie do pieniędzy",
  },
  "lifestyle-inflation": {
    question: "Co oznacza inflacja stylu życia?",
    answers: [
      { id: "A", text: "Podnoszenie płacy minimalnej przez państwo" },
      { id: "B", text: "Ceny rosną szybciej niż pensje" },
      { id: "C", text: "Dobrowolne zwiększanie wydatków na standard życia wraz ze wzrostem dochodu" },
      { id: "D", text: "Ubarwianie swojego CV" },
    ],
    explanation: "Inflacja stylu życia to dobrowolny wzrost wydatków uznaniowych wraz z dochodem. To co innego niż wzrost cen lub konieczne wydatki i nie oznacza, że każda podwyżka jest wydawana w całości.",
    category: "Nastawienie do pieniędzy",
  },
  "pay-yourself-first": {
    question: "Co oznacza zasada zapłać najpierw sobie?",
    answers: [
      { id: "A", text: "Najpierw wydawać na przyjemności" },
      { id: "B", text: "Planować oszczędności z nadwyżki po zabezpieczeniu potrzeb i wymaganych minimalnych spłat" },
      { id: "C", text: "Najpierw podnieść sobie pensję" },
      { id: "D", text: "Kupić luksusowe rzeczy przed zakupami spożywczymi" },
    ],
    explanation: "Najpierw zabezpiecz potrzeby i wymagane minimalne spłaty, potem wybierz oszczędności z dostępnej nadwyżki przed wydatkami uznaniowymi. Przelew jest opcjonalny; brak nadwyżki oznacza brak przelewu, bez poczucia winy.",
    category: "Nastawienie do pieniędzy",
  },
  "budget-50-30-20": {
  "question": "Przy dochodzie 4 000 zł na rękę ile wynosi przykładowa część 20%?",
  "answers": [
    {
      "id": "A",
      "text": "1 200 zł"
    },
    {
      "id": "B",
      "text": "800 zł"
    },
    {
      "id": "C",
      "text": "2 000 zł"
    },
    {
      "id": "D",
      "text": "4 000 zł"
    }
  ],
  "explanation": "4 000 × 20% = 800 zł. W tym przykładzie wymagane minimalne spłaty długu liczymy raz w potrzebach; część 20% obejmuje oszczędności i dodatkowe spłaty. To konwencja naszego przykładu, nie obowiązkowy podział.",
  "category": "Nawyk oszczędzania"
},
  "high-yield-savings": {
  "question": "Która lista jest najpełniejsza przy porównywaniu kont oszczędnościowych w Polsce?",
  "answers": [
    {
      "id": "A",
      "text": "Tylko reklamowane oprocentowanie"
    },
    {
      "id": "B",
      "text": "Oprocentowanie i warunki, opłaty, dostęp i ochronę depozytów"
    },
    {
      "id": "C",
      "text": "Czy konto gwarantuje wynik powyżej inflacji"
    },
    {
      "id": "D",
      "text": "Czy wpłata jest automatycznie inwestowana w akcje"
    }
  ],
  "explanation": "Sprawdź oprocentowanie i czas jego obowiązywania, warunki, opłaty, dostęp do wypłat oraz właściwy system gwarantowania depozytów. Konto depozytowe to nie inwestycja w akcje; inflacja nadal może obniżać siłę nabywczą.",
  "category": "Nawyk oszczędzania"
},
  dca: {
  "question": "Wpłacasz dwa razy po 100 zł, przy cenach 10 zł i 20 zł za jednostkę. Ile kupujesz?",
  "answers": [
    {
      "id": "A",
      "text": "Za każdym razem 10 jednostek"
    },
    {
      "id": "B",
      "text": "Najpierw 5, potem 10 jednostek"
    },
    {
      "id": "C",
      "text": "Najpierw 10, potem 5 jednostek"
    },
    {
      "id": "D",
      "text": "Gwarantowany zysk"
    }
  ],
  "explanation": "100 ÷ 10 = 10 jednostek; 100 ÷ 20 = 5 jednostek. DCA oznacza równe kwoty w regularnych odstępach, nie równą liczbę jednostek. Przy cenie 8 zł wszystkie 15 jednostek są warte 120 zł wobec wpłat 200 zł: strata 80 zł, bez opłat i podatków.",
  "category": "Nawyk oszczędzania"
},
  "real-return": {
    "question": "Przez rok założony nominalny zwrot to 2%, a inflacja 5%, bez opłat, podatku i przepływów. Jaki jest realny zwrot?",
    "answers": [
      {
        "id": "A",
        "text": "+7%"
      },
      {
        "id": "B",
        "text": "+2%"
      },
      {
        "id": "C",
        "text": "0%"
      },
      {
        "id": "D",
        "text": "Około −2,86%"
      }
    ],
    "explanation": "1 000 zł zmienia się nominalnie w 1 020 zł, lecz 1 020 ÷ 1,05 ≈ 971,43 zł w cenach początku przykładu. Realny zwrot to około −2,86%; 2% − 5% = −3% jest tylko przybliżeniem przez odejmowanie, bez opłat, podatku i przepływów.",
    "category": "Inflacja"
  },
  "rule-of-72": {
    "question": "Załóż stałe nominalne 6%, roczną kapitalizację, brak opłat, podatku i przepływów. Co szacuje reguła 72?",
    "answers": [
      {
        "id": "A",
        "text": "432 lata, gwarantowany wynik"
      },
      {
        "id": "B",
        "text": "Około 12 lat do podwojenia, bez gwarancji"
      },
      {
        "id": "C",
        "text": "0,08 roku, gwarantowany wynik"
      },
      {
        "id": "D",
        "text": "Dokładnie 12 lat nawet przy zmianach stopy"
      }
    ],
    "explanation": "Reguła 72 szacuje nominalne podwojenie: 72 ÷ dodatnia roczna stopa w procentach. Przy założonych stałych 6%, rocznej kapitalizacji/reinwestowaniu i bez przepływów, opłat lub podatku wychodzi około 12 lat. To nie wynik dokładny, prognoza ani gwarancja; tutaj pomijamy inflację.",
    "category": "Inflacja"
  },
  "inflation-hedge": {
    "question": "Ktoś zapewnia, że inwestycja zawsze pokona inflację. Która odpowiedź jest uzasadniona?",
    "answers": [
      {
        "id": "A",
        "text": "Uznaj dobre dawne wyniki za gwarancję"
      },
      {
        "id": "B",
        "text": "Zainwestuj środki na niezbędne rachunki"
      },
      {
        "id": "C",
        "text": "Sprawdź ryzyko straty, koszty i dostęp; zysk nie jest pewny"
      },
      {
        "id": "D",
        "text": "Długi okres usuwa całe ryzyko straty"
      }
    ],
    "explanation": "Żadna inwestycja automatycznie nie gwarantuje pokonania inflacji. Sprawdź możliwość straty, koszty i dostęp do pieniędzy. Dawne wyniki i długi czas nie są gwarancją. Chroń niezbędne wydatki i wymagane minimalne spłaty; przy zmiennych dochodach możesz odłożyć inwestowanie.",
    "category": "Inflacja"
  },
  "debt-avalanche": {
    "question": "Po potrzebach i wymaganych minimalnych spłatach zostaje 100 zł. Dług 1 000 zł ma 20%, a 500 zł 10% rocznie; stopy stałe, brak opłat, kar i zaległości. Gdzie kieruje nadwyżkę lawina?",
    "answers": [
      {
        "id": "A",
        "text": "Po równo, ignorując stopy"
      },
      {
        "id": "B",
        "text": "Na najmniejszy dług bez względu na stopę"
      },
      {
        "id": "C",
        "text": "Na dług oprocentowany 20%"
      },
      {
        "id": "D",
        "text": "Zamiast minimum innego długu"
      }
    ],
    "explanation": "Po podstawowych potrzebach i wymaganych minimalnych spłatach lawina kieruje dostępne dodatkowe 100 zł na wyższą stopę 20%. Model zakłada stałe stopy, brak opłat, kar i zaległości; rzeczywiste warunki nadpłaty sprawdza się w umowie. Brak nadwyżki nie wymaga nadpłaty.",
    "category": "Kredyt i stopy procentowe"
  },
  "credit-score-factors": {
    "question": "Które stwierdzenie odróżnia historię w BIK od zdolności kredytowej w Polsce?",
    "answers": [
      {
        "id": "A",
        "text": "Wysoki wynik gwarantuje nowy kredyt"
      },
      {
        "id": "B",
        "text": "Terminowość jest istotna; bank bada też dochody i wydatki"
      },
      {
        "id": "C",
        "text": "Punkty Coachfi zastępują ocenę banku"
      },
      {
        "id": "D",
        "text": "Dochody nie mają znaczenia dla zdolności"
      }
    ],
    "explanation": "Terminowość spłat jest istotna dla oceny ryzyka. Bank ocenia również dochody, wydatki i zobowiązania oraz podejmuje własną decyzję. Wynik BIK nie gwarantuje kredytu; punkty Coachfi nie są oceną BIK. Nie trzeba brać nowego długu ani kupować raportu, aby wykonać ćwiczenie.",
    "category": "Kredyt i stopy procentowe"
  },
  "bond-prices": {
    "question": "Przed wykupem sprzedajesz obligację o stałych przepływach. Wymagana rentowność rynkowa rośnie, inne czynniki bez zmian. Co dzieje się z ceną?",
    "answers": [
      {
        "id": "A",
        "text": "Rośnie"
      },
      {
        "id": "B",
        "text": "Spada"
      },
      {
        "id": "C",
        "text": "Kupon automatycznie rośnie"
      },
      {
        "id": "D",
        "text": "Nominał przy wykupie automatycznie maleje"
      }
    ],
    "explanation": "Dla tych samych stałych przepływów wyższa wymagana rentowność oznacza niższą cenę na rynku wtórnym. Nie zmienia to automatycznie kuponu ani umownego nominału przy wykupie. Cena sprzedaży, warunki wykupu i ryzyko niewypłacalności to różne sprawy; to nie reguła dla każdej obligacji.",
    "category": "Kredyt i stopy procentowe"
  },
  "emergency-fund-characteristics": {
    "question": "Która decyzja przeczy celowi szybko dostępnej rezerwy o niskiej zmienności?",
    "answers": [
      {
        "id": "A",
        "text": "Sprawdzenie czasu dostępu"
      },
      {
        "id": "B",
        "text": "Sprawdzenie opłat i zakresu ochrony"
      },
      {
        "id": "C",
        "text": "Cała rezerwa w zmiennych akcjach"
      },
      {
        "id": "D",
        "text": "Odróżnienie rezerwy od planowanych wydatków"
      }
    ],
    "explanation": "Cała rezerwa w zmiennych akcjach może stracić wartość, gdy jest potrzebna. Sprawdź dostęp, opłaty i warunki; niskie ryzyko nie oznacza braku strat lub kosztów. Ochrona depozytu zależy od podmiotu i produktu, a nie każda inwestycja jest objęta ochroną. To nie wybór dostawcy.",
    "category": "Fundusz awaryjny"
  },
  "emergency-fund-start": {
    "question": "Przykład: wpływ 1 000 zł, potrzeby 900 zł, wymagane minima 80 zł, brak innych kosztów i opłat. Który mały start mieści się w tych warunkach?",
    "answers": [
      {
        "id": "A",
        "text": "Przelać 100 zł, choć nadwyżka to tylko 20 zł"
      },
      {
        "id": "B",
        "text": "Dobrowolnie odłożyć 10 zł, pozostawiając 10 zł"
      },
      {
        "id": "C",
        "text": "Pożyczyć na oszczędzanie"
      },
      {
        "id": "D",
        "text": "Uznać miesiąc kosztów za obowiązkowy próg startu"
      }
    ],
    "explanation": "1 000 − 900 − 80 = 20 zł. Dobrowolne 10 zł mieści się w nadwyżce i zostawia 10 zł; nie ma obowiązku przelewu. Przy 980 zł wpływu nadwyżka to 0 zł. Miesiąc wydatków nie jest wymaganym pierwszym celem; przy braku środków wstrzymaj przelew, nie pożyczaj na oszczędzanie.",
    "category": "Fundusz awaryjny"
  },
  "compound-interest": {
    question: "Co oznacza procent składany, gdy dopisane odsetki zostają w saldzie?",
    answers: [
      { id: "A", text: "Odsetki wyłącznie od kwoty początkowej" },
      { id: "B", text: "Opłatę za wcześniejszą wypłatę" },
      { id: "C", text: "Odsetki od kapitału i pozostawionych wcześniejszych odsetek" },
      { id: "D", text: "Pewny zysk z każdej inwestycji" },
    ],
    explanation: "W hipotetycznym modelu 1 000 zł przy stałych 5% rocznie i kapitalizacji rocznej daje 1 050 zł, potem 1 102,50 zł. Odsetki zostają; brak dopłat, wypłat, opłat i podatku, inflacja pominięta. Dodatkowe 2,50 zł pochodzi z odsetek od pierwszych 50 zł odsetek. To model nominalny, nie oferta lub gwarancja zysku z inwestycji.",
    category: "Długoterminowe inwestowanie",
  },
  diversification: {
    question: "Co jest celem dywersyfikacji, bez gwarancji uniknięcia strat?",
    answers: [
      { id: "A", text: "Ulokowanie wszystkiego w jednej spółce" },
      { id: "B", text: "Rozłożenie inwestycji, by ograniczyć ryzyko koncentracji" },
      { id: "C", text: "Zapewnienie zysku niezależnie od rynku" },
      { id: "D", text: "Cotygodniowa zmiana portfela zapewniająca zysk" },
    ],
    explanation: "Różne inwestycje mogą ograniczyć zależność od jednego emitenta lub sektora. Wiele pozycji może jednak mieć podobne ryzyko i spadać jednocześnie. Dywersyfikacja nie gwarantuje zysku i nie usuwa ryzyka strat rynkowych.",
    category: "Długoterminowe inwestowanie",
  },
  "index-fund": {
    question: "Co określa fundusz indeksowy?",
    answers: [
      { id: "A", text: "Zawsze zerowe koszty" },
      { id: "B", text: "Cel odwzorowania wskazanego indeksu" },
      { id: "C", text: "To, że każdy ETF jest indeksowy" },
      { id: "D", text: "Gwarantowany wynik lepszy od rynku" },
    ],
    explanation: "Fundusz indeksowy dąży do odwzorowania wskazanego indeksu. Koszty i błąd odwzorowania mogą powodować różnice wyniku. Nie każdy fundusz indeksowy jest tańszy; sprawdź rzeczywiste koszty i ryzyko. ETF może być indeksowy albo aktywnie zarządzany. Sama nazwa nie obiecuje przewagi nad rynkiem.",
    category: "Długoterminowe inwestowanie",
  },
  "etf-definition": {
    question: "Co oznacza ETF?",
    answers: [
      { id: "A", text: "Konto z gwarantowanymi odsetkami" },
      { id: "B", text: "Opłatę za przelew" },
      { id: "C", text: "Fundusz, którego tytuły są notowane na giełdzie" },
      { id: "D", text: "Fundusz zawsze śledzący szeroki indeks" },
    ],
    explanation: "ETF to fundusz notowany na giełdzie. Może mieć strategię indeksową lub aktywną i wąski zakres inwestycji. Sam ETF nie zapewnia szerokiej dywersyfikacji ani ochrony kapitału. Sprawdź skład, ryzyko, opłaty oraz koszty zakupu i sprzedaży; można ponieść stratę.",
    category: "Długoterminowe inwestowanie",
  },
  "time-in-market": {
    question: "Co uwzględnić w planie inwestowania zamiast zakładać pewny zysk dzięki samemu czasowi?",
    answers: [
      { id: "A", text: "Datę pewnego dołka rynku" },
      { id: "B", text: "Cel, horyzont, rezerwę, akceptowane straty i koszty" },
      { id: "C", text: "Sprzedaż zawsze po spadku o 10%" },
      { id: "D", text: "Trzymanie każdej inwestycji zawsze" },
    ],
    explanation: "Długi horyzont sam nie gwarantuje zysku. Plan zależy od celu, terminu potrzeby pieniędzy, rezerwy, ryzyka i kosztów; można go ponownie ocenić, gdy zmienią się okoliczności. Nie ma tu reguły zawsze trzymaj ani sprzedaj po określonym spadku. Potrzeby i wymagane minimum są pierwsze, a brak nadwyżki pozwala nie inwestować.",
    category: "Długoterminowe inwestowanie",
  },
  "retirement-purpose": {
    question: "Jaki jest cel planowania finansów na emeryturę?",
    answers: [
      { id: "A", text: "Pewność utrzymania każdego dzisiejszego dochodu" },
      { id: "B", text: "Przygotowanie środków na przyszłe potrzeby po zmianie lub zakończeniu pracy" },
      { id: "C", text: "Zastąpienie rezerwy awaryjnej ryzykowną inwestycją" },
      { id: "D", text: "Podwojenie środków przez samo otwarcie konta" },
    ],
    explanation: "Plan porównuje przyszłe potrzeby i możliwe źródła środków; nie gwarantuje utrzymania dzisiejszego dochodu. Rezerwa awaryjna ma odrębną rolę. Wynik zależy m.in. od wpłat, warunków, kosztów i ryzyka. Potrzeby, wymagane minimalne spłaty i rezerwa są pierwsze; bez nadwyżki można zacząć od bezkosztowego planu, bez zakupu lub otwierania konta.",
    category: "Emerytura",
  },
  "retirement-early-start": {
    question: "Model: 1 000 zł jednorazowo, stałe 5% rocznie, kapitalizacja roczna, odsetki zostają. Bez dopłat, wypłat, opłat i podatku; inflacja pominięta. Ile nominalnie po 2 latach?",
    answers: [
      { id: "A", text: "1 000 zł" },
      { id: "B", text: "1 100 zł" },
      { id: "C", text: "1 102,50 zł" },
      { id: "D", text: "2 000 zł" },
    ],
    explanation: "W tym hipotetycznym modelu 1 000 × 1,05 × 1,05 = 1 102,50 zł. Po pierwszym roku jest 1 050 zł; drugie odsetki to 52,50 zł. Dodatni wynik wynika z założonej stałej stopy, nie z samego upływu czasu. Więcej okresów daje tu więcej kapitalizacji, ale rzeczywiste wyniki mogą być inne i straty są możliwe. To nie prognoza emerytury ani zalecenie wpłaty.",
    category: "Emerytura",
  },
  "insurance-purpose": {
    "question": "Jaki jest ochronny cel ubezpieczenia na życie na wypadek śmierci?",
    "answers": [
      {
        "id": "A",
        "text": "Wzbogacenie się po czyjejś śmierci"
      },
      {
        "id": "B",
        "text": "Pomoc finansowa uprawnionym po śmierci ubezpieczonego, zgodnie z warunkami umowy"
      },
      {
        "id": "C",
        "text": "Oszczędność podatkowa"
      },
      {
        "id": "D",
        "text": "Bezpieczne inwestowanie na giełdzie"
      }
    ],
    "explanation": "Świadczenie może pomóc uprawnionym, także osobom zależnym finansowo. Zakres zależy od umowy i ogólnych warunków ubezpieczenia (OWU), sumy ubezpieczenia, wyłączeń i wskazania uposażonych. Nie oznacza to automatycznie pełnego zastąpienia dochodu ani wypłaty w każdej sytuacji. Potrzeba ochrony zależy od zobowiązań i sytuacji; quiz nie ustala, że każdy musi kupić polisę.",
    "category": "Plan finansowy rodziny"
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
    "question": "Jak rozumieć 50/30/20 jako elastyczną wskazówkę dla dochodu netto?",
    "answers": [
      {
        "id": "A",
        "text": "50% oszczędności, 30% potrzeby, 20% zachcianki"
      },
      {
        "id": "B",
        "text": "50% potrzeby, 30% zachcianki, 20% oszczędności i spłaty długu"
      },
      {
        "id": "C",
        "text": "Zawsze oszczędzać 20%, nawet kosztem podstawowych rachunków"
      },
      {
        "id": "D",
        "text": "Pożyczać, aby koniecznie odłożyć 20%"
      }
    ],
    "explanation": "50/30/20 to orientacyjny podział dochodu netto, który można zmienić. Najpierw zabezpiecz podstawowe potrzeby i wymagane minimalne spłaty; nie licz tej samej spłaty dwukrotnie. Przy zmiennym dochodzie dostosuj kwoty. Bez nadwyżki nie wymuszaj oszczędzania 20%.",
    "category": "Wyzwanie"
  },
  c2: {
    "question": "Model: 1 000 zł, stałe hipotetyczne 5% rocznie, kapitalizacja roczna, odsetki zostają. Bez dopłat, wypłat, opłat i podatku; inflacja pominięta. Ile nominalnie po 2 latach?",
    "answers": [
      {
        "id": "A",
        "text": "1 000 zł"
      },
      {
        "id": "B",
        "text": "1 100 zł"
      },
      {
        "id": "C",
        "text": "1 102,50 zł"
      },
      {
        "id": "D",
        "text": "2 000 zł"
      }
    ],
    "explanation": "Procent składany nalicza odsetki także od zatrzymanych wcześniejszych odsetek. W modelu 1 000 × 1,05 × 1,05 = 1 102,50 zł. Dodatni wynik zależy od założonych 5%, nie samego czasu. To hipotetyczny rachunek, bez gwarancji rzeczywistego zysku; inwestycje mogą tracić.",
    "category": "Wyzwanie"
  },
  c3: {
    "question": "Co opisuje dywersyfikację i jej ograniczenie?",
    "answers": [
      {
        "id": "A",
        "text": "Wszystko w jedną silną spółkę"
      },
      {
        "id": "B",
        "text": "Różne aktywa mogą ograniczyć koncentrację; straty nadal są możliwe"
      },
      {
        "id": "C",
        "text": "Jedna obligacja usuwa każde ryzyko"
      },
      {
        "id": "D",
        "text": "Częste transakcje gwarantują ochronę przed spadkiem"
      }
    ],
    "explanation": "Dywersyfikacja rozkłada ekspozycję na różne aktywa i może ograniczać ryzyko koncentracji. Nie usuwa ryzyka rynkowego ani nie gwarantuje uniknięcia strat. Różne nazwy funduszy mogą kryć podobne aktywa; sprawdź skład, ryzyko i koszty. Zakup nie jest wymagany.",
    "category": "Wyzwanie"
  },
  c4: {
    "question": "Jak działa lawina długu, gdy podstawowe potrzeby i wszystkie wymagane minimalne spłaty są zabezpieczone?",
    "answers": [
      {
        "id": "A",
        "text": "Finansuje każdą nadpłatę nową pożyczką"
      },
      {
        "id": "B",
        "text": "Zawsze zaczyna od najmniejszego salda"
      },
      {
        "id": "C",
        "text": "Kieruje dostępną nadpłatę na dług o najwyższym oprocentowaniu"
      },
      {
        "id": "D",
        "text": "Pomija wymagane raty innych długów"
      }
    ],
    "explanation": "Lawina kieruje dostępną nadpłatę na najwyższe oprocentowanie po podstawowych potrzebach i minimach wszystkich długów. Przy stałych stopach i braku dodatkowych opłat może ograniczać odsetki. Sprawdź opłaty i skutki zaległości; bez nadwyżki nie wymuszaj nadpłaty. Nie gwarantuje najniższego łącznego kosztu w każdych warunkach.",
    "category": "Wyzwanie"
  },
  c5: {
    "question": "Hipotetycznie: nominalnie +2% i inflacja 5% za ten sam rok, bez opłat i podatku. Jaka jest realna stopa zwrotu po zaokrągleniu?",
    "answers": [
      {
        "id": "A",
        "text": "+7%"
      },
      {
        "id": "B",
        "text": "+2%"
      },
      {
        "id": "C",
        "text": "0%"
      },
      {
        "id": "D",
        "text": "Około −2,86%"
      }
    ],
    "explanation": "Dokładna relacja to (1,02 ÷1,05 −1) × 100% ≈ −2,86%. Odejmowanie 2% −5% =−3% jest przybliżeniem. Początkowe 1 000 zł daje nominalnie 1 020 zł, czyli około 971,43 zł w cenach początkowych. Model zakłada ten sam rok, brak opłat i podatku; nie opisuje bieżącej oferty.",
    "category": "Wyzwanie"
  },
  c6: {
    "question": "Które stwierdzenie o funduszach jest poprawne?",
    "answers": [
      {
        "id": "A",
        "text": "Każdy ETF zawsze śledzi indeks"
      },
      {
        "id": "B",
        "text": "Fundusz indeksowy śledzi indeks; ETF może być indeksowy lub aktywny"
      },
      {
        "id": "C",
        "text": "Każdy fundusz indeksowy jest najtańszy"
      },
      {
        "id": "D",
        "text": "Każdy ETF gwarantuje wynik lepszy od rynku"
      }
    ],
    "explanation": "Fundusz indeksowy ma na celu śledzenie indeksu. ETF to forma funduszu notowanego na giełdzie; może być indeksowy lub aktywny. Żadna z tych nazw nie gwarantuje niskich kosztów, przewagi nad rynkiem ani braku strat. Sprawdź cel, skład, ryzyko i wszystkie koszty. Nie musisz inwestować.",
    "category": "Wyzwanie"
  },
  c7: {
    "question": "Co opisuje DCA?",
    "answers": [
      {
        "id": "A",
        "text": "Kupowanie całej kwoty wyłącznie w najniższej cenie"
      },
      {
        "id": "B",
        "text": "Sprzedaż wszystkiego przy każdym spadku"
      },
      {
        "id": "C",
        "text": "Stała kwota w regularnych odstępach, niezależnie od ceny"
      },
      {
        "id": "D",
        "text": "Zamiana oszczędności na dolary"
      }
    ],
    "explanation": "DCA oznacza równą kwotę w regularnych odstępach; niższa cena daje więcej jednostek. Nie gwarantuje zysku ani ochrony przed stratą i nie usuwa automatycznie emocji. Przykład bez opłat i podatku: 100 zł przy cenie 10 zł i 100 zł przy 20 zł to 15 jednostek. Przy cenie 8 zł są warte 120 zł wobec 200 zł wpłat. Wpłaty są dobrowolne, po podstawowych potrzebach i wymaganych minimalnych spłatach.",
    "category": "Wyzwanie"
  },
  c8: {
    "question": "Reguła 72: hipotetyczne stałe dodatnie 8% nominalnie rocznie, kapitalizacja roczna, bez wpłat, wypłat, opłat i podatku; inflacja pominięta. Jaki szacunek czasu do podwojenia daje ta reguła?",
    "answers": [
      {
        "id": "A",
        "text": "Około 6 lat"
      },
      {
        "id": "B",
        "text": "Około 9 lat"
      },
      {
        "id": "C",
        "text": "Około 72 lat"
      },
      {
        "id": "D",
        "text": "Dokładnie 9 lat dla każdej inwestycji"
      }
    ],
    "explanation": "72 ÷8 ≈ 9 lat to przybliżenie, nie dokładny termin. W podanym modelu 1 000 × 1,08⁹ ≈1 999,00 zł; po 10 rocznych dopisaniach jest ponad 2 000 zł. Stałe dodatnie 8% jest założeniem, nie prognozą. Rzeczywiste stopy mogą się zmieniać, a inwestycje tracić. To nominalny model bez przepływów, opłat, podatku i inflacji.",
    "category": "Wyzwanie"
  },
  c9: {
    "question": "Czym jest ETF?",
    "answers": [
      {
        "id": "A",
        "text": "Depozytem gwarantującym określone odsetki"
      },
      {
        "id": "B",
        "text": "Elektroniczną opłatą za przelew"
      },
      {
        "id": "C",
        "text": "Funduszem notowanym na giełdzie, indeksowym lub aktywnym"
      },
      {
        "id": "D",
        "text": "Państwową rezerwą awaryjną"
      }
    ],
    "explanation": "ETF jest funduszem notowanym na giełdzie. Może śledzić indeks albo być zarządzany aktywnie. Dywersyfikacja zależy od rzeczywistego składu; fundusz wąskiego sektora może być skoncentrowany. Nazwa nie gwarantuje niskich kosztów ani braku strat. Sprawdź cel, skład, ryzyko i koszty; zakup nie jest wymagany.",
    "category": "Wyzwanie"
  },
  c10: {
    "question": "Który wybór NIE pasuje do celu rezerwy awaryjnej?",
    "answers": [
      {
        "id": "A",
        "text": "Łatwy dostęp w razie nagłego wydatku"
      },
      {
        "id": "B",
        "text": "Cel dopasowany do sytuacji i mały osiągalny start"
      },
      {
        "id": "C",
        "text": "Ryzykowne akcje wyłącznie dla maksymalnego wzrostu"
      },
      {
        "id": "D",
        "text": "Oddzielenie rezerwy od codziennych wydatków"
      }
    ],
    "explanation": "Celem rezerwy jest dostęp do środków na nagłe potrzeby, przy ograniczonym ryzyku, a nie maksymalizacja zysku. Oddziel ją od codziennych wydatków. Wielkość zależy od sytuacji;3–6 miesięcy to opcjonalna orientacja, nie obowiązek ani gwarancja. Zacznij dobrowolnie po podstawowych potrzebach i wymaganych minimalnych spłatach; bez nadwyżki wstrzymaj wpłatę.",
    "category": "Wyzwanie"
  },
  c11: {
    "question": "Co zwykle dzieje się z ceną istniejącej obligacji o stałym kuponie na rynku wtórnym, gdy porównywalna rentowność rynkowa rośnie, a pozostałe warunki są takie same?",
    "answers": [
      {
        "id": "A",
        "text": "Cena rośnie"
      },
      {
        "id": "B",
        "text": "Cena spada"
      },
      {
        "id": "C",
        "text": "Cena zawsze pozostaje równa nominałowi"
      },
      {
        "id": "D",
        "text": "Cena musi się podwoić"
      }
    ],
    "explanation": "Przy stałych przepływach i pozostałych warunkach bez zmian wyższa rentowność rynkowa oznacza niższą cenę wtórną. Ustalony kupon nie rośnie automatycznie. Cena sprzedaży przed wykupem różni się od płatności umownych. Wykup zależy także od wypłacalności emitenta; ryzyko niewypłacalności i płynności pozostaje.",
    "category": "Wyzwanie"
  },
  c12: {
    "question": "Hipotetycznie: dochód rośnie o 200 zł miesięcznie, dobrowolne wydatki o 180 zł; podstawowe potrzeby i wymagane minimalne spłaty bez zmian. O ile rośnie nadwyżka?",
    "answers": [
      {
        "id": "A",
        "text": "O 200 zł"
      },
      {
        "id": "B",
        "text": "O 180 zł"
      },
      {
        "id": "C",
        "text": "O 20 zł"
      },
      {
        "id": "D",
        "text": "Nie może zmienić się nigdy"
      }
    ],
    "explanation": "200 − 180 = 20 zł dodatkowej miesięcznej nadwyżki. Wzrost dobrowolnych wydatków wraz z dochodem to przykład inflacji stylu życia, odrębnej od wzrostu cen i koniecznych kosztów. Nie każda podwyżka musi być oszczędzana. Dostosuj plan do potrzeb, wymaganych minimalnych spłat, celów i zmiennego dochodu; to nie ocena osoby.",
    "category": "Wyzwanie"
  },
  c13: {
    "question": "Jaki jest główny cel długoterminowego planowania na emeryturę?",
    "answers": [
      {
        "id": "A",
        "text": "Gwarantowane podwojenie każdego salda"
      },
      {
        "id": "B",
        "text": "Przygotowanie środków na przyszłe potrzeby po zmianie lub końcu pracy"
      },
      {
        "id": "C",
        "text": "Zastąpienie rezerwy awaryjnej ryzykowną inwestycją"
      },
      {
        "id": "D",
        "text": "Pewna ulga podatkowa dla każdej wpłaty i każdego konta"
      }
    ],
    "explanation": "Planowanie pomaga przygotować środki na przyszłe potrzeby, ale nie gwarantuje pełnego zastąpienia dochodu ani zysku. Sam cel emerytalny nie zapewnia ulgi podatkowej każdemu kontu. Podstawowe potrzeby, wymagane minimalne spłaty i rezerwa mają pierwszeństwo przed dobrowolną inwestycją. Przy zmiennym dochodzie dostosuj lub wstrzymaj wpłaty.",
    "category": "Wyzwanie"
  },
  c14: {
    "question": "Hipotetycznie na dany dzień: aktywa 50 000 zł, zobowiązania 20 000 zł. Ile wynosi wartość netto?",
    "answers": [
      {
        "id": "A",
        "text": "70 000 zł"
      },
      {
        "id": "B",
        "text": "30 000 zł"
      },
      {
        "id": "C",
        "text": "50 000 zł"
      },
      {
        "id": "D",
        "text": "Miesięczna pensja"
      }
    ],
    "explanation": "Wartość netto =aktywa −zobowiązania:50 000 − 20 000 = 30 000 zł na ten dzień. To stan majątku, nie miesięczny przepływ dochodów i wydatków ani ilość dostępnej gotówki. Nie określa całego dobrostanu finansowego i nie jest oceną wartości osoby. Wyceny i zobowiązania mogą się zmieniać.",
    "category": "Wyzwanie"
  },

  // ── Makroekonomia (NBP / IMF / Fed) ──────────────────────────────────────
  "nbp-inflation-target": {
    "question": "Jaki cel inflacyjny realizuje Narodowy Bank Polski od 2004 roku?",
    "answers": [
      {
        "id": "A",
        "text": "0% — ceny nigdy nie powinny rosnąć"
      },
      {
        "id": "B",
        "text": "2,5% z pasmem odchyleń ±1 punkt procentowy"
      },
      {
        "id": "C",
        "text": "5%, aby zachęcać do wydawania"
      },
      {
        "id": "D",
        "text": "Taki, jaki co roku ustali rząd"
      }
    ],
    "explanation": "Od 2004 r. cel NBP wynosi 2,5% rocznej zmiany CPI w średnim okresie, z symetrycznym odchyleniem ±1 punkt procentowy (granice: 1,5% i 3,5%). To cel, nie bieżąca inflacja, prognoza ani gwarancja wyniku w każdym miesiącu. CPI dotyczy koszyka cen, nie identycznej zmiany każdej ceny. Przedział nie oznacza oprocentowania kredytu ani lokaty.",
    "category": "Makroekonomia"
  },
  "inflation-target-why": {
    "question": "Po co bank centralny wybiera niewielki dodatni cel inflacyjny?",
    "answers": [
      {
        "id": "A",
        "text": "Aby waluta szybciej traciła wartość"
      },
      {
        "id": "B",
        "text": "Daje margines wobec ryzyka deflacji i może ułatwiać stabilizację cen"
      },
      {
        "id": "C",
        "text": "Bo wyższe ceny są zawsze dobre"
      },
      {
        "id": "D",
        "text": "Tylko po to, by zwiększyć wpływy z podatków"
      }
    ],
    "explanation": "Niewielki dodatni cel daje margines wobec ryzyka deflacji i może ułatwiać działanie polityki pieniężnej. Nie gwarantuje wzrostu gospodarki ani przewidywalności każdej ceny. Cel dotyczy tempa zmiany ogólnego poziomu cen; dodatnia inflacja oznacza, że ten poziom nadal rośnie. Konkretne cele różnią się między bankami centralnymi.",
    "category": "Makroekonomia"
  },
  "monetary-policy-tool": {
    "question": "Jakie jest główne narzędzie banku centralnego do sterowania inflacją?",
    "answers": [
      {
        "id": "A",
        "text": "Drukowanie banknotów dla obywateli"
      },
      {
        "id": "B",
        "text": "Ustalanie referencyjnych stóp procentowych"
      },
      {
        "id": "C",
        "text": "Ustalanie ceny chleba"
      },
      {
        "id": "D",
        "text": "Zakaz importu"
      }
    ],
    "explanation": "Stopy procentowe są podstawowym narzędziem NBP, ale nie jedynym: służą też operacje otwartego rynku i inne instrumenty. Oddziałują na warunki finansowania, popyt i inflację z opóźnieniem oraz niepewną siłą. NBP nie ustala w ten sposób każdej ceny ani oprocentowania każdej umowy; warunki ofert banków mogą się różnić.",
    "category": "Makroekonomia"
  },
  "rates-and-borrowing": {
    "question": "Co zwykle dzieje się, gdy bank centralny podnosi stopy procentowe?",
    "answers": [
      {
        "id": "A",
        "text": "Kredyt tanieje i wydatki rosną"
      },
      {
        "id": "B",
        "text": "Kredyt może drożeć, osłabiając popyt i presję inflacyjną"
      },
      {
        "id": "C",
        "text": "Nic się nie zmienia dla gospodarstw domowych"
      },
      {
        "id": "D",
        "text": "Konta oszczędnościowe zawsze płacą 0%"
      }
    ],
    "explanation": "Wyższe stopy mogą podnosić koszt nowego lub zmiennie oprocentowanego kredytu, osłabiając popyt i presję inflacyjną; wpływ jest opóźniony i niepewny. Warunki oraz terminy zmiany oprocentowania zależą od umowy; uzgodniony okres stałej stopy nie musi reagować od razu. Wolniejsza dodatnia inflacja oznacza wolniejszy wzrost cen, a nie ich spadek. To nie prognoza rat ani decyzja o kredycie.",
    "category": "Makroekonomia"
  },
  "gdp-definition": {
    "question": "Co mierzy PKB (Produkt Krajowy Brutto)?",
    "answers": [
      {
        "id": "A",
        "text": "Łączne oszczędności obywateli"
      },
      {
        "id": "B",
        "text": "Wartość dóbr i usług finalnych wytworzonych w gospodarce w danym okresie"
      },
      {
        "id": "C",
        "text": "Ilość gotówki w obiegu"
      },
      {
        "id": "D",
        "text": "Dług publiczny"
      }
    ],
    "explanation": "PKB opisuje wartość produkcji finalnej w gospodarce w danym okresie. W ujęciu produkcyjnym GUS sumuje wartość dodaną brutto i podatki od produktów pomniejszone o dotacje; dóbr pośrednich nie dodaje się drugi raz do wartości dóbr finalnych. PKB nie jest sumą oszczędności, osobistym dochodem ani pełną miarą dobrostanu lub podziału dochodów.",
    "category": "Makroekonomia"
  },
  "deflation-risk": {
    "question": "Dlaczego utrzymujący się spadek ogólnego poziomu cen (deflacja) może być groźny?",
    "answers": [
      {
        "id": "A",
        "text": "Wszyscy się bogacą i nie ma żadnych minusów"
      },
      {
        "id": "B",
        "text": "Może opóźniać część zakupów, osłabiać popyt i zwiększać realny ciężar długów"
      },
      {
        "id": "C",
        "text": "Zawsze podnosi pensje"
      },
      {
        "id": "D",
        "text": "Nie ma wpływu na gospodarkę"
      }
    ],
    "explanation": "Utrzymujący się spadek ogólnego poziomu cen może skłaniać do odkładania części zakupów, osłabiać popyt i zwiększać realny ciężar niezmienionego nominalnie długu. To możliwe mechanizmy, nie nieuchronna spirala w każdej sytuacji. Pojedyncza promocja ani wolniejsza dodatnia inflacja nie oznaczają deflacji. Nie jest to zachęta do odraczania pilnych podstawowych potrzeb lub wymaganych spłat.",
    "category": "Makroekonomia"
  },

  // ── Budżet domowy (CFPB / OECD) ──────────────────────────────────────────
  "zero-based-budget": {
    "question": "Co oznacza „zero” w budżecie od zera?",
    "answers": [
      {
        "id": "A",
        "text": "Trzeba wydać wszystko i opróżnić konto"
      },
      {
        "id": "B",
        "text": "Każda dostępna złotówka ma cel w planie, także rezerwa"
      },
      {
        "id": "C",
        "text": "Oszczędności muszą wynosić zero"
      },
      {
        "id": "D",
        "text": "Wolno używać wyłącznie gotówki"
      }
    ],
    "explanation": "To metoda planowania, nie nakaz wydania wszystkiego ani wyzerowania konta. Hipotetycznie: 1000 zł = 800 zł podstawowych potrzeb + 100 zł wymaganych minimalnych spłat + 100 zł dobrowolnej rezerwy; nieprzypisane: 0 zł. Spłaty policzono raz. Przy zmiennym dochodzie aktualizuj plan; bez nadwyżki nie ma obowiązku odkładania. Plan nie gwarantuje braku nieprzewidzianych wydatków.",
    "category": "Budżet domowy"
  },
  "track-before-budget": {
    "question": "Co może pomóc poznać wydatki przed ułożeniem lub zmianą budżetu?",
    "answers": [
      {
        "id": "A",
        "text": "Najpierw przez 30 dni wstrzymaj pilne podstawowe zakupy"
      },
      {
        "id": "B",
        "text": "Dobrowolnie przejrzyj własne wydatki przez dogodny okres i wybraną metodą"
      },
      {
        "id": "C",
        "text": "Każda osoba musi najpierw zebrać dokładnie 30 dni danych"
      },
      {
        "id": "D",
        "text": "Pożycz pieniądze zamiast sprawdzić wydatki"
      }
    ],
    "explanation": "Możesz zacząć od dnia lub tygodnia własnych notatek, a potem rozszerzyć okres; 30 dni nie jest obowiązkowym warunkiem. Uwzględnij też rzadsze rachunki i zmienny dochód. Nie odkładaj pilnych podstawowych potrzeb ani wymaganych minimalnych spłat na czas obserwacji. Wybierz wygodną metodę i wróć do niej, gdy możesz; nie trzeba przekazywać danych aplikacji.",
    "category": "Budżet domowy"
  },
  "sinking-fund": {
    "question": "Na dobrowolny zakup za 600 zł za 6 miesięcy masz odłożone 0 zł. Ile wynosi 6 równych wpłat przed zakupem, pomijając odsetki i opłaty?",
    "answers": [
      {
        "id": "A",
        "text": "600 zł co miesiąc"
      },
      {
        "id": "B",
        "text": "100 zł co miesiąc na ten planowany cel"
      },
      {
        "id": "C",
        "text": "0 zł, bo rezerwa gwarantuje pokrycie każdego kosztu"
      },
      {
        "id": "D",
        "text": "Pożyczka zawsze zastępuje taki plan"
      }
    ],
    "explanation": "600 ÷ 6 = 100 zł miesięcznie w tym hipotetycznym planie. Fundusz celowy służy znanemu przyszłemu kosztowi; rezerwa awaryjna dotyczy nieoczekiwanych zdarzeń. Wpłaty są dobrowolne, po podstawowych potrzebach i wymaganych minimalnych spłatach. Bez nadwyżki zmień cel lub odłóż ten dobrowolny zakup; przy zmiennym dochodzie aktualizuj plan. Nie ma gwarancji uniknięcia długu.",
    "category": "Budżet domowy"
  },
  "impulse-pause": {
    "question": "Co możesz opcjonalnie zrobić przed niepilnym, niekoniecznym zakupem?",
    "answers": [
      {
        "id": "A",
        "text": "Zawsze kup natychmiast, a koszt sprawdź później"
      },
      {
        "id": "B",
        "text": "Zrobić wybraną pauzę i sprawdzić potrzebę, cenę oraz plan"
      },
      {
        "id": "C",
        "text": "Odkładać także pilne podstawowe zakupy"
      },
      {
        "id": "D",
        "text": "Uznać, że każda pauza gwarantuje oszczędność"
      }
    ],
    "explanation": "Możesz zrobić pauzę i wrócić do decyzji w dogodnym czasie. To opcja, nie obowiązkowe 24 godziny ani gwarancja oszczędności lub zmiany chęci zakupu. Nie odkładaj pilnych podstawowych potrzeb ani wymaganych minimalnych spłat. Po przerwie spokojnie sprawdź cenę, dostępne środki i priorytety; możesz zmienić decyzję bez presji.",
    "category": "Budżet domowy"
  },

  // ── Oszczędzanie i bezpieczeństwo depozytów ──────────────────────────────
  "emergency-first-milestone": {
    question: "Po zabezpieczeniu podstawowych potrzeb i wymaganych minimalnych spłat zostaje 20 zł nadwyżki. Który mały pierwszy krok jest dobrowolną opcją w tym przykładzie?",
    answers: [
      { id: "A", text: "Obowiązkowo odłożyć miesiąc kosztów naraz" },
      { id: "B", text: "Wybrać np. 5 zł; przy braku nadwyżki zrobić pauzę" },
      { id: "C", text: "Pożyczyć 100 zł na założenie rezerwy" },
      { id: "D", text: "Przelać cały dochód przed opłaceniem rachunków" },
    ],
    explanation: "Przykładowy budżet: 1 200 zł wpływu − 1 080 zł potrzeb − 100 zł wymaganych minimalnych spłat = 20 zł nadwyżki, bez innych kosztów lub opłat. Dobrowolne 5 zł zostawia 15 zł; przelew nie jest wymagany. Cel dopasuj do sytuacji, bez obowiązkowego miesiąca na start. Przy braku nadwyżki zrób pauzę; nie pożyczaj na oszczędzanie.",
    category: "Fundusz awaryjny",
  },
  "bfg-guarantee": {
    "question": "Jaki jest podstawowy limit BFG dla uprawnionego deponenta w jednym banku objętym systemem?",
    "answers": [
      {
        "id": "A",
        "text": "Nie ma żadnej gwarancji depozytów"
      },
      {
        "id": "B",
        "text": "Równowartość w złotych 100 000 EUR na deponenta w jednym banku"
      },
      {
        "id": "C",
        "text": "Dokładnie 10 000 zł łącznie"
      },
      {
        "id": "D",
        "text": "Bez limitu, zawsze 100%"
      }
    ],
    "explanation": "Łączy się kwalifikujące depozyty z odsetkami jednego uprawnionego deponenta w jednym objętym banku. Kwoty odniesienia: 60 000 + 50 000 = 110 000 EUR; bez szczególnej wyższej ochrony podstawowy limit obejmuje 100 000 EUR. To nie wycena rachunków walutowych ani wyliczenie wypłaty. BFG wypłaca w PLN; limit w PLN zależy od średniego kursu NBP z dnia spełnienia warunku gwarancji, nie stałego kursu. Są wyłączenia i szczególne wyższe gwarancje.",
    "category": "Nawyk oszczędzania"
  },

  // ── Długoterminowe inwestowanie (SEC / FINRA) ────────────────────────────
  "asset-allocation": {
    "question": "Co oznacza alokacja aktywów?",
    "answers": [
      {
        "id": "A",
        "text": "Wybór jednej zwycięskiej akcji"
      },
      {
        "id": "B",
        "text": "Podział inwestycji między akcje, obligacje i gotówkę"
      },
      {
        "id": "C",
        "text": "Pożyczanie pieniędzy na inwestycje"
      },
      {
        "id": "D",
        "text": "Trzymanie wszystkiego na rachunku bieżącym"
      }
    ],
    "explanation": "Alokacja to podział między rodzaje aktywów, np. akcje, obligacje i gotówkę. Dobór zależy od celu, czasu i możliwości poniesienia straty. Taki podział wpływa na ryzyko i możliwy wynik, ale nie gwarantuje zysku ani ochrony przed stratą; nie ma jednego właściwego zestawu proporcji dla każdego.",
    "category": "Długoterminowe inwestowanie"
  },
  rebalancing: {
    "question": "Czym jest rebalancing portfela?",
    "answers": [
      {
        "id": "A",
        "text": "Sprzedażą wszystkiego, gdy rynek spada"
      },
      {
        "id": "B",
        "text": "Okresowym przywracaniem docelowych proporcji portfela"
      },
      {
        "id": "C",
        "text": "Dokupowaniem tylko najlepszej akcji"
      },
      {
        "id": "D",
        "text": "Codziennym sprawdzaniem salda"
      }
    ],
    "explanation": "Rebalancing przywraca docelowe proporcje portfela. Można korygować skład lub kierunek nowych wpłat; nie musi oznaczać sprzedaży wszystkiego. Przed działaniem uwzględnij koszty, możliwe podatki i aktualność celu. Nie gwarantuje stałego poziomu ryzyka, zysku ani uniknięcia straty; to nie nakaz transakcji przy każdej zmianie ceny.",
    "category": "Długoterminowe inwestowanie"
  },
  "fees-ter": {
    "question": "Dlaczego warto uwzględniać opłaty bieżące przy inwestowaniu?",
    "answers": [
      {
        "id": "A",
        "text": "Nie są — opłaty są pomijalne"
      },
      {
        "id": "B",
        "text": "Pomniejszają kapitał i mogą obniżać długoterminowy wynik"
      },
      {
        "id": "C",
        "text": "Wyższe opłaty zawsze oznaczają wyższe zyski"
      },
      {
        "id": "D",
        "text": "Opłaty są zwracane na emeryturze"
      }
    ],
    "explanation": "TER to wskaźnik kosztów funduszu; zakres sprawdź w dokumentach. Uproszczenie, nie metoda naliczania TER: 1000 zł przed jednorazową opłatą na koniec roku; wynik brutto 0%, bez wpłat, wypłat, innych kosztów, podatku i inflacji. 1% tej bazy to 10 zł, zostaje 990 zł; 0,2% to 2 zł, zostaje 998 zł. TER nie obejmuje wszystkich możliwych kosztów; sprawdź dokumenty i opłaty transakcyjne. Niższy koszt nie gwarantuje zysku.",
    "category": "Długoterminowe inwestowanie"
  },
  "risk-return": {
    "question": "Jaka jest ogólna zależność między ryzykiem a oczekiwanym zwrotem?",
    "answers": [
      {
        "id": "A",
        "text": "Wyższy oczekiwany zwrot zwykle wiąże się z wyższym ryzykiem"
      },
      {
        "id": "B",
        "text": "Wysokie zyski są gwarantowane bez ryzyka"
      },
      {
        "id": "C",
        "text": "Ryzyko i zwrot nie mają związku"
      },
      {
        "id": "D",
        "text": "Niższe ryzyko zawsze oznacza wyższy zwrot"
      }
    ],
    "explanation": "Wyższy oczekiwany zwrot zwykle wiąże się z wyższym ryzykiem, lecz oczekiwanie nie jest wynikiem ani obietnicą. Można stracić część lub całość kapitału. Ryzyko to nie tylko wahania ceny: obejmuje też np. niewypłacalność i trudność sprzedaży. Oceniaj ryzyko w odniesieniu do celu i możliwości poniesienia straty; wysoki zysk bez ryzyka nie jest wiarygodną obietnicą.",
    "category": "Długoterminowe inwestowanie"
  },
  "invest-prerequisites": {
    "question": "Co warto mieć ZANIM zainwestujesz w zmienne aktywa?",
    "answers": [
      {
        "id": "A",
        "text": "Gorący typ giełdowy"
      },
      {
        "id": "B",
        "text": "Fundusz awaryjny i opanowane drogie długi"
      },
      {
        "id": "C",
        "text": "Wymaksowaną kartę kredytową"
      },
      {
        "id": "D",
        "text": "Nic — inwestuj wszystko od razu"
      }
    ],
    "explanation": "Przed decyzją zabezpiecz podstawowe potrzeby i wymagane minimalne spłaty; oceń rezerwę oraz koszt drogiego długu. Środki potrzebne na te cele nie powinny być narażane na silne wahania. Inwestowanie jest dobrowolne; przy braku nadwyżki lub zmiennym dochodzie można je odłożyć. Te przygotowania nie gwarantują zysku ani uniknięcia sprzedaży w niekorzystnym momencie.",
    "category": "Długoterminowe inwestowanie"
  },
  "speculative-allocation": {
    "question": "Które podejście do bardzo spekulacyjnych aktywów jest ostrożne?",
    "answers": [
      {
        "id": "A",
        "text": "Włożyć wszystkie oszczędności dla maksymalnych zysków"
      },
      {
        "id": "B",
        "text": "Można nie inwestować; ewentualnie tylko kwotę, której pełna utrata nie naruszy podstaw ani rezerwy"
      },
      {
        "id": "C",
        "text": "Pożyczyć pieniądze, by kupić więcej"
      },
      {
        "id": "D",
        "text": "Traktować jako bezpieczny fundusz awaryjny"
      }
    ],
    "explanation": "Udział może wynosić zero; spekulacja nie jest obowiązkowa. Jeśli w ogóle ją rozważasz, nie przeznaczaj na nią pieniędzy na podstawowe potrzeby, wymagane minimalne spłaty ani rezerwę awaryjną i nie pożyczaj na ten cel. Możliwa jest utrata całości przeznaczonej kwoty. Brak uniwersalnego bezpiecznego procentu; mały udział nie gwarantuje zysku ani bezpieczeństwa. To nie rekomendacja zakupu.",
    "category": "Długoterminowe inwestowanie"
  },

  // ── Emerytura w Polsce (IKE / IKZE / PPK) ────────────────────────────────
  "ike-vs-ikze": {
    "question": "Jaka jest kluczowa różnica podatkowa między IKE a IKZE?",
    "answers": [
      {
        "id": "A",
        "text": "Są identyczne pod każdym względem"
      },
      {
        "id": "B",
        "text": "IKE: zwolnienie z podatku od zysków przy wypłacie na warunkach; IKZE: możliwe odliczenie wpłat i 10% całej kwalifikującej wypłaty"
      },
      {
        "id": "C",
        "text": "Oba są opodatkowane 19% co roku"
      },
      {
        "id": "D",
        "text": "Żadne nie daje korzyści podatkowej"
      }
    ],
    "explanation": "IKE nie daje odliczenia wpłat; zwolnienie z podatku od zysków wymaga ustawowych warunków wypłaty. Wpłaty IKZE można odliczyć w zeznaniu rocznym od dochodu lub przychodu, w rocznym limicie; korzyść zależy od sytuacji podatkowej. Dla oszczędzającego wypłata IKZE wymaga 65 lat i wpłat w co najmniej 5 latach kalendarzowych; 10% dotyczy całej wypłaty, nie tylko zysku. Wcześniejszy zwrot IKZE podlega skali PIT. To nie gwarancja zysku.",
    "category": "Emerytura"
  },
  "ppk-employer-match": {
    "question": "Ile wynoszą wpłaty pracodawcy do PPK, naliczane od ustawowej podstawy wynagrodzenia?",
    "answers": [
      {
        "id": "A",
        "text": "Nic — płaci tylko pracownik"
      },
      {
        "id": "B",
        "text": "Podstawowe 1,5% podstawy PPK plus dobrowolnie do 2,5% dodatkowo"
      },
      {
        "id": "C",
        "text": "Stałe 100 zł niezależnie od pensji"
      },
      {
        "id": "D",
        "text": "10% pensji"
      }
    ],
    "explanation": "Podstawowa wpłata pracodawcy to 1,5% ustawowej podstawy PPK, dodatkowa do 2,5%. Przykład za jeden okres, podstawa 6000 zł: 2% pracownika = 120 zł, 1,5% pracodawcy = 90 zł; opcjonalne 2,5% = 150 zł, razem pracodawca maks. 240 zł. Przyjmujemy pełne 2% pracownika; obniżenie jest możliwe na warunkach. To nie pensja netto: wpłata pracodawcy jest przychodem PIT, z możliwymi zwolnieniami. Kwoty wpłat nie są gwarancją zysku.",
    "category": "Emerytura"
  },
  "ppk-state-bonus": {
    "question": "Jakie dopłaty państwowe przewiduje PPK po spełnieniu warunków?",
    "answers": [
      {
        "id": "A",
        "text": "Żadnych"
      },
      {
        "id": "B",
        "text": "Jednorazowe 250 zł i roczne 240 zł po spełnieniu warunków"
      },
      {
        "id": "C",
        "text": "Jednorazowo 50 000 zł"
      },
      {
        "id": "D",
        "text": "Darmowe akcje pracodawcy"
      }
    ],
    "explanation": "250 zł to jednorazowa wpłata powitalna: co najmniej 3 pełne miesiące uczestnictwa i wpłaty podstawowe uczestnika za co najmniej 3 miesiące. Dopłata roczna 240 zł wymaga ustawowego poziomu wpłat; obniżona wpłata pracownika ma odrębne warunki. Samo konto nie wystarcza; po rozpoczęciu wypłat po 60. roku życia dopłata roczna nie przysługuje. Dopłaty nie są stopą zwrotu ani gwarancją zysku.",
    "category": "Emerytura"
  },

  // ── Rynki globalne ───────────────────────────────────────────────────────
  "deposit-guarantee-scope": {
    "question": "Co obejmuje ochrona depozytów BFG w Polsce, na ustawowych warunkach?",
    "answers": [
      {
        "id": "A",
        "text": "Wszystkie inwestycje, w tym akcje i krypto"
      },
      {
        "id": "B",
        "text": "Kwalifikujące depozyty; nie akcje, jednostki funduszy ani krypto"
      },
      {
        "id": "C",
        "text": "Tylko gotówkę trzymaną w domu"
      },
      {
        "id": "D",
        "text": "Twoją pensję po utracie pracy"
      }
    ],
    "explanation": "BFG chroni kwalifikujące depozyty uprawnionych deponentów w objętych instytucjach, na ustawowych warunkach. Akcje, jednostki funduszy i krypto nie są depozytami i nie zyskują tej ochrony tylko dlatego, że kupiono je przez bank. Gwarancja depozytów nie usuwa inflacji ani rynkowego ryzyka inwestycji. Sprawdź rodzaj produktu, instytucję i właściwy system; nie każdy podmiot działający w Polsce jest objęty BFG.",
    "category": "Rynki globalne"
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
    "question": "Jaki jest standardowy limit ochrony kwalifikujących depozytów w systemach gwarantowania w UE?",
    "answers": [
      {
        "id": "A",
        "text": "1 000 € na kraj"
      },
      {
        "id": "B",
        "text": "100 000 € na deponenta w danym banku (lub równowartość w walucie krajowej)"
      },
      {
        "id": "C",
        "text": "Zawsze 1 000 000 €"
      },
      {
        "id": "D",
        "text": "W UE nic nie jest gwarantowane"
      }
    ],
    "explanation": "Standard UE to 100 000 EUR na uprawnionego deponenta w jednej instytucji kredytowej, dla depozytów objętych systemem. Rachunki tej osoby łączy się; kilka marek jednego banku nie tworzy osobnych limitów. Oddział banku z innego kraju UE działający w Polsce co do zasady podlega systemowi kraju macierzystego, nie automatycznie BFG. Są warunki, wyłączenia i szczególne wyższe gwarancje; sprawdź właściwy system.",
    "category": "Rynki globalne"
  },
  "us-401k-match": {
    question: "W tym przykładzie z amerykańskim planem 401(k) pracownik spełnia warunki udziału, a wpłata mieści się w budżecie po podstawowych potrzebach i wymaganych spłatach długu. Które działanie może uprawniać do pełnej dopłaty zgodnie z zasadami planu?",
    answers: [
      { id: "A", text: "Pominąć — dopłaty to podstęp" },
      { id: "B", text: "Wpłacić kwotę potrzebną do pełnej dopłaty zgodnie z zasadami planu" },
      { id: "C", text: "Wpłacać dopiero po 60. roku życia" },
      { id: "D", text: "Wszystko w akcje jednej spółki" },
    ],
    explanation: "Formuła, limit dopłaty, warunki udziału i vesting zależą od planu. Hipotetyczna dopłata 50% do uprawnionej wpłaty 100 USD dodaje 50 USD. Prawa do wpłat pracodawcy można nabywać z czasem. Odchodząc z pracy, można utracić tylko ich część, do której nie nabyto praw. To nie gwarantowany zwrot z inwestycji ani uniwersalny pierwszy priorytet wydatków. Przykład z USA nie opisuje polskiego PPK.",
    category: "Rynki globalne",
  },
  "tax-advantaged-wrapper": {
    question: "Co łączy brytyjskie ISA, japońskie NISA i polskie IKE?",
    answers: [
      { id: "A", text: "Gwarantują stały zysk 10%" },
      { id: "B", text: "Korzyści podatkowe na zasadach danego kraju, bez gwarancji zysku" },
      { id: "C", text: "To rodzaje kart kredytowych" },
      { id: "D", text: "Są tylko dla milionerów" },
    ],
    explanation: "ISA w Wielkiej Brytanii, NISA w Japonii i IKE w Polsce dają korzyści podatkowe na różnych krajowych zasadach i limitach. Ulga nie gwarantuje zysku ani ochrony przed stratą z inwestycji. W IKE zwolnienie dochodu zależy od ustawowych warunków wypłaty; wcześniejszy zwrot może oznaczać podatek od dochodu. Warunki dostępu, dozwolone aktywa i wypłaty różnią się. To porównanie nie oznacza, że każde konto jest dostępne dla mieszkańca Polski.",
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
  "c16": {
    "question": "Która lista jest najpełniejsza przy porównywaniu ankiet o zaufaniu do instytucji finansowych?",
    "answers": [
      {
        "id": "A",
        "text": "Tylko nagłówek publikacji"
      },
      {
        "id": "B",
        "text": "Tylko rok, bez informacji o próbie"
      },
      {
        "id": "C",
        "text": "Liczba polubień publikacji"
      },
      {
        "id": "D",
        "text": "Rok, próba, treść pytania i metoda pomiaru"
      }
    ],
    "explanation": "Sprawdź, kogo i kiedy badano, o co pytano oraz jak liczono wynik. Różne pytania lub próby ograniczają porównywalność. Deklarowane zaufanie nie jest certyfikatem bezpieczeństwa konkretnej instytucji ani dowodem wpływu na majątek.",
    "category": "Wyzwanie"
  },
  "c17": {
    "question": "Ćwiczenie: w wymyślonej skali 0–21 pkt uzyskano 13 pkt. Co oznacza różnica do maksimum?",
    "answers": [
      {
        "id": "A",
        "text": "8 utraconych szans na zysk"
      },
      {
        "id": "B",
        "text": "8 punktów według przyjętego klucza, nie diagnozę majątku"
      },
      {
        "id": "C",
        "text": "8 miesięcy bez pieniędzy"
      },
      {
        "id": "D",
        "text": "8 osób bez konta"
      }
    ],
    "explanation": "21 − 13 = 8 punktów w tym ćwiczeniu. To wymyślona skala, nie aktualna skala OECD; punkty nie oznaczają liczby pytań. Same punkty nie dowodzą zachowania, zadłużenia, odporności ani przyczyn problemów. Wynik badania wymaga roku, próby, pytań i klucza; wersje pomiaru mogą się różnić.",
    "category": "Wyzwanie"
  },
  "c18": {
    "question": "Ćwiczenie: w tym miesiącu po podstawowych potrzebach i wymaganych minimalnych spłatach zostaje 50 zł. Który krok jest dobrowolny i mieści się w tej kwocie?",
    "answers": [
      {
        "id": "A",
        "text": "Pożyczyć 100 zł, by koniecznie odłożyć 100"
      },
      {
        "id": "B",
        "text": "Pominąć wymaganą spłatę"
      },
      {
        "id": "C",
        "text": "Wybrać 10 zł na rezerwę i zostawić 40 zł"
      },
      {
        "id": "D",
        "text": "Założyć, że mały przelew usunie cały stres"
      }
    ],
    "explanation": "50 − 10 = 40 zł w tym samym miesiącu; podstawy i wymagane spłaty uwzględniono już raz. Mały krok jest opcją, nie obowiązkiem ani gwarancją braku stresu. Gdy nie ma nadwyżki, wstrzymaj wpłatę; nie pożyczaj na oszczędzanie. Przy zmiennym dochodzie wróć do planu i dostosuj kwotę.",
    "category": "Wyzwanie"
  },
  "c19": {
    "question": "Który termin oznacza środki odłożone na nagłe, nieplanowane wydatki?",
    "answers": [
      {
        "id": "A",
        "text": "Pensja za bieżącą pracę"
      },
      {
        "id": "B",
        "text": "Poduszka finansowa"
      },
      {
        "id": "C",
        "text": "Wymagana pożyczka na oszczędzanie"
      },
      {
        "id": "D",
        "text": "Pewny zysk z inwestycji"
      }
    ],
    "explanation": "Poduszka to oddzielona rezerwa na nagłe wydatki. Cel dopasuj do sytuacji; mały start jest dobrowolny, bez jednego obowiązkowego progu. Najpierw podstawowe potrzeby i wymagane minimalne spłaty; bez nadwyżki wstrzymaj wpłatę. Sprawdź dostępność i ryzyko; rezerwa nie pokryje automatycznie każdego zdarzenia.",
    "category": "Wyzwanie"
  },
  "c20": {
    "question": "Co w ankiecie opisują postawy wobec pieniędzy?",
    "answers": [
      {
        "id": "A",
        "text": "Liczbę posiadanych produktów"
      },
      {
        "id": "B",
        "text": "Poziom dochodu i stan majątku"
      },
      {
        "id": "C",
        "text": "Deklarowane nastawienie do wydawania, oszczędzania i przyszłości"
      },
      {
        "id": "D",
        "text": "Gwarantowaną zdolność spłaty"
      }
    ],
    "explanation": "To deklarowane opinie, np. o wydawaniu dziś i oszczędzaniu na przyszłość. Nie są testem wiedzy ani pełnym pomiarem zachowania lub sytuacji finansowej. Same deklaracje nie dowodzą przyczyny trudności ani przyszłego wyniku. Możliwości zależą też od dochodu i koniecznych kosztów; nie oceniaj osoby.",
    "category": "Wyzwanie"
  },
  "poland-trust-institutions": {
    "question": "Czy odsetek deklarowanego zaufania w ankiecie potwierdza bezpieczeństwo konkretnej instytucji?",
    "answers": [
      {
        "id": "A",
        "text": "Tak, jeśli ma dużo klientów"
      },
      {
        "id": "B",
        "text": "Tak, każdy większy odsetek oznacza brak ryzyka"
      },
      {
        "id": "C",
        "text": "Tak, jeśli wynik jest starszy"
      },
      {
        "id": "D",
        "text": "Nie; ankieta nie zastępuje sprawdzenia konkretnej instytucji"
      }
    ],
    "explanation": "Sprawdź datę, próbę i dokładną treść pytania, np. czy dotyczy instytucji czy ich pracowników. Deklarowane zaufanie nie certyfikuje bezpieczeństwa konkretnej instytucji lub produktu. Sam odsetek nie dowodzi też przyczyny oszczędności ani majątku.",
    "category": "Edukacja finansowa"
  },
  "poland-oecd-score": {
    "question": "Jak interpretować różnicę do maksimum wyniku w badaniu kompetencji finansowych?",
    "answers": [
      {
        "id": "A",
        "text": "Jako pewną kwotę straconych oszczędności"
      },
      {
        "id": "B",
        "text": "Jako różnicę punktów zależną od pytań i klucza"
      },
      {
        "id": "C",
        "text": "Jako przyszłą stopę zwrotu"
      },
      {
        "id": "D",
        "text": "Jako dowód winy badanej osoby"
      }
    ],
    "explanation": "Sprawdź rok, próbę, wersję narzędzia i klucz punktowania. Historyczny wynik nie opisuje automatycznie obecnej populacji. Różnica punktów nie mierzy kwoty utraconego majątku i sama nie dowodzi zachowania ani przyczyn problemów finansowych.",
    "category": "Edukacja finansowa"
  },
  "poland-ppk-participation": {
    "question": "Co ustalić przed porównaniem odsetków uczestnictwa w PPK i PPE?",
    "answers": [
      {
        "id": "A",
        "text": "Tylko najwyższy odsetek"
      },
      {
        "id": "B",
        "text": "Że obie nazwy oznaczają ten sam program"
      },
      {
        "id": "C",
        "text": "Osobno program, datę i grupę, dla której liczono odsetek"
      },
      {
        "id": "D",
        "text": "Że brak udziału dowodzi braku wiedzy"
      }
    ],
    "explanation": "PPK i PPE to odrębne rozwiązania. Ustal program, datę oraz badaną grupę i mianownik; nie łącz odsetków bez określonej metody. Sama statystyka uczestnictwa nie wyjaśnia powodów decyzji ani nie dowodzi, że jej przyczyną jest brak wiedzy o procencie składanym.",
    "category": "Edukacja finansowa"
  },
  "financial-wellbeing-components": {
    "question": "Który zestaw najpełniej oddaje dobrostan finansowy w ujęciu CFPB?",
    "answers": [
      {
        "id": "A",
        "text": "Tylko wysokość dochodu"
      },
      {
        "id": "B",
        "text": "Codzienne finanse, odporność na wstrząsy, cele i swoboda wyboru"
      },
      {
        "id": "C",
        "text": "Sam wynik quizu finansowego"
      },
      {
        "id": "D",
        "text": "Liczba posiadanych produktów"
      }
    ],
    "explanation": "Ujęcie CFPB obejmuje poczucie kontroli nad bieżącymi finansami, możliwość radzenia sobie ze wstrząsami, realizację celów i swobodę wyborów. To rama opisu, nie gwarancja po opanowaniu trzech zadań. Znaczenie mają też zasoby, otoczenie i własne odczucia; nie wszystko zależy od decyzji osoby.",
    "category": "Edukacja finansowa"
  },
  "financial-resilience": {
    "question": "Co najlepiej opisuje odporność finansową?",
    "answers": [
      {
        "id": "A",
        "text": "Gwarantowana milionowa kwota oszczędności"
      },
      {
        "id": "B",
        "text": "Bezwzględny brak każdego długu"
      },
      {
        "id": "C",
        "text": "Zdolność radzenia sobie ze szokiem finansowym i odbudowy sytuacji"
      },
      {
        "id": "D",
        "text": "Sama obecność polisy"
      }
    ],
    "explanation": "Znaczenie mają dochód, zasoby, zobowiązania, dostępna pomoc i skala szoku, nie tylko wiedza lub nastawienie. Rezerwa może pomóc, ale nie gwarantuje pokrycia każdego wydatku. Wpłaty wybieraj dobrowolnie po podstawowych potrzebach i wymaganych minimalnych spłatach; bez nadwyżki wstrzymaj wpłatę.",
    "category": "Edukacja finansowa"
  },
  "debt-spiral-cause": {
    "question": "Ćwiczenie: dług 1000 zł, stałe hipotetyczne 10% za okres dopisywane do długu. Przez 2 okresy brak spłat, opłat i nowego długu. Ile wynosi saldo?",
    "answers": [
      {
        "id": "A",
        "text": "1000 zł"
      },
      {
        "id": "B",
        "text": "1210 zł"
      },
      {
        "id": "C",
        "text": "1200 zł"
      },
      {
        "id": "D",
        "text": "2000 zł"
      }
    ],
    "explanation": "1000 × 1,10 × 1,10 = 1210 zł. To założony model, nie oferta ani reguła każdej umowy. Realny koszt zależy od warunków i spłat. W zadłużeniu rolę mogą mieć też utrata dochodu, nagłe koszty i opłaty. Quiz nie ustala przyczyny problemów ani winy osoby.",
    "category": "Edukacja finansowa"
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
