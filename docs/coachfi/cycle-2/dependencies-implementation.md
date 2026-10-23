# Cykl2 B10 — ograniczone poprawki zależności

2026-10-14, lokalny checkout `source/CoachFi`, `codex/p0-security-consent-export`, bazowy SHA `86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b` oraz zachowany staged pakiet P0. Autor: architecture_audit; niezależny recenzent: ux_audit. Zakres autoryzowany przez koordynatora: manifest/lock, ten raport i `evidence/cycle-2/npm-audit*.json`. Nie resetowano indeksu P0, nie wykonywano push/deploy, migracji ani wywołań dostawców aplikacji.

Rezultat: aktualny pełny audyt **42→18 wpisów**, high **19→5**, moderate **23→13**, critical **0→0**. Audyt `--omit=dev` po zmianie: **12 moderate, 0 high, 0 critical**. Usunięto24 nazw pakietów z listy audytu, bez nowych. To liczniki pakietów i propagowanych zależności; nie oznaczają24 niezależnych exploitów ani dowodu braku osiągalnych błędów. B10 pozostaje częściowo otwarte.

## Zmiana i zgodność

| Zależność | Przed | Po / powód |
|---|---|---|
| ws7 | 7.5.10 | Scoped override `ws@7`:7.5.11; zachowany major7. |
| ws8 | 8.20.0, 8.21.0, 8.22.0 | Scoped override `ws@8`:8.22.0; zachowany major8, bez cofnięcia istniejącej8.22. |
| browserslist | 4.28.2 | 4.28.7 override, poprawki obu aktualnych high GHSA. |
| baseline-browser-mapping | 2.10.28 | 2.11.0 override, kompatybilny zakres nowego Browserslist, poprawka moderate DoS. |
| Vitest i rodzina | 4.1.8 | Dokładny dev pin4.1.11, mocker i pozostałe @vitest4.1.11, bez niezależnego override mocker. |
| Cztery wallet adapters | base/phantom/react/react-ui | Usunięte direct declarations po dowodzie braku JS imports i akceptacji koordynatora; root usunął jedyny import ich CSS. |
| Node engines | >=20.9.0 | ^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0, przecięcie wsparcia Vite/Rolldown/Vitest. Lokalny Node24.19.0. |

Zachowano Next15.5.27, shell-quote1.12.0 override, PostCSS8.5.30 i Sharp0.35.5 z P0. Shell-quote nie ma już instancji w lock po usunięciu konsumenta React Native; jego pozostawiony override nie wprowadza pakietu. Nie użyto `npm audit fix`, force, downgrade CDP ani blind major override image-size.

Na polecenie koordynatora dodano wyłącznie skrypt `e2e:cycle2 = playwright test --config playwright.cycle2.config.ts`; konfigurację i przeglądarkowe testy tworzy root. Skrypt nie wymaga nowych zależności. Ten raport nie zalicza E2E przed wynikiem koordynatora.

Npm przy zmianie Vitest odświeżył także pasujące do jego zakresów narzędzia dev: Vite8.0.16→8.3.4, Rolldown1.0.3→1.2.14, LightningCSS1.32→1.33, Chai6.2.2→6.3.0 i TinyRainbow3.1→3.2.0, dane przeglądarek oraz optional platform bindings. W lock zmieniło się48 istniejących wpisów wersji; npm raportuje25 fizycznie zmienionych pakietów lokalnej platformy. Pełna lista jest w porównaniu JSON. Zgodność wynika z zadeklarowanych zakresów i lokalnego retestu; pełny build/test należy do root. Nie przedstawiono tych zmian jako wyłącznie dwóch security pins.

## Dowód usunięcia nieużywanej gałęzi

Przed zmianą: `rg -n --fixed-strings '@solana/wallet-adapter' app components context lib data scripts admin tests` dawało tylko `app/globals.css:1`, import styles.css. Osobny taki odczyt `next.config.mjs`, dwóch Playwright config, PostCSS, Tailwind i Vitest config nie dawał referencji. Po usunięciu CSS przez root nie ma referencji w tym zakresie. Nie usuwano innych plików aplikacji ani bibliotek.

Zachowano @solana/web3.js i Metaplex/UMI: web3 jest potrzebne w `scripts/check-api-config.mjs`, a `lib/certificate-chain.ts` zachowuje importy Metaplex. Kodowy odczyt ujawnił dodatkowy niezabezpieczony GET `/api/status` z voice config i RPC probes; koordynator przydzielił oddzielną poprawkę autora. Raport trasy jest w `docs/coachfi/cycle-2/status-implementation.md`. Żadnych probes nie uruchamiano podczas wykrywania.

Po install `npm ls` potwierdza brak wallet adapter/RN/Metro/image-size w drzewie. To usunięcie konsumenta image-size1.2.1; nie wymuszono niezgodnej2.x. Braces nadal istnieje w niezależnej gałęzi Tailwinda, więc jego finding nie jest zamknięty samym usunięciem Metro.

## Pozostałe ustalenia i osiągalność

| Pozostałość | Stan / dalsze wymaganie |
|---|---|
| 5 high: braces, chokidar, micromatch, fast-glob, tailwindcss | Jedna rodzina pierwotnego błędu i propagacje, tylko w audycie pełnym. Braces3.0.3 nadal latest, oficjalne advisory nie podaje patched wersji. Wykryte użycie to narzędzia Tailwind build/dev. Nie wykonano exploita i nie udowodniono ogólnej runtime nieosiągalności. Potrzebny upstream patch lub odrębna recenzowana migracja narzędzi oraz kontrola niezaufanych wzorców w CI. |
| 12 moderate w omit=dev | CDP core/hooks/react, web3.js, pięć UMI pakietów oraz jayson/stream-json/uuid. Wiele wpisów propaguje błędy stream-json1.9.1 i uuid8.3.2. CDP jest używane przez logowanie; część Web3 jest odłożona. Nie deklaruje się nieosiągalności wszystkich ścieżek SDK. |
| 1 dodatkowy moderate pełnego audytu | postcss-selector-parser6.1.2 w Tailwind/postcss-nested. Naprawa wskazuje7.1.6; nie dodano major override bez oceny konsumentów. |
| Sugerowany downgrade CDP | Audit sugeruje0.0.36 zamiast obecnego0.0.127. Odrzucono automatyczny downgrade kontraktu auth/hooks tylko dla redukcji licznika. |

Zera high w `--omit=dev` nie są potwierdzeniem bezpieczeństwa produkcyjnego artefaktu, którego trace i środowiska nie zweryfikowano tu. Build/dev narzędzia nadal są powierzchnią CI. Unknowns: rzeczywisty produkcyjny Node, deployment trace, wykorzystanie podatnych funkcji przez SDK, staging i zachowanie prawdziwych sesji. Brak exploit/load tests.

## Źródła i dowody, sprawdzone 2026-10-14

- [ws tiny-fragment DoS](https://github.com/advisories/GHSA-96hv-2xvq-fx4p): fixed7.5.11/8.21.0; [ws uninitialized memory](https://github.com/advisories/GHSA-58qx-3vcg-4xpx): fixed8.20.1. Wybrane8.22.0 pokrywa oba.
- [Browserslist cache](https://github.com/advisories/GHSA-c83g-rgw3-j3cx) i [custom stats](https://github.com/advisories/GHSA-73wf-gq98-2v4g): fixed4.28.7.
- [Baseline mapping](https://github.com/advisories/GHSA-w5vr-8v7q-w6rv): fixed2.11.0; [Vitest/mocker](https://github.com/advisories/GHSA-82fw-gwwq-j7x9): fixed4.1.11.
- [Braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm): affected<=3.0.3, brak patched wersji; [image-size](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq): fixed2.0.3, tu usunięto konsumenta zamiast major override.
- Publiczny `npm view` potwierdził wersje i engines. Zapis: `evidence/cycle-2/npm-audit-registry.json`.

Raw: `npm-audit-before.json`, `npm-audit-after.json`, `npm-audit-production-after.json`; `npm-audit-comparison.json` zawiera eliminated/remaining/lock diffs i fingerprints. `npm-audit-prior-p0.json` zachowuje starszy wynik36 jako historię; bieżące porównanie używa świeżego42.

Odtworzenie: `npm install --ignore-scripts --no-audit --no-fund`, `npm ls ws browserslist baseline-browser-mapping vitest @vitest/mocker image-size @solana/wallet-adapter-react react-native --all`, `npm audit --json`, `npm audit --omit=dev --json`. Audit exit1 jest oczekiwany przy pozostałych findingach. Sandbox DNS ENOTFOUND odnotowano; pobieranie publicznego registry i install poza sandboxem dopuszczono automatycznie. Nie było odmowy i nie czytano prywatnych credentials.

Własne: install exit0, removed232/changed25; `npm ls` exit0; code/manifest/lock diffcheck PASS; status3/3 PASS na Vitest4.1.11. ux_audit zgłosił niezależny metadata retest5/5 i status3/3, następnie DEP-C2-01 P2 o Nodefloor; poprawiono engines manifest+lock. Końcowe przyjęcie i wynik testu nowych constraints należą do recenzenta, zbiorczy build/typecheck/test do root. Autor nie zatwierdza własnego B10 ani wydania.

Retest po DEP-C2-01: ux_audit zgłosił6/6 PASS niezależnych metadata tests — manifest/lock/installed i engines zgodne; Node20.19/22.12/24 dopuszczone,20.9/21/23 odrzucone. Recenzent odczytał raw42→18, 24eliminated/noadded i residuals. Odrębna opinia jest w `docs/coachfi/cycle-2/dependencies-review.md`; bounded przyjęcie zachowuje wymóg końcowych bramek koordynatora i nie zamyka pozostałych advisories.
