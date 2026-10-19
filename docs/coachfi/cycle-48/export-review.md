# C48 — niezależny kontrakt i fixture eksportu serii

Status: SOURCE_CONTRACT_GO_BASELINE_PENDING. Recenzent/autor fixture: c47_curriculum. Autor planowanej zmiany produktu: root. 2026-10-17T10:17:07.202Z. Odczyt źródeł; bez testów, buildu, npm i produkcji.

Gałąź coachfi-streak wybranego eksportu sprawdza skończone liczby0..100000 i datę, ale nie sprawdza całkowitości liczników ani longestStreak≥currentStreak. Rzeczywisty strict reader odrzuca takie rekordy, zwracając unavailable bez naprawy raw. DataSafetyPanel na stronie privacy wywołuje buildOwnedLocalDataExport i serializuje wynik do JSON Blob. To wiarygodna rozbieżność źródłowa do lokalnego odtworzenia; nie stwierdzono eksportu rzeczywistych danych ani błędu produkcji.

Przygotowano18przypadków:10sanitizera i8rzeczywistego buildera. Trzy złe kształty licznika — ułamkowy current, ułamkowy longest, longest<current — są porównane z rzeczywistym readerem, a potem w local/session eksportu. Kontrole obejmują zdrowe zero i100000, projekcję3pól, limit100001, datę przyszłą, pustą datę oraz błędny kalendarz. Builder zachowuje zdrową drugą przestrzeń, selectedfields, dane języka i wersję2; pomija identity/auth/free text, odczytuje wyłącznie dokładną listę kluczy i nie zapisuje/nie usuwa danych. Stare/mieszane uchwyty blokuje przed odczytem, zmianę owner podczas odczytu blokuje przed oddaniem częściowego wyniku.

Użyto rzeczywistych owner leases i przechwyconych uchwytów product-storage, opartych na syntetycznych Mapach; wrappery jedynie rejestrują i delegują getItem. Writer-only persist/notify są mockami, fetch jest pułapką, zegar stały. Nie uruchamiano UI/Blob/download, browser storage, cloud, stagingu lub realnych sesji. Root ma osobno zrecenzować fixture; autor nie przyjmuje własnego testu. Szacunek baseline9PASS/9FAIL pozostaje szacunkiem do rzeczywistego przebiegu roota.

Minimalny kontrakt korekty: oba liczniki są safe integers i longest≥current, przy zachowaniu wszystkich istniejących limitów i pozostałych gałęzi. Nie wprowadzać współdzielonego validatora, zaokrąglania, naprawy raw, nowej daty/sentinel polityki lub eksportowanych pól. To nie pełna równoważność ze strict readerem: reader dopuszcza100001 i pustą datę0/0, które eksport nadal pomija; eksport nadal dopuszcza prawidłową datę przyszłą, którą reader odrzuca. Te różnice mają jawne kontrole.

Root prowadzi baseline/retest i raz dotknięte cztery historyczne pliki export, TS oraz kontrolowany build. Bez powtórek zielonych C47/API/voice, bez nowego browser fixture, świeżej oceny prawnej i produkcja PASS. Wyniki wykonania i niezależna recenzja produktu oczekują. [Dowód, zakres i SHA](../../../evidence/cycle-48/export-review.json).

## Recenzja produktu i rzeczywistego baseline/retest

2026-10-17T10:19:55.911Z. PRODUCT_AND_18_RETEST_ACCEPTED_PENDING_LEGACY_TS_BUILD. Dokładny forward i inverse dowodzą jednej zmiany warunku if w gałęzi streak. Oba liczniki muszą być safe integers i longest≥current; wszystkie pozostałe bajty produktu, data/cap/sentinel/whitelist/owner pozostają literalne. Autor root; recenzent c47_curriculum. Root osobno przyjął fixture przed baseline — autor testu nie zatwierdza własnego fixture.

Surowy baseline to18przypadków:9PASS/9FAIL. Dziewięć failures dotyczy wyłącznie końcowego oracle pominięcia:3sanitizer i6builder(local/session), dla trzech kształtów błędnych liczb. Nie jest to dziewięć osobnych wad produktu. Te same literalne fixture i uporządkowane nazwy dały18PASS po zmianie.545wejść w każdym przebiegu bez driftu; pomiędzy przebiegami zmienił się wyłącznie lib/data-export.ts, runtime parsera literalny. Zdrowe/reader/privacy/raw-preservation asercje poprzedzające target oraz afterEach no-write/no-network nie zgłosiły failures.

Sprawdzone niezależnie przez odczyt surowych wyników i SHA; recenzent niczego nie uruchamiał. Dotknięte26historycznych przypadków, TS i build pozostają oczekujące w tej fazie. Brak finalnej akceptacji cyklu, UI/download/staging/produkcja PASS.

## Końcowa recenzja produktu, wyników i raportu

2026-10-17T10:23:41.607Z. ACCEPTED_LIMITED_LOCAL_STREAK_EXPORT_C48,0otwartych findings. Po18nowych PASS w osobnym przebiegu przeszło26dotkniętych historycznych przypadków w4plikach (14+6+4+2). To44różne przypadki w2przebiegach,5plików łącznie; nie pojedyncza suita44. Standalone TS exit0,545inputów bez driftu. Jeden build tej samej kontrolowanej kopii TEMP:34strony/35tras,545przed/544po pominięciu next-env,0różnic. Surowy stderr identyczny z C47 po zamianie tylko czasu79s→32.1s; znane ostrzeżenia CDP pozostają.

Niezależny odczyt wyników i SHA potwierdza543literalne spośród544wcześniejszych wejść i jedną kwalifikację lib/data-export.ts; wszystkie124historyczne ścieżki z126tupli,9preserve i9receipts zachowane. Runtime parsera6.1.4/37plików/2konsumentów, package/lock oraz index/HEAD/gałąź bez zmiany. W tej fazie nie uruchamiałem npm, testów, TypeScript lub buildu. Fixture i jej retest mają osobnego niezależnego peera roota; autor fixture nie zatwierdza własnego testu.

REPORT i verification w REVIEW_PENDING odpowiadają surowym wynikom i ograniczeniom. Dozwolone rutynowe promowanie statusów, dopisanie końcowego C48 do program/roles/current-cycle oraz active_cycle48 i wyłącznie top-level streak_export_patch w obu backlogach, przy zachowaniu40tasks i B05/B10partial. Końcowa higiena/receipt pozostają do zapisania, bez deklaracji ich PASS w tej recenzji. Po tym GO bez zmian produktu/narzędzi/fixture i bez dalszych runtime. Nadal brak native UI/download, pełnych praw cloud, oceny prawnej, clean-install, CVE closure, stagingu i produkcja PASS.
