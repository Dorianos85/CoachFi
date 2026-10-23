# Niezależna recenzja aktualizacji zależności i lokalnego E2E

14.10.2026, lokalna gałąź `codex/p0-security-consent-export`, bazowy SHA `86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b`. Autor manifestu/lock/test harness: koordynator. Recenzent: `ux_audit`. Bez audit fix, zmian manifestów przez recenzenta, realnych profili, providerów, push/deploy lub kontroli historii.

**Wynik: bounded dependency upgrade przyjęty do lokalnej integracji; gotowość wydania NO-GO.** Usunięto wskazane critical wpisy audytu, lecz pozostałe high i staging/runtime wymagają osobnego rozstrzygnięcia. Odbiór nie oznacza braku podatności w aplikacji.

## Wersje i constraints

| Pakiet | Odczyt manifestu / rzeczywisty lock | Ocena |
|---|---|---|
| Next | pin 15.5.27 / jedna instancja 15.5.27 | Obejmuje zgłoszone poprawki gałęzi 15; wersja 15.5.24 sama nie zamyka późniejszych advisory. [Release 15.5.27](https://github.com/vercel/next.js/releases/tag/v15.5.27) obejmuje dodatkowe poprawki metadata/cache. |
| shell-quote | override 1.12.0 / jedna instancja 1.12.0 | Poza zakresem >=1.8.4 <1.11.0 [GHSA-pqg4-j6r4-53mv](https://github.com/advisories/GHSA-pqg4-j6r4-53mv). Warunek: attacker-controlled line terminator po comment token w quote, dalej wykonanie w shell. Nie stwierdzono takiego exploitu Coachfi. |
| PostCSS | pin + override 8.5.30 / jedna instancja 8.5.30 | Spójność manifest/lock potwierdzona. Root nie zastosował niekontrolowanego audit fix. |
| Sharp | override 0.35.5 / jedna instancja 0.35.5 | Podnosi minimalny Node do >=20.9.0; jest to zmiana compatibility względem 0.34. [Oficjalny changelog](https://sharp.pixelplumbing.com/changelog/v0.35.0/) i [installation](https://sharp.pixelplumbing.com/install/) potwierdzają próg oraz platform-specific binaries. |

DEP-R01, P2, rozwiązany: Next engines nadal dopuszcza Node 18.18, a Sharp wymaga >=20.9.0. Początkowo root manifest nie określał własnego engines. Po uwadze recenzenta koordynator dodał `engines.node:>=20.9.0`; zgodność pola w manifest i lock potwierdzona. Lokalny Node 24.19.0 spełnia constraint. Nie potwierdzono ustawienia przyszłego staging/Vercel runtime ani działania natywnego Sharp na docelowej platformie.

Wcześniejsze Next critical dotyczą wersji <15.5.24: [Windows RCE](https://github.com/advisories/GHSA-p293-qw3h-jr36) oraz [AVIF image optimization RCE](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4). Pin 15.5.27 jest poza tym zakresem. Warunki exploitów w realnym wdrożeniu pozostają niezależne od obecności advisory w lock.

## Audyt i triage pozostających wpisów

[Raw audit after](../../../evidence/p0/npm-audit-after.json): 0 critical, 16 high, 20 moderate, 36 affected package entries. Poprzedni zapis: 2 critical, 20 high, 20 moderate, 42 affected entries. Są to propagowane wpisy zależności, nie liczba niezależnych exploitów. Recenzent odczytał raw counts i konkretne nodes; nie wykonywał exploitu.

| Rodzina / node | Źródło i warunek | Reachability / dalszy krok |
|---|---|---|
| `ws` 8.20.0 pod rpc-websockets; root ws7.5.10 | [GHSA-96hv-2xvq-fx4p](https://github.com/advisories/GHSA-96hv-2xvq-fx4p): tiny fragments powodują memory DoS; poprawki 8.21.0 / 7.5.11. | `npm explain` potwierdza rpc-websockets→Solana web3/CDP oraz root dependents React Native/Metro/jayson/peers. OffScope usuwa domyślny wallet provider, ale CDP służy nadal auth. Brak dowodu pełnej niedostępności w produkcji; prześledzić realne połączenia i kompatybilny upgrade/remove. Inne ws8.21/8.22 w lock są poza wskazanym zakresem. |
| `braces`3.0.3 / micromatch / Metro | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm): deeply nested attacker-controlled pattern, stack exhaustion, brak patched version w advisory. | Bez bezpośredniego importu tych parserów w przeszukanych app/components/lib/scripts; zależności chokidar/micromatch nadal istnieją. Ograniczyć źródła niezaufanych wzorców i ustalić runtime vs tooling; brak importu nie dowodzi niewykonalności. |
| Browserslist4.28.2 | [GHSA-c83g-rgw3-j3cx](https://github.com/advisories/GHSA-c83g-rgw3-j3cx): nieograniczony cache różnorodnych query/context, poprawka4.28.7. | `npm explain`: Babel helper targets i Autoprefixer. Prawdopodobnie tooling, ale zatwierdzić absence of runtime attacker-controlled queries; przygotować zgodny update. |
| image-size1.2.1 | [GHSA-5p2g-fcmc-qvqq](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq): spreparowane JXL/HEIF blokują parser; poprawka2.0.3. | `npm explain`: Metro. Brak bezpośredniego app importu. Nie utożsamiać z Next/Sharp image optimizer; ustalić czy parsing niezaufanego obrazka występuje w rzeczywistym środowisku. |
| Solana Mobile / React Native / Metro | Pozostałe wpisy raw audit propagują powyższe rodziny. | Nie deklarować całego drzewa bezpiecznego na podstawie samego feature flag. Rozważyć usunięcie nieużywanego wallet SDK w osobnym tasku po analizie CDP/peer dependencies. |

Nie rozszerzano tej recenzji do pełnego skanu repo/historii. Stan residual high oznacza brak pełnego kryterium security-release assurance, dopóki scope/reachability nie zostanie rozstrzygnięty i zatwierdzony.

## Niezależny odczyt test harness

Odczytano `tests/e2e/p0-safety.spec.ts`, `playwright.p0.config.ts`, `scripts/start-p0-test-server.mjs` oraz wybrane aktualizacje legacy fixtures/skips. Harness używa świeżego izolowanego browser context, syntetycznych nazw/token markerów, aktualnej wersji consent i age marker18. Czyści wyłącznie pamięć tego test contextu; nie używa profilu użytkownika. Context blokuje non-127.0.0.1 requests; lokalny proces zeruje znane env provider/auth i wyłącza telemetry, serwer bind 127.0.0.1:43191. Brak realnych secrets/provider calls w fixtures. Jeden worker, retries0, trace tylko po failure i ignorowany test-results.

Końcowe dziewięć testów obejmuje PL/EN required-only/age gate, download z wykluczeniem syntetycznych auth i nested fields, brak widget/chronionych requests z local guest chat, odroczone routes/API osobno PL/EN oraz syntetyczny local speech click/revoke. Odczytano finalny plik po rozszerzeniu. Chat sprawdza przyrost `initialReplyCount+1` i niepustą nową odpowiedź; poprawia wcześniejsze błędne założenie dwóch początkowych wiadomości. Voice fixture zawiera głos localService=false i true; oczekuje użycia tylko lokalnego, braku auto-play, `aria-pressed` po kliknięciu i cancellation po zmianie zgody. Jest to mock browser engine, nie test prawdziwych głosów urządzenia. Koordynator zgłosił finalny pełny run **9/9 PASS w 46,8 s**; zapis w [REPORT](REPORT.md). Recenzent odczytał implementację testów, nie powtarzał całego browser run.

Legacy testy aktywnych Kids/widget/TTS mają jawne skip i odniesienie do testów zastępujących. Brak public config auth oznacza jawny auth skip. Nie uruchomiono całej legacy E2E, dlatego nie wolno ogłosić jej pełnego PASS. P0 suite default obejmuje Desktop Chrome; dodatkowy CUA test390×844 potwierdził dialog/focus/stopkę PL/EN, lecz nie zastępuje pełnego mobile E2E.

## Fingerprint i granice

SHA256 manifestu po engines/scripts: `57797fc0fe2bb721eb10c4dbcc18e452c8b439edddddffa06a1a4c010941550e`; lock: `99c77e07330137d1df9e5fac75d018701d8d06441fa86a5eededf094af37c7d4`. Końcowy odczyt potwierdził brak zmiany obu fingerprintów. Koordynator zapisał w [REPORT](REPORT.md) Vitest 145/145, Node fixture 5/5, P0 E2E 9/9, build 35/35 i typecheck PASS; syntetyczny native Sharp PNG2×2/Node 24 PASS. Nie oznaczam tych przebiegów jako własnego execution recenzenta. Docelowe platform/runtime wymagają nadal staging regression. Kolejne zmiany manifestu wymagają ponownej kontroli tej ograniczonej recenzji. Reviewer nie zatwierdza publikacji, incydentu profili, produkcyjnych konfiguracji ani aktywnych usług.
