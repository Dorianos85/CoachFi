# Coachfi C73 — lokalna aktualizacja parsera

Status: ACCEPTED_LIMITED_LOCAL_DEPENDENCY_UPDATE_UNSTAGED

Zaktualizowano rzeczywisty lokalny postcss-selector-parser z 6.1.4 do 7.1.6. Obaj konsumenci — Tailwind 3.4.19 i postcss-nested 6.2.0 — rozwiązują teraz tę wersję z głównego node_modules. Oryginalne 21 testów przeszło, TypeScript zakończył się bez błędów, a build Next zakończył się poprawnie z jawnym mockiem fontów. Nie wdrożono zmian. Produkcja: NO_GO.

| Weryfikacja | Wynik |
|---|---|
| Oryginalne C38: granice parse/serialize/clone/walk | 8 PASS; każda obserwacja wskazuje 7.1.6 |
| Oryginalne C38: rzeczywisty CSS projektu i Tailwind | 13 PASS |
| TypeScript, bez emitowania i incremental | exit 0 |
| Next w świeżym TEMP, fonty syntetyczne | PASS; 34/34 generacji, 35 tras (24 statyczne, 11 dynamicznych) |
| Osłona sieci podczas buildu | 25 kompletnych kontekstów, 50 zdarzeń; brak oczekujących i odmów |
| Niezależne recenzje końcowe | Dwa ograniczone GO; ledger osobno po zapisie |

Zmiana manifestu dodaje dwa scoped overrides wyłącznie dla tych konsumentów. Siedem wcześniejszych overrides zachowano. W root locku i ukrytym locku zmieniono tylko version, resolved i integrity jednego wpisu parsera; pozostałe obiekty są identyczne (608 wpisów root, 590 hidden). Skopiowano dokładnie 37 zweryfikowanych plików producenta do lokalnego runtime: 36 zmienionych, jeden identyczny. Zachowano pełny rollback 37 plików i trzech metadanych. Bez npm, skryptów instalacyjnych i zmiany historii Git. [Dowód metadanych](../../../evidence/cycle-73/dependency-change.json), [runtime](../../../evidence/cycle-73/runtime-change.json), [rollback](../../../evidence/cycle-73/runtime-rollback.json).

Dwa overrides świadomie wychodzą poza publikowane zakresy 6.x konsumentów. C72 zachowuje swoje 24 pary porównań bez ponowienia. Obecne 21 testów uruchomiono na fizycznie zaktualizowanej zależności; dodatkowe 13 istniejących przypadków sprawdza rzeczywisty theme, CSS i kontrakty Tailwinda. Zmiana wewnętrznego eksportu deep-unesc pozostaje jawna: 6.x eksportuje funkcję, 7.x obiekt __esModule/default; sprawdzony interop Tailwinda obsługuje oba. Nie deklarujemy ogólnej zgodności bezpośrednich importów tego API. [Testy](../../../evidence/cycle-73/security-retest-run.json), [TS](../../../evidence/cycle-73/typecheck-run.json), [build](../../../evidence/cycle-73/build-run.json).

Pierwsza próba w Windows sandbox zakończyła się EPERM przy rename cache Vite przed zebraniem testów: zero testów i dwie awarie zbierania plików. Zachowano raw, journal i uruchomione źródło. Automatyczna kontrola zezwoliła na to samo lokalne wykonanie poza sandboxem; drugi przebieg zebrał i zaliczył 21 przypadków. Nie traktujemy pierwszej próby jako 21 błędów aplikacji. Były łącznie cztery uruchomienia wrappera (dwa testowe, jeden TS, jeden build), cztery osobne kontrole składni bez wykonania importów oraz osiem izolowanych procesów kontroli parsera. Zielonych testów na tym samym runtime nie powtarzano.

Build używa dokładnie dwóch jawnych odpowiedzi Google CSS z syntetycznym font-face i src:local(Arial). Nie pobiera fontów ani nie korzysta z prywatnego cache lub plików .env. To test kompilacji z mockiem fontów; nie potwierdza działania Google Fonts ani jakości glifów. Osłona API sieci była gotowa w każdym zaobserwowanym kontekście buildu; nie stanowi izolacji systemowej przed złośliwym kodem. Dwa wcześniejsze ostrzeżenia o opcjonalnych modułach SDK pozostały identyczne z C67 po usunięciu wyłącznie różnicy czasu kompilacji. [Porównanie](../../../evidence/cycle-73/post-validation-parity.json).

327 aktualnych plików źródeł/narzędzi to 319 wcześniejszych identycznych, dwa świadomie zmienione pliki metadanych i sześć nowych narzędzi. Wybrany manifest źródeł/buildu ma 620 wejść: 612 wcześniejszych identycznych, te same dwa zmienione oraz sześć narzędzi; po buildzie porównano 619 kopii, pomijając generowany next-env.d.ts tylko w TEMP. To wybrany manifest, a nie pełna lista wszystkich przechodnich deklaracji kompilatora. Preserve13 ma 11 plików identycznych i te same dwa uzasadnione wyjątki. Receipts34, SDK15, 325 plików konsumentów, HEAD/branch/indeks pozostają bez zmian. Z 820 pinów modułów 32 zmieniły się wyłącznie w parserze, 788 jest identycznych. Osobne kopie producenta i rollbacku (37+37) zachowano dokładnie.

Aktualny lock ma nadal 491 unikalnych archiwów, z których lokalnie zweryfikowano dwa: cssesc 3.0.0 i teraz parser 7.1.6. Stare archiwum 6.1.4 nie jest już liczone do tego locka. Pozostałe 489 jest niesprawdzonych, nie uznanych za niedostępne. Wersja lokalna 7.1.6 jest poza zakresem affected advisory sprawdzonego w C71; nie zamykamy globalnie B10 ani gotowości produkcji. Brak nowego PASS dla czystej instalacji, pełnego normalnego zestawu aplikacji, przeglądarki, Auth/RLS, zgód, eksportu i stagingu. AI i zapisy cloud pozostają HARD_OFF. [Weryfikacja](../../../evidence/cycle-73/verification.json).

Następny skończony etap C74: izolowana weryfikacja świeżego runtime z aktualnego locka, bez lifecycle, produkcyjnego środowiska i danych kont. Dopiero jej rzeczywisty wynik może rozszerzyć przyjęcie poza istniejącą lokalną instalację.
