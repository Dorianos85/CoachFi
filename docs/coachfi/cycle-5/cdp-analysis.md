# B15 — analiza CDP cold resume i offline

14.10.2026, autor `architecture_audit`. Poniższa analiza zachowuje historyczny baseline B14 i propozycję sprzed decyzji roota. Po zatwierdzeniu kontraktu wdrożono lokalny B15 read-only opisany w końcowej części dokumentu. Produkcja pozostaje niezmieniona i NO-GO. Użyto skilla `coachfi-data-integrity`; odczyt `account-store.ts` obejmował kod SDK Supabase, więc odczytano też skill Supabase. Bez wywołań SDK, sieci, providerów, rzeczywistego storage, profili, env ani sekretów.

## Wynik

Osiem syntetycznych testów odtworzyło sześć problemów i jedną kontrolę ochronną. **8/8 PASS oznacza zgodność reprodukcji z obecną usterką, nie przyjęcie poprawki.** Testy mają w komentarzu jawny status baseline audit. Implementacja nie została zmieniona; docelowe asercje trzeba odwrócić dopiero po uzgodnieniu i wdrożeniu kontraktu.

`coachfi-learning-rev` jest trwałym numerem, ale nie trwałą kolejką. Zawartości tego klucza żaden start CDP nie odczytuje. `dirty`, captured fields, tickets, `revision`, `active` i `resumable` są RAM. Zimne odtworzenie modułów usuwa je, zachowując fizyczne bajty namespace konta. Kolejny udany GET nadpisuje cztery pola learning, mimo obecnego znacznika niepotwierdzonych zmian.

## Mapa obecnego kontraktu

| Element | Potwierdzone zachowanie kodu | Konsekwencja |
|---|---|---|
| Własność | `beginStorageOwner({kind:'account',provider:'cdp',userId})`, namespace per provider/UID, stale leases odrzucane | B14 rozdziela guest/A/B; samo pochodzenie nie zapewnia trwałości zmian konta |
| Cold start | Brak predecessor w nowej instancji; `dirty=new Map()`, `revision=0` | Zapisany numeric REV nie odtwarza pól ani payloadu |
| Same UID callback | `AccountSync` utrzymuje ten sam lease przy zmianie SDK token getter; effect nie zależy od getter/email | Nie wykonuje ponownej hydration przy zwykłym refresh tej samej aktywnej tożsamości |
| Warm explicit rebind/dispose | Tylko znany, gotowy predecessor tego samego UID przenosi RAM dirty/revision | Nie jest dowodem cold resume; logout/stop odrzuca RAM resume |
| Local-only | GET/no-token failure publikuje własny namespace ready/localOnly | Helpers nadal zapisują lokalnie, ale `persistLearningState` wraca przed zapisaniem REV, gdy cloudReady=false |
| Dirty capture | `persistLearningState` kopiuje wszystkie cztery bieżące pola, ticket wskazuje pole zmienione; zapisuje numer REV | W RAM zachowuje snapshot, lecz nie utrwala rodzaju zmiany ani jej payloadu |
| Flush | GET świeżego remote, overlay dirty fields, PUT pełnego AccountSnapshot | Remote sibling zapisany między GET/PUT może zostać nadpisany; ten sam field używa lokalnego snapshotu bez polityki konfliktu |
| Failure | Flush `configured:false`, `ok:false`, brak remote.state/no token wracają bez statusu; exceptions schedule są konsumowane | Warm pull może zakończyć się ready przy nadal dirty i REV |
| Ack | Po `saved.ok!==false` usuwa zgodne RAM tickets i REV, bez porównania saved.state z wysłanymi polami | HTTP sukces z innym potwierdzonym stanem może fałszywie wyczyścić pending |
| Serwer | PUT nie przyjmuje `If-Match`, base revision ani expected state; updatedAt jest metadata GET | Brak atomowego compare-and-swap; sam dodatkowy client GET nie naprawia wyścigu |

W SQLite zapis kilku tabel jest w transakcji `begin immediate`, lecz ta transakcja nie sprawdza bazowego stanu klienta i nadal zastępuje pełny stan. W Supabase `account_state.upsert` jest bez warunku bazowego, a accounts/state/progress są odrębnymi zapytaniami. To odczyt statyczny, bez sprawdzenia rzeczywistych tabel/transakcji/RLS. CDP identity header jest precondition tożsamości, nie wersją danych.

## Reprodukcje

| ID | Syntetyczny trigger | Zaobserwowany wynik | Kryterium przyszłej poprawki |
|---|---|---|---|
| CDP-B15-01 | Remote10 → własne20 → flush offline → zachowany REV1 → nowy moduł → GET10 | Lokalne20 staje się10; REV nadal1; raw guest i owned health zachowane, zero PUT | Zachować własne20, nie traktować odczytu jako reconcile pending |
| CDP-B15-02 | Własny cache10 → pierwszy GET offline/localOnly → rzeczywisty addTokens(+5) → cold GET10 | 15 staje się10, brak REV przez cały okres lokalnego zapisu | Rejestrować istniejące lokalne zmiany również localOnly albo konserwatywnie chronić cały istniejący cache |
| CDP-B15-03 | Remote10 → własne25 → GET10/PUT503 → cold GET10 | 25 staje się10; REV1 pozostaje | Failure nie usuwa odzyskiwalnej własnej zmiany |
| CDP-B15-04a/b | RAM dirty30 → dispose/rebind A → GET11 → flush GET503 lub PUT409 | Ready i localOnly=false, własne30/REV1 nadal oczekują | Pending/offline/conflict jest oddzielny od synced sukcesu |
| CDP-B15-05 | Wysłane tokens40, PUT ok zwraca state.tokens999 | Lokalne40, REV usunięty | Nie usuwać ticket bez wiarygodnego potwierdzenia tej wersji/payloadu |
| CDP-B15-06 | GET obserwuje stage started → drugi writer zapisuje completed → nasz tokens50/pełny PUT | Remote stage wraca do started, REV usunięty | Bez atomowego warunku bazowego zatrzymać zapis zamiast deklarować rozwiązany konflikt |
| CDP-B15-07 | Pierwszy GET409, owned cache60 | Unavailable, ready localOnly, cache60 zachowane, zero PUT | Zachować tę ochronę; nie rozszerzyć konfliktu na sukces |

Test06 używa actual account-sync z syntetycznym store zastępującym pełny snapshot. Model transportu odpowiada statycznie odczytanemu bezwarunkowemu `saveAccount`, ale nie jest wykonaniem rzeczywistego backendu. Konkurencja staging i atomicity produkcyjnej bazy pozostają niesprawdzone. Test01 zachowuje bajty raw guest/health jako guard ograniczenia nowego B15, bez powtarzania całej zielonej paczki B14.

## Proponowany minimalny kontrakt — do decyzji roota

Nie dodawać danych użytkownika, nowych kluczy osobistych, dostawców ani uploadu zdrowia. Operować wyłącznie istniejącymi polami `srs`, `learnManual`, `tokens`, `streak` i istniejącym `coachfi-learning-rev`, zawsze przez prywatny captured namespace account/CDP/UID. Gość nie jest materiałem do importu; brak markerów nie dowodzi, że cache konta jest aktualny lub potwierdzony.

1. Przed GET i każdym remote apply przechwycić własny stan czterech learning pól oraz raw REV. Cold resume z istniejącymi wartościami/markerem nie może ich bezwarunkowo skasować ani nadpisać. Cache bez markerów również jest niepewny po localOnly zapisach ze starej wersji. Przy różnicy cloud/cache, wadliwym markerze albo starej numeric REV: zachować bajty, opublikować to samo konto ready/localOnly z jawnym pending/conflict; bez auto PUT.
2. Jeśli wybierzemy trwały journal: wersjonowany, ściśle allowlistowany envelope w obecnym REV_KEY, związany z provider/UID. Zawiera wyłącznie istniejące learning payloady/field tickets i stan pending, nigdy profil/goal/health/consent/token auth. Legacy numeric REV jest ambiguous pending, nie pozwoleniem na import/overwrite. Przechwytywać explicit zmiany także localOnly. Zapis journalu musi propagować quota failure; nie claimować atomowości kilku kluczy localStorage ani rollbacku już przyjętego zapisu.
3. `ready` oznacza gotowy lokalny widok. Synced sukces wymaga braku niepotwierdzonych zmian i wiarygodnego ack. Wprowadzić osobny status offline/pending/conflict lub przekazać go w kontrakcie wyniku; błędny GET/PUT, 409, brak tokenu/config lub różny echo pozostawiają pending. Starszy ack nigdy nie usuwa nowszego ticketu.
4. Bez potwierdzonego atomowego warunku zapisu na serwerze minimalnym bezpiecznym wariantem jest wyłączenie automatycznych CDP learning PUT, w tym create podczas GET-null. Można czytać cloud dla pustego własnego namespace, lecz istniejący cache/pending zachować lokalnie. Client base digest/check przed PUT może wykryć wcześniejszy konflikt, ale nie zapewnia CAS; nie deklarować eliminacji many-tab/device lost update.
5. Realny reconcile/upload wymaga osobnego autoryzowanego kontraktu: sprawdzona baza wersji, atomowe conditional update i odpowiedź z potwierdzonymi wersją/polami. Do tego czasu jawny tryb lokalny jest wykonalny bez migracji. Ewentualny discard musi być osobną świadomą akcją current account, z revision fence, nigdy automatycznym wyborem cloud po login.

To propozycja zakresu, nie gotowy adapter. Root wyznaczy źródła i wariant po analizach innych ścieżek. `lib/account-sync.ts`, `lib/learning-state.ts`, istniejący REV write/read helper oraz status przekazywany do AccountSync mogą wymagać zmian; write-ahead dla crash window przed obecnym `persistLearningState` wymaga też rozważenia setterów albo adaptera. Nie edytowano tych plików w tym etapie.

## Weryfikacja i ograniczenia

Wykonano wyłącznie `node node_modules/vitest/vitest.mjs run tests/cycle5-cdp-author.test.ts`: Vitest4.1.11, 14.10.2026 17:06:50 Europe/Warsaw, 1 plik, 8/8 PASS, exit0. Każdy test resetuje moduły i używa Map, EventTarget oraz mock fetch, który odrzuca nieprzygotowane wywołania. Cold reload zachowuje te same syntetyczne fizyczne bajty, usuwa RAM/listenery i importuje świeże moduły. Bez install/dev/build/typecheck/E2E/full suite.

Reprodukowalne lokalne polecenia: `rg -n 'REV_KEY|dirty|revision|applyLearningState|saved' lib/account-sync.ts`; `rg -n 'updatedAt|saveAccount|readJsonWithLimit' app/api/account/route.ts`; `rg -n 'state = excluded.state|account_state|onConflict|saveSupabaseAccount' lib/account-store.ts`; celowany test powyżej. Pełne SHA256 wejść i testu zapisano w `evidence/cycle-5/cdp-analysis.json`.

Sprawdzone: statyczny kontrakt i opisane syntetyczne ścieżki actual CDP helpera. Prawdopodobne: skutki równoległych writerów backendu zgodne z unconditional source. Niesprawdzone: rzeczywiste CDP/Supabase konta, RLS, produkcyjna konfiguracja, wielokartowe procesy, awaria dysku/przeglądarki w połowie wielokluczowego zapisu. Niedostępne w tym zakresie: staging/realne kontrolowane konta i prawa do ich użycia. Izolacja namespace nie szyfruje storage ani nie blokuje arbitralnego JS tej samej origin. Autor nie zatwierdza własnego rezultatu; niezależna recenzja należy do `ux_audit`.

## Uzgodniona implementacja B15 — frozen do niezależnego review

Root początkowo wybrał minimalny fail-closed wariant bez CAS, serwerowych zmian, migracji, nowych danych, journal payloadów ani discard/replay UI. Późniejsze wykrycie ukrytego zapisu w API GET rozszerzyło przydział roota: usunął `saveCdpIdentity` z GET i dodał serwerowe PUT503 po auth/expected-UID, przed body parse/stores. Store/migracje/CAS pozostają bez zmian. Opcjonalny envelope z propozycji powyżej **nie został wdrożony**. Baseline ośmiu reprodukcji zachowano w `evidence/cycle-5/cdp-baseline-fixture.json` wraz z pierwotnym source/hash/run. Nowy test w tej samej ścieżce jest acceptance contract, a nie baseline assertion.

W `lib/account-sync.ts` usunięto RAM dirty, tickets, flush queue, pagehide flush i całą ścieżkę fetch PUT. Pozostały generation/storage leases, abort waits, identity precondition i stale result fences. Publiczny `persistLearningState` jest transportowo inert; root adapter zapisuje write-ahead literal `local-unconfirmed-v1` w istniejącym REV_KEY przed publiczną mutacją synchronizowanego pola konta. Nie ma replay, ack ani automatycznego usuwania markerów. Zdalna część `clearSignedInName` została usunięta; opcjonalne bieżące local name cleanup zachowuje goal/setupDone, odrzuca guest/stale i nie pobiera tokenu.

Konto z dowolnymi learning4 bytes lub dowolnym non-null markerem (numeric/empty/malformed też) otrzymuje widok ready/localOnly, `syncIssue:'unconfirmed'` i wynik `status:'unavailable'`. Nie uruchamia getter/GET, nie nadpisuje ani nie usuwa bajtów, nie wywołuje view-ready callback. To również konserwatywna ochrona starego cache bez znanego ack; dane cloud z innego urządzenia nie zastępują go automatycznie.

Pusty własny namespace może wykonać jeden GET; aktualna, kompletna, właściwa tożsamość pozwala na prywatną hydration tylko czterech pól. Remote null staje się pustym lokalnym widokiem, bez create. Wynik `status:'ready', syncIssue:'read-only'` oraz snapshot ready/localOnly opisują dostępność odczytanego widoku, nie sukces uploadu. Same UID SDK refresh zachowuje aktywny lease; explicit rebind/cold resume wykrywa już istniejący cache i chroni go bez ponownego GET.

`hasUnconfirmedLocalData` jest sprawdzane przed getter, przed GET i po GET. `hasUnconfirmedSyncMarker` jest sprawdzane przed każdą private mutation, przed publikacją i zdarzeniami danych oraz przed callbackiem w `lib/account-session.ts`. Reentrant public write zatrzymuje kolejne private writes i onReady; fizyczny zapis wykonany wcześniej nie jest wycofywany. Same-owner status metadata nie zmienia revision/handle (implementacja adaptera należy do roota).

No-token/config, GET409/error/malformed/identity mismatch kończą się `status:'unavailable', syncIssue:'unavailable'` przy pustym cache, bez create/upload i bez obietnicy udanego cloud read. Własny cache/marker ma pierwszeństwo `syncIssue:'unconfirmed'`. SecurityError odczytu storage nie odrzuca ready promise: aktualne konto dostaje unavailable/unconfirmed; bez token getter/fetch/hydration/set/remove i bez utraty syntetycznych bajtów. Historyczne success callbacki na starej sesji nadal nie uruchamiają się po logout/switch. `AccountSync` pozostaje poza keyed boundary, getter dalej sprawdza UID przed/po SDK await, a copy trybu localOnly/syncIssue jest odpowiedzialnością wspólnej granicy roota.

### Celowany wynik autora

Polecenie: `node node_modules/vitest/vitest.mjs run tests/cycle5-cdp-author.test.ts tests/cycle3-account-author.test.ts lib/client/api-credentials.test.ts`. Vitest4.1.11, 14.10.2026 **17:23:34 Europe/Warsaw, 59/59 PASS, 3 pliki, exit0**: nowe21, legacy27, credentials11. Brak skip/filter. Credentials fixture/source nie zmieniono. Starsze testy z aktywnym PUT/retry/ack dostosowano do write-off: zachowane zero-transport, lease/token cancellation, spóźnione GET/JSON, stale A/B marker/data, exact local bytes i guest boundaries; nie oczekują już operacji, której produkt celowo nie wykonuje. Nowe21 obejmują legacy/malformed cache, write-ahead po localOnly reward, cold/warm resume, remote sibling preservation przez zero PUT, post-GET marker, marker między private writes, reentrant ready publication i blocked-storage failure.

Po dodatkowym przydziale roota dostosowano `tests/cycle4-sync-author.test.ts`, bez dalszych source edits. Wyłącznie ten plik powtórzono o **17:27:05 Europe/Warsaw: 7/7 PASS, exit0**. Zachowane guest bytes/logout/reentry; delete abortuje current CDP/Supabase lease, usuwa namespace/marker, odrzuca stary handle i nie uruchamia nieistniejącego już flush/pushera. Nie deklaruje testu oczekującego aktywnego uploadu, ponieważ ten transport jest wyłączony. Łącznie własne celowane wyniki: 59 + 7 = **66 PASS** w dwóch końcowych wykonaniach, bez powtarzania niezmienionych59.

Scoped `git diff --check` własnych istniejących sources/testów: exit0, jedynie ostrzeżenia LF/CRLF. Root wykonuje aggregate/typecheck/build/E2E osobno; ten dokument nie przypisuje autorowi tych wykonań. Zmiany API/adaptera/shared helpera są autorstwa roota. Koordynator przekazał wynik swoich27 testów (API12 + storage15 PASS); to przekazane dowody, nie wykonanie autora CDP. Niezależną recenzję API prowadzi UX.

| Plik | SHA256 frozen |
|---|---|
| lib/account-sync.ts, po finalnym findingu failed-read copy | A0753A0105F28684C95FB83D73F2CCD349046250C26E07319B0E6D95EFDF9317 |
| lib/account-session.ts | 0FF2E052EBE8A97E3112440DA108670C0A645CCC7F670D75B8ABD86575395BC1 |
| components/AccountSync.tsx | 0897040C73EF00C9CB8B5C2B29EF3804D1A6A7ADA51B5D09554E96755615FAE2 |
| tests/cycle5-cdp-author.test.ts, po finalnym findingu failed-read copy | 696178F79A174DA11D12F447DDE1E156821E0DEE980A17781385CA20DC6C4FB0 |
| tests/cycle3-account-author.test.ts | 56B2D034D0FC9E93A6431C468012846D0B0C11D6A21D43F943481A6A360698FF |
| tests/cycle4-sync-author.test.ts | 709D68CD6C73B2F5142A78B7EDCBD004EEFC45A0976D7A10F2BA058A35C7819F |
| lib/client/api-credentials.test.ts, niezmieniony | 6AF2388783396451041E7401DEC444B9033942218B2C5F8874023F48888D0DCB |

Pozostają brakujące możliwości, nie PASS: trwały cloud reconcile/upload, atomowy CAS, wielokartowy/wielourządzeniowy zapis, storage quota/interruption rollback i rzeczywiste konta/RLS/staging. Automatyczne browser CDP learning zapisy są wyłączone, a root zablokował serwerowy PUT i usunął identity write z GET. Backend store/schema nie otrzymały CAS. Nie deklarujemy ochrony każdej możliwej ścieżki backendu lub arbitralnego JS z dostępem do storage. Export/scoped delete current account pozostają istniejącymi funkcjami; nie dodano automatycznego importu, konwersji lub usunięcia.

### Finalny finding recenzenta — failed-read status

Po wcześniejszym freeze UX wykrył, że pusty cache z no-token/GET503/configured:false dostawał domyślne `syncIssue:'read-only'`, więc copy granicy obiecywało możliwość odczytu cloud mimo failure. To rzeczywista niespójność statusu, nie usterka ochrony bajtów. Root przydzielił wyłącznie małą poprawkę account-sync i własnego testu. Dodano `unavailable` do LearningSyncIssue; finishUnavailable wybiera je po strict cache check, o ile cache/marker/blocked storage nie wymusił unconfirmed. Udane GET/null nadal read-only.

Wykonano **tylko** `node node_modules/vitest/vitest.mjs run tests/cycle5-cdp-author.test.ts`: **17:44:24 Europe/Warsaw, 24/24 PASS, exit0**. Dodano trzy exact result/snapshot cases no-token/GET503/config-false oraz poprawiono GET409 assertion; każdy nie mutuje namespace. Wcześniejsze59+7 pozostają historycznymi wykonaniami; nie powtarzano45 niezmienionych cases i nie przypisujemy tym wynikom nowego pełnego aggregate/typecheck/E2E/build. Łącznie suite zawiera69 odrębnych własnych cases, ale końcowy retest dotyczy zmienionego zakresu24. Scoped diffcheck PASS, ponowny source freeze; niezależny retest UX i końcowe gates należą do innych wykonawców.
