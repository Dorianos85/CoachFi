# Koszty i freemium — model planistyczny

Stan14.10.2026. Limit budżetu zostanie ustalony po audycie, zgodnie z odpowiedzią Foundera. Brak faktur, aktywnego modelu/dostawcy, hostingu, taryfy płatności i metryk użycia. Nie jest to wycena usług ani prognoza finansowa. Cena5USD/mies. jest decyzją kierunkową; model zakłada cenę brutto, do potwierdzenia. Rynek Polska, PL/EN; USD jest jednostką modelowania, nie decyzją o walucie checkoutu.

## Założenia do zmiany po dostępie

W [cost-inputs.json](cost-inputs.json) podano syntetyczne stawki: input1USD/output4USD za milion tokenów; 1500 input i500 output na odpowiedź daje0,0035USD. Nie wybrano przez to dostawcy ani modelu. Hipotetyczna opłata płatnicza2,9%+0,30USD daje0,445USD przy cenie5USD; nie jest cennikiem Stripe. Obsługa12USD/h. Koszty stałe50/100/200USD są rezerwami planistycznymi na hosting, storage i monitoring, a nie potwierdzoną ofertą. Voice, narzędzia, retries i długi kontekst wymagają oddzielnego budżetu.

Podatek pośredni modelujemy wariantami0%,20%,23%. Odpowiedni status sprzedawcy, VAT, miejsce świadczenia i prezentację ceny określa księgowy/prawnik. Nie rozstrzygamy, że produkt podlega stawce23%. Przychód po podatku = brutto/(1+stawka); opłata za płatność w modelu od kwoty brutto. Podatki dochodowe wymagają zysku i formy działalności, dlatego nie ujęto ich w marży operacyjnej.

| Scenariusz | Odpowiedzi free / premium na miesiąc | Obsługa free / premium min | Koszt zmienny free | Premium bez płatności | Wkład płacącego przy23%, przed free/stałymi |
|---|---:|---:|---:|---:|---:|
| Niski |5 /30|0,25 /1|0,0875USD|0,355USD|3,2650USD|
| Typowy |20 /200|0,5 /3|0,2200USD|1,400USD|2,2200USD|
| Intensywny |50 /1200|2 /10|0,6750USD|6,400USD|−2,7800USD|

Wariant intensywny jest nierentowny nawet przed finansowaniem free. Nie oferować nielimitowanego AI przy5USD bez danych i limitów.

## Cała populacja, nie tylko premium

Przy1000 aktywnych użytkownikach,10% premium i wariancie podatku23%:

| Scenariusz | Koszt operacyjny z opłatami | Przychód po podatku | Wynik przed wyłączeniami |
|---|---:|---:|---:|
| Niski |208,75USD|406,50USD|197,75USD|
| Typowy |482,50USD|406,50USD|−76,00USD|
| Intensywny |1492,00USD|406,50USD|−1085,50USD|

Pełne27 kombinacji:100 użytkowników/5% płacących,1000/10%,5000/15%, trzy podatki i trzy poziomy użycia w [cost-results.json](cost-results.json). Przy typowym użyciu10% premium wkład na aktywnego wynosi ok.0,024USD; przybliżony próg ciągły dla stałych100USD wynosi4166 aktywnych. Zaokrąglanie płacących powoduje skoki wyniku: pole `break_even_active_at_share_continuous_approx` nie gwarantuje zysku dla dokładnie tej liczby osób. Konserwatywny próg uwzględniający maksymalną stratę zaokrąglenia jest w osobnym polu JSON; nie oznacza najwcześniejszej rentownej populacji. Próg udziału płacących przed stałymi wynosi ok.9,02%. To scenariusz, nie cel potwierdzony badaniem.

Nie ujęto: rozwoju, pracy koordynatora, prawa/księgowości, pozyskania, głosu, migracji, zwrotów/sporów, FX, podatków dochodowych. Przed decyzją potrzebne są rzeczywiste ceny dostawców z datą, użycie tokenów i wsparcia, liczba aktywnych free oraz zasady podatkowe. Rabat rodzinny zmniejsza przychód, podczas gdy każde miejsce może generować koszt; wielkość rodziny i uprawnienia wymagają osobnego modelu.

## Proponowane pakiety — do decyzji

- Free: pierwsza przydatna diagnoza z jawnymi założeniami, podstawowa ścieżka, quiz/powtórka i małe działanie, dostęp do pomocy oraz eksportu/usuwania. Local-only lub konto zależy od decyzji o zapisie.
- Premium5USD: większa głębokość nauki, scenariusze i planowanie oraz większy kontrolowany limit Mili. Bez gwarancji wyniku ani ochrony przed kryzysem.
- Rodziny: na razie brak decyzji o liczbie miejsc, cenie i widoczności danych. Konta dorosłych i Kids Mode to odrębne zagadnienia.

Przed aktywacją zewnętrznego AI: limit długości wejścia/kontekstu/wyjścia, timeout, limit per-user i globalny, deduplikacja/retry z capem, alert przy ustalonym progu, bezkosztowy fallback lokalny/lekcja. Progi oraz miesięczny hard cap zatwierdza Founder po weryfikacji wartości. Limit klienta nie wystarcza: egzekwowanie na serwerze.

Odtworzenie: `node docs/coachfi/tools/cost-model.cjs`. Autor: koordynator; niezależne przeliczenie wymagane przed przyjęciem modelu, wynik w `reviews/`.
