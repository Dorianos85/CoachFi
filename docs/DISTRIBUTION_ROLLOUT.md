# Coach FI - Distribution Rollout Plan

## Goal

Ship a calmer, simpler Coach FI that can be promoted publicly and tested with real users.

The product should not look like a hackathon feature list. It should look like a premium family financial health product.

Primary public loop:

1. Free Financial Health Check.
2. Account + Terms/Privacy acceptance to unlock score.
3. Family Financial Health Score.
4. 30-day plan.
5. Mila Voice Coach trial.
6. Premium Family habit system.

## Phase 0 - Current verified state

Verified locally:

- `npm run api:check`
- `npm run typecheck`
- `npm run build`

Current integration status:

- Anthropic: configured.
- ElevenLabs TTS: configured.
- ElevenLabs ConvAI public widget: reachable.
- ElevenLabs signed ConvAI URL: blocked by missing `convai_write` permission.
- OpenRouter: key missing.
- Supabase leaderboard: missing URL/key.
- Solana mint: key configured but mint authority needs devnet SOL.

## Phase 1 - Simplify the product loop

Target loop:

1. Start page points to free diagnosis.
2. User completes Health Check.
3. User accepts Terms/Privacy to unlock the score.
4. Mila reads feedback.
5. User receives 30-day plan and starts one challenge.
6. User can try Mila Voice Coach trial.
7. User sees level progress and can share progress.

Keep main navigation small:

- Start
- Diagnosis
- Daily
- Plan
- Kids
- Mila / Rewards

Move everything else to secondary navigation.

## Phase 2 - Adult Mode

Adult Mode should include:

- Financial Health Check as the first action
- account/terms gate before final score in production
- Daily Challenge
- Quiz
- Review
- Learning Path
- Health Check
- Inflation tool
- Shopping Hygiene tool for buyer's remorse, returns and unused-item cash recovery
- Mila AI Coach
- Rewards and certificates
- Optional leaderboard
- Optional Solana certificate
- Hidden Crisis / Job Recovery path triggered by low score or explicit help

Adult Mode should never promise returns or financial advice.

## Phase 3 - Kids Mode

Kids Mode should include:

- stars,
- simple modules,
- safe voice narration,
- parent/guardian framing,
- no wallet,
- no public leaderboard,
- no free-form AI chat,
- no public sharing by default.

Implemented baseline:

- Mode selection appears after required terms/privacy consent.
- `coachfi-mode-v1` stores Adult Mode or Kids Mode.
- Adult Mode requires adult/responsible guardian confirmation.
- Kids Mode requires parent/guardian name and consent.
- If mode is `kids`, the primary navigation is reduced to Kids Mode and adult onboarding/notifications are hidden.

## Phase 4 - ElevenLabs promotion engine

Use ElevenLabs for product and content distribution.

### Product voice moments

- Health Score explanation.
- 30-day Family Plan explanation.
- Welcome from Mila.
- Daily Challenge feedback.
- Score narration.
- Quiz question narration.
- Inflation explanation.
- Shopping Hygiene decision: return, sell, pause or keep.
- Kids star celebration.
- Level-up celebration.

### YouTube / Shorts formats

- Mila explains one financial concept in 30 seconds.
- Daily money quiz.
- Should I return this purchase?
- Before trading: one foundation you need.
- Parent/child money lesson.
- Inflation myth vs reality.

## Phase 5 - Public beta checklist

Before public beta:

- Health Check is the main CTA.
- Final score is gated behind account + accepted current Terms/Privacy versions.
- Trial and premium copy show limits, price, renewal date and cancellation path clearly.
- Crisis Plan and Job Recovery are hidden from main nav and trigger only from low score or explicit help.
- Supabase leaderboard configured or hidden.
- OpenRouter configured or docs say Anthropic-only.
- Devnet mint authority funded or certificate mint hidden.
- ElevenLabs agent permission clarified.
- Mode gate implemented.
- Kids Mode separated.
- Share cards tested on mobile.
- Terms/privacy reviewed.
- Demo data clearly marked.

## What not to do now

- Do not add more dashboards.
- Do not add more languages beyond the current 9 before PL/EN are polished.
- Do not promote Partner Portal in consumer nav.
- Do not promote Crisis/Job Recovery as the main product promise.
- Do not make Kids Mode depend on blockchain.
- Do not make AI voice autoplay.
- Do not call Coach FI a trading product.
- Do not use dark-pattern trial mechanics.
