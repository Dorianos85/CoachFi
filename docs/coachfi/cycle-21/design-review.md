# C21 — niezależna recenzja projektu B27

15.10.2026, daily_data_review. **ACCEPTED_LIMITED_DESIGN_CONDITIONAL_ON_ACTUAL_BASELINE**.

Najmniejsza autoryzowana poprawka to wczesny wynik false w `isSignInRequiredNow`, ale wyłącznie gdy wszystkie trzy pola `SIGN_IN_GATE` są dokładnie równe 0. Warunek musi poprzedzać `currentSignInProgress` oraz przechwycenie/odczyt storage. Dla każdej innej konfiguracji pozostaje dosłownie dotychczasowe wywołanie. Czysty predicate, progi, konfiguracja i komponent nie wymagają zmiany.

Dowód wynika z istniejącego `signInRequired`: przy zerowym progu timer nie odczytuje postępu, a zerowy próg lekcji powoduje return false przed analizą historii. To znany wynik wyłączonych reguł, więc nie zastępuje nieznanych danych pustą historią lub zerem. Zdrowy wynik OFF jest identyczny. Dla aktywnych progów nie proponujemy nowego required=true/false. Szersze pomijanie odczytów przy niepełnej parze lesson-rule pozostaje poza paczką.

Komponent obecnie najpierw wylicza required, a potem czyta jawne żądanie logowania. Wyeliminowanie zbędnego odczytu w OFF może odblokować istniejącą obsługę requestSignIn bez zmiany jej reguł. Potrzebny jest rzeczywisty baseline helpera i komponentu z syntetycznymi progami/cache oraz mockowanymi hookami CDP; aktualna recenzja go nie wykonuje. W przyszłym retest trzeba wykazać zero odczytów przy OFF i zachowanie zdrowych wyników ON. Sam source regex lub wynik autora nie wystarcza.

Root może zwolnić implementację po reprodukcji i peer review fixtures. Wymagana jest dokładna delta oraz niezależna recenzja rezultatu. Nie należy dodawać catch ustawiającego required=false/true, nowego modala dostępu ani traktować starego boolean jako świeżego potwierdzenia po błędzie. Błędy postępu przy aktywnych regułach, initial-unknown policy i globalny currentSignInProgress pozostają nierozwiązane. Jeśli ich obsługa wymaga nowej polityki dostępu, wyłączyć ją z C21 i wrócić do odroczonego B06 lub uzyskać decyzję Foundera.

Sprawdzono osiem aktualnych SHA z before-source i obie dostępne pełne kopie źródeł: brak różnic. Odczytano workplan, program, właściwy skill i poprzednią inwentaryzację. Nie odczytano rzeczywistej konfiguracji, kont, sesji ani sekretów. Nie zmieniano produktu/testów/konfiguracji; nie wykonano testów ani wywołań dostawców. Pełny kontrakt, warunki baseline, ograniczenia i fingerprinty: [design-review.json](../../../evidence/cycle-21/design-review.json).
