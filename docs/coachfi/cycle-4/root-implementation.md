# Cykl 4 — raport autora integracji roota

14.10.2026, lokalna gałąź `codex/p0-security-consent-export`. Bez commit/push/deploy. Ten dokument opisuje kod i testy autora; nie jest niezależnym zatwierdzeniem.

Poniższe targeted kontrole zachowują stan wcześniejszej fali. Późniejsze review naprawiło stale CoachPage oraz regresję health draft; root ustabilizował uchwyty przy zmianie metadata localOnly. Końcowy wynik w [REPORT](REPORT.md): 503/503 Vitest, 22/22 E2E, typecheck/build PASS i niezależne LIMITED ACCEPT. Sam raport autora nie rozszerza werdyktu recenzenta.

`useProductStorage` subskrybuje stabilny snapshot i przechwytuje uchwyty local/session dla renderu. `ProductScopeBoundary` wstrzymuje osobiste children w pending, remountuje je przez rewizję właściciela i pokazuje PL/EN local-only przy niedostępnym sync znanego konta. AuthProvider, CDP provider oraz AccountSync pozostają poza granicą, żeby remount UI nie uruchamiał kolejnej zmiany właściciela. LanguageProvider pozostaje globalny. Błąd częściowego usuwania ma osobny komunikat i ręczny reload poza usuniętym personal subtree; nie udaje zakończenia operacji.

Home/navigation oraz quiz/review/challenge/lesson/progress/vault przekazują uchwyt przechwycony przez render do helperów. Stare callbacki sprawdzają current przed zapisami i prezentacją sukcesu. Timery wizualne sprawdzają ten sam uchwyt. Wylogowanie CDP kończy lokalną sesję, zachowuje odrębne dane gościa i wywołuje SDK signOut tylko jeśli synchroniczna zmiana scope nie została przejęta przez inne konto.

Actual DataSafetyPanel używa `buildOwnedLocalDataExport`, sprawdzając oba uchwyty przed i po odczycie oraz ponownie przed download click. Wynik v2 zawiera wyłącznie kategorię account/guest, nigdy UID, prefix namespace lub klucz sesji. Nadal odbudowuje wartości z allowlist 12; język jest jawnie ustawieniem urządzenia. Błąd dostępu do storage nie jest traktowany jako pusty udany eksport; nieobsługiwane i uszkodzone wartości nadal są pomijane. Pure sanitizer `buildLocalDataExport` pozostaje dla testów schematów, bez użycia w actual UI.

Usuwanie wymaga zarejestrowanego current handle, deleguje do adaptera i obejmuje 18 znanych personal keys w obu storage. Adapter unieważnia kolejki przed kasowaniem. Nie dotyka innych namespaces, auth ani globalnego języka/dostępności. Brak transakcyjności localStorage jest jawnym ograniczeniem: po błędzie część danych może być usunięta; kod nie deklaruje rollback ani pełnych praw konta/dostawców.

Targeted author checks: pierwsza próba 0 testów z powodu sandbox EPERM rename cache (oddzielny artefakt), ponowna próba 16/16 PASS w czterech plikach. Po dodaniu failure boundary retest 4/4 PASS tego jednego pliku; razem 17 różnych przypadków, nie 20. Dowody `evidence/cycle-4/root-author-tests.json`, `root-author-sandbox-error.json`, `root-boundary-retest.json`. Full aggregate/TS/E2E/build oraz końcowy niezależny werdykt będą odnotowane w final REPORT po freeze autorów.

Zastosowany checklist React: hook na najwyższym poziomie, stabilne API subscribe/server snapshot, SSR pending bez odczytu storage, memo uchwytów zależne od snapshotu, cleanup listeners, auth controllers poza keyed subtree, keyboard button/type/role status/alert i komunikaty PL/EN. Nie dodano bibliotek ani SDK fetch na podstawie samego renderowania scope.
