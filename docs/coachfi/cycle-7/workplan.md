# Cykl 7 — B17: integralność lokalnych punktów

14.10.2026. Wybrano nowe wykonalne zadanie integralności przed następnym modułem B06. Staged P0/cykle2–6 zachowane, bez commit/push/deploy. Dzisiejsza recenzja B10 pozostawia niezałatwione advisory bez kompatybilnego patcha; lockfile nie zmienia się, nie ponawiamy niezmienionego audytu. B02/B09/B16 nadal wymagają stagingu/operatora/kontraktu; brak zasobów nie daje PASS i nie blokuje lokalnej walidacji.

Odczyt obecnego tokens.ts wskazuje brak walidacji wydatku: ujemna kwota odejmuje liczbę ujemną, a NaN/Infinity mogą trafić do cache. parseInt przyjmuje prefix błędnego raw. Jest to ustalenie źródłowe; autor i niezależny recenzent zachowują syntetyczne baseline oddzielnie od acceptance. QuizCard zapisuje SRS/submitted przed onReward; preflight konkretnej prawidłowej odpowiedzi pozwoli odrzucić nieprawidłową nagrodę przed jej zapisem. Nie ogłaszamy atomowej transakcji wielopolowej lub odzyskania danych.

Kontrakt: missing raw key ma istniejące starter125 bez zapisu. Poprawny zapis to canonical unsigned decimal integer w0..MAX_SAFE_INTEGER; malformed/read-blocked/stale widok daje0 bez nadpisania raw, a mutacja jest odrzucana. Kwota ma runtime type number, finite>=0; zachowane Math.round i safe rounded delta/result. addTokens invalid odrzuca przed write/event/cloud/persist, spend invalid/insufficient zwraca false. Zero/rounded-zero przy poprawnym current saldo jest no-op bez skutków ubocznych; malformed/stale/read-blocked nadal fail-closed. Nie wprowadzamy nowych danych/formatów/kont/providerów.

Pliki i role:

- architecture_audit autor: lib/tokens.ts, cycle7-tokens-author.test.ts oraz własny author report/evidence. Eksportuje czysty canAwardTokens oraz TokenMutationError.
- root autor UI: components/QuizCard.tsx, własne tests, config/verification/rejestry. Dla correct+onReward+!rewarded preflight przed recordAnswer; false pokazuje alert PL/EN bez SRS/submitted/reward/completion. Wrong answer zachowuje dawny przepływ bez nagrody.
- curriculum_pilot niezależny numeric/data reviewer: własne tests/cycle7-token-review.test.ts i review/evidence; odrębne oracles, każdy finding odtworzony i zamknięty po zmianie autora.
- ux_audit niezależny UI reviewer oraz autor tests/cycle7-quiz-review.test.ts i tests/e2e/token-integrity.spec.ts (2 cases PL/EN); źródła aplikacji tylko read-only.

Targeted tests po owner freeze, niezależna recenzja/retest; full unit/typecheck i build po finalnym freeze. Browser: dwie nowe ścieżki malformedraw → jawny reject/preserved bytes/no SRS → syntetyczna naprawa fixture → retry150/one SRS. Sześć bezpośrednio dotkniętych C6 quiz cases retestuje się z powodu zmiany QuizCard/tokens; poprzednich22 nie powtarza się bez konkretnej obawy. Fresh guest fixtures, localhost browser traffic, bez realnego auth/audio/AI. E2E/build w hash-verified TEMP, istniejący runtime, bez instalacji/env/profili/DB. Autor nie akceptuje własnej poprawki; root recenzuje nowe E2E oracles przed ich wykonaniem.

ZAKOŃCZONY: przyjęcie ograniczonego kontraktu i niezależne verdicts/gates w [REPORT](REPORT.md) oraz verification. B18 odrębnie sprawdzi późniejszą odmowę write i spójność retry, bez obietnicy atomic rollback. B06 pozostałe moduły pozostają otwarte; nie powtarzamy niezmienionej recenzji treści. B15 cloud writes i zewnętrzne AI/health/Kids/Web3/afiliacja pozostają off. Produkcja NO-GO.
