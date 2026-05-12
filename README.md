# Coach FI

**Platforma edukacji finansowej dla dorosłych, dzieci i całych rodzin.**  
Zbudowana na Solana Colosseum Frontier Hackathon 2026.

---

## Problem

Większość ludzi nie jest zła z pieniędzmi. Po prostu nigdy nie nauczono ich, jak działają pieniądze.

Miliony ludzi nie rozumieją inflacji, oszczędzania, kredytu, stóp procentowych, funduszy awaryjnych ani podstaw planowania emerytalnego. Tracą siłę nabywczą, biorą niekorzystne kredyty, unikają planowania finansowego i często polegają na systemach, które mogą ich nie ochronić.

---

## Rozwiązanie

Coach FI prowadzi użytkownika przez finansową transformację:

**Świadomość → Diagnoza → Edukacja → Nawyk → Certyfikacja**

1. Użytkownik wypełnia **Diagnozę finansową** (Health Check)
2. Widzi, jak inflacja zniszczyła jego siłę nabywczą (**Inflation Reality Check**)
3. Otrzymuje **spersonalizowaną ścieżkę nauki** (8 etapów)
4. Rozmawia z **AI coachem Miłą** — ciepłą, bezpośrednią, spokojną
5. Uzupełnia **quizy** i zarabia **Coach FI Tokeny**
6. **Mintuje certyfikat NFT** na Solana Devnet jako dowód postępu

---

## Czym Coach FI NIE jest

- Nie jest aplikacją tradingową
- Nie uczy dźwigni, kontraktów futures ani spekulacji
- Nie udziela porad inwestycyjnych ani rekomendacji finansowych
- Nie obiecuje zysków

Coach FI to spokojna platforma edukacyjna dla pewności siebie, nawyków oszczędzania i długoterminowej świadomości finansowej.

---

## Funkcje MVP

| Ekran | Opis |
|---|---|
| **Strona główna** | Tryby: Dorosły, Dzieci, Dostępność. CTA + avatar Miły. |
| **Diagnoza finansowa** | Formularz z 10 polami (dochód, wydatki, oszczędności, dług, gotówka, poduszka, inflacja, emerytura, inwestycje, cel). Wynik 0–100. |
| **Inflacja** | Interaktywny kalkulator z wykresem Recharts. Symulacja: gotówka / nawyk / scenariusz edukacyjny. |
| **Ścieżka nauki** | 8 etapów: Mindset → Nawyk → Inflacja → Kredyt → Fundusz awaryjny → Inwestowanie → Emerytura → Plan rodzinny. |
| **AI Coach** | AI Coach Mila uses Claude Haiku when `ANTHROPIC_API_KEY` is configured, can use OpenRouter when `OPENROUTER_API_KEY` is configured, and falls back to predefined replies when missing. |
| **Quiz** | 4 pytania z natychmiastowym feedbackiem, tokenami i czytaniem pytan na glos. |
| **Nagrody i NFT** | Tokeny + karty certyfikatow + realny mint Metaplex Core na Solana Devnet, z mock fallbackiem gdy API/wallet nie sa gotowe. |
| **Tryb dla dzieci** | 6 modulow (potrzeby, sloik, cel, kieszonkowe, gwiazdki, dzielenie). Animacje, system gwiazdek. |
| **Tryb dostępności** | Voice-first Accessibility Mode: duze przyciski glosowe, wysoki kontrast, duzy tekst, checklist WCAG. |
| **Partner Portal** | Dashboard B2B: banki, brokerzy, szkoły, uczelnie. Mock KPI, wykresy postępu, value prop. |

---

## Użycie Solana

Coach FI używa Solana do:

- **Dowodu postępu nauki** — certyfikaty NFT jako niespeculacyjny dowód edukacji
- **Własności na blockchainie** — użytkownik posiada swój certyfikat w portfelu
- **Devnet flow** — realny mint przez Metaplex Core, z bezpiecznym mock fallbackiem dla demo

### Co jest prawdziwe

- Solana Wallet Adapter (podłączenie portfela na Devnet)
- `@solana/web3.js` skonfigurowany na Devnet
- `ConnectionProvider` + `WalletProvider` + `WalletModalProvider`

### Co jest zamockowane / fallback

- Mock mint NFT tylko jako fallback, gdy wallet/API/konfiguracja Devnet nie sa dostepne
- Mock transaction hash tylko w fallbacku
- Coach FI Tokeny (local state)
- Wszystkie dane użytkownika (brak backendu)
- AI Coach Mila uzywa predefined replies tylko gdy `ANTHROPIC_API_KEY` / `OPENROUTER_API_KEY` sa brakujace albo API nie odpowie

---

## Dostępność (WCAG 2.2)

- Semantyczny HTML z `aria-label`, `aria-live`, `aria-pressed`, `role`
- Nawigacja klawiaturą i skip-to-content link
- Kontrast: normalny i wysoki kontrast toggle
- Duży tekst toggle
- Etykiety statusów w tekście, nie tylko kolorem
- Tryb dla dzieci z uproszczonym interfejsem
- Voice-first Accessibility Mode dla osob niewidomych, slabowidzacych i starszych
- Read-aloud shortcuts bez speech-to-text i bez mikrofonu

---

## Voice-first Accessibility with ElevenLabs

Coach FI uses the existing voice system as a first-class accessibility layer:

- `/api/tts` calls ElevenLabs TTS when `ELEVENLABS_API_KEY` and a voice ID are configured.
- `VoiceProvider` falls back to browser `window.speechSynthesis` whenever `/api/tts` returns a fallback response, times out or fails.
- `VoiceButton` appears on the voice demo, coach messages, quiz questions, inflation insights, the financial score and the Accessibility Mode page.
- `VoiceButton` supports `icon`, `pill` and `large` variants. The `large` variant is built for Accessibility Mode with a 56px minimum height and strong focus ring.
- Accessibility Mode is designed for blind, low-vision and elderly users, with five large voice actions and matching readable text cards.

## ElevenLabs Conversational AI Agent

- The global support, reading and education agent uses the ElevenLabs ConvAI web widget.
- The default public agent ID is `agent_7601krc9gaf2eaxr811qgk01epzc`.
- Override it with `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` when needed.
- The widget receives runtime dynamic variables for locale, current page, demo score, learning stage, savings goal, token balance and accessibility/text-only mode.
- The widget can use a signed URL from `/api/mila-token` when `ELEVENLABS_API_KEY` is configured; otherwise it falls back to the public agent ID.
- Signed URL mode requires the ElevenLabs API key permission `convai_write`; without it the public widget still works when the agent allows public widget access.
- Client tools are registered in the browser for safe in-app navigation and context lookup: `navigateToCoachFIPage`, `openHealthCheck`, `openInflation`, `openLearningPath`, `openQuiz`, `openRewards`, `openAccessibilityMode`, `openVoiceDemo`, `getCoachFIContext`, `setCoachFIAgentTextMode`.
- Text input, transcript and microphone muting are enabled in the widget. AudioWorklet processors are self-hosted from `/elevenlabs-worklets/` to work with strict CSP.
- API keys remain server-only; never expose `ELEVENLABS_API_KEY` to the browser.
- Local microphone access requires `Permissions-Policy` to include `microphone=(self)` and browser permission set to Allow.

---

## ElevenLabs Creator Plan Usage Strategy

- The voice demo supports only PL / EN / JA: Polski, English and 日本語.
- Each `/api/tts` request is limited to 500 characters.
- All voice demos use short predefined scripts from `lib/voiceDemoScripts.ts`.
- Audio never autoplays; the user must click a `VoiceButton`.
- `VoiceProvider` keeps an in-memory audio cache by text + locale + voiceId + modelId.
- Browser `speechSynthesis` is used as a fallback when ElevenLabs is unavailable.
- The click-to-play TTS demo does not use the realtime voice agent, microphone input, speech-to-text or voice cloning.
- Long lesson generation is intentionally excluded.
- Optional locale voice IDs: `ELEVENLABS_PL_VOICE_ID`, `ELEVENLABS_EN_VOICE_ID`, `ELEVENLABS_JA_VOICE_ID`.
- Optional ConvAI widget agent ID: `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`.

---

## Struktura projektu

```
app/
  page.tsx              — Strona główna
  voice-demo/           — PL / EN / JA ElevenLabs Creator plan demo
  health-check/         — Diagnoza finansowa
  inflation/            — Inflation Reality Check
  learn/                — Ścieżka nauki
  coach/                — AI Coach chat
  quiz/                 — Quiz system
  rewards/              — Tokeny i NFT
  kids/                 — Tryb dla dzieci
  accessibility/        — Tryb dostępności
  partner/              — Partner Portal B2B
  layout.tsx
  providers.tsx         — Solana Wallet Adapter

components/
  AppNavigation.tsx     — Sidebar + header + footer + mobile nav
  CoachAvatar.tsx       — Avatar Miły
  FinancialScoreCard.tsx
  InflationChart.tsx    — Recharts line chart
  NFTCertificateCard.tsx
  ProgressPath.tsx      — 8 etapów nauki
  QuizCard.tsx          — Multi-question quiz z feedbackiem
  SectionHeader.tsx     — Nagłówek ekranu + read-aloud button
  TokenRewardCard.tsx
  AccessibilityToggle.tsx
  read-aloud-button.tsx
  ui/                   — button, card, badge, dialog, progress

data/
  mockUser.ts           — Dane użytkownika demo
  lessons.ts            — Etapy, wiadomości coacha, quick replies, kids
  quizQuestions.ts      — 4 pytania z odpowiedziami i nagrodami
  certificates.ts       — NFT certyfikaty

lib/
  inflation.ts          — Kalkulacje inflacji i scenariuszy
  solanaMock.ts         — Mock tx hash + wait()
  numerology.ts         — Bonus: life path number
  utils.ts              — cn(), formatCurrency(), formatNumber()
```

---

## Uruchomienie lokalne

```bash
npm install
npm run api:check
npm run dev
```

Otwórz [http://localhost:3000](http://localhost:3000)

## Podpinanie API

Wszystkie integracje zewnetrzne sa sterowane przez `.env.local`. Skopiuj `.env.example`,
uzupelnij realne klucze i sprawdz konfiguracje:

```bash
copy .env.example .env.local
npm run api:check
```

Szczegolowy przewodnik jest w `docs/API_SETUP.md`.

- Anthropic/OpenRouter: `/api/chat`, Claude Haiku dla Mili albo OpenRouter przez `OPENROUTER_API_KEY`, fallback do predefined replies.
- ElevenLabs: `/api/tts`, realny glos dla krotkich skryptow, fallback do `speechSynthesis`.
- Supabase: `/api/leaderboard`, tabela z `supabase/leaderboard.sql`.
- Solana: `/api/mint-nft`, Devnet mint authority z `SOLANA_MINT_KEYPAIR`.
- NFT metadata: `/nft-metadata/[certificateName]`.

### Microphone troubleshooting

If the microphone does not work locally, restart the dev server after changing `next.config.mjs`. Then open Chrome site settings for `http://localhost:3000` and set Microphone to Allow. On Windows, also check Settings → Privacy & security → Microphone and allow desktop apps to access the microphone.

---

## Potencjał B2B

Coach FI może być wdrożony przez banki, brokerów, domy inwestycyjne, giełdy krypto, szkoły, uczelnie i fundacje jako white-label platforma edukacji finansowej z certyfikacją na Solana.

---

## Kolejne kroki

- Produkcyjne metadane NFT i monitoring mintowania na Devnet/Mainnet
- Backend z autentykacją i historią postępu
- Evals, guardrails i lepsza personalizacja AI Coach Mila
- PWA / React Native
- Integracja z otwartą bankowością (PSD2)
- Wielojęzyczność (EN, PL, UA, RO)

---

## Zastrzeżenie

Coach FI to aplikacja edukacyjna. Nie udziela porad finansowych, rekomendacji inwestycyjnych ani nie gwarantuje zysków. Wszystkie przykłady i symulacje służą wyłącznie celom edukacyjnym.

---

*Solana Colosseum Frontier Hackathon 2026 · Coach FI v0.2.0*
