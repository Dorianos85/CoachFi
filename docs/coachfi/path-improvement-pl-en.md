# Plan poprawy głównej ścieżki PL/EN

Stan: specyfikacja proponowanych zmian, nie wdrożenie. Rynek Polska w obu językach. Oparty na audycie publicznego UI i późniejszym odczycie źródeł; szczegóły/obserwacje w `audit/product-ux.md`.

| Krok | Proponowane działanie | PL / EN komunikat lub reguła | Kryterium przyjęcia |
|---|---|---|---|
| Start | Jeden następny krok, adult scope; głębokie moduły odsunąć zgodnie z decyzją | „Wybierz pierwszy krok z finansami” / “Choose your first money step” | Klik prowadzi do jasno opisanej diagnozy lub pierwszego modułu, bez obietnicy wyniku |
| Język i kraj | Język tłumaczy UI, kraj pozostajePL; waluta wybierana niezależnie | PLN po zmianie PL→EN; poprawny separator i parser | Te same liczby, cele, pytania i działanie w obu wersjach |
| Onboarding | Wyjaśnić demo i model zapisu, ograniczyć pola; dostępny modal | „Przykładowe dane. Wpisz własne, aby zobaczyć wynik obliczenia.” / “Sample data. Enter your own values to see the calculation.” | Czytelne demo w UI/audio; poprawny fokus, nav pod modalem nieinteraktywny |
| Diagnoza | Jawne wejścia, jednostki, wzór i braki; nie nagradzać bogactwa jako wiedzy | „To orientacyjny wskaźnik oparty na podanych kwotach.” / “This is an indicative score based on the values you entered.” | Granice zero/ujemne/brak danych; niezależne fixture; zgodna narracja |
| Konto | Ustalić guest/local vs konto/sync; zgody optional osobno | „Postęp na tym urządzeniu” / “Progress on this device” tylko jeśli tak działa | Realny auth i odzyskanie; optional zgody opisane czytnikowi; nie mylić wpisania emailu z kontem |
| Pierwsza lekcja | Jedna umiejętność i krótki przykład wPL/EN | Przykład polskiego gospodarstwa w obu językach, kwotyPLN | Cel, przykład, ćwiczenie i recenzja; zachowane znaczenie |
| Quiz | Zasób zależny od locale, feedback z uzasadnieniem | „Sprawdź, dlaczego ta odpowiedź działa” / “See why this answer works” | PL lesson→PL quiz; EN→EN; wyjaśnienia każdego błędu, bez zgadywania po konstrukcji odpowiedzi |
| Małe działanie | Pierwszy wykonalny krok i plan jeśli–to | „Przed następnym zakupem zapiszę kwotę i odczekam10 minut.” / “Before my next purchase, I will note the amount and wait10 minutes.” | Możliwość dostosowania czasu/kroku; działania zadeklarowane oznaczone osobno |
| Zapis | Pokaż potwierdzenie dopiero po sukcesie; offline/retry uczciwe | „Zapisano” / “Saved”; „Zapis oczekuje na połączenie” / “Save is waiting for a connection” | Reload i powrót zachowują stan; konflikt nie kasuje postępu |
| Powrót | Powtórka z pamięci i plan minimum po przerwie | „Możesz wrócić od małego kroku.” / “You can return with one small step.” | Bez utraty wartości/streak pressure; przypomnienia dobrowolne |
| Mila/pomoc | Źródła i granice; lokalny fallback; kontakt | „Nie mam wystarczających danych. Zacznijmy od…” / “I do not have enough information. Let us start with…” | AI nie blokuje lekcji; użytkownik ma ścieżkę do człowieka i zgłoszenia |

Najpierw naprawić zgodność quizu z językiem, dialog/fokus, powiązanie waluty z locale i prezentację demo. Przed realną akwizycją: przypisane środowisko, test kont i postępu, właściwe dokumentyPL oraz support i limity. Nie przemieniać audytu w przebudowę całej bety; wykorzystać istniejący kod i podać minimalne zmiany.

Badanie planowane: obserwacja początkujących dorosłych, osób z nieregularnym dochodem i gospodarstw domowych wPL/EN. Rekrutacja/liczba/prywatność do przygotowania osobno. Zadania: znaleźć pierwszy krok, wyjaśnić score własnymi słowami, ukończyć lekcję+quiz, wybrać działanie, wrócić po przerwie. Mierzyć ukończenie, błędne interpretacje, wiedzę po7/14dniach i działania zadeklarowane. Nie traktować tego planu jako przeprowadzonych badań.
