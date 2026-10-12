# Coach FI - Launch QA Checklist

Date: 2026-06-10

Use this checklist before every public demo, user test and paid launch.

## 1. Smoke Tests

- `npm run typecheck` passes.
- `npm run build` passes.
- `/` returns HTTP 200.
- `/health-check` returns HTTP 200.
- `/kids` returns HTTP 200.
- `/coach` returns HTTP 200.
- `/accessibility` returns HTTP 200.
- `/crisis` returns HTTP 200, but is not visible in primary consumer navigation.

## 2. Free Diagnosis Funnel

- Home page leads primarily to the free Financial Health Check.
- User can complete the Health Check without an account.
- Before unlock, the app shows only preview insights, not the final score.
- Final score unlock requires an email-like login value.
- Final score unlock requires Terms/Privacy/educational disclaimer acceptance.
- Marketing consent is separate and optional.
- After unlock, the user sees score, voice narration, a 30-day family checklist, token rewards and Mila trial CTA.
- Completed family-plan actions add tokens only once per action on the device.
- Low score can surface the free crisis path.
- Normal score does not promote crisis support.

## 3. Premium and Trial Safety

- Trial copy shows that it is limited.
- Premium copy says no daily learning limits, not literal unlimited API usage.
- Fair-use language exists for AI, TTS and OCR costs.
- Pricing, renewal date and cancellation route must be visible before real payment launch.
- No prechecked paid or marketing consent boxes.
- No countdown or false urgency unless it is real.

## 4. Kids Mode

- Kids Mode is separated from Adult Mode.
- Parent/guardian consent is required for Kids Mode on the device.
- Kids Mode does not show wallet, NFT minting, leaderboard or free-form AI chat.
- Kids rewards are stars, not investment/trading tokens.
- Voice in Kids Mode uses safe predefined scripts.
- Child-facing text avoids trading, leverage and speculative language.

## 5. Voice and Accessibility

- ElevenLabs `/api/tts` returns audio when the key is configured.
- Browser `speechSynthesis` fallback works when ElevenLabs fails or the key is missing.
- Voice buttons can stop the same currently playing text.
- Accessibility page has large voice buttons and readable equivalent text.
- Text scaling does not cut off labels.
- High contrast mode keeps readable text on white and pastel surfaces.
- No autoplay voice.

## 6. Localization

- Selected language changes navigation, quiz, coach copy and voice script where localized data exists.
- Polish pages use Polish copy.
- English pages use English copy.
- Missing locale content falls back predictably and should be flagged before public release.
- Language selector shows country/language markers consistently.

## 7. Family Product Fit

- Messaging targets families/professionals with income but no calm system.
- Public pitch does not lead with debt rescue.
- Crisis and job recovery are hidden/conditional safety paths.
- Product does not look like a trading app.
- Daily challenge, coins/stars, levels and certificates are visible as habit loops.
- Shopping hygiene and receipt analysis support impulse-spending reduction.

## 8. Legal and Data

- Terms, Privacy and educational disclaimer versions are tracked in production.
- User can access consent settings.
- Optional marketing consent can be withdrawn.
- Receipt/CV uploads need explicit consent and retention rules before production.
- Open Banking/AIS integration must be read-only first and use a licensed provider.
- Coach FI does not provide personalized investment recommendations.

## Current Local Verification

Verified on 2026-08-31:

- `npm run typecheck`: passed.
- `npm run test`: passed, 19 unit tests.
- `npm run e2e`: passed, 6 Playwright tests.
- `npm run build`: passed.
- `npm run api:check`: Anthropic Claude, ElevenLabs TTS and Supabase configured.
- `npm run api:check`: OpenRouter key, ElevenLabs ConvAI signed URL permission and Solana Devnet SOL funding still need action before they are real production features.
- Local HTTP check: `/`, `/health-check`, `/challenge`, `/coach`, `/kids`, `/shopping`, `/learn`, `/quiz`, `/accessibility`, `/crisis`, `/terms`, `/privacy` returned 200.
- Health Check page includes locked-score markup before unlock.
- Health Check E2E covers free diagnosis, locked score, email + consent unlock, family action plan, trial CTA, token checklist updates and conditional crisis link.
- Crisis route works but remains a contextual safety path instead of primary consumer navigation.
