# P0 — serwerowe blokady API

14 października 2026, Europe/Warsaw. Autor: architecture_audit, role 2/12/14/16 w ograniczonym zakresie API. Niezależny recenzent: ux_audit. Gałąź: `codex/p0-security-consent-export`. Bazowy commit: `86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b`. Stan: lokalne zmiany do review; brak push/deploy, zmian bazy lub wywołań dostawców.

## Problem i rezultat

Kosztowne endpointy mogły przyjmować deklarowany nagłówek zgody bez zweryfikowanej tożsamości, wydawać signed URL i wykonywać wywołania AI/głosu bez trwałego globalnego budżetu. Ranking przyjmował nazwy i wyniki od klienta; Web3 pozostawał dostępny poza aktualnym zakresem produktu.

Zewnętrzne adaptery Anthropic/OpenRouter/ElevenLabs usunięto z obsługi chat/TTS/mila-token. W P0 żadna zmienna środowiskowa ani obecność klucza nie włącza tych wywołań. Wszystkie poprawne lokalnie próby kończą się `503 EXTERNAL_AI_DISABLED` **przed zewnętrzną weryfikacją CDP, odczytem tożsamości i oceną zgody**. Przyczyny blokady: brak zatwierdzonego budżetu, trwałych atomowych limitów oraz autorytatywnego rejestru zgód/wycofania. Nie przedstawiamy deklaracji klienta jako takiego rejestru.

Publiczny chat pozostaje użyteczny w trybie lokalnym: PL/EN, odpowiedź tekstowa na temat przepływów, oszczędzania lub inflacji. Nie wywołuje AI, weryfikatora tożsamości ani bazy, nie wykorzystuje historii rozmowy i nie loguje jej treści. Rozróżnienie local/external jest jawne w protokole.

## Kontrakt klienta

| Akcja | Żądanie | Wynik P0 |
|---|---|---|
| Lokalny chat | POST `/api/chat`, `{message, locale, mode:'local'}`; brak mode również oznacza local | 200 text/plain, `X-CoachFI-Provider: local`, `X-CoachFI-External-AI: disabled` |
| Próba zewnętrznego chat | POST `/api/chat`, `{message, locale, mode:'external', consent}`; przyszły kontrakt zawiera Bearer CDP | 503 dla każdego tokenu lub jego braku przed CDP; brak provider calls |
| Read-aloud | POST `/api/tts`, `{text, locale, consent}`; przyszły kontrakt zawiera Bearer CDP i optional.voice | 503 przed CDP; brak audio/provider call |
| Rozmowa głosowa | POST `/api/mila-token`, `{consent}`; przyszły kontrakt zawiera Bearer CDP oraz optional.aiCoach/voice | 503 przed CDP; brak signedUrl/agentId/widgetConfig |
| Stare pobieranie tokenu | GET `/api/mila-token` | 405, Allow POST; brak danych dostawcy |
| Ranking / Web3 | GET/POST leaderboard i certificates, POST mint-nft, GET vault | 404 FEATURE_DISABLED przed auth/DB/RPC; przyszły sam feature flag nie przywraca starych handlerów, zwraca 503 FEATURE_NOT_READY |

Osobno przetestowany kontrakt przyszłego adaptera: `consent` to pełny rekord z `CONSENT_VERSION` wspólnym z klientem, terms/privacy true, datą i czterema opcjami typu boolean. Wymagana opcja musi być dokładnie true; string, brak pola, stara wersja lub wycofanie jest odrzucane przez helper. `X-CoachFI-Consent`, `X-User-Id` i podobne nagłówki nie przyznają uprawnień. Weryfikator helpera używa wyłącznie wyniku `verifyCdpUser(accessToken)`, ładuje SDK dopiero przy jawnym użyciu i nie ujawnia/loguje błędów SDK lub tokenów. W P0 endpointy nie uruchamiają tych helperów: stała blokada jest wcześniejsza i nie daje operacji żadnej tożsamości.

Uzgodniono z curriculum_pilot helper klienta `getApiCredentials(requiredKeys, signal)` i rejestrację istniejącego CDP token getter przez `AccountSync` wewnątrz Provider (bridge należy do koordynatora). Klient ma wyświetlić spokojny komunikat po 503, pozostać przy tekście i lekcjach, anulować żądania/playback przy wycofaniu oraz nie inicjować widgetu z publicznym agentId po odmowie serwera. Nie edytowano tych plików klienta w tym zadaniu.

## Pozostałe zabezpieczenia

- `readJsonWithLimit` czyta strumień, liczy `Uint8Array.byteLength`, zatrzymuje i anuluje odczyt po limicie, dekoduje UTF-8 ze sprawdzaniem poprawności. Nie ufa Content-Length mniejszemu niż rzeczywisty strumień. Helper dotyczy również istniejącego `/api/account`; nie edytowano jego handlera.
- Origin porównuje się z pełnym origin `request.url`, łącznie ze schematem i portem. Host/forwarded-host nie ustanawiają origin. Cross-site fetch jest odrzucany. Brak Origin nie jest dowodem tożsamości; ścieżki chronione nadal wymagają Bearer.
- Istniejąca Map służy wyłącznie lokalnemu odciążeniu procesu, bez identyfikacji po spoofowalnym IP. Nie jest trwałym per-user/global limiterem ani kontrolą wydatków. Kosztowne operacje są blokowane niezależnie od Map.
- Wspólny `isFeatureEnabled` od ux_audit wyznacza zakres adult release. Usunięto z odłożonych endpointów SDK/DB/provider/RPC oraz możliwość upsertu wyniku po nazwie.

## Testy i dowody

Wykonano lokalnie 46 nowych testów w `lib/api-security.test.ts`, `lib/server/api-access-scope.test.ts` i `tests/p0-api-access.test.ts`, PASS 46/46 po poprawce z review. Route-testy wymagają zera wywołań CDP i fetch; osobne testy helpera CDP używają wyłącznie mocka. Nie używano rzeczywistych kluczy. Dwa testy potwierdzają, że przyszły feature flag sam nie przywraca odłożonego API; osobny test sprawdza zachowanie pierwotnego błędu overflow nawet przy awarii anulowania strumienia.

Zakres: canonical origin i spoofed host/IP; Unicode liczony w bajtach, granica exact/overflow, split multibyte, anulowanie strumienia, niepoprawne UTF-8/JSON; anonimowość i fałszywy identyfikator; malformed/invalid Bearer; brak konfiguracji weryfikatora; literal header bez rekordu; stara/wycofana/string zgoda; wszystkie kosztowne próby mimo syntetycznych kluczy/flag/capów; niezależnie załadowane instancje fail-closed policy; brak URL ze starego GET; lokalny chat; sześć metod odłożonych endpointów bez auth/provider calls.

Pierwsze uruchomienie Vitest w sandboxie wykonało 0 testów z powodu EPERM rename cache. Autoryzowane ponowienie poza sandboxem: 2 suity, 40 testów, PASS; po testach scope/anulowania 43, a po retest znalezionej kolejności CDP/hard-off: 3 suity, 46 testów PASS. To ograniczenie środowiska zapisano zamiast zaliczenia próby. TypeScript `tsc --noEmit`: PASS po poprawieniu lokalnego zawężenia typu optional. Nie wykonywano cloud E2E lub testu kosztów dostawców.

Odtworzenie w checkoutcie: `node node_modules/vitest/vitest.mjs run lib/api-security.test.ts lib/server/api-access-scope.test.ts tests/p0-api-access.test.ts` oraz `node node_modules/typescript/bin/tsc --noEmit`. Na tym Windowsie cache Vitest może wymagać autoryzowanego uruchomienia poza sandboxem. Pełne testy integracji, build i niezależną opinię zapisuje koordynator/recenzent osobno.

## Granice i przyjęcie

Kryteria P0: brak ścieżki wywołania AI/głosu lub RPC/rankingu poza scope, brak zewnętrznej weryfikacji tożsamości przy stałym hard-off, brak autoryzacji na podstawie client identityheader, poprawny limit bajtów, kontrola origin, wszystkie nowe testy PASS oraz niezależne review. To nie deklaracja gotowości aktywnej zewnętrznej Mili ani pełnego produktu.

Przyszłe włączenie wymaga nowego, recenzowanego kodu: autorytatywny rejestr zgód i wycofania, atomowy trwały per-user/global limiter, zatwierdzone capy/kwoty i rezerwacja maksymalnego kosztu przed wywołaniem, metering długości sesji ConvAI, timeout/retry z ograniczeniem, alerty i kontrolowany test wielu instancji. Nie wolno zastąpić tego magiczną flagą env, klientową quota, zaproszeniem lub Map. Nie dodano vendora ani migracji.

Bez push/deploy ta poprawka nie zmienia aktualnej produkcji. Przy dalszej integracji zachować blokadę zewnętrznych operacji; nie przywracać starych kosztownych handlerów jako sposobu obejścia błędu. Stan konta/sync, pełny eksport/delecja, stare klientowe SDK i sekrety/historyczna ekspozycja repo mają oddzielnych właścicieli.

Nie zmieniono ustawień samego agenta ElevenLabs. Jeśli dostawca udostępnia go jako publiczny, lokalna blokada naszych endpointów nie ustanawia prywatności u dostawcy ani nie unieważnia wcześniej wydanych URL. Kontrola ustawień agenta, ważności istniejących uprawnień i starych otwartych kart pozostaje odrębnym wymaganiem przed wydaniem, bez założenia, że taka konfiguracja została sprawdzona w tym zadaniu.

## Historyczne testy i końcowa niezależna opinia

Koordynator przekazał do wyłącznej aktualizacji `lib/server/mila-voice.test.ts`: trzy historyczne testy aktywnego TTS zastąpiono regresją obecnego hard-off 503, bez skipów. Testy zawierają skonfigurowane syntetyczne klucze/pinned voice, client override, literal consentheader, forged Bearer i env/cap próby; wymagają zera provider fetch oraz importu/inicjalizacji/weryfikacji CDP. Pozostałe dziesięć testów nieaktywnego adaptera zachowano. Celowany run 2026-10-14 12:16:50: 13/13 tej suity PASS (w łącznym run56 z testami klienta i jego recenzenta).

ux_audit zgłosił niezależny finalny retest: cztery suity, 49/49 PASS (46 autora + trzy osobne tests/p0-api-independent-review.test.ts), werdykt ACCEPT do lokalnej integracji bounded P0 API. Opinia jest w `docs/coachfi/p0/api-review.md`. To odrębne od własnego run autora; wydanie nadal wymaga zbiorczych bramek koordynatora i nie zmienia produkcji. `tsc --noEmit --incremental false` przeszedł po przejściowym TS6053 podczas regeneracji cache przez dev server; później nie ponawiano tsc równolegle.

## Poprawka po niezależnej recenzji

ux_audit wskazał kolejność blokady: początkowa wersja wykonywała `verifyCdpUser` przed stałym 503, otwierając niepotrzebne wywołanie zewnętrznego weryfikatora dla syntaktycznie poprawnego forged JWT. Poprawiono tak, aby hard-off nastąpił przed importem/inicjalizacją SDK, auth i zgodą. Helper tożsamości/zgody pozostał samodzielnym kontraktem do przyszłego adaptera, bez uprawnień w aktualnych endpointach. Finalne testy wymagają zera wywołań weryfikatora dla wszystkich kosztownych ścieżek i tokenów (brak, malformed, forged), także dla poprawnych syntetycznych danych. PASS 46/46.
