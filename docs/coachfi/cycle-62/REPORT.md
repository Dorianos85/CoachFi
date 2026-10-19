# C62 — kontrolowane wylogowanie CDP

C62_STATUS: ACCEPTED_LIMITED_LOCAL_UNSTAGED.

HeaderAccount w istniejącej, warunkowej ścieżce CDP pokazuje oczekiwanie, blokuje kolejne kliknięcie i po odrzuconym Promise udostępnia ogólny błąd oraz ponowienie PL/EN. Lokalny właściciel jest odłączany natychmiast. Stary wynik nie wraca do nowego konta A/B ani po unmount. Każda późniejsza zmiana rewizji właściciela, także guest po AccountSync, wycofuje starą próbę i jej komunikat. Zachowano 9 rekordów ACCOUNT_COPY, zwykły signin i resztę shell; trzy dokładne mapowania w jednym pliku.

| Dowód lokalny | Wynik |
|---|---|
| Baseline przed zmianą | 16: 4 PASS / 12 FAIL, 0 SKIP |
| Te same przypadki i fixture po zmianie | 16 PASS / 0 FAIL / 0 SKIP; wszystkie 12 wcześniejszych błędów zamknięte |
| TypeScript | Jeden przebieg exit0, 574 wejścia bez driftu |
| Build w TEMP | Jeden PASS, 34 strony / 35 tras, 574 pre / 573 post, 0 driftu |
| Niezależna recenzja | Dwie niezależne ograniczone GO, 0 otwartych uwag; PRODUCT wyłącza własną fixture. Ledger postwrite osobnym addendum. |

W raw baseline ponowne kliknięcie po rerenderze gościa wywołało SDK dwa razy. Odrzucony Promise nie miał błędu ani retry. Powtórzenie starego callbacka A było już wcześniej blokowane; to zachowany pozytywny przypadek. Dwanaście FAIL to przypadki nowego kontraktu, nie dwanaście niezależnych luk. Oba przebiegi mają po 16 linii obserwacji: 32 wiersze z tablic i 8 pojedynczych obiektów, 40 szczegółowych rekordów, nie testów. Fixture po jedynej korekcie preexec ma niezmienione oracles; oryginalny draft i whole inverse zachowano. Nie uruchamiano zielonych historycznych suitów.

Testy wykonują rzeczywisty HeaderAccount pozyskany z drzewa AppNavigation oraz lokalne helpery sesji/własności, z jawnym emulatorem React i pełnym mockiem hooków CDP. AccountSync jest reprezentowany przez jego rzeczywistą czynność endLearningSession przy signed-out. Brak nowego Chrome, inicjalizacji SDK, realnego konta, odwołania sesji, stagingu lub produkcyjnego PASS. Zainstalowany CDP core tłumi błędy remote logout: fulfillment nie potwierdza odwołania sesji na serwerze. UI nie dodaje takiej deklaracji. Surowe syntetyczne local/session zostały zachowane bez set/remove/fetch.

Pełny stderr buildu jest identyczny z C61 poza 32.0s→25.0s; ostrzeżenia x402-fetch i @base-org/account pozostają. Freeze250 przejmuje 244 wcześniejsze ścieżki literalnie i kwalifikuje dokładną zmianę AppNavigation; 13 preserve, 23 receipts i 15 publicznych pinów kontraktu SDK są literalne. 572 z 573 dawnych wejść są niezmienne, jeden plik kwalifikowany.

Kolejne kandydaty są tylko źródłowe: usunięcie martwych zależności Metaplex przy wyłączonym Web3 oraz nieprawidłowe duże kwoty i waluta EN w aktywnym /shopping. Nie ma podstaw do stwierdzenia wyczerpania pracy. C50 dependency deferral jest historyczny, bez nowego poll lub advisory closure.

40 tasks i ich statusy pozostają bez zmian; końcowe rejestry i odrębny ledger postwrite mają własne dowody przyjęcia. HEAD/branch/index są zachowane. Bez add/commit/push/deploy, migracji, produkcyjnych zapisów, realnych sesji/profili/sekretów lub płatnych wywołań. AI/cloud writes HARD_OFF; produkcja NO_GO.
