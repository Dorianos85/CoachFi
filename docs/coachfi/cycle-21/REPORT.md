# C21 — wyłączone reguły nie blokują ręcznego logowania

15.10.2026. C21: przyjęty lokalnie w ograniczonym zakresie exact OFF po niezależnym ledger QA; paczka staged, receipt w final-stage.json.

B27 w zakresie exact OFF: gdy wszystkie trzy progi logowania są równe zero, isSignInRequiredNow zwraca znany wynik false przed pobieraniem i odczytem historii. To wynik wyłączonej konfiguracji, a nie zastąpienie niedostępnego postępu zerem. Ręczny dialog logowania działa w PL/EN także przy uszkodzonym SRS. Zmiana obejmuje trzy dodane linie jednego helpera; komponent, czysty predicate, progi, provider, odczyty/writers i pozostałe konfiguracje zachowano.

12 normatywnych przypadków PASS w dwóch celowanych przebiegach3helper+9actualUI, wszystkie7pierwotnych FAIL zamknięte z literalnymi oczekiwaniami. Baselinehelper12=9PASS/3FAIL iUI11=7PASS/4FAIL zachowane.9diagnostyk nie jest przyjęciem polityki;2dodatkowe helpercontrols pozostają pierwszym historycznym przebiegiem. Nie ma23freshgreen, globalnej regresji ani dodatku106/2453do12. FinalTS0/freeze10bez różnic; świeży buildTEMP34/34pages35routes,397/396inputs; parity291source/tool/historyporównań/175ścieżek/396inputs0mismatch.272historyczne triple zachowano dosłownie;265currentliteral,7jawnych reanchorów dotyczą jednego zmienionego pliku. C20pozostałe17frozen i102oldfixtures literalne. Nowego Chrome nie uruchamiano; C20Chrome8 pozostaje historyczny.

Wyłącznie lokalna syntetyczna konfiguracja i actualcomponent persistenthookharness z modulemockowanymi CDPhooks; brak wywołań SDK/email/OAuth/OTP/fetch i brak sprawdzenia logowania u dostawcy. Aktywne lub częściowo aktywne reguły z niedostępnym postępem pozostają poza przyjęciem i bez nowej required-policy. Nie zmieniono realnej konfiguracji, API, cloud/RLS, eksportu, treści82 ani ekonomii. Bez commit/push/deploy, produkcyjnych zapisów, realnych sesji/profili/sekretów, płatnych wywołań i AI. ProdukcjaNO-GO; brak nowego Auth/RLS/browser/staging/CI/freshcheckout/recoveryPASS.

Następny kandydat B28: osobny baseline tytułu/body dobrowolnego logowania PL/EN; aktualny zamykalny dialog OFF bezwarunkowo mówi o końcu dostępu bez konta. Rozdzielenie copy ma zachować sprawdzone required i istniejący flow, bez obietnic konta/synchronizacji/funkcji ani nowej polityki. To wykonalność statyczna, bez akceptacji B28. Nonzero unknown pozostaje poza zakresem; B06draft nadal odroczony.

[Weryfikacja](../../../evidence/cycle-21/verification.json), [normatywne12](../../../evidence/cycle-21/unit-summary.json), [niezależny retest](../../../evidence/cycle-21/data-review-retest.json), [actualUI](../../../evidence/cycle-21/ui-review-final.json), [dokładna zmiana](../../../evidence/cycle-21/root-source-implementation.json).

Końcowy guard1850tracked/1449text/1skip/0findings i scoped9paths exit0. Wszystkie ścieżki istniały przed jednym finalguard; pozostała wyłącznie niezależna recenzja rejestrów i rutynowe domknięcie istniejących metadanych/indeksu.
