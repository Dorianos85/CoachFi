import { expect, test, type Page } from "@playwright/test";
import { CONSENT_CHANGED_EVENT, CONSENT_VERSION } from "../../lib/consent";

async function seed(page: Page, locale: "pl" | "en", required = true) {
  await page.addInitScript(({ locale, required, version }) => {
    if (sessionStorage.getItem("synthetic-health-integrity")) return;
    localStorage.clear(); sessionStorage.setItem("synthetic-health-integrity", "true");
    const now = new Date().toISOString();
    localStorage.setItem("coachfi-locale-v1", locale);
    localStorage.setItem("coachfi-user", JSON.stringify({ setupDone: true, name: "Synthetic health test", goal: "education" }));
    localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 }));
    if (required) localStorage.setItem("coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now,
      termsAccepted: true, privacyAccepted: true, optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
  }, { locale, required, version: CONSENT_VERSION });
}
async function zeroAnswers(page: Page) {
  for (const key of ["monthlyIncome", "monthlyExpenses", "savings", "debt", "cashHeld"]) await page.locator(`input[name="${key}"]`).fill("0");
  for (const key of ["hasEmergencyFund", "understandsInflation", "hasRetirementPlan", "investsAlready"]) await page.locator(`select[name="${key}"]`).selectOption("no");
}
test.beforeEach(async ({ context }) => {
  await context.route("**/*", (route) => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
});

for (const locale of ["pl", "en"] as const) {
  const submit = locale === "pl" ? "Oblicz lokalny wynik" : "Calculate local score";
  test(`${locale}: missing and negative amounts do not save, explicit zero does`, async ({ page }) => {
    await seed(page, locale); await page.goto("/health-check");
    await page.getByRole("button", { name: submit, exact: true }).click();
    await expect(page.locator('input[name="monthlyIncome"]')).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator('input[name="monthlyIncome"]')).toBeFocused();
    expect(await page.evaluate(() => localStorage.getItem("coachfi-health-check"))).toBeNull();
    await zeroAnswers(page); await page.locator('input[name="monthlyIncome"]').fill("-1");
    await page.getByRole("button", { name: submit, exact: true }).click();
    await expect(page.locator('input[name="monthlyIncome"]')).toHaveAttribute("aria-invalid", "true");
    await page.locator('input[name="monthlyIncome"]').fill("0");
    await page.getByRole("button", { name: submit, exact: true }).click();
    await expect(page.getByTestId("financial-score-value")).toHaveText("10");
    await expect(page.getByTestId("financial-score-groups")).toContainText("/60");
    const record = await page.evaluate(() => JSON.parse(localStorage.getItem("coachfi-health-check")!));
    expect(record.schemaVersion).toBe(2); expect(record.scoreMax).toBe(98); expect(record.source).toBe("local_diagnosis"); expect(record.currency).toBe("PLN");
    expect(record.ratios.savingsRate).toBeNull();
  });

  test(`${locale}: blocked storage reports failure without saved-result success`, async ({ page }) => {
    await seed(page, locale); await page.goto("/health-check"); await zeroAnswers(page);
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        if (key === "coachfi-health-check") throw new DOMException("Synthetic blocked storage", "QuotaExceededError");
        return original.call(this, key, value);
      };
    });
    await page.getByRole("button", { name: submit, exact: true }).click();
    await expect(page.getByTestId("health-save-error")).toBeVisible();
    await expect(page.getByTestId("health-saved-status")).toHaveCount(0);
    await expect(page.getByTestId("financial-score-card")).toHaveCount(0);
  });

  test(`${locale}: current required terms are needed, optional permissions are not`, async ({ page }) => {
    await seed(page, locale, false); await page.goto("/health-check");
    await expect(page.getByRole("button", { name: submit, exact: true })).toBeDisabled();
    await zeroAnswers(page);
    await page.getByRole("button", { name: locale === "pl" ? "Akceptuj wymagane" : "Accept required", exact: true }).click();
    await expect(page.getByRole("button", { name: submit, exact: true })).toBeEnabled();
    await page.getByRole("button", { name: submit, exact: true }).click();
    await expect(page.getByTestId("financial-score-value")).toHaveText("10");
  });
}

test("complete legacy answers are recomputed; incomplete legacy is not shown as demo 42", async ({ page }) => {
  await seed(page, "en"); await page.goto("/health-check");
  await page.evaluate(() => localStorage.setItem("coachfi-health-check", JSON.stringify({ score: 42, createdAt: "2026-10-14T00:00:00.000Z",
    answers: { monthlyIncome: 0, monthlyExpenses: 0, savings: 0, debt: 0, cashHeld: 0, hasEmergencyFund: false,
      understandsInflation: false, hasRetirementPlan: false, investsAlready: false, mainFinancialGoal: "" } })));
  await page.reload(); await expect(page.getByTestId("financial-score-value")).toHaveText("10");
  await expect(page.locator('input[name="monthlyIncome"]')).toHaveValue("");
  await expect(page.getByText("The currency of the previous amounts was not recorded.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("coachfi-health-check")!).score)).toBe(42);
  await page.evaluate(() => localStorage.setItem("coachfi-health-check", JSON.stringify({ score: 42, answers: {}, createdAt: "2026-10-14T00:00:00.000Z" })));
  await page.reload(); await expect(page.getByTestId("financial-score-card")).toHaveCount(0);
  await expect(page.locator('input[name="monthlyIncome"]')).toHaveValue("");
});

test("required withdrawal invalidates cached score in home and shell immediately", async ({ page }) => {
  await seed(page, "en"); await page.goto("/health-check"); await zeroAnswers(page);
  await page.getByRole("button", { name: "Calculate local score", exact: true }).click();
  await expect(page.getByTestId("financial-score-value")).toHaveText("10"); await page.goto("/");
  await expect(page.getByRole("progressbar", { name: "Local educational index" })).toHaveAttribute("aria-valuemax", "98");
  await page.evaluate((event) => { localStorage.removeItem("coachfi-consent-v1"); window.dispatchEvent(new Event(event)); }, CONSENT_CHANGED_EVENT);
  await expect(page.getByRole("progressbar", { name: "Local educational index" })).toHaveCount(0);
  await expect(page.getByText("Existing formula using your saved answers. Not scientifically validated.")).toHaveCount(0);
});
