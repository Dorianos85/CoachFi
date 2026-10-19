# C36 — IKE/IKZE i wpłaty PPK PL/EN

Status: ACCEPTED_LIMITED_LOCAL_FINAL_STAGED

C36_STATUS: ACCEPTED_LIMITED_LOCAL_FINAL_STAGED. Trzy istniejące pytania PL/EN o IKE/IKZE i wpłatach PPK. Zachowano poprawne stawki i kwoty; doprecyzowano warunki ulg/wypłat, podstawę wpłat i warunkowość dopłat. B/B/B,35/30/25, Retirement/Emerytura/bank82/82PLproperties bez zmian.21nowychPASS (8finance+13actualReview), baseline13PASS/8FAIL;8pierwotnychFAILzamknięte. Osobno24historycznePASS (2/1/3/6/6/6), TS0/13pins, Chrome6/6single/retry0, build34/34pages35routes509/508inputs0drift. Niezależne recenzje finance/UI/source/helper/tools. Bez commit/push/deploy/AI/cloudwrites/produkcjaPASS.

Trzy istniejące pytania,6wersji PLEN i9par uzasadnień błędnych odpowiedzi. Poprawne stawki i kwoty zachowano; doprecyzowano warunki ulg/wypłat i wpłat/dopłat PPK.

[Draft i źródła](content-metadata.json), [recenzja finansowa](../../../evidence/cycle-36/financial-review.json), [wyniki](../../../evidence/cycle-36/verification.json).

- Wyłącznie lokalne syntetyczne testy/harness oraz Chrome gościa; brak Auth/RLS/staging/CI/freshcheckout/audio/produkcjaPASS
- Nagrody90 to metadata; Review zachowuje125tokens i0bezpośredniej nagrody. CorrectJan7/wrongJan2; stareSRS nie potwierdza zrozumienia nowej treści
- ES/FR zachowują3stare jawne tłumaczenia; zh/ja/hi/ptBR/tr dziedziczą nowyENfallback. Wszystkie7poza nową akceptacją; brak nowych rynków lub aktywacji
- Zachowano poprawne podstawowe stawki i kwoty. IKE/IKZE mają ustawowe warunki ulg i wypłat, roczne limity oraz odrębne zasady wcześniejszego zwrotu. Odliczenie od podstawy nie jest gwarantowanym zwrotem podatku
- Podstawa wpłat PPK jest ustawowo zdefiniowana; model6000PLN→120pracownik/90pracodawca/150opcjonalne dodatkowe, maksymalnie240pracodawcy, dotyczy wpłat i nie wylicza pensji netto ani indywidualnego PIT. Dodatkowe2,5% jest dobrowolne
- 250PLN to jednorazowa wpłata powitalna,240PLN to warunkowa dopłata roczna, bez obietnicy automatycznej wypłaty lub gwarantowanego zysku inwestycji; nie badano kwalifikacji konkretnego uczestnika
- Edukacja dla Polski PL/EN, nie osobista porada podatkowa, wybór produktu lub wyliczenie konkretnej deklaracji/płacy. Bez nowych ID/lekcji/kategorii/pool/reward/rotation/writer/authpolicy/danych. Nie publikujemy bieżących limitówkwotowych/minimalnegowynagrodzenia w nowych treściach
- Browserprobe reset po reload; brak dowodu global durableexactlyonce. B10 pozostaje częściowo otwarte; brak nowego audytu zależności lub zamknięcia advisory. Decyzje kont/CAS/pełnych praw/operacji nadal otwarte

Root: koordynacja/runtime i peer fixtures; daily_author: source/helper; daily_data_review: niezależne finanse/helper; daily_ui_review: actualUI/Chrome i niezależne roottools/ledgerQA. Autor nie zatwierdza własnej zmiany. Dawne501inputs:493literalnych i8jawnych zmian (2produkty+6setupimportów),515historycznych expect/6describe i16starszychhelpers zachowane. Freeze13source i8tools.
