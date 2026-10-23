# C56 — całkowite liczniki SRS w wybranym eksporcie

Status: ACCEPTED_LIMITED_LOCAL_UNSTAGED. 19.10.2026 lokalnie. Dorośli, Polska, PL/EN. Produkcja NO_GO.

Wybrany eksport pomija karty z ułamkowym interval lub repetitions. Wcześniej przepuszczał np.1.5dni/0.5powtórzenia, chociaż rzeczywisty strict Review odrzuca taki rekord. Zmieniono dokładnie dwa wyrażenia admission w lib/data-export.ts; Number.isSafeInteger poprzedza dotychczasowe ograniczenia liczbowe. Nie zaokrąglamy wartości i nie naprawiamy magazynu. Poprawny sąsiedni rekord pozostaje, a przy samych odrzuconych kartach klucz SRS nadal zawiera [].

Zachowano interval1..90, repetitions0..100000, ułamkowy easeFactor, znane ID i pięć pól, daty, kolejność/slice1000 oraz pozostałe gałęzie eksportu. Review jest świadkiem całkowitości: sam pozwala na interval0 i szersze liczniki, a odrzuca duplikaty. To nie pełna zgodność obu schematów. Kwoty ułamkowe pozostają poprawne w istniejącej gałęzi pieniężnej; zapis JSON7.0/2e0 nadal oznacza całkowitą wartość.

| Bramka lokalna | Wynik |
|---|---|
| Baseline nowych24 | 12 PASS / 12 FAIL,0pending;2sanitizer+2collector+8owned błędów omission |
| Te same24 po zmianie | 24 PASS; wszystkie12wcześniejszych porażek zamknięte bez zmiany fixture |
| Dotknięte historyczne eksporty | 23 PASS / 3 świadome SKIP niezmienionego usuwania;26instances w4plikach |
| Jeden TypeScript | exit0,564wejścia,0drift,bez korekty fixture lub retestu |
| Jeden TEMP build | PASS,34strony/35tras,564pre/563post,0drift;ostrzeżenia zachowane |
| Niezależne końcowe recenzje | 2 GO dla ograniczonego zakresu, 0 otwartych uwag; PRODUCT reviewer wyłącza własną fixture |

Łącznie47zaliczonych instancji testowych w2udanych przebiegach Node (24nowe+23historyczne); baseline jest osobny. Dziesięć parametrów starego testu schema2 ma ten sam tytuł, lecz odrębne dane — nie liczymy unikalnych napisów. Nie powtarzano pozostałych zielonych testów. Pierwotny szeroki filtr legacy błędnie dopasowywał nazwę suite z „deletion”; niezależny peer wykrył to przed wykonaniem. Wykonany filtr wykluczył dokładnie trzy tytuły usuwania i zachował oba historyczne eksporty B14. Draft narzędzia i korekta są zachowane.

Testy wykonują rzeczywisty sanitizer, collector, paired owner builder, strict readReviewCards i owner leases. Mapy local/session oraz czas są syntetyczne; tylko downstream persist/notify dla writerów zastąpiono mockami i potwierdzono brak wywołań. Żaden writer/controller SRS nie jest wykonywany. Oba obszary gościa/konta, dane innych właścicieli, pełne raw snapshoty i stan po odmowie/zmianie ownera są sprawdzone; bez zapisów, remove, notify lub fetch. To lokalne dowody, bez prawdziwych kont, RLS/cloud-rights, UI/download lub reimport PASS. Nie uruchamiano Chrome, bo zmiana nie dotyczy UI.

Build korzysta ze świeżej kopii TEMP i istniejącego runtime. Pełny stderr C55 jest identyczny po jedynej zamianie45s→27.4s; x402-fetch/@base-org/account pozostają. Brak clean-install lub zamknięcia advisory. C50dependencydeferral zachowano bez nowych poll. Niezależny source triage wskazał kolejny kandydat: anulowanie Telegram może pozostawić busy logowania po normalnym return SDK z oauth error. Dowód wyłącznie źródłowy, runtimeUNVERIFIED; osobny follow-up, bez realnego logowania lub provider calls. Nie blokuje tej lokalnej delty eksportu. Consent/profile triage nie potwierdził nowej usterki; hipoteza fokusu pozostaje nieuruchomiona.

[Freeze201](../../../evidence/cycle-56/source-freeze.json) przejmuje wprost kompletny C55current196, bez suplementu.195wcześniejszych ścieżek pozostaje literalnych,1export jest kwalifikowany;13preserve=12literalnych+1kwalifikowany,17receipts zachowane. Aktualny before ma563wejścia, z czego562literalne po zmianie i1export kwalifikowany. Osobno zachowano historyczną różnicę jednego type-cast fixture C55 między tamtym buildem a repo, z rzeczywistym dowodem identycznego JS; nie jest nową zmianą C56. Następny bootstrap musi użyć kompletnego C56freeze201.

Autor produktu:c49_validation; autor fixture:c49_advisories; root:narzędzia/wykonanie/metadata i peer fixture; niezależny source/tools/fixture/raw:c49_dependency_review; niezależny PRODUCT/DATA:c49_advisories z wyłączeniem własnej fixture. Końcowy ledger otrzyma osobny postwrite peer. B05 i wszystkie40tasks obu backlogów zachowują szersze statusy. HEAD/branch/index zachowane; bez add/commit/push/deploy, produkcyjnych zapisów, migracji, sekretów, realnych profili, płatnych wywołań i kontaktów. AI/cloud writes HARD_OFF. [Dowody](../../../evidence/cycle-56/verification.json).
