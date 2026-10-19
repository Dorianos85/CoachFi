# C21 — actual SignInGate baseline

15.10.2026. daily_ui_review. Pierwszy baseline11: **7 PASS/4 FAIL**.9 normatywnych=5 healthycontrols PASS +4 exactOFF FAIL; pozostałe2 PASS są wyłącznie enabled-unknown observations, nie policy acceptance.12 source/fixture fingerprints bez zmian,11 structured observations, SDK/email/OAuth/OTP/fetch0.

C21-UI-01 odtworzony w PL/EN: przy dokładnym SIGN_IN_GATE0/0/0 non-array SRS wywołuje cards.map wyjątek. Pending manualrequest jest prawdziwy, ale initial effect przerywa publikację opened; po healthy mount ten sam błąd propaguje synchronicznie przez requestSignIn/notify. Modal pozostaje nieobecny. Pierwsza asercja no-throw FAIL; dalszych open/close assertions nie uznajemy za wykonane. Osobna telemetry potwierdza requesttrue/rawpreserved/writes0.

Healthy OFF/manual PLEN i known nonzero1/1/0 required PLEN zachowują stare reguły. Dwie malformed/denied obserwacje przy nonzero pokazują legacy affordance po utracie danych; nie przypisują unknown wartości required i nie wchodzą do przyjęcia planowanej poprawki OFF.

Minimalny kandydat mieści się w isSignInRequiredNow: tylko exacttriple0 może zwrócić znane z konfiguracji false przed odczytem. Każda inna konfiguracja ma zachować dawną ścieżkę. Brak wdrożenia lub implementation acceptance na podstawie baseline.

[Raw i kwalifikacje](../../../evidence/cycle-21/ui-baseline.json), [wyniki11](../../../evidence/cycle-21/ui-baseline-tests.json), [pełny przebieg](../../../evidence/cycle-21/ui-baseline-run.json), [before/peer](../../../evidence/cycle-21/ui-baseline-before.json).

Rzeczywisty SignInGate/helper/storage na persistent hook harness, jawne syntetyczne CDP hooki bez SDK i prawdziwy ready guest revision zgodny z gałęzią boundary. Nie badano rzeczywistego CDP/Auth, produkcyjnej konfiguracji ani browser DOM. Bez zmian komponentu/provider/config/polityki, sourcewrites, dawnych green lub E2E. Produkcja NO-GO.

## Niezależny targeted retest exact OFF

Na źródle b5f5474c… ta sama literalna fixture83394…: **9 normative PASS/0FAIL/2diagnostic unselected**. Cztery pierwotne FAIL zamknięte przez actual komponent/effect/subscription; pięć zdrowych OFF/ON kontroli przeszło na zmienionej wywoływanej funkcji.10 before/after fingerprintów bez różnic,9structuredobservations. Nie powtarzano dwóch unknown diagnostics ani helper green.

C21-UI-01 zamknięty wyłącznie dla exact0/0/0: initial i late explicit manualrequest w PL/EN otwiera/zamyka modal bez błędu, bez native reads/writes i SDK. Root dodał tylko3 linie w isSignInRequiredNow; actual SignInGate, kopie, progi/env, provider i pozostały nonzero return są literalnie bez zmian po inverse.

[Finalny ograniczony werdykt UI](../../../evidence/cycle-21/ui-review-final.json), [raw9+2unselected](../../../evidence/cycle-21/ui-acceptance-tests.json). Enabled unknown zachowuje legacy ograniczenia; brak nowego policy/requiredboolean, browser/Auth/produkcja PASS.
