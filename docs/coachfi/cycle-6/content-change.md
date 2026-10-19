# B06 — pierwsza lekcja money-mindset, PL/EN dla Polski

2026-10-14. Autor: curriculum_pilot (curriculum, quiz-quality, localization). Wersja `money-mindset-pl-en-2026-10-14-v2`. Źródła zamrożone: niezależna recenzja architecture_audit daje LIMITED financial ACCEPT i własne 10/10 PASS 18:27:32. Recenzja UI/językowa ux_audit i końcowa bramka pozostają odrębne. Metadata review status uzupełnia root na podstawie raportów recenzentów; autor nie zatwierdza własnej treści. Poprawka jest lokalna; nie jest opublikowana.

## Problem i wynik

Istniejący krok „Najpierw zapłać sobie” zalecał oszczędzanie przed czynszem i jedzeniem. Net worth przedstawiano jako rzeczywistą miarę zdrowia finansowego, a lifestyle inflation jako sytuację, w której każda podwyżka znika. Poprawiono znaczenie w trzech istniejących krokach en/pl i odpowiadających im rekordach pytań. Nie powstał nowy bank ani dodatkowe pytania; pilot24 pozostał poza UI.

| Istniejący ID / krok | Cel po poprawce | Klucz / punkty |
|---|---|---|
| net-worth / 1 | Aktywa minus zobowiązania na ten sam dzień; stan różni się od dochodów/wydatków za okres. Nie jest oceną człowieka ani pełną oceną płynności. | B / 25 |
| lifestyle-inflation / 2 | Dobrowolny wzrost wydatków na standard życia wraz z dochodem; wzrost cen i konieczne potrzeby są osobnymi przyczynami większych wydatków. Bez obowiązku oszczędzania całej podwyżki. | C / 25 |
| pay-yourself-first / 3 | Planowanie oszczędności przed wydatkami uznaniowymi, po zabezpieczeniu potrzeb oraz wymaganych minimalnych spłat. Tylko dostępna nadwyżka; nieregularny dochód i brak nadwyżki dopuszczają brak transferu, bez zawstydzania. | B / 20 |

Zachowano ID oraz kolejność opcji A–D, klucze B/C/B, nagrody 25/25/20, trzy kroki i istniejący link `/quiz?topic=mindset`. Root wcześniej zaakceptował zmianę tekstu poprawnej opcji C w lifestyle i B w pay-yourself-first; scoringu nie zmieniono. Zaktualizowano feedback EN oraz canonical explanation PL, żeby po błędzie nie powracała niebezpieczna instrukcja. Uzasadnienia każdej błędnej opcji są w metadata do recenzji; nie dodano nowego typu interakcji w quizie.

## Zakres plików i źródeł

Edytowano wyłącznie `data/moneyMindsetLesson.ts` (en/pl), `data/quizQuestions.ts` (te trzy rekordy) i `lib/allQuestions.ts` (te trzy PL overrides). Po wyłączeniu dozwolonych bloków reszta każdego pliku ma identyczny SHA256 względem indeksu Git. Nie zmieniono innych lekcji, pytań, języków, auth, storage, nagród ani SRS. Locale EN nadal oznacza rynek Polska i PLN. Resolver tematu i QuizCard należą do roota; ten raport nie zastępuje ich recenzji.

Metadane: `docs/coachfi/cycle-6/content-metadata.json` — ID, cel PL/EN, poziom beginner, country PL, źródła, data, wersja, autor, pending reviewer, wyjaśnienia dystraktorów i założenia. Trzy ID / sześć wersji językowych nie jest sześcioma pytaniami. Rejestr źródeł: `evidence/cycle-6/content-sources.json`.

Sprawdzono [EU/OECD adult framework 2022](https://www.oecd.org/content/dam/oecd/en/publications/reports/2022/01/financial-competence-framework-for-adults-in-the-european-union_614b8b97/510f133c-en.pdf), szczególnie kompetencje 118/123, 139/143, 148/151 i 155. Mapowanie celów w metadata jest projektem autora, nie wynikiem walidacji Coachfi. Wykorzystano [CFPB emergency guide](https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/) dla cash flow i ograniczeń automatycznych transferów, [savings rule](https://www.consumerfinance.gov/documents/5152/cfpb_worksheet_my-savings-rule-to-live-by.pdf) dla dopasowania do okoliczności oraz [priorytetów przy niedoborze gotówki](https://www.consumerfinance.gov/documents/5176/cfpb_ymyg_budget-worksheet.pdf). [MoneyHelper](https://www.moneyhelper.org.uk/en/savings/how-to-save/getting-into-the-savings-habit) wspiera oszczędzanie dostępnych środków po potrzebach i głównych rachunkach.

Definicję aktywa minus zobowiązania potwierdzono w [Investor.gov](https://www.investor.gov/introduction-investing/investing-basics/save-and-invest/figure-out-your-finances); szerszy zakres wellbeing w [CFPB](https://www.consumerfinance.gov/consumer-tools/educator-tools/financial-well-being-resources/explore-findings/). [Fidelity 2026-02-20](https://www.fidelity.com/learning-center/personal-finance/lifestyle-creep) jest first-party potwierdzeniem terminologii, nie badaniem skuteczności lub rekomendacją dostawcy. [Materiał NBP](https://nbp.pl/wp-content/uploads/2022/09/stabilnosc.pdf) wykorzystano tylko dla rozróżnienia ogólnego wzrostu cen: zweryfikowano oficjalny indeksowany fragment, lecz bezpośredni PDF zwrócił 403. Pełnej lektury tego dokumentu autor nie deklaruje. Źródła USA/UK dostarczają wyłącznie zasad ogólnych; nie przeniesiono praw, produktów, podatków, stawek, kwot USD ani porad indywidualnych do Polski.

## Liczby, kontrola i ograniczenia

Jedyny opublikowany nowy rachunek: **5 000 PLN − 2 000 PLN = 3 000 PLN**. Założenia: hipotetyczny kompletny bilans na tę samą datę, kwoty całkowite PLN, bez zaokrąglenia. Przeniesienie pieniędzy między własnymi rachunkami nie jest wzrostem wartości netto. Przykład nie wycenia nieruchomości ani nie oblicza płynności.

Trzy dodatkowe fixtures recenzji nie są pytaniami w produkcie: dostępne 900 − potrzeby 800 − minimalne spłaty 100 = 0 (przelew 0); 1 200 − 900 − 100 = 200 (dobrowolnie wybrane 50); 900 − 950 − 0 daje niedobór 50, więc dostępna nadwyżka max(0, −50) = 0 i brak transferu. To sprawdzenie granic zasady, nie kalkulator lub nowe wymaganie zbierania danych.

Targeted author run 18:25:05: **17/17 PASS**, `evidence/cycle-6/content-author-tests.json`. Testy obejmują zachowanie ID/keys/rewards, canonical PL/EN, stan versus przepływy, potrzeby/minimums/zero/irregular, limit tekstu głosowego, metadata oraz nienaruszenie pozostałych bloków. Canonical pytanie + cztery oznaczone opcje jest krótsze niż 480 znaków w obu językach (20 znaków marginesu wobec limitu voice 500); actual UI serialization należy do niezależnej recenzji UX. Test nie dowodzi sprawności urządzenia/głosu.

Pierwszy author run miał 16/17 PASS: fixture błędnie oczekiwała, że domyślne Intl pl-PL grupuje czterocyfrowe kwoty, podczas gdy renderer zwrócił `5000`. Poprawiono fixture do jawnie sprawdzanej prezentacji `5 000 zł`, bez zmiany liczb lub osłabienia oracles; wynik historyczny zachowano w `content-author-before-format-fixture-fix.json`. W tym samym retest uwzględniono uwagę recenzenta FIN-C6-04: dodano krótkie zdanie PL/EN o stanie na dzień versus przepływach za okres. Scoped diff check i oba JSON parse PASS.

Test ma jawne zależności runtime przez readFileSync: `docs/coachfi/cycle-6/content-metadata.json` i `evidence/cycle-6/content-sources.json`. Zgłoszono je rootowi do manifestu kopii, jeśli Vitest będzie wykonywany poza workspace; nie są runtime importami aplikacji.

Autor nie wykonał full gates, serwera, browsera, testu użytkowników, provider calls, push lub deploy. To ograniczona naprawa pierwszego modułu; inne pytania i języki nie otrzymują przez nią finansowej akceptacji. Nadal potrzebny jest test zrozumienia: czy początkujący w PL/EN odróżnia wzrost cen od wyborów stylu życia, bilans od gotówki i potrafi wybrać brak przelewu przy braku nadwyżki. Pytania pozostają definicyjne; ich przejście nie dowodzi regularnego działania lub skuteczności produktu. Długość lekcji, dostępność i ścieżka 3/3 wymagają odrębnego sprawdzenia UX. Niezależna recenzja finansowa A zamknęła FIN01/networth/lifestyle oraz FIN-C6-04, sprawdzając trzy klucze i dziewięć dystraktorów PL/EN; raport `docs/coachfi/cycle-6/financial-review.md`. Finalna bramka koordynatora pozostaje osobna.
