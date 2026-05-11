Stwórz mi kompletną, interaktywną prezentację HTML jako jeden plik (single-file HTML z CSS i JS w środku). Prezentacja ma być gotowa do nagrania jako wideo — 2 minuty, 6 slajdów, nawigacja strzałkami lub kliknięciem.

STYL:
- Tło: #0D0D14 (bardzo ciemny, prawie czarny)
- Kolor główny: #7668E8 (elektryczny fiolet)
- Akcent: #14F195 (zielony Solana — używaj tylko dla elementów blockchain/NFT)
- Font: system-ui lub Inter, grubość 900 dla nagłówków
- Efekty: delikatny glow na liczbach, animacje fade-in dla kolejnych elementów
- Format slajdów: 16:9, fullscreen
- Każdy slajd ma w rogu mały timer pokazujący czas (Scene 1: 0:00-0:18 itd.)

---

SLAJD 1 — THE PROBLEM (0:00–0:18)

Wielka animowana liczba na środku, cyfry pojawiają się jedna po drugiej:

4,300,000,000

Pod spodem (fade in po 1 sek):
adults worldwide lack basic financial literacy.
They have smartphones. They don't have a coach.

Dół slajdu: logo CoachFI po lewej, logo Colosseum po prawej

---

SLAJD 2 — MEET MILA (0:18–0:35)

Centrum: duży tekst "Meet Mila." z pulsującą animacją (fala głosowa pod spodem — CSS animation)

Pod spodem trzy kolumny z ikonami i etykietami:

[ikona mózgu]          [ikona mikrofonu]        [ikona łańcucha]
Claude by Anthropic    ElevenLabs Voice          Solana NFT
Streams answers        Speaks every word         On-chain proof

---

SLAJD 3 — LIVE PRODUCT (0:35–1:05)

Slajd podzielony na 3 karty (grid 3 kolumny), każda karta ma ciemne tło z fioletową ramką:

KARTA 1:
[ikona czatu]
AI Coach Chat
"Ask anything → Claude streams → Mila speaks. Automatically."

KARTA 2:
[ikona serca/zdrowia]
Financial Health Check
"12 questions → Score 0–100 → Voice explanation → Shareable card"

KARTA 3:
[ikona globu]
3 Languages Live
"English · Polski · 日本語
Switch instantly. Every feature works."

---

SLAJD 4 — SOLANA NFT (1:05–1:25)

Tło: delikatny gradient od #0D0D14 do fioletu #1a1535
Centrum: duża karta certyfikatu (jak prawdziwy dyplom) z etykietami:

┌─────────────────────────────────────┐
│  ✦ Certificate of Achievement       │
│                                     │
│     FINANCIAL LITERACY              │
│         COMPLETE                    │
│                                     │
│  [logo Solana w kolorze #14F195]    │
│  Minted on Solana · On-chain · ✓    │
└─────────────────────────────────────┘

Pod kartą:
"Not a PDF. Not a badge. A real NFT. Permanent. Verifiable."

Kolor akcentu na "Solana" i "NFT": #14F195

---

SLAJD 5 — SCALE & STACK (1:25–1:45)

Dwie kolumny:

LEWA — lista liczb (każda liczba duża, fioletowa, potem mały opis):
19        working pages
3 + 6     languages active + ready
WCAG 2.2  fully accessible
PWA       installable on any device

PRAWA — lista funkcji (ikony + tekst):
🧒 Kids Financial Mode
📈 DeFi Yield Vault (Kamino)
🏆 Global Leaderboard (Supabase)
🏢 B2B Portal — 6 institution types

Na dole, rząd 4 logotypów (tekst zastępczy jeśli brak obrazków):
[Claude/Anthropic] [ElevenLabs] [Solana] [Supabase]

---

SLAJD 6 — CLOSE (1:45–2:00)

Fullscreen ciemny slajd.

Centrum, duże:
CoachFI is live.
Mila is ready.

Pod spodem małe, w jednym rzędzie:
[ElevenLabs] · [Powered by Solana] · [Claude / Anthropic]

Jeszcze niżej, URL dużą czcionką fioletową:
coachfi.app

Na dole po lewej małym tekstem:
Looking for: partnerships · pre-seed · Colosseum recognition

---

WYMAGANIA TECHNICZNE:
- Nawigacja: klawisze strzałek lewo/prawo + kliknięcie myszą
- Każdy slajd zajmuje pełny ekran (100vw × 100vh)
- Płynne przejście między slajdami (fade lub slide, 300ms)
- W lewym dolnym rogu każdego slajdu: numer slajdu (1/6, 2/6 itd.)
- W prawym górnym rogu: czas sceny (np. "0:00 – 0:18")
- Żadnych zewnętrznych zależności — wszystko inline w jednym pliku HTML
