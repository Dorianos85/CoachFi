# Cykl 10 / B20 — niezależna recenzja danych

Recenzent `/root/daily_data_review`, autor helpera `/root/daily_author`, autor strony root. **LIMITED ACCEPT lokalnego helpera B20**, 15.10.2026; nie zatwierdza strony lub wydania. Odczytano root/repo AGENTS.md, program/current-cycle/backlog, raport C9 i skill coachfi-data-integrity. Zakres: odwracalne lokalne testy syntetyczne dla dorosłych w Polsce, PL/EN.

Własne oracles powstają z uzgodnionego contractu przed odczytem nowego helpera: strict cache z pięciu istniejących IDs, preserved malformed/future bytes, fixed15 i safeinteger eligibility przed markerem, oba potwierdzone zapisy przed saved, per-action terminal vs global uncertainty, właściciel/ticket/reset/reentry oraz sync/promise storage boundary. Realny helper tokens; cloud/persistence tylko mocked effects, fetch i niezwiązany globalny storage zabronione. Testy autora nie zastępują niezależnej recenzji.

Nie oceniono legal copy, porad kryzysowych, kontaktów lub skuteczności, nie uruchomiono realnych kont/chmury, paid calls, commit/push/deploy, nie dodano danych lub trwałego journalu. RAM blokada nie daje exactly-once po remount lub pomiędzy kartami. C9 zielonych przypadków nie powtarzamy.

## Dowody i wynik

Source helpera zamrożony: SHA256 `fbdc78935951dd14548083d9648a93a3e7ca84b783a618a666d532276f4e25f1`. Pierwszy własny run: **82/82 PASS**, zero skipped/failed. Po odczycie source dodano dwie nowe obawy async authority/rejecting writer, uruchomione tylko targeted: **2/2 PASS**, pozostałe82 były celowo unselected. **84 odrębne przypadki w dwóch przebiegach**, nie pojedyncze84/84. Brak finding wymagającego zmiany helpera i brak retestowania niezmienionych green. Raw wyniki: `save-review-initial-tests.json`, `save-review-async-probes-tests.json`; fingerprints i ograniczenia: `save-review.json`. Node24.19.0, Vitest4.1.11, lokalnie na syntetycznych Map bytes. Autor helpera ma własne niezależnie od tego niezatwierdzające testy; nie sumujemy ich jako cases tej opinii.

Własne oracles potwierdzają:

- Tylko null lub JSON tablica maksymalnie pięciu unikalnych, znanych IDs dają ready. Null nie inicjalizuje cache. Czytanie zachowuje kolejność i dokładne bytes; invalid JSON, non-array, null/object/numbers, duplicates, unknown/future IDs, dodatkowe przyszłe schema fields i identyfikatory z whitespace pozostają unavailable. Frozen result/arrays nie udostępniają mutable state.
- Stała15 i znane IDs są ścisłe. Invalid ID, malformed token balance, unavailable preflight i overflow nie dopuszczają próby zapisu markera. Granica safeinteger została przeliczona niezależnie. Istniejący default125 działa tylko dla missing balance. Unknown current/stale nie są uznawane za safe retry.
- Sukces wymaga markera i rzeczywistej nagrody: kolejność marker→token, exact marker confirmation przed addTokens, dokładne canonical balance i ponowne potwierdzenie markerów po synchronicznych effects. Lying marker/token setter, read failure po writerze, false, throw-before, write-then-throw i write-then-false nie dostają saved. Oryginalne częściowe bytes pozostają; brak rollbacku/naprawy.
- Token event, cloud notification lub persist effect mogą zawieść po obu writes. Wtedy stan jest uncertain. Event usuwający marker, dodający drugą niepotwierdzoną akcję albo niszczący saldo jest wykrywany i nie nadpisywany w ramach recovery.
- Per-action terminal nie blokuje pozostałych poprawnych akcji: pięć działań daje dokładnie75 punktów, powtórki nie przyznają dalszych. Persisted action daje already-done bez twierdzenia o historycznym reward. Gdy późniejsze działanie staje się uncertain, **wszystkie pięć** są quarantined, także wcześniejsze committed. No-replay asercje sprawdzają bytes i liczby reads/writes/events/provider callbacks.
- Stare tickety, owner loss podczas read/write i reset podczas writer callback odgradzają stare operacje. Reset nie zwalnia aktywnego in-flight locka przed finally. Reentry drugiej akcji nie przechodzi. `isOpen` jest pure admission bez storage/authority reads. Captured trace w realnym token persistence po końcu run nie może później czytać lub mutować.
- Promise cache read nie daje ready/saved; Promise current authority nie jest truthy owner. Promise writer po mutation daje uncertain, w tym odrzucający native Promise bez false async success. To kontrola synchronicznego kontraktu, nie sandbox dowolnego późnego działania zewnętrznego writera.

## Ograniczenia

Własny przypadek wykonał marker zapisany + token setter false: points125 i uncertain. Po odrzuceniu kontrolera RAM i stworzeniu nowego, marker powoduje already-done, a saldo nadal125. **Brak odzyskiwania brakującej nagrody po remount** jest sprawdzonym ograniczeniem, nie PASS dla durable recovery. Nie ma atomic transaction, journalu, cross-tab/urządzenie exactly-once lub rollbacku. Reset/nowa instancja nie zastępuje reconciliation.

Auth/owner w fixture to kontrolowany handle, bez realnych kont/RLS. Cloud/persistence są mocked effects, nie backend. Strona ReactDOM, browser, whole-program TypeScript/build, root narzędzia, weryfikacja porad prawnych/zdrowotnych i staging nie należą do tej opinii. Koordynator i niezależny UI reviewer mają osobne bramki. Autor nie zatwierdził własnego helpera; ta opinia nie przyznaje PASS produkcji, całemu eksportowi, synchronizacji lub bankowi treści.
