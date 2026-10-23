# C62 — niezależna recenzja PRODUCT

Zakres recenzji obejmuje kod produktu autorstwa `c49_advisories`, zainstalowany kontrakt CDP, PL/EN, lifecycle oraz zapisane wyniki produktu. **Wyłączone:** zatwierdzanie własnego fixture, designu fixture, korekty preexec, emulatora, adapterów i oracle. Ich przyjęcie należy do roota i `c49_dependency_review`.

## Stage 1 — zastosowane źródło i baseline

**GO źródłowe, 0 uwag blokujących. Acceptance pozostaje pending.** Pierwszy formalny odczyt tej recenzji nastąpił po zastosowaniu kodu; nie deklaruję własnego pre-apply GO.

Aktualny `AppNavigation.tsx` ma SHA `c264ebbdfb64b382eac873507d333b1bcfcdde1ddc385adfd94850a303a9984c` i jest bajtowo równy `fullAfter` propozycji `5edddc16…`. Dokładnie trzy mapowania odtwarzają całe nowe źródło i odwrotnie całe stare `0ff32e45…`; 1017 CRLF, bez lone LF. Dziewięć rekordów ACCOUNT_COPY, zwykły przycisk logowania i pozostały shell zachowane literalnie.

Próba jest rejestrowana przed synchronicznym odłączeniem konta. Własna zmiana account→guest nie anuluje próby przed przechwyceniem gotowego snapshotu gościa. Następnie mount, próba i dokładny snapshot są sprawdzane przed niezmienionym `signOut()`. Późniejsza zmiana generacji właściciela, również realne `endLearningSession()` z efektu signed-out AccountSync, wycofuje pending/error; opóźniony wynik nie przywraca konta ani nie nadpisuje nowszego widoku. Cleanup unieważnia generację i usuwa subskrypcję.

Pending ma zablokowany przycisk, aria-busy i widoczny status. Błąd ma neutralny alert PL/EN i jawne ponowienie, bez szczegółów SDK. Wynik `Promise<void>` nie ustawia samodzielnie prawdy o zalogowaniu. Zainstalowany CDP core tłumi błąd zdalnego logout i czyści stan lokalny w finally: fulfilled nie potwierdza zdalnego unieważnienia sesji. Nie zmieniono polityki SDK ani provenance jego zdarzeń.

Odczytano raw baseline: **16 przypadków = 4 PASS / 12 FAIL / 0 pending**, 16 linii obserwacji, 574 wejścia, 0 dryfu, runtime equal. W PL i EN świeży render gościa pozwalał na dwa wywołania SDK podczas oczekiwania. Odrzucona obietnica nie dawała alertu ani faktycznego retry. Stary callback A w tym samym obrocie był już blokowany przez storage.isCurrent — to istniejący pozytywny guard. Wszystkie 12 pierwszych błędów dotyczą braku pending UI; nie jest to 12 odrębnych historycznych luk. Zatwierdzanie mojego generatora tych obserwacji pozostaje wyłączone.

Freeze `aab273ea…`: 250 unikalnych pinów = 2 nowe source/fixture + 4 tools + 244 literalne prior. Z 245 poprzednich pinów jedynie AppNavigation ma jawny kwalifikowany delta; 13 preserve, 23 receipts i 15 SDK pinów zgodnych. Stare 573 wejścia obejmują 572 literalne i jedną kwalifikację; bieżący runner ma 574. Cały odczytany zestaw pinów: 0 niezgodności.

Odczyt narzędzi potwierdza bezpośredni wybór tych samych 16 przypadków, one-shot receipts, porównanie tytułów, granice TEMP i runtime oraz wyłączenie kluczy providerów. Sam nie uruchamiałem narzędzi ani aplikacji. Wyniki acceptance, TS/build oraz przyszłe metadata i ledger nie są jeszcze zatwierdzone. Brak natywnego browser/AT, realnego SDK, konfiguracji, konta lub revocation PASS. AI/cloud HARD_OFF, produkcja NO_GO.

## Stage 2 — odczytane acceptance i TypeScript

**GO dla zapisanych wyników produktu w jawnym zakresie mocków, 0 uwag blokujących.** Własny fixture, design, korekta preexec, emulator/adapters/oracle nadal wyłączone z zatwierdzania. Stage 1 i cały poprzedni tekst Markdown zachowane.

Te same 16 przypadków: baseline 4 PASS / 12 FAIL, acceptance **16 PASS / 0 FAIL / 0 pending**, bez zmiany fixture. To 16 odrębnych przypadków i 32 wykonane instancje w dwóch przebiegach. Każdy raw stdout ma 16 obserwacji: 8 tablic zawierających 32 zagnieżdżone wiersze oraz 8 pojedynczych obiektów, razem 40 rekordów szczegółowych. Historyczne `groupedScenarioRows=40` w zamrożonym designie jest luźnym określeniem; nie oznacza 40 zagnieżdżonych wierszy ani przypadków.

Odczyt raw potwierdza w PL/EN pending/disabled/aria-busy, SDK2→1 przy świeżym renderze gościa, neutralny alert i faktycznie wywołane ponowienie. Fulfilled nie zmienia samodzielnie signedIn=true. Zmiana samej flagi SDK i realna rotacja guest przez endLearningSession mają odrębne wyniki: pierwsza zachowuje bieżący feedback, druga wycofuje go do idle. Nowe A/B przed SDK dają 0 wywołań; po wejściu w SDK pozostaje jedno przyjęte wywołanie bez późnego nadpisania nowego widoku. Unmount: aktualizacje 1→1 po settle. Raw lokalne i sesyjne pozostają literalne, ślady zapisów puste.

Acceptance i jeden TypeScript: po 574 piny, 0 dryfu, runtime equal; TS child/runner exit 0, stderr pusty. Produkt nadal c264… . TEMP build i metadata/ledger pozostają pending w tej fazie. Brak native/SDK/provider/remote-revocation PASS; reviewer niczego nie wykonywał.

## Stage 3 — końcowe PRODUCT GO i plan zapisów

**FINAL LIMITED LOCAL PRODUCT GO, 0 uwag blokujących. JSON i Markdown zamrożone po tej dopisce.** Poprzednie dwa etapy i cały prefix Markdown zachowane. Wyłączenie własnego fixture/designu/korekty preexec/emulatora/adapters/oracle pozostaje pełne; root i niezależny primary zatwierdzają tę część.

Odczytano rzeczywisty build PASS: 34 strony / 35 tras, 574 pre / 573 post, 0 dryfu current/snapshot, runtime equal. Child stdout/stderr i hash są zgodne z receipt. Pełny stderr C61 odtwarza bieżący stderr po jednej zmianie 32.0s→25.0s; ostrzeżenia x402-fetch i @base-org/account pozostają. Wraz z niezmienionymi 16 PASS, jednym TS i wcześniejszą analizą źródła daje to ograniczone przyjęcie lokalnego zachowania produktu; nie daje native, real SDK/provider ani revocation PASS.

Behavior delta 206f14ec…, końcowy draft REPORT 74ec42d8… i verification fe2aec10… odpowiadają raw i ograniczeniom. Dokładny plan metadata b4d51f31… obejmuje dziewięć przyszłych zapisów. Zweryfikowano wszystkie fullBefore/fullAfter i ich hashe oraz to, że aktualne pliki nadal równały się fullBefore przy odczycie. Raport zmienia tylko status i wiersz review; verification tylko status. Pięć rejestrów zachowuje całe stare prefixy. Wszystkie nowe linki raportu, w tym dwa z workspace, rozwiązują się do repo REPORT. Dwa backlogi zachowują dokładne surowe tablice 40 zadań i wszystkie stare pola poza active_cycle; jedynym nowym polem jest cycle62_cdp_logout_patch. Nie zamyka to globalnych zadań.

To przyjęcie dokładnego planu, nie jeszcze dowód wykonania dziewięciu zapisów. Actual metadata, hygiene, receipt, pointer oraz późniejsze closure wymagają nowego odrębnego addendum. Po tym końcowym review nie są potrzebne dodatkowe app checks. Sam nie wykonywałem aplikacji ani testów. AI/cloud HARD_OFF, produkcja NO_GO.
