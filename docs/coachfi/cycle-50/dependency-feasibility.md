# C50 — wykonalność zewnętrznego parsera 7.1.6

18.10.2026, c49_advisories. **DEFER_NO_VERIFIABLE_NPM_ARTIFACT**. Bezpieczna zmiana zależności nie jest teraz przygotowana: brak dostępnych oficjalnych npm metadata `dist.integrity`/`dist.tarball`, a 7.1.6 przekracza deklaracje obu konsumentów. To zakończona wąska ocena wykonalności, bez ponownego ogólnego triage i bez zamknięcia advisory. Niezależne przyjęcie roota pozostaje osobne.

**Niedostępne:** [npm metadata dokładnie 7.1.6](https://registry.npmjs.org/postcss-selector-parser/7.1.6) są niedostępne przez web oraz bezpośredni read-only HTTPS GET (nieznany host). [Oficjalna strona wersji npm](https://www.npmjs.com/package/postcss-selector-parser/v/7.1.6) zwróciła 403 w web, a GET lokalny nie rozwiązał hosta. Nie ustalono registry name/version, SRI ani URL artefaktu. Nie żądano tarballa i nie pobierano lub wykonywano pakietów. Wynik dotyczy dostępności odczytu z tych narzędzi, bez twierdzenia o błędzie publikacji.

**Sprawdzone źródłowo:** [package.json tagu 7.1.6](https://raw.githubusercontent.com/postcss/postcss-selector-parser/7.1.6/package.json) podaje version 7.1.6, main `dist/index.js`, Node `>=4` oraz te same zależności `cssesc ^3.0.0` i `util-deprecate ^1.0.2`, co aktualny 6.1.4. [Wejście źródłowe](https://raw.githubusercontent.com/postcss/postcss-selector-parser/7.1.6/src/index.ts) zachowuje callable parser i `export =`; [tsconfig](https://raw.githubusercontent.com/postcss/postcss-selector-parser/7.1.6/tsconfig.json) emituje CommonJS. To repo tagu, bez potwierdzenia opublikowanych bajtów.

Lokalne manifests/lock nadal wskazują Tailwind 3.4.19: Node `>=14.0.0`, parser `^6.1.2`; postcss-nested 6.2.0: Node `>=12.0`, parser `^6.1.1`. Deklarowany Node kandydata nie podnosi dolnego wymagania tych konsumentów; zgodność wykonania pozostaje niesprawdzona.

Odczytano rzeczywiste użycia w ośmiu plikach implementacji Tailwind i index.js postcss-nested; szczegółowe ścieżki/linie/hashes zawiera [JSON](../../../evidence/cycle-50/dependency-feasibility.json). Najważniejsze granice dla przyszłej oceny:

- Tailwind potrzebuje `astSync`, `processSync`, `transformSync` z wynikiem callbacka, fabryk węzłów, traversali, escaped `value/raws`, klonowania i zmian podczas iteracji. `@apply` używa `replaceWith(...nodes)`; variants korzystają z insertBefore/After i `:merge` przez `replaceWith(p.nodes)` z tablicą.
- postcss-nested używa `processSync`, `at(0)`, `each`, `clone({})`, `replaceWith`, `prepend` i fabryki combinator. Istotne wyniki to kombinacje rodzic/dziecko, ampersandy, spacje i mapowanie błędów parsowania.
- Tailwind ma rzeczywisty deep import `postcss-selector-parser/dist/util/unesc`. [Źródło unesc](https://raw.githubusercontent.com/postcss/postcss-selector-parser/7.1.6/src/util/unesc.js) jest dostępne; URL pliku dist w repo zwrócił 404. Nie dowodzi to braku pliku w tarballu, którego nie odczytano.

[Processor](https://raw.githubusercontent.com/postcss/postcss-selector-parser/7.1.6/src/processor.js) i [konstruktory](https://raw.githubusercontent.com/postcss/postcss-selector-parser/7.1.6/src/selectors/constructors.js) zachowują obserwowane nazwy. [Container](https://raw.githubusercontent.com/postcss/postcss-selector-parser/7.1.6/src/selectors/container.js) zawiera też tolerancyjną serializację tablic z odniesieniem do Tailwind `:merge`. To przesłanki dla eksperymentu zgodności. [Changelog](https://raw.githubusercontent.com/postcss/postcss-selector-parser/7.1.6/CHANGELOG.md) nadal oznacza zmianę iteracji w 7.0.0 jako major; sama obecność nazw nie zatwierdza migracji. Wszystkie odczyty wykonano 18.10.2026; część źródeł tagu pochodziła z web cache sprzed 2–5 dni.

Konkretny następny warunek: uzyskać oficjalne metadata wersji 7.1.6 i następnie w osobno ograniczonej paczce zweryfikować artefakt, main/deep import oraz rzeczywiste wyniki tych konsumentów. Obecnie nie ma podstaw do ręcznego wpisania SRI, override lub zmiany runtime. Kopie osadzone i produkcja pozostają poza oceną.

0 npm/install/audit/test/benchmark/build/browser, zmian runtime/manifestów, płatnych/provider/production calls, commit/push/deploy. Zapisano wyłącznie dwa własne pliki C50; C49 pozostaje nietknięty.
