# Coach FI - Security and Privacy Baseline

Last updated: 2026-05-10

This is an MVP baseline, not final legal advice. Before production, verify the legal text,
controller details, processor agreements, transfer mechanisms and retention periods.

## Data model

- Most user state is stored in browser `localStorage` under `coachfi-*` keys.
- Required consent is stored in `coachfi-consent-v1`.
- Optional external processing is separated into four consents:
  - AI Coach: chat content sent to `/api/chat`.
  - Voice: short click-to-play text snippets sent to `/api/tts`.
  - Leaderboard: display name, score and streak sent to Supabase.
  - Blockchain: wallet address and certificate metadata sent to Solana Devnet.

## API safeguards

- POST endpoints reject cross-origin browser requests using the `Origin` and `Host` headers.
- POST endpoints that process optional AI, leaderboard or blockchain data require an explicit `X-CoachFI-Consent` header.
- `/api/tts` is same-origin, rate-limited and capped at 500 characters per request; playback is only triggered by user clicks.
- API payloads are size-limited and validated before use.
- In-memory rate limits reduce accidental abuse during MVP/dev deployment.
- Server logs avoid recording user messages or financial form values.

## Security headers

Configured in `next.config.mjs`:

- Content Security Policy
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` disabling camera, microphone, geolocation, payment and USB APIs
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`

## Production checklist

- Replace placeholder legal/controller details with real company/contact data.
- Add real authentication before storing sensitive user data server-side.
- Move rate limiting to durable infrastructure such as Redis or an edge provider.
- Configure Supabase Row Level Security and avoid service-role writes from broad endpoints.
- Add signed audit trails for consent changes if regulatory evidence is required.
- Define retention and deletion procedures for Supabase and external AI/TTS vendors.
- Review Solana metadata carefully because public-chain data can be permanent.
