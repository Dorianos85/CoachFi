# Cykl 12 / B21 — niezależna recenzja licznika kroków

Recenzent: `/root/daily_data_review`. Autor helpera: `/root/daily_author`. Integracja UI i narzędzia: koordynator. Data: 15.10.2026. **LIMITED_ACCEPT_LOCAL_HELPER: 63/63 niezależnych przypadków PASS**, zero pominiętych. Zakres obejmuje rzeczywisty lokalny helper i wrapper na syntetycznej pamięci; nie obejmuje kont lub danych produkcyjnych. Odczytano root/repo AGENTS.md, program, backlog, C11 i skill coachfi-data-integrity.

## Wynik i dowody

Nowy parser przyjmuje wyłącznie znane etapy i całkowite liczniki od zera do rzeczywistej liczby kroków. Błędny lub niedostępny cache pozostaje niedostępny dla zapisu; nie staje się pustą mapą. Zapis odrzuca nieprawidłowy etap i krok przed mutacją, zachowuje prawidłowe pozostałe etapy i potwierdza pełną mapę przed oraz po synchronicznym powiadomieniu.

Własne testy sprawdziły malformed JSON, tablice, wartości proste, częściowo błędne mapy, klucze prototypowe i przyszłe, zero, ułamki, NaN/Infinity i przepełnienia. Objęły odmowę odczytu, false lub wyjątek settera przed i po zapisie, kłamliwy setter, odmowę readback, późny błąd lub zmianę cache podczas powiadomienia, zmianę właściciela podczas odczytu/zapisu/notify, SSR oraz Promise bez fałszywego synchronicznego sukcesu. Poprawne dane pozostają monotonne; powtórzenie tego samego lub wcześniejszego kroku zachowuje surowe bajty i nie powiadamia. Global fetch oraz prawdziwa nieprzechwycona pamięć były zabronione.

Surowy wynik: `evidence/cycle-12/data-review-final-tests.json`. Końcowy werdykt i siedem fingerprintów: `evidence/cycle-12/data-review.json`. Fixture: `tests/cycle12-lesson-step-data-review.test.ts`, SHA256 `0d1723cedb3c4ec16bad96e813aba32cb3acfc7c354f23c480c26e09a91f1f3d`. Helper podczas niezależnego przebiegu 63 przypadków: `967e105bbde7f42ff6a3c8f48d426c347c61195bfe7afb4c8f09dddd1303955e`. Końcowy helper po jedynej delcie komunikatu: `40a35607aa02069d47068520618909e6a4b380f39560efa703434b224454a70f`. Wrapper `lib/signInGate.ts`: `9c9103737efddd0ff353669c7f6095ade500acefd367410c368c819586ba5241`. Własna fixture i wrapper pozostały niezmienione; zmianę helpera po tych testach opisano oddzielnie poniżej. Zielonych testów nie powtórzono.

Niezależnie odtworzono odwrotną deltę wrappera: usunięcie jednego importu i przywrócenie dokładnie funkcji readSteps oraz recordLessonStep daje pełne stare źródło SHA256 `4905a6c9d1c3e56ad4e29a5dc14275f8d164a88aa10ffc2524552bb2cb2d3bc8`. Reguły logowania, konfiguracja, liczby kroków i funkcje czasu rozmowy poza tymi dwiema funkcjami pozostały bajtowo niezmienione. Autor zachował pierwszą nieudaną próbę proof z błędnym matcherem LF/CRLF; poprawiono wyłącznie proof.

## Baseline i zakres odrzuconej dodatkowej próby

Przed zmianą rzeczywistego wrappera wykonano **4/4 niezależne reprodukcje**: nadpisanie błędnego JSON, zapis kroku 1.5, serializacja NaN do null oraz normalizacja tablicy [2] do obiektu z nieznanym kluczem 0. Pełne stare źródło i fixture z hashami zachowano w `data-review-baseline-source.json`, wynik w `data-review-baseline-tests.json`. To dowody defektów starego helpera, a nie dodatkowe acceptance PASS. Odpowiadające im nowe przypadki przeszły niezależnie.

Dodatkowa próba starego zachowania notify/reentry została uruchomiona już po rozpoczęciu zmiany autora i otrzymała uncertain z nowego wrappera. Jej wynik 0 PASS / 1 FAIL / 4 niewybrane zachowano w `data-review-reentry-baseline-tests.json`, a rozbieżność źródła jawnie opisano w `data-review-reentry-baseline-source.json` jako **UNAVAILABLE_OLD_REENTRY_BASELINE_SOURCE_ALREADY_CHANGED**. Nie jest piątą reprodukcją starego kodu ani nowym findingiem aplikacji. Nie przywracano starego repo. Aktualny kontrakt reentry sprawdzono osobnym końcowym przypadkiem: zagnieżdżone przejście do kroku 2 pozostawia krok 2, a zewnętrzny zapis kroku 1 zgłasza uncertain.

## Statyczna recenzja narzędzi C12

**LIMITED_ACCEPT_STATIC_DELTA**, pięć fingerprintów i brak findings: `evidence/cycle-12/snapshot-tool-review.json`. Porównanie z zaakceptowanym C11 potwierdziło dokładne zadeklarowane zmiany prepare/verifier, identyczny build po normalizacji prefixów oraz bajtowo niezmieniony boundary helper. Playwright nadal dziedziczy p0; dodaje nowy lesson-step-integrity do dotkniętych saving/mindset. Zachowano metadata C11 i wcześniejsze kotwice; dodano niezależne data/UI/E2E/tool C12 oraz niezmienione kotwice finansowe C11. Recenzent nie wykonywał tych skryptów, browsera, buildu ani wcześniejszych 29 zielonych przypadków boundary. Faktyczne wejścia kopii i wyniki runtime należą do osobnych raportów koordynatora.

## Zgodność komunikatu błędu — domknięta niezależnie

Aggregate koordynatora miał 1566 PASS / 1 FAIL w 74 plikach. Jedyny FAIL dotyczył historycznej asercji komunikatu dla nieaktualnego ownera: spodziewano się `Storage session changed`, helper zgłaszał `Lesson step save stopped`. Autor przywrócił stary tekst wyłącznie dla statusu stopped. Pełna odwrotna delta daje dokładnie helper testowany wcześniej; nazwa klasy, status, komunikaty retryable/uncertain oraz całe zachowanie parsera i zapisu pozostały niezmienione.

Niezależna akceptacja: `evidence/cycle-12/data-review-compatibility.json`. Historyczna fixture `tests/cycle4-storage-author.test.ts` ma ten sam SHA256 co manifest C11 (`691f7df854a0af81995fc69065d55ba887fb959ea94de2b8dc56bc3dd46dbc4c`); nie zmieniono oracla. Odczytano surowy targeted retest autora: **1 PASS / 0 FAIL / 15 niewybranych**, obejmujący rzeczywiste mutatory na starym syntetycznym ownerze oraz brak persistence/remove/fetch. To oddzielny retest jednej dawnej porażki, nie nowy pełny przebieg 63 przypadków. Finding C12-COMPAT-01 jest zamknięty; innych zielonych testów nie ponowiono.

## Ograniczenia

Helper nie daje transakcji, rollbacku, trwałego dziennika, blokady reentry ani własnej kwarantanny w RAM. Po próbie mutacji uncertain/stopped może współistnieć z zapisanymi danymi. Nie ma gwarancji exactly-once między kartami, przeładowaniami lub ponownym montażem. Blokady UI i stare zdarzenia mają osobną niezależną recenzję.

Nie odczytywano prawdziwych kont, sesji, sekretów ani profili; bez paid calls, nowych danych, migracji, commit/push lub deploy. Auth/RLS, chmura, staging, parser czasu rozmowy i pozostałe dane są poza tą recenzją. Licznik obejrzanych kroków nie jest pomiarem zrozumienia ani naukową walidacją Coachfi. Koordynator prowadzi oddzielne aggregate, TS, browser, build i parity; ten werdykt nie zastępuje tych bramek ani nie nadaje produkcji PASS.
