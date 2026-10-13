# Coach FI — poprawki logowania i głosu Mili

Data: 13 października 2026. Zakres: usunięcie podwójnego logowania w nagłówku oraz zachowanie głosu Mili pomiędzy powitaniem, odczytem i rozmową. Raport dotyczy tego wydania, a nie całego wcześniejszego audytu produktu.

## Agenci i zastosowane skille

| Agent | Zakres i skille |
|---|---|
| `mobile_login_fix` | UX Simplification (`04-ux-simplification`) i Supabase: pojedynczy przycisk konta, zachowanie istniejących metod |
| `mila_voice_fix` | Mila Voice (`05-mila-voice`), `coachfi-product-learning`, `coachfi-trust-review`: spójna tożsamość, awarie, walidacja konfiguracji |
| `login_voice_qa` | Release & QA (`03-release-qa`), `coachfi-trust-review`: E2E, oddzielenie konfiguracji CDP i lokalnej, zrzuty oraz granice dowodów |
| Root | Vercel deployments/CI-CD i env-vars, React best practices, computer-use: przegląd, publikacja, rzeczywisty pomiar audio i konfiguracji ElevenLabs |

Start pracy: 04:31 UTC. Poprawka nagłówka oraz odzyskanie prawdziwego audio były na produkcji przed 05:01 UTC. Następnie founder udostępnił zalogowaną sesję ElevenLabs i polecił kontynuować; końcowe wydanie zachowujące zweryfikowany głos Hope jest opisane poniżej.

## Wynik i status wydania

Decyzja QA: **PASS dla zakresu tego wydania**. Commit `715493d82d884a99e6228d0037e03e5de829c9d5` przeszedł osobne przebiegi E2E, a produkcja zwróciła rzeczywiste audio o tożsamości zgodnej z istniejącym agentem. Poniżej opisano dokładne granice weryfikacji.

| Status | Rezultat | Dowód / warunek |
|---|---|---|
| DONE | Nagłówek renderuje jeden przycisk konta: istniejący CDP, a przy braku jego konfiguracji istniejący Supabase | `components/AppNavigation.tsx`; sprawdzone 320, 390 i 1440 px |
| DONE | TTS i rozmowa korzystają ze wspólnej konfiguracji agenta Mili | `lib/mila-voice.ts`, `lib/server/mila-voice.ts`, `app/api/mila-token/route.ts`, `app/api/tts/route.ts` |
| DONE | Niedostępny dźwięk pozostawia tekst i dostępny komunikat; ponowienie działa bez głosu przeglądarkowego | `context/VoiceContext.tsx`; test awarii i odzyskania |
| DONE | Build interfejsu nie uruchamia automatycznie migracji Supabase | `package.json`; `db:migrate` pozostaje osobną, jawną operacją |
| TESTED | 5/5 testów login/voice z CDP, bez pominięć, na finalnym commicie: 36,3 s | `tests/e2e/login-voice.spec.ts`; sześć zrzutów poniżej |
| TESTED | 8/8 istniejących testów w bazowej konfiguracji bez CDP, na finalnym commicie: 1,2 min | Osobny przebieg QA; oryginalne asercje zachowane |
| TESTED | 40/40 unit oraz typecheck PASS na finalnym commicie | Wyniki wykonane i przekazane przez root |
| TESTED | Dwa rzeczywiste żądania TTS w produkcji: HTTP 200, ElevenLabs Hope, ten sam model i identyfikator głosu | Pomiar root: 66 917 i 59 395 bajtów; nagłówki i konfiguracja poniżej |
| BLOCKED | Brak blokady dla tej poprawki w sprawdzonym zakresie | Nie wykonano pełnego OAuth/OTP ani rozmowy z mikrofonem; te granice nie są oznaczone jako wykonane testy |
| NEXT | Powtarzać smoke po zmianie głosu/modelu w panelu i aktualizować przypiętą konfigurację; uzgodnić zgodność dostępu API z właścicielem agenta | Voice owner / Release & QA |

### Końcowy zapis produkcyjny

| Pole | Wartość |
|---|---|
| Finalny commit | `715493d82d884a99e6228d0037e03e5de829c9d5` |
| Vercel deployment | `dpl_od4gFNPShiq54uJX7L6GfBmqC2Nr`, READY, alias `coachfiai.com` |
| Finalne typecheck / unit / build | Typecheck PASS, unit 40/40 PASS; build Vercel „Build Completed in /vercel/output [47s]”, następnie „Deployment completed” i READY |
| `/api/tts` z produkcji | Dwa żądania HTTP 200, `audio/mpeg`, 66 917 i 59 395 bajtów — pomiar root |
| Provider / voice / model | ElevenLabs, Hope `tnSpp4vdxKPjI9w0GnoV`, `eleven_multilingual_v2` w obu odpowiedziach |
| Tożsamość głosu | Root sprawdził zalogowany panel i Copy Agent JSON agenta `agent_7601krc9gaf2eaxr811qgk01epzc`; konfiguracja i ustawienia odpowiadają przypiętej konfiguracji server-side |
| Powitanie i odpowiedź | Potwierdzono zgodną tożsamość HTTP/config; nie deklaruje się odsłuchu przez człowieka ani zakończonej rozmowy mikrofonowej |
| Polska gramatyka agenta | Root opublikował powitanie domyślne i polskie oraz instrukcję żeńskiej osobowości AI; krótki tekstowy test rzeczywistego agenta zwrócił „Jestem Mila, asystentka AI…” i „jestem gotowa”; rozmowę zakończono |
| Końcowy gate | PASS — zakres poprawki login/voice z opisanymi ograniczeniami |

## Jak sprawdzono logowanie

Przy szerokościach 320×800, 390×844 i 1440×900 test liczy dokładnie jeden przycisk `Zaloguj` w nagłówku, sprawdza widoczność i dostępność, kontroluje jego położenie w ekranie oraz otwiera dotychczasowy dialog. W konfiguracji CDP sprawdza Google, Apple, X, Telegram, pole e-mail i przycisk wysłania kodu. Zamknięcie dialogu pozostawia jeden przycisk logowania.

Publiczny identyfikator projektu CDP był podany do lokalnego serwera. Test nie wysyłał OTP, nie tworzył konta i nie wykonywał wymiany tokenów OAuth. Wynik potwierdza działanie przycisku oraz dostępność wcześniej dodanych metod; pełna autoryzacja u dostawców pozostaje poza tym pomiarem. Test zawiera także wariant istniejącego formularza Supabase, lecz finalny przebieg pięciu testów wykonano dla konfiguracji CDP używanej w produkcji.

Zrzuty najnowszego udanego przebiegu zachowano poza tymczasowym `test-results`:

- [Nagłówek 320 px](evidence/login-voice-2026-10-13/header-320.png) i [metody 320 px](evidence/login-voice-2026-10-13/login-methods-320.png).
- [Nagłówek 390 px](evidence/login-voice-2026-10-13/header-390.png) i [metody 390 px](evidence/login-voice-2026-10-13/login-methods-390.png).
- [Nagłówek desktop](evidence/login-voice-2026-10-13/header-1440.png) i [metody desktop](evidence/login-voice-2026-10-13/login-methods-1440.png).

Zrzut 320 px sprawdzono również wzrokowo: przycisk jest pojedynczy, nagłówek zawija się poprawnie, cztery metody, e-mail, wysłanie kodu i zamknięcie są widoczne. To nie stanowi pełnego audytu WCAG ani testu z czytnikiem ekranu.

## Jak sprawdzono głos

Test jednostkowy resolvera i rzeczywistego handlera TTS mockuje odpowiedzi sieciowe dostawcy. Weryfikuje odczyt tożsamości i ustawień głosu agenta, cache, współdzielenie równoległych żądań, brak przypadkowego głosu przy braku konfiguracji oraz użycie tej samej tożsamości dla polskiego i angielskiego tekstu. Klient nie może podmienić głosu ani modelu w żądaniu. Odrzucenie natywnego modelu przez dostawcę kończy się jawnym błędem bez próby innego modelu.

E2E odtwarza dwa różne polskie skrypty poprzez mockowane `/api/tts` i kontrolowany obiekt audio. Sprawdza żądania, stan odtwarzania i brak `speechSynthesis.speak`. Oddzielny test symuluje 503, potwierdza pozostawienie czytelnego tekstu i komunikatu, a następnie udane ponowienie. Ten pomiar nie ocenia brzmienia głosu słuchem ani jakości rzeczywistego audio dostawcy.

Przypięta konfiguracja `ELEVENLABS_MILA_VOICE_CONFIG` dotyczy dokładnie istniejącego agenta sprawdzonego w panelu. Jest walidowana po identyfikatorze agenta, głosu, modelu, dacie weryfikacji oraz zakresach ustawień. Wykorzystywana jest po niedostępności odczytu konfiguracji API. Nie należy umieszczać w niej klucza API, promptu ani transkryptów.

Dostępny klucz API nie uzyskał konfiguracji tego agenta poprzez API (404), dlatego wydanie korzysta z jawnie przypiętej, zweryfikowanej konfiguracji tego samego agenta. Nie zmieniono klucza ani jego uprawnień. Automatyczne wybieranie innego agenta zostało usunięte. Żądania TTS dla Hope działały w produkcji. Utrzymanie wymaga aktualizacji przypiętej konfiguracji przy zmianie ustawień w panelu; uporządkowanie dostępu API do agenta jest dalszym zadaniem technicznym.

## Rozdzielenie przebiegów E2E

Istniejący `core-loop.spec.ts` zakłada lokalny postęp bez CDP. Włączenie CDP dla osoby niezalogowanej celowo ukrywa pasek postępu i streak. W pierwszym łącznym przebiegu ten stary test zgłosił brak widocznego streaku, choć zrzut pokazywał ukończone wyzwanie i nagrodę +50. Ustalono niezgodność konfiguracji fixture, zachowano oryginalne asercje i wykonano dwa przebiegi: bazowe osiem bez CDP oraz nowe pięć z CDP. Wyników tych nie należy przedstawiać jako jednego przebiegu trzynastu testów z identyczną konfiguracją.

## Zakres trust review i rollback

Skille Release & QA oraz `coachfi-trust-review` zastosowano do konkretnej poprawki. Ryzyko jest amber ze względu na uwierzytelnianie i zewnętrzny głos AI. Zmiana nie dodaje nowych danych użytkownika, dostawcy uwierzytelniania, zakresów zgód ani schematu bazy. Nie zmienia wcześniejszych szerokich ustaleń audytu i nie jest opinią prawną dotyczącą całego produktu.

Wyzwalacze rollbacku: brak przycisku logowania, niedostępność dotychczasowych metod, błędy klienta blokujące główny ekran lub regresja odtwarzania audio. Owner operacji: root / właściciel wydania. Nie ma migracji danych do odwrócenia w tym wydaniu.

Nie ustalono wcześniejszego wdrożenia, które jednocześnie zawiera działające pojedyncze logowanie i ten sam głos Hope. Oryginalny `bad15f…` / `dpl_5pMXJZsQ8PuXc38SNT831GjEEnL2` przywraca podwójny przycisk i poprzedni głos. Wczesny mobile fix `dpl_HFWKkHGrVJBExAj6pVrTgH77yGbD` zwracał TTS 503 i nie jest zdrowym celem pełnego rollbacku. `dpl_2ajw3KUSSgNF9qKaD6ny8oedxYnM` zwracał audio 200, ale używał Alice, więc zmienia tożsamość Mili i nie jest preferowanym celem.

Zalecany rollback jest selektywny: cofnąć zmianę auth, jeśli to ona powoduje regresję, oraz niezależnie odwracać wąskie zmiany kodu głosu, zachowując aktualną zweryfikowaną konfigurację Hope. Po każdej operacji ponownie sprawdzić nagłówek/dialog i dwa krótkie TTS. W przypadku awarii dostawcy pozostawić dostępny tekst i komunikat; nie przełączać automatycznie Mili na inną tożsamość.
