# C63 — mniej nieużywanych zależności Web3

C63_STATUS: ACCEPTED_LIMITED_LOCAL_UNSTAGED.

Usunięto nieużywany lib/certificate-chain.ts i trzy bezpośrednie deklaracje Metaplex. Manifest ma18 zamiast21 bezpośrednich zależności runtime, lockfile608 zamiast628 wpisów. Wszystkie607 zachowane obiekty nonroot są dosłownie niezmienne;0dodanych wersji lub zmian integrity. Zachowano CDP, Solana, konfiguracje i wyłączone API Web3. Helper nie ma zastępczego stuba udającego pusty wynik.

| Dowód lokalny | Wynik |
|---|---|
| Baseline przed zmianą produktu | 7: 4 PASS / 3 FAIL, 0 SKIP; 576 wejść bez driftu |
| Te same przypadki i fixture po zmianie | 7 PASS / 0 FAIL / 0 SKIP; 575 wejść bez driftu |
| TypeScript | Jeden przebieg exit0, 575 wejść bez driftu |
| Build w TEMP | Jeden PASS, 34 strony / 35 tras, 575 pre / 574 post, 0 driftu |
| Niezależna recenzja | Dwie niezależne ograniczone GO, 0 otwartych uwag; PRODUCT wyłącza własne fixture/modele. Ledger postwrite osobnym addendum. |

Trzy baseline FAIL to planowane warunki usunięcia manifestu/grafu/helpera, nie trzy odtworzone exploity. Cztery rzeczywiste metody certificates GET/POST, mint POST i vault GET były już wcześniej zielone: nadal zwracają404 FEATURE_DISABLED/no-store przed auth/store/env/fetch, także przy podrobionej fladze i nagłówkach. Ograniczony odczyt186 plików źródłowych po usunięciu helpera nie znalazł jego literalnych callerów; brak twierdzenia o nieznanym przyszłym dynamicznym imporcie. Bank treści i UI PL/EN nie były zmieniane.

Wykonano jeden npm11.17, wyłącznie offline/package-lock-only/ignore-scripts w świeżym TEMP z pustym config/cache. Child exit0 usunął20 wpisów. Początkowa bramka oczekiwała19 i odrzuciła wynik; ten reject, raw i runtimeAfter:null pozostają bez zmian. Dwie niezależne recenzje źródeł wykazały, że dodatkowy YAML był wymagany przez usuwane Umi, a zachowane Vite/PostCSS deklarują go jedynie jako opcjonalny peer. [Dokumentacja npm](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/) opisuje, że opcjonalny peer nie jest automatycznie instalowany. Aktualne konfiguracje MJS/TS są przypięte; w ograniczonym zakresie nie znaleziono konfiguracji YAML.

Nowy admission20 potwierdził wszystkie607 obiektów, brak nowych wpisów i pierwotnie pominięte kontrole3 źródeł/parsera. Nie uruchamiano drugiego npm ani ręcznego odtwarzania integrity. Oryginalny konserwatywny model19/design/fixture są zachowane; model z obowiązkowymi peerami daje608, konserwatywny609. Liczba nierozwiązanych deklaracji50→52 wynika wyłącznie z dwóch jawnie opcjonalnych peerów YAML. Zrewidowany fixture20 został przyjęty przed baseline; po baseline nie zmieniano oracles. Dwa finding narzędzia zamknięto statycznie przed wykonaniem, z pełnym oryginałem i inverse.

Obecny node_modules nadal zawiera20 usuniętych z lockfile drzew. Testy, TS i build używały istniejącego runtime; brak clean-install, fizycznego prune, runtime bez YAML, inicjalizacji SDK, Chrome, realnych kont, stagingu lub CVE/advisory PASS. Parser37 plików i2consumers są literalne; w fingerprint zmienia się tylko SHA lockfile. Pełny stderr buildu jest identyczny z C62 poza25.0s→23.9s; ostrzeżenia pozostają.

Freeze257 przejmuje248 wcześniejszych ścieżek literalnie i kwalifikuje dwa pliki pakietów.13preserve=11literalnych+2kwalifikowane,24receipts i15SDK literalne. Z dawnych574wejść571 jest literalnych,2 kwalifikowane,1 helper ma tombstone/pełny rollback. Następny bootstrap ma użyć C63 source-freeze257 i sprawdzić nieobecność helpera.

40 tasks i ich statusy pozostają bez zmian; B10 i historyczny C50 deferral nadal są częściowo otwarte, bez nowego poll. Kolejny kandydat lokalny to source-only overflow/waluta EN w /shopping. Końcowe rejestry i osobny ledger postwrite mają własne dowody przyjęcia. HEAD/branch/index zachowane; bez add/commit/push/deploy/migracji, produkcyjnych zapisów, rzeczywistych sesji/profili/sekretów, płatnych usług lub kontaktu. AI/cloud writes HARD_OFF; produkcja NO_GO.
