# B13 — sesja CDP i kolejka postępu

Stan: 14.10.2026, lokalny patch w `source/CoachFi`, gałąź `codex/p0-security-consent-export`. Autor: `curriculum_pilot`, role danych/frontendu. Niezależna recenzja: `ux_audit`; integracja: `root`. Dokument jest raportem autora, bez samodzielnego zatwierdzenia wydania. Zachowano P0 i cykl 2. Bez push, wdrożenia, instalacji, rzeczywistych kont, sieci i odczytu magazynu użytkownika. Wszystkie wartości kont/tokenów w testach są syntetyczne.

## Zmiana zachowania i kontrakt

Spóźniona odpowiedź zadania A nie może hydratować postępu, wyczyścić dirty state ani przywrócić widoczności po wylogowaniu lub przełączeniu na B. Token getter, oczekiwany identyfikator konta, kolejka, AbortController i mapa zmian należą do jednej sesji. Każdy request GET/PUT, również odrębna operacja usunięcia nazwy, wysyła `x-coachfi-account-user-id` z przechwyconego `session.userId`. Root implementuje porównanie z tożsamością zweryfikowanego Bearer tokena przed storage; nagłówek nie zastępuje uwierzytelnienia.

| API | Znaczenie |
|---|---|
| `startLearningSession(user, getter)` | Nowy lease: `userId`, monotoniczna `generation`, `ready`, `isCurrent()`, `dispose()`. |
| `lease.ready` | Wynik `{status: ready / stopped / unavailable, userId, generation}`. `ready` oznacza hydratację learning state; nie jest potwierdzeniem, że każda lokalna zmiana została wysłana. |
| `syncSignedInAccount(user, getter)` | Zachowany publiczny kontrakt Promise; wrapper nowego lease. |
| `lease.dispose()` | Natychmiast anuluje zadania i bridge tokena. Może zachować własne dirty snapshoty dla odnowienia tej samej znanej tożsamości. Stary lease przy aktywnym B jest noop. |
| `stopLearningSync(lease?)` | Natychmiast zatrzymuje aktywną lub zachowaną sesję, odrzuca możliwość wznowienia; zachowuje lokalne learning keys i nie wykonuje końcowego flush. |
| `endLearningSession(lease?)` | Zatrzymuje również resumable po cleanup Reacta. Jeśli sesja wcześniej hydratowała postęp, usuwa tylko cztery learning keys i lokalny marker rewizji, przy braku nowszej aktywnej sesji. Bez sesji nie usuwa danych gościa. |
| `persistLearningState(field)` | Rejestruje wyłącznie jawną lokalną zmianę jednej z czterech learning fields po gotowości bieżącej sesji. Zapisuje snapshot wartości i numer ticket, zamiast pobierać później dane wspólnego magazynu. |
| `clearSignedInName()` | Wyłącznie lokalne wyczyszczenie nazwy po zatrzymaniu sesji; bez `notifyCloud` i bez requestów. Przy nowej aktywnej sesji jest noop. |
| `clearSignedInName(lease)` | Odrębne, jawne usunięcie nazwy z bieżącego konta; token/GET/PUT są przypisane do lease i anulowalne. Nie jest automatycznie wykonywane przy logout. |
| `bindAccountSession(...)` | Binding efektu Reacta oraz bridge CDP. Rejestruje getter tylko dla aktualnego lease, kontroluje aktualność po wyniku SDK i przed callbackami gotowości/błędu. |

Pierwsze logowanie albo zmiana tożsamości wykonuje cloud-only initial hydration: odczytuje stan z API, a brak stanu tworzy wyłącznie `{state:{version:1}}`. Nie przenosi globalnego profilu, celu, vault, challenge, zdrowia ani dotychczasowego postępu gościa do nowego konta. Zmiany learning state przed pierwszą hydratacją nie uzyskują uprawnień do uploadu. Świadomie zrezygnowano z automatycznego importu danych gościa; ręczny import wymaga osobnego kontraktu pochodzenia i zgody.

Odnowienie tej samej wcześniej gotowej sesji, bez jawnego stop/logout, może zachować jej przechwycone dirty snapshoty. Zmiana podczas GET takiego odnowienia zostaje zachowana; hydratacja odtwarza wartość własnego snapshotu, a nie dowolną późniejszą wartość wspólnego localStorage. Jawny logout→login tego samego UID ma nową generację i świeżą hydratację z konta.

## Mechanizm i ścieżki

- [account-sync](../../../lib/account-sync.ts): lease/start od linii 53; factory-based wait od 32; close od 94; end od 122; name action od 147; explicit dirty od 176; pull/flush od 197/217; hydratacja od 233; request od 263.
- [account-session](../../../lib/account-session.ts): binding i ochrona globalnego credential bridge. Getter SDK nie jest importowany poza istniejącym CDP providerem.
- [AccountSync](../../../components/AccountSync.tsx): pojedynczy efekt zależny od prymitywnych `userId`, email i istniejących flag/gettera SDK; cleanup własnego lease; brak spóźnionego `.then` przywracającego UI.
- [AppNavigation](../../../components/AppNavigation.tsx): wyłącznie logout handler od 844. Kolejność: natychmiast `endLearningSession()`, ukrycie postępu, lokalne wyczyszczenie nazwy, istniejące `signOut()`. Nie czeka na zdalne usunięcie nazwy. Nazwa zapisana na koncie nie jest kasowana przy zwykłym logout, który nie jest żądaniem usunięcia danych konta.

Fencing występuje przed uruchomieniem token/fetch/json factory i po każdym asynchronicznym wyniku przed następnym działaniem. Anulowanie od razu zwalnia nasze oczekiwanie, nawet gdy mock lub SDK ignoruje AbortSignal; oba późniejsze promise handlers pozostają podpięte, aby nie powstało nieobsłużone odrzucenie. Fetch otrzymuje AbortSignal. Stop nie tworzy nowego snapshotu ani zadania flush.

Każda sesja ma własną kolejkę i listener `pagehide`, usuwany podczas zamknięcia. Nowe B nie oczekuje na nierozwiązany token lub GET A. Zakończenie PUT usuwa jedynie dirty tickets, które nadal odpowiadają wysłanej wersji; nowsze zmiany pozostają do kolejnego requestu. Stare completion nie modyfikuje nowej sesji ani jej markera.

Close ustala stare globalne state, visibility i credential bridge przed `abort()`. Start porównuje generation po close i po cleanup; callback abort/event, który synchronicznie uruchomił nowsze B, powoduje oddanie zatrzymanego lease przez starszy outer start. Zatrzymany binding nie nadpisuje bridge B. Resumable jest odrzucane przed cleanup eventami i przy jawnym stop/end.

## Weryfikacja autora i niezależne reprodukcje

Celowany run: 14:57:11 czasu lokalnego, Vitest 4.1.11, 38/38 PASS w dwóch plikach. Komenda: `node node_modules/vitest/vitest.mjs run tests/cycle3-account-author.test.ts tests/cycle3-account-review.test.ts`. Po typecheck roota poprawiono wyłącznie inferencję typu trzech synthetic getter fixtures na `AccountTokenGetter` (`Promise<string|null>`); type-only import nie zmienia wykonania. Retest własnego pliku o 15:00:59: 27/27 PASS, implementacja bez zmian. Uruchomienie lokalne z eskalacją techniczną dla cache runnera; mock fetch nie pozwala na żadne nieustalone wywołanie sieciowe.

Własny plik [cycle3-account-author.test.ts](../../../tests/cycle3-account-author.test.ts): 27 PASS. Obejmuje deferred token/GET/JSON/PUT; A→B; A→logout→A; stare tickets i dirty B; initial empty cloud bez seed; missing/malformed/configured-false/mismatched response; failure z zachowaniem danych; same-owner dirty podczas refresh GET; stop po dispose; brak końcowego snapshotu i stale pagehide; odrębne name GET/PUT headers; lokalną nazwę bez transferu; name event zatrzymujący lease; late SDK rejection; callback cleanup; reentrant abort i cleanup event z actual binding/credential bridge.

Niezależny plik `tests/cycle3-account-review.test.ts`, autor `ux_audit`: 11 PASS w tym run. Reviewer wcześniej odtworzył dwie bazowe luki oraz dwa findings pierwszej implementacji (resumable po logout i bridge kasowany po reentrant abort). Są to syntetyczne dowody regresji, bez deklaracji reprodukcji cross-user na produkcji. Werdykt recenzenta i końcowe bramki integracyjne roota pozostają do osobnego raportu.

Checklist `vercel:react-best-practices`: zachowane hooki CDP wewnątrz istniejącego provider branch; stabilne prymitywne zależności; efekt ma cleanup; stale callbacks kontrolują lease; globalny listener ma właściciela i disposal; brak nowego SDK/loadera lub bibliotek; brak zmian score/nav scope, etykiet i semantyki dostępnego przycisku logout. Asynchroniczna kolejność zależnych GET/PUT jest celowa, bez wspólnej kolejki między kontami.

## Ograniczenia i pozostałe bramki

Sprawdzone: lokalny kontrakt CDP i syntetyczne regresje opisane wyżej. Nie sprawdzono rzeczywistych kont CDP, Supabase/RLS, urządzeń, wielu kart, sieci ani produkcji. Patch nie gwarantuje cofnięcia requestu już przyjętego przez serwer. Pełne wersjonowanie/conflict control między kartami/urządzeniami pozostaje osobnym zadaniem.

Nie jest to pełna izolacja współdzielonego localStorage. Profil/cel/vault/challenge/zdrowie/zgody i pozostałe klucze nie otrzymują tu owner namespace. Nie są automatycznie wysyłane do nowej tożsamości przez tę ścieżkę. Surowy dawny marker rewizji nie jest źródłem uprawnień: o uploadzie decyduje wyłącznie mapa dirty bieżącej gotowej sesji. Jawne lokalne zmiany są przypisane do current lease; pochodzenie innych zapisów globalnych nie jest przez ten patch dowodzone.

Logout znanej sesji lub zmiana znanego użytkownika usuwa jej lokalne learning keys; niewysłane zmiany takiej kończonej sesji nie są transferowane do nowego użytkownika. Zatrzymanie bez logout oraz błędy odczytu/zapisu zachowują lokalne dane. Health i consent pozostają lokalne i nie są usuwane. Root osobno koordynuje jednego aktywnego backendu oraz precondition API; autor nie zmieniał AuthContext, cloudSync, route, manifestów ani score blocks.

Końcowe typecheck, pełna suita, izolowane E2E i build są prowadzone sekwencyjnie przez roota. Samo PASS nie oznacza zgody na wdrożenie.

## Zamrożone fingerprinty

SHA256 przed integracyjnymi bramkami roota, 14.10.2026:

| Plik | SHA256 |
|---|---|
| `lib/account-sync.ts` | `47F22117555430922EA2D63CECABBF1E5D2F7F5ACF55777B4A60B6974544AD8E` |
| `lib/account-session.ts` | `B31F6EBEAFCC36FDDD325893A7D8702F46CB5CDA5BC350B5C37420038EBB3293` |
| `components/AccountSync.tsx` | `02AE55433347413D0E6E3012641F1ABDDFA5239EB5ECDD99E88D92DE89066DDB` |
| `components/AppNavigation.tsx` | `16AC5D620A6A6068C8A25481BBB850E2B4A7CEDD7F4EC4199FE570C767A84A48` |
| `tests/cycle3-account-author.test.ts` | `724A8321AD4DF0019FB2F092B8F8D292D3520466FE92D3C5B41DCD5A5D6D9738` |

Fingerprint całego AppNavigation obejmuje zachowane wcześniejsze P0/cykl 2; w cyklu 3 własność autora obejmuje wyłącznie handler logout.
