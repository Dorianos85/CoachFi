# C55 — dostępny onboarding i bezpieczna obsługa klawiatury

Status: ACCEPTED_LIMITED_LOCAL_UNSTAGED. Zamknięcie przygotowywane19.10.2026, zakres rozpoczęty18.10. Dorośli, Polska, PL/EN. Produkcja NO-GO.

Onboarding korzysta z istniejącego Radix, ma programową nazwę aktualnego kroku i widoczną, powiązaną etykietę imienia. Tab/Shift+Tab pozostają w modalu; początkowy fokus trafia do pola, potem do pierwszego celu. Close/Escape zamykają bez zapisu i bez oznaczenia ukończenia. Jawne Finish/Skip zachowują dotychczasowy payload, potwierdzenie zapisu i owner/error guards. Nie dodano danych, usług lub nowych zależności.

Test natywny wykrył dwa problemy pierwszej implementacji. Enter po zmianie kroku aktywował automatycznie pierwszy cel; anulowanie obsłużonego Enter usuwa tę akcję. ModeGate oddawał fokus do przycisku „Zmień tryb” poza dialogiem po otwarciu onboardingu; jego callback pomija przywracanie przy obecnym otwartym dialogu. Dekoracyjny ✓ nie zmienia już dostępnej nazwy celu, a aria-pressed nadal informuje o wyborze. Nowe oracles wymagają sześciu niewybranych celów przed jawną Space oraz prawidłowego fokusu po rzeczywistym wejściu przez polskie zgody i wiek.

| Bramka lokalna | Wynik |
|---|---|
| Baseline Node | 14 PASS / 4 FAIL;18przypadków |
| Pierwsza akceptacja Node | 18/18 PASS,4wcześniejsze błędy zamknięte |
| Po dwóch ustaleniach natywnych | 8/8 dotkniętych Node PASS,10niezmienionych celowo pominięto |
| Końcowy TypeScript | PASS,563wejścia,0drift; dwa wcześniejsze błędy typów fixture jawnie zachowane |
| Build | drugi PASS,34strony/35tras,563pre/562post; zachowane ostrzeżenia |
| Ostateczny Chrome | 2/2 PASS,worker1/retry0:PLFinish,ENSkip;oba kroki |
| Niezależne końcowe recenzje | 2 niezależne GO dla ograniczonego zakresu, 0 otwartych uwag; PRODUCT reviewer wyłącza własne fixture |

To20różnych zaliczonych przypadków:18Node i2Chrome. Po zmianie Enter ponowiono tylko8dotkniętych ścieżek; pozostałe10kontroli zachowano z poprzedniego zielonego przebiegu. Dwie późniejsze korekty typów fixture mają rzeczywisty dowód identycznego emitowanego JS i oddzielne retesty TS; nie ponawiano przez nie zielonych Node. Wykonano3przebiegi Vitest z baseline,4TS (2błędy fixture/2PASS) oraz2buildy aplikacji. Drugi build wynikał z poprawki produktu, bez trzeciego przez adnotację typu. Pełny stderr buildu różni się wyłącznie25.5s→45s; x402-fetch/@base-org/account pozostają.

Chrome miał4przebiegi/7prób,0automatycznych retries: pierwszy PLbaseline timeout to błąd fixture z nieaktualnym plBase, skorygowany dokładnie4tekstami z efektywnego merge; ENbaseline rzeczywiście wykazał brak nazwy. OsobnyPLbaseline retest wykazał ten sam brak. Pierwsza implementacja spowodowała oba rzeczywiste90s timeouty opisane wyżej. Ostatnie2próby PASS zamykają je na aktualnym v4. Wszystkie raw i pierwotne spec są zachowane; nie są to7zielonych testów.

Node wykonuje prawdziwy komponent, saveUser i owner handles na syntetycznych magazynach z jawnym emulatorem hooków oraz markerami Radix/Motion. Natywny fokus pochodzi wyłącznie z Chrome. Chrome375×812 używa świeżych syntetycznych profili, aktualnego buildu TEMP i prawdziwego shella. Sprawdza nazwę/etykietę po wpisaniu, oba kierunki trapu na obu krokach, brak niezamierzonego wyboru, Close/Escape, zablokowane zamykanie przez tło, jawne zapisy i reload. Przed zapisem profil pozostaje niezmieniony;125punktów, postęp i osobna sesja są zachowane. API0/pageErrors0, głos nie jest wywoływany; externalblocked nie oznacza totalnetwork0.

Pełny journal set/remove zachowano. Monitorowane6lokalnych/3sesyjne klucze mają ścisłe oracles; wyjątek dotyczy tylko potwierdzonych źródłowo, ściśle sparowanych lokalnych lswt probes dostępności magazynu spoza tych kluczy. Inne lub niesparowane usunięcie nadal powoduje błąd. Zmiana nie jest testem autoryzacji Supabase/cloud.

Aktualna kopia buildu zachowuje pierwotny Nodefixture976, a repo ma d901 po jednym erased return-cast. Rzeczywisty JS jest identyczny; browser wrapper kwalifikuje dokładnie tę jedną ścieżkę,0niekwalifikowanych różnic i0różnic snapshotu. Produkt/E2E/config odpowiadają buildowi. Autorytatywny [freeze196](../../../evidence/cycle-55/source-freeze-current.json) zawiera6product/fixture/config+12narzędzi+178wcześniejszych literalnych ścieżek. Trzy wcześniejsze C55freezes zachowano historycznie. Następny cykl musi użyć kompletnego source-freeze-current.json, bez suplementu.557/560oryginalnych wejść literalnych+3kwalifikowane pliki produktu;13preserve/16receipts zachowane.

Autor produktu: c49_validation; autor fixture: c49_advisories; root: narzędzia i wykonanie, peer fixture/source; niezależny source/tools/fixtures/raw: c49_dependency_review; niezależny PRODUCT/PLEN: c49_advisories z wyłączeniem przyjęcia własnych fixture. Autor nie zatwierdza własnej zmiany. Każdy nowy helper otrzymał statyczny GO przed wykonaniem; pełna historia uwag i korekt pozostaje. Finalny ledger wymaga osobnego postwrite addendum.

Ograniczenia: dwa mobilne przebiegi, bez pełnej macierzy2×2, desktop/AT/czytnika ekranu lub pełnegoWCAGAA. Nowe znaczenie etykiet przyjęto tylkoPL/EN; nie9locale. Brak cleaninstall, rzeczywistych kont/staging/RLS/cloud-rights lub produkcyjnego PASS. B07 i40tasks obu backlogów zachowują szersze statusy pending. AI/cloudwrites HARD_OFF; bez add/commit/push/deploy, nowych danych, migracji, produkcyjnych zapisów, sekretów, płatnych/provider calls lub kontaktów.

Źródła sprawdzone w zakresie wzorca: [WAI modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog). Online docs pokazują1.2.0, lokalny1.3.1 sprawdzono w zainstalowanym źródle; nie zakładano zgodności wersji. [Dowody](../../../evidence/cycle-55/verification.json).
