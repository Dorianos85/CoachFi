# Plan 30/60/90 dni — propozycja warunkowa

Nie są to potwierdzone terminy. Punkt startu realizacji: staging, zamknięte decyzje o zapisie i zakresie oraz budżet. Repo i powiązanie produkcyjnego commitu Vercel potwierdzono w audycie; dane operacyjne i pełny flow auth nadal wymagają weryfikacji. Zakres może zmienić się po testach. Maksymalnie trzy aktywne zadania agentów obok koordynatora; agenci przygotowują pracę, a odpowiedzialny człowiek zapewnia strategię, legal/accounting, konta i obsługę.

| Horyzont | Etapy / rezultat | Zależności | Potrzebne zasoby | Bramka |
|---|---|---|---|---|
| Dni1–30 | A→B: potwierdzić architekturę/kod i wdrożenie; zamknąć blockerPL/EN, dialog i demo; sprawdzić score; pełna pierwsza ścieżka; support/privacy; recenzja pilota24 | Staging, konta testowe, zakres danych, administrator, budget do operacji | Właściciel techniczny z czasem na integrację; UX/a11y, redakcja/PLEN i niezależnaQA; człowiek do prawa | R01–R12 dla małej grupy; brak high/critical; bez akwizycji szerokiej wcześniej |
| Dni31–60 | B→C: kontrolowany pilot, poprawki problemów, powtórki i działania; rozszerzenie24→64/80 dopiero po jakości | BramkiB, autoryzowana rekrutacja, minimalna analityka, review | Research, edukacja, nawyki, analityk, front/backend, reviewer | Pierwszy użyteczny rezultat, zapis/powrót, knowledge recall po czasie; nie deklarować efektu bez danych |
| Dni61–90 | C→D warunkowo: koszt i gotowość do płacenia; test mode zakupu/anulowania; rozszerzenie do160 jeśli jakość i przepustowość recenzji pozwolą | Potwierdzona wartość, marża, budget, cena brutto/waluta, płatności i obsługa | FinOps, inżynier płatności, growth, support, księgowy/prawnik, niezależnaQA | Oddzielna bramka premium; brak obowiązku startu płatnego w90dniach |

EtapE poza tym zobowiązaniem: rodziny/Kids, porównywarki i afiliacja po decyzjach kraju, kategorii, kont i reklam; Web3 po osobnym uzasadnieniu korzyści oraz ocenie technicznej/prawnej. Nie przenosić dźwigni lub ofert afiliacyjnych do obecnej ścieżki edukacyjnej.

## Zasoby i założenia

Rekomendacja do planowania: jeden dostępny właściciel integracji aplikacji, okresowe wsparcie UX/redakcji/QA oraz wyznaczona obsługa człowieka. Brak danych o etatach i stawkach, dlatego nie wyceniamy fikcyjnych dni pracy. Pula23ról jest uruchamiana etapami; nie wymaga23osób. Weekly review backlogu i decyzji po zmianie dowodów, bez tworzenia automatycznych harmonogramów w tej sesji.

Plan badań: najpierw jakościowy test pierwszego rezultatu, następnie kohorta retencji z pomiarem wiedzy po7/14dniach. Wielkość próby, minimalny efekt i testy statystyczne ustala analityk przed eksperymentem; nie wyznaczamy arbitralnego celu skuteczności. Mierzymy zdolność wykonania przydatnego działania i recall, nie tylko rejestrację/czas.

Radar decyzji: teraz **wdrożyć po review** spójność locale, demo i dostępny dialog; **przetestować** powtórki oparte na istniejącymSRS, plans if–then, źródła Mili, minimalne events i server caps; **obserwować** rozbudowaną personalizację, nową metodę auth i migracje modeli/frameworka, dopóki nie ma dowodu problemu/kosztu. Każdy istotny wybór otrzymuje datę, oficjalne źródło, koszt, ryzyko, miarę i rollback; źródła w sources.md oraz kodowe evidence. Nie uruchomiono płatnych rozwiązań.
