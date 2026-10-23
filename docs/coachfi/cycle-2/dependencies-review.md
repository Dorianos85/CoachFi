# Cykl 2 — niezależna recenzja dependency fixes

14.10.2026, lokalny checkout `codex/p0-security-consent-export`, bazowy SHA `86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b` z wcześniej przyjętymi staged poprawkami [P0](../p0/REPORT.md). Autor package/lock/status: `architecture_audit`; recenzent: `ux_audit`. **Limited ACCEPT lokalnego kodu/statusu i ograniczonych dependency fixes, z końcowymi kontrolami opisanymi w integracji. Produkcyjny release nadal NO-GO.** Recenzent nie zmienił manifestu/lock/API.

## Plan i niezależne kryteria

Usunąć cztery nieużywane bezpośrednie wallet adapter dependencies po potwierdzeniu braku JS imports. Jedyny odczytany aktywny import w UI jest CSS w globals.css; jego usunięcie ma własnego właściciela. Web3/Metaplex nadal występują w kodzie, dlatego nie założono, że całe drzewo można usunąć.

`tests/cycle2-dependencies-review.test.mjs` ma sprawdzać metadata manifestu, lock i zainstalowanego drzewa po zakończeniu install. Bez network, credential files, profili lub inicjalizacji dostawców. Kryteria pochodzą z oficjalnych advisory, nie z samego rezultatu npm audit:

- Każda instancja ws ma patch odpowiadający swojemu major; nie globalny upgrade wszystkich konsumentów7→8. [GHSA-96hv-2xvq-fx4p](https://github.com/websockets/ws/security/advisories/GHSA-96hv-2xvq-fx4p) podaje poprawki7.5.11 i8.21.0 (także5.2.5/6.2.4 dla starszych linii). [GHSA-58qx-3vcg-4xpx](https://github.com/websockets/ws/security/advisories/GHSA-58qx-3vcg-4xpx) dotyczy ujawnienia nieinicjalizowanej pamięci w starszym ws8. Fix8.21+ obejmuje tę wcześniejszą poprawkę.
- Każda instancja Browserslist pozostaje major4 i jest co najmniej4.28.7: [GHSA-c83g-rgw3-j3cx](https://github.com/browserslist/browserslist/security/advisories/GHSA-c83g-rgw3-j3cx) oraz [GHSA-73wf-gq98-2v4g](https://github.com/browserslist/browserslist/security/advisories/GHSA-73wf-gq98-2v4g). Sprawdzić spójność installed metadata/lock, nie tylko root declaration.
- Retired adaptery nie występują w root dependencies/dev/optional ani lock root; brak pozostawionego CSS importu.
- Utrzymać poprawki wcześniejszego P0: Next15.5.27+, shell-quote1.11+ albo usunięcie konsumenta, PostCSS8.5.30+, Sharp0.35.5+; zgodność manifest/lock i brak framework major upgrade. Końcowy runtime floor po findingu recenzenta opisano poniżej.

Źródła maintainerów sprawdzono14.10.2026. Testów nie uruchamiano podczas instalacji; po sygnale autora INSTALL READY odczytano finalne metadata i wykonano poniższe testy. Nie uruchamiano równolegle dev/browser/build.

## Finalny odczyt i finding

Potwierdzono scoped `ws@7:7.5.11`, `ws@8:8.22.0`, Browserslist4.28.7, Baseline Browser Mapping2.11.0 i spójną rodzinę Vitest/@vitest4.1.11. Baseline fix wynika z [GHSA-w5vr-8v7q-w6rv](https://github.com/advisories/GHSA-w5vr-8v7q-w6rv), Vitest/mocker z [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9). Lock i installed package metadata są zgodne. Cztery wallet adapter declarations/CSS usunięto; RN/Metro/image-size i shell-quote nie mają już instancji po usunięciu konsumenta. Web3/Metaplex/CDP pozostały.

DEP-C2-01, P2, **closed**: manifest >=20.9 pozwalał na Node niespełniający wymagań Vite/Rolldown i Vitest. Odczytano engines Vite8.3.4/Rolldown1.2.14: ^20.19.0 lub >=22.12.0, Vitest4.1.11: ^20 lub ^22 lub >=24. Autor po uwadze recenzenta poprawił manifest i lock root na przecięcie `^20.19.0 || ^22.12.0 || >=24.0.0`. Niezależny test potwierdza supported20.19/22.12/24 oraz rejection20.9/20.18/21/22.11/23. Lokalny Node24.19 spełnia zakres. Nie potwierdza to runtime hostingu.

Refresh obejmuje także Vite8.0.16→8.3.4, Rolldown1.0.3→1.2.14, LightningCSS1.32→1.33 oraz inne zgodne wersje dev/optional bindings, jawnie wykazane w [raporcie autora](dependencies-implementation.md) i comparison JSON. Recenzja nie przedstawia lock diff jako samych ws/Browserslist pins. Lokalne test/build opisano w integracji; staging regression na platformie docelowej pozostaje niesprawdzone.

Własny retest `node --test tests/cycle2-dependencies-review.test.mjs`: **6/6 PASS**, po poprawce engines. Początkowy 4/5 miał błędne oczekiwanie recenzenta, że shell-quote musi nadal istnieć. Metadata odczyt potwierdził usunięcie całej gałęzi; skorygowano test na patched-or-absent, bez przywracania zbędnego pakietu. Następnie 5/5 oraz końcowe6/6 PASS. To korekta testu recenzenta, nie błąd implementacji autora.

## Raw audit i residuals

Samodzielnie odczytano [before](../../../evidence/cycle-2/npm-audit-before.json), [after](../../../evidence/cycle-2/npm-audit-after.json) i [production-after](../../../evidence/cycle-2/npm-audit-production-after.json). Pełny aktualny audit:42 entries(19high/23moderate/0critical)→18(5high/13moderate/0critical). Różnica nazw:24 usunięte,0 dodanych. `--omit=dev`:12moderate/0high/0critical. P0 historyczne36 było innym pomiarem; nie zastępuje świeżego before42. Liczniki entries nie są liczbą niezależnych exploitów.

- Residual5high: braces/chokidar/fast-glob/micromatch/tailwindcss, build/dev rodzina [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Advisory nie podaje patcha dla braces3.0.3. Nie dodano blind Tailwind major upgrade. To realna powierzchnia narzędzi/CI, bez dowodu exploitu lub całkowitej runtime nieosiągalności.
- Residual12moderate w produkcyjnym drzewie propaguje jayson→stream-json/uuid przez Solana/CDP/UMI. Stream-json1.9.1 ma [nested filter DoS](https://github.com/advisories/GHSA-528h-pc64-c93x), [JSONC re-scan](https://github.com/advisories/GHSA-hqr4-qq8f-hg3x) i [Assembler prototype write](https://github.com/advisories/GHSA-mjw6-4jj6-33hc). [UUID advisory](https://github.com/uuidjs/uuid/security/advisories/GHSA-w5hq-g745-h8pq) dotyczy v3/v5/v6 z nieprawidłowym caller buffer/offset; nie samego każdego użycia v4.
- Brak direct application imports podatnych funkcji lub offscope Web3 nie dowodzi, że aktualny CDP SDK nigdy ich nie używa. Nie zaakceptowano proponowanego przez audit downgrade CDP do0.0.36; kontrakt auth wymaga własnego review. Wykorzystanie funkcji SDK i docelowego artefaktu pozostaje niesprawdzone.
- Dodatkowy moderate pełnego audytu postcss-selector-parser6.1.2 w Tailwind pozostawiono; major7 override bez oceny konsumentów nie należy do tego odbioru.

## Dodatkowy status endpoint

Rozszerzony zakres od koordynatora potwierdzony w [current-cycle](../current-cycle.md). Poprzedni status mógł anonimowo wykonać voice configuration lookup i mint getBalanceRPC mimo zamkniętych głównych endpoints — ustalenie kodowe autora, bez realnego wywołania. Recenzent odczytał finalny handler: brak imports, env/config/keypair/RPC/auth, statyczne publiczne `scope:local_release_policy`, `externalProbesPerformed:false`, no-store i force-dynamic. Nie przedstawia go jako provider health probe.

Niezależny retest autora `tests/cycle-2-status.test.ts`: **3/3 PASS** na Vitest4.1.11. Mock factories wykrywają nawet import/inicjalizację providerów; fetch/config/CDP/RPC muszą mieć0 calls. Fake configured secrets nie wywołują działań ani nie pojawiają się w odpowiedzi. [Raport statusu](status-implementation.md). STATUS-C2-01 przyjęty lokalnie; produkcyjny endpoint nadal wcześniejszy do autoryzowanego deployu.

Fingerprint SHA256: package `bc94bb86fe2ba2ddf90039b08683145279e31d8925623e577d6c481856c8ef8a`; lock `d810ad909d72a02a6bdb06d12e15f250256ac54f138a8aba919e5681ac6fc5f5`; status `b8b9b584a33165a778fc0162a86abf14059b9efea8502e6f295f1f505d2b182c`. B10 pozostaje częściowo otwarte. Końcowa integracja ma powiązać te wersje z test/build koordynatora.

## Zakres późniejszego odbioru

Należy odczytać finalne overrides, dependency resolution/constraints, raw audit i diff wyłącznie wybranych package/config files. Pozostałe wpisy oddzielić od zamkniętych, z reachability i właścicielem, bez utożsamiania affected entries z liczbą exploitów. Metaplex/CDP mogą zachować dependencies mimo odłączenia wallet UI; feature flags same nie zamykają advisory lub kosztów endpointów poza zakresem.

Targeted source/metadata/status odbiór: limited ACCEPT z powyższymi residuals. Koordynator przekazał20/20 E2E,313/313 Vitest,11/11 Node i build34/34 PASS; standardowy typecheck przeszedł po korektach typów w samych testach. Recenzent wykonał także `tsc --noEmit --incremental false` z exit0. Dokładna kolejność, późniejsze retesty106/106 i9/9 oraz dowody są w [integration-review](integration-review.md). Wyniki nie zamykają publicznej historii/profili, docelowego runtime/staging lub gotowości produkcyjnej. Bez push/deploy/real providers.
