# C47 — usunięcie nieużywanych deklaracji SDK

Status: ACCEPTED_LIMITED_LOCAL_UNSTAGED. 17.10.2026. Lokalna paczka; produkcja NO-GO. Autor: root. Niezależne recenzje: c47_dependencies oraz c47_curriculum. Poprzednie zmiany i index Git zachowane.

Usunięto z package.json nieużywane @11labs/react0.2.0 oraz @anthropic-ai/sdk0.95.1. Z package-lock.json usunięto dokładnie osiem wyłącznych wpisów: oba SDK, @11labs/client, json-schema-to-ts, ts-algebra, standardwebhooks, @stablelib/base64 i fast-sha256. Root dependencies24→22, lock entries650→642. Pozostałe wpisy i wersje bez zmian; CRLF zachowane. To ogranicza deklarowaną powierzchnię zależności, bez deklaracji naprawy CVE. Zachowane @elevenlabs/client, livekit-client, zod, @babel/runtime, aktywny CDP oraz wygenerowany widget mają odrębnych konsumentów.

Niezależny przegląd 489 plików, 2591 literalnych specyfikatorów i 7 wywołań resolvera nie znalazł użycia obu SDK w sprawdzonym kodzie. Pojedynczy npm uninstall --package-lock-only --offline --ignore-scripts --no-audit z nowymi pustymi config/cache wykonał się w osobnym TEMP z exit0 i pustym stderr. Kandydaci przeszli dokładne porównanie JSON i bajtowych usunięć przed zastosowaniem. Nie wykonano pobierania, instalacji lub pruning node_modules. Flaga npm offline nie jest dowodem izolacji sieciowej systemu.

| Bramka lokalna | Wynik |
|---|---|
| Istniejące testy API i głosu | 36/36 PASS w jednym przebiegu, 3 pliki:29+3+4 |
| TypeScript --noEmit --incremental false | exit0;544inputy bez driftu |
| Jeden build kontrolowanej kopii TEMP | PASS z zachowanymi ostrzeżeniami CDP;34strony/35tras;544przed/543po inputy,0drift |
| Źródła historyczne | 544inputy C46:542literalne+2jawniezmienione;118wcześniejszych ścieżek:116literalnych+2jawniezmienione |
| Parser CSS | 6.1.4;37plików i2konsumenci literalni, kwalifikowana wyłącznie zmiana lockSHA |
| Git i wcześniejsze receipts | HEAD/branch/index bez zmian;8receipts C39–46 zachowane |
| Niezależne recenzje | dwa niezależne końcowe review PASS; 0 otwartych findings |

36 to istniejące przypadki, ponowione ze względu na zmianę zależności. Nie utworzono pozornego baseline błędu aplikacji ani nowych testów samych usunięć JSON. Sprawdzono rzeczywiste handlery lokalnego chatu i hardOFF z mockiem weryfikatora CDP i pułapką fetch; lokalny głos używa syntetycznego silnika SpeechSynthesis. Brak rzeczywistej autentykacji, providerów, dostarczenia mowy w przeglądarce lub testów staging. Nie powtarzano pozostałych zielonych testów C46.

Istniejące node_modules są współdzielone z kopią TEMP i nadal zawierają wszystkie osiem usuniętych z locka drzew. Typecheck/build i testy dotyczą tego runtime; **clean install i fizyczne usunięcie bibliotek nie zostały sprawdzone**. Brak nowego npm audit, liczby aktualnych podatności lub ich zamknięcia. C45 residuals parsermajor/vendored i braces oraz ostrzeżenia CDP pozostają poza przyjęciem. Zewnętrzne AI i cloud writes zachowują hardOFF. Brak stagingu nie daje PASS, a ta paczka nie zmienia gotowości wydania produkcyjnego.

Osobny sprawdzony bilans źródłowy treści:82ID=25ID siedmiu przyjętych modułów+51osobnych wcześniejszych poprawek+6pozostałych. Root niezależnie sprawdził literalne AST, override PL, zbiory i callerów. Sześć ID nie oznacza sześciu usterek ani nowego przyjęcia76pytań. Istniejący us-401k-match wymaga kolejnej świeżej recenzji bezwarunkowych stwierdzeń PL/EN; pozostałe pięć jest nieocenione. Family-plan jest odroczony programowo, lecz nadal source-callable; zakres rodzinny nie został aktywowany ani rozszerzony. B06 nadal7modułów/51poprawek, B10 częściowo otwarte,40tasks zachowane w obu rejestrach.

Dwa findings narzędziowe (zachowanie surowego child receipt przed parsowaniem oraz usunięcie NODE_OPTIONS/NODE_PATH) i uwaga o słowie offline zostały zamknięte statycznym retestem przed eksperymentem. Surowe wyniki i recenzje: [dowody C47](../../../evidence/cycle-47). Inwentaryzacja treści jest przyjęta tylko jako źródłowa, bez walidacji finansowej lub skuteczności. Brak stagingu nowych plików, commit, push, deploy, migracji, odczytu sekretów/profili rzeczywistych lub płatnych wywołań.
