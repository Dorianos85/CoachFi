# C48 — poprawne liczniki serii w wybranym eksporcie

Status: ACCEPTED_LIMITED_LOCAL_UNSTAGED. 17.10.2026. Autor kodu: root. Niezależni recenzenci: c47_curriculum i c47_dependencies; root osobno recenzuje fixture napisaną przez c47_curriculum. Zmiana lokalna, produkcja NO-GO.

Eksport przyjmował np. currentStreak=1.5 albo currentStreak=4 i longestStreak=3, choć rzeczywisty reader odrzuca takie rekordy. Te liczby trafiały do wyniku buildOwnedLocalDataExport, który panel prywatności serializuje do pobieranego pliku. Odtworzono to na danych syntetycznych, bez odczytu sesji lub danych rzeczywistych użytkowników.

W lib/data-export.ts rozszerzono wyłącznie jeden warunek: oba liczniki muszą być całkowitymi bezpiecznymi liczbami, a longestStreak nie może być mniejsze od currentStreak. Nieprawidłowy rekord jest pomijany zgodnie z istniejącym selected export. Dane źródłowe pozostają nienaruszone; nie ma zaokrąglania lub naprawy cache. Format, pozostałe pola, limit 100000, daty, owner/revision fences i wszystkie inne gałęzie sanitizera są identyczne.

| Sprawdzenie lokalne | Wynik |
|---|---|
| Nowe przypadki przed poprawką | 18: 9 PASS / 9 FAIL, wyłącznie oczekiwane błędy pomijania rekordu |
| Te same przypadki po poprawce | 18/18 PASS, niezmieniona fixture i kolejność przypadków |
| Dotknięte historyczne testy export/ownership | 26/26 PASS w czterech plikach, jeden przebieg |
| TypeScript bez emisji | exit0; 545 wejść bez driftu |
| Jeden kontrolowany build TEMP | PASS z zachowanymi ostrzeżeniami CDP; 34 strony, 35 tras; 545 wejść przed / 544 po, 0 driftu |
| Niezależne recenzje | dwa końcowe niezależne review PASS; 0 otwartych uwag |

Dziewięć nieudanych oracli dotyczy trzech kształtów błędnych liczników: trzy bezpośrednie przypadki sanitizera oraz sześć przypadków buildera w local/session. To nie dziewięć osobnych usterek. Łącznie po zmianie przeszły 44 różne przypadki w dwóch przebiegach; nie uruchamiano jednej wspólnej suity 44 ani pozostałych zielonych testów C47.

Nowa fixture używa rzeczywistych modułów readera, sanitizera, buildera i product-storage leases z syntetycznymi Mapami. Mocki obejmują wyłącznie writer-only persist/notify; fetch jest pułapką, zegar stały. Testy potwierdzają zachowanie zdrowej drugiej przestrzeni, wybranych innych pól, dokładnej listy kluczy, pomijanie identity/auth/free text, brak zapisu lub usuwania raw oraz blokady starego/mieszanego ownera i zmiany ownera podczas odczytu. Kontrole zdrowego zera i górnej granicy pozostają zielone. Nie sprawdzano nowego UI, Blob/download lub rzeczywistej trwałości przeglądarki.

To korekta całkowitości i kolejności liczników, nie pełne ujednolicenie schematów. Dotychczasowe różnice są jawnie sprawdzone: eksport nadal pomija limit 100001 i pustą datę 0/0, które reader dopuszcza; eksport nadal dopuszcza prawidłową datę przyszłą, którą reader odrzuca. Pozostałe decyzje dotyczące dat i zakresu danych nie zostały zmienione.

Zachowano 543 z 544 wcześniejszych wejść; jedyną kwalifikowaną zmianą jest lib/data-export.ts. Wszystkie 124 wcześniejsze ścieżki z 126 zapisanych tupli, dziewięć wskazanych plików preserve i dziewięć receipts C39–47 pozostają literalne. Nowa fixture zwiększa manifest do 545 wejść. Zależności, rzeczywisty parser 6.1.4 i jego konsumenci pozostają bez zmian. HEAD, gałąź i istniejący index zachowane; nowy przyrost bez stagingu i commit.

Osobny triage zależności jest źródłową obserwacją kolejnego nieużywanego SDK i nie stanowi zgody na jego usunięcie lub zamknięcia advisories. C45 residuals oraz ostrzeżenia CDP pozostają otwarte. Używany jest istniejący runtime z ograniczeniem clean-install odziedziczonym z C47; brak świeżego audit, stagingu, pełnych praw cloud lub oceny prawnej. B05/B10 i 40 zadań zachowują częściowe statusy. AI i cloud writes hardOFF. Bez push, deploy, migracji, zapisów produkcyjnych lub płatnych wywołań.

[Dowody, baseline i recenzje C48](../../../evidence/cycle-48).
