# C20 — odczyt postępu Home i ścieżki nauki

15.10.2026. B26 jest kandydatem na podstawie odczytu źródeł. Najpierw odtwarzamy zachowanie istniejących Home/ProgressPath i rzeczywistego getAllStageProgress na danych syntetycznych. Nie deklarujemy awarii produkcji ani poprawki na podstawie dokumentów. C19 przyjęty lokalnie i staged; jego źródła, testy, surowe wyniki i recenzje pozostają zachowane.

Root + trzech dotychczasowych specjalistów, rozłączne pliki: root app/page.tsx, components/ProgressPath.tsx, narzędzia/config i rejestry; daily_author nowy lib/learning-progress-read.ts i własne testy; daily_data_review własny baseline/helper i niezależna recenzja projektu oraz późniejszej implementacji; daily_ui_review actual component baseline, akceptacja PL/EN, później E2E i recenzja rejestrów. Root niezależnie recenzuje fixtures i E2E; autor nie zatwierdza własnej zmiany.

Proponowany kontrakt: odróżnić brak danych od odmowy/uszkodzenia; readReviewCards jako niezmieniony walidator SRS, ścisły odczyt manual cache i snapshot dla istniejącego getAllStageProgress bez duplikacji mapy lub obliczeń. Home zależy tylko od SRS dla licznika; manual cache nie powinien blokować niezależnej metryki. Przy błędzie jawny komunikat PL/EN i ponowny odczyt bez naprawy/nadpisania; bez aktywnych przycisków opartych na wymyślonym postępie. Stare callbacki po cleanup bez skutków. Ewentualny start etapu: najpierw baseline, później tylko guard callsite przed istniejącym writerem, bez zmiany wspólnego API/polityki.

Niezmienne: lib/learningProgress.ts, srs, review-save, auth/signIn i istniejące mapy/rewards/content. Granice: dorośli, Polska, PL/EN; bez commit/push/deploy, migracji/zapisów produkcyjnych, realnych profili/sesji/sekretów, płatnych wywołań i kontaktu z ludźmi. AI/cloudwrites/health/Kids/Web3 pozostają wyłączone. Testy lokalne i moki nie oznaczają PASS stagingu/Auth/RLS/CI/fresh checkout/produkcji.

Po niezależnym design review i rzeczywistym baseline: implementacja, testy autorów i odrębni recenzenci, retest findings. Następnie pojedyncza odpowiednia regresja, TS, świeży ograniczony Chrome PL/EN, osobny build TEMP i parity, higiena/scoped check oraz niezależna recenzja raportu. Nie powtarzamy zielonych testów bez zmiany lub konkretnej obawy.


## Dobór testów po implementacji

Trzy rozłączne nowe fixtures wykonały pierwszy własny przebieg:30author,44data i27actualUI, razem101. Sześć dawnych obserwacji zachowano osobno jako archiwalny baseline. Nie ponawiamy2453historycznych przypadków ani nowych zielonych bez konkretnego powodu. Bounded source search98dawnych fixtures bez bezpośrednich odniesień do nowych targetów, shared API bez zmian; to nie pełny dependency graph. Odrębny autor przyjął dobór warunkowo na finalne hashe/TS/Chrome/build/parity.2453pozostaje historyczne, nie jest nowym PASS ani dodatkiem do101.

## Rozszerzenie po rzeczywistym finding Chrome

Pierwszy Chrome2PASS/6FAIL ujawnił brak przekazania value w components/ui/progress.tsx. Root dodał jedną linię i oddzielny tests/cycle20-progress-aria-root.test.ts; niezależny daily_author przyjął exact inverse i fixture.5rzeczywistych ReactDOMServer/Radix przypadków PASS, końcowy Chrome8single po naprawie, niezależny daily_ui_review zamknął C20-BROWSER-01. Osobne8błędów launch-only zachowane; root poprawił złą nazwę zmiennej wrappera na istniejące COACHFI_P0_BROWSER_CHANNEL bez source/E2E zmian. Aktualny zakres10core+1archiveddiagnostic+7boundaries=18.106nowych=101wcześniejszych+5nowych, bez ponawiania101 zielonych. Cztery non-null assertions authorfixture to jawny type-only wyjątek z identycznym emitowanymJS. Source-freeze-aria.json zachowuje wcześniejsze freezes; ani original UI verdict8525, ani rawfailures nie są zastąpione.
