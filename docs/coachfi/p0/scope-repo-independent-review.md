# Niezależna recenzja P0: zakres produktu i higiena repo

Data: 2026-10-14. Recenzent: `curriculum_pilot`; autor recenzowanych zmian: `ux_audit`, operacja usunięcia z indeksu: koordynator. Repo `source/CoachFi`, gałąź `codex/p0-security-consent-export`. Nie edytowałem recenzowanego kodu ani autorskiego raportu. To ograniczony przegląd zmian lokalnych, bez zatwierdzenia wydania/produkcji i bez testu prawdziwego konta.

Werdykt: **P0 zabezpieczenia zakresu i indeksu przyjęte w zakresie odczytanego kodu oraz niżej wykonanych testów; obie korekty P2 naprawione i niezależnie sprawdzone**. Końcowy build/typecheck i browser E2E należą do koordynatora. Historyczny incydent/publiczne profile pozostają poza tym werdyktem.

## Dowody niezależne

| Kontrola | Dowód i wynik | Zakres wniosku |
|---|---|---|
| Indeks Git, bez treści profili | `node scripts/check-repo-hygiene.mjs --json`: `ok=true`, **446 tracked**, `scannedTextFiles=0`, findings `[]` | Aktualny indeks nie zawiera wykrywanych klas profili/generowanych logów/env/credential files. Nie oceniono historii ani wartości sekretów. |
| Testy narzędzia | `node --test tests/repo-hygiene.test.mjs`: **5/5 PASS** w niezależnym uruchomieniu | Metadata-only default, niedrukowanie credential values, omijanie zabronionego pustego synthetic profilu także podczas scan-secrets, zachowanie env example, obsługa nieznanych argumentów. |
| Dodatkowe assertions zakresu | Własny run Node z importem `lib/product-scope.ts`, **18 assertions PASS**: 8 blocked paths, 6 allowed lookalike/core paths, 4 disabled features | `/kids/a/b?foo=1`, `/vault///`, `/partner#offer`, `/achievement/child`, `/marketplace/x`, `/leaderboard?q=1` pozostają wyłączone; podobne prefiksy `/kidscopy`, `/vaults`, `/partners`, `/achievement-copy` nie są mylnie blokowane. |
| Kod odroczonych stron | `app/kids/page.tsx:1`, `app/vault/page.tsx:1`, `app/partner/page.tsx:1`; `components/AppNavigation.tsx:626` | Trzy route components zwracają jedynie `ScopeUnavailable`; powłoka nie montuje dzieci dla wszystkich odroczonych route/podścieżek, w tym `/achievement`. |
| Nav i ranking | `components/AppNavigation.tsx:489`, `components/Leaderboard.tsx:103` | Filtrowanie przed renderowaniem nav; flag-off rankingu poprzedza montaż hooków/żądań wewnętrznego komponentu. |
| Portfele | `app/providers.tsx:31`; `app/rewards/page.tsx` | Brak Solana Wallet/Connection/WalletModal providerów i Phantom adaptera w podstawowym drzewie. CDP zachowano dla kont, Solana createOnLogin=false; rewards nie importuje mintowania/portfela i opisuje zwykłe punkty bez wypłaty/wymiany. |
| Potwierdzenie 18+ | `context/ModeContext.tsx:46`, `components/ModeGate.tsx:40`, `components/ModeGate.tsx:64`, `components/ModeGate.tsx:87` | Stary adult bez strict numeric age marker 18 i stary kids nie tworzą aktywnego trybu. Nowe potwierdzenie wymaga osobnego kliknięcia checkboxu; forced modal ma Radix focus scope i blokuje Escape/outside dismissal. To samoświadczenie, nie weryfikacja wieku/tożsamości. |

Początkowy sandbox run dwóch hygiene CLI fixture zatrzymał się na `git init` do tymczasowego `.git/config`, przed kontrolą fixture. Autoryzowany lokalny retry przeszedł 5/5; nie odczytywano żadnego realnego profilu/cookies/credential database. Nie uruchamiałem `--scan-secrets` na rzeczywistym repo, unrestricted `git diff --cached` ani otwierania plików z odstawionych katalogów. Odczyt dotyczył kodu, testów, ignore, autorskiego raportu i zainstalowanej biblioteki.

## Ocena metadata guard

`scripts/check-repo-hygiene.mjs:52` domyślnie odczytuje wyłącznie root Git i nazwy z `git ls-files -z`. Opcjonalny content scan jest osobną gałęzią `scanSecrets`. `scripts/check-repo-hygiene.mjs:62` wyklucza zabronione nazwy przed `lstat`/`readFile`; `:67` wyklucza symlinki, nonfiles i >1 MiB. Wyniki skanowania zawierają rule/path/line, bez match/snippet. `.gitignore` zachowuje `.env.example` i zwykłe dowody w `evidence`, ignoruje generowane profile/temp/logi oraz lokalne env/mcp/Supabase temp.

Limit jest jawny: guard obejmuje obecny indeks i rozpoznawane klasy nazw, a opcjonalny skaner ma wybrane wzorce. Nie stanowi gwarancji braku dowolnego sekretu w historii lub w dowolnie nazwanym pliku. Nowe pliki untracked wymagają kontroli po stagingu. Usunięcie 1427 plików z indeksu potwierdza poprawę bieżącego repo; nie dowodzi usunięcia remote/history ani unieważnienia credentials.

## Ocena kont i wallet scope

Odczyt zainstalowanego SDK wspiera deklarację braku automatycznego nowego portfela w tym config: `@coinbase/cdp-core/dist/web/index.web134.js:14` wywołuje tworzenie EVM wyłącznie przy `c.ethereum?.createOnLogin`; Solana przy `c.solana?.createOnLogin`. App config nie wybiera Ethereum createOnLogin i ustawia Solana false. Nie uruchamiałem logowania ani SDK auth calls. Ten dowód nie oznacza, że stare konto nie zawiera wcześniej utworzonego portfela albo że cały produkt usunął wszystkie pliki dawnego web3 — te funkcje pozostają kodem odłożonym, bez montażu w current scope.

## Findings do korekty

1. **SR-01 P2, komunikacja — closed:** footer pokazywał „Powered by ElevenLabs”, choć zewnętrzny voice/AI jest hard-off. Autor usunął ten blok; ponowny `rg` w `components/AppNavigation.tsx` potwierdził brak tekstu. Bez własnej edycji.
2. **SR-02 P2, schemat trybu — closed:** niekompletny rekord `{mode:'adult', adultAgeRequirement:18}` był przyjmowany jako aktualne potwierdzenie. Autor dodał `hasAdultConfirmation` w `lib/product-scope.ts` i wywołanie w `context/ModeContext.tsx`: strict mode/18, wyłącznie cztery znane pola, canonical timestamps, nie przyszłe ponad 60 s i confirmed>=selected. Odczyt poprawki oraz niezależny Node run **9 assertions PASS**: komplet poprawny, brak dat, string18, przepełniona data, niewłaściwa kolejność, daleka przyszłość, guardian extra, array/null. To spójność migracji/metadanych, nie ochrona przed użytkownikiem samodzielnie zmieniającym storage. Bez własnej edycji.

Banner ConsentManager zasłaniający footer/mobile nie należy do recenzowanego autora. Autor klienta (niniejszy recenzent) przeniósł własny banner do normalnego przepływu i zlecił UX retest. Tej własnej zmiany nie zatwierdzam tutaj.

## Warunki domknięcia

Przyjęcie jest ograniczone do stałego scope, bezpiecznych fallbacków i metadata guard. Autor UX zgłosił osobno PL/mobile retest footer/mode i Consent dialog focus/Escape/return-focus PASS; nie przedstawiam tego jako własnego browser testu. Nie oceniono produkcji, rzeczywistych kont, cloud hydration nowego age marker, serwerowej weryfikacji wieku, incydentu historycznych profili ani nowego banku pytań. Raport autora: `docs/coachfi/p0/repo-scope-implementation.md`; wspólny odbiór może nastąpić dopiero po finalnych kontrolach koordynatora. Meta retest po korektach nadal 446 tracked, 0 content reads, 0 findings.
