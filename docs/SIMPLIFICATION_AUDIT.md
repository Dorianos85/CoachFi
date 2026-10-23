# Audyt uproszczenia CoachFI — v1

Data: 2026-08-13
Perspektywa: nowy użytkownik + dziecko, cel: szybkie wypuszczenie do testerów, "less is more".

Metoda: pełna inwentaryzacja `app/` (21 tras), `AppNavigation.tsx`, systemów trybów, gamifikacji,
warstwy głosowej/AI i istniejącej dokumentacji produktowej. Fakty poniżej pochodzą z realnego
przeglądu kodu, nie z założeń.

---

## 0. Najważniejsze odkrycie: rozwiązanie już istnieje, tylko nie zostało wdrożone

`docs/PRODUCT_ARCHITECTURE.md` i `docs/DISTRIBUTION_ROLLOUT.md` **już definiują** dokładnie to, o co
prosisz — i nikt tego nie wdrożył w kodzie:

> „The user should see 5 core destinations first: Start, Health Check, Daily Challenge, Family Plan,
> Mila/Rewards. Secondary destinations stay available but are not the main product loop."
> — `PRODUCT_ARCHITECTURE.md`

> „Keep main navigation small: Start, Diagnosis, Daily, Plan, Kids, Mila/Rewards. Move everything
> else to secondary navigation." „Do not promote Partner Portal in consumer nav."
> — `DISTRIBUTION_ROLLOUT.md`

Tymczasem `components/AppNavigation.tsx` pokazuje **16 pozycji w 4 zawsze-widocznych grupach**
(sidebar), bez podziału na primary/secondary — wszystkie grupy są w tym samym miejscu, różni je
tylko domyślny stan rozwinięcia. To nie jest brak pomysłu na uproszczenie — to jest dług wdrożeniowy.
**Najszybszy, najniższego ryzyka krok to po prostu zrobić to, co własna dokumentacja projektu już
nakazuje.**

---

## 1. Diagnoza „less is more" — gdzie appka jest przeciążona

### Strona główna (`/`, 820 linii)
3 równorzędne CTA na starcie (Health Check / Learn / Voice Demo) + ~9 sekcji + ~15 elementów
interaktywnych na pierwszym ekranie. Nowy użytkownik nie ma jednej jasnej następnej akcji.

### Ścieżka do pierwszej wartości jest długa
`/health-check`: formularz **10 pól** → **gate logowania** (email + 2 checkboxy zgód) → dopiero
wtedy wynik. Dla testera, który chce w 60 sekund zobaczyć „o co chodzi", to za dużo tarcia przed
„aha moment".

### Pięć równoległych walut nagród, które się nie komunikują
Tokeny (`lib/tokens.ts`), streak (`lib/streak.ts`), gwiazdki w Kids Mode, wynik/XP na dashboardzie,
NFT certyfikaty, badge achievement, leaderboard — każde ma **osobny klucz w localStorage i osobną
stronę**, działają obok siebie, nie jedna spójna pętla. Dla dziecka to jest nieczytelne: „czy zbieram
gwiazdki, tokeny, czy punkty? co jest ważne?"

### Trzy nakładające się systemy trybów
1. `ModeContext` (adult / kids, z wymogiem zgody rodzica),
2. `AccessibilityToggle` (kontrast, skala tekstu) — stan lokalny, niezależny od (1),
3. osobna strona `/accessibility` (voice-first, numerologia) — częściowo duplikuje (2).

Dodatkowo `mode === "kids"` i `isKidsMode` (zależne od zgody rodzica) to dwa różne warunki — można
wybrać tryb kids bez zgody rodzica i trafić na drugi ekran-gate wewnątrz `/kids`. To podwójna bramka
tam, gdzie powinna być jedna.

### Funkcje o wątpliwej wadze dla pierwszej fali testerów
- **Partner Portal** w głównej nawigacji konsumenckiej — własna dokumentacja mówi wprost, żeby tego
  nie robić.
- **`components/CoachAvatar.tsx`** — nieużywany nigdzie w `app/` (martwy kod, kandydat do usunięcia).
- **`/voice-demo`** — nie jest w sidebarze, ale na stronie głównej stała jako trzeci równorzędny
  przycisk hero obok Diagnozy i Nauki (sprostowanie: pierwotnie błędnie nazwane „pozycją nawigacji" —
  to był przycisk hero, nie link w `AppNavigation`; sedno problemu to samo: rozprasza od jednego CTA).
- 5 komponentów/hooków głosowo-avatarowych (`MilaVoiceAgent`, `MilaAvatar`, `CoachAvatar`,
  `VoiceButton`, `useSpeechInput`) — częściowa redundancja.

### Onboarding nie tłumaczy pętli gry
`OnboardingModal` to 2 kroki: imię + cel. Nie wyjaśnia tokenów, streaka, certyfikatów, gwiazdek —
użytkownik trafia potem na 16-pozycyjną nawigację bez żadnego wprowadzenia.

---

## 2. Perspektywa dziecka — konkretne tarcia

- Kids Mode wymaga zgody rodzica (checkbox + imię) **zanim** dziecko cokolwiek zobaczy — słusznie,
  ale sam ekran zgody jest tekstowy i „dorosły" w tonie (`ModeGate` ma te same komponenty dla obu
  trybów, różni się tylko treść).
- W Kids Mode nawigacja słusznie redukuje się do jednej pozycji — to jest dobry, już wdrożony
  przykład „less is more". Problem zaczyna się wcześniej: **wybór trybu (adult/kids/accessibility)
  to already 3 osobne decyzje/ekrany zanim dziecko zobaczy właściwą treść**.
- Gwiazdki (Kids) vs tokeny (Adult) to psychologicznie ta sama mechanika pod dwiema nazwami —
  dziecko, które kiedyś zobaczy tryb dorosłego (np. na wspólnym urządzeniu rodzinnym), zobaczy inny
  system nagród niż to, do czego przywykło.

---

## 3. Rozstrzygnięte: hackathon się skończył, priorytet to zwykli użytkownicy

W repo widać ślady hackathonu Colosseum/Solana (wallet adapter, mock mint NFT, badge „Hackathon MVP"
w stopce, `PITCH_DECK.md`). **Potwierdzone przez Ciebie: hackathon jest zakończony, appka jest teraz
budowana dla normalnych użytkowników.** Oznacza to, że nie trzeba już utrzymywać widoczności
Solana/NFT/Vault na poziomie „dla jury" — te elementy mogą (i powinny) zejść do sekcji drugorzędnej,
tak jak każda inna niszowa funkcja, oceniana wyłącznie pod kątem wartości dla testera-człowieka, nie
wymogów konkursu.

---

## 4. Rekomendacje

### USUŃ (niskie ryzyko, zero utraty wartości)
- `components/CoachAvatar.tsx` — martwy kod, nieużywany.
- `/voice-demo` z głównej nawigacji (zostaw trasę dla linków marketingowych/demo, tylko nie w navie
  dla użytkownika).

### PRZENIEŚ z primary do secondary nav (dokładnie wg już istniejącej dokumentacji projektu)
Primary (5-6 pozycji): **Start, Health Check (Diagnoza), Daily Challenge, Coach Mila, Rewards, Kids
(toggle)**.
Secondary („Więcej"/collapsed): Learn, Review, Cards, Inflation, Shopping, Vault, Accessibility,
Crisis, Partner.
- **Partner Portal**: usuń z nawigacji konsumenckiej całkowicie (dostępny tylko przez bezpośredni
  link dla B2B, zgodnie z `DISTRIBUTION_ROLLOUT.md`).
- **Crisis**: pokazuj kontekstowo (link z wyniku health-check przy niskim score), nie jako stały
  punkt nawigacji — appka finansowa z widocznym „Kryzys" w menu głównym robi złe pierwsze wrażenie.

### UPROŚĆ
1. **Jedna waluta nagród jako kręgosłup.** Tokeny = główna waluta wszędzie (w tym Kids Mode, tylko
   inna „skórka" wizualna — np. gwiazdka zamiast monety, ta sama liczba pod spodem). Streak =
   wspomagający badge przy tokenach, nie osobna waluta. NFT/certyfikaty = kamienie milowe
   *odblokowywane* progami tokenów, a nie równoległy, niepowiązany system.
2. **Health-check: pokaż smak wyniku przed loginem.** Skróć formularz do 4-5 kluczowych pytań na
   start, pokaż wstępny/uproszczony wynik od razu, dopiero pogłębiony plan rodzinny chowaj za
   loginem. Skraca czas do „aha moment" dla testera z minut do sekund.
3. **Jedna bramka wyboru trybu zamiast trzech.** Połącz pierwsze pytanie w jedno: „Kto korzysta z
   apki?" → Dorosły / Dziecko (+ zgoda rodzica) / Chcę większy tekst i sterowanie głosem — zamiast
   ModeGate + AccessibilityToggle + osobnej strony `/accessibility` jako trzech niezależnych decyzji.
4. **Strona główna: jedno CTA nad zgięciem ekranu.** Zależne od stanu: nowy użytkownik →
   „Rozpocznij diagnozę", wracający użytkownik → „Wróć do Mili" / „Utrzymaj streak". Reszta sekcji
   niżej, nie trzy równorzędne przyciski na starcie.

### PRZEŁÓŻ na później (nie teraz, nie dla pierwszej fali testerów)
- `/avatar` (personalizacja postaci/głosu) — miłe, nie krytyczne dla oceny „czy appka działa i ma
  sens".
- Rozbudowa `/partner` — panel B2B nie jest tym, co testerzy-użytkownicy powinni oceniać w v1.

### DODAJ (małe, wysoka dźwignia — nie scope creep)
- Krótki „product tour" (3-4 tooltips) po onboardingu, tłumaczący pętlę: „tu widzisz swoje tokeny →
  tu robisz codzienne wyzwanie → tu rozmawiasz z Milą → tu odblokowujesz certyfikat".
- Spójny, zawsze widoczny HUD (token balance + streak) w jednym miejscu w headerze — częściowo już
  istnieje, dociągnąć do 100% spójności między trybami.

---

## 5. Propozycja: agenci AI w/dla aplikacji

Rozdzielam na **agentów produktowych** (dla użytkownika, w aplikacji) i **agentów procesowych**
(dla Ciebie, żeby szybciej i bezpieczniej wypuszczać zmiany).

### 5a. Agenci produktowi — rozbicie Mili na wyspecjalizowane persony

Dziś jest jeden monolityczny `MilaVoiceAgent` + jeden `/api/chat`. Propozycja: ta sama infrastruktura
(ElevenLabs agent + Claude), ale **kontekstowe persony** przełączane automatycznie w zależności od
tego, gdzie w appce jest użytkownik — mniej pracy inżynierskiej niż osobne agenty, dużo większy efekt
„appka rozumie kontekst".

| Agent / persona | Kiedy aktywny | Ton | Zakres / narzędzia | Twarde ograniczenia |
|---|---|---|---|---|
| **Mila (Coach)** — istnieje | Domyślny, `/coach`, FAB globalny | Ciepły, wspierający | Nawigacja po appce (`navigateToCoachFIPage`), ogólne wyjaśnienia | Bez porad inwestycyjnych, bez realnych transakcji |
| **Detektyw Finansowy** | W trakcie `/health-check` | Konkretny, pytający, krok po kroku | Doprecyzowujące pytania do formularza, tłumaczenie wyniku prostym językiem | Nie odpowiada na pytania spoza diagnozy — przekazuje do Coach Mila |
| **Miłka (Kids)** | Cały `/kids` + Kids Mode globalnie | Bajkowy, krótkie zdania, dużo pochwał | Tłumaczenie pojęć przez historyjki/metafory | Zero żargonu finansowego, zero krypto/inwestycji, zero wzmianek o pieniądzach realnych — transkrypt zawsze widoczny dla rodzica |
| **Agent Nawyku** (lekki, w tle) | Trigger: streak zagrożony / milestone osiągnięty | Krótko, pozytywnie wzmacniająco | Jedno zdanie + CTA, może być regułowy (bez LLM) dla taniości i szybkości | Nigdy nie naciska, max 1 komunikat/dzień, nigdy nie sprzedaje tokenów/NFT |
| **Agent Wsparcia (Crisis)** | Tylko gdy score bardzo niski lub użytkownik prosi o pomoc | Spokojny, rzeczowy, bez gamifikacji | Priorytet: linki do konkretnych zasobów pomocy | Zero grywalizacji/nagród w tym kontekście — to nie miejsce na tokeny |

Kluczowa właściwość wspólna dla wszystkich: **każdy agent zna tylko swój zakres i jawnie przekazuje
(„handoff") do Coach Mila, gdy pytanie wykracza poza jego rolę** — to zapobiega temu, żeby Miłka
zaczęła tłumaczyć dziecku WIBOR, albo żeby Agent Kryzysowy proponował zbieranie tokenów.

### 5b. Agenci procesowi — żeby szybciej i bezpieczniej wypuszczać do testerów

- **Agent QA pre-release**: automatyczne przejście przez `docs/LAUNCH_QA_CHECKLIST.md` (Playwright)
  przed każdym pushem do testerów — dziś checklist jest ręczna (93 linie do odhaczenia przez
  człowieka).
- **Agent spójności i18n**: porównuje `lib/i18n/pl.ts` / `en.ts` / `es.ts` pod kątem brakujących
  kluczy i (dla Kids Mode) poziomu trudności języka — dziś część tekstów zgód w `health-check/page.tsx`
  jest hardkodowana inline zamiast przez i18n, co łatwo rozjeżdża się między językami.

---

## 6. Plan fazowy do najszybszego wypuszczenia testerom

**Faza 0 — ✅ wdrożona 2026-08-13**
1. ✅ Sidebar: 4 grupy (16 pozycji) → 2 grupy — **Start** (6, zawsze rozwinięte: home, healthCheck,
   challenge, coach, rewards, kids) + **Więcej** (8, jedna zbiorcza sekcja zwinięta domyślnie: quiz,
   learn, review, cards, inflation, shopping, vault, accessibility).
2. ✅ **Partner Portal** usunięty z sidebara konsumenckiego całkowicie (dostępny tylko przez
   bezpośredni URL `/partner`, zgodnie z `DISTRIBUTION_ROLLOUT.md`).
3. ✅ Usunięty martwy komponent `components/CoachAvatar.tsx`.
4. ✅ Home: hero ma teraz jedno CTA zależne od stanu — brak diagnozy → „Zrób darmową diagnozę"
   (+ mały link do trialu Mili obok); po diagnozie → „Zapytaj Milę" (+ mały link „Zobacz plan").
   Trzy równorzędne przyciski zniknęły.
5. ✅ `npm run typecheck`, `npm run build`, `npm run test` — zielone po zmianach.

Nieobjęte w Fazie 0 (świadomie, żeby nie zwiększać ryzyka): skrócenie formularza health-check,
połączenie bramek trybów (kids/accessibility), ujednolicenie walut nagród. To Faza 1.

**Faza 1 (uproszczenie mechanik, średnie ryzyko — dotyka localStorage/danych)**
5. Ujednolicić walutę nagród (tokeny jako kręgosłup, gwiazdki jako skórka wizualna w Kids Mode).
6. Skrócić formularz health-check + pokazać wynik przed loginem.
7. Połączyć wybór trybu (adult/kids/accessibility) w jedną bramkę.

**Faza 2 (nowe, ale małe)**
8. Product tour po onboardingu (3-4 tooltips).
9. Kontekstowe persony Mili (5a) — zacząć od Miłki (Kids) i Detektywa Finansowego (health-check),
   bo tam różnica w doświadczeniu jest największa.

---

## 7. Status decyzji

1. ~~Colosseum/hackathon widoczność~~ — **rozstrzygnięte 2026-08-13**: hackathon zakończony, appka
   jest dla normalnych użytkowników. Solana/NFT/Vault → sekcja drugorzędna, bez specjalnej ochrony.
2. Faza 0 wdrażana od razu (patrz commit/diff towarzyszący temu dokumentowi).
