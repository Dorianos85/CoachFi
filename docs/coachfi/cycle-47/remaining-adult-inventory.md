# C47 — pozostały bank pytań dorosłych PL/EN

Status: CHECKED_SOURCE_ONLY_INVENTORY_NOT_PRODUCT_ACCEPTANCE. Autor: c47_curriculum. 2026-10-17T09:35:46.840Z. Odczyt źródeł i literalnego AST; bez uruchamiania modułów aplikacji, testów, buildu, przeglądarki, sieci i produkcji. Wymaga niezależnej recenzji.

Bank ma 82 unikalne ID: 62 quiz i 20 challenge. Siedem wcześniej przyjętych modułów dorosłych obejmuje 25 ID oraz 25 kroków na język. To wszystkie siedem etapów poza rodzinnym w obecnej mapie ośmiu etapów. Lista 51 przyjętych osobnych poprawek nie pokrywa się z tymi 25 ID. Łącznie rejestry obejmują 76 ID; sześć pozostaje poza ich sumą. Nie oznacza to nowego przyjęcia wszystkich 76 ani potwierdzenia sześciu błędów.

| Wpis | Wcześniejszy cykl | ID pytań | Kroki PL/EN |
|---|---:|---:|---:|
| money-mindset | 6 | 3 | 3/3 |
| saving-habit | 11 | 4 | 4/4 |
| inflation | 15 | 4 | 4/4 |
| credit-rates | 16 | 4 | 4/4 |
| emergency-fund | 17 | 3 | 3/3 |
| long-term-investing | 24 | 5 | 5/5 |
| retirement | 25 | 2 | 2/2 |

Pozostałe 31 poza listą osobnych poprawek to 25 już objętych modułami oraz sześć poniższych. Wszystkie 82 ID mają jawny override PL w unified resolverze; ta inwentaryzacja nie stwierdza brakujących kluczy PL.

| ID poza sumą rejestrów | Zakres obserwacji |
|---|---|
| joint-finances | rodzinny, odroczony w programie; bez świeżej oceny |
| teaching-kids-money | rodzinny, odroczony w programie; bez świeżej oceny |
| fdic-coverage | istniejąca edukacja porównawcza; bez świeżej oceny |
| us-401k-match | konkretny kandydat do recenzji twierdzenia opisanego niżej |
| tax-advantaged-wrapper | istniejąca edukacja porównawcza; bez świeżej oceny |
| rbi-inflation-target | istniejąca edukacja porównawcza; bez świeżej oceny |

Rzeczywisty QuizCard używa getTopicQuestions. Siedem przyjętych tematów PL/EN ma canonical resolver; zwykły quiz ma tylko 4 pozycje na język. Review używa pełnych 82 ID przez getAllQuestionIds i getQuestionById; brak filtra kraju lub rodzinnego w tym łańcuchu. Family-plan pozostaje source-callable przez ProgressPath i dynamiczny /learn/[stage]. Flagi wyłączają Kids/Web3/marketplace/leaderboard, ale mapa deferred routes nie zawiera tej lekcji. Programowe odroczenie nie jest dowodem jej technicznej blokady; nie aktywowano ani nie przebudowano rodzinnego zakresu. C37 przyjął osobno insurance-purpose, bez przyjęcia całego rodzinnego modułu lub polskiego family quizu.

Jeden konkretny kandydat po wykonalnych poprawkach zależności i integralności: istniejący us-401k-match, klucz B i reward30. EN data/quizQuestions.ts:1480 oraz PL lib/allQuestions.ts:1460 obiecują natychmiastowy 100% zwrot i nakazują zawsze wykorzystać pełną dopłatę; pytanie nie podaje wzoru dopłaty, vestingu, warunków uprawnienia ani budżetu. To źródłowa obserwacja bezwarunkowej treści, a nie zatwierdzona alternatywna porada. Następny krok wymaga świeżej recenzji pierwotnych źródeł o mechanice istniejącego amerykańskiego przykładu, PL/EN dla dorosłych w Polsce, potem baseline i niezależnej recenzji. Bez dodawania rynku USA, IDs, pooli lub zmiany polityki. Pozostałych pięciu wpisów nie sklasyfikowano jako poprawne ani błędne.

Nie wykonano nowego mapowania EU/OECD, badania skuteczności, walidacji finansowej lub implementacji. B06 nadal częściowo otwarte; jego 7 modułów/51 poprawek zachowano. Produkcja NO-GO, brak deploy. Pełne liczniki, rekordy PL/EN, łańcuch callerów, ograniczenia i SHA odczytanych plików: [dowód](../../../evidence/cycle-47/remaining-adult-inventory.json).
