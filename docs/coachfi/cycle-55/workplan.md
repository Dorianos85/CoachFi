# C55 — dostępność onboardingu

Status: DESIGN_PENDING_BASELINE. Właściciel produktu: c49_validation (OnboardingModal i jedna referencja AppNavigation). Fixture: c49_advisories. Root: narzędzia i wykonanie, peer fixture/source. Niezależny reviewer: c49_dependency_review. Root+3; autor nie zatwierdza własnej zmiany.

Źródła potwierdzają brak nazw/powiązań i mechanizmów focusu w rzeczywistym modalu, lecz zachowanie natywne wymaga baseline. Bez nowego odpytywania odroczonego artefaktu zależności C50. C54 i178current pins zachowane. C55 nie zamyka B07 lub pełnego WCAG AA.

Kontrakt: istniejący Radix, nazwa dialogu i trwała etykieta PL/EN; fokus przy otwarciu/zmianie kroku, trap Tab/ShiftTab i powrót do połączonego elementu lub logicznego mode trigger. Escape i widoczny Close tylko zamykają stan bez zapisu/ukończenia/onDone; zewnętrzna interakcja nie zamyka. Explicit Finish/Skip zachowują istniejący owner/save/error kontrakt. Brak nowego pola/danych, zależności, rynku lub zmian auth/zgód/głosu/cloud.

Baseline Node i2Chrome na istniejącym source-verified C54 buildzie przed mutacją. Nowe fixture/config mogą być skopiowane do TEMP bez naruszania aplikacji/.next; piny osobne. Po zmianie te same testy, targeted istniejące tylko gdy dotknięte, jeden TS i nowy C55 TEMP build/Chrome. PL finish przez real consent/adult setup i EN skip ze stanem syntetycznym; nie pełne2×2. Czytnik ekranu i pełne desktop/AT pending.

Referencje sprawdzone18.10.2026: [WAI modal pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) — nazwa, contained Tab, Escape i logiczny powrót; [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog) — modal API. Online docs pokazują1.2.0; lokalny1.3.1 wymaga kontroli zainstalowanego źródła i testu. Nie twierdzimy zgodności wersji ani pełnegoAA na podstawie automatu.

Bez add/commit/push/deploy/migracji/produkcji, sekretów/prawdziwych profili/płatnych/provider calls. AI/cloudwrites HARD_OFF, produkcja NO-GO.
