import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CONFIRMED_SITE_OWNER,
  getPrivacyReleaseGate,
  resolvePublicPrivacyContact,
  validatePublicPrivacyEmail,
} from "@/lib/privacy-config";

const view = vi.hoisted(() => ({ locale: "pl", contact: null as string | null, voiceText: "" }));
vi.mock("@/context/LanguageContext", () => ({ useLanguage: () => ({ locale: view.locale }) }));
vi.mock("@/components/DataSafetyPanel", () => ({ DataSafetyPanel: () => createElement("div", { "data-local-controls": true }) }));
vi.mock("@/components/VoiceButton", () => ({ VoiceButton: ({ text }: { text: string }) => {
  view.voiceText = text;
  return createElement("span", { "data-voice-props-only": true });
} }));
vi.mock("@/lib/privacy-config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/privacy-config")>();
  return { ...actual, getPublicPrivacyConfig: () => ({ ownerName: actual.CONFIRMED_SITE_OWNER, contactEmail: view.contact }) };
});

import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";

afterEach(() => { view.locale = "pl"; view.contact = null; view.voiceText = ""; });

describe("PR19 public privacy contact and release admission", () => {
  it("admits an explicit operator verification only after conservative email validation", () => {
    // Synthetic format fixture only; this does not provision or contact a mailbox.
    expect(validatePublicPrivacyEmail("privacy+test@COACHFIAI.COM")).toBe("privacy+test@coachfiai.com");
    expect(resolvePublicPrivacyContact("privacy+test@coachfiai.com", "true")).toBe("privacy+test@coachfiai.com");
    for (const flag of [undefined, false, true, "false", "TRUE"]) {
      expect(resolvePublicPrivacyContact("privacy+test@coachfiai.com", flag)).toBeNull();
    }
  });

  it("refuses absent, placeholder, header/query and malformed email input", () => {
    for (const input of [undefined, null, "", "privacy@example.com", "owner@docs.example.com", "owner@unit.invalid", "mailto:owner@coachfiai.com",
      "owner@coachfiai.com?body=private", "owner?bcc=test@coachfiai.com", "owner@coachfiai.com\r\nBcc:other@coachfiai.com",
      " owner@coachfiai.com", "owner..test@coachfiai.com", ".owner@coachfiai.com", "owner@-bad.coachfiai.com", "owner@localhost"]) {
      expect(validatePublicPrivacyEmail(input)).toBeNull();
      expect(resolvePublicPrivacyContact(input, "true")).toBeNull();
    }
  });

  it("never treats a configured email or confirmed owner as policy release approval", () => {
    expect(CONFIRMED_SITE_OWNER).toBe("Dorian Żaczek");
    const missing = getPrivacyReleaseGate();
    const formattedContact = getPrivacyReleaseGate("privacy+test@coachfiai.com");
    expect(missing.ready).toBe(false);
    expect(missing.reasons).toContain("verified_public_contact_mailbox");
    expect(formattedContact.ready).toBe(false);
    expect(formattedContact.reasons).toEqual(expect.arrayContaining([
      "controller_identity_address_and_legal_basis", "retention_and_backups",
      "processors_regions_contracts_and_transfers", "rights_and_complaints_process", "independent_legal_notice_review",
    ]));
  });
});

for (const locale of ["pl", "en"]) {
  for (const [name, Page] of [["privacy", PrivacyPage], ["terms", TermsPage]] as const) {
    it(`${locale} ${name}: visible and prepared spoken copy include owner and missing-contact status`, () => {
      view.locale = locale;
      const html = renderToStaticMarkup(createElement(Page));
      expect(html).toContain("Dorian Żaczek");
      expect(html).toContain('role="status"');
      expect(html).not.toContain("mailto:");
      expect(view.voiceText).toContain("Dorian Żaczek");
      expect(view.voiceText).toMatch(locale === "pl" ? /kontakt.*nie jest jeszcze potwierdzony/i : /contact has not yet been verified/i);
      expect(view.voiceText).toMatch(locale === "pl" ? /nie (?:są jeszcze )?kompletne|Informacje są niepełne/i : /not yet complete|Information is incomplete/i);
    });
  }

  it(`${locale} privacy: distinguishes server processing, hard-off providers and selected local deletion`, () => {
    view.locale = locale;
    const html = renderToStaticMarkup(createElement(PrivacyPage));
    expect(html).toContain('data-local-controls="true"');
    if (locale === "pl") {
      expect(view.voiceText).toContain("serwera aplikacji Coach FI");
      expect(view.voiceText).toContain("nie potwierdza zapisu na serwerze");
      expect(view.voiceText).toContain("Nie zamyka konta");
      expect(view.voiceText).toContain("Zmiana ustawienia opcjonalnego nie włącza");
    } else {
      expect(view.voiceText).toContain("Coach FI application server");
      expect(view.voiceText).toContain("not proof of a server save");
      expect(view.voiceText).toContain("does not close the account");
      expect(view.voiceText).toContain("does not enable these disabled services");
    }
  });
}

it("uses reviewed English legal information for an otherwise unreviewed locale", () => {
  view.locale = "es";
  const html = renderToStaticMarkup(createElement(PrivacyPage));
  expect(html).toContain("Legal information for this version is available in Polish and English.");
  expect(view.voiceText).toContain("External AI, ElevenLabs voice, global leaderboard and blockchain actions are unavailable");
  expect(view.voiceText).not.toContain("solo con consentimiento");
});

it("renders only the injected verified public contact and preserves incomplete-policy warning", () => {
  view.locale = "en";
  view.contact = "privacy+test@coachfiai.com";
  const html = renderToStaticMarkup(createElement(PrivacyPage));
  expect(html).toContain('href="mailto:privacy+test@coachfiai.com"');
  expect(view.voiceText).toContain("privacy+test@coachfiai.com");
  expect(view.voiceText).toContain("Information is incomplete");
});
