# C65 — walidacja ceny zakupu

C65_STATUS: SOURCE_CONFIRMED_BASELINE_PENDING.

Zakres: cena w aktywnym /shopping dla dorosłych w Polsce, PL/EN. Hipoteza C64 wskazuje cenę 1e308 bez limitu oraz normalizację pustej/niepoprawnej wartości do0. Wymagany rzeczywisty baseline komponentu i przeglądarki przed zmianą produktu. Cena ma zachować zapis użytkownika, rozpoznawać skończone reprezentowalne grosze od0 do istniejącego technicznego 1e12 PLN, pokazywać błąd i wstrzymywać niepoparty wynik oraz przygotowany głos. Celowe0 pozostaje ważne. Nie jest to budżet Foundera ani walidacja polityki zwrotów.

Autor produktu c49_advisories: wyłącznie page.tsx i shopping-amounts.ts oraz nowa propozycja/design. Autor fixture c49_validation: nowe testy Node/native i config/design; późniejszy PRODUCT peer wyłącza własne fixture. Niezależny c49_dependency_review: source/math/PLEN/fixture/tools/raw. Root: narzędzia, wykonanie, rejestry. Limit root+3, pliki rozłączne; autor nie przyjmuje własnego kodu.

Zachowaj COPY9, cały audyt C64, wagi i reguły decyzji oraz dotychczasowe Math.round(price*0.6) w jednostkach waluty. Puste dni i pozostałe pola liczników pozostają osobnym źródłowym followup C66. Native zachowanie 1e309 wymaga obserwacji; nie utożsamiaj go ze skończonym 1e308 lub emulowanym handlerem.

Plan: peer dokładnego proposal/fixture/tools, bootstrap aktualnego C64 carry268 i579 wejść, 12 nowych Node oraz2 native PL/EN przed produktem. Native baseline użyje sprawdzonego buildu C64 z dopisaniem tylko nowych spec/config. Po dokładnym release/aplikacji: te same12, wybrany regresyjny C64, TypeScript, jeden nowy TEMP build i2 native. Regresja C64 jawnie wybiera12 grup audytu, pomija2 stare kontrole oczekujące numeric price.props.value; nowy kontrakt jest raw string, a kontrolę default/return/sell obejmuje nowa fixture. C64 nie zmienia się. Nie powtarzaj starego baseline ani testów bez związku ze zmianą.

Bootstrap268 jest w całości literalny; po zmianie obie istniejące ścieżki page/helper wymagają kwalifikacji. Oczekiwany current276 =5 source/fixture +5 tools +266 dawnych literalnych; snapshot582 =579+3 nowe fixture/config. Zachowaj13preserve/26receipts/15SDK i nieobecność usuniętego helpera C63. Wszystkie wyniki lokalne/moki/native mają osobne granice; 40 tasks nie zamyka się zbiorczo.

Bez push/deploy, add/commit, migracji, zapisów produkcyjnych, rzeczywistych profili/sesji/sekretów, płatnych wywołań i wiadomości do ludzi. AI/cloud writes HARD_OFF; produkcja NO_GO. Zatwierdzone lokalne procesy wykonuj w kontrolowanym TEMP poza sandboxem po znanym w C64 błędzie wirtualizacji; nie osłabiaj kontroli ścieżek. Rejestry wymagają dwóch recenzji i osobnego actual postwrite ledger.
