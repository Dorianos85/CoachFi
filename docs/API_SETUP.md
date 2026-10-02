# Coach FI API setup

Coach FI uses external services for AI, voice, leaderboard and minting. AI chat reports a
configuration error when no chat provider key is set; other features retain their existing fallbacks.

## 1. Prepare env

Copy `.env.example` to `.env.local` and paste real values:

```bash
copy .env.example .env.local
```

Never share `.env.local` and never paste API keys into chat.

## 2. AI Coach: Cerebras primary and Groq fallback

Server-only keys (no `NEXT_PUBLIC_` prefix):

```bash
CEREBRAS_API_KEY=
GROQ_API_KEY=
CHAT_MAX_COMPLETION_TOKENS=2048
```

`/api/chat` streams Cerebras `gpt-oss-120b` and uses Groq `openai/gpt-oss-120b`
for transient failures before streaming starts. Missing primary configuration uses Groq.
Missing both keys returns a readable configuration error. The Mila prompt and consent guards remain intact.

## 3. Vercel environments and verification

In project **coach-fi**, set both keys for **Preview** and **Production**, then redeploy.
Also set **Development** if using Vercel's local environment workflow; otherwise use `.env.local`.
Read [AI_CHAT.md](AI_CHAT.md) for exact APIs, timeouts, logging, tests and controlled fallback verification.
Anthropic/OpenRouter settings are no longer used by chat.

## 4. ElevenLabs voice

Required:

```bash
ELEVENLABS_API_KEY=
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

Optional locale-specific voices for the simplified multilingual demo:

```bash
ELEVENLABS_PL_VOICE_ID=
ELEVENLABS_EN_VOICE_ID=
ELEVENLABS_JA_VOICE_ID=
```

`/api/tts` keeps API keys server-side, accepts only short text snippets up to
500 characters, and falls back to browser `speechSynthesis` when ElevenLabs is
not configured or the API fails. The demo supports only Polish, English and
Japanese, with no microphone input or realtime voice agent.

## 5. Supabase leaderboard

1. Create a Supabase project.
2. Run `supabase/leaderboard.sql` in Supabase SQL Editor.
3. Add:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_LEADERBOARD_TABLE=leaderboard
```

Use `SUPABASE_SERVICE_ROLE_KEY` only on the server. It must never be exposed in client code.

## 6. Solana Devnet NFT minting

Required:

```bash
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_MINT_KEYPAIR=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Generate and fund a Devnet mint authority:

```bash
solana-keygen new --outfile mint-keypair.json
solana airdrop 2 $(solana-keygen pubkey mint-keypair.json) --url devnet
```

Paste the JSON byte array from `mint-keypair.json` into `SOLANA_MINT_KEYPAIR`.
Coach FI now serves NFT metadata at `/nft-metadata/[certificateName]`.

## 7. Verify

```bash
npm run api:check
npm run check
npm run dev
```

Then open:

```text
http://localhost:3000/api/status
http://localhost:3000/coach
http://localhost:3000/accessibility
http://localhost:3000/rewards
```
