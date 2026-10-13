# CoachFI — Devnet mint evidence (v7, updated 13 Oct 2026)

**Status: FIRST MINT VERIFIED on Solana Devnet.** The transaction below was checked on the public Devnet RPC (`api.devnet.solana.com`) and in Solana Explorer. Every value is copied from the chain, not typed by hand.

## Recorded evidence

| Field | Value |
|---|---|
| Cluster | `devnet` |
| Transaction signature | `4o6n9eheETBu6ecomcbAuCVj5cCf3GLq2RpAR2r2j5ppqLD3ehchHSHkNjywwXzePnxvu2GSRp2mHFLBk2jtZLEv` |
| Explorer (tx) | https://explorer.solana.com/tx/4o6n9eheETBu6ecomcbAuCVj5cCf3GLq2RpAR2r2j5ppqLD3ehchHSHkNjywwXzePnxvu2GSRp2mHFLBk2jtZLEv?cluster=devnet |
| Status | `finalized`, `err: null` |
| Slot | `510481868` |
| Block time (UTC) | `2026-10-13 02:57:13` (04:57 Warsaw) |
| Program / instruction | Metaplex Core `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d` — `CreateV2` (log: "Instruction: CreateV2") |
| Other programs | System Program (account creation + rent) |
| Fee | 10,000 lamports (two signatures) |
| Asset address | `373B7mWUUpDVy9nFXTo9poPcpuETKpX4xYmgMVcUnDsA` |
| Explorer (asset) | https://explorer.solana.com/address/373B7mWUUpDVy9nFXTo9poPcpuETKpX4xYmgMVcUnDsA?cluster=devnet |
| Asset account owner program | Metaplex Core (AssetV1, 536 bytes) |
| Asset owner (learner wallet) | `21dYDb9SxtCMAXitR72V3at1zfVKawYWwx6riJvC2C8p` |
| Update authority / fee payer (CoachFI issuer) | `BkQMdMKsG9jYc6yvfhxKcvQR3bAeJJJq5ew2L9ptRzrT` |
| Signers | Issuer (`BkQM…`) and the new asset keypair (`373B…`). The learner wallet did **not** sign. |
| Name | `Coach FI - Saving Habit` |
| Plugins | **Attributes only**: certificate = Saving Habit · user = Your · score = 42 · platform = Coach FI · network = Solana Devnet · issuedAt = 2026-10-13T02:57:13.182Z |
| Off-chain metadata JSON | `https://coach-fi.vercel.app/nft-metadata/Saving%20Habit` — reachable. Name, description ("A non-speculative Coach FI education certificate…"), image, 4 attributes. |
| Asset history | 1 transaction (this mint). No later updates. |
| Wallet type | Coinbase CDP non-custodial (user) wallet — **per team**. The chain shows only the address. CDP docs: users sign in with email, SMS or social login, control the wallet and can export keys; Solana devnet is supported. |
| Checked by | Claude, for Dorian Żaczek, via public Devnet RPC + Explorer, 13 Oct 2026 |

## Issues found on the real asset — fix before the jury looks closely

1. **The metadata URI field is malformed.** It holds 8 newline-separated URLs: seven copies of `https://coach-fi.vercel.app` and then the real JSON URL. Wallets and Explorer may fail to load the image and metadata. Fix: pass only `https://coach-fi.vercel.app/nft-metadata/Saving%20Habit`. URL-encoding the space, or using a slug without spaces, is safer.
2. **The `user` attribute is a placeholder: "Your".** Use a pseudonymous learner ID — never a real name or e-mail, because it is public.
3. **The `score` attribute (42) is public on-chain.** Decide whether the quiz score should be public. The deck now says "only the final score is on the certificate today".
4. **Not non-transferable.** There is no Permanent Freeze Delegate. Per Metaplex docs, permanent plugins must be added in `CreateV2` at creation time; they cannot be added to this asset later.
5. **No collection.** This asset is not in a CoachFI collection. A collection makes "issued by CoachFI" checkable in one step.
6. **Reproducibility.** Mint once more from a fresh wallet and record that tx too, so "anyone can mint" is proven, not just "we minted once".

## How the deck uses this evidence

- **Animated HTML:** the `PROOF` block is filled with the values above. Slide 5 shows "✓ Mint verified on Solana Devnet" with links and an Explorer QR. When online, it re-checks the signature on the public Devnet RPC and flags it if the check fails. Q&A 3 has the signature pre-filled; **Check on Devnet** re-runs the check live.
- **PowerPoint and PDFs:** slide 5 and Q&A 3 show the recorded fields and a QR to the Explorer tx page (both QRs scan-tested).
- **Slides artifact:** same content as the PPTX.

## For each new mint (repeat the procedure)

1. Use a Devnet-only wallet. Never show a seed phrase or private key.
2. Complete the real eligibility rule (quiz + 3-day streak) if the app enforces it.
3. Accept consent → **Mint certificate**.
4. Copy the signature → Explorer (`cluster=devnet`) → check: Success, Metaplex Core invoked, and the new asset's owner = this wallet.
5. Add a new row to this file. Never edit old values.

## If a live mint fails on demo day

Say: *"Here is the certificate we minted earlier today — scan the code to see it in Solana Explorer."* That is honest, because the 4o6n9e… transaction is real. Do not present it as minted live.
