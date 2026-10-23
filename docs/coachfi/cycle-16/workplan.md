# C16 — B06 credit-rates dla Polski, PL/EN

15.10.2026. Autoryzowana lokalna kontynuacja po przyjętym C15. Dorośli w Polsce, PL/EN; PLN. Bez commit/push/deploy, produkcyjnych zapisów/migracji, realnych sesji/profili/sekretów, płatnych wywołań i kontaktów. Zewnętrzne AI/cloudwrites/livevoice/health/Kids/Web3/afiliacja wyłączone. Wcześniejszy staged patch zachować.

## Zakres i priorytet

Wyższe P0 mają lokalne przyjęcia i jawne pozostałe zależności od środowiska/operatora/kontraktu serwera; brak nowego dependency/lock/advisory triggera. Nie powtarzamy ich zielonych gates. Kolejne niezależne lokalne zadanie: cztery istniejące kroki credit-rates i cztery IDs interest-rates/debt-avalanche/credit-score-factors/bond-prices. Klucze C/C/B/B, nagrody25/30/25/30, suma110; union82 IDs bez wzrostu. Nie dodajemy pól profilu, nie zmieniamy punktów lub historii/SRS. Bank62quiz+20challenge.

Wstępna hipoteza braku canonical interest-rates została odrzucona: istnieje w quizQuestions i PL override. Actual UI potwierdził wszystkie cztery canonical/SRS; nie dodajemy rekordu. Pięć baseline przypadków strukturalnych PASS, trzy rzeczywiste PL fallback FAIL. Początkowy EPERM cache/0cases to błąd narzędzia, zachowany osobno.

## Własność i niezależność

| Właściciel | Rozłączne pliki | Recenzent |
|---|---|---|
| daily_author | data/stageLessons.ts tylko credit-rates PL/EN; data/quizQuestions.ts tylko4 IDs; lib/allQuestions.ts tylko4 PL overrides; lib/localizedQuiz.ts tylko istniejące interest-rates PL/EN; własne metadata/fixture i dowody; odrębnie zatwierdzony wąski legacy adapter | daily_data_review finanse i legacy, daily_ui_review UI |
| root | lib/quiz-topic.ts tylko canonical branch credit-rates; własny fixture, narzędzia/config, rejestry, finalny raport | daily_ui_review resolver/narzędzia/ledger, finance niezależnie treści i reguły |
| daily_data_review | własny financial baseline/acceptance fixture, sources/numeric proofs/raport | root dla korekt fixture |
| daily_ui_review | własny actual UI baseline/acceptance, E2E/raport, później root ledger QA | root dla korekt fixture/E2E |

Root+3 istniejących specjalistów, bez nowego zespołu. Capacity error finance nie daje PASS; ponowienie tego samego przydziału/modelu. Autor nie rozpoczyna sourcewrites przed actual baseline i primary-source kontraktem. Każde poprawione finding wymaga dowodu i niezależnego przyjęcia.

## Kontrakt treści

Zmienna stopa: rata może się zmienić przy aktualizacji wskaźnika zgodnie z umową, nie automatycznie tego samego dnia decyzji banku centralnego. Stała/okresowo stała stopa w ustalonym okresie, później warunki umowy. Nie utożsamiać stałej stopy z niezmiennością wszystkich opłat; bez aktualnych WIBOR/WIRON/POLSTR/stóp lub porady refinansowania.

Lawina: potrzeby i wymagane minimum wszystkich zobowiązań najpierw, dopiero opcjonalna nadwyżka na najwyższe oprocentowanie w uproszczonym modelu. Jawne opłaty/nadpłaty/umowa/arrears jako ograniczenia; bez globalnej gwarancji oszczędności lub presji przy braku nadwyżki. Własny hipotetyczny przykład PLN z jawną metodą.

BIK i zdolność kredytowa: terminowość istotna, brak nieudokumentowanej wagi35%, rankingu największego czynnika lub gwarancji banku. Dochody i wydatki są istotne dla zdolności; nie utożsamiać jej z BIK lub punktami Coachfi. Nie zachęcać do zaciągania zobowiązań dla score. Źródła polskie, bez transplantacji FICO/USA.

Obligacje: uproszczona cena rynkowa istniejącej obligacji o stałych przepływach/stałym kuponie spada przy wyższej wymaganej rentowności, przy pozostałych założeniach bez zmian. Nie twierdzić, że wszystkie obligacje lub nominał przy wykupie reagują tak samo; odróżnić sprzedaż przed terminem od umownych przepływów i ryzyka niewypłacalności. Bez rekomendacji produktu.

Każdy krok: cel, przykład, małe ćwiczenie, opcjonalne działanie i spokojny powrót; wariant nieregularnego dochodu. Zachować siedem pozostałych bloków językowych źródłowo; ich EN fallback dla4 IDs może odziedziczyć nowy EN i pozostaje nieprzyjęty. Nie zatwierdzać całego banku/B06 lub skuteczności nauki.

## Gates

Pełne before i narrow inverse nietargetów/IDs/keys/rewards, niezależne liczby i wszystkie12 dystraktorów. Wąskie legacy zmiany wyłącznie po osobnym przydziale, literalne stare expectations/baselines bez regeneracji; adapter przyjęty przed aggregate. Po freeze: jeden aggregate, standalone TS, osiem nowych bounded Chrome PL/EN, oddzielny fresh TEMP build/parity, guard/scoped diff/niezależny ledger QA i staged receipt. Nie powtarzać green bez zmiany lub konkretnej obawy. Przeglądarka: synthetic guest, puste provider/auth env, API/external abort; oddzielić bootstrap od trzech progress-key no-write windows. Bez PASS stagingu/Auth/RLS/audio/produkcji.

## Po baseline i draft review

Finance10distinct observations:9PASS +1targeted po niezależnie przyjętej korekcie word-boundary fee/feel w fixture, bez powtórzenia9green. FIN-C16-01 (jawne okresowo stałe oprocentowanie i warunki po okresie) CLOSED; draft827b807d przyjęty wyłącznie do implementacji. Dziesięć pierwotnych sources reads i niezależne liczby zapisane. Root odświeżył GHSA braces: nadal brak poprawionej wersji, B10 nie zamknięte; nie instalowano i nie powtarzano audytu.

Autor zwolniony do4datafiles, własnej fixture/adaptera i4historycznych fixtures C6mindset/C6quiz/C11saving/C15inflation. Stare helper C15 i golden expectations pozostają literalnie. Root dodał jedynie credit-rates do canonicalPLEN (fullinverse); własny4casefixture jeszcze nie uruchomiony. Narzędzia5 przyjęte statycznie przez UI, E2E8 rootstaticaccepted; wykonanie po freeze. Brak finalnego content/runtime acceptance.
