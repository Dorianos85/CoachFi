# C66 — brak liczby dni nie oznacza zakupu dzisiaj

Status: ACCEPTED_LIMITED_LOCAL_UNSTAGED

Przy cenie 249 PLN zmiana liczby dni od zakupu z 30 na puste pole dawała wcześniej 0 dni. Aplikacja ponownie pokazywała możliwość zwrotu, kwotę 249 PLN i przycisk odczytu decyzji. Potwierdzono to osobno w PL i EN w aktualnym komponencie oraz Chrome.

Pole zachowuje teraz wpisany tekst. Brak, wartość ujemna lub niewłaściwa liczba pokazuje powiązany błąd PL/EN i wstrzymuje wynik zakupu, jego kwotę, metryki oraz przygotowany odczyt. Jawne 0 nadal działa. Domyślne 3 dni, cena, poprawne obliczenia i niezależny audyt nieużywanych rzeczy pozostają zachowane. Nie dodano limitu dni, wymogu liczb całkowitych ani reguły prawnej.

| Sprawdzenie | Rzeczywisty wynik |
| --- | --- |
| Baseline nowych Node | 2 PASS / 10 FAIL; 12 grup, nie 10 historycznych luk |
| Te same Node po zmianie | 12 PASS, 0 SKIP |
| Wybrane regresje C65 | 6 PASS / 6 jawnych SKIP |
| Chrome przed / po | 2 FAIL → te same 2 PASS, retries 0 |
| TypeScript | Jeden przebieg, exit 0 |
| Jeden świeży build TEMP | PASS, 34/34 generowanych stron, 35 tras; 585 wejść przed / 584 po, bez driftu |
| Niezależne recenzje | Dwie ograniczone GO, 0 otwartych uwag; PRODUCT wyłącza własne fixture |

Przyjęcie obejmuje 20 różnych przypadków: 12 nowych Node, 2 nowe Chrome i 6 historycznych. Trzy przebiegi Node to 36 pozycji, 30 wykonań; dwa udane przebiegi po zmianie zawierają 18 PASS. Dwa PASS baseline są liczone osobno. Każdy natywny przypadek zapisuje 10 faz przed asercjami; fazy i warianty wewnątrz grup nie są dodatkowymi testami.

Pominięto trzy grupy C65 na język, które wymagały liczbowego props dni; nowe testy obejmują kontrakt tekstowego pola. Oryginalna fixture pozostaje niezmieniona. Runner sprawdził rzeczywisty status skipped, liczbę 6, dokładne historyczne nazwy i kolejność wszystkich 12 pozycji.

Node używa jawnego emulatora React, rzeczywistych helperów/i18n oraz syntetycznych magazynów; głos ma wyłącznie nieaktywne znaczniki props. Chrome sprawdza fill/render/click/reload i szerokość 375 px w świeżych syntetycznych kontekstach. Dziewięć kluczy w obu obszarach storage zachowano bez monitorowanych zapisów; API, zewnętrzne żądania i pageErrors: 0. Nie jest to pełny test klawiatury, AT, audio, prawdziwych kont ani stagingu.

Aktualny freeze ma 284 unikalne ścieżki: 275 historycznych literalnych, jedna jawna zmiana strony i nowe fixture/narzędzia. Zachowano 13 preserve, 27 receipts, 15 kontraktów SDK, runtime parsera oraz brak usuniętego helpera. Ostrzeżenia SDK pozostały; cały stderr buildu zmienił się wyłącznie z 28.2s na 27.1s w czasie kompilacji. HEAD, gałąź, indeks oraz 40 zadań i ich statusy w obu backlogach pozostają zachowane.

Produkcja: NO_GO. Nie wykonano push ani deploy. AI i zapisy chmurowe: HARD_OFF. Brak clean install/CVE closure, pełnych testów Auth/RLS i stagingu. Pozostałe dwa pola liczników mają osobny [triage źródłowy](../../../evidence/cycle-66/followup-triage.json), bez nowego wyniku runtime lub walidacji modelu finansowego.

[Weryfikacja](../../../evidence/cycle-66/verification.json) · [Delta zachowania](../../../evidence/cycle-66/behavior-delta.json) · [Source review](review.md) · [PRODUCT review](product-review.md)
