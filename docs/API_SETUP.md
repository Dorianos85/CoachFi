# Coach FI API setup

Coach FI is wired to five external services. The app keeps working without them, but those
features use local/mock fallback until keys are configured.

## 1. Prepare env

Copy `.env.example` to `.env.local` and paste real values:

```bash
copy .env.example .env.local
```

Never share `.env.local` and never paste API keys into chat.

## 2. Anthropic Claude for Mila

Required:

```bash
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
ANTHROPIC_MAX_TOKENS=256
```

`/api/chat` streams Claude responses when the user grants AI Coach consent.
Without the key, Coach FI tries OpenRouter if configured and otherwise falls back to predefined educational replies.

## 3. OpenRouter AI fallback/provider

Optional:

```bash
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/auto
OPENROUTER_MAX_TOKENS=256
AI_PROVIDER=
```

By default `/api/chat` tries Anthropic first, then OpenRouter. Set `AI_PROVIDER=openrouter`
to try OpenRouter first.

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
