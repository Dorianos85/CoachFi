# C17 — draft kontraktu treści i curriculum

Autor: `daily_author`, 2026-10-15. **DRAFT READY do niezależnej recenzji; bez implementacji produktu lub własnego ACCEPT.** Pełne wersje PL/EN, założenia i dziewięć uzasadnień dystraktorów zapisano w `content-metadata.json` (SHA-256 `e6e026bceac51b3fe3b859903bf3bbc67037fb65bf574678e452774dafcabc5f`).

## Rzeczywisty punkt wyjścia

Odczytano `evidence/cycle-17/ui-review-baseline.json`: pięć przypadków strukturalnych PASS i dwa rzeczywiste porównania polskiego QuizCard FAIL. Fallback dotyczy `emergency-fund-characteristics` i `emergency-fund-start`; pierwszy rekord plain emergency jest polski. Baseline potwierdza trzy kroki, kolejność C/C/B, nagrody 25/25/20, sumę 70 i syntetyczne saldo 125→150→175→195. To wykonanie rzeczywistych funkcji komponentów przy mockowanych hooks/context, nie test przeglądarki lub audio ani przyjęcie finansowej treści.

Draft zachowuje dokładnie trzy kroki i ID `emergency-fund`, `emergency-fund-characteristics`, `emergency-fund-start`. Temat to `emergency`, trasa `/quiz?topic=emergency`, a bank nadal ma 82 ID. Pięć źródeł produktu ma identyczne hashe jak zachowane before C17; nie zmieniono ich, testów, helpers lub historycznych baselines.

## Treść i założenia

| Istniejące ID / klucz / nagroda | Cel i wybrany przykład | Ćwiczenie i działanie |
| --- | --- | --- |
| `emergency-fund` / C / 25 | Dopasowanie orientacyjnego celu do sytuacji. Wybrane 3 miesiące × 2 000 zł niezbędnych kosztów = 6 000 zł. W kosztach wymagane minima długu są już uwzględnione jeden raz. Koszty pozostają stałe; pomijamy odsetki i opłaty. | Policz alternatywne wybrane 6 miesięcy: 12 000 zł. Opcjonalnie wskaż liczbę w przykładzie bez swoich danych. |
| `emergency-fund-characteristics` / C / 25 | Rozróżnienie dostępu, kosztów i ryzyka. Hipotetyczna rezerwa 200 zł − nagły wydatek 150 zł − hipotetyczna opłata dostępu 20 zł = 30 zł, jeśli środki są dostępne na czas. | Sprawdź jeden warunek przykładowego opisu; nie wybieraj dostawcy i nie otwieraj konta. |
| `emergency-fund-start` / B / 20 | Osiągalny dobrowolny początek. Wpływ 1 000 zł − potrzeby 900 zł − wymagane minima 80 zł = 20 zł nadwyżki. Dobrowolny wybór 10 zł do przykładowego małego celu 50 zł zostawia 10 zł. | Przy wpływie 980 zł nadwyżka i przelew to 0 zł; przy 970 zł przelew nadal 0 zł. Wskaż kwotę w przykładzie bez wykonywania przelewu. |

To trzy **odrębne hipotetyczne przykłady**. Nie sumują się w rzeczywisty budżet użytkownika. W pierwszym modelu minima należą już do 2 000 zł, a w trzecim są jawnie osobną pozycją poza potrzebami 900 zł. Nie liczymy żadnego minimum dwukrotnie i nie wyznaczamy terminu uzbierania rezerwy.

3–6 miesięcy jest orientacyjną opcją planowania, nie uniwersalnym wymogiem, dolnym progiem lub obietnicą ochrony. CFPB uzależnia potrzebną kwotę od sytuacji i dopuszcza mały start; nie używamy tego materiału jako źródła obowiązkowego zakresu miesięcy. [CFPB — przewodnik budowania funduszu awaryjnego](https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/). Zakresu wydatków nie przypisujemy NBP.

Miesiąc kosztów nie jest wymaganym pierwszym kamieniem milowym. Każdy krok uwzględnia nieregularny dochód, podstawowe potrzeby i wymagane minima, opcjonalność oraz spokojny powrót. Brak nadwyżki nie wymaga wpłaty; nie pożyczamy na oszczędzanie. Nie obiecujemy, że jakaś kwota pokrywa większość typowych zdarzeń.

Niska zmienność i dostępność nie oznaczają automatycznie braku straty, kosztu lub opóźnienia wypłaty. Ochronę depozytów rozpatrujemy jako zakres wymagający sprawdzenia podmiotu i produktu; bez kwot gwarancji, terminów ustawowych lub porady produktowej. [BFG — gwarantowanie depozytów](https://bfg.pl/gwarantowanie-depozytow/). Ryzyko inwestycji i ochrona środków potrzebnych na bieżące życie pozostają oddzielną kwalifikacją. [KNF — Inwestuj świadomie](https://www.knf.gov.pl/dla_konsumenta/kampanie_informacyjne/Inwestuj_swiadomie).

## Curriculum, quiz i odczyt

Kolejność prowadzi od wyboru elastycznego celu, przez krytyczną ocenę warunków dostępu, do małego kroku z rzeczywiście dostępnej kwoty w przykładzie. Każdy krok ma cel, wyjaśnienie, przykład PLN, ćwiczenie, opcjonalne działanie i powrót po przerwie. Quiz ma trzy istniejące pytania, sześć wersji językowych i dziewięć dwujęzycznych uzasadnień dystraktorów; tłumaczenia nie zwiększają liczby ID.

Robocza mapa autora do ramy EU/OECD 2022: pierwszy krok 142/152/154, drugi 155/164/168, trzeci 143/152/156. Obejmuje potrzebną kwotę przy utracie dochodu, realistyczne cele, płynność oraz dostosowanie do zmian wpływów. To projektowe odniesienie, bez certyfikacji curriculum i bez dowodu poprawy kompetencji lub dobrostanu. [EU/OECD — rama kompetencji finansowych dorosłych](https://finance.ec.europa.eu/system/files/2022-01/220111-financial-competence-framework-adults_en.pdf).

Pełny draft odczytu policzono statycznie według aktualnego formatu QuizCard: pytanie oraz `A. `–`D. ` z czterema opcjami, połączone spacją. Nie zwiększono limitu 500 i nie oparto pomiaru na obciętym tekście.

| ID | PL | EN |
| --- | ---: | ---: |
| `emergency-fund` | 198 | 198 |
| `emergency-fund-characteristics` | 226 | 228 |
| `emergency-fund-start` | 318 | 297 |

Maksimum to 318/500 znaków. To sprawdzenie draftu, nie PASS rzeczywistego odczytu UI lub audio.

## Jawnie odroczony nietarget i następna brama

`emergency-first-milestone` jest osobnym istniejącym rekordem poza trzema ID etapu. Ma powiązane twierdzenie o pierwszym miesiącu i badaniach. **Nie zmieniamy go i nie zatwierdzamy go w C17.** To ograniczenie spójności pozostałego banku, wymagające oddzielnego zakresu; nie ukrywa go przyjęcie tej trójki.

Autor nie wdraża draftu. Następna brama to niezależna recenzja finansowa wszystkich liczb, dziewięciu dystraktorów i równoważności PL/EN, następnie osobne zwolnienie implementacji przez roota. Siedem pozostałych bloków językowych, stare helpers/baselines/testy, SRS i historia pozostają niezmienione. Bez nowych danych profilu, usług, produktów, rynków, płatnych wywołań, commit/push/deploy lub zapisów AI/cloud.
