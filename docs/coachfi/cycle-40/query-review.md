# C40 — niezależna recenzja parametrów quizu

Status: **ACCEPTED_LIMITED_LOCAL_QUERY_RENDER_C40**, findingsOpen: **0**. Przegląd dotyczy dorosłych w Polsce, PL/EN. Odczytano rzeczywiste źródło i surowe wyniki.

Usunięto powtórne dekodowanie: `decodeURIComponent(from)` zastąpiono `from`, zachowując alias. Natywny `URLSearchParams.get` już dekoduje wejście. Niezależny forward/inverse i CRLF są dokładne; 21 pozostałych deklaracji oraz cała reszta banera i strony są literalne. Fixture 86a002bf nie zmieniła się po zamrożeniu.

Baseline 18 przypadków: 12 PASS / 6 FAIL — cztery URIError i dwie błędne zamiany literalnego %2F na /. To objawy jednego problemu. Pierwszy przebieg po poprawce: 18/18 PASS z tymi samymi nazwami i oczekiwaniami; wszystkie sześć FAIL zamknięto. 22 obserwacje nie oznaczają 22 przypadków. Wszystkie zachowują odczytany tekst, saldo 125, dokładne wywołania get i zero obserwowanych zapisów, aktywności, cloud, persist i fetch. Brak lub pusty from/score nadal ukrywa baner; string score 0 jest widoczny.

Osobne 6 prób Chrome przeszło jednokrotnie, bez retry, flaky, skipped, pageErrors lub API. W zbudowanym lokalnym TEMP sprawdzono procent, literalne %2F i Unicode/plus/literalny markup PL/EN, prawdziwy QuizCard, klawiaturę i reload. Nie wysyłano odpowiedzi. Te same 5 kluczy i saldo 125 zachowano przed wyborem, po wyborze i po reloadzie. Dane początkowe zapisano przed sondą; po reloadzie sonda jest nowa. To 24 różne przypadki w warstwach 18 SSR + 6 Chrome, bez globalnej regresji.

Pierwszy standalone TypeScript: exit 0, 8 pinów bez różnic. Jeden build: 34/34 strony, 35 tras, 525 wejść przed i 524 po, 0 mismatch. Chrome użył tego samego TEMP i 524 wejść bez różnic; port był wolny przed i po. Parser 6.1.4 / 37 plików / 2 konsumenci oraz package/lock zachowano. Ostrzeżenia opcjonalnych modułów CDP i FORCE_COLOR/NO_COLOR są jawne; nie potwierdzają działania dostawcy.

Score query pozostaje nieautorytatywną etykietą; ranking, nagrody, walidacja wyniku, linki i callbacki są bez zmian. Ograniczona lokalna akceptacja renderowania nie jest nowym security/Auth/RLS/staging/CI/fresh-checkout/production PASS i nie zamyka residual advisories. Root wykonał wszystkie bramki; reviewer nie uruchamiał runtime ani nie zmieniał produktu. Pierwszy inline skrypt raportu zatrzymał się na składni tekstu MD przed wykonaniem; poprawiono formatowanie bez ponawiania bramek. Szczegóły i SHA256: [data-review.json](../../../evidence/cycle-40/data-review.json).
