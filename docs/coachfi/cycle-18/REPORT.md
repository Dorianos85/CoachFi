# C18 — integralność zapisu powtórek Review

Cykl18 B24 przyjęty lokalnie w ograniczonym zakresie; źródła i dowody staged, receipt w final-stage.json.

B24, dorośli w Polsce, PL/EN. B24 Review: pojedyncze przyjęcie odpowiedzi, kontrola starych callbacków i właściciela, strict odczyt SRS bez nadpisania uszkodzonych danych, ACK przed wynikiem, jawny błąd oraz blokada niepewnego zapisu w RAM. Pokazywana jest zapisana data powtórki. Dodatkowo nawigacja nie wywraca strony przy uszkodzonym SRS.2335aggregatePASS/1historycznyhookFAIL +1niezmieniony targetedPASS=>2336distinct w95plikach, bez single2336green;132nowe=49+56+27,2204old zachowane multisetem. FinalTS0,Chrome8/8single po naprawie initial6/2,build34/34pages/35routes.381/380inputs i167reviewporównań/109ścieżek0mismatch;20C17core unchanged. Bez commit/push/deploy/AI/cloudwrites, produkcjaNO-GO. Wszystkie runtime/parity0mismatch dotyczą bytes przed końcowym usunięciem jednej pustej linii EOF(2bytesCRLF) w ReviewPage; po nim1jawna różnica format-only/0niewyjaśnionych, kopie zachowane i odrębny independentformatreview. Next B25 QuizCard/SRS strictguard wymaga odrębnego actualcomponent baseline; draftcontent emergency-first-milestone odroczony, bez jego akceptacji.

## Zmiana i dowody

Odpowiedź jest przyjmowana raz dla aktualnej karty/widoku/właściciela. Stare reveal/Next/restart/retry są obojętne po zmianie kontekstu. Strict odczyt zachowuje uszkodzone dane i nie wymyśla pustego banku; potwierdzenie zapisu i readback poprzedzają feedback/wynik. Odmowa przed zapisem pozwala jawnie ponowić próbę. Niepewny zapis blokuje dalsze działania dla tego właściciela w RAM, także po zmianie języka lub remount. Zapisany termin2026-01-07 jest wyświetlany z ACK, bez drugiej kalkulacji harmonogramu.

Pierwszy realny Chrome ujawnił dodatkowy crash wspólnej nawigacji: cards.map is not a function. Guard optional badge używa zwalidowanego snapshotu, sprawdza currentowner przed publikacją i ukrywa badge przy błędzie; Review może pokazać kontrolowany alert. Finalny retest8/8 zamyka C18-BROWSER-01. Shared SRS/quiz-save, treści finansowe, mapa etapów i nagrody pozostały bez zmian.

## Walidacja i niezależność

- Root:2335PASS/1FAIL w95plikach; tylko ten sam niezmieniony C14case ponowiono:1PASS/24unselected. Razem2336distinct, bez pojedynczego zielonego agregatu2336. Przyczyna historycznego hook STACK_TRACE_ERROR pozostaje nieustalona. Wszystkie132nowe=49author+56data+27UI zielone w agregacie;2204stare zachowane multisetem.
- Own UI27distinct to26+1targeted, nie pojedynczy own27. Root aggregate obejmuje wszystkie final27. Baseline5PASS/4FAIL, osobny scheduleFAIL, późniejszy stale-loadFAIL oraz wszystkie rawtelemetry zachowane.
- Helper authored daily_author, independentdata56 i callsite review. Root ReviewPage i nawigacja przyjęte przez daily_author oraz independentUI probes/browser addendum. Root niezależnie przyjął UI fixture append16+1 i cały E2E. Autor nie zatwierdza własnej zmiany.
- TS0 po nowym AppNavigation. Chrome final8/8 single, bez retry, obie wersje językowe: duplicate/keyboard/mobile, malformed read retry/locale/reload, prewrite retry i partial-write quarantine.0API/pageErrors wynika z osiągniętych jawnych asercji.
- Build34/34stron/35routes. Osobne świeże kopie Chrome i builda:381preflight/380postflight,0mismatch. Parity167porównań/109ścieżek0mismatch; wszystkie20C17core unchanged. KnownoptionalCoinbase warnings nie oznaczają przyjęcia zależności.
- Sandbox TCPodmówił odczytu; pierwotny błędny PASS wynikający z nieprzerywającego błędu PowerShell jawnie unieważniono. Hostretry z przerwaniem przy błędzie potwierdził0listeners43191.

Pierwszy scopedcheck ujawnił dodatkową pustą linię EOF ReviewPage; usunięto wyłącznie2końcowe bytesCRLF. Pełny before i exactinverse oraz trzy kopie zachowane w post-runtime-format-parity.json. Końcowe źródło ma1jawną różnicę format-only/0niewyjaśnionych wobec runtime; Niezależny formataddendum przyjęty:4609identycznychTSXtokens i0parse diagnostics, pełny byteinverse. Końcowe scopedcheck/QA/staging są odrębnymi bramkami.

Finalguard1594tracked/1212text/1skip/0findings; scopedcheck0 po exactEOFtrim. Niezależny ledgerQA przyjęty,0findings; rutynowa promocja i finalny staging potwierdzone w [receipt](../../../evidence/cycle-18/final-stage.json). [Verification](../../../evidence/cycle-18/verification.json) zawiera hashe i dokładne statusy.

## Ograniczenia i następny krok

Przyjęcie dotyczy lokalnej ścieżki Review i odczytu jej badge. RAM quarantine nie daje trwałego recovery, rollback lub exactly-once pomiędzy dokumentami. Testy mają syntetyczne dane; activity mock oraz realbrowserstreak już dzisiaj są rozdzielone. Brak staging/CI/freshcheckout/Auth/RLS/produkcyjnegoPASS; bez commit/push/deploy/AI/cloudwrites.

B25 ma pierwszeństwo: stary QuizCard nadal używa niechronionego wspólnego SRS/quiz-save. Nadpisanie malformedJSON odtworzono w rzeczywistym helperpath; połączenie z komponentem potwierdzono statycznie, actualcomponent baseline dopiero do wykonania. To oddzielne zadanie, bez naprawy lub PASS w C18.

Pierwotny draft emergency-first-milestone oraz6financialbaseline observations odroczono przed sourcewrites; treść/keyB25points i bank82 nie zostały zmienione ani przyjęte merytorycznie w C18. Brak nowych zgód na koszt/dane/rynki.
