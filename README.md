# Coach FI

**Financial education platform for adults, children and families.**  
Built for Solana Colosseum Frontier Hackathon 2026.

---

## Current Product Direction

Coach FI is being simplified into a daily financial learning product:

**Daily Challenge -> Quiz -> Mila -> Coins -> Level -> Share -> Come back tomorrow**

The demo navigation now prioritizes the daily loop first, with learning, tools and modes grouped behind it. The current architecture source of truth is:

- [Product Architecture](docs/PRODUCT_ARCHITECTURE.md)
- [Product Roadmap](docs/ROADMAP.md)
- [CoachFI AI White Paper (PDF)](docs/white-paper/CoachFI_AI_White_Paper_EN_v1.0.pdf)
- [CoachFI AI White Paper (editable DOCX)](docs/white-paper/CoachFI_AI_White_Paper_EN_v1.0.docx)
- [Distribution Rollout](docs/DISTRIBUTION_ROLLOUT.md)
- [ElevenLabs Marketing Plan](docs/MARKETING_PLAN_ELEVENLABS.md)
- [Launch QA Checklist](docs/LAUNCH_QA_CHECKLIST.md)
- [API Setup](docs/API_SETUP.md)
- [Security & Privacy](docs/SECURITY_PRIVACY.md)

The product direction is voice-first, reward-driven and mode-based:

- Adult Mode: personal finance education, daily missions, AI coach Mila and rewards.
- Kids Mode: simplified financial literacy with strict safety boundaries.
- Accessibility Mode: large controls, readable text, high contrast and voice narration.

---

## Problem

Most people are not bad with money. They were simply never taught how money works.

Millions of people do not understand inflation, saving, credit, interest rates, emergency funds or the basics of retirement planning. They lose purchasing power, take unfavorable loans, avoid financial planning and often rely on systems that may not protect them.

---

## Solution

Coach FI guides a family through a financial transformation:

**Free diagnosis -> account + terms -> score -> family plan -> Mila voice trial -> premium habits**

1. User completes the free **Financial Health Check**.
2. User logs in and accepts current Terms/Privacy to unlock the final score.
3. Coach FI shows the **Family Financial Health Score** and top money leaks.
4. Mila explains the result and proposes a 30-day family plan.
5. User starts daily missions, Kids Mode lessons and shopping/receipt hygiene.
6. Trial users can test **Mila Voice Coach** before Premium Family.
7. Advanced users can mint a Solana Devnet certificate as proof of progress.

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
| **Home** | Premium-family positioning with free Financial Health Check as the main CTA. |
| **Financial Health Check** | Free diagnostic entry point. Current app demo shows preview first, then unlocks the final score and a 30-day family action plan after email + Terms/Privacy acceptance. Real auth persistence is the next step. |
| **30-Day Family Plan** | Post-score checklist with voice narration, token rewards, Mila trial CTA and links into Shopping Hygiene, Learning Path, Daily Challenge and Kids Mode. |
| **Inflation** | Interactive calculator with Recharts chart. Three scenarios: cash / saving habit / educated investor. |
| **Shopping Hygiene** | Purchase regret analyzer with return / sell / pause / keep decision, unused-items cash recovery and advertising hygiene reset. |
| **Daily Shopping List** | Daily grocery / hygiene / home shopping list with impulse-pause prompts, checklist rewards and read-aloud support. |
| **Receipt & Invoice Analyzer** | Static demo module for pasted receipt/invoice OCR text plus photo/screenshot preview: compares purchases with the shopping list, flags needed vs impulse items and summarizes expense categories. |
| **6-Jar Automation** | Eker-style 6-jar income split with practical setup guidance: 6 bank subaccounts, recurring payday transfers, habit discipline and a safe Open Banking roadmap. |
| **Financial Crisis Plan** | Adult-only hidden/conditional path with emergency contacts, local support search, debt-help steps and copyable request templates. |
| **Job Recovery** | Conditional income-recovery path after job or business loss: paste CV, name strengths, prepare a LinkedIn/network message and use job portals. |
| **Learning Path** | 8 stages: Mindset → Saving Habit → Inflation → Credit → Emergency Fund → Investing → Retirement → Family Plan. |
| **AI Coach** | Mila uses Claude Haiku when `ANTHROPIC_API_KEY` is configured, OpenRouter when `OPENROUTER_API_KEY` is configured, and falls back to predefined replies when neither is available. |
| **Premium Voice Trial** | Product direction: limited 7-day Mila Voice Coach trial, then Premium Family with fair-use controls for AI/TTS/OCR. |
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
  shopping/             — Shopping Hygiene purchase analyzer
  crisis/               — Adult Financial Crisis Plan
  learn/                — Learning path
  coach/                — AI Coach chat
  quiz/                 — Quiz system
  rewards/              — Tokens and NFT certificates
  kids/                 — Kids mode
  accessibility/        — Accessibility mode
  partner/              — B2B Partner Portal
  layout.tsx
  providers.tsx         — Solana Wallet Adapter

Standalone prototype:

  CoachFI_DemoDay.html  — safe static HTML demo connecting the simplified product loop, Adult Mode, Kids Mode, Daily Shopping List, Receipt & Invoice Analyzer, Shopping Hygiene, Eker jars and Crisis Plan.

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
