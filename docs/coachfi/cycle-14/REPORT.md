# Cykl 14 — poprawny i przejrzysty kalkulator inflacji

15.10.2026. **PRZYJĘTY LOKALNIE — LIMITED ACCEPT.** B23, dorośli w Polsce, PL/EN. Produkcja **NO-GO**. Gałąź codex/p0-security-consent-export, baza86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b. Wcześniejsze zmiany zachowane; bez commit, push lub deploy.

## Co poprawiono

Kalkulator odrzuca pusty tekst, błędne liczby, niepełne lata i wynik poza bezpiecznym zakresem. Zachowuje surowe wpisy, pokazuje alert PL/EN i usuwa nieaktualny wynik, wykres oraz odczyt wyniku. Poprawna edycja przywraca obliczenie. Zero jest poprawną liczbą; dokładnie zerowa zmiana nie ma znaku minus. Deflacja i strata nominalna zachowują właściwy znak.

Porównanie używa jednakowych dopłat na koniec roku, a wcześniejsze dopłaty są kapitalizowane. Wszystkie trzy serie i tabela mają ceny początku przykładu. Dwie nowe edytowalne wartości — roczna dopłata i hipotetyczna nominalna zmiana — istnieją tylko w RAM. PL i EN używają PLN. Jawne są stałe stopy, brak indeksacji dopłat, pominięte podatki/opłaty, zaokrąglenie kwot i możliwa strata. To model ilustracyjny, bez prognozy lub gwarancji.

Parser przyjmuje do64 znaków: kropka albo przecinek są zawsze separatorem dziesiętnym, bez grupowania tysięcy i wykładników. Kwota/dopłata0..1e12, całkowite lata0..100, inflacja−99..100%, nominalna zmiana−100..100%; wyniki i nominalne wartości pośrednie są skończone i abs≤1e12. Te granice chronią model, nie stanowią zalecenia finansowego. Readonly scenariusz ma najwyżej101 wierszy.

## Dowody i niezależność

Autor helpera daily_author; autor strony, wykresu i copy root. [Niezależna matematyka/finanse/PLEN](financial-review.md) oraz [niezależny UI](ui-review.md). Root niezależnie sprawdził korekty cudzych fixtures; narzędzia dostały recenzję daily_data_review. Autor nie zatwierdza własnej zmiany.

Przed naprawą autor i niezależny data reviewer odtworzyli po9 małych prób rzeczywistego starego helpera. Rzeczywisty stary UI dał0 PASS/11 FAIL. Dziewięć pierwotnych orakli zachowano; dwa oczekujące niewykorzystywanej kwoty3000 są jawnie RETIRED_SUPERSEDED_NOT_PASS i zastąpione dwoma niezależnie przyjętymi próbami wspólnego C/r. Nie przeprowadzano dużej alokacji/OOM. Nieograniczone Array.from było obserwacją źródła.

Niezależny oracle używa ułamków BigInt w groszach i sumy geometrycznej. Przykład P1000/C100/r10%/inflacja10%/2lata ma nominalne saldo1000→1200→1420; końcowe realne wartości100000/121,120000/121,142000/121 PLN. Nie oblicza oczekiwań przez helper autora.

## Sprawdzone bramki lokalne

| Bramka | Rzeczywisty wynik |
|---|---|
| Unit aggregate |1928/1928 PASS,80 plików. Następnie po wyłącznie syntaktycznej zmianie fixture finansowej celowany78/78 PASS tych samych przypadków.1928 distinct, bez dodatkowych78 i bez pełnego finalnego rerun.|
| Subset C14 |92author,78independent finance i25independent UI są w1928. Historyczny własny UI21 PASS/4 FAIL i4-targeted PASS; root aggregate zawiera finalny UI25/25.|
| TypeScript |Finalny standalone exit0/0diagnostics na finalnych9 źródłach/fixtures/config, before/after0mismatch. Początkowe43 TS2737 zachowane.|
| Chrome PL/EN |8 różnych przyjętych ścieżek:6 PASS z drugiego przebiegu oraz2 mobile-targeted PASS. Nie ma single8/8green; sześciu zielonych nie powtarzano.0retries/skipped/flaky.|
| Build |34/34generatedpages,35route-table entries, exit0. Oddzielna świeża kopia TEMP:344preflight/343postflight,0mismatch.|
| Parity |82porównania niezależnych kotwic/58unikalnych ścieżek;343copied/current inputs,0mismatch. Finalna kopia Chrome również343/0.|
| Serwer |Host Windows port43191:0listeners po ostatnim Chrome teardown.|
| Higiena, scoped diff i ledgerQA |Guard1208tracked/856text/1skip,0findings; scoped diff exit0. Niezależny ledgerQA0findings; jego końcowe mechaniczne warunki spełnione. Finalny addendum metadanych w tym samym QA rekordzie.|

## Zachowane błędy i retesty

UI finding ujemnego zera zamknięto jedną poprawką loss===0 ?0 :−loss oraz czterema tymi samymi failing oraklami; brak epsilon/clamp. Pierwsza fixture finansowa zebrała0 testów przez format nazwy%j/BigInt; zmieniono tylko%j→%o. Późniejszy TypeScript wykrył43 bigint literals niezgodne z istniejącym target. Zmieniono wyłącznie te AST tokens na BigInt z dokładnymi ciągami, także ponad MAX_SAFE_INTEGER; pełny inverse, niezmieniona konfiguracja i niezależne przyjęcie zachowane. Tylko tę fixture78 retestowano po aggregate.

Pierwszy Chrome0/8 zatrzymał się na selektorze dopasowującym główny SVG i trzy ikony Legend. Jawny jednoznaczny main SVG/count1 zachował visible/3curves/nonempty d. Drugi przebieg6 PASS/2 FAIL: dwa mobile cases po reload omyłkowo wymagały braku także istniejących zapisów inicjalizacyjnych. Korekta tylko tych dwóch przypadków nadal wymaga wszystkich identycznych bytes, dokładnie jednego idempotentnego zapisu accessibility i jednego przejściowego lswt key=value, usuniętego ze snapshot. Przed reload i po kolejnej realnej edycji wymagane zero writes. Pozostałe sześć bodies i wspólne orakle są literalnie niezmienione. Pełne before/delta/inverse, źródłowe pochodzenie inicjalizacji i raw failures zachowane; to błędy fixture, nie awarie aplikacji.

C14-TOOLS-01: różnicę pola SHA256/sha256 w13znanych UI kotwicach zauważono przed pierwszym parity. Jawny map został niezależnie przyjęty, wszystkie guards pozostały. Nie przypisano tej obserwacji runtimeFAIL. Nie ponawiano29 niezmienionych boundary tests.

## Środowisko i ograniczenia

Ścieżka form→strict math→wartości/wykres/tabela lub alert była sprawdzona w realnym Chrome. Syntetyczny gość, stały UTC, provider/auth env puste. Wszystkie API i zewnętrzne żądania browsera abortowane; osiem zaakceptowanych ścieżek sprawdza zero prób API. Kalkulator nie utrwala założeń; lokalne demo profile/consent i mocked VoiceContext nie są testem realnych kont, RLS, audio lub stagingu. Kopie browser/build są osobne; generowany next-env pominięto tylko w postflight. Publicfont HTTP compilera nie był wykluczony. Zachowane optionalCoinbase warnings nie dają PASS tych funkcji.

Definicje i jawność ryzyka: [ECB: inflacja](https://www.ecb.europa.eu/ecb-and-you/explainers/tell-me-more/html/what_is_inflation.en.html), [ECB: realne/nominalne stopy](https://www.ecb.europa.eu/ecb-and-you/explainers/tell-me/html/nominal_and_real_interest_rates.en.html), [SEC: kalkulator](https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator), [SEC: ryzyko](https://www.investor.gov/introduction-investing/investing-basics/investment-products). Zweryfikowano15.10.2026; nie przenoszono amerykańskich produktów lub prawa na Polskę. GUS: dostępne search metadata, pełna strona niedostępna przez narzędzie. Nie użyto obecnej inflacji lub stóp. Roczny timing dopłat i limity są własnym kontraktem modelu.

[Verification](../../../evidence/cycle-14/verification.json), [unit provenance](../../../evidence/cycle-14/unit-acceptance-summary.json), [browser provenance](../../../evidence/cycle-14/browser-acceptance-summary.json), [finalparity](../../../evidence/cycle-14/final-parity.json). Root pointer: workspace evidence/coachfi-cycle-14.json. Źródła i wszystkie korekty zachowane lokalnie.

## Następny zakres pętli

B06 inflation: zinwentaryzowano cztery kroki i IDs inflation-basics/real-return/rule-of-72/inflation-hedge. Lekcja, quiz, punkty, SRS i wspólne tłumaczenia nie zostały zmienione w C14. Przybliżenie realnej stopy, reguła72, ryzyko hedgingu i PL topic fallback wymagają osobnego C15 baseline/review; brak PASS. B02/B09/B10residual/B16 i budżet pozostają oddzielnymi decyzjami. AI/cloudwrites, livevoice/mikrofon, health, Kids/Web3/afiliacja pozostają wyłączone. Brak produkcyjnych zapisów/migracji, odczytów realnych profili/sesji/sekretów, usług płatnych i kontaktów.
