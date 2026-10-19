# Cykl2 — niezależna recenzja rachunków i danych diagnozy

2026-10-14. Recenzent: architecture_audit. Autor score/health: curriculum_pilot; exportv2 i cloudhealth guard: koordynator. Lokalny checkout `source/CoachFi`, gałąź `codex/p0-security-consent-export`, baza `86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b` plus zmiany cyklu2. Recenzent nie zmieniał implementacji; dodał osobną suitę i ten raport. Własne dependencies/status recenzenta ocenia ux_audit.

**Werdykt końcowy: ACCEPT limited local score/data, z retestem waluty.** Po pierwszym runie koordynator przyjął materialny kontrakt local_diagnosis+PLN oraz legacy_recomputed+legacy_unspecified bez konwersji. Finalne helper/export i guardy UI odczytano ponownie; rozszerzona suita9/9 PASS potwierdza jednostkę, source i idempotencję. Brak podstaw do uznania indeksu za naukowo zwalidowany, zalecenie inwestowania lub gotowy pełny produkt. Browser E2E i build/typecheck mają osobne bramki root/ux_audit; realne konta, cloud isolation i sprzęt nie były tu testowane.

## Zakres i metodologiczna niezależność

Odczytano `lib/financial-score.ts`, `lib/healthCheck.ts`, `lib/data-export.ts`, `lib/sync/cloudSync.ts` i testy autorów. Czytano również PL/EN `app/health-check/page.tsx`, `components/FinancialScoreCard.tsx` i wyłącznie score bloki `app/page.tsx`/`components/AppNavigation.tsx`. Porównano wzór z bazowym `HEAD:app/health-check/page.tsx`, a wcześniejszy kontrakt zapisu z `HEAD:lib/healthCheck.ts`. Nie czytano profili przeglądarek ani rzeczywistych odpowiedzi.

Procedury: coachfi-financial-review, coachfi-data-integrity oraz React checklist. Nowa suita recenzenta to `tests/cycle2-health-data-review.test.ts`. Jej oracle nie wywołuje produkcyjnego kalkulatora ani nie korzysta z jego komponentów/saved score: liczy dokładne ułamki BigInt z kwot w groszach według algebraicznie uproszczonych reguł. 96 deterministycznych zestawów porównuje oracle do implementacji, w tym zera/deficyty, capy, cash boundary i osiem/dziewięć znaków celu, kombinacje czterech deklaracji.

## Rachunek, jednostki i warunki brzegowe

Wagi są zgodne z bazowym kodem:18+18+16+8+10+6+8+6+8=98. Nie dodano nowych wag i nie przeskalowano wyniku do100. Grupy: przepływy/ryzyko60, deklaracje planowania32, deklarowana wiedza6. Nowe wejścia PL/EN są w PLN; legacy nie ma ustalonej jednostki. Poniższa algebra używa dowolnej wspólnej jednostki kwot, a index/proporcje są bezwymiarowe. Nie konwertowano dawnych kwot ani nie podpisano ich jakoPLN.

Niech I=dochód, E=wydatki, S=oszczędności, D=dług, C=gotówka, F=max(I−E,0). Punkty przepływu to min(72F/I,18), pokrycia min(6S/E,18), długu max(16−4D/I,0). Dla I=0 dwa odpowiednie składniki mają0; dla E=0 pokrycie ma0. C>2I i brak deklaracji inwestowania daje4 zamiast8. Planowanie: inwestowanie10/2, długość trimmed celu>8 daje6, deklaracja poduszki8, planu emerytalnego8; deklaracja rozumienia inflacji6. Zaokrąglana jest końcowa dodatnia suma, połówka w górę.

| Przykład | Niezależny rachunek | Wynik |
|---|---|---|
| Wszystkie zera, wszystkie deklaracje false, pusty cel | 0+0+0+8+2 | 10/98; proporcje bez mianownika null |
| Bazowe dawne demo:6000/5200/3000/8000/20000, deklaracje false, długi cel | 48/5 +45/13 +32/3 +4 +2 +6 =6967/195≈35.728205 | 36/98, nie cached42 |
| I4000/E2000/S6000/D0/C0, cztery true i długi cel | 60+32+6 | 98/98 |
| Cents-based oracle | 96 zestawów; raw, rounded i trzy grupy | Wszystkie zgodne, tolerancja raw1e−10 dla porównania float; score dokładnie równy |

Zero jest świadomą liczbą, brak nie zastępuje go. Validator odrzuca brak/string/NaN/Infinity/ujemne/ponad1e12, nieboolean deklaracje, nieznane klucze, cel>1000. Publiczne proporcje są finite albo null; przy subnormalnym mianowniku capy punktów pozostają skończone, a UI nie otrzymuje Infinity. To zachowana heurystyka, nie medyczna/finansowa ocena bezpieczeństwa. Długość celu i samodeklaracja wiedzy nie mierzą jakości celu lub kompetencji; PL/EN opisują ograniczenie.

## Migracja, lokalność i eksport

Normalizacja przelicza kompletne odpowiedzi i odbudowuje wszystkie metadane, ignorując cached score/rawScore/scoreMax/groups. Legacy oznacza brak obu wersji; datę zachowuje, a odczyt nie zapisuje migracji. Niekompletne odpowiedzi albo przyszłe wersje są odrzucane. Wersja2 wymaga `legacy-weights-98-v1` i jednej z par: local_diagnosis+PLN lub legacy_recomputed+legacy_unspecified. Brak/obca/mieszana currency jest odrzucana. Normalizacja normalizacji legacy jest idempotentna i nie zmienia source/jednostki na bieżącą diagnozę.

Odczyt UI: legacy amount fields nie są prefillowane jakoPLN; wynik informuje o unknown unit, a monthlyFree nie jest wyświetlane jakoPLN. Home nie odczytuje dawnych kwot do PLN metrics; oddzielny demo badge pozostaje dla tych metrics nawet przy prawidłowym przeliczonym indeksie. To odczyt guardów i copy, nie wykonany przez recenzenta test przeglądarkowy.

Zapis wymaga bieżących wymaganych zasad, zachodzi tylko w localStorage i ogłasza sukces po udanym setItem. Nie wywołuje notifyCloud. Niezależny przypadek failure potwierdził zachowanie poprzednich bajtów diagnozy oraz brak event sukcesu. Cofnięcie wymaganych zasad powoduje null helpera; aplikacyjny UI ukrywa wynik. LocalStorage pozostaje magazynem urządzenia, nie potwierdzoną izolacją kont.

Root rozszerzył blokadę legacy sync: `pushEntity(...,'healthCheck',...)` bezwarunkowo return przed odczytem payload/storage/DB. Niezależny test używa Proxy rzucającego przy odczycie i DB/storage rzucających przy operacji: wszystko0 calls. Celowany odczyt account-sync/account-store/AuthContext/account API nie znalazł innej referencji health-check w tych plikach; nie jest to pełny dowód globalnej izolacji całego auth/sync.

Exportv2 odbudowuje numeryczne/boolowskie wejścia, przelicza wynik przez normalizer i kopiuje wyłącznie znane komponenty, grupy, finite/null proporcje oraz wersję/source/datę. Unknown credentials/nested fields i swobodny tekst celu są pomijane. Cel czytany jest jedynie lokalnie dla punktów długości; suita potwierdza brak tekstu i credentials w JSON oraz brak mutacji źródła.

Wybrany eksport nie jest kopią do reimportu całego HealthCheckResult: cel jest celowo pomijany, więc eksportowane answers nie wystarczają do pełnego ponownego wyliczenia punktów celu. Zachowane komponenty ujawniają jego znany wkład. V2 forwarding i output zachowują marker PLN/legacy_unspecified. Częściowy legacy export zachowuje dozwolone stare pola/cached liczbę jako dump z currency:legacy_unspecified, bez etykiety schema2/formulaVersion; normalizer nie przyjmuje go jako aktualnej diagnozy. Nie zadeklarowano migracji takich niekompletnych rekordów ani pełnego eksportu/usunięcia konta.

## Odtwarzalny wynik i ograniczenia

`node node_modules/vitest/vitest.mjs run tests/cycle2-health-data-review.test.ts` — **finalnie9/9 PASS**, 2026-10-14 14:04:00 według runnera, Vitest4.1.11, Node24.19.0. Jeden test zawiera96 oddzielnych scenariuszy oracle; to nie96 osobno raportowanych testów Vitest. Pozostałe osiem: re-eval starego demo; v2 export injection; częściowy legacy; Proxy queue guard; failure zachowuje poprzedni zapis; legacy unit/idempotence/export; sześć złych source/currency combos; nowy savePLN wyłącznie po required terms. Każdy test wymaga zera global fetch; tylko syntetyczne dane/mocki. Poprzedni stan13:48:06 miał6/6 PASS; nie przeniesiono go bez retestu na późniejszą zmianę.

Pierwsza próba finalnego runu nie rozpoczęła procesu: automatyczny reviewer uprawnień przekroczył deadline. Narzędzie dopuściło jedno ponowienie, które przeszło. Nie był to safety rejection ani failure aplikacji; timeout nie został policzony jako wynik testów.

Koordynator osobno zgłosił po zmianie waluty zbiorczy Vitest313/313 PASS (22pliki, w tym niniejsze9), browser E2E20/20 PASS i build34/34 PASS. To wynik root, nie powtórzenie przez recenzenta. Standalone typecheck wykrył potem w tej nowej suicie niezgodność BigInt literals z istniejącym targetem; nie jest jeszcze zaliczony do czasu ponowienia przez koordynatora.

Retest zgodności składni 14:14:14: zastąpiono wyłącznie0n/2n przez równoważne BigInt(0)/BigInt(2) w dwóch liniach oracle, bez zmiany tsconfig, runtime, wejść ani rachunku. Celowany diff oraz odtworzenie poprzedniego hash po cofnięciu wyłącznie tych dwóch linii potwierdzają zakres zmiany. Ponowne9/9 PASS obejmuje nadal96 scenariuszy. Aktualny SHA256 testu: `C2B35E10BA91E697338646F9DE0884FEF877771C0F964E31A13B26AC730C89E5`; fingerprint i diagnostykę uaktualniono też w JSON. To korekta własnego testu recenzenta, nie zmiana implementacji autorów.

E2E przeglądarki, lokalny sprzęt, rzeczywiste sesje/supabase RLS i operator danych pozostają poza tą opinią. Koordynator odnotował B13: logout debounce/hydration race w istniejącym AuthContext, nie naprawiony ani zamknięty przez tę recenzję. Blokada zdrowia zapobiega temu konkretnemu uploadowi, nie zatwierdza pozostałej synchronizacji. Nie ma deployu, aktywnych external calls ani pilota użytkowników. Dowody/hashes: `evidence/cycle-2/health-data-review.json`. Zmiana treści/formuły/source poza whitespace wymaga ponownej recenzji.
