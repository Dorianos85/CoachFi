# Cykl 3 — niezależna recenzja B13 auth/sync

14.10.2026. Recenzent `ux_audit`; autorzy: `architecture_audit` (AuthContext, cloudSync, session controller), `curriculum_pilot` (account-sync, AccountSync, logout), root (account API identity precondition, provider selection, test JSX transform). Lokalna gałąź `codex/p0-security-consent-export`, bazowy SHA86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b i przyjęte P0/cykl2. Nie edytuję implementacji, config lub indeksu autorów. **LIMITED ACCEPT zamrożonego lokalnego patcha B13 po celowanych niezależnych testach i końcowym typecheck koordynatora. Produkcja nadal NO-GO.** To przyjęcie konkretnych blokad stale work, nie certyfikat całej izolacji/auth produktu.

## Granica oceny

Aktualna generacja to lokalna zgoda na rozpoczęcie/ukończenie działania dla konkretnej tożsamości, nie autoryzacja serwerowa. Logout, zmiana A→B, A→logout→A i disposal muszą synchronicznie zamknąć wcześniejszą generację, timery i callbacki. Po await token/fetch/json/DB należy ponownie sprawdzić generację. Spóźniony completion nie może hydrate, ogłosić sukcesu, skasować dirty B lub clear danych nowej sesji. B ma własną kolejkę i nie oczekuje na nierozwiązane A.

Root przyjął cloud-only login: brak auto-seed/merge globalnych guest danych do nowej tożsamości bez owner provenance. Pusty account może powstać wyłącznie z `{version:1}`; zmiany z gotowej sesji mają własną provenance. GET failure nie oznacza pustego konta. Health upload pozostaje hard-off, a cleanup learning nie może przypadkowo usuwać diagnozy/zgód.

Syntetyczne Map storage, deferred promises, fake timers i mocki request/SDK/query. Nie wykonywano CUA/server/install/build/full suite, prawdziwych tokenów, kont, DB, provider calls lub odczytu profili. Bez live cross-user próby lub RLS. Abort/local lease nie cofa requestów, transakcji lub operacji auth przyjętych już przez SDK/serwer.

## Reprodukcje i findings

[Baseline evidence](../../../evidence/cycle-3/review-baseline.json) zawiera datę, polecenia, wartości syntetyczne i SHA256 źródeł. Testy zapisują wymagane bezpieczne zachowanie, dlatego FAIL na baseline jest dowodem reprodukcji, nie późniejszym zaliczeniem poprawki.

| ID / priorytet | Reprodukcja i obserwacja | Bieżący stan |
|---|---|---|
| B13-REV-01 / P1 | Deferred GET A → endLearningSession → stary response; baseline zapisuje tokens777 przed późnym clear. | CLOSED; niezależny retest account PASS |
| B13-REV-02 / P1 | Deferred token A → stop → token resolve; baseline nadal inicjuje GET. | CLOSED; brak nowego request po stop |
| B13-REV-03 / P1 integralność | Cloud GET error/data null jest traktowane jako empty; baseline wykonuje3 mock writes profile/streak/ledger. | CLOSED; error bez seed/write/hydration |
| B13-REV-04 / P1 | Pięć deferred cloud reads → abort lease → response null; baseline nadal inicjuje3 writes. | CLOSED; stale odpowiedzi bez nowych skutków |
| B13-REV-05 / wymagany kontrakt | Brak/mismatch/stale guard w baseline nie był obsługiwany. Nowy guard ma blokować query/local reads. | CLOSED w kontrolowanym lokalnym kontrakcie |
| B13-REV-06 / P2 integralność | Pierwszy patch wykonywał start/rehydrate przy TOKEN_REFRESHED/SIGNED_IN tego samego UID, nadpisując pending current draft. | CLOSED; actual AuthProvider callback zachowuje guard, nową wartość i pending push |
| B13-REV-07 / P1 integralność, finding root | Ready A/dirty22 → React dispose → explicit logout → A; pierwszy patch zachowuje resumable/dirty i przywraca22 zamiast remote10. | Samodzielnie odtworzono FAIL, po poprawce PASS |
| B13-REV-08 / P1 integralność, finding root | Abort listener podczas closeA binduje B; końcówka starego close czyści bridge B mimo current B. | Samodzielnie odtworzono FAIL, po poprawce PASS |
| B13-REV-09 / P1 integralność, finding root | Stopped outer bind po reentrant B może nadpisać getter B wrapperem starego lease. | Actual binding retest PASS; stopped C nie woła getter i nie czyści B |
| B13-REV-10 / wymagany kontrakt factory | Name-clear event zamyka lease przed getter; uncancellable token musi zwolnić kolejkę i obsłużyć late rejection. | Celowane factory/late-reject tests PASS |
| B13-REV-11 / TS contract, finding root | Fluent mocks nie wykazały publicznego typu terminalnego PostgrestBuilder bez abortSignal po maybeSingle. | CLOSED po kolejności signal-before-terminal, native builder test i końcowym TS PASS; bez odtworzonego runtime TypeError |

Priorytet opisuje skutki kodowego/syntetycznego wyścigu, nie potwierdzony produkcyjny wyciek między kontami. Przekazane reprodukcje nie zawierają rzeczywistych credentials lub danych. B13-REV-06 finalnie testuje callback TOKEN_REFRESHED/powtarzany SIGNED_IN: jawne controller.start(A) nadal oznacza nowy login i może tworzyć nowy lease. Nie zmieniono testu bezpieczeństwa nowego loginu na zachowanie refresh.

## Dotychczasowe niezależne testy

| Suits / wykonanie | Wynik | Znaczenie |
|---|---|---|
| `tests/cycle3-account-review.test.ts`,14:31:26, baseline | 0/2 PASS | Dwie potwierdzone safety assertion failures; później rozszerzono oczekiwane cases |
| `tests/cycle3-cloud-review.test.ts`,14:34:26, baseline | 1/4 PASS | Health hard-off zachowany;3 pożądane safety assertions FAIL |
| Własny session controller review + root provider-selection test,14:40:23 | 12/12 PASS =9+3 | Timery, ABA/same UID in-flight, disposal/stale callback, failure/no success i reward deltas; provider tree selection |
| Własny `cycle3-auth-provider-review`,14:42:01 | 4/4 PASS | enabledfalse zero factory/config/subscription/pusher; sync callback; setup-cleanup-setup; SDK signOut late completion |
| Własne wykonanie autora API mock suite,14:36:55 | 12/12 PASS | Verified bearer owner, expected UID mismatch409 before DB, same-origin/config/no token guards |
| Własny cloud retest,14:45:40 | 5/6 PASS | Error/stale/mismatch/health/no guest seed PASS; refresh failure odtworzono i przekazano autorowi |
| Własny retest draft account,14:51:40 | 5/7 PASS | Samodzielne FAIL reprodukcje resumable logout oraz abort→B bridge; następnie naprawione |
| Finalny własny run,15:01:44 | 32/32 PASS | Account14 + actual AccountSync/binder3 mojego autorstwa oraz root API12/provider3 |
| Finalny własny run po SDK fix,15:03:36 | 23/23 PASS | Session9 + cloud5 + AuthProvider7 + installed SDK2 mojego autorstwa |

Łącznie recenzent wykonał55 raportowanych test cases w dwóch końcowych celowanych runach. **40 jest niezależnego autorstwa recenzenta;15 to własne wykonanie testów autora root, nie nowe niezależnie zaprojektowane assertions.** Nie sumuje się ich ponownie ze zbiorczymi testami roota. Odtwarzalne polecenia, finalne źródła i test hashes: [review-final.json](../../../evidence/cycle-3/review-final.json).

Hook tests wywołują rzeczywiste funkcje komponentów z kontrolowanymi stubs React hooks i wykonują setup/cleanup. Test provider selection analizuje drzewo elementów ze stubs dzieci. Nie są to prawdziwy React StrictMode browser run ani SDK render/login. Własne3 actual AccountSync+actual bindAccountSession cases potwierdzają, że ready.then po cleanup nie pokazuje progress/events, B ready nie otrzymuje dodatkowego sukcesu z A, a signed-out effect rzeczywiście zatrzymuje session. Underlying lease/SDK są kontrolowanymi fixtures;14 osobnych actual account-sync cases wykonuje jego rzeczywisty storage/request pipeline z syntetycznym fetch.

Finalne account cases obejmują także A PUT→B dirty→A late completion, deferred response.json po stop, stale pagehide i end(oldA) przy B, stary name clear, reentrant abort→B oraz stopped outer bindC. B zachowuje własną revision i wysyła captured89 po późnym completion A. Endpoint correlation header zawsze używa captured UID. Owned-learning cleanup nie usuwa health/consent. GET failure jest unavailable, bez create lub guest seed.

## Dodatkowy root API i harness

Odczytany `/api/account` porównuje opcjonalny `x-coachfi-account-user-id` z tożsamością zwróconą przez verifyCdpUser przed saveIdentity/get/save/delete. To dodatkowy warunek captured client identity; header nie zastępuje bearer auth. Mismatch409, zero storage; legacy client bez header nadal używa wyłącznie verified owner. Body userId nie jest ownerem. Mock tests PASS bez rzeczywistego verify/provider traffic. Późno przyjęte poprawne requesty pozostają poza rollbackiem lokalnego abort.

Odczyt logout HeaderAccount: endLearningSession wykonuje zatrzymanie synchronicznie, hideSavedProgress, local-only name clear, SDK signOut bez czekania na remote name GET/PUT lub final flush. Stary callback po nowym active account nie może wyczyścić nazwy tego konta. PL/EN AccountButton copy zgodnie informuje o nowym progress po udanej account sync oraz braku automatycznego importu wcześniejszego device-only progress. To odczyt znaczenia, bez niepotrzebnej mirror test suite dla copy.

`app/providers.tsx` wyłącza legacy AuthProvider przy skonfigurowanym CDP branch; empty/whitespace CDP config nie montuje CDP. Własny disabled AuthProvider test potwierdza także brak samej fabryki i subskrypcji, nie tylko props w drzewie. Vitest config autora root dodaje wyłącznie Oxc automatic JSX transform; tsconfig Next pozostaje preserve, bez nowego plugin/package. [Vite migration](https://vite.dev/guide/migration), [shared options](https://vite.dev/config/shared-options), sprawdzone14.10.2026. Ten harness fix pozwala wykonać source hook tests; nie odblokowuje SDK na produkcji.

## Korekta kontraktu SDK i bramki koordynatora

Pierwszy zbiorczy runtime run roota417/417 PASS nie zaliczał typecheck. Typecheck wykrył runQuery wymagający abortSignal na deklarowanym terminalnym typie po maybeSingle oraz dwa typy fixtures autora. Odczyt zainstalowanego `@supabase/postgrest-js`2.105.4, src/PostgrestTransformBuilder.ts598/692: abortSignal zwraca this, maybeSingle deklaruje PostgrestBuilder i zwraca to samo this przez type cast. Recenzent odtworzył to na realnym builderze: runtime nadal ma metodę. **Nie wykazano TypeError ani runtime braku metody.** Definite failure dotyczył publicznego kontraktu typów; fluent mocks nie testowały tej granicy.

Finalny runQuery przyjmuje factory(signal) zwracającą PromiseLike; query ustawia signal przed terminalnym maybeSingle. Własne2 installed SDK cases używają realnego PostgrestClient/query builders z custom fetch wyłącznie dla synthetic.invalid, zero native/global fetch i bez Supabase auth klienta/refresh timers. Jeden sprawdza terminalny obiekt i transport signal; drugi wykonuje5 actual cloudSync GET, właściwą hydration i zachowanie health/consent. To silniejsze potwierdzenie lokalnego kontraktu transportu niż fluent stub; nie jest to test prawdziwej usługi.

Po tej korekcie koordynator przekazał **422/422 PASS w32 plikach**,15:05:01, i standardowe `npm run typecheck` exit0. To jego run, nie moje ponowne pełne wykonanie. Samodzielnie odczytane [kontrole root](../../../evidence/cycle-3/verification.json) potwierdzają także E2E20/20 PASS w2.0min: wybrane lokalne P0/health PL/EN regresje, bez prawdziwego SDK login/kont. Serwer został zatrzymany. Pierwszy build zgłosił EINVAL/readlink wygenerowanego cache z Windows ReparsePoint, drugi EBUSY nft trace po compile i generowaniu34 stron. **Oba wcześniejsze workspace buildy pozostają FAIL.** Koordynator zachował tylko wygenerowany cache; nie zmieniono source dla obejścia błędów. Recenzent nie uruchamiał full suite/typecheck/build równolegle z root. Poprzednie417 nie zastępuje finalnych422 i TS; zielone testy cyklu2 nie zostały przedstawione jako test tej zmiany.

Końcowa bramka build roota: **PASS, exit0,34/34 strony statyczne**, w zweryfikowanym zamrożonym snapshot TEMP poza OneDrive: `C:/Users/doria/AppData/Local/Temp/coachfi-cycle3-build-62f83d21f4d6427b8ad09cd9c9243183`. Root skopiował248 plików; jego porównanie po build wykazało247 wejść SHA256 identycznych,0 mismatch, z wyłączeniem wygenerowanego next-env.d.ts. Zależności są junction do tych samych installed libs, bez install; provider/auth environment puste, telemetry off. Recenzent odczytał finalny verification i REPORT, nie powtarzał buildu ani porównania TEMP. Wynik zalicza lokalną bramkę tego snapshotu, nie niezawodność workspace OneDrive, realne auth lub runtime produkcji. Pozostały wcześniejsze ostrzeżenia opcjonalnych importów Coinbase x402-fetch/@base-org/account. Post-stage guard roota po fixture fix:537 tracked/249 text/1 skipped/0 findings, PASS bez osłabienia scanner. LIMITED ACCEPT B13 pozostaje w tym samym zakresie; produkcja nadal NO-GO.

Post-stage guard wskazał harmless literal tokenu w teście autora Supabase. Autor zmienił wyłącznie jego prefiks na FIXTURE_, bez zmiany scanner lub application source. Jego celowany retest27/27 PASS15:14:08; raport autora ma nowy test hash77a831f5…. Zbiorcze422 jest wcześniejsze od tej korekty fixture, nie opisano go jako ponownego runu po niej. Nasze6 testów i source hashes pozostają zamrożone.

## Źródła i ograniczenia

Procedury: coachfi-security-review/data-integrity/Supabase. [Changelog Supabase](https://supabase.com/changelog) i [onAuthStateChange](https://supabase.com/docs/reference/javascript/auth-onauthstatechange) odczytano14.10.2026; Markdown index miał nieobsługiwany content type, użyto oficjalnego HTML. Dokumentacja pokazuje synchroniczny callback i unsubscribe. Nie zmieniano SDK/signatures ani konfiguracji TLS. Mocks nie dowodzą zachowania locków/transportu rzeczywistego SDK. Nie przypisano wymyślonych ASVS/RLS compliance IDs.

**Ograniczenia pozostają materialne:** wspólne profile/health/consent storage nie zostały odizolowane między osobami na tym urządzeniu. Failed login/hydration może pozostawić wcześniejsze dane lokalne; pusher pozostaje wyłączony i login ich nie seeduje, ale nie oznacza to zerowego dostępu między użytkownikami. B14 provenance/storage wymaga osobnego zakresu. Pusher po gotowej sesji nie dowodzi RLS, isolation dwóch realnych kont lub trwałej kolejki offline. Quota lub reentrant invalidation może pozostawić wcześniejsze lokalne zapisy bez pełnego sukcesu; localStorage nie ma transaction rollback.

Abort nie cofa requestów, zapisów ani auth operacji przyjętych już przez SDK/serwer. Zdarzenia prawdziwej usługi refresh/revoke/signOut, wiele kart, offline/reward retry idempotency, dwa konta/RLS staging, retencja i usunięcie account-wide, incydent publicznej historii profili oraz residual dependencies pozostają poza tym odbiorem. Aktualna kompozycja eliminuje równoległe mounting CDP+legacy Supabase; nie dowodzi izolacji przy dowolnym osobnym montowaniu tych providerów. Nie deklarujemy zero cross-user access, ASVS compliance lub gotowości produkcyjnej.

## Zamrożony patch i przyjęcie

Samodzielnie odczytane SHA256:

| Plik | SHA256 |
|---|---|
| context/AuthContext.tsx | 310947463924fc832950adbfb234a07eacb2bf92f2ef6e0e9737d9da6b703e77 |
| lib/sync/cloudSync.ts | ef40521fd478df137d5ea28b5874f4c37178fdc2df48441e583b5513006c7b77 |
| lib/sync/session-sync.ts | 8e2d94e494e9c03f8dea8742e73f96b86100f76f628d42a3c9072f6f9b268d83 |
| lib/account-sync.ts | 47f22117555430922ea2d63cecabbf1e5d2f7f5acf55777b4a60b6974544ad8e |
| lib/account-session.ts | b31f6ebeafcc36fddd325893a7d8702f46cb5cda5bc350b5c37420038ebb3293 |
| components/AccountSync.tsx | 02ae55433347413d0e6e3012641f1abddfa5239eb5ecdd99e88d92de89066ddb |
| components/AppNavigation.tsx | 16ac5d620a6a6068c8a25481bbb850e2b4a7cedd7f4ec4199fe570c767a84a48 |
| app/api/account/route.ts | 45bfda57eb1f5130d6edcf30945311c7df2c5e4d8bc7a5768f14453720838882 |
| app/providers.tsx | 5dac6c8f8434c0778b71bfb1da9e96535e1c691e7dd20a4d573a16fdb7df2c85 |
| components/AccountButton.tsx | bcca2ee1f4f75e3bb92cad551ff1d0b5dccd099fd6e0194ed80133f912c986ab |
| vitest.config.ts | 71efb74ff79bc8a66be70cfa69ff9f2933fe7519e010e9178351a12e9a52597c |

Package/lock są niezmienione względem przyjętego cyklu2; hashes i6 test files są w review-final.json. W ocenionym zakresie nie pozostaje otwarty confirmed finding z tabeli; brak testu RLS/staging/pełnej izolacji pozostaje niesprawdzone, nie PASS. LIMITED ACCEPT dotyczy tylko tego patcha i tych dowodów. Zmiana jego source/semantyki wymaga celowanego retestu. Żaden commit, push, deploy lub rzeczywisty account/provider test nie został wykonany przez recenzenta.
