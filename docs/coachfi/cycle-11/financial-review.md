# Cykl 11 — niezależna recenzja saving-habit PL/EN

Recenzent `/root/daily_data_review`, autor treści `/root/daily_author`, autor integracji root. 15.10.2026. **LIMITED ACCEPT finansowy dla czterech kroków i czterech pytań PL/EN**, po poprawce FIN-C11-01 i niezależnym retest. Nie zatwierdza wydania. Odczytano root/repo AGENTS.md, program/current-cycle/backlog, C6/C10 oraz skille financial-review, evidence-review, localization i quiz-quality. Zakres: dorośli w Polsce. Recenzent nie edytuje treści autora.

Odczyt źródła przed draftem: `saving-habit` keys C/B/B/C, rewards25/25/20/30, cztery istniejące canonical IDs i cztery lesson steps. PL overrides znajdują się w rzeczywistym `lib/allQuestions.ts`; `allQuestionsPL.ts` nie istnieje. Dawne teksty zalecają fixed transfer przed wydatkami, nazywają metodę strongest/proven, uogólniają high-yield oraz nie ujawniają ryzyka DCA. To source observations, nie uruchomiony baseline starej strony lub recenzja draftu.

## Pierwotne źródła sprawdzone 15.10.2026

Automatyczne oszczędzanie można dostosować do wpływów i salda; przy nieregularnych wpływach należy uwzględniać cash flow. Wyjaśnienie źródła nie dowodzi skuteczności Coachfi ani jednej „najlepszej” metody dla wszystkich. [CFPB: emergency fund](https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/), sekcje cash flow i automation.

50/30/20 jest wskazówką do adaptacji, a nie obowiązkiem. Źródło CFPB klasyfikuje debt payments w20%; projektowa konwencja zabezpieczenia wymaganych minimów wneeds i dodatkowych spłat w20 musi być jawna oraz bez podwójnego liczenia. Jest to **adaptacja recenzenta/projektu**, nie dosłowny podział wszystkich rat w źródle. [CFPB: My spending rule](https://files.consumerfinance.gov/f/documents/cfpb_worksheet_my-spending-rule-to-live-by.pdf), strony1–2.

BFG podaje podstawowy limit równowartości100000EUR dla sumy środków i należności jednej osoby w danym banku/kasie, wraz z odsetkami; istnieją szczególne wyjątki wyższej czasowej ochrony. To ochrona właściwych depozytów, nie gwarancja realnego zysku lub dowolnej inwestycji. [BFG: wysokość gwarancji](https://bfg.pl/gwarantowanie-depozytow/zasady-gwarantowania-depozytow/wysokosc-gwarancji-bfg/), aktualizacja2.10.2025.

UKNF odróżnia depozyt od produktu powiązanego z funduszem, zaleca sprawdzić konstrukcję, ryzyko i koszty. Wysoka stopa zwrotu nie usuwa ryzyka straty; codziennie potrzebne środki nie powinny być traktowane jak wolny kapitał inwestycyjny. [KNF: Inwestuj świadomie](https://www.knf.gov.pl/dla_konsumenta/kampanie_informacyjne/Inwestuj_swiadomie), aktualizacja18.08.2026.

Definicja DCA: równe kwoty w regularnych odstępach, niezależnie od ceny. Więcej jednostek przy niższej cenie nie dowodzi zysku; inwestycje mogą tracić także cały kapitał. [Investor.gov: DCA](https://www.investor.gov/introduction-investing/investing-basics/glossary/dollar-cost-averaging) oraz [investment products](https://www.investor.gov/introduction-investing/investing-basics/investment-products).

Odsetki depozytu mogą nie nadążyć za inflacją. To odrębne ryzyko siły nabywczej, nawet przy bezpieczeństwie nominalnego depozytu. [Investor.gov: risk and return](https://www.investor.gov/additional-resources/information/youth/teachers-classroom-resources/risk-and-return).

Warunki promocji oszczędnościowej mogą ograniczać okres i kwalifikujące się środki oraz wymagania. Publiczna strona banku potwierdza samą potrzebę czytania warunków, bez wyboru dostawcy, promowania stawki lub afiliacji. [ING: OKO Bonus](https://www.ing.pl/indywidualni/inwestycje-i-oszczednosci/otwarte-konto-oszczednosciowe-bonus). Nie używamy konkretnych bieżących stawek w module.

## Ograniczenia

Źródła USA wspierają definicje i wskazówki, nie prawo Polski. Oba języki dotyczą Polski/PLN; EN nie przełącza na USA/FDIC/USD. Brak indywidualnej porady, gwarancji wyniku lub naukowej walidacji produktu. Tests/browser/build, dawne SRS, staging i pozostałe moduły B06 są osobnymi bramkami. Brak paid calls, real data, push/deploy lub nowych danych.

## Rachunki, znaczenie i cztery decyzje

Własny oracle używa całkowitych groszy i dokładnych ułamków. Opublikowany przykład oszczędzania:250000−210000−30000=10000 groszy nadwyżki; dobrowolny przelew5000 pozostawia5000. Zero albo ujemna nadwyżka nie uzasadnia transferu; rachunki pozostają potrzebą, nie brakiem silnej woli. Dane są estymacją do kolejnego wpływu, nie zapewnieniem przyszłej wypłaty. W PL i EN automatyzacja jest zależna od salda i możliwa do wstrzymania. **saving-habit: ACCEPT LIMITED**, keyC/reward25.

Budżet400000 groszy:1/2=200000 na needs,3/10=120000 wants,1/5=80000 oszczędności/dodatkowe spłaty. Suma400000; minima zaliczone raz do needs w jawnie opisanej konwencji tego przykładu. Rzeczywiste potrzeby mogą przekraczać50% i wtedy trzeba dostosować plan, nie pomijać rachunków. Każda numeric odpowiedź w obu runtime locale została niezależnie zinterpretowana. **budget-50-30-20: ACCEPT LIMITED**, keyB/reward25.

Konto depozytowe porównuje się według pełnego zestawu warunków, opłat, dostępu i właściwej ochrony depozytów, nie reklamy lub obietnicy realnego zysku. Kursy, stawki i dostawcy nie są polecane. **high-yield-savings: ACCEPT LIMITED po FIN-C11-01**, keyB/reward20.

DCA:10000/1000=10 jednostek,10000/2000=5, razem15. Przy cenie800 groszy wartość12000, koszt20000, strata8000. Dokładna stopa dla tego przykładu to−2/5; fees/taxes pominięte i to założenie jest jawne. Liczby nie są prognozą ani obietnicą, że DCA zmniejszy każdą stratę. Oba języki rozróżniają inwestowanie i depozyt. **dca: ACCEPT LIMITED**, keyC/reward30.

## Wszystkie dwanaście dystraktorów

| ID/opcja | Niezależne uzasadnienie w PL; identyczny sens sprawdzono w EN |
|---|---|
| saving-habit A | Niezmienny przelew mimo niezabezpieczonych rachunków nie spełnia warunku dostępnej kwoty. |
| saving-habit B | Pożyczka zaciągnięta tylko dla harmonogramu oszczędzania tworzy zobowiązanie zamiast korzystać z nadwyżki. |
| saving-habit D | Przekazanie całego wpływu przed sprawdzeniem rachunków pomija środki potrzebne do kolejnego wpływu. |
| budget A |120000/400000=3/10, czyli30%, nie20%. |
| budget C |200000/400000=1/2, czyli50%, nie20%. |
| budget D |400000/400000=1, czyli100%, nie20%. |
| deposit A | Sama stawka reklamy jest niewystarczająca bez czasu, warunków, opłat i dostępu. |
| deposit C | Sprawdzenie deklaracji wyniku może być użyteczne, lecz nie stanowi pełnej checklisty ani podstawy założenia gwarancji realnego zysku. |
| deposit D | Sprawdzenie rodzaju produktu lub pakietu ma sens; jeden element nie zastępuje kompletnego porównania. |
| dca A | Drugie10 jednostek przy cenie2000 groszy kosztowałoby20000, przy wkładzie10000. |
| dca B | Kolejność odwrócona; przy pierwszej niższej cenie wkład kupuje10, nie5. |
| dca D | Harmonogram nie gwarantuje zysku; podana końcowa cena dowodzi możliwej straty8000 groszy. |

## Findings i przebiegi

**FIN-C11-01 CLOSED.** Pierwszy prompt „What should you check…” / „Co sprawdzić…” dopuszczał zasadne cząstkowe diligence z C/D. KNF zaleca zrozumienie konstrukcji, w tym pakietów depozyt+fundusz. Dwa nowe własne probes dały0PASS/2FAIL. Autor zmienił oba prompty na wybór **najpełniejszej** checklisty i poprawił rationale C/D, zachowując wszystkie opcje, IDs, keyB i reward20. Niezależny retest4/4 obejmuje dwa nowe probes i dwa zmienione metadata/rationale cases;18 unaffected są poza tym run. Trzy pliki autora mają niezależnie potwierdzone inverse hashes. Rationale nie uznaje sensownego sprawdzania rodzaju produktu za błędną czynność.

Pierwsze20 własnych tests miały19PASS/1FAIL przez case-sensitive regex „bez nadwyż” przy tekście zaczynającym się „Bez nadwyżki”. Recenzent poprawił wyłącznie flag`i`; treść aplikacji pozostała bez zmiany. Retest tylko tego przypadku1/1. Przed/po/inverse pełnych bytes są w `financial-review-oracle-fix.json`, wraz z później dodanym osobnym blokiem dwóch cases FIN-C11-01. Koordynator niezależnie zatwierdził dokładną korektę i dwa nowe cases w `financial-oracle-fix-review.json`. Nie powtarzano19 green bez zmiany. **22 różne przypadki przyjęte w kilku jawnych przebiegach**, nie single22/22. Wyniki i dziewięć fingerprints: `evidence/cycle-11/financial-review.json`.

Root adaptował wcześniejszy `tests/cycle6-topic-author.test.ts`: tylko tytuł i dwa saving identity assertions przechodzą na kanoniczne PL pytanie. Niezależnie odwrócono dokładnie trzy delty do całego wcześniejszego source i hasha2c2a3029…; afterbb2715b8…. IDs/order, mindset, retirement, legacy oraz unknown-query oracles pozostają bez zmiany. Przyjęcie tej adaptacji nie jest przyjęciem aplikacji na podstawie testów jej autora.

Późniejsze trzy failures aggregate dotyczyły historycznych C6 preservation oracles, nie nowych findings aplikacji. Autor adaptował dwa fixtures w dokładnie pięciu deltach; niezależny `legacy-preservation-oracle-review.json` odwrócił je do pełnych dawnych source2/2. Z retained hash-verified C10 odczytano tylko dwa wskazane pliki kodu; ich SHA zgadzają się z inventory sprzed C11. Wszystkie osiem archiwalnych saving blocks sprawdzono bezpośrednio. Przywrócenie ich wyłącznie w pamięci i dotychczasowy trójrekordowy C6 mask odzyskują **te same literalne expected hashes**, bez generowania nowego expected z bieżącego source.

Stary baseline JSON jest niezmieniony. Plain pools nadal sprawdzają dziewięć list IDs i pełne siedem legacy locales; w PL/EN wyłączono tylko zmieniony rekord saving-habit. Bank porównuje55 dawnych rekordów po wyłączeniu dokładnie czterech saving IDs z obu stron, a siedem innych money-mindset lesson locales nadal jest porównywane w całości. Pozostałe asercje C6, w tym klucze, nagrody, voice, owner, completion i metadata, pozostały bez zmiany. Targeted retest autora3/3 przy25unselected poddano niezależnej recenzji; nie powtarzano zielonych tests. Oba końcowe fixture fingerprints dołączono do financeJSON, łącznie11. To przyjęcie ograniczonej adaptacji oracles, nie aktualizacja aplikacji lub starych danych.

## Oddzielna statyczna recenzja narzędzi

Root jest autorem narzędzi, daily_data_review niezależnym recenzentem. **LIMITED ACCEPT STATIC DELTA**, `evidence/cycle-11/snapshot-tool-review.json`: prepare zmienia prefix/ścieżkę cyklu i dodaje tylko C11 config oraz wymagany importowany JSON metadata. Allowlist, hash copy, forbidden paths i dependency junction pozostają jak C10. Build po normalizacji prefiksu/ścieżki jest identyczny z C10, a boundary utility jest identyczna bajtowo; wcześniejszych29 przypadków boundary nie powtarzano. Nie wykonywano tych skryptów w tej recenzji.

Verifier uwzględnia nowe finance/UI/E2E/tool anchors oraz niezmienione C9/C10; stare C6 anchors ogranicza do lesson/metadata, bo bank i resolver są celowo zmieniane i mają nowe niezależne anchors. Current/copied parity, wyjątek generowanego next-env oraz preflight compiler wymagają odrębnego rzeczywistego wykonania przez koordynatora. Playwright obejmuje nowy saving flow i bezpośrednio dotknięte C6 mindset; odziedziczony config jest localhost, workers1/retries0. To statyczna opinia, nie runtime PASS lub zatwierdzenie produkcji.
