# C21 — baseline danych SignInGate

Status: fixture przygotowany, bez wykonania i bez zmian produktu. Root musi niezależnie przeczytać fixture przed pierwszym runem.

Trzy rzeczywiste acceptance oracles dotyczą wyłącznie trzech zer konfiguracji: wynik jest określony przez wyłączone reguły, więc nie wolno capture ani czytać postępu. Dwa uszkodzone SRS oraz jawny requestSignIn z dwoma subskrybentami mają przed poprawką ujawnić FAIL. Te same assertions pozostaną do targeted retestu.

Osobna grupa ma dwa zdrowe przypadki kontrolne i siedem diagnostycznych obserwacji. Zdrowy actual reader sprawdza timer poniżej/równo progowi i parę lekcji przed/po spełnieniu. Diagnostyczny PASS odtwarza ograniczenie, nie przyjmuje produktu: malformed SRS/manual/steps i niedostępny czas są jawnie opisane. Żaden unknown nie otrzymuje nowej decyzji required.

Wszystko korzysta z rzeczywistych lokalnych shared readers. Tylko lookup uchwytu jest podmieniony na jawny syntetyczny PersonalStorageHandle; config stubowany przed importem, bez SDK/remote, realnych kont, profili lub sekretów. Wszystkie cache bytes mają zostać bez zmian, zero writes/cloud/fetch.

Minimalny kierunek po baseline i design review: wyłącznie exact triple-zero early return w isSignInRequiredNow, bez zmiany pure predicate, innych konfiguracji ani currentSignInProgress.

## Rzeczywisty pierwszy wynik

12 przypadków: trzy normative OFF FAIL oraz dziewięć zdrowych/diagnostycznych PASS. Jedenaście hashów źródeł i fixture przed/po zgodnych. OFF nonarray i requestsubscriber odtworzyły TypeError; malformed OFF zwrócił false po niepotrzebnym capture/read. Dziewięć PASS nie oznacza akceptacji wadliwych projekcji danych. Pełny raw i15 obserwacji w `read-author-baseline-run.json`; osobny raw Vitest w `read-author-baseline-tests.json`.

Produkt pozostaje bez zmian. Po odrębnej akceptacji i poprawce można ponowić tylko trzy niezmienione OFF oracles wzorcem `C21 OFF acceptance oracles`; pozostałych dziewięciu zielonych nie ponawiamy bez nowej obawy.
