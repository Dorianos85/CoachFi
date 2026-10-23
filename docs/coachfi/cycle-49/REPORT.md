# C49 — nieużywany klient głosu w manifestach

Status: ACCEPTED_LIMITED_LOCAL_UNSTAGED. 18.10.2026. Autor manifestów: root. Niezależni recenzenci: c49_dependency_review i c49_validation; osobny triage advisories: c49_advisories, z recenzją roota. Lokalna paczka, produkcja NO-GO.

Usunięto deklarację @elevenlabs/client w zakresie ^1.7.0 (lock 1.7.0) i dokładnie 14 wyłącznych wpisów package-lock.json, wliczając SDK. Liczba root dependencies spadła z 22 do 21, a lock entries z 642 do 628. Wszystkie pozostałe rekordy i CRLF zachowano. Nie zmieniono wersji pozostałych bibliotek. Współdzielone jose i tslib pozostają w grafie.

Świeży niezależny przegląd 432 plików authored code oraz grafu dependencies/dev/optional/peer potwierdził brak literalnych importów lub resolverów tych 14 pakietów. Dwa odwołania do klienta w worklets to komentarze. Samodzielny public/elevenlabs/convai-widget.js, MilaVoiceAgent i worklets pozostają identyczne; usunięcie wpisu npm nie usuwa wygenerowanych bajtów widgetu ani nie włącza zewnętrznego AI.

Pojedynczy npm uninstall --package-lock-only --offline --ignore-scripts --no-audit wykonał się w nowym TEMP z pustymi config/cache i exit0. Kandydaci przeszli osobną recenzję przed zastosowaniem: dokładnie jedna deklaracja root i 14 bloków locka, bez innych zmian. Surowy child receipt zapisano przed parsowaniem. Nie wykonywano instalacji lub pruning node_modules; npm offline nie jest dowodem systemowej izolacji sieci.

| Bramka lokalna | Wynik |
|---|---|
| Istniejące testy API/hardOFF/lokalnego głosu | 36/36 PASS w 3 plikach: 29+3+4 |
| Jeden ukierunkowany TypeScript check | exit0; 19 automatycznych typów → 18, bez usuwanego @types |
| Faktyczna lista plików kompilatora | 0 plików @types/dom-mediacapture-record; obecne lib.dom.d.ts oraz dwa kontrolne pliki projektu |
| Jeden build kontrolowanej kopii TEMP | PASS z zachowanymi ostrzeżeniami CDP; 34 strony, 35 tras; 545 wejść przed / 544 po, 0 driftu |
| Historia źródeł | 543/545 wcześniejszych wejść literalnych; tylko dwa manifesty kwalifikowane; 128/130 wcześniejszych ścieżek literalnych + dwa manifesty |
| Niezależne recenzje | dwa końcowe niezależne review PASS; 0 otwartych uwag |

Pakiet @types/dom-mediacapture-record dodaje globalne deklaracje, więc samo pozostawienie go w node_modules mogłoby maskować zależność typów. Przed pierwszym sprawdzeniem zmieniono plan walidacji: jedyny osobny tsc zachowuje wszystkie automatyczne typy poza tym pakietem i zapisuje --listFiles. Bramka wymaga nie tylko braku jego deklaracji, ale też obecności lib.dom.d.ts, lib/data-export.ts i app/providers.tsx. Tsconfig projektu jest niezmieniony. To uzasadniony dodatkowy zakres kontroli, nie drugi zwykły retest ani dowód czystej instalacji.

36 to istniejące przypadki powtórzone raz z powodu zmiany zależności. Sprawdzają rzeczywiste handlery z mockiem CDP i pułapką fetch oraz syntetyczny silnik lokalnego głosu. Nie weryfikują realnej autentykacji, dostawców, natywnego audio lub przeglądarki. Nie tworzono pozornego failing-app baseline i nie powtarzano zielonych 44 przypadków C48. Wszystkie 14 usuniętych z locka drzew nadal są fizycznie obecne w używanym runtime; build i testy nie stanowią clean-install PASS.

Osobno odświeżono publiczne źródła: [parser](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) nadal wskazuje poprawkę 7.1.6, przekraczającą oba lokalne zakresy 6.x; [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) nie wskazuje poprawionej wersji. Metadata registry npm była niedostępna, więc nie deklarujemy pełnej enumeracji wydań. Osadzone kopie parsera i pozostałe residuals nie zostały naprawione. To wąski triage, bez globalnego audit lub CVE closure; brak ustalonej poprawki nie daje security PASS. [Szczegóły triage](advisory-update.md).

Dziesięć wcześniejszych receipts C39–48, C48 export/fixture, pozostały kod produktu i istniejący index są zachowane. B10 pozostaje częściowo otwarte; wszystkie 40 zadań w obu backlogach bez zmiany. Bez stagingu nowych plików, commit/push/deploy, migracji/zapisów produkcyjnych, odczytu rzeczywistych profili/sesji/sekretów lub płatnych wywołań. AI i cloud writes hardOFF, staging i gotowość produkcji niepotwierdzone.

[Dowody i recenzje C49](../../../evidence/cycle-49).
