# Mila — pełne zakończenie rozmowy i sam avatar w rogu

Data: 13 października 2026, Europe/Warsaw. Gałąź: `codex/fix-mila-conversation-close`.

## Zgłoszenie i kontrakt

Po zakończeniu rozmowy centralny panel ma całkowicie zniknąć. Pozostaje wyłącznie przycisk-avatar 56×56 px z obrazkiem 40×40 px, w prawym dolnym rogu nad nawigacją mobilną. Nazwa dostępna i tooltip są lokalizowane; duża etykieta nie zajmuje ekranu.

W czasie rozmowy i łączenia dostępny jest przycisk aplikacji **„Zakończ rozmowę”** (oraz odpowiedniki językowe), niezależny od kontrolek dostawcy. Escape ma tę samą funkcję. Zamknięcie musi kończyć sesję, a nie tylko chować jej obraz. Po zamknięciu fokus wraca do avatara; ponowne otwarcie tworzy nową instancję.

Owners: root / Mila Voice (`05-mila-voice`), Release & QA (`03-release-qa`, plik `tests/e2e/mila-close.spec.ts`). Product Learning i Trust Review określiły dostępne, widoczne wyjście, anulowanie, granice danych i dowodów. Human approver: founder, w ramach wcześniejszego polecenia wdrożenia poprawek Mili. Bez zmian głosu, kluczy, kont, zgód, treści finansowej i transakcji.

## Przyczyna i naprawa

Poprzednia wersja zamykała ramkę po powrocie zestawu etykiet przycisków do stanu początkowego. Widget po rozłączeniu dodaje transkrypt i feedback, więc taki zestaw może już nie wrócić. Native Dismiss zmienia stan wewnętrzny widgetu, nie stan ramki aplikacji.

- Usunięto rozpoznawanie zakończenia przez porównywanie etykiet.
- Własny przycisk End, Escape i native Dismiss zamykają panel, czyszczą timery i rozłączają starą instancję widgetu.
- SDK status/ended są przekazywane przez jawnie lokalny adapter: `coachfi-mila:status` oraz `coachfi-mila:ended`. To **nie** są zdarzenia oferowane przez oficjalne API. Payload zawiera tylko stan/powód, bez transkryptu, danych finansowych czy identyfikatora sesji.
- Lokalne poprawki vendora 0.19.0 zabezpieczają unmount podczas oczekiwania na Promise sesji. Znacznik `coachfiStopped` blokuje start także po spóźnionym rozstrzygnięciu zgody/fingerprintu.
- Zdarzenia starej instancji i powtórzone zakończenie nie zamykają nowej sesji.
- Skrypt ma wersjonowany URL, by nowa strona pobierała zmieniony adapter. Otwarte starsze karty wymagają odświeżenia.

Zmiany vendora dotyczą pięciu dokładnie zweryfikowanych fragmentów; wersji biblioteki nie zmieniono. `scripts/format-mila-vendor-adapter.mjs` jest narzędziem formatowania do przygotowania czytelnych granic patcha, nie aktualizatorem biblioteki. Nieznana wersja kończy się błędem. Przy aktualizacji widgetu sprawdzić i ewentualnie usunąć lokalny adapter, powtarzając testy zatrzymania.

## Dowody testów

STATUS: DONE / TESTED — wszystkie bramki lokalne PASS; poprawka opublikowana i publiczny widok zweryfikowany.

- `node --check public/elevenlabs/convai-widget.js`: PASS.
- `npm run typecheck`: PASS.
- `npm run test`: 49/49 PASS.
- `npm run build`: PASS, exit 0, 35/35 stron; istniejące ostrzeżenia opcjonalnych modułów Coinbase nie zostały zmienione.
- E2E: **29/29 PASS, zero pominięć, 1,5 min** — 8 nowych testów zakończenia, 13 wcześniejszych widgetu, 8 podstawowych ścieżek aplikacji.
- Nowe przypadki: End desktop/mobile, natywne End po transkrypcie/feedbacku, Dismiss, Escape z pola tekstowego, późno utworzona sesja, ponowne otwarcie i zamknięcie przed zakończeniem fingerprintu.
- Przy oczekiwaniu na fingerprint: po zamknięciu i późniejszym resolve SDK start count pozostaje 0. Przy późnej Promise SDK: po resolve transport/zasoby zostają zamknięte. Przy ponownym otwarciu zwolniono zasoby obu sesji.
- Powtórka 8 testów zakończenia na lokalnym `next start` z gotowego builda: **8/8 PASS, zero pominięć, 12 s**. Poniższe zrzuty pochodzą z tej powtórki, bez oznaczeń developerskich.

Testy korzystają z realnego skryptu widgetu i bazowej implementacji `endSession` SDK; transport i track są in-memory/mocked. Nie uruchamiają płatnych sesji, WebSocketów ElevenLabs ani fizycznego mikrofonu. Testy liczników oraz przegląd kodu SDK potwierdzają ścieżkę zamykania. **Nie deklaruje się sprzętowego testu mikrofonu, WebRTC, audioSubclass, Safari/iOS ani pełnego WCAG.** To świadoma granica dowodów.

Mila Voice / Trust Review: kod PASS, finalne wydanie wymagało zakończenia QA. Release & QA: final29 PASS. Brak nowych danych, rekomendacji i integracji finansowych.

## Wydanie / rollback

Produkcja: commit `fe960facf05f358892aad1966ea0956a416dedf5`, deployment `dpl_AsWmmYDwyn8T4vJczao1Ma7VELqC`, gałąź `main`. Vercel potwierdził READY i alias `coachfiai.com` bez aliasError. Weryfikacja 13.10.2026 około 08:40 Europe/Warsaw: publiczna strona wyświetla sam avatar 56×56 px w prawym dolnym rogu; centralna ramka ma `display: none`, brak aktywnego przycisku End. Skrypt `/elevenlabs/convai-widget.js?v=coachfi-close-20261013` zwraca HTTP 200 i zawiera oba zdarzenia adaptera, znacznik zatrzymania oraz cleanup oczekującej sesji. Krótkie sprawdzenie zagregowanych logów error/fatal nowego deploymentu (ostatnie 5 minut) nie wykazało wpisów; nie stanowi pełnego audytu. Nie uruchamiano rozmowy na prywatnym profilu użytkownika ani mikrofonu produkcyjnego. Pełny scenariusz End/reopen ma dowody z opisanych wyżej testów SDK z symulowanym transportem. Własny lokalny serwer QA został zatrzymany po sprawdzeniu PID i ścieżki procesu.

Poprzednia produkcja: `00d90e707ea3ae449e46e7e4e468e45b714ea6cc`, deployment `dpl_4uArLMcbNsbvKnG6rjFfiMizLoDk`, alias `coachfiai.com`. Rollback owner: founder / Release & QA. Trigger: brak dostępnego End, centralna ramka po końcu, brak ponownego otwarcia albo błędy inicjalizacji widgetu. Przywrócić tylko nowy commit poprawki lub poprzednie wskazane wdrożenie; nie cofać dokumentów właściciela, nie używać force-push. Poprzednia wersja ma zgłoszony błąd zamykania, dlatego preferowane jest poprawione roll-forward. Brak migracji danych.

## Zrzuty

- [Telefon — rozmowa i End](evidence/mila-close-2026-10-13/mila-active-end-control-390.png)
- [Telefon — po End, sam avatar](evidence/mila-close-2026-10-13/mila-ended-avatar-390.png)
- [Desktop — rozmowa i End](evidence/mila-close-2026-10-13/mila-active-end-control-1440.png)
- [Desktop — po End, sam avatar](evidence/mila-close-2026-10-13/mila-ended-avatar-1440.png)
