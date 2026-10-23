# C44 — niezależny przegląd kodowania nazwy w URL quizu

Status: **ACCEPTED_LIMITED_LOCAL_QUIZ_NAME_ENCODING_INTEGRITY_C44**. Otwarte findingi w tym ograniczonym zakresie: **0**. Recenzent: daily_data_review, 16.10.2026.

Przyjmuję lokalną zmianę jednego bloku app/quiz/page.tsx: natywne URLSearchParams tworzy query from/score i zastępuje nieparzyste surrogaty przez U+FFFD wyłącznie w pochodnym URL. Surowy profil pozostaje niezmieniony. Poprawne nazwy i score zachowują znaczenie po dekodowaniu; bajty formularzowego kodowania spacji mogą zmienić się z %20 na +.

Niezależnie sprawdzono pełny before/after, dokładne odwrócenie jednej delty, CRLF i bajty poza zmianą. Pozostałe21 instrukcji najwyższego poziomu i23 instrukcje rodzica oraz11 chronionych plików są literalne. getUser/getDisplayName, copy, wejściowy ChallengeBanner, callbacki, nagrody i obliczanie wyniku nie zostały zmienione.

Baseline:16 testów,8 PASS/8 FAIL oraz32 obserwacje dwóch gałęzi. Cztery klasy błędnego UTF-16 w PL/EN dawały URIError już przy pierwszym renderowaniu rodzica:16 obserwacji jednego problemu granicy kodera. Pierwszy postsource:16/16 PASS, te same nazwy testów, wszystkie8 pierwotnych porażek zamknięte. Wszystkie32 próbki zachowują surowy profil,125 punktów i brak zapisów/aktywności/cloud/persist/fetch.

Osobny przebieg regresji:24/24 PASS —18 historycznych C40 query i6 C43 profilu rodzica, z dokładnymi multisetami nazw i literalnymi fixtures. TypeScript zakończył się kodem0;10 pinów bez różnic. Jeden świeży build:34/34 strony,35 tras,537 wejść przed i536 po wyłączeniu generowanego next-env.d.ts z porównania po buildzie;0 różnic. Niezależnie odczytano hashe536 aktualnych i skopiowanych wejść.

Pierwszy Chrome:6/6 PASS, pojedyncze próby/retry0, na tej samej kopii TEMP po buildzie;536 wejść przed/po bez różnic i port wolny przed/po. Załączniki dla lone-high/lone-low/zdrowego Unicode×PLEN zachowują profil oraz pięć kluczy postępu po wyborze Space i reloadzie:125 punktów,0 śledzonych zapisów,0 API i0 pageErrors. Nie wykonano submitu ani udostępniania. Nie było browserbaseline.

Łącznie46 rozłącznych przypadków w trzech przebiegach16+24+6. To ograniczona regresja;32 próbki nie są32 dodatkowymi testami. Parser6.1.4/37 plików/2 konsumenci pozostaje identyczny w każdym etapie; aktualne pliki i pakiety konsumentów odczytano niezależnie. Spośród534 wcześniejszych wejść533 pozostaje literalnych, podobnie87 z88 historycznych ścieżek źródeł/narzędzi; wyłącznie app/quiz/page.tsx ma jawną kwalifikację z zachowanym starym tuple. ReceiptC43 pozostaje literalny.

Harness wywołuje rzeczywistego rodzica i jego callback onComplete(3,4), aby obejrzeć url prop SocialShare. To sprawdzenie kontraktu callbacku, nie rzeczywistych odpowiedzi, polityki punktacji, SRS lub nagród. Gałąź window-undefined jest emulowana przez dispatcher hooków, nie stanowi ReactDOM SSR ani Next hydration. Chrome sprawdza interaktywność przed ukończeniem; nie dowodzi widocznej nazwy ani shareURL, których tam jeszcze nie ma.

Nie przyjmuję pełnej walidacji/naprawy profilu, autentyczności score, ogólnej poprawności wszystkich stringów ani globalnego security/Auth/RLS/staging/CI/fresh-checkout/produkcji. Historyczne opcjonalne ostrzeżenia buildu x402-fetch/@base-org/account pozostają otwarte. Wszystkie uruchomienia wykonał root; recenzent nie uruchamiał aplikacji, testów, TypeScript, buildu ani Chrome. Dowody: data-baseline-review.json, data-source-review.json, data-retest-review.json oraz komplet rawgates wskazany w data-review.json.
