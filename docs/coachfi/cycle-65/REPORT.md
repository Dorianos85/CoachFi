# C65 — cena bez niepopartego wyniku

C65_STATUS: ACCEPTED_LIMITED_LOCAL_UNSTAGED.

Na /shopping cena zachowuje wpisany tekst. Pusta, niepoprawna, nieskończona, zbyt duża lub niedokładna do grosza wartość pokazuje błąd PL/EN i wstrzymuje wynik zakupu oraz przycisk odczytu tej decyzji. Audyt nieużywanych rzeczy pozostaje dostępny. Celowe0, poprawne grosze i odzyskanie poprawnego wyniku działają; limit1e12 PLN jest istniejącym ograniczeniem technicznym, nie budżetem Foundera.

| Dowód lokalny | Wynik |
|---|---|
| Nowy baseline przed produktem | 12 Node: 2 PASS / 10 FAIL, 0 SKIP, 12 obserwacji; 2 native FAIL, po10 faz |
| Te same nowe przypadki | 12 PASS, 0 SKIP, 12 obserwacji; 582 wejścia bez driftu |
| Powiązana regresja C64 | 12 PASS / 2 jawne SKIP z14 wymienionych; fixture C64 bez zmian |
| TypeScript | Pierwszy przebieg exit0, 582 wejścia bez driftu |
| Jeden nowy build w TEMP | PASS; postęp34/34, 35 tras:24 static/11 dynamic; 582 pre /581 post, 0 driftu |
| Chrome po zmianie, PL/EN | 2 PASS, 0 SKIP/flaky/retry, po10 faz; 581 pre/post bez driftu, port zwolniony |
| Niezależna recenzja | Dwie niezależne ograniczone GO, 0 otwartych uwag; PRODUCT wyłącza własne fixture. Ledger postwrite osobno. |

Łącznie przyjęcie obejmuje26 odrębnych przypadków:14 nowych (12 Node i2 Chrome) oraz12 regresji. Dwie stare kontrole C64 sprawdzają numeric price.props.value; nowy kontrakt celowo przechowuje raw string, a kontrolę default/return/sell obejmują nowe testy. Nie zmieniano C64 ani nie powtarzano starego baseline. Dziesięć FAIL zawiera nowe wymagania i grupy obserwacji, nie dziesięć osobnych dawnych luk.

Native baseline odtworzył zamianę pustego pola na0 z nadal widoczną decyzją i przyciskiem głosu. Cena1e308 dawała skończony, niepoparty wynik odsprzedaży6e307 PLN — nie Infinity. Infinity dla1e309 i underflow ±1e-999 były obserwowane wyłącznie przez emulowany rzeczywisty handler Node. Po zmianie pole zachowuje błędny zapis, pokazuje jeden powiązany alert, a niepoparty wynik i jego głos znikają. W obu językach dodawanie/usuwanie w audycie nadal działa, przywrócenie0 odzyskuje wynik, a reload wraca do249.

Niezależny peer przed wykonaniem wykrył w pierwszej propozycji cenę1e-999 sprowadzaną do darmowego0. Nie wdrażano tej propozycji lokalnie; zachowano ją, a zatwierdzona v2 odrzuca niezerową mantysę zredukowaną do ±0. Prawdziwe formy zera, także0e-999, są ważne i dają dodatnie0. To wciąż kontrakt reprezentowalnej wartości Number; bardzo długie zapisy mogą zwinąć się przy konwersji, bez deklaracji dowolnej precyzji.

W parserze raportu regresji znaleziono osobną słabość: szukał statusu pending, podczas gdy surowe asercje mają skipped, więc lista nazw była pusta. Oryginalny runner, raport i freeze pozostały bez zmian. Nowy, ścisły admission odczytał tę samą tabelę14 i potwierdził dokładnie dwie dozwolone nazwy skipped oraz12 passed, z kontrolą trzech poprzednich hashy. Niezależny reviewer jawnie zakwalifikował wcześniejsze potwierdzenie oparte na tym samym filtrze. Nie uruchamiano ponownie zielonych testów i nie przedstawia się pierwotnej bramki jako naprawionej. Przyszłe narzędzia muszą użyć rzeczywistego statusu i jawnej liczby/nazw.

COPY9, cały audyt C64 i jego helper prefix, pola liczników, wagi i reguły decyzji są zachowane. Odsprzedaż nadal używa dotychczasowego Math.round(price*0.6) do pełnych jednostek PLN; nie jest to walidacja modelu finansowego lub polityki zwrotów. Node używa jawnego emulatora React, rzeczywistych helperów/Intl i markerów props głosu, bez audio. Chrome ma świeże konteksty i dane syntetyczne;9 nazwanych kluczy w obu obszarach storage jest literalnych, bez monitorowanych zapisów, clear, nieoczekiwanych remove, API, ruchu zewnętrznego lub błędów strony. Brak pełnego audytu storage, kont, dostępności, pozostałych języków lub realnego głosu.

Freeze276 ma5 source/fixture,5 tools i266 wcześniejszych literalnych ścieżek. Obie istniejące ścieżki page/helper są jawnie kwalifikowane; z579 dawnych wejść577 pozostało literalnych.13preserve/26receipts/15SDK i pełny dotychczasowy fingerprint runtime są niezmienne; usunięty helper C63 nadal nie istnieje. Build używa istniejącego node_modules, a cały stderr C64 różni się tylko26.5s→28.2s. Ostrzeżenia x402-fetch/@base-org/account pozostają; brak clean-install, inicjalizacji SDK lub CVE/advisory PASS.

Pozostała hipoteza C66: przy poprawnej cenie puste dni od zakupu nadal stają się0 i ponownie otwierają status zwrotu; wymaga własnego baseline.40 tasks i ich statusy oraz HEAD/branch/index zachowane. PRODUCT wyłącza własne fixture, konfigurację, design, emulator i oracles; osobny actual postwrite ledger następuje po zapisie rejestrów. Bez add/commit/push/deploy, migracji, produkcyjnych zapisów, realnych sesji/profili/sekretów, płatnych usług i kontaktu z ludźmi. AI/cloud writes HARD_OFF; produkcja NO_GO.
