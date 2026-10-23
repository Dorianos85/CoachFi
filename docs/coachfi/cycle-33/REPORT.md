# C33 — podstawy inwestowania PL/EN

Status: ACCEPTED_LIMITED_LOCAL_FINAL_STAGED

C33_STATUS: ACCEPTED_LIMITED_LOCAL_FINAL_STAGED. Cztery istniejące pytania PL/EN o alokacji, rebalansowaniu, opłatach i przygotowaniu do inwestowania. Zachowano poprawne definicje; doprecyzowano warunkowość ryzyka, koszty i dobrowolność. B/B/B/B,25/25/30/30, bank82 i82PLproperties bez zmian. 27nowychPASS (10finance+17actualReview), baseline17PASS/10FAIL;10pierwotnychFAILzamknięte. Osobno24historycznePASS (2/1/3/6/6/6), TS0/13pins, Chrome8/8single/retry0, build34/34pages35routes485/484inputs0drift. Niezależne recenzje finance/UI/source/helper/tools. Bez commit/push/deploy/AI/cloudwrites/produkcjaPASS.

Cztery istniejące pytania: asset-allocation, rebalancing, fees-ter, invest-prerequisites. Recenzje dotyczą8wersji PLEN i12uzasadnień błędnych odpowiedzi. Poprawne definicje zachowano; doprecyzowano ograniczenia i model opłat.

[Draft i źródła](content-metadata.json), [recenzja finansowa](../../../evidence/cycle-33/financial-review.json), [wyniki](../../../evidence/cycle-33/verification.json).

- Wyłącznie lokalne syntetyczne testy/harness oraz Chrome gościa; brak Auth/RLS/staging/CI/freshcheckout/audio/produkcjaPASS
- Nagrody110 to metadata; Review zachowuje125tokens i0bezpośredniej nagrody. CorrectJan7/wrongJan2; stareSRS nie potwierdza zrozumienia nowej treści
- ES/FR zachowują4stare jawne tłumaczenia; zh/ja/hi/ptBR/tr dziedziczą nowyENfallback. Wszystkie7poza nową akceptacją; brak nowych rynków lub aktywacji
- Podstawowe definicje poprawne przed zmianą. Poprawka feedback nie dowodzi błędu kontrolera. Rebalansowanie nie gwarantuje stałego ryzyka/zwrotu i może powodować koszty
- Model opłat1000PLN,stopabrutto0,ten sam kapitał bazowy,jedno hipotetyczne potrącenie:1%=10PLN i0,2%=2PLN; saldo990/998. To uproszczenie, nie dokładna metodologia TER/NAV lub suma wszystkich kosztów
- Potrzeby i wymagane spłaty najpierw; rezerwa i ograniczenie drogiego długu nie gwarantują uniknięcia wymuszonej sprzedaży. Inwestowanie jest dobrowolne
- Bez nowych ID/lekcji/kategorii/pool/reward/rotation/writer/authpolicy/danych. Nie zmieniać istniejącej ekonomii, historięSRS i inne rekordy zachować
- Browserprobe reset po reload; brak dowodu global durableexactlyonce. B10 pozostaje częściowo otwarte; nie wykonano nowego audytu zależności lub zamknięcia advisory. Decyzje kont/CAS/pełnych praw/operacji nadal otwarte

Root: koordynacja/runtime i peer fixtures; daily_author: source/helper; daily_data_review: niezależne finanse/helper; daily_ui_review: actualUI/Chrome i niezależne roottools/ledgerQA. Autor nie zatwierdza własnej zmiany. Dawne477inputs:469literalnych i8jawnych zmian (2produkty+6setupimportów),515historycznych expect/6describe i13starszychhelpers zachowane. Freeze13source i8tools.
