# Pilot 24 pytań: program, recenzja i rozwój

Data przygotowania: 2026-10-14. Właściciel zadania: role 7/8. Status: **draft_for_review**. Recenzent merytoryczny: rola 3; językowy: rola 21; akceptacja wydania: rola 4 po odtworzeniu dowodów. Niezależny recenzent architecture_audit wykonał przegląd 24 pozycji PL/EN i 9 rachunków wersji 0.1.0; klucze/arytmetyka poprawne, jedna fraza PL wymagała poprawki. Autor naniósł ją w 0.1.1 i zmniejszył tolerancję PLN; wynik ponownego odczytu jest w reviews/quiz-review.md. Retest0.1.1 zamknął uwagę Q01 i zaakceptował materiał w zakresie rachunków oraz PL/EN. Pole reviewer wskazuje architecture_audit i accepted_limited wraz z zakresem/datą; status draft pozostaje. Odświeżenie źródeł przez recenzenta, testy UI i badanie użytkowników pozostają pending. Autor nie zatwierdza własnych pytań ani publikacji.

Problem: potrzebny jest sprawdzalny materiał PL/EN, który rozwija umiejętności codziennych decyzji. Rezultat tej partii: 24 nowe pozycje w pliku `quiz-pilot-24.json`, nie wdrożenie produktu. Zależności: kanonizacja dostępnego źródłowego banku 82 ID, niezależna akceptacja po poprawkach, testy interfejsu/feedbacku i badanie dorosłych użytkowników. Rynek: Polska. EN jest tłumaczeniem, nie wejściem na rynek USA.

## Mapowanie kompetencji i kolejność

EU/OECD 2022 obejmuje cztery szerokie obszary i odrębne wymiary wiedzy, umiejętności/zachowania i postaw. Poniższe osiem obszarów jest **projektem Coachfi według Foundera**, a nie ośmioma kategoriami OECD. [EU/OECD, oficjalny dokument](https://www.oecd.org/content/dam/oecd/en/publications/reports/2022/01/financial-competence-framework-for-adults-in-the-european-union_614b8b97/510f133c-en.pdf).

| Obszar Foundera / ID | Umiejętność sprawdzana | Odniesienie do ramy | Zastosowanie po module |
|---|---|---|---|
| Budżet i przepływy / BUD | Kwoty, daty, saldo i przejściowy niedobór. | Money/transactions oraz planning/managing. | Wpisać jeden termin wpływu i jeden podstawowy rachunek do prywatnego kalendarza. |
| Oszczędzanie i rezerwa / SAV | Potrzeba awaryjna, dopasowany krok, czas do celu. | Planning/managing; safety nets 3.2. | Ustalić mały cel lub poznać ograniczenie bez obowiązku wpłaty. |
| Kredyt i koszt długu / CRD | Koszty poza odsetkami, suma spłat, malejący kapitał. | Credit 2.7. | Spisać warunki przykładowego lub własnego zobowiązania bez danych konta. |
| Inflacja / INF | Nominalna kwota a ilość dóbr możliwa do kupienia. | Prices/purchasing oraz planning/managing. | Porównać cenę jednego stałego koszyka z dwóch dat. |
| Ryzyko i inwestowanie / INV | Koncentracja, horyzont, zmiana wartości portfela. | Risk/reward 3.3; saving/investing. | Spisać termin celu i ograniczenie ryzyka bez zakupu instrumentu. |
| Emerytura / RET | Dane do planu, scenariusze, kapitalizacja. | Retirement 2.6. | Wskazać wiarygodne lokalne źródło do późniejszego sprawdzenia własnego planu. |
| Odporność dochodu / RES | Plan potrzeb, wspólne ryzyko wpływów, okres luki. | Income; safety nets; longer-term planning. | Przygotować scenariusz spadku wpływów i jeden niezależnie sprawdzony kontakt. |
| Oszustwa i bezpieczeństwo / SEC | Niezależny kanał, ochrona konta, pilna reakcja. | Financial landscape oraz digital competences. | Sprawdzić ochronę i sposób odzyskania jednego konta bez udostępniania hasła aplikacji. |

Proponowana kolejność pierwszego przebiegu: BUD → SAV → CRD → INF → RES → INV → RET. SEC pojawia się na początku przy logowaniu i powraca jako osobny moduł. To projekt do oceny, nie twierdzenie o obecnej architekturze ścieżki. Wybór kolejności zależy od problemu użytkownika; zadłużenie lub pilny brak dochodu mogą zmienić priorytet.

## Format modułu

1. Konkretny cel: np. „sprawdzę, czy saldo wystarczy na rachunek przed wypłatą”.
2. Krótkie wyjaśnienie jednej zasady w PL/EN, z datą i źródłem.
3. Jawny przykład, kwoty i założenia; przy kalkulatorze rozróżnienie scenariusza od prognozy.
4. Ćwiczenie prowadzone z możliwość pominięcia danych osobistych.
5. Odtworzenie bez odsłoniętej odpowiedzi: pytanie, wynik i informacja zwrotna wyjaśniająca błąd.
6. Małe działanie dostępne także bez wolnych pieniędzy; użytkownik wybiera „wykonane”, „planuję” lub „nie teraz”.
7. Późniejsza powtórka i zadanie transferowe z innymi liczbami/sytuacją; powrót po przerwie z aktualnym krokiem bez kary.

Interwały 2, 7 i 21 dni są **roboczą hipotezą produktu**, nie zwalidowaną receptą. Użytkownik może zmienić tempo i wyłączyć przypomnienia. W badaniu Karpicke/Roediger powtarzane odtwarzanie słownictwa wspierało późniejszy wynik pamięci; nie dowodzi to jeszcze poprawy finansów ani optymalnego harmonogramu Coachfi. [Badanie pierwotne, 2008](https://doi.org/10.1126/science.1152408).

COM-B stosujemy do ustalenia, czy barierą jest umiejętność, możliwość działania czy motywacja. Brak środków na oszczędności traktujemy jako ograniczenie warunków, nie błędną odpowiedź ani brak ambicji. Skuteczność dopasowanego kroku w Coachfi pozostaje do zbadania. [Michie i współautorzy, badanie/rama z 2011](https://pmc.ncbi.nlm.nih.gov/articles/PMC3096582/).

## Skład i ograniczenia pilota

- 24 niezmienne ID; po 3 pytania na 8 obszarów.
- 8 basic, 8 intermediate, 8 advanced. Są to etykiety projektowe do weryfikacji w pilocie, nie empirycznie ustalone progi zdolności.
- 8 multiple_choice, 9 situational_choice, 7 numeric_response. Wybór odpowiedzi opiera się na ID, identycznym w PL/EN.
- 48 tłumaczeń językowych oznacza **24 odrębne pozycje**.
- Każdy item: cel, domena, poziom, języki, jurysdykcja, prompt/opcje PL/EN, odpowiedź, rationale, błędne opcje lub częste błędy PL/EN, źródła, data, założenia, wersja, status, autor i zakres niezależnej recenzji. Draft nie oznacza dopuszczenia do wydania.
- Waluta przykładu: PLN w obu językach. Jurysdykcja general oznacza brak reguł podatków, emerytur/świadczeń, RRSO i reklamacji; źródła USA wspierają wyłącznie zasady edukacyjne i matematykę.
- Pilot nie jest bankiem w aplikacji ani narzędziem do indywidualnej rekomendacji produktu. Nie zawiera gwarancji zysku, środków awaryjnych ani pomocy.
- Porównano z 82 źródłowymi ID commitu 86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b: brak identycznych promptów nowego pilota; liczne wspólne tematy/kompetencje (tabela poniżej). 24 nowe ID nie oznaczają 24 nowych kompetencji. Powiązanie repo z produkcją potwierdzono metadanymi Vercel A25 (evidence/architecture.json); nie przetestowano pełnej sesji konta.

Źródła przeglądano tekstowo w oficjalnych dokumentach i badaniach pierwotnych; rejestr `evidence/content-sources.json` podaje zakres wykorzystania i ograniczenia. Daty tam oznaczają przegląd źródeł przez autora, **nie akceptację pytania**. Repo jest dostępne w source/CoachFi. Jego QuizQuestion/UnifiedQuestion nie obsługuje obecnie metadanych i odpowiedzi liczbowych pilota; integracja wymaga jawnej migracji schematu oraz testów, których nie wykonano w tym zadaniu.

## Porównanie nowego pilota z istniejącymi 82 ID

Porównanie semantyczne z dostępnego repo; referencje do pełnych ID/kluczy i linii kodu w content-inventory.md. Poniższe nie są propozycją dodania wszystkich pytań do istniejącego banku bez deduplikacji. Cele nowego pilota mogą poprawiać lub rozwijać już testowane kompetencje. Wspólny temat jest oczekiwany; przy liczeniu do160 trzeba ustalić kanoniczne pozycje i odróżnić nowy test zastosowania od kosmetycznego wariantu.

| Nowe ID | Istniejące powiązania | Ocena overlapu |
|---|---|---|
| CF-BUD-01 | track-before-budget; zero-based-budget | Wspólna kompetencja planowania; nowy nacisk na saldo i daty. |
| CF-BUD-02 | track-before-budget; saving-habit | Nowe zadanie terminu wpływu wobec rachunku; częściowy związek z budżetem. |
| CF-BUD-03 | zero-based-budget | Nowy rachunek minimum salda, nie samo równanie bilansu. |
| CF-SAV-01 | emergency-fund; sinking-fund; c10 | Wspólny temat rezerwy; rozróżnienie awaryjnego i planowanego kosztu. |
| CF-SAV-02 | saving-habit; pay-yourself-first | Wspólna kompetencja; poprawiony warunek braku nadwyżki, nie wyłącznie definicja. |
| CF-SAV-03 | emergency-fund; emergency-fund-start | Wspólny cel rezerwy; nowe wyliczenie czasu z saldem początkowym. |
| CF-CRD-01 | debt-avalanche; c4 | Wspólny koszt zadłużenia; koszty i harmonogram wykraczają poza nazwę strategii. |
| CF-CRD-02 | debt-avalanche; c4 | Nowe porównanie sum płatności dwóch opisanych ofert. |
| CF-CRD-03 | compound-interest; c2 | Wspólny mechanizm odsetek; nowy rachunek malejącego kapitału kredytu. |
| CF-INF-01 | inflation-basics | Bezpośredni overlap kompetencji; doprecyzowany ten sam koszyk/niezmieniona kwota. |
| CF-INF-02 | real-return; c5 | Wspólne nominalne/realne; nowy przykład dochodu, nie procent banku. |
| CF-INF-03 | real-return; c5; inflation-silent card | Bezpośredni temat; dokładny iloraz i otwarta kwota zamiast przybliżenia. |
| CF-INV-01 | diversification; c3 | Bezpośredni temat; dodatkowo granice dywersyfikacji i brak gwarancji. |
| CF-INV-02 | invest-prerequisites; emergency-fund-characteristics; c10 | Wspólny dostęp i ryzyko; nowe zastosowanie do bliskiego terminu. |
| CF-INV-03 | asset-allocation; diversification | Nowy ważony rachunek strat/zysków, wspólna kompetencja portfela. |
| CF-RET-01 | retirement-purpose; c13 | Wspólne planowanie emerytalne; zbieranie własnych danych zamiast celu konta. |
| CF-RET-02 | retirement-early-start; retirement-purpose | Wspólna projekcja; nowa ocena scenariuszy/niepewności. |
| CF-RET-03 | compound-interest; retirement-early-start; c2 | Wspólna kapitalizacja; nowy harmonogram końca roku i rachunek. |
| CF-RES-01 | financial-resilience; emergency-fund | Wspólna odporność; konkretne elementy planu przerwy. |
| CF-RES-02 | financial-resilience; joint-finances | Nowe wspólne źródło ryzyka pracodawcy; luźny overlap programu gospodarstwa. |
| CF-RES-03 | financial-resilience; emergency-fund | Nowy rachunek miesięcznej luki po awaryjnym wydatku. |
| CF-SEC-01 | brak bezpośredniego pytania phishing w 82 | Nowe pokrycie w odniesieniu do tego statycznego banku. |
| CF-SEC-02 | brak bezpośredniego pytania konta/2FA w 82 | Nowe pokrycie w odniesieniu do tego statycznego banku. |
| CF-SEC-03 | brak bezpośredniego pytania reakcji po wyłudzeniu w 82 | Nowe pokrycie w odniesieniu do tego statycznego banku. |

82 istniejące ID mają co najmniej11 par identycznych stemów i kolejne bliskie warianty. Nie liczyć 82+24 mechanicznie jako106 odrębnych zatwierdzonych pytań/kompetencji. Stan pilota pozostaje draft_for_review nawet po limited review merytoryki.

## Obliczenia do niezależnego sprawdzenia

Przykłady nie wykorzystują obecnych stóp lub inflacji. Podatki, opłaty i zmiany wartości są pominięte tylko tam, gdzie prompt to jawnie mówi. Wynik liczbowy przyjmować dopiero po własnym odtworzeniu recenzenta.

| ID | Jawny wzór i istotne założenie | Wynik |
|---|---|---:|
| BUD-03 | Salda bez dodatkowych środków: 400; 400−650=−250; +1000=750; −500=250. Dodatkowe saldo = max(0, −min(sald)). | 250 PLN |
| SAV-03 | ceil((3×600−900)/150); wpłaty na końcu miesiąca, zero wzrostu i wypłat. | 6 miesięcy |
| CRD-02 | A=12×100+200=1400; B=12×110=1320; opłata A osobno, oba wpływy 1000. | B tańsza w sumie płatności o 80 PLN |
| CRD-03 | I1=1200×0,01=12; P1=1200−(112−12)=1100; I2=1100×0,01=11. | 23 PLN |
| INF-02 | 1,02/1,05−1=−0,0285714; stały koszyk. | ok. −2,86% siły nabywczej |
| INF-03 | 1000×1,04/1,06=981,132075…; cenowy indeks tego samego koszyka. | 981,13 PLN w cenach początku |
| INV-03 | 600×0,8 + 400×1,05=480+420; udziały początkowe. | 900 PLN |
| RET-03 | 1000×1,05²+1000×1,05+1000; wpłata na końcu każdego roku. | 3152,50 PLN |
| RES-03 | floor((1600−400)/(2200−1800)); naprawa dodatkowa przed 1. miesiącem. | 3 pełne miesiące |

Tolerancja numeric wersji 0.1.1: ±0,005 PLN wobec zaokrąglonego klucza; sąsiedni grosz nie jest zaliczany. Miesiące to liczby całkowite i tolerancja 0. Parser i wartości graniczne nadal wymagają testu działającego interfejsu. Przy INF-03 chodzi o kwotę w cenach początku, a nie nominalne saldo. Przy CRD-02 nie obliczamy APR/RRSO ani indywidualnej opłacalności. Przy RET-03 nie wolno przenosić wpłat na początek roku.

## Niezależna recenzja: bramka przed testem/wdrożeniem

| Krok | Właściciel / niezależny recenzent | Kryterium i zapis |
|---|---|---|
| Merytoryka i kalkulacje | Rola 3, autor 7/8 tylko poprawia | Każdy klucz jest jednoznaczny, każdy wzór policzony niezależnie; wszystkie dystraktory albo częste błędy wyjaśnione. Uwagi wskazują ID i wersję. |
| Źródła i granice | Rola 3 oraz 15 dla ewentualnej treści prawnej | Link wspiera zasadę, przykład wyraźnie hipotetyczny, brak nieuprawnionego transferu reguł kraju. Zmiana na treść regulacyjną wymaga PL źródła i daty obowiązywania. |
| PL/EN | Rola 21 niezależna od autora | Ta sama umiejętność, kwoty, stopa, harmonogram, negacje i poprawna opcja; PLN w EN; poprawne przecinki/kropki. Oddzielny kraj od języka. |
| Techniczna integracja | Role 11/12, sprawdza 4 | Poprawne ID przy mieszaniu kolejności, obsługa braku/nieprawidłowej liczby, feedback, zapis/odczyt wersji, języka i powtórki. Bez realnych płatności w ćwiczeniu. |
| Zrozumienie | Rola 5, recenzja 3/21 | Testy poznawcze wykrywają alternatywne interpretacje, wskazówki pozwalające zgadywać i trudny język; poprawki przed zwiększeniem próby. |
| Dopuszczenie | Rola 4 | Dowody powyższych kroków, brak otwartych błędów materialnych; recenzent/numer wersji zatwierdzenia w banku. Autor nie przełącza statusu sam. |

Samo sprawdzenie struktury JSON nie oznacza poprawności finansowej, skuteczności nauczania, równoważności języków ani bezpieczeństwa aplikacji. Ocena przez niezależnego agenta nie zastępuje badań użytkowników lub lokalnej oceny prawnej.

## Plan badania użytkowników — niewykonany

**Hipotezy:** (H1) osoba potrafi wyjaśnić własnymi słowami, dlaczego odpowiedź jest poprawna; (H2) rozwiązuje nowe zadanie po czasie; (H3) mały krok daje się wykonać w jej warunkach; (H4) PL i EN sprawdzają tę samą kompetencję. Nie deklarujemy wyników badania.

Pierwsza fala: 12–18 dorosłych mieszkających w Polsce, dobór celowy obejmujący początkujących, nieregularny dochód i planujących gospodarstwo. Zapewnić zarówno PL, jak i EN, różne doświadczenie i sprawność liczenia. To projekt jakościowy; nie reprezentatywna próba rynku. Rekrutacja, wynagrodzenie i zapis rozmów wymagają ustalenia budżetu i minimalizacji danych.

Scenariusz 30–40 minut: zgoda na badanie; anonimowy/losowy identyfikator; uczestnik wykonuje 6–8 różnych pytań z rotacją całej partii między osobami; mówi, jak rozumie prompt; odpowiada bez feedbacku; uzasadnia; wskazuje niepewność; widzi wyjaśnienie; wykonuje nowy przykład; wybiera dostępny mały krok. Nie wymagać dokładnego majątku, haseł, kont bankowych, diagnoz zdrowotnych ani wykonania realnego przelewu.

Po 7 i 21 dniach (odstępy pilota, do oceny) zaproponować nowe zadanie o tej samej umiejętności bez podglądu pierwotnej odpowiedzi. Zaznaczyć wynik „brak danych”, jeśli osoba nie wróciła. Nie traktować brakującej obserwacji jako błędnej odpowiedzi. Deklarowane działanie raportować oddzielnie od zweryfikowanego.

Pytania do wywiadu: „Co oznacza dla Ciebie dostępne saldo?”, „Który fragment pozwolił wybrać tę odpowiedź?”, „Czy dwie opcje mogłyby być poprawne?”, „Jak zmieniłby się wynik przy innej dacie wpłaty?”, „Co utrudnia mały krok?”, „Jak chcesz wrócić po przerwie?”. Dla EN sprawdzić rozumienie PLN, essential expenses, principal i purchasing power.

Zapis per item: poprawność, rozumowanie, czas (tylko pomocniczo), pewność, wskazane słowa niejasne, wybór dystraktora, wynik transferu i język. Ocena osobna dla wiedzy, użycia umiejętności i deklarowanego zachowania. Najpierw usunąć każdą materialną niejednoznaczność; kolejne progi trudności, dyskryminacji i liczebności próby ustalić przed analizą w większym badaniu. Pilot 12–18 nie daje podstaw do walidacji skali ani precyzyjnego porównania wyników PL/EN.

CFPB Financial Well-Being Scale może być osobnym kandydatem pomiaru subiektywnego dobrostanu, ale nie zamiennikiem wyniku tych zadań. Przed PL adaptacją potrzebny przegląd tłumaczenia, scoringu i właściwości pomiaru; własny Financial Health Score pozostaje oddzielnym konstruktem. [Oficjalny przewodnik CFPB](https://www.consumerfinance.gov/data-research/research-reports/financial-well-being-scale/).

## Rozszerzenie 24 → 160 po recenzji

Cel roboczy: 20 odrębnych pytań na każdy obszar = 160. Propozycja rozkładu na obszar: 7 basic, 7 intermediate, 6 advanced; łącznie 56/56/48. Tłumaczenia dają 320 reprezentacji, nadal 160 pozycji. To cel projektu, nie obecny stan.

Najpierw kanonizacja i deduplikacja dostępnego banku 82 źródłowych ID, dopięcie niezależnej recenzji 24 po poprawkach, jakościowe badanie i powtórka. Następnie partie +32 do 56, +40 do 96, +32 do 128 i +32 do 160; w każdej wyrównanie pokrycia kompetencji, typów zadań i jakości. Suma nowych pozycji po pilocie: 136. Nie wpisywać dat publikacji bez budżetu i dostępu do implementacji.

Zadania dodatkowe mają testować nowe decyzje i przenoszenie umiejętności, nie tylko podmieniać nazwę lub kwotę. Warianty tego samego zadania do powtórek można utrzymywać pod nadrzędnym objective/variant; nie liczyć mechanicznego wariantu jako nowej kompetencji. Utrzymywać graf kompetencji, recenzje wersji, źródła, przyczyny wycofania i mapę PL/EN.

Do 160 nie włączać automatycznie banku dzieci, porad produktowych i prawnych. Nowe pozycje o Polsce (podatki, świadczenia, emerytury, gwarancje depozytów, reklamacjach) wymagają oficjalnych źródeł PL, dat obowiązywania i właściwej recenzji. EN tłumaczy tę samą lokalną regułę. Kids Mode, afiliacja i Web3 pozostają osobnymi decyzjami.

## Stan dostarczenia

Ukończono nową partię, mapę kompetencji, jawne obliczenia, źródła i plan recenzji/badania. Ukończono statyczną inwentaryzację 82 ID kodu, screening kluczy/opcji/feedbacku i porównanie tematów z pilotem; powiązano commit z produkcją przez A25, lecz nie potwierdzono działania banku na kontach. Niezależny przegląd arytmetyki/PLEN pilota wykonano z ograniczeniami w reviews/quiz-review.md; źródłowa akceptacja wydaniowa, testy użytkowników/scoringu i wdrożenie pozostają pending. Najbliższy priorytet: naprawić wspólne źródło PL/EN oraz błędy pierwszej lekcji i banku, a potem badać pilot.

