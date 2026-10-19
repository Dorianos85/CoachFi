/** Public information only. Never put credentials or private mailbox settings here. */
export const CONFIRMED_SITE_OWNER = "Dorian Żaczek";

// These facts have not been supplied/independently accepted. A formatted email
// or successful build must not turn this into a production/privacy approval.
export const PRIVACY_RELEASE_GAPS = Object.freeze([
  "controller_identity_address_and_legal_basis",
  "retention_and_backups",
  "processors_regions_contracts_and_transfers",
  "rights_and_complaints_process",
  "independent_legal_notice_review",
] as const);

export function validatePublicPrivacyEmail(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 254 || /[\s<>\u0000-\u001f\u007f]/.test(value)) return null;
  // Conservative public-contact subset; reject mailto query/header syntax.
  const match = /^([A-Za-z0-9._+-]+)@([A-Za-z0-9.-]+)$/.exec(value);
  if (!match || match[1].length > 64 || match[1].startsWith(".") || match[1].endsWith(".") || match[1].includes("..")) return null;
  const domain = match[2].toLowerCase();
  const labels = domain.split(".");
  if (labels.length < 2 || labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return null;
  if (/\.(?:invalid|test|example|localhost)$/.test(domain) || /(?:^|\.)example\.(?:com|org|net)$/.test(domain) || domain === "localhost") return null;
  return `${match[1]}@${domain}`;
}

export function resolvePublicPrivacyContact(email: unknown, verified: unknown): string | null {
  // This flag is an operator assertion after provisioning, not a mailbox test.
  return verified === "true" ? validatePublicPrivacyEmail(email) : null;
}

export function getPublicPrivacyConfig() {
  return {
    ownerName: CONFIRMED_SITE_OWNER,
    contactEmail: resolvePublicPrivacyContact(
      process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL,
      process.env.NEXT_PUBLIC_PRIVACY_CONTACT_VERIFIED,
    ),
  };
}

export function getPrivacyContactCopy(locale: "pl" | "en") {
  return locale === "pl" ? {
    title: "Właściciel i kontakt",
    ownerLabel: "Potwierdzony właściciel Coachfiai.com: ",
    pending: "Kontakt dotyczący prywatności i reklamacji nie jest jeszcze potwierdzony. Nie wysyłaj danych na niezweryfikowane adresy.",
    scope: "Informacje prawne tej wersji są dostępne po polsku i angielsku.",
  } : {
    title: "Owner and contact",
    ownerLabel: "Confirmed owner of Coachfiai.com: ",
    pending: "The privacy and complaints contact has not yet been verified. Do not send data to unverified addresses.",
    scope: "Legal information for this version is available in Polish and English.",
  };
}

/** Root release preflight must keep production blocked while reasons remain. */
export function getPrivacyReleaseGate(contactEmail: unknown = null) {
  return {
    ready: false as const,
    reasons: [
      ...(validatePublicPrivacyEmail(contactEmail) ? [] : ["verified_public_contact_mailbox"]),
      ...PRIVACY_RELEASE_GAPS,
    ],
  };
}
