---
name: coachfi-architecture
description: 'Audytuj lub zmieniaj architekturę Coachfi po identyfikacji rzeczywistego kodu i środowiska.'
---

# coachfi-architecture

## Zakres i wejście

Repo, manifesty i lockfile, konfiguracja bez sekretów, migracje, diagramy, ścieżka użytkownika. Przy pracy z Coachfi odczytaj [program](../../../docs/coachfi/program.md) i właściwe rejestry. Uruchamiaj dla zakresu wskazanego w opisie.

## Procedura

1. Zidentyfikuj commit, wersje i środowisko; brak kodu odnotuj zamiast rekonstruować backend z marketingu.
2. Mapuj browser, API, auth, storage, AI i zewnętrzne usługi; oznacz deklaracje i potwierdzone integracje oddzielnie.
3. Prześledź przepływ postępu i score; określ właściciela danych, walidację i punkty awarii.
4. Dla zmiany przygotuj ADR z prostszą alternatywą, kosztem, migracją i rollbackiem.
5. Oddaj ADR właściwemu specjaliście, a dowody działania niezależnemu audytorowi.

## Rezultat i przyjęcie

Mapa architektury, brakujące dostępy, ADR i plan integracji. Kryteria: Każdy komponent ma źródło; migracja ma uzasadnienie i sprawdzalny powrót; nie przypisano niepotwierdzonego hostingu. Zapisz dowody jako sprawdzone, prawdopodobne, niesprawdzone lub niedostępne, z datą i środowiskiem.

## Źródła i aktualność

Oficjalne dokumentacje wykrytych wersji; sprawdź release notes przy decyzji. Linki i daty sprawdzenia zapisz w rejestrze źródeł, a ograniczenia w rezultacie.

## Uprawnienia i eskalacja

Sam skill nie przyznaje dostępu ani prawa do produkcyjnych zmian, wydatków i kontaktu z ludźmi. Wykonuj autoryzowane, odwracalne prace lokalne oraz read-only kontrole związanych zasobów. Eskaluj: Płatna usługa, zmiana dostawcy, koszt utrzymania lub rozszerzenie zbierania danych. Kontynuuj niezależne zadania. Autor nie zatwierdza własnego rezultatu.
