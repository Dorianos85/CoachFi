# C21 — baseline B27 SignInGate

15.10.2026. Po przyjętej lokalnie C20 najpierw odtwarzamy rzeczywiste zachowanie SignInGate/currentSignInProgress i jawnego requestSignIn na syntetycznym storage/CDP. Nie znamy aktywnej konfiguracji ani osiągalności tej gałęzi w produkcji. Żadnych sourcewrites przed actual baseline i niezależnym design review.

Root koordynuje, recenzuje fixtures i jest ewentualnym autorem komponentu. daily_author ma odrębny actualhelper baseline; daily_ui_review ma actualcomponent baseline; daily_data_review niezależnie ocenia minimalny kontrakt i granicę polityki unknown. Własność plików rozłączna, każdy autor ma innego recenzenta. Nie tworzymy nowej reguły required=true/false przy unknown, nie zmieniamy progów SIGN_IN_GATE, CDP/AuthProvider, danych, monetyzacji ani providerconfig. Jeśli rozwiązanie wymaga nowej polityki dostępu, B27 zostaje odroczone, a niezależna lokalna praca wraca do B06 draftu treści.

Dorośli PL/EN w Polsce. Bez commit/push/deploy, produkcyjnych migracji/zapisów, realnych profili/sesji/sekretów, płatnych wywołań, kontaktu z ludźmi i nowych AI/cloudcalls. Bazy i logowanie wyłącznie jawnie mockowane, bez remote. C20 source18 i historyczne wyniki zachowujemy; bez powtarzania zielonych bramek.
