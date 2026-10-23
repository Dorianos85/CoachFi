# C28 — podstawy finansowe w sześciu wyzwaniach PL/EN

Status: ACCEPTED_LIMITED_LOCAL_FINAL_STAGED

C28_STATUS: ACCEPTED_LIMITED_LOCAL_FINAL_STAGED. Jedna paczka6istniejących wyzwań c1-c6 PL/EN: elastyczny budżet, warunkowy procent składany, ryzyko dywersyfikacji, lawina długu po wymaganych spłatach, dokładna realna stopa w modelu i rozróżnienie ETF/funduszu indeksowego. Wymiana6ENobject i6istniejącychPLproperties; bez dodaniaID/PLwpisu. B/C/B/C/D/B,50każdy,bank82/20challenge/rotacja/app bez zmiany polityki. 43nowychPASS (18finance+25actualDaily) po dwóch rozłącznych baseline: 25PASS/16FAIL i0PASS/2FAIL; osobno15historycznychPASS (1/2/4/4/4). TS0/13pins, Chrome12/12single/retry0, build34/34pages35routes445/444inputs0drift. Niezależnefinance/UI/adapter/tools. Inne7jawnych tłumaczeń6rekordów pozostają literalne i poza nową akceptacjąPLEN. Bez commit/push/deploy/AI/cloudwrites/produkcjaPASS. Pozostałe wyzwania wymagają odrębnego inventory i review.

Model realnej stopy dla hipotetycznych2%nominalnie i5%inflacji w tym samym roku, bez podatku/opłat/przepływów: (1,02/1,05−1)×100=−20/7%≈−2,86%. Różnica2−5=−3punkty procentowe daje przybliżenie stopy realnej, nie dokładny wynik tego modelu. Nie są to aktualne stawki ani oferta. Pozostałe treści mają jawne ograniczenia: budżet dopasowany do sytuacji/niezbędnych kosztów i wymaganych spłat; dodatkowa spłata po minimach; dywersyfikacja nie wyklucza strat; ETF może być aktywny i nie gwarantuje niskich kosztów lub przewagi wyniku.

[Draft i źródła](content-metadata.json), [niezależne finanse](../../../evidence/cycle-28/financial-review.json), [weryfikacja](../../../evidence/cycle-28/verification.json). Historyczny draft zachowuje własny status; przyjęcie implementacji ma osobne recenzje.

- Local synthetic data only; unit uses explicit mocked React/context/storage/cloud/streak boundaries; browser uses ephemeral guest and today streak seed.
- No new Auth/provider, audio, RLS, staging, CI, fresh-checkout or production PASS.
- No app, daily rotation, reward or persistence policy change. Existing sixquestionkeys/50each and bank82; historical SRS retained.
- Other seven explicit translations of six records remain literal with their old claims, outside PL/EN acceptance.
- No new published national statistic, law, current rate or financial product recommendation; hypothetical PLN examples with explicitly stated periods only.
- No commit/push/deploy/AI/cloud/paidcalls. Dependency inputs unchanged; residual dependency blockers remain open.

Początkowy baseline41 miał25UIPASS i16financeFAIL, bez błęduUI/missingPL. Niezależny peer dopuścił sześć równoważnych sformułowań przed zmianą danych, a siódme (warunek ENc4) po zmianie danych i przed pierwszym postsource runtime43; oryginalnyffd0 i rawbaseline zachowane, nie deklarujemy literalności tych wyrażeń. Dwie NOWE numeryczne próbyC2 miały osobnybaseline0PASS/2FAIL na starych danych. Nie powtarzano wtedy25zielonychUI. Końcowy pierwszy43retest po zmianie12copy jest uzasadniony tą zmianą.

Root: narzędzia i wykonanie bramek, peer fixtures/E2E. Autor danych i adaptera: daily_author. Niezależne finance i adapter: daily_data_review. ActualDaily fixtures/E2E i niezależne roottools/ledgerQA: daily_ui_review. Brak samoakceptacji. 43nowych,15historycznych i12Chrome raportowane oddzielnie, bez globalnego PASS lub sumowania dawnych cykli.

ActualDaily i Chrome: sześć osobnych dat UTC wybiera realną rotacją c1–c6. Każda poprawna odpowiedź daje50punktów (125→175) i właściwy znacznik daty;300 to suma metadanych sześciu pytań, a nie nagroda jednej sesji. WrongA w12unitowych PL/EN nie zapisuje punktów ani ukończenia. PełnyquestionABCD voiceprops max296, wrongbanner+explanation max382, bez uruchamiania audio. Chrome12/12single/retry0 ma375px, klawiaturę, API0/pageErrors0 i zachowaneSRS/retirement2/streak; port43191wolny przed/po. Pięciokluczowy probe resetuje się po reloadzie, więc nie jest globalnym licznikiem zapisów ani dowodem durable exactly-once.

Pięć historycznych fixture zmieniono wyłącznie przez importC27→C28:468expect pozostaje literalnych, niezmieniony szósty ma47 — razem515 i6pełnych describe. Końcowy codefreeze12plików, TS13pins obejmuje także ten niezmieniony szósty. Dawne437inputs to430literalnych i7jawnych zmian(2produkty+5imports). Osiem poprzednich helpers i receiptC27 zachowane.

Wszystkie6PLoverride istniały wcześniej: liczba71, kategoriaWyzwanie i klucze B/C/B/C/D/B pozostały. Nie dodano lekcji, topic lub domyślnej puli. Bank82 i wcześniejsza historiaSRS pozostają; nowa treść pod starymID nie potwierdza historycznego zrozumienia nowego pytania. Pozostałe13challenge, w tym kandydaci do oddzielnego audytu, mają tylko obserwację źródłową w next-candidate-observation.json.

C28-FIXTURE-01: przed pierwszym baseline wyłączono wyłącznie wymóg różnicy PL/EN dla prawidłowo identycznych całkowitych odpowiedzi procentowych c5; nie był to błąd produktu. C28-TOOLS-01/02 zamknięto statycznie przed pierwszym generatorem: jawne okresy modeli oraz poprawna kolejność6financeguardów przed zmianą danych i siódmego po zmianie/przed43. Oryginalne dowody, nieuruchomiony c088 oraz wykonany początkowy ffd0/raw41 i kolejne kwalifikowane wersje są zachowane; nie wygenerowano nowego baseline25UI.
