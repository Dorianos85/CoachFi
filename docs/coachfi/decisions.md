# Rejestr decyzji Foundera

| ID | Decyzja / stan | Rekomendacja i konsekwencja |
|---|---|---|
| D01 | Zatwierdzone: teraz dorośli, PL/EN | Główna ścieżka edukacji i nawyków; Kids/Web3 osobno |
| D02 | Zatwierdzone w tej sesji: pierwszy rynek Polska | EN jest językiem dlaPL, nie prawem/walutąUSA |
| D03 | Zatwierdzone: limit wydatków ustalimy po audycie | Model scenariuszy jest propozycją, nie zgodą na koszty |
| D04 | Kierunek: freemium, potem5USD/mies. i rabaty rodziny | Premium po wartości/kosztach i bramce płatności; cena brutto/waluta/rodzinne miejsca pending |
| D05 | Później: afiliacja/porównywarki, Kids, osobno Web3 | W obecnymUI pozostają ślady wcześniejszego zakresu, do uporządkowania |
| D06 | Founder podał repo Dorianos85/CoachFi | Kod dostępny w source/CoachFi; nie traktować pustego search-installations jako braku repo |

## Decyzje potrzebne teraz

1. **Ekspozycja repo/profil przeglądarki.** Rekomendacja: wyznaczyć osobę do kontrolowanego sprawdzenia i rozważyć czasowe ograniczenie widoczności publicznego repo. Alternatywa: zachować publiczne podczas przeglądu, z ryzykiem dalszego pobierania. Dane/sesje niepotwierdzone; szczegóły i skutki w [planie incydentowym](incident-browser-profiles.md). Nie wykonywano zmian GitHub.
2. **Zakres pierwszego adult release.** Rekomendacja: główna ścieżka start→lekcja→quiz→działanie→powrót, bez eksponowania Kids/Web3 i numerologii jako edukacji opartej na dowodach. Alternatywa: pozostawić je jako wyraźnie wydzielone eksperymentalne demo, z większym zakresemQA/prawa i ryzykiem rozmycia. Decyzja o odroczeniu jest znana; szczegółowy sposób ukrycia/odłączenia przygotowuje UX/CTO.
3. **Konto i postęp.** Rekomendacja: jasno rozdzielić guest/local od konta synchronizowanego i sprawdzić obecną integrację CoinbaseCDP/Supabase przed dodawaniem dostawcy. Alternatywa: local-only beta z wyraźnym brakiem odzyskania/sync; nie spełnia automatycznie kryterium pełnego konta. Nie zmieniać architektury na podstawie samego audytu.
4. **Administrator danych, pomoc i człowiek.** Potrzebne dane sprzedawcy/administratora, kontakt prywatności i wsparcia oraz osoba do prawnej ocenyPL. Rekomendacja: uzupełnić je przed realną akwizycją; alternatywą jest ograniczona, jawnie demonstracyjna prezentacja.
5. **Budżet i premium po audycie.** Rekomendacja: cap oparty na realnych fakturach/tokenach, większe użycie z limitami; zatwierdzić cenę brutto/walutę, miejsca rodziny i support. Syntetyczny model przy1000aktywnych/10%premium daje typowy koszt482,50USD/mies. i stratę76USD przed rozwojem/prawem/acquisition; to nie wycena aktywnej infrastruktury.

Operacyjnie potrzebne nadal: staging, konfiguracja powiązanej bazy/providerów bez wartości sekretów, kontrolowane konta testowe, billing/usage i runbook. Powiązanie publicznego deploymentu Vercel z commitem potwierdzono wA24/A25. Nie prosić o wklejanie kluczy do czatu. Bieżący limit kosztów i rynek już określono zgodnie z odpowiedziami; nie pytać ponownie o te same decyzje.

## Lokalna decyzja techniczna koordynatora — cykl5

B15 zachowuje niepotwierdzony własny cache i wyłącza automatyczne zapisy konta zamiast ryzykować nadpisanie bez atomowej kontroli wersji. GET nie zapisuje identity, PUT503 po auth/owner checks, fresh odczyt localOnly/read-only; failed read unavailable. To odwracalna poprawka w autoryzowanym lokalnym zakresie, nie nowa zgoda Foundera na wydanie lub zmianę strategii. [Raport](cycle-5/REPORT.md) i niezależny retest dokumentują skutki, w tym brak automatycznej aktualizacji istniejącego cache. B16 musi przygotować autorytatywne reconciliation/CAS/idempotency oraz controlled tests przed przywróceniem zapisu. Nowe dane biznesowe, rynek, budżet i deploy nadal wymagają wcześniejszej konkretnej autoryzacji.
