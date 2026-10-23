# Audyt architektury Coachfi.ai — etap A

## Aktualny stan po udostępnieniu kodu

14 października 2026, Europe/Warsaw. Repozytorium przekazane przez Foundera: [Dorianos85/CoachFi](https://github.com/Dorianos85/CoachFi). Lokalny checkout: `source/CoachFi`; odczytany commit **86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b**, bez zmian śledzonych plików podczas odczytu. Właściciel audytu: rola 2. Recenzja architektury i ocena wydania wymagają niezależnej roli 4.

**Kod i powiązanie produkcyjnego builda są teraz potwierdzone. Gotowość do przyjmowania realnych użytkowników pozostaje nieudowodniona.** Wstępny brak źródeł został zastąpiony A13. GitHub status Vercel success dla tego SHA wskazuje deployment `dpl_AaEiWV85rietTuq3Z5GqogCu3DuN`; celowany odczyt Vercel potwierdza READY, target production, alias `coachfiai.com` oraz ten sam githubCommitSha. ID zgadza się z publicznym DOM zasobów UX. Dowody A24/A25. Nie przypisano stagingu, aktywnej konfiguracji dostawców, projektu bazy czy rachunków; nie odczytywano wartości sekretów.

Odczytano `coachfi-architecture`, `coachfi-security-review`, wcześniejszy skill Supabase oraz `vercel:deployments-cicd`. Wykonano wyłącznie celowane odczyty metadanych właściwego repo/deploymentu GitHub/Vercel; brak zmian chmurowych, migracji, płatnych wywołań i testów nadużyć. P1/P2 to priorytety napraw, nie wynik pełnej klasyfikacji CVSS lub audytu ASVS.

### Potwierdzony stos w checkoutcie

| Komponent | Fakt kodowy | Dowód |
|---|---|---|
| Frontend / API | Next.js App Router, React, TypeScript; aplikacja0.2.0. Lock: Next15.5.18, React19.2.6, TS5.9.3. | A14, package.json/package-lock.json |
| Konto | Warunkowy Coinbase CDP ReactProvider, email/OAuth, tworzenie konta Solana przy loginie; API validates CDP access token i używa zweryfikowanego userId. | A15, app/providers.tsx:64, lib/cdp-server.ts:109, app/api/account/route.ts:27 |
| Druga warstwa auth | Supabase AuthProvider jest również montowany; obsługuje hasło, signup i magic link. Używa browser anon client i innego zestawu tabel. | A16, app/providers.tsx:57, context/AuthContext.tsx:40 |
| CDP storage | W production account-store wybiera Supabase service-role; w development domyślnie SQLite. Dane per zweryfikowany cdp_user_id. | A15, lib/account-store.ts:57 |
| Supabase schema | Migracje CDP: accounts, account_state, progress, certificates z RLS; zapisy serwerowe bypassują RLS przez service-role. Osobny większy schema.sql używa auth.users i innych kontraktów. | A16, migrations/20261012120000_accounts.sql, supabase/schema.sql |
| AI tekst | Anthropic albo OpenRouter, kolejność z konfiguracji; domyślny model kodowy Anthropic claude-haiku-4-5-20251001 / OpenRouter auto. Limit wejścia800 znaków, historia6 elementów, output64–1024 tokens. | A18, app/api/chat/route.ts:118,186,219,268 |
| Głos | ElevenLabs TTS do500 znaków, timeout12s; ConvAI widget ze signed URL; lokalna modyfikacja vendora opisana w dokumentach release. | A18/A19, app/api/tts/route.ts, app/api/mila-token/route.ts |
| Web3 / ranking | Solana Devnet/Phantom/Metaplex, certyfikaty i vault; leaderboard w Supabase. | A14/A19, app/providers.tsx, app/api/* |
| Testy / build | Manifest zawiera typecheck, Vitest, build i Playwright. Lock: Vitest4.1.8, Playwright1.61.1. Historyczne raporty PASS są deklaracjami dokumentów, nie wynikiem obecnej recenzji. Koordynator prowadzi nowe lokalne testy. | A14/A21 |
| Hosting | Vercel deployment `dpl_AaEiWV85rietTuq3Z5GqogCu3DuN`, READY/production, alias coachfiai.com, commit 86226ddc…; potwierdzony celowanymi metadanymi, zgodny z publicznym asset ID. | Sprawdzone A24/A25; aktywna konfiguracja niesprawdzona |

Nie odczytano `.mcp.json`, plików środowiskowych ani wartości kluczy. Projekt widoczny wcześniej przez Supabase connector nadal pozostaje niepowiązany; nie wykonano na nim żadnej inspekcji bazy.

### Faktyczna mapa danych w kodzie

1. Formularz diagnozy zaczyna z `data/mockUser.ts`; wynik i surowe odpowiedzi zapisują się w `coachfi-health-check` w localStorage.
2. Przy skonfigurowanym CDP `AccountSync` wywołuje `/api/account` z Bearer access token. Serwer waliduje token przez CDP SDK, zapisuje email/nazwę, adresy portfeli, metody logowania, daty i profil tożsamości. Snapshot przenosi lokalny cel, postęp/SRS, tokeny, streak, avatar, vault i challenge. `sanitizeAccountSnapshot` ogranicza wersję i długość; większość struktur zagnieżdżonych przyjmuje jako unknown.
3. Nowa ścieżka CDP pomija zdrowie finansowe: `ACCOUNT_GATES.persistHealth=false`, a jej snapshot w ogóle nie dodaje wyniku. **To nie dowodzi globalnego braku wysyłki kwot:** równolegle obecny Supabase AuthProvider może uruchomić legacy `cloudSync.pushHealthCheck`, zapisujący score i answers w health_checks po Supabase loginie. Wymagana jedna jawna strategia auth/storage i sprawdzenie faktycznie aktywnych ustawień.
4. Tekstowa Mila wysyła pytanie/historię z API do wybranego dostawcy; interfejs i API mają mechanizmy nagłówka zgody. ConvAI otrzymuje odrębną konfigurację/agenta; nie udostępniono aktywnego promptu dostawcy i historii sesji.
5. Read-aloud `VoiceButton → VoiceContext → /api/tts → ElevenLabs` przekazuje tekst po kliknięciu. W tej ścieżce nie znaleziono odczytu optional.voice; serwer też nie sprawdza zgody.
6. `DataSafetyPanel` eksportuje/usunie jedynie storage urządzenia. `DELETE /api/account` usuwa cztery tabele nowej ścieżki; nie oznacza usunięcia konta u CDP, starego Supabase auth, publicznego blockchainu albo danych rozmów u dostawców.

To mapa implementacji na wskazanym commicie. Aktywność chmurowa, regiony, retencja, odtwarzanie i kompletna obsługa praw użytkownika pozostają niesprawdzone. Publiczna polityka MVP z maja wymaga porównania z tą mapą, szczególnie z Coinbase, OpenRouter, tożsamościami i synchronizacją.

### Financial Health Score — wzór i ograniczenia

Wzór jest w [page.tsx:568](../../../app/health-check/page.tsx#L568); `lib/healthCheck.ts` przechowuje wynik, nie oblicza go.

| Część | Wzór / punkty |
|---|---|
| Wolna kwota dochodu | min(max(income-expenses,0)/income /0,25,1) ×18; income0 daje0 |
| Rezerwa | min(savings/(expenses×3),1) ×18; expenses0 daje0 |
| Zadłużenie | max(0,1−debt/(income×4)) ×16; income0 przyjmuje pressure1 |
| Gotówka | 4 jeżeli cash>2×income i brak inwestowania; w pozostałych przypadkach8 |
| Inwestowanie |10 albo2 według investsAlready |
| Opis celu |6 gdy tekst ma więcej niż8 znaków |
| Deklaracje | emergency fund8, inflation understanding6, retirement plan8 |

Wynik zaokrąglany i ograniczany do0–100. Suma maksymalnych komponentów przy poprawnych nieujemnych danych wynosi **98**, a domyślne `investsAlready=false` pochodzi z mockUser i nie ma edytowalnego pytania w formularzu: maksymalnie **90** w tej ścieżce. Pusty input staje się `Number("")=0`; `getHealthCheck` sprawdza tylko typ score number, nie finite ani schemat odpowiedzi.

Wskaźnik miesza sytuację finansową, deklarowaną wiedzę i długość celu; oszczędzanie zastępuje nadwyżką budżetu. Dodatkowe punkty za inwestowanie i kara za gotówkę wymagają oceny dla utraty dochodu/dużych bliskich wydatków. Nie znaleziono walidacji naukowej ani testów referencyjnych score. Nie stosować do oceny bezpieczeństwa lub dobrostanu bez oddzielnego projektu i badań.

„Odblokowanie po logowaniu” w Health Check jest lokalnym stanem: `canUnlock` sprawdza submitted, obecność @ w email i checkbox, a przycisk wywołuje `setScoreUnlocked(true)`, bez sprawdzenia sesji. Jest to rozbieżność kontraktu produktu, nie kontrola dostępu. Próba/trial jest również lokalnym stanem UI.

### Priorytety napraw wynikające z kodu

| ID / priorytet | Ustalenie i reprodukcja read-only | Wymagany rezultat / niezależny recenzent |
|---|---|---|
| ARCH-F01 / P1 | [DataSafetyPanel.tsx:67](../../../components/DataSafetyPanel.tsx#L67) zbiera wszystkie coachfi-*; [client.ts:26](../../../lib/supabase/client.ts#L26) przechowuje sesję pod coachfi-auth. Przy aktywnej sesji eksport może zawierać tokeny. Nie odczytywano żadnego tokenu. | Whitelist danych eksportu, jawne wyłączenie auth/credentials; test syntetycznej sesji. Role12/15, recenzent14. |
| ARCH-F02 / P1 | [ConsentManager.tsx:450](../../../components/ConsentManager.tsx#L450) acceptRequired(DEFAULT_OPTIONAL_CONSENTS) z aiCoach=true i voice=true; VoiceButton/VoiceContext nie sprawdzają optional.voice. | Required-only pozostawia opcjonalne off; odrzucenie/wycofanie obejmuje TTS/widget/chat; testy obu języków i ruchu na syntetycznych danych. Role12/15, recenzent4/14. |
| ARCH-F03 / P1 | [/api/mila-token:19](../../../app/api/mila-token/route.ts#L19) może wydać signed URL z kluczem serwera; brak auth, rateLimit i serwerowej zgody/quota. TTS/chat nie mają per-user/global hard cap. | Egzekwowanie uprawnień i quota na serwerze przed wydaniem sesji; trwałe limity i miesięczny cap. Role13/16, recenzent14. |
| ARCH-F04 / P1 jeśli ranking jest w scope | [/api/leaderboard:63](../../../app/api/leaderboard/route.ts#L63) przyjmuje dowolną nazwę, score i streak, bez auth; podnosi wynik istniejącej nazwy. | Tożsamość właściciela i wynik z weryfikowanych zdarzeń albo wyłączenie rankingu z wydania. Rola12, recenzent14. |
| ARCH-F05 / P1 | Dwa auth/store, wspólne localStorage i odrębne identyfikatory. schema.sql i CDP migration tworzą public.certificates o różnych kolumnach; create-if-not-exists nie migruje jednego do drugiego. | Uzgodniony aktywny model i kompatybilna migracja; dwa własne konta, shared-device signout/login, brak przeniesienia danych, rollout/rollback. Role2/12, recenzent14/4. |
| ARCH-F06 / P1 dla właściwej diagnozy | Nieedytowalne demo investsAlready, brak walidacji blank/finite, niemożliwy wynik100, lokalny „login” gate. | Specyfikacja score, jawny demo/current stan, testy skrajne i zgodna semantyka UI. Role3/12, recenzent4. |
| ARCH-F07 / P2 | [api-security.ts:42](../../../lib/api-security.ts#L42) Map w procesie, IP z forwarded headers; body limit mierzy string.length po pełnym odczycie, mimo nazwy maxBytes. | Trwały/global limit, poprawne zaufanie do proxy i streaming byte cap; kontrolowany test staging. Role14/16, recenzent4. |
| ARCH-F08 / P2 | saveSupabaseAccount zapisuje accounts/state/progress osobnymi żądaniami, bez wspólnej transakcji i wersji compare-and-swap. Sync serializuje lokalną kartę, nie konkurencyjne urządzenia. | Test partial failure i jednoczesnych zmian, ustalona polityka konfliktu i atomowości. Rola12, recenzent4. |
| ARCH-F09 / P1 przed AI dla real users | Prompt chat zawiera niesprawdzone liczby o Polsce oraz przyczynowe „missing points=lost wealth”; brak zatwierdzonych citations/retrieval lub deterministycznego kalkulatora w route. | Usunięcie/źródłowy przegląd twierdzeń, zatwierdzona wiedza, testy merytoryczne i manipulacyjne. Role3/13, recenzent14/4. |

W żadnym finding nie wykonano exploitu, obciążenia ani sesji produkcyjnej. Priorytety należy powiązać z zakresem wydania i aktywną konfiguracją. Source-level absence auth/consent/quota to odtwarzalny fakt kodowy; wysokość rzeczywistego nadużycia i ekspozycja produkcji pozostają do bezpiecznego testu w staging.

### Kontrole operacyjne, hosting i prywatność

`next.config.mjs` zawiera CSP, nosniff, DENY, Referrer-Policy i Permissions-Policy; nagłówków aktualnego deploymentu nie zweryfikowano. CSP dopuszcza unsafe-inline/eval i zewnętrzne CDN, a connect-src nie zawiera hosta Supabase, choć montowany AuthProvider może wywoływać jego API. Wymaga testu spójności z rzeczywistą konfiguracją, nie automatycznego luzowania CSP.

Dokumenty wydania Mili z13 października opisują dawne deploymenty Vercel, rollback i testy ze zmockowanym transportem. To użyteczna historia, lecz nie test odtworzenia bazy ani mikrofonu/WebRTC/produkcji. Brak aktualnych dowodów backup/restore, globalnego cap AI, alertów i zweryfikowanego rollbacku danych. Historyczny dokument privacy mówi o browser voice fallback, podczas gdy obecny VoiceContext pozostawia tekst i komunikat błędu, zachowując tożsamość głosu — dokumentację trzeba zaktualizować.

Nie odnaleziono checkout/webhook dla płatnego planu w przejrzanych API. Tabele entitlements i materiał premium są projektem danych i planem, nie dowodem działającego zakupu, anulowania ani uprawnień. Koszt-model programu został niezależnie przeliczony jako model syntetyczny; nie odzwierciedla jeszcze tych faktycznych integracji, sesji ConvAI, całego kontekstu ani rachunków.

### Obietnice produktu a kod i następne zasoby

| Obietnica / decyzja | Stan po odczycie kodu |
|---|---|
| Bezpłatna realna diagnoza | Formularz i score istnieją; wymagają poprawy danych demo, semantyki, walidacji i gate. |
| Mila i głos | Implementacje istnieją; brak obecnego testu skuteczności, pełnej kontroli zgód i kosztu. Prompt dostawcy ConvAI niedostępny. |
| Zapis i powrót | Kod synchronizacji i auth istnieje; dwa modele i cloud/shared-device testy nieprzeprowadzone. Nie deklarować trwałego zapisu z samych plików. |
| Adult Polska PL/EN | Repo obejmuje9 locales, Kids, NFT/vault i rodziny; obecny zakres do ograniczenia zgodnie z Founderem. Nie włączać późniejszych modułów jako warunku zdobycia wyniku. |
| Premium5 USD | Plany/UI/tabele nie potwierdzają procesu płatności; najpierw wartość, limity i finansowanie free. |
| Odporność finansowa | Kod własnego score i przykłady nie stanowią walidacji naukowej lub gwarancji bezpieczeństwa. |

Najbliższe zależności: (1) przypisany staging (powiązanie produkcyjnego deploymentu/commitu już sprawdzone); (2) rzeczywiście wdrożony schema/migration history i aktywny provider auth bez sekretów; (3) konta testowe, DPA/retencja/provider config; (4) testy rozdzielenia kont, zgód, całkowitego eksportu/delecji; (5) restore/rollback/alert i prawdziwe rachunki oraz cap. Właściciele i recenzenci w tabeli findings. Nie potrzeba nowego frameworka, by rozpocząć te naprawy.

### Odtworzenie aktualnej inspekcji

- `git -C source/CoachFi rev-parse HEAD` oraz `git -C source/CoachFi status --short`; nie odczytywać .mcp.json/.env.
- Odczytać wskazane manifesty/lock i pliki z dowodów A13–A23; porównać SHA-256 manifestu i lock.
- Przejrzeć app/providers, oba auth/sync, migrations i schema.sql; oznaczyć faktycznie aktywną konfigurację przed testem.
- Przejść scenariusze findings dopiero na kontrolowanych kontach staging, bez wywołań płatnych i ingerencji w produkcję.
- Wyniki nowych typecheck/unit/build/E2E koordynatora rejestrować osobno od przeglądu kodu i historycznych raportów.

## Historia — audyt przed otrzymaniem repozytorium

**Poniższe ustalenia o niedostępnych źródłach są historyczne i superseded przez A13.** Nadal zachowują dowód ograniczeń pierwszej inwentaryzacji i publicznych odczytów cache. Dawne wymaganie „pozyskać źródła” jest wykonane; bieżące wymagania dotyczą przypisania produkcji/stagingu i sprawdzenia działania opisanych wyżej. Historyczne tabele nie są aktualnym backlogiem.

Data: 14 października 2026, Europe/Warsaw. Właściciel: rola 2, CTO / architekt integracji. Zakres: lokalna inwentaryzacja, pasywny odczyt publicznych stron, metadane widocznych repozytoriów GitHub i projektów Supabase. Recenzent: niezależna rola 4, do przydzielenia przez koordynatora. Status: wynik audytu, bez zatwierdzenia wydania.

**Nie ma wystarczających dowodów, aby uznać betę za gotową na rzeczywistych użytkowników.** Publiczna aplikacja i materiały marketingowe istnieją. Dostępny katalog nie zawiera źródeł aplikacji, a połączenie GitHub nie udostępnia żadnego repozytorium. Oznacza to brak dostępu do źródeł w tym audycie, nie brak repozytorium w ogóle. Nie sprawdzono autoryzacji, izolacji danych, algorytmów, procesu wdrażania ani odtworzenia danych. Brak dowodu kontroli nie jest dowodem podatności.

## Klasyfikacja i ograniczenia

- **Sprawdzone**: bezpośredni odczyt wskazanego zasobu lub wykonany test z wynikiem.
- **Prawdopodobne**: pośredni sygnał albo deklaracja produktu; niepotwierdzona implementacja.
- **Niesprawdzone**: działanie wymagające testu, którego nie wykonano.
- **Niedostępne**: wymagany zasób nie jest udostępniony lub narzędzie nie zdołało go odczytać.

Odczyt web stron publicznych zwracał treści z cache, z datami indeksowania od poprzedniego dnia do poprzedniego miesiąca. To dowód treści zwróconej przez narzędzie, nie pełny test aktualnej aplikacji. Obserwacje z bieżącego DOM przeglądarki agenta UX są oznaczone jako dowody zespołowe. Nie logowano się, nie tworzono kont, nie zmieniano zgód, nie wywoływano zewnętrznego AI, głosu ani płatności. Nie prowadzono penetracji, testów obciążeniowych, odczytu danych użytkowników ani zmian chmurowych.

Plik z odtwarzalnymi wynikami: [evidence/architecture.json](../../../evidence/architecture.json). Identyfikatory poniżej wskazują jego rekordy.

## Zasoby i wykryty stos

| Zasób | Ustalenie | Status / dowód |
|---|---|---|
| Lokalny katalog | Przy pierwszej inwentaryzacji tylko `.git/` oraz `marketing/`; 92 pliki marketingowe, 156 485 741 bajtów. Skrypty Python/CJS służą montażowi reklamy, nie aplikacji. | Sprawdzone A01, A02 |
| Lokalny Git | Brak remote; gałąź `master` nie ma commitów. Marketing pozostaje nieśledzony. | Sprawdzone A01 |
| Źródła aplikacji | Nie odnaleziono lokalnych manifestów aplikacji, lockfile, migracji SQL ani konfiguracji środowisk. Dokumentacja tworzona przez zespół nie zmienia tego ustalenia. | Niedostępne A01 |
| GitHub | Wyszukanie `coachfi` w podłączonych instalacjach oraz pierwsza lista repozytoriów zwróciły puste tablice. | Niedostępne w widocznym zakresie A03 |
| Publiczny frontend | Bieżący DOM UX wskazuje `/_next/static/chunks/`, `main-app`, `webpack` i skrypt widgetu ElevenLabs. Potwierdzony jest bundling Next.js. Wersji Next/React i lockfile nie odczytano. | Sprawdzone sygnały DOM A04; wersje niesprawdzone |
| Hosting | Nie odczytano konfiguracji ani projektu hostingu. Parametr `dpl_…` w URL zasobu nie wystarcza do przypisania środowiska dostawcy. | Niesprawdzone |
| Supabase | Polityka produktu wymienia opcjonalny leaderboard. Connector ujawnia jeden aktywny projekt o ogólnej nazwie, bez potwierdzonego związku z Coachfi. Nie czytano jego schematu, danych, logów ani advisorów. | Deklaracja prawdopodobna A07; przypisanie niedostępne A09 |
| Anthropic / ElevenLabs / Solana | Wymienione w polityce i interfejsie. Widget ElevenLabs obecny w DOM; aktywności serwerowej, dostawcy modelu, regionów i kluczy nie sprawdzono. | Deklaracje prawdopodobne A06, A07, A04 |
| Środowiska | Jedynie publiczny URL bety jest powiązany z produktem. Staging, środowisko lokalne i konfiguracja wdrożenia nieudostępnione. | Sprawdzone istnienie publicznych stron; pozostałe niedostępne |

HTTP z terminala zakończył się błędem DNS. Odczyt publicznego JS przez web również był niedostępny. Te błędy narzędzi nie dowodzą awarii strony; aplikację niezależnie odczytuje agent UX. Nie ponawiano zewnętrznych żądań z terminala. A10 dokumentuje ograniczenia.

## Mapa danych oparta na dowodach

Obecnie mamy **deklarowaną mapę**, nie zweryfikowane przepływy sieciowe. Źródłem A07 jest [publiczna polityka prywatności](https://coachfiai.com/privacy), oznaczona w produkcie jako szkic MVP z 10 maja 2026.

| Kierunek | Zakres deklarowany przez produkt | Dowód działania / luka |
|---|---|---|
| Użytkownik → stan przeglądarki | Pseudonim, cel, postęp, seria, język, głos, zgody. | Deklaracja; brak odczytu schematu i testu utrzymania stanu. |
| Formularz diagnozy → obliczenia przeglądarki | Kwoty sytuacji finansowej. | Formularz widoczny A05; implementacja wzoru i brak transmisji niesprawdzone. |
| Rozmowa → dostawca AI po zgodzie | Pytanie i krótka historia. | A06 deklaruje domyślnie lokalne odpowiedzi; nie testowano zgód i ruchu. |
| Przycisk głosu → ElevenLabs | Krótkie fragmenty tekstu. | Skrypt widgetu potwierdzony; zakres transmisji i fallback niesprawdzone. |
| Zgoda leaderboard → Supabase | Nazwa wyświetlana, wynik, seria. | Brak przypisanego projektu, schematu i polityk. |
| Funkcja blockchain → sieć publiczna | Adres portfela i metadane certyfikatu. | Deklaracja Devnet w A08; nie testowano portfela lub mintingu. |

Nie udowodniono synchronizacji między urządzeniami, trwałego konta ani kopii zapasowej stanu lokalnego. Funkcja eksportu/delecji w UI nie wystarcza do potwierdzenia kompletnego eksportu lub usunięcia u wszystkich dostawców. Nieustalone pozostają faktyczne okresy retencji, regiony przetwarzania, umowy z dostawcami i proces obsługi wniosków.

## Kontrole i luki dowodowe

| Kontrola | Co sprawdzono | Co musi być dowodem przyjęcia |
|---|---|---|
| Konto, auth, odzyskiwanie | Brak źródeł i kont testowych; nie wykonano przepływów. **Niesprawdzone.** | Wybrany model konta; rejestracja/logowanie/wylogowanie/odzyskiwanie; wygaśnięcie sesji; autoryzacja wszystkich mutacji. Jeśli etap B pozostaje local-only, świadome kryteria utraty danych zamiast obietnicy konta. |
| Izolacja, RLS, uprawnienia | Brak powiązanego schematu. **Niedostępne.** | Migracje, granty, policies, funkcje i widoki; testy dwóch własnych kont w staging, odmowa dostępu między kontami; osobna ocena leaderboard. Nie narzucać RLS jako rozwiązania bez poznania modelu danych. |
| Sekrety / zależności | Nie znaleziono manifestu i konfiguracji aplikacji; nie odczytywano sekretów. **Niesprawdzone.** | Lockfile, skan zależności i secret scanning repo/build; opis nazw zmiennych bez wartości; rozdział konfiguracji klient/serwer. |
| Financial Health Score | A05 pokazuje 42 i opis danych demo. UI jest dowodem prezentacji, nie wzoru. **Wzór niesprawdzony.** | Specyfikacja wejść, wag, brakujących danych, jednostek i wersji; wartości referencyjne i monotoniczność; oddzielenie wiedzy od sytuacji; demo jawne w każdym widoku. |
| Mila lokalna / zewnętrzna | A06 deklaruje tryb zewnętrzny wyłączony. **Działanie i ograniczenia niesprawdzone.** | Kod i aktualny prompt, źródła wiedzy, tryb bez zgody, payloady po zgodzie, zestaw ocen, odmowy gwarantowanych wyników, limit kosztów, fallback i eskalacja. |
| Zapis / eksport / usuwanie | Przyciski widoczne w polityce; bez ich uruchamiania. **Niesprawdzone.** | Zapis po przeładowaniu i powrocie; wersjonowanie storage; eksport i kompletna delecja; bezpieczna migracja danych. |
| Ograniczenia API / AI | Dokument wymienia rate limits, brak kodu i metryk. **Niesprawdzone.** | Egzekwowanie limitu po stronie serwera, zakres tożsamości, timeout, limit tekstu/kontekstu, budżet, brak kosztownej funkcji bez ograniczeń. Testy wyłącznie w staging. |
| Prywatność / obsługa | Szkice A07/A08 wprost wskazują potrzebę uzupełnienia procesu. **Sprawdzony status szkicu; proces niesprawdzony.** | Zatwierdzony zakres Polska PL/EN; właściciel danych i kontakt; obsługa zgłoszeń, zgód i żądań; ocena człowieka dla kwestii prawnych. |
| Backup / restore / rollback | Brak plików, runbooka i raportów. **Niedostępne.** | Próba odtworzenia danych reprezentatywnych w staging; zadeklarowane RPO/RTO; wersjonowany release i przećwiczony rollback. Dla local-only wyraźna granica odtworzenia. |
| Monitoring / alerty | Brak dowodów dashboardu, alertów i odpowiedzialnego dyżuru. **Niedostępne.** | Metryki błędów, dostępności i kosztów bez treści rozmów/danych finansowych; alert i odbiorca; symulacja awarii dostawcy. |
| Koszt / płatności | Nie ma rachunków, taryf używanego modelu, metryk zużycia ani integracji płatniczej. **Niedostępne.** | Koszt aktywnego free/premium przy realistycznym użyciu; twarde limity; dla etapu D: zakup, entitlement, webhook, retry/idempotencja, odnowienie, anulowanie i błędy. |

Ocena nie przypisuje kontrolom bezpieczeństwa wyniku „pass” na podstawie deklaracji strony. Szczegółową checklistę OWASP, wersje standardów i niezależną ocenę wydania utrzymuje rola 4. Ten audyt nie jest testem zgodności z ASVS ani LLM Top 10.

## Marketing a obecny zakres

| Obietnica / decyzja | Dostępny dowód | Konsekwencja |
|---|---|---|
| Bezpłatny Health Check i jeden krok | Lokalne skrypty reklamy A02; publiczny formularz i wynik demo A05. | Można komunikować demonstrację; wartość dla prawdziwych danych wymaga sprawdzenia wzoru i przepływu. |
| Mila, wyjaśnienia i nauka głosem | Reklama A02; opis A06; widget A04. | Nie ma dowodu jakości odpowiedzi, zgód, transmisji i niezawodności głosu. |
| Codzienne nawyki / poduszka | Publiczna prezentacja planu A11. | Brak badania skuteczności produktu; obietnice wyników wymagają danych użytkowych i jawnych ograniczeń. |
| Kids Mode obecnie w reklamie | `voiceover-en.txt` promuje dzieci; nawigacja publiczna zawiera Kids Mode. | Sprzeczność z bieżącą decyzją Foundera: teraz dorośli w Polsce, PL/EN. Zadanie do usunięcia z bieżącej komunikacji po przeglądzie; niczego tu nie edytowano. |
| Web3 jako późniejszy etap | Publiczna ścieżka nauki A12 eksponuje tokeny i NFT; menu zawiera Yield Vault. | Zakres w UI wymaga decyzji co ukryć/oddzielić w wydaniu dla dorosłych; nie traktować Devnet jako gotowej monetyzacji. |
| Wynik i liczby osobiste | Odczyt cache: 42; bieżący UX: Home sample 62/100. | Różnica narzędzi/stanu nie dowodzi błędu wzoru. Potrzebna jednolita semantyka wyniku i jawność danych demonstracyjnych. |
| Freemium, 5 USD/miesiąc | Decyzja Foundera; brak dowodu implementacji checkout. | Etap D po wartości, kontroli kosztów i pełnych testach płatności. |

Materiały lokalne pochodzą z 13 października 2026 według czasu modyfikacji. To artefakty marketingowe, nie historia kodu ani dowód wdrożonej funkcji. Skrypt kopiujący brand odwołuje się do starszych plików tymczasowych; nie traktować tych plików jako aktualnego repo aplikacji.

## Zasoby potrzebne do dalszej pracy

| Priorytet / zasób | Właściciel pozyskania | Kryterium przyjęcia / recenzent |
|---|---|---|
| P0: właściwe źródła aplikacji i aktualny commit | Founder + rola 2 | Powiązane repo, branch/commit publicznej bety, manifest/lockfile, instrukcje uruchomienia; sprawdza rola 4. |
| P0: przypisanie środowisk i dostawców | Rola 2 + 16, zależne od Foundera | Hosting, domena, staging, dostawcy, nazwy zmiennych i zakresy uprawnień bez wartości; mapę sprawdza rola 14. |
| P0: decyzja modelu kont i zapisu | Rola 2 + 12 + 5 | Uzgodniony local-only albo konto/sync; granice odzyskania; specyfikacja danych i test powrotu; sprawdza rola 4. |
| P0: wzór score i kod kalkulatorów | Rola 2 + 12 | Jawne założenia i przypadki referencyjne; recenzja roli 3, potem testy roli 4. |
| P0: konfiguracja i zachowanie Mili | Rola 13 | Kod, prompt, zatwierdzone źródła, dostawca/model, mechanizm zgody i limity; recenzje ról 3 i 14. |
| P0: runbook i dowody operacyjne | Rola 16 | Monitoring, alert, backup, próba restore/rollback, koszt i awaria AI; recenzja roli 4. |
| P1: pełny bank treści i quizów PL/EN | Role 7, 8 i 21 | Eksport z wersjami, źródłami i recenzentem; recenzja roli 3. |
| P1: aktualne procesy prywatności i pomocy | Role 15 i 19 | Zatwierdzone teksty dla Polski, kontakt i kompletne żądania; niezależne testy roli 4 i ocena człowieka. |

Limit wydatków pozostaje do decyzji po audycie. Przed otrzymaniem tych zasobów można przygotować specyfikacje, treści oraz przypadki testowe; nie da się rzetelnie zatwierdzić konta, danych ani bezpiecznego wdrożenia. Nie proponuje się teraz migracji frameworka ani nowej bazy: brak kodu nie uzasadnia przebudowy istniejącej bety.

## Odtworzenie odczytów

1. W katalogu projektu wykonać `git remote -v`, `git status --short`, `git log -1 --format='%H %s'` oraz `rg --files -g package.json -g '*lock*' -g '*.sql' -g '.env*'`. Oczekiwany wynik zapisany w A01 dotyczy czasu pierwszej inwentaryzacji.
2. W GitHub connector wykonać `search_installed_repositories_v2(query="coachfi", limit=10)` i `list_repositories(page_size=20)`. Pusty wynik ogranicza się do połączonego konta/instalacji.
3. Otworzyć publiczne [Home](https://coachfiai.com/), [Health Check](https://coachfiai.com/health-check), [Mila](https://coachfiai.com/coach), [Privacy](https://coachfiai.com/privacy), [Terms](https://coachfiai.com/terms) oraz [Learn](https://coachfiai.com/learn). Oznaczyć narzędzie, język, storage, stan i cache przed porównaniem wyników.
4. W bieżącym DOM Home odczytać publiczne `script[src]` i `link[rel=stylesheet]`, bez uruchamiania API lub zmiany zgód. Porównać z A04; hashe buildów mogą się zmienić.
5. Opcjonalne `Supabase list_projects` służy jedynie przypisaniu zasobu. Nie przechodzić do schematu ani danych, dopóki Founder lub konfiguracja źródłowa nie potwierdzi właściwego projektu.

Przeczytano [skill Supabase](C:/Users/doria/.codex/plugins/cache/openai-curated-remote/supabase/1.0.0/skills/supabase/SKILL.md). Próba odczytu wskazanego changelogu Markdown została odrzucona przez narzędzie jako nieobsługiwany content-type; nie wdrażano żadnej zmiany zależnej od aktualnych funkcji Supabase. Skill `coachfi-architecture` jest przygotowywany przez koordynatora i nie był dostępny przy rozpoczęciu audytu.
