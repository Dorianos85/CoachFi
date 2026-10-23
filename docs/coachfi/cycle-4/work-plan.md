# Cykl 4 — B14: własność danych lokalnych

14.10.2026. Autoryzowany heartbeat; lokalna gałąź `codex/p0-security-consent-export`, wcześniejsze paczki zachowane. Dorośli, Polska, PL/EN. Bez commit/push/deploy, realnych sesji/profili/sekretów, migracji produkcyjnych, provider calls i nowych kategorii danych. Nie włączać health upload ani zewnętrznych AI.

## Potwierdzony problem i kontrakt

Niezależne syntetyczne baseline reprodukcje potwierdziły nadpisywanie/usuwanie oryginalnych bajtów gościa przez account hydration/logout oraz możliwość mieszania danych konta i urządzenia w odczycie/eksporcie. PASS tych czterech reprodukcji oznacza wykazanie problemu, nie przyjęcie poprawki.

Legacy raw keys pozostają przestrzenią gościa i nie są automatycznie kopiowane do konta. Każdy znany account owner ma odrębny lokalny namespace według provider/UID/znanego klucza; active owner istnieje tylko w RAM danej karty, bez trwałego wskaźnika. Namespace jest izolacją ścieżek aplikacji, nie szyfrowaniem ani serwerową autoryzacją. Nie zmienia pól danych, dostawcy lub celu przetwarzania.

Bootstrap przy nieznanej tożsamości skonfigurowanego backendu jest pending i nie pokazuje wcześniejszych danych osobowych. Osobisty UI/context jest remountowany po zmianie rewizji właściciela, poza lifecycle SDK/account binder. Bound storage handles sprawdzają przechwyconą rewizję przy każdym odczycie/zapisie/event/sukcesie. Stary handler nie może zapisać do B lub gościa. Quota/blocked storage propagują błąd; nie ma fałszywego sukcesu.

Guest publish jest ready. Znana tożsamość account po nieudanej synchronizacji może być ready local-only z wyłączonym pusherem i wyłącznie własnym namespace; nigdy nie wraca do danych gościa lub A. Health remains local-only. Cloud-only initial hydration i absence of guest seed z B13 zostają.

Eksport używa allowlist i facad bieżącego local/session scope, bez UID/namespaced key names/tokenów/swobodnego tekstu. Usuwanie unieważnia pracę przed zmianą danych i obejmuje tylko znane personal keys bieżącego namespace; inne konta, guest przy account action, auth i global device prefs pozostają poza operacją. Zmiana właściciela podczas callbacka zatrzymuje operację bez ogłoszenia sukcesu. Pełne prawa konta/dostawców nadal nieprzetestowane.

## Własność plików i odbiór

| Autor | Wyłączna własność | Recenzent |
|---|---|---|
| architecture_audit | Adapter product-storage, auth/sync/account lifecycle, learning helper libs, challengeQuestions persistence, własne testy i stare author fixtures B13 | ux_audit + root integracja |
| curriculum_pilot | user/avatar/health/consent helper libs; osobiste contexts i health/avatar/achievement/crisis/consent/onboarding/family/Mila stale handlers; własne testy | ux_audit + root integracja |
| root | Provider/scope boundary/hook, export/delete/DataSafetyPanel, home/nav i quiz/review/challenge/lesson/progress UI handlers, rejestry i raport | ux_audit |
| ux_audit | Nowe niezależne acceptance tests, własne B13 review fixtures, privacy-review i review evidence | Autorzy naprawiają findings, root ocenia dowody |

Autor nie zatwierdza własnego kodu. Skeleton adaptera i hook są uzgodnione przed zmianami callerów. Targeted syntetyczne testy mogą działać oddzielnie; pełną suitę/typecheck/izolowane E2E/build ustala root po freeze. Z uwagi na poprzednie EINVAL/EBUSY plików generowanych w OneDrive, finalny build planowany na hash-verified TEMP snapshot z tymi samymi zależnościami, env providerów/auth puste.

Poza odbiorem: read/write przez dowolny skrypt DevTools w tym samym origin, bezpieczeństwo urządzenia, rzeczywiste dwa konta/RLS staging, trwałe offline conflict resolution, pełne at-rest szyfrowanie, prawa i retencja u operatora. Te bramki nie uzyskują PASS przez brak testu.
