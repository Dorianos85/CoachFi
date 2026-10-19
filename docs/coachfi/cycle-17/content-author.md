# C17 — raport autora emergency-fund

2026-10-15, `daily_author`. Status: **IMPLEMENTATION READY; własne testy zakończone, przyjęcie niezależnego adaptera i końcowe bramy roota pozostają odrębne**.

Do czterech przydzielonych plików danych przeniesiono dokładnie słowa zatwierdzonego draftu `e6e026bc…`: dwie tablice trzech kroków PL/EN, trzy istniejące rekordy quizu, trzy polskie nadpisania i dwa istniejące plain rekordy emergency. Zmieniono wyłącznie 2/3/3/2 przydzielone spany. Zachowano trzy ID w kolejności etapu, klucze C/C/B, nagrody 25/25/20 i sumę 70. Bank pozostaje 62 quiz + 20 challenge = 82 unikalne ID; siedem zapisanych modułów i wszystkie małe banki locale zachowują liczby.

Rozmiar rezerwy ma zależeć od sytuacji; 3–6 miesięcy jest orientacyjną opcją, bez gwarancji lub obowiązkowego progu. Własny wybrany cel 3 × 2 000 zł = 6 000 zł liczy minimum długu jeden raz. Dostępność i małe ryzyko nie oznaczają braku strat, kosztów lub opóźnień; przykładowe 200 − 150 − 20 = 30 zł ujawnia hipotetyczną opłatę. Mały początek to dobrowolny wybór po potrzebach i minimum: 1 000 − 900 − 80 = 20 zł, z opcjonalnym odłożeniem 10 zł. Przy zerowej lub ujemnej nadwyżce wybór wynosi 0 zł, bez pożyczania na oszczędzanie. Każdy krok ma ćwiczenie, opcjonalne działanie, wariant nieregularnego dochodu i spokojny powrót.

## Before, zakres i niezmienność

Pełny pre-C17 archive pięciu źródeł: `content-author-before-source.json`, SHA `a4d0e78d3d57ef76901fab69f264316e46693df3fb7731acc3cbdebfc17f1eb7`.

Przed własnymi zapisami danych wykonano rzeczywiste niezmienione banki przez ograniczony VM i zachowano runtime baseline `content-author-non-target-baseline.json`, SHA `fcd81f4b2e2348d732122edc4152d34419c2fdb1781ab6902f17201754c04f16`. Osiem importów było na allowliście; bez `window`, storage, sieci, środowiska procesu lub wywoływania funkcji zapisu. Funkcje etykiet kroków opisują rzeczywiste wyniki 1/3, 3/3 i 0/0; pełne bajty źródła są chronione osobno.

Root zmienił swój resolver przed runtime capture; loader banków nie ładował `quiz-topic.ts` ani `learningProgress.ts`, więc nie przedstawiamy tego resolvera jako pre-C17. Jego pełne wcześniejsze źródło pozostaje w pierwotnym archive, a dokładna integracja należy do roota.

`content-author-source-delta.json` zawiera stare/nowe spany, cztery dokładne inverse i cztery niezmienione maski bajtowe poza zakresem. Obejmuje to nietargetowe rekordy, wcześniejsze paczki oraz siedem pozostałych bloków językowych. Dziedziczone angielskie fallbacki poza PL/EN nie otrzymują przyjęcia tych rynków.

Metadane otrzymały tylko trzy autoryzowane zmiany administracyjne przed DATA SOURCE READY: status implementacji, flagę autoryzacji i informację o przyjęciu draftu z oczekiwaniem na recenzję rzeczywistych źródeł. Pełny approved draft i dokładny inverse zachowuje `content-author-metadata-status.json`. Słowa, liczby, źródła, wersja, opcje i odczyt pozostają identyczne z zaakceptowanym draftem.

## Historyczne oracles

Nowy `tests/cycle17-legacy-preservation.ts` przywraca wyłącznie rekordy i spany C17 do niezmiennego pre-C17, zanim zadziałają istniejące odtworzenia C16/C15/C11. Oryginalne helpers C15 i C16 pozostały literalnie niezmienione.

Pięć przydzielonych historycznych fixtures ma pełne before, dokładne delty pozycyjne i **5/5 byte-exact inverse**. Wszystkie **403 literalne wywołania `expect`** (81/47/65/94/116), nazwy oraz stare oczekiwania pozostały identyczne. Dziewięć wcześniejszych kotwic helper/golden zachowało hashe. Fixture C16 nadal sprawdza rzeczywiste credit; jedynie późniejsze emergency przywraca przed własnym nietargetowym baseline. Nie regenerowano złotych baselines i nie uruchamiano pięciu starych zielonych fixtures. Dowód: `content-author-legacy-preservation.json`.

## Pierwszy przebieg autora

Root zwolnił pojedynczy nowy przebieg po zakończeniu niezależnego UI, aby uniknąć konfliktu cache. `tests/cycle17-emergency-author.test.ts`: **43/43 PASS, pierwsze i jedyne wykonanie, exit 0**. Uruchomienie host z pustymi zmiennymi provider/auth, pułapką `fetch` oraz sprawdzeniem zerowej liczby wywołań. **22 fingerprints przed/po są identyczne**. Surowe dowody: `content-author-tests.json` i `content-author-run.json`.

Nowa fixture sprawdza rzeczywiste banki PL/EN, trzy kroki, zachowanie pełnych nietargetów, dokładne maski/inverse, dziewięć dystraktorów, liczby w całkowitych groszach, zerową/ujemną nadwyżkę, pełny odczyt wszystkich opcji oraz granice ryzyka. Maksymalny odczyt to 318/500 znaków, bez obcięcia. Pułapkę fetch dodano przed pierwszym przebiegiem wyłącznie do nowej fixture; jej pełny before/delta/inverse jest w `content-author-fetch-trap.json`.

## Niezależność i pozostałe ograniczenia

Root przekazał wynik niezależnych aktualnych recenzji finansów 25/25 i UI 21/21. Autor nie zatwierdza własnej zmiany; dokładny niezależny przegląd adaptera, agregat, standalone TypeScript, Chrome, build/parity i końcowy ledger należą do odrębnych właścicieli.

Powiązane `emergency-first-milestone` jest jawnie odroczonym nietargetem. Zachowano jego bajty i rekord; twierdzenie o miesiącu i badaniach nie jest naprawione lub zaakceptowane przez ten zakres. Root wskazał je jako pierwszy kandydat następnego zadania przed investing. Nie twierdzimy, że cały bank/B06 albo skuteczność uczenia są przyjęte.

Źródła danych i metadane pozostają frozen od DATA SOURCE READY. Bez starych green reruns, agregatu, standalone TS, przeglądarki lub builda wykonywanych przez autora; bez nowych danych profilu, commit/push/deploy, realnych sesji, produkcyjnych zapisów lub AI/cloud. Nie ma dowodu stagingu, Auth/RLS, rzeczywistego audio lub produkcji.
