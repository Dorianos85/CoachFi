# Coach FI - Product Architecture 2026

## 1. North Star

Coach FI is a voice-first family financial health app with a simple habit loop:

**free diagnosis -> account + terms -> family score -> daily mission -> Mila voice -> coins/stars -> premium plan**

The product should feel closer to Duolingo than to a finance dashboard. The goal is not to show every tool at once. The goal is to turn household income into a calm system: conscious spending, automatic saving, family education and repeatable money habits.

Detailed product/marketing reset: `docs/PREMIUM_FAMILY_STRATEGY.md`.

## 2. Product Promise

### Adult Mode
For middle-class, upper-middle-class and wealthy adults/families who have income but lack a clear system.

User promise:
- free Financial Health Check as the entry point,
- personal Family Financial Health Score after account + terms acceptance,
- one short daily financial mission,
- clear feedback from Mila,
- coins and streaks for progress,
- shopping, receipt and subscription hygiene,
- Kids Mode for family education,
- levels that prove knowledge,
- optional Solana certificate as proof of learning.

### Kids Mode
For children using the app with a parent or guardian.

User promise:
- simple money lessons,
- stars instead of tokens,
- no wallet,
- no public leaderboard,
- no free-form AI chat,
- voice narration only from safe predefined scripts.

### Accessibility Mode
For blind, low-vision and elderly users.

User promise:
- larger text,
- high contrast,
- voice-first actions,
- no autoplay,
- readable text alternative for every voice interaction.

## 3. Current App Status

### Working
- Next.js 15 app router.
- TypeScript build passes.
- Anthropic Claude chat route is configured.
- ElevenLabs TTS route is configured.
- ElevenLabs ConvAI public widget is reachable.
- Local tokens, streaks, SRS and learning progress work through localStorage.
- 9 UI locales are enabled: Polish, English, Spanish, French, Simplified Chinese, Japanese, Hindi, Brazilian Portuguese and Turkish.
- Quiz questions and voice demo scripts follow the selected locale when localized data exists.
- Solana wallet adapter and mint route exist.
- Kids Mode exists as a separate mode, entered directly from the mode selector.
- Accessibility tools exist.
- Health Check now follows the score-gate demo pattern in the Next.js app: free form first, preview insight, email + Terms/Privacy acceptance, then score, voice narration and trial CTA. Real auth/billing persistence is still next.
- After score unlock, `FamilyActionPlan` shows a concrete 30-day family plan with checklist actions, token rewards, voice narration, links into Shopping Hygiene / Learning Path / Daily Challenge / Kids Mode and the Mila Voice Coach trial.
- Shopping Hygiene, bottle-return counting and the Eker 6-jar planner are part of the adult habit toolkit.
- Daily Shopping List is a recurring habit module: users prepare grocery/hygiene/home lists, check off items, pause before off-list purchases and earn tokens for staying with the plan.
- Receipt & Invoice Analyzer connects the shopping habit to spending analysis: users paste receipt/invoice OCR text, attach a photo/screenshot preview, compare purchases with the list, mark needed vs impulse items and review categories.
- 6-Jar Automation starts as education/manual tracking: recommended bank setup is 6 subaccounts plus recurring payday transfers. Real balances can be added later through read-only Open Banking/AIS after explicit consent.
- Financial Crisis Plan exists as an adult-only conditional path with support contacts, local help search, copyable templates and safe next steps. It should not be promoted in primary navigation for the premium-family ICP.
- Job Recovery is part of the adult crisis path: users can paste a CV, clarify strengths, prepare a network/LinkedIn message, use job portals and complete income-recovery actions. It should appear only after explicit need or Health Check red flags.
- `CoachFI_DemoDay.html` is a standalone static prototype for showing the simplified product direction without changing the Next.js app.

### Needs configuration before distribution
- Supabase leaderboard is not configured yet.
- OpenRouter fallback is not configured yet.
- Solana mint authority needs devnet SOL.
- ElevenLabs signed ConvAI URL requires an API key with `convai_write` permission.

## 4. Simplified Navigation Model

The user should see 5 core destinations first:

1. **Start** - overview and next step.
2. **Financial Health Check** - free diagnosis and account/terms gate for the score.
3. **Daily Challenge** - one question or mission per day.
4. **Family Plan** - jars, shopping hygiene, receipt analysis, Kids Mode entry.
5. **Mila / Rewards** - voice coach trial, coins, levels, certificates and share cards.

Secondary destinations stay available but are not the main product loop:

- Learn
- Review
- Knowledge Cards
- Vault
- Inflation Tool
- Shopping Hygiene
- Daily Shopping List
- Receipt & Invoice Analyzer
- Eker 6-Jar Planner
- 6-Jar Automation / Open Banking roadmap
- Financial Crisis Plan (conditional / hidden)
- Job Recovery after job or business loss (conditional / hidden)
- Accessibility
- Kids
- Partner

## 5. Data Model

MVP storage is local-first.

| Area | Storage | Notes |
|---|---|---|
| User profile | localStorage | Name/goal only, no auth yet. |
| Health Check lead | localStorage now / account later | Free inputs can be local. Final score and plan should require account + Terms/Privacy acceptance. |
| Terms acceptance | account DB later | Store accepted document versions, timestamp and locale. Marketing consent must be separate. |
| Premium entitlement | account DB / billing provider later | Trial limits, renewal state and fair-use controls for voice/AI/OCR. |
| Tokens | localStorage | Adult Mode reward unit. |
| Stars | component/localStorage target | Kids Mode reward unit. |
| Streak | localStorage | Daily activity habit. |
| SRS | localStorage | Review scheduling. |
| Consent | localStorage | Required + optional integrations. |
| Crisis steps | localStorage / component state | Adult-only safe next actions, token rewards and copyable templates. |
| Job recovery | localStorage / component state | CV text, strengths, value proposition, job-search checklist and portal links. |
| Jar subaccounts | localStorage / future Open Banking | Manual/demo balances first; read-only AIS integration later; payment initiation only through licensed providers and explicit consent. |
| Daily shopping list | localStorage / component state | Grocery, hygiene and home items, off-list impulse pause, token rewards. |
| Receipt analysis | component state / future OCR API | Pasted receipt/invoice text is parsed locally in the static demo; file upload is preview-only. Production OCR/vision requires explicit consent and data-retention controls. |
| Leaderboard | Supabase planned | Optional, adult only. |
| Certificates | Solana Devnet | Optional proof of learning. |

Backend is used only for integrations:

- `/api/chat` - AI text coach.
- `/api/tts` - ElevenLabs TTS.
- `/api/mila-token` - ElevenLabs ConvAI signed/public widget bootstrap.
- `/api/leaderboard` - Supabase leaderboard.
- `/api/mint-nft` - Solana certificate mint.
- `/api/status` - diagnostics.

Premium/account backend that still needs design:

- `POST /api/auth/start` - email/magic link or OAuth start.
- `POST /api/consent/accept` - versioned Terms/Privacy/Education disclaimer acceptance.
- `GET /api/entitlements` - free/trial/premium status.
- `POST /api/checkout` - paid plan checkout through a compliant billing provider.
- `POST /api/receipt-ocr` - future OCR/vision endpoint with consent and retention controls.

Mode selection is local-first:

- `coachfi-mode-v1` stores Adult Mode or Kids Mode.
- Adult Mode requires an adult/responsible guardian confirmation.
- Kids Mode is entered directly, with no parent/guardian consent step.
- Kids Mode hides adult primary navigation; `/kids` itself is not gated.

## 6. Kids Mode Safety Rules

Kids Mode must be separated from Adult Mode at product level.

Rules:
- no wallet connect,
- no NFT minting,
- no external leaderboard,
- no free-form AI chat,
- no marketing profiling,
- no child full name required,
- no public sharing by default,
- voice only from predefined scripts,
- parent/guardian gate for optional features.

Recommended entry gate:

1. I am 16 or older.
2. I am a parent/guardian.
3. I am using Kids Mode.

For distribution in Poland/EU, treat users under 16 as requiring parent/guardian consent for personal-data based information society services. This is a product-safety baseline, not legal advice.

## 7. Free Diagnosis, Terms Gate and Premium

The free Health Check is the main acquisition product.

### Public/free

- User enters financial situation without account.
- Coach FI shows a lightweight preview: top risk areas and reassurance.
- No final score yet.

### Account + acceptance

To unlock score and plan:

- user logs in or creates account,
- accepts Terms,
- accepts Privacy Policy,
- confirms educational-only disclaimer,
- optionally consents to marketing in a separate checkbox.

### Paid conversion

After score:

- show 30-day family plan,
- offer 7-day Mila Voice Coach trial,
- limit trial usage to control AI/TTS/OCR cost,
- show clear renewal date, price and cancellation path before payment.

### Premium

Premium Family should include:

- Family Financial Health Score history,
- daily missions,
- Kids Mode,
- shopping and receipt analysis,
- Eker jars and goals,
- Mila voice coach with fair-use,
- certificates and share cards.

Do not promise "unlimited AI" without fair-use language. Public copy can say "premium without daily learning limits"; Terms should define abuse and cost-control boundaries.

## 8. ElevenLabs Strategy

ElevenLabs Scale should be used where it creates differentiation, not noise.

### In product
- Mila reads mission feedback.
- Mila reads quiz questions and explanations.
- Mila explains Health Score and Inflation insights.
- Mila can read Shopping Hygiene decisions for buyer's remorse, returns and unused-item cash recovery.
- Mila can read the Receipt & Invoice Analyzer summary after the user pastes OCR text.
- Mila can read crisis-safe scripts, but crisis support must prioritize human help, emergency contacts and official resources.
- Accessibility Mode uses large voice actions.
- Kids Mode uses safe narrated scripts.

### In marketing
Use the same Mila voice style for short educational content:

- "Inflation in 30 seconds"
- "Daily money mistake"
- "Should I return this purchase?"
- "One quiz before you trade"
- "What is an emergency fund?"
- "Kids ask: why save money?"

Trading-channel positioning:

> Before trading, build financial foundations: emergency fund, inflation awareness, compound interest, risk and behavior.

Coach FI should not be marketed as a trading app.

## 9. Integration Fallbacks

Every external service must fail gracefully.

| Service | Primary | Fallback |
|---|---|---|
| Anthropic | Streaming coach reply | OpenRouter or safe error/fallback copy |
| OpenRouter | Optional AI fallback | Anthropic first if configured |
| ElevenLabs TTS | MP3 stream | Browser speechSynthesis |
| ElevenLabs ConvAI | Signed URL/public widget | Text chat page |
| Open Banking/AIS | Read-only account/subaccount balances through licensed provider | Manual balance entry and reminders |
| Supabase | Global leaderboard | Local/demo leaderboard |
| Solana | Devnet certificate mint | Mock certificate transaction |

## 10. Distribution MVP

A distribution-ready MVP should focus on:

- free Financial Health Check as the primary CTA,
- account + Terms gate before showing the final score,
- one daily challenge after the score,
- a daily shopping-list habit to reduce impulse spending,
- a receipt/invoice review step to compare real purchases with the plan,
- coins and streaks,
- shareable achievement cards,
- Mila voice feedback,
- a simple impulse-spending and unused-items recovery tool,
- bottle-return counting and the Eker 6-jar income split,
- an adult-only Financial Crisis Plan that routes users toward human support and official free help, hidden unless triggered,
- a Job Recovery checklist for users who lost employment or business income, hidden unless triggered,
- Kids Mode separated enough to be safe,
- clear disclaimer: educational only, no investment advice.

Do not launch with all advanced pages promoted equally.

## 11. Next Engineering Sprint

Priority order:

1. Make Financial Health Check the primary CTA on Home.
2. Add account/Terms gate before showing score in production.
3. Hide Crisis and Job Recovery from primary nav; trigger from low score/explicit help.
4. Add trial entitlement model for Mila Voice Coach.
5. Persist Kids stars in localStorage/account.
6. Add adult levels based on coins + completed quizzes.
7. Add share cards for score, daily challenge and level-up.
8. Configure billing provider or mock entitlement for demo.
9. Configure Supabase leaderboard only if it supports the premium loop.
10. Add OpenRouter fallback key.
11. Fund Solana Devnet mint authority.
12. Request/enable ElevenLabs `convai_write` permission.
13. Hide experimental tools from main nav if they distract from the diagnosis-to-plan loop.

## 12. Definition of Done for Public Beta

- New user understands what to do within 10 seconds.
- Home page points to free Financial Health Check.
- Final score is gated behind account + accepted current Terms/Privacy versions.
- Mobile nav has max 5 primary actions.
- User can complete a daily mission in under 2 minutes.
- User receives coins/stars immediately.
- User sees a next level or next reward.
- User can share progress without exposing private financial data.
- Kids Mode does not expose wallet, leaderboard or free-form AI.
- Crisis Plan is adult-only, hidden from primary mobile navigation and never frames urgent mental-health support as a token game.
- Job Recovery actions should never promise employment or income.
- App builds cleanly with `npm run build`.
- App has clear privacy, terms and educational disclaimer.
