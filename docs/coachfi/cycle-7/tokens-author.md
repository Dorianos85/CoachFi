# B17 — walidacja liczbowych tokenów

14.10.2026, autor `architecture_audit`, niezależny recenzent `curriculum_pilot`; root integruje `QuizCard`, UX recenzuje UI. Kod zamrożony do niezależnej recenzji, bez self-approval. Zmieniono wyłącznie aplikacyjny `lib/tokens.ts`; testy i dowody w przydzielonym zakresie. Bez instalacji, usług, realnego storage, push/deploy lub full gates.

## Baseline i zmiana

Syntetyczny baseline starego źródła SHA256 `3FDBF1D29BCBC5E145E6F4F4D7BE7ADFBC2E9AFBCD6DDA21988930E89ED87AA9` potwierdził9 przypadków: `spendTokens(-10)` zmieniał100 na110; addNaN/addInfinity zapisywały niepoprawne saldo, spendNaN zwracał sukces z rawNaN; parseInt przyjmował `123junk`, ujemne lub unsafe liczby i zastępował `garbage` saldem125. Kolejny award zamieniał `123junk` na124, tracąc oryginalne bajty. **9/9 PASS19:27:16** oznacza odtworzenie tych błędów, nie akceptację. Baseline test source/hash i wynik zachowano oddzielnie w `evidence/cycle-7/token-author-baseline.json`; wcześniejszy sandbox EPERM zakończył się przed importem/0tests i nie jest wynikiem aplikacji.

Nowy odczyt przyjmuje wyłącznie canonical unsigned decimal0..MAX_SAFE_INTEGER; round-trip `String(balance)===raw` dodatkowo odrzuca końcowy newline dopuszczany przez kotwicę `$` JavaScript. Brak klucza nadal daje125, bez inicjalizującego zapisu. Stary/uszkodzony raw, blocked read lub stale handle daje odczyt0; dokładne bajty nie są naprawiane ani usuwane. Operacja na takim saldzie jest odmówiona również przy kwocie0.

Kwota musi być liczbą runtime, finite i nieujemną, następnie zachowane `Math.round` wyznacza bezpieczną całkowitą deltę. Dodawanie sprawdza bezpieczny wynik, wydawanie porównuje saldo z zaokrągloną deltą. Zero i rounded-zero są poprawnym no-op tylko przy aktualnym, prawidłowym saldzie: bez write/token event/notify/persist. `addTokens` rzuca eksportowany `TokenMutationError` dla invalid amount/malformed balance/blocked read/overflow; stale zachowuje dotychczasowy `assertCurrentPersonalStorage` i błąd `Storage session changed`. `spendTokens` zwraca false przy odmowie. Faktyczny quota error zapisu propaguje, bez udawanego sukcesu.

## Interfejs preflight i testy

`canAwardTokens(amount, storage = captureCurrentPersonalStorage()): boolean` jest czystą kontrolą przed poprawną odpowiedzią i `recordAnswer`: bez zapisu, token events, reward notifications lub persistence. Zwraca false przy niepoprawnej kwocie/saldzie, read error, zmianie właściciela lub overflow; root używa przechwyconego handle. `onReward` zachowuje dotychczasowy kontrakt void. Preflight nie jest transakcją ani rezerwacją salda.

Po pierwszym freeze wykonano tylko `node node_modules/vitest/vitest.mjs run tests/cycle7-tokens-author.test.ts`: 69/69 PASS19:38:46. Root wykrył materialny B17-A01: początkowa poprawka rozszerzyła positive write/notify/persist poza dawną granicę browser-only. Poprawiono wyłącznie własne pliki: dodatni preflight i spend bezwindow odmawiają, add rzuca `TokenMutationError`; healthyzero nadal jest no-op. Dwa nowe testy sprawdzają aktualny explicit handle bezwindow:0write0notify0persist i malformedzero refusal. Nie przywrócono permissive parseInt ani repair fallbacku.

Po nowym freeze końcowy własny retest tego samego pliku: **71/71 PASS,1 plik, Vitest4.1.11,19:42:04 Europe/Warsaw, exit0**. Syntetyczne storage handles i event/sync spies, bez połączeń lub actual browser storage. Sprawdzono typy bez koercji, malformed raw i dokładne zachowanie bajtów, granice safe integer, rounding i insufficient balance, stale/read/write/event/notify/persist reentry oraz quota. Wcześniejsze69 jest zachowaną bramką pośrednią, nie końcowym wynikiem. Nie wykonano pełnego suite/typecheck/build/E2E; te bramki i niezależny werdykt należą do roota/recenzentów.

| Zamrożony plik | SHA256 |
|---|---|
| lib/tokens.ts | B81F83F47769A5CC139B024D5AA5E3DE679181081A4004240E9A4AE0DC53623A |
| tests/cycle7-tokens-author.test.ts | 0C703B1985C1BF98063701252F63A900DE6E9509AFADCC8F004570B9F19502DA |

Wynik i zakres: `evidence/cycle-7/token-author-acceptance.json`. B15 automatic cloud writes i health local-only pozostają bez zmian. Nie dodano danych, formatów ani dostawców. Punkty nie oznaczają pieniędzy lub prawa do wypłaty.

## Ograniczenia

Nie zapewnia atomowości/rollback między SRS, tokenami i powiadomieniami; fizyczny zapis może zakończyć się przed zmianą właściciela, co suite jawnie odtwarza bez sukcesu. Brak CAS/lock między kartami i ochrony przed dowolnym kodem tego samego origin. Nie zweryfikowano realnych kont, RLS/staging ani produkcji. Guardy dotyczą token effects; owner bootstrap i przyszłe custom callbacks mają własny zakres. Author PASS nie jest niezależną akceptacją lub zgodą na release.
