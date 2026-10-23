# Cykl 2 — niezależna recenzja integralności health i UI

14.10.2026, lokalna gałąź `codex/p0-security-consent-export`; source of truth: przyjęty lokalny [P0](../p0/REPORT.md), bez zmiany produkcji. Autor: `curriculum_pilot`; recenzent: `ux_audit`. **Limited ACCEPT lokalnego helpera, zapisu i ograniczonego UI na podstawie własnych testów, CUA oraz odczytanego harness E2E wykonanego przez koordynatora.** Finalne build/typecheck zaliczono osobno w integracji. Nie zmieniam plików autora; produkcyjny release nadal NO-GO.

## Kontrakt i granice

Finalny helper zachowuje dotychczasowe wagi i ujawnia maksymalnie98 punktów; bez skalowania do100. Pięć nowych kwot PLN musi być finite, nieujemne, <=1e12; cztery deklaracje strict boolean; tekst celu ograniczony do1000 znaków, pusty dozwolony. Świadome zero jest poprawną kwotą; brak pola/string/NaN nie oznacza zera. Zapis i powrót zachowują kompletne odpowiedzi oraz wersję heurystyki, bez fałszywego sukcesu przy storage failure. Nie jest to walidowana diagnoza lub porada finansowa. Aktywny cloud/auth pozostaje poza odbiorem.

Poniższe wartości wyliczono niezależnie przed importem nowego helpera. Oznaczenia: I dochód, E wydatki, S oszczędności, D całkowity dług, C trzymana gotówka; kwoty PLN. „False” oznacza wszystkie cztery deklaracje. Cel8/Cel9 to odpowiednio8/9 niebiałych znaków.

| Fixture | Wejście i warunek | EXPECTED score | Uzasadnienie arytmetyczne |
|---|---|---:|---|
| Zera | I/E/S/D/C0, false, pusty cel | 10 | cash8 + investing2; nie jest to ocena dobrostanu |
| Stary mock | 6000/5200/3000/8000/20000, false, długi cel | 36 | 9.6 +45/13 +32/3 +4 +2 +6 =6967/195≈35.728205; dawne42 jest liczbą demo |
| Maximum wag | 4000/2000/6000/0/0, wszystkie true, długi cel | 98 | cash-flow/risk60, planning32, knowledge6 |
| Granica cash | 1000/750/1125/1000/2000, false, Cel8 | 49 | 18+9+12+8+2 |
| Ponad granicę | Jak wyżej, C2000.01 | 45 | warunek C>I×2 obniża cash component o4 |
| Granica celu | Fixture cash z C2000, Cel9 | 55 | cel >8 znaków dodaje6 |
| Brak dochodu | 0/1000/3000/0/0, false, pusty cel | 28 | savings-rate0, cushion18, debt fallback0 points, cash8, investing2 |
| Brak wydatków | 1000/0/1000/0/0, false, pusty cel | 44 | savings18, cushion fallback0, debt16, cash8, investing2 |
| Deficyt | 1000/2000/0/1000/0, false, pusty cel | 22 | savings0, cushion0, debt12, cash8, investing2 |
| Rounding exact half | 1000/1000/0/625/0, false, pusty cel | 24 | debt13.5 +cash8 +investing2 =23.5 |
| Rounding poniżej | Jak wyżej, D626 | 23 | debt13.496 +10 =23.496 |
| Limit kwot | Wszystkie kwoty1e12, false, pusty cel | 28 | savings0+cushion6+debt12+cash8+investing2 |

Sprawdzono również: brak/unknown fields, string boolean, NaN/±Infinity, ujemne kwoty, przekroczenie1e12, cel>1000, income/expense zero jako niewyznaczalne UI ratios oraz sumę components/groups. Autor potwierdził exact keys/types; test napisano przed odczytem implementacji helpera. Dodatkowa granica subnormal zachowuje stare capped points i publiczne finite-or-null ratios, bez zmiany Infinity→0 przed punktacją. To nie pomiar wiedzy, tylko deklaracja o jej rozumieniu.

## Własny retest i odczyt kodu

`node node_modules/vitest/vitest.mjs run tests/cycle2-health-independent-review.test.ts`: **106/106 PASS**, Vitest4.1.11,14.10.2026, końcowy retest po poprawce waluty. Uruchomiono po INSTALL READY z autoryzowaną eskalacją cache Windows. Pierwsza wersja pure tests92/92 PASS; następnie98/98 po6 persistence/consent/quota cases i106/106 po8 przypadkach waluty. Poprzedni fixture current v2 uzupełniono o nową wymaganą walutę PLN; brak tego pola słusznie został odrzucony przez finalny kontrakt.

Standalone typecheck koordynatora wykrył następnie zbyt ogólny typ `vi.fn()` w moim CloudPusher mocku. Poprawiono wyłącznie test na `Mock<(entity: SyncEntity, payload?: unknown) => void>` z typed callback, bez zmiany działania lub tsconfig. Celowany retest14:14:08:106/106 PASS. Nie zaliczono pierwszego typecheck jako PASS; zbiorcze wyniki przed tą korektą i finalny retest są rozróżnione w integracji.

Syntetyczny window/Map storage, mock global fetch i rzeczywiście zarejestrowany fake CloudPusher zapewniają0 outbound/pusher calls. Sprawdzono:

- Legacycomplete answers są przeliczone (np. stored99→expected49), timestamp zachowany, brak setItem/event przy read. Incomplete/invalid/unknownversion/date są unavailable.
- Current v2 score/scoreMax/components nie zastępują obliczeń z answers; forged metadata98/100 zostaje przeliczone do49/98.
- Zapisv2 następuje przed success event, zwraca expected wynik i kompletne odpowiedzi, nie notifyCloud. Optional consents false wystarczają przy wymaganych zasadach.
- Quota failure zachowuje wcześniejszy zapis i nie emituje success event. Missing required consent nie pozwala odczytać/zapisać score.

Odczytane UI source:5 puste num fields i4 selects; investing odpowiedź edytowalna, EN nadal PLN. Invalid jest powiązany aria-invalid/describedby i planowany focus przez requestAnimationFrame. Brak e-maila, marketing opt-in, fake trial, FamilyActionPlan lub share/100. Saved result ma /98, wersję, grupy60/32/6 i9 jawnych składników; ring liczy score/98. Dirty draft ukrywa stary card do ponownego obliczenia. Storage error nie pokazuje nowego saved status. Home/shell mają osobne demo i saved denominator98 oraz cleanup subscriptions storage/health/consent. Same source reads nie zaliczają jeszcze mobile/focus/browser.

E2E autora odczytano: health-funnel obejmuje guest/max98, inwestowanie98→90/reload oraz home/shell98; health-integrity obejmuje PL/EN missing/negative/zero, blocked storage, required-only, complete/incomplete legacy i immediate withdrawal w home/shell. Po uwadze recenzenta autor dodał bezpośrednie `toBeFocused()` po missing submit w PL/EN. Source zawiera także nowy zapis PLN oraz legacy puste pole kwoty i jawny komunikat braku waluty. Wynik wykonania tych E2E będzie przypisany koordynatorowi.

## Integralność waluty — HEALTH-C2-01

Finding autora, P1, **closed w lokalnym kodzie i niezależnym reteście helpera**: historyczne EN pola miały USD, PL miały PLN, a stary storage nie zapisywał waluty. Przeliczenie indeksu z proporcji nie daje prawa do oznaczenia starych kwot PLN ani ich konwersji. Founder/koordynator przyjął jawne metadane waluty i puste kwoty formularza dla legacy, bez kursów FX lub nowego wyboru waluty.

Finalny kontrakt dopuszcza tylko pary `local_diagnosis/PLN` i `legacy_recomputed/legacy_unspecified`. Kompletne niewersjonowane legacy jest zawsze unknown, również gdy podaje nieudokumentowaną etykietę PLN. Current v2 bez waluty lub z USD/niespójną parą jest unavailable; schema2 nie była dotychczas wdrożona. Normalize zachowuje answers/datę i jest idempotent, bez storage write lub konwersji. Nowy zapis zawsze ma PLN.

Własne8 nowych przypadków PASS sprawdzają idempotence, brak inferencji waluty, zachowanie kwot oraz7 niedozwolonych par source/currency. Odczyt UI potwierdza5 pustych legacy kwot przy zachowaniu deklaracji/celu, score/98 i komunikacie nieznanej waluty; monetary monthlyFree nie jest wtedy wyświetlane jako PLN. Home odczytuje monetary metrics tylko z rekordu PLN. Browser retest tej powierzchni pozostaje odrębną bramką; eksport waluty recenzuje inny wykonawca.

## Własny retest CUA PL/EN

Lokalny `http://127.0.0.1:43191/health-check`, Chrome CUA, 14.10.2026 po ustabilizowaniu currency patch. Pierwsze otwarcie zwróciło timeout Page.navigate, ale odczyt listy kart potwierdził istniejącą kartę i dalsze AX/DOM/screenshot działały. Nie wykonywano pętli ponowień ani prywatnych odczytów storage/profile. Obserwowany formularz nie miał wymaganych terms; nie akceptowano ich i nie wpisywano danych finansowych. Ten CUA wynik dotyczy pustego formularza oraz reversible language/modal/keyboard actions, nie pełnego submit.

| Route/action | Rzeczywisty wynik | Dowód |
|---|---|---|
| /health-check desktop PL → język English | Tłumaczenie heading, labels, instrukcji i deklaracji; EN nadal PLN. 5 num i4 select miały DOM value="". Brak result card i email. | AX + read-only DOM |
| Viewport390×844 EN | scrollWidth375≤390, jednokolumnowy formularz, dolna nawigacja4 ścieżek. Submit disabled bez required terms. | [EN mobile](../../../evidence/cycle-2/ux/health-en-mobile.jpg) |
| Review terms | Modal, focus na Close consent settings; główna treść znika z AX. Required i4 optional unchecked, save disabled. | [Consent EN mobile](../../../evidence/cycle-2/ux/consent-en-mobile.jpg) |
| Shift+Tab z close → Tab | Fokus trafia na Accept all, następnie wraca do close; activeElement pozostaje wewnątrz dialogu. Bez aktywacji accept. | AX + activeElement.closest(dialog) |
| Escape EN | dialogCount0, focus wraca do Review terms. | AX + read-only DOM |
| English → Polski, viewport390×844 | Polskie labels/instrukcje, wszystkie10 pól nadal puste, result card0; scrollWidth375. | [PL mobile](../../../evidence/cycle-2/ux/health-pl-mobile.jpg) |
| Sprawdź zasady → Shift+Tab → Tab → Escape | PL zamknij→Akceptuj wszystko→zamknij; brak wyjścia fokusu, po Escape dialog0 i focus Sprawdź zasady. | AX + read-only DOM |

Po teście zresetowano viewport i zamknięto własną kartę, sygnalizując koordynatorowi zwolnienie przeglądarki. Nie włączano providerów, mikrofonu, kont lub produkcji. Ten mobilny smoke nie jest pełnym audytem WCAG, kontrastu, screen readera ani urządzeń fizycznych. Error focus po submit jest zweryfikowany w izolowanym E2E, nie własnym CUA bez terms.

## Wyniki koordynatora i granice odbioru

Koordynator przekazał finalne **20/20 E2E PASS** po walucie:9 P0+3 health-funnel+8 health-integrity. Recenzent odczytał te pliki i `playwright.cycle2.config.ts`, ale nie wykonał własnego pełnego E2E. Syntetyczny consent/adult storage i ephemeral browser context, blokada ruchu poza localhost; brak realnych kont/danych/providerów. E2E obejmuje error focus PL/EN, puste/ujemne/zero, storage failure bez saved success, required-only, complete/incomplete legacy i unknown units, edycję98→90/reload, /98 home/shell, immediate withdrawal oraz P0 status policy. Własny helper retest pozostaje osobnym106/106.

Koordynator przekazał także zbiorcze Vitest313/313 w22 plikach i Node11/11 (5 hygiene+6 dependencies). Nie wlicza się naszego106 po raz drugi do313. Finalny build34/34 i standardowy typecheck exit0 po korekcie typów w testach, późniejsze106/106 i9/9 oraz własny nonincremental typecheck exit0 są powiązane w [integration-review](integration-review.md). Nauka/finansowe znaczenie wag, docelowy runtime hostingu, produkcyjne auth/sync, shared browser storage, staging/RLS i account-wide deletion pozostają poza przyjęciem. Nie uruchomiono dev/browser/build podczas instalacji npm.

Odczytany SHA256: financial-score `b88f62395e24eb0865731095cb3d31d2bd1ec526d8c5039e8e5933272bbdcdf7`; healthCheck `5b7eef0519cad8fd3501a6e5d0c8a4dd13746eb59723ada8336b90cd0110d6a7`; health page `2cffed3d3136cf8eaa6c994260e2974fe778ae278ac21dfdbdf121f6e5ea2603`; FinancialScoreCard `46e9bbae1d4e394c19589d91635d1d60d8bc661097b2ef6ac02fdbbabdf31d85`. Metadata hashes wiążą oceniony kod, nie dowodzą deployu.
