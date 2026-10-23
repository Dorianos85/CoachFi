# C45 — triage zależności, bez zmiany pakietów

**DEFER_MAJOR_COMPATIBILITY_REQUIRED** —16.10.2026,daily_data_review. Dwa residual advisories pozostają otwarte; brak nowego securityPASS i brak zgody na mutację zależności.

Oficjalny [GHSA-rj75](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) wskazuje poprawkę parsera7.1.6. Aktualny lock/runtime ma6.1.4; Tailwind3.4.19 wymaga^6.1.2,a postcss-nested6.2.0 wymaga^6.1.1. Wersja7 nie mieści się w żadnym zakresie. Zainstalowany kod nadal ma wskazane skany indexOf; nie wykonywano reprodukcji ani pomiaru.

[Poprawka upstream62b1917](https://github.com/postcss/postcss-selector-parser/commit/62b1917) jest wąska algorytmicznie,ale migracja całego pakietu obejmuje też [zmiany iteracji i wstawiania](https://raw.githubusercontent.com/postcss/postcss-selector-parser/7.1.6/CHANGELOG.md). Potrzebny jest osobny plan zgodności realnego Tailwind/postcss-nested,w tym mutacji AST i deep importu dist/util/unesc. Ślepy override7 nie ma GO.

Ponadto Vite ma w build.js jawny marker vendoredparser7.1.1,a Tailwind peers/index.js zawiera drugą kopię o nieustalonej tu wersji. Sprawdzono je statycznie. Override zewnętrznego pakietu nie zmienia tych bajtów; ich aktywacja i ewentualna poprawka wymagają odrębnego dowodu. Nie stwierdzono incydentu produkcyjnego.

[GHSA-vfj7 dla braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) nadal podaje≤3.0.3 i brak poprawionej wersji. W locku jest3.0.3,używane przez chokidar3.6.0 i micromatch4.0.8. [Dyskusja maintainer/reporter](https://github.com/micromatch/braces/issues/70) ujawnia spór o zagrożenie i limity wejścia; nie jest dowodem zamknięcia.

Wniosek: odroczyć migrację zależności. Późniejszy rootpacket może zbadać pin7.1.6 po bounded baseline mechanizmu oraz zgodności obu zewnętrznych konsumentów,z jawnym zachowaniem residuali bundledcopies. Nie potwierdzono wydanej zgodnej poprawki6.x. Registry endpoints były niedostępne dla narzędzia web; nie deklaruję odczytu najnowszych tagów npm ani weryfikacji tarballa.

package.json i lock pozostają literalne względemC38/C44; receiptC44 jest chroniony. Przeszukany kod aplikacji nie ma bezpośrednich importów tych parserów,ale nie jest to pełny graf osiągalności. Root wybrał następny osobny lokalny kandydat available/unavailable/loading serii; tutaj bez testów,implementacji lub nowej politykiAuth. Wyłącznie odczyty plików/publicznych źródeł i zapis tych dwóch raportów;0 audit/install/test/runtime.
