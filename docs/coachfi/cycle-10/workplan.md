# Cykl 10 — B20: zapis lokalnych działań w sekcji Kryzys

15.10.2026. Dorośli, Polska, PL/EN, bieżąca gałąź `codex/p0-security-consent-export`. Zachować poprzednie staged zmiany. Bez commit/push/deploy, migracji, produkcyjnych zapisów, rzeczywistych kont/profili/sesji/sekretów, płatnych wywołań i kontaktów z ludźmi.

## Problem i kryteria

Obserwacja źródła: markDone zapisuje action marker i ustawia done w UI przed addTokens. B20 odtwarza tę kolejność na syntetycznych danych przed poprawką. Baseline/helpers nie oznaczają starego browser execution. Marker jest historią deklaracji działania, nie dowodem skuteczności działania lub potwierdzonej nagrody. Nie zmieniać opisów prawnych, numerów pomocy lub template dokumentów.

Helper zachowuje pięć istniejących action IDs i nagrodę15. Strict read: null oznacza pustą listę; JSONarray unique known IDs<=5 jest ready, inne bajty unavailable bez naprawy. Przed markerem sprawdzić punkty; marker i token writer są śledzone, obie wartości wymagają potwierdzenia przed success. Zachować marker→reward order bez nowych payloadów. Retry wyłącznie przed jakąkolwiek próbą set/remove. Po attemptedwritefailure wszystkie działania w tej instancji otrzymują quarantine, a UI nie publikuje nowego done ani sukcesu. Zmiana języka nie resetuje blokady. Sukces jednego działania nie blokuje innych, stale callback nie powtarza jego nagrody. Reread świeżej listy zapobiega zgubieniu wcześniejszego ID przez stare closure.

## Rozłączne pliki i recenzje

| Właściciel | Pliki | Niezależny reviewer |
|---|---|---|
| daily_author | lib/crisis-action-save.ts; tests/cycle10-crisis-author.test.ts; save-author report/evidence | daily_data_review |
| root | app/crisis/page.tsx; config/snapshot/build/parity; program/backlog/current-cycle i aggregate evidence | daily_ui_review dla UI; daily_author dla narzędzi |
| daily_data_review | tests/cycle10-crisis-review.test.ts; save-review report/evidence | root weryfikuje dowody, autor helpera poprawia findings |
| daily_ui_review | tests/cycle10-crisis-ui-review.test.ts; tests/e2e/crisis-save-failure.spec.ts; ui-review report/evidence | root dla korekt fixtures, autor UI poprawia findings |

Po freeze root uruchamia aggregate, standalone TS, tylko dotknięte E2E i świeży hash-verified TEMP build. Targeted review cases są subsetem aggregate; nie sumować ich ponownie. Narzędzia wywodzą się z C9; boundary utility bytes pozostają identyczne, bez ponawiania zielonych29cases z C9. Zmiany ścieżek/config/fingerprints mają niezależną recenzję statyczną. Pierwsze failures i retesty zachować.

## Granice

Quarantine tylko RAM, brak atomowej transakcji, durable journal, recovery brakującej nagrody lub exactly-once między reload/remount/kartami/urządzeniami. Istniejący action marker nie potwierdza historycznej wypłaty15. Nie kasować ani nie migrować danych użytkownika. Nie przyjmujemy prawnych/finansowych treści Kryzys, rzeczywistych działań ludzi, kont/RLS/stagingu lub produkcji. Automatic cloud writes, external AI, health upload/Kids/Web3/afiliacja pozostają off. Produkcja NO-GO.
