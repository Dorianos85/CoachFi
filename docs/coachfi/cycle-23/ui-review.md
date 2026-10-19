# C23 — niezależny UI baseline

15.10.2026, daily_ui_review. Siedem nowych przypadków przygotowanych, pierwszy runtime czeka na root peer/schedule. Actual ReviewPage i QuizCard z realnymi resolverami/SRS i syntetycznym guest storage. Oczekiwana nowa treść PL/EN jest literalną kopią zamrożonego draftu320085, a nie bieżącego produktu. Cztery Review cases mogą odtworzyć różnicę treści; trzy inventory/pool controls mogą przejść — to przewidywanie, nie wynik.

Pytanie jest już unikalnym PL/EN canonical B25, poza trzema etapowymi IDs C17 i plain4. Review nie przyznaje bezpośrednio25punktów. QuizCard nie może wstrzyknąć brakującego ID przez startQuestionId; żaden helper/component result nie jest mockowany, aby udawać taką trasę. Historyczne C17 assertion freeze wymaga jawnego adaptera; C18UI/E2E czytającanonicaldynamicznie. Root wybiera istniejące2Chrome healthy-duplicate-mobile, bez6niezmienionychfaultflows.

## Pierwszy baseline wykonany przez root

Wspólny pierwszy run:10cases=3 PASS/7 FAIL; własny UI subset7=3 PASS/4 FAIL. Cztery desired-copy failures odtworzyły C23-UI-01 w actual Review: prawidłowe B i błędne A w PL/EN, po kontrolach real SRS i braku bezpośredniej25punktowej nagrody.18softmismatchmessages nie zwiększa liczby przypadków. Inventory i realny brak targetu w QuizCard plain4 przeszły. Nie ma nowego błędu zapisu ani fallbackPL; poprawki treści nadal wymagają finance/source review.

Ograniczenie: baseline uruchomiono z JSON-only reporter, dlatego zapisane stdout ma tylko129znaków ścieżki raportu. Brak C23_UI_OBSERVATION; siedmiu telemetry snapshots nie deklarujemy jako dostępnych. Raw18failuremessages, statusy oraz pełne before źródeł/fixture są zachowane. Root poprawił reporter przed przyszłym acceptance do verbose+JSON; baseline nie będzie ponawiany. Root driver ma4before/afterFP i0drift; dodatkowe13preparedFP są osobną historyczną kotwicą planu.

## Niezależne przyjęcie UI po zmianie danych

**7/7 własnych przypadków PASS** w pierwszym root retest po zmianie źródeł (wspólny run10/10=finance3+UI7). Cztery pierwotne UI failure names mają teraz PASS; wszystkie siedem bodies/oracles oraz fixturee1a791 pozostają literalne. **C23-UI-01 CLOSED**. Nie ponawiano baseline ani innych zielonych testów. Wcześniejszy błąd pre-spawn narzędzia wykonał0testów i jest zachowany osobno.

Actual Review pokazuje zamrożony prompt PL/EN, cztery nowe opcje i pełne wyjaśnienie po B oraz A. Correct B daje zapisany termin2026-01-07, wrong A2026-01-02; jedyny zapis to SRS, inne karty i kroki bez zmian, saldo nadal125. Review nie przyznaje bezpośrednio metadatareward25; activity to jawny mockspy (correct1/wrong0), bez dowodu realnego bonusu serii. Voiceprops zawierają pełne pytanie i pełne wyjaśnienie; actualReview nie odczytuje połączonych czterech opcji, brak realnego audio.

Nowy run verbose+JSON zachował7structuredUIobservations. Nie uzupełnia to brakującej konsolowej telemetry baseline: wcześniejsze3PASS/4FAIL/18messages i ograniczenieJSON-only pozostają historycznie literalne. Root miał4runtime before/after source/fixture hashes0drift; własne13bieżącychkotwic obejmuje źródła/consumer/guards i fixture.

Niezależny AST/source odczyt potwierdził dokładnie jeden obiekt EN i jeden PL zgodny z draft320085, wszystkie bytes poza tymi dwoma obiektami identyczne. C17lekcja, resolver, localizedQuiz, Review/QuizCard i helpers zachowano. Target nadal unikalnyB25 w banku82, poza wszystkimi stage/defaultPLEN pools; realny QuizCard nie wstrzykuje go przez startID. Nie ma nowego quiz route ani nowej lekcji. Rootpeer fixture przedbaseline i osobna finance/draft review są zapisane; autor nie zatwierdza własnych źródeł.

To limited actualcomponent/dataflow UI acceptance. Finanse/źródła i historyczne adaptery mają odrębne reviews. Root dopiero oceni2Chrome healthy-duplicate-mobile w PL/EN; brak UI7claim dla DOM/mobile/klawiatury/audio/provider/Auth/RLS/staging/CI/freshcheckout/produkcji. ProdukcjaNO-GO.
