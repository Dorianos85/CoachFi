# Cykl 9 — B19: zapis wyzwania dnia

14.10.2026. Lokalny zakres: dorośli, Polska, PL/EN; bieżąca gałąź `codex/p0-security-consent-export`. Zachowano poprzednie paczki. Bez commit/push/deploy, migracji, produkcyjnych zapisów, rzeczywistych profili/sesji/sekretów i płatnych wywołań.

## Problem i kryteria

Baseline autora rzeczywistych helpers odtworzył reward przed completion marker: odmowa markera pozostawiła saldo175 zamiast125; stare ponowienie podniosło je do225. Trzy syntetyczne reprodukcje mają oddzielne dowody, nie stanowią przyjęcia poprawki. Stara kolejność UI jest obserwacją źródła, bez uruchamiania dawnej przeglądarki.

Kontroler ma sprawdzać owner/ticket, strukturę istniejącego markera oraz safe integer nagrody przed mutacją. Oba zapisy przechodzą przez traced handle. Błąd przed próbą zapisu umożliwia jawne ponowienie; po jakiejkolwiek próbie set/remove wynik jest niepewny i bieżące wyzwanie zablokowane. Nie wolno ogłaszać ukończenia, sukcesu lub zdobytych punktów przed zakończeniem wymaganych synchronicznych akcji. Zmiana języka nie resetuje blokady. Wrong/completed nie naliczają punktów. Przestarzałe callbacki i reentry nie zmieniają rezultatu.

Odczyt markera: null oznacza available; wyłącznie obiekt z własnym polem date i prawdziwą datą YYYY-MM-DD. Dzisiaj UTC oznacza completed, wcześniejszy dzień available; przyszła data, nieznane pola, błędny JSON i błąd dostępu unavailable. Zachować istniejące bajty. Nie zmieniać dotychczasowego UTC formatu, doboru pytania lub countdownu.

## Własność plików i niezależne recenzje

| Właściciel | Wyłączne pliki | Niezależny recenzent |
|---|---|---|
| daily_author | lib/challenge-save.ts; tests/cycle9-challenge-author.test.ts; save-author report/evidence | daily_data_review |
| root | app/challenge/page.tsx; playwright.cycle9.config.ts; snapshot/build/parity tools; rejestry i aggregate evidence | daily_ui_review dla UI, daily_author dla narzędzi |
| daily_data_review | tests/cycle9-challenge-review.test.ts; save-review report/evidence | root weryfikuje dowody; autor helpera poprawia findings |
| daily_ui_review | tests/cycle9-challenge-ui-review.test.ts; tests/e2e/challenge-save-failure.spec.ts; ui-review report/evidence | root/author sprawdzają ewentualne korekty fixtures |

Root uruchamia jeden aggregate po zamrożeniu źródeł, standalone TS, dotknięty browser suite i hash-verified TEMP build. Targeted tests recenzentów są subsetem aggregate; nie sumować ich ponownie. Zachować pierwsze failures i uzasadnienia retestów. Nie powtarzać wcześniejszych zielonych browser paths bez zmiany.

## Granice

Quarantine wyłącznie RAM jednej instancji; brak trwałego journalu, rollbacku, odzyskania brakującej nagrody, exactly-once po reload/remount lub między kartami/urządzeniami. UI nie proponuje reload jako retry niepewnego zapisu. Nie przyjmujemy innych reward views, kalendarza Polski, schemas streak/SRS, pełnej lokalizacji banku wyzwań, cloud reconciliation, kont/RLS/stagingu lub produkcji. Zewnętrzne AI, health upload, Kids/Web3/afiliacja i automatic cloud writes pozostają off. Produkcja NO-GO.
