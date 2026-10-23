---
name: coachfi-ai-evaluation
description: 'Projektuj i oceniaj Milę oraz bezpieczne kalkulacje AI Coachfi.'
---

# coachfi-ai-evaluation

## Zakres i wejście

Prompt z wersją, zatwierdzona baza treści, provider config, eval cases i limity. Przy pracy z Coachfi odczytaj [program](../../../docs/coachfi/program.md) i właściwe rejestry. Uruchamiaj dla zakresu wskazanego w opisie.

## Procedura

1. Oddziel lokalne reguły od aktywnego LLM; ustal źródła, model, koszty i transfer danych.
2. Zbuduj testy braku dochodu, zadłużenia, nieregularności, utraty pracy, choroby i błędnych danych.
3. Dodaj ataki na instrukcje, żądania sekretów i gwarantowanego zysku oraz nieaktualne informacje.
4. Obliczenia kieruj do przetestowanego kalkulatora; wymagaj założeń i śladów źródła.
5. Oceń użyteczność, wierność źródłom, zakres edukacyjny, koszt i fallback; recenzent sprawdza wyniki.

## Rezultat i przyjęcie

Wersjonowany zestaw evals i raport Mili. Kryteria: Brak wycieku/nieautoryzowanej akcji; poprawna arytmetyka; niepewność i awaria mają jasny komunikat. Zapisz dowody jako sprawdzone, prawdopodobne, niesprawdzone lub niedostępne, z datą i środowiskiem.

## Źródła i aktualność

Dokumentacja faktycznego dostawcy, OpenAI docs gdy użyty; OWASP LLM Top10 2025. Linki i daty sprawdzenia zapisz w rejestrze źródeł, a ograniczenia w rezultacie.

## Uprawnienia i eskalacja

Sam skill nie przyznaje dostępu ani prawa do produkcyjnych zmian, wydatków i kontaktu z ludźmi. Wykonuj autoryzowane, odwracalne prace lokalne oraz read-only kontrole związanych zasobów. Eskaluj: Nowy provider/transfer, koszt, spersonalizowana porada lub eskalacja do człowieka. Kontynuuj niezależne zadania. Autor nie zatwierdza własnego rezultatu.
