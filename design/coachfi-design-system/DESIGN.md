# CoachFI — Design System v6 “Pastel” (implementation spec)

> **For the current live app this is a visual reskin only:** apply brand, tokens, logo, assets and component styling; keep every feature and behaviour exactly as it is. Product rules in §5, §6 and §8 describe the future product and are out of scope for the reskin (see CLAUDE_CODE_PROMPT.md).

Single source of truth for implementing the CoachFI UI. If this file and a reference board disagree, **this file wins**.
Tokens: `tokens/tokens.json` (data) · `tokens/tokens.css` (CSS variables) · `tokens/tailwind.preset.js` (Tailwind).

---

## 1. Product in one paragraph

CoachFI is a voice-first AI money coach for young adults in the US. The coach is **Mila**, a blocky (voxel) orange squirrel in a graduation cap. Users talk to Mila (or type), she explains money in plain words in 20–40 seconds, and every conversation ends with **one small step** for today. Launch scope: **Adult mode, US market, English, free**. Teen (vaporwave) and Kids (learning pet) come later; the theme system must support them from day one.

**Design principles**
1. One next step per screen. Everything else is secondary.
2. Pastel everywhere: cream ground, pastel areas, ink text. The one action that matters is a lavender button with an ink outline — no dark blocks in Adult.
3. Mila is a character, not a person: always labelled “AI coach”, never a human face.
4. Voice is never the only channel: every spoken word is also on screen.
5. No guilt mechanics: no streak loss, no countdowns, no red “you failed” states.

---

## 2. Brand

### 2.1 Name
- Product name in copy: **CoachFI** (store name). Full lockup: **CoachFI AI**. Spoken: “Coach-Fi”.
- Coach name: **Mila**. Pronouns: she/her. Always introduced as “Mila, your AI coach”.

### 2.2 Logo
- **Symbol** `assets/logo/coachfi-symbol.svg`: voxel squirrel in a cap; its tail is the letter **C**. The tail never touches the head.
- **Wordmark lockup** = symbol (acts as the “C”) + text `oach` in Nunito 800 + `assets/logo/coachfi-fi-book.svg` (the letters F and I as a rounded book with charts) + small `AI` superscript.
- The lockup is built in code (text stays live). Reference implementation:

```tsx
// Logo.tsx — sizes by font-size; everything else is in em.
export function Logo({ size = 32, theme = 'light' as 'light' | 'dark' | 'teen', showAI = true }) {
  const fi = { light: 'coachfi-fi-book.svg', dark: 'coachfi-fi-book-dark.svg', teen: 'coachfi-fi-book-teen.svg' }[theme];
  return (
    <span role="img" aria-label="CoachFI AI"
      style={{ display: 'inline-flex', alignItems: 'flex-end', fontFamily: 'var(--cf-font-sans)', fontSize: size,
               fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--cf-text)' }}>
      <img src="/brand/logo/coachfi-symbol.svg" alt="" style={{ height: '1.3em', marginBottom: '0.08em', marginRight: '-0.02em' }} />
      <span aria-hidden>oach</span>
      <img src={`/brand/logo/${fi}`} alt="" style={{ height: '0.72em', marginBottom: '0.17em', marginLeft: '0.05em' }} />
      {showAI && <span aria-hidden style={{ alignSelf: 'flex-start', margin: '0.14em 0 0 0.08em', fontSize: '0.26em',
               fontWeight: 700, color: 'var(--cf-grape)' }}>AI</span>}
    </span>
  );
}
```

- Background behind the logo: **flat only** — brand lavender `#EBE1FF` (default), white, cream `#FFF8EE`, mint `#D5F3E5`, or teen pink `#FFD9EF`. Never gradients, patterns or photos under the logo.
- Clear space: 2 × the squirrel’s head height on every side. Minimum: lockup 120 px wide; symbol 32 px; below 32 px use `coachfi-symbol-small.svg` (no face/cap detail).
- Variants: `coachfi-symbol-book.svg` (lesson screens), `coachfi-symbol-cap-book.svg` (course completed), `-mono`, `-high-contrast`.
- App icons: `assets/app-icons/` — adult lavender, teen pink; `*-store-1024.png` are full-bleed (no transparency) for App Store / Play; `favicon*.png/svg` for web.
- Don’t: recolour the squirrel, rotate, add a human face, put it on neon or dark green, separate tail from body.

### 2.3 Mila — character & states
Assets in `assets/mila/` (square viewBox, transparent; place on a circle of `--cf-area-mila`).

| State | Asset | When | Screen-reader text |
|---|---|---|---|
| Ready | `mila-head-neutral.svg` | idle, chat open | — |
| Listening | `mila-head-listen.svg` | mic open | “Mila is listening” |
| Thinking | `mila-head-think.svg` | waiting for response (>300 ms) | “Mila is thinking” (once) |
| Talking | `mila-head-talk.svg` ↔ `mila-head-neutral.svg` | TTS playing; swap frames on audio level at ~7 fps | full reply text (not duplicated) |
| Proud | `mila-head-happy.svg` | step done, milestone | “Step done: …” |
| Resting | `mila-head-sleep.svg` | quiet hours / break | “Mila is resting until 8 am” |

Full-body: `mila-talk.svg` (hero/onboarding), `mila-happy.svg` (celebration), plus logo symbol.
Adult mode: Mila avatar ≤ 64 px in lists/cards, ≤ 200 px on the voice screen; no bouncing. Reduced motion: no mouth animation — static `talk` frame + captions.

### 2.4 Voice persona
Warm, mid-pitch US English, ~150 wpm (0.75×–1.5× user setting). Licensed synthetic voice ([VOICE PROVIDER]), never a clone of a real person. Replies 20–40 s, one idea, one dollar example, end with one step. Explains jargon once (“APR — the yearly cost of borrowing”). Signature line “Let’s stash a little for winter.” max once a week.

---

## 3. Tokens & themes

Set `data-theme` on `<html>`: `adult-light` (default) · `adult-dark` · `high-contrast` · `teen` · `kids`. Components must use **semantic variables only** (`var(--cf-primary)`), never raw hex.

### 3.1 Adult light (launch) — pastel v6
| Token | Value | Use | Contrast |
|---|---|---|---|
| `bg` | #FFF8EE | app background (“Cream”) | ink 15.9 |
| `surface` | #FFFFFF | cards, sheets | ink 17.0 |
| `surface-brand` | #EBE1FF | logo backgrounds, Mila areas, voice sheet, desktop sidebar | ink 13.4 |
| `text` | #1E1B2E | all body text (“Ink”) | — |
| `text-muted` | #4A4560 | secondary text | 8.6 on bg · 5.4 on primary |
| `primary` | #CDBEFF | primary buttons, selected chips, switch on, NextStepCard | ink 9.9 |
| `primary-border` | #1E1B2E | 2 px outline on primary/secondary buttons | — |
| `on-primary` | #1E1B2E | text on primary | 9.9 |
| `primary-strong` | #B3A6FF | hover / pressed fill | ink 7.8 |
| `grape` | #5B4BC4 | links, progress arcs & bars, chart-1, “AI” in logo, active icons | 6.1 on bg · 5.2 on sky |
| `area-learn` | #DDE6FF | learning cards, active tab | ink 13.5 |
| `area-goals` | #FFE1D1 | goal cards | ink 13.5; `on-goals-strong` #6E3417 7.8 |
| `area-progress` | #D5F3E5 | progress, success | ink 14.2 |
| `area-mila` | #EBE1FF | Mila bubbles & avatar areas | ink 13.4 |
| `area-rewards` | #FFF0BF | rewards, “Stop listening” | ink 14.8 |
| `area-care` | #FFD9EF | guardrails, “Never” lists, notices (was dark ink cards) | ink 13.1 |
| `accent` | #F07A57 | highlights, I-column in logo, chart-3 | ink 6.1 (ink text only) |
| `mascot` / `mascot-deep` | #E8772E / #C85A1E | squirrel only — never text | graphics only |
| `attention` | #B4532A | needs attention — always icon + words | 5.0 on white |
| `border` | #7A7486 | input/toggle outlines | 4.5 on white |
| `border-subtle` | #ECE6DD | dividers | decorative |
| `focus` | #5B4BC4 | 3 px focus ring, 2 px offset | 6.1 on bg |
| `shadow-press` | `0 3px 0 #1E1B2E` | under primary buttons & switch-on; pressed = translateY(3px), no shadow | — |

Area colour rule: **learn = sky, goals = peach, progress = mint, Mila = lavender, rewards = butter, care = pink**. Text on every pastel is ink. Colour is never the only signal — always with an icon or word.
**Never in Adult:** white text on pastels, navy/dark section blocks, orange text, more than one primary button per screen.

### 3.2 Other themes
See `tokens.json` → `themes`. Summary:
- **adult-dark**: bg #16141F, surface #221F30, brand #2B2448, text #F3EFFA (16.1), muted #BDB6CF (9.3), primary #B3A6FF with ink text (7.8) and #F3EFFA outline, grape/focus #B3A6FF (8.5), no soft shadows (elevation = lighter surface).
- **high-contrast**: white/black, primary = white fill + 3 px black border, grape #3A2C9E (10.3), all borders #000, 2 px borders on cards.
- **teen** (later, “vaporwave”): bg #1B1035, surface #2A1B4D, text #FDF4FF, primary pink #FF71CE (dark text), progress cyan #01CDFE, challenges #B967FF, rewards #FFFB96, logo tile #FFD9EF. Sunset gradient `--cf-sunset` max one element per screen (never under the logo). Headings uppercase, tracking 0.12em.
- **kids** (later, “block forest”): bg #FFF8E8, ink #1D2A1F, primary squirrel orange #B84E1A (white 5.1), sun #FFC83D, sky #4FB3E8, berry #C2347A, grass #7CD36B. 3 px ink borders, radius 6 px, `box-shadow: 0 5px 0 #1D2A1F`, targets ≥ 60 px, titles in Pixelify Sans, body ≥ 18 px.

### 3.3 Typography — Nunito everywhere
| Style | Size / line | Weight |
|---|---|---|
| display-xl | 56/60 (3.5rem) | 900, −0.03em |
| display-l | 40/44 | 800, −0.02em |
| title | 28/34 | 800 |
| heading | 20/26 | 800 |
| body-l | 18/28 | 400 |
| body | 16/24 | 400 — never smaller for running text |
| label | 14/20 | 700 (buttons, chips, tabs) |
| caption | 14/20 | 500, `text-muted` |

All sizes in rem (respect user text size up to 200 %). **Money amounts always `font-variant-numeric: tabular-nums`** (`.cf-num`). Currency formatting via `Intl.NumberFormat(locale, { style: 'currency', currency })` — US launch: `$1,860`. Kids titles: Pixelify Sans (short titles only).

### 3.4 Space, radius, elevation, motion
- Space: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96.
- Radius: input 8 · button 14 · card 20 · sheet 28 · pill 999 · kids 6.
- Elevation (light only): e1 cards (soft), `press` (hard ink 0 3px 0) for primary buttons only, e3 modals. Dark mode: no soft shadows.
- Motion: micro 120 ms · standard 200 ms · emphasis 320 ms · celebrate 600 ms once. Enter `cubic-bezier(.2,0,0,1)`, exit `cubic-bezier(.3,0,1,1)`. `prefers-reduced-motion`: 0 ms, no transforms, celebrations become text + optional haptic. Also a manual switch in Settings.
- Breakpoints: <480 one column + bottom tabs · 768 two columns + rail · 1024 sidebar + 12-col · 1440 max content 1200 px.
- Touch targets: min 44 px, default 52 px, kids 60 px.

---

## 4. Components (build these first)

Every component: native elements (`button`, `a`, `input`+`label`), visible focus ring, works at 200 % text, no colour-only states. Reference: board 07.

| Component | Spec |
|---|---|
| **Button** | `primary` (bg `primary` #CDBEFF, ink text, 2 px `primary-border`, `shadow-press`, 52 px, radius 14, label 16/800; active = translateY(3px) + no shadow) · `secondary` (white bg, ink text, 2 px ink border, no shadow) · `ghost` (grape underlined link) · `reward` (bg area-rewards, ink text, ink border). Disabled = dashed border + explanatory label. CSS helpers `.cf-btn-primary` / `.cf-btn-secondary` in tokens.css. |
| **Input** | label above (14/700), 52 px, 2 px `border`, radius 8; helper text; error = attention colour + icon + text + `aria-invalid` + `aria-describedby`. Numeric `inputmode="decimal"`. |
| **Chip (multi-select)** | 48 px pill; selected = `primary` bg + 2 px ink border + check icon; unselected = white + `border`; `aria-pressed`; group with `role="group"` + label. |
| **Switch** | 60×34; `role="switch"` + `aria-checked`; on = `primary` fill + 2 px ink border + `shadow-press` + white knob with check; off = white + `border` outline. Reminders default **off**. |
| **AreaCard** | radius 20, padding 16–24, bg = one `area-*` token, title heading style; optional Mila avatar. |
| **NextStepCard** | the hero card on Today: bg `primary` (#CDBEFF), radius 24, eyebrow “TODAY’S NEXT STEP · 2 MIN” 13/700 uppercase ink, title 22/800 ink, body `text-muted`, actions: `reward` button “I did it” + `secondary` “Another idea”. |
| **ProgressRing** | 120 viewBox, track `area-learn`, arc `grape` 12 px round caps, end dot `mascot-deep` with white 3 px stroke, % label centred. `role="img"` label: “Safety net, 62 percent, $1,860 of $3,000”. Never animated as a loader. |
| **MilaAvatar** | circle bg `area-mila`, image from §2.3 by state; sizes 32/44/64/150. Decorative (`alt=""`) when a visible “Mila” label is next to it. |
| **MilaMessage** | avatar + name “Mila” + tag “AI coach” + bubble (bg area-mila, radius 4/20/20/20) + up to 2 action buttons + “Why this?” disclosure (`aria-expanded`) showing data used + source lesson + “Mila is an AI and can make mistakes. Not financial advice.” Messages live in `role="log" aria-live="polite"`. |
| **VoiceSession** | full-screen sheet (bg `surface-brand` #EBE1FF, ink text): Mila 150 px in a 190 px white circle with lavender halo (`0 0 0 10px rgba(205,190,255,.55), 0 0 0 22px rgba(205,190,255,.25)`), 6 sound bars (`grape`, one `accent`), user bubbles white, Mila bubbles `bg`, live caption (`role="status"`), buttons “Type instead” (`secondary`, transparent) and “Stop listening” (`reward` + `shadow-press`). Footer disclaimer. Esc / back stops audio. |
| **LessonPlayer** | `area-mila` card: Mila talk avatar 52 px on a white circle, play/pause 48 px (white, ink border), progress bar (white track, `grape` fill), speed button (0.75–1.5×), grape link “Read the transcript”. |
| **Quiz** | `fieldset` + `legend`, radio rows 56 px; feedback in `role="status"` with icon + word (“Right.” / “Try again”) — never red ✗. |
| **HealthBand** | pill: Building (half-empty icon, area-rewards) · Steady (half icon, area-progress) · Strong (full icon, `primary` + ink text). Never a numeric score. |
| **Milestone toast** | `role="status"`, bg `area-rewards`, ink text, 2 px ink border, Mila happy 40 px; one 600 ms entrance, optional sound + haptic. |
| **BottomNav** (mobile) | 4 labelled tabs: Today · Learn · Goals · Mila; 64 px; `aria-current="page"`; active = `area-learn` bg + grape icon. Simplified mode: Today + Mila only. |
| **Sidebar** (desktop) | bg `surface-brand`, Logo 1.6rem, nav items 48 px, “Accessibility” pinned bottom. |
| **CertificateCard (NFT)** | Issued when a course is finished: a Solana NFT certificate. Card bg `area-rewards`, 2 px ink border, radius 20; Mila happy 64 px; course title (title style), date, “Verified on Solana” + link to the explorer; actions `primary` “Share” + `secondary` “Connect wallet” (optional — the certificate is held in the CoachFI account until a wallet is connected, so no crypto knowledge is needed). Earned only by learning, never bought; no prices, floor, marketplace or trading UI anywhere. Accessible name: “Certificate: Budgeting 101, completed October 12, 2026”. Kids/Teen: issued to the parent’s account. |
| **OfferCard** (later) | separate “Offers” tab only; label “Sponsored” always visible; ranking never by commission; never shown in Kids/Teen; never inside Mila’s lessons. |

---

## 5. Screens — Adult launch (reference boards 08–12)

| # | Screen | Must have |
|---|---|---|
| 1 | **Onboarding** (5 steps) | goals as chips; “We never ask for your income, bank login or account numbers.”; progressbar “Step 2 of 5”; Skip always visible. First step: Mila says hello by voice (with caption) — user can mute. |
| 2 | **Today** | greeting + date (“Tuesday, October 13”), NextStepCard, goal ProgressRing card, “This week” dots (no streak language: “3 check-ins · no pressure”), continue-lesson row, BottomNav. |
| 3 | **Mila — voice** | VoiceSession; text chat fallback; AI disclaimer. |
| 4 | **Money health check** | 4 pillars Spend / Save / Borrow / Plan with HealthBand + one-line reason + “Best place to start →”; “Based on 8 answers on Oct 12. Not a credit score.” |
| 5 | **Learn hub** | path list (done / current / upcoming), optional challenge card, “Earned by doing” chips incl. NFT certificates (CertificateCard). US topics: emergency fund, credit cards & APR, student loans, 401(k) match, budgeting. |
| 6 | **Lesson** | LessonPlayer (read by Mila) + Quiz + “Next: a real example”. |
| 7 | **Goal / habits / weekly review** | big amount (tabular), milestone bar ($1k/$2k/$3k), routines (Switch), weekly review card (3 facts + 1 idea + Try it / Skip this week). |
| 8 | **Accessibility settings** | text size slider (100–200 %), contrast (Standard / High / Dark), reduce motion, simplified mode, audio-first lessons, progress sounds & haptics, Mila speaking speed. Reachable in one tap from Today. |
| 9 | **Plan** | “Free · Launch plan”, “Everything is free while we grow”, “Notify me when Plus launches”, “Download my data”. No trial clock. |
| 10 | **Landing page** | hero “Feel in control of your money — one small step a day.” + Mila intro; trust strip (placeholders); How it works (3 steps); Meet Mila section; For everyone/accessibility; pricing “Free while we grow” + Plus/Offers “coming later”; FAQ; footer disclaimer “not a bank, broker, or registered investment adviser”; language switch EN (US) · PL. |
| 11 | **Desktop dashboard** | lavender sidebar, NextStepCard, Mila card, 3 goal rings, weekly bar chart with text summary + “Show as table”, Money health list. |

Copy: US English, sentence case, verbs first (“Move $64”), money as `$1,860`. Placeholders still to fill: `[PARTNER / PRESS LOGO]`, `[COMPANY NAME, ADDRESS, REGISTRATION]`, `[VOICE PROVIDER]`, `[SUPPORT CHANNEL]`.

---

## 6. Voice & conversation rules
Loop: **Listen → Think (<1.5 s, else “Give me a second”) → Explain (20–40 s) → One step → Check (“Did that help?”)**.
Guardrails (also legal): Mila never recommends specific funds, stocks, cards or loans; points to licensed professionals for tax/legal/investment decisions; opens each new chat with “I’m Mila, an AI coach — not a financial advisor.”; suggests a break after ~15 min; audio is processed and discarded by default, transcripts deletable. Wake word: not at launch (privacy).

## 7. Accessibility (WCAG 2.2 AA minimum)
Contrast ≥ 4.5:1 text / 3:1 graphics (values in §3). Focus ring never removed and never obscured by sticky UI (2.4.11). Targets ≥ 44 px (2.5.8). Sliders also accept typed values or +/− (2.5.7). Help/Mila in a consistent place (3.2.6). Passkeys / email link, paste allowed (3.3.8). Every lesson: audio + transcript. Charts: text summary first + table toggle. Live regions: Mila log `polite`; don’t read partial voice transcripts while listening. Test with VoiceOver, TalkBack, NVDA + axe in CI.

## 8. Engagement rules
Max 1 push/day, 3/week; daily reminders opt-in; quiet hours 21:00–08:00; 3 ignored → frequency halves. No streak loss, no paid freezes, no countdowns, no money leaderboards, no variable-ratio rewards. North-star: weekly users completing ≥ 1 real action or lesson.

## 9. Later modes (keep theme hooks ready)
- **Teen** — same screens as Adult with `data-theme="teen"`, Mila with topic limits, first paycheck / online shopping content, teen app icon.
- **Kids** — learning pet (board 17): pick **Mila** (the same squirrel as in Adult — `assets/mila/`), Dune the camel, Timber the beaver or Honey the bee (`assets/kids/`). There is only one squirrel in the brand: Mila. In Kids she speaks only pre-written, reviewed lines (no open AI chat); growth = Sprout → Explorer → Master (earns a scarf / backpack, never loses the cap); pet needs are met by lessons and parent-confirmed savings, never by screen time; pet never gets sick or dies; ~15 min then a break; no open AI chat, no purchases, no ads, no push to children; parent-created profiles (COPPA review required).

## 10. Asset index
```
assets/logo/        coachfi-symbol(.svg|-small|-book|-cap-book|-mono|-high-contrast), coachfi-fi-book(-dark|-teen|-mono)
assets/mila/        mila-head-{neutral,listen,think,talk,happy,sleep}.svg, mila-talk.svg, mila-happy.svg
assets/app-icons/   app-icon-{adult,teen}.svg|-fullbleed.svg|-store-1024.png|-180.png, favicon.svg|-16|-32|-180.png
assets/kids/        pet-{camel,beaver,bee}.svg   (the squirrel in Kids is Mila → assets/mila/)
reference/boards/   design canvas boards as HTML (inline styles = exact values; need the canvas runtime to render loops)
```
