# Cykl 9 — B19: uczciwy wynik zapisu wyzwania dnia

15.10.2026, prace rozpoczęte14.10. **PRZYJĘTY LOKALNIE — LIMITED ACCEPT.** Gałąź `codex/p0-security-consent-export`, baza `86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b`. Zachowano wcześniejsze zmiany. Bez commit/push/deploy, migracji, produkcyjnych zapisów, rzeczywistych kont/profili/sesji/sekretów i płatnych wywołań. Produkcja **NO-GO**.

## Problem i poprawka

Trzy syntetyczne baseline cases uruchomiły rzeczywiste helpers punktów i completion marker. Odmowa markera pozostawiła saldo175 zamiast125, a stare ponowienie zwiększyło je do225. Write-then-throw markera pozostawił175 i datę ukończenia pomimo wyjątku; błąd token event pozostawił175 bez markera. To reprodukcje defektu, nie acceptance. Dawna kolejność UI została odczytana ze źródła, bez uruchamiania starej przeglądarki.

Nowy kontroler sprawdza aktualnego ownera/ticket, istniejący marker oraz nagrodę przed mutacją. Wrong i wcześniej ukończone wyzwanie nie naliczają nagrody. Oba zapisy przechodzą przez śledzony uchwyt. Sukces wymaga potwierdzenia salda i markera oraz zakończenia synchronicznej aktywności. Każda próba set/remove oznacza, że późny błąd jest niepewny; kontroler blokuje ponowienie w tej instancji. Retry jest dostępny wyłącznie przed próbą zapisu. Reentry, stare callbacki, cleanup i zmiana ownera są odgrodzone.

Strona PL/EN pokazuje sukces, ukończenie i zdobyte punkty dopiero po saved. Niepewny wynik pozostawia ostrzeżenie i wyłącza odpowiedzi/submit. Zmiana języka zachowuje blokadę. Nie ma reload CTA jako retry. Nieodczytywalny marker umożliwia tylko jawne ponowne sprawdzenie odczytu, bez naprawy/nadpisywania bajtów. Tylko null albo wcześniejsza poprawna data otwierają wyzwanie; błędny JSON, przyszła data lub nieznane pola nie oznaczają dostępnego wyzwania. Istniejące UTC daty, dobór pytania i countdown pozostają bez migracji.

## Niezależna recenzja i findings

Autor helpera **daily_author**, autor UI/narzędzi **root**. Niezależni: [daily_data_review](save-review.md), **97/97**, oraz [daily_ui_review](ui-review.md), **21/21**. Ich118 przypadków jest podzbiorem aggregate1120; autor96 osobno. Harness UI wykonuje rzeczywistą stronę i helpers z kontrolowanymi hookami/storage, nie ReactDOM ani rzeczywiste logowanie.

**C9-DATA-01** odtworzono dwoma nieudanymi niezależnymi testami: setter zwracający true bez zmiany salda i usunięcie salda w activity dawały fałszywy saved. Autor dodał ścisłe potwierdzenie nagrody przed markerem/activity oraz kontrolę zdrowego salda po activity. Dopuszczony dodatkowy bonus streak nie ukrywa braku wcześniejszego zapisu. Niezależny retest zamknął finding bez osłabiania oracles; realne helpers streak2→3 i dodatkowe15 dają190, przy potwierdzonej nagrodzie wyzwania50. Wrapper callbacków i syntetyczny UI nie są testem milestone w zamontowanym produkcyjnym providerze.

Pierwsze UI20 miały5PASS/15FAIL przez zbyt szeroką asercję braku „+50”, trafiającą w stały badge nagrody. Recenzent zawęził ją do istniejącej karty zdobytych punktów i wzmocnił count0/1. Root niezależnie odwrócił dokładne sześć delt do początkowego hasha; istniejące data/writer/owner/activity assertions zachowano. Retest18/18 pozostawił dwa niezmienione green poza przebiegiem. Po zmianie helpera pełny uzasadniony retest z dodanym milestone case dał **21/21**, bez skipped. Historie pozostają w evidence.

Pierwszy standalone TS zgłosił jeden niepełny cast w fixture autora. Zmieniono wyłącznie explicit unknown, z zachowaniem oracle i inverse hash; końcowy standalone TS exit0. **C9-TOOLS-01/02** zamknięto niezależną recenzją narzędzi oraz29 różnymi syntetycznymi przypadkami w dwóch przebiegach (27+2, nie pojedyncze29/29): paths/hashes przed compiler, repo/TEMP/junction, copied/current fingerprints, traversal/forbidden/junction i Windows colon/ADS. Testy narzędzi nie są doliczone do Vitest1120.

## Końcowe kontrole

| Kontrola lokalna | Wynik |
|---|---|
| Vitest | **1120/1120 PASS**,64pliki,0failed/pending |
| Standalone TypeScript | **PASS**,exit0 |
| Playwright | **8/8 PASS**,0skipped/flaky,114712,324ms; PL/EN |
| Next build | **34/34 PASS**,exit0 |
| Kopia buildu | **313wejść**, preflight313; postflight312,0rozbieżności current/copied; wyłączony tylko hash generowanego next-env |
| Niezależne fingerprints | **27porównań/24ścieżki**,0rozbieżności; unchangedC6/C7/C8 również potwierdzone |
| Serwer testowy | Port43191: **0listenerów**, host probe z terminating errors |

Browser obejmuje mobile/klawiaturę, wrong bez nagrody, poprawny zapis50, odczyt persisted completion po reload bez replay, malformed marker/saldo z zachowaniem bajtów, read failure przed writerem i explicit retry oraz write-then-throw markera z quarantine po zmianie języka. Fresh headless Chrome na localhost, stała syntetyczna data UTC, ruch poza localhost zablokowany. Nie używano realnego auth/audio/providerów. Nie powtarzano wcześniejszych zielonych browser ścieżek.

Browser snapshot `coachfi-cycle9-verify-wfHzM3`; finalny build w świeżej kopii `coachfi-cycle9-verify-9hgAXi`. Osobna kopia pozwala wykonać preflight next-env przed compiler po zakończeniu serwera. Kopie bez env/Git/profili/real DB, istniejące node_modules przez kontrolowany junction, bez install. Znane optional warnings x402-fetch/@base-org/account nie potwierdzają działania tych funkcji. Compiler font HTTP nie był wykluczony. Finalna parity wykonana po buildzie; wcześniejszy wynik przed zakończeniem zachowano jako preliminary, nie końcową bramkę.

[Verification](../../../evidence/cycle-9/verification.json) zawiera wyniki, hashe, korekty i końcowy repo guard/scoped diffcheck. Dowód koordynatora jest także w root workspace `evidence/coachfi-cycle-9.json`.

## Ograniczenia i następne zadanie

Quarantine jest tylko w RAM jednej instancji. Niezależny test wykazał, że odrzucenie kontrolera po failed marker i otwarcie nowego może zwiększyć175→225. **Nie ma gwarancji exactly-once po reload/remount lub między kartami/urządzeniami**, trwałego journalu, atomic rollback ani odzyskiwania brakującej nagrody. Walidacja markerów nie naprawia schematów streak/SRS. Callback async jest odrzucany jako sukces; nie stanowi sandboxu dowolnych późniejszych side effects. Nie przyjęto kalendarza Polski, całego banku wyzwań, innych reward views, pełnego WCAG, skuteczności edukacji, kont/RLS/stagingu albo produkcji. Automatic cloud writes, zewnętrzne AI, health upload/Kids/Web3/afiliacja pozostają off.

Następny wykonalny **B20**: odtworzyć source observation w `app/crisis/page.tsx`, gdzie markDone zapisuje action marker i publikuje done przed addTokens. Obecnie jest to wyłącznie kolejność w źródle, bez runtime finding lub naprawy. Następnie dalszy B06 PL/EN. B02/B09/B10/B16 i budżet pozostają osobnymi bramkami. Pętla nadal aktywna; nie powtarzać niezmienionych zielonych testów.
