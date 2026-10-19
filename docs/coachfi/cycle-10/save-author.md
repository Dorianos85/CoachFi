# B20 — autor kontrolera działań kryzysowych

15.10.2026. Autor `daily_author`. Lokalny kod na bieżącej gałęzi, wcześniejsze zmiany zachowane. Bez commit/push/deploy, odczytu rzeczywistych profili/env/sekretów, płatnych usług, migracji i produkcyjnych zapisów. Autor nie zatwierdza własnej aplikacji. Recenzje i końcowe bramki integracji są osobne.

## Baseline: co rzeczywiście odtworzono

Trzy syntetyczne przypadki odtworzyły starą kolejność marker przed reward, z rzeczywistym `addTokens` i kontrolowanymi Map handles; sync/events są mocked. Odmowa token writera zostawiła marker działania przy saldzie125 i wyjątku addTokens. Marker write-then-throw również został zapisany przy125; reward nie wywołano. Nieprawidłowy cache po dawnym catch-empty fallback został zastąpiony nową listą, z nagrodą15 i saldem140. Baseline3/3, pełny source fixture/hash i fingerprints odczytanych źródeł zachowano w `evidence/cycle-10/save-author-baseline.json`; raw run w `save-author-baseline-tests.json`. Te passing assertions potwierdzają defekt starej kolejności, nie acceptance poprawki. Publikacja done przed addTokens jest obserwacją źródła UI; starego zamontowanego UI/browser nie wykonano.

## Kontrakt potwierdzony przez koordynatora

Nowy helper eksportuje frozen tuple pięciu obecnych `CRISIS_ACTION_IDS`, typ `CrisisActionId` i stałą `CRISIS_ACTION_REWARD=15`. `readCrisisActions(storage)` zwraca frozen `{status:'ready',completed:readonlyIDs[]}` albo `{status:'unavailable'}`. Null oznacza pustą listę. Istniejące dane muszą być array JSON maksymalnie pięciu znanych, unikalnych strings; zachowana kolejność, bez sortowania, naprawy, normalizacji lub nadpisywania nieznanych bajtów. Read wymaga bieżącego handle i browser; wyjątek/thenable nie staje się pustym cache.

`createCrisisActionSaveController()` ma `version`, `reset`, `isOpen(ticket,id?)` i `run(ticket,storage,id)`. Wersja i isOpen nie odczytują storage. Run odgradza epoch, owner i in-flight, sprawdza runtime ID, czyta świeży cache na każde nowe działanie. Nieznane/prototype IDs nie zapisują. Already-done zwraca jedynie przechowaną listę, bez balance ani deklaracji historycznej nagrody. Saved i already-done zamykają tylko bieżący ID w RAM; inne działania pozostają dostępne. Każda uncertainty blokuje wszystkie pięć działań w tej instancji. Locale change nie powinien resetować tej blokady; owner/unmount ma osobny reset.

Zachowano istniejącą kolejność marker przed reward, ale walidacja punktów i eligibility15 poprzedza zapis markera. Marker musi zostać potwierdzony jako dokładna oczekiwana lista przed realnym addTokens na traced handle. Sukces wymaga canonical salda odpowiadającego oczekiwanemu poprzedniemu saldu+15, zgodnego wyniku helpera i nadal dokładnego markera. UI może publikować done/nagrodę dopiero po saved.

Każde wywołanie traced set/remove oznacza próbę mutacji przed delegacją. False, throw, write-then-throw, sticky read/write fault lub późniejszy błąd daje uncertain przy udowodnionym ownerze, bez retry/rollback. Wyłącznie błąd przed taką próbą jest retryable. Utrata ownera/epoch lub nieudowodniony current daje stopped. Reentry ignorowane także po reset do finally. Retired trace blokuje późne writes; async kontrakty nie dostają saved, native promise rejection jest obserwowany bez await/replay.

## Dowody autora i ograniczenia

**82/82 PASS**, `save-author-tests-initial.json`: schema/cache preservation, known/prototype IDs, strict balance/overflow, valid action order, wszystkich pięć zapisów, fresh external records, already-done bez reward claim, oba writers false/throw/write-then-throw/lying, late event/notify/persist failures, final marker/token corruption, global quarantine/per-action terminal, reentry/reset/owner loss, no-browser, frozen outputs, async current/get/writer/reward oraz retained trace. Rzeczywiste tokens helper używany poza jawnie adversarialnymi mocks. Ten run nie jest niezależnym zatwierdzeniem.

Odtworzony test ograniczenia po remount: token odmówiony po poprawnym markerze zostawia125; nowy kontroler zwraca already-done i nadal125. Marker nie dowodzi historycznego naliczenia nagrody i kontroler jej nie odtwarza. Quarantine jest wyłącznie RAM; brak durable recovery, journal, atomic rollback i cross-tab/device exactly-once. Po utracie markera i instancji możliwy jest nowy reward; te granice pozostają jawne. Nie rozstrzygamy historycznych par marker/reward ani nie migrujemy rzeczywistych danych.

Nie zmieniono C9 helpers, banków treści, prawnych wzorów, kontaktów, API, zależności, owner storage lub cloud sync. Zewnętrzne AI i cloud writes pozostają off. Staging, prawdziwe konta, chmura, produkcja i release nie mają PASS z dowodów autora. Fingerprints i status autora: `evidence/cycle-10/save-author.json`.
