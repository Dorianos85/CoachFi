# Niezależna recenzja P0 API

14.10.2026, lokalny checkout `codex/p0-security-consent-export`, bazowy SHA `86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b`. Recenzent: `ux_audit`, autor API: `architecture_audit`. Zakres: chat/TTS/mila-token, odroczone leaderboard/mint/certificates/vault, wspólne zabezpieczenia API i testy. Nie zatwierdzam własnego scope/UI/hygiene. Bez realnych kluczy, CDP, Supabase, RPC, provider calls lub zmian produkcji.

**Wynik: przyjęcie ograniczonej lokalnej implementacji blokad P0 API. Wydanie produktu nadal NO-GO.** To odbiór statycznego wyłączenia zewnętrznych operacji i lokalnych zabezpieczeń, bez zgody na aktywną Milę, głos, ranking lub Web3.

## Finding znaleziony i naprawiony podczas recenzji

API-R01, P1: pierwsza wersja `denyExternalAiUnlessReady` wywoływała `authenticateApiUser` przed stałą odmową 503. Przy skonfigurowanym CDP syntaktyczny forged JWT mógł wywołać `validateAccessToken` u dostawcy, mimo wyłączonej funkcji. To potwierdzona ścieżka kodu do zewnętrznej walidacji i prawdopodobna powierzchnia kosztów/limitów, bez rzeczywistego wywołania podczas audytu. Koordynator niezależnie wskazał ten przypadek; recenzent prześledził kod i zgłosił autorowi.

Autor przeniósł stały hard-off przed auth/SDK oraz odroczył import CDP do samodzielnego helpera weryfikacji. Końcowy policy sprawdza wyłącznie lokalny origin i rzuca `503 EXTERNAL_AI_DISABLED`; token, deklaracja zgody, env flags/capy lub skonfigurowany provider nie uruchamiają SDK. Przyszły adapter wymaga nowego kodu i odbioru.

Osobny reviewer test `tests/p0-api-independent-review.test.ts` podaje każdemu z trzech endpointów syntaktyczny forged token i mock skonfigurowanego weryfikatora. Oczekuje 503 oraz zera `cdpAuthConfigured`, `verifyCdpUser` i outbound fetch. PASS 3/3. Nie zmieniono kodu API przez recenzenta.

## Potwierdzone zachowanie

| Obszar | Dowód i wniosek |
|---|---|
| Local chat | Publiczny lokalny tekst PL/EN bez SDK, użycia historii lub stored identity. Jawne nagłówki local/predefined/external-disabled. Identity/consent headers nie podnoszą trybu. |
| External chat/TTS/token | Statyczne 503 po lokalnych kontrolach; brak adapterów Anthropic/OpenRouter/ElevenLabs, brak signedUrl/agentId. Stary GET token zwraca 405. |
| Odroczone API | Wszystkie sześć metod leaderboard/certificates/vault/mint zwraca 404 przed auth/store/RPC. Sama przyszła zmiana feature flag daje 503 FEATURE_NOT_READY i nie przywraca starych handlerów. |
| Body | Liczenie rzeczywistych UTF-8 byteLength, exact boundary, spoof Content-Length, split Unicode, anulowanie overflow/decode error i zachowanie pierwotnego błędu mimo failure cancel. |
| Origin | Pełny origin URL wraz ze schematem/portem, odrzucenie cross-site, brak zaufania do host/forwarded-host. Originless request nie jest identity; włączone auth ścieżki wymagają tokenu. |
| Auth helper | Identity wyłącznie z istniejącego weryfikatora CDP, malformed/invalid tokens/config unavailability obsłużone bez ujawniania SDK danych. Testy są mockowane; nie potwierdzają rzeczywistego logowania. |
| Consent helper | Ścisłe booleans/current version/datę sprawdza osobny helper; nagłówek nie stanowi zgody. Klientowy rekord nadal jest wyłącznie deklaracją, bez autorytatywnego rejestru/revocation ledger. |
| Limiter | Map jawnie opisana jako lokalne odciążenie procesu. IP spoof nie tworzy nowego bucket. Nie jest budżetem ani trwałym per-user/global limitem; hard-off niezależny. |

## Retest i fingerprint

Końcowe niezależne uruchomienie: `node node_modules/vitest/vitest.mjs run lib/api-security.test.ts lib/server/api-access-scope.test.ts tests/p0-api-access.test.ts tests/p0-api-independent-review.test.ts`: **PASS 4 suites / 49 tests**, 14.10.2026, timestamp runner 12:08. Składa się z 46 testów autora i 3 testów recenzenta. Uruchomiono z autoryzowaną eskalacją z powodu wcześniej potwierdzonego EPERM cache Windows. Wszystkie route tests mają zakaz outbound fetch; SDK zastąpiono mockiem.

Fingerprint SHA256 odebranych krytycznych plików:

- `lib/server/api-access-policy.ts`: `aa03e3df86b2e606eb4d1a0cab072de3a355173f7b938c51ca2b56c7d834e00b`
- `lib/api-security.ts`: `46abf280a693be37f3faa6e7e84400924b5637e6ac837a9c21fa7c3cc0817b63`
- reviewer test: `4878d67db0ca91c29ed2e4b4fe4c5feeb9a22a3f9368afe763393d2b7a400704`

Starsze testy aktywnego TTS wymagały osobnej aktualizacji kontraktu. Koordynator wykonał późniejszy zbiorczy retest 145/145 PASS i E2E 9/9 PASS, opisane w [raporcie pakietu](REPORT.md). Nie przedstawiam własnego targeted 49 jako pełnego testu aplikacji. [Raport autora](api-implementation.md) opisuje finalny kontrakt hard-off.

## Granice odbioru

Autorytatywne zgody, trwałe atomowe capy/koszty, kontrola czasu sesji, idempotency, konta i cross-user staging, timeouty providerów, faktyczne env/secrets, DB/RLS oraz historyczna ekspozycja profili pozostają poza tym odbiorem. Aktywne zewnętrzne AI/głos nadal mają blokadę. Nie testowano produkcyjnego exploitu lub kosztów. Lokalne UI/eksport i pakiety mają osobnych autorów oraz recenzje. Produkcja pozostaje bez zmian do osobno autoryzowanej publikacji.
