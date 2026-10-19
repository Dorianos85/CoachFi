# Cykl 10 / B20 — niezależna recenzja UI

15.10.2026. Recenzent `/root/daily_ui_review`; autor strony `app/crisis/page.tsx` — koordynator, autor helpera — `/root/daily_author`. **LIMITED ACCEPT lokalnego UI: 27/27 PASS**, exit0, zero skipped/todo. Recenzent nie edytował aplikacji. Końcowe bramki paczki i przeglądarka należą do koordynatora; produkcja **NO-GO**.

Odczytano root/repo AGENTS.md, program, backlog B20, current-cycle, raport cyklu 9 i właściwe skille `coachfi-frontend-quality` oraz `coachfi-ux-accessibility`. Dorośli, rynek Polski, PL/EN. Wyłącznie autoryzowane odwracalne lokalne testy syntetyczne, bez realnych sesji/profili/sekretów, płatnych wywołań, produkcyjnych zapisów, commit/push/deploy. Nie oceniano ani nie zmieniano porad, numerów telefonu, pism, instytucji lub kontaktów do ludzi.

## Sprawdzone

Własny harness wykonuje rzeczywisty `CrisisPage` oraz rzeczywisty pure `ActionStep`, w tym jego disabled i done-label. Nie zastępuje kontrolera, helpers punktów lub adaptera własności. React hooks i browser storage są kontrolowane syntetycznie; jest to test komponentowych handlerów i elementów, nie ReactDOM ani pełny provider/auth/staging. Każdy case ma własne bytes, liczbę zapisów, kontrolę UI oraz zakaz realnego fetch. Ustalony czas 1.01.2026 usuwa zależność od daty hosta.

27 własnych przypadków potwierdziło:

- Wszystkie pięć istniejących IDs: jeden potwierdzony zapis markera i nagroda15 przed done UI; przechwycony stary callback nie przyznaje drugiej nagrody i nie zmienia stanu.
- PL/EN: kolejne różne działania zachowują poprzednie IDs i saldo125→140→155. Wszystkie pięć daje200 i pięć markerów.
- PL/EN: odmowa odczytu przed pisarzem zachowuje dane, brak done, dokładny komunikat retry oraz jedno jawne ponowienie.
- PL/EN: token write-then-throw albo próba markera z odmową daje dokładny uncertain, brak nowego done i globalną blokadę wszystkich pięciu działań. Stare i aktualne callbacki nie obchodzą blokady.
- PL/EN: malformed punkty pozostają zachowane i odrzucają akcję przed markerem/nagrodą.
- Sześć malformed cache fixtures: obiekt, null, liczba, nieznany ID, mieszany typ i duplicate ID nie są traktowane jako pusty zestaw; oryginalne bytes pozostają zachowane, wszystkie oznaczenia zablokowane.
- Locale change zachowuje globalną blokadę i nie dopuszcza innego działania. Świeży odczyt przed kolejną akcją zachowuje znany marker dodany poza bieżącym UI.
- Zmiana ownera zachowuje syntetyczne konto B z77punktami; stare callbacki i disposal nie zapisują danych ani stanu.
- Synchroniczny reentry drugiego ID podczas pierwszej nagrody nie wykonuje drugiej akcji.

Źródła przed/po run zgodne: strona SHA256 `b845cb4b41de04fcdacf1b12855ea8f38bfe56dc3899088cef7ad1a34d8056e8`, helper `fbdc78935951dd14548083d9648a93a3e7ca84b783a618a666d532276f4e25f1`, własna suite `8ed8cbafd7c1ba104d8bacb6bc75b6062813db14807eef70189a540b9cae4879`. Wcześniejszy statyczny odczyt strony miał inny hash; nie przypisano mu wykonania testów. Rzeczywisty runner policzył27 cases, korygując wcześniejszy szacunek28 w wiadomości roboczej. Nie było failed runs ani poprawki oracles. **Zero blokujących findings UI** w potwierdzonym kontrakcie.

Dawna kolejność marker→done UI→nagroda jest obserwacją odczytanego źródła. Recenzent nie uruchamiał starej strony ani starego browser baseline; syntetyczne reprodukcje baseline należą do autora helpera. Nowy kod zachowuje marker-first kolejność po preflight, lecz publikuje nowy done dopiero po obu potwierdzonych zapisach. Walidacja i niepewny wynik nie usuwają pozostawionych markerów lub punktów.

## Przeglądarka — przygotowane, pending koordynatora

`tests/e2e/crisis-save-failure.spec.ts` zawiera 8 scenariuszy, po4PL/EN. Fresh synthetic guest, stały browser czas1.01.2026, timezoneUTC, browser ruch wyłącznie localhost. Testy nie aktywują telefonów, linków pomocy, kopii pism ani usług. Obejmują:

- Mobile keyboard: dwie różne akcje, dokładne140/155 i oba IDs po reload, bez replay; kontrola reflow390px.
- Malformed actions z jawnie read-only check; fixture-only naprawa danych syntetycznych i malformed punkty odrzucane przed pisarzami.
- Błąd odczytu przed mutacją i jawny retry bez false done.
- Token write-then-throw z globalną blokadą, zmianą języka, programmatic click próbami wszystkich pięciu działań i fresh view odczytującym pozostawione dane.

Marker oraz saldo sprawdza się niezależnie od widoku. Alert, action rows i saldo mają scoped locators wewnątrz istniejącej sekcji crisis, unikając innych badge/Next announcera. Hash E2E `77456dba490759a37dd326679b3527bd525569f8166409f11907831a3d9b3c8e`. Recenzent nie uruchamiał serwera ani browser run; niezależny przegląd własnego fixture i wykonanie pozostawiono koordynatorowi.

## Ograniczenia

Global quarantine dotyczy RAM bieżącego kontrolera. Nie ma durable recovery, rollbacku, CAS lub exactly-once po remount/reload, zmianie ownera, między kartami i urządzeniami. Istniejący marker nie dowodzi historycznego przyznania punktów; po nowym widoku można odczytać marker bez nagrody, bez automatycznego naprawiania lub replay. Browser reload case sprawdza wyłącznie znane pozostawione bytes, nie uzgodnienie częściowego zapisu. Nie włączono cloud writes ani AI. Nie oceniono pełnego WCAG/czytnika ekranu, legal copy, realnego auth/RLS/chmury, stagingu lub produkcji. Wyniki unit nie zastępują browser/build ani pozostałych bramek.

Dowody: `evidence/cycle-10/ui-review-tests.json` oraz `ui-review-final.json` z fingerprints. Niezmienionych zielonych testów C9 nie powtarzano.
