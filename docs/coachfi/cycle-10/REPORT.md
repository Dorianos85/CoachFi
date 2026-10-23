# Cykl 10 — B20: uczciwy zapis deklaracji działań w sekcji Kryzys

15.10.2026. **PRZYJĘTY LOKALNIE — LIMITED ACCEPT.** Gałąź `codex/p0-security-consent-export`, baza `86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b`. Wcześniejsze zmiany zachowano. Bez commit/push/deploy, migracji, produkcyjnych zapisów, rzeczywistych kont/profili/sesji/sekretów, płatnych wywołań i kontaktu z ludźmi. Produkcja **NO-GO**.

## Reprodukcja i poprawka

Baseline3/3 odtworzył kolejność marker→reward przy użyciu rzeczywistego addTokens oraz syntetycznego odpowiednika dawnych operacji UI. Odmowa token writer pozostawiła marker działania przy saldzie125; marker write-then-throw również pozostawił marker bez nagrody. Dawny catch-empty po błędzie parsowania pozwalał zastąpić nieznane bajty listą nowego działania i nagrodą140. Baseline nie jest acceptance; dawne ustawienie done przed nagrodą potwierdzono w źródle, bez deklaracji starego mounted UI/browser execution.

Helper zachowuje pięć istniejących IDs, nagrodę15 i marker→reward order. Odczytuje wyłącznie null lub listę unikalnych znanych IDs; błędne lub nieznane dane pozostają unavailable bez naprawy. Preflight punktów poprzedza marker. Oba zapisy korzystają ze śledzonego uchwytu; marker i saldo wymagają potwierdzenia przed saved. Retry istnieje tylko przed próbą set/remove; późna awaria blokuje wszystkie pięć działań w bieżącej instancji. Zapisane działanie jest terminalne tylko dla swojego ID, więc inne zdrowe działania pozostają dostępne. Każda próba odczytuje świeżą listę, także przez stary callback, aby nie zgubić wcześniejszych IDs.

UI PL/EN ustawia nowe done wyłącznie po saved lub odczycie istniejącego known marker. Niepewny wynik nie publikuje nowego done, pokazuje ostrzeżenie i blokuje pozostałe oznaczenia. Zmiana języka nie resetuje quarantine. Failed pre-writer read pozwala na jawne ponowienie; initial malformed cache umożliwia jedynie readonly check. Błędy odświeżają odczyty salda bez ponownej nagrody. Owner/ticket, reentry i cleanup odgradzają stare callbacks. Status istniejącego działania jest zapisaną deklaracją, nie dowodem historycznej wypłaty15 lub faktycznej korzyści użytkownika.

Nie zmieniono źródłowych tekstów kontaktów, telefonów ani polskich template dokumentów. Oddzielny [dowód porównania](../../../evidence/cycle-10/non-target-content-parity.json) sprawdza dwa fragmenty z poprzedniego lokalnego indeksu i bieżącego pliku po normalizacji końców linii. Nie jest to recenzja prawna ani aktualności kontaktów.

## Autorzy i niezależne recenzje

Autor helpera **daily_author**, autor UI/narzędzi **root**. [daily_data_review](save-review.md) przyjął helper:84 własne przypadki w dwóch przebiegach82/82 i2/2 nowych async probes, bez powtarzania82green. [daily_ui_review](ui-review.md) przyjął UI:27/27 własnych przypadków actual CrisisPage i wykonanej pure ActionStep z kontrolowanymi hookami/storage, bez ReactDOM. Te111 przypadków jest podzbiorem aggregate1313; autor82 także w aggregate. Autor nie przyjmuje własnej aplikacji. Brak nowych app findings lub korekt oracles.

Narzędzia mają odrębną [statyczną recenzję](snapshot-tool-review.md) daily_author: zmiany prefix/path/config i nowe kotwice C9. Boundary utility jest identyczna bajtowo z C9; nie powtarzano29 tamtych testów i nie doliczono ich do C10.

**C10-TOOLS-01:** pierwszy workspace TSC wykrył9 TS2304 w zachowanych syntetycznych plikach .ts testów narzędzi z C9. Broad include objął także ich kopie/junctions. Nie usunięto ani nie zmieniono dowodów. Root dodał wyłącznie exclude `evidence/cycle-9/snapshot-tool-fixture-*/**`. Niezależny parser potwierdził266→255 plików:11 usuniętych z zakresu to tylko scratch (9 .ts i2 next-env),0 dodanych, wszystkie compilerOptions/include i rzeczywiste app/tests zachowane. Końcowy workspace standalone TS exit0. Początkowy błąd i proof są w evidence; nie pominięto rzeczywistych błędów aplikacji.

## Końcowe lokalne kontrole

| Kontrola | Wynik |
|---|---|
| Vitest | **1313/1313 PASS**,67plików,0failed/pending |
| Standalone TypeScript | **PASS**,exit0 po narrow scratch exclusion |
| Playwright | **8/8 PASS**,0skipped/flaky,46756,144ms, PL/EN |
| Next build | **34/34 PASS**,exit0 |
| Hash-verified build snapshot | **319wejść**,preflight319/postflight318,0copied/current mismatch |
| Niezależne fingerprints | **26porównań/23ścieżki**,0mismatch; C6/C7/C8/C9 frozen inputs również zgodne |
| Testowy serwer | Host port43191: **0listenerów**, terminating errors |

Browser sprawdził dwie odrębne akcje125→140→155 oraz reload zachowujący obie, mobile/Space/viewport, malformed marker/saldo z zachowaniem bajtów, pre-writer failure/retry, token write-then-throw i globalną blokadę wszystkich pięciu działań także po zmianie języka/native dispatch. Fresh headless Chrome, syntetyczny guest i stała UTC data; ruch poza localhost zablokowany. Nie klikano kontaktów, telefonów ani clipboard/template actions. Real auth/audio/providers i staged accounts/RLS nie zostały przetestowane. Nie powtarzano wcześniejszych zielonych browser paths.

Browser snapshot `coachfi-cycle10-verify-Gh3cA0`; świeży build snapshot `coachfi-cycle10-verify-GTTZPA`. Kopie bez env/Git/profili/real DB, node_modules przez zweryfikowany junction, bez install; puste klucze dostawców. Preflight obejmuje także next-env przed compiler, postflight pomija tylko jego generowany hash. Znane optional warnings x402-fetch/@base-org/account nie potwierdzają tych funkcji. Compiler font HTTP nie był wykluczony. Parity wykonana po zakończeniu buildu. Repo guard/scoped diff i aktualne statusy są w [verification](../../../evidence/cycle-10/verification.json); root workspace ma pointer `evidence/coachfi-cycle-10.json`.

## Granice i kolejna praca

Quarantine tylko RAM jednej instancji; brak atomic rollback, durable journal, naprawy brakującej nagrody lub exactly-once po remount/reload/kartach/urządzeniach. Niezależnie odtworzono marker bez nagrody: nowy kontroler zwraca already-done przy saldzie125 i nie odzyskuje brakujących15. Nie wywodzimy nagrody lub rzeczywistego efektu działania z zastanych markerów. Nie przyjęto legal/financial copy Kryzys, kontaktów, pełnego WCAG, skuteczności edukacji, kont/RLS/stagingu albo produkcji. External AI, cloud writes, health upload/Kids/Web3/afiliacja pozostają off.

Następny wykonalny zakres: **B06, saving-habit PL/EN**, z mapowaniem obecnej lekcji, quizu i feedback przed zmianą. Dotychczasowy source tekst sugeruje przelew przed wydatkami, a topic=saving może korzystać z fallbackuEN; to obserwacje źródła do odrębnej recenzji, nie przyjęcie modułu. B02/B09/B10/B16 i budżet pozostają osobnymi bramkami. Pętla aktywna, bez ponawiania niezmienionych zielonych testów.
