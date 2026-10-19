# C62 — jawne zakończenie wylogowania CDP

Zakres: tylko istniejący HeaderAccount w AppNavigation, warunkowo gdy CDP jest skonfigurowane. Problem źródłowy: void signOut() ignoruje rejection i dopuszcza ponowne kliknięcie w trakcie oczekiwania. Baseline rzeczywistego komponentu przed zmianą, następnie niezależne source/tools/fixture/raw review i odpowiednie TS/build. Bez twierdzenia o realnej konfiguracji lub odwołaniu sesji: zainstalowane CDP core tłumi błąd remote logout.

Root: koordynacja, carry, tools, wykonania i rejestry. c49_advisories: proposal i produkt po peer. c49_validation: nowy fixture i późniejszy PRODUCT review z wyłączeniem własnego fixture. c49_dependency_review: odrębny source/tools/fixture/raw review. Rozłączne pliki; autor nie zatwierdza swojego rezultatu.

Zachować 9 rekordów ACCOUNT_COPY, pozostały shell i politykę dostępu. Próba ma blokować duplikaty, wyrażać pending/błąd PL/EN, obsłużyć retry oraz odrzucić późny rezultat po nowym właścicielu/unmount. Nie przywracać starego właściciela. AI/cloud writes HARD_OFF; produkcja NO_GO. Bez add/commit/push/deploy lub rzeczywistych danych.

Inwentaryzacja source-only trzech specjalistów ma wskazać kolejne wykonalne zadania bez ponawiania zielonych testów. C50 deferral nie jest świeżym advisory PASS.
