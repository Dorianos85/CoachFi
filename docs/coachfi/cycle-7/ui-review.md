# Cykl 7 — niezależna recenzja nagrody quizu

14.10.2026, recenzent `/root/ux_audit`. **LIMITED ACCEPT LOCAL SOURCE** dla preflight nagrody QuizCard w PL/EN. Własne **12/12 synthetic acceptance PASS**, bez zmian aplikacji przez recenzenta. Koordynator wykonał dwa nowe scenariusze przeglądarkowe i sześć dotkniętych C6: **8/8 PASS**; jego wykonania nie zaliczam do własnych testów. Produkcja pozostaje **NO-GO**.

[Testy actual QuizCard](../../../tests/cycle7-quiz-review.test.ts), [raw wynik](../../../evidence/cycle-7/ui-review-targeted-tests.json), [dowody i fingerprinty](../../../evidence/cycle-7/ui-review-final.json), [browser fixture](../../../tests/e2e/token-integrity.spec.ts). Zastosowano skille frontend-quality i data-integrity. Autor helpera, autor UI oraz niezależni recenzenci UI/liczb pozostają rozdzieleni.

## Bazowy dowód i zmiana

**C7-UI-01** był ustaleniem źródłowym: odczyt wyłącznie `components/QuizCard.tsx` z indeksu Git potwierdzał kolejność `recordAnswer` → `setSubmitted(true)` → `onReward`. Potencjalne odrzucenie nagrody następowało więc po zapisie odpowiedzi. [Baseline](../../../evidence/cycle-7/ui-review-baseline.json) zawiera hash odczytu UTF-8 i offsets. Nie wykonano udanej runtime reprodukcji starego komponentu. Zachowany [pierwszy raw wynik](../../../evidence/cycle-7/ui-review-baseline-tests.json) to parser EOF błędnie skopiowanego scaffoldu i **0 wykonanych przypadków** — błąd przygotowania fixture, nie dowód działania produktu lub acceptance.

Finalny QuizCard sprawdza `canAwardTokens(question.reward, storage)` przed SRS, gdy odpowiedź jest poprawna, istnieje `onReward` i pytanie nie było już nagrodzone. Odrzucenie pokazuje `role="alert"`, zachowuje formularz do ponowienia i nie ustawia submitted/success ani nie wywołuje nagrody lub completion. Ponowna kontrola aktualności storage pozostaje przed zapisem SRS. Błędna odpowiedź i karta bez callbacku nagrody zachowują zapis uczenia bez nagrody. W tym zakresie C7-UI-01 zamknięto niezależnym syntetycznym acceptance; brak otwartego materialnego findingu UI.

| Scenariusz | Własny sprawdzony wynik |
|---|---|
| PL/EN, raw `25garbage` lub pusty string | Dokładny alert w wybranym języku; identyczne wszystkie bajty fixture; brak SRS, reward, completion i feedback. |
| PL/EN, canonical `MAX_SAFE_INTEGER` + nagroda25 | Przepełnienie odrzucone przed zapisem; prawidłowe saldo samo w sobie nie jest nazywane malformed. |
| PL/EN, ponowienie po syntetycznej naprawie125 | Saldo150, dokładnie jeden SRS `net-worth` z repetitions1 i jeden reward25; brak completion po pierwszym pytaniu. Powtórny submitted handler niczego nie dodaje. |
| Locale/wybór odpowiedzi | Zmiana locale zeruje alert i selekcję; nowy alert jest EN. Wybór błędnego A usuwa alert, zapisuje SRS repetitions0 bez zmiany malformed salda i bez nagrody. |
| Captured submit gościa po przejściu do konta B | Nowy storage resetuje alert; stary callback nie zmienia bajtów ani stanu komponentu, salda77 B lub SRS B. To syntetyczna zmiana ownera, nie rzeczywisty login. |
| `MAX_SAFE_INTEGER−25` +25 | Dokładny wynik `MAX_SAFE_INTEGER`, pojedyncza nagroda i feedback. |
| Brak `onReward` | Poprawna odpowiedź zapisuje uczenie, nie dotyka malformed punktów i nie uruchamia token preflight. |

Alert PL: „Nie można bezpiecznie zapisać nagrody w lokalnym saldzie punktów. Odpowiedź nie została zapisana. Sprawdź dane lokalne w Ustawieniach.” Alert EN: „Your local points balance cannot safely accept this reward. This answer was not saved. Check your local data in Settings.” Oba opisują tę samą blokadę i możliwość sprawdzenia danych; nie obiecują automatycznej naprawy. Selection, next, restart, locale i nowy storage usuwają flagę błędu w kodzie. Lifecycle next/restart przy poprawnym przejściu pokrywa także regresja sześciu C6 cases wykonana przez root.

## Metoda, końcowy helper i granice

Wywołano rzeczywistą funkcję QuizCard z persistent hook slots i porównaniem dependencies. `tokens`, SRS i product-storage są rzeczywistymi importami; local/session storage to wyłącznie syntetyczne Map, a fetch jest zabroniony. To nie React DOM, concurrent scheduling, test czytnika ekranu ani konta. Trzy raw cases × dwa języki dają6; retry2 i cztery odrębne granice dają łącznie12. Wynik wykonano z helper SHA `45cb54f0…` i finalnym UI SHA `537b90c5…`.

Po tym wyniku root zgłosił B17-A01 w helperze: dodatnie mutacje poza przeglądarką miały przekraczać dawną granicę `typeof window`. Autor dodał wyłącznie trzy guardy: positive preflight false, add throw i spend false poza browserem; healthy zero pozostaje no-op. **Niezależny statyczny retest** usunięcia dokładnie tych trzech guardów odtwarza SHA `45cb54f0…` z końcowego `b81f83f4…`. Browser branch nie zmienił się. Nie ponawiano zielonych12 i nie przypisuję sobie non-browser runtime retestu; niezależne liczbowe cases ma `curriculum_pilot`, a końcowy aggregate roota objął finalny helper. Pełne SHA są w JSON.

Preflight potwierdza możliwość dodania nagrody przy odczytanym saldzie. **Nie jest transakcją SRS+saldo+callback**: późniejszy quota error, inne zdarzenie lub reentry nie ma obietnicy rollbacku. Nie przyjmuję wszystkich callerów tokenów, CAS, odzyskiwania danych, synchronizacji chmury ani rzeczywistych kont/RLS. B15 automatic cloud writes pozostają off; ten patch nie zmienia treści C6, nagród25/25/20 ani starter125. Nie badano psychometrii lub wartości finansowej punktów.

## Browser fixture i kontrole koordynatora

`token-integrity.spec.ts` ma **2 cases PL/EN**, fresh context, synthetic guest/adult18/required consent, voice/AI/Web3/leaderboard false i ruch wyłącznie localhost. Widok1280×900 pokazuje osobno saldo w headerze oraz konkretnym TokenRewardCard: heading h3 → jego karta → pojedynczy `p.text-5xl`. Raw `25garbage` daje bezpieczny widok0. Pierwsza poprawna B pokazuje exact alert, zachowuje raw, nie tworzy SRS, feedback, next ani ukończenia. Następnie **wyłącznie fixture** zmienia własny raw na125; produkt nie udostępnia tu naprawy. Ponowienie daje niezależne oczekiwanie125+25=150, jedno SRS repetitions1 i dokładny localized feedback.

Recenzent przygotował fixture i przejrzał źródła, ale nie uruchamiał browsera, serwera lub pełnych bramek. Root niezależnie przyjął fixture przed wykonaniem dwóch nowych i sześciu bezpośrednio dotkniętych C6 cases. Poprzednich22 zielonych nie ponowiono. Jego wyniki odczytano z [verification](../../../evidence/cycle-7/verification.json) i zapisano osobno jako `coordinatorChecks`, bez zwiększania własnych12 lub zmian fingerprintów źródeł/testów.

Root: **816/816 PASS w58 plikach**, 0 failed/pending, exit0; standalone TSC **exit0**. Browser [raw wynik](../../../evidence/cycle-7/playwright-tests.json): **8/8 PASS, exit0, 87 744,962 ms**, 0 failed/skipped/flaky. Fresh Chrome, syntetyczny gość i ruch browsera wyłącznie localhost; bez rzeczywistego auth/audio/providerów. Build w sprawdzonym TEMP: **34 strony statyczne, exit0**, 301 inputs/300 porównań po pominięciu wygenerowanego next-env, **0 mismatch**. Final parity: **13 porównań/12 ścieżek, 0 fingerprint mismatch**, dodatkowo300 inputs/0 source mismatch. Port43191: **0 listeners**. To wyniki koordynatora, nie nowe własne przypadki. Znane optional-dependency warnings pozostają; ruch publicznych fontów kompilatora nie został wykluczony przez test browsera.

**B18 pozostaje pending**: późniejsze błędy write/event/persist oraz uczciwy status i ponowienie po takim błędzie wymagają osobnych reprodukcji i napraw. Zielone bramki nie rozszerzają obecnej recenzji na atomową transakcję, rollback, staging lub produkcję. W końcowej księgowości nie zmieniono źródeł/testów i nie wykonano rerun; lokalny verdict pozostaje ograniczony, produkcja **NO-GO**.
