# C16 — szkic curriculum i źródeł

Autor: `daily_author`, 2026-10-15. **DRAFT: treść nie jest w produkcie i nie została przyjęta.** Pełny tekst PL/EN, założenia i 12 uzasadnień dystraktorów znajdują się w `content-metadata.json`. Tylko ten dokument i metadane powstały w tym przydziale. Pięć zachowanych źródeł produktu i wszystkie testy pozostają bez zmian.

## Kolejność i zastosowanie

Kolejność czterech istniejących kroków jest zachowana. Najpierw użytkownik rozpoznaje umowny koszt długu, potem odróżnia wymagane spłaty od dobrowolnej nadwyżki. Następnie oddziela historię spłat od możliwości pokrycia nowego zobowiązania. Ostatni krok pokazuje odrębne ryzyko ceny długu po stronie posiadacza obligacji; nie zachęca do zakupu.

| ID / klucz / nagroda | Cel i małe ćwiczenie | Przykład oraz granica wnioskowania |
| --- | --- | --- |
| `interest-rates` / C / 25 | Wskaż umowny moment aktualizacji, odróżnij stopę zmienną, stałą i okresowo stałą; sprawdź dalsze warunki po uzgodnionym okresie. | Hipotetycznie 3% wskaźnika + 2 pkt proc. marży = 5%; po aktualizacji 4% + 2 pkt proc. = 6%. Dodatkowy prosty model: 1 000 zł × 6% = 60 zł przez rok przy stałym kapitale, bez spłat, kapitalizacji i opłat. To nie rata rzeczywistego kredytu. |
| `debt-avalanche` / C / 30 | Najpierw potrzeby i wszystkie wymagane minima, potem opcjonalne 100 zł na wyższą stopę. | Dług 1 000 zł ma stałe 20%, a mniejszy 500 zł ma 10%; brak opłat, kar i zaległości. Osobne porównanie marginalne: nadpłata 100 zł na początku roku, salda co najmniej 100 zł, brak dalszych przepływów i kapitalizacji — 20 zł wobec 10 zł mniej odsetek. To nie cały harmonogram ani obietnica oszczędności. |
| `credit-score-factors` / B / 25 | Oddziel terminowość od oceny dochodów, wydatków i zdolności pokrycia nowej raty. | Osoba płaci terminowo, lecz nieregularne wpływy mogą nie pokryć nowej raty 500 zł. Żadna liczba punktów nie daje tu zgody banku; punkty Coachfi nie są scoringiem BIK. |
| `bond-prices` / B / 30 | Oddziel cenę sprzedaży od stałego kuponu i umownego nominału przy wykupie. | Umowny przepływ za rok: 1 000 zł nominału + 100 zł kuponu. Przy tej samej dacie: 1 100 ÷ 1,10 = 1 000 zł, a 1 100 ÷ 1,20 ≈ 916,67 zł. To hipotetyczna wycena bez opłat, podatku i niewypłacalności w obliczeniu; emitent nadal może nie zapłacić. |

Każdy krok ma jawny cel, krótki przykład, ćwiczenie, opcjonalne działanie, spokojny powrót oraz wariant nieregularnego dochodu. Działania dotyczą wyłącznie przykładu lub umowy pokazowej; nie wymagają przelewu, raportu, nowego zadłużenia ani inwestycji. To projekt treści, bez dowodu skuteczności uczenia.

## Robocze odniesienie do kompetencji

Mapa autora korzysta z numerowanych kompetencji EU/OECD 2022: `interest-rates` → 275/291/361, `debt-avalanche` → 118/316/318, `credit-score-factors` → 272/304/307/309, `bond-prices` → 180/182/185. Dotyczą one kosztów i ryzyka kredytu, ograniczeń budżetu, scoringu oraz zmiany wartości inwestycji. Jest to wybór projektowy, a nie certyfikacja curriculum ani potwierdzenie osiągniętej kompetencji. Sama rama jest podstawą koncepcyjną do opracowania materiałów, nie gotowym curriculum. [EU/OECD — financial competence framework for adults, 2022](https://finance.ec.europa.eu/system/files/2022-01/220111-financial-competence-framework-adults_en.pdf).

## Źródła i kwalifikacje

- Zmienna, stała i okresowo stała stopa oraz warunki umowy: [KNF](https://www.knf.gov.pl/dla_konsumenta/kampanie_informacyjne/stala_czy_zmienna_stopa_oprocentowania), [UOKiK](https://uokik.gov.pl/public/kalkulator-zmiany-oprocentowania/). Stare przykłady prawne, okresy minimalne, nazwy aktualnych wskaźników i ranking produktów nie są przejmowane do draftu.
- Wyższa stopa jako priorytet dodatkowej spłaty, odrębny od strategii najmniejszego salda: [CFPB — how to reduce your debt](https://www.consumerfinance.gov/archive/blog/how-reduce-your-debt/), [pierwotny worksheet](https://files.consumerfinance.gov/f/documents/cfpb_ymyg-toolkit_reducing-debt-worksheet.pdf). Z tych materiałów użyto ogólnego mechanizmu, bez produktów i prawa USA. Warunek ochrony potrzeb oraz prosty marginalny model PLN są jawnymi założeniami Coachfi.
- Polska historia spłat, scoring i niezależna decyzja kredytodawcy: [BIK — ocena punktowa](https://www.bik.pl/dla-ciebie/ocena-punktowa-bik), [BIK — scoring a zdolność](https://media.bik.pl/informacje-prasowe/859018/wnioskowanie-o-kredyt-a-scoring-bik). Nie podajemy wagi, liczby ani rankingu czynników. Nie przenosimy modelu FICO i nie przedstawiamy wyniku jako gwarancji kredytu.
- Zbywalna obligacja o stałych przepływach, rentowność rynkowa oraz osobne ryzyko niewypłacalności i płynności: [SEC — interest rate risk](https://www.sec.gov/files/ib_interestraterisk.pdf), [Investor.gov — bonds](https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products/bonds). Użyto wyłącznie ogólnych pojęć i własnego przykładu PLN, bez prawa, podatków i produktów USA.

Wszystkie użyte strony/PDF odczytano 2026-10-15. Pierwsza próba otwarcia strony ramy EU zwróciła błąd narzędzia; właściwy oficjalny PDF odczytano osobno. Źródła wspierają zakres edukacyjny, bez przyjęcia prawnego lub produkcyjnego.

## Odczyt pytania i niezależna recenzja

Długości obliczono statycznie dokładnie jak w `QuizCard`: pytanie i cztery opcje z prefiksami `A. `–`D. `, połączone pojedynczą spacją. Nie jest to test rzeczywistego komponentu ani audio.

| ID | PL | EN |
| --- | ---: | ---: |
| `interest-rates` | 174 | 192 |
| `debt-avalanche` | 315 | 342 |
| `credit-score-factors` | 260 | 287 |
| `bond-prices` | 235 | 236 |

Każdy pełny tekst mieści się w obecnym limicie 500 znaków; maksimum wynosi 342. Nie zwiększono limitu i nie opierano długości na obciętym tekście.

Recenzent finansowy przekazał jedynie wstępne uwagi do arytmetyki; uwzględniono moment nadpłaty, minimalne saldo i brak dalszych przepływów w osobnym porównaniu. W draft review recenzent uznał liczby i 12 dystraktorów za poprawne przy jawnych założeniach, a dla interest-rates zażądał nazwania stopy okresowo stałej i warunków po jej okresie. Autor dopisał te kwalifikacje w kroku i feedbacku PL/EN; ta konkretna poprawka oczekuje niezależnego retestu. Nie jest to przyjęcie produktu. Źródła produktu i testy mogą zostać zmienione dopiero po osobnym zwolnieniu przez roota. Przyszły adapter C16 ma składać się z dotychczasowym odtworzeniem historycznym, bez zmiany golden baselines lub literalnych oczekiwań.
