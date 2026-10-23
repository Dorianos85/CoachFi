# B14 — mapa localStorage i projekt własności danych

2026-10-14, Europe/Warsaw. Autor: architecture_audit. Etap: **audyt kodu + projekt, bez implementacji**. Branch `codex/p0-security-consent-export`, HEAD `86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b` z lokalnymi staged/working zmianami cykli1–3. Wynik opisuje odczytany lokalny kod, nie stan produkcji ani rzeczywistą zawartość przeglądarki. Nie czytano storage, profili, env ani sekretów; nie uruchamiano instalacji, serwera, buildu lub pełnych testów. Dowód strukturalny: `evidence/cycle-4/storage-map.json`.

## Obecne klucze produktu

Wykryto20 kluczy localStorage produktu i1 sessionStorage. Wszystkie mają fizycznie wspólny namespace origin; żaden produktowy klucz nie koduje owner. B13 dodaje lease/generation dla cloud work, ale nie zmienia adresowania storage. Proponowany podział:18 personal,2 device; notification dismissal pozostaje tab preference. `E/D` oznacza klucz na aktualnej12-elementowej allowlist wybranego eksportu/usuwania w `lib/data-export.ts:7`, nie pełny eksport lub usunięcie wszystkiego.

| Klucz | Rzeczywisty reader / writer / delete | Cloud i obecne lifecycle | Projekt |
| --- | --- | --- | --- |
| `coachfi-user` | `lib/user.ts:16/26`; bezpośredni legacy reader `app/achievement/page.tsx:222`; cloud read/write; `account-sync.ts:168/170` clear name; E/D | Supabase hydrate profile i explicit profile push. CDP nie hydratuje profilu; logout przycisku czyści wspólną nazwę. | personal; free-text name/goal/setup |
| `coachfi-avatar` | `lib/avatar.ts:39/48`; Supabase write `cloudSync.ts:144`; E/D | Supabase hydrate/profile push; CDP brak hydrate/reset | personal |
| `coachfi-voice` | `cloudSync.ts:62/150`; brak aktywnego UI writer w odczytanym kodzie | Supabase profile hydrate/push; format raw string; poza E/D | personal |
| `coachfi-health-check` | `healthCheck.ts:42/55`; home/navigation/health form; E/D | Local-only; wymagane terms, żadnego cloud upload, legacy score recompute. Logout nie izoluje. | personal, zawsze local-only |
| `coachfi-consent-v1` | `consent.ts:77/92/100`; ConsentContext; E/D | Globalny rekord, strict version14.10; Supabase explicit consent append, CDP brak hydrate; nie jest server authority | personal; brak przenoszenia akceptacji między owner |
| `coachfi-mode-v1` | `ModeContext.tsx:49/63/108`; E/D | Globalne adult18+ confirmation; Supabase czyta mode do explicit profile push; nie hydratuje mode | personal |
| `coachfi-srs` | `srs.ts:56/63`; `account-sync.ts:241/242`; `cloudSync.ts:152`; E/D | CDP/Supabase cloud-only hydrate; CDP logout usuwa wspólny klucz. `getAllCards` nie sprawdza progress visibility. | personal |
| `coachfi-learn-manual` | `learningProgress.ts:34/46/56`; account/cloud hydrate; E/D | CDP/Supabase hydrate; CDP logout usuwa; view gate tylko getAllStageProgress | personal |
| `coachfi-tokens` | `tokens.ts:11/21/35`; account/cloud hydrate; E/D | CDP learning snapshot; Supabase saldo i reward deltas. CDP logout usuwa; absent default125, hidden0 | personal |
| `coachfi-streak` | `streak.ts:36/67`; account/cloud hydrate; E/D | CDP/Supabase hydrate; CDP logout usuwa; read visibility gate | personal |
| `coachfi-learning-rev` | `account-sync.ts:180/230/137` | CDP dirty marker/removal; nie przechowuje owner, RAM tickets są właściwym provenance; poza E/D | personal bookkeeping |
| `coachfi-lesson-steps` | `signInGate.ts:97/172`; lekcje money-mindset i [stage]; E/D | Globalne stepsSeen, poza cloud snapshot/hydrate/cleanup | personal |
| `coachfi-agent-ms` | `signInGate.ts:113/123`; local coach conversation | Globalny counter; modułowy cache/ticker/pagehide bez owner; poza E/D | personal |
| `coachfi-challenge` | `data/challengeQuestions.ts:294/306`; app/challenge; E/D | Local day-completion; Supabase osobny explicit challenge write, nie hydrate tego klucza; CDP brak scope | personal |
| `coachfi-crisis-actions` | `app/crisis/page.tsx:129/151` | Local done IDs + addTokens; React done cache bez owner; poza E/D | personal |
| `coachfi-family-plan-actions-v1` | `FamilyActionPlan.tsx:1458/1467` | Wykryto definicję komponentu, brak jego mount/import w aktualnym runtime; local done + reward; poza E/D | personal mimo dormant kodu |
| `coachfi-vault` | `vault.ts:28/44/56/61`; YieldVault | Route /vault zwraca ScopeUnavailable; zachowany komponent/lib, brak mount; poza E/D | personal mimo deferred Web3 |
| `coachfi-agent-text-only` | `MilaVoiceAgent.tsx:398/558` | Prywatny LiveMilaVoiceFab nie jest montowany (hard-off); poza E/D | personal dormant preference |
| `coachfi-locale-v1` | `LanguageContext.tsx:27/43`; E/D | Ustawienie urządzenia, nie jest profilem cloud | device-wide |
| `coachfi-accessibility-v1` | `AppNavigation.tsx:413/431` | highContrast/textScale, persistence errors caught; poza E/D | device-wide |
| `coachfi-notif-dismissed` | `NotificationBanner.tsx:96/103`, **sessionStorage** | Brak owner, stan zakładki/session; nie między wszystkimi zakładkami | tab preference, współdzielone między owner w tej zakładce |

Dodatkowe pośrednie consumers są w JSON. Skan obejmował również `data/`, gdzie jest aktualny challenge writer; początkowy skan tylko app/components/context/lib nie wystarczał. Komentarz cloudQueue oraz app/challenge nie jest dodatkowym CRUD caller. Nie znaleziono innych runtime callerów storage w kodzie aplikacji poza listą dowodów; to ograniczona statyczna kontrola, nie kompletność dowolnego załadowanego JS.

## SDK i dormant vendor — poza adapterem produktu

Supabase browser client `lib/supabase/client.ts:26` używa `storageKey:"coachfi-auth"`. Zainstalowany GoTrueClient zapisuje także zależne `${storageKey}-code-verifier`, a ścieżka userStorage może użyć `${storageKey}-user`; SDK korzysta z BroadcastChannel. To dane SDK/auth, nie guest/account payload. Nie czytano wartości ani konfiguracji runtime.

CDP zainstalowany kod web ma `cdp_refresh_token` (`index.web10.js:44/50`), `cdp_oauth_pending_flow_id` (`index.web114.js:2`), oraz wallet-provider persist `cdp-provider-store` (`index.web101.js:42`). Ostatni jest ścieżką embedded-wallet SDK, a jej uruchomienie w obecnym produkcie jest niesprawdzone; `createOnLogin:false` nie dowodzi kompletnej nieosiągalności wszystkich SDK paths. `webStorage.clear()` istnieje w SDK, ale brak wywołania przez własny kod aplikacji w odczytanym zakresie. Adapter/eksport/delete nigdy nie enumerują, kopiują ani usuwają tych kluczy.

Nieaktywny `public/elevenlabs/convai-widget.js` zawiera language preference, `elevenlabs_convai_user_id`, dynamiczny terms_key i dynamiczny logger storage. LiveMilaVoiceFab jest hard-off, więc ta obecność nie dowodzi aktualnych zapisów ani zgody na fingerprinting. Nie wykonano widgetu. Klucze/dynamiczny vendor storage pozostają poza produktem i poza gwarancją adaptera.

## Lifecycle, events i cache

Supabase B13: auth callback synchroniczny; lease w `session-sync.ts`, initial sync odroczony macrotaskiem. Udany login hydratuje7 wspólnych produktowych kluczy, pusher dopiero po sukcesie. TOKEN_REFRESHED/SIGNED_IN tego samego aktualnego UID zachowuje lease/pending changes. Logout/UID switch/cleanup kasuje timers i abortuje cloud work, ale nie izoluje zachowanego lokalnego profilu/health/zgód. Przy błędzie cloud read poprzedni globalny stan może zostać; nie ma seed ani full synced success.

CDP B13: `account-sync.ts` ma active/resumable context, WeakMap leases, dirty tickets, queue, generation i guarded waits. Udany pull zapisuje4learning keys; pierwsza tożsamość nie importuje guest, konto bez state otrzymuje tylko `{version:1}`. Same-owner refresh zachowuje wyłącznie znane dirty writes. Znany logout/UID switch usuwa4learning+rev ze wspólnych raw keys; to może zniszczyć poprzednie bajty gościa, bo fizyczny storage nie rozróżnia owner. `AccountSync`/AppNavigation logout dodatkowo wpływają na visibility/name. Health nie jest częścią cloud allowlist i legacy health push jest hard-off.

`app/providers.tsx:26` wyłącza Supabase przy CDP project branch. To lokalna kompozycja jednego owner auth; odrębne montowanie providerów, SDK cross-tab state i historyczne dane nie są pełną gwarancją izolacji.

Events: `coachfi-user`, `coachfi-learning`, `coachfi-tokens`, `coachfi-health-check`, `coachfi-cloud-synced`, `coachfi-consent-change`. Część UI słucha generic `storage`, część tylko wybranych events lub mount. `ProgressPath` słucha learning; home słucha health/cloud/consent/storage, ale nie learning. ModeProvider i LanguageProvider czytają przy mount; ConsentProvider ma consent/storage/cloud listener. `AvatarDisplay`, health-check draft, review queue i challenge/crisis stan nie mają owner reset.

Modułowe cache wymagające kontraktu: `signInGate.ts` (storedAgentMs, agentLoaded, activeSince, openConversations, ticker, pagehideBound, signInRequested/listeners), `progress-visibility.ts` (visible), `syncQueue.ts` (pusher), `account-sync.ts` (active/resumable/dirty/queue), `session-sync.ts` (current/generation/timers), `api-credentials.ts` (tokenGetter/registrationEpoch), `notifications.ts` (scheduledTimers). React caches obejmują także Consent/Mode/Streak context, AppNavigation metrics, Onboarding name/goal, AvatarDisplay, HealthCheck draft/result, QuizCard rewarded/selected, Review dueIds/results, challenge completion i Crisis done, dormant Family/Vault/LiveMila. Samo namespacowanie storage nie kasuje starego draftu ani nie chroni przed callbackiem, który po await pobrał nowy current handle.

## Minimalny projekt API i bootstrap — do uzgodnienia przed implementacją

Moduł domyślnie **pending**, owner/revision tylko w RAM konkretnej zakładki. Żaden trwały active-owner pointer. SSR/pending nie czyta osobistych guest/account values i nie zapisuje. Root ustala konfigurację przed pierwszymi odczytami osobistego UI: brak skonfigurowanego auth może jawnie otworzyć guest; skonfigurowany backend pozostaje pending aż SDK potwierdzi guest/account. Disabled Supabase w CDP branch nie otwiera sam guest scope.

```ts
type StorageOwner = { kind: "guest" } |
  { kind: "account"; provider: "supabase" | "cdp"; userId: string };
interface PersonalStorageHandle {
  readonly revision: number;
  readonly owner: StorageOwner | null;
  isCurrent(): boolean;
  getItem(key: PersonalKey): string | null;
  setItem(key: PersonalKey, value: string): boolean;
  removeItem(key: PersonalKey): boolean;
  release(): void;
}
interface StorageOwnerLease {
  readonly owner: StorageOwner;
  readonly revision: number;
  readonly storage: PersonalStorageHandle;
  isCurrent(): boolean;
  publishReady(options?: { localOnly: boolean }): boolean;
  release(): void;
}
initializeStorageOwnership(authConfigured: boolean): void;
beginStorageOwner(owner: StorageOwner): StorageOwnerLease;
captureCurrentPersonalStorage(area?: "local" | "session"): PersonalStorageHandle;
getStorageOwnershipSnapshot(): StorageOwnershipSnapshot;
getStorageOwnershipServerSnapshot(): StorageOwnershipSnapshot;
subscribeStorageOwnership(listener: () => void): () => void;
eraseCurrentPersonalData(expectedReadyHandle: PersonalStorageHandle): boolean;
```

`PersonalKey` to jawna18-elementowa allowlist z tabeli; unknown/SDK keys nie mają fallback. Guest handle adresuje istniejący raw logical key; account handle deterministyczny namespace, np `coachfi-owned:v1:<provider>:<encoded-uid>:<logical-key>`. Dokładny format należy zatwierdzić/testować pod kątem kolizji. Brak copy/parse/re-serialize/import guest; zachowujemy dokładny string i odróżniamy absent/null od pustego string. LocalStorage jest magazynem stringów: „zachowanie bajtów” oznacza identyczną wartość serializowanego string, nie gwarancję fizycznego kodowania dysku. Stary raw ma nieznaną historyczną proweniencję; przypisanie do guest namespace nie dowodzi, że zawsze powstał jako gość.

`beginStorageOwner` unieważnia wcześniejszą revision i wchodzi pending dla nowego owner. Lease.storage jest dostępny tylko synchronizatorowi znanego owner do hydration; current UI handle pozostaje zablokowany do publishReady. Stale/pending reads zwracają null, writes/removes false; quota/blocked errors propagują, true oznacza zakończony aktualny zapis. Checks przed i po get/set/remove; quota/reentrant change nie obiecuje rollbacku wcześniejszych writes. Same UID refresh zachowuje aktualny lease; logout/switch/cleanup unieważnia przechwycone handle przed await, a potem ustawia znany nowy scope. Stary release jest noop, nigdy nie zmienia nowszego owner. Po failure/no token dla znanej tożsamości koordynator zatwierdził account READY LOCAL ONLY i pusher off; nie otwieramy guest. Snapshot jest stabilnym obiektem `{status,owner,revision,localOnly}`, SSR ma stały pending; personal UI boundary nie montuje się w pending, SDK/binder jest poza nią. Device keys mogą być czytane guarded globalnie, ale tylko18personal keys mają set/remove przez adapter.

Zdarzenie `coachfi-storage-owner` albo subscribe informuje o pending i ready; po pending każdy personal cache/draft/reset musi usunąć dane poprzedniej osoby, anulować voice/chat/timers i stare submit/reward handlers. React helpery muszą przekazywać handle przechwycony wraz z draftem/revision; pobranie nowego current handle po await mogłoby zapisać dane A pod B. Cloud guard sprawdza zarazem aktualność auth i storage lease, a hydration/push używa tylko związanej przestrzeni. Nie przechowujemy tokenów/email w owner metadata.

Guest → A → guest przywraca widok tych samych raw guest values, bez kasowania lub importu. A→B nie sięga do A/guest. Account health pozostaje local-only w odpowiednim namespace. Eksport i delete dostają current ready handle i exact allowlist, bez `Storage.length/key` lub enumeracji innych namespace/auth. Root powinien jawnie zdecydować zakres delete18personal vs obecne12selected oraz retencję account namespace po logout; detach chroni widok, ale sam nie usuwa danych z urządzenia. Dormant family/vault/text-only proponujemy izolować bez włączania funkcji. Device locale/accessibility i tab notification preference nie zmieniają owner.

## Ryzyka i kryteria przyszłej weryfikacji

Sprawdzone z kodu: wspólne physical keys, niepełne UI/cache resets, global agent timer, selected export/delete omissions i direct bypass readers. Prawdopodobne bez execution: przejście guest→account nadpisuje guest learning; logout usuwa je; stale draft może trafić do nowego owner, jeśli caller pobierze nowy handle. Nie wykonano tego na prawdziwych danych.

Quota/blocked storage: wiele obecnych writerów rzuca, niektóre catch utrzymują tylko RAM. Namespace nie jest transakcją, może zwiększyć zajętość wielu lokalnych kont; trzeba fail-closed bez utraty guest i bez false saved/synced. Bez obietnic maksymalnej pojemności lub rollbacku.

Many-tab: owner pozostaje per-tab; `storage` notification dla cudzej przestrzeni nie zmienia owner. Ta sama osoba w dwóch kartach nadal ma read-modify-write i last-writer conflicts; snapshot GET→PUT nie jest CAS. SDK współdzieli auth storage/zdarzenia; dwie różne tożsamości w osobnych kartach wymagają kontrolowanego testu, którego tu nie wykonano. Namespace nie jest barierą przed dowolnym same-origin JS/XSS, uprawnieniem serwera, szyfrowaniem ani testem RLS.

Plan synthetic cases (niesprawdzone na tym etapie): malformed raw guest string/whitespace/`00125`/absent/empty zachowane przez guest→A→B→guest; configured boot pending0reads0writes; same-owner refresh zachowuje current handle; A→logout→A nowa revision; late async/timer callback i old release bez zapisu do B; cloud-only hydration nie dotyka guest; quota przy każdym kroku bez guest loss/success; owner event reset wszystkich caches; export/delete current-only bez SDK/other account keys; health0cloudcalls; raw storage caller guard; mocked storage events dwóch owner bez przełączania i jawny same-owner konflikt.

## Proponowany podział dalszej implementacji

Pierwsza mapa nie upoważniała do source edits. Następnie root jawnie przydzielił implementację: architecture_audit — adapter, sync lifecycle, learning persistence helpers/data challenge i author tests; curriculum_pilot — pozostałe personal helpers/context/UI reset; root — bootstrap/provider boundary, export/delete i render-bound hook. Osobny recenzent każdego autora. Mapa dokumentuje stan przed implementacją; rezultat/testy nowego adaptera wymagają osobnego raportu. Root zatwierdził delete exact18personal z obu storage w current namespace, po invalidation do pending tego samego owner; guest/auth/global/other-account nie są dotykane, reentry nie daje sukcesu.

## Wynik implementacji po odrębnym przydziale root

2026-10-14 16:23:21+02:00: **autor freeze**, do niezależnej recenzji ux_audit i bramek root. Mapa49 plików powyżej jest historycznym baseline przed implementacją; bieżące fingerprinty są niżej oraz w implementation JSON. Zmieniono13 źródeł, dodano2 suites i zaadaptowano2 istniejące suites; account-session.ts pozostaje niezmienionym wrapperem, którego lease guard dziedziczy teraz storage ownership.

Adapter lib/product-storage.ts ma18personal keys i2global read-only device keys, stable SSRpending, captured views local/session i RAM revision/owner. Guest korzysta z nietkniętych dotychczasowych raw strings; account z provider+encodedUID namespace. Private lease.storage pozwala hydration podczas pending, current UI capture jest ready-only. Release current fencuje pending, old release jest noop. Erase rezerwuje nową revision pending tego samego owner, emituje cancellation, usuwa18keys z obu obszarów, a quota/blocked failure oznacza ephemeral failure:erase-failed i pozostaje pending; root pokazuje błąd zamiast fałszywego sukcesu.

CDP/Supabase używają storage lease w guardach i tylko jego namespace do hydration/explicit pushes. Błąd chmury/no token przy znanej tożsamości daje account ready/localOnly z wyłączonym pusher/dirty cloud path; guest nie jest fallbackiem tego konta. Logout otwiera nowy guest i nic automatycznie nie kasuje. AccountSync sameUID refresh zachowuje lease dzięki delegacji getter przez latest ref i efektowi powiązanemu z tożsamością; Supabase zachowuje istniejący lease na token refresh/SIGNED_IN. Signout/null callback ma reentry guest snapshot check przed zerowaniem state/SDKcall. Header logout i keyed boundary są zmianami root, personal UI/helpery zmianami curriculum_pilot.

Learning/challenge/vault setter ma opcjonalny capturedHandle jako ostatni argument; stale/unready rzuca przed write/notify/success, a quota propaguje. Recheck po event zapobiega użyciu nowego pushera przez stary reward. Modułowy signInGate clock/ticker/conversation/cache resetuje się na revision, pagehide nie przenosi starego czasu. Direct storage calls w autorskich learning/sync helperach usunięto; właściwym miejscem fizycznego dostępu jest adapter.

Końcowy command `node node_modules/vitest/vitest.mjs run tests/cycle4-storage-author.test.ts tests/cycle4-sync-author.test.ts tests/cycle3-supabase-author.test.ts tests/cycle3-account-author.test.ts`: **77/77 PASS**, 16:20:56, exit0, Vitest4.1.11. Breakdown16+7+27+27. Z wcześniejszego68/70 run poprawiono2 stare fixture assumptions (guest token widoczny w failed account oraz account health sprawdzany pod raw guest); nic nie pominięto. W27 Supabase pozostają3 testy rzeczywistego installed SDK z synthetic custom fetch. To lokalne deferred mocks/fake timers, nie prawdziwe konta/przeglądarkowy storage. Scoped git diffcheck exit0, wyłącznie ostrzeżenia LF→CRLF.

Nie uruchomiono przez autora full tests/TS/build/E2E/install/server/cloudcalls; bramy root i niezależny werdykt są oddzielnymi dowodami. Nie twierdzimy pełnej izolacji same-origin JS/SDK, RLS, wielu kart lub cloud deletion. Account namespace zachowuje lokalne bajty po detach do jawnego delete; nie oznacza to skasowania konta/remote danych. Cold-reload offline dirty provenance/CAS, quota i partial delete pozostają ograniczeniami bez transakcyjnego rollbacku.

| Plik | Freeze SHA256 |
| --- | --- |
| `lib/product-storage.ts` | `1CD7C12D61750C88D7D58E7D92370844049D6FE0A1E512087F6ECB14E06191F9` |
| `lib/account-sync.ts` | `7798FF9807EE7271AA658BEBA2129CD09AFE9267336DE6E00BA5F90D09C84031` |
| `lib/account-session.ts` | `B31F6EBEAFCC36FDDD325893A7D8702F46CB5CDA5BC350B5C37420038EBB3293` |
| `lib/sync/cloudSync.ts` | `5939E6D93608E2360894745CC746E44379A2F47F2C3A32E4C13919427AB9D2E0` |
| `lib/sync/session-sync.ts` | `89327304690DE2E67ABB4A75269D489E741448B54BEE9914547406827E6F121E` |
| `context/AuthContext.tsx` | `E4282D809A8641784B397F6D11DEE2CCBCDE99596486B58CC501A1E06563962B` |
| `components/AccountSync.tsx` | `CF0DA2B1ADCE3F31428697AE92E636270E91532D196AAE48A157C8FF3D07E1C4` |
| `lib/srs.ts` | `622163D90006A6AEAD3F3632C8A18AAA3945064BFB4405B88AE2391B5F4818E6` |
| `lib/learningProgress.ts` | `1C4CDBD47BE3D1446BB0184BF8A22985C2351B9F3D52310626CD6F94ED0985DA` |
| `lib/tokens.ts` | `3FDBF1D29BCBC5E145E6F4F4D7BE7ADFBC2E9AFBCD6DDA21988930E89ED87AA9` |
| `lib/streak.ts` | `36AF295AFD55746A744D191DA1B4F55BEE6FD552B97E99830E8714CEB95F564E` |
| `lib/signInGate.ts` | `4905A6C9D1C3E56AD4E29A5DC14275F8D164A88AA10FFC2524552BB2CB2D3BC8` |
| `lib/vault.ts` | `0CF2072633984091C000DE4CEC14D3483640D5967114EC733D336A66C1179A20` |
| `data/challengeQuestions.ts` | `0E7D6E98818F2337A1A214C63318AC60FF009743AEAAC5F6416AFB8964FCF5CE` |
| `tests/cycle4-storage-author.test.ts` | `691F7DF854A0AF81995FC69065D55BA887FB959EA94DE2B8DC56BC3DD46DBC4C` |
| `tests/cycle4-sync-author.test.ts` | `25E7F79005F34677BAB6CC5C0A1DC7A4E25ED6D394640F8F1D04905497691002` |
| `tests/cycle3-supabase-author.test.ts` | `E8289129F16A114D912C91B5FB2D1B35FEB66F2AF29D2416D5897219A3A8E58A` |
| `tests/cycle3-account-author.test.ts` | `148C58A6A1AF95E3866C5B2BA58A02B5D6C8C26A141E8F8EB22CF90A7F63DFA2` |

