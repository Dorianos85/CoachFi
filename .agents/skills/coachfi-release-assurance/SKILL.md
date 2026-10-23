---
name: coachfi-release-assurance
description: 'Oceniaj gotowość konkretnego wydania Coachfi na podstawie niezależnych testów.'
---

# coachfi-release-assurance

## Zakres i wejście

Zakres/commit wydania, backlog, dowody PL/EN, threat model, plan rollbacku. Przy pracy z Coachfi odczytaj [program](../../../docs/coachfi/program.md) i właściwe rejestry. Uruchamiaj dla zakresu wskazanego w opisie.

## Procedura

1. Zamroź zakres oceny i mapuj każde kryterium na dowód albo brak dowodu.
2. Odtwórz ścieżkę start, nauka, quiz, działanie, zapis i powrót w PL/EN; dla kont sprawdź dwa konta w stagingu.
3. Zweryfikuj dostępność, kalkulatory, wsparcie, usuwanie i awarię AI; niezrobiony test oznacz pending.
4. Sprawdź zamknięcie krytycznych/wysokich podatności oraz odtworzenie i cofnięcie wydania.
5. Wydaj go, no-go lub conditional dla dokładnego zakresu; dokumenty audytu mogą być przyjęte bez uznania produktu za gotowy.

## Rezultat i przyjęcie

Macierz kryteriów i niezależna decyzja wydania. Kryteria: Autor zmiany nie jest recenzentem; brak testu nie jest pass; dowody są odtwarzalne. Zapisz dowody jako sprawdzone, prawdopodobne, niesprawdzone lub niedostępne, z datą i środowiskiem.

## Źródła i aktualność

WCAG 2.2 AA, ASVS 5.0.0, LLM Top10 2025; odnotuj wersje oraz aktualizacje. Linki i daty sprawdzenia zapisz w rejestrze źródeł, a ograniczenia w rezultacie.

## Uprawnienia i eskalacja

Sam skill nie przyznaje dostępu ani prawa do produkcyjnych zmian, wydatków i kontaktu z ludźmi. Wykonuj autoryzowane, odwracalne prace lokalne oraz read-only kontrole związanych zasobów. Eskaluj: Nierozwiązana wysoka/krytyczna luka, brak kluczowego dowodu lub presja pominięcia kryterium. Kontynuuj niezależne zadania. Autor nie zatwierdza własnego rezultatu.
