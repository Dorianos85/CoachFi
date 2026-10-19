# C16 — raport autora treści credit-rates

2026-10-15, `daily_author`. Status: **IMPLEMENTATION READY — oczekuje niezależnego przyjęcia rzeczywistych źródeł i adaptera historycznych testów**.

W czterech przydzielonych plikach wprowadzono dokładnie treści PL/EN zatwierdzonego draftu `827b807d…`. Zmieniono dwie tablice kroków credit-rates, cztery istniejące rekordy quizu, cztery polskie nadpisania kanoniczne i dwa istniejące plain rekordy `interest-rates`. Zachowano kolejność ID, klucze C/C/B/B, nagrody 25/30/25/30, sumę 110, 82 unikalne pytania kanoniczne, 62 quizowe i 20 challenge. Zachowano siedem zapisanych modułów, liczbę kroków i małe banki locale. Autor nie zmieniał resolvera `lib/quiz-topic.ts`.

Stopa zmienna ma umowny termin aktualizacji; stała i okresowo stała mają jawny okres i dalsze warunki umowy. Lawina wykorzystuje wyłącznie opcjonalną nadwyżkę po potrzebach i wszystkich wymaganych minimalnych spłatach. Scoring nie ma wymyślonej wagi, rankingu czynników ani gwarancji decyzji banku. Obligacje mają jawne stałe przepływy, wymaganą rentowność, odrębne umowne płatności i ryzyko niewypłacalności oraz trudnej sprzedaży. Każdy krok zawiera przykład PLN, ćwiczenie, opcjonalne działanie, wariant nieregularnego dochodu i spokojny powrót.

## Dowód zachowania wcześniejszej pracy

Przed zapisem źródeł zachowano rzeczywisty runtime banków w `evidence/cycle-16/content-author-non-target-baseline.json` (SHA-256 `5c7bacbc7e1e2318004dcb917f6ab1ce6299fbf567079c9df2cea9634cc7bcdc`). Wykonano niezmienione moduły TypeScript przez ograniczony loader VM, bez `window`, storage, sieci, środowiska procesu lub dostępu do realnych profili. Funkcje etykiet kroków porównuje się przez rzeczywiste wyniki wywołań; pełne źródło niezależnie chronią maski bajtowe.

`content-author-source-delta.json` zawiera dokładne stare/nowe spany i kotwicę wcześniejszego pełnego źródła. Dla wszystkich czterech plików odwrócenie zmian daje identyczne źródło pre-C16; maski bajtowe poza 2/4/4/2 przydzielonymi spanami są identyczne. Obejmuje to wszystkie nietargetowe rekordy, poprzednie paczki mindset/saving/inflation i siedem pozostałych bloków językowych. Odziedziczone angielskie fallbacki w innych locale pozostają poza przyjęciem dla tych rynków.

## Wąski adapter historyczny

Nowy `tests/cycle16-legacy-preservation.ts` przywraca wyłącznie zatwierdzone spany i rekordy C16 do niezmiennego pre-C16, przed dotychczasowym odtworzeniem C15/C11. Oryginalny `cycle15-legacy-preservation.ts` zachowano literalnie.

W trzech fixtures C6/C11 zmieniono wyłącznie import złożonego adaptera. Fixture C15 otrzymała wejścia odtworzone do pre-C16 przed swoimi dotychczasowymi sprawdzeniami; nadal bada rzeczywiste rekordy inflation, a jej test tożsamości nie został osłabiony. Pełne before czterech fixtures, dokładne delty i inverse znajdują się w `content-author-legacy-preservation.json`.

Wszystkie **287 literalnych wywołań `expect`** (81/47/65/94), nazwy testów i literalne oczekiwania pozostały identyczne. Cztery inverse są bajtowo dokładne. Sześć historycznych kotwic, w tym oryginalny helper C15 i stare golden artifacts, zachowało hashe. Nie regenerowano złotych baselines i nie uruchamiano ponownie historycznych zielonych testów.

## Weryfikacja autora i granice

Pierwsze i jedyne uruchomienie nowej `tests/cycle16-credit-author.test.ts`: **41/41 PASS**. Surowy wynik: `evidence/cycle-16/content-author-tests.json`. Przypadki obejmują rzeczywiste źródła i banki, pełne nietargety, dokładne maski/inverse, istniejące ID/klucze/nagrody, 12 dwujęzycznych dystraktorów, jawne warunki finansowe, arytmetykę całkowitą i odczyt całego pytania z czterema opcjami. Maksymalna długość odczytu wynosi 342/500 znaków, bez obcinania.

Metadane otrzymały jedynie trzy administracyjne aktualizacje po rzeczywistym zwolnieniu implementacji: status lokalnego wdrożenia w kodzie, flagę autoryzacji i status recenzji. Pełny zatwierdzony draft i dokładny inverse tych pól zapisano w `content-author-metadata-status.json`; treści, liczby, źródła, wersja i opcje są niezmienione.

Końcowe hashe źródeł, fixtures i dowodów: `evidence/cycle-16/content-author-freeze.json`. Autor nie przyznaje własnej paczce niezależnego ACCEPT. Nie uruchamiano agregatu, standalone TypeScript, builda, przeglądarki ani starych zielonych fixtures. Te gates oraz rzeczywista recenzja finansowa/UI pozostają u odrębnych właścicieli. Brak dowodu stagingu, Auth/RLS, audio lub produkcji; brak commit/push/deploy i zapisów cloud/AI.
