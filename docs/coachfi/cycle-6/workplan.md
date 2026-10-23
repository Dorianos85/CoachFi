# Cykl 6 — B06, pierwszy moduł PL/EN

14.10.2026. Dorośli w Polsce, PL/EN. B15 pozostaje przyjęty lokalnie, automatic account writes wyłączone. Bez zmiany lockfile, powtarzania poprzednich gates, instalacji, produkcji, rzeczywistych danych albo płatnych usług. Pierwsze sprawdzenie potwierdziło bieżącą gałąź i brak niezapisanych zmian aplikacji.

Zakres paczki: istniejący money-mindset (3 kroki) oraz istniejące pytania `net-worth`, `lifestyle-inflation`, `pay-yourself-first`. Wersje PL/EN mają ten sam rynek i znaczenie, bez zmiany IDs, answer IDs, kluczy B/C/B ani nagród 25/25/20. Treść nie wymaga oszczędzania przed czynszem/jedzeniem/minimalnymi płatnościami. Dla nieregularnego dochodu sprawdza się dostępną nadwyżkę; brak nadwyżki nie wymaga transferu ani kary. Net worth nie jest oceną człowieka lub pełną miarą płynności. Dobrowolne podnoszenie standardu różni się od wzrostu koniecznych cen i potrzeb.

Quiz tematu mindset w PL/EN korzysta z istniejących kanonicznych trzech lokalizacji, zamiast angielskiego fallbacku. Pula zwykłego quizu pozostaje czteroelementowa; inne tematy i inne języki nie są aktywowane lub przedstawiane jako zrecenzowane. Rozpoznawanie query topic wymaga własnej właściwości mapy, więc prototype keys nie powodują crash. Scoring, SRS, storage ownership i cloud/API pozostają w istniejącym kontrakcie. Historyczne SRS bez wersji treści nie jest dowodem zrozumienia nowej treści; nie migrujemy ani nie kasujemy rzeczywistych danych.

## Właściciele i pliki

- curriculum_pilot — autor: moneyMindsetLesson.ts (en/pl), quizQuestions.ts (wyłącznie 3 IDs), allQuestions.ts (wyłącznie 3 PL overrides), własne author tests oraz content-change.md/content-metadata.json/evidence.
- root — autor integracji: quiz-topic.ts, QuizCard.tsx, topic author tests, config/verification i rejestry programu.
- architecture_audit — niezależny reviewer treści i źródeł finansowych; wyłącznie financial-review.md oraz evidence/tests review. Sprawdza każdy klucz, dystraktory, rachunki i PL/EN. Nie akceptuje własnego kodu.
- ux_audit — niezależny reviewer UI/lokalizacji/lifecycle; wyłącznie reviewer tests/docs/evidence i nowe E2E mindset-content.spec.ts. Nie zmienia aplikacji. Root uruchamia wspólne gates.

Baseline UX: 3/3 syntetyczne reprodukcje potwierdzają EN question/options/feedback i EN voice text przy PL locale, mimo istniejących PL rekordów. Jest to dowód problemu, nie acceptance. Źródła finansowe są sprawdzane na bieżąco: EU/OECD adult framework, first-party guidance o cash flow/surplus/automatic transfers; przepisy/produkty innych rynków nie są przenoszone do Polski.

Najpierw targeted tests i niezależne findings/retest; full gates po source freeze. E2E obejmuje rzeczywistą lokalną ścieżkę 3 kroków → 3 pytania w PL/EN, opcje/feedback/voice text, restart/powrót i zachowanie ID/punktów. Nie jest badaniem ludzi, psychometryczną walidacją, realnym kontem, RLS ani wydaniem produkcyjnym. Nie uruchamia się zewnętrznego AI/audio. Pozostałe błędy B06 (inne moduły/fallbacky/duplikaty/statystyki/retirement/ETF) zostają jawnie pending.
