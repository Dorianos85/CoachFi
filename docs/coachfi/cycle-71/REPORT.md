# C71 — zweryfikowany kandydat aktualizacji parsera

Status: ACCEPTED_LIMITED_LOCAL_CANDIDATE_PROVENANCE_UNSTAGED

Pobrano z oficjalnego npm dokładnie postcss-selector-parser7.1.6 i potwierdzono SHA-512 oraz SHA-1 archiwum. Usunięto blokadę braku dowodu pochodzenia kandydata. Zależność aplikacji nadal ma wersję6.1.4; aktualizacja i zamknięcie podatności wymagają następnego etapu. Produkcja nadal NO_GO.

| Sprawdzenie lokalne | Wynik |
| --- | --- |
| Metadata / archiwum npm | HTTP200:2918 /46652 bajty; dokładne dwa GET, bez ponowień i przekierowań |
| Integralność kandydata | SHA-512 i SHA-1 zgodne z metadata; SHA-25648c903f9… |
| Niezależne przypadki ochronne inspektora | 9/9PASS:2 poprawne wejścia,7 odrzuceń; to testy narzędzia |
| Odczyt archiwów6.1.4 i7.1.6 | Po37 plików; main,processor i deepunesc są niepustymi zwykłymi plikami |
| Publiczny6.1.4 a zainstalowany parser | Wszystkie37 skrótów plików identyczne,0 różnic |
| Testy aplikacji / TS / build / przeglądarka | 0 /0 /0 /0 nowych uruchomień |
| Instalacja / rozpakowanie na dysk / wykonanie paczki | 0 /0 /0 |
| Niezależne recenzje | Dwie ograniczone GO; osobny audit actual postwrite |

Przed wykonaniem poprawiono kontrolę integralności w procesie nadrzędnym, odrzucanie fizycznych nagłówków GNU/PAX, sprawdzanie zwykłych plików modułów, schematy wybranych pól JSON i duplikaty kluczy oraz powiązanie archiwów z metadata i wcześniejszym dowodem C38. Driver zapisuje wynik również przy błędzie po testach. Wcześniejsze źródłowe HOLD i pełne rewizje zachowano; wszystkie poprawki oceniał niezależny recenzent. Dziewięć niezależnie przygotowanych przypadków wykonano raz, potem raz odczytano dwa archiwa. Kod paczki nie był wykonywany.

Sprawdzenie dwóch odrębnych stron GitHub Advisory Database potwierdza, że [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) obejmuje wersje<7.1.6 i wskazuje poprawkę7.1.6, Moderate5.9. Obecny6.1.4 nadal należy do tej tabeli; nie wykazano w Coachfi ścieżki ataku z niezaufanym selektorem. Osobny [GHSA-w9m9-85wc-3x92](https://github.com/advisories/GHSA-w9m9-85wc-3x92) ma inne zakresy, wykluczające6.1.4 i7.1.6. Te dwa adresy otwarto łącznie cztery razy w dwóch wywołaniach narzędzia; to osobny ruch względem dwóch żądań npm.

Nowy kandydat wykracza poza deklaracje Tailwind3.4.19(^6.1.2) i postcss-nested6.2.0(^6.1.1). Przygotowano cztery przyszłe przypadki rzeczywistej zgodności, ale ich nie wykonano. Obecność nazw plików, deklaracja node>=4 i brak pola exports nie dowodzą działania require, importu deepunesc ani zgodności obu konsumentów. Przed aktualizacją trzeba również zachować osiem wcześniejszych przypadków bezpieczeństwa selektorów C37/C38. Historyczne określenie „locally hardened” w projekcie testów oznacza tu wcześniej przyjętą wersję i pokrycie testowe; nie dowodzi odrębnej ręcznej poprawki — wszystkie37 plików są zgodne z publicznym6.1.4.

Zachowano310 wcześniejszych źródeł/narzędzi,614 wejść aplikacji,13preserve,32receipts,15 kontraktów SDK, runtime37plików/2konsumentów, tombstone oraz HEAD/gałąź/indeks. Trzy nowe narzędzia lokalne dają313 ścieżek przejęcia. Wynik C69:3534 zarejestrowanePASS/3495 unikalnych par plik–tytuł i TSexit0 pozostaje historyczny. Nie powtarzano zielonych testów aplikacji.

Nie zapisano surowego metadata ani nagłówków/autorów/maintainerów. Zachowano ograniczoną projekcję, skrót i liczbę bajtów. Proces nadrzędny przekazuje wartości pięciu dozwolonych zmiennych systemowych; dodatkowe siedem nazw Windows obsługuje bez odczytu wartości. Żadnych wartości środowiska nie zapisano. Brak odczytu rzeczywistych profili, sesji i sekretów.

Kandydat jest trzecim znanym archiwum, lecz pozostaje poza obecnym lockfile. Jego pokrycie nadal wynosi2/491 archiwów;489 jest niesprawdzonych. Brak instalacji, clean install i stagingu nie daje PASS.

Następny skończony C72: implementacja i niezależna ocena czterech przypadków zgodności oraz zachowanie ośmiu ochronnych przypadków selektorów, w nowym odizolowanym katalogu zadania. Osobna ocena zakresu, narzędzia i oczekiwanych wyników poprzedzi rozpakowanie i wykonanie kandydata. Potem decyzja o aktualizacji zależności; pełne odtworzenie lockfile i clean install pozostają osobnymi bramkami. Pętla pozostaje aktywna dla tego konkretnego zadania. AI i zapisy chmurowe HARD_OFF; bez push/deploy.

[Weryfikacja](../../../evidence/cycle-71/verification.json) · [Projekt zgodności i źródła](advisory-compatibility.md) · [Source review](review.md) · [PRODUCT review](product-review.md)
