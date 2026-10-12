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

test("financial health funnel unlocks the 30-day family action plan", async ({ page }) => {
  await page.goto("/health-check");

  await expect(page.getByRole("heading", { name: "How financially healthy are you?" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Score is locked" })).toBeVisible();

  await unlockScore(page);

  await expect(page.getByText("Your first 30 days with Coach FI")).toBeVisible();
  await expect(page.getByText("30-DAY CHECKLIST")).toBeVisible();
  await expect(page.getByText("Mila Voice Coach Trial", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start 7-day trial" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Show free help" })).toBeVisible();
});

test("completed family-plan action updates checklist progress", async ({ page }) => {
  await page.goto("/health-check");
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
