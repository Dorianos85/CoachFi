---
name: coachfi-security-review
description: 'Audytuj bezpieczeństwo i testy adversarialne Coachfi w autoryzowanym zakresie.'
---

# coachfi-security-review

## Zakres i wejście

Repo, scope, staging, mapy danych, zależności, auth i funkcje AI. Przy pracy z Coachfi odczytaj [program](../../../docs/coachfi/program.md) i właściwe rejestry. Uruchamiaj dla zakresu wskazanego w opisie.

## Procedura

1. Zdefiniuj aktywa, granice zaufania i nadużycia; zanotuj scope oraz środowisko.
2. Mapuj ASVS5.0.0 i LLMTop10 2025 na wymagania z wersjonowanymi IDs; nie wymyślaj ID.
3. Sprawdź izolację, odzyskiwanie kont, sekrety, minimalne uprawnienia i limity kosztów.
4. Eksploatację, testy zakłócające i cross-user wykonuj tylko na kontrolowanych kontach staging.
5. Dla finding zapisz reprodukcję bez sekretów, dotkliwość i retest poprawki; brak testu nie jest dowodem bezpieczeństwa.

## Rezultat i przyjęcie

Threat model i findings z odtwarzalnym retestem. Kryteria: Brak otwartych high/critical w scope wydania; dowody nie zawierają cudzych danych. Zapisz dowody jako sprawdzone, prawdopodobne, niesprawdzone lub niedostępne, z datą i środowiskiem.

## Źródła i aktualność

ASVS5.0.0, LLMTop10 2025, advisories wykrytych zależności; sprawdź przed wydaniem. Linki i daty sprawdzenia zapisz w rejestrze źródeł, a ograniczenia w rezultacie.

## Uprawnienia i eskalacja

Sam skill nie przyznaje dostępu ani prawa do produkcyjnych zmian, wydatków i kontaktu z ludźmi. Wykonuj autoryzowane, odwracalne prace lokalne oraz read-only kontrole związanych zasobów. Eskaluj: Produkcja wymagająca ingerencji, znalezione sekrety/wyciek lub potrzeba rozszerzenia scope. Kontynuuj niezależne zadania. Autor nie zatwierdza własnego rezultatu.
