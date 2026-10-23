# Cykl 8 — niezależna recenzja wyników zapisu quizu

14.10.2026, `/root/ux_audit`. **LIMITED ACCEPT LOCAL UI SAVE OUTCOMES** dla QuizCard i strony quizu w zakresie B18. Własne **18/18 synthetic acceptance PASS**, bez zmian aplikacji przez recenzenta. Browser wykonany przez root: pierwsze10 PASS/2 FAIL i końcowy retest2/2 PASS po niezależnie przyjętej korekcie locatora; historia pozostaje odrębna. Build/parity roota są jeszcze pending. Produkcja pozostaje **NO-GO**; to nie zatwierdzenie stagingu, chmury lub transakcji wielopolowej.

[Actual component cases](../../../tests/cycle8-quiz-review.test.ts), [raw wynik](../../../evidence/cycle-8/ui-review-targeted-tests.json), [dowody i pełne fingerprinty](../../../evidence/cycle-8/ui-review-final.json), [E2E4](../../../tests/e2e/quiz-save-failure.spec.ts). Użyto frontend-quality, data-integrity oraz React best practices. Autor helpera, autor TSX i niezależni recenzenci pozostają rozdzieleni.

## Baseline i przyjęty kontrakt

[Baseline](../../../evidence/cycle-8/ui-review-baseline.json) jest **source-only**, nie runtime reprodukcją. Odczytano wyłącznie dwa wybrane pliki z indeksu Git. Stary QuizCard zapisywał SRS i ustawiał submitted przed callbackiem nagrody; strona aktualizowała saldo po powrocie `addTokens`. Kolejność nie obsługiwała jawnie późniejszego write-then-throw jako niepewnego wyniku. Hash odczytu UTF-8 i offsets są w dowodzie; nie wykorzystano rzeczywistych danych lub kont. C7 preflight pozostaje przyjętą wcześniejszą granicą walidacji, a nie dowodem atomowości.

Finalny controller ma stable lazy `useState`, version/ticket oraz synchroniczne in-flight/committed/blocked admission. Callback SRS korzysta z traced storage. `saved` pozwala dopiero na submitted/feedback/rewarded/completion. Błąd przed jakimkolwiek wywołaniem mutation method daje `retryable`; próba writer+exception/refusal daje `uncertain`, nawet gdy nie wiadomo, czy zmieniła bajty. Niepewny wynik blokuje radio i submit, nie pokazuje sukcesu/next i oferuje jawny reload. Stary ticket/owner jest odrzucany przed nowym preflight lub działaniem.

Po `saved` root dodatkowo odświeżył ticket, aby pre-save radio callback nie mógł zmienić zaznaczenia i zamienić poprawnego feedback na błędny. Next/retry/restart i layout reset/cleanup również zmieniają ticket. Normalne nagrody25/25/20, starter125 i treści C6 nie zmieniły się.

## Własne niezależne przypadki

Rzeczywiste funkcje QuizCard i Page uruchomiono z persistent mock hook slots, porównaniem dependencies oraz wykonaniem przechwyconych layout cleanup. Controller, SRS, tokens i ownership to rzeczywiste importy. Storage to wyłącznie Map; fetch jest zabroniony. **Nie jest to React DOM, StrictMode lub concurrent-render test.** Piętnaście przypadków dotyczy QuizCard, trzy osobno wywołują callbacki z rzeczywistej funkcji strony. Render TokenRewardCard oceniają tam props, nie przeglądarkowe piksele lub header.

| Granica | Sprawdzony wynik |
|---|---|
| PL/EN, jednorazowy blocked SRS read po wyborze B | Dokładny retryable alert, zero mutation calls i identyczne bajty125/brak SRS; jawne ponowienie daje150, jedno SRS repetitions1 i reward25 raz. |
| PL/EN, token writer zmienia150 i rzuca | Dokładny uncertain komunikat, locked radio/submit, brak feedback/next/completion; captured oraz nowy submit nie zapisują ani nie przyznają ponownie nagrody. |
| SRS writer odmawia przed zmianą bajtów | Próba metody wystarcza do uncertain; brak SRS i saldo125 nie oznaczają bezpiecznego automatycznego ponowienia. |
| Późniejszy token event rzuca | SRS i token150 pozostają; uncertain i brak replay/sukcesu. |
| Synchroniczny submit reentry i captured duplicate | Jeden SRS, jedna nagroda25, saldo150. |
| Locale, nowy owner i layout disposal | Stary ticket/captured callback nie zapisuje ani nie publikuje completion; zmiana ownera resetuje alert i nie dotyka salda77/SRS B. To syntetyczna zmiana ownera, nie login. |
| Późniejsza korupcja salda po saved lub uncertain | Stary submit nie zastępuje wyniku nowym preflight alertem, nie daje nagrody i nie zmienia bajtów. |
| Ostatnie pytanie, token20 zapisany i wyjątek | Po25/25/20 raw195 i trzy SRS pozostają, lecz **zero completion**, brak feedback oraz ponownej trzeciej nagrody. Ten case jest PL; pozostałe dwie klasy alertu wykonano w PL/EN. |
| Captured radio/next/retry | Stary radio nie zmienia saved feedback; double captured next przesuwa tylko do lifestyle. Wrong-answer retry otwiera jeden nowy ticket, a stary retry po correct save nie usuwa sukcesu. |
| Actual Page issue callback | Odczytuje pozostałe saldo, zeruje solved/quizDone i odświeża reader event bez nowych writes/reward. Stary callback po owner B jest inert. |
| Actual Page markActive throw/reentry i refresh event throw | Zapisane150 pozostaje; brak przedwczesnego sukcesu karty. Readonly resync nie replayuje reward; błąd refresh event jest obsłużony. Reentry ownera zatrzymuje stare setState i nie dotyka B. |

**C8-UI-01 zamknięty** po niezależnym syntetycznym acceptance finalnych źródeł: helper `9f680d1c…`, QuizCard `146cd57d…`, Page `0c560c64…`. Own fixture przy wykonaniu18 miał SHA `9696a598…`; końcowy whitespace-only SHA to `70c34c2c…`, opisany poniżej. Wszystkie pełne SHA są w JSON. Nie ma otwartego materialnego findingu UI na przyjętym zakresie.

## Odczyt jakości TSX i adaptacji starego mocka

React best practices: controller inicjalizuje się leniwie, jest przechowywany w stanie komponentu i nie powstaje ponownie podczas renderów; ticket jest jawny. Hooks mają stałą kolejność. Layout dependencies obejmują locale/pool/storage/controller, cleanup unieważnia wcześniejsze zamknięcia. Handlery sprawdzają owner/ticket przed działaniem; retryable i uncertain mają role alert, a uncertain także disabled radios/submit i przycisk reload. Nie dodano nowego pobierania danych, SDK lub bibliotek. Callback markActive poprzedza oznaczenie sukcesu strony i ma guard po powrocie. To ograniczona recenzja źródła i fixture lifecycle, bez pełnej oceny WCAG lub harmonogramu React.

Odczytano root-owned adaptację `cycle7-quiz-author.test.ts`: mocked recordAnswer deleguje do traced `setItem`, a window jest EventTarget stubem. Cztery poprzednie fake handler oracles zachowano; delegacja spełnia nowy kontrakt controllera, bez udawania rzeczywistego SRS/storage. Wykonanie tych czterech przez root nie jest częścią własnych18. Recenzent nie zmieniał fixtures C6/C7 ani nie ponawiał wcześniejszych73 numeric cases.

## Browser fixture i oczekujące bramki

Nowe **4 cases**, dwie klasy po PL/EN, używają fresh synthetic guest/adult18/required consent oraz blokady ruchu poza localhost. Fault uzbraja się dopiero po renderze i wyborze B. Native Storage getter blokuje raz odczyt SRS, albo setter zapisuje token150 i dopiero potem rzuca. To testowe instrumentowanie, nie nowa funkcja produktu. Voice/AI/Web3/leaderboard są wyłączone; nie ma rzeczywistych kont, profili, providerów lub audio.

Pierwsza klasa kontroluje zero mutation calls przed błędem i explicit retry150/oneSRS. Druga kontroluje karta+header150, uncertain lock, brak feedback/next/ukończenia, brak dodatkowego zapisu po native form dispatch oraz explicit reload: lifestyle jako następne pytanie, identyczne token/SRS bytes bez replay. Alert sprawdza się w jego komunikacie `p`, ponieważ ten sam role alert zawiera też przycisk reload. Saldo karty ma scoped locator h3 → karta → pojedynczy `p.text-5xl`; header jest osobnym odczytem. Brak100 na pierwszym pytaniu jest ograniczonym browser oracle, uzupełnionym własnym ostatnim-question failure case powyżej.

Root przyjął pierwotny fixture i wykonał4 nowe oraz6 dotkniętych C6 i2 C7, łącznie12 browser cases: **10 PASS / 2 FAIL**. Obie porażki dotyczyły wyłącznie ostatniego globalnego `page.getByRole("alert")` po reloadzie. Według kontrolowanego trace DOM root był to `DIV#__next-route-announcer__`, `role=alert`, `aria-live=assertive`, visually hidden, poza app-shell/main; inline quiz alert nie występował. Lifestyle, saldo150 i zachowanie identycznych token/SRS bytes przeszły przed tą kontrolą. To **C8-TEST-01 — błąd zakresu reviewer fixture**, nie zmiana aplikacji.

Pierwszy [raw wynik](../../../evidence/cycle-8/playwright-initial-tests.json) pozostaje zachowany:10 expected/2 unexpected/0 skipped/flaky,125 918,414 ms. Stary E2E SHA `84d7a038…` i pierwszy snapshot/manifest są historyczne. [Dowód exact delta](../../../evidence/cycle-8/ui-review-browser-locator.json) odtwarza ten SHA po cofnięciu wyłącznie ostatniego locatora. Nowy fixture **`004debaf…`** wskazuje pojedynczą `.focus-card` zawierającą `input[name="lifestyle-inflation"]`, sprawdza count1 i następnie jej alert count0. Wszystkie salda, raw bytes, mutation counts, SRS/no-replay oraz pozostałe scenariusze pozostają identyczne. Nie wnioskujemy stąd o braku alertów na całej stronie ani pełnym a11y acceptance.

**C8-TEST-01 zamknięty po niezależnym przyjęciu korekty i retest.** `architecture_audit` niezależnie odtworzył dawny hash przez dokładne cofnięcie zmiany i przyjął scoped oracle: [review](../../../evidence/cycle-8/e2e-locator-fix-review.json). Root wykonał **wyłącznie dwa** nieudane PL/EN cases: [raw retest](../../../evidence/cycle-8/playwright-retest-tests.json), **2/2 PASS, 0 failed/skipped/flaky, 42 317,814 ms**, final TEMP `coachfi-cycle8-verify-NuE4W1`. Pierwszych10 zielonych nie ponowiono. Łącznie12 odrębnych scenariuszy przyjęto w dwóch wykonaniach; nie deklarujemy pojedynczego run12/12.

Browser execution, czas i zamknięcie portu43191 przez host probe należą do root. Recenzent nie uruchamiał browsera, serwera, pełnej suity, typecheck lub buildu, nie zmieniał starego TEMP i nie ponawiał własnych18. `coordinatorChecks` zapisuje te wyniki oddzielnie; build/parity pozostają pending. Końcowe uzupełnienie było wyłącznie księgowością statusów, bez zmian aplikacji/testów lub fingerprintów; własne18 zachowano exact. Produkcja nadal NO-GO.

Późniejszy scoped diff check wykrył blank EOF w unit fixture. Root usunął **wyłącznie pojedynczy końcowy LF (0x0a)**: [proof](../../../evidence/cycle-8/ui-fixture-eof-normalization.json). Recenzent niezależnie dodał jeden LF w pamięci do końcowego pliku `70c34c2c…` i odtworzył dokładnie tested SHA `9696a598…`. Zaktualizowano tylko unit fingerprint i provenance; brak zmian wykonywalnej logiki/oracles lub aplikacji. Własnych18 i aggregate906 nie ponawiano z powodu tej korekty whitespace. Pozostałe fingerprinty, w tym E2E `004debaf…`, pozostały bez zmian; final build/parity koordynatora jest odrębną bramką.

## Granice przyjęcia

Quarantine jest w RAM i dotyczy aktywnego ticket. Reload/locale/restart tworzą nowy kontekst i odczytują pozostawione dane; **nie są trwałym journalingiem, odzyskaniem lub exactly-once ledger**. Patch nie cofa częściowych SRS/token/streak writes. Probe sprawdza dostęp, nie naprawia permissive SRS JSON/schema; połknięty późniejszy read error z próbą writera jest uczciwie uncertain. Readonly refresh event może zawieść i nie zapewnia aktualizacji każdego consumer UI. Własne mapy i hook slots nie potwierdzają real auth/RLS, stagingu, chmury/CAS lub konkurencji wielu kart. B15 automatic cloud writes oraz zewnętrzne AI pozostają off. Produkcja **NO-GO**.
