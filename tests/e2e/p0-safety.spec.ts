import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { CONSENT_VERSION } from "../../lib/consent";

const now = new Date().toISOString();
const optional = { aiCoach: false, voice: false, leaderboard: false, blockchain: false };
const adult = { mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 };

async function seed(page: Page, locale: "pl" | "en", accepted = true, allOptional = false) {
  await page.addInitScript(({ locale, accepted, allOptional, now, optional, adult, version }) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("coachfi-locale-v1", locale);
    localStorage.setItem("coachfi-user", JSON.stringify({ name: "Synthetic QA", goal: "testing", setupDone: true }));
    if (accepted) {
      localStorage.setItem("coachfi-mode-v1", JSON.stringify(adult));
      localStorage.setItem("coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now,
        termsAccepted: true, privacyAccepted: true,
        optional: allOptional ? { aiCoach: true, voice: true, leaderboard: true, blockchain: true } : optional }));
    }
  }, { locale, accepted, allOptional, now, optional, adult, version: CONSENT_VERSION });
}

test.beforeEach(async ({ context }) => {
  // No real third-party traffic is permitted from this isolated test browser.
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return url.hostname === "127.0.0.1" ? route.continue() : route.abort();
  });
});

for (const locale of ["pl", "en"] as const) {
  test(`${locale}: required-only consent leaves every optional choice off and enforces age confirmation`, async ({ page }) => {
    await seed(page, locale, false);
    await page.goto("/");
    await page.getByRole("button", { name: locale === "pl" ? "Akceptuj wymagane" : "Accept required", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: locale === "pl" ? "Witaj w Coach FI" : "Welcome to Coach FI", exact: true });
    await expect(dialog).toBeVisible();
    const enter = dialog.getByRole("button", { name: locale === "pl" ? "Kontynuuj jako osoba dorosła" : "Continue as an adult" });
    await expect(enter).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    for (let index = 0; index < 4; index++) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    }
    await dialog.getByRole("checkbox").check();
    await enter.click();
    await expect(dialog).toBeHidden();
    const records = await page.evaluate(() => ({
      consent: JSON.parse(localStorage.getItem("coachfi-consent-v1")!),
      mode: JSON.parse(localStorage.getItem("coachfi-mode-v1")!),
    }));
    expect(records.consent.optional).toEqual(optional);
    expect(records.mode.adultAgeRequirement).toBe(18);
  });

  test(`${locale}: export preserves diagnosis but excludes credentials and nested unexpected fields`, async ({ page }) => {
    await seed(page, locale);
    await page.goto("/privacy");
    await page.evaluate((now) => {
      localStorage.setItem("coachfi-auth", JSON.stringify({ accessToken: "TEST_AUTH_MARKER" }));
      localStorage.setItem("cdp-session", "TEST_SDK_MARKER");
      localStorage.setItem("coachfi-user", JSON.stringify({ name: "TEST_NAME_MARKER", setupDone: true, accessToken: "TEST_NESTED_MARKER" }));
      localStorage.setItem("coachfi-health-check", JSON.stringify({ score: 50, createdAt: now,
        accessToken: "TEST_NESTED_MARKER", answers: { monthlyIncome: 4000, savings: 1000, hasEmergencyFund: false,
          unexpected: { refreshToken: "TEST_NESTED_MARKER" } } }));
      sessionStorage.setItem("coachfi-tokens", "42");
      sessionStorage.setItem("coachfi-auth", "TEST_AUTH_MARKER");
    }, now);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: locale === "pl" ? "Eksportuj dane" : "Export data", exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("coachfi-data-export.json");
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    const serialized = await readFile(downloadPath!, "utf8");
    expect(serialized).not.toMatch(/TEST_(AUTH|SDK|NESTED|NAME)_MARKER|accessToken|refreshToken/);
    const payload = JSON.parse(serialized);
    expect(payload.localStorage["coachfi-health-check"].answers.monthlyIncome).toBe(4000);
    expect(payload.sessionStorage["coachfi-tokens"]).toBe(42);
    expect(payload.scope).toBe("selected_current_owner_local_product_data");
    expect(payload.version).toBe(2);
    expect(payload.ownerKind).toBe("guest");
    await expect(page.getByText(locale === "pl" ? /Nie usuwa konta ani danych u dostawców/ : /It does not delete your account or provider data/)).toBeVisible();
  });

  test(`${locale}: optional consent never mounts the disabled voice widget and guest chat remains local`, async ({ page }) => {
    let protectedRequests = 0;
    page.on("request", (request) => { if (/\/api\/(?:chat|tts|mila-token)(?:\?|$)|elevenlabs|convai-widget/.test(request.url())) protectedRequests++; });
    await seed(page, locale, true, true);
    await page.goto("/coach");
    await expect(page.getByTestId("mila-provider-disabled")).toBeVisible();
    await expect(page.locator("elevenlabs-convai")).toHaveCount(0);
    const replies = page.getByLabel("Coach chat").locator(".justify-start");
    const initialReplyCount = await replies.count();
    const input = page.locator("main form input").first();
    await input.fill(locale === "pl" ? "Jak zacząć oszczędzać?" : "How can I start saving?");
    await input.press("Enter");
    await expect(input).toBeEnabled({ timeout: 20_000 });
    await expect(input).toHaveValue("");
    await expect(replies).toHaveCount(initialReplyCount + 1);
    await expect(replies.last().locator(".whitespace-pre-wrap")).not.toHaveText("");
    expect(protectedRequests).toBe(0);
  });
}

for (const locale of ["pl", "en"] as const) {
test(`${locale}: deferred routes and APIs cannot mount wallet, leaderboard, Kids or marketplace interactions`, async ({ page, request }) => {
  await seed(page, locale);
  for (const path of ["/kids", "/vault", "/partner", "/achievement"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: locale === "pl" ? "Ta funkcja jest niedostępna w tej wersji" : "This feature is unavailable in this release" })).toBeVisible();
    await expect(page.locator("elevenlabs-convai")).toHaveCount(0);
  }
  for (const path of ["/api/leaderboard", "/api/certificates", "/api/vault"]) {
    expect((await request.get(path)).status()).toBe(404);
  }
  expect((await request.post("/api/mint-nft", { data: {} })).status()).toBe(404);
  expect((await request.get("/api/mila-token")).status()).toBe(405);
  const status = await request.get("/api/status");
  expect(status.status()).toBe(200);
  const policy = await status.json();
  expect(policy.scope).toBe("local_release_policy");
  expect(policy.externalProbesPerformed).toBe(false);
  expect(policy.services.voice.externalEnabled).toBe(false);
  expect(JSON.stringify(policy)).not.toMatch(/agentId|voiceId|rpcUrl|mintAuthority|privateKey/);
  for (const [path, data] of [["/api/chat", { message: "hello", mode: "external" }], ["/api/tts", { text: "hello" }], ["/api/mila-token", {}]] as const) {
    expect((await request.post(path, { data })).status()).toBe(503);
  }
  const local = await request.post("/api/chat", { data: { message: "saving", mode: "local", locale: "en" } });
  expect(local.status()).toBe(200);
  expect(local.headers()["x-coachfi-provider"]).toBe("local");
});
}

test("local read-aloud starts only on click and consent withdrawal cancels active playback", async ({ page }) => {
  await seed(page, "pl", true, true);
  await page.addInitScript(() => {
    const qa = window as typeof window & { __p0Speech: { calls: Array<{ lang: string; local: boolean }>; cancels: number } };
    qa.__p0Speech = { calls: [], cancels: 0 };
    class TestUtterance {
      voice: { lang: string; localService: boolean } | null = null;
      lang = "";
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(public text: string) {}
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: TestUtterance });
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
      getVoices: () => [{ lang: "pl-PL", localService: false }, { lang: "pl-PL", localService: true }],
      cancel: () => { qa.__p0Speech.cancels++; },
      speak: (utterance: TestUtterance) => {
        qa.__p0Speech.calls.push({ lang: utterance.lang, local: utterance.voice?.localService === true });
        utterance.onstart?.();
      },
    } });
  });
  await page.goto("/coach");
  const read = page.getByLabel("Coach chat").getByRole("button").first();
  await expect(read).toBeVisible();
  expect(await page.evaluate(() => (window as typeof window & { __p0Speech: { calls: unknown[] } }).__p0Speech.calls)).toEqual([]);
  await read.click();
  await expect(read).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => (window as typeof window & { __p0Speech: { calls: unknown[] } }).__p0Speech.calls)).toEqual([{ lang: "pl-PL", local: true }]);
  const before = await page.evaluate(() => (window as typeof window & { __p0Speech: { cancels: number } }).__p0Speech.cancels);
  await page.evaluate(() => {
    const consent = JSON.parse(localStorage.getItem("coachfi-consent-v1")!);
    consent.optional.voice = false;
    localStorage.setItem("coachfi-consent-v1", JSON.stringify(consent));
    window.dispatchEvent(new Event("coachfi-consent-change"));
  });
  await expect(read).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => (window as typeof window & { __p0Speech: { cancels: number } }).__p0Speech.cancels)).toBeGreaterThan(before);
});
