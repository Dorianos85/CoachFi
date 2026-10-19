import { test, expect } from "@playwright/test";
import { CONSENT_VERSION } from "../../lib/consent";
import { PERSONAL_STORAGE_KEYS } from "../../lib/product-storage";

test.beforeEach(async ({ context }) => {
  await context.route("**/*", route => new URL(route.request().url()).hostname === "127.0.0.1" ? route.continue() : route.abort());
});

for (const locale of ["pl", "en"] as const) {
  test(`${locale}: deleting current guest removes both personal stores and preserves account namespace, auth and device preferences after real reload`, async ({ page }) => {
    await page.addInitScript(({ locale, version }) => {
      // This marker is test-only and prevents re-seeding after the UI's actual reload.
      if (sessionStorage.getItem("FIXTURE_INITIALIZED")) return;
      sessionStorage.setItem("FIXTURE_INITIALIZED", "1");
      const now = new Date().toISOString();
      localStorage.setItem("coachfi-locale-v1", locale);
      localStorage.setItem("coachfi-accessibility-v1", JSON.stringify({ highContrast: true, textScale: "large" }));
      localStorage.setItem("coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now,
        termsAccepted: true, privacyAccepted: true, optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
      localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 }));
      localStorage.setItem("coachfi-user", JSON.stringify({ name: "FIXTURE_GUEST", setupDone: true }));
    }, { locale, version: CONSENT_VERSION });
    await page.goto("/privacy");
    await expect(page.getByRole("button", { name: locale === "pl" ? "Usuń dane lokalne" : "Delete local data", exact: true })).toBeVisible();
    await page.evaluate(keys => {
      for (const key of keys) {
        if (!localStorage.getItem(key)) localStorage.setItem(key, "FIXTURE_GUEST_PERSONAL");
        sessionStorage.setItem(key, "FIXTURE_GUEST_SESSION");
        localStorage.setItem(`coachfi-owned:v1:cdp:FIXTURE_A:${key}`, "FIXTURE_ACCOUNT_KEEP");
        sessionStorage.setItem(`coachfi-owned:v1:cdp:FIXTURE_A:${key}`, "FIXTURE_ACCOUNT_KEEP");
      }
      localStorage.setItem("coachfi-auth", "FIXTURE_AUTH_KEEP");
      sessionStorage.setItem("cdp-session", "FIXTURE_AUTH_KEEP");
    }, [...PERSONAL_STORAGE_KEYS]);
    const navigation = page.waitForEvent("domcontentloaded");
    await page.getByRole("button", { name: locale === "pl" ? "Usuń dane lokalne" : "Delete local data", exact: true }).click();
    await navigation;
    await expect(page.getByRole("button", { name: locale === "pl" ? "Akceptuj wymagane" : "Accept required", exact: true })).toBeVisible();
    const observed = await page.evaluate(keys => ({
      personal: keys.map(key => [localStorage.getItem(key), sessionStorage.getItem(key)]),
      account: keys.map(key => [localStorage.getItem(`coachfi-owned:v1:cdp:FIXTURE_A:${key}`), sessionStorage.getItem(`coachfi-owned:v1:cdp:FIXTURE_A:${key}`)]),
      auth: [localStorage.getItem("coachfi-auth"), sessionStorage.getItem("cdp-session")],
      locale: localStorage.getItem("coachfi-locale-v1"),
      accessibility: JSON.parse(localStorage.getItem("coachfi-accessibility-v1")!),
    }), [...PERSONAL_STORAGE_KEYS]);
    expect(observed.personal).toEqual(PERSONAL_STORAGE_KEYS.map(() => [null, null]));
    expect(observed.account).toEqual(PERSONAL_STORAGE_KEYS.map(() => ["FIXTURE_ACCOUNT_KEEP", "FIXTURE_ACCOUNT_KEEP"]));
    expect(observed.auth).toEqual(["FIXTURE_AUTH_KEEP", "FIXTURE_AUTH_KEEP"]);
    expect(observed.locale).toBe(locale); expect(observed.accessibility).toEqual({ highContrast: true, textScale: "large" });
  });
}
