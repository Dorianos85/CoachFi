# Gotowość wydania dla dorosłych, Polska PL/EN

## Lokalna paczka P0 po audycie

Aktualizacja lokalna — [cykl 4 B14](cycle-4/REPORT.md): oddzielne guest/provider/UID namespaces, pending/local-only, captured UI/queue/voice/chat fences, eksport v2 i unieważnienie kolejki przed scoped delete. Niezależne LIMITED ACCEPT, 64 unikalne own cases i 6 zamkniętych findings. 503/503 Vitest, 22/22 E2E PL/EN, typecheck oraz build 34/34 PASS w hash-verified TEMP poza OneDrive; 279 plików/278 porównań po buildzie/0 mismatch. Raw legacy provenance, prawdziwe konta/RLS/staging, offline conflict recovery i pełne prawa operatora nadal wymagają osobnych dowodów. Następne B15. Bez commit/push/deploy; NO-GO dla produkcji.

Aktualizacja lokalna — [cykl 3 B13](cycle-3/REPORT.md): generacje i anulowanie pracy Supabase/CDP, kolejki oraz dirty snapshots przypisane do jednej sesji, cloud-only login bez przejmowania danych urządzenia, API expected-user precondition i jeden aktywny backend. Ograniczone niezależne ACCEPT; 422/422 jednostkowych, 20/20 E2E, typecheck PASS, build 34/34 w zweryfikowanym TEMP poza OneDrive. Dwa wcześniejsze in-workspace buildy miały błędy wygenerowanych plików i nie są PASS. Po zmianie tylko prefiksu syntetycznej fixture retest 27/27 oraz repo guard PASS. Shared profile/health/consent i prawa użytkowników nie uzyskują PASS; następne B14 dotyczy lokalnej własności i zachowania danych gościa. Brak push/deploy, wydanie nadal NO-GO.

Aktualizacja lokalna — [cykl 2](cycle-2/REPORT.md), 14.10.2026: odłączono nieużywane adaptery, poprawiono kompatybilne zakresy zależności i publiczny status bez provider/RPC. Diagnoza zapisuje rzeczywiste lokalne odpowiedzi, pokazuje wersjonowany wynik /98, odróżnia PLN od nieznanych jednostek legacy; rozszerzono ścisły eksport i blokadę legacy health upload. Ograniczone niezależne ACCEPT; 313/313 Vitest, 11/11 Node, 20/20 E2E, build 34/34 i końcowy typecheck PASS. Pełny audit nadal ma 5 high i 13 moderate, produkcyjny omit-dev 12 moderate oraz 0 high/critical. Nie zamyka to B10 ani bramek kont, praw danych, historii repo i stagingu. Następne B13: spóźnione operacje synchronizacji po zmianie sesji. Produkcja pozostaje NO-GO i bez zmian.

14.10.2026 przygotowano gałąź `codex/p0-security-consent-export`: domyślnie wyłączone zgody opcjonalne, wybrany eksport lokalny bez auth, stałe blokady usług AI oraz Kids/Web3/partnerstw/rankingu, bieżąca higiena indeksu i minimalne aktualizacje critical dependency ranges. [Raport i testy](p0/REPORT.md) oraz niezależne opinie rozdzielają przyjęcie tych kontroli od zgody na wydanie. Wyniki: Vitest145/145, Node5/5, E2E P0 PL/EN9/9, build35/35 i osobny typecheck PASS. Nie wykonano push/deploy; poniższa ocena bazowego publicznego wydania pozostaje aktualna dla produkcji.

Nadal no-go: historyczna/publiczna ekspozycja repo, pozostałe high advisories, rzeczywiste konta/sync i prawa do danych u dostawców, staging oraz wcześniejsze blokady score/treści/operacji. Zewnętrzna Mila jest wyłączona do nowego recenzowanego adaptera z trwałymi limitami, zatwierdzonym budżetem i autorytatywną kontrolą zgód/wycofania. Zmiany lokalne nie zamykają całych kryteriów R02–R13.

Ocena dotyczy publicznej bety oraz lokalnego commitu `86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b`. Powiązanie z produkcją potwierdzono metadanymi Vercel: deployment `dpl_AaEiWV85rietTuq3Z5GqogCu3DuN`, READY, production, alias coachfiai.com, zgodny githubCommitSha; dowody A24/A25. **Decyzja: no-go do zamknięcia wysokich ryzyk i zebrania dowodów staging.** To bramka zakresu wydania, nie stwierdzenie, że wszystkie funkcje są zepsute. Audyt dokumentacji i lokalne testy nie zastępują testu kont, zapisu i operacji.

Właściciel kryteriów: rola4. Autor tej propozycji: koordynator. Niezależne opinie w `reviews/`; audytor nie zatwierdza własnego UX. Wersje standardów sprawdzone14.10.2026: [WCAG2.2](https://www.w3.org/TR/WCAG22/) AA, [ASVS5.0.0](https://owasp.org/projects/asvs), [LLMTop10 2025](https://genai.owasp.org/llm-top-10/). Numery poniżej to wewnętrzne kryteria, nie fikcyjne IDs ASVS.

| ID | Kryterium | Dowód przyjęcia | Stan obecny / odpowiedzialny |
|---|---|---|---|
| R01 | Spójny adult scope i pierwszy rezultat | Jeden start i brak rozpraszającego Kids/Web3 w głównej ścieżce; deklaracje zgodne z produktem | Luki potwierdzone UX; role10/18 |
| R02 | Rejestracja, logowanie i odzyskiwanie | Nowe własne konto staging, wymagane zgody, sesja, wylogowanie, odzyskanie; brak fałszywego sukcesu | Pełny flow nieprzetestowany;12/14 |
| R03 | Pierwsza lekcja, quiz, działanie, zapis i powrót | PL iEN, reload, nowa sesja; zachowanie na drugim urządzeniu jeśli sync obiecany; przerwa bez kary | Lekcja/quiz obejrzane; zapis i realny powrót pending;11/12 |
| R04 | Poprawne treści PL/EN | Pełny eksport/version, recenzja każdego klucza i obliczenia; test językowy | Pilot24 osobno; quizEN wPL potwierdzony;3/7/8/21 |
| R05 | Demo i score wyjaśnione | Wszystkie widoki i audio oznaczają demo; wzór, wejścia, jednostki, braki i referencyjne wartości | Niespójności widoczne; kod wymaga oceny i fixture;3/12 |
| R06 | Dostępność głównej ścieżki | Automat + klawiatura, fokus/dialog, reflow320CSSpx, zoom, kontrast, czytnik ekranu, błędy PL/EN | Częściowe testy i błędy UX;10/4 |
| R07 | Auth i izolacja bez high/critical | Mapa ASVS ze zweryfikowanymi IDs; test dwóch kontrolowanych kont i wszystkich API; retest findings | Statyczny review i dynamiczny staging wymagane;14 |
| R08 | Minimalizacja i prawa użytkownika | Administrator/kontakt/retencja/dostawcy; właściwe zgody; eksport/usunięcie we wszystkich aktywnych miejscach | Privacy/Terms szkice; proces niewykazany;15 |
| R09 | Działająca pomoc i eskalacja | Zgłoszenie własnymi testowymi danymi dochodzi do wskazanego ownera; FAQPL/EN | Kontakt/help niewykazany w publicznym footer;19 |
| R10 | Monitoring i runbook | Test alertu, odbiorca, metryki bez finansów/rozmów; obsługa incydentu | Brak bieżącego dowodu operacyjnego;16 |
| R11 | Backup, restore i rollback | Odtworzenie reprezentatywnych danych staging, zgodność kontrolna, czas, RPO/RTO; rollback release | Brak testu; lokalny storage ma odrębną granicę odzyskania;16/12 |
| R12 | Mila i awaria AI | Evals, źródła, deterministyczne kalkulatory, server cap, timeout, ograniczone retry, spokojny fallback | Spec i kod to początek; brak testu aktywnego provider config;13/14/16 |
| R13 | Aktywacja i efekty | Minimalny słownik eventów, prawa/retencja, test zapisów; wiedza po czasie i działania osobno | Proponowana spec, brak efektów produktu;17/15 |

Go wymaga zamknięcia wszystkich kryteriów w zakresie. Wydanie demonstracji wymaga jawnego ograniczenia zakresu i oznaczenia danych; nie należy nazywać go gotowym produktem kont z synchronizacją. Nierozstrzygnięte wymaganie nie może uzyskać pass przez milczenie. Wykluczony moduł musi być niedostępny z głównej ścieżki, a nie tylko wyłączony z raportu.

Aktualizacja lokalna po cyklu5 B15:606/606 unit,22/22 guestE2E,TS/buildPASS oraz niezależne LIMITED ACCEPT ograniczają ryzyko utraty własnych bytes przez hard-off cloud writes. Nie zaliczają R02/R03/R07/R08/R11 dla realnych kont, wielu urządzeń, RLS lub pełnych praw danych. API PUT pozostaje503 do atomowego kontraktu B16. [Bieżący dowód](../../evidence/cycle-5/verification.json) oddziela gate koordynatora od syntetycznej recenzji i produkcji.

## Dodatkowa bramka premium

Zakup w test mode → webhook z podpisem → prawidłowe uprawnienia → retry/idempotencja → odnowienie → błąd/ponowienie płatności → anulowanie → koniec okresu → zwrot → help. Sprawdzić PL/EN, cenę brutto, walutę i podatki, politykę anulowania oraz ograniczenia miejsc rodziny. Nie otwierać płatnego planu zanim koszt free i premium oraz wartość dla użytkownika są zmierzone. Ocena prawna i podatkowa po ustaleniu sprzedawcy.

## Plan testów score

Po odczytaniu wzoru: fixture zwykłego dochodu; nieregularny miesiąc; zerowy dochód; wydatki większe niż dochód; brak rezerwy; wydatek zero; brak/ujemne/nieskończone kwoty; dane z separatoramiPL/EN; zaokrąglenia; wzrost rezerwy przy stałych innych wejściach. Oczekiwania liczbowe ustala recenzja wzoru, nie sam autor testu. Wynik nie ocenia wartości człowieka ani nie łączy automatycznie wiedzy z dobrostanem. Własny score pozostaje heurystyką bez walidacji naukowej.

## Operacje i bezpieczeństwo — dowody do zebrania

Dla autoryzacji, sesji, storage i konfiguracji przypisz faktyczne wymagania z wersjonowanego ASVS5.0.0 dopiero po przeczytaniu katalogu standardu. Zakres LLM obejmuje prompt injection, ujawnianie danych, nadmierne uprawnienia, zaufanie do wyjścia, bazę wiedzy i koszty. Nie prowadzić zakłócających testów produkcyjnych. Kopię odtwarzać w odizolowanym stagingu; nie ogłaszać RPO/RTO zanim próba nie poda czasu i kompletności. Awaria AI nie ma blokować dostępu do zatwierdzonej lekcji i zapisanych działań.
