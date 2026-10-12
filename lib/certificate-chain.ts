import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fetchAsset, fetchAssetsByOwner, mplCore } from "@metaplex-foundation/mpl-core";

import { certificateIdFromChain, type SeenCertificate } from "@/lib/certificate-compare";
import { getOptionalEnv } from "@/lib/server-env";

const DEFAULT_SOLANA_RPC = "https://api.devnet.solana.com";

type ReadableAsset = {
  publicKey: unknown;
  owner: unknown;
  name: string;
  attributes?: { attributeList?: Array<{ key: string; value: string }> };
};

function addressText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function seenFromAsset(asset: ReadableAsset): SeenCertificate | null {
  const assetAddress = addressText(asset.publicKey);
  const ownerAddress = addressText(asset.owner);
  const attribute = asset.attributes?.attributeList?.find((item) => item.key === "certificate")?.value ?? null;
  const certificateId = certificateIdFromChain(asset.name, attribute);
  if (!certificateId || !assetAddress || !ownerAddress) return null;
  return { certificateId, assetAddress, ownerAddress };
}

function umi() {
  const rpc = getOptionalEnv("SOLANA_RPC_URL") ?? DEFAULT_SOLANA_RPC;
  return createUmi(rpc).use(mplCore());
}

export async function ownedCoachCertificates(owner: string) {
  const assets = await fetchAssetsByOwner(umi(), owner, { skipDerivePlugins: true });
  return assets.flatMap((asset) => {
    const seen = seenFromAsset(asset);
    return seen ? [seen] : [];
  });
}

export async function readCoachCertificate(assetAddress: string) {
  try {
    const asset = await fetchAsset(umi(), assetAddress, { skipDerivePlugins: true });
    return seenFromAsset(asset);
  } catch {
    return null;
  }
}
