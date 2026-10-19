---
name: coachfi-operations-finops
description: 'Sprawdzaj niezawodność oraz koszty free/premium Coachfi.'
---

# coachfi-operations-finops

## Zakres i wejście

Powiązany hosting, monitoring, billing, limity, backup i plan wydania. Przy pracy z Coachfi odczytaj [program](../../../docs/coachfi/program.md) i właściwe rejestry. Uruchamiaj dla zakresu wskazanego w opisie.

## Procedura

1. Potwierdź środowiska i właścicieli alertów; nie przypisuj hostingu z samego Next.
2. Odtwórz awarię AI/storage w stagingu i sprawdź fallback bez utraty postępu.
3. Sprawdź kopię, kontrolowane odtworzenie oraz rollback z wynikiem i czasem.
4. Policz koszty per free/premium z podatkiem, opłatami, tokenami, wsparciem i stałymi kosztami; założenia oddziel od faktur.
5. Zaproponuj limity per-user/global, alerty i politykę przekroczenia do Foundera.

## Rezultat i przyjęcie

Runbook, dowody recovery i model kosztów. Kryteria: Przetestowane odtworzenie; budżet nie jest automatyczną zgodą; marża liczona po kosztach free. Zapisz dowody jako sprawdzone, prawdopodobne, niesprawdzone lub niedostępne, z datą i środowiskiem.

## Źródła i aktualność

Faktury i aktualne cenniki faktycznych dostawców; odświeżaj przed zakupem i miesięcznie. Linki i daty sprawdzenia zapisz w rejestrze źródeł, a ograniczenia w rezultacie.

## Uprawnienia i eskalacja

Sam skill nie przyznaje dostępu ani prawa do produkcyjnych zmian, wydatków i kontaktu z ludźmi. Wykonuj autoryzowane, odwracalne prace lokalne oraz read-only kontrole związanych zasobów. Eskaluj: Limit kosztów, płatne plany, próg stopu, RTO/RPO lub produkcyjny test awarii. Kontynuuj niezależne zadania. Autor nie zatwierdza własnego rezultatu.
