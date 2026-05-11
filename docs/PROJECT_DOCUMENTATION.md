# Coach FI - project documentation

Review date: 2026-05-08

## Product summary

Coach FI is a hackathon MVP for the Solana Colosseum Frontier Hackathon 2026. It is an AI-powered financial education coach for adults, children and visually impaired users.

It helps users change their money mindset, understand saving, inflation, credit, interest rates, emergency funds, retirement planning and long-term investing basics.

The app diagnoses the user's financial situation, shows how inflation reduces purchasing power, explains the core concepts, then guides the user through gamified learning stages.

Users earn Coach FI Tokens for completing lessons and quizzes. After each stage, they can mint an NFT certificate on Solana as proof of financial education progress.

Coach FI does not teach trading, leverage, futures or speculation. The purpose is to build financial confidence, healthy habits and long-term awareness, not to encourage risky investing.

Crypto may appear only as a later educational module, but it is not part of the core MVP. Solana is used in this MVP as proof-of-progress infrastructure for tokens and certificates.

Coach FI is not a trading app. It is not a financial advice app. It is a behaviour-change platform for financial education, saving habits and long-term financial awareness.

## Current status

The project is a complete frontend MVP built with Next.js, TypeScript and Tailwind CSS. The code is now organized around Next.js App Router pages, reusable components, mock data modules and small domain helpers.

There is no production backend, banking integration or real financial account connection.

## Tech stack

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui-style local components
- Framer Motion
- Recharts
- Lucide React
- Solana wallet adapter provider/modal on Devnet
- Local React state and mock data

## Project structure

```text
CoachFI/
  app/
    page.tsx
    layout.tsx
    globals.css
    providers.tsx
    accessibility/
      page.tsx
    coach/
      page.tsx
    health-check/
      page.tsx
    inflation/
      page.tsx
    kids/
      page.tsx
    learn/
      page.tsx
    quiz/
      page.tsx
    rewards/
      page.tsx
  components/
    AccessibilityToggle.tsx
    AppNavigation.tsx
    CoachAvatar.tsx
    FinancialScoreCard.tsx
    InflationChart.tsx
    NFTCertificateCard.tsx
    ProgressPath.tsx
    QuizCard.tsx
    SectionHeader.tsx
    TokenRewardCard.tsx
    read-aloud-button.tsx
    ui/
      badge.tsx
      button.tsx
      card.tsx
      dialog.tsx
      progress.tsx
  data/
    certificates.ts
    lessons.ts
    mockUser.ts
    quizQuestions.ts
  lib/
    inflation.ts
    numerology.ts
    solanaMock.ts
    utils.ts
  public/
    coach-fi-avatar.svg
  docs/
    DOCUMENTATION_ANALYSIS.md
    MVP_SPEC.md
    PROJECT_DOCUMENTATION.md
    source/
      CoachFI-final-7slides.pptx
      CoachFI-final-7slides-duplicate-original-name.pptx
      CoachFI-pitch-deck-9slides.pptx
  tools/
    check.mjs
  README.md
```

## Routes

- `/` - Welcome screen with Coach FI tagline, user modes and CTA.
- `/health-check` - Financial Health Check form and score.
- `/inflation` - Inflation Reality Check calculator and chart.
- `/learn` - Learning Path Dashboard with progress and rewards.
- `/coach` - AI Coach Chat mock interface.
- `/quiz` - Quiz with token reward.
- `/rewards` - Coach FI Tokens, NFT certificate cards and mock Devnet mint flow.
- `/kids` - Kids Mode with saving jar and stars.
- `/accessibility` - Accessibility Mode plus Numerology Bonus section.

## Key components

- `CoachAvatar.tsx` - friendly AI coach avatar card.
- `ProgressPath.tsx` - eight-stage learning path with progress bars.
- `FinancialScoreCard.tsx` - score out of 100 plus recommended action.
- `InflationChart.tsx` - Recharts line chart for inflation scenarios.
- `QuizCard.tsx` - interactive quiz card.
- `TokenRewardCard.tsx` - mock Coach FI Token balance card.
- `NFTCertificateCard.tsx` - reusable NFT certificate card.
- `AccessibilityToggle.tsx` - high contrast and large text controls.
- `AppNavigation.tsx` - shared responsive navigation, footer disclaimer and Framer Motion route transition.

## Data modules

- `data/mockUser.ts` - Dorian demo profile and user modes.
- `data/lessons.ts` - learning stages, coach replies, kids concepts and voice commands.
- `data/quizQuestions.ts` - quiz content and rewards.
- `data/certificates.ts` - NFT certificate metadata.

## Domain helpers

- `lib/inflation.ts` - real value, purchasing power loss and chart scenario calculations.
- `lib/numerology.ts` - life path number and motivational learning styles.
- `lib/solanaMock.ts` - mock Solana transaction hash and loading helper.
- `lib/utils.ts` - className merge and number/currency formatting.

## Implemented product coverage

- Welcome screen with Adult, Kids and Accessibility modes.
- Financial Health Check with default `42/100` score.
- Inflation calculator with `20,000 PLN`, `5 years`, `7%` default scenario.
- Learning path with eight financial education stages:
  1. Money Mindset
  2. Saving Habit
  3. Inflation & Purchasing Power
  4. Credit, Interest & WIBOR
  5. Emergency Fund
  6. Long-Term Investing Basics
  7. Retirement & Future Security
  8. Family Financial Plan
- Supportive AI coach chat with quick actions.
- Quiz that awards 25 mock Coach FI Tokens.
- Rewards screen with Solana wallet provider/modal and mock NFT mint flow.
- Kids Mode with simple financial language.
- Accessibility Mode with large text, high contrast, read-aloud controls and voice-first placeholder.
- Numerology Bonus as a motivational feature, not financial advice.
- Footer disclaimer across the app.
- Core MVP excludes trading, leverage, futures and speculative investing lessons.

## What is mocked

- Financial account data.
- Coach FI Token balance.
- Quiz reward accounting.
- AI coach answers.
- NFT certificate minting.
- Solana transaction hash.
- Voice command handling.
- Numerology layer.

## What is real

- Next.js frontend routes.
- TypeScript code.
- Responsive Tailwind interface.
- Recharts inflation chart.
- Browser speech synthesis in read-aloud controls when available.
- Solana wallet adapter provider/modal on Devnet for detected standard wallets.
- Local interactive React state.

## How to run

Install dependencies:

```powershell
npm install
```

Run the dev server:

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

If PowerShell blocks `npm.ps1`, use:

```powershell
npm.cmd run dev
```

## Verification commands

```powershell
node tools/check.mjs
npm.cmd run typecheck
npm.cmd run build
npm.cmd run check
```

## Known limitations

- No backend.
- No real bank account integration.
- No persistent user database.
- No production AI safety layer.
- No real token minting yet.
- NFT certificate minting is mocked.
- Voice commands are visual placeholders.
- No formal automated accessibility audit yet.

## Recommended next steps

1. Add end-to-end tests for the routed demo journey.
2. Add a durable state layer for user progress.
3. Add a safe AI tutoring layer with financial education guardrails.
4. Add real Solana Devnet token and certificate minting.
5. Run keyboard-only and screen-reader accessibility QA.
6. Prepare a judge-friendly demo script and short product video.
