# C64 — dokładne kwoty w audycie zakupów

C64_STATUS: ACCEPTED_LIMITED_LOCAL_UNSTAGED.

Na /shopping audyt nieużywanych rzeczy przechowuje dodatnie kwoty w groszach, sprawdza skończoność i sumę do istniejącego technicznego limitu 1e12 PLN. Niepoprawny wpis pokazuje błąd PL/EN, zachowując wcześniejsze pozycje i wpisaną wartość. Dodawanie i usuwanie korzystają z aktualnej listy; identyfikatory nie zależą od zegara. Pięć dotychczasowych miejsc wyświetlania kwot lub przygotowania tekstu głosu używa PLN i dwóch miejsc w PL/EN. Nie wykonuje się przeliczenia walut.

| Dowód lokalny | Wynik |
|---|---|
| Baseline na niezmienionym produkcie | 14 Node FAIL, 14 obserwacji; 2 Chrome FAIL, po 8 faz |
| Pierwszy acceptance | Te same 14 PASS; 579 wejść, 0 driftu |
| Retest po poprawce fixture | 14 PASS, 0 SKIP, 14 obserwacji; 579 wejść, 0 driftu |
| TypeScript | Pierwszy exit2: 48 błędów składni BigInt wyłącznie w nowym teście; poprawiony exit0 |
| Jeden nowy build w TEMP | PASS; postęp generowania 34/34, 35 tras: 24 static i 11 dynamic; 579 pre / 578 post, 0 driftu |
| Chrome po zmianie, PL/EN | 2 PASS, 0 SKIP/flaky/retry, po 8 faz; 578 pre/post bez driftu, port zwolniony |
| Niezależna recenzja | Dwie niezależne ograniczone GO, 0 otwartych uwag; PRODUCT wyłącza własne fixture. Ledger postwrite osobno. |

Rzeczywisty baseline odtworzył przepełnienie do ∞ po dwóch skończonych wpisach 1e308, utratę groszy i USD w EN dla tych samych kwot na rynku Polski. Pierwsze asercje często dotyczą nowych wymagań PLN i walidacji; 16 przypadków nie oznacza 16 dawnych luk. Próba tego samego handlera oraz stałego zegara jest syntetycznym sprawdzeniem kolejki i tożsamości pozycji. Po zmianie 0.29 + 0.01 daje 0.30 PLN; wpisy 0.001 i 1e308 są odrzucane bez utraty listy. Usunięcie zwalnia limit, a reload zeruje ten przejściowy audyt, jak wcześniej.

Pierwszy sandboxowy Node nie zebrał testów przez EPERM przy rename w TEMP. Próba native zatrzymała się przed procesem przeglądarki na kontroli wirtualnego TEMP. Oryginały i odrzucenie zachowano; automatyczny review zatwierdził wykonanie tych samych lokalnych poleceń poza sandboxem. Dwie drobne luki narzędzi zamknięto przed wykonaniem poprawionych wersji z pełnym before/after/inverse. Późniejszy TypeScript wykrył 48 literałów BigInt niezgodnych z istniejącym targetem. Zamieniono wyłącznie te tokeny na BigInt z dokładnym dziesiętnym stringiem. To zmiana składni wykonywanej w runtime, więc powtórzono 14 testów i TS; nie stosowano zwolnienia przez samo usunięcie typów. Pierwsze 14 PASS i wszystkie wcześniejsze raw pozostają bez zmian.

Node uruchamia rzeczywisty komponent i handlery przez jawny emulator React, z rzeczywistymi tłumaczeniami/Intl i markerami props głosu. Nie wykonuje audio. Chrome używa świeżych kontekstów i danych syntetycznych; 9 nazwanych kluczy w obu obszarach storage pozostaje dosłownie bez zmian, bez monitorowanych zapisów, clear, nieoczekiwanych remove, API lub ruchu zewnętrznego. Nie jest to pełny audyt storage, izolacji kont ani dostępności.

COPY9, cała analiza zakupu, wagi, założenie 60% odsprzedaży i wspólny NumberField są literalne. Siedem pozostałych ścieżek formatowania waluty zachowano; współdzielona walidacja i fallback błędu EN nie dają PASS dla tych języków. Kontrakt kwot dotyczy reprezentowalnej wartości Number: bardzo długi zapis dziesiętny może zwinąć się przy konwersji; brak deklaracji dowolnej precyzji leksykalnej.

Current freeze268 przejmuje257 wcześniejszych ścieżek literalnie; 13preserve/25receipts/15SDK i pełny dotychczasowy fingerprint runtime są niezmienne. Początkowy freeze267 zachowano: 264 literalne, 3 jawnie kwalifikowane i jeden nowy helper retestu. Z dawnych575 wejść574 jest literalnych, zmiana shopping odpowiada dokładnej propozycji. Usunięty w C63 helper nadal nie istnieje. Build używa istniejącego node_modules; pełny stderr jest taki jak w C63 poza 23.9s→26.5s, ostrzeżenia x402-fetch/@base-org/account pozostają. Brak clean-install, inicjalizacji SDK lub CVE/advisory PASS.

Pozostają dwie hipotezy źródłowe poza tą paczką: nieograniczona cena zakupu oraz puste dni zamieniane na0 i ponownie otwierające status zwrotu. Wymagają osobnego baseline; nie zmieniano polityki zwrotów ani modelu finansowego. 40 tasks/statusy i HEAD/branch/index zachowane. Dwie recenzje mają odrębne zakresy; PRODUCT wyłącza własne fixture, konfigurację, emulator, oczekiwania i poprawkę BigInt. Ledger rzeczywistych zapisów następuje osobno po przyjęciu. Bez add/commit/push/deploy/migracji, produkcyjnych zapisów, realnych danych, sekretów, płatnych usług lub kontaktu. AI/cloud writes HARD_OFF; produkcja NO_GO.
