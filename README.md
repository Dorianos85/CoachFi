# Coach FI

**Financial education platform for adults, children and families.**  
Built for Solana Colosseum Frontier Hackathon 2026.

---

## Problem

Most people are not bad with money. They were simply never taught how money works.

Millions of people do not understand inflation, saving, credit, interest rates, emergency funds or the basics of retirement planning. They lose purchasing power, take unfavorable loans, avoid financial planning and often rely on systems that may not protect them.

---

## Solution

Coach FI guides the user through a financial transformation:

**Awareness → Diagnosis → Education → Habit → Certification**

1. User completes the **Financial Health Check** (score 0–100)
2. Sees how inflation has eroded their purchasing power (**Inflation Reality Check**)
3. Gets a **personalized learning path** (8 stages)
4. Talks to **AI coach Mila** — warm, direct and calm
5. Completes **quizzes** and earns **Coach FI Tokens**
6. **Mints an NFT certificate** on Solana Devnet as proof of progress

---

## What Coach FI is NOT

- Not a trading app
- Does not teach leverage, futures or speculation
- Does not provide financial advice or investment recommendations
- Does not promise returns

Coach FI is a calm educational platform for financial confidence, saving habits and long-term financial awareness.

---

## MVP Features

| Screen | Description |
|---|---|
| **Home** | Adult, Kids and Accessibility modes. CTA + Mila avatar. |
| **Financial Health Check** | 10-field form (income, expenses, savings, debt, cash, cushion, inflation, retirement, investments, goal). Score 0–100. |
| **Inflation** | Interactive calculator with Recharts chart. Three scenarios: cash / saving habit / educated investor. |
| **Learning Path** | 8 stages: Mindset → Saving Habit → Inflation → Credit → Emergency Fund → Investing → Retirement → Family Plan. |
| **AI Coach** | Mila uses Claude Haiku when `ANTHROPIC_API_KEY` is configured, OpenRouter when `OPENROUTER_API_KEY` is configured, and falls back to predefined replies when neither is available. |
| **Quiz** | 4 questions with instant feedback, tokens and read-aloud support. |
| **Rewards & NFT** | Tokens + certificate cards + real Metaplex Core mint on Solana Devnet, with mock fallback when API/wallet are not ready. |
| **Kids Mode** | 6 modules (needs, jar, goal, pocket money, stars, sharing). Animations and star system. |
| **Accessibility Mode** | Voice-first: large voice buttons, high contrast, large text, WCAG checklist. |
| **Partner Portal** | B2B dashboard for banks, brokers, schools and universities. Mock KPIs, progress charts, value proposition. |

---

## Solana Usage

Coach FI uses Solana for:

- **Proof of learning** — NFT certificates as non-speculative proof of education
- **On-chain ownership** — the user owns their certificate in their wallet
- **Devnet flow** — real mint via Metaplex Core, with a safe mock fallback for demo

### What is real

- Solana Wallet Adapter (wallet connection on Devnet)
- `@solana/web3.js` configured on Devnet
- `ConnectionProvider` + `WalletProvider` + `WalletModalProvider`

### What is mocked / fallback

- Mock NFT mint only as fallback when wallet/API/Devnet config are not available
- Mock transaction hash only in fallback
- Coach FI Tokens (local state)
- All user data (no backend)
- AI Coach Mila uses predefined replies only when `ANTHROPIC_API_KEY` / `OPENROUTER_API_KEY` are missing or the API does not respond

---

## Accessibility (WCAG 2.2)

- Semantic HTML with `aria-label`, `aria-live`, `aria-pressed`, `role`
- Keyboard navigation and skip-to-content link
- Normal and high contrast toggle
- Large text toggle
- Status labels in text, not color alone
- Kids mode with simplified interface
- Voice-first Accessibility Mode for blind, low-vision and elderly users
- Read-aloud shortcuts without speech-to-text or microphone

---

## Voice-first Accessibility with ElevenLabs

Coach FI uses the voice system as a first-class accessibility layer:

- `/api/tts` calls ElevenLabs TTS when `ELEVENLABS_API_KEY` is configured. Falls back to a multilingual voice (Rachel, `eleven_multilingual_v2`) when no locale-specific voice ID is set.
- `VoiceProvider` falls back to browser `window.speechSynthesis` whenever `/api/tts` returns a fallback response, times out or fails.
- `VoiceButton` appears on the voice demo, coach messages, quiz questions, inflation insights, the financial score and the Accessibility Mode page.
- `VoiceButton` supports `icon`, `pill` and `large` variants. The `large` variant is built for Accessibility Mode with a 56px minimum height and strong focus ring.
- Accessibility Mode is designed for blind, low-vision and elderly users, with five large voice actions and matching readable text cards.

## ElevenLabs Conversational AI Agent

- The global support, reading and education agent uses the ElevenLabs ConvAI web widget.
- The default agent ID is configured via `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`.
- The widget receives runtime dynamic variables for locale, current page, demo score, learning stage, savings goal, token balance and accessibility/text-only mode.
- The widget can use a signed URL from `/api/mila-token` when `ELEVENLABS_API_KEY` is configured; otherwise it falls back to the public agent ID.
- Signed URL mode requires the ElevenLabs API key permission `convai_write`; without it the public widget still works when the agent allows public widget access.
- Client tools are registered in the browser for safe in-app navigation and context lookup: `navigateToCoachFIPage`, `openHealthCheck`, `openInflation`, `openLearningPath`, `openQuiz`, `openRewards`, `openAccessibilityMode`, `openVoiceDemo`, `getCoachFIContext`, `setCoachFIAgentTextMode`.
- Text input, transcript and microphone muting are enabled in the widget. AudioWorklet processors are self-hosted from `/elevenlabs-worklets/` to work with strict CSP.
- API keys remain server-only; never expose `ELEVENLABS_API_KEY` to the browser.
- Local microphone access requires `Permissions-Policy` to include `microphone=(self)` and browser permission set to Allow.

---

## ElevenLabs Usage Strategy

- The voice demo supports EN / PL / JA: English, Polski and 日本語.
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

## Project Structure

```
app/
  page.tsx              — Home dashboard
  voice-demo/           — EN / PL / JA ElevenLabs TTS demo
  health-check/         — Financial Health Check
  inflation/            — Inflation Reality Check
  learn/                — Learning path
  coach/                — AI Coach chat
  quiz/                 — Quiz system
  rewards/              — Tokens and NFT certificates
  kids/                 — Kids mode
  accessibility/        — Accessibility mode
  partner/              — B2B Partner Portal
  layout.tsx
  providers.tsx         — Solana Wallet Adapter

components/
  AppNavigation.tsx     — Sidebar + header + footer + mobile nav
  MilaAvatar.tsx        — Mila avatar
  MilaVoiceAgent.tsx    — ElevenLabs ConvAI widget
  FinancialScoreCard.tsx
  InflationChart.tsx    — Recharts line chart
  NFTCertificateCard.tsx
  ProgressPath.tsx      — 8-stage learning path
  QuizCard.tsx          — Multi-question quiz with feedback
  SectionHeader.tsx     — Screen header + read-aloud button
  TokenRewardCard.tsx
  AccessibilityToggle.tsx
  VoiceButton.tsx       — TTS button (icon / pill / large variants)
  ui/                   — button, card, badge, dialog, progress

data/
  mockUser.ts           — Demo user data
  lessons.ts            — Stages, coach messages, quick replies, kids modules
  quizQuestions.ts      — Quiz questions with answers and rewards
  certificates.ts       — NFT certificate definitions

lib/
  inflation.ts          — Inflation and scenario calculations
  solanaMock.ts         — Mock tx hash + wait()
  numerology.ts         — Life path number bonus
  utils.ts              — cn(), formatCurrency(), formatNumber()
  i18n/                 — Translations: en, pl, ja
  localizedContent.ts   — Mila messages, accessibility actions, coach copy
```

---

## Local Setup

```bash
npm install
npm run api:check
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## API Configuration

All external integrations are controlled via `.env.local`. Copy `.env.example`, fill in your keys and verify:

```bash
copy .env.example .env.local
npm run api:check
```

A detailed guide is in `docs/API_SETUP.md`.

| Integration | Route | Notes |
|---|---|---|
| Anthropic / OpenRouter | `/api/chat` | Claude Haiku for Mila, OpenRouter as fallback, predefined replies when both missing |
| ElevenLabs TTS | `/api/tts` | Real voice for short scripts, `speechSynthesis` fallback |
| ElevenLabs ConvAI | widget | Set `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` to your own agent |
| Supabase | `/api/leaderboard` | Table schema in `supabase/leaderboard.sql` |
| Solana | `/api/mint-nft` | Devnet mint authority via `SOLANA_MINT_KEYPAIR` |

### Microphone troubleshooting

If the microphone does not work locally, restart the dev server after changing `next.config.mjs`. Then open Chrome site settings for `http://localhost:3000` and set Microphone to Allow. On Windows, also check Settings → Privacy & security → Microphone and allow desktop apps to access the microphone.

---

## B2B Potential

Coach FI can be deployed by banks, brokers, investment houses, crypto exchanges, schools, universities and foundations as a white-label financial education platform with Solana-certified progress.

---

## Next Steps

- Production NFT metadata and mint monitoring on Devnet / Mainnet
- Backend with authentication and learning history
- Evals, guardrails and improved AI coach personalization
- PWA / React Native
- Open banking integration (PSD2)
- Additional languages (UA, RO, DE)

---

## Disclaimer

Coach FI is an educational application. It does not provide financial advice, investment recommendations or guarantee returns. All examples and simulations are for educational purposes only.

---

*Solana Colosseum Frontier Hackathon 2026 · Coach FI v0.2.0*
