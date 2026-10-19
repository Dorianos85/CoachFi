# Coachfi.ai — audyt i pierwszy plan gotowości

14 października 2026. Rynek: **Polska, dorośli, PL/EN**. Limit wydatków: **do decyzji po audycie**. Koordynator i trzech specjalistów pracowali w granicy czterech aktywnych agentów; niezależne recenzje wykonano w kolejnej fali.

**Ocena wydania: NO-GO dla pełnego przyjmowania realnych użytkowników.** Beta działa i ma użyteczne elementy. Pozostają wysokie ryzyka bezpieczeństwa/zgód, błędy treści i lokalizacji oraz brak dowodów pełnej ścieżki konta, zapisu, usuwania i operacji. To ocena zakresu gotowości, nie twierdzenie o wykonanym ataku lub awarii wszystkich funkcji.

## Siedem zamówionych rezultatów

| Rezultat | Dokument / konkretny wynik |
|---|---|
| 1 Mapa produktu i działanie | [Architektura](audit/architecture.md) i [publiczne UX](audit/product-ux.md). Repo, wersje, frontend/API/auth/sync/AI i 31 obserwacji z 23 screenshotami. |
| 2 Blokady nowych użytkowników | [Ryzyka](risk-register.md) i [niezależna recenzja bezpieczeństwa](reviews/security-code-review.md). Email zawierający @ lokalnie odblokowuje score; polski quiz ma angielski fallback, a demo, fokus dialogu, zgody i dane wymagają poprawek. |
| 3 Rejestr agentów i skille | [23 role](agent-registry.md), [24 specyfikacje](skill-specifications.json) i 24 manifesty `.agents/skills/coachfi-*/SKILL.md`. Oficjalny walidator: 24/24 PASS; niezależna recenzja programu. |
| 4 Plan głównej ścieżki PL/EN | [Plan ścieżki](path-improvement-pl-en.md): start → pierwsza lekcja → quiz → działanie → zapis → powrót → pomoc, ze stanami demo/offline/błąd i kryteriami. |
| 5 Treści i pierwszy pilot | [Inwentaryzacja](audit/content-inventory.md): 8 lekcji, 28 kroków, 82 ID pytań, co najmniej 11 par identycznych promptów. [Pilot 24 PL/EN](content/quiz-pilot-24.json) v0.1.1: 24 pozycje, 48 tłumaczeń, 8 obszarów, 3 poziomy. [Recenzja](reviews/quiz-review.md): klucze, rachunki i znaczenia accepted_limited; nadal draft, źródła/UI/badanie użytkowników pending. |
| 6 Gotowość, rozwój i koszty | [Bramki](release-readiness.md), [plan 30/60/90](roadmap-30-60-90.md), [koszty 27 scenariuszy](cost-estimate.md), [publiczne cenniki](provider-price-reference.md), [backlog](backlog.json), [16 testów Mili](mila-evaluation-cases.json). Terminy i ceny usług nie są zatwierdzonym budżetem. |
| 7 Decyzje Foundera | [Rejestr decyzji](decisions.md): ekspozycja repo, adult scope, konto/sync, operator danych/support, budżet/premium. Polska i limit po audycie już ustalone. |

## Co zostało sprawdzone

Źródła: [Dorianos85/CoachFi](https://github.com/Dorianos85/CoachFi), SHA `86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b`. Metadane Vercel potwierdziły READY/production, alias coachfiai.com i zgodny SHA (`dpl_AaEiWV85rietTuq3Z5GqogCu3DuN`, A24/A25). Początkowy brak repo w wyszukiwaniu GitHub został rozwiązany po podaniu adresu przez Foundera.

TypeScript PASS; 5 suitów / 50 testów PASS; build PASS / 35 stron, z ostrzeżeniami opcjonalnych modułów Coinbase. Pierwsza próba Vitest wykonała 0 testów przez EPERM cache; ponowienie poza sandboxem przeszło. Testy obejmują SRS, streak i wybrane funkcje Mili. Pełna ścieżka auth/score/privacy pozostaje do sprawdzenia. [Dowody](../../evidence/application-checks.json).

Przegląd live UI obejmował obie wersje językowe oraz viewport 390×844. Czytnik ekranu, izolowany profil i rejestracja wymagają dalszych testów. SSR 0/0 oraz chwilowy disabled nie są stałą usterką; liczby 82 w całym banku i 28 w Learn oznaczają różne zakresy. Ograniczenia są przy dowodach.

## Najważniejsze ustalenia do zamknięcia

- **Pilne ryzyko repo:** 1421 śledzonych plików profili przeglądarki, w tym nazwy Cookies / Login Data / History. Zawartości nie czytano; aktywne sesje i dane niepotwierdzone. [Plan sprawdzenia i zabezpieczenia](incident-browser-profiles.md).
- **API i koszt:** signed URL Mili bez auth/rateLimit; leaderboard przyjmuje nazwę i wyniki klienta bez auth; limity chat/TTS są procesowe/IP bez globalnego cap. Kontrole serwerowe wymagają poprawek i retestu. Nie wykonano exploita.
- **Zgody i dane:** required-only włącza opcjonalne AI/voice; ścieżki TTS/mint mają luki egzekwowania zgody. Eksport prefixu coachfi-* może objąć magazyn sesji; dwa auth/sync mają różne kontrakty i politykę kwot. Usunięcie lokalne nie usuwa danych u wszystkich dostawców.
- **Zależności:** npm zgłasza 42 wpisy dotkniętych pakietów: 2 critical / 20 high / 20 moderate. Liczniki obejmują propagację tych samych zależności. Next i shell-quote mają zweryfikowane GHSA; osiągalność i poprawiona wersja wymagają triage. [Surowy wynik](../../evidence/npm-audit.json).
- **Score:** wagi sumują się do 98; nieedytowalne demo inwestowania ogranicza obecną ścieżkę do 90. Wskaźnik miesza sytuację, deklarowaną wiedzę i długość celu; brak naukowej walidacji. Potrzebne referencyjne obliczenia, obsługa braków danych i jasne demo.
- **Edukacja:** pierwsza lekcja mówi o oszczędzaniu przed czynszem/jedzeniem, ETF utożsamiono z indeksem, przybliżenie realnej stopy opisano jak dokładne, a 800 USD/mies. w przykładzie emerytalnym daje ok. 416741 zamiast 524963. Ustalenia i niezależne rachunki w [recenzji treści](reviews/content-review.md).

## Koszty i następny priorytet

Model planistyczny: przy 1000 aktywnych / 10% premium, cenie 5 USD brutto i wariancie podatku 23%, koszt wynosi 208,75 / 482,50 / 1492 USD miesięcznie dla niskiego / typowego / intensywnego użycia. Są to syntetyczne założenia, bez rozwoju, prawa, pozyskania i głosu. Typowy wynik: −76 USD przed wyłączeniami; intensywne użycie jest nierentowne. Rzeczywiste faktury, podatek, zużycie i waluta niepotwierdzone. Publiczna taryfa Haiku 4.5 zwiększyłaby typowy koszt o 19 USD przy 38000 odpowiedzi względem modelu syntetycznego. Źródło i wyliczenie w cennikach odniesienia.

Najpierw: kontrolowane sprawdzenie ekspozycji repo, triage zależności, serwerowe auth/zgody/limity i bezpieczny eksport. Równolegle: PL/EN i błędy lekcji/score. Następnie: pełna ścieżka dwóch kont w staging, support/privacy i restore/rollback, potem kontrolowany pilot użytkowników i pomiar korzyści. Premium i rozszerzenia po własnych bramkach.

Potrzebne zasoby: staging i konta testowe; aktywna konfiguracja bazy/dostawców przez bezpieczne połączenie; specyfikacja i prompty Mili; operator i kontakt support/privacy; metryki/faktury i runbook. Dostępy należy przekazać bezpiecznym połączeniem. Nie zmieniono aplikacji ani produkcji, nie uruchomiono usług/kampanii ani wiadomości do osób. Przygotowano lokalne dokumenty, procedury i materiał do review. Publikacja w GitHub oraz wdrożenie to odrębne kroki.
