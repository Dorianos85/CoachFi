# C53 — dopłata zależna od planu, bez gwarantowanego zwrotu

Status: ACCEPTED_LIMITED_LOCAL_UNSTAGED. 18.10.2026. Root autor dwóch plików treści i narzędzi; c49_validation autor fixture; root i c49_advisories peer fixture. c49_advisories niezależna recenzja finansowa/PLEN/raw, c49_dependency_review niezależne source/tools/raw. Lokalny zakres B06, produkcja NO-GO.

Istniejący us-401k-match przedstawiał dopłatę jako natychmiastowy zwrot100% i uniwersalny pierwszy priorytet. Siedem pól w ENdata/quizQuestions i PLallQuestions zastępuje tę obietnicę warunkowym przykładem: udział i wpłata mieszcząca się w budżecie po potrzebach i wymaganych spłatach, reguły/formuła/limit dopłaty oraz vesting. Hipotetyczne50% od100USD daje50USD dopłaty, bez gwarancji wyniku inwestycji. Utrata przy odejściu dotyczy wyłącznie części pracodawcy bez nabytych praw; ta precyzja pochodzi z niezależnej uwagi i jej statycznego retestu przed zmianą źródeł. USA pozostaje jawnym przykładem porównawczym, nie rynkiem wersjiEN lub opisem polskiegoPPK.

| Bramka lokalna | Wynik |
|---|---|
| Baseline tych samych11przypadków | 5PASS/6FAIL semantycznych; UI4 i preservation1 były zielone |
| Po siedmiu zmianach tekstu | 11/11PASS, te same tytuły/fixtures,6dawnych błędów zamknięte |
| Rzeczywista inwentaryzacja PLEN | oba82ID/order/key/reward,81pozostałych obiektów,ACD i pule literalne względem baseline |
| Jeden TypeScript / jeden TEMP build | TS0/556pins; buildPASS z ostrzeżeniami,34strony/35tras,556pre/555post,0driftu |
| Jeden Chrome | 2PASS,single,retry0: PLbłędneA→2stycznia i ENpoprawneB→7stycznia |
| Niezależne końcowe recenzje | dwie niezależne recenzje PASS; 0 otwartych uwag do tej delty |

11różnych Nodecases to6semantycznych,1preservation i4actualReviewPLEN×B/A. Łącznie z2Chrome:13różnych przyjętych przypadków; baseline nie jest dodatkowym kompletem. Zachowano ID/B/reward30 i gospodarkę nagród: Review nie wypłaca tej metadanej,125punktów pozostaje125. Nie uruchamiano ponownie niezmienionych historycznych zielonych testów. Semantyczny baseline zatrzymuje pętlęEN na pierwszym złym successMessage; po poprawce obydwa feedbackpola wykonują wszystkie guards.

Node korzysta z rzeczywistej stronyReview/SRS/controlledsave/ownerhandles, jawnego emulatora state/memo/effects i wejściowych mocków kontekstu oraz downstreamnotify/persist. Cztery rzeczywiste handlery potwierdzają physicalwrite→readback, kanoniczne pytanie/ABCD/voiceprops/feedback, datę i wyłącznie zapis lokalnegoSRS; pozostałe81kart, inne lokalne pola i osobna sessionMapa literalne. Nie jest to hydration/nativeReact/audio lub rzeczywisty bonus providera.

Chrome sprawdza rzeczywisty shell/Review/StreakProvider w tej samej builtTEMPkopii, świeże syntetyczne profile/adult/requiredconsent/deck,375×812 i stałyUTC. Dwie gałęzie nie są pełną macierzą2×2: PLwrongA, ENcorrectB. KlawiaturaSpace/Enter, feedback/ackdate, niezmienione81kart,125punktów/steps/streak, ukończenie i reload. Provider ma serię aktywną już dziś, więc nie dopisuje innego bonusu. Probe obejmuje4nazwane lokalne klucze postępu, nie cały storage. API0/pageErrors0, externalblocked bez totalnetwork0; controls głosu są obecne, bez audio.

Mieszane końce linii odziedziczone i zachowane: data1306CRLF/208loneLF,allQuestions1603/176. Pierwszy zbyt ścisły prewriteassert zero-loneLF zatrzymał się przed zmianą produktu; poprawiono sprawdzenie zachowania obu liczników, bez normalizacji lub powtórki testów. Dokładnie7spans rekonstruuje cały wynik.550/552dawnych wejść literalnych+2kwalifikowaneźródła,158/160priorpaths literalnych+2kwalifikowane,13preserve/14receipts zachowane. Obecnyfreeze169unique kompletny, zawiera odziedziczony helperC51 i nie wymaga suplementu. Pełny stderrC52 identyczny po jedynej normalizacji26.3s→26.5s; ostrzeżeniax402-fetch/@base-org/account pozostają.

Nowe znaczenie przyjęte wyłączniePLEN. Dwa stare osobne tłumaczeniaESFR pozostają literalne; pięć innych locale korzysta z dotychczasowego ENfallback i przejmuje zmianę bazy, bez nowej recenzji językowej. C47inwentaryzacja76/82 jest historyczna; ten jeden ID nie przyjmuje pozostałych pięciu z jej listy. B06 i40tasks obu backlogów zachowują statusy. Brak nowego potwierdzonego wyższego kandydata integralności w wąskim triage, nie ogólny integrityPASS; C50dependencydeferral historyczny bez nowegopoll.

Źródła pierwotne sprawdzone18.10.2026: [IRS o dopłatach](https://www.irs.gov/retirement-plans/matching-contributions-help-you-save-more-for-retirement), [IRS o nabywaniu praw](https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-vesting), [IRS o401(k)](https://www.irs.gov/retirement-plans/plan-sponsor/401k-plan-overview). Wykorzystano mechanizm dopłat i własności; nie przeniesiono bieżących limitów podatkowych lub konkretnego harmonogramu vestingu.

HEAD/branch/index zachowane; bez nowychgitadd/commit/push/deploy, migracji lub produkcyjnych zapisów, prawdziwych sesji/profili/sekretów, płatnych/provider calls lub kontaktów do ludzi. AI/cloudwrites HARD_OFF. Istniejący runtime, bez cleaninstall/auth/cloud/staging/production/indywidualnej porady PASS. [Dowody](../../../evidence/cycle-53).
