# Cykl12 / B21 — integralność lokalnego licznika kroków lekcji

15.10.2026. Dorośli, Polska, PL/EN; gałąź codex/p0-security-consent-export, poprzedni C11 frozen/staged zachowany. Bez commit/push/deploy, realnych danych/profili/sesji/sekretów, produkcyjnych zapisów/migracji, płatnych wywołań lub kontaktów. AI/cloud/health/Kids/Web3 pozostają off.

## Problem i zakres

B21 source-only obserwacja: readSteps catch→{} pozwala writerowi zapisać pusty fallback nad malformed/read-denied cache; step ma tylko warunek step<1. Najpierw real helper w syntetycznym baseline. Walidacja własnych znanych IDs, bezpiecznych całkowitych liczników i zachowanie nieznanych bajtów; bez normalizacji/migracji lub durable recovery. Read-only presentation może pozostać failclosed, writer musi odróżnić absent od invalid. Current owner sprawdzany przed/po odczycie/zapisie/notify. Odmowa/throw zapisu nie jest sukcesem.

Money-mindset ma oddzielny niechroniony effect i Next; root przygotuje owner/ticket, reentry/doubleclick guard oraz istniejący uczciwy alert PL/EN i blokadę Next/link po odmowie. Generic lesson C11 już ma te guards, nie rozszerzać treści ani nagród. Agent-time, progi/logowanie, cloud/API, metadata i quiz bank pozostają poza zakresem. Ewentualna przesłanka poza tym zakresem → osobne zadanie.

## Własność i recenzja

| Autor/pliki | Niezależny recenzent |
|---|---|
| daily_author: lib/signInGate.ts tylko readSteps/recordLessonStep (+opcjonalny nowy lib/lesson-step-save.ts), author fixture, data-author report/proofs | daily_data_review |
| root: app/learn/money-mindset/page.tsx, snapshot/config/tools i integracja | daily_ui_review dla UI; daily_data_review dla narzędzi |
| daily_data_review: niezależne cycle12-data fixture, data-review.md/json | root weryfikuje ewentualną zmianę samego fixture, autor naprawia source |
| daily_ui_review: cycle12-UI fixture, lesson-step-integrity E2E, ui-review.md/json | root niezależny fixture/E2E read; autor naprawia source |

Limit root+3, istniejące nazwy ponownie użyte; brak równoległej drugiej paczki. Gates root dopiero po freeze/review: odpowiedni Vitest aggregate, TS,8nowych+14dotkniętychC11/C6 browser cases, świeży build TEMP, hash parity po buildzie, safe repo guard/scoped diff. Nie ponawiać niezmienionych green bez zmiany. Początkowe failures zachować, fix autora i niezależny retest.

## Kryteria i ograniczenia

Malformed/partialbad/unknown/prototype/nonfinite/fraction/overflow/read-denied nie może zostać cicho zastąpione prawidłowym nowym rekordem. Monotonic valid no-op nie przepisuje bytes; stale owner i callback nie zmieniają nowego ownera; failed/uncertain writer blokuje widok PL/EN i nie przyznaje nagrody. Dopiero runtime test daje PASS; initial source observation i moki nie dowodzą production/auth/RLS. RAM blokada bez atomic rollback/journal/exactly-once między kartami. Inne locale/fullWCAG/real audio/staging/produkcja nie mają PASS. B10 bez zmiany lock/new triage reason nie powtarzamy; B02/B09/B16/budżet oddzielne. Po B21 kolejny B06 moduł wymaga inventory/financial review.

Baseline update: independent data4/4 reproductions realrecordLessonStep and independent Money UI0/3 acceptancefailures preserved. Root Money guard patch3/3 findingretest PASS with unchangedfixture; helper strictvalidation/wholeB21 remains pending.
