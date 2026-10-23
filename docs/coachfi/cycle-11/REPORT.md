# Cykl 11 — oszczędzanie PL/EN i bezpieczeństwo nawigacji lekcji

15.10.2026. **PRZYJĘTY LOKALNIE — LIMITED ACCEPT.** Gałąź codex/p0-security-consent-export, baza 86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b. Zachowano wcześniejsze staged i lokalne zmiany. Bez commit/push/deploy, produkcyjnych zapisów, migracji, realnych profili/sesji/sekretów, płatnych wywołań lub kontaktu z ludźmi. Produkcja **NO-GO**.

## Treść i rzeczywiste ścieżki

B06 otrzymał drugi ograniczony moduł: cztery istniejące kroki saving-habit i cztery pytania w PL/EN dla Polski. Zachowane IDs: saving-habit, budget-50-30-20, high-yield-savings, dca; klucze C/B/B/C i nagrody 25/25/20/30. To cztery pytania w dwóch językach. Resolver topic=saving używa teraz kanonicznych PL/EN zamiast trzech angielskich fallbacków w PL. Zmieniono też właściwy saving wpis zwykłego quizu. Lesson prowadzi do /quiz?topic=saving; obecne konta nie są dowodem działania tego patcha na produkcji.

Treść odróżnia dostępne środki po podstawowych kosztach i wymaganych minimach od dobrowolnego przelewu. Dopuszcza brak nadwyżki, przerwę i nieregularne wpływy. 50/30/20 jest elastycznym przykładem; zaliczenie minima do potrzeb i dodatkowych spłat do 20% jest jawnie opisaną konwencją tego przykładu, nie dosłowną definicją CFPB. Konto depozytowe wymaga sprawdzenia pełnych warunków i właściwej ochrony; brak rekomendacji dostawcy, aktualnej stawki lub gwarancji pokonania inflacji. DCA ma przykład możliwej straty, nie obietnicę zysku. Rachunki sprawdzono niezależnie w groszach/ułamkach. Źródła, założenia i wszystkie 12 uzasadnień dystraktorów: [recenzja finansowa](financial-review.md) i [metadata](content-metadata.json). Metadata pozostaje draftem kandydata; przyjęcie lokalne zapisano odrębnie, bez deklaracji udostępnienia materiału.

Autor treści daily_author, autor resolvera/wspólnej lekcji/narzędzi root. Niezależna finance/PLEN daily_data_review oraz UI daily_ui_review. Właściciele mieli rozłączne pliki, aktywnych było maksymalnie czterech. Autor nie zatwierdza własnej aplikacji.

## Odtworzone błędy i recenzje

FIN-C11-01: pytanie konta dopuszczało sensowne cząstkowe kontrole jako alternatywne odpowiedzi. Autor zawęził PL/EN do najpełniejszej checklisty i uczciwie opisał częściowe C/D. Opcje/ID/keyB/reward20 zachowano. Niezależne nowe probes 0/2 FAIL, po poprawce 4/4 PASS z dwoma dotkniętymi rationale cases. Finance: 22 różnych cases przyjęte w jawnych przebiegach, a następnie obecne w aggregate.

Niezależny test rzeczywistej wspólnej lekcji odtworzył cztery findings: 0/4: stary Next zapisywał nowego ownera, dwa szybkie wywołania pomijały krok, prototype route kończył się TypeError, a odmowa zapisu wychodziła z efektu bez kontrolowanego wyniku. Own-property guard, owner/ticket/cleanup, ograniczenie indeksu, synchroniczny saving lock i alert PL/EN z RAM blokadą Next/quiz link zamknęły wszystkie cztery w retest 4/4 bez zmiany oracles. Dodatkowe 14/14 content/lifecycle i 2/2 reentry/last-step-failure. [Recenzja UI](ui-review.md). Błąd zapisu nie obiecuje rollbacku lub braku częściowego zapisu; zmiana języka nie usuwa blokady. Nie przyjęto istniejącego parsera malformed lesson cache.

Zachowano pozostałe rekordy i surowe lokalizacje. AST dowodzi niezmienionych bajtów poza dozwolonymi obszarami; moneyMindsetLesson/metadata i trzy canonical mindset pozostają zachowane. Wspólne pełne banki mają celowo nowe hashe. C6 preservation oracles dostosowano po trzech FAIL w aggregate: odtworzono wyłącznie cztery stare saving bloki z zachowanego hash-verified źródła przed C11, następnie zastosowano dotychczasowe C6 maski i **niezmienione literalne expected hashe**. Dziewięć IDs pools, siedem pełnych legacy locale, 55 pozostałych English records i siedem other lesson locales zachowano. Exact 5 deltas/inverse 2 files/provenance niezależnie przyjęte: legacy-preservation-oracle-review.json. Oddzielna adaptacja C6 resolver identity miała dokładnie 3 delty i niezależną recenzję. Jednoliterowy case-insensitive regex finansowego fixture root sprawdził odrębnie; oracles UI/E2E również sprawdził root. Nie wyłączono testów ani nie zastąpiono historycznych baseline bieżącym wynikiem.

## Końcowe dowody lokalne

| Bramka | Rzeczywisty wynik |
|---|---|
| Vitest, 71 plików | Aggregate: 1382 PASS/3 FAIL; tylko 3 nieaktualne legacy oracles poprawione i retest 3/3 PASS. 1385 różnych przypadków przyjętych w dwóch przebiegach, nie single 1385/1385. 1382 green nie powtórzono. |
| Niezależne finance/UI | 22+20 przypadków są subsetem aggregate, nie dodatkową sumą do 1385. |
| Standalone TypeScript | 0 diagnostics/exit 0 po adaptacji dwóch TSfixtures; wcześniejszeTS0 zachowano. |
| Chrome lokalnie | 14/14 PL/EN w jednym run: 8 nowych saving i 6 dotkniętych mindset. Brak retries/skipped/flaky. |
| Next build | Generating static pages 34/34 (route table: 35 wpisów), exit 0; świeży TEMP 326 inputs/preflight 326/postflight 325, 0 current/copied mismatch. |
| Final parity po buildzie | 34 review porównania/27 ścieżek, 325 copied inputs, 0 mismatch. |
| Serwer |Host port 43191: 0 listeners po teardown. |

Browser i build miały osobne hash-verified TEMP kopie poza OneDrive. Podczas browser zmieniły się wyłącznie dwa historyczne unit fixtures; aplikacja/config/E2E pozostały zgodne,325 copied inputs, 0 mismatch. Build użył świeżej kopii z ich finalnymi wersjami. Provider/auth env puste, lokalny syntetyczny gość, browser ruch zewnętrzny zablokowany, czasUTC kontrolowany. Mocki nie są realnym auth/chmurą; audio mindset było lokalnym stubem, saving nie ma audio lekcji. Build font HTTP nie był wykluczony. Optional Coinbase warnings x402-fetch/@base-org/account nie potwierdzają tych funkcji. Narzędzia root mają oddzielną statyczną recenzję; identycznego boundary utility i 29 dawnych przypadków nie powtarzano.

[Verification](../../../evidence/cycle-11/verification.json), raw initial failures i celowane retests zachowane w evidence/cycle-11. Root pointer: evidence/coachfi-cycle-11.json. Końcowy repo guard:958tracked/621text/1skip,0findings; scoped staged diffcheck exit0. Niezależny QA raportu przyjął runtime/ledger claims i poprawione rozróżnienie34generatedpages/35routeentries. Wyniki są w verification; żaden pełny diff usuwanych profili/logów nie został odczytany.

## Granice i kolejna praca

RAM blokada nie daje atomic rollback, durable recovery ani exactly-once między kartami/reload. Postęp kroku oznacza lokalny licznik widoku, nie zrozumienie lub korzyść użytkownika. Nie przyjęto innych języków/rynków (ich target English fallback może dziedziczyć nową treść), całego B06, pełnego WCAG/czytnika ekranu, realnego audio/auth/kont/RLS/stagingu, edukacyjnej skuteczności lub produkcji. Zewnętrzne AI, cloud writes, health upload, Kids/Web3/afiliacja pozostają wyłączone. B02/B09/B10/B16 i budżet odrębne; package/lock bez zmian, brak powodu ponowienia niezmienionego audytu zależności.

**Następny B21** ma pierwszeństwo przed dalszymi treściami: source-only odczyt lib/signInGate.ts pokazuje readSteps catch→{} i writer akceptujący step po jedynie step<1. Wymaga syntetycznej reprodukcji utraty malformed cache/walidacji licznika, zachowania nieznanych bajtów i uczciwego PL/EN wyniku; nie naprawiono tego w C11. Dowód next-integrity-source-observation.json. Potem B06, kolejny ograniczony moduł (inflation wymaga własnej inwentaryzacji/financialreview). Pętla pozostaje aktywna, bez powtarzania niezmienionych zielonych bramek.
