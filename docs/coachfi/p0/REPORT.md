# Coachfi.ai — lokalne poprawki P0, 14.10.2026

Przygotowano zmiany na gałęzi `codex/p0-security-consent-export`, od bazowego SHA `86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b`. Zakres: dorośli w Polsce, PL/EN; bezpieczeństwo repo, API, zgody, eksport i odroczenie Kids/Web3/partnerstw/rankingu. Nie wykonano push, wdrożenia, migracji, operacji na kontach produkcyjnych ani płatnych wywołań. Zmiany są lokalnym kandydatem do dalszej weryfikacji, a produkcja zachowuje poprzedni kod.

## Wynik zmian

| Obszar | Nowe zachowanie | Granica dowodu |
|---|---|---|
| API Mili | Zewnętrzny chat, TTS i token głosowy zwracają 503 przed importem/weryfikacją CDP i przed usługą AI. Stary GET tokenu zwraca 405 bez agentId/signedUrl. Lokalny tekst edukacyjny działa. | Aktywna zewnętrzna Mila pozostaje wyłączona. Brakuje trwałej quota, zatwierdzonego budżetu oraz autorytatywnego rejestru zgód i wycofania. |
| Wejście API | Limit rzeczywistych bajtów podczas czytania strumienia, anulowanie po overflow, poprawny UTF-8/JSON i sprawdzanie origin ze schematem/portem. | Lokalny limiter procesu jest odciążeniem, nie rozproszonym limitem kosztów. |
| Zgody | Wszystkie opcjonalne wybory domyślnie false; „Akceptuj wymagane” pozostawia je false. Stare rekordy z preselected opcjami wymagają ponownego wyboru. Tylko literalne true jest zgodą. | Rekord w przeglądarce nie stanowi serwerowego dowodu zgody. Wyłączenie usług nie zmienia ustawień samych dostawców. |
| Wycofanie i sesja | Anulowanie oczekującej pracy/playbacku, unieważnienie cache i wyników oczekujących tokenów po zmianie rejestracji gettera, także logout → relogin z tą samą funkcją. | Most CDP nie zapisuje tokenu; pełny auth/sync dwóch kontrolowanych kont nadal wymaga stagingu. |
| Eksport | Dokładna allowlista kluczy i odtworzenie dozwolonych pól, bez auth/SDK, nieznanych pól i dowolnego tekstu profilu. Zagnieżdżenie tokenu w kluczu produktowym nie omija filtra. | To eksport **wybranych danych lokalnych**, nie wszystkich danych konta/dostawców. Dane nazw/celów są pomijane celowo. |
| Usuwanie | Przycisk opisuje usunięcie danych z tej przeglądarki, zachowuje klucze logowania i wyjaśnia możliwe ponowne pobranie przez sync. | Nie jest to usunięcie konta ani danych u dostawców. Proces pełnego eksportu/usunięcia pozostaje otwarty. |
| Adult scope | Kids, Web3, marketplace i leaderboard są wyłączone w trasach/nawigacji/API. Brak montowania providerów wallet lub tworzenia wallet przy logowaniu; nagrody to punkty. Potwierdzenie wieku 18+ wymaga nowego rekordu. | To deklaracja wieku, nie weryfikacja tożsamości. Nie jest wdrożeniem edukacji dzieci. |
| Głos i chat | Gość zachowuje lokalne przykłady. ConvAI/script, zewnętrzny TTS oraz mikrofon przeglądarki są wyłączone. Odczyt wymaga kliknięcia i głosu z `localService === true` w danym języku. | Brak odpowiedniego głosu oznacza tekst i komunikat, bez cloud fallback. |
| Repo | 1427 wpisów profili/logów/lokalnej konfiguracji usunięto wyłącznie z indeksu; pliki lokalne zachowano. Guard blokuje takie ścieżki i raportuje dopasowania sekretów bez wartości. | Publiczna historia i zdalne repo są niezmienione. Ocena ekspozycji, sesji i ewentualna rotacja wymagają osobnego działania. Guard nie jest pełnym audytem historii. |
| Zależności | Next15.5.27, shell-quote1.12.0, PostCSS8.5.30, Sharp0.35.5 oraz Node>=20.9 zadeklarowany w manifestach. | Audyt npm: 0critical, 16high, 20moderate, 36 wpisów pakietów. To nie liczba niezależnych exploitów. Pozostałe advisories i runtime hostingu wymagają triage. |

## Testy i niezależna recenzja

| Końcowa kontrola lokalna | Wynik |
|---|---|
| Zbiorczy Vitest, 15 plików | **145/145 PASS** |
| Node fixture repo hygiene | **5/5 PASS** |
| Playwright P0, headless Chrome | **9/9 PASS**, PL/EN; wiek, required-only, eksport, local chat, niedostępne trasy/API, lokalny odczyt i anulowanie po zmianie zgody |
| Opcjonalny redagowany scan źródeł/testów | **PASS**, 482 tracked, 215 text scanned, 1 >1MiB skipped, 0 findings; wykonany przed dodaniem ostatniej recenzji Markdown, bez odczytu zabronionych profili |
| Końcowy guard metadanych indeksu | **PASS**, 483 tracked, 0 content reads, 0 findings; zawiera końcową recenzję integracji |
| Native Sharp smoke, syntetyczny obraz w pamięci | **PASS**, Sharp0.35.5 / Node24.19.0, PNG2×2 |
| Next build / osobny typecheck | **PASS**, 35/35 stron statycznych; `tsc --noEmit` exit0 |
| Git whitespace check wybranych źródeł/testów | **PASS**, po usunięciu tylko dodatkowych pustych linii EOF; recenzent potwierdził niezmienione zachowanie |

Testy używają syntetycznych danych, izolowanego localhost43191 i blokady zewnętrznego ruchu przeglądarki; konfiguracje dostawców są wyzerowane wyłącznie w procesie serwera. Nie pobrano cloud env ani rzeczywistych sesji. Serwer po E2E zatrzymano przed buildem; port testowy nie nasłuchuje.

Build zachował wcześniejsze ostrzeżenia opcjonalnych importów Coinbase `x402-fetch` i `@base-org/account`; nie przekształcono ich w PASS rzeczywistego logowania. Native Sharp działa lokalnie, ale Node i zależności natywne hostingu wymagają staging regression. Pierwsza automatyczna ocena uprawnień do buildu przekroczyła termin przed uruchomieniem; dopuszczone ponowienie wykonało build pomyślnie. Nie było odmowy z uzasadnieniem bezpieczeństwa ani zablokowanej czynności.

Pierwszy zbiorczy Vitest: 133 PASS / 3 FAIL, wszystkie trzy dotyczyły starego kontraktu aktywnego TTS. Autor zaktualizował je do 503 i zera wywołań dostawcy; zachował dziesięć pozostałych testów adaptera. Później dodano niezależne testy i końcowy run jest zielony. Próba uruchomienia Playwright na brakującym bundled Chromium nie wykonała scenariuszy; użyto zainstalowanego Chrome w nowym, tymczasowym profilu headless. Pierwszy E2E7/7 PASS rozszerzono do9; nowe dwie asercje chat początkowo błędnie zakładały dwie wiadomości zamiast czterech początkowych. Poprawiono je na przyrost o jedną niepustą odpowiedź, bez zmiany aplikacji. Końcowy pełny retest9/9 PASS.

Historyczne E2E aktywnego ConvAI/TTS/Kids są jawnie odroczone z uzasadnieniem w plikach, a nowe testy sprawdzają ich niedostępność. Nie liczymy odroczonych testów jako PASS. Fixture core/health zostały dostosowane do wersji zgód i deklaracji18+. Pełny dawny E2E, działające konta/sync/RLS, screening czytnikiem ekranu i chmurowy staging nie zostały zaliczone w tym zadaniu. Test dawnych formularzy nie jest dowodem poprawnego logowania.

Autorzy i recenzenci mają rozłączne role: API — architecture_audit / ux_audit; zgody/eksport/głos — curriculum_pilot / architecture_audit; repo/scope — ux_audit / curriculum_pilot; zależności i E2E koordynatora — ux_audit; AccountSync bridge koordynatora — architecture_audit. [Plan i granice autoryzacji](work-plan.md), [API](api-implementation.md), [repo i zakres](repo-scope-implementation.md), [niezależna recenzja API](api-review.md), [recenzja zależności i harness](dependencies-review.md), [niezależna recenzja klienta i bridge](../reviews/p0-client-review.md), [niezależna recenzja zakresu/repo](scope-repo-independent-review.md). Werdykty przyjmują zabezpieczenia lokalne, z wymienionymi ograniczeniami, bez zatwierdzenia wydania.

Odtworzenie: `npm run test`, `node --test tests/repo-hygiene.test.mjs`, `npm run build`, `npm run typecheck`, `node scripts/check-repo-hygiene.mjs --scan-secrets --json`, `npm run e2e:p0`. W tym środowisku testy wymagają autoryzowanego dostępu do tymczasowego cache; Chrome wybiera się przez `COACHFI_P0_BROWSER_CHANNEL=chrome`. Dev server i build wykonuje się kolejno, bo współdzielą `.next`.

[Końcowa niezależna recenzja integracji](integration-review.md) przyjmuje lokalną paczkę P0 z powyższymi granicami. Wszystkie poprawki źródeł/testów i recenzje znajdują się w lokalnym indeksie; nie wykonano commit ani publikacji. Dokumenty wcześniejszego audytu i inne materiały workspace zachowano.

## Co pozostaje przed wydaniem

Gotowość produkcyjna pozostaje **no-go**: publiczna historia repo i ustawienia dostawców nie zostały zabezpieczone tą zmianą; pozostały high advisories, staging i pełny proces danych konta. Wcześniejsze blokady logowania/wyniku, walidacji score, treści i operacji również nie uzyskują PASS dzięki tej paczce. Budżet pozostaje do decyzji po audycie; bez niego oraz trwałych serwerowych kontroli zewnętrzne AI pozostaje zamknięte. Nie włączać usług przez flagę env ani przywrócenie starych handlerów.
