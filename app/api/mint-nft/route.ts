import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { create, mplCore } from "@metaplex-foundation/mpl-core";
import {
  generateSigner,
  keypairIdentity,
  publicKey as umiPublicKey,
} from "@metaplex-foundation/umi";

import {
  assertSameOrigin,
  clampNumber,
  isLikelySolanaAddress,
  jsonError,
  readJsonWithLimit,
  requireConsentHeader,
} from "@/lib/api-security";
import { cdpAuthConfigured } from "@/lib/cdp-server";
import { certificateIdFromChain, type ChainCertificateId } from "@/lib/certificate-compare";
import { enforceLimits, limitExceededResponse, refundLimits } from "@/lib/ratelimit";
import { mintRules } from "@/lib/server/limits";
import { requireCdpUser } from "@/lib/server/require-user";
import { getOptionalEnv } from "@/lib/server-env";

const DEFAULT_SOLANA_RPC = "https://api.devnet.solana.com";
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function encodeBase58(bytes: Uint8Array) {
  const digits = [0];

  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      const value = digits[i] * 256 + carry;
      digits[i] = value % 58;
      carry = Math.floor(value / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }

  let leadingZeros = 0;
  while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) {
    leadingZeros++;
  }

  return (
    "1".repeat(leadingZeros) +
    digits
      .reverse()
      .map((digit) => BASE58_ALPHABET[digit])
      .join("")
  );
}

function getMintKeypair() {
  const raw = getOptionalEnv("SOLANA_MINT_KEYPAIR");
  if (!raw) return null;
  try {
    const arr = JSON.parse(raw) as number[];
    return Uint8Array.from(arr);
  } catch {
    return null;
  }
}

/** Only these certificates can be minted; the on-chain name comes from this list, never from the client. */
const CERTIFICATE_LABELS: Record<ChainCertificateId, string> = {
  "saving-habit": "Saving Habit",
  "money-mindset": "Money Mindset",
  "inflation-fighter": "Inflation Fighter",
};

function resolveCertificateId(certificateId: unknown, certificateName: unknown): ChainCertificateId | null {
  if (typeof certificateId === "string" && certificateId in CERTIFICATE_LABELS) return certificateId as ChainCertificateId;
  if (typeof certificateName !== "string" || certificateName.length > 80) return null;
  return certificateIdFromChain(`Coach FI - ${certificateName.trim()}`, null);
}

export interface MintRequest {
  /** Ignored when the user is signed in: the certificate goes to the session's CDP wallet. */
  recipientAddress?: string;
  certificateId?: string;
  certificateName?: string;
  /** Accepted for backwards compatibility, never written on-chain (personal data). */
  userName?: string;
  score?: number;
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    requireConsentHeader(req, "blockchain");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request blocked";
    return jsonError(message, 403);
  }

  const keypairBytes = getMintKeypair();
  if (!keypairBytes) {
    return Response.json({ ok: false, error: "Minting is not configured", fallback: true }, { status: 503 });
  }

  let payload: MintRequest;
  try {
    payload = await readJsonWithLimit<MintRequest>(req, 1400);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid payload");
  } catch {
    return jsonError("Invalid payload", 400);
  }

  // Recipient and quota subject come from the verified CDP session, not from the request body.
  let userId: string;
  let recipientAddress: string;
  if (cdpAuthConfigured() || process.env.NODE_ENV === "production") {
    const user = await requireCdpUser(req);
    if (user instanceof Response) return user;
    if (!user.solanaAddress || !isLikelySolanaAddress(user.solanaAddress)) {
      return jsonError("A Coach FI wallet is required", 403);
    }
    userId = user.userId;
    recipientAddress = user.solanaAddress;
  } else {
    // Local development without CDP keys only (NEXT_PUBLIC_DEV_MINT_RECIPIENT flow).
    if (!isLikelySolanaAddress(payload.recipientAddress)) return jsonError("Missing required fields", 400);
    recipientAddress = payload.recipientAddress as string;
    userId = `dev:${recipientAddress}`;
  }

  const certificateId = resolveCertificateId(payload.certificateId, payload.certificateName);
  if (!certificateId) return jsonError("Unknown certificate", 400);

  const rules = mintRules(req, userId, certificateId);
  const decision = await enforceLimits(rules.all);
  if (!decision.ok) {
    const message = decision.rule.startsWith("mint:user:") && decision.rule !== "mint:user:day"
      ? "This certificate was already minted for your account"
      : "Mint limit reached. Please try again later.";
    return limitExceededResponse(decision, message);
  }

  const certificateLabel = CERTIFICATE_LABELS[certificateId];
  const safeScore = clampNumber(payload.score, 0, 100);
  const solanaRpcUrl = getOptionalEnv("SOLANA_RPC_URL") ?? DEFAULT_SOLANA_RPC;
  const appUrl = (getOptionalEnv("NEXT_PUBLIC_APP_URL") ?? "https://coachfiai.com").replace(/\/$/, "");

  try {
    const umi = createUmi(solanaRpcUrl).use(mplCore());
    const mintAuthority = umi.eddsa.createKeypairFromSecretKey(keypairBytes);
    umi.use(keypairIdentity(mintAuthority));

    const asset = generateSigner(umi);
    const recipient = umiPublicKey(recipientAddress);

    const metadata = {
      name: `Coach FI - ${certificateLabel}`,
      uri: `${appUrl}/nft-metadata/${encodeURIComponent(certificateLabel)}`,
    };

    const { signature } = await create(umi, {
      asset,
      name: metadata.name,
      uri: metadata.uri,
      owner: recipient,
      plugins: [
        {
          type: "Attributes",
          attributeList: [
            { key: "certificate", value: certificateLabel },
            { key: "score", value: String(safeScore) },
            { key: "platform", value: "Coach FI" },
            { key: "network", value: "Solana Devnet" },
            { key: "issuedAt", value: new Date().toISOString() },
          ],
        },
      ],
    }).sendAndConfirm(umi);

    const txHash = encodeBase58(signature);

    return Response.json({
      ok: true,
      txHash,
      certificateId,
      assetAddress: asset.publicKey,
      explorerUrl: `https://explorer.solana.com/address/${asset.publicKey}?cluster=devnet`,
    });
  } catch (err) {
    await refundLimits(rules.refundable);
    console.error("[mint-nft]", err instanceof Error ? err.message : "Unknown error");
    return Response.json({ ok: false, error: "Mint failed", fallback: true }, { status: 500 });
  }
}
