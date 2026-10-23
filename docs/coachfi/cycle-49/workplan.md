# C49 — nieużywana deklaracja klienta głosu

18.10.2026, Polska, dorośli, PL/EN. B10: usunąć wyłącznie nieużywany root @elevenlabs/client oraz 14 jego wyłącznych wpisów locka, na podstawie niezależnie odtworzonego grafu i świeżego przeglądu źródeł. Zachować współdzielone jose/tslib i samodzielny wygenerowany widget, worklets, konfigurację oraz granicę hardOFF. Nie jest to zmiana dostawcy, aktywacja AI lub naprawa wszystkich advisories.

Root jest autorem manifestów i sześciu narzędzi. c49_dependency_review niezależnie recenzuje graf, źródła, narzędzia przed ich wykonaniem, kandydatów i zastosowaną zmianę. c49_validation sprawdza narzędzia walidacji, surowe wyniki i końcowy ledger. c49_advisories osobno odświeża znane residuals wyłącznie w publicznych źródłach. Każdy specjalista zapisuje tylko przydzielone raporty JSON/MD; nie modyfikuje produktu ani nie powtarza testów. Root+3, autor nie przyjmuje własnej zmiany.

Kandydat powstaje w jednym nowym TEMP przez npm uninstall --package-lock-only --offline --ignore-scripts --no-audit --no-fund, z pustymi config/cache i bez NODE_OPTIONS/NODE_PATH. Surowy child receipt zachować przed parsowaniem. Zastosować tylko dokładną deltę: jeden root dependency 22→21 i 14 wyłącznych lock entries 642→628; zero innych zmian wpisów i CRLF. Brak minimalnego kandydata oznacza brak automatycznego zastosowania lub ponawiania.

Przyjęcie: jeden przebieg istniejących 36 przypadków API/hardOFF/lokalnego głosu, TypeScript bez emisji i jeden kontrolowany TEMP build; surowe dowody oraz niezależne recenzje i retest uwag. Zmiana zależności uzasadnia retest C47; nie powtarzać pozostałych zielonych testów C48 lub pisać pozornego failing-app baseline dla usunięcia nieużywanych deklaracji. UI i wygenerowany widget pozostają literalne, bez nowego browser testu.

Istniejące node_modules nie będą prunowane; wyniki dotyczą tego runtime, a nie czystej instalacji lub fizycznego usunięcia bibliotek. Bez świeżego globalnego audit, CVE closure, staging lub produkcja PASS. Zachować C48 i wcześniejsze receipts, źródła i index. Bez stagingu nowych plików, commit/push/deploy, migracji/zapisów produkcyjnych, prawdziwych profili/sesji/sekretów, płatnych wywołań lub kontaktu z ludźmi. Zewnętrzne AI i cloud writes hardOFF.


Doprecyzowanie przed pierwszą walidacją: usuwany @types/dom-mediacapture-record ma global augmentations. Jedyny osobny TypeScript check użyje wszystkich dotychczasowych automatycznych typów z wyłączeniem tego pakietu oraz --listFiles. Zapis komendy i listy, brak usuwanego pliku oraz obecność dwóch plików projektu i lib.dom.d.ts są częścią bramki. Nie zmienia to tsconfig projektu i nie stanowi dowodu clean install.
