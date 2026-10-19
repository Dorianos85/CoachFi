# Niezależna recenzja pilota 24 pytań PL/EN

Data: 14 października 2026, Europe/Warsaw. Recenzent: agent architecture_audit, rola 3 / merytoryka i lokalizacja; autor: curriculum_pilot (role 7/8). Odczytano program oraz skille coachfi-financial-review i coachfi-localization.

**Pierwszy wynik: revise jednej frazy w CF-INV-03; klucze i obliczenia wszystkich24 pytań accept.** Status banku pozostaje draft_for_review, testy użytkowników pending. Recenzja materiału nie potwierdza implementacji ani jakości oceny w aplikacji.

## Zakres i dowody

Przeczytano wszystkie24 pytania w obu językach: prompt, opcje, klucz, uzasadnienie i każde wyjaśnienie błędnej odpowiedzi. Sprawdzono24 unikalne ID, osiem obszarów po trzy pytania i osiem pozycji każdego roboczego poziomu trudności. Siedem odpowiedzi liczbowych, osiem wyboru i dziewięć sytuacyjnych.48 wersji językowych to24 pytania, zgodnie z założeniem. Nie znaleziono braków par PL/EN, niezgodnych ID opcji/feedback ani rozbieżności ID/URL źródeł z lokalnym rejestrem.

Źródła oceniono w zakresie powiązania, wydawcy, tematu i granic jurysdykcji na podstawie evidence/content-sources.json. Ich odczyt przez autora nie jest niezależną kontrolą bieżącej treści stron przez recenzenta. W tym lokalnym zakresie nie odświeżano stron; aktualność źródeł przed zatwierdzeniem pozostaje niesprawdzona. Nie zastosowano zasad podatkowych, świadczeń czy amerykańskich praw konsumenckich do Polski. Źródła CFPB/SEC służą ogólnym zasadom, a przykłady zachowują PLN również w EN.

## Oceny wszystkich pozycji

Ocena accept odnosi się do klucza, uzasadnienia, dystraktorów oraz równoważności PL/EN, z ograniczeniami źródeł i walidacji powyżej.

| ID | Klucz / wartość | Ocena | Niezależna uwaga |
|---|---|---|---|
| CF-BUD-01 | B | accept | Saldo i terminy; trzy błędne odpowiedzi pomijają potrzebne przepływy. |
| CF-BUD-02 | C | accept | Nadwyżka miesiąca nie usuwa luki przed wypłatą. |
| CF-BUD-03 | 250 | accept | Najniższe saldo −250, potrzebna dodatkowa kwota250 PLN. |
| CF-SAV-01 | D | accept | Nieprzewidziany niezbędny wydatek; planowane koszty nie są tym samym. |
| CF-SAV-02 | A | accept | Podstawowe potrzeby mają pierwszeństwo przed transferem powodującym niedobór. |
| CF-SAV-03 | 6 | accept | Cel1800, już900, luka900/150=6 miesięcy. |
| CF-CRD-01 | B | accept | Opłaty, raty i przepływy; bez utożsamiania prawa APR i RRSO. |
| CF-CRD-02 | C | accept | A1400, B1320; B tańsza o80 PLN według nominalnej sumy. |
| CF-CRD-03 | 23 | accept | 12 pierwszych odsetek, spłata kapitału100, kolejne11; suma23. |
| CF-INF-01 | D | accept | Ten sam koszyk drożeje; stała kwota kupuje mniej. |
| CF-INF-02 | A | accept | 1,02/1,05=0,97142857; nominalny wzrost i realny spadek. |
| CF-INF-03 | 981.13 | accept | 1040/1,06=981,13207547, do grosza981,13. |
| CF-INV-01 | B | accept | Dywersyfikacja ogranicza koncentrację, nie gwarantuje zysku. |
| CF-INV-02 | C | accept | Bliski termin i brak zdolności poniesienia straty wymagają stabilności i dostępu. |
| CF-INV-03 | 900 | revise | Klucz poprawny480+420; PL „zmian udziałów” do doprecyzowania jako brak transakcji/rebalancingu. |
| CF-RET-01 | D | accept | Własne potrzeby, zasoby i horyzont; żadnych lokalnych praw emerytalnych. |
| CF-RET-02 | A | accept | Sprawdzenie wrażliwości i przegląd; prognoza warunkowa nie gwarancja. |
| CF-RET-03 | 3152.5 | accept | 1000*1,1025+1000*1,05+1000=3152,50; dystraktory3310,13 i3472,88 policzone. |
| CF-RES-01 | B | accept | Koszty i daty, środki, kontakty; bez ujawniania haseł. |
| CF-RES-02 | C | accept | Wspólny pracodawca może dotknąć oba dochody; źródło cashflow jest kontekstowe. |
| CF-RES-03 | 3 | accept | (1600−400)/(2200−1800)=3; luka zamiast pełnych kosztów. |
| CF-SEC-01 | D | accept | Niezależny oficjalny kanał; nazwa/numer w SMS nie potwierdzają banku. |
| CF-SEC-02 | A | accept | Odrębne hasła,2FA i recovery; brak obietnicy pełnej ochrony. |
| CF-SEC-03 | B | accept | Pilny oficjalny kontakt banku; brak gwarancji odzyskania. |

## Rachunki

Niezależnie przeliczono dziewięć pozycji zawierających rachunek, bez wykonywania formula autora. Użyto Decimal: BUD03=250; SAV03=6; CRD02 różnica80; CRD03 odsetki23; INF02 realna zmiana−2,85714286%; INF03=981,13207547→981,13; INV03=900; RET03=3152,50; RES03=3. Miesięczna stopa1% w CRD03 nie została pomylona z rocznym APR/RRSO. Wpłaty RET03 są na końcu lat, nie na początku; sprawdzono także błędne wartości3310,13 i3472,88. Dwa rozłożone spadki portfela nie zostały uśrednione bez wag. Saldo końcowe nie zastąpiło minimalnego salda cashflow.

## Poprawki i przyjęcie

**Q01 / P2 / CF-INV-03 / revise.** Polski prompt mówi o braku „zmian udziałów w trakcie”. Udziały procentowe zmieniają się samoczynnie przy różnych stopach zwrotu. Angielskie changes to holdings i assumptions no rebalancing wskazują właściwe znaczenie: brak transakcji/przesuwania środków między częściami. Wymagane doprecyzowanie PL bez zmiany klucza900. Autor otrzymał uwagę; materiału nie edytowano.

**Q02 / przed testem UI.** Tolerancja absolutna0,01 względem zaokrąglonego klucza może dopuścić sąsiedni grosz, np.981,12 i981,14, mimo polecenia do dwóch miejsc. To nie błąd wzoru; wymaga jawnej polityki scoringu i testu parsera. Przetestować przecinek/kropkę, spacje, brak odpowiedzi, NaN/nieskończoność, wartości graniczne i jednostki. Nie traktować zapisu wymagań delivery_requirements jako działającej implementacji.

**Q03 / walidacja użytkowników pending.** Część dystraktorów jest łatwa do odrzucenia dzięki absolutnym słowom lub absurdalnym działaniom; poprawna odpowiedź często jest najdłuższa. Nie wykryto drugiego prawidłowego klucza, ale nie oznacza to jakości pomiaru. Obserwować uzasadnienie wyboru, transfer po czasie i funkcjonowanie błędnych opcji. Randomizacja z zachowaniem ID zmniejsza uczenie się powtarzalnego układu kluczy. Poziomy trudności są robocze; pytania z prostym dzieleniem nie są empirycznie zwalidowane jako advanced.

CF-RES-02 ma prawidłowy hipotetyczny wniosek o możliwym wspólnym spadku dochodów; cytowany cashflow jest materiałem kontekstowym, nie badaniem korelacji wynagrodzeń. Nie przedstawiać go jako empirycznego oszacowania ryzyka. Bank nie gwarantuje wyników inwestycji lub skuteczności Coachfi i nie ocenia zamożności/well-being wynikiem quizu.

Przyjęcie merytoryki po poprawce Q01 wymaga ponownego odczytu recenzenta. Publikacja dodatkowo wymaga odświeżenia źródeł, testów UI/scoringu, sprawdzenia dostępności oraz pilota z dorosłymi początkującymi w PL/EN. Nie zmieniono statusu na published ani reviewer pól autora.

Recenzowana wersja0.1.0, SHA-256 C6E0F9BEC4DB804B07B8AC461F55B7A7D6A696322DE7D3E9B38F6A269B2A01A0. Szczegółowe dowody i oceny każdego ID: evidence/quiz-review.json.

## Ponowna recenzja wersji 0.1.1

14 października 2026: **Q01 zamknięta, accept materiału wszystkich 24 pozycji w zakresie rachunków i PL/EN.** Polski CF-INV-03 określa udziały jako początkowe i wyklucza transakcje/przesuwanie środków między A/B; klucz 900 oraz angielski sens bez zmian. Powtórzenie słowa „początkowo” jest drobną kwestią redakcyjną, bez niejednoznaczności obliczenia.

Q02: pięć odpowiedzi kwotowych ma teraz tolerancję 0,005 PLN, wykluczającą różnicę 0,01 od klucza. Dwie odpowiedzi miesięczne wymagają dokładnej liczby całkowitej. `delivery_requirements.numeric_scoring` jawnie zapisuje kontrakt i pending testów implementacji. Przy kluczu 981,13 wartość 981,13207547 mieści się w tolerancji, a 981,12/981,14 nie; ponownie sprawdzono to matematycznie. Parser, float granice, faktyczne ocenianie UI i testy użytkowników nadal nie zostały wykonane.

Aktualnie recenzowany SHA-256: `49449AC2626E814AC27E64D871D143F101636DA5D2B718C9A4262D577BF1F5C7`. Status banku i wszystkich pozycji pozostaje `draft_for_review`, reviewer pól autora pozostaje null/pending, niczego nie opublikowano. Akceptacja materialna nie usuwa ograniczeń aktualności źródeł, walidacji użytkowników i jakości dystraktorów opisanych wyżej.

Po retest autor uzupełnił metadane recenzji: reviewer `architecture_audit`, reviewer_status `accepted_limited` i odnośnik do tej opinii. Odczytano te pola dla wszystkich 24 pozycji; bank i każda pozycja nadal `draft_for_review`. Aktualny hash całego pliku po tej zmianie metadanych: `BE98845A766681484203DDA99A3E9EA4C9BE82B5645697688EA8DE0BFDD97656`. Wcześniejszy hash określa treść w chwili retest; autor zgłosił brak zmiany treści i kluczy. Nie rozszerza to akceptacji na źródła, wdrożenie lub walidację użytkowników.

Końcowy retest metadanych 14 października 2026: sprawdzono wszystkie 24 pozycje, ich datę i odnośnik. Zakres jest dokładnie `answer_key`, `rationale`, `PL_EN_equivalence`, `calculation_if_present`; trzy oczekujące obszary to `independent_source_refresh`, `implementation_parser_scoring_tests`, `user_pilot`. Brak rozbieżności. Metadane nie rozszerzają recenzji; status banku i każdej pozycji nadal draft. Finalny SHA-256 pozostaje `BE98845A766681484203DDA99A3E9EA4C9BE82B5645697688EA8DE0BFDD97656`.

