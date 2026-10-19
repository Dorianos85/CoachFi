# Mila — nieinwazyjny przycisk rozmowy

Data: 13 października 2026, Europe/Warsaw. Gałąź: `codex/fix-mila-nonintrusive-dock`.

## Zakres i dowód zgłoszenia

Cel: mała Mila w prawym dolnym rogu, bez przechwytywania dotyku i zasłaniania formularzy. Owner: Mila Voice / root, testy: Release & QA. Human approver: founder, wcześniejsze polecenie „wdróż poprawki”. Deadline: poprawka w ramach bieżącego, ograniczonego czasowo zadania. Bez nowych dostawców, kluczy, zmian głosu, zgód, kont, płatności ani danych finansowych.

W otwartej karcie Chrome `coachfiai.com` zaobserwowano stary przycisk „Chat with Mila 🎙️”, 310,83 × 280 px, pod rodzicem `fixed inset-0 ... grid place-items-center`. Karta była otwarta przed zakończeniem poprzedniego wdrożenia. Odświeżenie tej samej karty pokazało „Start conversation”, 220,25 × 56 px, avatar 40 px, w prawym dolnym rogu. Nie czyszczono cookies, localStorage, IndexedDB ani danych konta. `public/sw.js` nie zawiera obsługi fetch/cache; brak dowodu na problem cache service workera.

## Poprawki

- Zwinięty launcher pozostaje w prawym dolnym rogu, nad nawigacją mobilną, z safe-area. Zachowuje wcześniejsze tłumaczenia „Rozpocznij rozmowę” i odpowiedniki 9 języków.
- Dock jest pod modalami (`z-45`) i niewidoczny przy modalnym dialogu oraz aktywnym polu wpisywania. Checkboxy, radia i suwaki nie uruchamiają ukrywania.
- Dolna przestrzeń przewijania pozwala przesunąć ostatnie kontrolki stopki ponad launcher i nawigację.
- Zamknięty host widgetu ma `display: none`; potomkowie vendora nie mogą wtedy przechwytywać kliknięć przez własne `pointer-events: auto`.
- Timeout 4 sekund, bezczynne nieudane połączenie 20 sekund oraz zakończenie rozmowy usuwają `data-open` i przywracają launcher.
- Zdarzenia są ponownie podpinane po zmianie instancji widgetu. Etykiety stanu bezczynnego są odczytywane przy rozpoczęciu, a nie z pustego stanu przed wyrenderowaniem dostawcy.
- Spóźniona konfiguracja nie dziedziczy otwartej ramki; stary timer rozpoczęcia nie uruchamia nowej instancji.

## Testy i bramka wydania

STATUS: DONE / TESTED. Gate: PASS. Launcher: LIVE w zweryfikowanej produkcji; scenariusze awarii i mobilne formularze dodatkowo zweryfikowane E2E na lokalnym buildzie produkcyjnym.

Typecheck: PASS. Unit: 49/49 PASS. Końcowe E2E: **21/21 PASS, zero pominięć, 1,4 min** — 13 testów widgetu i 8 istniejących podstawowych ścieżek. Pierwszy zestaw ujawnił rzeczywiste przechwytywanie kliknięcia przez zamknięty host; nie użyto `force`, naprawiono przyczynę. Kolejny zestaw ujawnił brak ponownego podpięcia zdarzeń i pusty snapshot etykiet; naprawiono przyczynę. Po tych poprawkach i dodatkowej ochronie wymiany instancji przeszły rzeczywisty klik, 4- i 20-sekundowy powrót, formularze, nawigacja i opóźniona konfiguracja przychodząca po rozpoczęciu rozmowy.

E2E używają realnego lokalnego skryptu vendora 0.19.0, syntetycznych danych testowych i przechwyconych sesji. Nie otwierają mikrofonu ani płatnych rozmów; opóźnienia/awarie SDK są kontrolowanymi symulacjami. Nie deklaruje się pełnego WCAG, testów VoiceOver/TalkBack ani rzeczywistego Safari/iOS. Głos i integracja logowania nie zostały zmienione.

`npm run build`: PASS, exit 0, wygenerowano 35/35 stron. Build zgłasza istniejące ostrzeżenia o opcjonalnych modułach Coinbase `x402-fetch` i `@base-org/account`; nie instalowano ani nie aktywowano tych integracji. Nie są to błędy kompilacji poprawki Mili.

Ponowna kontrola `tests/e2e/mila-widget.spec.ts` na lokalnym `next start` z gotowego builda: **13/13 PASS, zero pominięć, 28,6 s**. Zrzuty w tym raporcie pochodzą z tej wersji, bez oznaczeń serwera developerskiego. Agent Release & QA zatwierdził gate dla tego zakresu.

## Wydanie i rollback

Poprzednia produkcja: `8ed10bec2e91da27ba79a839322889b217b0cdf8`, deployment `dpl_CkB2wcyN867Vcv4A3gXWx17u1ZT1` z aliasem `coachfiai.com`. Rollback owner: founder / Release & QA. Wyzwalacz: znikający launcher, blokowanie dotyku albo pozostająca otwarta ramka. Preferowane odwrócenie tylko nowego commitu poprawki; alternatywnie przywrócenie wskazanego poprzedniego wdrożenia przez właściciela. Brak migracji danych. Nie używać force-push ani cofać dokumentów właściciela.

Wydano commit `00d90e707ea3ae449e46e7e4e468e45b714ea6cc`. Vercel deployment `dpl_4uArLMcbNsbvKnG6rjFfiMizLoDk`, READY, production, alias `coachfiai.com`, gotowy 13.10.2026 około 06:05:25 UTC (08:05:25 Europe/Warsaw). Git push był zwykłym fast-forward; nie zmieniono wcześniejszych commitów właściciela.

Sprawdzono publiczną stronę po publikacji w Chrome: widoczny „Start conversation” zgodny z językiem profilu, przycisk x=1660,75, y=831, w=220,25, h=56; avatar 40×40; dock z-index 45; zamknięty host `display: none`. Otwarcie rzeczywistych ustawień zgód ukryło launcher, a zamknięcie przywróciło go, bez zapisywania zgód. Krótki przegląd logów error/fatal nowego deploymentu z okna 5 minut nie zwrócił rekordów; nie oznacza to pełnego audytu wszystkich błędów klienta.

Karta ze starym centralnym avatarem została wcześniej odświeżona i następnie zamknięta. Nie udało się automatycznie odświeżyć drugiej, wcześniej otwartej karty (timeout kontroli przeglądarki). Stare otwarte karty wymagają odświeżenia; nie czyszczono pamięci ani danych użytkownika. Kod produkcyjny i nowo otwarta karta zostały zweryfikowane niezależnie.

NEXT: powtórzyć regresje po aktualizacji vendora; osobno rozszerzyć testy na rzeczywiste Safari/iOS i technologie asystujące. Nie jest to blokada tej poprawki.

Skills: `05-mila-voice`, `03-release-qa`, Product Learning i Trust Review. Kontrola UX/trust wpłynęła na ukrywanie przy modalach, ochronę wpisywania i zachowanie danych; koordynacja Chief Operator ograniczyła zakres do zgłoszenia. Vercel Deployments i Full-Story Verification określają kontrolę kodu, builda i publicznej strony po wydaniu.

## Zrzuty QA

- [Telefon 360 px](evidence/mila-nonintrusive-2026-10-13/mila-launcher-360.png)
- [Telefon 390 px](evidence/mila-nonintrusive-2026-10-13/mila-launcher-390.png)
- [Desktop 1440 px](evidence/mila-nonintrusive-2026-10-13/mila-launcher-1440.png)
- [Zgody — Mila ukryta](evidence/mila-nonintrusive-2026-10-13/mila-consent-modal-390.png)
- [Wybór trybu — Mila ukryta](evidence/mila-nonintrusive-2026-10-13/mila-mode-modal-390.png)
- [Wpisywanie — Mila ukryta](evidence/mila-nonintrusive-2026-10-13/mila-editable-focus-390.png)
