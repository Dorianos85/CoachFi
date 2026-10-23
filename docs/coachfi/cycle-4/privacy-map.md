# B14 — mapa prywatności i własności lokalnych danych

14.10.2026. Autor `curriculum_pilot`; niezależny recenzent `ux_audit`. **Część audytowa opisuje baseline przed edycją aplikacji; dopisek autoryzowanej implementacji znajduje się na końcu.** Repo `source/CoachFi`, baza `86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b`, gałąź `codex/p0-security-consent-export`, zachowane lokalne P0/cykl 2/B13. Nie jest to audyt wdrożonej produkcji ani prawna ocena zgodności. Rynek Polska, dorośli, PL/EN.

Odczytano wyłącznie kod i lokalne dowody syntetyczne. Bez odczytu sesji, browser storage, środowiska/sekretów, bazy, sieci, install, serwera lub buildu. Autor nie uruchamiał testów w tym etapie. Zastosowano `coachfi-privacy-compliance` i `coachfi-data-integrity`; kwestie prawne i realne procesy praw pozostają do oddzielnej oceny człowieka. Pełna mapa maszynowa, pola, źródła i 53 fingerprinty: [privacy-map.json](../../../evidence/cycle-4/privacy-map.json).

## Wynik audytu i zakres dowodów

B13 blokuje skutki spóźnionych zadań poprzedniej sesji. **Nadal nie ma własności lokalnych rekordów:** profile, diagnoza finansowa, zgoda i postęp mają wspólne klucze. Nowa, poprawna hydratacja konta pisze do tych samych learning keys co gość, a część UI nie resetuje stanu przy zmianie tożsamości. Konto B może otrzymać właściwy postęp B i jednocześnie widzieć lokalną diagnozę lub preferencje zgody wcześniejszego użytkownika urządzenia.

Sprawdzone źródłowo: readers/writers, schematy i wywołania w tabelach. Niezależnie odtworzone syntetycznie przez UX: cztery baseline cases w [cycle4-provenance-review.test.ts](../../../tests/cycle4-provenance-review.test.ts), [wynik 4/4](../../../evidence/cycle-4/review-baseline-tests.json) i [zakres baseline](../../../evidence/cycle-4/review-baseline.json). **PASS tych czterech testów oznacza odtworzenie niepożądanego zachowania, a nie przyjęcie B14.** Odtworzono utratę bajtów gościa, dostęp do profile/health/consent A przy błędzie B, mieszany eksport i brak invalidacji lease przez sam helper delete. Faktyczne reload/unload i UI browser nie były w tych fixtures symulowane jako rzekomy dowód.

## Faktyczne dane, readers i writers

`health` oznacza tu diagnozę finansową, nie zbieranie nowych danych medycznych. `source`, waluta i wersja wyniku określają format/pochodzenie obliczeń, ale nie osobę będącą właścicielem.

| Rekord / pola | Writers i lokalny magazyn | Readers / cache | Konto lub cloud teraz |
|---|---|---|---|
| `coachfi-user`: name, goal, setupDone | [saveUser](../../../lib/user.ts:24), onboarding; Supabase hydration nadpisuje globalny key; CDP logout czyści lokalnie tylko name | getUser; shell; onboarding; nazwa do share quiz; dormant leaderboard/Mila/achievement | `notifyCloud(profile)` → gotowy Supabase pusher upsert profiles. CDP learning path nie seeduje local profile; własny remote snapshot może zachować remote profile. |
| `coachfi-health-check`: 5 kwot, 4 deklaracje Boolean, cel, score/components/groups/ratios, wersja, data, source, PLN lub legacy_unspecified | [saveHealthCheck](../../../lib/healthCheck.ts:48) lokalnie; storage failure nie ogłasza sukcesu | getter z required terms; Home, shell, health form/card; exporter używa niezależnego normalizera | **Brak uploadu.** persistHealth=false; Supabase `healthCheck` wychodzi przed reads/DB; CDP snapshot odrzuca health. |
| `coachfi-consent-v1`: version, acceptedAt, terms/privacy, optional aiCoach/voice/leaderboard/blockchain | [writeStoredConsent](../../../lib/consent.ts:88), clear helper, ConsentProvider/Manager | global getter; cached ConsentContext i dialog; health; credential bridge; chat/voice | Jawna aktualizacja przy gotowym Supabase pusherze zapisuje consents rows. Nie ma cloud consent pull. CDP snapshot nie stanowi consent ledger. |
| `coachfi-srs`: id, interval, nextReview, repetitions, easeFactor | [saveCards/recordAnswer](../../../lib/srs.ts:61); CDP i Supabase hydration do tych samych keys | getAllCards/getDueIds; Home, QuizCard, Review, stage path, sign-in gate | Gotowy CDP GET/PUT account snapshot; Supabase srs_cards. `getAllCards` nie sprawdza progressVisible. |
| `coachfi-learn-manual`: stage → started/completed | markStageStarted/Completed; oba backendy hydration | stage progress / ProgressPath | CDP learnManual lub Supabase stage_progress; brak ownera raw key. |
| `coachfi-tokens`: liczba punktów | add/spend, oba backendy hydration | token getter (visibility guard), shell/rewards i cached quiz/crisis/challenge | CDP tokens; Supabase delta reward_ledger oraz pull reward_balances. Punkty edukacyjne, bez wartości pieniężnej. |
| `coachfi-streak`: lastActiveDate, currentStreak, longestStreak | markActiveToday, oba backendy hydration | getStreak (visibility guard), StreakContext cache | CDP streak lub Supabase streaks. |
| `coachfi-learning-rev`: marker rewizji | current CDP writer/PUT/owned cleanup | Obecna dirty Map/tickets w RAM określa upload; dawny raw marker sam go nie uprawnia | Nie jest wysyłany jako dane konta ani eksportowany. |
| `coachfi-lesson-steps`, `coachfi-agent-ms` | [signInGate](../../../lib/signInGate.ts:110): kroki lekcji i cached duration/ticker/pagehide | lekcje, optional sign-in gate; duration ma module cache | Nie należą do obecnych czterech learning fields CDP ani Supabase pull/push. |
| `coachfi-avatar`, `coachfi-voice` | saveAvatar; Supabase hydrate avatar/legacy voice_id | avatar editor/display; voice_id legacy profile path | Jawny `profile` mirror obejmuje avatar/voice. Obecny local speech nie korzysta z ElevenLabs voice_id. |
| `coachfi-mode-v1`: mode, selectedAt, adultConfirmedAt, adultAgeRequirement=18 | [ModeContext](../../../context/ModeContext.tsx:73), resetMode | cached ModeProvider, mode dialog; ścisły walidator 18+ | notify profile mirror zapisuje mode string; nie pobiera potwierdzenia 18+ z konta. Jest to self-declaration, bez weryfikacji wieku. |
| `coachfi-challenge`: date; `coachfi-crisis-actions`: IDs wykonanych działań | challenge marker, Crisis.markDone | daily completed flag, crisis done/reward cache | Challenge wysyła istniejący payload completion do gotowego Supabase; crisis tylko generic reward delta. |
| `coachfi-family-plan-actions-v1`: action → Boolean | legacy FamilyActionPlan.toggleStep | mount cache completed/earned | Komponent nie ma obecnego wywołania w app; health flow odpiął go w cyklu 2. Odłożony, bez reaktywacji. |
| `coachfi-locale-v1`, `coachfi-accessibility-v1`, session `coachfi-notif-dismissed` | LanguageContext; shell highContrast/textScale; NotificationBanner dismissal | język/display/prompty urządzenia | Preferencje urządzenia, brak obecnego mirroru tych keys do konta. |

Każdy raw record pozostaje do nadpisania/usunięcia; nie znaleziono local TTL. Nie odczytano retencji bazy, kopii ani regionów dostawców. Dane trzymane tylko w RAM: health draft, onboarding name/goal, consent draft, quiz/review state, wpisany dochód IncomeJarPlanner oraz chat messages/input/apiHistory. RAM nie jest w selected-local eksporcie. Czas trwania może jednak trafiać do `coachfi-agent-ms` przez istniejący sign-in bookkeeping.

## Konto i odbiorcy

[Providers](../../../app/providers.tsx:25) wybiera istniejącą gałąź CDP albo alternate Supabase AuthProvider; nie działa już równocześnie dwóch backendowych pisarzy. Nie czytano konfiguracji. AccountSync rzeczywiście działa w CDP branch — `persistProgress:false` nie jest globalnym wyłącznikiem jego kolejki.

CDP `/api/account` weryfikuje Bearer i oczekiwany UID, przed storage. GET dodatkowo zapisuje istniejące metadane identity zwrócone przez CDP: UID/email/display name/provider/timestamps, dotychczasowe adresy i profile JSON; jest to odrębny przepływ od czterech learning fields. [Account store](../../../lib/account-store.ts:63) w kodzie produkcyjnym wybiera Supabase service storage, w dev może SQLite. To wniosek z kodu, bez potwierdzenia działającej konfiguracji, bazy lub regionu. Nie rozszerzamy danych, celów ani wallet scope.

Alternate [Supabase sync](../../../lib/sync/cloudSync.ts:125) pobiera cloud profile/avatar/voice/SRS/stages/streak/points, pisząc do globalnych keys po current session fences. Wszystkie odczyty muszą być udane. Błąd nie uruchamia seed. Pusher instaluje się dopiero po hydratacji; jawne późniejsze aktualizacje mogą trafiać do istniejących tabel. Wylogowanie unieważnia kolejkę, ale nie ustanawia właściciela pozostających raw danych.

AI/TTS/ConvAI pozostaje hard-off. [Mila live child](../../../components/MilaVoiceAgent.tsx:337) się nie montuje, a chat ma external=false i lokalny fallback. Odczyt dostępności korzysta wyłącznie z browser `localService===true` po kliknięciu. Historyczne readers dormant leaderboard/Mila/achievement/vault nie dowodzą aktywnego transferu: feature/route gates nadal blokują Kids/Web3/marketplace/ranking. Scope-false AppNavigation nie montuje deferred route children.

## Cache i miejsca, gdzie A może pozostać po B/logout/failure

| Aktywna ścieżka / źródło | Obecny cache/subskrypcja | Ryzyko i potrzebny reset |
|---|---|---|
| [Home](../../../app/page.tsx:138) | health score/3 kwoty i answered count; health/cloud/consent/storage events; nie learning/tokens | Inna identity nie zmienia globalnego health. CDP learning events nie odświeżają count Home; po logout może zostać licznik A. Scope transition musi wyzerować dane i odczytać tylko current namespace. |
| [Shell](../../../components/AppNavigation.tsx:440) | name/health/tokens/due; szeroki zestaw product events i storage, bez owner subscription | Nawet poprawny refresh odczytuje globalne profile/health/consent A. CDP logout czyści name, ale pozostawia goal/setup/health/consent. Supabase logout nie usuwa raw profile. |
| [Health page](../../../app/health-check/page.tsx:101) | initial read tylko `[loaded]`; draft/result/dirty/errors | Po B lub usunięciu raw record stary result/draft może pozostać. Required withdrawal chowa kartę, ale nie czyści kwot w polach. Reaccept może odsłonić cached card. Scope/deletion/withdrawal reset musi blankować draft i wynik. |
| [ConsentContext/Manager](../../../context/ConsentContext.tsx:41) | global consent, requiredAccepted, dialog optional/required | Inne konto dziedziczy global true; cached `updateOptional` z consent A nie dowodzi zgody B. Storage listener literal global key będzie wymagać dopasowania namespace; settings draft musi mieć własny epoch. |
| [Onboarding](../../../components/OnboardingModal.tsx:17) | enabled-only effect; name/goal/step/open | Stary A draft może zostać zapisany przez handleNext/Skip do current B po re-renderze bez nowego epoch. |
| [Avatar editor/display](../../../app/avatar/page.tsx:274) | mount-only avatar fields; saved timeout; AvatarDisplay mount-only avatar/stages | Save/timeout może pokazać sukces starej edycji. Wymagane current scope i reset. |
| [QuizCard](../../../components/QuizCard.tsx:100), [quiz](../../../app/quiz/page.tsx:141) | pytanie/selected/submitted/rewarded; token/result/share; reset zależy od locale/topic | Nie mają identity reset; stale submit/reward/completion może zasilić B lub pokazać wynik A. |
| [Review](../../../app/review/page.tsx:303) | dueIds/results/revealed/confetti; reset locale | Deck i odpowiedzi A mogą zostać w UI; handler recordAnswer oraz timeout wymagają epoch sesji. |
| [Challenge](../../../app/challenge/page.tsx:50), [Crisis](../../../app/crisis/page.tsx:126) | local completion/done/reward counters; locale lub mount-only | Flag/reward cache przechodzi między actorami. Crisis clipboard completion także może ogłosić sukces po zmianie UI. |
| [ProgressPath](../../../components/ProgressPath.tsx:69), rewards, StreakContext | learning/tokens/cloud/storage częściowo | Events są potrzebne, lecz obecne raw getter nadal nie ustalają ownera; StreakContext nie słucha storage. Timer notification może pamiętać serię poprzedniego użytkownika. |
| [Chat](../../../app/coach/page.tsx:94), VoiceContext | chat RAM/history reset locale; consent event zatrzymuje stream, lecz zostawia messages; voice consent event stop | B może widzieć tekst wpisany przez A nawet bez provider calls. Scope musi czyścić input/history/messages i anulować lokalny speech/timery. |
| [IncomeJarPlanner](../../../components/IncomeJarPlanner.tsx:462) | wpisany dochód tylko RAM | Nie zbiera się go trwale, ale długowieczny mounted panel może pokazać A amount po B; reset RAM. |

W tabeli opisano sprawdzone zależności kodu i możliwe skutki; **nie zadeklarowano wykonania browser reprodukcji tych wszystkich ekranów.** Independent baseline sprawdza actual getters i eksport, a nie React UI.

## Eksport, usuwanie i wycofanie — obecny kontrakt

[Exporter](../../../lib/data-export.ts:174) ma `version:1`, `scope:selected_local_product_data` i **dokładnie 12 keys**, odczytując localStorage i sessionStorage niezależnie. Sanityzuje po znanych polach/ID i omija credentials/SDK/session/unknown keys, dowolne nested fields oraz tekst name/goal. Profil eksportuje tylko setupDone. V2 health jest przeliczany z bezpiecznych inputs i zawiera wersję/source/currency/groups/ratios; goal jest używany do przeliczenia, lecz nie kopiowany. Legacy export pozostaje oznaczony legacy_unspecified. To nie raw backup ani pełny eksport konta; mixed B learning + device/A health jest dziś możliwy bez provenance.

Wybrane keys: SRS, learn-manual, lesson-steps, tokens, streak, health-check, locale-v1, avatar, user, challenge, mode-v1, consent-v1. **Pomijane także:** learning-rev, agent-ms, voice, crisis-actions, family-plan-actions, accessibility, notif-dismissed. Ta różnica ma pozostać jawna; nie nazywać operacji usunięciem wszystkich danych produktu.

[DataSafetyPanel](../../../components/DataSafetyPanel.tsx:89) usuwa te same dokładne keys lokalnie i w sessionStorage; ogłasza consent event, następnie reload. Nie wylogowuje/nie invaliduje account lease jako część helpera i nie wywołuje account DELETE. Copy PL/EN uczciwie mówi, że synchronizacja może pobrać konto ponownie. Storage failure może pozostawić częściowo usunięty zbiór bez reload; obecne same-document caches nie są wtedy kompletnie odświeżone. Nie wykonano realnego unload testu.

`/api/account DELETE` istnieje i usuwa app-owned account/progress/state/certificate rows; DataSafetyPanel go nie używa. Nie jest dowodem usunięcia CDP auth identity, alternate Supabase profile/SRS/consent tables, kopii albo wszystkich danych dostawców. Nie obiecywać pełnego account delete/export bez odrębnego procesu.

Wycofanie optional przez false zapisuje bieżący, ścisły record i natychmiast ogłasza event zatrzymujący aktywną pracę/cache voice i chat; nie usuwa historycznych provider records. Gotowy Supabase może zapisać false consent row. Required acceptance można usunąć helperem lub wybranym local delete; nie znaleziono osobnego przycisku required withdrawal w managerze. Getter health zwraca null bez acceptance, ale zapisane raw diagnosis pozostaje. Nie jest to żądanie usunięcia danych.

PL/EN [privacy draft](../../../app/privacy/page.tsx:34) nadal opisuje AI/TTS/ranking/blockchain jako aktywowane zgodą i ogólny lokalny eksport, podczas gdy wydanie je wyłączyło, a export jest selected/sanitized. Do późniejszej korekty copy według faktycznie dostępnych funkcji; administrator/contact/retention/request handling oraz właściwe podstawy przetwarzania wymagają osobnej oceny. W tym source-only etapie nie badano aktualnego prawa przez sieć i nie publikowano polityki.

## Minimalny model przyjęty kierunkowo do kontraktu

Root przyjął: **account prefix per `{provider,uid}`, raw legacy guest byte-preserved, per-tab RAM active scope, brak persistent active pointer, pending fail-closed.** Dokładne API/format prefixu i implementacja pozostają do przydziału. To propozycja do wdrożenia, nie opis już działającej funkcji.

1. Jedno źródło RAM scope: pending / guest-legacy-device / account `{provider,uid}` oraz epoch. Przy skonfigurowanym backendzie pending obowiązuje, zanim tożsamość będzie znana. UI nie czyta personal raw keys ani nie autoryzuje zapisu w pending. Source configuration jest wykrywana przez istniejącą bramkę; nie dodawać providerów.
2. Legacy raw keys zostają magazynem guest/device. Login/GET/PUT/logout/user switch **nie parsuje i nie serializuje ich ponownie ani ich nie usuwa**. Test obejmuje dokładne bytes, whitespace, `00321`, malformed JSON, absent vs empty. Pochodzenie historycznych globalnych bytes jest nieznane; nie przypisuje się ich automatycznie do konta lub named actor.
3. Konto używa wyłącznie swoich dokładnych physical keys. Przykład formatu, nie finalne API: `coachfi-account-v1:${provider}:${encodeURIComponent(uid)}:${logicalKey}`. Provider allowlist i jednoznaczna enkodacja UID muszą zapobiegać kolizjom. Account read nie ma fallbacku guest/A. Cloud-only hydration zapisuje wyłącznie matching namespace, zachowując B13 lease/abort/dirty fences. GET failure nie jest empty/seed i nie przywraca dawnych A danych.
4. Personal keys obejmują profile/health/consent/avatar/voice/adultMode, cztery learning fields+rev/lesson-steps/agent-ms/challenge/crisis/family. Family pozostaje deferred. Locale/accessibility/notif-dismiss to deviceprefs. Diagnoza health pozostaje lokalna również pod account prefixem; **bez health upload, nowych danych lub celów**.
5. Writer przyjmuje **przechwycony expected epoch/scope** z otwarcia form/dialog/session, a nie tylko scope odczytany w momencie starego click. Sprawdza go przed read→modify→write→notify i po write/event przed ogłoszeniem sukcesu. Stale/pending operacja kończy się bez zapisania do B. Zgody i 18+ self-declaration nie dziedziczą globalnego true nowego actor; brak current record oznacza brak required acceptance i optional false.
6. Zmiana scope synchronicznie ogłasza invalidację caches i przerywa speech/chat/timery. Personal React state resetuje się do blank/default, a dopiero ready reread używa own namespace. Może to być adapter subscription + boundary remount; shell/context położone poza boundary też muszą subskrybować scope. Sam namespace bez resetu React state jest niewystarczający. Same-owner token refresh nie jest automatycznie nowym actor; preserve dirty wymaga jawnej polityki epoch.
7. Cross-tab storage refresh dotyczy tylko matching namespace/deviceprefs. Event innej karty nie przełącza RAM ownera. Epoch/provider/uid są metadanymi istniejącego auth, nie nowymi polami personal; nie trafiają jako credentials/identity do export lub DOM event.
8. Root projektuje selected export/delete dla **przechwyconego current scope**, nadal z field sanitation. Nie ma skanowania/wildcard kopiowania prefixów, autoeksportu innych kont lub usuwania gościa przy account delete. Minimalne provenance w pliku może opisać current guest/account storage i provider **bez UID/email/token**; nie jest kompletnym cloud exportem. Przed selected deletion invalidate work danego scope; po partial failure UI reset musi odpowiadać faktycznie usuniętym rekordom, bez false success.

Gość oznacza lokalne dane urządzenia, nie zweryfikowaną osobę. Namespace zapobiega automatycznemu mieszaniu kont, ale nie uwierzytelnia anonimowej osoby używającej wspólnej przeglądarki. Retencja/conflict control między urządzeniami, realne dwie tożsamości/RLS i zapisy już przyjęte przez serwer pozostają osobnymi bramkami.

## Handlers wymagające captured epoch

| Własny początek operacji | Co trzeba odrzucić po zmianie scope |
|---|---|
| Health load/form: `edit`, `submit`, focus rAF | A draft→B save, rezultat po event-triggered identity change, stare kwoty/card po delete/withdrawal. |
| Consent dialog/banner: `acceptRequired`, `updateOptional`, `saveCurrent`, `acceptAll`, toggle | Captured consentA.required=true nie może przyznać lub zapisać zgody B. Read required z current scoped record, optional draft reset. |
| Onboarding open: handleNext/Skip | A name/goal→B saveUser/profile notify. |
| Adult mode dialog: select/reset | A self-declaration→B record, oraz profile notify czytający inny scope. |
| Avatar editor: handleSave + saved timeout | Stare pola/sukces A w B, choć wygląd jest niskiego ryzyka. |
| Quiz/review session: submit/reveal/reward/complete/timeout | SRS/points/streak/rezultat poprzedniego actor w nowej sesji. |
| Challenge/crisis action: submit/markDone/clipboard completion | Wrong-scope completed marker, reward i spóźniony success. |
| Lesson/conversation start: recordLessonStep, commitRunningAgentTime/pagehide | Module cache oraz timer piszące duration/steps po zmianie actor. |
| Chat/read-aloud click i planner | Reset input/history/entered amount oraz stop streaming/local speech; zachować P0 hard-off/localService. |
| Future family action | Scoped helper już może znać key, lecz nie montować/aktywować funkcji. |

## Events i kryteria niezależnych testów

Nazwy nowego scope event/subscription ustala adapter. Semantyka: **scope-changed przed async hydratacją/ponownym wykorzystaniem UI**, ready po matching data readiness, scoped-data-change/deleted po write/cleanup. Payload bez UID/email/token. Zachować istniejące product events: user, health-check, learning, tokens, consent-change, cloud-synced i storage; prefix-aware filtering i owner subscriptions muszą wykluczyć inne account keys.

Wymagane syntetyczne acceptance cases (baseline UX przestawić na bezpieczne oczekiwania dopiero po implementacji):

- dokładne guest bytes zachowane przez A/B, empty cloud, error, logout, repeated normalize/read; żadnego guest uploadu;
- ten sam UID w CDP i Supabase ma odrębny namespace; escaping/kolizje/unknown keys;
- pending blank/no write; B GET500 nie odczytuje A lub guest personal records; actual getters/writers używają own scope;
- stale health form i stale Consent.updateOptional z retained callback nie zapisują do B ani nie ogłaszają sukcesu;
- storage innego UID nie zmienia RAM owner; aktualizacje own/deviceprefs działają;
- current B local health po current consent działa, pozostaje local-only, z zachowaną wersją/PLN/98 i legacy read policy;
- delete przechwytuje scope, zatrzymuje jego lease, omija guest/inne konto/SDK, resetuje UI także po partial failure;
- current-scope selected export ma jedno provenance, omija free names/goals/UID/email/token/unknown nested fields; nie miesza A health z B learning;
- optional false/required removal od razu invaliduje caches/work, nowy scope nie otrzymuje starego true;
- Home/shell, Health fields/card, Consent/Onboarding, Quiz/Review/Challenge/Crisis/Avatar/Chat/Voice i RAM planner resetują się przed gotowością B;
- same-owner refresh zachowuje owned pending changes zgodnie z kontraktem, logout→same UID unieważnia stare callbacks;
- wszystkie B13 deferred token/GET/PUT/reentrancy fences, P0 hard-off/deferred scopes i cycle2 arithmetic/currency pozostają zachowane.

Browser fixtures PL/EN, real reload/unload i wiele kart dopiero po implementacji oraz osobnym przydziale koordynatora. Nie udawać rzeczywistych kont przez email@ lub mock logout. Autor aplikacji nie przyjmuje własnej poprawki.

## Podział dalszej implementacji

Adapter/sync lifecycle: `architecture_audit`; personal helpers/context/UI cached reset: `curriculum_pilot` **dopiero po dokładnym API i wyłącznej liście plików**; export/delete/current-scope i Providers gating/hook: root; niezależny review: UX. Ten etap zapisuje tylko tę mapę i jej JSON. Publikacja polityki, pełne prawa konta, retencja i produkcyjna zgodność nie wynikają z lokalnego kontraktu.

## Dopisek implementacji personal — 14.10.2026, source frozen

Po ukończeniu mapy root autoryzował wyłączną edycję personal helpers/context/UI i notification timers. Faktyczny adapter to `lib/product-storage.ts`, hook roota `lib/use-product-storage.ts`; physical prefix adaptera: `coachfi-owned:v1:${provider}:${encodeURIComponent(userId)}:${logicalKey}`. Baseline/source fingerprints powyższej mapy pozostają historycznym snapshotem. Finalne 19 fingerprintów autora i wynik znajdują się w `implementation_snapshot` pliku evidence; namespace/sync/boundary/export/deletion są autorstwa innych wykonawców i podlegają osobnej recenzji.

Odczyty user/avatar/health/consent przyjmują opcjonalny `PersonalStorageHandle`. Settery otrzymują captured handle jako ostatni argument i odrzucają stale/unready przed mutation/notify/events; błędy storage propagują. Health nadal lokalny, z niezmienioną wersją/wzorem/PLN/98. Consent.updateOptional weryfikuje wymagane warunki w bieżącym scoped record, a retained callback nie zdobywa B, nawet przez jawnie podany B handle. Formularze i dialogi przechwytują render-bound handle i sprawdzają go przed działaniem oraz sukcesem.

Zmodyfikowane contexts Consent/Mode/Voice/Streak i przypisane health/avatar/achievement/crisis oraz ConsentManager/Onboarding/Family/Mila używają scoped readers/writers. Świadomy guest delete pozostaje osobną operacją roota; nie usuwa się legacy guest przy logowaniu/logout. Root keyed boundary resetuje osobiste caches. Obecne raw access pozostałe w own zakresie NotificationBanner dotyczy wyłącznie device dismissal; async permission completion i timer sprawdzają przechwycony handle. Nie są dodane nowe ustawienia powiadomień. Lib notifications ma cancellation per revision, więc cleanup A nie kasuje B reminder; stale timer nie pokazuje serii A. Voice ma synchroniczne cancellation na `coachfi-storage-owner`; lokalne `localService===true` i rzeczywisty click pozostają wymagane. Mila live widget nadal nie montuje się; dormant callback begin/end conversation również otrzymuje captured storage.

Ostatnia suita celowana o **16:07:28: 54/54 PASS** — autor22 + niezależne personal5 + istniejące health8/consent15/local voice4. Komenda: `node node_modules/vitest/vitest.mjs run tests/cycle4-personal-author.test.ts tests/cycle4-personal-review.test.ts lib/healthCheck.test.ts lib/consent.test.ts tests/consent-voice.test.ts`. Nie zmieniano istniejących fixtures; nie uruchamiano pełnej suity/typecheck/build/serwera. Pierwszy timer test wymagał poprawienia browser-like fixture (`window.Notification` obok globalnego konstruktora); finalny pozytywny test potwierdza B timer, a nie jedynie brak wywołań przy denied permission.

Actual VoiceProvider callback test korzysta ze stubów hooków i native EventTarget; potwierdza imperative cancellation oraz odrzucenie stale speak, **bez twierdzenia o wyrenderowanym UI/przeglądarce**. React checklist: render-bound writer args, aktualne effect dependencies, cleanup listeners/timers, errors bez false success, brak nowych bibliotek/dostawców, bez reaktywacji dormant funkcji. Source jest frozen do niezależnej opinii UX oraz bramek integracyjnych roota. Autor nie zatwierdza swojej zmiany ani wdrożenia.
