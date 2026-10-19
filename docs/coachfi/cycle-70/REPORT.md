# C70 — dostęp do artefaktów zależności

Status: ACCEPTED_LIMITED_LOCAL_RESOURCE_GATE_UNSTAGED

Potwierdzono rzeczywiste pobranie publicznego cssesc3.0.0 z oficjalnego npm registry: HTTP200, 6495 bajtów, SHA-512 zgodny z aktualnym lockfile. To nowy dowód dostępności tego zasobu w tym środowisku. Kod aplikacji, zależności, lockfile i zainstalowany runtime pozostają bez zmian. Produkcja nadal NO_GO.

| Dowód | Wynik |
| --- | --- |
| Inwentaryzacja lockfile | 608 wpisów: root + 607 lokalizacji / 491 różnych archiwów |
| URL i integralność | Wszystkie607 lokalizacji wskazują publiczne HTTPS npm registry i kanoniczne SHA-512 |
| Znane archiwum C38 | parser6.1.4, 45101 bajtów, ponownie sprawdzona zgodność SRI |
| Jeden rzeczywisty GET C70 | cssesc3.0.0, 6495 bajtów, zgodne SRI; bez redirect/retry/credentials |
| Potwierdzone bajty | 2/491 archiwów; 489 pozostaje niesprawdzonych |
| Instalacja / rozpakowanie / uruchomienie pakietów | 0 / 0 / 0 |
| Nowe testy aplikacji / TypeScript / build / przeglądarka | 0 / 0 / 0 / 0 |
| Niezależne recenzje | Dwie ograniczone GO; osobny audit actual postwrite |

Pierwszy proces narzędzia zakończył się FAIL przed żądaniem sieciowym. Windows dodał siedem nazw zmiennych środowiskowych do jawnie przekazanych pięciu. Surowy FAIL zachowano. Oddzielny odczyt samych nazw, bez wartości, pozwolił poprawić nową wersję narzędzia: usuwa dokładnie znane dodatkowe nazwy i ponownie wymaga pięciu dopuszczonych. Nieznana dodatkowa nazwa zatrzymuje proces. Dopiero ta wersja wykonała pierwsze rzeczywiste żądanie. Łącznie: dwa uruchomienia wrappera, jeden odczyt nazw, jedno HTTPS GET, zero ponowień sieci.

Trzy findingi trwałości raw child, pinów release oraz ścieżek bez junction/symlink poprawiono przed wykonaniem. Dwie nieścisłości planu — cztery rekordy lifecycle oraz rozróżnienie niesprawdzonych i niedostępnych zasobów — mają zachowane pełne rewizje. Poprawkę Windows niezależnie sprawdzono źródłowo, a jej rzeczywisty wynik pokazuje siedem usuniętych nazw i pięć pozostawionych. Wartości zmiennych środowiska nie były rejestrowane. Dodatkowe siedem zmiennych obsłużono tylko po nazwach, bez odczytu ich wartości. Do procesu przekazano wartości pięciu dopuszczonych zmiennych systemowych. Nie odczytywano rzeczywistych profili, sesji ani sekretów.

Podczas obu wrapperów zachowano 308 dotychczasowych ścieżek źródeł/narzędzi, 614 wejść aplikacji,13 preserve,31 receipts,15 kontraktów SDK, parser37plików/2konsumentów, tombstone, HEAD/gałąź/indeks. Nowe dwa samodzielne narzędzia dają310 ścieżek w przejęciu C70. Dodatkowe piny autoryzacji są osobnym dowodem. Zielony wynik C69 — 3534 zarejestrowane pozycje i TypeScript — pozostaje historyczny; nie powtarzano go dla tej bramki.

Nie uznano pozostałych489 archiwów za niedostępne. Udany odczyt usuwa podstawę do blokowania dalszych lokalnych prac samym dawnym brakiem dostępu do registry. Następny skończony C71 najpierw uzyska oficjalne metadata i artefakt dokładnie parsera7.1.6 oraz przygotuje plan zgodności dwóch konsumentów B10/C50. To reakcja na nowy dowód dostępności; C50 z18.10 pozostaje niezmienioną historią. Bez ręcznego SRI, ślepego override lub instalacji. Pełny zestaw artefaktów i czyste odtworzenie pozostają osobnymi późniejszymi bramkami, po decyzji o zależnościach. Pętla pozostaje aktywna dla tego konkretnego zadania.

Są to dowody dostępności i pochodzenia dwóch archiwów. Nie zamykają advisory/CVE, zgodności nowego parsera, clean install, stagingu Auth/RLS, trwałych kontraktów, dostępności ani całości treści finansowych. AI i zapisy chmurowe HARD_OFF; bez push/deploy.

[Weryfikacja](../../../evidence/cycle-70/verification.json) · [Pokrycie archiwów](../../../evidence/cycle-70/artifact-coverage.json) · [Plan artefaktów](artifact-plan.md) · [Source review](review.md) · [PRODUCT review](product-review.md)
