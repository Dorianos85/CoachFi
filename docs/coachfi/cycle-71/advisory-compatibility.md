# C71 — advisory i projekt zgodności dwóch konsumentów

2026-10-19T07:29:00.562667+00:00. Status: **źródła pierwotne sprawdzone; projekt wymaga niezależnej recenzji**. Nie wykonano kandydata, testów ani instalacji.

Aktualna tabela [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) obejmuje parser przed7.1.6; poprawiona wersja to7.1.6, Moderate/CVSS3.1 5.9. Problem dotyczy kwadratowego przetwarzania płaskich selektorów. Warunkiem ekspozycji jest nieufne wejście parsowane synchronicznie w ścieżce żądania. Obecne6.1.4 mieści się w zakresie wersji, ale nie wykazano takiej osiągalności ani kosztu w Coachfi.

Kontekstowe [GHSA-w9m9-85wc-3x92](https://github.com/advisories/GHSA-w9m9-85wc-3x92) dotyczy rekurencji AST: tabela obejmuje6.1.0–<6.1.3 oraz7.1.0–<7.1.3; poprawki6.1.3/7.1.3, Low/CVSS4.0: 2.1. Obecne6.1.4 nie jest w tej tabeli. Nie zastępuje to sprawdzenia lokalnych guardów. Oba oficjalne advisories odczytano19.10.2026; raport nie powiela danych osób.

Nowy dowód C70 — jeden rzeczywisty publiczny HTTP200/SRI dla cssesc — uzasadnia skończoną próbę metadata/artefaktu dokładnie7.1.6. Nie dowodzi dostępności tego kandydata. [C50 dependency-feasibility](../cycle-50/dependency-feasibility.md) pozostaje historycznym odroczeniem.

Obaj rzeczywiści konsumenci mają niezmienione źródła z C50: Tailwind3.4.19 wymaga parsera^6.1.2, postcss-nested6.2.0 wymaga^6.1.1.7.1.6 leży poza oboma zakresami. Tailwind ma realny deep import dist/util/unesc oraz modyfikacje AST podczas iteracji, w tym replaceWith(tablica); postcss-nested używa klonowania, cross-product rodzic/dziecko i zagnieżdżonych ampersandów. Tailwind parseObjectStyles także wywołuje postcss-nested. Zbieżność nazw API nie wystarcza do zgody na major upgrade.

Przed jakimkolwiek wykonaniem potrzebny jest dowód opublikowanych bajtów: oficjalne name/version/dist/SRI, bezpieczne jednoznaczne człony archiwum, rzeczywiste emitted dist/index.js i dist/util/unesc.js, reguły type/exports, domknięcie require oraz callable CommonJS. Tag repo ani pole files tego nie zastępują. Materializacja i wykonanie wymagają osobnego zakresu; obecnie0 ekstrakcji/instalacji/uruchomień.

Proponuję **cztery przyszłe przypadki**, po dwa na konsumenta:

- Tailwind: rzeczywiste formatVariantSelector/finalizeSelector z kompozycją :merge, prefixem i dwiema pisowniami escape; literalne oczekiwania klas/pseudoklas i brak utraty/duplikacji węzłów.
- Tailwind: rzeczywisty mały pipeline PostCSS/Tailwind z inline content, @apply/prefix/important i wybranymi stanami; oczekiwane deklaracje i semantyka selektorów, bez globów i zewnętrznego CSS.
- postcss-nested: przecinek rodziców/dzieci oraz ampersand wewnątrz :is; sześć ręcznie wyprowadzonych selektorów, kolejność i zachowane deklaracje.
- postcss-nested: bubbling @media i mały niepoprawny selektor w rzeczywistym PostCSS AST; poprawna reguła i kontrolowany błąd zamiast pozornego sukcesu.

Obserwacje obu wersji trzeba zebrać przed assertions; porównanie różnicowe uzupełnia niezależne oczekiwania. Rzeczywiste resolution obu konsumentów musi wskazać kandydat o sprawdzonym SHA, bez cichego fallback6.1.4. To projekt, nie cztery wykonane testy ani ocena całej biblioteki. Szczegóły wejść i źródłowe line-piny zawiera [JSON](../../../evidence/cycle-71/advisory-compatibility.json).

Bazą jest obecne zahartowane37-plikowe6.1.4, nie domniemane pristine npm. Przy przyszłym autoryzowanym zastąpieniu kodu należy zachować lokalne kontrakty C37 i odpowiednio wykorzystać osiem istniejących C38 selector-security controls; teraz ich nie uruchamiać. Nie napisano dodatkowych pure-guard fixtures bez rzeczywistego parsera metadata/tar i uzgodnionej potrzeby.

Własne authored advisory/design nie są przeze mnie zatwierdzane; przyjmuje je primary. Bez zmiany aplikacji/lock/runtime, override, npm, benchmarków DoS, realnych profili lub dostawców. B10/C50 i gotowość produkcji pozostają otwarte; AI/cloud HARD_OFF, production NO_GO.
