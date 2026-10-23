# Niezależna recenzja P0 — zgody, eksport, lokalny głos i bridge CDP

14 października 2026. Lokalny checkout `source/CoachFi`, gałąź `codex/p0-security-consent-export`, baza `86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b` plus zmiany robocze. Recenzent: architecture_audit. Autor klienta: curriculum_pilot; `AccountSync` — koordynator. Recenzent nie zmieniał UI/zgód/eksportu, dodał osobne testy i ten raport. Własne API recenzenta ocenia ux_audit w `docs/coachfi/p0/api-review.md`.

**Werdykt: ACCEPT, ograniczone do lokalnego P0 hard-off.** Nie wykryto otwartego high/critical w sprawdzonym zachowaniu. Wyścig poprzedniej sesji oraz dwie niespójności opisów poprawiono i sprawdzono ponownie. To nie zatwierdzenie wydania, aktywnej zewnętrznej Mili, cloud sync, kompletnego eksportu konta ani ocena prawna. Końcowy build/typecheck/E2E należą do koordynatora.

## Zakres i granice zaufania

Odczytano `lib/consent.ts`, `context/ConsentContext.tsx`, `components/ConsentManager.tsx`, `components/DataSafetyPanel.tsx`, `components/MilaVoiceAgent.tsx`, `components/VoiceButton.tsx`, `context/VoiceContext.tsx`, `app/coach/page.tsx`, nowe `lib/data-export.ts`, `lib/client/api-credentials.ts`, `lib/client/local-voice.ts` i `components/AccountSync.tsx`. Celowany odczyt `app/providers.tsx` potwierdził AccountSync wewnątrz CDPReactProvider. `/voice-demo` sprawdzono jako zależną publiczną powierzchnię opisów.

Zagrożenia: domyślne/tekstowe zgody interpretowane jako true, odziedziczony majowy rekord, token po zmianie sesji lub wycofaniu, sekret w auth/nested/free-text eksporcie, zdalny głos, spóźnione callbacks i widget uruchamiany fallback agentId. LocalStorage i body są deklaracją klienta, nie autorytatywnym serwerowym rejestrem. P0 blokuje zewnętrzne adaptery niezależnie od tej deklaracji.

Procedury: coachfi-security-review, coachfi-data-integrity oraz vercel:react-best-practices. Standardy programu: OWASP ASVS 5.0.0 i GenAI LLM Top 10 2025; nie przyznano ogólnej zgodności ani nie wymyślano IDs wymagań.

## Sprawdzone zachowania

| Obszar | Dowód i wniosek |
|---|---|
| Zgody | Required-only pozostawia wszystkie opcje false; tylko literal true przyznaje cel. Stara wersja, nieprawidłowe required flagi/data są odrzucane. Rekord jest odbudowany, nieznane pola pomijane. |
| Wycofanie | Storage→synchroniczny event→cloud notify. Context obsługuje tę kartę, storage event i cloud-synced. Głos/czat anulują generacje, żądania i timery; cleanup odłącza słuchaczy. |
| Credential helper/bridge | Getter istniejącego CDP tylko przy initialized+signed-in+currentUser; cleanup usuwa go. Brak utrwalania tokenu. Sprawdzenie przed/po await: cel zgody, abort, epoka rejestracji i CR/LF. Błędy→null. To kontrola klienta, nie weryfikacja podpisu lub autoryzacja serwerowa. |
| Eksport | Dwanaście dokładnych nazw produktu, bez enumeracji oraz odczytu `coachfi-auth`/SDK/unknown. Schematy znanych typów/ID/enumów odbudowane, free text name/goal i nested credentials pomijane. SessionStorage tak samo; corrupt/oversize wartości pomijane. Dodany marker adultAgeRequirement jest kopiowany tylko dla adult i literalnej liczby18, nie dla dowolnego stringa/pola identity. |
| Delecja | Usunięty tylko zestaw produktu, sesja pozostaje. UI PL/EN opisuje ograniczenie do urządzenia i możliwość przywrócenia przez sync. Event przed reload. |
| Głos | Brak external TTS. Tylko świadome kliknięcie, `localService === true` i zgodny język. Remote/truthy-string nie jest fallback. Brak głosu→tekst/status. Cleanup: abort, pause, handlers null, generacja unieważniona, stare URL revoked. |
| Live widget | Publiczny hard-off nie montuje live komponentu, jego effects/profilowy context/token fetch/Script/custom element nie działają. Zachowana przyszła ścieżka wymaga signedUrl, widget nie dostaje fallback `agent-id`. |
| Coach | Stała blokada przed credential getter/fetch. Aktywny flow przygotowanych odpowiedzi lokalnych; bez browser recognition i automatycznego speech. Historia w pamięci komponentu nie jest wysyłana. |
| React/UI | Hooks bezwarunkowe, cleanup i generation/abort guards obecne; aria-pressed, tekstowe status/errors. Consent modal używa istniejącego Radix Dialog. Odczyt kodu nie zastępuje runtime focus/Escape/return-focus lub pełnego WCAG. |

## Findings i retest

**C01 — token poprzedniej sesji przy tej samej funkcji SDK (P1, zamknięte).** Początkowo po await porównywano tylko funkcję. Logout→null→login z tą samą stabilną funkcją mógł przepuścić wcześniej rozpoczęty token. Autor dodał monotoniczną registrationEpoch. Niezależny test rozpoczyna await, ponownie rejestruje ten sam getter bez null oraz z logout/null, rozwiązuje stary token i wymaga null. Oba warianty PASS. P0 pozostaje hard-off.

**C02 — opisy ranking/certificates w zgodach (P2, zamknięte odczytem).** Początkowe PL/EN opisywały publikację Supabase/Solana mimo odłożonego zakresu. Autor poprawił: funkcje są odłożone, zaznaczenie nie publikuje danych i nie tworzy portfela. Odczyt końcowego PL/EN potwierdza poprawkę. Nie wykonywano transferu.

**C03 — `/voice-demo` obiecuje external/family scope (P2, zamknięte odczytem).** Pierwotne PL/EN: ElevenLabs Creator/cache, dzieci/rodziny, kidsCoach/certificateUnlock. ux_audit na polecenie koordynatora zmienił PL/EN na adult/local/text, usunął te dwie karty z renderowanej listy i ograniczył wybór języka do PL/EN. Zachowane nieużywane teksty dawnych języków/skryptów nie są zatwierdzone do przyszłego udostępnienia. Odczyt finalnej listy i komunikatów potwierdza korektę.

## Odtwarzalne testy

Końcowy run 2026-10-14 12:27:45 według lokalnego runnera, po dodaniu pola18 do sanizacji eksportu:

```text
node node_modules/vitest/vitest.mjs run lib/server/mila-voice.test.ts lib/consent.test.ts lib/data-export.test.ts lib/client/api-credentials.test.ts tests/consent-voice.test.ts tests/p0-client-independent-review.test.ts
6 plików PASS; 57/57 testów PASS
```

Rozkład: 36 autora klienta + 8 niezależnego recenzenta + 13 oddzielnych historycznych testów adaptera/route TTS. Te 13 nie stanowi niezależnej opinii o własnym API: na polecenie koordynatora właściciel API uaktualnił trzy historyczne route testy na 503 i zero fetch/CDP initialization/verification. Pozostałe dziesięć mockowych testów adaptera pozostawiono aktywne. Wcześniejszy run12:16:50 przeszedł56/56; nowy przypadek autora dotyczy wyłącznie strict marker18 w eksporcie.

Niezależne osiem: legacy bez getter call; obie rejestracje; withdraw w await bez caller abort; kolejność storage/event/cloud; dokładny legacy key `coachfi-auth` pomijany w obu storage i zachowany po delete; local/matching-language/conscious speech; powtarzany cleanup poprzedniej generacji. Tylko syntetyczne dane i mocki, bez realnego storage, kluczy i dostawców.

Sandbox wcześniej zatrzymywał Vitest na EPERM cache przed testami. Ten run poza sandboxem dopuszczono automatycznie, bez odmowy. Nie uruchamiano równoległego tsc/build przy regenerowaniu `.next`. Poprawki C02/C03 zmieniają opisy/listę kart; ich retest był odczytem, końcowy browser/build sprawdza koordynator.

## Ograniczenia przyjęcia

Sprawdzone: wskazany kod i lokalne mockowane testy. Niesprawdzone w tej opinii: realne konto CDP, realny lokalny głos i pomiar ruchu silnika, blocked storage, cloud isolation/sync/deletion, provider agent/stare signed URLs, browser E2E, pełne WCAG i prawna ocena zgód. Deklaracja przeglądarki localService jest warunkiem wyboru; nie obiecano zmierzonego offline działania silnika.

Przyszła external aktywacja wymaga oddzielnej bramki server auth, authoritative revocation/consent, trwałych atomowych per-user/global limitów, zatwierdzonego budżetu i review. Client helper lub feature flag nie spełnia jej. Brak push/deploy; opinia dotyczy lokalnego pakietu, nie aktualnej bety.

Końcowy fingerprint C01: SHA256 `lib/client/api-credentials.ts` = `BB453A8CD6CA7452FCA6D4AC8287957B7CF4939AD234B9B70574B343C1B85E83`; `components/AccountSync.tsx` = `8886AE593112CC0344729881870DCDAC60EE6FA0C9CE2748B161AC58CE0E062F`; `tests/p0-client-independent-review.test.ts` = `E403E6C4B66473C626F3D45DF2480D15A5BDE4F48A64A77E7FC45F4CB62C65E4`. Końcowy SHA256 `lib/data-export.ts` = `1A7C1B0DC0ECCC87F7A6C1D31A9CEECAA99827AD35D1CB171BD226259A497A44`.

Ostatni retest kosmetyczny: celowany `git diff --unified=0 -- lib/client/api-credentials.ts lib/data-export.ts` pokazuje wyłącznie usunięcie jednej pustej linii EOF w każdym pliku. Ponowne odczytanie kodu nie wykazało zmiany zachowania. Dodanie jednego bajtu LF do bieżących bajtów helpera odtwarza poprzedni recenzowany hash `328593609EA0C333BF2B19CE2806644CA672AAE8220A37F7A2DE397E41ABAAED`. Nie uruchamiano nowych testów dla whitespace; poprzednie wyniki funkcjonalne zachowują zakres. Koordynator osobno zgłosił końcowe build35/35, typecheck, E2E9/9 i zbiorczy Vitest145/145 PASS. Nie są to nowe uruchomienia recenzenta ani rozszerzenie opinii na realne konta/dostawców lub produkcję.
