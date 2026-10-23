# Cykl 11 / B06 saving-habit — niezależna recenzja UI

15.10.2026. Recenzent `/root/daily_ui_review`, autor treści `/root/daily_author`, autor resolvera i naprawy wspólnej lekcji — koordynator. **LIMITED ACCEPT lokalnego modułu PL/EN**. Cztery findings aplikacji zostały odtworzone, poprawione przez autora i niezależnie retestowane. Własne 20 różnych cases przeszło w trzech celowanych przebiegach: **4/4 + 14/14 + 2/2**, nie pojedyncze20/20. Recenzent nie edytował aplikacji ani treści. Produkcja **NO-GO**.

Odczytano root/repo AGENTS.md, program, backlog B06, current-cycle, raporty C6/C10 oraz skille frontend-quality, ux-accessibility i localization. Dorośli, Polska, PL/EN. Testy wyłącznie lokalne i syntetyczne; bez realnych kont/sesji/profili/sekretów, płatnych usług, produkcyjnych zapisów, push/deploy lub nowego zakresu danych. Merytoryczna recenzja finansowa należy do niezależnego recenzenta treści, nie jest zastępowana porównaniem tekstów w UI.

## Baseline i findings

Rzeczywiste `getTopicQuestions("pl", "saving")` odtworzyło trzy angielskie fallback rekordy mimo istniejących canonical PL: `budget-50-30-20`, `high-yield-savings`, `dca`. Pierwszy structural run zgłosił ENOENT dopiero przy zapisie dowodu do brakującego katalogu; reporter utworzył katalog. Nie zmieniono żadnej asercji; drugi run **1/1 PASS** zapisał pool, source i hashes. Oba raporty zachowano. To reprodukcja baseline, nie acceptance i nie stara przeglądarka. Pierwotny resolver SHA256 `3574f3aa62cc026a39554f6efd184290328e8992c668b704e8d9e3ebdac9e03a`.

Pierwsze cztery niezależne actual-component cases dały **0 PASS / 4 FAIL** na niezmienionym wtedy generic lesson SHA256 `aeeec2e44782d07bb47d950d5d4e4c16619768a98c8a60e2aa3072d59fd7288b`:

- **C11-UI-01:** przechwycony Next po zmianie ownera zmieniał lokalne dane nowego ownera.
- **C11-UI-02:** dwa wywołania tej samej zamkniętej funkcji Next przed renderem pomijały drugi krok i pokazywały trzeci.
- **C11-UI-03:** odziedziczony prototype route `toString` kończył się TypeError podczas czytania lesson copy zamiast controlled notFound.
- **C11-UI-04:** odmowa zapisu lesson-step wychodziła z efektu jako uncaught throw, bez kontrolowanego ostrzeżenia i blokady.

Koordynator dodał own-property route guard, owner/ticket/cleanup i ograniczenie Next do przechwyconego bieżącego indeksu. Synchroniczny saving lock odgradza reentry podczas zapisu/powiadomienia. Błąd zapisu daje alert PL/EN oraz RAM blokadę Next/quiz link; zmiana języka jej nie usuwa. Dane pozostają zachowane, bez rollbacku lub automatycznej nagrody.

**C11-UI-01..04 CLOSED:** retest dokładnie czterech cases dał **4/4 PASS**, bez zmiany oracles. Dwa dodatki fixture mają dokładne append/inverse proofs; usunięcie nowych bloków odtwarza pierwotny finding fixture SHA256 `2f0fa193ba7c7567a525fbe637326395d0b91525a0b9ad8bd388b4018939f62c`. Istniejące cztery assertions i harness zachowano. Mock useLayoutEffect/useRef był dostępny od pierwszego wykonania, więc naprawa strony nie wymagała osłabiania lub przebudowy adaptera.

## Sprawdzone lokalnie

Harness wywołuje rzeczywisty generic lesson wrapper/body oraz QuizCard, resolver, SRS, punkty i adapter własności. Kontroluje hooks/storage/time; nie jest ReactDOM ani dowodem rzeczywistego auth/providerów. Ustalony czas1.01.2026 usuwa zależność od hostdate; realny fetch jest zabroniony.

Nowe **14/14** content/lifecycle cases potwierdzają:

- Wszystkie cztery canonical PL/EN pytania, opcje A/B/C/D, brak EN fallback w PL, poprawne success/retry oraz pełny tekst question/answers w obu VoiceButton props.
- Zachowane IDs `saving-habit`, `budget-50-30-20`, `high-yield-savings`, `dca`; klucze C/B/B/C, nagrody25/25/20/30. To cztery pytania w dwóch językach, nie osiem osobnych pytań.
- Wrong nie przyznaje punktów; retry zapisuje poprawną odpowiedź/SRS dokładnie raz w bieżącym podejściu. Salda125→150→175→195→225, przyrost100.
- Cztery rzeczywiste kroki lekcji zapisują kolejno progress1..4, prowadzą do `/quiz?topic=saving` i nie przyznają punktów za samo wyświetlenie tekstu.
- Completion/restart/locale reset zachowują istniejący postęp bez nowej nagrody lub starego zaznaczenia; stale callbacki gościa/konta nie zapisują ownera B.
- Nieznane/prototype query do quizu zachowują bieżącą zwykłą pulę czterech pytań.

Dwa dodatkowe cases **2/2 PASS**, bez ponawiania wcześniejszych18green: prawdziwe `subscribeSignInProgress` notify reentry nie przechodzi do następnego kroku podczas zapisu; odmowa ostatniego kroku blokuje quiz link/stary Next, zachowuje progress3 i125punktów także po zmianie języka. Wspólny komponent nie ma VoiceButton ani readText, więc limit audio nie ucina treści lekcji w tej ścieżce. QuizCard rzeczywiście ogranicza prompt do500znaków; pełne prompt/opcje nowych pytań mieszczą się w tym limicie i zostały sprawdzone przez props, bez prawdziwego audio.

App i resolver hashes pozostały zgodne we wszystkich trzech przebiegach. Finalny generic page: `7502813a50def0dd53c301a9d229e57b9f935908aff4e63616937ce19f946ede`; resolver `94c2a2cacf7d05f35ed4f4aa42a2bb6fd39f638f771b4a1476f2890628ccc743`. Pełne fingerprints są w `ui-review-final.json`. Początkowe failures i filtrowane pominięcia zachowano; pominięcia w celowanych runs nie są wyłączonymi testami finalnej paczki.

## Przeglądarka — przygotowane, pending koordynatora

`saving-content.spec.ts`: **8 nowych cases, 4PL/4EN**. Fresh synthetic guest, browserUTC/czas1.01.2026, zewnętrzny ruch browser zablokowany. Lesson4→quiz4/salda/SRS/reload; wrong/retry/locale; mobile375px keyboard i controlled prototype route404; first-step writer denial z alert/disabled Next oraz jawnym fresh reload odczytującym dane. Bez prawdziwego audio, auth/AI lub produkcji. Alert/lesson/quiz/card są scoped do właściwych komponentów. Koordynator wykonuje niezależny przegląd fixture, browser, aggregate, TS i build; recenzent nie uruchamiał dodatkowego serwera.

## Ograniczenia

RAM blokada nie daje durable recovery, exactly-once między kartami, migracji lub atomic rollback. Zapis kroku to lokalny licznik widoku, nie dowód zrozumienia lub korzyści użytkownika. Quiz ma wcześniej opisane ograniczenia remount/reward recovery; ten cykl ich nie usuwa. Nie oceniono innych rynków/języków, pełnego WCAG/czytnika ekranu, realnego auth/RLS/chmury, stagingu lub produkcji. Pozostały B06 pozostaje otwarty; cloud writes/AI są wyłączone.

Dowody: baseline i jego oba reports, `ui-review-lesson-findings.json`, pierwotny0/4 i retest4/4, nowe content14/14, extra2/2 oraz `ui-review-final.json`. Acceptance i extra append proofs zachowują wszystkie początkowe finding assertions. Nie powtarzano niezmienionych zielonych ścieżek C9/C10.
