# C38 — aktualizacja parsera CSS

Status: ACCEPTED_LIMITED_LOCAL_FINAL_STAGED

C38_STATUS: ACCEPTED_LIMITED_LOCAL_FINAL_STAGED. Parser postcss-selector-parser zaktualizowany z 6.1.2 do 6.1.4 w jednym wpisie lockfile (version/resolved/integrity). package.json, Tailwind, PostCSS, kod i treści produktu bez zmian. Naprawiony zakres GHSA-w9m9-85wc-3x92; uniknięto znanej regresji 6.1.3 bez instalowania tej wersji. 21/21 testów (8 bezpieczeństwa,13 zgodności CSS), baseline14PASS/7FAIL;7 oracli jednego CVE zamknięte. Typecheck0/4piny, build34/34strony35tras,519/518inputów bez różnic podczas buildu; późniejszy pojedynczy cast typu w fixture ma identyczny emittedJS i osobny końcowy TSretest0;37plików rzeczywistego parsera i2konsumenci zgodne między instalacją, testami i TEMPbuildem. Niezależne recenzje locka, fixtures, narzędzi i ledgeru. Residual moderate/high oraz staging pozostają otwarte. Bez commit/push/deploy/AI/cloudwrites/produkcjaPASS.

Zmiana zabezpiecza rekurencyjne operacje parsera, zachowując zgodność selektorów używanych przez Tailwind. Zdrowe klasy i deklaracje CSS sprawdzono przez rzeczywistą kompilację konfiguracji projektu, a nie sam numer wersji.

[Recenzja bezpieczeństwa](../../../evidence/cycle-38/security-review.json), [zgodność CSS](../../../evidence/cycle-38/compatibility-review.json), [wyniki](../../../evidence/cycle-38/verification.json).

- Wyłącznie lokalne testy syntetyczne i kompilacja. Bez świeżego Chrome, CI, cleaninstall/freshcheckout, Auth/RLS/staging lub produkcjaPASS. Nie powtarzano niezmienionych testów treści C37.
- 7pierwotnych FAIL to oracles jednego CVE, nie7odrębnych podatności.14baselinePASS wróciło zasadnie po zmianie rzeczywistego payloadu zależności.
- 6.1.3 była kandydatem w badaniu źródeł, nigdy zainstalowaną wersją; issue321 i release6.1.4 uzasadniają wybór6.1.4. Zdrowy niespreadowany replaceWith(array) oraz rzeczywista kompilacja group sprawdzone.
- GHSA-rj75-hqrm-r3gf obejmuje <7.1.6 i pozostaje otwarte. Historia5high/13moderate jest historyczna, bez nowego npm audit, nowych liczników ani globalnego zamknięcia B10.
- Osiągalność podatności zależy od konsumenta; sprawdzono lokalny tooling na zaufanych źródłach. Nie testowano ataku na dostępność aplikacji lub serwera.
- C38-TS-01: początkowy tsc exit2 dotyczył wyłącznie wymaganego typu ProcessEnv dla pustego env w fixture. Dodano jeden usuwany przy kompilacji cast, zachowano pełne before/inverse i identyczny emittedJS.21runtime oraz build pozostają z885c; finalny TSretest dotyczy7249. Nie powtarzano zielonych testów ani buildu.
- C38-RUNTIME-01: npm zgłosił sukces, lecz rzeczywisty payload pozostał6.1.2; guard przerwał pracę przed testami/buildem. Oficjalny tarball6.1.4 zweryfikowano SRI, rozpakowano bez skryptów, a oryginalny folder zachowano w jawnej kopii TEMP; przyczynę błędu npm pozostawiono nieustaloną.
- Pusty user/global config npm, publiczny registry, skrypty lifecycle/audit/fund wyłączone; nie czytano realnych profili/sesji/sekretów i nie wywoływano płatnych usług.
- C38-TOOLS-01 naprawiono i niezależnie zweryfikowano przed pierwszym baseline/update: accepted lockreview jest związany z aktualnymi pinami, a instalacja zachowuje dokładne lockbytes.
- Kandydaci streak/URI oraz6rekordów treści są oddzielnymi obserwacjami źródeł, bez nowego PASS lub zgody na family/Kids/nowe rynki.

Root: autor minimalnego update lock/runtime i narzędzi, koordynacja/peer fixtures. daily_data_review: niezależne oracles i recenzja dependency. daily_author: autor fixture zgodności CSS. daily_ui_review: niezależna recenzja zgodności CSS, narzędzi i końcowego ledgeru. Autor nie zatwierdza własnej zmiany.517oryginalnych inputs:516literalnych i1kwalifikowana zmiana lockfile; C37receipt i21source/tools literalne.
