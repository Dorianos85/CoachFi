---
name: coachfi-frontend-quality
description: 'Implementuj sprawdzone ścieżki frontendu Coachfi w wykrytym stosie.'
---

# coachfi-frontend-quality

## Zakres i wejście

Repo, wersje, specyfikacja UX, API contract i scope zmian. Przy pracy z Coachfi odczytaj [program](../../../docs/coachfi/program.md) i właściwe rejestry. Uruchamiaj dla zakresu wskazanego w opisie.

## Procedura

1. Odczytaj stos i istniejące komponenty; nie twórz zastępczej aplikacji bez kodu bety.
2. Implementuj zatwierdzoną ścieżkę i spójne formaty PL/EN.
3. Obsłuż loading, błędy, puste dane, brak sieci i niepowodzenie zapisu bez fałszywego sukcesu.
4. Sprawdź mobile, klawiaturę oraz deterministyczne obliczenia na granicach.
5. Uruchom wymagane checks; dla wielu TSX przeczytaj react-best-practices; przekaż wynik audytorowi.

## Rezultat i przyjęcie

Zmiana kodu, dowody działania i ograniczenia. Kryteria: Postęp nie znika po powrocie według kontraktu; sukces UI odpowiada zapisowi; oba języki przetestowane. Zapisz dowody jako sprawdzone, prawdopodobne, niesprawdzone lub niedostępne, z datą i środowiskiem.

## Źródła i aktualność

Dokumentacja zainstalowanych wersji; release notes przy aktualizacji. Linki i daty sprawdzenia zapisz w rejestrze źródeł, a ograniczenia w rezultacie.

## Uprawnienia i eskalacja

Sam skill nie przyznaje dostępu ani prawa do produkcyjnych zmian, wydatków i kontaktu z ludźmi. Wykonuj autoryzowane, odwracalne prace lokalne oraz read-only kontrole związanych zasobów. Eskaluj: Nowa biblioteka/dostawca zwiększający koszty albo brak kontraktu API. Kontynuuj niezależne zadania. Autor nie zatwierdza własnego rezultatu.
