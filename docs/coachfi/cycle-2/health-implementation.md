# B04/B12: uczciwa diagnoza lokalna i jawny wzór

2026-10-14. Autor: `curriculum_pilot`; niezależna integralność/liczby: `architecture_audit`, niezależna jakość UI/fixtures: `ux_audit`. Lokalny repo `source/CoachFi`, bez push/deploy. Pierwsza paczka P0, blokady dostawców, scope adults i brak nowych kont/dostawców zachowane. Autor nie zatwierdza swojej zmiany.

## Rezultat implementacji

`/health-check` nie traktuje adresu z `@` jako logowania. Nie zbiera email/marketingu, nie aktywuje fikcyjnego triala, nie montuje `FamilyActionPlan` z jego trial CTA ani `ShareScoreCard` z dawną skalą100. Pozostaje przydatny link do istniejących lekcji. Nie uruchomiono nowego auth/sync lub usługi. Nowy zapis nie wywołuje `notifyCloud`; koordynator oddzielnie kontroluje inne ścieżki dawnego sync.

Formularz ma te same istniejące informacje: pięć kwot, cztery deklaracje yes/no i opcjonalny tekst celu. Pierwszy stan jest pusty, bez podstawiania `mockUser`. Wszystkie wejścia są edytowalne, w tym `investsAlready`. Kwoty są PLN w obu językach dla rynku Polski. PL/EN zaznaczają wynik lokalny, ograniczenia wskaźnika i brak wymogu konta. Bieżące wymagane zasady są potrzebne przed zapisem; zgody opcjonalne mogą pozostać false. Stany invalid/storage failure nie pokazują potwierdzenia sukcesu. Zmiana pól ukrywa stary wynik aż do ponownego obliczenia.

## Kontrakt i wzór

Zaakceptowany przez koordynatora kontrakt zachowuje stare wagi bez normalizacji. `lib/financial-score.ts`: wersja `legacy-weights-98-v1`, maksimum98. Nie jest to naukowo zwalidowana diagnoza, ocena wartości człowieka ani rekomendacja inwestowania. Deklaracja rozumienia inflacji jest samooceną, nie wynikiem quizu; długość opisu celu nie określa jego jakości.

Wejście: `{monthlyIncome:I, monthlyExpenses:E, savings:S, debt:D, cashHeld:C, hasEmergencyFund, understandsInflation, hasRetirementPlan, investsAlready, mainFinancialGoal}`. Kwoty strict number, finite, `0 <= value <= 1e12` PLN. Cap przeciwdziała overflow typowych mnożeń i jest walidacją wejścia, nie nową wagą. Zero jest świadomą poprawną wartością, odróżnioną od braku. Deklaracje są strict bool; missing i stringfalse/stringtrue są odrzucane. Cel string, opcjonalnie pusty, do1000 znaków; scoring używa trim i progu długości>8 jak wcześniej. Nieznane pola lub niepoprawny rekord są odrzucane.

| Składnik | Dokładna reguła dotychczasowa | Max | Grupa |
|---|---|---:|---|
| savingsRate | `min((max(I-E,0)/I)/0.25,1)*18`; przy I0 udział=0 | 18 | cashFlowAndRisk |
| emergencyCoverage | `min(S/(E*3),1)*18`; przy E0 pokrycie=0 | 18 | cashFlowAndRisk |
| debtPressure | `max(0,1-D/(I*4))*16`; przy I0 presja=1 | 16 | cashFlowAndRisk |
| cashAwareness | `C>I*2 && !investsAlready ? 4 : 8` | 8 | cashFlowAndRisk |
| investingDeclaration | `investsAlready ? 10 : 2` | 10 | planningDeclarations |
| goalDeclaration | `trim(goal).length>8 ? 6 : 0` | 6 | planningDeclarations |
| emergencyDeclaration | `hasEmergencyFund ? 8 : 0` | 8 | planningDeclarations |
| inflationKnowledgeDeclaration | `understandsInflation ? 6 : 0` | 6 | knowledgeDeclaration |
| retirementDeclaration | `hasRetirementPlan ? 8 : 0` | 8 | planningDeclarations |

Grupy: przepływy/poduszka/ryzyko60, deklaracje planowania32, deklarowana wiedza6. Nie tworzą nowych niezależnie walidowanych skal: są podsumowaniami składników. `rawScore=sum(9 składników)`, `score=round(rawScore)` z ochronnym clamp0..98. Nie podnosimy 98 do100. Zero wszystkich kwot i wszystkie false daje **10**, bo stara reguła przyznaje cash8/investing2; UI opisuje legacy fallback zamiast interpretować to jako bezpieczeństwo. Obecny warunek nie ma możliwości wygenerowania wartości0 dla kompletnych valid inputs, ale defensywny zakres wyniku pozostaje0..98.

Publiczne `ratios` to monthlyFree oraz savingsRate, emergencyCoverage, debtPressure, cushionMonths. Dzielenie przez0 albo overflow bardzo małego dodatniego mianownika daje publicznie `null`, nie Infinity/NaN lub fałszywe0. Do punktacji zachowano stare caps/fallbacks, dlatego publiczne null przy overflow nie resetuje punktów. UI oznacza niewyznaczalną proporcję.

`validateFinancialScoreInput(unknown)` zwraca `{ok:true,input}` lub `{ok:false,errors}`; `calculateFinancialScore(unknown)` rzuca `FinancialScoreValidationError` dla runtime invalid. Wynik zawiera `formulaVersion,score,rawScore,scoreMax,components,groups,ratios`.

## Zapis i migracja

`lib/healthCheck.ts`: schemaVersion2 z wynikiem helpera, `answers`, canonical `createdAt`, source/currency. Nowy zapis ma wyłącznie `source:'local_diagnosis', currency:'PLN'`. Znormalizowany odczyt legacy ma wyłącznie `source:'legacy_recomputed',currency:'legacy_unspecified'`. Inne pary/missingcurrency v2 są odrzucane; starszych schema2 nie było w produkcji. `saveHealthCheck(answers)` wymaga current required terms, liczy z wejść, zapisuje tylko `coachfi-health-check` i dopiero po powodzeniu emituje `coachfi-health-check`. Storage error propaguje do alertu bez success. Nie wysyła nowej diagnozy do cloud pushera.

`normalizeHealthCheckResult(unknown)` jest czysty. Complete legacy bez wersji przelicza odpowiedzi i zachowuje pierwotną datę; nie ufa zapisanej liczbie ani nie wykonuje automatycznego zapisu. Incomplete/malformed/unknown version daje null i prośbę o nowe dane. V2 też przelicza wszystkie pochodne wartości; podmienione score100/max100/breakdown nie mają władzy nad wynikiem. `getHealthCheck()` nie czyta wyniku do UI bez current required terms. Normalizer pozostaje niezależny dla eksportu/recenzji. Pole celu już istniało; nie dodano nowej kategorii informacji użytkownika.

**Korekta waluty migracji:** dawny zapis nie zawierał waluty, a dawny formularz EN oznaczał USD. Nie wolno konwertować go milcząco na PLN. Legacy indeks/proporcje są niezależne od wspólnej jednostki kwot, więc można je przeliczyć; pieniędzy nie prefillujemy do pól PLN. Zachowano stare deklaracje/tekst celu, a pięć kwot trzeba wpisać ponownie. UI pokazuje banner braku waluty i nie oznacza monetaryFree jakoPLN. Home nie używa legacy kwot w metrykachPLN i oznacza przykładowe metryki badgeDemo niezależnie od rzeczywistego przeliczonego indeksu. `normalize(normalize(legacy))` zachowuje `legacy_unspecified`. Metadata waluty jest stałą wynikającą z istniejących etykiet formularza, nie nowym wyborem lub kategorią danych użytkownika; nie dokonano konwersji kursowej.

Jedyni konsumenci gettera w UI: health page, home i AppNavigation. W dwóch ostatnich poprawiono wyłącznie bloki związane ze score: rzeczywisty wynik/98, progressbar aria max98 i proporcjonalne pierścienie; osobne demo pozostaje/100 z oznaczeniem. Home pokazuje zapisane kwoty PLN, nie zmienia globalnej waluty demonstracyjnych symulatorów. Consent change/storage odświeżają cached state, więc revoked required nie zostawia widocznego real score. P0 filtrowanie nawigacji pozostaje nienaruszone. Typ HealthCheckResult jest także importowany przez dawny cloudSync; ten kod jest własnością koordynatora. Eksport allowlist jest własnością koordynatora, autor tej zmiany go nie edytował.

## Sprawdzenie liczb

| Fixture I/E/S/D/C; deklaracje; goal | Oczekiwany wynik |
|---|---:|
| 0/0/0/0/0; wszystkiefalse; pusty | 10 |
| 4000/2000/6000/0/0; wszystkietrue; >8 | 98 |
| 6000/5200/3000/8000/20000; wszystkiefalse; >8 | 36 |
| 1000/750/1125/1000/2000; wszystkiefalse; 8znaków | 49 |
| Jak poprzedni, C2000.01 | 45 |
| Jak bazowy49, goal9znaków | 55 |
| 0/1000/3000/0/0; false; pusty | 28 |
| 1000/0/1000/0/0; false; pusty | 44 |
| 1000/1000/0/625/0; false; pusty | 24 |
| Jak poprzedni, D626 | 23 |

Stare demo nie daje42: `48/5 + 45/13 + 32/3 + 4 + 2 + 6 = 6967/195 = 35.7282051282`, zaokrąglone36. Max: `18+18+16+8+10+6+8+6+8=98`. Rounding fixture D625: debt13.5+cash8+invest2=23.5→24; D626=23.496→23. UX recenzent obliczył własne EXPECTED i sprawdził fixture grup, zer, granic i runtime invalid; brak twierdzenia o empirycznej walidacji modelu.

## Weryfikacja i stan przyjęcia

Testy autora: `lib/financial-score.test.ts`, `lib/healthCheck.test.ts`; pierwszy run28/28 PASS przed dodaniem required-revoked regression. Targeted run 2026-10-14 13:45:23 według runnera: **127/127 PASS, 3 pliki =29 autora+98 niezależnych**, polecenie `node node_modules/vitest/vitest.mjs run lib/financial-score.test.ts lib/healthCheck.test.ts tests/cycle2-health-independent-review.test.ts`. Pierwszy tsc --noEmit PASS przed ostatnimi testami/subskrypcjami; końcowy wspólny typecheck/build prowadzi koordynator po dependency updates, bez równoległego dev. `git diff --check` przydzielonego zmienionego kodu PASS.

Po materialnej korekcie waluty 13:59:48: **30/30 autora PASS**; łączne128 miało jeden oczekiwany fail nieuaktualnionego niezależnego v2 fixture bezcurrency, pozostałe127PASS. Nie traktowano wcześniejszej recenzji jako automatycznego przyjęcia zmienionego kontraktu. Po aktualizacji własnych fixture UX recenzent uzyskał **106/106 PASS**, a architecture_audit **9/9 PASS o14:04:00** według swojego runnera, w tym96 scenariuszy porównanych niezależnym BigInt/rational oracle. Currency strict pairs, idempotence, v2/legacy export markers i UI blank legacy/homePLN guard zostały niezależnie sprawdzone.

Końcowa opinia integralności: **limited ACCEPT**, `docs/coachfi/cycle-2/health-data-review.md`, dowód `evidence/cycle-2/health-data-review.json`. To akceptacja odczytanego kodu/matematyki i syntetycznych testów, bez naukowej walidacji, realnych kont/cloud lub deklaracji release. Frontend source review UX nie zgłosił blockerów; browser proof pozostaje własnym osobnym etapem recenzenta/koordynatora.

React checklist: hooki bezwarunkowe; `PlanScoreCard` używa istniejącego kontekstu języka, nie nowych providerów. Helpery nie mają React/IO, callback zapisu nie ma provider calls, wszystkie nowe listeners health/consent/storage mają cleanup. Inputs mają etykiety, per-field aria-invalid/describedby i fokus pierwszego błędu; status/alert są tekstowe, neutralny score ma jawny mianownik i dostępny opis pierścienia. Stary snapshot ukrywa się po edycji, brak success przed setItem. Brak nowej biblioteki, iframe, wallet lub callbacku faux trial. Runtime PL/EN/mobile/focus należy do niezależnego przeglądu browser, nie tej checklisty.

E2E: odnowiony `health-funnel.spec.ts` — lokalny wynik bez email/trial/provider, editable investment+reload, home/shell /98; `health-integrity.spec.ts` — PL/EN missing/negative/zero i focus pierwszego błędu, blockedstorage, required-only, legacy migration bez auto-write/prefill currency, revoked cached state. Browser context izolowany, wyłącznie syntetyczne dane, wszystkie third-party requests blokowane.

**Końcowe kontrole koordynatora:** pełny cykl Playwright **20/20 PASS**, Vitest **313/313 PASS**, Node **11/11 PASS**, `npm run typecheck` exit0 i build exit0 (**34/34 statyczne strony**). Obejmuje first-stage P0 oraz nowe testy health; nie przypisuję wykonania całego cyklu autorowi tej strony. Dwie korekty typów dotyczyły wyłącznie testów niezależnych recenzentów i zostały przez nich ponownie sprawdzone 9/9 oraz106/106; nie zmieniły kodu aplikacji. Kod aplikacji po currency freeze pozostał niezmieniony. Brak push/deploy.

Niezależna recenzja liczb/integralności jest limited ACCEPT, frontend source nie miał blockerów i pełny syntetyczny browser cykl przeszedł; autor nie zatwierdza własnego kodu. Produkcja, prawdziwe konta/cloud, konto deletion, naukowa walidacja i przyszłe premium pozostają poza zmianą. Ryzyko dawnych wag opisano jawnie zamiast ukrywać przez nowe skalowanie. Rollback ma dotyczyć wyłącznie lokalnych plików kodu; nie przywracać fake login/trial jako docelowej ścieżki ani wcześniejszych profili do indeksu.
