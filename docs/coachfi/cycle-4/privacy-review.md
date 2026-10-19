# B14 — niezależna recenzja prywatności i pochodzenia danych

Uzupełnienie koordynatora po zamrożonej recenzji: 503/503 Vitest, 22/22 local E2E, typecheck i build 34/34 PASS; 41 reviewed source hashes bez rozbieżności. [Końcowe kontrole roota](../../../evidence/cycle-4/verification.json). Oryginalny LIMITED ACCEPT source/synthetic scope poniżej pozostaje bez rozszerzenia na real accounts/RLS/produkcję; „oczekujące” odnoszą się do momentu werdyktu recenzenta.

14.10.2026. Recenzent: /root/ux_audit. **LIMITED ACCEPT dla ocenionego lokalnego kodu i syntetycznych testów własności danych; zbiorcze bramki koordynatora oczekują. Produkcja pozostaje NO-GO.** SHA256 41 odczytanych plików zapisano w [review-final.json](../../../evidence/cycle-4/review-final.json). Autorzy nie zatwierdzają własnych zmian; recenzent nie edytował implementacji.

## Metoda i wynik niezależny

Storage stanowiły mapy stringów w pamięci. Użyto rzeczywistych importów adaptera, synchronizacji, helperów, ConsentProvider, AccountSync, binding oraz callbacków DataSafetyPanel; wejścia hooków i DOM/pobranie/reload są stubbed. Global fetch domyślnie rzuca. Transport zainstalowanego PostgREST otrzymuje wyłącznie syntetyczne odpowiedzi synthetic.invalid, bez Supabase AuthClient, kont i usług. To nie jest test rzeczywistego renderu React/SDK ani przeglądarki.

**64/64 odrębne własne przypadki PASS**, bez pełnej suity, typecheck, buildu, serwera i instalacji:

| Własna grupa | Wynik | Dowód |
|---|---:|---|
| [Provenance](../../../tests/cycle4-provenance-review.test.ts) | 4/4 | Bazowe ryzyka przekształcone na acceptance: actual deferred CDP GET/flush/logout oraz scoped export/delete. |
| [Adapter](../../../tests/cycle4-adapter-review.test.ts) | 5/5 | Pending 0 odczytów/zapisów, private hydration, reentry w get/set/delete, quota, częściowe usuwanie i błąd A po rozpoczęciu B. |
| [Personal helpers i ConsentProvider](../../../tests/cycle4-personal-review.test.ts) | 5/5 | Stare handles, rzeczywiste stare callbacki zgód, wycofane terms i health event reentry. |
| [Eksport](../../../tests/cycle4-export-review.test.ts) | 2/2 | Guest session/UID/free-text wykluczone, mixed A-local/B-session i owner-change podczas collect odrzucone. |
| [DataSafetyPanel](../../../tests/cycle4-root-ui-review.test.ts) | 2/2 | Stare przyciski nie pobierają/usuwają B ani nie wykonują reload; reentry w Blob URL blokuje click i zwalnia URL. |
| [CoachPage](../../../tests/cycle4-coach-review.test.ts) | 1/1 | Retained submit A po owner B nie nalicza czasu B, nie zmienia starego stanu i nie wywołuje fetch. |
| [HealthCheckPage effects](../../../tests/cycle4-health-effects-review.test.ts) | 3/3 | PL/EN draft zachowany po akceptacji terms, score10, withdrawal blank/no success, initial loaded saved98 i reset przy owner B. |
| Regresje B13 Supabase/controller/Auth/SDK | 23/23 | Cztery własne pliki B13 dostosowane do storage lease; wcześniejsze asercje wyścigów zachowane. |
| Regresje B13 CDP/account/component | 18/18 | Wcześniejsze 17 i nowy przypadek: token A odrzucony po renderze B, przed cleanup. |
| Wybrana asercja P0 eksport/delete | 1/1 | Zmieniono tylko fixture/usuwanie wymagające handle. Pozostałych oracles nie zmieniono; pominiętych przypadków nie liczono jako PASS. |

Surowe wyniki i czasy są podlinkowane w JSON. Pierwsze wykonanie bazowych reprodukcji miało EPERM cache i zero testów; autoryzowane ponowienie odtworzyło 4/4. Wczesny account/component retest miał 14/17: trzy fixture błędy brakującego useRef oraz starego guest visibility, bez dowodu regresji aplikacji. Po adaptacji fixture i dodaniu testu tokena: 18/18. Nie zmniejszono oracles B13: wykrywanie zapisu 777 obejmuje także physical namespace, a sukces synchronizacji odróżniono od nowych owner events. Finalny suplement 8/8 obejmuje nowy CoachPage 1 i powtórzone AuthProvider 7 po końcowym guardzie guest/signOut; te siedem nie zwiększa liczby unikalnych testów.

Późniejszy retest dwóch starszych plików review diagnozy: [115/115 PASS](../../../evidence/cycle-4/review-health-fixture-tests.json). Zmieniono wyłącznie setup: jawny guest owner przed wyzerowaniem spies. Nie filtrowano zdarzeń ani nie zmieniono asercji zero writes/success i arytmetycznych oracles. Lazy bootstrap emitował owner events, więc liczniki operacji muszą zaczynać po bootstrapie. To istniejące regresje, nie 115 nowych B14 asercji; kod aplikacji oraz bounded verdict pozostały bez zmian. SHA obu fixture plików zapisano w legacyHealthFixtureRetest JSON.

## Bazowe ryzyka i retest poprawki

[Bazowy dowód](../../../evidence/cycle-4/review-baseline.json) i [pierwszy surowy wynik](../../../evidence/cycle-4/review-baseline-tests.json) pozostają historyczne. Ich 4/4 oznaczało reprodukcję ryzyk, nie acceptance; nie doliczono ich do 64. Obecny plik provenance ma już asercje oczekiwanego zachowania.

| Finding bazowy | Niezależny retest | Wynik lokalny |
|---|---|---|
| B14-REV-01 — utrata danych gościa | Raw 00321, whitespace/JSON SRS/manual/streak i profil pozostają identycznymi stringami po hydratacji A, endLearningSession i późniejszym clearSignedInName ze starym uchwytem. Konto ma własne 88, logout przywraca guest. | Zamknięty syntetycznie; bez guest seed/upload. |
| B14-REV-02 — profil/diagnoza/zgody A widoczne dla B | Po guest → A, personal zapisach A i B GET500 gettery B są puste. Snapshot ready/localOnly ma owner B; raw guest pozostaje. | Zamknięty syntetycznie; local-only konto nie jest guest fallbackiem. |
| B14-REV-03 — mieszany eksport bez pochodzenia | Actual owned export zawiera tylko B tokens/diagnozę oraz ownerKind=account. Guest/session, UID, nazwy/cele i SDK keys nie są kopiowane. Mixed pair lub zmiana epoch odrzucają wynik. | Zamknięty dla wybranego eksportu, nie pełnego eksportu dostawców. |
| B14-REV-04 — wspólne usuwanie i aktywna kolejka | Podczas oczekującego actual CDP flush delete unieważnia widok i abortuje lease przed removal. Late GET nie zaczyna PUT. Guest profil/health/consent i SDK keys pozostają. | Zamknięty syntetycznie; actual unload/reload ocenia osobny harness roota. |
| B14-REV-05 — stary callback CoachPage przejmuje bookkeeping B | [Baseline 0/1](../../../evidence/cycle-4/review-coach-baseline-tests.json): actual retained submit A po B naliczał B 100ms zamiast 0. Root dodał captured storage, owner cancellation i guard cleanup; [ten sam retest PASS](../../../evidence/cycle-4/review-final-supplement-tests.json) ma 0ms/0oldstate/0fetch. | Medium, zamknięty syntetycznie. Nie twierdzę, że odtworzono realny React scheduling lub zewnętrzny wyciek AI. |
| B14-REV-06 — akceptacja terms usuwa draft diagnozy | Root odkrył w rzeczywistym izolowanym E2E PL/EN; niezależny [actual-function baseline 1/3](../../../evidence/cycle-4/review-health-effects-baseline-tests.json) odtworzył oba kasowania draftu. Autor rozdzielił initial hydration i withdrawal-only reset. [Retest 3/3](../../../evidence/cycle-4/review-health-effects-tests.json) zachowuje draft na accept, zapisuje10 i usuwa cached UI/fields na withdrawal, z raw record retained. | Medium, zamknięty syntetycznie. Pełny ponowny E2E wykonuje root. |

## Odczyt implementacji i integracji

Adapter utrzymuje owner/revision w RAM zakładki; allowlist ma 18 osobistych kluczy. Konto używa provider+encoded UID, gość istniejących raw logical keys. Locale/accessibility są urządzeniowe, notification dismissal jest preferencją zakładki. Nie enumeruje auth/obcych namespace. Public pending handle nie czyta/zapisuje; prywatny lease służy synchronizatorowi do hydration przed ready. Guards działają przed i po storage operation. Fizyczny zapis, który nastąpił przed reentry, może pozostać w poprzedniej przestrzeni; false nie oznacza rollbacku.

Hook przechwytuje handle renderu. Boundary ukrywa personal UI podczas pending i zmienia key na revision, obejmując Consent/Mode/Streak/Voice i osobiste ścieżki. Kontrolery auth/SDK są poza boundary. Source odczyt potwierdza przekazywanie draft/render handle do profilu, health, adult mode, lekcji, quizu/challenge/review, streak/reward, avatar/crisis i odroczonych Family/Vault/Mila preferencji. Root zamknął również stale visual next/restart/confetti callbacks. Nie włączono funkcji odroczonych.

Po znalezieniu B14-REV-06 initial health effect zależy od loaded/storage, a osobny requiredAccepted effect czyści result/draft/dirty/errors/saveFailed tylko przy false. false→true zachowuje wpisane odpowiedzi; withdrawal usuwa UI sukcesu i kwoty, bez kasowania lokalnego rekordu. Hook memoizuje facady po revision/status, natomiast snapshot zwraca aktualny osobno: zmiana ready localOnly metadata tego samego owner nie tworzy nowego storage handle i nie wywołuje init/reset kontekstów. Ten mały kontrakt memo oceniono z kodu; root ma oddzielną emulację React memo. Własne testy efektów zachowują hook slots i sprawdzają rzeczywiste dependencies, bez twierdzeń o React DOM/paint/concurrent render.

Supabase wymaga aktualnej sesji, storage owner/provider/UID i AbortSignal; hydratacja pozostaje cloud-only. CDP ma osobną przestrzeń i dirty snapshots, bez guest seed. Same UID refresh zachowuje active lease; logout/owner change/delete unieważniają go. B13 token/GET/PUT/JSON, unmount, stary pusher/pagehide/name action i reentry mają zielone własne regresje. Health pozostaje local-only i poza cloud snapshot/push; model /98, waluta i arytmetyka cyklu 2 nie zostały zmienione.

UI eksportu używa buildOwnedLocalDataExport; pure sanitizer pozostaje do unitów. Metadane nie zawierają UID/email. Delete rezerwuje pending tego samego owner przed callbackami, zatrzymuje managed sync i usuwa 18 kluczy obu storage. Częściowa porażka zostawia erase-failed tylko aktualnej reservation; boundary pokazuje PL/EN błąd poza odmontowaną personal zawartością i ręczny reload. Odtworzono failure A po reentry B: B nie dziedziczy błędu.

Odczytano tests/e2e/storage-provenance.spec.ts i playwright.cycle4.config.ts: fresh context, blokada zewnętrznego ruchu, test-only marker zapobiegający ponownemu seed po real reload, guest deletion PL/EN i zachowanie syntetycznych account/auth/global prefs. Zestaw zachowuje 20 wcześniejszych scenariuszy i dodaje dwa. Nie uruchamiałem go; nie traktuję go jako testu rzeczywistego SDK loginu.

## Ograniczenia przyjęcia

Raw legacy keys mają nieudowodnione historyczne pochodzenie; guest/device nie dowodzi autora ani zgody danej osoby. Namespace nie jest auth, RLS, szyfrowaniem ani ochroną przed same-origin JS/XSS/osobą mającą dostęp do profilu przeglądarki. Po logout konta pozostają na urządzeniu do jawnego scoped delete. Many-tab/same-owner konflikty, multi-device merge i retencja wymagają odrębnych dowodów.

SpeechSynthesis.cancel dotyczy globalnej kolejki browser speech. Ręczne wymuszenie cleanup A po speak B mogłoby anulować B; nie odtworzono takiej kolejności w jednym aktualnym keyed VoiceProvider. Owner event anuluje A synchronicznie, a standardowy unmount cleanup poprzedza setup B. Ograniczenie wspólnej kolejki pozostaje; dowolna kolejność w mocku nie dowodzi usterki React.

Nie czytano prawdziwego storage, kont, profili, sekretów, RLS ani produkcji. Abort nie cofa operacji już przyjętych przez SDK/serwer; delete nie obiecuje transakcji ani usunięcia danych wszystkich dostawców. Nie zatwierdzono realnej migracji, legal/GDPR compliance, nowego celu przetwarzania lub uploadu diagnozy. Wyniki zbiorczych testów/typecheck/build/E2E roota będą osobno w coordinatorChecks. Przyjęcie kodu i syntetycznych kontroli nie jest zgodą na wdrożenie.
