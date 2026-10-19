# Cykl 12 — bezpieczny zapis kroków lekcji

15.10.2026. **PRZYJĘTY LOKALNIE — LIMITED ACCEPT.** Gałąź codex/p0-security-consent-export, baza 86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b. Poprzednie zmiany zachowano. Bez commit/push/deploy, realnych kont/profili/sesji/sekretów, migracji lub zapisów produkcyjnych, płatnych wywołań i kontaktu z ludźmi. Produkcja **NO-GO**.

## Problem i poprawka

B21 przestał być samą obserwacją źródła. Autor odtworzył osiem przypadków starego rzeczywistego recordLessonStep, a niezależny recenzent cztery własne. Malformed lub niedostępny cache był traktowany jak pusty i nadpisywany; NaN/Infinity zapisywały null, dopuszczano ułamki, nieznane IDs oraz krok 4 w trzyetapowym Money Mindset. Przed nowym zapisem stary czytnik zaokrąglał ułamkowe liczniki. Wszystkie próby były syntetyczne. Dodatkowy stary notify/reentry probe rozpoczął się już po zmianie źródła; zachowano jego FAIL jako niedostępny baseline, bez zaliczania go do reprodukcji lub acceptance.

Nowy helper odróżnia brak klucza od unavailable. Przyjmuje wyłącznie obiekt JSON ze znanymi własnymi IDs ośmiu rzeczywistych lekcji oraz bezpiecznymi całkowitymi licznikami 0..total. Nowy krok wymaga 1..total. Nieznane pola, ułamki, malformed JSON i odmowa odczytu blokują zapis, zachowując zastane bajty. Równy/niższy prawidłowy krok jest no-op bez writes/notify i zmiany RAW. Prawidłowy wyższy krok zachowuje pozostałe wartości; normalna serializacja nowego JSON jest dozwolona. Nie ma cichego floor/clamp, usuwania pól lub migracji.

Writer kontroluje aktualnego ownera przed/po operacjach oraz potwierdza oczekiwane liczniki po setterze i synchronicznym notify. Odmowa lub błąd po próbie zapisu nie daje sukcesu. Error status rozróżnia retryable przed próbą mutacji, uncertain po próbie i stopped po utracie current. Private read-only presentation może zwracać{} przy unavailable; to nie dowód rzeczywistego zera lub odzyskania danych. Typowane wyjątki nie są obietnicą rollbacku.

Osobna strona Money Mindset dostała guard właściciela i aktualnego kroku, cleanup, ograniczenie szybkiego Next oraz lock podczas zapisu. Odmowa daje alert PL/EN i RAM blokadę Next/quiz link, także po zmianie języka. Trzy błędy rzeczywistego komponentu odtworzono 0/3; oracles pozostały niezmienione i retest dał 3/3, później 32/32 na nowym helperze. Generic lesson zachował kod guards z C11. Treści, quizy, IDs i nagrody nie zmieniły się.

Autor helpera daily_author; autor UI/narzędzi root. Niezależni daily_data_review i daily_ui_review: [recenzja danych](data-review.md), [recenzja UI](ui-review.md). Dokładny inverse źródła potwierdza, że w signInGate zmieniono tylko import, readSteps i recordLessonStep. Rules/config/counts/subscriptions oraz agent-time poza tym zakresem zachowano bajtowo. Początkowy LF/CRLF błąd samego proof matcher zachowano; poprawiono tylko dowód.

## Testy, zgodność i bramki

| Bramka | Sprawdzone lokalnie |
|---|---|
| Vitest, 74 pliki | 1566 PASS/1 FAIL, następnie retest wyłącznie tej porażki 1/1 PASS. 1567 różnych przypadków przyjętych w dwóch przebiegach; brak single 1567 green. |
| Niezależne recenzje | Data 63 i UI 32 są subsetem aggregate; autor 87 również, bez doliczania ich ponownie. |
| TypeScript | Standalone: 0 diagnostics/exit 0 na finalnym helperze i E2E. |
| Chrome, PL/EN | 22/22, retries/skipped/flaky 0. Osiem nowych fault cases i 14 dotkniętych healthy/failure saving/mindset. |
| Build | Generating static pages 34/34; route table: 35 wpisów. Exit 0, 332 preflight/331 postflight inputs, 0 mismatch. |
| Parity po buildzie | 41 review porównań/35 ścieżek, 331 copied inputs, 0 current/copied mismatch. |
| Serwer | Host port 43191, 0 listeners po teardown. |

Jedyny FAIL aggregate dotyczył zachowanego historycznego komunikatu przy stale ownerze. Autor przywrócił Storage session changed tylko dla stopped; klasa/status, inne komunikaty i cała logika zostały bez zmiany. Nie osłabiono C4 fixture. Obaj recenzenci przyjęli exact delta/inverse, a autor wykonał 1 celowany retest. 1566 green nie powtarzano. Independent data63/UI 32 wykonywano na helperze przed tą zmianą samego tekstu; finalny hash ma odrębne przyjęcie zgodności, nie nowy pełny przebieg.

Nowe browser cases obejmują PL/EN × obie strony × JSON z nieznanym future key/odmowę odczytu. Sprawdzają actual read > 0, zachowane bajty/saldo 125, disabled Next, próbę starego kliknięcia, zmianę języka i fresh reload nadal błędnych danych. Nie ma naprawy fixture ani product retry. Syntax-malformed JSON i szersze granice liczb są w unit tests. Czternaście wcześniejszych E2E ponowiono, ponieważ zmienił się ich helper/Money page.

Browser i build mają osobne świeże hash-verified kopie TEMP poza OneDrive; źródła/config/tests są zgodne, generowany next-env pominięto wyłącznie w postflight kopii. Auth/provider env puste, syntetyczny gość, kontrolowany czasUTC, zewnętrzne żądania browser zablokowane. Mindset speech to stub, bez realnego audio; compiler font HTTP nie był wykluczony. Znane optional Coinbase warnings nie potwierdzają tych funkcji. Narzędzia root otrzymały osobną statyczną recenzję; niezmienionych 29 boundary tests nie powtarzano.

Raw baselines, failures i retests zachowano. [Verification](../../../evidence/cycle-12/verification.json), root pointer evidence/coachfi-cycle-12.json. Końcowy guard: 1018 tracked/676 text/1 skip, 0 findings. Scoped staged diffcheck exit0. Niezależny QA raportu: accepted,0findings; końcowe przyjęcie zapisane w verification.

## Granice i kolejny zakres

Liczniki opisują widok kroku, nie zrozumienie lub skuteczność Coachfi. Brak atomicCAS, rollbacku, durable journal, locka reentry w helperze i exactly-once między kartami/reload. Reentrant notify może zmienić cache; outer call wtedy zgłasza uncertain, nie cofa danych. Unknown/fraction legacy cache jest zachowany i zablokowany, bez automatycznej migracji. Nie przyjęto innych języków/rynków, pełnego WCAG, prawdziwego auth/kont/RLS/audio/chmury/stagingu lub produkcji. AI/cloud writes/health/Kids/Web3/afiliacja pozostają wyłączone. Package/lock bez zmian; B02/B09/B10/B16 i budżet odrębne.

Następny B22 jest **wyłącznie obserwacją źródła**, nie odtworzonym defektem: parser coachfi-agent-ms zamienia niepoprawną wartość na 0, a timer dodaje wallclock delta do RAM przed zapisem. Lokalny coach rozpoczyna ten timer także przed fallbackiem; nie trzeba włączać zewnętrznego AI, aby badać helper syntetycznie. Wymaga osobnego baseline/zakresu/recenzji i uczciwego wyniku czasu rozmowy. Nie naprawiono tego w C12. Potem dalszy B06 z własnym inventory/financial review. Pętla aktywna; nie duplikować tej paczki lub zielonych testów bez zmiany.
