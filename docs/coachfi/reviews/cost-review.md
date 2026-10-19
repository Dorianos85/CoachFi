# Niezależna recenzja modelu kosztów

Data: 14 października 2026, Europe/Warsaw. Recenzent: agent `architecture_audit`, w tej pracy rola 3 / recenzja rachunków. Autor modelu: koordynator. Recenzent nie jest autorem modelu. Zakres: `cost-inputs.json` 1.0.0, `docs/coachfi/tools/cost-model.cjs`, `cost-results.json`, `cost-estimate.md`. Nie recenzowano własnego audytu architektury.

**Wynik pierwszej recenzji: revise w zakresie opisania progu rentowności; rachunki 27 zapisanych scenariuszy accept.** Model jest poprawnym kalkulatorem syntetycznych założeń. Nie potwierdza rzeczywistych kosztów, stawek podatkowych ani rentowności produktu. Nie jest zgodą na wydatki, płatności lub włączenie zewnętrznego AI.

## Niezależna metoda

Nie uruchamiano kodu autora jako dowodu recenzji. Kwoty przeliczono odrębnie w PowerShell z typem `Decimal`, na podstawie jawnych założeń. Zestawiono wszystkie 27 kombinacji z zapisanym JSON; maksymalna różnica bezwzględna wyniku miesięcznego wyniosła `3,34 × 10⁻¹² USD` i pochodzi z reprezentacji float autora. Wszystkie ciągłe progi policzone jako `ceil(stałe / wkład)` zgadzają się z tą definicją.

Koszt jednej odpowiedzi: `1500 × 1 / 1 000 000 + 500 × 4 / 1 000 000 = 0,0035 USD`. Obsługa: `12 / 60 = 0,20 USD/min`. Płatność: `5 × 0,029 + 0,30 = 0,445 USD`. Przychód jednostkowy po podatku pośrednim: przy 0% `5,00 USD`, przy 23% `5 / 1,23 = 4,0650406504 USD`. Stawki są wariantami, nie ustaleniem obowiązku podatkowego.

| Użycie | Free: AI + obsługa + infrastruktura | Premium z opłatą płatniczą | Wkład premium przy 0% / 23% |
|---|---:|---:|---:|
| light | 0,0175 + 0,05 + 0,02 = **0,0875** | 0,105 + 0,20 + 0,05 + 0,445 = **0,8000** | 4,2000 / 3,26504065 |
| typical | 0,0700 + 0,10 + 0,05 = **0,2200** | 0,700 + 0,60 + 0,10 + 0,445 = **1,8450** | 3,1550 / 2,22004065 |
| heavy | 0,1750 + 0,40 + 0,10 = **0,6750** | 4,200 + 2,00 + 0,20 + 0,445 = **6,8450** | −1,8450 / −2,77995935 |

Wszystkie kwoty w USD. Intensywne użycie ma ujemny wkład płacącego również przy podatku 0%; zwiększanie populacji ani udziału premium nie zapewni rentowności w tych założeniach. `null` dla progu w scenariuszu heavy jest poprawny.

## Kontrola populacji

Przy 1000 aktywnych, 100 płacących i 900 free:

| Użycie | Koszt | Wynik przy 0% | Wynik przy 23% |
|---|---:|---:|---:|
| light | 208,75 | 291,25 | 197,75406504 |
| typical | 482,50 | 17,50 | −75,99593496 |
| heavy | 1492,00 | −992,00 | −1085,49593496 |

Kontrola innych rozmiarów przy 23%: 100 aktywnych / 5 premium daje odpowiednio `−41,98729675`, `−109,79979675`, `−278,02479675`; 5000 / 750 premium daje `2026,90548780`, `630,03048780`, `−5153,71951220`. Wariant 20% również przeliczono. Trzy obecne liczebności dają całkowitą liczbę płacących bez wpływu zaokrąglenia.

## Poprawka C01 — próg ciągły i całkowici użytkownicy

Priorytet P2, status **revise**. `monthly_result_before_exclusions` korzysta z `Math.round(active * paidShare)`, natomiast `break_even_active_at_share` używa niezaokrąglonego udziału. Nazwa pola może sugerować rzeczywisty próg liczby użytkowników, choć jest przybliżeniem ciągłym. Dotychczasowa wzmianka o zaokrągleniu w prose jest pomocna, ale nie usuwa różnicy w znaczeniu JSON.

Kontrprzykład: light, podatek 23%, udział 10%. Pole pokazuje **202** aktywnych. Przy 202 są 20 płacących, a rzeczywisty wynik kalkulatora to **−0,62418699 USD**. Przy 204 nadal jest strata `−0,79918699`; od 205 / 21 premium wynik wynosi `+2,46585366`.

| Użycie / podatek / udział 10% | Ciągłe `ceil` | Pierwszy nieujemny wynik po zaokrągleniu | Początek nieujemnych wyników bez powrotu straty, sprawdzony zakres 1–6000 |
|---|---:|---:|---:|
| light / 0% | 147 | 145 | 145 |
| light / 23% | 202 | 205 | 205 |
| typical / 0% | 852 | 845 | 855 |
| typical / 23% | 4166 | 4125 | 4205 |
| heavy / 0% i 23% | brak | brak | brak |

Przy typical / 23%: 4125 daje `+0,23678862`, ale 4134 daje `−1,74321138`; 4204 daje `−0,06292683`, a 4205 `+2,15711382`. Skoki są skutkiem dodania jednego płacącego co dziesięć aktywnych. Dlatego pierwszy dodatni wynik nie oznacza trwałego przekroczenia progu. Nie przypisywać temu progowi precyzji prognozy wzrostu.

Wymagane: nazwać pole jako przybliżenie ciągłe albo dodać jednoznaczną metadokumentację definicji oraz wskazać, że trzeba przeliczać faktyczny `paid_users`. Jeśli podawany jest dokładny próg całkowity, powinien być liczony z tej samej reguły zaokrąglenia co wynik. Tekst `4167` ujednolicić z ciągłym wynikiem `4166` lub przedstawić jako około `4,2 tys.`. Autor wykonuje poprawkę; recenzent sprawdza ją ponownie.

Minimalne odtworzenie kontrprzykładu, niezależne od kodu autora:

```powershell
$activeCount = 202
$paidCount = [int][Math]::Floor($activeCount * [decimal]0.10 + [decimal]0.5)
$revenue = $paidCount * ([decimal]5 / [decimal]1.23)
$cost = [decimal]50 + ($activeCount - $paidCount) * [decimal]0.0875 + $paidCount * [decimal]0.8
$revenue - $cost
# -0.62418699186991869918699187
```

Pętla z `activeCount=1..6000`, kosztami powyższej tabeli i podatkami 0/23% odtwarza podane progi. Dla typical stałe wynoszą 100, free 0,22, a premium z płatnością 1,845. Rachunki korzystają z reguły `floor(N*s+0,5)`, równoważnej `Math.round` dla nieujemnych wartości; nie użyto .NET rounding-to-even.

## Pozostałe oceny

- **Accept**: podatki wyłączono z przychodu raz; opłatę modeluje się od brutto zgodnie z jawnym założeniem; koszty free są wliczone.
- **Accept**: próg udziału premium przed stałymi wynosi dla typical / 23% `0,22 / (2,22004065 + 0,22) = 9,01624323%`. To nie próg pełnej rentowności populacji ze stałymi.
- **Accept**: koszty głosu, rozwoju, pozyskania i inne wyłączenia są ujawnione; model nie udaje pełnego rachunku wyników.
- **Niesprawdzone**: rzeczywiste ceny, VAT, faktury, zużycie, korelacja ciężkiego użycia z wsparciem, koszt rodzin i hard cap. Wymagają przypisanych dostawców oraz danych; nie wolno przenieść statusu accept rachunków na akceptację planu premium.
- **Rekomendacja**: utrzymać stanowisko „bez nielimitowanego AI przy 5 USD”; realny limit należy policzyć po danych, z retry/głosem/kontekstem i udziałem free.

## Wersja recenzowanych plików

SHA-256 przed poprawką autora:

| Plik | SHA-256 |
|---|---|
| cost-inputs.json | A9CF8B1DE0CF54493BE8F49B487E6B30532DFC057893ABFF4F9FD70A44F47AAB |
| tools/cost-model.cjs | 4B990771157C9718AE2157A9E4B178C93C6421FB98243C6A68B11085EC078529 |
| cost-results.json | 4C2B4B9EC940E643F1A8160D95BE75D657F611D6E4573659F835F3D5BAB7794F |
| cost-estimate.md | F73FBEDC55BC06F705FEDDAC3485C2896C76B73FBE49333FA31599081078FB87 |

Odczytano program oraz skille `coachfi-financial-review` i `coachfi-operations-finops`. Recenzja jest lokalna, bez narzędzi chmurowych i bez zmian w modelu autora.

## Ponowna recenzja po poprawce C01

14 października 2026: **C01 zamknięta, wynik modelu planistycznego accept.** Autor zmienił nazwę na `break_even_active_at_share_continuous_approx`, dodał `rounding_caveat` oraz osobny `conservative_break_even_active_with_rounding`. Dokument podaje 4166 jako przybliżenie ciągłe, a JSON 4217 jako próg konserwatywny. Nie nazywa tego najwcześniejszą rentowną populacją.

Niezależnie sprawdzono wszystkie 27 wartości nowego progu. Jeżeli `C` oznacza wkład premium, `F` koszt free, `s` udział płacących, to `B = s*C - (1-s)*F`. Wynik po zaokrągleniu liczby płacących wynosi `N*B - stałe + (round(N*s)-N*s)*(C+F)`. Błąd zaokrąglenia ma moduł do 0,5. Dla dodatniego `C+F` w badanych rentownych wariantach `ceil((stałe + 0,5*(C+F))/B)` jest bezpiecznym ograniczeniem dolnym wyniku. Niezależne przeliczenie Decimal potwierdziło wszystkie progi, w tym light/23%/10% **209**, typical/23%/10% **4217**, heavy **brak**. Kwoty miesięczne się nie zmieniły.

SHA-256 ponownie odczytanych plików: model `8900CC4031614DEFA842CA00F1EA0AD4588A3011E2A7F8E08F29C363E5FD5AC2`; wyniki `1F58A08596520302AE91BBF2D307CD20741F3DF830B7D0E597FBEC0DDAF71CFF`; dokument `9B52C2D1B9B4E2EE66FB7D366F0EF43DA0029392D02931C47C42D22FABDA0468`. Wejścia bez zmiany. Status accept dotyczy modelu rachunkowego i jawności założeń; rzeczywiste ceny, podatki, koszty i decyzja premium pozostają do potwierdzenia.
