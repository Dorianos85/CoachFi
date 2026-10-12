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

async function readGenesisHash(rpcUrl: string) {
  const url = new URL(rpcUrl);
  if (url.protocol !== "https:") throw new Error("Solana RPC must use HTTPS");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "coachfi-devnet-guard",
      method: "getGenesisHash",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error("Unable to verify Solana cluster");

  const payload = (await response.json()) as { result?: unknown };
  if (typeof payload.result !== "string" || !payload.result) {
    throw new Error("Invalid Solana cluster response");
  }
  return payload.result;
}

async function assertDevnetRpc(rpcUrl: string) {
  // Devnet can be reset, so compare against the canonical Devnet endpoint at
  // request time instead of pinning a genesis hash that may later become stale.
  const canonicalGenesisHash = await readGenesisHash(DEFAULT_SOLANA_RPC);
  const configuredGenesisHash =
    rpcUrl === DEFAULT_SOLANA_RPC ? canonicalGenesisHash : await readGenesisHash(rpcUrl);

  if (configuredGenesisHash !== canonicalGenesisHash) {
    throw new Error("Configured Solana RPC is not Devnet");
  }
}

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
    if (!req.headers.get("origin")) throw new Error("Missing origin");
    assertSameOrigin(req);
    requireConsentHeader(req, "blockchain");
    rateLimit(req, "mint", 5, 300_000);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request blocked";
    return jsonError(message, message === "Too many requests" ? 429 : 403);
  }

  if (getOptionalEnv("COACHFI_ENABLE_DEVNET_MINT_DEMO") !== "true") {
    return Response.json(
      { ok: false, error: "Devnet demo minting is disabled." },
      { status: 503 },
    );
  }

  const keypairBytes = getMintKeypair();
  if (!keypairBytes) {
    return Response.json(
      { ok: false, error: "Devnet demo minting is not configured." },
      { status: 503 },
    );
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
    await assertDevnetRpc(solanaRpcUrl);
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
    console.error(
      "[mint-nft] Devnet mint failed",
      err instanceof Error ? err.name : "UnknownError",
    );
    return Response.json(
      { ok: false, error: "Devnet mint failed. Nothing was issued." },
      { status: 500 },
    );
  }
}
