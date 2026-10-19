# C52 — niezależna recenzja narzędzi przed wykonaniem

Werdykt: **STATIC_TOOLS_GO_PENDING_INDEPENDENT_FIXTURE_CONFIG_PEER**. Otwartych ustaleń: **0**. Recenzent `c49_dependency_review`; autor narzędzi: `root`. Recenzja statyczna z 2026-10-18T19:51:35.846Z.

Przeczytano wszystkie pięć narzędzi, istniejące helpery granic i fingerprintów oraz plan C52. Nie wykonano narzędzi, testów, kompilatora, kontroli składni, npm, buildu ani przeglądarki. Hashe w sąsiednim JSON zamrażają oceniony kod.

- Bootstrap łączy 150 pinów C51 z dodatkowym pinem `browser-retest.mjs` **przed** deduplikacją: 151 krotek, 151 ścieżek, wszystkie zgodne. Weryfikuje bazę dodatku, 549 dawnych wejść i 13 receiptów C39–51. Zachowuje 12 granic, w tym C51 `lib/avatar.ts`, model wyniku i oba manifesty; przechowuje pełne źródło strony sprzed C52.
- Runner ma osobne, jednokrotne tryby baseline, acceptance, legacy i typecheck. Pinuje 549 dawnych oraz trzy nowe ścieżki, łącznie 552, przed i po procesie; zapisuje surowy wynik i świadków runtime. Legacy wybiera wyłącznie `C51 actual AvatarPage after explicit emulated effects`: oczekiwane 8 PASS i 25 jawnych pominięć pozostałych przypadków.
- Snapshot zachowuje fixture, e2e i konfigurację C51 oraz dodaje trzy ścieżki C52 i dozwoloną konfigurację. Istniejące ograniczenia profili, env, baz, logów, HAR, dowiązań, realpath, TEMP i hashy pozostają w użyciu. Build sprawdza tę samą kopię przed i po wykonaniu, z jedynym wyjątkiem wygenerowanego `next-env.d.ts`.
- Browser wymaga dokładnie tej samej kopii TEMP po udanym buildzie, wolnego portu przed i po, zgodności źródeł i runtime. Ma osobne wyjście C52, surowy raport i guard jednokrotnego wykonania. Sprzątanie czeka najwyżej 5 sekund i zgłasza zajęty port.
- Procesy używają absolutnego Node i CLI, `shell: false`, pustych wartości dostawców/auth oraz usuniętych `NODE_OPTIONS` i `NODE_PATH`. Brak instalacji, migracji, wdrożenia lub wywołań API dostawców w ocenionych narzędziach.

GO obowiązuje pod warunkiem osobnego zatwierdzenia fixture Node, specyfikacji e2e i konfiguracji przez root oraz niezależnego recenzenta przed odpowiednim wykonaniem. Ta recenzja nie potwierdza jeszcze sześciu nowych przypadków, ośmiu legacy ani dwóch przypadków Chrome PL/EN. Końcowy peer musi odczytać surowe wyniki. Bez automatycznego powtarzania zielonych przypadków; ewentualny ograniczony retest wymaga zachowania oryginalnych dowodów i osobnej recenzji helpera.

Zakres pozostaje lokalny, na istniejącym zainstalowanym runtime. Świadek parsera nie stanowi pełnej inwentaryzacji node_modules ani clean install. Brak nowej akceptacji modelu finansowego, auth, dostawców, chmury, stagingu lub produkcji.

