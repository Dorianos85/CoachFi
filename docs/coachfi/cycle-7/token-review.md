# B17 — niezależna recenzja integralności tokenów

2026-10-14. Recenzent: curriculum_pilot; autor `lib/tokens.ts`: architecture_audit; autor UI: root. **LIMITED ACCEPT dla finalnej walidacji liczb i lokalnego kontraktu modułu tokenów** po odczycie zamrożonego źródła i własnych 73/73 PASS. To niezależna opinia o module autora A, nie zatwierdzenie własnych testów, eksportu, całego UI, chmury albo wydania. Starsze cykle pozostają read-only.

## Uzgodniony kontrakt do sprawdzenia

- Brak raw (`null`) daje 125 bez inicjalizującego zapisu. Poprawny raw to canonical unsigned decimal: `0` lub cyfry bez znaku, whitespace i zer wiodących, reprezentujące safe integer 0..Number.MAX_SAFE_INTEGER.
- Malformed raw daje odczyt 0, lecz zachowuje dokładne bytes. Mutacje nie traktują tego 0 jako potwierdzonego salda: canAward/spend false, add TokenMutationError, także dla zero.
- Kwota jest runtime number, finite i nieujemna. Delta to Math.round, musi być safe; dodawanie musi mieć safe wynik. Invalid add rzuca TokenMutationError przed skutkami, invalid/insufficient spend zwraca false. Zero/rounded-zero jest no-op dopiero po walidacji bieżącego prawidłowego salda.
- Stale read daje 0; stale preflight/spend false i stale add istniejący Error `Storage session changed` (authority B14), bez write/event/cloud/account effect.
- `canAwardTokens` jest czystym preflightem z tego samego kontraktu, bez zapisu lub powiadomień. Read error jest fail-closed. Quota faktycznego zapisu propaguje; nie jest zamieniana na sukces.
- Guardy przed/po read, po write i przed każdym kolejnym efektem zatrzymują stale completion. Nie deklarujemy rollback już wykonanego write lub transakcji między SRS i tokenami.
- Bez `window` dodatnie mutacje są blokowane: canAward/spend false, add TokenMutationError, zero write/event/notify/account calls. Healthy-current zero/rounded-zero pozostaje czystym no-op; malformed zero nie staje się prawidłowym saldem.

## Niezależne oracles i metoda

Rzeczywisty helper odczytano i zaimportowano dopiero po sygnale freeze. Testy używają syntetycznych Map-backed PersonalStorageHandle, event/notifyCloud/persistLearningState spies. Żadnej sesji, actual namespace użytkownika, bazy, provider lub sieci. Każdy `fetch` spoza mocków rzuca błąd; testy sprawdzają także zero unbound storage access.

Oracles obejmują spend(-10), NaN/Infinity/string/object/boxed number/BigInt/Symbol, zero i granice zaokrąglenia, raw `25garbage`, ` 25`, `2.5`, empty string, `-1`, `NaN`, leading zeros, unsafe integer oraz MAX overflow. Niezależne wyliczenia na BigInt sprawdzają **63 pary dodawania i 30 odejmowania**, z góry zadeklarowane delty dla ułamków; te 93 pary są zawarte w dwóch testach i nie są dodatkowymi 93 przypadkami PASS. Każda odrzucona próba sprawdza exact raw i zero skutków. Prawidłowe zmiany sprawdzają dokładne saldo oraz pojedynczy event/payload. Osobno read/write/event/cloud reentry, quota i środowisko bez browsera.

## Wynik i historia

Finalny run po korekcie składni fixture 19:49:12: **73/73 PASS**, `evidence/cycle-7/token-review-after-bigint-syntax-tests.json`. Wcześniejszy retest B17-A01 19:42:55 również73/73 zachowano w `token-review-after-nonbrowser-fix-tests.json`. Własny test: `tests/cycle7-token-review.test.ts`; finalne fingerprints są w `evidence/cycle-7/token-review.json`. Nie wykonano full suite, typecheck, serwera ani browsera; bramki należą do roota.

Pierwszy run 19:38:38 miał 67/70 PASS. Trzy FAIL dotyczyły mojego błędnego oracle, który dla post-write/event/cloud reentry oczekiwał wyjątku również od spend. Uzgodniony kontrakt spend zwraca false. Poprawiono wyłącznie ten oracle, zachowując raw/effect assertions; 70/70 PASS 19:39:23. Oba raw raporty zachowano (`token-review-first-tests.json`, `token-review-final-tests.json`). Nie klasyfikuję tych trzech FAIL jako usterek aplikacji.

Następnie root odczytem wykrył materialny **B17-A01**: na wcześniejszym SHA `45CB54F0…` dodatnie operacje wyszły poza dawną granicę browser-only. Autor A poprawił moduł; nie edytowałem aplikacji. Niezależny retest na SHA `B81F83F4…` dodaje trzy nowe non-browser cases i zachowuje wszystkie wcześniejsze oracles: positive operations zero writes/dispatch/notify/persist, healthy zero no-op, malformed zero fail-closed. **B17-A01 zamknięte w ograniczonym kontrakcie**. Historyczne 70/70 nie jest akceptacją tego później znalezionego zakresu.

Baseline 9/9 w `evidence/cycle-7/token-author-baseline.json` odczytano jako dowód autora wcześniejszych usterek; nie uruchamiałem go ponownie i nie liczę jako własnych niezależnych testów. PASS tam oznacza reprodukcję problemu, nie bezpieczne działanie. Brak materialnego open finding po końcowym retest modułu.

Root wykrył33 TS2737 w moich BigInt literals, ponieważ target projektu jest poniżej ES2020. Zapisano byte-identyczną kopię testu przed korektą w `evidence/cycle-7/token-review-before-bigint-syntax.txt` (SHA B7604863…). Zmieniono wyłącznie33 literały `Nn` na `BigInt("dokładna dziesiętna wartość N")`, bez pośredniego Number, również przy obliczeniach wychodzących powyżej MAX. Porównanie źródła potwierdza wyłącznie tę transformację i0 pozostałych BigInt literals.73cases/93pairs, target projektu, aplikacja i oracles są niezmienione. To naprawa fixture kompilatora, nie finding tokenmodule; root wykona końcowy TSC. Hash testu po poprawce CFA0BA17….

## Źródło i niezależne liczby

`lib/tokens.ts:17` waliduje current handle przed i po read. `:23`–`:28` łączy grammar, safe range i round-trip: także końcowe newline/CR/LF/U+2028/U+2029 nie są canonical saldem. `:35` sprawdza runtime number i safe rounded delta; `:47`, `:54`, `:76` stosują ten sam kontrakt do preflight/add/spend. Overflow jest sprawdzany przed sumą przez dostępny margines MAX − saldo. Każdy późniejszy efekt ma ponowny guard; positive non-browser path jest inert.

Niezależne przykłady: missing125 + nagroda25 = **150**, a nie25; przy saldo25, spend(-10) jest false i saldo pozostaje25. MAX9007199254740991 +1 jest niedozwolone, (MAX−1)+1 = MAX jest dozwolone; MAX−MAX =0. Zaokrąglenia:0.49→0,0.5→1,1.5→2,25.5→26. To jednostki postępu aplikacji, nie pieniądze lub blockchain.

## Granice opinii

Moduły serializer/export i helpery poza tokenmodule pozostają **niezmienione/read-only** w tym zadaniu; ich funkcjonowania ani source approvals nie rozszerzam na podstawie tej recenzji. `assertCurrentPersonalStorage` jest rzeczywistym istniejącym guardem, zaś cloud/account callbacks są spies. Sprawdzony brak wywołań przy błędzie nie dowodzi durable zapisu lub autoryzacji w chmurze; dodatnie spy calls są tylko kontrolą kolejności. Root UI ma własną recenzję UX.

Brak realnego localStorage, browsera, kont, eksportu, SDK/provider calls, many-tab atomicity, rollback, transakcji SRS/token, server auth/reconciliation lub produkcyjnego wydania. Nie migrowano malformed raw i nie odczytywano prawdziwego cache. Jeśli physical write zakończył się przed utratą current, nowa wartość może pozostać; późniejsze efekty są blokowane, bez obietnicy cofnięcia zapisu.

Opinia ograniczona do wyżej wymienionego finalnego SHA i kontraktu. Root wykonuje pełne bramki; zmiana źródła wymaga odrębnego retestu. Nie wprowadzono app edits ani nowych danych/celów.
