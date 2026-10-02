# Mila chat: Cerebras primary, Groq fallback

## Configuration

Only the server reads these keys. Never use a `NEXT_PUBLIC_` prefix or commit real values.

| Variable | Purpose | Local | Vercel Preview | Vercel Production |
| --- | --- | --- | --- | --- |
| `CEREBRAS_API_KEY` | Primary GPT-OSS 120B | `.env.local` | Set in `coach-fi` | Set in `coach-fi` |
| `GROQ_API_KEY` | Fallback GPT-OSS 120B | `.env.local` | Set in `coach-fi` | Set in `coach-fi` |
| `CHAT_MAX_COMPLETION_TOKENS` | Optional total output + reasoning budget, default 2048, clamped to 256–4096 | Optional | Optional | Optional |

Set both keys in Vercel **Development** as well if using `vercel dev` / `vercel env pull`.
Changes to Vercel env variables require a new deployment. Do not copy production keys into test fixtures.
One valid key is sufficient to serve chat. Without Cerebras, configured Groq is used immediately.
Without both, `/api/chat` returns HTTP 503 with `{ error, fallback: true }` and a localized configuration message.
`/api/status` reports chat configuration, not live provider health.

Anthropic and OpenRouter are no longer used by this repository's chat route. Their SDK/settings
(`ANTHROPIC_*`, `OPENROUTER_*`, `AI_PROVIDER`) are obsolete here. Existing remote secrets were not changed.
ElevenLabs and other application services retain their configuration and behavior.

## Verified provider interfaces (2026-10-01)

| Order | Provider | Exact model ID | Chat Completions endpoint |
| --- | --- | --- | --- |
| 1 | Cerebras | `gpt-oss-120b` | `https://api.cerebras.ai/v1/chat/completions` |
| 2 | Groq | `openai/gpt-oss-120b` | `https://api.groq.com/openai/v1/chat/completions` |

The implementation uses native `fetch` with the OpenAI-compatible Chat Completions schema.
Both use `stream: true`, `reasoning_effort: low` and `max_completion_tokens`.
Cerebras uses `reasoning_format: hidden`; Groq GPT-OSS uses `include_reasoning: false`
(its GPT-OSS models do **not** support `reasoning_format`). The parser forwards only `delta.content`.
Reasoning tokens consume the output budget, so the old 600-token setting was replaced with 2048.

Official references:

- [Cerebras OpenAI compatibility](https://inference-docs.cerebras.ai/resources/openai)
- [Cerebras Chat Completions](https://inference-docs.cerebras.ai/api-reference/chat-completions)
- [Cerebras GPT-OSS and reasoning formats](https://inference-docs.cerebras.ai/capabilities/reasoning)
- [Groq GPT-OSS 120B](https://console.groq.com/docs/model/openai/gpt-oss-120b)
- [Groq OpenAI compatibility](https://console.groq.com/docs/openai)
- [Groq reasoning parameters](https://console.groq.com/docs/reasoning)
- [Vercel function duration limits](https://vercel.com/docs/functions/limitations)

## Contract and failure behavior

Requests still accept `{ message, history?, locale? }` or legacy `{ messages, locale? }`.
The system prompt is unchanged, including financial-education restrictions and UI-language instruction.
Origin checks, consent, 20 requests/minute rate limit, 6000-character payload limit,
800-character message limit and six history entries (up to 1000 characters each) remain in place.
Null/malformed input is handled without calling either provider. History system roles and extra fields are discarded.

Successful replies remain a UTF-8 `text/plain` stream with `X-CoachFI-Provider` and `X-CoachFI-Model`.
SSE framing, reasoning and internal metadata are not sent to the frontend.
Before streaming, failures return the existing JSON error shape; validation/consent/rate-limit guards retain their statuses.
Unavailable/configuration responses use HTTP 503. The frontend displays the safe error instead of claiming an offline answer came from AI.
Local educational replies remain available when AI consent is disabled.

Fallback is allowed only **before the first nonempty final-answer content chunk**:

- HTTP 429, 5xx, 408, 402 (quota), or known quota codes (`insufficient_quota`, `quota_exceeded`, `billing_hard_limit_reached`, `credit_limit_exceeded`).
- Network errors, premature EOF or timeout while connecting / awaiting content.
- Missing primary configuration skips directly to Groq.

Invalid request errors, authentication/permission errors, unknown protocol errors and output-limit failures are not retried.
Client cancellation never triggers fallback. There are no same-provider retries or SDK retries:
at most **two upstream attempts**, primary once plus a single recovery attempt on Groq.
No request-header, query or public env switch can force failures or override the provider endpoint.

The Node.js route declares `maxDuration = 60`. Each provider has 15 seconds to produce first content;
both attempts and the entire answer share a 45-second upstream deadline, leaving headroom for Vercel.
Timers abort fetch and body reads; cancellation closes upstream streams. After text has started,
an error terminates that stream. The frontend marks the answer as interrupted and never appends a
second model/offline answer or stores/speaks the partial answer as a completed conversation turn.

Logs contain only `event`, `provider`, `model`, `latency_ms`, `error_category`, `fallback`.
No prompts, user data, provider error bodies, API keys or authorization headers are logged.
`latency_ms` is per attempt and includes streaming time on completion. `fallback` is true when a Groq call was attempted,
including when primary configuration is absent; skipped providers do not count as fallback use.
A fallback forwards the same limited conversation to Groq.

## Local checks and controlled fallback verification

Use Node.js 22.15+ (test loader uses `node:module.registerHooks`; validated with Node 24).
Installation was verified with legacy peer resolution for the existing React/wallet dependency tree:

```sh
npm ci --legacy-peer-deps
npm test
npm run typecheck
npm run build
```

The baseline repository has no `lint` script or ESLint configuration. `npm run lint` cannot run;
do not label type checking as a passed lint run. Tests use Node's built-in runner and the existing TypeScript compiler.
`scripts/test-register.mjs` resolves TS/path aliases and stubs only the Next `server-only` build marker in tests.

Tests inject a fake `fetch` at the server helper boundary: real production provider URLs cannot be replaced by clients.
They cover primary, fallback, both unavailable, network and HTTP failures, first-token and total timeouts,
configuration, request guards, prompt fingerprint, fragmented UTF-8/SSE, cancellation,
no failover after partial streaming, and the actual frontend stream consumer.
These are automated contract/integration tests with mocked upstreams, **not live provider end-to-end tests**.

After configuring keys, verify a Preview deployment before Production:

1. Open `/coach`, grant AI Coach consent and send a synthetic finance-education question in each UI language.
2. In browser Network, confirm `POST /api/chat` succeeds with `text/plain` and provider `cerebras`,
   model `gpt-oss-120b`; confirm progressive display and a complete reply.
3. Use an isolated Preview branch environment with **only Groq configured** and redeploy it.
   Confirm the same frontend flow reports `groq` / `openai/gpt-oss-120b` and displays one answer.
   Do not delete/change production keys or exhaust production quotas to trigger fallback.
4. Keep 429/5xx/timeout fault injection local in the automated tests. No production fault-injection feature is shipped.
5. Promote only after live Preview checks. Verify a synthetic Production question and metadata-only logs.

Deployment credentials and provider keys are required for these live checks. A successful build or mocked test
does not establish that the keys have credit, that the model is enabled on the account or that deployed chat works.
