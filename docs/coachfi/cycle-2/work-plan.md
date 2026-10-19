# Coachfi.ai — cykl2

Cel: kontynuować poprawki P0 w lokalnym repo po przyjętej paczce bezpieczeństwa, bez wdrażania. Podział plików, autorzy i recenzenci są w [rejestrze bieżącego cyklu](../current-cycle.md). Bazowe dowody pierwszej paczki zachowano w `../p0/`.

Priorytet: zgodne dependency updates oraz usunięcie mylącego lokalnego odblokowania e-mailem. Sam wpis e-maila nie jest logowaniem. Wynik edukacyjny ma być dostępny i opisany jako lokalny, bez zbierania niepotrzebnego kontaktu/marketingu lub fikcyjnej aktywacji płatnego triala. Nie zastępuj tego niezweryfikowanym auth demo.

Wzór: najpierw wyodrębnić i wersjonować dotychczasowy heurystyczny model o maksimum98; niezależnie sprawdzić wejścia i rachunki. Normalizacja do100, zmiana wag lub rozdzielenie skal wymaga uzasadnienia i review; nie obiecywać walidacji naukowej. Dla zapisanych legacy danych oddzielić wspierane wyniki od demo/uszkodzonego storage. Nie czytać rzeczywistych user sessions w testach.

Dowody końcowe: celowane regresje, syntetyczny PL/EN browser flow, brak provider/auth calls, typecheck/build po ustabilizowaniu instalacji i serwera; raw redacted audit oraz recenzje niezależne od autorów. Status przyjęcia lokalnego nie zamyka historii publicznego repo, staging auth/RLS, account-data rights lub kosztów externalAI.
