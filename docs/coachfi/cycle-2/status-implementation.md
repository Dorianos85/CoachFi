# Cykl2 — lokalny status zamiast zewnętrznych probes

2026-10-14. Autor: architecture_audit, niezależny recenzent: ux_audit. Lokalna gałąź `codex/p0-security-consent-export`, bez push/deploy. Wyłączny rozszerzony zakres od koordynatora: `app/api/status/route.ts`, `tests/cycle-2-status.test.ts` i ten raport. Nie uruchamiano rzeczywistej poprzedniej trasy ani konfiguracji dostawców.

## Finding STATUS-C2-01

GET `/api/status` anonimowo wywoływał `resolveMilaVoice()`. Przy konfiguracji voice mogło to wysłać zapytania do ElevenLabs mimo hard-off głównych endpointów. Przy skonfigurowanym mint keypair odczytywał keypair, ustanawiał Connection i wykonywał RPC getBalance. JSON ujawniał agent/voice/model, tabelę, RPC URL i mint authority/balance. To P0 dodatkowej ścieżki operacji/config poza lokalną polityką produktu. Konfiguracja realnego środowiska i rzeczywiste wcześniejsze wywołania są niesprawdzone; finding wynika z kodu, nie wykonanej eksploatacji.

## Zmiana

Usunięto wszystkie importy SDK, voice, secret/env helpers oraz cały keypair/RPC/probe kod. Publiczny GET zwraca200 i statyczny JSON `scope: local_release_policy`, `externalProbesPerformed: false`. Opisuje lokalny tekst chat, wyłączony external voice i odłożony leaderboard/Web3. Nie ocenia zdrowia dostawcy ani obecności kluczy. Brak agentId, voiceId, model config, table, RPC URL, mint authority/balance lub user data. `Cache-Control: no-store` i force-dynamic zapobiegają traktowaniu odpowiedzi jako utrwalonego probe wyniku.

Autoryzacja nie jest potrzebna dla stałych publicznych informacji bez operacji i sekretów. Żaden token, custom header, secret lub magic env nie włącza probes. Status nie importuje nawet niewywołanego SDK. Ewentualna przyszła diagnostyka infrastruktury wymaga odrębnego prywatnego, recenzowanego zakresu i budżetu; ten handler nie ma adaptera do jej uruchomienia.

## Retest

`node node_modules/vitest/vitest.mjs run tests/cycle-2-status.test.ts`: **3/3 PASS**, 2026-10-14 13:35:12 według runnera, Vitest4.1.11. Syntetyczne fake secret/agent/RPC/keypair wartości, bez realnych credentials. Mock factories i calls dla voice/agent/env/Solana/CDP oraz global fetch muszą mieć0 wywołań.

Sprawdzone: anonimowy200 z lokalnym zakresem i no-store; syntetyczna configured konfiguracja nie włącza operacji i nie wycieka do odpowiedzi; nowe imports i wielokrotne requesty zwracają tę samą lokalną politykę. Factory assertions wykrywają także import/inicjalizację starego SDK bez fetch.

ux_audit niezależnie powtórzył status3/3 PASS i odczytał brak imports/probes. Własny wynik autora nie zastępuje jego oddzielnej opinii. Zbiorczy build/typecheck oraz przegląd runtime należy do root; publiczna beta nadal ma poprzedni kod, bo brak deployu. Nie wykonano prawdziwego provider/RPC probe.

SHA256 route: `B8B9B584A33165A778FC0162A86ABF14059B9EFEA8502E6F295F1F505D2B182C`; test: `10167F645EB3DEA22E22B73EC43A994BA4365C357106339D8A7E23DFD0C5EF1B`.
