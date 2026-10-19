# Cykl 9 / B19 — niezależna recenzja danych

Recenzent: `/root/daily_data_review`; autor helpera: `/root/daily_author`; autor strony: koordynator. Rynek Polska, dorośli, PL/EN. Recenzent nie zmienia kodu aplikacji ani testów autora. **LIMITED ACCEPT dla lokalnego helpera B19**, po niezależnym retest; nie zatwierdza strony, wydania ani produkcji. Recenzja 14–15.10.2026; wszystkie testy używają stałej syntetycznej daty 14.10.2026 12:00 UTC.

Odczytano root/repo AGENTS.md, program, rejestr backlogu, current-cycle i raport cyklu 8 oraz skill coachfi-data-integrity. Autoryzowany zakres to odwracalne lokalne testy syntetyczne. Brak zapisów chmurowych, realnych kont/profili, kluczy, instalacji, commit/push/deploy lub płatnych wywołań. Brak stagingu nie jest PASS.

Plan niezależnych oracles:

- Ścisła klasyfikacja lokalnego markera: brak, ukończony, nieprawidłowy lub niedostępny. Oryginalne bajty danych nieprawidłowych i nieznanych przyszłych pól pozostają zachowane.
- Walidacja nagrody, odpowiedzi i salda przed próbą jakiejkolwiek mutacji; przekroczenie safe integer i błędne dane nie przyznają punktów.
- Własność captured handle, zmiana ownera, stare tickety, reset podczas działania i reentry.
- Wyjątek odczytu przed zapisem pozwala na kontrolowane ponowienie. False/throw/write-then-throw mutacji i późny błąd zdarzenia, markera lub aktywności dają niepewny wynik i blokadę ponowienia tego ticketu.
- Błędna odpowiedź i istniejące ukończenie nie przyznają punktów; callback asynchroniczny nie może być uznany za synchroniczny sukces.
- Oddzielne asercje statusu, dokładnych bytes, liczby zapisów, zdarzeń i wywołań callbacka; zakaz realnego fetch i globalnego storage w fixture.

Quarantine w RAM nie dowodzi exactly-once po reload, pomiędzy kartami, ownerami lub urządzeniami. Format daty UTC i dotychczasowy lokalny countdown nie są migracją semantyki dnia. Pełne zachowanie realnego auth/RLS/chmury/stagingu pozostaje poza tą recenzją.

## Pierwsze wyniki i finding

Na helperze SHA256 `3e829acbb8c5ccf0ddcb9b36ca1f5b4f98ce78ab1231a02772815808541e88f6` niezależne contract-driven testy przeszły **81/81** (`save-review-initial-tests.json`). Trzy dodatkowe identyfikatory odpowiedzi zawierające końcowy newline przeszły **3/3** w osobnym targeted run (`save-review-newline-finding-tests.json`); nazwa pliku odnosi się do badanej obawy, nie findingu. Pozostałych 81 zielonych testów wtedy nie powtarzano.

**C9-DATA-01 — CLOSED po poprawce autora i niezależnym retest.** Pierwotny helper potwierdzał marker po aktywności, lecz nie potwierdzał zapisanej nagrody. Dwa własne nowe przypadki dały **0 PASS / 2 FAIL**: setter tokenów zwraca true bez zmiany wartości125 albo callback aktywności usuwa token bytes. W obu helper ogłaszał `saved`, `earned:50`, mimo braku potwierdzonej nagrody. `save-review-reward-confirmation-finding-tests.json` zachowuje błędy. To syntetyczny kontrakt storage/callback, nie stwierdzenie zaobserwowanej awarii native localStorage lub produkcji. Autor poprawił wyłącznie własny source; dwa failing oracles nie zostały złagodzone.

## Retest i przyjęty kontrakt

Końcowy helper SHA256 `aeecdae883c3b9348689c846e505bbabb5f2342fac50c3b9a39e32987562f16d`: **97/97 PASS**, zero failed/skipped/todo, lokalny Vitest4.1.11/Node24.19.0, exit0. Wynik: `evidence/cycle-9/save-review-final-tests.json`; fingerprints i ograniczenia: `evidence/cycle-9/save-review.json`. Własne testy nie są sumowane z wcześniejszymi przebiegami jako nowe niezależne cases. Powtórzenie zielonych przypadków uzasadniała rzeczywista zmiana helpera po findingu i nowe oracles potwierdzenia nagrody. Testy autora nie są dowodem tej niezależnej opinii.

Source review i niezależne próby potwierdzają:

- Czytanie markera rozróżnia brak/today/past od malformed/future/unknown fields. Leap day, nieprawidłowe dni miesiąca, tablice, null, brak pola i dodatkowe pola są sprawdzone. Brak naprawy, przepisywania lub migracji nieznanych bytes.
- Walidacja komendy i ścisłego salda, safe integer oraz overflow poprzedzają próby mutacji. Wrong/completed nie nagradzają, nie wywołują aktywności lub cloud i zachowują bytes. Read-denial przed pierwszym zapisem może dać retryable; stan ownera niedowodliwy lub stale daje stopped.
- Token/marker setter false, throw-before, write-then-throw oraz write-then-false dają uncertain. Późny event/cloud/persistence/streak error, failure finalnego read oraz activity Promise/thenable również nie dostają saved. Stan ticketu jest zamknięty i własne no-replay assertions nie dopuszczają dodatkowych reads/writes/events/callbacków. Utrata ownera lub epoch zatrzymuje stare działanie, zachowując ewentualne częściowe bytes.
- `isOpen` to pure admission, bez reads/authority calls. Terminal wrong/completed/saved, blocked lub in-flight zamykają ticket. Reset nie zwalnia aktywnego locka do finally. Trace przekazany do realnego token persistence helpera jest nieaktywny po zakończeniu run i nie może później czytać, usuwać lub zapisywać.
- Końcowy source potwierdza ścisłe bytes salda równe wynikowi addTokens **przed** marker/activity. Po activity wymaga canonical safe balance **co najmniej** taki wynik. To uwzględnia istniejący bonus milestone StreakContext: własny wrapper rzeczywistych markActiveToday/reachedMilestone/addTokens sprawdził streak2→3, bonus15, saldo190 i `earned:50`. To real helpers z mocked provider effects, nie renderowany StreakProvider lub browser. Błędy lower/malformed/delete po activity pozostają uncertain bez nadpisania bytes.
- Reward0 i brak salda nie inicjalizują tokenów; completion marker nadal wymaga potwierdzenia. Po późnym błędzie oba istniejące token/marker bytes pozostają zachowane.

## Ograniczenia rozdzielone od PASS

Własny test jawnie odtworzył pozostałe ograniczenie: po failed marker, token175 i uncertain, odrzucenie RAM kontrolera oraz nowy kontroler po usunięciu fault pozwalają na token225. To **dowód braku exactly-once po remount**, a nie przyjęta funkcja recovery. UI nie powinno oferować reload jako bezpiecznego retry. Brak atomic rollback, durable journal, cross-tab/urządzenie transaction lub uzgadniania brakującej nagrody. Arbitrary async activity nie jest sandboxem; prawdziwy przyjęty callback jest synchroniczny.

Nie oceniano ReactDOM, Playwright, TypeScript/build całego programu ani root narzędzi; koordynator i niezależny UI reviewer mają osobne gates. Nie oceniono realnych kont, RLS, chmury/stagingu, pełnego WCAG, semantyki zmiany dnia UTC vs lokalny midnight, struktury permissive streak JSON ani skuteczności edukacji. Nie włączono cloud writes, AI, nowych danych lub produkcji. Pozostałe globalne bramki nie uzyskują PASS z tej opinii.
