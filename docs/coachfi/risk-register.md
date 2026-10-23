# Ryzyka i blokady

PriorytetP0/P1 określa kolejność pracy. HIGH w review bezpieczeństwa to ocena statycznego znaleziska, nie dowód wykonanego exploita produkcji. Brak testu nie jest podatnością ani pozytywnym wynikiem. Stan14.10.2026.

| ID / priorytet | Problem i dowód | Status | Owner / recenzent | Warunek zamknięcia |
|---|---|---|---|---|
| K01 P0 | Publiczne repo śledzi profile przeglądarki; zawartość nieodczytana | Metadane sprawdzone, incydent pending |14+Founder /4| Kontrolowany przegląd, właściwa reakcja sesji/kluczy/historii, niezależna kontrola |
| K02 P0 | Podpisany tokenMili bez auth/rate limit w kodzie; TTS/chat z ograniczonymi kontrolami | Statyczny finding, produkcja pending |13/14/16 /4| Autoryzacja/zgody i server caps; testy staging i retest |
| K03 P0 | Leaderboard przyjmuje score/nazwę klienta i używa server-service bez auth | Statyczny finding |12 /14| Powiązana tożsamość, autoryzacja i wyliczenia serwerowe albo odłączenie zakresu |
| K04 P0 | Nieprzetestowana cała ścieżka konto→postęp→powrót i izolacja | Niesprawdzone |12/11 /4| Dwa własne konta staging, zapis i powrót, recovery |
| K05 P0 | Privacy/Terms publicznie robocze; mapowanie local vs konto/AI może być nieaktualne | Szkice sprawdzone; przepływy wymagają kontroli |15 /14+człowiek| Faktyczna mapa, kontakt/retencja/prawa i przeglądPL |
| K06 P0 | Brak dowodu monitoringu, restore/rollback i globalnego capAI | Niedostępne operacyjnie |16 /4| Przetestowany alert/recovery/rollback i cap zatwierdzony |
| K07 P1 | PL lekcja prowadzi do EN quizu, fallback źródłowy | Sprawdzone UI i kod |11/21 /3/10| Wszystkie tematy i feedbackPL/EN, brak niejawnego fallback |
| K08 P1 | Dialog fokus/warstwy mobile; stany zgód niewidoczneAT | Sprawdzone wybrane interakcje |10/11 /4| Keyboard, screenreader, zoom i mobile retest |
| K09 P1 | Score i demo różnią się między widokami/narracją; wzór wymaga review | Widoki sprawdzone; matematyka pending |12/3 /4| Jedno źródło danych, jasne demo, fixture i wyjaśnienie |
| K10 P1 | Bank ma duplikaty/braki PL i metadanych merytorycznych | Inwentaryzacja kodu |7/8/21 /3| Pełny mapping, dedupe, źródła i review każdej pozycji |
| K11 P1 | Kids/Web3/rentowności/dźwignia/numerologia w publicznym produkcie | UI sprawdzone |18/10/2 /3/15| Scope zgodny z decyzją i uczciwe copy |
| K12 P1 | Cena5USD z intensywnymAI może mieć ujemną marżę | Syntetyczny model, nie pomiar |16/18 /3| Rzeczywiste koszty, limity i test ceny z wartością |
| K13 P1 | Efekt edukacji i nawyków niezmierzony | Hipoteza |5/6/17 /3| Autoryzowane badanie, recall po czasie i działania osobno |
| K14 P0 | npm audit:2critical/20high/20moderate wpisów pakietów; Next15.5.18 i shell-quote1.8.4 objęteGHSA | Dopasowanie wersji sprawdzone; runtime reachability pending |14/2 /4| Triage każdego istotnegoGHSA, poprawiona zależność albo uzasadnione wyłączenie i retest |
| K15 P0 | Akceptacja wymaganych zgód ustawia opcjonalneAI/voice=true; TTS/mint nie weryfikują właściwej zgody na serwerze | Potwierdzone w kodzie, ruch staging pending |12/15 /14| Optional domyślnieoff, odrzucenie/wycofanie skuteczne wUI iAPI, test network |
| K16 P0 | Eksport coachfi-* obejmuje klucz coachfi-auth używany dla sesji; deletion local nie usuwa danych dostawców | Warunek kodowy sprawdzony; tokenów użytkownika nieodczytano |12/15 /14| Allowlist eksportu bezauth i kompletna mapa/proces usunięcia |
| K17 P1 | Oszczędzanie przed podstawowymi potrzebami, ETF/index i przybliżenie real return, błędne800/mies.emerytura | Odczyt kodu i niezależna arytmetyka |7/8 /3| Poprawione lekcje/klucze/feedbackPLEN, źródła i recenzja |

Szczegółowe ustalenia bezpieczeństwa, wersje zależności i zakres nieprzetestowanych kontroli znajdują się w niezależnym `reviews/security-code-review.md`. Metadane Vercel potwierdziły zgodność publicznego deploymentu z audytowanymSHA (A24/A25); staging, aktywna konfiguracja i retesty nadal wymagane. Nie podejmowano działań produkcyjnych ani płatnych.

Cykl5 B15: cold resume/conflict reprodukcje potwierdziły nadpisanie niepotwierdzonych danych. [Lokalna poprawka](cycle-5/REPORT.md) zachowuje własny cache/REV i wyłącza automatic writes; failed-read copy poprawione po niezależnym findingu. Ryzyko automatycznego nadpisania jest opanowane w ocenionych ścieżkach, lecz istniejący cache nie odświeża się sam. Brak CAS/journal/replay/many-tab atomicity i controlled accounts/RLS pozostaje otwartą bramką B16, nie PASS. Powyższa tabela jest historycznym audytem, nie deklaracją stanu produkcji po lokalnych poprawkach.
