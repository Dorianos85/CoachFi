# Coachfi.ai — cykl 3: synchronizacja przy zmianie sesji

14.10.2026. **Przyjęte lokalnie w ograniczonej niezależnej recenzji; produkcja NO-GO.** Gałąź `codex/p0-security-consent-export`, baza `86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b`, zachowane P0 i cykl 2. Bez commit, push, deploy, rzeczywistych kont, profili/sekretów lub płatnych wywołań. [Plan i własność](work-plan.md).

## Co naprawiono

| Problem | Rezultat | Autor / niezależny recenzent |
|---|---|---|
| Stare timery i odpowiedzi Supabase po logout, A→B lub unmount | Generacja sesji, AbortSignal, kontrola przed i po await oraz przed zapisami/eventami. Pusher działa po udanej aktualnej hydratacji; callback auth oddaje kontrolę SDK przed synchronizacją. | architecture_audit / ux_audit |
| Odświeżenie tego samego UID kasowało nową lokalną zmianę | TOKEN_REFRESHED i powtarzane SIGNED_IN zachowują aktywny lease i oczekujący jawny zapis. Logout→login, również tego samego UID, tworzy nowy lease. | architecture_audit / ux_audit |
| Globalna kolejka CDP, stale token/GET/PUT/JSON i dirty state | Getter, identity header, kolejka, snapshot wartości i dirty tickets należą do jednej sesji. Stop jest natychmiastowy, bez końcowego flush; B nie czeka na A. | curriculum_pilot / ux_audit |
| Resume po React cleanup przetrwało logout; reentrant abort nadpisywał nową sesję | Explicit logout odrzuca także zachowany lease. Globalne zmiany kończą się przed abort; starszy start/binding nie nadpisuje nowszego bridge. Factory jest sprawdzana przed rozpoczęciem, late rejection obsłużone. | curriculum_pilot / ux_audit, findings root |
| Spóźniony component completion pokazywał wynik ponownie | AccountSync i rzeczywisty binding sprawdzają lease po completion i przy każdym powiadomieniu; cleanup unieważnia własną pracę. | curriculum_pilot / ux_audit |
| Niejawne przejmowanie danych urządzenia przy login | Cloud-only initial hydration; nowe konto tworzone tylko z `{version:1}`. Brak auto-seed profilu/vault/challenge/zdrowia/postępu gościa; GET failure nie oznacza empty account. Same-owner znane dirty snapshots mają odrębny kontrakt. | obaj autorzy / ux_audit |
| Getter może oddać token innej tożsamości przed cleanup | API porównuje opcjonalny `x-coachfi-account-user-id` ze zweryfikowanym Bearer ownerem przed storage. Mismatch409; nagłówek nie uwierzytelnia. Nowy account-sync wysyła go w każdym request. | root / ux_audit |
| Dwa mechanizmy konta mogły działać równocześnie | Providers wyłącza legacy AuthProvider przy CDP; disabled nie inicjalizuje fabryki Supabase ani subskrypcji. Opis AccountButton PL/EN wyjaśnia brak automatycznego importu wcześniejszych danych urządzenia. | root + architecture_audit / ux_audit |

Health upload oraz zewnętrzne AI pozostają wyłączone. [Supabase implementation](supabase-implementation.md), [account implementation](account-implementation.md), [API/provider/copy](api-implementation.md).

## Testy i niezależny odbiór

[Końcowe kontrole roota](../../../evidence/cycle-3/verification.json):

- **422/422 Vitest PASS** w 32 plikach, po korekcie kontraktu SDK i typów testów.
- **20/20 Playwright PASS**, PL/EN, tymczasowy headless Chrome i localhost; konfiguracja providerów/auth pusta, ruch zewnętrzny zablokowany. To regresje P0/diagnozy, bez rzeczywistego logowania SDK.
- Osobny **typecheck PASS**, kod wyjścia 0.
- **Build PASS**, kod wyjścia 0, **34/34 strony statyczne**, w zweryfikowanej kopii źródeł w lokalnym TEMP poza OneDrive. Skopiowano 248 plików, po buildzie 247 wejść kodu/testów/config/assets nadal ma identyczne SHA256; wygenerowany next-env.d.ts wyłączono z końcowego porównania. Zależności to junction do tego samego zainstalowanego node_modules, bez install. Provider/auth environment puste, telemetria wyłączona.
- **Repo guard PASS** po stagingu i poprawce wyłącznie prefiksu syntetycznej fixture; bez osłabienia skanera, bez zwracania credential snippets lub czytania profili. Liczniki są w verification.json.

[Niezależna recenzja ux_audit](security-review.md): **LIMITED ACCEPT**. Recenzent sam zaprojektował 40 testów i dodatkowo wykonał 15 testów roota — 55 cases, zawartych już w aggregate, bez dodawania do 422. Odtworzył baseline FAIL i retestował 11 findings. Syntetyczne hook fixtures wykonują rzeczywiste komponenty/binding z kontrolowanymi hookami; nie są browser SDK/StrictMode account testem. [Dowody i hashe](../../../evidence/cycle-3/review-final.json).

Pierwsze 417 runtime PASS nie zaliczało TS: terminalny typ `maybeSingle()` nie deklarował `abortSignal`. Odczyt zainstalowanego SDK wykazał `return this`, więc nie odtworzono runtime TypeError. Poprawiono signal-before-terminal i dodano 3 testy autora oraz 2 niezależne testy rzeczywistego SDK z wyłącznie atrapą transportu. Kolejny aggregate 422 i TS przeszły. Później guard wskazał jedną syntetyczną fixture; zmieniono tylko jej prefiks na FIXTURE_, author retest **27/27 PASS**, root sprawdził dokładnie jedną zmienioną linię. Kod aplikacji nie zmienił się po aggregate.

Build w oryginalnym workspace miał dwie rzeczywiste porażki plików wygenerowanych: EINVAL/readlink middleware manifest, następnie EBUSY nft trace po kompilacji i 34 stronach. Nie zaliczono ich jako PASS. Cache zachowano w `.codex-temp/cycle-3/dev-cache`; bez usuwania źródeł. Udany build TEMP ma jawne środowisko i wynik; nie dowodzi niezawodnego buildu w OneDrive. Pozostały wcześniejsze ostrzeżenia opcjonalnych importów Coinbase: x402-fetch i @base-org/account.

## Granice i dalszy cykl

Anulowanie klienta nie cofa requestu, transakcji lub operacji auth zaakceptowanej już przez SDK/serwer. Nie zatwierdzono pełnej izolacji profile/health/consent na wspólnym urządzeniu, mnogich kart, trwałej kolejki offline, idempotencji reward retry, RLS, kont staging, praw danych u operatora lub historii publicznego repo. LocalStorage nie ma transakcyjnego rollbacku; failure hydratacji może pozostawić wcześniejszy stan. Pusher wtedy pozostaje wyłączony, bez seed, co nie oznacza pełnej izolacji widoku.

**Następne zadanie pętli: B14**, mapa własności kluczy i bezpieczne zachowanie danych gościa, przed treściami PL/EN. Nie włączać health storage na koncie ani nowego zakresu danych. Automatyzacja w tym czacie pozostaje aktywna co 10 minut; nie duplikować tego zakończonego cyklu.

Źródła implementacji: [React cleanup/race](https://react.dev/reference/react/useEffect), [Supabase auth callback](https://supabase.com/docs/reference/javascript/auth-onauthstatechange), [SDK callback deadlock](https://supabase.com/docs/guides/troubleshooting/why-is-my-supabase-api-call-not-returning-PGzXw0), [AbortSignal](https://supabase.com/docs/reference/javascript/using-modifiers-abortsignal), [Vite test JSX](https://vite.dev/guide/migration), sprawdzone 14.10.2026. Dokumentacja informuje wzorzec; dowodem patcha są odrębne testy i recenzja.
