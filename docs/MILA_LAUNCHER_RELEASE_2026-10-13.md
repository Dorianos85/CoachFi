# Mila — etykieta i położenie przycisku rozmowy

Data: 13 października 2026, Europe/Warsaw. Zakres: istniejący przycisk Mili i etykieta rozpoczęcia rozmowy w widgetcie ElevenLabs.

## Wynik

STATUS: DONE / TESTED. Gate: PASS dla tej wąskiej poprawki UI.

- Polski przycisk: „Rozpocznij rozmowę”; tekstowy tryb: „Rozpocznij czat”.
- Odpowiedniki dla wszystkich 9 obecnie obsługiwanych języków UI: EN, PL, ES, FR, ZH, JA, HI, PT-BR, TR.
- Kompaktowy przycisk znajduje się w prawym dolnym rogu. Poniżej breakpointu 1024 px pozostaje nad dolną nawigacją; uwzględnia CSS safe-area.
- Widget dostaje `text-contents.start_call` i `start_chat`. Zweryfikowany kod vendora 0.19.0 nadaje tym wartościom pierwszeństwo przed domyślnymi tekstami i presetami dostawcy.
- Kliknięcie wybiera dokładną etykietę właściwego trybu, a nie ogólne dopasowanie „call”, które mogłoby wskazać zakończenie rozmowy.
- Otwarte okno rozmowy zachowuje dotychczasowy układ. Głos Hope, zgody, klucze, routing AI i logowanie nie zostały zmienione.

## Wydanie i dowody

| Pole | Wynik |
|---|---|
| Produkcja | https://coachfiai.com |
| Commit produkcyjny | `8ed10bec2e91da27ba79a839322889b217b0cdf8` |
| Deployment | `dpl_CkB2wcyN867Vcv4A3gXWx17u1ZT1`, READY, alias `coachfiai.com` |
| Commit poprawki UI | `323a608` |
| Typecheck | `npm run typecheck`: PASS |
| Unit | `npm test`: 49/49 PASS, w tym etykiety wszystkich 9 języków |
| E2E bez CDP | 16/16 PASS: 8 nowych testów widgetu i 8 bazowych testów; zero pominięć |
| Osobna regresja CDP | 5/5 PASS: logowanie i głos; zero pominięć |
| Krótki przegląd logów | Brak logów error/fatal dla tego deploymentu w sprawdzonym oknie 5 minut; nie jest to gwarancja braku wszystkich błędów klienta |
| Produkcja, 390×844 | Widoczny tekst „Rozpocznij rozmowę”; przycisk x=143,83, y=676, w=215,17, h=56; nawigacja zaczyna się przy y=746,5 — brak nakładania |
| Produkcja, 1440×900 | Widoczny tekst „Rozpocznij rozmowę”; przycisk x=1166,52, y=820, w=234,48, h=56 — prawy dolny róg |

Kod aplikacji po dwóch bezkonfliktowych merge'ach jest identyczny z przetestowanym kandydatem `1a1785a`; sprawdzono `git diff --quiet` dla komponentów, app, lib, context, tests i konfiguracji. Zachowano nowe commity właściciela dotyczące white paper i roadmapy. Nie użyto force-push.

## Testy i ograniczenia

Nowe E2E sprawdzają 360×800, 390×844 i 1440×900, odstęp od nawigacji, klawiaturę oraz rzeczywisty skrypt widgetu dla EN/PL/JA z celowo błędnymi angielskimi presetami dostawcy. Testy kliknięcia przechwytują natywne zdarzenie, aby sprawdzić wybór rozmowy głosowej lub czatu bez uruchamiania połączenia i mikrofonu. W testach otwarto zamknięty shadow root wyłącznie do inspekcji; nie zmieniono tego zachowania w produkcji.

Nie deklaruje się pełnego testu WCAG, rzeczywistego Safari/iOS z notchem ani nowej rozmowy mikrofonowej. Pozostałe języki sprawdzono jednostkowo, nie przez pełną rozmowę u dostawcy. 9 języków UI nie oznacza 32 ukończonych lokalizacji ani potwierdzonej obsługi głosu dla każdego języka.

## Agenci i rollback

Mila Voice (`05-mila-voice`) odpowiadała za komponent; Release & QA (`03-release-qa`) za E2E. Root użył Product Learning i Trust Review do przeglądu etykiet, dostępności i ograniczeń oraz Vercel deployments/CI-CD do weryfikacji publikacji.

Rollback owner: founder / Release & QA. Wyzwalacz: brak przycisku, nieprawidłowy wybór trybu lub utrudniona obsługa klawiaturą. Poprzednie wdrożenie `dpl_FZUSLwfAcrjhgDk8mg1mzpNawjFZ` z commitu `2466840` zachowuje poprzedni, działający głos; rollback przywróci jednak również dawną etykietę i położenie. Preferowana naprawa roll-forward albo odwrócenie wyłącznie commitu UI `323a608`, bez cofania późniejszych dokumentów właściciela. Brak migracji danych do odwrócenia.

## Zrzuty QA

- [Telefon 360 px](evidence/mila-launcher-2026-10-13/mila-launcher-360.png)
- [Telefon 390 px](evidence/mila-launcher-2026-10-13/mila-launcher-390.png)
- [Desktop 1440 px](evidence/mila-launcher-2026-10-13/mila-launcher-1440.png)

NEXT: po zmianie wersji widgetu powtórzyć test pierwszeństwa etykiet i wyboru przycisku. Nie zmieniano polityki zgód ani ustawień wieku użytkownika.
