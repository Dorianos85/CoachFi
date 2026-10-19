import { expect, test, type Page } from "@playwright/test";
import { CONSENT_VERSION } from "../../lib/consent";

test.beforeEach(async ({ context, page }) => {
  await context.route("**/*", (route) => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  await page.addInitScript(({ version }) => {
    if (sessionStorage.getItem("synthetic-health-funnel")) return;
    localStorage.clear(); sessionStorage.setItem("synthetic-health-funnel", "true");
    const now = new Date().toISOString();
    localStorage.setItem("coachfi-locale-v1", "en");
    localStorage.setItem("coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now, termsAccepted: true, privacyAccepted: true,
      optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
    localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 }));
    localStorage.setItem("coachfi-user", JSON.stringify({ setupDone: true, name: "Synthetic test", goal: "education" }));
  }, { version: CONSENT_VERSION });
});

async function enterAnswers(page: Page) {
  for (const [key, value] of Object.entries({ monthlyIncome: "4000", monthlyExpenses: "2000", savings: "6000", debt: "0", cashHeld: "0" }))
    await page.locator(`input[name="${key}"]`).fill(value);
  for (const key of ["hasEmergencyFund", "understandsInflation", "hasRetirementPlan", "investsAlready"])
    await page.locator(`select[name="${key}"]`).selectOption("yes");
  await page.locator('input[name="mainFinancialGoal"]').fill("A clear long goal");
}

test("guest diagnosis produces an honest local result and a lesson without email or trial", async ({ page }) => {
  let sensitiveRequests = 0;
  page.on("request", (request) => { if (/\/api\/(?:chat|tts|mila-token|auth)|elevenlabs|api\.cdp/.test(request.url())) sensitiveRequests++; });
  await page.goto("/health-check");
  await expect(page.getByRole("heading", { name: "Review your financial situation" })).toBeVisible();
  await expect(page.locator('input[type="email"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: /trial|unlock/i })).toHaveCount(0);
  await expect(page.getByTestId("financial-score-card")).toHaveCount(0);
  await expect(page.locator('input[name="monthlyIncome"]')).toHaveValue("");
  await expect(page.locator('select[name="investsAlready"]')).toHaveValue("");
  await enterAnswers(page);
  await page.getByRole("button", { name: "Calculate local score", exact: true }).click();
  await expect(page.getByTestId("financial-score-value")).toHaveText("98");
  await expect(page.getByRole("img", { name: "Local educational index: 98/98" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to lessons", exact: true })).toHaveAttribute("href", "/learn");
  expect(sensitiveRequests).toBe(0);
});

test("editable investing declaration changes the existing weight and survives reload", async ({ page }) => {
  await page.goto("/health-check"); await enterAnswers(page);
  await page.getByRole("button", { name: "Calculate local score", exact: true }).click();
  await expect(page.getByTestId("financial-score-value")).toHaveText("98");
  await page.locator('select[name="investsAlready"]').selectOption("no");
  await expect(page.getByTestId("financial-score-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Calculate local score", exact: true }).click();
  await expect(page.getByTestId("financial-score-value")).toHaveText("90");
  await page.reload();
  await expect(page.getByTestId("financial-score-value")).toHaveText("90");
  await expect(page.locator('select[name="investsAlready"]')).toHaveValue("no");
});

test("home and shell show the saved 98-point denominator, keeping demo separate", async ({ page }) => {
  await page.goto("/health-check"); await enterAnswers(page);
  await page.getByRole("button", { name: "Calculate local score", exact: true }).click();
  await expect(page.getByTestId("financial-score-value")).toHaveText("98");
  await page.goto("/");
  await expect(page.getByRole("progressbar", { name: "Local educational index" })).toHaveAttribute("aria-valuemax", "98");
  await expect(page.getByRole("progressbar", { name: "Local educational index" })).toHaveAttribute("aria-valuenow", "98");
  await expect(page.getByText("/98", { exact: true }).first()).toBeVisible();
});
