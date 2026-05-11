Stwórz mi kompletny, interaktywny prototyp aplikacji CoachFI jako jeden plik HTML (wszystko inline — CSS i JS w środku, zero zewnętrznych zależności).

Prototyp ma pokazywać 4 główne ekrany aplikacji z nawigacją między nimi. Styl: premium dark fintech + Web3. Ma wyglądać jak gotowy produkt, nie szkic.

════════════════════════════════════════════
SYSTEM DESIGNU
════════════════════════════════════════════

Kolory:
  --bg:          #0D0D14   (tło aplikacji)
  --surface:     #13131F   (karty, panele)
  --surface-2:   #1A1A2E   (zagnieżdżone elementy)
  --border:      rgba(118,104,232,0.15)
  --primary:     #7668E8   (fiolet — główny kolor marki)
  --primary-dim: rgba(118,104,232,0.12)
  --solana:      #14F195   (zielony — TYLKO dla NFT/blockchain)
  --text:        #F0F2FF   (główny tekst)
  --muted:       #6B7494   (drugorzędny tekst)
  --success:     #10B981

Font: system-ui, -apple-system, sans-serif
Nagłówki: font-weight 900, letter-spacing -0.02em
Ciało: font-weight 500

Efekty:
  Karty: border: 1px solid var(--border), background: var(--surface)
  Glow primary: box-shadow: 0 0 40px rgba(118,104,232,0.25)
  Glow solana:  box-shadow: 0 0 30px rgba(20,241,149,0.20)
  Hover kart:   transform: translateY(-2px), glow wzmocniony
  Przejścia:    all 250ms cubic-bezier(0.4,0,0.2,1)
  Border-radius kart: 20px, przycisków: 12px

Nawigacja dolna (mobile-first):
  Fixed bottom bar, background: rgba(13,13,20,0.95), backdrop-blur: 20px
  5 ikon z etykietami, aktywna ikona świeci --primary z małym glow

════════════════════════════════════════════
EKRAN 1 — DASHBOARD (Home)
════════════════════════════════════════════

HEADER (sticky top):
  Lewo: logo "CoachFI" (bold, white) + tagline "Financial Coach AI" (muted, 11px)
  Prawo: awatar użytkownika (okrąg gradientowy fiolet→niebieski, inicjały "DZ")

HERO KARTA (pełna szerokość, gradient od #1a1535 do #0D0D14):
  Górna część:
    "Your Financial" (muted, 14px, uppercase, tracking widest)
    "Health Score" (white, 38px, font-weight 900)
  
  Centrum: wielki okrągły wskaźnik (SVG circle progress):
    Zewnętrzny pierścień: rgba(118,104,232,0.15)
    Wypełnienie: gradient fiolet #7668E8 → #9B8FF0
    Środek (białe kółko wewnętrzne):
      "72" (56px, font-weight 900, kolor #7668E8)
      "/ 100" (16px, muted)
    Pod kółkiem: "+5 this week" (zielony, bold, 13px)
  
  Dolna część hero karty, 3 mini-statsy obok siebie:
    [Saving 67%] [Investing 40%] [Credit 80%]
    Każdy: mała liczba fioletowa (22px bold), etykieta muted (10px)

SEKCJA "Quick Actions" (tytuł 12px uppercase muted):
  Grid 2x2, każda akcja to karta:
  
  [🤖 Ask Mila]              [🩺 Health Check]
  Talk to your AI coach      Check your finances
  → gradient fioletowe tło   → ciemne tło
  
  [📚 Learn]                 [🏆 Rewards & NFT]
  8-stage learning path      Mint on Solana
  → ciemne tło               → lekki zielony akcent na "NFT"

SEKCJA "Today's Challenge":
  Karta z żółtym/amber akcentem na lewym borderze
  Tytuł: "Daily Challenge 🔥" + "Streak: 12 days" po prawej (mały badge)
  Pytanie: "What is compound interest?"
  Przycisk: "Answer Now →" (fioletowy, full-width)

════════════════════════════════════════════
EKRAN 2 — AI COACH (Chat z Milą)
════════════════════════════════════════════

HEADER:
  Lewo: strzałka wstecz + "Mila" (bold white)
  Centrum: zielona kropka "Online" (10px)
  Prawo: ikona głośnika (Volume2 — ElevenLabs)

AVATAR MILI (centrum, pod headerem):
  Duży okrąg (80px) gradient fiolet→indigo z literą "M"
  Pod spodem: "Mila · Financial Coach" (biały bold + muted)
  Fala głosowa (3 animowane paski CSS) sugerująca głos

HISTORIA CZATU (scrollable):
  Wiadomość od Mili (lewa strona):
    Bąbelek: background var(--surface-2), border fioletowy
    Tekst: "Hello! I'm Mila, your AI financial coach powered by Claude.
           Ask me anything about personal finance, saving, investing,
           or building better money habits."
    Pod spodem: mała ikona głośnika "Read aloud · ElevenLabs"

  Wiadomość użytkownika (prawa strona):
    Bąbelek: background var(--primary-dim), border fioletowy mocniejszy
    Tekst: "What is compound interest and why does it matter?"

  Wiadomość od Mili (lewa, dłuższa):
    "Compound interest is earning interest on your interest.
     Example: $1,000 at 7% yearly → $1,967 after 10 years.
     Without it, you'd have only $1,700. That $267 difference
     is compound interest working for you. 🚀"
    Pod spodem: ikona głośnika + znacznik czasu "just now"

INPUT BAR (fixed bottom, nad nav):
  Pole tekstowe: "Ask Mila anything..."
  Prawa strona: przycisk Send (okrągły, fioletowy, ikona strzałki)

════════════════════════════════════════════
EKRAN 3 — REWARDS & NFT
════════════════════════════════════════════

HEADER: "Rewards & Certificates"

TOKEN BALANCE karta (gradient fioletowy, pełna szerokość):
  Lewa: ikona monety (złota)
       "Token Balance" (muted 12px)
       "1,250 CFI" (32px, font-weight 900, biały)
  Prawa: progress bar do kolejnego certyfikatu
         "750 CFI to next certificate"

SEKCJA "Your Certificates" (tytuł + "3 earned"):
  
  KARTA 1 — ZAMINTOWANA (zielony akcent #14F195):
    Header karty: gradient ciemny-fioletowy z efektem glow
    Badge "On-chain" w prawym górnym rogu (zielony, Solana logo SVG)
    Ikona tarcza (duża, gradient fiolet-zielony)
    "Certificate of Achievement"
    "SAVING HABIT MASTER" (bold, white, 18px)
    Separator z "FI" w kółku
    Status badge: zielony "✓ Minted on Solana"
    Link: "View on Explorer ↗" (zielony, mały)
  
  KARTA 2 — GOTOWA DO MINT (fioletowy akcent):
    Header: gradient fioletowy
    Ikona book
    "FINANCIAL LITERACY BASICS"
    Status badge: amber "Ready to Mint"
    Przycisk: "Mint NFT →" (gradient fiolet→zielony, bold)
  
  KARTA 3 — ZABLOKOWANA (szara):
    Ikona kłódka
    "INVESTMENT FUNDAMENTALS"
    "Complete Stage 5 to unlock"
    Progress bar: 60% (fioletowy)

SOLANA WALLET sekcja:
  Karta z delikatnym zielonym border
  Lewo: Solana logo (SVG, zielony) + "Devnet Wallet"
  Prawo: przycisk "Connect" (outline, zielony)

════════════════════════════════════════════
EKRAN 4 — LEARNING PATH
════════════════════════════════════════════

HEADER: "Learning Path" + "8 Stages" badge (fioletowy)

PROGRESS OVERVIEW (karta):
  "Your Progress: Stage 3 of 8"
  Duży progress bar fioletowy: 37.5%
  Pod spodem: "1,250 CFI earned · 3 certificates"

LISTA ETAPÓW (pionowa, scrollable):

  Etap 1 ✓ COMPLETED:
    Lewa: okrąg z numerem "1" (fioletowy pełny) + ✓
    Środek: "Money Mindset" (bold) + "Completed" (zielony mały)
    Prawa: "200 CFI" (złoty badge)
    Pionowa linia łącząca etapy (fioletowa, pełna)

  Etap 2 ✓ COMPLETED:
    "Budgeting Basics" + "Completed"
    Linia fioletowa pełna

  Etap 3 → IN PROGRESS (podświetlony):
    Karta ma fioletowy border + delikatne tło primary-dim
    "Emergency Fund" + "In Progress" (amber)
    Progress bar wewnętrzny: 60%
    Przycisk "Continue →" (fioletowy)
    Linia fioletowa przerywana poniżej

  Etap 4 🔒 LOCKED:
    Okrąg szary z ikoną 🔒
    "Debt Elimination" (muted)
    Linia szara przerywana

  Etap 5–8 (zwinięte, szare, z ikonami kłódki):
    "Investing · Wealth Building · DeFi · Family Finance"
    Pokazane jako małe kapsułki w rzędzie, szare

════════════════════════════════════════════
NAWIGACJA DOLNA (wszystkie ekrany)
════════════════════════════════════════════

Fixed bottom, 5 pozycji:
  🏠 Home     💬 Coach     📚 Learn     🏆 Rewards     👤 Avatar

Aktywna zakładka: ikona i tekst w kolorze --primary, delikatny glow pod ikoną
Nieaktywna: kolor --muted

════════════════════════════════════════════
WYMAGANIA TECHNICZNE
════════════════════════════════════════════

- Jeden plik HTML, zero zewnętrznych zależności (nawet brak Google Fonts — używaj system-ui)
- Nawigacja dolna przełącza między 4 ekranami (JS: show/hide sekcji)
- Animacje CSS: karty fade-in przy przełączeniu, progress bar fill przy pierwszym pokazaniu
- Pełna responsywność: max-width 430px (iPhone 14 Pro), wycentrowane na desktop
- Scrollowanie wewnątrz każdego ekranu (overflow-y: auto na kontenerze ekranu)
- Ekran czatu: input bar i nawigacja fixed, historia czatu scrollowalna
- Solana SVG logo wbudowane inline (trzy romby w kolorze #14F195)
- Nie używaj żadnych emoji jako głównych ikon UI — zastąp prostymi SVG lub unicode shapes
- Animacja pulse na awatarze Mili w ekranie Coach (sugeruje aktywność głosową)
- Header sticky na każdym ekranie
