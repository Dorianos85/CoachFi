# Niezależny przegląd finansowy C36

Przyjęto ograniczony rzeczywisty przegląd trzech pytań IKE/IKZE i PPK w PL/EN oraz raw pierwszego postsource: **21/21 PASS — 8 FIN i 13 UI**. Przed zmianą ten sam fixture dawał 8 FIN FAIL i 13 zdrowych UI PASS; wszystkie osiem pierwotnych nazw finansowych zamknięto bez ponownego zmieniania oracli. Cztery piny źródeł/testów pozostały zgodne w przebiegu.

Sprawdzono sześć wersji i dziewięć par objaśnień błędnych odpowiedzi. Zachowano B/B/B, nagrody metadanych 35/30/25 i 82 identyfikatory. Poprawne wcześniejsze stawki i kwoty nie były błędami rachunkowymi.

IKE ma warunkowe zwolnienie przy kwalifikującej wypłacie. Odliczenie IKZE jest roczne, ograniczone ustawowym limitem i zależne od właściwego dochodu/przychodu oraz sytuacji podatkowej. Dla oszczędzającego rozróżniono kwalifikującą wypłatę po 65. roku życia i wpłatach w co najmniej pięciu latach od wcześniejszego zwrotu. 10% dotyczy całej kwalifikującej wypłaty. Uwaga FIN-C36-01 o roczności została zamknięta w drafcie i rzeczywistym źródle.

PPK używa ustawowej podstawy, a wpłata pracodawcy może mieć konsekwencje PIT z uwzględnieniem zwolnień. Niezależny rachunek w groszach: 6000 zł × 2% = 120 zł pracownika; × 1,5% = 90 zł pracodawcy; opcjonalne dodatkowe 2,5% = 150 zł, zatem maksymalnie 240 zł pracodawcy. To jeden hipotetyczny okres i kwoty wpłat, bez obliczenia pensji netto, podatku lub zysku. 250 zł jest jednorazowe, a 240 zł roczne jest warunkowe; nie przedstawiono dopłat jako gwarantowanej stopy zwrotu.

Źródła pierwotne odczytano 16 października 2026: [ustawa IKE/IKZE](https://eli.gov.pl/api/acts/DU/2004/1205/text/U/D20041205Lj.pdf), [ustawa PIT](https://eli.gov.pl/api/acts/DU/1991/350/text/U/D19910350Lj.pdf), [ustawa PPK](https://eli.gov.pl/api/acts/DU/2018/2215/text/U/D20182215Lj.pdf) oraz [MF o odliczeniu IKZE](https://podatki.gov.pl/ulgi-i-odliczenia/ulga-na-ikze-pit). Aktualne teksty U i istotne artykuły są rozdzielone od starszych materiałów objaśniających w financial-primary-sources.json.

Pełny initial fixture i pięć korekt zachowano przed pierwszym baseline: cztery równoważności językowe oraz naprawę warunku, który błędnie uznawał „stopę zwrotu” za wcześniejszy zwrot środków. Root niezależnie przyjął pełny inverse; nazwy, dziewięć expect i rachunki pozostały literalne. Final23ff był identyczny w baseline i postsource.

Jawne ES/FR pozostają poza zakresem; pięć widoków korzystających z EN dziedziczy zmianę bez nowej akceptacji rynku. Adaptery historyczne i ich wybrane wykonanie mają odrębne rekordy. Ten werdykt nie jest pełną opinią prawną, indywidualną poradą ani PASS produkcji, Auth/RLS lub stagingu. Recenzent nie wykonywał runtime i nie zmieniał produktu.
