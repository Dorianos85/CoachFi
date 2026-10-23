# C29 — osiem istniejących wyzwań PL/EN

Status: INVENTORY_DRAFT_BASELINE_PENDING. Dorośli, Polska. c7–c14, C/B/C/C/B/C/B/B,50 każdy;82 IDs,71PL overrides.

Root koordynuje narzędzia/runtime/ledger; daily_author jest jedynym autorem dwóch plików danych, draftu oraz C29 legacy adaptera i pięciu setup-only importów. daily_data_review tworzy niezależne financial oracles i recenzuje wszystkie dystraktory PL/EN oraz helper autora. daily_ui_review tworzy actualDaily33 i Chrome16 oraz recenzuje narzędzia roota i końcowy ledger. Root recenzuje niezależne fixtures/UI/E2E. Autor danych recenzuje root legacy runner. Autor nie zatwierdza własnego rezultatu.

Kolejność: inventory i primary sources → niezależny draft GO i old-source baseline →16 obiektów istniejących PL/EN → source/adapter peer → pierwszy uzasadniony retest nowych przypadków finansowych i33actualUI; liczba finance zostanie ustalona fixture →15 dotkniętych legacy →TS →fresh safe TEMP build →Chrome16 →independent ledger QA →rutynowy metadata staging. Nie deklarować testcount przed wykonaniem.

Najwyższe zależności: dependency inputs bez zmian, residual B10 i realAuth/RLS/server/staging pozostają otwarte; brak nowego lokalnego niezależnego P0 z dowodem. Nie powtarzać audit/install/green bez powodu. C28receipt zachowany.

Bez commit/push/deploy/produkcji/sekretów/profili/AI/cloudwrites/płatnych calls/kontaktów. Bez zmiany reward/rotacji/ID/SRS/writers lub siedmiu innych jawnych locale. c16–c20 wymagają kolejnego inventory/review. Dowody w evidence/cycle-29; root pointer wyłącznie po końcowej QA.
