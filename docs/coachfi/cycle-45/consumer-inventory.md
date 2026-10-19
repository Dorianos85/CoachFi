# C45 — konsumenci parsera selektorów, odczyt źródłowy

Status: `READONLY_SECURITY_CONSUMER_INVENTORY_MAJOR_AND_VENDORED_DEFERRED`. Dependencies bez zmian; brak zamknięcia podatności lub B10.

Zewnętrzny postcss-selector-parser nadal6.1.4/37plików, literalny wobec C44. Dwa rzeczywiste package consumers rozwiązują ten sam entry: Tailwind3.4.19 (^6.1.2) oraz postcss-nested6.2.0 (^6.1.1).7.x wykracza poza oba zakresy. Tailwind używa processSync/astSync, konstruktorów i mutacji AST, a formatVariantSelector:26 także prywatnego dist/util/unesc.

Podobieństwo API nie wystarcza do majoroverride. [Oficjalne7.0.0](https://github.com/postcss/postcss-selector-parser/releases/tag/v7.0.0) zmienia iterację przy insertions, które Tailwind faktycznie wykonuje. [Aktualne API](https://raw.githubusercontent.com/postcss/postcss-selector-parser/master/API.md) opisuje metody wspólne, ale nie gwarantuje prywatnego deepimport. [Changelog](https://raw.githubusercontent.com/postcss/postcss-selector-parser/master/CHANGELOG.md) opisuje dalsze zmiany7.1; master to mutable source, nie przyjęty tarball lub lokalny retest.

Wykryto dodatkowe vendored copies: Vite8.3.4/build.js z regionem parser7.1.1 używanym przez CSSModules oraz Tailwind peers/index.js z parserem dla bundled cssnano (wersja nieustalona), osiągalnym źródłowo przez CLI lazyCssnano. Top-level override nie zmieni tychbytes. To nie jest potwierdzona aktywacja/exploit; zakres advisory i ścieżki wymagają oddzielnego triage.

Obecny build to Next→PostCSS tailwindcss/autoprefixer; Tailwind skanuje app/components/lib z repo, korzysta z lokalnego preset i trzech CSSimports. Nie włączono nesting plugin w postcss.config, brak lokalnych CSSModules w ograniczonym inventory. To granica konfiguracji, nie dowód ogólnej nieosiągalności podatności.

Decyzja: odroczyć major/vendored patch. Przyszły plan wymaga dokładnego payload/resolution/deepimport, bazowych i docelowych CSSoracli (mutacje/escapes/variants/@apply), semanticdiff oraz jednego izolowanego buildu po zatwierdzeniu zakresu. Teraz0runtime/npm/test/build/patch; C44receipt i11źródeł/narzędzi literalne. Nie ponawiano zielonych testów.

[JSON inventory](../../../evidence/cycle-45/consumer-inventory.json) zawiera pinowane sourcepaths, gaps i ograniczenia. Brak nowego Auth/RLS/staging/CI/freshcheckout/produkcjaPASS; B10 nadal częściowy.
