# C16 — inwentaryzacja modułu credit-rates

Autor: `daily_author`. Data: 2026-10-15. Status: **inwentaryzacja źródeł zakończona; implementacja nie została jeszcze przydzielona**.

W bieżącym kodzie wszystkie cztery pytania modułu istnieją w banku kanonicznym. Hipoteza o brakującym `interest-rates` została odrzucona: rekord występuje w `data/quizQuestions.ts:84`, ma polskie nadpisanie w `lib/allQuestions.ts:101` i jest uwzględniany przez mapowanie `fromQuiz`. Nie trzeba dodawać identyfikatora ani zwiększać banku.

## Zachowany stan

Pełne bajty pięciu źródeł i ich SHA-256 zapisano w `evidence/cycle-16/content-author-before-source.json`. Inwentaryzacja z interpretacji literalnych węzłów AST znajduje się w `evidence/cycle-16/content-author-inventory.json`. Odczyt nie importował modułów aplikacji i nie korzystał z rzeczywistego storage, profili ani sesji. Pięć źródeł pozostało identycznych przed i po inwentaryzacji.

| Źródło | Liczba rekordów | Unikalne ID |
| --- | ---: | ---: |
| `quizQuestions` | 62 | 62 |
| `challengeQuestions` | 20 | 20 |
| Suma kanoniczna | 82 | 82 |
| Plain EN / PL | po 4 | po 4 |
| Plain ES / FR | po 31 | po 31 |
| Plain ZH / JA / HI / PT-BR / TR | po 4 | po 4 |

Nie znaleziono zduplikowanych ID w tych zbiorach. Mapa etapów ma 8 identyfikatorów, a `stageLessons` zawiera 7 zapisanych modułów. `credit-rates` ma obecnie po 4 kroki PL/EN.

| Istniejące ID | Klucz | Nagroda | Quiz | Challenge | Kanoniczne |
| --- | --- | ---: | ---: | ---: | ---: |
| `interest-rates` | C | 25 | 1 | 0 | 1 |
| `debt-avalanche` | C | 30 | 1 | 0 | 1 |
| `credit-score-factors` | B | 25 | 1 | 0 | 1 |
| `bond-prices` | B | 30 | 1 | 0 | 1 |

Łączna nagroda wynosi 110. Trasa modułu prowadzi do `/quiz?topic=credit`.

## Lokalizacja i ścieżki danych

`interest-rates` istnieje również w małym banku plain EN i PL. Polska wersja korzysta ze spreadu `en[3]`, ale nadpisuje pytanie, odpowiedzi, oba komunikaty i kategorię własnym polskim tekstem.

Pozostałe trzy ID nie występują w plain PL. Bieżący resolver ma specjalną ścieżkę kanoniczną dla mindset, saving i inflation; dla credit sprawdza lokalny rekord, następnie angielski `quizQuestions`. Z samego źródła wynika więc oczekiwanie trzech angielskich pytań w polskiej trasie credit, mimo istnienia poprawnych polskich rekordów kanonicznych. **To obserwacja źródłowa; rzeczywisty przebieg strony i QuizCard jest osobnym baseline recenzenta UI.**

Źródło eksportu buduje zbiór dozwolonych ID z quizu i challenge, więc zawiera wszystkie cztery ID. SRS filtruje terminy przez przekazany zbiór ID; sama funkcja `recordAnswer` nie waliduje przynależności do banku. Nie wykonywano zapisów SRS i nie przyznano tej ścieżce statusu PASS.

## Proponowany ograniczony zakres treści

Zakres oczekuje osobnego przydziału roota. Propozycja zachowuje cztery istniejące ID, klucze C/C/B/B, nagrody 25/30/25/30, liczbę kroków i wszystkie nietargetowe rekordy oraz pozostałe języki.

1. **Oprocentowanie:** wyjaśnić wskaźnik referencyjny, marżę i terminy aktualizacji wynikające z umowy; rozróżnić stopę stałą przez wskazany okres od okresowo stałej. Nie sugerować natychmiastowej, identycznej reakcji każdej raty na decyzję banku centralnego. Termin aktualizacji jest cechą umowy. [UOKiK — kalkulator zmiany oprocentowania i objaśnienia](https://uokik.gov.pl/public/kalkulator-zmiany-oprocentowania/).
2. **Lawina zadłużenia:** najpierw podstawowe potrzeby i wszystkie wymagane minimalne spłaty; dopiero dostępna nadwyżka na najwyżej oprocentowany dług. Przykład powinien ujawniać stałe stopy oraz brak dodatkowych opłat i kar. Dotychczasowe uniwersalne „saves the most money overall” wymaga ograniczenia do jawnych założeń. Źródło pierwotne oraz dokładne obliczenie przykładu pozostają do weryfikacji finansowej.
3. **Ocena kredytowa w Polsce:** terminowa spłata jako jeden z czynników oceny ryzyka; oddzielić scoring od oceny zdolności kredytowej i decyzji banku. Usunąć obce dla tego zakresu twierdzenie o uniwersalnej wadze około 35% i nie zastępować go inną arbitralną wagą. BIK opisuje wiele czynników, bez uzasadnienia dla takiej uniwersalnej proporcji. [BIK — ocena punktowa](https://www.bik.pl/dla-ciebie/ocena-punktowa-bik).
4. **Obligacje:** ograniczyć zależność do rynkowej ceny zbywalnej obligacji o stałym kuponie i wymaganej rentowności porównywalnych inwestycji, przy pozostałych czynnikach bez zmian. Oddzielić cenę rynkową od reguł wykupu i od instrumentów o zmiennym oprocentowaniu. To ogólny mechanizm matematyczny, bez przenoszenia amerykańskich produktów lub prawa. [SEC — ryzyko stopy procentowej obligacji o stałym oprocentowaniu](https://www.sec.gov/files/ib_interestraterisk.pdf).

Źródła odczytano 2026-10-15. Nie używano bieżących ofert, stawek ani płatnych raportów. Docelowe kroki PL/EN powinny zawierać krótki hipotetyczny przykład w PLN, ćwiczenie, dobrowolne małe działanie i spokojny powrót, również przy nieregularnym dochodzie. Nie przewiduje się nowych danych profilu ani presji na inwestowanie lub nowe zadłużenie.

## Zależności historycznych testów

Przed zmianą źródeł potrzebny będzie osobny, wąski przydział adapterów. W C16 nie zmieniono żadnego testu ani oczekiwanego hasha.

| Istniejąca fixture | Zależność od obecnych rekordów credit |
| --- | --- |
| `cycle6-mindset-author.test.ts` | Pełne hashe źródeł po odtworzeniu C11/C15; cztery rekordy credit nadal należą do części niezmiennej. |
| `cycle6-quiz-review.test.ts` | Dziewięć plain pools oraz 55 angielskich rekordów po dotychczasowych wąskich filtrach. Zmiana plain `interest-rates` PL/EN narusza obecne oczekiwania. |
| `cycle11-saving-author.test.ts` | Pełny dowód nietargetowych rekordów i źródeł po odtworzeniu C15; credit pozostaje nietargetem. |
| `cycle15-inflation-author.test.ts` | Pełny dowód poza zakresem inflation; credit pozostaje nietargetem. |
| `cycle15-legacy-preservation.ts` | Niezmienne historyczne kotwice i odtworzenie pre-C15. Przyszły adapter C16 powinien składać się z dotychczasowym odtworzeniem, zachowując stare baseline i literalne oczekiwania. |

Nie zmieniono produktu, testów, poprzednich baseline ani zaakceptowanej paczki C15. Nie uruchamiano agregatu, kompilacji, przeglądarki ani wdrożenia. Implementacja i ewentualne adaptery pozostają wstrzymane do rzeczywistego baseline UI/finansowego oraz odrębnego przydziału plików.
