import { expect, test, type Page } from "@playwright/test";

// Honest-data regressions from the QA readiness report (06): no fake mint,
// no demo numbers presented as the user's, consents off by default, streak
// and points survive a reload, demo artefacts gone.

const MODE = { mode: "adult", selectedAt: new Date().toISOString(), adultConfirmedAt: new Date().toISOString() };
const USER = { name: "Honest Tester", goal: "testing", setupDone: true };

function consent(optional: Partial<Record<"aiCoach" | "voice" | "leaderboard" | "blockchain", boolean>> = {}) {
  return {
    version: "2026-05-10",
    acceptedAt: new Date().toISOString(),
    termsAccepted: true,
    privacyAccepted: true,
    optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false, ...optional },
  };
}

async function seed(page: Page, extra: Record<string, string> = {}, withConsent: object | null = consent()) {
  await page.addInitScript(
    ({ mode, user, consentRecord, extraItems }) => {
      if (sessionStorage.getItem("qa-seeded")) return;
      sessionStorage.setItem("qa-seeded", "1");
      localStorage.clear();
      localStorage.setItem("coachfi-mode-v1", JSON.stringify(mode));
      localStorage.setItem("coachfi-user", JSON.stringify(user));
      if (consentRecord) localStorage.setItem("coachfi-consent-v1", JSON.stringify(consentRecord));
      for (const [key, value] of Object.entries(extraItems)) localStorage.setItem(key, value);
    },
    { mode: MODE, user: USER, consentRecord: withConsent, extraItems: extra },
  );
}

const today = () => new Date().toISOString().split("T")[0];

test("'Accept required' is clickable above the mobile nav and leaves optional consents off", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, {}, null);
  await page.goto("/");
  await page.getByRole("button", { name: "Review settings" }).click();
  const dialog = page.getByRole("dialog", { name: "Coach FI terms of use" });
  await expect(dialog).toBeVisible();
  for (const name of ["AI Coach Mila", "ElevenLabs voice"]) {
    await expect(dialog.getByRole("switch", { name })).toHaveAttribute("aria-checked", "false");
  }
  await dialog.getByRole("checkbox").check();
  // A normal click (no force) fails if the bottom nav intercepts pointer events.
  await dialog.getByRole("button", { name: "Accept required" }).click();
  await expect(dialog).toBeHidden();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("coachfi-consent-v1") ?? "{}"));
  expect(stored.optional).toEqual({ aiCoach: false, voice: false, leaderboard: false, blockchain: false });
});

test("the consent banner's 'Accept required' does not enable AI or voice; Mila then asks inline", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, {}, null);
  await page.goto("/");
  await page.getByRole("button", { name: "Accept required" }).click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("coachfi-consent-v1") ?? "{}"));
  expect(stored.optional.aiCoach).toBe(false);
  expect(stored.optional.voice).toBe(false);

  // The ~460 kB widget script is not fetched for a user who has not opened Mila.
  expect(await page.locator('script[src*="convai-widget"]').count()).toBe(0);
  const launcher = page.getByTestId("mila-launcher");
  await expect(launcher).toBeVisible();
  await launcher.click();
  const prompt = page.getByTestId("mila-consent-prompt");
  await expect(prompt).toBeVisible();
  await expect(prompt.getByRole("button", { name: "Allow and start" })).toBeVisible();
  await prompt.getByRole("button", { name: "Not now" }).click();
  await expect(prompt).toBeHidden();
  expect(await page.locator('script[src*="convai-widget"]').count()).toBe(0);
});

test("streak and points survive a reload (no 0 after load)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await seed(page, {
    "coachfi-streak": JSON.stringify({ currentStreak: 4, longestStreak: 4, lastActiveDate: today() }),
    "coachfi-tokens": "75",
  });
  for (const path of ["/", "/challenge", "/rewards"]) {
    await page.goto(path);
    await expect(page.getByLabel(/4 day streak/i).first()).toBeVisible();
    await expect(page.locator("header").getByText("75 points")).toBeVisible();
    await page.reload();
    await expect(page.getByLabel(/4 day streak/i).first()).toBeVisible();
  }
});

test("new users start with 0 points and see no demo balance, invented players or hackathon badge", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await seed(page);
  await page.goto("/quiz");
  await expect(page.locator("header").getByText("0 points")).toBeVisible();
  await expect(page.getByText(/Mock point balance/i)).toHaveCount(0);
  await expect(page.getByTestId("leaderboard-empty")).toBeVisible();
  for (const name of ["Aleksandra K.", "Marek W.", "Julia P."]) await expect(page.getByText(name)).toHaveCount(0);
  await expect(page.getByText("Hackathon MVP")).toHaveCount(0);
});

test("Yield Vault and Partner are not in any menu, but their routes still work", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await seed(page);
  await page.goto("/");
  const nav = page.getByRole("complementary", { name: "Primary navigation" });
  await nav.getByText("More", { exact: true }).click();
  await expect(nav.getByRole("link", { name: "Quiz" })).toBeVisible();
  await expect(page.locator('a[href="/vault"], a[href="/partner"]')).toHaveCount(0);
  expect((await page.goto("/vault"))?.status()).toBe(200);
  expect((await page.goto("/partner"))?.status()).toBe(200);
});

test("dashboard labels examples before a Health Check and shows the user's own numbers after", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await seed(page);
  await page.goto("/");
  await expect(page.getByTestId("home-score")).toHaveText("62");
  await expect(page.getByText("Example", { exact: true }).first()).toBeVisible();
  await expect(page.getByLabel("Primary navigation").getByText("62")).toBeVisible();

  await page.evaluate(() => {
    localStorage.setItem(
      "coachfi-health-check",
      JSON.stringify({
        score: 28,
        answers: { monthlyIncome: 4200, monthlyExpenses: 3900, savings: 1500, debt: 12000, cashHeld: 300 },
        createdAt: new Date().toISOString(),
      }),
    );
  });
  await page.reload();
  await expect(page.getByTestId("home-score")).toHaveText("28");
  await expect(page.getByLabel("Primary navigation").getByText("28")).toBeVisible();
  // Half of the real $300 surplus, never the fixed $500.
  await expect(page.getByTestId("home-next-step")).toContainText("$150");
  await expect(page.getByText("3.2 / 6 mo.")).toHaveCount(0);
  await expect(page.getByText("medium debt load")).toBeVisible();

  await page.goto("/achievement");
  await expect(page.getByText("28", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("coachfiai.com").first()).toBeVisible();
});

test("achievement without a Health Check shows no invented score", async ({ page }) => {
  await seed(page);
  await page.goto("/achievement");
  await expect(page.getByTestId("achievement-no-score")).toBeVisible();
  await expect(page.getByText("72")).toHaveCount(0);
});

test("rewards never fakes a mint: readiness comes from progress and failures are reported honestly", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let mintCalls = 0;
  await page.route("**/api/mint-nft", async (route) => {
    mintCalls += 1;
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, fallback: true }) });
  });
  await seed(page, {}, consent({ blockchain: true }));
  await page.goto("/rewards");
  // Fresh user: nothing earned, nothing "Ready", the mint button is disabled.
  await expect(page.getByTestId("mint-status")).toContainText("No certificate is ready yet");
  await expect(page.getByText("Ready", { exact: true })).toHaveCount(0);
  await expect(page.getByTestId("mint-card").getByRole("button")).toBeDisabled();

  // Finish the first stage: the Money Mindset certificate becomes ready.
  await page.evaluate(() => {
    localStorage.setItem("coachfi-learn-manual", JSON.stringify({ "money-mindset": "completed" }));
    window.dispatchEvent(new Event("coachfi-learning"));
  });
  await expect(page.getByTestId("mint-status")).toContainText("Ready to record: Money Mindset certificate.");
  // No accounts in this build: an honest explanation, never a random transaction hash.
  await expect(page.getByTestId("mint-status")).toContainText("needs an account");
  await expect(page.getByTestId("mint-card").getByRole("button")).toBeDisabled();
  await expect(page.getByText("Certificate minted on Solana Devnet")).toHaveCount(0);
  expect(mintCalls).toBe(0);
});
