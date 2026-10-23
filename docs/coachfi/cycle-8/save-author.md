# B18 — lokalny controller zapisu quizu

14.10.2026, autor `architecture_audit`, recenzent `curriculum_pilot`, UI root/recenzent `ux_audit`. Wyłącznie nowy `lib/quiz-save.ts`, własny test i dowody; SRS/token source pozostają bez zmian. Kod frozen do niezależnej recenzji, bez self-approval, danych rzeczywistych, SDK/usług, install/server/full gates/push/deploy.

## Baseline

Actual istniejące helpery na synthetic Map potwierdziły trzy częściowe zapisy: successful25-point preflight przy125, SRS zapisany, event zmienia saldo naMAX i add25 odmawia; oraz SRS zapisany i fizyczne saldo150 pozostaje, gdy późniejszy token event/persistence rzuca. **3/3 PASS20:36:00** oznacza odtworzenie tych usterek, nie acceptance. Pełny baseline test source, source hashes i wynik: `evidence/cycle-8/save-author-baseline.json`. Nie wykonano rollbacku ani testu UI w tym baseline.

## Interfejs i klasyfikacja

`createQuizSaveController()` daje frozen methods `version():number`, `reset():number`, `run(ticket,storage,record:(tracedStorage)=>void,reward?:()=>void):QuizSaveResult`. Początkowy ticket0. Reset zmienia epoch, lecz globalny in-flight trwa do finally starego run. Stare tickets i reentry są ignored; saved commit ustawia RAM flag przed powrotem do UI, więc kolejny submit nie wykonuje callbacków.

Przed actions są bezpośrednie access probes `coachfi-srs` i `coachfi-tokens`, bez parsowania i repair. Błąd bez wywołania mutatora przy nadal udowodnionym owner/epoch jest retryable; controller nie planuje retry. Trace strukturalnie deleguje ten sam handle, lecz pozostaje aktywny tylko we własnym run. Każde wejście do setItem/removeItem ustawia mutationAttempted przed guardem i delegacją. False, throw, physical-write-then-throw i same-byte call nie pozwalają udawać potwierdzonego pre-write refusal. Sticky read/write faults chronią również przed połkniętym błędem callbacku. Przy failure po invocation i current owner/epoch wynik uncertain oraz quarantine: następne wywołanie tego ticketu zwraca uncertain bez ponowienia zapisów.

Utrata owner/epoch ma pierwszeństwo stopped, bez starego UI. Wyjątek z authority `isCurrent()` również daje stopped, gdyż current nie zostało udowodnione; to nie jest getItem error przy prawidłowej authority. Root jawnie zatwierdził tę klasyfikację. Pierwszy niezależny29/30 miał odmienny expected status; recenzent skorygował wyłącznie tytuł/expected literal z reverse-delta proof, bez helper edit. Recenzent zgłosił końcowe **30/30 PASS20:49:01** na tym samym9F680D source i ograniczone przyjęcie. To jego wykonanie, nie autora; referencja `docs/coachfi/cycle-8/save-review.md`.

Reward następuje dopiero po pełnym sync record-return z traced mutation i bez faults. Saved następuje po całym opcjonalnym sync reward-return i końcowym current guard. Thenables nie otrzymują saved i nie są await/replay; native Promise rejection jest jedynie obserwowany. Brak window daje retryable bez callbacków/probes/writes. Guardy browser działają też przy późniejszej utracie window.

RecordAnswer zawsze wywołuje traced.setItem przed reward. Dzięki temu późniejszy błąd oryginalnego addTokens na captured handle jest uncertain. Nie ma osobnej trace dla reward; bezpośrednie writes z record albo przyszły async/opaque reward nie są objęte gwarancją. Callback bez tracked mutation nie uruchamia reward i nie jest saved. Controller nie cofa callbackowych UI effects; root przenosi success/navigation/completion za outcome saved oraz własny ticket/owner check.

## Testy i freeze

Po freeze wykonano tylko `node node_modules/vitest/vitest.mjs run tests/cycle8-save-author.test.ts`: **42/42 PASS,1 plik, Vitest4.1.11,20:45:42 Europe/Warsaw,exit0**. Synthetic storage/event/sync mocks oraz actual SRS/token helpers w wybranych integracyjnych oracles. Sprawdzono refusal/throw/physical partial write/sticky errors, epoch/reentry/quarantine/retired handles, thenables/no browser i brak ponownego naliczenia actual150 po late failure. Nie wykonano full gates; wyniki niezależne i UI są odrębnym zakresem.

| Plik | SHA256 |
|---|---|
| lib/quiz-save.ts | 9F680D1C13230B457AD2B8BBB869BB6D36938F93BBC77C4BE10E4A59F5A663E3 |
| tests/cycle8-save-author.test.ts | 56F6F54BF65DD8D0F25E5408CA0E927474A19BDDDA3FB8441A1CF3698FA568C0 |
| lib/srs.ts, niezmienione | 622163D90006A6AEAD3F3632C8A18AAA3945064BFB4405B88AE2391B5F4818E6 |
| lib/tokens.ts, niezmienione | B81F83F47769A5CC139B024D5AA5E3DE679181081A4004240E9A4AE0DC53623A |

Final own evidence: `evidence/cycle-8/save-author-acceptance.json`. Niezależny autor nie zatwierdza własnego źródła; status release nie jest zmieniony.

## Ograniczenia

Brak atomic transaction, rollback, reconciliation, newpersistent data/op IDs lub CAS między kartami. Quarantine jest RAM i per-ticket: reset/reload/new controller nie potwierdza, że poprzedni zapis nie nastąpił. Access probe nie waliduje uszkodzonego JSON/SRS schema; istniejący fallback pozostaje osobnym ograniczeniem. Physical zapis i powiadomienia mogą wystąpić przed późnym failure i nie są cofane. Nie gwarantuje exactly-once między sesjami, realnych kont/RLS, pełnego cloud/auth/UI lub produkcji.
