# Jak uruchomić Coach FI lokalnie

Przewodnik dla osób, które nigdy wcześniej nie uruchamiały aplikacji webowej na własnym komputerze. Każdy krok jest opisany dokładnie — bez założeń, że coś już wiesz.

---

## Czego potrzebujesz

Zanim zaczniesz, Twój komputer musi mieć zainstalowane dwa programy:

| Program | Do czego służy |
|---|---|
| **Node.js** | Silnik, który pozwala uruchamiać aplikacje napisane w JavaScript/TypeScript na komputerze |
| **npm** | Menedżer paczek — pobiera biblioteki, z których korzysta Coach FI. Instaluje się automatycznie razem z Node.js |

### Jak sprawdzić, czy masz już Node.js

1. Naciśnij `Windows + R` na klawiaturze
2. Wpisz `cmd` i naciśnij Enter — otworzy się czarne okno (terminal)
3. Wpisz poniższe polecenie i naciśnij Enter:

```
node --version
```

Jeśli zobaczysz coś w stylu `v20.0.0` lub wyżej — masz Node.js i możesz przejść do następnego kroku.

Jeśli zobaczysz błąd `'node' is not recognized` — musisz zainstalować Node.js.

### Jak zainstalować Node.js (jeśli jeszcze nie masz)

1. Otwórz przeglądarkę i wejdź na: **https://nodejs.org**
2. Kliknij duży zielony przycisk z napisem **"LTS"** (np. "22.x.x LTS")
   - LTS = Long Term Support = stabilna wersja, zalecana dla nowych użytkowników
3. Pobierz plik instalatora (`.msi` na Windows)
4. Uruchom pobrany plik i klikaj "Next" na każdym ekranie — domyślne ustawienia są prawidłowe
5. Po instalacji **uruchom ponownie komputer**
6. Sprawdź instalację wpisując `node --version` w terminalu — powinno wyświetlić numer wersji

---

## Krok 1 — Otwórz folder projektu w terminalu

Terminal to czarne okno, w którym wydajesz polecenia tekstowe. Nie musisz się go bać — używamy tylko kilku prostych komend.

**Sposób A — przez Eksplorator Windows (najłatwiejszy):**

1. Otwórz Eksplorator Windows (skrót: `Windows + E`)
2. Przejdź do folderu z projektem: `C:\Users\doria\Documents\CoachFI`
3. Kliknij pasek adresu na górze (gdzie widać ścieżkę folderu)
4. Zaznacz cały tekst i wpisz `cmd`, naciśnij Enter
5. Otworzy się terminal **już ustawiony na właściwy folder**

**Sposób B — przez menu Start:**

1. Kliknij przycisk Start (ikona Windows)
2. Wpisz `cmd` lub `PowerShell`
3. Kliknij "Uruchom jako administrator"
4. W terminalu wpisz:

```
cd C:\Users\doria\Documents\CoachFI
```

i naciśnij Enter. To polecenie "wchodzi" do folderu projektu.

> **Co to jest `cd`?** Skrót od "change directory" — zmiana folderu. Tak jak klikanie po folderach w Eksploratorze, tylko tekstowo.

---

## Krok 2 — Zainstaluj zależności (tylko za pierwszym razem)

Coach FI korzysta z kilkudziesięciu gotowych bibliotek (np. do animacji, wykresów, integracji z Solana). Są one opisane w pliku `package.json`. Żeby je pobrać na Twój komputer, wpisz:

```
npm install
```

i naciśnij Enter.

**Co się stanie:**
- npm połączy się z internetem i pobierze wszystkie potrzebne pliki
- Zostanie stworzony folder `node_modules` z bibliotekami
- Zobaczysz postęp w terminalu, np.: `added 847 packages in 30s`

> **Ważne:** To polecenie uruchamiasz **tylko raz** przy pierwszym uruchomieniu, albo jeśli ktoś dodał nową bibliotekę do projektu. Potem nie musisz tego robić przy każdym uruchomieniu.

> **Jeśli pojawią się ostrzeżenia (warnings)** — to normalne, nie musisz się nimi przejmować. Błędy (errors) wymagają działania, ostrzeżenia — nie.

---

## Krok 3 — Uruchom aplikację

Wpisz:

```
npm run dev
```

i naciśnij Enter.

**Co się stanie:**
- Next.js (framework, na którym zbudowany jest Coach FI) skompiluje aplikację
- Zobaczysz taki komunikat:

```
▲ Next.js 15.x.x
- Local:   http://localhost:3000
- Network: http://192.168.x.x:3000

✓ Ready in 2.1s
```

To znaczy, że aplikacja działa. Terminal musi pozostać otwarty — zamknięcie go zatrzyma serwer.

---

## Krok 4 — Otwórz aplikację w przeglądarce

Otwórz dowolną przeglądarkę (Chrome, Firefox, Edge) i wpisz w pasku adresu:

```
http://localhost:3000
```

i naciśnij Enter.

Powinieneś zobaczyć stronę główną Coach FI.

> **Co to jest `localhost`?** To specjalny adres, który zawsze oznacza "Twój własny komputer". Port `:3000` to numer "drzwi", przez które serwer nasłuchuje. Aplikacja działa tylko na Twoim komputerze — nikt z zewnątrz jej nie widzi.

---

## Podpinanie API zewnetrznych

Coach FI dziala bez kluczy API, ale wtedy uzywa fallbackow. Zeby wlaczyc realna Mile,
glos ElevenLabs, ranking Supabase i mint NFT:

1. Skopiuj `.env.example` do `.env.local`
2. Wklej realne klucze do `.env.local`
3. Uruchom:

```
npm run api:check
```

Szczegoly sa w pliku:

```
docs\API_SETUP.md
```

Nie wklejaj zawartosci `.env.local` do chatu ani publicznego repozytorium.

---

## Sposób błyskawiczny — dubbelklik

W folderze projektu jest gotowy plik `START_COACHFI.cmd`. Wystarczy na niego **dwukrotnie kliknąć** — automatycznie otworzy terminal i uruchomi serwer.

> Jeśli pojawi się błąd "Nie udało się uruchomić" — prawdopodobnie nie masz zainstalowanych zależności. Uruchom najpierw `npm install` (Krok 2).

---

## PowerShell i aliasy — praca jak profesjonalista

Jeśli będziesz często wracać do projektu, warto ustawić skróty (tzw. aliasy), żeby zamiast wpisywać długie komendy — wystarczyło wpisać dwie litery.

### Co to jest PowerShell?

PowerShell to nowocześniejszy terminal Windows — ma więcej możliwości niż stary `cmd`. Możesz go otworzyć wpisując **PowerShell** w menu Start.

### Co to jest alias / funkcja w PowerShell?

Alias to skrót do dłuższej komendy. Zamiast wpisywać za każdym razem:

```powershell
cd C:\Users\doria\Documents\CoachFI
npm run dev
```

możesz wpisać po prostu:

```powershell
fi
```

### Co to jest profil PowerShell?

Profil to plik, który PowerShell wczytuje automatycznie przy każdym otwarciu. To jak lista ustawień startowych — wszystkie funkcje i aliasy zdefiniowane w profilu są zawsze dostępne.

Profil Coach FI znajduje się tutaj:

```
C:\Users\doria\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1
```

### Dostępne skróty (już skonfigurowane)

Poniższe komendy działają od razu po otwarciu PowerShell:

| Komenda | Co robi |
|---|---|
| `fi` | Przechodzi do folderu projektu i uruchamia serwer dev (`npm run dev`) |
| `fi-start` | Uruchamia serwer i **automatycznie otwiera przeglądarkę** po 3 sekundach |
| `fi-open` | Otwiera `http://localhost:3000` w domyślnej przeglądarce |
| `fi-install` | Przechodzi do projektu i uruchamia `npm install` |
| `fi-build` | Buduje wersję produkcyjną (`npm run build`) |
| `fi-check` | Sprawdza typy TypeScript bez budowania |
| `fi-cd` | Tylko przechodzi do folderu projektu (bez uruchamiania serwera) |
| `coachfi` | Otwiera cały projekt w VS Code |
| `fi-help` | Wyświetla listę wszystkich dostępnych skrótów |

### Jak używać

1. Otwórz **PowerShell** (nie `cmd`)
2. Wpisz `fi-help` i naciśnij Enter — zobaczysz listę skrótów
3. Wpisz `fi` i naciśnij Enter — aplikacja uruchomi się automatycznie

Przykładowe sesje pracy:

**Szybkie uruchomienie z przeglądarką:**
```powershell
fi-start
```
(serwer startuje + przeglądarka otwiera się sama po 3 sekundach)

**Standardowe uruchomienie:**
```powershell
fi
```
(potem ręcznie otwierasz `http://localhost:3000`)

**Pierwsza instalacja na nowym komputerze:**
```powershell
fi-install
fi
```

**Sprawdzenie czy kod jest poprawny bez uruchamiania:**
```powershell
fi-check
```

### Jak dodać własny alias (dla zaawansowanych)

Jeśli chcesz dodać własny skrót, otwórz plik profilu w VS Code:

```powershell
code $PROFILE
```

i dodaj na końcu pliku swoją funkcję według wzoru:

```powershell
function moja-komenda {
    Set-Location "C:\Users\doria\Documents\CoachFI"
    # tutaj wpisz co ma się wykonać
    npm run dev
}
```

Po zapisaniu pliku wczytaj zmiany bez restartowania PowerShell:

```powershell
. $PROFILE
```

(kropka + spacja + `$PROFILE`)

> **Dlaczego funkcja, a nie alias?** W PowerShell `Set-Alias` pozwala tylko na zastępowanie jednej komendy inną. Jeśli chcesz wykonać kilka komend po kolei (np. `cd` + `npm run dev`), musisz użyć funkcji. To właśnie robią wszystkie `fi-*` skróty w tym projekcie.

### Jak sprawdzić wszystkie wbudowane aliasy PowerShell

PowerShell ma dziesiątki wbudowanych skrótów. Żeby je wyświetlić:

```powershell
Get-Alias
```

Przykłady wbudowanych aliasów przydatnych przy pracy z projektem:

| Alias | Pełna komenda | Zastosowanie |
|---|---|---|
| `ls` | `Get-ChildItem` | Wylistuj pliki w folderze |
| `cd` | `Set-Location` | Przejdź do folderu |
| `cat` | `Get-Content` | Wyświetl zawartość pliku |
| `pwd` | `Get-Location` | Pokaż bieżący folder |
| `cls` | `Clear-Host` | Wyczyść ekran terminala |
| `rm` | `Remove-Item` | Usuń plik |
| `cp` | `Copy-Item` | Skopiuj plik |

---

## Co testować po uruchomieniu

Aplikacja ma 10 ekranów dostępnych w menu po lewej stronie (na komputerze) lub na dole (na telefonie):

| Ekran | Adres | Co sprawdzić |
|---|---|---|
| **Strona główna** | `/` | Tryby: Dorosły, Dzieci, Dostępność |
| **Diagnoza finansowa** | `/health-check` | Wypełnij formularz → kliknij "Calculate my score" → pojawi się wynik i przycisk "Udostępnij wynik" |
| **Inflacja** | `/inflation` | Przesuń suwak lat i obserwuj wykres |
| **Ścieżka nauki** | `/learn` | Kliknij etap i przeczytaj lekcję |
| **AI Coach** | `/coach` | Napisz dowolne pytanie np. "Co to jest inflacja?" |
| **Quiz** | `/quiz` | Odpowiedz na pytanie, zdobądź tokeny |
| **Nagrody** | `/rewards` | Kliknij "Mint Certificate" i obserwuj animację |
| **Dla dzieci** | `/kids` | Kliknij moduły, zbieraj gwiazdki |
| **Dostępność** | `/accessibility` | Sprawdź opcje kontrastu i dużego tekstu |
| **Partner** | `/partner` | Dashboard B2B |

### Funkcje, które warto przetestować osobno

**Zmiana języka:**
- Kliknij ikonę globusa w prawym górnym rogu
- Aplikacja obsługuje: English 🇬🇧 / Polski 🇵🇱 / Español 🇪🇸

**Streak (seria dni nauki):**
- Badge z ogniem 🔥 w nagłówku — pokazuje liczbę dni z rzędu, w których byłeś aktywny
- Rośnie za każdym razem, gdy odpiszesz na quiz lub wypełnisz diagnozę

**Powiadomienia push:**
- Po kilku sekundach pojawi się baner z pytaniem o zgodę na powiadomienia
- Kliknij "Enable" — po 30 sekundach przyjdzie testowe powiadomienie o quizie

**Udostępnij wynik:**
- Wejdź na `/health-check`, wypełnij formularz i kliknij "Calculate my score"
- Pojawi się przycisk "Udostępnij wynik" — kliknij go, by zobaczyć kartę z wynikiem
- Przycisk "Share" używa natywnego menu udostępniania systemu (lub kopiuje tekst do schowka)

---

## Zatrzymanie aplikacji

Żeby zatrzymać serwer, kliknij w okno terminala i naciśnij:

```
Ctrl + C
```

Terminal zapyta `Terminate batch job (Y/N)?` — wpisz `Y` i Enter.

Aplikacja przestanie działać. Żeby uruchomić ponownie — wróć do Kroku 3.

---

## Rozwiązywanie problemów

### "npm: command not found" lub "npm is not recognized"

Node.js nie jest zainstalowany lub nie jest dodany do PATH. Zainstaluj Node.js ze strony **nodejs.org** i uruchom ponownie komputer.

### "Port 3000 is already in use"

Coś innego już używa portu 3000 (prawdopodobnie poprzednia instancja serwera). Uruchom:

```
npx kill-port 3000
```

A potem znów `npm run dev`.

### Strona pokazuje błąd 404

Sprawdź, czy terminal nadal działa (okno jest otwarte i nie pokazuje błędu). Jeśli zamknąłeś terminal, uruchom serwer ponownie.

### Zmiany w kodzie nie są widoczne

Serwer dev automatycznie odświeża stronę po każdej zmianie w plikach. Jeśli coś nie działa — odśwież przeglądarkę ręcznie (`Ctrl + R` lub `F5`).

### "Module not found" lub podobne błędy kompilacji

Prawdopodobnie brakuje zależności. Uruchom:

```
npm install
```

i poczekaj aż się zakończy, potem znów `npm run dev`.

---

## Słowniczek pojęć

| Termin | Znaczenie |
|---|---|
| **Terminal / wiersz poleceń** | Czarne okno do wpisywania tekstowych komend |
| **PowerShell** | Nowocześniejszy terminal Windows z obsługą skryptów i funkcji |
| **Node.js** | Środowisko uruchomieniowe JavaScript na komputerze (jak silnik samochodu) |
| **npm** | Menedżer paczek — pobiera i zarządza bibliotekami |
| **localhost** | Twój własny komputer — adres używany przez lokalnie działające serwery |
| **Port** | Numer "drzwi" serwera, np. `:3000` |
| **Dev server** | Serwer uruchomiony lokalnie do testowania podczas tworzenia aplikacji |
| **Kompilacja / build** | Przekształcenie kodu źródłowego w wersję gotową do działania |
| **node_modules** | Folder z pobranymi bibliotekami — nie edytuj go ręcznie |
| **package.json** | Plik z listą zależności i skryptami projektu |
| **Alias** | Skrót tekstowy zastępujący dłuższą komendę |
| **Funkcja PowerShell** | Blok kodu z własną nazwą — może wykonywać wiele komend po kolei |
| **Profil PowerShell** | Plik wczytywany automatycznie przy starcie — zawiera Twoje aliasy i ustawienia |
| **`$PROFILE`** | Wbudowana zmienna PowerShell wskazująca na ścieżkę pliku profilu |
| **`. $PROFILE`** | Komenda przeładowania profilu bez zamykania terminala |

---

*Coach FI v0.2.0 · Solana Colosseum Frontier Hackathon 2026*
