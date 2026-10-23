# C18 — inwentaryzacja osobnego emergency-first-milestone

Autor: `daily_author`, 2026-10-15. **Inwentaryzacja i draft; zero zmian źródeł, testów lub helpers.** Nie rozszerzamy trzech ID i 70 punktów C17.

Istniejący `emergency-first-milestone` występuje jednokrotnie w `quizQuestions` i w kanonicznej sumie pytań, z kluczem **B** i nagrodą **25**. Nie jest rekordem challenge ani elementem któregokolwiek `STAGE_QUESTION_IDS`. Bank zachowuje 62 pytania quizowe + 20 challenge = **82 unikalne ID**; liczba zapisanych modułów lekcji pozostaje siedem.

Pełne before dwóch potencjalnie zmienianych źródeł — `data/quizQuestions.ts` i `lib/allQuestions.ts` — zapisano w `evidence/cycle-18/content-author-before-source.json`, SHA `b97153b83f221bb7c73bd7f335a05f72e338c758b88f76f8e913f3394d653071`. Szczegóły rzeczywistych banków i hashe przepływów: `content-author-inventory.json`.

## Przepływy źródłowe i granice dowodu

Rzeczywiste niezmienione moduły banków wykonano przez ograniczony VM i osiem dozwolonych importów. VM nie miał `window`, storage, sieci lub środowiska procesu. Nie wykonano zapisu SRS ani odczytu rzeczywistych danych. To inwentaryzacja banków i źródeł, nie wykonanie strony Review lub przyjęcie UI.

1. `quizQuestions` trafia przez `fromQuiz` do `allQuestions`; polski override ma własne pytanie, cztery odpowiedzi i wyjaśnienie. `getAllQuestionIds` zawiera ID zarówno dla PL, jak EN.
2. Strona `/review` pobiera `getDueIds(getAllQuestionIds(locale), storage)` i następnie `getQuestionById`. Istniejący ID może więc dotrzeć do powtórki jako terminowy lub jeszcze niewidziany. Tekst jest pobierany na bieżąco, ale stara liczba powtórek nie dowodzi zrozumienia nowego brzmienia. Rzeczywisty baseline Review/SRS należy do niezależnego recenzenta UI.
3. Review zapisuje odpowiedź/mastery i może wywołać dotychczasowe `markActive`; nie przyznaje bezpośrednio nagrody pytania B/25. Zachowanie pola `reward: 25` nie jest deklaracją dodatkowego wypłacenia punktów na tej stronie.
4. `QUESTION_IDS` eksportu buduje allowlistę z quizu i challenge, zatem zawiera ten ID. Nie wykonywano eksportu.
5. Domyślne plain PL/EN ma po cztery rekordy i **nie zawiera** tego ID. `startQuestionId` wybiera tylko pytanie już obecne w użytym poolu; nie dodaje rekordu. Nie wprowadzamy nowej trasy quizu lub przynależności do etapu.

ES i FR mają własne istniejące plain rekordy `emergency-first-milestone` w poolach po 31 pytań. Pozostałe plain locale mają po cztery rekordy i nie zawierają ID. Źródłowy `localizedQuiz.ts` i wszystkie siedem bloków poza PL/EN pozostają nietknięte; stare ES/FR nie otrzymują przyjęcia C18. Pozostałe kanoniczne locale bez własnego nadpisania mogą po przyszłej zmianie odziedziczyć nowe EN — to nie niezależne przyjęcie lokalizacji.

## Zaobserwowana luka treści

Prawidłowa opcja B wybiera obecnie miesiąc wydatków jako pierwszy cel. Polski feedback mówi także „zacznij mało”; nie opisujemy tego jako dosłownego nakazu prawnego. Obie wersje zawierają jednak mocne twierdzenie o spadku ryzyka zaległości, którego podstawa ilościowa nie została przyjęta w C17/C18. Zmiana ma usunąć nieuzasadnioną dla tego zakresu obietnicę, bez ogłaszania badań fałszywymi.

Proponowany draft wybiera osiągalny mały dobrowolny cel po potrzebach i wymaganych minimalnych spłatach. Przy braku nadwyżki przewiduje pauzę i brak nowego długu do oszczędzania. Nie tworzy nowej lekcji, pytania lub naukowo zwalidowanego wyniku.

## Historyczne zależności

| Fixture | Literalne `expect` | Zależność |
| --- | ---: | --- |
| `cycle6-mindset-author.test.ts` | 81 | Pełne źródła po dotychczasowych odtworzeniach. |
| `cycle6-quiz-review.test.ts` | 47 | Dziewięć plain pools i 55 pozostałych angielskich rekordów. |
| `cycle11-saving-author.test.ts` | 65 | Pełne runtime/źródłowe nietargety saving. |
| `cycle15-inflation-author.test.ts` | 94 | Pełne nietargety inflation i wcześniejsze inverse. |
| `cycle16-credit-author.test.ts` | 116 | Pełne nietargety credit i wcześniejsze inverse. |
| `cycle17-emergency-author.test.ts` | 112 | Pełne nietargety emergency oraz jawna równość `deferredNonTarget` tego konkretnego ID. |

Łącznie **515 literalnych wywołań `expect`**. To odczyt AST, bez uruchamiania testów. Trzy stare helpers C15/C16/C17 i wszystkie ich niezmienne wejścia/golden pozostają bez zmian. Jeśli implementacja zostanie zwolniona, nowa projekcja pre-C18 ma poprzedzać dotychczasowe odtworzenia; nie regenerujemy oczekiwań ani historycznych baseline.

Aktualne sondy integralności Review mają odrębny zakres i priorytet u roota/UI. Draft treści nie diagnozuje ani nie zamyka ich wyników. Do osobnego zwolnienia implementacji pozostaje **zero product/test/helper writes**, bez old green, agregatu, TypeScript, builda lub przeglądarki.
