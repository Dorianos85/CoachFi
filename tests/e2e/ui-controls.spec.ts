import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
  });
});

test("language switcher opens, shows flags and changes the UI language", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /Language:/ }).click();

  await expect(page.getByRole("listbox", { name: "Select language" })).toBeVisible();
  await expect(page.getByRole("option", { name: /Polski/ })).toBeVisible();
  await expect(page.getByRole("option", { name: /Español/ })).toBeVisible();
  await expect(page.getByRole("option", { name: /Français/ })).toBeVisible();
  await expect(page.getByRole("option", { name: /中文/ })).toBeVisible();
  await expect(page.getByRole("option", { name: /日本語/ })).toBeVisible();
  await expect(page.getByRole("option", { name: /Hindi/ })).toBeVisible();
  await expect(page.getByRole("option", { name: /Português BR/ })).toBeVisible();
  await expect(page.getByRole("option", { name: /Türkçe/ })).toBeVisible();

  const visibleFlagCount = await page
    .locator('[role="listbox"] span[aria-hidden="true"] svg')
    .count();
  expect(visibleFlagCount).toBeGreaterThanOrEqual(9);

  await page.getByRole("option", { name: /Polski/ }).click();

  await expect(page.getByRole("button", { name: /Język: Polski/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Masz dochód/ })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: /Język: Polski/ })).toBeVisible();
});

test("text scale and contrast controls update the app shell", async ({ page }) => {
  await page.goto("/health-check");

  await page.getByRole("button", { name: "A+", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains("text-scale-large")))
    .toBe(true);
  await expect
    .poll(() => page.locator(".app-shell").evaluate((el) => el.classList.contains("text-scale-large")))
    .toBe(true);

  await page.getByRole("button", { name: "A++", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains("text-scale-xlarge")))
    .toBe(true);
  await expect
    .poll(() => page.locator(".app-shell").evaluate((el) => el.classList.contains("text-scale-xlarge")))
    .toBe(true);

  await page.getByRole("button", { name: "Contrast", exact: true }).click();
  await expect
    .poll(() => page.locator(".app-shell").evaluate((el) => el.classList.contains("high-contrast")))
    .toBe(true);

  await page.reload();
  await expect
    .poll(() => page.locator(".app-shell").evaluate((el) => el.classList.contains("high-contrast")))
    .toBe(true);
  await expect
    .poll(() => page.locator(".app-shell").evaluate((el) => el.classList.contains("text-scale-xlarge")))
    .toBe(true);
});
