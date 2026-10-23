# C50 — liczby całkowite punktów w wybranym eksporcie

Status: ACCEPTED_LIMITED_LOCAL_UNSTAGED. 18.10.2026. Root autor kodu/narzędzi; c49_validation autor fixture, root peer fixture; c49_dependency_review niezależny source/tools reviewer, c49_advisories niezależny fixture/raw reviewer. Lokalna paczka, produkcja NO-GO.

Selected export przepuszczał ułamkowe saldo punktów (np.125.5), choć rzeczywisty reader punktów odrzuca je jako uszkodzone. W lib/data-export.ts zmieniono jedno wyrażenie admission dla coachfi-tokens: dodano Number.isSafeInteger przed dotychczasowym finite/range checkiem. Ułamkowy stan jest pomijany, bez zaokrąglania lub zapisu raw. Nie zmieniono helpera kwot, token reader/writer, innych kluczy, owner fences ani interfejsu eksportu.

| Bramka lokalna | Wynik |
|---|---|
| Baseline tych samych 33 przypadków | 15 PASS / 18 FAIL; wszystkie błędy dotyczyły pominięcia trzech ułamków |
| Po poprawce, identyczne fixture | 33/33 PASS; wszystkie 18 wcześniejszych FAIL zamknięte |
| Dotknięte historyczne przypadki | 44 PASS w 5 plikach; 77 różnych przypadków w dwóch udanych przebiegach |
| Jeden TypeScript | exit0, 546 wejść bez zmiany podczas sprawdzenia |
| Jeden TEMP build | PASS z zachowanymi ostrzeżeniami CDP; 34 strony, 35 tras; 546 wejść przed / 545 po, 0 driftu |
| Niezależne końcowe recenzje | dwie niezależne recenzje PASS; 0 otwartych uwag |

Rzeczywiste sanitize/collector/owned builder, token read i owner leases pracowały na syntetycznych Mapach. Sprawdzono guest/account i local/session, zdrowe0/125/1e9, odrzucenia typów, denied read, owner changes i brak fizycznych set/remove po seedowaniu. Tylko writer-only persist/notify mock; fetch trap. Owner seeding może emitować zdarzenia: brak osobnej bramki liczby eventów. Nie uruchamiano nowego browser/download ani realnej autentykacji.

Zachowano dotychczasowy cap1e9: większe safe integers są nadal pomijane, nawet gdy reader je akceptuje. JSON125.0/exponent/whitespace mogą nadal dawać całkowite125 w eksporcie mimo odrzucenia raw przez reader. Ta paczka nie wprowadza pełnej zgodności schematów lub migracji. Zdrowe kwoty/ratios mogą być ułamkowe, więc generic number pozostaje identyczny. C48 streak predicate i C49 manifesty pozostają zachowane.

Build korzystał z istniejącego node_modules w kontrolowanym TEMP, bez clean-install. Pełny stderr jest identyczny z C49 po wyłącznie normalizacji czasu kompilacji46s→43s: nadal brak opcjonalnych x402-fetch i @base-org/account. Brak naprawy tych ostrzeżeń lub nowego ambient-probe PASS.

Najpierw zakończono wąską ocenę wykonalności zależności. [Oficjalne metadata parsera7.1.6](https://registry.npmjs.org/postcss-selector-parser/7.1.6) pozostają niedostępne z użytych narzędzi; źródła tagu nie potwierdzają SRI/tarballa ani realnej zgodności. Nie zgadywano integralności, nie wykonywano override/install lub ponownego audit. [Ocena i ograniczenia](dependency-feasibility.md) ma niezależny root peer; brak advisory closure.

Historia: 544/545 wcześniejszych wejść literalne + jeden jawnie zmieniony export; 135/136 wcześniejszych ścieżek literalne + ten sam export; 11 receipts C39–49 zachowane. Kod zachował swoje LF. B05/B10/B17 i wszystkie40tasks obu backlogów pozostają bez zmiany. HEAD/branch/index zachowane. Bez stagingu nowych zmian, commit/push/deploy, produkcyjnych zapisów/migracji, rzeczywistych sesji/profili/sekretów lub płatnych wywołań. AI/cloud writes HARD_OFF; staging i pełna gotowość nadal niepotwierdzone.

[Dowody i recenzje](../../../evidence/cycle-50).
