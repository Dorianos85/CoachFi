# C61 — niezależne review produktu, PL/EN i lifecycle

Reviewer: c49_validation. Autor produktu: c49_advisories. Własne fixtures, fixture-design, emulator i oracles są wyłączone z tego zatwierdzenia; peer fixtures należy do root i c49_dependency_review. Reviewer nie wykonuje aplikacji, SDK, testów, TypeScript, builda, przeglądarki lub sieci i nie zmienia produktu.

## Etap 1 — propozycja przed lokalnym zastosowaniem

GO STATIC PRODUCT SOURCE ONLY, 0 findings. Odczytano proposal706d8fec i design56515bdf, całe old/proposed źródła i zainstalowany kontrakt auth-js2.105.4. Rzeczywiste AuthContext e0c419b2 oraz AccountButton6bfd6c60 są nadal całym before.9+3 unikalne mappings odtwarzają całe after i odwrotnie; CRLF160→203 oraz350→379, bez loneLF.14 zależnych pinów literalnych. Całe dotychczasowe signin/signup/magiclink i wszystkie9 rekordów accountCopy zachowane.

Ścieżka jest warunkowa: brak selektora CDP w Providers/AppNavigation oraz skonfigurowany Supabase. Nie czytano wartości wdrożenia. Zainstalowany SDK zwraca pole error, którego dotychczasowy provider nie oceniał. Wywołanie bez argumentów i domyślny scope global pozostają. Root zapisał osobną publiczną notę docs/changelog; ta recenzja nie uruchamia SDK ani własnej sieci.

Provider zachowuje synchroniczne odłączenie lokalnego właściciela przed await. Osobny status przeżywa user→null; returned error i thrown rejection stają się ogólnym unconfirmed, bez przywracania A lub kasowania sesji. Synchroniczny attempt-ref blokuje duplikaty, a controller/attempt/guest fences odrzucają stare wyniki po nowym B lub nowej generacji A, cleanup albo disabled. Prawidłowy null-event SDK może zmienić guest w trakcie tej samej operacji i jest śledzony. Nie zmienia to istniejącej polityki ani autorytatywności kolejności callbacków.

PL/EN komunikują trwanie lub brak potwierdzenia wylogowania z usługi, bez obietnicy unieważnienia tokenów. Pending ma disabled/aria-busy/status; błąd ma ogólny alert i retry poza zamkniętym Dialog, przed gałęzią user/signin. Surowy błąd SDK nie trafia do nowego UI. Hooki pozostają bezwarunkowe, stan i cleanup mają właściwy lokalny lifecycle; źródła nie dowodzą natywnego focusu lub zachowania AT.

Baseline i runtime są pending. Nowe result/status/copy to kontrakty, nie18 stwierdzonych dawnych usterek; własne fixtures nie są przyjęte przez ich autora. Bez realprovider/native/SDKrevocation/JWT/fullsecurity,7pozostałych języków, AT/fullAA, staging lub produkcyjnego PASS. AI/cloud HARD_OFF, produkcja NO_GO.

## Etap 2 — rzeczywiście zastosowany produkt, wyniki i plan dziewięciu zapisów

GO LIMITED LOCAL PRODUCT AND EXACT NINE METADATA PLAN, 0 findings. Actual Auth5e4c9e2f i Accountb73574d1 są całymi after proposal706d i source-changeab159; inverse9+3 odtwarza pełne before, CRLF203/379 bez loneLF.245unikalnych currentpins i238literalnych wcześniejszych ścieżek,13preserve/22receipts/11SDK zgodnych. To recenzja po zastosowaniu i po raw, bez twierdzenia o wcześniejszym appliedpeer tego reviewera.

Odczytano oba raw18grup: baseline0P18F, te same18P0F0SKIP po zmianie, bez korekty fixture lub legacyreruns.18różnych cases/36wykonanych instancji; grupy wariantów nie są dodatkowymi cases. PL/EN przed zmianą miały zwykłe signin zamiast pending/error/retry, returnedSDKerror był ignorowany, a thrownerror wychodził przez stary voidhandler. Same-turn stary handler robił2SDKcalls. Po zmianie pending jest disabled/aria-busy/status, błąd to ogólny alert/unconfirmed bez szczegółów SDK, jeden call przy duplikacie oraz rzeczywiście wykonany retry do idle po error:null. Baseline bez przycisku nie udaje wykonanego retry.

Sześć wariantów późnych odpowiedzi po nowym A/B zachowuje nowy handle/UID/status/pusher/raw. Unmount i disabled nie dopisują późnego stanu; null-event własnego SDKsuccess zastępuje guest i kończy pending. Syntetyczne obszary local/session i125/251 oraz321/432 pozostają bez mutacji/fetch, tylko zdarzenia owner. Dawny synchroniczny fence już działał;18nowych kontraktów nie znaczy18historycznych luk. Własne fixtures, emulator i oracles wyłączone z mojego zatwierdzenia — peer root+primary.

Jeden TS0/573inputs/0drift i jeden TEMPbuild573pre572post/34strony35tras/0drift. Cały stderrC60 równy po jedynej28.8s→32.0s, ostrzeżenia pozostają. Bez native Chrome, instalacji lub runtime SDK, realprovider, konfiguracji wdrożenia lub potwierdzenia revocation/JWT. Wcześniejsze signin/copy9locale i defaultglobalscope literalne; nowe znaczenie przyjęte tylko PL/EN w lokalnych mockach.

Draft REPORT8ebf, verification9b8b i behavior89be są zgodne z raw i ograniczeniami. Plan9:a650b08a zweryfikowany: actual nadal before, wszystkie before/afterhashes poprawne; raport tylko status/reviewrow, verification tylko status,5całych prefiksów append-only i wszystkie nowe linki istnieją. Oba40tasks/rawSHA/statusy i stare pola literalne, backlog zmienia tylko active_cycle oraz dodaje cycle61_logout_outcome_patch. Rzeczywiste zapisy, hygiene/Git/receipt/pointer nie są tu przyjęte.

Zachowano etap1 i cały wcześniejszy prefixMD. To końcowy zamrożony review; późniejszy postwrite ledger wyłącznie w nowym pliku. Autor nie przyjmuje własnych fixtures, fullauth/security, callback-provenance policy,7innych języków, AT/fullAA, staging ani produkcji. AI/cloud HARD_OFF, produkcja NO_GO.
