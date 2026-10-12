export type ChainCertificateId = "money-mindset" | "saving-habit" | "inflation-fighter";

export interface StoredCertificate {
  certificateId: ChainCertificateId;
  status: "owned" | "transferred";
  assetAddress: string;
  ownerAddress: string;
}

export interface SeenCertificate {
  certificateId: ChainCertificateId;
  assetAddress: string;
  ownerAddress: string | null;
}

export interface CertificateUpdate {
  certificateId: ChainCertificateId;
  status: "owned" | "transferred";
  assetAddress: string;
  ownerAddress: string;
}

const CERTIFICATE_IDS: ChainCertificateId[] = ["money-mindset", "saving-habit", "inflation-fighter"];

const CERTIFICATE_LABELS: Record<string, ChainCertificateId> = {
  "saving habit": "saving-habit",
  "saving habit certificate": "saving-habit",
  "money mindset": "money-mindset",
  "money mindset certificate": "money-mindset",
  "inflation fighter": "inflation-fighter",
  "inflation fighter certificate": "inflation-fighter",
};

export function certificateIdFromChain(name: string, certificateAttribute: string | null) {
  if (!name.startsWith("Coach FI - ")) return null;
  const suffix = name.slice("Coach FI - ".length).trim().toLowerCase();
  const attribute = certificateAttribute?.trim().toLowerCase() ?? "";
  return CERTIFICATE_LABELS[attribute] ?? CERTIFICATE_LABELS[suffix] ?? null;
}

export function compareCertificateState(
  rows: StoredCertificate[],
  ownedByWallet: SeenCertificate[],
  storedLooks: SeenCertificate[],
): CertificateUpdate[] {
  const updates: CertificateUpdate[] = [];

  for (const certificateId of CERTIFICATE_IDS) {
    const row = rows.find((item) => item.certificateId === certificateId);
    const owned = ownedByWallet.filter((item) => item.certificateId === certificateId && item.ownerAddress);
    const stillOwned = owned.find((item) => item.assetAddress === row?.assetAddress);
    const kept = stillOwned ?? owned[0];
    if (kept?.ownerAddress) {
      if (!row || row.status !== "owned" || row.assetAddress !== kept.assetAddress || row.ownerAddress !== kept.ownerAddress) {
        updates.push({
          certificateId,
          status: "owned",
          assetAddress: kept.assetAddress,
          ownerAddress: kept.ownerAddress,
        });
      }
      continue;
    }

    const look = storedLooks.find((item) => item.certificateId === certificateId);
    if (!row || !look?.ownerAddress || look.ownerAddress === row.ownerAddress) continue;
    updates.push({
      certificateId,
      status: "transferred",
      assetAddress: row.assetAddress,
      ownerAddress: look.ownerAddress,
    });
  }

  return updates;
}
