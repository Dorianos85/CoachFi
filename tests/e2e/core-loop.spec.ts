import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { getDailyQuestion } from "../../data/challengeQuestions";

// E2E smoke tests for the core habit loop: Daily Challenge → answer → reward → streak.
// localStorage is seeded before each page load so onboarding/consent/mode modals
// don't block the flow (the app is local-first; no login required).

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

const USER = { name: "E2E Tester", goal: "testing", setupDone: true };

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ consent, mode, user }) => {
      localStorage.setItem("coachfi-consent-v1", JSON.stringify(consent));
      localStorage.setItem("coachfi-mode-v1", JSON.stringify(mode));
      localStorage.setItem("coachfi-user", JSON.stringify(user));
    },
    { consent: CONSENT, mode: MODE, user: USER }
  );
});

test("home page renders the app shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("header").first()).toBeVisible();
  // Streak badge starts at 0 for a fresh profile.
  await expect(page.getByLabel(/0 day streak/i).first()).toBeVisible();
});

test("daily challenge: answer → feedback banner appears", async ({ page }) => {
  await page.goto("/challenge");

  // Pick the first answer option (A) and submit.
  const answerA = answerOption(page, "A");
  await expect(answerA).toBeVisible();
  await answerA.click();

  const submit = page.getByRole("button", { name: "Submit answer" });
  await expect(submit).toBeEnabled();
  await submit.click();

  // Either outcome must produce a visible feedback banner (correct or retry copy).
  await expect(
    page.getByText(/Correct! You earned|Not this time/).first()
  ).toBeVisible();
});

test("correct challenge answer marks the streak", async ({ page }) => {
  await page.goto("/challenge");
  await waitForChallengeQuestion(page);

  await answerOption(page, getDailyQuestion().correctAnswer).click();
  await page.getByRole("button", { name: "Submit answer" }).click();

  // Completed today: streak badge, stored streak and completed state update immediately.
  await expect(page.getByLabel(/1 day streak/i).first()).toBeVisible();
  await expect(page.getByText("Challenge completed!")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = localStorage.getItem("coachfi-streak");
        return raw ? JSON.parse(raw).currentStreak : 0;
      })
    )
    .toBe(1);
});

function answerOption(page: Page, letter: string) {
  return page
    .getByRole("button")
    .filter({ has: page.locator("span", { hasText: new RegExp(`^${letter}$`) }) })
    .first();
}

async function waitForChallengeQuestion(page: Page) {
  await expect(answerOption(page, "A")).toBeVisible();
}
