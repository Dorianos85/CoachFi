# Cykl 9 / B19 — niezależna recenzja UI

15.10.2026. Recenzent `/root/daily_ui_review`; autor `app/challenge/page.tsx` — koordynator, autor `lib/challenge-save.ts` — `/root/daily_author`. **LIMITED ACCEPT lokalnego kodu UI: final 21/21 PASS**, z końcowym integration retestem po zmianie helpera. Korektę fixture i dopisany case milestone niezależnie przyjął koordynator. Recenzent nie edytował kodu aplikacji. Produkcja **NO-GO**.

Odczytano root/repo AGENTS.md, program, backlog, current-cycle, raport cyklu 8 i właściwe skille `coachfi-frontend-quality` oraz `coachfi-ux-accessibility`. Zakres: dorośli, Polska, PL/EN; wyłącznie autoryzowane lokalne testy syntetyczne, bez realnych profili/sesji/sekretów, płatnych wywołań, produkcyjnych zapisów, commit/push/deploy.

## Sprawdzone lokalnie

Własny harness wywołuje rzeczywisty `ChallengePage`, rzeczywisty kontroler zapisu, token helpers, marker oraz adapter własności. React hooks, browser storage i kontekst aktywności są kontrolowane syntetycznie; nie jest to ReactDOM ani dowód działania produkcyjnego auth/streak. Każdy test ma własne bytes, listę zapisów, kontrolę statusu/UI i zakaz realnego fetch. Czas ustalono na 1.01.2026, w celu niezależności od daty hosta.

20 różnych przypadków obejmuje:

- PL/EN: zakończona nagroda i marker przed publikacją ukończenia oraz zdobytych punktów; przechwycony duplikat nie nalicza ponownie.
- PL/EN: błędna odpowiedź wyświetla wyjaśnienie bez punktów, markera ani aktywności.
- PL/EN: odmowa odczytu przed pisarzem zachowuje dane, wyświetla dokładny komunikat i dopuszcza jedno jawne ponowienie.
- PL/EN: punkty zapisane przed wyjątkiem albo odmowa markera po punktach pozostawiają dokładne bytes i blokują ponowienie; zero fałszywego ukończenia/earned UI.
- PL/EN: malformed punkty nie wywołują pisarza; malformed marker nie jest traktowany jako dostępne wyzwanie. Bajty pozostają zachowane.
- Zmiana języka zachowuje niepewną blokadę dla tego samego ownera; poprawna wybrana odpowiedź pozostaje użyteczna przy zmianie etykiet.
- Zmiana ownera i disposal unieważniają stare callbacki; syntetyczne konto B zachowuje swoje 77 punktów i brak markera.
- Późny wyjątek aktywności po zapisaniu punktów i markera daje ostrzeżenie, bez ukończenia ani zdobytych punktów w UI.
- Synchroniczny reentry i przechwycony duplikat nie przyznają drugiej nagrody.

Początkowy targeted run: **5 PASS / 15 FAIL**. Wszystkie 15 failures zatrzymały się na błędnej asercji recenzenta: globalne `text(tree)` zawsze zawiera istniejący badge obiecujący `+50`. To **C9-UI-TEST-01, finding fixture**, nie dowód błędu aplikacji. Poprawiono wyłącznie zakres asercji earned do istniejącego `data-testid="daily-challenge-earned"`, count 0/1 i potrzebną obsługę typów/helpera. Wszystkie asercje statusu, dokładnych danych, zapisów, ownera i aktywności zachowano. Sześć dokładnych delt oraz inverse SHA-256 odtwarza pierwotny fixture.

Retest tylko 18 dotkniętych przypadków: **18 PASS / 0 FAIL**, dwie niezmienione zielone asercje reentry/disposal jawnie pominięto filtrem. **20 różnych cases potwierdzono w dwóch przebiegach; nie jest to pojedynczy run 20/20**. Początkowy wynik i pominięcia zachowano. Źródła aplikacji miały identyczne hash przed i po obu runach. **C9-UI-TEST-01 zamknięty**: koordynator niezależnie zweryfikował sześć dokładnych delt, późniejszy dodatek milestone i inverse hash odtwarzający original `0fd7e6b20b541f7cd085501a804070ef4c4f45b8254cfbdc122ce4474e9c8150`. [Dowód niezależnej recenzji](../../../evidence/cycle-9/ui-fixture-correction-review.json) zachowuje wynik i brak findings; autor testu nie zatwierdza własnej zmiany.

Nie znaleziono blokującego app finding w potwierdzonym kontrakcie UI. Przejściowe `isOpen` w stronie poprzedzało implementację helpera, ale nie uruchomiono na tym stanie żadnych testów; API isOpen było obecne przed pierwszym wykonaniem.

Po retest helper zmienił się w odpowiedzi na niezależny finding danych C9-DATA-01. Nie przypisujemy nowym hash poprzednich zielonych testów: pierwotny tested hash helpera to `3e829acbb8c5ccf0ddcb9b36ca1f5b4f98ce78ab1231a02772815808541e88f6`. Dodano 21. własny case istniejącego milestone aktywności: rzeczywisty addTokens daje 125+50+15=190, przy earned wyzwania50 i poprawnym ukończeniu. Dokładne potwierdzenie175 dopiero po callbacku aktywności odrzucałoby prawidłowy bonus; tę obawę koordynator wykrył niezależnie i zlecił poprawkę, zanim case został wykonany. To obserwacja źródeł, nie dodatkowy runtime failure. `ui-review-milestone-case.json` dowodzi, że dopisano tylko ten case i zachowano wcześniejsze asercje; `ui-review-corrected-fixture-stage.json` zachowuje dokładny wcześniejszy corrected stage.

**Finalny integration run: 21/21 PASS, exit0, zero skipped/todo**. Powtórzenie całej bezpośrednio dotkniętej suite jest uzasadnione nową zmianą helpera, a nie samym upływem czasu. Milestone case przeszedł, bez false uncertain ani ukrycia zdobytej nagrody. Źródła przed/po zgodne: `app/challenge/page.tsx` SHA256 `3aef2bd53d05320f4a76089ebcfd530ba87a1163a3cebd2bdf78c2f134989532`; helper `aeecdae883c3b9348689c846e505bbabb5f2342fac50c3b9a39e32987562f16d`; własna suite `628ff39ba92b208772d3104028f645cbd498cd6e603a967ad53f4673442a12ab`; E2E `b2fa26de8ab8d060135424fa61f884dcc9e4e8dfcf1b281f03a5e2ef2a44f749`. Domknięcie findingu danych należy do jego niezależnego recenzenta; UI potwierdza integrację.

## Przeglądarka — przygotowane, wykonanie koordynatora

`tests/e2e/challenge-save-failure.spec.ts` zawiera 8 scenariuszy, po 4 PL/EN. Własny fresh synthetic guest, browser timezone UTC, stała data 1.01.2026, rzeczywiste istniejące c2 i nagroda 50. Browser request guard blokuje nielokalny ruch. Scenariusze: mobile keyboard wrong i jawny fresh view happy/save/reload; malformed marker z read-only check i fixture-only naprawą syntetycznych punktów; pre-writer read retry; marker write-then-throw, zmiana języka i odczyt pozostawionego markera po fresh reload. Każdy sprawdza dokładne dane i liczby zapisów; earned i alert są scoped do sekcji wyzwania. Koordynator otrzymał plik do niezależnego przeglądu i uruchomienia. Recenzent nie uruchamiał drugiego serwera ani browser run.

## Ograniczenia

Blokada działa w RAM bieżącego kontrolera. Nie potwierdzamy exactly-once po remount/reload, zmianie ownera, pomiędzy kartami lub urządzeniami. Browser reload case dotyczy wyłącznie zapisanego markera — nie rekonstrukcji brakującego markera. Nie dodano trwałego dziennika, rollbacku, zmiany cache ani migracji dnia. Obecny marker UTC i lokalny countdown zachowują dotychczasową semantykę. Testy UI nie dowodzą rzeczywistego cloud sync, Supabase/CDP/RLS, audytu pełnego WCAG, czytnika ekranu, produkcji lub stagingu. Cloud writes i zewnętrzne AI pozostają wyłączone.

Dowody: `evidence/cycle-9/ui-review-final.json`, `ui-review-initial-tests.json`, `ui-review-retest-tests.json`, `ui-review-final-tests.json`, `ui-review-fixture-correction.json` oraz dwa dowody zachowania etapów fixture. Końcowe aggregate, standalone TS, browser, build, źródła TEMP i przyjęcie paczki należą do koordynatora.
