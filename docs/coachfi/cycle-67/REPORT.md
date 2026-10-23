# C67 — brak liczby użyć lub okna zwrotu wstrzymuje wynik

Status: ACCEPTED_LIMITED_LOCAL_UNSTAGED

Potwierdzono dwa błędy w PL/EN, w aktualnym komponencie i Chrome. Puste okno zwrotu stawało się 1 dniem i zmieniało wynik z propozycji zwrotu 249 PLN na sprzedaż za 149 PLN. W kontrolowanym przykładzie liczba użyć 2 dawała wynik 41 i decyzję „zostaw”; wyczyszczenie pola podstawiało 0, wynik 55 i decyzję „odczekaj”. Nie jest to walidacja tych wag lub modelu finansowego.

Oba pola zachowują teraz wpisany tekst. Brak lub niepoprawna liczba pokazuje własny błąd PL/EN i wstrzymuje wynik zakupu, kwotę, metryki oraz przygotowany odczyt. Jawne 0 użyć i 1 dzień nadal działają. Zachowano domyślne 0/14, dotychczasowe minima 0/1, ułamki i skończone duże liczby. Nie wprowadzono zasady liczb całkowitych, górnego limitu ani reguły prawnej. Audyt rzeczy, cenę, dni od zakupu i poprawne wcześniejsze obliczenia zachowano. Dwa nowe powiązania błędów dołączają do dotychczasowych dwóch; każde z czterech pól ma osobny komunikat.

| Sprawdzenie | Rzeczywisty wynik |
| --- | --- |
| Baseline nowych Node | 2 PASS / 14 FAIL; nowe kontrakty, nie 14 historycznych luk |
| Te same Node po zmianie | 16 PASS, 0 SKIP |
| Wybrane regresje C66 | 8 PASS / 4 jawne SKIP |
| Chrome przed / po | 2 FAIL → te same 2 PASS, retries 0; 12 faz na język |
| TypeScript | Jeden przebieg, exit 0 |
| Jeden świeży build TEMP | PASS, 34/34 stron, 35 tras; 588 wejść przed / 587 po, bez driftu |
| Niezależne recenzje | Dwie ograniczone GO, 0 otwartych uwag; PRODUCT wyłącza własne fixture |

Przyjęcie obejmuje 26 różnych przypadków: 16 nowych Node, 2 nowe Chrome i 8 historycznych. Trzy przebiegi Node to 44 pozycje i 40 wykonań; dwa udane przebiegi po zmianie zawierają 24 PASS. Dwa PASS baseline są oddzielne. Warianty i fazy obserwacji nie są dodatkowymi testami.

Pominięto dwie grupy C66 na język: default i unsupported days wymagają liczbowych props użyć/okna. Nowe testy sprawdzają kontrakt tekstowy. Stare fixture są literalne; sprawdzono rzeczywisty status skipped, liczbę 4, dokładne nazwy i kolejność 12 pozycji. Pozostałe wyniki, odmowy, oba porządki odzyskania czterech pól i niezależny audyt rzeczy są sprawdzone.

Node używa jawnego emulatora React z rzeczywistymi helperami/i18n i emitowanymi handlerami, również RangeField/select; głos to nieaktywne props. Chrome używa świeżych syntetycznych kontekstów, fill/click, konkretnych End/ArrowLeft/Home dla zakresów, selectOption, reload i szerokości 375 px. Zapisano rzeczywiste zakresy 4/1 i trigger need. Dziewięć kluczy w obu obszarach storage pozostało literalnych bez monitorowanych zapisów; API, żądania zewnętrzne i pageErrors: 0. Nie jest to pełny test klawiatury, AT, audio ani prawdziwych kont.

Freeze ma 292 unikalne ścieżki, w tym 283 historyczne literalne i jedną kwalifikowaną stronę. Zachowano 13 preserve, 28 receipts, 15 kontraktów SDK, runtime parsera i brak usuniętego helpera. Stderr buildu zmienił się tylko z 27.1s na 24.0s; ostrzeżenia SDK pozostają. HEAD, gałąź, indeks oraz wszystkie 40 zadań i statusów obu backlogów pozostają zachowane.

Produkcja: NO_GO; bez push/deploy. AI i zapisy chmurowe: HARD_OFF. Kończymy tę sekwencję poprawek pól zakupowych. Następna konkretna bramka lokalna to [zgodność historycznych fixture i jeden świeży inventory suite](../../../evidence/cycle-67/queue-triage.json): sześć grup w trzech plikach wymaga niezależnie przejrzanego adaptera kontraktu, z zachowaniem wcześniejszych dowodów i pozostałych asercji. Nie wykonano tego jeszcze i nie ma pełnego CI PASS ani twierdzenia o wyczerpaniu prac lokalnych. Clean install/CVE, kontrolowane Auth/RLS, trwałe kontrakty i staging pozostają poza tym przyjęciem.

[Weryfikacja](../../../evidence/cycle-67/verification.json) · [Delta](../../../evidence/cycle-67/behavior-delta.json) · [Source review](review.md) · [PRODUCT review](product-review.md)
