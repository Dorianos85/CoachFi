# C43 — niezależna recenzja wyświetlania nazwy profilu

Status: **ACCEPTED_LIMITED_LOCAL_PROFILE_NAME_INTEGRITY_C43**, findingsOpen: **0**. Ograniczona lokalna akceptacja dla dorosłych w Polsce, PL/EN, na podstawie rzeczywistego źródła i surowych wyników.

Zmiana jednego return wywołuje trim wyłącznie dla string name. W innych przypadkach daje istniejące "Your". Sprawdzono pełny forward/inverse i CRLF; 8 innych deklaracji, getUser/saveUser/clearUserName oraz aktywne komponenty pozostały literalne. Nie naprawiono i nie sanitizowano zapisu profilu.

Baseline 22 przypadków: 12 PASS / 10 FAIL — sześć TypeError dla błędnych typów nazwy i cztery wyjątki rzeczywistego rodzica quizu PL/EN. To jedna błędna przesłanka typu. Pierwszy przebieg po poprawce: 22/22 PASS z tymi samymi nazwami i oczekiwaniami; wszystkie 10 FAIL zamknięte. Własne 16 obserwacji zachowuje profil, raw i saldo 125, z jednym odczytem i bez zapisów. Poprawne nazwy nadal mają dokładny trim i zachowują Unicode, percent i literalny markup; legacy controls bez zmian.

Osobna regresja: 18/18 PASS, dokładny historyczny multiset i literalny fixture C40. TypeScript pierwszy exit 0, 10 pinów bez różnic. Jeden build: 34/34 strony, 35 tras, 534 wejścia przed i 533 po, 0 różnic repo/kopii. Chrome użył tej samej zbudowanej kopii: 6/6 jednokrotnie, bez retry, flaky, skipped, API lub pageErrors; port wolny przed i po. Parser 6.1.4 / 37 plików / 2 konsumenci i dependencies bez zmian. Historyczne ostrzeżenia opcjonalnych modułów CDP pozostają jawne.

Chrome potwierdził działającą powłokę, prawdziwy QuizCard, klawiaturę i reload dla null-name, object-trim-spoof i zdrowego Unicode w PL/EN. Profil i pięć kluczy postępu pozostały takie same, saldo 125; bez submitu lub nagrody. Nazwa lokalna nie jest widoczna przed ukończeniem quizu, dlatego nie ma wymyślonej asercji widocznego "Your". Sonda obejmuje sześć kluczy; dane początkowe zapisano przed nią, a po reloadzie sonda jest nowa. To 22 nowe helper/SSR + 18 historycznych Node + 6 Chrome, łącznie 46 różnych przypadków w trzech przebiegach, bez globalnego run 46.

Wszystkie 76 wcześniejszych ścieżek source/tools zachowano literalnie (77 wystąpień kotwic). Wśród 530 oryginalnych wejść 529 jest literalnych, a lib/user.ts ma jawną kwalifikację source proof; brak reanchorów historycznych source/tools.

Zakres nie obejmuje całej walidacji profilu, naprawy danych, ograniczenia nazwy lub truthful unavailable. Nie ma nowego kontraktu bezpośredniego nullprofile ani gwarancji kodowania dowolnego UTF16 stringu; lone-surrogate encoder candidate pozostaje niesprawdzony. /achievement jest deferred Web3, bez aktywacji lub nowego livebug claim. Brak globalnego XSS/security/Auth/RLS/staging/CI/fresh-checkout/production PASS. Root wykonał bramki; reviewer nie uruchamiał runtime. Szczegóły i SHA256: [data-review.json](../../../evidence/cycle-43/data-review.json).
