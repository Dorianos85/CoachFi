# CoachFI AI — Colosseum 2026 · Stage script (3:00)

**Speaker:** Dorian Żaczek · **Pace:** ~2 words/second (about 120 wpm — calm for a Polish speaker in English) · **Slides:** 9 timed + 3 Q&A backups (not timed)

Timing is exactly **[12, 19, 21, 29, 26, 27, 19, 13, 14] = 180 s**. The HTML autoplay (`A`) follows the same timings.

**Updated 13 Oct 2026:** the first real Devnet certificate mint is verified, and slides 5, 6 and 8 now show it.
- Tx: `4o6n9ehe…jtZLEv` — finalized, no error, Metaplex Core `CreateV2`
- Asset: `373B7m…nDsA`
- Owner: `21dYDb…C2C8p`

## Timed script

| # | Slide | Time | Sec | Say this |
|---|---|---|---:|---|
| 1 | Vision | 0:00–0:12 | 12 | I'm Dorian Żaczek, founder of CoachFI AI. We help people build money habits — with a voice coach called Mila, and learning certificates on Solana. |
| 2 | Problem | 0:12–0:31 | 19 | The problem is real. In the EU, only eighteen percent of citizens have high financial literacy. And forty-nine percent of people aged eighteen to sixty-five could not live three months on their savings. Knowing is not enough. People need habits. |
| 3 | Mila | 0:31–0:52 | 21 | Meet Mila — our voice-first AI coach. You ask a real question, out loud. Mila answers with a short lesson and one small next step. Voice helps blind and low-vision learners, and every answer also comes as text and captions. |
| 4 | Learning loop | 0:52–1:21 | 29 | Here is the loop. One: you ask a money question. Two: Mila gives a short lesson. Three: you practice — a quiz and a three-day saving streak, with points to keep it fun. Four: you earn a certificate — on-chain, on Solana Devnet. The goal is a habit, not a game. Let me show you the proof. |
| 5 | Solana Devnet demo | 1:21–1:47 | 26 | This is live, on Solana Devnet. Scan the left code — it opens coachfiai.com/rewards. You sign in with a Coinbase non-custodial wallet, accept a clear blockchain consent, and press Mint certificate. And this is our first real certificate: a Metaplex Core asset, finalized on Devnet. Scan the right code to see it in Explorer. |
| 6 | Why Solana | 1:47–2:14 | 27 | Why Solana? Learning stays private and off-chain. Our backend checks eligibility, then — with consent — mints a Metaplex Core certificate to the learner's own wallet. Anyone can check it in Explorer: signature, asset, owner, metadata. The wallet is optional. Next: make it non-transferable with Permanent Freeze Delegate. |
| 7 | Business | 2:14–2:33 | 19 | Distribution: I run DORIANOS and Złap Trend — a YouTube channel and community about money and markets. Next: white-label pilots for financial planners. We are talking with Metamorfoza Finansowa and Grzegorz Kusz. This is a prospective pilot — not traction yet. |
| 8 | Roadmap | 2:33–2:46 | 13 | Roadmap. First Devnet certificate: done this month. Q4: non-transferable credentials and Kids mode. Q1 2027: a partner pilot. Mainnet only after audit and legal review. |
| 9 | Team & ask | 2:46–3:00 | 14 | I'm the founder. Mieszko Manijak builds our Solana layer. We ask for three things: pilot partners, Solana technical support, and funding conversations. Financial confidence should be a habit — not a privilege. |

## Do not say on stage

- **"Soulbound" / "non-transferable."** The first asset has only an Attributes plugin. It is transferable today.
- **"Thousands of certificates" or any count.** Only this one mint is verified.
- **"The learner signed the mint."** The CoachFI issuer key signed and paid. The learner's wallet only receives the asset.
- **"Phantom."** The verified flow uses a Coinbase CDP non-custodial wallet (per team). On-chain, Explorer shows only the owner address.

## Live demo option (replaces spoken blocks — total stays 3:00)

Only use this with a stable connection and after one rehearsal on a **fresh** Devnet wallet. So far, only one mint is proven.

| Window | What happens | What you say |
|---|---|---|
| 0:52–1:05 (13 s, slide 4) | Shorten slide 4 to: "Ask, learn, practice, earn a certificate on Devnet. The goal is a habit, not a game." | 13 s instead of 29 s |
| 1:05–1:47 (42 s, slide 5) | Browser tab with `coachfiai.com/rewards`: sign in → consent → Mint certificate → open the new signature in Explorer (`cluster=devnet`). | One short sentence per click. If no confirmed tx appears in about 20 s, switch back to slide 5 and say the fallback line. |
| 1:47 onward | Back to slide 6 and continue as normal. | — |

**Fallback line if a live mint is slow or fails:**
> "Here is the certificate we minted earlier today — scan the code to see it in Solana Explorer."

The 4o6n9e… transaction is real, so this is honest. Don't present it as minted live.

## 90-second fallback

Weights: [6, 10, 10, 12, 14, 14, 9, 7, 8] = 90 s.

| # | Time | Sec | Say this |
|---|---|---:|---|
| 1 | 0:00–0:06 | 6 | I'm Dorian, founder of CoachFI AI — money habits with Mila. |
| 2 | 0:06–0:16 | 10 | In the EU, only 18% of citizens have high financial literacy; 49% of adults 18 to 65 lack a three-month buffer. |
| 3 | 0:16–0:26 | 10 | Mila is a voice-first coach: short lessons, one next step — with text and captions too. |
| 4 | 0:26–0:38 | 12 | Ask, learn, practice with a quiz and a streak, and earn a certificate on Solana Devnet. |
| 5 | 0:38–0:52 | 14 | On coachfiai.com/rewards you sign in, consent, and mint. Our first certificate is live on Solana Devnet — scan to see it in Explorer. |
| 6 | 0:52–1:06 | 14 | Learning stays private and off-chain. Only the certificate goes on Solana — a Metaplex Core asset anyone can verify. |
| 7 | 1:06–1:15 | 9 | Distribution: my YouTube community and a prospective white-label pilot with Metamorfoza Finansowa. |
| 8 | 1:15–1:22 | 7 | Next: non-transferable credentials, then a partner pilot in early 2027. |
| 9 | 1:22–1:30 | 8 | We're asking for pilots, Solana support and funding talks. Financial confidence should be a habit, not a privilege. |

## Pronunciation notes

- **coachfiai.com** → "coach-fi A-I dot com" (say it once slowly; the QR does the rest).
- **Devnet** → "DEV-net". **Metaplex** → "META-plex". **Explorer** → "ex-PLOR-er". **Coinbase** → "COIN-base".
- **eighteen / forty-nine** — say the numbers fully; "eight-teen" said fast can sound like "eighty".
- **Złap Trend** — say it in Polish; it's a brand name.

## Presenter keys (HTML)

`→ / Space` next · `←` back · `A` autoplay 3:00 · `S` Mila talks (2 s) · `N` notes · `M` motion on/off · `F` fullscreen · `Q` jump to Q&A · `1–9` jump to slide · `?` help
