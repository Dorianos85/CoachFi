# C59 — zachowanie postępu po błędzie odczytu przy starcie lekcji

Status: ACCEPTED_LIMITED_LOCAL_UNSTAGED. 19.10.2026 lokalnie; dorośli, Polska, PL/EN. Produkcja NO_GO.

Usunięto odtwarzalną utratę znacznika ukończonego etapu. ProgressPath sprawdzał postęp przed startem, lecz writer czytał go ponownie. Gdy tylko ten drugi odczyt odmawiał dostępu, stary catch zamieniał błąd na pusty obiekt, zapisywał wyłącznie nowy start i usuwał wcześniejsze ukończenie. Kolejny odczyt akceptował już nadpisany zapis; handler nie blokował przejścia i nie pokazywał błędu.

W jednym pliku dodano prywatną ścisłą granicę odczytu dla obu writerów. Błąd odczytu/parsowania lub niedopuszczalny rekord przerywa zapis; rzeczywisty brak klucza nadal oznacza pusty stan. Kontrola właściciela następuje także po odczycie. Poprawne przyszłe klucze i dotychczasowe scalenia zachowane. Tolerancyjny stary getter/projekcja, katalog etapów, progi, nagrody, kod ProgressPath i kolejność set/current/notify/current/persist pozostają literalne. markStageStarted ma aktywny caller; markStageCompleted objęto testem eksportowanego API bez obecnego callera produktu.

| Sprawdzenie lokalne | Rzeczywisty wynik |
|---|---|
| Baseline nowych22 | 12 PASS / 10 FAIL / 0pending |
| Te same22 po zmianie | 22 PASS; wszystkie10 błędów zamknięte bez zmiany fixture |
| TypeScript | Jeden exit0,568wejść,0drift |
| TEMP build | Jeden PASS,34strony/35tras,568pre/567post,0drift |
| Niezależne recenzje | 2 GO,0otwartych uwag; osobny ledger po zapisach |

Dziesięć błędów bazowych: deniedread, malformedJSON, array i invalidstatus dla dwóch writerów oraz rzeczywisty handler PL/EN. JSONnull/scalar, zdrowe scalenia, przyszłe klucze, istniejący start/complete i zmiana właściciela stanowią12kontroli już zielonych w baseline. Dwa przebiegi Node dają44instancje wykonania, ale22różne przyjęte przypadki.25wierszy obserwacji na przebieg obejmuje poditeracje i fazy; nie jest25testami. Nie powtarzano odrębnych zielonych historycznych suitów, nie wykonywano Chrome.

Po poprawce ten sam pojedynczy błąd writera zachowuje dokładne surowe dane, ukończenie inflacji,125punktów i osobny sessionStorage;0set/remove/notify/persist. Handler wywołuje preventDefault raz i pokazuje istniejący komunikat niepotwierdzonego startu PL/EN. Jawny ponowny odczyt przywraca widok inflacja100% / nowy etap0% i nadal niczego nie zapisuje. W baseline wiersz logu nazwany retry nie wykonywał retry, ponieważ brakowało alertu/przycisku. [Porównanie](../../../evidence/cycle-59/behavior-delta.json) zachowuje rzeczywistą chronologię.

Testy uruchamiają prawdziwe writery, ścisły reader, product-storage/useProductStorage i handler ProgressPath na syntetycznych Mapach. Framework state/memo/layout effects oraz external-store snapshot są jawnie emulowane, a notify/persist zastąpiono lokalnymi adapterami. Nie jest to dowód natywnej nawigacji Next, ReactDOM, przeglądarki, prawdziwego SDK, kont, chmury lub stagingu. Naprawa kończy się przed pierwszym zapisem; nie dowodzi transakcji, rollbacku, trwałego odzyskiwania lub poprawności późniejszego błędu po zapisie.

Pełny stderr poprzedniego buildu C58mode jest równy po jedynej zamianie27.0s→26.1s; ostrzeżenia x402-fetch/@base-org/account pozostają. C50dependencydeferral bez nowego pollu/install/advisory closure. [Freeze226](../../../evidence/cycle-59/source-freeze.json) przejmuje wszystkie220wcześniejszych ścieżek literalnie,13preserve/20receipts/6SDKpinów zachowane.566/567 dawnych wejść literalnych +jeden kwalifikowany learningProgress. Następny bootstrap używa kompletnego C59source-freeze.json wprost, bez suplementu.

Autor produktu:c49_advisories; fixture:c49_validation; root:narzędzia/wykonanie/metadata i peer fixture; niezależny source/tools/fixture/raw:c49_dependency_review; PRODUCT:c49_validation z wyłączeniem własnej fixture/emulatora. Osobny ledger review po zapisach. B26 i40tasks obu backlogów bez szerszej zmiany statusów. HEAD/branch/index zachowane; bez add/commit/push/deploy lub zapisów produkcyjnych. AI/cloudwrites HARD_OFF; produkcja NO_GO. [Dowody](../../../evidence/cycle-59/verification.json).

Kolejne źródłowe hipotezy pozostają osobne i nieprzyjęte runtime: [warunkowy logout Supabase](../../../evidence/cycle-59/security-auth-triage.json), [metadane NFT](../../../evidence/cycle-59/repo-export-triage.json), [aktywny kalkulator słoików](../../../evidence/cycle-59/planner-triage.json). Nie aktywowano Web3/Kids ani nowego rynku.
