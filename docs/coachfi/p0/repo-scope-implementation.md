# P0 — higiena repozytorium i zakres produktu

14.10.2026, środowisko lokalne Windows, gałąź `codex/p0-security-consent-export`, bazowy SHA `86226ddc2c672b3d3d88869ebd8c5f6a5a59c19b`. Autor: `ux_audit`, role 14/10/11. Niezależni recenzenci: `curriculum_pilot` i koordynator. Autor nie zatwierdza własnej zmiany. Bez push, deploy, zmian bazy, płatnych usług i odczytu rzeczywistych profili.

## Zmienione działanie

Wydanie obejmuje edukację dorosłych PL/EN. `lib/product-scope.ts` eksportuje typ `ProductFeature` oraz `isFeatureEnabled(feature)`, który dla `kids`, `web3`, `marketplace`, `leaderboard` zwraca false. Prywatny zamrożony słownik nie korzysta z env. `isRouteEnabled` obejmuje ścieżki bezpośrednie, zagnieżdżone oraz query/hash.

| Obszar | Rezultat lokalnej implementacji |
|---|---|
| Nawigacja | Kids/Vault/Partner i odroczone ścieżki są odfiltrowane; mobile prowadzi Home/Health Check/Learn/Mila. Z-index mobile obniżony z 1100 do 40. CTA Kids na Home jest odfiltrowane. |
| Direct routes | `/kids`, `/vault`, `/partner` pokazują jednoznaczny komunikat niedostępności PL/EN i link do nauki. Usunięto ich aktywne demo i importy. Powłoka dodatkowo nie montuje dzieci dla `/achievement`, `/marketplace`, `/leaderboard` i podścieżek odroczonych funkcji. |
| Portfele | Z domyślnych Providers usunięto ConnectionProvider, WalletProvider, WalletModalProvider, PhantomWalletAdapter i fallback wallet context. Istniejący CDP dla kont pozostaje, `solana.createOnLogin:false`. Brak nowego vendora lub biblioteki. |
| Nagrody | `/rewards` pokazuje rzeczywiste punkty z istniejącego lokalnego kontraktu; brak mintowania, certyfikatów NFT, synchronizacji on-chain i przycisków portfela. Opis PL/EN wyjaśnia brak wartości pieniężnej/wypłaty/wymiany. |
| Lekcje / quiz | Leaderboard zatrzymuje się przed montażem hooków. ProgressPath zachowuje etapy i punkty, ukrywa status NFT. Teksty początku lekcji/quizu i narracja ścieżki nie obiecują certyfikatu; Health Check ukrywa CTA achievement. Bank pytań, obliczenia FHS i logowanie niezmienione przez autora tego zadania. |
| Dostępność | Zachowano kontrolki kontrastu i rozmiaru tekstu. Usunięto numerologię, datę urodzenia oraz skróty odtwarzające narrację Kids/certyfikatu. Komponenty Voice/Mila pozostają własnością drugiego autora. |
| Odczyt demo | Po rozszerzeniu zakresu przez koordynatora poprawiono `app/voice-demo/page.tsx`: PL/EN lokalny głos po kliknięciu, tekst gdy głosu brakuje, brak Creator/cache/live cloud promise. Selector PL/EN; karty Kids/certyfikatu usunięte. Same skrypty do przyszłego programu zachowano. Przykładowy score opisany jako przykład, nie diagnoza użytkownika. |
| Wiek i dialog | ModeGate używa istniejącego Radix Dialog: modalny FocusScope, aria-hidden dla otoczenia i blokada pointer interakcji poza dialogiem. Potwierdzenie brzmi „Mam ukończone 18 lat.” / „I am at least 18 years old.”; brak promocji Kids/opiekuna. Mandatory dialog nie zamyka się Escape/outside. Stare guardian/adult rekordy bez `adultAgeRequirement:18` wymagają nowego potwierdzenia; stare Kids rekordy są ignorowane. `selectKidsMode` nie zapisuje przy wyłączonej funkcji. |

Zmiana flagi nie jest odbiorem przyszłej funkcji. API odroczonych funkcji ma osobnego autora i dodatkową statyczną odmowę; włączenie przyszłych ścieżek wymaga własnego projektu, recenzji i testów. Lokalne potwierdzenie wieku nie jest weryfikacją tożsamości ani autorytatywną zgodą serwerową. Po uwagach niezależnego recenzenta usunięto footer Powered by ElevenLabs i dodano `hasAdultConfirmation`: ścisłe cztery pola, marker18, oba canonical ISO timestamp, finite/not-future oraz confirmedAt>=selectedAt. Malformed/legacy rekord nie odblokowuje trybu.

## Higiena i dokładne targety indeksu

Przed usunięciem z indeksu odczytano wyłącznie `git ls-files` oraz metadane nazw. `.mcp.json` sprawdzono wyłącznie jako strukturę env: brak niepustych env wartości w wykrytym serwerze; nie wypisano argumentów ani wartości. To lokalna konfiguracja narzędzi, więc również wyłączona z repo.

| Dokładny target repo-relative | Śledzone pliki przed operacją | Właściciel operacji |
|---|---:|---|
| `.codex-screenshots/` | 1421 | koordynator |
| `.codex-logs/` | 2 | koordynator |
| `.mcp.json` | 1 | koordynator |
| `supabase/.temp/` (cli-latest, linked-project.json, postgres-version) | 3 | koordynator |
| Łącznie do usunięcia z indeksu | 1427 | koordynator |
| `.env.example` | 1, zachować | — |

Autor nie wykonał git rm, stage, commit lub zmiany gałęzi. Koordynator usunął te targety wyłącznie z indeksu, zachowując pliki lokalne. Retest metadata: 446 tracked, zero zabronionych klas. Nie wykonano unrestricted `git diff --cached`/`git diff HEAD`; sprawdzono jedynie wybrane pliki kodu.

`.gitignore` ignoruje całe katalogi generowanych profili/logów/temp/trace, lokalne `.mcp.json`, `supabase/.temp/`, `.env` i `.env.*` z wyjątkiem `.env.example`. Dowody w `evidence/ux` pozostają dozwolone. Zmiana ignore sama nie usuwa danych z historii.

`scripts/check-repo-hygiene.mjs` używa aktualnego indeksu `git ls-files -z`, bez historii. Domyślnie ocenia wyłącznie nazwy profili, wyjść generowanych i plików poświadczeń. `--scan-secrets` dodatkowo czyta wybrane śledzone pliki kodu do 1 MiB, z pominięciem całych zabronionych ścieżek, symlinków i danych binarnych. Wynik to tylko `rule/file/line`, bez wartości, snippets lub sekretów. Reguły obejmują wybrane formaty tokenów, klucze prywatne i jawne przypisania poświadczeń; nie jest to pełny detektor wszystkich sekretów. Nie skanuje nieśledzonych `.env` ani profili.

## Weryfikacja

- `node --test tests/repo-hygiene.test.mjs`: PASS 5/5. Puste/syntetyczne fixture Git zawierają tylko nazwę profilu; żadnych cookies, DB lub rzeczywistych sekretów. Dwie próby CLI początkowo zatrzymał sandbox na git init `.git/config`; autoryzowane ponowienie poza sandboxem PASS.
- `node scripts/check-repo-hygiene.mjs --scan-secrets --json`: PASS po operacji koordynatora; początkowo446 tracked/190 tekstowych, po pierwszym stagingu476/214, w końcowym własnym odczycie482 tracked/215 tekstowych, 1 pominięty powyżej limitu, zero findings. Nowe pliki nieśledzone wymagają powtórzenia po stagingu. Początkowe dwie false-positive etykiet hasła w tłumaczeniach zawęziły regułę do rzeczywistych przypisań, bez odczytu/wypisania poświadczeń.
- `node node_modules/vitest/vitest.mjs run tests/product-scope.test.ts`: finalnie PASS 3/3 — stały scope pomimo publicznych env, direct/nested/query routes oraz ścisłe oświadczenie adult/odrzucenie legacy, future i malformed rekordów. Pierwsza próba w sandboxie wykonała 0 testów (EPERM cache); ponowienie poza sandboxem PASS. Próba SSR komponentu TSX została usunięta, ponieważ istniejący Vitest przy jsx:preserve go nie transformuje; nie przedstawiam jej jako dowodu UI.
- `node node_modules/typescript/bin/tsc --noEmit`: PASS po zmianach scope.
- `git diff --check` wyłącznie dla przydzielonych plików kodu: PASS; Git ostrzega o przyszłej normalizacji LF→CRLF.
- React checklist po wielu TSX: hooki nie są warunkowe; gate poprzedza montaż dziecka/hooków; lokalne subskrypcje punktów mają cleanup; bez nowej biblioteki i providerów portfela; deklaracje PL/EN i semantyka Radix Dialog. Opcjonalny dialog ma jawny ref do przycisku otwierającego i przywraca focus po asynchronicznym unmount.

## Lokalny retest CUA

Testowane `http://127.0.0.1:43191`, proces z wyzerowanymi provider/auth env, Chrome3 tymczasowa karta. Dawny IAB2 był niedostępny; po create Chrome zgłosił navigation timeout, ale inventory i DOM potwierdziły załadowaną stronę. Nie korzystano z profilu/kont/secrets, nie zaakceptowano terms ani finalnego oświadczenia wieku. Dwie ilustracje: [EN mobile](../../../evidence/p0/ux/age-en-mobile.png), [PL mobile](../../../evidence/p0/ux/age-pl-mobile.png).

| Route / akcja | Wynik odczytany z DOM/UI |
|---|---|
| `/`, EN, footer Change mode | Dialog „Welcome to Coach FI”, copy18+, checkbox „I am at least 18 years old.”, Continue disabled. Tab close→checkbox→close; focus pozostaje w dialogu. |
| Mobile390×844, dialog EN | Rect x12,y241.4,width351.2,height361.2; brak poziomego overflow; mobile navz40; tło app-shell aria-hidden=true, body pointer-events=none. |
| PL, footer Zmień tryb | „Witaj w Coach FI”, „Mam ukończone 18 lat.”. Zaznaczenie wyłącznie lokalnej kontrolki zmienia disabled→enabled; odznaczono, bez finalnego submit. Tab z Continue wraca do close. |
| PL, click mobile nav pod ustawieniowym dialogiem | Dialog settings zamyka się przez outside interaction; URL pozostaje `/`, bez nawigacji. Nie jest to test mandatory gate, który ma osobny preventDefault. |
| PL, Escape zamknięcie opcjonalnego dialogu | Po świeżym DOM snapshot focus wraca na BUTTON „Zmień tryb”. Natychmiastowy odczyt przed asynchronicznym callbackiem pokazywał BODY; nie uznano go za końcowy wynik. |
| `/kids`, PL po hydration | „Ta funkcja jest niedostępna w tej wersji”, link „Przejdź do nauki”, brak widget. Pierwszy SSR był EN, po hydration PL; odróżniono te stany. |
| PL, Consent modal — autor inny | Tab z „Akceptuj wszystko” wraca do close, tło aria-hidden, Escape zamyka i focus wraca do „Zgody”. Nie klikano akceptacji/zapisu. |
| Mobile, footer po poprawce bannera autora zgód | Fizyczny click Zmień tryb otwiera właściwy dialog. Pierwsza wersja fixed banner przechwytywała click i otwierała zgody; przekazano właścicielowi i retest normal-flow PASS. |

Runtime Chrome3 następnie stał się niedostępny podczas próby pozostałych directroutes. Nie uznano tej próby za PASS, nie wykonano dalszego restartowania/przeglądania. Koordynator potwierdził finalny syntetyczny E2E 9/9, w tym mandatory age/Escape oraz wszystkie directroutes PL/EN; Vitest 145/145, build 35/35 i typecheck PASS są w [REPORT](REPORT.md). Nie są własnymi przebiegami CUA autora. CUA nie dostarcza pełnego network log: brak widget w DOM i code gates potwierdzono, zero provider/network operations rozstrzygają mock testy i izolowany E2E. Tymczasowy viewport/karta stały się niedostępne razem z runtime; nie zmieniano globalnych ustawień urządzenia.

Niezależny recenzent zapisał [limited ACCEPT zakresu/repo](scope-repo-independent-review.md), z zamknięciem SR-01/SR-02 po retestach. Przyjęcie zabezpieczeń lokalnych nie zmienia NO-GO produkcyjnego.

## Pozostałe ograniczenia

Naprawa jest częściowa: bieżący lokalny indeks i working tree ograniczono, historyczna/publiczna ekspozycja profili pozostaje otwarta. Usunięcie z indeksu nie unieważnia credentials ani nie czyści remote/history/backups. Wymagany osobny plan incydentu i rzeczywiste decyzje Foundera. Produkcja pozostaje bez zmian. Nie zweryfikowano kont użytkowników, cloud synchronizacji nowego age marker, migracji, serwerowej weryfikacji wieku ani staging E2E. Błędy samej edukacji PL/EN, FHS/login i pozostałe obietnice marketingowe mają osobnych właścicieli.

Własny wynik autora: implementacja lokalna gotowa do niezależnej recenzji, odbiór i wydanie niezatwierdzone. Rollback lokalny: przywrócenie wyłącznie wskazanych plików aplikacji z bazowego SHA po zapisaniu potrzebnych zmian; nie przywracać profili/sekretów do indeksu i nie odtwarzać dawnych aktywnych API jako obejścia.
