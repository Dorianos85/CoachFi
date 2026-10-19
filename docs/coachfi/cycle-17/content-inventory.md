# C17 — inwentaryzacja emergency-fund

Autor: `daily_author`, 2026-10-15. Status: **wyłącznie inwentaryzacja; brak zmiany produktu, testów lub przyjęcia treści**.

Moduł ma trzy kroki PL/EN i dokładnie trzy istniejące ID. Wszystkie występują jednokrotnie w banku quizu i banku kanonicznym; nie są rekordami challenge. Kolejność wynika z aktualnego `STAGE_QUESTION_IDS`.

| ID w kolejności etapu | Klucz | Nagroda | Plain EN / PL |
| --- | --- | ---: | --- |
| `emergency-fund` | C | 25 | istnieje / istnieje |
| `emergency-fund-characteristics` | C | 25 | brak / brak |
| `emergency-fund-start` | B | 20 | brak / brak |

Suma nagród wynosi **70**. Etap to `emergency-fund`, temat `emergency`, a trasa `/quiz?topic=emergency`. Nie ma podstaw do kopiowania czterech kroków lub 110 punktów modułu credit.

## Zachowane źródła i metoda

Pełne pięć źródeł — `data/stageLessons.ts`, `data/quizQuestions.ts`, `lib/allQuestions.ts`, `lib/localizedQuiz.ts`, `lib/quiz-topic.ts` — wraz z SHA-256 zapisano w `evidence/cycle-17/content-author-before-source.json` (hash `a4d0e78d3d57ef76901fab69f264316e46693df3fb7731acc3cbdebfc17f1eb7`). Pełna inwentaryzacja rekordów i zależności znajduje się w `content-author-inventory.json`.

Rzeczywiste niezmienione moduły banków wykonano przez `transpileModule` w ograniczonym VM. Dopuszczono osiem konkretnych importów repo; VM nie miał `window`, storage, sieci ani środowiska procesu. Nie wywoływano funkcji zapisujących postęp. Mapę etapów odczytano z literalnego AST. Odczyt banków nie zastępuje rzeczywistego baseline strony, QuizCard lub SRS należącego do niezależnych recenzentów.

| Zbiór | Rekordy | Unikalne ID |
| --- | ---: | ---: |
| Quiz | 62 | 62 |
| Challenge | 20 | 20 |
| Suma kanoniczna | 82 | 82 |
| Plain EN / PL | po 4 | po 4 |
| Plain ES / FR | po 31 | po 31 |
| Plain ZH / JA / HI / PT-BR / TR | po 4 | po 4 |

Nie stwierdzono duplikatów w tych zbiorach. Mapa ma osiem etapów, a bank lekcji siedem zapisanych modułów. Pięć źródeł produktu zachowało identyczne hashe przed i po inwentaryzacji.

## Obserwacje istniejącej treści i lokalizacji

- Pierwszy krok oraz plain pytanie przedstawiają 3–6 miesięcy jako ogólny oczekiwany rozmiar funduszu, bez dostatecznego uzależnienia od sytuacji. Polska lekcja odrzuca tydzień jako za mało; EN nazywa go początkiem. Wymaga to porównania znaczenia PL/EN w przyszłym drafcie.
- Drugi krok rozróżnia dostępność i ryzykowne akcje, ale nie wyjaśnia pozostałych kosztów, warunków lub ograniczeń bezpieczeństwa. Odpowiedź zawierająca 3–6 miesięcy występuje również w tym pytaniu jako cecha funduszu.
- Trzeci krok i feedback każą rozpoczynać od miesiąca niezbędnych wydatków, a angielski komunikat twierdzi, że pokrywa to większość częstych awarii. To nie jest zweryfikowany w tej inwentaryzacji uniwersalny rezultat. W angielskim dystraktorze występuje USD, mimo polskiego rynku.
- Wszystkie trzy pytania mają polskie rekordy kanoniczne. Obecny resolver kieruje jednak emergency przez plain/fallback, a nie przez przyjętą ścieżkę kanoniczną PL/EN. Z kodu wynika oczekiwanie dwóch angielskich fallbacków dla PL. To **wniosek ze źródeł**, bez deklaracji wyniku testu zamontowanego UI.

W banku istnieje ponadto pokrewne **nietargetowe** `emergency-first-milestone` (B, 25), również z pierwszym celem jednego miesiąca i twierdzeniem o badaniach. Nie jest jednym z trzech ID etapu i nie ma autoryzacji do jego zmiany w C17. Zachowano go w inwentaryzacji jako zależność spójności; jego twierdzenia pozostają poza przyjęciem tego modułu.

## Propozycja zakresu po niezależnym baseline

Propozycja zachowuje trzy ID, C/C/B, 25/25/20, sumę 70, trzy kroki PL/EN i wszystkie liczniki. Nie zmienia historii, SRS, schematu danych ani siedmiu pozostałych zapisanych bloków językowych.

1. Rozmiar funduszu zależy od potrzeb, przewidywalności dochodów i warunków gospodarstwa. 3–6 miesięcy może być wybranym orientacyjnym zakresem hipotetycznego planu, nie obowiązkowym progiem ani gwarancją bezpieczeństwa. Źródło CFPB uzależnia cel od sytuacji i dopuszcza mały początek; nie ustanawia uniwersalnego wymogu 3–6 miesięcy. [CFPB — przewodnik funduszu awaryjnego](https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/).
2. Dostępność środków i niska zmienność wymagają rozpoznania warunków oraz ryzyka. Nie należy zamieniać słowa „bezpieczny” w obietnicę dotyczącą dowolnego produktu. Zakres ochrony depozytów w Polsce jest określony; nie oznacza gwarancji każdej inwestycji. [BFG — zakres gwarantowania depozytów](https://bfg.pl/gwarantowanie-depozytow/). KNF wskazuje możliwość straty i potrzebę ochrony pieniędzy na bieżące życie. [KNF — Inwestuj świadomie](https://www.knf.gov.pl/dla_konsumenta/kampanie_informacyjne/Inwestuj_swiadomie).
3. Najpierw niezbędne potrzeby i wymagane minimalne spłaty, potem mały osiągalny, dobrowolny krok z nadwyżki. Brak nadwyżki nie wymaga przelewu ani zadłużania się w celu oszczędzania. Miesiąc wydatków nie będzie obowiązkowym pierwszym celem; wariant nieregularnego dochodu musi zachować tę możliwość. Każdy przyszły krok otrzyma krótki przykład PLN, ćwiczenie, opcjonalne działanie i spokojny powrót.

Źródła pierwotne odczytano 2026-10-15, bez ofert, bieżących stawek, płatnych raportów lub kontaktów. To uzasadnienie przyszłego zakresu, a nie finansowe przyjęcie gotowego draftu.

## Zależności historycznych oracles

Przed przyszłą implementacją potrzebny będzie osobny przydział wąskiego adaptera. W tym zadaniu żadnej fixture, helpera lub golden baseline nie zmieniono i nie uruchamiano historycznych zielonych testów.

| Fixture | Obecne chronione założenie |
| --- | --- |
| `cycle6-mindset-author.test.ts` | Pełne literalne hashe po istniejącym odtworzeniu C16/C15/C11; emergency jest nietargetem. |
| `cycle6-quiz-review.test.ts` | Dziewięć plain pools i literalne 55 pozostałych angielskich rekordów; obecny plain emergency należy do starego baseline. |
| `cycle11-saving-author.test.ts` | Pełne nietargety runtime/źródłowe poza saving; emergency jest chronione. |
| `cycle15-inflation-author.test.ts` | Pełne nietargety po projekcji pre-C16; emergency pozostaje poza inflation. |
| `cycle16-credit-author.test.ts` | Pełne nietargety, maski i inverse pre-C16; emergency pozostaje poza credit. |

Te pięć fixtures zawiera łącznie **403 literalne wywołania `expect`** (81/47/65/94/116). To inwentaryzacja AST, nie wynik uruchomienia testów. Istniejące `cycle15-legacy-preservation.ts`, `cycle16-legacy-preservation.ts` i ich niezmienne wejścia należy zachować; ewentualne odtworzenie C17 powinno poprzedzać dotychczasową kompozycję, bez regeneracji starych oczekiwań.

Oczekujemy na rzeczywiste baseline UI/finansowe i osobne zwolnienie draftu. Brak source/test changes, green reruns, kompilacji, builda, przeglądarki, commit/push/deploy lub zapisów cloud/AI.
