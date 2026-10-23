# Cykl12 B21 — autor walidacji lokalnych kroków lekcji

15.10.2026. Autor `daily_author`. Lokalny kod na bieżącej gałęzi; wcześniejsze poprawki zachowane. Bez commit/push/deploy, realnego storage/profile/secrets, płatnych wywołań lub produkcyjnych zapisów. Autor nie zatwierdza własnego helpera, UI lub wydania. Cloud writes i zewnętrzne AI pozostają wyłączone.

## Odtworzony baseline

Zachowano pełne źródło `lib/signInGate.ts` przed zmianą, SHA4905a6c9d1c3e56ad4e29a5dc14275f8d164a88aa10ffc2524552bb2cb2d3bc8, w `data-author-before-source.json`. Osiem passing assertions rzeczywistego starego recordLessonStep na syntetycznym Map handle odtworzyło błędy: malformed bytes zostały nadpisane saving1; NaN/Infinity zapisały JSONnull; fraction1.5, unknownstage1 oraz money-mindset4 ponad rzeczywiste3 zostały zapisane. Wcześniejsza fraction2.7 została po cichu floor2 przy nowym zapisie. Read denial uruchomił pusty fallback writera, gubiąc prawidłowy money-mindset2. Full fixture source/hash i raw8/8: `data-author-baseline.json`/`data-author-baseline-tests.json`. To reprodukcje defektu, nie acceptance poprawki; zamontowanego starego UI nie wykonano. Drugi recenzent ma odrębny rzeczywisty baseline.

## Ograniczona poprawka

Nowy `lesson-step-save.ts` eksportuje readonly `readLessonStepState(storage,counts)`, `saveLessonStep(stageId,step,storage,counts,notify)` i `LessonStepSaveError.status`. Counts muszą odpowiadać ośmiu aktualnym własnym stage keys i rzeczywistym liczebnościom danych. Money-mindset ma3, saving-habit4; pozostałe wynikają z istniejących arrays. Nie zmieniono lessonStepCounts ani żadnej treści.

Brak klucza lub `{}` to gotowy pusty cache. Istniejące dane wymagają obiektu JSON z wyłącznie znanymi własnymi IDs i safe integer licznikami0..rzeczywisty total. Zero jest dozwolone i zachowywane. Array/null/primitives/string counters/fractions/nonfinite/unknown keys/out-of-range są unavailable, bez floor, clamp, drop-fields lub naprawy. Writer nie traktuje unavailable jako pustych danych i nie nadpisuje RAW. Wymagany input kroku jest safeinteger1..total dla znanego własnego ID; invalid input zostaje odrzucony przed read/write/notify.

`recordLessonStep` zachowuje void API przez wrapper nowego writera. Nowy wyższy krok zachowuje wszystkie prawidłowe pola oraz zwiększa tylko wskazany licznik. Równy/niższy krok jest no-op: bajty RAW, notification i writes pozostają niezmienione. W aktywnym prawidłowym zapisie normalna serializacja JSON jest dopuszczalna; gwarancja identycznych surowych bajtów dotyczy odmowy i no-op, nie formatowania nowego prawidłowego zapisu.

Current owner sprawdzany przed/po read/write i przed/po notify. Set/remove na traced handle oznacza próbę mutacji przed delegacją; false/throw/write-then-throw/late read/notify failure nie zostaje fałszywym sukcesem. Readback sprawdza dokładne oczekiwane liczniki po writerze i po synchronicznej notification; lying setter i późne uszkodzenie nie otrzymują potwierdzenia. Wyjątek jest retryable wyłącznie przed jakąkolwiek próbą mutacji, uncertain po próbie przy udowodnionym ownerze, stopped przy utracie lub nieudowodnionym current. Promise/thenable nie daje synchronicznego sukcesu; native rejection obserwowany bez await/replay.

Private display readSteps używa strict reader i zwraca `{}` dla unavailable wyłącznie readonly. Nie dowodzi to rzeczywistego zera, odzyskania danych ani naprawy cache. UI ma osobno pokazać uczciwą odmowę writerowi i nie obiecywać braku częściowego zapisu; jego właściciel to koordynator.

## Zakres źródła i testy autora

W `signInGate.ts` zmieniono tylko import helpera, readSteps i recordLessonStep. Exact inverse proof odtwarza pełny pierwotny SHA, więc sign-in rules/config/env parsing, agent-time, constants, subscriptions i lessonStepCounts pozostały bajtowo niezmienione. `data-author-wrapper-delta.json` zawiera exact before/after obu funkcji i import. Pierwszy inverse matcher użył LF przy istniejącym CRLF import; jego FAIL zachowano jako `data-author-wrapper-delta-initial.json`. Poprawiono tylko matcher dowodu; aplikacji/testów nie zmieniono i zielonych testów z tego powodu nie powtarzano.

**87/87 testów autora PASS**, `data-author-tests-initial.json`: strict schema, wszystkie8 prawidłowych ostatnich kroków,0 counter compatibility, no-op RAW, denied/malformed preservation, input/schema numeric bounds, prototype/unknown keys, setterfalse/throw/write-then-throw/lying/wrong bytes, both readbacks, notification failure/corruption, owner loss i async contracts. Testy używają real public wrapper i nowego helpera na syntetycznym handle, nie kont/produkcyjnego storage. Nie uruchomiono full aggregate ani dawnych greenC11. Niezależny data reviewer i UI reviewer prowadzą własne cases; TypeScript/build/browser należą do koordynatora.

Końcowy aggregate koordynatora wykrył jedną regresję kompatybilności: niezmieniony stary test stale learning/daily/vault oczekuje komunikatu `Storage session changed`, a nowy stopped error używał innego tekstu. Autor zmienił wyłącznie konstruktor komunikatu dla stopped; klasa, typed status, retryable/uncertain i wszystkie działania pozostały niezmienione. Fullbefore/exact1delta/inverse do SHA967e105b… w `data-author-compatibility-fix.json`; po korekcie helper SHA40a35607aa02069d47068520618909e6a4b380f39560efa703434b224454a70f. Retest wyłącznie starego failing case:1PASS/15unselected. Nie zmieniono starego testu i nie powtarzano87 autora lub1566 innych zielonych cases. Ta delta wymaga osobnej niezależnej recenzji; nie jest deklaracją nowego pełnego aggregate.

## Ograniczenia

Brak atomic CAS, transakcji między kartami, serial/reentry lock, durable journal, rollbacku i migracji istniejących danych. Reentrant notification może zmienić cache; dokładny końcowy readback wtedy zgłasza uncertain, a nie cofa zmiany. Kontrola synchronicznego callbacka nie jest sandboxem dowolnych późnych side effects. Zapisany licznik opisuje lokalny widok kroku, nie zrozumienie lub korzyść użytkownika. Unknown/fraction legacy cache pozostaje zablokowany i zachowany; nie uzgadniamy go automatycznie. Rzeczywiste auth/RLS/staging/chmura/produkcja nie zostały przetestowane.
