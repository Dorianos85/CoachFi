# B15 — zachowanie niepotwierdzonych danych konta

14.10.2026. Lokalny cykl na bieżącej gałęzi; istniejący staged patch zachowany. Baseline autor CDP 8/8 i niezależny reviewer 3/3 odtwarzają ryzyka, nie stanowią acceptance. Pierwszy cloud author run miał 0 assertions wskutek przejściowego braku helpera; późniejszy baseline 7/8 odtworzył ryzyka, 1 assertion trafił na już zmieniony adapter. Nie przedstawiać go jako pełne PASS. Końcowe author targeted: CDP 59 + 7, cloud 66, root 27; podzbiory mogą się pokrywać, nie sumować do pełnej suity.

Przyjęty minimalny kontrakt: automatyczne zapisy CDP/Supabase wyłączone do atomowej kontroli wersji po stronie serwera. Istniejące własne mirrored cache (4 learning keys CDP / 10 keys Supabase) lub dowolny REV zachować byte-for-byte bez hydration. Cloud można odczytać do pustej własnej przestrzeni mirrored danych; gotowość widoku jest localOnly/read-only, nie potwierdzeniem zapisu. Publiczna zmiana mirrored keys zapisuje wcześniej marker `local-unconfirmed-v1` w istniejącym REV, zachowując wcześniejsze niepuste i puste bytes. Brak automatycznego replay/ack/clear. Guest/session/health/device prefs nie są mirrored. Kontrola lokalna nie dowodzi atomowości wielu kart lub urządzeń.

Weryfikacja roota wykryła ukryty saveCdpIdentity w API GET. Root usuwa ten zapis i wyłącza unversioned PUT (503 po auth/owner checks); explicit DELETE pozostaje osobno. Testy i niezależna recenzja tego rozszerzenia obowiązkowe; żadnego rzeczywistego wywołania API.

Weryfikacja roota wykryła również retained hydration lease, który mógł omijać marker po publishReady. Bypass obowiązuje teraz wyłącznie podczas pending private hydration; każdy ready handle zapisuje marker przed mutacją mirrored pola. Test autora i niezależny retest obowiązkowe. Obsługa blocked storage w CDP poprawiona po uwadze koordynatora: resolved unavailable, zero getter/GET/hydration, zachowane bytes. Wstępny typecheck wykrył tylko typ reviewer fixture podczas jego adaptacji; final gate pending.

Rozłączne pliki:

- architecture_audit: account-sync.ts, account-session.ts, AccountSync.tsx, własne CDP author tests.
- curriculum_pilot: sync/session-sync.ts, cloudSync.ts, syncQueue.ts, AuthContext.tsx gdy potrzebny; własne cloud author tests.
- root: product-storage.ts, sync/local-sync-state.ts, ProductScopeBoundary.tsx, app/api/account/route.ts, storage author tests i cycle3-account-api.test.ts, rejestry i bramki.
- ux_audit: wyłącznie niezależne reviewer tests/docs/evidence; żaden kod aplikacji. Autor nie aprobuje własnego rezultatu.

Najpierw targeted tests i niezależna recenzja/retest, następnie zamrożone źródła i wspólne Vitest/typecheck/E2E/build. Wszystkie konta, storage i transporty syntetyczne. Bez commit/push/deploy, rzeczywistych sesji/profili/sekretów, produkcyjnych zapisów/migracji, płatnych usług ani kontaktu z ludźmi. Real accounts/RLS/staging osobno. Brak pełnej synchronizacji po stronie serwera pozostaje otwarty.
