# C57 — formularz dostępny po anulowaniu Telegram

Status: ACCEPTED_LIMITED_LOCAL_UNSTAGED. 19.10.2026 lokalnie. Dorośli, Polska, PL/EN; produkcja NO_GO.

Po normalnym zakończeniu oczekiwania na Telegram formularz zwalnia busy i pozwala świadomie ponowić próbę albo wybrać e-mail. W zainstalowanym CDP0.0.127 zamknięty lub zablokowany popup może dać null, a core ustawia OAuth error i normalnie zwraca undefined. Wcześniej SignInGate czyścił busy wyłącznie po throw, więc anulowanie pozostawiało wszystkie metody wyłączone.

Zmiana to jedna linia po await: warunkowe setBusy(null) wyłącznie dla Telegram. Pozostałe bajty pliku są literalne, CRLF350→351. Zachowano catch, Google/Apple/X i ich fulfilled redirect busy, e-mail/OTP, copy, wymagania logowania, dostawców i konfigurację. Normalny Promise<void> nie rozróżnia anulowania od zakończenia SDK — cleanup nie oznacza zalogowania, nie ustawia signedIn, nie dismissuje żądania i nie przyznaje własności danych. Dotychczasowy hook signedIn nadal kontroluje widoczność.

| Bramka lokalna | Wynik |
|---|---|
| Baseline nowych16 | 10 PASS / 6 FAIL / 0pending; retry, e-mail i ponowne otwarcie × PL/EN |
| Te same16 po zmianie | 16 PASS; wszystkie6 wcześniejszych porażek zamknięte bez zmiany fixture |
| Historyczne C21/C22 | 19 normative PASS / 2 świadome diagnostic SKIP;21reported |
| Jeden TypeScript | exit0,565wejść,0drift;bez korekty lub retestu |
| Jeden TEMP build | PASS,34strony/35tras,565pre/564post,0drift;ostrzeżenia zachowane |
| Niezależne końcowe recenzje | 2 GO dla ograniczonego zakresu, 0 otwartych uwag; PRODUCT reviewer wyłącza własną fixture |

Łącznie35zaliczonych instancji w2udanych przebiegach Node:16nowych+19historycznych. Baseline jest osobny. Trzy niezależne montaże kontrolek Google/Apple/X tworzą jeden grupowy przypadek na język; wieloetapowy OTP również liczy się jako jeden. Dwa świadomie pominięte stare diagnostyki dotyczą nieustalonej polityki nonzero-unknown; nie zmieniano tej polityki i nie nadano jej PASS. Pozostałych zielonych testów nie powtarzano.

Test wykonuje rzeczywisty SignInGate i rzeczywiste request/dismiss/subscribe oraz guest ownership na syntetycznych Mapach local/session. Emulator zachowuje state/effects; sześć tur mikrozadań i renderowania obsługuje rzeczywiste wrappery onClick zwracające void. Cały moduł CDP zastąpiono lokalnymi hookami przed importem SDK. Deferred Promise<void>.resolve(undefined) modeluje źródłowy kontrakt anulowania; wywołania OAuth/e-mail/OTP widoczne w timeline są wyłącznie jawnie przygotowanymi funkcjami fixture. Nie są to prawdziwe prośby do dostawców lub dowód logowania.

[Porównanie zachowania](../../../evidence/cycle-57/behavior-delta.json) zachowuje32timelines i sześć zmienionych stanów: cztery przyciski social i przycisk e-mail stają się dostępne, żądanie pozostaje otwarte, signedIn=false i brak komunikatu sukcesu. Retry uruchamia drugi adapter dopiero po jawnym kliknięciu; alternatywny e-mail przechodzi do dotychczasowego formularza kodu. Zamknięcie podczas oczekiwania nadal tylko zamyka; zakończenie nie otwiera go samo, a jawne ponowne otwarcie jest dostępne. Raw obu obszarów, owner i zapisane dane pozostają literalne;0write/remove/persist/notify/fetch.

Kontrole zachowują błąd i świadomy retry, dotychczasowe email/OTP oraz warunki initialized/signedIn. Boolean signedIn i mocked OTP completion to wejścia testowe, bez weryfikacji prawdziwej tożsamości. Probes wyłączonych handlerów używają wyłącznie callbacków po renderze. Nie są dowodem natywnej klawiatury/fokusu/disabled dispatch, hydration, prawdziwego popupu, redirectu, stale-callback lub unmount/session races. Nie wykonywano Chrome ani wywołań SDK/providerów.

Build korzysta ze świeżego TEMP i istniejącego runtime. Pełny stderr C56 jest identyczny po jedynej zamianie27.4s→25.1s; x402-fetch/@base-org/account pozostają. C50dependencydeferral historyczne bez poll, bez clean-install/advisory closure. [Freeze207](../../../evidence/cycle-57/source-freeze.json) przejmuje wszystkie201wcześniejszych ścieżek literalnie; SignInGate wcześniej nie był w tej liście.13preserve/18receipts i6publicznych pinów kontraktu SDK/providers są literalne.563/564 dawnych aktualnych wejść zachowano,1SignInGate kwalifikowano; następny bootstrap MUSI użyć kompletnego C57freeze bez suplementu.

Autor produktu:c49_validation; autor fixture:c49_advisories; root:narzędzia/wykonanie/metadata i peer fixture; niezależny source/tools/fixture/raw:c49_dependency_review; niezależny PRODUCT/behavior:c49_advisories z wyłączeniem własnej fixture. Osobny postwrite ledger peer jest wymagany. B04 i wszystkie40tasks obu backlogów zachowują szersze statusy. HEAD/branch/index zachowane; bez add/commit/push/deploy, migracji, produkcyjnych zapisów, realnych sesji/profili/sekretów, płatnych/provider calls lub kontaktów. AI/cloud writes HARD_OFF. Real-auth, staging i produkcyjne wydanie pozostają nieprzyjęte. [Dowody](../../../evidence/cycle-57/verification.json).
