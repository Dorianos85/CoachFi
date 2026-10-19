# Cykl 4 — B14 przyjęty lokalnie

14.10.2026. Dorośli, Polska, PL/EN. `codex/p0-security-consent-export`, HEAD `86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b`. **Ograniczone przyjęcie lokalnego kodu, testów syntetycznych i wskazanych scenariuszy przeglądarkowych. Bez commit/push/deploy; produkcja nadal NO-GO.**

## Zmiana i zakres

Adapter rozdziela 18 osobistych kluczy na guest oraz namespace każdego provider/UID. Dwa ustawienia urządzenia — język i dostępność — pozostają globalne. To logiczne rozdzielenie ścieżek aplikacji, nie szyfrowanie, auth ani RLS. Zastane raw keys mają nieudowodnione historyczne pochodzenie: guest oznacza przestrzeń aplikacji, nie potwierdzonego autora rekordów. Login, empty cloud, failed sync i logout nie przypisują ani nie nadpisują tych bajtów jako danych konta.

Aktywny właściciel istnieje tylko w RAM karty. Nieznana tożsamość skonfigurowanego backendu ma pending bez osobistego UI; znane konto po błędzie synchronizacji otrzymuje własny widok local-only i wyłączony pusher. Boundary remountuje osobiste konteksty po rewizji, pozostawiając auth/sync poza nim. Same-owner metadata nie zmienia uchwytów formularzy. Stare callbacki, kolejki, timery, odczyt głosu i chat bookkeeping są związane z przechwyconym uchwytem. Diagnoza pozostaje local-only, ze wzorem /98 i dotychczasowym kontraktem PLN/legacy.

Eksport v2 obejmuje wybrane dane jednego aktualnego zakresu z obu storage i jawnie oznaczony język urządzenia. Nie zawiera UID/prefixu, sesji ani swobodnego tekstu nazwy/celu. Sprawdzenie aktualności następuje po zbieraniu i przed pobraniem. Usuwanie najpierw unieważnia lease/queue, potem usuwa 18 osobistych kluczy obu storage wyłącznie bieżącego zakresu. Inne zakresy, auth oraz ustawienia urządzenia pozostają. Błąd częściowego kasowania jest widoczny poza osobistym subtree; brak obietnicy rollback lub pełnego usunięcia konta/dostawców.

## Recenzja, findings i testy

Autorzy: architecture_audit (adapter/sync/learning), curriculum_pilot (personal helpers/contexts), root (boundary/hook/export i pozostały UI). [Niezależna recenzja UX](privacy-review.md): LIMITED ACCEPT, 64 własne unikalne przypadki PASS, sześć findings zamkniętych; nie są dodatkiem do liczby suity. Root porównał bieżący kod z 41 fingerprintami recenzenta. Autor nie zatwierdzał własnej zmiany.

Oprócz czterech bazowych problemów z danymi, recenzja odtworzyła stary submit CoachPage naliczający 100 ms rozmowy kontu B; ten sam test po poprawce daje 0, bez sieci. Przeglądarka odtworzyła kasowanie draftu diagnozy przy akceptacji wymaganej zgody. Oddzielono initial load/owner reset od withdrawal: akceptacja zachowuje wpisane dane, wycofanie czyści pola/wynik; PL/EN retest oraz niezależny harness potwierdziły poprawkę. Historyczne reprodukcje i czerwone próby są zachowane, nie liczone jako pozytywne kontrole.

| Końcowa kontrola | Wynik i granice |
|---|---|
| Vitest | **503/503 PASS**, 45 plików; ostatnia suita po health/memo findings. Moki/syntetyczne fixtures, bez rzeczywistych kont. |
| TypeScript | **PASS**, exit 0, po ostatnich zmianach. |
| Playwright | **22/22 PASS**, 0 skipped/flaky, PL/EN, localhost i świeży profil Chrome. Eksport, required/optional, diagnosis, local voice/chat, deferred routes oraz rzeczywiste usuwanie/reload guest. Account namespaces w tym browser teście są syntetyczne; realny SDK login/RLS nieprzetestowany. |
| Next build | **PASS**, exit 0, 34/34 static pages, istniejące opcjonalne warningi Coinbase x402-fetch/@base-org/account. |
| Snapshot | 279 skopiowanych plików; po buildzie porównano 278 wejść (pominięto generowany next-env.d.ts), **0 rozbieżności SHA256** z workspace i snapshotem. Te same zainstalowane zależności przez junction, bez install. |
| Higiena Git | Końcowy wynik w [verification.json](../../../evidence/cycle-4/verification.json); indeks lokalny, bez publikacji. |

Build i udane E2E wykonano w `C:/Users/doria/AppData/Local/Temp/coachfi-cycle4-verify-2uQPUF`, poza OneDrive; provider/auth env puste i telemetria wyłączona. Testowy serwer zakończony. [Surowe wyniki i rzeczywiste statusy](../../../evidence/cycle-4/verification.json), [build z logiem](../../../evidence/cycle-4/build-result.json), [manifest hashy](../../../evidence/cycle-4/snapshot-inputs.json).

Pierwszy typecheck wykazał typ mocka; poprawiono tylko typing. Pierwsza suita 488/495 miała siedem błędów starych fixtures bez jawnego bootstrapu właściciela; zmieniono setup, zachowując wszystkie oracles, retest 495/495. Nowe health/memo testy dały końcowe 503. Próby E2E przed właściwym wykonaniem zatrzymał brak runtime Chromium, EINVAL cache OneDrive oraz mój niepełny snapshot bez styles; poprawiono przygotowanie, nie kod aplikacji. Pierwsze właściwe E2E 20/22 wykazało regresję health i uzasadniało poprawkę/retest. Nie powtarzano końcowych zielonych testów bez zmiany.

## Pozostałe ograniczenia i kolejna praca

Nie odczytano realnych profili/sesji/sekretów ani nie zmigrowano danych użytkownika. Nie sprawdzono dwóch realnych kont, staging RLS, bezpieczeństwa urządzenia/same-origin JS, retencji/praw operatora, many-tab/multi-device conflict resolution lub ochrony trwałych zmian offline przy zimnym powrocie. Abort nie cofa requestu już przyjętego przez SDK/serwer. Te bramki nie otrzymują PASS. Zewnętrzne AI/health upload/Kids/Web3/afiliacja pozostają wyłączone; audyt zależności nie był ponawiany bez zmiany lockfile.

Kolejny wykonalny krok **B15**: syntetyczny audyt trwałości własnych zmian konta po offline/cold resume i konfliktów. Najpierw odtworzyć zachowanie oraz ustalić minimalny kontrakt, bez automatycznego importu danych gościa, nowych danych/dostawców lub zapisu produkcyjnego. Pętla pozostaje aktywna; treści PL/EN po zadaniach integralności.
