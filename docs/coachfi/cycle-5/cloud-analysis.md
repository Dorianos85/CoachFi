# B15 — Supabase: własne dane offline i cold resume

Stan 2026-10-14: lokalna implementacja autora zamrożona do niezależnej recenzji. Automatyczne zapisy konta są wyłączone. Własne niepotwierdzone dane pozostają na urządzeniu; nie próbujemy ich scalać, odtwarzać ani potwierdzać. Diagnoza finansowa nadal jest lokalna. Ten raport nie jest zgodą na wydanie lub wdrożenie.

## Zakres i dowody

Odczytano rzeczywiste `lib/sync/{session-sync,cloudSync,syncQueue}.ts`, adapter własności, lokalne helpery i lokalny schemat SQL. Testy uruchamiają rzeczywisty kontroler, cloudSync, kolejkę, adapter, saveUser/saveCards/addTokens/markStageCompleted. Transport bazy jest syntetyczny; `fetch` spoza niego rzuca wyjątek. CDP `persistLearningState` jest jawnie zastąpiony stubem: audyt dotyczy Supabase, a rzeczywista funkcja nie zapisuje stanu dla właściciela Supabase. W starszym teście realny zainstalowany SDK wykorzystuje wyłącznie custom mock-fetch, syntetyczny token i adres `.invalid`.

Nie odczytywano sesji użytkownika, browser storage, `.env`, sekretów ani bazy. Nie wykonano instalacji, migracji, serwera, pełnych bramek, push ani wdrożenia. Schemat/RLS obecnej bazy, wiele kart, urządzenia, realne uwierzytelnienie i zachowanie transportu produkcyjnego pozostają niepotwierdzone.

Pierwszy run 17:17:52 nie wykonał assertions: 8 błędów importu podczas równoległego przygotowywania `local-sync-state.ts`. Po odizolowaniu niepowiązanego CDP sidecar drugi run 17:19:41 odtworzył 7 z 8 przypadków. Jedno oczekiwanie starego `localOnly:false` nie przeszło, ponieważ adapter roota miał już nową ochronę statusu; nie jest to dowód naprawienia nadpisania danych. Nie podajemy tego jako baseline 8/8. Raw wynik: `evidence/cycle-5/cloud-baseline-tests.json`; historia ograniczeń: `cloud-infrastructure-history.json`.

| Baseline | Zaobserwowane zachowanie | Wniosek i ograniczenie |
|---|---|---|
| SB01, P1 | Własne offline profile/cards/tokens/stage zapisane lokalnie znikały po resetModules i kolejnym odczycie chmury; guest bytes pozostawały bez zmian. Pusta chmura zastępowała je pustymi domyślnymi wartościami. | RAM kolejki nie dowodzi trwałego potwierdzenia. Niezależny UX odtworzył utratę własnego profilu po błędzie upsert. |
| SB02, P1 | Dwa upserty profilu mogły być jednocześnie w toku. Odwrócone zakończenia mock-transportu pozostawiały starszy remote snapshot i nowszy lokalny. | Odtworzono brak serializacji w kliencie, a nie rzeczywisty konflikt w Postgres. |
| SB03, P1 | Błąd gotowego push był łapany bez retry/ack. Dopiero nowa jawna edycja wysyłała kolejny snapshot. | Lokalne zachowanie po błędzie nie wystarczało do cold resume. `onSynced` dotyczył jedynie początkowej hydratacji; test nie wykazał fałszywego nowego eventu push-success. |
| SB04, P1 | Po syntetycznym commit reward + utracie odpowiedzi jawny replay tworzył dwie identyczne operacje bez ID: +7 i +7, lokalnie nadal +7. | To ryzyko przyszłego replay, nie dowód obecnego automatycznego retry. Lokalny schemat ma UUID ID, lecz obecny klient go nie wysyłał i deployed constraints nie są zweryfikowane. |
| SB05, P2 | Quota przy avatar po zapisaniu profilu pozostawiała częściowy odczyt. Puste cards/stages kończyły się bez write, pozostawiając remote rows. | Hydratacja localStorage nie jest transakcją; resolve `void` nie potwierdza usunięcia chmurowych danych. |

Niezależny baseline: `tests/cycle5-integrity-review.test.ts`, `evidence/cycle-5/review-baseline-tests.json`. PASS w historycznej reprodukcji znaczy zaobserwowanie usterki, nie acceptance. Nowy plik autora został jawnie zamieniony na testy akceptacji ograniczonego kontraktu; wyniki historyczne zachowano osobno.

## Przyjęty minimalny kontrakt

1. `AUTOMATIC_ACCOUNT_WRITES_ENABLED=false`. `pushEntity` jest inert dla wszystkich ośmiu typów: kończy się resolve `void` bez odczytu db, guard lub payload i bez operacji transportu. Sam resolve nie jest potwierdzeniem upload. Dawny kod upsert/insert usunięto; sama zmiana flagi nie uruchomi go ponownie. `registerCloudPusher` nie instaluje pushera, `notifyCloud` niczego nie wysyła. Nie ma retry, replay ani account-write acknowledgement.
2. Własny pusty namespace może wykonać pięć odczytów: profiles, srs_cards, stage_progress, streaks, reward_balances. Po odczycie jest `ready`, `localOnly:true`, `syncIssue:'read-only'`. Hydratacja nigdy nie emituje `coachfi-cloud-synced` i nie instaluje kolejki zapisu. Publiczne zmiany nadal są użyteczne lokalnie.
3. Jakiekolwiek własne mirrored bytes lub marker `coachfi-learning-rev` oznaczają `unconfirmed`, także pusty string, dane legacy albo malformed. Zachowujemy dokładne bytes, wykonujemy zero GET, zero hydratacji i zero callback sukcesu. Nie parsujemy ich, żeby uznać za potwierdzone.
4. Po wszystkich GET ponownie sprawdzamy cache/marker przed pierwszą mutacją. Przed każdą private mutacją oraz emitowaniem/reentry sprawdzamy marker i bieżącą sesję. Zmiana pojawiająca się podczas await nie jest nadpisywana. Błąd odczytu przy pustym cache daje `unavailable`, bez potwierdzenia. Quota może pozostawić częściowy *świeży* odczyt; jest on `unconfirmed` i zachowany podczas kolejnego resume. Nie deklarujemy atomic rollback.
5. Adapter roota zapisuje istniejący marker `local-unconfirmed-v1` przed publiczną zmianą lub usunięciem tracked key. Błąd markera nie pozwala zmienić wartości. Private bypass dotyczy tylko `snapshot.status==='pending'`; retained private handle po ready również tworzy marker. Marker nigdy nie jest automatycznie czyszczony jako ack.

| Rodzaj | Własne klucze Supabase |
|---|---|
| Profil | coachfi-user, coachfi-avatar, coachfi-voice, coachfi-mode-v1 |
| Nauka | coachfi-srs, coachfi-learn-manual, coachfi-streak, coachfi-tokens |
| Dalsze mirrored stany | coachfi-challenge, coachfi-consent-v1 |
| Ochrona | coachfi-learning-rev, dowolna nie-null wartość |
| Wykluczone z upload | coachfi-health-check i pozostałe nonmirrored lokalne dane |

Nie przenosimy guest bytes ani namespace innej tożsamości. Nie dodajemy journalu, nowych danych użytkownika, nowych celów przetwarzania, pól serwera lub migracji. Odczytane cloud cache również zostaje konserwatywnie uznane za niepotwierdzone przy kolejnym cold resume: bez trwałego ack nie można udowodnić jego aktualności. To świadome ograniczenie odświeżania, a nie synchronizacja offline.

Wycofanie zgody lokalnej nadal działa natychmiast. Brak upload/replay ledgeru nie jest potwierdzeniem wycofania w bazie. P0 provider hard-off pozostaje. Puste snapshots oraz usunięcie danych lokalnych nie obiecują usunięcia danych konta. Istniejący selected-local export/delete jest osobnym kontraktem roota; autor tego audytu go nie zmieniał.

## Kod i sprawdzenie

Źródła końcowe: `lib/sync/cloudSync.ts:48` (direct hard-off), `:55` (cache przed GET), `:64` (po GET), `:20`/`:33` (marker każdej mutacji); `lib/sync/session-sync.ts:60`/`:70`/`:84` (localOnly, cache, lifecycle); `lib/sync/syncQueue.ts:27`/`:32` (kolejka); `context/AuthContext.tsx:58`/`:62` (brak write i success event); root dependency `lib/sync/local-sync-state.ts:4`/`:20`/`:29` i adapter `lib/product-storage.ts`. Hashy nie traktujemy jako potwierdzenia działania produkcji; zapisano je w `evidence/cycle-5/cloud-analysis.json`.

Run autora 17:25:44: nowe acceptance **34/34 PASS**. Run końcowy targeted 17:27:48: **66/66 PASS** = nowe 34 + zaktualizowane wcześniejsze author Supabase 27 + istniejące health hard-off 5. Raw: `cloud-author-tests.json`, `cloud-author-targeted-tests.json`. Legacy oczekiwania zapisu zmieniono na zero write/read-only/preserve; bez skips, filtrowania lub usuwania przypadków. Realny SDK mock-fetch potwierdza pięć GET i zero POST przy direct calls wszystkich dawnych write paths. Te wyniki nie potwierdzają CAS, idempotencji append, many-tab atomicity ani produkcyjnego RLS.

Stan niezależnej recenzji: końcowy raport UX potwierdza 78/78 PASS (28 nowych + 50 regresyjnych przypadków recenzenta) i LIMITED ACCEPT bez materialnego open finding. Trzy dodatkowe negative status cases były poprawką w ścieżce CDP autora A, poza źródłami tego pakietu. Opinia dotyczy write-off/preserve/read-only, nie CAS, live RLS lub wydania; raport recenzenta `docs/coachfi/cycle-5/integrity-review.md`. Doprecyzowano resolve `void` po uwadze recenzenta, bez zmiany źródeł aplikacji. Autor nie zatwierdza własnej implementacji. Program koordynatora rejestruje końcowe 606/606 Vitest, 22/22 E2E, typecheck i build 34/34; są to wykonania roota, nie dodatkowe testy autora.

Po targeted run poprawiono wyłącznie stary komentarz `registerCloudPusher` na opis hard-off. Kod wykonywany nie zmienił się; hash kolejki odświeżono bez dodatkowego run dla komentarza.

## Retry i dalsze warunki

Zainstalowano supabase-js 2.105.4 (lockfile). Oficjalny [changelog retry](https://supabase.com/changelog/45071-automatic-postgrest-retries-for-transient-errors) opisuje automatyczne retry odczytów od 2.102.0; zapisy POST/PATCH/PUT/DELETE nie są automatycznie retryowane. Zainstalowany `PostgrestBuilder.ts:44` i obsługa błędów transportu potwierdzają rozróżnienie metod. Fake query w nowych testach nie emuluje retry SDK; pięć calls znaczy pięć aplikacyjnych zapytań, nie maksymalnie pięć HTTP requests w produkcji. Zewnętrzny [changelog](https://supabase.com/changelog) przejrzano; bez aktualizacji pakietów. Próba odczytu wersji `.md` zwróciła błąd narzędzia content-type, więc użyto strony HTML.

[Upsert](https://supabase.com/docs/reference/javascript/upsert) zależy od istniejących kluczy konfliktu; [insert](https://supabase.com/docs/reference/javascript/insert) sam nie daje semantic idempotency. Lokalny schemat `supabase/schema.sql:71`, `:184`, `:330`, `:382` nie dowodzi wdrożonej konfiguracji. Przed przywróceniem write konieczne są odrębnie uzgodnione: serwerowa precondition/CAS i ownership, trwałe revision/ack per entity, serialized queue, jawne rozstrzyganie konfliktów, bezpieczne operation IDs/readback dla append reward/consent, znaczenie pustego snapshotu oraz testy cold resume i wielu kart. W tym cyklu ich nie implementowano ani nie zaliczono jako PASS.
