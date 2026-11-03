import { expect, test, type Page } from "@playwright/test";

const CONSENT = {
  version: "2026-05-10",
  acceptedAt: new Date().toISOString(),
  termsAccepted: true,
  privacyAccepted: true,
  optional: { aiCoach: true, voice: true, leaderboard: false, blockchain: false },
};

const MODE = {
  mode: "adult",
  selectedAt: new Date().toISOString(),
  adultConfirmedAt: new Date().toISOString(),
};

const USER = { name: "Funnel Tester", goal: "family plan", setupDone: true };

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ consent, mode, user }) => {
      localStorage.clear();
      localStorage.setItem("coachfi-consent-v1", JSON.stringify(consent));
      localStorage.setItem("coachfi-mode-v1", JSON.stringify(mode));
      localStorage.setItem("coachfi-user", JSON.stringify(user));
      localStorage.setItem("coachfi-tokens", "125");
    },
    { consent: CONSENT, mode: MODE, user: USER }
  );
});

async function fillLowScoreAnswers(page: Page) {
  await page.getByLabel("Monthly income ($)").fill("6000");
  await page.getByLabel("Monthly expenses ($)").fill("5200");
  await page.getByLabel("Current savings ($)").fill("3000");
  await page.getByLabel("Total debt ($)").fill("8000");
  await page.getByLabel("Cash on hand ($)").fill("20000");
}

async function unlockScore(page: Page) {
  await page.getByRole("button", { name: "Calculate my score" }).click();

  await expect(page.getByText("Your preview diagnosis is ready")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Score is locked" })).toBeVisible();

  const unlock = page.getByRole("button", { name: "Unlock score and plan" });
  await expect(unlock).toBeDisabled();

  await page.locator('form input[type="email"]').fill("tester@coachfi.local");
  await page.locator('form input[type="checkbox"]').first().check();
  await expect(unlock).toBeEnabled();
  await unlock.click();
}

test("the form starts empty: placeholders only, never demo numbers", async ({ page }) => {
  await page.goto("/health-check");
  for (const label of ["Monthly income ($)", "Monthly expenses ($)", "Current savings ($)", "Total debt ($)", "Cash on hand ($)"]) {
    await expect(page.getByLabel(label)).toHaveValue("");
  }
  await expect(page.getByLabel("Financial goal amount")).toHaveValue("");
});

test("financial health funnel unlocks the 30-day family action plan", async ({ page }) => {
  await page.goto("/health-check");

  await expect(page.getByRole("heading", { name: "How financially healthy are you?" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Score is locked" })).toBeVisible();

  await fillLowScoreAnswers(page);
  await unlockScore(page);

  // No Supabase locally: /api/leads answers 503 and the result still unlocks, with an honest note.
  await expect(page.getByText("We couldn't save your email right now, but your result is unlocked on this device.")).toBeVisible();
  await expect(page.getByText("Your first 30 days with Coach FI")).toBeVisible();
  await expect(page.getByText("30-DAY CHECKLIST")).toBeVisible();
  await expect(page.getByText("Free during early access").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /trial/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Show free help" })).toBeVisible();
});

test("the email gate posts email, locale, consent and score band — never amounts", async ({ page }) => {
  const bodies: Array<Record<string, unknown>> = [];
  await page.route("**/api/leads", async (route) => {
    bodies.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  await page.goto("/health-check");
  await fillLowScoreAnswers(page);
  await page.getByRole("button", { name: "Calculate my score" }).click();
  await page.locator('form input[type="email"]').fill("lead@coachfi.local");
  await page.locator('form input[type="checkbox"]').first().check();
  await page.locator('form input[type="checkbox"]').nth(1).check();
  await page.getByRole("button", { name: "Unlock score and plan" }).click();

  await expect(page.getByText("Your first 30 days with Coach FI")).toBeVisible();
  await expect(page.getByText("We couldn't save your email right now")).toHaveCount(0);
  expect(bodies).toHaveLength(1);
  expect(bodies[0]).toEqual({
    email: "lead@coachfi.local",
    locale: "en",
    marketingConsent: true,
    scoreBand: "0-39",
    source: "health-check",
  });
});

test("completed family-plan action updates checklist progress", async ({ page }) => {
  await page.goto("/health-check");
  await fillLowScoreAnswers(page);
  await unlockScore(page);

  await page.getByRole("button", { name: "Complete: Map income, bills and the biggest leak" }).click();

  await expect(page.getByText("1/4 Completed")).toBeVisible();
  await expect(page.getByText("Earned: +20")).toBeVisible();
});

test("strong score shows optimization plan without crisis CTA", async ({ page }) => {
  await page.goto("/health-check");

  await page.getByLabel("Monthly income ($)").fill("10000");
  await page.getByLabel("Monthly expenses ($)").fill("4000");
  await page.getByLabel("Current savings ($)").fill("50000");
  await page.getByLabel("Total debt ($)").fill("0");
  await page.getByLabel("Cash on hand ($)").fill("3000");
  await page.getByLabel("Do you have an emergency fund?").selectOption("yes");
  await page.getByLabel("Do you understand how inflation affects you?").selectOption("yes");
  await page.getByLabel("Do you have a retirement plan?").selectOption("yes");

  await unlockScore(page);

  await expect(page.getByText("First: optimize and teach")).toBeVisible();
  await expect(page.getByRole("link", { name: "Show free help" })).toHaveCount(0);
});
