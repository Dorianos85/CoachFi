# Cykl 13 / B22 — integralność lokalnego czasu rozmowy

15.10.2026. Dorośli, Polska, PL/EN. Poprzedni C12 i staged changes zachowane; bieżąca gałąź codex/p0-security-consent-export. Bez commit/push/deploy, produkcyjnych zapisów/migracji, realnych danych/profili/sesji/sekretów, paid calls lub kontaktów. External AI/voice/mikrofon/cloudwrites/health/Kids/Web3 pozostają off.

## Zakres i kryteria

Source-only B22 wymaga actual old helper baseline przed mutacją: Number(raw) fallback0, wallclock delta i RAM advance przed persistence mogą uszkadzać lub fałszować licznik. Dopiero reprodukcja daje finding. Strict nonnegative safeinteger duration/cache oraz safeclock/elapsed/sum; zachowane unknownbytes/read-denied, aktualny owner przed/po read/write/notify i truthful acknowledged result. Odmowa lub niepewność po attempted write blokuje automatyczne ponowienia w RAM. Bez journal, migration, CAS/rollback lub nowych persistedfields. Concurrent sourceSet czasu nie sumuje podwójnie.

Public get numeric zostaje zgodny i readonly przy unavailable; wynik0 nie dowodzi realzero. API status/subscription do rootUI autor uzgodni po baseline. Public begin/end wymagają obecnego ownera i zachowanej diagnostyki stale. Interval/pagehide nie może powodować uncaught ani zapisów po quarantine. C12 step helper/wrappers, rules/config/counts pozostają bez zmian.

Root CoachPage ma opanować begin/end/cleanup failure i pokazać PL/EN ostrzeżenie o wstrzymanym liczniku. **Lokalne przykłady pozostają dostępne bez naliczania czasu**, własny input/messages zachowane; brak productretry. Stare callbacks/owner/locale muszą pozostawać odgrodzone, nowy owner nie dziedziczy historii RAM. Zewnętrzna AI flagfalse, API/provider/audio nie jest włączany. Disabled voice integration nie ma acceptance działania live; syntetyczne overlap helpers można testować.

## Własność

| Autor/pliki | Odrębny reviewer |
|---|---|
| daily_author: agent-time tylko w lib/signInGate.ts, optional lib/agent-time-save.ts, tests/cycle13-agent-time-author.test.ts, data-author report/proofs | daily_data_review |
| root: app/coach/page.tsx, tools/config/workplan/ledger | daily_ui_review UI; daily_data_review tool/static |
| daily_data_review: cycle13-data own fixture, data-review.md/json | root tylko ewentualny fixturefix, source poprawia autor |
| daily_ui_review: cycle13-UI own fixture, agent-time-integrity E2E, ui-review.md/json | root independent fixtures/E2E; source poprawia root |

Root+3, istniejące role ponownie użyte. Brak duplicate work. Najpierw independentbaseline oraz freeze source dla każdego autora, potem poprawka/ownchecks i independentcases/findingsretest. Root dopiero po scopefreeze wykonuje właściwy aggregate, TS, bounded browser (nowe8 plus dotknięte istniejące chat/gate ścieżki), osobne świeże TEMP build/parity, safe guard/scoped diff i niezależny ledger QA. Nigdy nie powtarzać green bez sourcechange/concern; failures zachować.

## Ograniczenia

Local timer mierzy czas widoku rozmowy, nie aktywnego uczenia, skuteczności lub potwierdzonego backendu. RAMquarantine bez durable/exactly-once po reload/tabs. Unavailable/uncertain nie daje saved acknowledgement. Brak real auth/kont/RLS/staging/voice/WCAGfull. B10/package/lock bez nowej przesłanki nie ponawiać; B02/B09/B16/budżet osobno. Po bounded data integrity wrócić do remainingB06 z własnym inventory/financial review.
