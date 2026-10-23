import { expect, test, type Page } from "@playwright/test";

test.skip(true, "Kids Mode is deferred in the adult release. The blocked route and age gate are tested in p0-safety.spec.ts.");

// E2E for the Kids Mode entry: mode selector → Kids → Kids dashboard, with no
// parent/guardian consent step. Required consent is seeded so that only the
// mode selector stands between a fresh profile and the app.

const CONSENT = {
  version: "2026-05-10",
  acceptedAt: new Date().toISOString(),
  termsAccepted: true,
  privacyAccepted: true,
  optional: { aiCoach: true, voice: true, leaderboard: false, blockchain: false },
};

const USER = { name: "Kids Tester", goal: "testing", setupDone: true };

const PARENT_COPY = /parent|rodzic|opiekun/i;

async function seed(page: Page, mode?: Record<string, string>) {
  await page.addInitScript(
    ({ consent, user, mode }) => {
      localStorage.setItem("coachfi-consent-v1", JSON.stringify(consent));
      localStorage.setItem("coachfi-user", JSON.stringify(user));
      if (mode) localStorage.setItem("coachfi-mode-v1", JSON.stringify(mode));
    },
    { consent: CONSENT, user: USER, mode }
  );
}

function modeSelector(page: Page) {
  return page.getByRole("dialog", { name: "Who is using Coach FI?" });
}

function storedMode(page: Page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem("coachfi-mode-v1");
    return raw ? (JSON.parse(raw) as { mode?: string }).mode ?? null : null;
  });
}

async function expectKidsDashboard(page: Page) {
  await expect(page.getByRole("heading", { name: "Learning modules" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "My stars" })).toBeVisible();
  await expect(page.locator("main").getByText(PARENT_COPY)).toHaveCount(0);
}

test("mode selector enters Kids Mode directly and survives a reload", async ({ page }) => {
  await seed(page);
  await page.goto("/");

  const dialog = modeSelector(page);
  await expect(dialog).toBeVisible();
  // Only the adult confirmation is left in the selector: no parent name, no parent consent.
  await expect(dialog.getByRole("textbox")).toHaveCount(0);
  await expect(dialog.getByRole("checkbox")).toHaveCount(1);
  await expect(dialog.getByText(PARENT_COPY)).toHaveCount(0);

  const enterKids = dialog.getByRole("button", { name: "Enter Kids Mode" });
  await expect(enterKids).toBeEnabled();
  await enterKids.click();

  await expect(page).toHaveURL(/\/kids$/);
  await expect(dialog).toBeHidden();
  await expectKidsDashboard(page);
  await expect.poll(() => storedMode(page)).toBe("kids");

  await page.reload();
  await expectKidsDashboard(page);
  await expect(modeSelector(page)).toHaveCount(0);
  await expect(page.getByText(/Kids Mode is active/)).toBeVisible();
});

test("Kids Mode entry is reachable above the mobile navigation at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.goto("/");

  await modeSelector(page).getByRole("button", { name: "Enter Kids Mode" }).click();

  await expect(page).toHaveURL(/\/kids$/);
  await expectKidsDashboard(page);
});

test("a stored kids mode needs no consent flag", async ({ page }) => {
  await seed(page, { mode: "kids", selectedAt: new Date().toISOString() });
  await page.goto("/kids");

  await expectKidsDashboard(page);
  await expect(modeSelector(page)).toHaveCount(0);
  // Kids navigation: the adult destinations are not offered.
  await expect(page.getByRole("link", { name: "Rewards" })).toHaveCount(0);
});

test("/kids opens directly from Adult Mode", async ({ page }) => {
  const now = new Date().toISOString();
  await seed(page, { mode: "adult", selectedAt: now, adultConfirmedAt: now });
  await page.goto("/kids");

  await expectKidsDashboard(page);
  await expect(modeSelector(page)).toHaveCount(0);
  await expect.poll(() => storedMode(page)).toBe("adult");
});

test("Adult Mode entry still asks for the adult confirmation", async ({ page }) => {
  await seed(page);
  await page.goto("/");

  const dialog = modeSelector(page);
  const enterAdult = dialog.getByRole("button", { name: "Enter Adult Mode" });
  await expect(enterAdult).toBeDisabled();

  await dialog.getByRole("checkbox").check();
  await enterAdult.click();

  await expect(dialog).toBeHidden();
  await expect.poll(() => storedMode(page)).toBe("adult");
});
