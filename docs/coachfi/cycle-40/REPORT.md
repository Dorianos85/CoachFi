# C40 — poprawne wyświetlanie nazwy z linku do quizu

Status: ACCEPTED_LIMITED_LOCAL_FINAL_STAGED

C40_STATUS: ACCEPTED_LIMITED_LOCAL_FINAL_STAGED. Nazwa nadawcy w wyzwaniu quizowym jest używana po jednym dekodowaniu URLSearchParams; usunięto dodatkowe decodeURIComponent z jednego wyrażenia. Literalny procent i %2F nie powodują już błędu renderowania lub zmiany nazwy. 18/18 actualcomponent SSR PASS PL/EN; baseline 12PASS/6FAIL, te same oracles po poprawce. TS0/8pinów, build34/34strony35tras525/524inputs0drift. Chrome6/6single/retry0/API0/pageErrors0 na tej samej builtTEMPkopii; pięć kluczy postępu bez zapisu,125tokenów, prawdziwy QuizCard/Space/reload. Niezależne recenzje kodu, fixtures, narzędzi i ledgeru. Bez commit/push/deploy/AI/cloudwrites/produkcjaPASS.

- SSR fixture wykonuje actualQuizPageContent i ChallengeBanner poza Suspense. Locale/router/storage i sąsiednie widżety są jawnie syntetyczne. Chrome osobno wykonuje pełny prawdziwy QuizCard w headless ephemeral profile, na lokalnym Nextproductionstart.
- 18SSR i6Chrome to odrębne warstwy i przebiegi, bez globalnego regression PASS. Nie ponawiano niezmienionych testów C39/treści/rewardcontrollerów.
- Score z query pozostaje nieautorytatywną etykietą string; bez nowej polityki punktacji, leaderboard lub weryfikacji autora linku. Literalny markup to ograniczony oracle tekstu React, bez nowego ogólnego securityPASS.
- Pięć kluczy postępu zachowano w sprawdzonych ścieżkach; nie złożono nowej obietnicy o wszystkich kluczach urządzenia. Brak świeżego Auth/RLS/staging/CI/freshcheckout/produkcjaPASS.
- Zależności i pozostałe advisories są bez zmian. C39streak i47 wcześniejszych source/tools pozostają literalne. Bez nowych danych, rynku, usług, budżetu lub zmian produkcyjnych.

[Wyniki](../../../evidence/cycle-40/verification.json), [recenzja renderowania](../../../evidence/cycle-40/data-review.json), [recenzja Chrome](../../../evidence/cycle-40/ui-review.json).

Root: autor źródła/narzędzi i niezależny peer fixtures. daily_data_review: normatywne18cases i niezależna recenzja źródła. daily_ui_review:6Chrome, niezależne źródło/narzędzia i ledgerQA. Root+2specjalistów; autor nie zatwierdza własnej zmiany.
