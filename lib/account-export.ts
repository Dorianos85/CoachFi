import type { AccountRecord, CertificateRecord } from "@/lib/account-store";
import { sanitizeProductValue } from "@/lib/data-export";

const PRODUCT_FIELDS = [
  ["srs", "coachfi-srs"], ["learnManual", "coachfi-learn-manual"],
  ["streak", "coachfi-streak"], ["tokens", "coachfi-tokens"],
  ["avatar", "coachfi-avatar"], ["profile", "coachfi-user"],
  ["challenge", "coachfi-challenge"],
] as const;
const CERTIFICATE_IDS = ["money-mindset", "saving-habit", "inflation-fighter"];

/** Selected application facts only. This is not a complete provider-data export. */
export function buildAccountDataExport(owner: string, account: AccountRecord | null, certificates: CertificateRecord[]) {
  if ((account && account.cdpUserId !== owner) || certificates.some((certificate) => certificate.cdpUserId !== owner)) {
    throw new Error("Account export owner mismatch");
  }
  const applicationData: Record<string, unknown> = {};
  if (account?.state?.version === 1) {
    for (const [field, key] of PRODUCT_FIELDS) {
      const clean = sanitizeProductValue(key, account.state[field]);
      if (clean !== undefined) applicationData[key] = clean;
    }
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    scope: "selected_verified_owner_application_data",
    consistency: "independent_reads",
    omitted: ["provider_identity_and_sessions", "free_text_and_raw_profiles", "local_device_data",
      "health_and_vault_data", "chain_addresses_and_transactions", "unrecognized_or_invalid_fields"],
    accountPresent: account !== null,
    applicationData,
    certificates: certificates.flatMap((certificate) => {
      if (!CERTIFICATE_IDS.includes(certificate.certificateId) ||
          (certificate.status !== "owned" && certificate.status !== "transferred") ||
          typeof certificate.minted !== "boolean") return [];
      return [{ certificateId: certificate.certificateId, status: certificate.status, minted: certificate.minted }];
    }),
  };
}
