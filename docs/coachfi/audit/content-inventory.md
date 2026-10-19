# Inwentaryzacja treści i quizów Coachfi.ai

Data: 2026-10-14 (Europe/Warsaw). Autor: role 7/8, curriculum_pilot. Status: **sprawdzone źródła kodu i próbka live UI; recenzja wydaniowa pending**. Pierwszy rynek: Polska, języki PL/EN. Zastosowano lokalne skille coachfi-curriculum, coachfi-quiz-quality i coachfi-localization.

**Aktualizacja zasobów:** Founder udostępnił [repo CoachFi](https://github.com/Dorianos85/CoachFi). Kod jest dostępny w `source/CoachFi`, audytowany commit **86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b**. Wcześniejszy brak lokalnego kodu jest historią początku audytu. **Powiązanie z produkcją potwierdzono metadanymi Vercel:** deployment dpl_AaEiWV85rietTuq3Z5GqogCu3DuN, READY, target production, alias coachfiai.com, githubCommitSha równy audytowanemu commitowi. Dowód A25 w evidence/architecture.json i deploymentQuery z live DOM UX. To nie test kont, chmury ani trwałego zapisu.

## Obecny stan: trzy różne liczby

| Liczba | Znaczenie i dowód | Czego nie dowodzi |
|---|---|---|
| **8 lekcji / 28 kroków PL/EN** | Kod: osobna moneyMindsetLesson i 7 stageLessons; po 3,4,4,4,3,5,2,3 kroków. | Nie są to 28 osobnych lekcji i nie dowodzą zastosowania umiejętności. |
| **28 ID w Learn** | STAGE_QUESTION_IDS przypisuje 28 rekordów do 8 etapów; zgodne z licznikami live. | Nie jest to cały bank. |
| **82 ID w banku źródłowym** | 62 quizQuestions + 20 challengeQuestions; allQuestions łączy obie listy. ID nie powtarzają się. | Nie są to 82 odrębne cele/niepowtarzalne pytania: występują duplikaty. |
| **4 pytania w zwykłym Quiz PL/EN** | getQuizQuestions(locale) zwraca listy en i pl po 4; QuizCard losuje tę listę. | Dodatkowe rekordy quizQuestions nie trafiają automatycznie do losowej sesji zwykłego quizu. |
| **69 PL w unified Review/Challenge** | plQuestionOverrides ma 69 pozycji na 82 ID. | 13 pozostałych wraca do EN; pokrycie nie oznacza niezależnej recenzji tłumaczeń. |
| **16 story cards** | storyCards.ts: 16 rekordów, nagłówek live sugeruje 10. | Deklaracje source to nazwy tekstowe, bez dokumentu/metody/dat przeglądu. |

Dowody kodu: [source/CoachFi/data/quizQuestions.ts:12](../../../data/quizQuestions.ts#L12), [source/CoachFi/data/challengeQuestions.ts:10](../../../data/challengeQuestions.ts#L10), [source/CoachFi/lib/allQuestions.ts:39](../../../lib/allQuestions.ts#L39), [source/CoachFi/lib/localizedQuiz.ts:4](../../../lib/localizedQuiz.ts#L4), [source/CoachFi/lib/learningProgress.ts:10](../../../lib/learningProgress.ts#L10). Mechaniczna ekstrakcja wszystkich ID, kluczy i pól znajduje się w `evidence/content-sources.json` (`repository_audit`). Odczytano literalne dane, prompty, wszystkie opcje i feedback wszystkich 82 pozycji; wykonano screening problemów. To nie niezależne zatwierdzenie każdego itemu w produkcie ani systematyczny przegląd badań dla każdej deklaracji.

## Faktyczne lekcje w kodzie

| ID lekcji | Kroki PL/EN | Tematy kroków PL | Finał | Lokalizacja w kodzie |
|---|---:|---|---|---|
| money-mindset | 3 | Wartość netto; Inflacja stylu życia; Najpierw zapłać sobie | /quiz?topic=mindset | [source/CoachFi/data/moneyMindsetLesson.ts:16](../../../data/moneyMindsetLesson.ts#L16) |
| saving-habit | 4 | Oszczędzaj w dniu wypłaty; Zasada 50/30/20; Konto z wyższym oprocentowaniem; Uśrednianie ceny | /quiz?topic=saving | [source/CoachFi/data/stageLessons.ts:88](../../../data/stageLessons.ts#L88) |
| inflation | 4 | Co znaczy inflacja; Realna stopa zwrotu; Reguła 72; Ochrona na lata | /quiz?topic=inflation | [source/CoachFi/data/stageLessons.ts:262](../../../data/stageLessons.ts#L262) |
| credit-rates | 4 | Oprocentowanie zmienne; Lawina zadłużenia; Ocena kredytowa; Ceny obligacji i stopy | /quiz?topic=credit | [source/CoachFi/data/stageLessons.ts:436](../../../data/stageLessons.ts#L436) |
| emergency-fund | 3 | Ile trzymać; Co w nim trzymać; Od czego zacząć | /quiz?topic=emergency | [source/CoachFi/data/stageLessons.ts:610](../../../data/stageLessons.ts#L610) |
| long-term-investing | 5 | Procent składany; Dywersyfikacja; Fundusze indeksowe; Czym jest ETF; Czas na rynku | /quiz?topic=investing | [source/CoachFi/data/stageLessons.ts:748](../../../data/stageLessons.ts#L748) |
| retirement | 2 | Po co jest to konto; Wczesny start | /quiz?topic=retirement | [source/CoachFi/data/stageLessons.ts:958](../../../data/stageLessons.ts#L958) |
| family-plan | 3 | Ubezpieczenie na życie; Pieniądze we dwoje; Jak uczyć dzieci | /quiz?topic=family | [source/CoachFi/data/stageLessons.ts:1060](../../../data/stageLessons.ts#L1060) |

Są to krótkie sekwencje title/body z Next i linkiem do quizu, nie pełne moduły wyjaśnienie→przykład→ćwiczenie→quiz→działanie→powtórka z jawnie opisanym celem. Model StageLesson/Step nie ma objective, source, level, jurisdiction, review_date, version ani reviewer. Elementy życia codziennego są w opisie, ale nie ma osobnego ćwiczenia i rejestru wykonania małego działania w tych danych.

**Weryfikacja live:** UX-006/027 potwierdza pierwsze trzy kroki i link do quizu w PL/EN. Pozostałe etapy istnieją w źródłach i są locked w obserwowanej nawigacji; nie testowano całego odblokowania. Początkowy SSR `/learn` pokazywał 0/0; po hydratacji 28. Statyczny licznik demo 7/24 oraz home 0/82 nie oznaczają 24 lub 82 lekcji. [Publiczne Learn](https://coachfiai.com/learn).

## Bank pytań: wymagane metadane i kompletna lista

Każda z 82 pozycji ma 4 opcje A–D i klucz istniejącej opcji; **0 nieprawidłowych odwołań klucza**. Wszystkie są typem wyboru, także rachunki liczbowe. Brak typów numeric/otwartej rubryki, trzech jawnych poziomów trudności i celów edukacyjnych. Pola obecne: id, question, answers, correctAnswer, reward oraz successMessage/retryMessage albo explanation; quiz ma category. Brak **source URL/ID, review_date, calculation assumptions, jurisdiction, objective, version, status, author, reviewer oraz wyjaśnienia każdej błędnej opcji**. Komentarz sekcji „OECD source” nie spełnia tych wymagań.

„Klucz” w tabeli oznacza to, co zapisano w źródle, **nie zatwierdzenie poprawności**. „PL unified” to Review/Challenge przez allQuestions; „PL quiz” to getQuizQuestions/QuizCard. Status wszystkich istniejących pozycji w tej recenzji: *wymaga źródłowej akceptacji przed wydaniem*. FIN numery odsyłają do ustaleń poniżej.

| ID quiz | Klucz | Etap | PL unified | PL quiz | Screening/ryzyko | Kod |
|---|---|---|---|---|---|---|
| inflation-basics | B | inflation | tak | PL | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:15](../../../data/quizQuestions.ts#L15) |
| emergency-fund | C | emergency-fund | tak | PL | FIN-02: stały cel bez kontekstu | [source/CoachFi/data/quizQuestions.ts:30](../../../data/quizQuestions.ts#L30) |
| saving-habit | C | saving-habit | tak | PL | FIN-01: brak warunków dla transferu | [source/CoachFi/data/quizQuestions.ts:45](../../../data/quizQuestions.ts#L45) |
| interest-rates | C | credit-rates | tak | PL | Doprecyzować umowę/benchmark/przesunięcie | [source/CoachFi/data/quizQuestions.ts:60](../../../data/quizQuestions.ts#L60) |
| net-worth | B | money-mindset | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:77](../../../data/quizQuestions.ts#L77) |
| lifestyle-inflation | C | money-mindset | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:92](../../../data/quizQuestions.ts#L92) |
| pay-yourself-first | B | money-mindset | tak | fallback EN | FIN-01: potrzeby podstawowe | [source/CoachFi/data/quizQuestions.ts:107](../../../data/quizQuestions.ts#L107) |
| budget-50-30-20 | B | saving-habit | tak | fallback EN | Reguła pomocnicza, nie proven dla wszystkich | [source/CoachFi/data/quizQuestions.ts:124](../../../data/quizQuestions.ts#L124) |
| high-yield-savings | B | saving-habit | tak | fallback EN | Brak źródła twierdzenia 4–5x | [source/CoachFi/data/quizQuestions.ts:139](../../../data/quizQuestions.ts#L139) |
| dca | C | saving-habit | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:154](../../../data/quizQuestions.ts#L154) |
| real-return | D | inflation | tak | fallback EN | FIN-03: przybliżenie jako dokładny wzór | [source/CoachFi/data/quizQuestions.ts:171](../../../data/quizQuestions.ts#L171) |
| rule-of-72 | B | inflation | tak | fallback EN | Dodatnia stopa %, przybliżenie; nie gwarancja | [source/CoachFi/data/quizQuestions.ts:186](../../../data/quizQuestions.ts#L186) |
| inflation-hedge | C | inflation | tak | fallback EN | Brak modelu ryzyka i źródła historycznego | [source/CoachFi/data/quizQuestions.ts:201](../../../data/quizQuestions.ts#L201) |
| debt-avalanche | C | credit-rates | tak | fallback EN | Doprecyzować minima/koszty/stałe warunki | [source/CoachFi/data/quizQuestions.ts:218](../../../data/quizQuestions.ts#L218) |
| credit-score-factors | B | credit-rates | tak | fallback EN | FIN-04: model/kraj | [source/CoachFi/data/quizQuestions.ts:233](../../../data/quizQuestions.ts#L233) |
| bond-prices | B | credit-rates | tak | fallback EN | Doprecyzować stały kupon, rynek i inne warunki | [source/CoachFi/data/quizQuestions.ts:248](../../../data/quizQuestions.ts#L248) |
| emergency-fund-characteristics | C | emergency-fund | tak | fallback EN | FIN-02: rozmiar rezerwy | [source/CoachFi/data/quizQuestions.ts:265](../../../data/quizQuestions.ts#L265) |
| emergency-fund-start | B | emergency-fund | tak | fallback EN | FIN-02: etap celu bez warunków | [source/CoachFi/data/quizQuestions.ts:280](../../../data/quizQuestions.ts#L280) |
| compound-interest | C | long-term-investing | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:297](../../../data/quizQuestions.ts#L297) |
| diversification | B | long-term-investing | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:312](../../../data/quizQuestions.ts#L312) |
| index-fund | B | long-term-investing | tak | fallback EN | FIN-05: ETF ≠ zawsze indeks | [source/CoachFi/data/quizQuestions.ts:327](../../../data/quizQuestions.ts#L327) |
| etf-definition | C | long-term-investing | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:342](../../../data/quizQuestions.ts#L342) |
| time-in-market | B | long-term-investing | tak | fallback EN | Brak badania/liczb/okresu w feedback | [source/CoachFi/data/quizQuestions.ts:357](../../../data/quizQuestions.ts#L357) |
| retirement-purpose | B | retirement | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:374](../../../data/quizQuestions.ts#L374) |
| retirement-early-start | C | retirement | tak | fallback EN | FIN-06: kapitalizacja i błędne 800 | [source/CoachFi/data/quizQuestions.ts:389](../../../data/quizQuestions.ts#L389) |
| poland-compound-gap | C | poza mapą 28 | brak → EN | fallback EN | FIN-07: statystyka/wnioski | [source/CoachFi/data/quizQuestions.ts:406](../../../data/quizQuestions.ts#L406) |
| poland-trust-institutions | D | poza mapą 28 | brak → EN | fallback EN | FIN-07: źródło i definicja | [source/CoachFi/data/quizQuestions.ts:421](../../../data/quizQuestions.ts#L421) |
| poland-oecd-score | B | poza mapą 28 | brak → EN | fallback EN | FIN-07: nieuprawnione wnioskowanie | [source/CoachFi/data/quizQuestions.ts:436](../../../data/quizQuestions.ts#L436) |
| poland-ppk-participation | C | poza mapą 28 | brak → EN | fallback EN | FIN-07: kraj/rok/populacja | [source/CoachFi/data/quizQuestions.ts:451](../../../data/quizQuestions.ts#L451) |
| financial-wellbeing-components | B | poza mapą 28 | brak → EN | fallback EN | FIN-08: nie wskazano modelu | [source/CoachFi/data/quizQuestions.ts:466](../../../data/quizQuestions.ts#L466) |
| financial-resilience | C | poza mapą 28 | brak → EN | fallback EN | Definicja zgodna kierunkowo; sytuacja nie tylko wiedza | [source/CoachFi/data/quizQuestions.ts:481](../../../data/quizQuestions.ts#L481) |
| debt-spiral-cause | B | poza mapą 28 | brak → EN | fallback EN | FIN-07: redukcja przyczyn do wiedzy | [source/CoachFi/data/quizQuestions.ts:496](../../../data/quizQuestions.ts#L496) |
| insurance-purpose | B | family-plan | tak | fallback EN | Przegląd indywidualnych potrzeb/ochrony | [source/CoachFi/data/quizQuestions.ts:513](../../../data/quizQuestions.ts#L513) |
| joint-finances | B | family-plan | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:528](../../../data/quizQuestions.ts#L528) |
| teaching-kids-money | C | family-plan | tak | fallback EN | Nieudokumentowane most effective; etap rodzinny później | [source/CoachFi/data/quizQuestions.ts:543](../../../data/quizQuestions.ts#L543) |
| nbp-inflation-target | B | poza mapą 28 | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:560](../../../data/quizQuestions.ts#L560) |
| inflation-target-why | B | poza mapą 28 | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:575](../../../data/quizQuestions.ts#L575) |
| monetary-policy-tool | B | poza mapą 28 | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:590](../../../data/quizQuestions.ts#L590) |
| rates-and-borrowing | B | poza mapą 28 | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:605](../../../data/quizQuestions.ts#L605) |
| gdp-definition | B | poza mapą 28 | tak | fallback EN | Doprecyzować finalne dobra/usługi i okres | [source/CoachFi/data/quizQuestions.ts:620](../../../data/quizQuestions.ts#L620) |
| deflation-risk | B | poza mapą 28 | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:635](../../../data/quizQuestions.ts#L635) |
| zero-based-budget | B | poza mapą 28 | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:652](../../../data/quizQuestions.ts#L652) |
| track-before-budget | B | poza mapą 28 | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:667](../../../data/quizQuestions.ts#L667) |
| sinking-fund | B | poza mapą 28 | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:682](../../../data/quizQuestions.ts#L682) |
| impulse-pause | B | poza mapą 28 | tak | fallback EN | Hipoteza działania, nie pokonuje większości z dowodu | [source/CoachFi/data/quizQuestions.ts:697](../../../data/quizQuestions.ts#L697) |
| emergency-first-milestone | B | poza mapą 28 | tak | fallback EN | FIN-02; wariant emergency-fund-start | [source/CoachFi/data/quizQuestions.ts:714](../../../data/quizQuestions.ts#L714) |
| bfg-guarantee | B | poza mapą 28 | tak | fallback EN | FIN-09: dodać źródło i zakres | [source/CoachFi/data/quizQuestions.ts:729](../../../data/quizQuestions.ts#L729) |
| asset-allocation | B | poza mapą 28 | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:746](../../../data/quizQuestions.ts#L746) |
| rebalancing | B | poza mapą 28 | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:761](../../../data/quizQuestions.ts#L761) |
| fees-ter | B | poza mapą 28 | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:776](../../../data/quizQuestions.ts#L776) |
| risk-return | A | poza mapą 28 | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:791](../../../data/quizQuestions.ts#L791) |
| invest-prerequisites | B | poza mapą 28 | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:806](../../../data/quizQuestions.ts#L806) |
| speculative-allocation | B | poza mapą 28 | tak | fallback EN | Poza obecnym etapem Web3/speculation | [source/CoachFi/data/quizQuestions.ts:821](../../../data/quizQuestions.ts#L821) |
| ike-vs-ikze | B | poza mapą 28 | tak | fallback EN | FIN-09: niepełne warunki wypłaty | [source/CoachFi/data/quizQuestions.ts:838](../../../data/quizQuestions.ts#L838) |
| ppk-employer-match | B | poza mapą 28 | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:853](../../../data/quizQuestions.ts#L853) |
| ppk-state-bonus | B | poza mapą 28 | tak | fallback EN | FIN-09: brak warunków dopłat | [source/CoachFi/data/quizQuestions.ts:868](../../../data/quizQuestions.ts#L868) |
| deposit-guarantee-scope | B | poza mapą 28 | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:885](../../../data/quizQuestions.ts#L885) |
| fdic-coverage | B | poza mapą 28 | tak | fallback EN | Kraj USA jawny; źródło/date pending | [source/CoachFi/data/quizQuestions.ts:900](../../../data/quizQuestions.ts#L900) |
| eu-dgs | B | poza mapą 28 | tak | fallback EN | FIN-09: dodać źródło i zakres | [source/CoachFi/data/quizQuestions.ts:915](../../../data/quizQuestions.ts#L915) |
| us-401k-match | B | poza mapą 28 | tak | fallback EN | Kraj USA jawny w prompt; brak warunków | [source/CoachFi/data/quizQuestions.ts:930](../../../data/quizQuestions.ts#L930) |
| tax-advantaged-wrapper | B | poza mapą 28 | tak | fallback EN | Źródłowa recenzja zasad/feedback pending | [source/CoachFi/data/quizQuestions.ts:945](../../../data/quizQuestions.ts#L945) |
| rbi-inflation-target | A | poza mapą 28 | tak | fallback EN | Kraj/aktualność docelowego pasma do review | [source/CoachFi/data/quizQuestions.ts:960](../../../data/quizQuestions.ts#L960) |

| ID challenge | Klucz | PL unified | Screening/ryzyko | Kod |
|---|---|---|---|---|
| c1 | B | tak | Reguła pomocnicza, nie proven dla wszystkich; powtórka budget-50-30-20 | [source/CoachFi/data/challengeQuestions.ts:12](../../../data/challengeQuestions.ts#L12) |
| c2 | C | tak | Źródłowa recenzja zasad/feedback pending; powtórka compound-interest | [source/CoachFi/data/challengeQuestions.ts:25](../../../data/challengeQuestions.ts#L25) |
| c3 | B | tak | Źródłowa recenzja zasad/feedback pending; powtórka diversification | [source/CoachFi/data/challengeQuestions.ts:38](../../../data/challengeQuestions.ts#L38) |
| c4 | C | tak | Doprecyzować minima/koszty/stałe warunki; powtórka debt-avalanche | [source/CoachFi/data/challengeQuestions.ts:51](../../../data/challengeQuestions.ts#L51) |
| c5 | D | tak | FIN-03: przybliżenie jako dokładny wzór; powtórka real-return | [source/CoachFi/data/challengeQuestions.ts:64](../../../data/challengeQuestions.ts#L64) |
| c6 | B | tak | FIN-05: ETF ≠ zawsze indeks; powtórka index-fund | [source/CoachFi/data/challengeQuestions.ts:77](../../../data/challengeQuestions.ts#L77) |
| c7 | C | tak | Źródłowa recenzja zasad/feedback pending; powtórka dca | [source/CoachFi/data/challengeQuestions.ts:90](../../../data/challengeQuestions.ts#L90) |
| c8 | B | tak | Dodatnia stopa %, przybliżenie; nie gwarancja; powtórka rule-of-72 | [source/CoachFi/data/challengeQuestions.ts:103](../../../data/challengeQuestions.ts#L103) |
| c9 | C | tak | Źródłowa recenzja zasad/feedback pending; powtórka etf-definition | [source/CoachFi/data/challengeQuestions.ts:116](../../../data/challengeQuestions.ts#L116) |
| c10 | C | tak | FIN-02: rozmiar rezerwy; powtórka emergency-fund-characteristics | [source/CoachFi/data/challengeQuestions.ts:129](../../../data/challengeQuestions.ts#L129) |
| c11 | B | tak | Doprecyzować stały kupon, rynek i inne warunki; powtórka bond-prices | [source/CoachFi/data/challengeQuestions.ts:142](../../../data/challengeQuestions.ts#L142) |
| c12 | C | tak | Źródłowa recenzja zasad/feedback pending; powtórka lifestyle-inflation | [source/CoachFi/data/challengeQuestions.ts:155](../../../data/challengeQuestions.ts#L155) |
| c13 | B | tak | Źródłowa recenzja zasad/feedback pending; powtórka retirement-purpose | [source/CoachFi/data/challengeQuestions.ts:168](../../../data/challengeQuestions.ts#L168) |
| c14 | B | tak | Źródłowa recenzja zasad/feedback pending; powtórka net-worth | [source/CoachFi/data/challengeQuestions.ts:181](../../../data/challengeQuestions.ts#L181) |
| c15 | C | brak → EN | FIN-07: statystyka/wnioski; powtórka poland-compound-gap | [source/CoachFi/data/challengeQuestions.ts:196](../../../data/challengeQuestions.ts#L196) |
| c16 | D | brak → EN | FIN-07: źródło i definicja; powtórka poland-trust-institutions | [source/CoachFi/data/challengeQuestions.ts:209](../../../data/challengeQuestions.ts#L209) |
| c17 | B | brak → EN | FIN-07: punkty nie są kwotą utraconego majątku | [source/CoachFi/data/challengeQuestions.ts:222](../../../data/challengeQuestions.ts#L222) |
| c18 | C | brak → EN | FIN-07: statystyka i przyczynowość bez źródła | [source/CoachFi/data/challengeQuestions.ts:235](../../../data/challengeQuestions.ts#L235) |
| c19 | B | brak → EN | Terminologia PL, nie pomiar zastosowania | [source/CoachFi/data/challengeQuestions.ts:248](../../../data/challengeQuestions.ts#L248) |
| c20 | C | brak → EN | FIN-07: wskazać narzędzie/populację/rok | [source/CoachFi/data/challengeQuestions.ts:261](../../../data/challengeQuestions.ts#L261) |

## Duplikaty, zgadywanie i lokalizacja

Po normalizacji wielkości liter i interpunkcji znaleziono **11 par identycznych promptów**: lifestyle-inflation ↔ c12; budget-50-30-20 ↔ c1; dca ↔ c7; real-return ↔ c5; rule-of-72 ↔ c8; bond-prices ↔ c11; emergency-fund-characteristics ↔ c10; compound-interest ↔ c2; diversification ↔ c3; index-fund ↔ c6; etf-definition ↔ c9. Nie jest to dowód identycznego całego rekordu, ale sprawdzają ten sam stem/klucz. Dodatkowe bliskie powtórki: debt-avalanche/c4, retirement-purpose/c13, net-worth/c14, poland-compound-gap/c15, poland-trust-institutions/c16 oraz emergency-fund-start/emergency-first-milestone. Te pary nie powinny automatycznie zwiększać liczby odrębnych pytań/kompetencji. **82 ID ≠ 82 niepowtarzalne pytania**; liczbę kanonicznych pozycji ustalić po semantycznej deduplikacji.

Klucze: A=2, B=52, C=24, D=4. Wybór zawsze B daje **52/82 ≈ 63,4%** w całym surowym banku; jest to własność treści, nie wynik użytkowników. QuizCard miesza kolejność pytań, ale renderuje opcje w stałym porządku. Częste dystraktory są absurdalne lub skrajne; poprawna opcja jest długa i wyważona. Utrudnia to interpretację wyniku jako rozumienia. [source/CoachFi/components/QuizCard.tsx:56](../../../components/QuizCard.tsx#L56).

**Wyjaśnienie potwierdzonego błędu PL:** getQuizQuestions(pl) ma tylko cztery początkowe ID. questionsForTopic w QuizCard szuka najpierw tam, potem w surowym EN quizQuestions. Trzy ID mindset nie mają tłumaczenia w tej pierwszej liście; dlatego cały quiz tej lekcji przechodzi na EN. Tłumaczenie net-worth istnieje w allQuestions PL, ale QuizCard go nie używa. [source/CoachFi/components/QuizCard.tsx:35](../../../components/QuizCard.tsx#L35), [source/CoachFi/lib/allQuestions.ts:95](../../../lib/allQuestions.ts#L95), [source/CoachFi/lib/localizedQuiz.ts:67](../../../lib/localizedQuiz.ts#L67). Analogiczny fallback dotyczy **24/28** stage ID; tylko początkowe cztery mają tłumaczenia w QuizCard. To wniosek z kodu, nie live test wszystkich etapów.

13 ID bez PL w unified: poland-compound-gap, poland-trust-institutions, poland-oecd-score, poland-ppk-participation, financial-wellbeing-components, financial-resilience, debt-spiral-cause, c15, c16, c17, c18, c19, c20. Mechanizm fallback EN jest jawny w [source/CoachFi/lib/allQuestions.ts:817](../../../lib/allQuestions.ts#L817). Potrzebne jedno kanoniczne źródło ID/PL/EN, sprawdzanie kompletności oraz glossary; język nie ma zmieniać kraju ani kwot. Np. emergency-fund-start zamienia distractor 10000 USD na 10000 PLN w unified PL: nie jest to konwersja waluty ani wierne zachowanie liczby/jednostki. Pilot nowy używa PLN w obu językach.

## Materialne ustalenia merytoryczne

| ID ustalenia | Problem i konkretny dowód | Korekta i wzorzec |
|---|---|---|
| **FIN-01 / P1** | Pierwsza lekcja nakazuje odłożyć przed czynszem i żywnością; quiz pay-yourself-first pomija warunek dostępnych środków. [source/CoachFi/data/moneyMindsetLesson.ts:33](../../../data/moneyMindsetLesson.ts#L33), PL [source/CoachFi/data/moneyMindsetLesson.ts:53](../../../data/moneyMindsetLesson.ts#L53). | Najpierw sprawdzić podstawowe potrzeby, minima zobowiązań i przepływy. Mały krok bez transferu też jest poprawny. [CFPB guide](https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/). |
| **FIN-02 / P1** | Rezerwa 3–6 miesięcy oraz pierwszy miesiąc przedstawiane jako uniwersalne bez warunków, w feedback zapewnienie pokrycia większości zdarzeń. | Cel zależy od potrzeb i ryzyka; przykładowy target jawny, brak obietnicy ochrony. CFPB guide powyżej wskazuje zależność od sytuacji. |
| **FIN-03 / P1** | real-return/c5 i lekcja używają nominalna−inflacja jako dokładnego wzoru. Przy 2%/5% dokładnie (1,02/1,05−1)×100 = **−2,857142…%**, nie dokładnie −3%. | Podać „w przybliżeniu” albo iloraz z jawną kapitalizacją/podatkami; nowy pilot używa ilorazu. [source/CoachFi/data/quizQuestions.ts:181](../../../data/quizQuestions.ts#L181). |
| **FIN-04 / P1** | credit-score-factors i lekcja przenoszą największy udział/historię oraz ~35% na dowolny score bez modelu/kraju. | 35% pochodzi z [FICO](https://www.myfico.com/credit-education/whats-in-your-credit-score); [BIK](https://www.bik.pl/dla-ciebie/ocena-punktowa-bik) jest innym modelem. Nie zamieniać nazw. |
| **FIN-05 / P1** | index-fund/c6 oraz feedback traktują index fund i ETF jako pasywne indeksy z bardzo niskimi kosztami. | ETF opisuje formę obrotu; istnieją aktywne ETF. Nazwać „indeksowy ETF” i nie gwarantować opłat/wyników. [Oficjalny SEC bulletin](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-24). |
| **FIN-06 / P1** | retirement-early-start: 525 tys. przy 200/mies. jest zgodne z miesięczną stopą 0,07/12, lecz nie określono kapitalizacji/terminu. Feedback: 800/mies. od wieku45 zapewnia tę samą kwotę przy65 — **błędne**. | Przy wpłatach koniec miesiąca FV40=**524962,68 USD**; FV20 z800=**416741,33 USD**; potrzeba **1007,75 USD/mies.** Przy efektywnych 7%/rok i równoważnej stopie miesięcznej FV40=**494308,40 USD**. Wzór FV=p((1+r)^n−1)/r. To scenariusze nominalne bez kosztów/podatków, nie prognozy. [source/CoachFi/data/quizQuestions.ts:399](../../../data/quizQuestions.ts#L399). |
| **FIN-07 / P1** | Statystyki PL bez dokumentu/roku/metody; twierdzenia, że niska wiedza bezpośrednio wyjaśnia udział PPK/PPE, spiralę długu i kwotę straconego majątku z 8 punktów. | [Raport OECD/KNF 2022](https://www.knf.gov.pl/knf/pl/komponenty/img/Financial-Literacy-Poland-Polish_80300.pdf), s.44: **36,5%** poprawnego rozumienia procentu prostego/składanego w badaniu2020; s.21: **47% dotyczy PPK dużych firm w2021**, nie bieżącego wspólnego PPK/PPE. 26,9% ma odniesienie do badania, ale nie daje indywidualnej diagnozy. Brak dowodu przyczynowego tych skrótów; trust15%/6% wymaga definicji instytucja/pracownik i pierwotnej metody. |
| **FIN-08 / P1** | financial-wellbeing-components uznaje jeden zestaw trzech elementów za ogólny pomiar bez wskazania modelu. | [CFPB](https://www.consumerfinance.gov/consumer-tools/educator-tools/financial-well-being-resources/explore-findings/) definiuje cztery elementy, obejmując swobodę wyboru. Nazwać własny model jako własny, nie utożsamiać z validated score. |
| **FIN-09 / P1** | ppk-state-bonus nie wskazuje warunków uzyskania250/240; IKE/IKZE skrót prawny bez warunków i dated source; BFG bez zakresu/źródła. | [Oficjalne FAQ PPK](https://www.mojeppk.pl/faq) warunkuje dopłaty; [BFG](https://bfg.pl/gwarantowanie-depozytow/zasady-gwarantowania-depozytow/wysokosc-gwarancji-bfg/) opisuje podstawowy limit i wyjątki. Dla IKE/IKZE potrzebny pełny aktualny PL przegląd warunków; w tym audycie nie zatwierdzono porady podatkowej. |

Pozostałe materialne obszary do recenzji: „best hedge”, statystyki time-in-market, skuteczność DCA/50-30-20 i „most effective” bez badań, debt avalanche bez warunków spłaty minimów i kosztów, obligacje bez sprecyzowania stałego kuponu/innych warunków, GDP bez „finalne” i okresu. Lekcje/quizy dziecięce i speculative-allocation wymagają zgodności z zakresem dorosłych i późniejszym Web3.

## Powtórki i ocena: istnieje kod, skuteczność niepotwierdzona

SRS w [source/CoachFi/lib/srs.ts:23](../../../lib/srs.ts#L23) ma odpowiedź correct→quality5, incorrect→quality1; pierwsze odstępy1/6dni, następnie round(interval×ease), dolny ease1,3, limit odstępu90dni, błąd resetuje repetitions do0 i odstęp1dni. Lokalny storage `coachfi-srs`; wywołania synchronizacji nie dowodzą ich powodzenia. Nowe karty maks.5 w **jednym getDueIds**, nie zapisany globalny limit5/dzień: kolejne sesje tego dnia mogą pobierać kolejne nowe karty. Data today jest UTC przez toISOString, next.setDate lokalne; przejście dnia/strefy/DST wymaga testu dla Polski.

Istnieje `lib/srs.test.ts`; w tej roli sprawdzono kod testów, nie uruchamiano całego projektu. Deklaracja SM-2 jest uproszczeniem, nie dowodem walidacji retencji Coachfi.

QuizCard zapisuje correct na podstawie ID i pozwala próbować ponownie; onComplete liczy nagrodzone odpowiedzi w sesji po próbach, nie wynik pierwszej próby. Progress etapu liczy repetitions>0, uznaje ≥80% za100% lub manual completed; kolejny etap odblokowuje poprzedni rozpoczęty/odpowiedziany, bez dowodu pełnego opanowania. [source/CoachFi/lib/learningProgress.ts:78](../../../lib/learningProgress.ts#L78), [source/CoachFi/components/QuizCard.tsx:135](../../../components/QuizCard.tsx#L135). Potrzebne osobne metryki pierwszej próby, odpowiedzi po feedbacku i transferu po czasie; nie opisywać tego score jako dowodu wiedzy lub odporności.

## Karty i materiały marketingowe

storyCards.ts ma16 kart, tekstowe source, brak URL/metody/review_date i twierdzenia o gwarantowanym20%+ zwrocie z redukcji długu, braku strat S&P500 w każdym20-letnim okresie, ogromnych efektach10min nauki i niewzruszalności certyfikatu blockchain. Nie zatwierdzamy ich. [source/CoachFi/data/storyCards.ts:16](../../../data/storyCards.ts#L16). Doprecyzować zakres, walutę, historyczny okres, warunki; statystyki USA nie są statystykami Polski.

Lokalne `marketing/when-the-house-goes-quiet/CoachFI-Campaign-Scripts-and-Production-Brief.txt`, skrypty EN/SRT, `marketing/coach-fi-promo-en/voiceover-en.txt`, historyczne original-brand.json i grafiki są **marketingiem**, nie lekcjami lub bankiem pytań. Narracje rezerwy nie dowodzą efektu produktu. Voiceover promuje Kids Mode, co wymaga dostosowania do obecnego zakresu przed nową publikacją.

## Braki dostępu i następny priorytet

Dostępne: pełny statyczny bank źródłowy tego commitu, lekcje, lokalizacje i SRS. Nadal niedostępne/niesprawdzone: kanoniczny eksport z historią niezależnych review, konta dorosłych w odizolowanym staging do pełnej ścieżki, rzeczywiste wyniki uczenia i postępu po ponownym logowaniu/urządzeniu. Kod i powiązanie z wdrożeniem są dostępne; potrzebne środowisko testowe i dowody pełnej ścieżki/kont.

Najpierw naprawić wspólne źródło PL/EN i FIN-01/03/05/06; przepisać nieudokumentowane statystyki i country items do recenzji; deduplikować ID i wprowadzić metadane. Równolegle nowy `quiz-pilot-24.json` pozostaje odrębnym **24-item draftem**, 48 tłumaczeń; wersja0.1.1 po uwadze niezależnego recenzenta; limited review rachunków i PL/EN accept, źródła/UI/użytkownicy pending. Nie integrujemy go z kodem bez bramki źródeł, badania i testów scoringu. Plan kompetencji/24→160 w `quiz-pilot-review.md`.


