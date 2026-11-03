import { Keypair } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fetchAsset, fetchAssetsByOwner, mplCore } from "@metaplex-foundation/mpl-core";

import { certificateIdFromChain, type SeenCertificate } from "@/lib/certificate-compare";
import { getOptionalEnv } from "@/lib/server-env";

/**
 * Certificate reads that only trust assets issued by Coach FI: the MPL Core asset's update
 * authority must be our mint wallet. Anyone can create a devnet asset named "Coach FI - …",
 * so the name alone is not proof (security report M2/P3).
 *
 * Trusted authorities: the public key of SOLANA_MINT_KEYPAIR plus an optional comma-separated
 * COACHFI_MINT_AUTHORITY_PUBKEYS list (e.g. a previous mint wallet after a key rotation).
 */

const DEFAULT_SOLANA_RPC = "https://api.devnet.solana.com";

type AuthorityAsset = {
  publicKey: unknown;
  owner: unknown;
  name: string;
  updateAuthority?: { type?: string; address?: unknown };
  attributes?: { attributeList?: Array<{ key: string; value: string }> };
};

export function trustedMintAuthorities() {
  const trusted = new Set<string>();
  for (const item of (process.env.COACHFI_MINT_AUTHORITY_PUBKEYS ?? "").split(",")) {
    const value = item.trim();
    if (value) trusted.add(value);
  }
  const raw = getOptionalEnv("SOLANA_MINT_KEYPAIR");
  if (raw) {
    try {
      trusted.add(Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw) as number[])).publicKey.toBase58());
    } catch {
      /* invalid keypair: mint route reports it */
    }
  }
  return trusted;
}

export function issuedByCoachFi(asset: Pick<AuthorityAsset, "updateAuthority">, trusted = trustedMintAuthorities()) {
  if (trusted.size === 0) {
    // Without a known mint wallet we cannot verify anything. Never trust names in production.
    return process.env.NODE_ENV !== "production";
  }
  const authority = asset.updateAuthority;
  return authority?.type === "Address" && typeof authority.address === "string" && trusted.has(authority.address);
}

export function verifiedSeenFromAsset(asset: AuthorityAsset, trusted = trustedMintAuthorities()): SeenCertificate | null {
  if (!issuedByCoachFi(asset, trusted)) return null;
  const assetAddress = typeof asset.publicKey === "string" ? asset.publicKey : "";
  const ownerAddress = typeof asset.owner === "string" ? asset.owner : "";
  const attribute = asset.attributes?.attributeList?.find((item) => item.key === "certificate")?.value ?? null;
  const certificateId = certificateIdFromChain(asset.name, attribute);
  if (!certificateId || !assetAddress || !ownerAddress) return null;
  return { certificateId, assetAddress, ownerAddress };
}

function umi() {
  const rpc = getOptionalEnv("SOLANA_RPC_URL") ?? DEFAULT_SOLANA_RPC;
  return createUmi(rpc).use(mplCore());
}

export async function verifiedOwnedCertificates(owner: string) {
  const trusted = trustedMintAuthorities();
  const assets = await fetchAssetsByOwner(umi(), owner, { skipDerivePlugins: true });
  return assets.flatMap((asset) => {
    const seen = verifiedSeenFromAsset(asset as unknown as AuthorityAsset, trusted);
    return seen ? [seen] : [];
  });
}

export async function readVerifiedCertificate(assetAddress: string) {
  try {
    const asset = await fetchAsset(umi(), assetAddress, { skipDerivePlugins: true });
    return verifiedSeenFromAsset(asset as unknown as AuthorityAsset);
  } catch {
    return null;
  }
}
