# Cykl 15 — lekcja i quiz o inflacji w PL/EN

15.10.2026. B06, cztery istniejące kroki i cztery pytania dla dorosłych w Polsce. Stan: **PRZYJĘTY LOKALNIE — LIMITED ACCEPT**; produkcja **NO-GO**. Gałąź codex/p0-security-consent-export, baza 86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b. Wcześniejsze zmiany zachowane; bez commit, push lub deploy.

## Co poprawiono

Polski quiz tematu otrzymuje pełne polskie pytania, odpowiedzi i feedback dla wszystkich czterech IDs. Wcześniej trzy pytania wracały po angielsku. W obu językach treść wyjaśnia ważony koszyk cen i różnice między gospodarstwami; nie zakłada wzrostu każdej ceny.

Hipotetyczny roczny wynik 2% nominalnie przy inflacji 5% daje dokładny stosunek 1.02/1.05−1, około −2.86%, oraz 971.43 PLN realnej wartości z początkowych 1000 PLN. Odejmowanie stóp daje tylko przybliżenie −3%. Reguła 72 szacuje nominalne podwojenie przy dodatniej stałej stopie i kapitalizacji, z jawnym pominięciem przepływów, opłat i podatków; nie daje gwarancji lub prognozy siły nabywczej.

Pytanie o najlepsze zabezpieczenie przed inflacją zastąpiono krytyczną oceną ryzyka straty, kosztów i dostępu do pieniędzy. Każdy krok ma przykład, ćwiczenie, opcjonalne małe działanie i spokojny powrót po przerwie. Uwzględniono nieregularny dochód oraz podstawowe potrzeby bez presji zakupu inwestycji. Kwoty pozostają w PLN; EN nie wybiera rynku USA.

## Zachowanie danych i zakres

IDs inflation-basics, real-return, rule-of-72, inflation-hedge; klucze B/D/B/C oraz nagrody 25/30/30/25 zachowane. Łącznie 110 lokalnych punktów nauki, saldo syntetycznego gościa 125→235; wynik quizu 4/4 odpowiada 100/100. Nie dodano pytań, pól profilu ani zbierania finansów osobistych. Nie resetowano punktów/SRS/historycznych odpowiedzi; stara odpowiedź nie potwierdza zrozumienia nowego brzmienia.

Dokładne inverse źródeł zachowują nietargety i siedem innych bloków językowych. Zmieniony angielski fallback czterech IDs może być użyty w innych językach przez istniejący mechanizm; te warianty nie mają akceptacji treści. Kalkulator C14 oraz dziewięć jego kotwic pozostają niezmienione. Nie przyjęto całego B06 lub całego banku.

## Dowody i niezależność

daily_author: treści, metadata i wąski adapter historycznych fixtures. Root: canonical resolver, własne cztery przypadki, narzędzia i ledger. daily_data_review: niezależne liczby, finanse, PL/EN, każdy prawidłowy wybór i wszystkie 12 dystraktorów, adapter. daily_ui_review: rzeczywisty UI/resolver, E2E, narzędzia i końcowy ledger QA. Root niezależnie recenzuje korekty cudzych fixtures. Autor nie zatwierdza własnej zmiany; limit root+3 zachowany.

Baseline rzeczywistych importów: finanse 8/8 obserwacji starego brzmienia i braków kwalifikacji; UI dwie próby strukturalne PASS i trzy polskie pytania FAIL. Pełne źródła przed zmianą i ich hashe zachowane. Te obserwacje nie dowodziły dosłownej obietnicy gwarancji w starym tekście.

Historyczne C6/C11 preservation testy używają adaptera tylko czterech zatwierdzonych rekordów i dwóch tablic kroków oraz ich wyprowadzeń. Wszystkie 193 wyrażenia expect i stare golden baselines pozostały literalnie niezmienione. Niezależny recenzent odtworzył dane z pełnych starych literalów i przyjął adapter. 193 oznacza wyrażenia assertions, nie nowe przypadki.

## Bramki i zachowane korekty

Aggregate 2011/2011 PASS w 84 plikach; nowy subset: 35 author, 4 resolver, 23 niezależne finance i 21 niezależne UI. Nie zwiększa to liczby o ponowne celowane próby. Autor zachował wcześniejsze 34 PASS/1 FAIL z powodu wielkości litery w oracle Example; dokładna zmiana do /example/i i jeden celowany PASS przyjęte przez roota. Root aggregate zawiera finalne 35/35.

Początkowy standalone TypeScript: pięć TS2532 wyłącznie w finance fixture, brak błędów produktu. Raw failure i freeze aggregate zachowane. Korekta autora ma siedem dokładnych delt i pełny inverse; wszystkie 93 wyrażenia expect i osiem literalnych nazw pozostały identyczne. Root przyjął jawne guards istnienia kopii/kroku/metadata; celowany retest tych samych 23/23 PASS. Końcowy standalone TS exit0, 18 before/after hash bez rozbieżności. Produkt i tsconfig bez zmian. Pełnego zielonego 2011 nie powtarzano.

Końcowy TS PASS. Chrome 8/8 PASS w jednym przebiegu, bez retries/skips/flaky; cztery ścieżki w PL i cztery w EN: komplet lekcji/quizu, błędna odpowiedź/retry/zmiana języka, mobile/klawiatura oraz zachowanie błędnego cache. Build exit0, 34/34 generated pages i 35 route-table entries. Oddzielne kopie Chrome/build: 354 preflight/353 postflight, zero mismatch. Parity: 95 porównań niezależnych kotwic/64 ścieżki, zero mismatch. Host TCP 43191 ma zero listeners po teardown. Higiena PASS: 1295 tracked/938 text/1 skip, zero findings. Scoped diff exit0. Niezależny ledger QA i promocja metadanych przyjęte, zero findings. Końcowe mechaniczne domknięcie staging/receipt zapisano w evidence/cycle-15/final-stage.json. Źródła, testy i config pozostają zamrożone; bez ponawiania zielonych testów. Metadane autora nie stanowią samodzielnego zatwierdzenia; rzeczywiste wyniki z recenzji są osobno.

## Ograniczenia i dalsza praca

Wyłącznie lokalne syntetyczne dane i localhost. Browser abortuje API i zewnętrzne żądania; osiem ścieżek sprawdza zero prób API. Okna bez zapisu dotyczą trzech kluczy postępu, nie wszystkich zapisów inicjalizacyjnych. Provider/auth env puste; publicfont HTTP kompilatora nie wykluczono. Zachowane warnings opcjonalnego Coinbase nie zatwierdzają tych funkcji. Nie ma PASS stagingu, realnego auth/RLS, audio, pełnego WCAG lub skuteczności edukacyjnej. Bez produkcyjnych odczytów sesji/profili/sekretów, zapisów lub migracji. Zewnętrzne AI, livevoice/mikrofon, cloudwrites/health, Kids/Web3/afiliacja pozostają wyłączone. Budżet i inne wcześniejsze decyzje pozostają osobne.

Źródła i status ich dostępności: [niezależna recenzja finansowa](financial-review.md), [dokładny rejestr](../../../evidence/cycle-15/financial-review-primary-sources.json), [metadata](content-metadata.json). Użyto zasad ogólnych oraz własnych rachunków, bez obecnego CPI lub stawek. GUS: pełna strona niedostępna; metadata wyszukiwania nie jest pełnym odczytem. Źródła USA wspierają ogólne rachunki/ryzyko, nie transplantację prawa lub produktów do Polski.

Następny kandydat B06: istniejący moduł credit-rates / quiz credit. Tylko wskazanie z kodu, bez przyjęcia treści; wymagane osobne mapowanie Polski, baseline i recenzja.

[Verification](../../../evidence/cycle-15/verification.json), [unit provenance](../../../evidence/cycle-15/unit-acceptance-summary.json), [Chrome provenance](../../../evidence/cycle-15/browser-acceptance-summary.json), [parity](../../../evidence/cycle-15/final-parity.json). Root pointer: workspace evidence/coachfi-cycle-15.json.

Końcowa promocja metadanych po niezależnym QA. Przedpromocyjne hashe/statusy w QA są historycznym provenance; finalny addendum i staging receipt w istniejących rekordach, bez otwartych warunków mechanicznych. Bez nowych zmian źródeł po bramkach.
