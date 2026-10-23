# C64 — kwoty w audycie zakupów

C64_STATUS: SOURCE_CONFIRMED_BASELINE_PENDING.

Zakres: aktywna strona `/shopping`, dorośli w Polsce, PL/EN. Odczyt źródeł wskazuje dopuszczenie dwóch kwot 1e308 i przepełnienie sumy, zaokrąglanie groszy oraz etykietę USD dla tych samych kwot w EN. Rzeczywisty baseline ma odróżnić obserwację komponentu i przeglądarki od hipotezy źródłowej.

Autor produktu: c49_advisories, wyłącznie app/shopping/page.tsx i nowy lib/shopping-amounts.ts oraz propozycja/design. Autor fixture: c49_validation, wyłącznie nowy Node test, dwa przypadki native PL/EN, config i fixture-design; później PRODUCT peer z wyłączeniem własnych fixture. c49_dependency_review niezależnie recenzuje źródła, matematykę, PL/EN, fixture, narzędzia i raw. Root odpowiada za narzędzia, wykonanie, rejestry i integrację; autor nie zatwierdza własnej pracy.

Kryteria: dodatnie dokładne grosze, skończona kwota i suma do istniejącego technicznego limitu 1e12 PLN, jawna walidacja i zachowanie wcześniejszych pozycji; PLN z dwoma miejscami w PL/EN. Dodawanie/usuwanie odnosi się do aktualnej listy, także w syntetycznych próbach starego handlera. Tożsamość pozycji niezależna od tego samego znacznika czasu. Bez zmiany algorytmu decyzji zakupu, wag, założenia 60% odsprzedaży, dziewięciu COPY lub współdzielonego NumberField; siedem pozostałych ścieżek waluty ma pozostać literalnych. Nie jest to przeliczenie waluty ani nowy limit budżetu Foundera.

Przed produktem: niezależny peer literalnego proposal/fixture/tools, zapis 575 aktualnych wejść i pełnego carry C63 257 oraz nieobecności usuniętego helpera. Baseline: 14 przypadków Node i dwa native na już zbudowanym, sprawdzonym TEMP C63, wyłącznie z nowymi spec/config. Po produkcie te same przypadki, odpowiedni TypeScript i jeden nowy TEMP build, dwa native PL/EN. Bez powtarzania zielonych testów bez zmiany lub nowej obawy. Moki/emulator i prawdziwa przeglądarka muszą mieć oddzielne wyniki.

Warunki: root + trzech specjalistów, bieżąca gałąź i istniejące zmiany zachowane. Brak nowego dependency poll; C50 pozostaje historycznie odroczone. Bez add/commit/push/deploy, migracji, danych rzeczywistych, sekretów, płatnych wywołań i kontaktu z ludźmi. AI/cloud writes HARD_OFF, produkcja NO_GO. Lokalne przyjęcie wymaga dwóch ograniczonych recenzji, retestu usterek i osobnego przeglądu rzeczywistych zapisów rejestrów.
