# C19 — B25 integralność zapisu quizu

15.10.2026. Dorośli w Polsce, PL/EN. C18 Review/navigation przyjęty lokalnie i finalstaged, wszystkie wcześniejsze zmiany zachowane. Zależności2inputs bez zmian; nadal bez nowego closure pozostających zależności. B25 ma pierwszeństwo przed odroczonym financialdraft.

Problem: actual legacycontroller+realSRS overwrote malformedJSON w zachowanymC18baseline; current QuizCard callsite połączono statycznie. Brak jeszcze actualcomponentFAIL/PASS. Najpierw mały syntetyczny baseline istniejącegoQuizCard; rootsourcewrite dopiero po odtworzeniu i niezależnym przeglądzie design.

Root+3, te same role, rozłącznepliki. Root: components/QuizCard.tsx, tools/config, niezależny fixture/E2Epeerreview, integracja i ledger. daily_author: nowy mały lib/quiz-learning-save.ts oparty na niezmienionym Reviewguard, własna meaningfulfixture; niezależny rootcomponent/toolsreview w drugiejfali, bez selfapprovalhelpera. daily_data_review: własna datafixture, independenthelper/realSRS/tokenreceipt/callsite review. daily_ui_review: własny actualQuizCardbaseline/acceptance iE2E, późniejszy independentledgerQA.

Kryteria: strictinitial i everyusedSRSread bez wymyślania pustej historii/nadpisania malformedraw; ACK/readback przed feedback/reward, bez duplicate/replay po starych callbackach i po niepewnym zapisie/locale/remount w RAM scope. Zachować tokenpreflight i kontrolowaną informację PL/EN, legitimatehistory/unknownIDs/extra fields/interval131. Ewentualny tokenreceipt opiera się na istniejącym bezpiecznym integerkontrakcie i actualreward callback, bez nowej ekonomii. Bez resetu SRS lub nagród/treści/stage maps, bez duplikacji walidatora/quarantine.

Immutable: lib/review-save.ts, lib/quiz-save.ts, lib/srs.ts, lib/tokens.ts, product-storage, ReviewPage iAppNavigation. Pełnebefore/hash i rawfailures zachować. Najpierw contractreview; potem SOURCE READY→ownauthor/data/UI runtimes, niezależny retestfindings. Root odpowiedni pojedynczy aggregate/TS, świeży bounded Chrome PL/EN iTEMPbuild/parity, scopedcheck/hygiene, niezależny QA i existingreceipt. Wychwycić whitespace przedgates, nie powtarzać green bez nowej zmiany/obawy.

Dowody źródłowe w repo/evidence/cycle-19, wskaźnik w workspace/evidence/coachfi-cycle-19.json. Bez commit/push/deploy, produkcyjnych zapisów/migracji, realnych profili/sesji/sekretów, płatnych wywołań i kontaktu z ludźmi. AI/cloudwrites/livevoice/mic/health/Kids/Web3/afiliacjaoff. Quarantine tylko RAM; brak rollback/durableexactly-once/CI/freshcheckout/Auth/RLS/staging/produkcjaPASS.

## Actualbaseline i uzgodniona granica caller

Actual QuizCard baseline10=3PASS/7FAIL przedsourcewrites; pełne15fingerprintów i telemetry zachowane. Malformed initial/latecorrupt nadpisują SRS i realreward; nonarray crash, native lyingSRS ACK publikuje sukces, partialtokenwrite po locale/remount powtarza tę samą nagrodę150→175. Designphases niezależnie przyjęty przezdatareview62fdb363. Jedyny actualcaller app/quiz/page.tsx dodany do rootzakresu: questionaward strictreceipt PRZED activity/streakbonus, confirmedparentUI dopiero po helper saved. Public legacy onReward(amount)1arg pozostaje kompatybilny fallback; actualparent używa preferredrewardPersistence bundle bezpodwójnejnagrody. RootQuizCard2TSXbefore/inverse w root-source-implementation.json; helper635db używa immutableReviewguard. Nie walidujemy nagrody jedynie >= po całymcallbacku, bo bonus mógłby zamaskować brak questionaward.


## C19 — wyniki pierwszej regresji

ActualQuizCard baseline3PASS/7FAIL, parentbalance0/1; nowe source i independenthelper58/UI25distinct oraz author34 przyjęte w ograniczonym zakresie. Root2442PASS/11FAIL/2453cases98files:117nowychPASS i2336poprzednich zachowane multisetem. Jedenaście FAIL dotyczy starych C6/C7 harness; przygotowanie jawnej adaptacji mocków bez zmiany oracles w toku. C6setup z noopreward nie zapisuje tokenów; C7 pomija layout admission i daje niestały storagehandle. Produkcyjne źródła pozostają zamrożone. FinalTS/Chrome/build/parity/QA oczekują; brak przyjęcia C19.
