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
  rateLimit,
  readJsonWithLimit,
  requireConsentHeader,
  sanitizeDisplayName,
} from "@/lib/api-security";
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

export interface MintRequest {
  recipientAddress: string;
  certificateName: string;
  userName: string;
  score: number;
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    requireConsentHeader(req, "blockchain");
    rateLimit(req, "mint", 5, 300_000);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request blocked";
    return jsonError(message, message === "Too many requests" ? 429 : 403);
  }

  const keypairBytes = getMintKeypair();
  if (!keypairBytes) {
    return Response.json({ ok: false, error: "SOLANA_MINT_KEYPAIR not configured", fallback: true }, { status: 503 });
  }

  let payload: MintRequest;
  try {
    payload = await readJsonWithLimit<MintRequest>(req, 1400);
  } catch {
    return jsonError("Invalid payload", 400);
  }

  const { recipientAddress, certificateName, userName, score } = payload;

  if (
    !isLikelySolanaAddress(recipientAddress) ||
    typeof certificateName !== "string" ||
    certificateName.trim().length === 0 ||
    certificateName.length > 80
  ) {
    return Response.json({ ok: false, error: "Missing required fields" }, { status: 400 });
  }

  const safeCertificateName = certificateName.trim().slice(0, 80);
  const safeUserName = sanitizeDisplayName(userName);
  const safeScore = clampNumber(score, 0, 100);
  const solanaRpcUrl = getOptionalEnv("SOLANA_RPC_URL") ?? DEFAULT_SOLANA_RPC;
  const appUrl = (getOptionalEnv("NEXT_PUBLIC_APP_URL") ?? "https://coachfi.app").replace(/\/$/, "");

  try {
    const umi = createUmi(solanaRpcUrl).use(mplCore());
    const mintAuthority = umi.eddsa.createKeypairFromSecretKey(keypairBytes);
    umi.use(keypairIdentity(mintAuthority));

    const asset = generateSigner(umi);
    const recipient = umiPublicKey(recipientAddress);

    const metadata = {
      name: `Coach FI - ${safeCertificateName}`,
      uri: `${appUrl}/nft-metadata/${encodeURIComponent(safeCertificateName)}`,
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
            { key: "certificate", value: safeCertificateName },
            { key: "user", value: safeUserName },
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
      assetAddress: asset.publicKey,
      explorerUrl: `https://explorer.solana.com/address/${asset.publicKey}?cluster=devnet`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[mint-nft]", message);
    return Response.json({ ok: false, error: message, fallback: true }, { status: 500 });
  }
}
