# Coach FI — Architecture & Documentation

> **Stack**: Next.js 15 · TypeScript 5 · Tailwind CSS · Framer Motion  
> **Blockchain**: Solana Devnet · Metaplex Umi Core · Wallet Adapter  
> **AI**: Anthropic Claude Haiku (streaming) · OpenRouter fallback/provider · ElevenLabs TTS  
> **Backend**: Supabase (leaderboard) · Next.js API Routes  
> **Storage**: `localStorage` (all user state, no auth required)

---

## 1. Project Overview

Coach FI is a financial education PWA targeting the Colosseum hackathon. It combines:

- A **spaced-repetition quiz system** (SM-2 algorithm) with 8 progressive learning stages
- An **AI coach "Mila"** powered by Claude Haiku with streaming responses, optional OpenRouter fallback/provider, and ElevenLabs voice
- **NFT certificates** minted on Solana Devnet (Metaplex Core) as proof of learning
- A **global leaderboard** backed by Supabase with local fallback
- A **personalizable avatar** with financial shield (hexagonal radar chart)
- Three user modes: Adult, Kids, Accessibility
- Full i18n: English, Polish, Spanish, French, Simplified Chinese, Japanese, Hindi, Brazilian Portuguese and Turkish

All user data is stored in `localStorage` — no account required. External services (Anthropic, OpenRouter, ElevenLabs, Supabase, Solana) degrade gracefully when API keys are absent.

---

## 2. Directory Structure

```
coach-fi/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout: metadata, AppNavigation wrapper
│   ├── page.tsx                  # Home page — hero, feature cards, mode selector
│   ├── providers.tsx             # Client providers tree
│   ├── globals.css               # Global styles + Tailwind base
│   ├── manifest.ts               # PWA web manifest
│   │
│   ├── health-check/page.tsx     # Financial Health Score quiz (10 questions)
│   ├── learn/page.tsx            # ProgressPath — 8-stage learning roadmap
│   ├── quiz/
│   │   ├── page.tsx              # Quiz with challenge banner + social share
│   │   └── layout.tsx            # Open Graph metadata for quiz share links
│   ├── review/page.tsx           # SRS review session (due cards)
│   ├── cards/page.tsx            # Flashcard browser — all 29+ knowledge cards
│   ├── coach/page.tsx            # AI chat with Mila (streaming + fallback)
│   ├── rewards/page.tsx          # Token balance + NFT certificate minting
│   ├── avatar/page.tsx           # Avatar builder + ElevenLabs voice selector
│   ├── achievement/
│   │   ├── page.tsx              # Shareable achievement card + Canvas PNG download
│   │   └── layout.tsx            # Open Graph metadata for achievement share links
│   ├── challenge/page.tsx        # Daily challenge — 1 question per day
│   ├── inflation/page.tsx        # Interactive inflation calculator + chart
│   ├── kids/page.tsx             # Simplified kids mode
│   ├── accessibility/page.tsx    # Accessibility settings page
│   ├── partner/page.tsx          # Sponsor/partner info page
│   │
│   └── api/
│       ├── chat/route.ts         # POST — Claude Haiku / OpenRouter chat
│       ├── tts/route.ts          # POST — ElevenLabs TTS audio stream
│       ├── leaderboard/route.ts  # GET/POST — Supabase leaderboard
│       └── mint-nft/route.ts     # POST — Metaplex Core NFT mint on Devnet
│
├── components/
│   ├── AppNavigation.tsx         # Shell: header, sidebar, mobile nav, footer
│   ├── SectionHeader.tsx         # Page header with eyebrow + ReadAloudButton
│   ├── QuizCard.tsx              # Quiz UI with SRS recording + VoiceButton
│   ├── ProgressPath.tsx          # 8-stage learning path with lock/unlock logic
│   ├── Leaderboard.tsx           # Global/Local tab toggle with Supabase data
│   ├── AvatarDisplay.tsx         # SVG avatar figure + hexagonal financial shield
│   ├── VoiceButton.tsx           # Voice play/stop button (icon, pill, large variants)
│   ├── read-aloud-button.tsx     # ReadAloud button used in SectionHeader
│   ├── SocialShare.tsx           # Web Share API + Twitter/WhatsApp/copy fallbacks
│   ├── OnboardingModal.tsx       # First-run name + goal setup
│   ├── NotificationBanner.tsx    # Push notification permission prompt
│   ├── StreakBadge.tsx           # Daily streak counter (fire emoji + count)
│   ├── LanguageSwitcher.tsx      # 9-language dropdown with country flags
│   ├── AccessibilityToggle.tsx   # High contrast + 3-level text scale controls
│   ├── InflationChart.tsx        # Recharts line chart for inflation data
│   ├── FinancialScoreCard.tsx    # Score display card
│   ├── TokenRewardCard.tsx       # Token balance display
│   ├── NFTCertificateCard.tsx    # Certificate card with lock/unlock state
│   ├── CoachAvatar.tsx           # Mila avatar bubble
│   ├── ShareScoreCard.tsx        # Score sharing card
│   └── ui/                       # Radix UI primitives
│       ├── button.tsx            # Button with variants (default/outline/ghost)
│       ├── badge.tsx             # Badge component
│       ├── card.tsx              # Card container
│       ├── dialog.tsx            # Modal dialog (Radix Dialog)
│       └── progress.tsx          # Progress bar (Radix Progress)
│
├── context/
│   ├── LanguageContext.tsx       # i18n locale state + translations provider
│   ├── StreakContext.tsx          # Daily streak state with localStorage sync
│   └── VoiceContext.tsx          # ElevenLabs voice selection + speak/stop API
│
├── lib/
│   ├── srs.ts                    # SM-2 spaced repetition algorithm
│   ├── learningProgress.ts       # Stage unlock logic (SRS + manual overrides)
│   ├── streak.ts                 # Streak calculation (daily active tracking)
│   ├── user.ts                   # User profile read/write (localStorage)
│   ├── avatar.ts                 # Avatar data types + localStorage
│   ├── allQuestions.ts           # Flat list of all question IDs for SRS
│   ├── inflation.ts              # Inflation data + calculation helpers
│   ├── solanaMock.ts             # Mock transaction hash generator (fallback)
│   ├── notifications.ts          # Push notification helpers
│   ├── numerology.ts             # Financial health score calculation
│   ├── utils.ts                  # cn() — clsx + tailwind-merge
│   └── i18n/
│       ├── index.ts              # Re-exports + locale metadata
│       ├── en.ts                 # English translations (canonical type source)
│       ├── pl.ts                 # Polish translations
│       └── es.ts                 # Spanish translations
│
├── data/
│   ├── quizQuestions.ts          # 29+ questions across 8 categories
│   ├── challengeQuestions.ts     # Daily challenge question bank
│   ├── storyCards.ts             # Knowledge flashcard content
│   ├── certificates.ts           # NFT certificate definitions
│   ├── lessons.ts                # AI coach intents + quick replies
│   └── mockUser.ts               # Static mock user data (financial snapshot)
│
├── public/
│   ├── sw.js                     # Service worker (PWA offline cache)
│   └── coach-fi-avatar.svg       # Coach avatar SVG asset
│
├── .env.local                    # Environment variables (not committed)
├── next.config.mjs               # Webpack fallbacks for Solana browser bundle
├── tailwind.config.ts            # Design tokens
└── tsconfig.json                 # TypeScript strict mode, path alias @/*
```

---

## 3. Provider Tree

```
<LanguageProvider>           # i18n — locale + translations
  <ConsentProvider>          # Terms/privacy + optional external-service consent
    <StreakProvider>         # Daily streak state
      <VoiceProvider>        # ElevenLabs voice settings + browser fallback
        <ConnectionProvider> # Solana RPC (Devnet)
          <WalletProvider>   # Wallet Adapter (auto-connect off)
            <WalletModalProvider>
              <AppNavigation># Shell (header + sidebar + mobile nav)
                {children}   # Page content
              </AppNavigation>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </VoiceProvider>
    </StreakProvider>
  </ConsentProvider>
</LanguageProvider>
```

---

## 4. localStorage Schema

All client state lives in `localStorage`. No server-side sessions.

| Key | Type | Owner | Content |
|-----|------|-------|---------|
| `coachfi-user` | `UserProfile` | `lib/user.ts` | `{ name, goal, setupDone }` |
| `coachfi-srs` | `SRSCard[]` | `lib/srs.ts` | SM-2 card state per question ID |
| `coachfi-streak` | `StreakData` | `lib/streak.ts` | `{ lastActiveDate, currentStreak, longestStreak }` |
| `coachfi-learn-manual` | `Record<string, "started"\|"completed">` | `lib/learningProgress.ts` | Manual stage overrides |
| `coachfi-locale` | `"en"\|"pl"\|"es"\|"fr"\|"zh"\|"ja"\|"hi"\|"pt-BR"\|"tr"` | `context/LanguageContext.tsx` | Selected language |
| `coachfi-voice` | `string` (voice ID) | `context/VoiceContext.tsx` | Selected ElevenLabs voice |
| `coachfi-avatar` | `AvatarData` | `lib/avatar.ts` | `{ gender, style }` |
| `coachfi-consent-v1` | `ConsentRecord` | `context/ConsentContext.tsx` | Required terms/privacy acceptance + optional AI/voice/ranking/blockchain consents |

---

## 5. API Routes

### `POST /api/chat`
**AI Coach Mila** — Claude Haiku streaming, OpenRouter fallback/provider

```typescript
Request:  { message: string, history: { role, content }[] }
Response: text/plain chunked stream (text deltas)
          OR { error, fallback: true } → 503 if provider key missing
```

- Model: `claude-haiku-4-5-20251001`
- Max tokens: 256 (concise 2–4 sentence answers)
- Context window: last 6 turns (`history.slice(-6)`)
- System prompt: Mila persona, multilingual, no investment advice
- Provider order: `AI_PROVIDER=openrouter` forces OpenRouter first; otherwise Anthropic is tried first and OpenRouter second.
- Env: `ANTHROPIC_API_KEY`, optional `ANTHROPIC_MODEL`, `ANTHROPIC_MAX_TOKENS`
- OpenRouter env: `OPENROUTER_API_KEY`, optional `OPENROUTER_MODEL`, `OPENROUTER_MAX_TOKENS`

---

### `POST /api/tts`
**ElevenLabs Text-to-Speech**

```typescript
Request:  { text: string (max 500 chars), locale?: "pl" | "en" | "ja", voiceId?: string, modelId?: string }
Response: audio/mpeg stream
          OR { error, fallback: true } if env/API fails
```

- Model: `ELEVENLABS_MODEL_ID` or `eleven_multilingual_v2` (multilingual demo voice)
- Voice settings: `stability: 0.5, similarity_boost: 0.75`
- Env: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL_ID`, optional `ELEVENLABS_PL_VOICE_ID`, `ELEVENLABS_EN_VOICE_ID`, `ELEVENLABS_JA_VOICE_ID`
- Available voices: Rachel, Bella, Domi (female) · Adam, Antoni, Josh (male)
- Playback is click-to-play only. `VoiceProvider` uses browser speech if `/api/tts` fails.

---

### `GET /api/leaderboard`
**Read top 20 scores from Supabase**

```typescript
Response: { entries: LeaderboardEntry[], configured: boolean }
```

Returns `configured: false` (with empty entries) when Supabase env vars are absent — UI shows local fallback players.

---

### `POST /api/leaderboard`
**Upsert user score**

```typescript
Request:  { name: string, score: number, streak: number }
Response: { ok: true, updated: boolean }
```

Matches by name (case-insensitive `ilike`). Only updates if new score > existing score — never downgrades.

---

### `POST /api/mint-nft`
**Mint NFT certificate on Solana Devnet**

```typescript
Request:  { recipientAddress: string, certificateName: string, userName: string, score: number }
Response: { ok: true, txHash: string, assetAddress: string, explorerUrl: string }
          OR { fallback: true } → 503/500 if keypair missing or error
```

- Uses Metaplex Core (`mplCore`) — compressed NFT standard
- Attributes plugin: `certificate`, `user`, `score`, `platform`, `network`, `issuedAt`
- Env: `SOLANA_MINT_KEYPAIR` (JSON array of byte numbers), optional `SOLANA_RPC_URL`, `NEXT_PUBLIC_APP_URL`
- NFT metadata is served by the app at `/nft-metadata/[certificateName]`

---

## 6. SM-2 Spaced Repetition Algorithm

`lib/srs.ts` implements the SM-2 algorithm (same core as Duolingo/Anki):

```
Initial card: interval=1, repetitions=0, easeFactor=2.5

On CORRECT answer:
  if reps == 0: interval = 1 day
  if reps == 1: interval = 6 days
  if reps >= 2: interval = round(interval × easeFactor)
  easeFactor += 0.1 - (5 - quality) × (0.08 + (5 - quality) × 0.02)
  easeFactor = max(1.3, easeFactor)
  repetitions += 1

On WRONG answer:
  repetitions = 0, interval = 1
  easeFactor = max(1.3, easeFactor - 0.2)
```

**Due logic**: A card is due if `nextReview <= today`. New unseen cards (up to 5/day) are shown after all due cards.

**Mastery levels** (used in UI):
| Level | Repetitions | Label |
|-------|-------------|-------|
| 0 | 0 | New |
| 1 | 1 | Learning |
| 2 | 2–3 | Familiar |
| 3 | 4–6 | Practiced |
| 4 | 7+ | Mastered |

---

## 7. Learning Stage Unlock Logic

`lib/learningProgress.ts` maps 8 stages to question ID arrays:

```
money-mindset     → 5 questions
saving-habit      → 6 questions
inflation         → 6 questions
credit-rates      → 6 questions
emergency-fund    → 4 questions
long-term-investing → 9 questions
retirement        → 3 questions
family-plan       → 3 questions
```

**Unlock rules** (single-pass, no recursion):

1. If `repetitions >= 80%` of stage questions OR manually marked completed → `"completed"`
2. If any SRS progress OR manually started → `"inProgress"`
3. If first stage (index 0) → `"current"` (always unlocked)
4. If previous stage has any SRS progress OR manual override → `"current"`
5. Otherwise → `"locked"`

**Manual overrides** (`coachfi-learn-manual`) allow marking stages started/completed independently of SRS — used when a user clicks "Start Lesson" in the learning path.

---

## 8. Avatar + Financial Shield

### Avatar (SVG, inline React)
`components/AvatarDisplay.tsx` renders 6 variants (2 gender × 3 style) as inline SVG:

| Style | Colors | Accessory | Archetype |
|-------|--------|-----------|-----------|
| Warrior | Indigo `#6366F1` | Sword | Fights debt head-on |
| Explorer | Emerald `#34D399` | Compass | Discovers opportunities |
| Builder | Amber `#FCD34D` | Wrench | Builds wealth methodically |

Female variants: longer hair, eye lashes, subtle blush, lighter body proportions.
Male variants: spiky/swept hair, broader shoulders, shoulder pads (Warrior).

### Financial Shield (Hexagonal Radar Chart)
SVG radar chart with 6 axes driven by real SRS progress:

| Axis | Stage mapped |
|------|-------------|
| Saving | `saving-habit` |
| Investing | `long-term-investing` |
| Emergency | `emergency-fund` |
| Credit | `credit-rates` |
| Streak | `money-mindset` |
| Knowledge | `inflation` |

Values: `completed` → 100, `inProgress` → max(progressPct, 15), `current` → 10, `locked` → 0.
Center circle shows average score across all 6 axes.

---

## 9. Streak System

`lib/streak.ts` + `context/StreakContext.tsx`:

```
markActiveToday():
  if lastActiveDate == today → no-op (already counted)
  if lastActiveDate == yesterday → currentStreak += 1
  else → currentStreak = 1 (reset)
  longestStreak = max(longestStreak, currentStreak)
```

At-risk detection: `isStreakAtRisk()` returns `true` after 18:00 if not yet active today. Used by `NotificationBanner` to prompt user.

---

## 10. Voice System (Voice-first Accessibility)

`context/VoiceContext.tsx` manages global audio state:

```
speak(text, options):
  1. stop() — cancel any current playback
  2. Check in-memory cache by locale + voiceId + modelId + text
  3. POST /api/tts with { text, locale, voiceId?, modelId? } on cache miss
  4. If ElevenLabs returns audio/mpeg:
       URL.createObjectURL(blob) → new Audio() → play()
       keep blob URL cached until provider unmount
  5. If /api/tts fails, times out, or lacks API key:
       fallback to window.speechSynthesis

stop():
  audio.pause() + speechSynthesis.cancel()
```

`currentText` tracks which text is playing — `VoiceButton` uses `isPlaying && currentText === text` to show stop vs play state per button.

**Three variants**:
- `variant="icon"` — compact circle button for Mila chat messages and tight quiz layouts
- `variant="pill"` — labelled button for score, inflation, learning path and desktop quiz
- `variant="large"` — accessibility-first 56px+ button with strong focus ring and visible playing/loading state

Voice-first demo coverage:
- Accessibility Mode has five large voice actions with matching text cards.
- Home starts the demo with a "Hear Mila" voice intro.
- Coach messages each include a small speaker button.
- Health score, inflation explanation, quiz questions and learning path all expose `VoiceButton`.

---

## 11. NFT Minting Flow

```
User clicks "Mint Certificate"
  ↓
[with wallet connected]
POST /api/mint-nft
  → createUmi(DEVNET_RPC).use(mplCore())
  → keypairIdentity(mintAuthority from SOLANA_MINT_KEYPAIR)
  → generateSigner() for asset address
  → create(umi, { asset, name, uri, owner: recipientAddress, plugins: [Attributes] })
  → sendAndConfirm()
  → return { txHash: base64(signature), assetAddress, explorerUrl }

[without wallet or API error]
  → createMockTransactionHash() — random hex string
  → simulated 2.2s delay across 3 mock steps
  
Both paths → Dialog with tx hash + "View on Solana Explorer" link
```

---

## 12. Viral / Social Loop

```
Health Check complete
  → "My Achievement" button → /achievement?name=X&score=Y&streak=Z
  
Achievement page
  → AchievementCard (gradient, score, streak, badge tier)
  → Download as PNG (HTML Canvas, ctx.roundRect with fallback)
  → SocialShare → Web Share API || Twitter/X || WhatsApp || copy link

Quiz complete
  → SocialShare with /quiz?from=Name&score=X
  
Incoming challenge URL (/quiz?from=Name&score=X&challenge=questionId)
  → ChallengeBanner shows challenger name + score to beat
  → After quiz → SocialShare with user's own score
```

**Badge tiers** (achievement page):
| Score | Badge | Gradient |
|-------|-------|---------|
| ≥ 80 | Financial Champion 🏆 | Purple → Indigo |
| ≥ 60 | Money Master 💰 | Sky → Violet |
| ≥ 40 | Habit Builder 📈 | Emerald → Sky |
| < 40 | Financial Learner 🌱 | Amber → Red |

---

## 13. i18n System

Three locale files (`lib/i18n/{en,pl,es}.ts`). `en.ts` defines the canonical `Translations` type.

```typescript
// Switching language
const { setLocale } = useLanguage();
setLocale("pl");  // persisted to coachfi-locale in localStorage

// Usage
const { t } = useLanguage();
t.nav.coach       // "AI Coach" | "AI Coach" | "Coach IA"
t.quiz.progress   // template string with {current}/{total} placeholders
```

Language is applied to `document.documentElement.lang` on change.

---

## 14. Webpack Configuration

`next.config.mjs` resolves Node.js built-in conflicts when Solana/Metaplex packages are bundled for the browser:

```javascript
// ESM-safe require() for next.config.mjs
import { createRequire } from "module";
const require = createRequire(import.meta.url);

webpack: (config, { isServer, webpack }) => {
  if (!isServer) {
    config.resolve.fallback = {
      fs: false, net: false, tls: false,
      stream: false, http: false, https: false,
      zlib: false, path: false, os: false,
      util: false, url: false, assert: false,
      worker_threads: false, child_process: false,
      crypto: false,
      buffer: require.resolve("buffer/"),  // ← polyfill for @solana/web3.js
    };
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ["buffer", "Buffer"],       // ← global Buffer for Solana internals
      })
    );
  }
}
```

Root cause: `@solana/web3.js` v1.98 imports `buffer` and `util` as Node.js built-ins. Setting `buffer` to `false` breaks Solana internals — it needs the browser polyfill. `ProvidePlugin` makes `Buffer` available globally so code that calls `Buffer.from()` without an explicit import still works.

---

## 15. Design Tokens

`tailwind.config.ts` extends Tailwind with project-specific tokens:

```
background:  #F8F7FF   (soft lavender-white)
primary:     #7C6FF6   (indigo-violet — brand color)
secondary:   #69D2E7   (cyan)
accent:      #FFD166   (golden-yellow)
success:     #80ED99   (mint green)
warning:     #FFB703   (amber)
text:        #1F2937   (near-black)
muted:       #6B7280   (gray-500)

shadow-soft: 0 18px 50px rgba(31, 41, 55, 0.10)
shadow-glow: 0 18px 45px rgba(124, 111, 246, 0.18)
```

Font: Nunito for friendly UI text with Noto Sans fallbacks for Polish, Spanish, French, Chinese, Japanese, Hindi, Brazilian Portuguese and Turkish.

---

## 16. Environment Variables

```bash
# .env.local

# ── AI Coach (Claude Haiku streaming) ────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
ANTHROPIC_MAX_TOKENS=256
# Get at: https://console.anthropic.com/settings/keys

# Optional OpenRouter fallback/provider
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openrouter/auto
OPENROUTER_MAX_TOKENS=256
AI_PROVIDER=
# Set AI_PROVIDER=openrouter to try OpenRouter before Anthropic.

# ── ElevenLabs TTS (Mila voice) ──────────────────────────────────────────────
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
ELEVENLABS_PL_VOICE_ID=
ELEVENLABS_EN_VOICE_ID=
ELEVENLABS_JA_VOICE_ID=
# Get at: https://elevenlabs.io → Profile → API Key
# Creator plan strategy: PL / EN / JA only, max 500 chars/request, no autoplay

# ── Global Leaderboard (Supabase) ────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_LEADERBOARD_TABLE=leaderboard
# Create project at: https://supabase.com
# Run schema SQL (see below)

# ── NFT Minting (Solana Devnet) ───────────────────────────────────────────────
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_MINT_KEYPAIR=[12,34,56,...]
NEXT_PUBLIC_APP_URL=https://your-production-domain.example
# Generate: solana-keygen new --outfile mint-keypair.json
# Fund:     solana airdrop 2 $(solana-keygen pubkey mint-keypair.json) --url devnet
# Paste the JSON array from mint-keypair.json as a single line
```

### Supabase Schema

```sql
create table if not exists leaderboard (
  id         uuid default gen_random_uuid() primary key,
  name       text not null,
  score      integer not null default 0,
  streak     integer not null default 0,
  updated_at timestamptz default now()
);
create index on leaderboard (score desc);
alter table leaderboard enable row level security;
create policy "read all"   on leaderboard for select using (true);
create policy "insert own" on leaderboard for insert with check (true);
create policy "update own" on leaderboard for update using (true);
```

---

## 17. Graceful Degradation Matrix

Every external service has a defined fallback — the app never breaks without API keys.

| Service | When missing | Fallback behaviour |
|---------|-------------|-------------------|
| `ANTHROPIC_API_KEY` | `/api/chat` → 503 | Client uses `matchCoachIntent()` pattern-matching + simulated stream |
| `ELEVENLABS_API_KEY` | `/api/tts` → 503 | `VoiceContext` falls back to `window.speechSynthesis` (browser TTS) |
| `SUPABASE_*` | `/api/leaderboard` → `configured: false` | `Leaderboard` component shows 5 hardcoded local players |
| `SOLANA_MINT_KEYPAIR` | `/api/mint-nft` → 503 | `rewards/page.tsx` runs mock mint with 2.2s simulated steps |
| No Solana wallet | — | Mint still works (server-side mint authority, no wallet signature needed) |

---

## 18. PWA Configuration

`app/manifest.ts` generates `/manifest.webmanifest`:
- `display: "standalone"`, `theme_color: "#6C47FF"`
- Icons: 192×192, 512×512 (referenced as `/icon-192.png`, `/icon-512.png`)

`public/sw.js` — service worker registered inline in `layout.tsx`:
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

---

## 19. Open Graph / Social Meta

| Route | OG Title | OG Description |
|-------|---------|----------------|
| `/quiz` | "Can you beat my score?" | Dynamic from `?from=` + `?score=` params |
| `/achievement` | "My Coach FI Achievement" | `?name=&score=&streak=` |
| All others | "Coach FI — Financial Education" | Default site description |

Separate `layout.tsx` files in `app/quiz/` and `app/achievement/` export `metadata` with `openGraph` and `twitter` card fields.

---

## 20. Key Data Flows

### Health Check → Score → Share
```
HealthCheckPage (10 questions, ~3min)
  → calculates financialHealthScore (0–100)
  → saves to mockUser (in-memory, not persisted)
  → "My Achievement" button → /achievement?name=X&score=Y&streak=Z
  → AchievementPage renders AchievementCard
  → Canvas download or SocialShare
```

### Quiz → SRS → Learning Progress
```
QuizCard.handleSubmit()
  → recordAnswer(question.id, isCorrect)   # lib/srs.ts
  → saveCards([...updated])                 # localStorage coachfi-srs
  → onComplete(correctCount, totalCount)    # callback to parent page

ProgressPath.useEffect()
  → getAllStageProgress()                   # reads SRS + manual overrides
  → renders stage cards with lock/unlock state
  → handleStart(stageId) → markStageStarted() → re-compute progress
```

### Coach Chat → Streaming
```
CoachPage.sendMessage(text)
  → apiHistory.push({ role: "user", content: text })
  → addStreamingPlaceholder()
  → streamFromAPI(text, historySnapshot, onChunk, onDone, onFallback)
      ↓ success
      appendChunk() per text_delta event
      finalizeMessage() → apiHistory.push({ role: "assistant", content })
      ↓ failure
      simulateStream(matchCoachIntent(text), ...) at 14ms/char
```

---

## 21. Component Responsibilities (Quick Reference)

| Component | Responsibility |
|-----------|---------------|
| `AppNavigation` | Layout shell. Reads `getDueCount()` for review badge. Renders `OnboardingModal` + `NotificationBanner`. |
| `QuizCard` | Self-contained quiz session. Manages 5 random questions from bank. Calls `recordAnswer()` per submit. |
| `ProgressPath` | Reads `getAllStageProgress()` on mount. Renders 8 stage cards. Calls `markStageStarted()` on CTA click. |
| `Leaderboard` | Fetches `/api/leaderboard` on mount. POSTs user score. Global/Local tab toggle. |
| `AvatarDisplay` | Reads `getAvatar()` + `getAllStageProgress()` on mount. Renders inline SVG avatar + hex radar chart. |
| `VoiceButton` | Reads `VoiceContext`. Renders icon, pill or large accessibility button. `isPlaying && currentText === text` for per-button active state. |
| `SocialShare` | Tries `navigator.share()` first. Falls back to platform URL patterns + `navigator.clipboard`. |
| `OnboardingModal` | Shown if `!getUser().setupDone`. Saves name + goal. Calls `onDone` prop to refresh parent state. |

---

## 22. Build & Deploy

```bash
# Development
npm run dev          # Next.js dev server on :3000

# Type check only
npm run typecheck    # tsc --noEmit

# Production build + type check
npm run check        # tsc --noEmit && next build

# Production build
npm run build        # next build (outputs to .next/)

# Production server
npm start            # next start

# Deploy to Vercel
vercel               # Auto-detects Next.js, sets NODE_ENV=production
# Set all .env.local vars as Vercel environment variables
```

**Build outputs** (as of last build):
- 26 routes — static app pages plus dynamic API routes (`/api/chat`, `/api/leaderboard`, `/api/mint-nft`, `/api/status`, `/api/tts`)
- First Load JS shared: ~102 kB
- Largest page: `/inflation` ~217 kB (Recharts)
- Smallest page: `/_not-found` ~103 kB

---

## 23. Dependencies

### Production
| Package | Version | Purpose |
|---------|---------|---------|
| `next` | ^15.0.0 | App framework (App Router, RSC, API Routes) |
| `react` / `react-dom` | ^19.0.0 | UI rendering |
| `typescript` | ^5.7.2 | Type safety (strict mode) |
| `tailwindcss` | ^3.4.17 | Utility CSS |
| `framer-motion` | ^12.0.0 | Animations + page transitions |
| `@anthropic-ai/sdk` | ^0.95.1 | Claude Haiku streaming (server-side only) |
| `@supabase/supabase-js` | ^2.105.4 | Leaderboard database |
| `@metaplex-foundation/mpl-core` | ^1.10.0 | NFT minting (Metaplex Core standard) |
| `@metaplex-foundation/umi` | ^1.5.1 | Solana transaction builder |
| `@metaplex-foundation/umi-bundle-defaults` | ^1.5.1 | Umi with default RPC/signer |
| `@solana/web3.js` | ^1.98.4 | Solana RPC + key management |
| `@solana/wallet-adapter-*` | ^0.15/0.9 | Browser wallet connection |
| `@radix-ui/react-*` | ^1.x | Accessible UI primitives |
| `recharts` | ^2.15.0 | Inflation chart |
| `lucide-react` | ^0.468.0 | Icons |
| `class-variance-authority` | ^0.7.1 | Button variant system |
| `clsx` + `tailwind-merge` | ^2.x | Dynamic className merging |

### Dev
| Package | Purpose |
|---------|---------|
| `@types/node` / `@types/react` | TypeScript definitions |
| `autoprefixer` / `postcss` | Tailwind CSS processing |

---

*Last updated: 2026-05-10 · Build: Next.js 15.5.18 · 23 pages · 0 TypeScript errors*
