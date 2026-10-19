---
name: coachfi-data-integrity
description: 'Sprawdzaj zapis, uprawnienia i obliczenia danych Coachfi.'
---

# coachfi-data-integrity

## Zakres i wejście

Powiązane repo/baza staging, migracje, role, modele danych i kalkulatory. Przy pracy z Coachfi odczytaj [program](../../../docs/coachfi/program.md) i właściwe rejestry. Uruchamiaj dla zakresu wskazanego w opisie.

## Procedura

1. Potwierdź związek projektu z Coachfi; nie czytaj niepowiązanej bazy.
2. Odtwórz zapis i powrót dwóch kont; sprawdź autoryzację serwerową i izolację w stagingu.
3. Zweryfikuj walidację, idempotencję i transakcje, konflikty zapisu oraz braki danych.
4. Przelicz score i kalkulatory; udokumentuj wejścia, wzór, jednostki i demo.
5. Dla płatności sprawdź podpisy webhooków, powtórki i uprawnienia; migracje przygotuj z rollbackiem.

## Rezultat i przyjęcie

Mapa danych, testy integralności i przygotowane migracje. Kryteria: Żadnego dostępu między użytkownikami; retry nie dubluje postępu/płatności; score jest wyjaśnialny. Zapisz dowody jako sprawdzone, prawdopodobne, niesprawdzone lub niedostępne, z datą i środowiskiem.

## Źródła i aktualność

Dokumentacja wykrytej bazy/auth; Supabase skills po potwierdzeniu; aktualizuj wersje standardów. Linki i daty sprawdzenia zapisz w rejestrze źródeł, a ograniczenia w rezultacie.

## Uprawnienia i eskalacja

Sam skill nie przyznaje dostępu ani prawa do produkcyjnych zmian, wydatków i kontaktu z ludźmi. Wykonuj autoryzowane, odwracalne prace lokalne oraz read-only kontrole związanych zasobów. Eskaluj: Operacja produkcyjna, migracja danych, szersze uprawnienia lub brak stagingu do testu. Kontynuuj niezależne zadania. Autor nie zatwierdza własnego rezultatu.
