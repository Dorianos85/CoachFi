# Cykl 12 / B21 — niezależna recenzja UI lekcji

15.10.2026. Recenzent /root/daily_ui_review; autor Money page — koordynator, autor helpera danych — /root/daily_author. **LIMITED ACCEPT lokalnych komponentów UI, browser pending.** Końcowy niezależny przebieg z nowym helperem: **32/32 PASS, exit 0**, bez zmiany SHA256 źródeł lub fixtures podczas testu. Recenzent nie edytował aplikacji ani treści.

Odczytano AGENTS.md, program, backlog/current-cycle i raport C11 oraz skille frontend-quality, data-integrity i ux-accessibility. Dorośli, Polska, PL/EN; testy lokalne na danych syntetycznych. Bez realnych kont, profili, sesji, sekretów, środowiska produkcji, płatnych wywołań, push/deploy lub migracji.

## Baseline i naprawy autora

Actual MoneyMindsetPage z rzeczywistym recordLessonStep na pierwotnym page1d572949… i signInGate4905a6c9… dał **0 PASS / 3 FAIL**:

- **C12-UI-01:** przechwycony Next po zmianie ownera zmieniał dane nowego ownera.
- **C12-UI-02:** dwa wywołania tej samej przechwyconej funkcji Next przed renderem pomijały krok.
- **C12-UI-03:** odmowa zapisu kroku wychodziła z efektu jako uncaught throw, bez alertu i blokady Next.

Koordynator dodał do Money page owner/ticket/cleanup, ograniczenie Next do bieżącego przechwyconego indeksu, synchroniczny saving lock i kontrolowany alert PL/EN z RAM blokadą Next/link. Zmiana języka nie resetuje blokady. Treści, nagrody i docelowy quiz href zachowano.

Retest identycznego pierwotnego fixture dał **3/3 PASS** po naprawie Money page, jeszcze na starym helperze danych. Jest to tylko zamknięcie trzech granic UI. Po zmianie helpera końcowy run ponownie objął te trzy cases i 29 nowych: **32/32 PASS**. **C12-UI-01..03 CLOSED** na finalnym źródle. Pierwotny 0/3, retest3/3 i final32/32 zachowano osobno; nie sumujemy ich jako38 różnych cases.

## Co potwierdzono

Harness wywołuje rzeczywiste strony i funkcje zapisu, z kontrolowanym schedulerem hooks, storage Map, EventTarget i czasem1.01.2026 UTC. Nie jest ReactDOM ani dowodem realnego auth. Generic lesson pozostał na niezmienionym C11 SHA2567502813a…; Money page finalnie db80ba2a…, signInGate9c910373… i lesson-step-save967e105b….

PL/EN × oba widoki: malformed JSON i nieznany stage cache są zachowane bajtowo, bez próby nadpisania; odmowa odczytu nie staje się zapisywalną pustą mapą. Alert jest kontrolowany, Next zablokowany. Po ustąpieniu syntetycznej odmowy odczytu sama zmiana języka nadal nie odblokowuje bieżącego widoku. Odmowa podczas pierwszej próby zapisu daje jedną próbę i trwałą blokadę tego widoku, bez powtórnego writera.

Poprawne istniejące liczniki Money2/saving3 nie maleją i nie są przepisywane przy wcześniejszych krokach. Kolejne kroki zapisują wyłącznie większą docelową wartość, zachowując licznik innej lekcji. Samo czytanie/przejście lekcji nie nagradza: saldo125 bez zmian; quiz href dostępny dopiero po potwierdzonym ostatnim kroku. Odmowa ostatniego zapisu zachowuje poprzedni count i zastępuje link wyłączonym przyciskiem.

Dodatkowe rzeczywiste granice Money: cleanup i nowy owner unieważniają stare callbacks; notify reentry nie przechodzi dalej podczas zapisu; stare quiz link onClick blokuje nawigację po zmianie ownera; PL/EN writer quarantine pozostaje po zmianie języka. Nie wykonywano zewnętrznego fetch.

Fixture rozbudowano jedynie appendem29 nowych cases. Usunięcie tego dodatku odtwarza pierwotny hash d783427a…; oracles/harness pierwszych3 nie zmieniono. Dokładny append/inverse proof jest w ui-review-acceptance-addition.json. Koordynator niezależnie przyjął dokładny append29 oraz dodatkową asercję E2E w e2e-fixture-review.json; nie jest to samoakceptacja autora fixture.

Po runie32/32 aggregate wskazał jeden wcześniejszy C4 regression dotyczący samego tekstu błędu stopped. Autor zmienił wyłącznie constructor message na zachowany „Storage session changed”, bez zmian status/name, parsera, walidacji, writera, owner guards lub klasyfikacji błędów. Niezależny read-only exact delta/inverse potwierdza nowy helper40a35607…; źródło32/32 nadal jest967e105b…. UI32 nie powtarzano, gdyż alert łapie każdy błąd i oracles/aplikacja są zachowane. Dowód: ui-review-compatibility.json.

## Przeglądarka — przygotowana, pending koordynatora

lesson-step-integrity.spec.ts zawiera8 nowych cases: PL/EN × generic/Money Mindset × poprawny JSON z nieznanym kluczem (błąd schematu)/odmowa odczytu. Fresh guest, UTC/czas1.01.2026, zablokowany zewnętrzny ruch przeglądarki. Fixture obserwuje wyłącznie własne seeded bytes przez zachowany native reader; produkt nadal otrzymuje odmowę odczytu. Potwierdza także rzeczywiste wywołanie readera klucza; nie może przejść przez niewywołany fault. To jedna dodatkowa asercja na prośbę niezależnego recenzenta, jeszcze przed pierwszym browserrun; pełne before/inverse proof w e2e-read-oracle-addition.json. Sprawdza raw cache, saldo125 i brak lesson/token writes, alert, disabled Next, programatyczną próbę kliknięcia, zmianę języka i fresh reload z nadal błędnymi/nieczytelnymi danymi. Brak quiz link, automatycznej naprawy fixture, retry CTA lub migracji.

Recenzent nie uruchamiał serwera/przeglądarki ani aggregate/build. Koordynator wykonuje browser8 oraz14 dotkniętych C11/C6 cases, TS, aggregate, build, parity i końcowe guards. Ich status pozostaje pending w tej wersji raportu.

## Ograniczenia

RAM blokada nie daje atomic rollback, durable recovery lub exactly-once między kartami. Read-only fallback {} nie oznacza sprawdzonego zerowego postępu. Licznik widoku nie jest pomiarem zrozumienia lub korzyści użytkownika. Ściślejsze granice parsera/liczb/late-write/thenable należą również do odrębnej recenzji danych. Inne języki, pełny WCAG/czytnik ekranu, realne auth/RLS/chmura, agent-time/progi logowania, staging i produkcja nie mają PASS. Zewnętrzne AI/cloud pozostają wyłączone.

Dowody: ui-review-baseline-source.json, ui-review-baseline-tests.json, ui-review-boundary-retest-tests.json, ui-review-acceptance-addition.json, final source-before/source-after, ui-review-final-tests.json i ui-review-final.json. Początkowe failures zachowano; zielonych niezmienionych ścieżek C9/C10 nie powtarzano.
