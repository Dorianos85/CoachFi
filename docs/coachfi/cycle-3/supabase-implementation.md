# Cykl 3 — B13, lifecycle synchronizacji Supabase

2026-10-14, autor: architecture_audit; niezależny recenzent: ux_audit. Lokalna gałąź `codex/p0-security-consent-export`, bez push/deploy i operacji na prawdziwych kontach. Zakres autora: `context/AuthContext.tsx`, `lib/sync/cloudSync.ts`, nowy `lib/sync/session-sync.ts`, `tests/cycle3-supabase-author.test.ts` i ten raport. Poprzednie staged poprawki zachowano. Wybór providera i konfigurację testów integruje root w oddzielnych plikach.

## Problem i świadoma zmiana zachowania

Poprzedni callback `onAuthStateChange` czekał na wywołania SDK, instalował pusher przed zakończeniem odczytów i nie kasował debounce timers przy cleanup/logout. Odczyty profilu, kart, etapów, streak i salda mogły po zmianie konta zapisać poprzedni stan i wysłać event sukcesu. Niektóre odczyty ignorowały `query.error`; `data:null` z błędem uruchamiało seed globalnych danych urządzenia. Login mieszał też guest/local z cloud i przesyłał połączony stan bez dowodu własności lokalnego snapshotu.

Po zatwierdzeniu kontraktu przez koordynatora login jest **cloud-only**: pięć odczytów musi się zakończyć poprawnie w bieżącej sesji, zanim zacznie się hydration. Puste autorytatywne dane czyszczą odpowiednie pola profilu, avatar/voice, kart, etapów, streak i salda do pustych/default wartości. Nie ma automatycznego seed, union, upload ani reward-ledger insert przy loginie. Health, zgody, mode i pozostałe lokalne klucze nie są usuwane. Jawne późniejsze lokalne zmiany mogą być przesłane dopiero po udanej aktualnej hydration i instalacji pushera. To świadoma zmiana: postęp gościa nie migruje automatycznie do konta.

## Kontrakt sesji i transportu

`SyncSession` ma `userId`, `signal: AbortSignal`, `isCurrent()`. `createSessionSyncController` eksportuje `start`, `getCurrent`, `invalidate`, `dispose`. `start(uid)` oznacza nowy lease, także dla tego samego UID; logout → ten sam UID nigdy nie przywraca poprzedniej generacji. `getCurrent()` służy providerowi do zachowania już aktywnego lease podczas callbacku `TOKEN_REFRESHED` albo powtarzanego `SIGNED_IN` tego samego UID. Taki refresh aktualizuje session w React, nie powtarza cloud hydration i nie kasuje oczekującego jawnego zapisu.

Każdy nowy lease zwiększa generację i ma własny AbortController. Invalidate najpierw unieważnia bieżącą generację, czyści wszystkie timers i pusher, potem abortuje poprzedni transport. `dispose` dodatkowo blokuje przyszłe starty. Reentrant abort listener nie może wskrzesić starej generacji. Synchroniczny callback SDK tylko ustawia session i planuje macrotask `setTimeout(0)`; zapytania SDK zaczynają się dopiero po oddaniu kontroli z callbacku.

Controller po `await sync` sprawdza aktualność. Zarówno `false` bieżącej sesji, jak i wyjątek unieważniają ją i abortują pozostałe odczyty; nie ma instalacji pushera ani `coachfi-cloud-synced`. Sukces instaluje pusher ograniczony do konkretnego lease. Reward deltas są wysyłane osobno, zwykłe zmiany mają debounce800ms. Każdy timer i przechwycony pusher sprawdza aktualność przed wywołaniem; stary reward callback też pozostaje bezczynny.

`syncOnLogin(db, uid, session?)` zwraca boolean. `pushEntity(db, uid, entity, payload?, session?)` zwraca Promise<void>. Brak guard, mismatch UID, abort albo nieaktualna generacja oznaczają zero inicjalizacji zapytań. Wewnętrzne `runQuery` sprawdza guard przed i po utworzeniu query, przekazuje signal do typowanej factory `(signal) => PromiseLike<{data,error}>`, sprawdza guard po await, a `query.error` zamienia na ogólny błąd bez logowania payloadu/credentials. Wszystkie12 factories ustawiają `.abortSignal(signal)` na filter/transform builder. Trzy odczyty scalar wykonują to PRZED terminalnym `.maybeSingle()`.

Przed i po każdym zapisie oraz przed i po każdym evencie lokalnym sprawdzana jest aktualność. Hydration zapisuje storage bez użycia setterów wywołujących poboczne cloud/CDP persistence. `coachfi-learning` idzie dopiero po zapisaniu kart, etapów i streak; listener widzi kompletny zapisany learning state. Avatar zachowuje prawidłowe cloud gender/style, a brak lub obca wartość używa istniejącego `DEFAULT_AVATAR` (female/warrior). Voice zachowuje format zwykłego string, tokens zwykłego string liczbowego. `healthCheck` jest blokowany przed dostępem nawet do payloadu, guard i DB.

`signOut` unieważnia lokalną synchronizację i ustawia session:null przed await SDK; po await nie wykonuje cleanup, który mógłby skasować nowszą sesję. Cleanup efektu unieważnia controller przed unsubscribe, a nieaktywny callback nie zmienia stanu. Sign-in/up/OTP sprawdzają po await, czy provider/controller nadal istnieje; błędy nie logują tokenów.

`AuthProvider enabled?:boolean` domyślnie true. `enabled:false` nie wywołuje fabryki Supabase ani konfiguracji, nie zakłada subskrypcji, nie rejestruje pushera i zwraca configured:false/loading:false/session:null/user:null. Root używa tego kontraktu dla gałęzi CDP, eliminując równoległe montowanie dwóch właścicieli auth w aktualnej kompozycji aplikacji. Nie jest to migracja już zapisanych danych/auth.

## Sprawdzone źródła pierwotne

Dokumentację sprawdzono 2026-10-14 read-only, bez zapytań do projektów/baz. Zainstalowany `@supabase/supabase-js`2.105.4; kod SDK potwierdza oczekiwanie na callbacki auth i dostępność abortSignal w PostgREST.

- [Supabase: API call not returning](https://supabase.com/docs/guides/troubleshooting/why-is-my-supabase-api-call-not-returning-PGzXw0) — ryzyko deadlock przy await innych metod Supabase w callbacku auth.
- [onAuthStateChange](https://supabase.com/docs/reference/javascript/auth-onauthstatechange) — synchroniczny callback i lifecycle subskrypcji.
- [Using modifiers: abort signal](https://supabase.com/docs/reference/javascript/using-modifiers-abortsignal) — transportowe `.abortSignal()`.
- [Supabase changelog](https://supabase.com/changelog) — odczyt bieżących wpisów i informacji o zmianach. Próba markdown changelog przez web miała unsupported content-type, dlatego sprawdzono oficjalną stronę HTML. Dokładny terminalny kontrakt builderów weryfikuje dodatkowy test z zainstalowanym SDK, opisany poniżej.

## Weryfikacja autora

`node node_modules/vitest/vitest.mjs run tests/cycle3-supabase-author.test.ts lib/sync/cloudSync.test.ts`: **29/29 PASS**, 14:52:54 lokalnego runnera, Vitest4.1.11. W tym24 nowe przypadki autora i5 istniejących regresji health hard-off. Po doprecyzowaniu wyłącznie typów mock query końcowy `run tests/cycle3-supabase-author.test.ts`: **24/24 PASS**, 14:54:03, exit0.

Te początkowe wyniki miały niepełny kontrakt query mock i nie dowodziły poprawności typów SDK. Root później zgłosił full417PASS, ale standalone typecheck FAIL: `maybeSingle()` deklaruje `PostgrestBuilder`, który nie udostępnia transform method `abortSignal`. Autor błędnie zakładał dostępność tej metody na terminalnym wyniku. Obecny kod SDK runtime zwraca jeszcze `this`, więc runtime TypeError nie został odtworzony; potwierdzony był błąd typów i publicznego kontraktu. Wstępny freeze `2CCC6B1A…` cloudSync / `E23292CE…` testu jest **superseded**.

Poprawka: signal jest jawnie przypinany we factory PRZED maybeSingle, a `runQuery` czeka na sam PromiseLike bez późniejszego transform call i bez `any`/cast ukrywającego typy SDK. Mock `maybeSingle()` jest teraz terminalnym PromiseLike bez transform methods, aby nie maskował takiego regresu. Dodano3 cases z faktycznym `createClient<Database>` zainstalowanego SDK i jego wewnętrznym PostgREST, z wyłącznie syntetycznym custom fetch: pięć scalar/list GET i siedem write POST ze sprawdzeniem UID/filter/body oraz tożsamości sygnału; realna obsługa błędu kardynalności (dwa scalar rows) bez hydration; realny deferred transport z przekazanym i abortowanym sygnałem, ignorujący abort response bez hydration. SDK auth jest pominięty przez syntetyczny accessToken getter, URL to `https://synthetic-sdk.invalid`, autoRefresh/persist/detect wyłączone, global fetch zablokowany i0calls.

Końcowy targeted `node node_modules/vitest/vitest.mjs run tests/cycle3-supabase-author.test.ts lib/sync/cloudSync.test.ts`: **32/32 PASS**, 15:02:57, exit0, Vitest4.1.11. To27 cases autora (24 lifecycle +3 SDK contract) i5 istniejących health hard-off. Standalone typecheck i pozostałe bramy root muszą być ponowione na nowym fingerprint; poprzedni full417 nie zastępuje ich.

Końcowy repo guard wykrył niedozwolony prefiks w literalnym `access_token` wyłącznie w syntetycznym teście refresh. Zmieniono tylko wartość fixture na `FIXTURE_replacement-token`, zgodną z udokumentowaną allowlist; scanner, adapter i logika auth nie zmieniły się. Po tej korekcie `node node_modules/vitest/vitest.mjs run tests/cycle3-supabase-author.test.ts`: **27/27 PASS**, 15:14:08, exit0. Nowy fingerprint testu zastępuje `68F24941…`; trzy źródłowe fingerprinty pozostały identyczne. Integracyjne wyniki i przeniesiony przez root build w TEMP raportuje koordynator oddzielnie, nie stanowią własnego execution autora.

Testy korzystają wyłącznie z syntetycznych A/B, Map storage, deferred promises, fake timers, mock query/SDK i modelu hooków React. Global fetch rzuca przy wywołaniu; brak prawdziwej sieci/profili/sekretów. Testy providera używają rzeczywistych funkcji controller/cloudSync i SDK callbacku mockowanego lokalnie, nie przeglądarki ani prawdziwej usługi auth.

Sprawdzone: callback oddaje kontrolę przed query; cleanup przed timerem; switch/logout/unmount i stare reward callbacks; A→logout→A nowy lease; false/throw abort; last-query error po czterech poprawnych odczytach bez częściowej hydration; early failure abortuje pozostałe zapytania; transport ignorujący abort nie zapisuje późnych wyników; absent/mismatched guard; cloud-only empty i brak guest seed; prawidłowy avatar i raw voice; kompletny learning event; reentrant profile/learning listener; zero factory/subscription/network przy disabled; deferred signOut nie kasuje późniejszej sesji B.

Value-level retest zgłoszenia B13-REV-06: udana hydration A z name=`Synthetic cloud old` → jawny `saveUser` do `Synthetic owned new` → TOKEN_REFRESHED lub SIGNED_IN A → bez dodatkowych query, nowa lokalna wartość zostaje, a800ms wykonuje się jeden profile upsert z UID A i nową wartością. Oddzielny test SIGNED_OUT→A wykazuje nowy signal, nową hydration i anulowanie poprzedniego pending write.

Scoped `git diff --check` przeszedł bez błędów dla autorskich plików. Nie uruchamiano install/server/build/typecheck. Bramy integracyjne i E2E prowadzi root po zamrożeniu autorów; wyniki poprzedniego cyklu nie są wynikami tej zmiany. Niezależny werdykt ux_audit będzie w jego osobnym raporcie; autor nie akceptuje własnego wydania.

## Ograniczenia

Abort i lokalna generacja nie cofają zapisu przyjętego już przez serwer. To nie jest mechanizm autoryzacji ani test RLS: nie sprawdzono realnych kont, row policies, refresh/revoke na usługach, wielu kart przeglądarki i rzeczywistego transportu. Reward retry/idempotencja oraz trwała kolejka offline nie są implementowane. Pusher nie obiecuje sukcesu przy błędzie zapisu.

Guard chroni przed dalszymi skutkami stale work. LocalStorage nie ma transakcyjnego rollbacku: quota exception albo reentrant invalidation mogą pozostawić wcześniej wykonane lokalne zapisy. Nie emitujemy wtedy pełnego sukcesu ani nie instalujemy pushera. Wspólne klucze storage nie są pełną izolacją danych urządzenia; nie usuwamy health/zgód/pozostałych danych. Przy failed hydration stary lokalny stan może pozostać do późniejszego poprawnego odczytu, ale nie jest seedowany/uploadowany przez login. Zmiany przed pierwszą udaną hydration nie mają udowodnionej własności i nie są automatycznie przenoszone. Dual-auth jest blokowany przez aktualną kompozycję root; odrębne montowanie providerów i migracja historycznych danych wymagają własnego zakresu.

## Freeze fingerprint

SHA256, stan autora po targeted PASS:

| Plik | SHA256 |
| --- | --- |
| `context/AuthContext.tsx` | `310947463924FC832950ADBFB234A07EACB2BF92F2EF6E0E9737D9DA6B703E77` |
| `lib/sync/cloudSync.ts` | `EF40521FD478DF137D5EA28B5874F4C37178FDC2DF48441E583B5513006C7B77` |
| `lib/sync/session-sync.ts` | `8E2D94E494E9C03F8DEA8742E73F96B86100F76F628D42A3C9072F6F9B268D83` |
| `tests/cycle3-supabase-author.test.ts` | `77A831F557BDBA9AD68B96203B2338E64A8C3DACF7BD148AA24C52D40C9AC87F` |

Zamrożenie jest sygnałem do integracji lokalnej, nie zgodą na produkcyjny deploy.
