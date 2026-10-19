# Coachfi C72 — zgodność kandydata zależności

Status: ACCEPTED_LIMITED_LOCAL_QUARANTINED_COMPATIBILITY_UNSTAGED

Parser 7.1.6 przeszedł ograniczone lokalne porównanie z aktualnym 6.1.4: 12 scenariuszy w dwóch wersjach, łącznie 24 odrębne pary PASS. Obejmuje to cztery ścieżki rzeczywistych konsumentów Tailwind 3.4.19 i postcss-nested 6.2.0 oraz osiem oryginalnych kontroli bezpieczeństwa C38. Kod aplikacji i aktualna zależność 6.1.4 pozostają bez zmian. Produkcja: NO_GO.

| Dowód | Wynik |
|---|---|
| Tailwind: selektory, escaping i jego własny interop | 2 wersje PASS |
| Tailwind: kompilacja syntetycznego CSS, prefix, important, @apply | 2 wersje PASS |
| postcss-nested: iloczyn selektorów, media i błędny AST | 4 pary PASS |
| Oryginalne C38: parse/serialize/clone/walk, granice głębokości | 16 par PASS |
| Niezależne recenzje końcowe | Dwa ograniczone GO; ledger osobno po zapisie |

Końcowy wynik łączy 22 niezmienione zielone pary z V4 i tylko dwie ponowione pary TW01 z V5, których obserwator wymagał poprawki. Nie powtarzano pozostałych zielonych testów. [Macierz wyników](../../../evidence/cycle-72/accepted-cases.json), [V4](../../../evidence/cycle-72/compatibility-run-v4.json), [V5](../../../evidence/cycle-72/compatibility-run-v5.json), [weryfikacja](../../../evidence/cycle-72/verification.json).

Wykryto rzeczywistą różnicę wewnętrznego eksportu deep-unesc: 6.1.4 eksportuje funkcję, a 7.1.6 obiekt __esModule/default. Zachowano ścisłe oczekiwania obu kształtów. Własny interop aktualnego Tailwinda obsługuje oba; nie oznacza to ogólnej zgodności bezpośrednich importów tego wewnętrznego API. Poprawka fixture używa dosłownego helpera z przypiętego źródła Tailwinda.

Historia błędów pozostaje w dowodach. Pierwsze 24 procesy kończyły się błędem bootstrapu osłony DNS przed wykonaniem pakietu lub fixture. V3 wykonał dwa scenariusze bazowe: jeden PASS i jeden FAIL starego oczekiwania RGB/osłony opcjonalnego modułu. V4 wykonał 23 scenariusze: 22 PASS i jeden FAIL oczekiwania bezpośredniej funkcji deep-unesc. V5 wykonał dwie zmienione pary TW01: obie PASS. Łącznie: cztery uruchomienia narzędzia, 51 procesów potomnych, 27 wykonań scenariuszy z pakietami, 25 obserwacji PASS; zaakceptowana macierz ma 24 odrębne pary. Dwa historyczne błędy oczekiwań nie są dwoma błędami aplikacji. Pełne rewizje i wyniki zachowano.

Zweryfikowane archiwum rozłożono raz do nowego katalogu zadania: 37 plików, 215009 B. Każdy scenariusz działał w świeżym procesie z przypiętymi bajtami i rozstrzygnięciem wersji, limitem 128 MiB i 4 s. Node blokował zapisy, tworzenie procesów, workerów i dodatki; osłony API sieci działały przed importem pakietów. To ograniczony lokalny harness, bez deklaracji izolacji systemowej przed złośliwym kodem. Sieć, npm, instalacja i nowe testy aplikacji/TS/build/przeglądarki: zero. Dwa odczyty help i dwie próby wyłącznie builtin identyfikowały ograniczenia Node.

Zachowano 313 wcześniejszych plików źródeł/narzędzi i dodano osiem plików kodu tego harnessu: 321 łącznie. Osobne 37 plików producenta w quarantine nie jest liczone jako autorski kod. Niezmienione: 614 wejść aplikacji, rejestr596, preserve13, wcześniejsze receipts33, SDK15, parser37 i dwóch konsumentów, 325 plików ich środowiska i 820 plików dopuszczonych modułów. Zachowano HEAD, branch i cały indeks Git; bez add/commit/push/deploy. Historyczne C69 3534 zarejestrowane PASS (3495 unikalnych par plik/tytuł) i TS0 nie były ponawiane.

Nie ma jeszcze aktualizacji bezpieczeństwa w aplikacji: główny parser pozostaje 6.1.4, nadal w tabeli affected GHSA-rj75 przytoczonej w C71. Kandydat wychodzi poza zakres semver obu konsumentów. Pokrycie archiwów aktualnego locka pozostaje 2/491; archiwum kandydata jest poza tym lockiem. Brak PASS dla czystej instalacji, stagingu, Auth/RLS, zgód, eksportu ani produkcji. AI i zapisy cloud: HARD_OFF.

Następny skończony etap C73: kontrolowana lokalna propozycja aktualizacji zależności do 7.1.6, uzasadnienie wyjątków semver dla tych dwóch konsumentów, dokładny diff manifest/lock/runtime, rollback, niezależna recenzja i dopiero odpowiednie lokalne testy. Bez wdrażania. Nie wymaga nowej decyzji Foundera w obecnym zakresie.
