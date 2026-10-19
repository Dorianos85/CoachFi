# Cykl 2 — niezależna recenzja integracji

14.10.2026. Recenzent: `ux_audit`; autorzy ocenianych zmian: `architecture_audit` (dependencies/status), `curriculum_pilot` (health/UI), root (export/sync/harness). Lokalna gałąź `codex/p0-security-consent-export`, baza `86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b` oraz zachowany staged pakiet P0. Bez push/deploy, rzeczywistych kont/danych, provider calls lub czytania profili. Nie zmieniałem implementacji autorów, manifestu/lock ani Git index.

**Limited ACCEPT integracji ocenionych lokalnych zmian zależności, statusu i health/UI, po build i końcowym typecheck. Produkcyjny release pozostaje NO-GO.** To recenzja zakresu cyklu2, a nie ponowna autorska akceptacja wcześniejszych zmian scope/hygiene wykonanych przeze mnie w P0; ich niezależny odbiór zachowuje [scope-repo-independent-review](../p0/scope-repo-independent-review.md).

## Macierz dowodów

| Kryterium | Dowód i właściciel wykonania | Wynik / granica |
|---|---|---|
| Patched ws major7/8, Browserslist, Baseline, spójny Vitest, brak retired wallet declarations/CSS | Własny metadata test `tests/cycle2-dependencies-review.test.mjs`6/6, odczyt manifest/lock/installed metadata | PASS; bez aktywacji SDK/network |
| Node engines zgodne z pełnym toolchain | Własny test SemVer20.19/22.12/24 i rejection20.9/21/23; manifest+lock intersection | PASS; runtime hostingu niesprawdzony |
| /api/status nie inicjuje provider/config/keypair/RPC | Własny odczyt finalnego handlera i wykonanie3 mock tests autora | PASS; statyczna publiczna polityka, nie pomiar provider health |
| Wagi98, input validation, denominator0 i subnormal, zapis/consent/quota | Własne106/106 Vitest; expected wartości wyliczone przed importem implementacji | PASS; heurystyka nie ma naukowej/finansowej walidacji |
| PLN vs legacy units/source | Własny retest8 nowych cases: strict pairs, unknown legacy, idempotent normalize; odczyt UI/Home | PASS; bez konwersji FX, brak legacy PLN prefill |
| Puste PL/EN pola i mobilny formularz | Własny CUA, 390×844, AX/read-only DOM,3 screenshoty | PASS w ograniczonym zakresie; bez wpisania kwot i akceptowania terms |
| Modal consent keyboard/focus | Własny CUA PL/EN: open→close focus, Shift+Tab/Tab wrap, Escape→trigger focus | PASS; nie pełny audyt WCAG/screen readera |
| Full local health flow i wcześniejsze safety flows | Koordynator20/20 E2E; recenzent odczytał config i9+3+8 scenariuszy | PASS zgłoszony przez koordynatora; nie własny pełny E2E |
| Eksport allowlist, brak free-text/tokens i cloud health upload | [Niezależna recenzja architecture_audit](health-data-review.md),9/9 w tym96 oracle scenariuszy i Proxy zero calls | ACCEPT limited; nie pełny eksport/izolacja/usunięcie konta |
| Zbiorcza regresja unit i Node | Koordynator313/313 Vitest w22 plikach,11/11 Node | PASS zgłoszony; własnych106/6 nie dodaje się ponownie do liczników |
| Finalny build | Koordynator po zakończeniu dev/CUA | PASS34/34 według wyniku koordynatora |
| Standalone typecheck | Pierwszy run wykrył typ mojego mocka i BigInt literals oracle autora; poprawki tylko w testach, bez tsconfig | Pierwszy FAIL; finalny `npm run typecheck` koordynatora exit0. Własny nonincremental tsc także exit0 |

## Odczyt finalnego harness

`playwright.cycle2.config.ts` jawnie wybiera `p0-safety.spec.ts`, `health-integrity.spec.ts`, `health-funnel.spec.ts`; dziedziczy P0 isolated localhost server43191, workers1/retries0 i ephemeral Playwright context. Headless Chrome wykonany przez root jest odrębny od CUA; nie korzysta z rzeczywistego profilu ani zapisów user session. `scripts/start-p0-test-server.mjs` zeruje w samym procesie testowym rozpoznane provider/auth/Supabase/RPC variables przed Next dev, bez zmiany produkcji. Browser contexts blokują ruch poza lokalnym hostem. To lokalna osłona harness, nie test konfiguracji produkcyjnej.

Odczytany finalny P0 test ma9 przypadków: wymagane zasady/adult18+ PL/EN; selected export PL/EN; local guest chat PL/EN; deferred routes/API PL/EN; syntetyczny local voice/cancel. Chat mierzy baseline reply count+1 i niepusty nowy tekst, nie stałą liczbę2. Nowa asercja GET `/api/status` wymaga `scope:local_release_policy`, `externalProbesPerformed:false`, `externalEnabled:false` i braku agentId/voiceId/rpcUrl/mintAuthority/privateKey. Endpoint mock tests osobno dowodzą braku importów i wywołań; sama odpowiedź E2E nie dowodzi zerowego server-side network.

Health-funnel3 przypadki: guest98 i lekcja bez email/trial/provider requests; edytowalne investing98→90/reload z ukryciem dirty card; home/shell denominator98. Health-integrity8 przypadków: missing/negative/zero i focus pierwszego błędu PL/EN, failure storage PL/EN, required-only PL/EN, complete/incomplete legacy z unknown units, immediate withdrawal home/shell. Źródło finalnych testów odpowiada przekazanemu wynikowi20/20 po walucie. Nie uruchamiano pełnego legacy E2E ani nie przypisano skipped historical widget/Kids tests jako PASS.

Własny CUA formularza miał brak wymaganych terms; sprawdzono disabled submit i reversible UI. Error submit/reload/legacy potwierdza syntetyczny E2E, nie CUA. Pierwszy navigate timeout nie został uznany za awarię aplikacji: karta była dostępna i późniejsze odczyty działały. Po teście viewport zresetowano, własną kartę zamknięto i root otrzymał sygnał końca. CUA nie mierzył network; zero calls jest ograniczonym dowodem mock/harness.

Kontrole koordynatora są dokumentowane w [verification.json](../../../evidence/cycle-2/verification.json). Build i standalone typecheck mają osobne wyniki. Koordynator wykrył typ `vi.fn()` mojego mocka oraz BigInt literals w oracle drugiego recenzenta; nie były to awarie rachunku aplikacji, ale blokowały TS przy obecnym target. Mój mock otrzymał konkretny callback/Mock typu SyncEntity, celowany106/106 retest przeszedł14:14:08. Poprzedni313/313 aggregate dotyczył runtime przed poprawkami typów; nie przedstawia się go jako typecheck PASS. Nie ustalono przyczyny różnicy wyników build i pierwszego standalone typecheck.

Po obu korektach samych testów: autor oracle9/9 PASS, mój retest106/106 PASS; źródła aplikacji i manifest/lock pozostały bez zmian. Własne polecenie `node node_modules/typescript/bin/tsc --noEmit --incremental false` zakończyło się exit0 bez diagnostics i bez zapisu wspólnego cache. Koordynator niezależnie potwierdził standardowe `npm run typecheck` exit0 i build exit0/34 strony statyczne. Odbiór nie wymaga ponownego wykonywania niezmienionego E2E po zmianie wyłącznie typów testowych.

## Zamknięte findings i residuals

DEP-C2-01 closed: Node floor poprawiono z>=20.9 na `^20.19.0 || ^22.12.0 || >=24.0.0` i niezależnie przetestowano. HEALTH-C2-01 closed lokalnie: historyczne EN mogło używać USD, więc legacy zawsze ma `legacy_unspecified`, nie nowe PLN; formularz ma puste kwoty, readonly wynik nie oznacza ich PLN. Brak wcześniejszej asercji focus uzupełnił autor, finalny PL/EN E2E przeszedł.

Audit odczytany przez recenzenta: full42→18 affected entries,24 removed/0 added,5high+13moderate; production omit-dev12moderate/0high/0critical. Refresh Vite/Rolldown/LightningCSS jest jawny, nie opisany jako same ws pins. Residual high rodziny braces/Tailwind dotyczy build tree bez dostępnego poprawionego braces3; residual production stream-json/uuid/CDP/UMI wymaga dalszej oceny konsumentów i artefaktu. Feature hard-off i brak direct imports nie są dowodem globalnej nieosiągalności podatności. [Szczegółowa recenzja zależności](dependencies-review.md).

B10 pozostaje częściowo otwarte. B13, zauważone przez koordynatora AuthContext debounce/hydration po logout, nie jest tu naprawione; blokada health upload zamyka tylko tę konkretną drogę. Shared browser storage, rzeczywiste konta/dwa konta w stagingu, RLS, rights/retention u operatora, historia publicznego repo i obsługa ujawnionych wcześniej profili/sekretów nadal wymagają swoich bramek. Brak aktywnego zewnętrznego AI nie stanowi przetestowanego budżetu jego przyszłego uruchomienia. Nie zmieniono wag heurystyki, rynku lub zakresu odroczonych Kids/Web3/marketplace/leaderboard.

## Zamrożone wersje

SHA256 odczytano z dokładnych lokalnych plików. To identyfikacja ocenionego patcha, nie commit ani deploy:

| Plik | SHA256 |
|---|---|
| package.json | bc94bb86fe2ba2ddf90039b08683145279e31d8925623e577d6c481856c8ef8a |
| package-lock.json | d810ad909d72a02a6bdb06d12e15f250256ac54f138a8aba919e5681ac6fc5f5 |
| app/api/status/route.ts | b8b9b584a33165a778fc0162a86abf14059b9efea8502e6f295f1f505d2b182c |
| lib/financial-score.ts | b88f62395e24eb0865731095cb3d31d2bd1ec526d8c5039e8e5933272bbdcdf7 |
| lib/healthCheck.ts | 5b7eef0519cad8fd3501a6e5d0c8a4dd13746eb59723ada8336b90cd0110d6a7 |
| app/health-check/page.tsx | 2cffed3d3136cf8eaa6c994260e2974fe778ae278ac21dfdbdf121f6e5ea2603 |
| components/FinancialScoreCard.tsx | 46e9bbae1d4e394c19589d91635d1d60d8bc661097b2ef6ac02fdbbabdf31d85 |
| app/page.tsx | 92cd3c19d1a27e194f6bfdda10c1250f35bc705682a6bbba63d8bf45882517de |
| components/AppNavigation.tsx | 0e4b59a2fc5585718df4c92662d7c4e391d56488d6cc4123149ee4cd80d82d65 |
| tests/e2e/p0-safety.spec.ts | 03f084ecb752e65acdd5829caccb6a9cae992bc68aff90f15e58ae9f9195dd94 |
| tests/e2e/health-funnel.spec.ts | 9eed1ed9ec369c19bae78f4e445b8025008a7d633568a26ae3a17f79cd0a4343 |
| tests/e2e/health-integrity.spec.ts | d22d46611c00f62d91113fa76832b6a39fedee2858684fa3bd20b3228773f99e |
| playwright.cycle2.config.ts | 6dc25facfa4c083f5a655346a7802c90fd2d5447c183092d9f5fb675a7c43d35 |

Własne review tests po korekcie typów: `tests/cycle2-health-independent-review.test.ts` SHA256 f3afb28c2d54ff969170039c34de62bd2bfea520b40096cac60cfa9ad7a4ed42; `tests/cycle2-dependencies-review.test.mjs`7221bf912e51e806bd3e990f19be6f0dc75213870cc18c2425f07d66ede7f3a9. Dowody CUA i granice są w [health-ui-review](health-ui-review.md). Zmiana ocenionej logiki, danych lub zależności po zamrożeniu wymaga odpowiedniego retestu; nie powtarzać zielonych niezmienionych testów dla samej pętli.
