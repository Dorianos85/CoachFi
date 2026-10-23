export type CertificateCardId = "money-mindset" | "saving-habit" | "inflation-fighter";
export type CertificateCardLabel = "minted" | "transferred" | "ready" | "locked";

export const CERTIFICATE_STAGE_IDS: Record<CertificateCardId, string> = {
  "money-mindset": "money-mindset",
  "saving-habit": "saving-habit",
  "inflation-fighter": "inflation",
};

export function certificateCardLabel(
  stageCompleted: boolean,
  rowStatus: "owned" | "transferred" | null,
  mintAvailable = false,
): CertificateCardLabel {
  if (rowStatus === "owned") return "minted";
  if (rowStatus === "transferred") return "transferred";
  if (stageCompleted || mintAvailable) return "ready";
  return "locked";
}
