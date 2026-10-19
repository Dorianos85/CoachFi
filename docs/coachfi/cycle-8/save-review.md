# B18 — niezależna recenzja kontrolera zapisu quizu

2026-10-14, 20:49 Europe/Warsaw. Recenzent: curriculum_pilot. Autor helpera: architecture_audit; autor UI: root. **ACCEPT limited controller/data** dla wskazanych poniżej bajtów `lib/quiz-save.ts`. Brak materialnego findingu aplikacyjnego w tym zakresie. To odrębna recenzja autora helpera; nie stanowi zatwierdzenia mojego pliku testowego, UI albo wydania.

Własny targeted Vitest: **30/30 PASS** w `tests/cycle8-save-review.test.ts`, start `2026-10-14T18:49:01.571Z`. Rzeczywisty helper i rzeczywiste `recordAnswer`/`addTokens` wykonane na syntetycznych Map handles; cloud/account bridges, zdarzenia i transport to spies. Każdy test wymaga zero fetch. Nie odczytywałem danych przeglądarki, sesji lub sekretów i nie wykonałem sieci, fullsuite, serwera, instalacji, push ani deploy. B17 arytmetyka pozostaje read-only, bez ponowienia jego 73 testów.

| Sprawdzony kontrakt | Dowód |
| --- | --- |
| Każda próba `setItem`/`removeItem` oznaczona przed delegacją, także przed guardem | `lib/quiz-save.ts:65`, `:76`; refusal, throw przed write, write-then-throw i remove failure dają `uncertain` |
| Niepewny wynik blokuje powtórkę w tej wersji, bez rollback lub porównywania raw jako dowodu sukcesu | `lib/quiz-save.ts:38`; powtórka nie wykonuje record/reward/reads ani dodatkowego zapisu |
| Retry dopuszczone przed jakąkolwiek próbą mutacji przy potwierdzonym owner/epoch | `lib/quiz-save.ts:49`; odmowa probe read oraz wyjątek record przed write są `retryable`, późniejsza poprawna próba zapisuje raz |
| Połknięty błąd odczytu/mutacji nie daje `saved` lub nagrody | `lib/quiz-save.ts:57`, `:90`; sticky faults i refusal tests |
| `saved` wymaga całego synchronicznego record/reward, aktualnego owner/epoch i próby mutacji przez trace | `lib/quiz-save.ts:90`; record bez write nie uruchamia reward, thenable/Promise nie daje fałszywego sukcesu |
| Stary ticket, reentry i duplikat po sukcesie są `ignored`; reset nie zwalnia trwającej operacji | `lib/quiz-save.ts:27`, `:104`, `:112`; nested run po reset jest zablokowany do finally |
| Stary owner lub nieudowodniona aktualność zatrzymuje wykonanie; trace wygasa po run | `lib/quiz-save.ts:30`, `:104`; zero stale callbacków, late trace read/write/remove nie deleguje do storage |
| Bez `window` brak callbacków i mutacji, wynik przy aktualnym owner to `retryable` | `lib/quiz-save.ts:47`; osobny nonbrowser case |

Sprawdziłem częściowy zapis na rzeczywistych helperach: `recordAnswer` wywołuje `saveCards` i zapis SRS przed reward (`lib/srs.ts:62`, `:102`). Potem `addTokens` zapisuje saldo przed eventem (`lib/tokens.ts:54`, `:65`). Gdy token event rzuci po physical write, SRS pozostaje zapisany, saldo wynosi 150 z początkowych 125, a kontroler zwraca `uncertain`. Powtórka nie przyznaje następnych 25 ani nie zmienia SRS. Gdy odczyt tokenów zawiedzie dopiero po zapisie SRS, saldo zachowuje 125, wynik również jest `uncertain`, bez replay. Nie udaję atomowej transakcji obu kluczy. Błędna odpowiedź bez reward może zapisać SRS raz; `onComplete` wykonuje wyłącznie caller po `saved` i jego późniejszy wyjątek nie otwiera ponownie kontrolera.

Pierwszy przebieg **29/30 PASS** zachowany w `evidence/cycle-8/save-review-first-tests.json`. Jedyny fail był kontraktową rozbieżnością mojego fixture: oczekiwałem `uncertain`, gdy samo `storage.isCurrent()` rzuca. Root rozstrzygnął `stopped`: nie można dowieść ownera, więc nie wolno aktualizować przypisanego UI ani wskazać safe retry. Zmieniłem tylko ten expected literal oraz nazwę testu, zachowując wszystkie zero-action assertions. `save-review-authority-oracle-proof.json` dowodzi, że odwrotność tych dwóch zmian odtwarza dokładny wcześniejszy hash. **To nie jest naprawiony finding aplikacji**; helper nie zmienił się między przebiegami.

| Finalny fingerprint | SHA256 |
| --- | --- |
| `lib/quiz-save.ts` | `9F680D1C13230B457AD2B8BBB869BB6D36938F93BBC77C4BE10E4A59F5A663E3` |
| `tests/cycle8-save-review.test.ts` | `A2FE2BC990DA2643E1BDB96D63D169207119FD6523B8748E1B0F55E082F743A2` |

Maszynowa opinia i exact fingerprints: `evidence/cycle-8/save-review.json`. Finalny raw run: `save-review-final-tests.json`. Kryteria sprzed odczytu źródła pozostają jako historia w `save-review-criteria.json`.

Ograniczenia: committed/quarantine jest pamięcią jednej instancji i wersji; reset lub nowa instancja nie stanowi durable deduplication. Już wykonany physical write nie jest cofany. Reward korzysta z przechwyconego handle callera i nie jest ogólnym sandboxem dowolnego callbacka; aktualna ścieżka używa synchronicznych helperów. Zwrócony Promise/thenable nie otrzymuje `saved`; kontroler nie certyfikuje późniejszych działań dowolnego async executora. Odczyt source potwierdza obserwowanie rejection native Promise, bez await/replay, lecz nie rozszerzam testów na wszystkie obce implementacje thenable. Nie badano atomicity wielu kart, refresh/unload, trwałego journalu, serializer/export schema, live cloud, RLS, realnego storage, rendered UI, użytkowników lub release. Dependency helpers były wyłącznie read-only i nie dostały nowej opinii w tym cyklu. Niezależna recenzja UI i końcowe bramki należą do UX/root.
