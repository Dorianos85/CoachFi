# C70 — dostępność artefaktów aktualnego lockfile

Status: PREEXEC_SOURCE_RESOURCE_PLAN_REVISED_PENDING_INDEPENDENT_REVIEW. 19.10.2026. Autor: c49_advisories. Bez sieci, npm, instalacji, testów, kompilatora i zmian aplikacji.

C69 ma 3534 zarejestrowane pozycje PASS w 173 plikach, na istniejącym runtime. Nie jest to dowód clean install po usunięciu w C63 20 wpisów lockfile, których drzewa pozostały w node_modules.

| Odczytany zakres | Wynik |
|---|---|
| Lock v3 | 608 wpisów: root + 607 umiejscowień |
| Różne artefakty | 491 par resolved/integrity; 116 powtórnych umiejscowień |
| Transport/integrity | HTTPS registry.npmjs.org:443 i kanoniczne SHA-512 dla wszystkich wpisów; bez wyjątków |
| Metadane | 69 optional, 135 dev, 61 z OS/CPU/libc; zakresy mogą się nakładać |
| Lifecycle | bufferutil4.1.0, fsevents2.3.3, playwright/fsevents2.3.2, rpc-websockets/utf-8-validate6.0.6; żadnego nie wykonano |
| Wskazane archiwum C38 | parser6.1.4, 45101 B, istnieje i odpowiada locked SRI |
| Potwierdzone bajty | 1/491; pozostałych490 nie potwierdzono w sprawdzonych zasobach |

Lock SHA256: 3f981656236872e8db5d21fafbd6edc7b0ecd92c3755abc8caa562cf7e94b703. Manifest wymaga Node ^20.19.0 || ^22.12.0 || >=24.0.0; nie deklaruje npm. To odczyt deklaracji, bez uruchomienia narzędzi.

Sprawdzono tylko znane deskryptory zadań i dokładną autoryzowaną ścieżkę publicznego archiwum C38. Nie przeszukiwano globalnego npm cache, Temp, profili, env ani sekretów. C63 dokumentuje świeży cache dla lock-only/offline, bez kompletnego wykazu tarballi; jego obecnej zawartości nie odczytano. C68/C69 wskazują cache transformacji Vitest. Te fakty nie dowodzą globalnego braku innych archiwów.

Skończona proponowana bramka:

1. Zamrożona inwentaryzacja491 artefaktów/607 umiejscowień i dowód jednego archiwum.
2. Po niezależnym przyjęciu planu i narzędzia roota: najwyżej1 GET publicznego cssesc3.0.0 z dokładnym URL/SRI aktualnego lockfile. Strict TLS, bez credentials/redirect/retry/proxy/config discovery, minimalny env procesu,15s/512KiB. Bajty zachowuje się wyłącznie po HTTP200 i zgodnym SHA-512, bez rozpakowania lub wykonania.
3. Rzeczywisty wynik i raport pokrycia. Sukces daje najwyżej2/491 i może uzasadnić nowy, skończony plan zebrania pozostałych publicznych artefaktów po niezależnym przeglądzie, bez instalacji. Błąd kończy próbę kodem/statusem; przy braku zweryfikowanego kompletnego cache następuje raport zasobu, bez kolejnego pollingu.

Narzędzie i wynik należą do roota; przyszłe bajty nie są przyjęte w tym planie. Osobny artifact-check.mjs nie jest potrzebny. Późniejsza izolowana instalacja wymaga kompletnych zweryfikowanych bajtów/provenance oraz osobnej oceny platformy, narzędzi i lifecycle. Zawężenie do jednej platformy wymaga odrębnego oracla, zamiast cichego pomijania optional entries.

C50 z18.10 pozostaje historycznym odroczeniem metadanych/artefaktu parsera7.1.6. Nie odpytywano tej wersji, nie zmieniano zależności i nie zamykano advisory. Jedna odpowiedź registry nie potwierdza dostępności pozostałych pakietów lub zgodności konsumentów.

Niepobrane lub niezweryfikowane artefakty nie są przez to niedostępne. Jeśli GET się powiedzie, dozwolony zakres lokalny może objąć osobno zaplanowane i niezależnie sprawdzone zebranie dokładnego zestawu publicznych bajtów; samo pobieranie nie wymaga nowej decyzji Foundera. Brak kompletnego cache wraz z nieudaną próbą uzasadnia zatrzymanie i precyzyjny raport zasobu. Ta bramka nie instaluje niczego, nie uruchamia nowych testów, nie zgaduje SRI i nie powtarza zielonych przebiegów. Produkcja NO_GO; AI/cloud HARD_OFF.

[Pełna inwentaryzacja i warunki](../../../evidence/cycle-70/artifact-plan.json). SHA256 JSON: 952a62b6b5b803739de811c7da6402fbfa8623a63270cf72e01046fb5f7be44f.
