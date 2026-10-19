# Niezależna recenzja UI C14 — kalkulator inflacji

15.10.2026. Recenzent: daily_ui_review. Autor strony, wykresu i copy: root; autor helpera: daily_author. Przyjęto ograniczony zakres lokalnego UI. Browser8, aggregate, TypeScript/build i końcowa higiena są zadaniami roota i pozostają pending w chwili tej recenzji. Bez wdrożenia.

## Dowody i orakle

Rzeczywisty stary InflationPage i NumberField wraz z rzeczywistym helperem dały **0 PASS /11 FAIL**. Pełne stare źródła i fixture zachowane; przed/po0 zmian. C14-UI-01 pusty draft był zmieniany na0; UI-02 negative/NaN nie blokowały output; UI-03 dla5.5lat scalar i chartY5 różniły się o474.32847183091144; UI-04 EN używałoUSD; UI-05 ukrywało5.5% i różne2400/3000. Nie wykonywano dużych alokacji ani starego browsera.

Dziewięć nadal właściwych orakli zachowano literalnie. Dwa wymagające starej dopłaty3000 są **RETIRED_SUPERSEDED_NOT_PASS**. Właściwy model daje obu seriom ze wpłatami to samo jawneC, więc nie dodawano nieużywanej kwoty dla testu. Zastąpiono je dwoma PL/EN cases: aktualne C/r/PLN oraz tabela/wykres w cenach roku początkowego. PrzyA1000/y2/i10/C100/r10 nominal1000→1200→1420, deflator1.21; niezależne endpoints100000/121,120000/121,142000/121. daily_data_review odwrócił exactappend i9adapterdeltas do oryginalnego485aadab… oraz przyjął oba replacement oracles i14 nowych cases przed pierwszym acceptance; patrz financial-review-ui-fixture-adaptation.json.

## Wynik i poprawka

Pierwszy acceptance: **21 PASS /4 FAIL z25**. Nowe C14-UI-06 odtworzyło prawdziwe ujemnezero: negacja helper0 pokazywała −0,00zł /−PLN0.00 dla braku zmiany. Autor zmienił wyłącznie stronę: loss===0 ?0 :−loss. Niezależny byte-exact inverse wrócił do344bb0b9…; pozostałe12 fingerprintów nie zmieniło się. Tylko4 zachowane porażki ponownie uruchomiono: **4 PASS /0 FAIL /21 niewybranych**. Nie zmieniano fixture i nie powtarzano21 green.

Łącznie przyjęto **25 różnych cases z dwóch przebiegów**, bez pojedynczego25/25green. Pierwotnych dwóch3000 nie liczono jakoPASS. Wszystkie6 findings zamknięte w tym ograniczonym zakresie. Szczegóły i nazwy cases w evidence/cycle-14/ui-review-final.json; raw pierwszego21/4 zachowany w ui-review-final-tests.json, retest w ui-review-zero-retest.json.

## Zakres i granice

ActualPage/NumberField: pięć surowych pól, blank/malformed/ranges/całkowite lata, brak wyniku/wykresu/tabeli/Header.readText/VoiceButtons przy błędzie, poprawna edycja przywraca wynik. Decimal dot/comma ma tę samą semantykę w obu językach;1,000 oznacza1 zgodnie z jawnym kontraktem, grouping/exponent odrzucane. Sprawdzono0kwoty/0lat/−100%return, nominalną stratę i dodatnią zmianę przy deflacji, wspólneC, realbaseyear endpoint/table i kontrolowane overflow wartości pośrednich. ActualChart zachowuje roleimg, opisPL/EN, Rok/Year i kopię immutable rows do Recharts. Actual pola mają label/hints/aria-invalid. Stop lokalnego odczytu przy edycji/języku/unmount sprawdzony mockiem, wraz z aktualnym calculated text.

Nie był to ReactDOM ani browser/audio/WCAG audit. Brak realnych kont, profili, sekretów, providerów, cloud/AI/API lub produkcji. Nie deklarujemy prognozy ani dokładnego rozliczenia księgowego; modele są edukacyjnymi założeniami. Inne języki nie mająPASS.

## Zamrożone kotwice

- app/inflation/page.tsx: efda31a46a6c99c927e31c5440531372545d7b36e066483d79463e201fdc23d2
- lib/inflation.ts: 4d84006fb2646cbad3016fcaabef56ac2cb478badcc41a466030a711f8eee736
- components/InflationChart.tsx: 828d742363c5ffda279d20d63ee54ef37891113d444a1e69b274d14c97c3c7e8
- lib/inflation-copy.ts: 8840bd8b0f38c032b39d071befea97163f9cb328cd136520ce2782f655eb2248
- UI fixture: e0e2a47aa6325b1e71affb226ff61116660956ef82cab08c4b4502b9f4ff8d12
- E2E8: 01e8ced3693c45106a699a460d5af7464ee850f62edb6117d3cdce77663c3e52 — staticreview/browser pendingroot.

E2E8: fresh synthetic localhost/fixedUTC, external i API abort z attempted-call oracle; PL/EN×mobilekeyboard/equalC/reloadRAMdefaults, invalid5fields/restore/comma, nominalloss/deflation, boundedoverflow/locale. Snapshot wszystkich lokalnych synthetic bytes oraz brak zapisu poza zmianą języka. Nie uruchamiałem serwera ani browsera.

Przed pierwszym browser run dodano wyłącznie wspólną oracle realnego renderera w istniejących8 cases: widoczny SVG.recharts-surface oraz3 ścieżki.recharts-line-curve z niepustym d dla początkowych5lat. Fullbefore/inverse do bba3e42e… zachowane w ui-review-e2e-renderer-addition.json. Jest to późniejsza zmiana fixtureE2E; aplikacja i UI fixture bez zmian, historycznych UI25 nie powtarzano. Niezależny staticreview roota i browser nadal pending.

Pierwszy root browser: **0 PASS /8 FAIL**, wszystkie zatrzymane przez niejednoznaczny locator svg.recharts-surface (głównySVG oraz3ikony Legend). To błąd fixture C14-UI-FIXTURE-01, bez dowodu błędu aplikacji/renderera; późniejsze assertions nie zostały wykonane. Poprawiono wyłącznie selector na .recharts-wrapper > svg.recharts-surface oraz dodano jawne count1. Visible/3curves/nonempty d i pozostałe orakle zachowane. Fullbefore/exactdelta/inverse w ui-review-e2e-selector-fix.json; root staticreview i retest8 pending. UI25/source bez zmian, własnych browser/unit reruns nie wykonywano.

Drugi root browser: **6 PASS /2 FAIL**, raw playwright-selector-retest-tests.json zachowane. Oba mobilecases przeszły realny renderer, keyboard, wyniki, reflow i ścisłe zero writes przed reload. Po reload wszystkie bytes nadal identyczne, ale zero-write oracle ujawniło2 znane inicjalizacje wspólnego shell: transient lswt-key=value/remove w zainstalowanym auth-js supportsLocalStorage oraz idempotentny accessibility zapis w AppNavigation po accessibilityLoaded. To fixturefinding C14-UI-FIXTURE-02, bez app findingu. Zmieniono wyłącznie mobile reload oracle: exactfullsnapshot, defaultsRAM i dokładnie2 znane writes (ścisła postać dwóchMath.randomstrings; value=key; lswt usunięty; accessibility bytes identyczne z before). Każdy inny write/zmiana bytes nadal zawodzi. Po pełnej kontroli checkpoint i kolejna poprawna edycja wymagają zero writes. Source excerpts/hash/fullbefore/deltas/inverse w ui-review-e2e-reload-fix.json. Rootreview i retest tylko2 mobile pending; pozostałych6 green aniUI25 nie powtarzano, aplikacja bez zmian.
