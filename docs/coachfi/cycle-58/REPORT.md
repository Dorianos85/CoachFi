# C58 — semantyka dialogów zgód i wieku

Status: ACCEPTED_LIMITED_LOCAL_UNSTAGED. 19.10.2026 lokalnie; dorośli, Polska, PL/EN. Produkcja NO_GO.

Poprawiono trzy atrybuty w dwóch istniejących komponentach. ConsentManager pozostawia Radixowi wspólną parę ID/opis, usuwając wiszący dodatkowy odnośnik. ModeGate deklaruje aria-modal=true dla już modalnego okna. Nazwy i opisy były dostępne przed poprawką; nie stwierdzono utraty fokusu ani błędu czytnika ekranu. Wszystkie pozostałe bajty, callbacki, treści, reguła18+, zapisy i domyślnie wyłączone zgody zachowane.

| Sprawdzenie lokalne | Rzeczywisty wynik |
|---|---|
| Baseline Chrome | 0 PASS / 4 FAIL na wiszącym IDREF; cztery pełne obserwacje |
| Pierwsza acceptance | 2 Close PASS / 2 Save FAIL: wcześniej istniejący brak flagi modalnej wieku |
| Retest po fladze | Tylko 2 Save PASS; dwóch zielonych Close nie powtarzano |
| TypeScript | 2 przebiegi PASS, każdy567wejść,0drift; drugi po zmianie ModeGate |
| Nowe buildy TEMP | 2 PASS, każdy34strony/35tras,567pre/566post,0drift |
| Niezależne recenzje | 2 GO, 0 otwartych uwag; osobny ledger po zapisach |

Łącznie cztery różne zaliczone przypadki PL/EN: dwa zachowane Close i dwa końcowe Save. Historia obejmuje trzy przebiegi Chrome i10prób (4+4+2), bez automatycznych powtórek lub zmiany fixture. Bazowy Chrome używał zweryfikowanego buildu C57; nie jest trzecim nowym buildem C58. Nie dodawano testów Node powielających implementację.

Po Save fokus jest na niezaznaczonym potwierdzeniu18+, przycisk kontynuacji pozostaje wyłączony, Tab/Shift+Tab zawijają się w oknie. Po Close wraca ten sam trwały przycisk stopki. Te zachowania były poprawne już w bazowych obserwacjach; callbacków fokusu nie zmieniano. Brak flagi ModeGate był widoczny także w baseline i został ujawniony przez dalszą asercję po naprawie IDREF — nie był regresją. [W3C APG](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) opisuje flagę dla rzeczywiście modalnego okna i uwzględnia wcześniejszą izolację aria-hidden. [WAI-ARIA1.2](https://www.w3.org/TR/wai-aria-1.2/#idref_error_processing) wyjaśnia ignorowanie nierozwiązanych odniesień; nie twierdzimy, że poprzedni opis był nieobecny.

Świeże syntetyczne konteksty Chrome375×812: nazwy/opisy i wszystkie IDREF, klawiatura, domyślne4opcje=false, dokładny jeden zapis wymaganych zgód albo zero zapisów przy Close. Pozostałe7lokalnych i5sesyjnych kluczy zachowane wraz z125punktami; bez clear lub nieoczekiwanych usunięć. Pełny journal zachowuje wąski wyjątek sparowanych lokalnych testów dostępności storage z SDK. API0/pageErrors0, zewnętrzne żądania blokowane i liczone (tu0); nie jest to twierdzenie o całym ruchu sieciowym.

Dwa buildy zachowują ostrzeżenia x402-fetch/@base-org/account; pełny stderr C57→C58→Mode różni się tylko25.1s→25.8s→27.0s. Zależności C50 nadal odroczone bez nowego pollu lub clean-install PASS. Końcowy [freeze220](../../../evidence/cycle-58/source-freeze-mode.json) jest aktualnym carry:206wcześniejszych literalnych ścieżek i1kwalifikowany ModeGate; początkowy216 pozostaje historyczny.13preserve/19receipts/6pinów kontraktuSDK zachowane. Następny bootstrap ma użyć source-freeze-mode.json wprost, bez suplementu.

Autor produktu:c49_validation; fixture:c49_advisories; root:narzędzia/wykonanie/metadata i niezależny peer fixture; source/tools/fixture/raw:c49_dependency_review; PRODUCT:c49_advisories z wyłączeniem własnej fixture. Końcowy ledger sprawdzany osobnym addendum po zapisach. B07 i40tasks obu backlogów zachowują szersze statusy. HEAD/branch/index zachowane; bez add/commit/push/deploy lub zapisów produkcyjnych. AI/cloudwrites HARD_OFF. Bez AT/pełnegoWCAG/desktopu/innychlocale/real-auth/autorytatywnychzgódbackend/stagingu lub produkcyjnego PASS. [Dowody](../../../evidence/cycle-58/verification.json), [historia10prób](../../../evidence/cycle-58/behavior-delta.json).
