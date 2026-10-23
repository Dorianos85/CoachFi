import { expect, test, type Page } from "@playwright/test";

const authConfigured = Boolean(
  process.env.NEXT_PUBLIC_CDP_PROJECT_ID?.trim() ||
    (process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
);
const cdpConfigured = Boolean(process.env.NEXT_PUBLIC_CDP_PROJECT_ID?.trim());

async function preparePage(page: Page) {
  await page.route("**/api/mila-token", (route) =>
    route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"QA disables live conversations"}' }),
  );
  await page.addInitScript(() => {
    const timestamp = new Date().toISOString();
    localStorage.clear();
    localStorage.setItem("coachfi-locale-v1", "pl");
    localStorage.setItem("coachfi-consent-v1", JSON.stringify({
      version: "2026-10-14", acceptedAt: timestamp, termsAccepted: true, privacyAccepted: true,
      optional: { aiCoach: true, voice: true, leaderboard: false, blockchain: false },
    }));
    localStorage.setItem("coachfi-mode-v1", JSON.stringify({
      mode: "adult", selectedAt: timestamp, adultConfirmedAt: timestamp, adultAgeRequirement: 18,
    }));
    localStorage.setItem("coachfi-user", JSON.stringify({ name: "QA", goal: "testing", setupDone: true }));
  });
}

async function mockPlayback(page: Page) {
  await page.addInitScript(() => {
    const qa = window as typeof window & {
      __coachfiSpeechCalls: number;
      __coachfiFinishAudio: () => void;
    };
    qa.__coachfiSpeechCalls = 0;
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        cancel: () => {}, resume: () => {}, getVoices: () => [],
        speak: () => { qa.__coachfiSpeechCalls += 1; },
      },
    });
    class FakeAudio {
      volume = 1;
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(_url: string) { qa.__coachfiFinishAudio = () => this.onended?.(); }
      play() { return Promise.resolve(); }
      pause() {}
    }
    Object.defineProperty(window, "Audio", { configurable: true, value: FakeAudio });
  });
}

test.beforeEach(async ({ page }) => { await preparePage(page); });

for (const viewport of [{ width: 320, height: 800 }, { width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`one login opens the existing methods at ${viewport.width}px`, async ({ page }, testInfo) => {
    test.skip(!authConfigured, "Authentication public configuration is absent in this local server.");
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("button", { name: /Język: Polski/ })).toBeVisible();

    const login = page.locator("header").getByRole("button", { name: "Zaloguj", exact: true });
    await expect(login).toHaveCount(1);
    await expect(login).toBeVisible();
    await expect(login).toBeEnabled();
    const bounds = await login.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    await page.locator("header").screenshot({ path: testInfo.outputPath(`header-${viewport.width}.png`) });
    await login.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    if (cdpConfigured) {
      for (const provider of ["Google", "Apple", "X", "Telegram"]) {
        await expect(dialog.getByRole("button", { name: provider, exact: true })).toBeVisible();
      }
      await expect(dialog.getByRole("textbox", { name: "Email", exact: true })).toBeVisible();
      await expect(dialog.getByRole("button", { name: "Wyślij kod", exact: true })).toBeVisible();
      await dialog.screenshot({ path: testInfo.outputPath(`login-methods-${viewport.width}.png`) });
      await dialog.getByRole("button", { name: "Zamknij", exact: true }).click();
    } else {
      await expect(dialog.locator('input[type="email"]')).toBeVisible();
      await expect(dialog.locator('input[type="password"]')).toBeVisible();
      await expect(dialog.getByRole("button", { name: "Wyślij link logowania na e-mail", exact: true })).toBeVisible();
      await dialog.screenshot({ path: testInfo.outputPath(`login-methods-${viewport.width}.png`) });
      await page.keyboard.press("Escape");
    }
    await expect(dialog).toBeHidden();
    await expect(login).toHaveCount(1);
  });
}

test("Mila intro and the next script use provider audio without a browser voice", async ({ page }) => {
  test.skip(true, "External TTS is disabled in P0. Local-only voice and revocation have synthetic adapter tests.");
  await mockPlayback(page);
  const requests: Array<Record<string, unknown>> = [];
  await page.route("**/api/tts", async (route) => {
    requests.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({
      status: 200,
      contentType: "audio/mpeg",
      headers: { "X-CoachFI-Provider": "elevenlabs", "X-CoachFI-Voice-Id": "qa-canonical-mila" },
      body: Buffer.from([73, 68, 51, 4, 0, 0]),
    });
  });
  await page.goto("/voice-demo");
  const intro = page.getByRole("button", { name: "Odtwórz Mila wita użytkownika po Polski", exact: true });
  const score = page.getByRole("button", { name: "Odtwórz Wynik finansowy po Polski", exact: true });
  await expect(intro).toBeVisible();
  await intro.click();
  await expect.poll(() => requests.length).toBe(1);
  await expect(intro).toHaveAttribute("aria-pressed", "true");
  await page.evaluate(() => (window as typeof window & { __coachfiFinishAudio: () => void }).__coachfiFinishAudio());
  await score.click();
  await expect.poll(() => requests.length).toBe(2);
  await expect(score).toHaveAttribute("aria-pressed", "true");
  expect(requests[0].text).not.toEqual(requests[1].text);
  for (const request of requests) {
    expect(request.locale).toBe("pl");
    expect(request).not.toHaveProperty("voiceId");
  }
  expect(await page.evaluate(() => (window as typeof window & { __coachfiSpeechCalls: number }).__coachfiSpeechCalls)).toBe(0);
});

test("provider failure keeps readable text and retry recovers without changing to a browser voice", async ({ page }) => {
  test.skip(true, "External TTS is disabled in P0. Local-only voice and revocation have synthetic adapter tests.");
  await mockPlayback(page);
  let providerReady = false;
  await page.route("**/api/tts", (route) => providerReady
    ? route.fulfill({ status: 200, contentType: "audio/mpeg", body: Buffer.from([73, 68, 51, 4, 0, 0]) })
    : route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"Voice configuration unavailable"}' }),
  );
  await page.goto("/voice-demo");
  const intro = page.getByRole("button", { name: "Odtwórz Mila wita użytkownika po Polski", exact: true });
  await intro.click();
  await expect(intro).toHaveAttribute("aria-busy", "false");
  await expect(page.getByRole("status").filter({ hasText: /głos|Głos|Mili|Mila/ })).toBeVisible();
  await expect(page.getByText(/Cześć.*Mila/).first()).toBeVisible();
  expect(await page.evaluate(() => (window as typeof window & { __coachfiSpeechCalls: number }).__coachfiSpeechCalls)).toBe(0);
  providerReady = true;
  await intro.click();
  await expect(intro).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("status").filter({ hasText: /Głos Mili jest chwilowo niedostępny/ })).toBeHidden();
  expect(await page.evaluate(() => (window as typeof window & { __coachfiSpeechCalls: number }).__coachfiSpeechCalls)).toBe(0);
});
