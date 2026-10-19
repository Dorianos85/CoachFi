# C28 — niezależna recenzja actualDaily PL/EN

Przyjęto lokalnie 25/25 prób UI w pierwszym przebiegu po zmianie 12 obiektów treści; 0 otwartych findings. Root wykonał 43/43 (18 finansowych +25 UI), z czterema niezmienionymi pinami i 25 zapisanymi obserwacjami. Reviewer nie uruchamiał testów.

Baseline UI miał już 25/25 PASS: wszystkie sześć wpisów PL istniało. Początkowy wynik 41 to25PASS/16FAIL finansowych, później osobno dwie NOWE próby C2 dały0PASS/2FAIL na starych danych. Sześć zbyt wąskich guardów finansowych rozszerzono przed zmianą danych, siódmy warunek ENc4 po zmianie danych i przed pierwszym43. Dawne raw i wyrażenia zachowano w dowodach; nie deklarujemy literalności siedmiu guardów ani naprawy błędu UI/missingPL.

Niezależnie odtworzono exact forward/inverse sześciu istniejących EN i sześciu istniejących PL obiektów. Aktualne teksty odpowiadają zatwierdzonemu draftowi57ae4b5e…; poza nimi bajty są literalne. Bank82, wyzwania20, istniejące PL71, klucze B/C/B/C/D/B i50 punktów pozostają. Aplikacja i rotacja są niezmienione.

Rzeczywiste daty UTC wybierają c1–c6. BłędneA pokazuje właściwe wyjaśnienie bez zapisów/nagrody; poprawny klucz zapisuje175 i właściwą datę, a ponowne wywołanie/freshmount nie przyznaje kolejnych50. Historyczne SRS i retirement2 pozostają literalne. Pełne pytanie z ABCD ma maksymalnie296 znaków, rzeczywisty wrongbanner z wyjaśnieniem382, oba≤500; sprawdzono props, bez audioPASS. Activity jest jawnym mockiem.

C28-FIXTURE-01 zamknięto przed pierwszym wykonaniem: identyczne numeryczne opcje c5 są dopuszczalne między PL/EN. Root niezależnie zaakceptował pełne fixture UI i E2E. Browser12 pozostaje na tym etapie pending root runtime. Finanse/arytmetyka mają odrębną recenzję; inne siedem tłumaczeń i dawna historia nie mają nowego contentPASS. Bez Auth/provider/RLS/staging/CI/freshcheckout/produkcjaPASS.

Dowody: [UI JSON](../../../evidence/cycle-28/ui-review-final.json), [raw43](../../../evidence/cycle-28/acceptance-tests.json), [run/25 obserwacji](../../../evidence/cycle-28/acceptance-run.json).
