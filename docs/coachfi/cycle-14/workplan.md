# Cykl 14 — integralność kalkulatora inflacji (B23)

15.10.2026. Dorośli w Polsce, PL/EN. Bieżąca gałąź codex/p0-security-consent-export; C13 i wszystkie wcześniejsze zmiany zachowane. Bez commit/push/deploy, produkcyjnych zapisów/migracji, rzeczywistych profili/sesji/sekretów, płatnych wywołań i kontaktów. AI, livevoice, mikrofon, cloud writes, health, Kids, Web3 i afiliacja pozostają wyłączone.

## Powód wyboru i granice

Audyt następnego B06 inflation wykazał problem samego kalkulatora /inflation. Przed zmianą autor i niezależny recenzent odtworzyli po 9 bezpiecznych przypadków rzeczywistego helpera; UI reviewer zachował 0 PASS/11 FAIL rzeczywistego komponentu. Nie wykonywano dużych alokacji. Nieograniczone Array.from jest obserwacją źródła, nie odtworzonym OOM. Kalkulator błędnie przyjmował niepoprawne liczby i okres; wykres porównywał dopłaty 2400/3000 oraz nie kapitalizował wcześniejszych wpłat. EN używało USD mimo rynku Polski.

B23 obejmuje wyłącznie helper, kalkulator i opis jego założeń PL/EN. Lekcje, quizy, punkty, zapis postępu i stare SRS pozostają bez zmian; inventory lekcji/quizu dla przyszłego C15 jest osobnym źródłowym wynikiem bez PASS. Package/lock bez nowej przesłanki nie zmieniamy ani nie ponawiamy audytu.

## Kontrakt

Trzy istniejące funkcje pozostają, buildInflationScenario otrzymuje opcjonalny pełny readonly InflationAssumptions: annualContribution i annualNominalReturnPercent. Defaults 2400 i 5.5 są jawnymi hipotetycznymi parametrami, nie bieżącą stawką ani prognozą. W UI oba można zmienić. To scenariuszowe dane w RAM; bez zapisu, analityki lub nowego profilu finansowego. Dla PL i EN waluta PLN, bez przeliczania kursowego.

Techniczne granice modelu: kwota/dopłata 0..1e12; całkowite lata 0..100; inflacja -99..100%; nominalna zmiana -100..100%. Wyniki i nominalne pośrednie wartości pieniężne mają abs<=1e12, z kontrolą finite/underflow. Pełna nominalna strata -100% może dawać poprawne 0; deflacja może dawać dodatnią zmianę siły nabywczej. Żadnego floor/clamp, naprawy do 0, NaN lub Infinity jako wyniku. Typowany błąd invalid-input/out-of-range/unrepresentable-result.

Parser odróżnia pusty tekst od 0. Do 64 znaków, trim, plain signed decimal z jedną kropką albo przecinkiem jako separatorem dziesiętnym; bez separatorów tysięcy, wykładników lub coercion obiektów. Obie wersje językowe wyjaśniają ten kontrakt. Kwoty ułamkowe dozwolone, okres całkowity.

Wszystkie serie są w cenach roku początkowego. Cash bez dopłat i nominalnego wzrostu; pozostałe dwie serie otrzymują taką samą dopłatę na koniec każdego roku. Model nominalny: saldo następne = saldo poprzednie*(1+r/100)+dopłata, potem dzielimy przez skumulowany czynnik inflacji. Opłaty/podatki pominięte, stopy stałe i hipotetyczne; rzeczywiste wyniki zmienne i możliwa strata. Zachowane trzy klucze serii i Y0..Y100, readonly frozen rows/array.

Niepoprawne pole/wynik daje alert PL/EN i brak wyników, wykresu lub tekstu odczytu wyniku. Własny draft nie jest naprawiany ani zastępowany 0. Poprawna edycja ponownie umożliwia obliczenie. Zmiana pola/języka zatrzymuje dawny lokalny odczyt. Czytelne etykiety, mobilne ograniczenie szerokości i tabela końcowych wartości.

## Własność i recenzje

| Właściciel | Rozłączne pliki | Niezależny recenzent |
|---|---|---|
| daily_author | lib/inflation.ts; cycle14-inflation-author.test.ts; własne data-author raporty/dowody | daily_data_review |
| root | app/inflation/page.tsx; components/InflationChart.tsx; lib/inflation-copy.ts; narzędzia/config/rejestry/ledger | daily_ui_review UI, daily_data_review finance/copy/tools |
| daily_data_review | własne financial-review fixture/raporty; inventory lekcji/quizów | root sprawdza dowody, UI reviewer może recenzować konkretną fixture korektę |
| daily_ui_review | własne UI fixture/E2E/raporty; późniejszy root-ledger QA | daily_data_review dla dwóch zastąpionych orakli, root dla E2E |

Root + 3; brak duplikowania C13. Autor nie przyjmuje własnej zmiany. Wcześniejsze 11 UI failures zachowane. Dziewięć baseline orakli pozostaje; dwie wymagające starej dopłaty 3000 są jawnie retired/superseded, bez PASS, i zastąpione dwoma PL/EN sprawdzającymi aktywne wspólne założenia. Exact before/inverse i niezależny finance review tej adaptacji przed acceptance; nie dopisywać nieużywanej kwoty 3000 tylko dla testu.

Po freeze/review root wykonuje jeden właściwy aggregate, standalone TS, osiem nowych bounded browser cases PL/EN i osobny hash-verified TEMP build/parity. Niezmienionych starych browser/29 boundary cases nie ponawia. Findings poprawia autor, reviewer retestuje; zielonych testów bez zmiany/obawy nie powtarza. Finalna higiena, scoped diff i niezależny QA raportu. Lokalne wyniki i moki nie są staging/production PASS.

## Źródła i ograniczenia

Zweryfikowano EBC: ogólny wzrost cen/siła nabywcza i różne koszyki gospodarstw; SEC Investor.gov: jawne parametry kapitalizacji i brak gwarancji zysku na akcjach. To ogólne definicje, nie prawo/produkty USA dla Polski. Roczne dopłaty na koniec roku i techniczne limity są własnym kontraktem modelu. Dwie próby otwarcia GUS zwróciły Internal Error narzędzia; search metadata dostępne, pełna treść niepotwierdzona i nie jest podstawą bieżących wskaźników. Nie podajemy obecnej inflacji ani stóp.

Brak deklaracji dokładnego rozliczenia księgowego, prognozy, realnych kont/RLS/audio/stagingu, pełnego WCAG lub skuteczności edukacji. B02/B09/B10/B16 i budżet pozostają oddzielne. Po przyjęciu B23 wrócić do istniejących czterech kroków/pytania inflation w B06/C15.
