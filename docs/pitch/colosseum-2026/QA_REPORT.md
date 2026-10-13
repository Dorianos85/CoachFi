# CoachFI V7 — QA report (13 Oct 2026)

## Inputs actually used

- Uploaded package `CoachFI_Colosseum_BrandV6_Solana_NFT.zip`: v6 animated HTML, editable PPTX, both PDFs, pitch script, Devnet proof checklist, master prompt, verification note.
- **`coachfi-design-system.zip` was not in the upload.** `DESIGN.md`, `tokens.json/.css` and boards 00/05/06/07/08/12/14/17 could not be opened. The brand tokens come from the master prompt (they match the v6 HTML's `--cf-*` block). Mila and the logo are the **original SVGs embedded in the v6 deck**, extracted byte-for-byte and not redrawn. *Send the design-system zip if you want a token-by-token check against the boards.*
- Public page check: `coachfiai.com/rewards` (logged-out view, 13 Oct 2026).
- Statistics checked against the primary EU sources (see below).

## Brand v6 compliance

| Rule | Status |
|---|---|
| Nunito only (900 display, 800 headings, 700 labels, 400–500 body) | ✓ HTML and PPTX. No Comfortaa, Cabin, Bricolage, Fredoka or Pixelify. |
| Fonts not bundled | ✓ HTML uses installed Nunito → Google Fonts CSS API → system fallback. PPTX names "Nunito Black / Nunito ExtraBold / Nunito" (install the static Nunito family). The PDF embeds subsets, as any PDF export does. |
| Exact tokens (#FFF8EE, #FFFFFF, #EBE1FF, #CDBEFF, #1E1B2E, #4A4560, #5B4BC4, #DDE6FF, #FFE1D1, #D5F3E5, #FFF0BF, #FFD9EF, #F07A57) | ✓ Used as defined. No other hues. Mascot orange appears only inside the original SVGs. |
| Cards 20px · buttons 14px · primary button lavender with 2px ink outline | ✓ |
| Flat background behind logo lockup | ✓ No glow, halo or pattern behind the lockup (slides 1 and 9). The halo appears only behind Mila. |
| Mila = original voxel squirrel with graduation cap | ✓ No human avatar anywhere. |
| Motion: 120/200/320 ms micro, one 600 ms reveal, slow orbits, understated halo | ✓ Orbits 120–160 s per turn. Charts fill once. |
| Mila never flickers or bounces | ✓ Fixed. v6 swapped Mila's mouth every 460 ms and floated her ±12px. v7 does one 320 ms crossfade (Listening → Explaining) and no float. |
| Reduced motion | ✓ OS `prefers-reduced-motion` plus a manual **M** toggle. |

## Content and credibility

| Check | Result |
|---|---|
| 18% statistic | "18% of EU citizens have a high level of financial literacy" — Flash Eurobarometer 525 (European Commission, 2023), as cited in EC COM(2025) 681. |
| 49% statistic | "almost half (49%) of the population between 18 and 65 years of age do not have enough emergency savings to cover their living expenses for at least three months, without borrowing any money or moving house" — EC Financial Literacy Strategy, COM(2025) 681, 30 Sept 2025. |
| Devnet mint (updated 13 Oct) | **Verified.** Tx `4o6n9e…jtZLEv`: finalized, `err: null`, Metaplex Core `CreateV2`, slot 510481868, 02:57:13 UTC. Asset `373B7m…nDsA` (Core AssetV1) is owned by `21dYDb…C2C8p`, name "Coach FI - Saving Habit". Checked on the public Devnet RPC and in Explorer. Full record in the proof checklist. |
| Wallet | Slides say "Coinbase CDP wallet" (non-custodial), per team and the CDP docs you linked. The logged-out page and the chain don't name the wallet provider. Phantom is no longer mentioned. |
| Who signs | The issuer key `BkQM…` signed and paid. The learner wallet only receives. Slide 6's footer says this, so no judge is misled into thinking the learner signs. |
| Mint count | Only "first certificate" — no counts. One verified tx. |
| Metaplex Core | **Shipped on Devnet** (proven by the tx). **Permanent Freeze Delegate is not on the asset** (only Attributes), so the deck says "today's asset is still transferable" and lists it as next. |
| Asset defects found | Metadata URI field holds 8 stacked URLs. `user` attribute = placeholder "Your". `score` = 42 is public on-chain. No collection. All listed openly on Q&A 1 and in the checklist. |
| Partner figures (12k / 120) | Labelled as the partner's own founder-reported figures, pending verification, **not CoachFI traction**. Metamorfoza marked "prospective · not signed". |
| Team | Dorian Żaczek — Founder (DORIANOS / ZŁAP TREND, YouTube & community, financial education). Mieszko Manijak — Solana Developer. |
| Roadmap | Oct 2026 / Q4 2026 / Q1 2027 / Q2–H2 2027 as briefed. Mainnet gated on audit + legal review. |
| Points | The app calls them a "mock point balance" — Q&A 2 says they are not a token. |

## Contrast (WCAG 2.1)

| Pair | Ratio | Result |
|---|---|---|
| Ink on cream | 15.91:1 | AAA |
| Muted on cream | 8.62:1 | AAA |
| Grape on cream | 6.13:1 | AA (AAA at large size) |
| Grape on white | 6.46:1 | AA |
| Grape on lavender #EBE1FF | 5.16:1 | AA |
| Grape on mint #D5F3E5 | 5.47:1 | AA |
| Grape on learn #DDE6FF | 5.18:1 | AA |
| Grape on rewards #FFF0BF | 5.69:1 | AA |
| Muted on mint / goals / learn | 7.69 / 7.33 / 7.28:1 | AAA |
| Ink on primary button #CDBEFF | 9.91:1 | AAA |
| White on ink (Devnet badge) | 16.78:1 | AAA |
| Grape donut arc vs track | 5.47:1 | passes 3:1 for graphics |
| Accent #F07A57 donut arc vs track | 2.33:1 | **below 3:1** — accepted because the value (49%) is printed inside the ring in ink; the arc adds no information. Swap the arc to grape if you want strict 1.4.11. |

Status never relies on colour alone: verified vs pending uses ✓ / … glyphs, solid vs dashed outlines, and text labels ("MINT VERIFIED", "TO FIX / PROVE", "NEXT").

## Overflow and readability (automated)

A Playwright scan at 1920×1080 checked every visible element on all 12 slides for (a) leaving the slide frame, (b) clipped scroll overflow, (c) any text under 20px, and (d) content overlapping the footer row.

**Final result: 0 issues on all 12 slides.** Issues found and fixed during the pass:

- Slide 5 evidence panel overlapped the footer by 49px → layout rebuilt (QR left, public UI + evidence gate right).
- 18px labels on slides 1, 6, 7, 9 → raised to ≥20px.
- The donut centre text collided with the ring → ring enlarged to 300px.
- Headline wraps on slides 1, 3 and 9 → explicit line breaks and sizes.

The smallest text is 20px on a 1920px canvas (≈1% of slide width). Body text is 24–30px, titles 66–96px. In PPTX the PowerPoint render (via LibreOffice) was checked for wrapping; pill widths and two text boxes were adjusted.

## Interactive tests (HTML)

| Test | Result |
|---|---|
| Rewards QR decodes (OpenCV) | `https://coachfiai.com/rewards` ✓ (screen and PNG) |
| Keyboard: → ← Home End Q 1–9 N M F A T ? | ✓ |
| Autoplay: 9 slides, 180 s, Q&A excluded | ✓ (slide 2 at 0:13) |
| Proof gate — invalid input | Rejected: "Enter a real base58 signature…" |
| Proof gate — offline / RPC blocked | "Offline or RPC unavailable — cannot verify here. Do not claim success." No QR. |
| Proof gate — tx without NFT program (mock RPC) | "no NFT program invoked — not a certificate mint". No QR, pin disabled. |
| Proof gate — tx invoking Metaplex Core (mock RPC) | QR + Explorer link; slide 5 shows "RPC check passed · human check pending". Explorer node stays pending. |
| Print/PDF mode (`?print`) | All slides in final static state; slide 5 shows the recorded verified mint with an Explorer QR. |
| Slide 5 live re-check (mock RPC: finalized / not found / offline) | Shows "live RPC re-check ✓ finalized" / switches the badge to "Live RPC re-check did not pass" / keeps the recorded evidence silently. |
| Real tx check (13 Oct, via browser on the presenter machine) | `getSignatureStatuses` → finalized, err null; `getTransaction` → Metaplex Core CreateV2; `getAccountInfo` on the asset → Core AssetV1, owner `21dYDb…`, Attributes plugin only. |

Mock RPC responses were used **only** in the test harness, never in a deliverable. The real transaction was checked through the browser on your computer, because the build sandbox has no Devnet access.

## Self-check

- **Does Solana do something demonstrable?** Yes. A real Metaplex Core certificate was minted on Devnet to a learner wallet, and the jury can scan it on slide 5.
- **Is on-chain proof distinguishable from a UI button?** Yes. Slide 5 separates the public UI from the finalized tx and shows the signature, asset, owner and program. The HTML re-checks the chain live when online.
- **Are implementation claims verifiable or qualified?** Yes. Shipped = Core mint on Devnet. Not shipped = non-transferability, collection, mainnet.
- **Can the jury see the real Devnet signature in Explorer?** **Yes** — via the slide 5 QR, the Q&A 3 QR and the clickable links. The QRs decode correctly (scanned from the rendered slide).
- **Is the Metaplex standard known?** **Yes: Metaplex Core** (CreateV2, AssetV1 account). The freeze plugin is not present.
- **Are screenshots from the real app?** The deck contains no app screenshots. Slide 4 is labelled a concept visual, and the UI text is quoted from the public page.
- **Are team and traction claims sourced?** Yes. Partner figures are founder-reported and flagged; no CoachFI user or revenue numbers are claimed.
- **Does every slide fit the projector frame?** Yes (automated scan, 0 issues).

## Before you go on stage

1. Open the HTML on the presentation laptop and projector. Press `F`, run `A` once.
2. Make sure Nunito is installed (or the laptop is online) — otherwise a system font fills in.
3. Fix the metadata URI and the "Your" placeholder in the mint code, then mint once more on a fresh wallet and add that tx to the checklist.
4. Keep the 9-slide PDF on a USB stick as the offline fallback.

## V7.1 motion layer (animated HTML)

- **Guide Mila:** uses the two original head frames, mouth closed and mouth open. She jumps on an 820 ms arc with squash and stretch to a free spot next to the key element on slides 2 and 4–8. Each spot was found automatically so she never covers text. She "says hi" (lip-sync about 1.4 s) after landing, and turns into the big Mila on slides 1, 3 and 9.
- **Big Mila:** on slide 1 she pops in and talks for 1.8 s. On slide 3 she lip-syncs for 3.6 s when the "Mila explains" bubble lights up. On slide 9 she jumps for joy on "a habit, not a privilege".
- **Kinetic type:** titles come in word by word (blur to sharp, 65 ms stagger), and a lavender highlighter draws under the accent words. On slide 2 the numbers count up 0→18% and 0→49%. On slide 5 the VERIFIED badge lands like a stamp.
- **Spotlight cues:** each slide has cues timed to the script. The element being spoken about glows in grape and lavender while the rest dims to 42%; the dimming ends before the slide changes. On slide 6 a light orb runs Lesson → Quiz → Eligibility → Wallet → Certificate → Explorer, and each node lights up as it arrives. On slide 5 the QR code pulses 3 times.
- **Controls:** **S** makes Mila talk on demand. **M** or the OS reduced-motion setting turns off all motion; Mila is still placed, with no jumps. The PDF and print mode stay static.
- **Tests:** full 3:00 autoplay with 0 JS errors and cues in sync. The overflow scan reports 0 issues on the 12 slides; the only flag is the long signature inside the Q&A 3 input field, which scrolls by design. Reduced-motion run checked.
- **Slides artifact:** Mila hops between slides 2, 4, 5, 6, 7 and 8 using the "magic" transition, with "Scan me!" and "We're here!" tags that pop in. The editor format cannot do lip-sync, the orb or spotlight timing.
