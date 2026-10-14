import { expect, test, type Locator, type Page } from "@playwright/test";

// E2E for the bottom mode switcher: it is the way out of Kids Mode on a phone, it switches between
// Kids / Teen / Adult and lands on each mode's start screen, the choice survives reloads, and the
// bar hides while scrolling down and comes back on scroll up, at the end of the page and on focus.

const CONSENT = {
  version: "2026-05-10",
  acceptedAt: new Date().toISOString(),
  termsAccepted: true,
  privacyAccepted: true,
  optional: { aiCoach: true, voice: true, leaderboard: false, blockchain: false },
};

const USER = { name: "Mode Tester", goal: "testing", setupDone: true };
const PHONE = { width: 390, height: 844 };

// Seeds consent and the starting mode once; later reloads keep whatever the app stored.
async function seed(page: Page, mode: "adult" | "teen" | "kids") {
  await page.addInitScript(
    ({ consent, user, mode }) => {
      localStorage.setItem("coachfi-consent-v1", JSON.stringify(consent));
      localStorage.setItem("coachfi-user", JSON.stringify(user));
      if (!localStorage.getItem("coachfi-mode-v1")) {
        const now = new Date().toISOString();
        localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode, selectedAt: now }));
      }
    },
    { consent: CONSENT, user: USER, mode }
  );
}

function storedMode(page: Page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem("coachfi-mode-v1");
    return raw ? (JSON.parse(raw) as { mode?: string }).mode ?? null : null;
  });
}

function modeBar(page: Page) {
  return page.getByRole("group", { name: "Choose mode" });
}

async function expectActive(bar: Locator, name: string) {
  await expect(bar.getByRole("button", { name, exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(bar.locator('[aria-pressed="true"]')).toHaveCount(1);
}

async function isCovered(page: Page, target: Locator) {
  const box = await target.boundingBox();
  if (!box) throw new Error("target is not rendered");
  return target.evaluate(
    (element, point) => {
      const top = document.elementFromPoint(point.x, point.y);
      return !top || !element.contains(top);
    },
    { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  );
}

test.describe("on a phone", () => {
  test.use({ viewport: PHONE });

  test("Kids Mode can switch to Adult Mode, and the choice survives reloads and navigation", async ({ page }) => {
    await seed(page, "kids");
    await page.goto("/kids");

    const bar = modeBar(page);
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute("data-theme", "kids");
    await expectActive(bar, "Kids mode");
    await expect(page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link")).toHaveCount(1);

    await bar.getByRole("button", { name: "Adult mode", exact: true }).click();
    await expect(page).toHaveURL(/:\d+\/$/);
    await expectActive(bar, "Adult mode");
    await expect(bar).not.toHaveAttribute("data-theme", /.+/);
    expect(await storedMode(page)).toBe("adult");
    await expect(page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link")).toHaveCount(5);

    await page.reload();
    await expectActive(modeBar(page), "Adult mode");
    expect(await storedMode(page)).toBe("adult");

    await page.goto("/learn");
    await expectActive(modeBar(page), "Adult mode");
    expect(await storedMode(page)).toBe("adult");
  });

  test("Teen Mode opens the adult start screen in vaporwave, and Kids Mode is one tap away", async ({ page }) => {
    await seed(page, "adult");
    await page.goto("/learn");

    const bar = modeBar(page);
    await bar.getByRole("button", { name: "Teen mode", exact: true }).click();
    await expect(page).toHaveURL(/:\d+\/$/);
    await expectActive(bar, "Teen mode");
    await expect(bar).toHaveAttribute("data-theme", "teen");
    expect(await storedMode(page)).toBe("teen");

    await page.reload();
    await expectActive(modeBar(page), "Teen mode");
    expect(await storedMode(page)).toBe("teen");
    await expect(page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link")).toHaveCount(5);

    await modeBar(page).getByRole("button", { name: "Kids mode", exact: true }).click();
    await expect(page).toHaveURL(/\/kids$/);
    await expect(page.getByRole("heading", { name: "Learning modules" })).toBeVisible();
    await expect(page.locator("main").getByText(/parent|rodzic|opiekun/i)).toHaveCount(0);
    expect(await storedMode(page)).toBe("kids");

    await page.reload();
    await expectActive(modeBar(page), "Kids mode");
    expect(await storedMode(page)).toBe("kids");
  });

  test("the bar hides on scroll down, returns on scroll up, at the end of the page and on focus", async ({ page }) => {
    await seed(page, "kids");
    await page.goto("/kids");

    const bar = modeBar(page);
    const dock = page.locator(".mode-switcher-dock");
    await expect(bar).toBeVisible();
    await expect(dock).not.toHaveAttribute("data-hidden");

    // The bar sits above the mobile navigation, next to Mila's launcher, without covering either.
    const nav = await page.getByRole("navigation", { name: "Mobile navigation" }).boundingBox();
    const barBox = await bar.boundingBox();
    expect(barBox && nav && barBox.y + barBox.height <= nav.y).toBe(true);
    const launcher = page.locator(".mila-launcher-dock button").first();
    if (await launcher.isVisible()) {
      const launcherBox = await launcher.boundingBox();
      expect(barBox && launcherBox && barBox.x + barBox.width <= launcherBox.x).toBe(true);
    }

    await page.mouse.move(195, 300);
    await page.mouse.wheel(0, 900);
    await expect(dock).toHaveAttribute("data-hidden", "true");
    await expect.poll(async () => (await bar.boundingBox())?.y ?? 0).toBeGreaterThanOrEqual(PHONE.height);

    await page.mouse.wheel(0, -200);
    await expect(dock).not.toHaveAttribute("data-hidden");
    await expect.poll(async () => (await bar.boundingBox())?.y ?? PHONE.height).toBeLessThan(PHONE.height - 100);

    await page.mouse.wheel(0, 600);
    await expect(dock).toHaveAttribute("data-hidden", "true");
    await bar.getByRole("button", { name: "Teen mode", exact: true }).focus();
    await expect(dock).not.toHaveAttribute("data-hidden");

    await page.mouse.wheel(0, 600);
    await expect(dock).toHaveAttribute("data-hidden", "true");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(dock).not.toHaveAttribute("data-hidden");

    // Nothing at the end of the page is hidden behind the bar.
    const changeMode = page.locator("footer").getByRole("button", { name: "Change mode" });
    await page.waitForTimeout(400);
    expect(await isCovered(page, changeMode)).toBe(false);
  });
});

test("on a desktop the bar sits centred at the bottom and keeps clear of Mila's launcher", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await seed(page, "adult");
  await page.goto("/");

  const bar = modeBar(page);
  await expect(bar).toBeVisible();
  await expectActive(bar, "Adult mode");
  const box = await bar.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.abs(box!.x + box!.width / 2 - 640)).toBeLessThan(4);
  expect(box!.y + box!.height).toBeLessThanOrEqual(900);
  const launcher = page.locator(".mila-launcher-dock button").first();
  if (await launcher.isVisible()) {
    const launcherBox = await launcher.boundingBox();
    expect(box!.x + box!.width <= launcherBox!.x || box!.y + box!.height <= launcherBox!.y).toBe(true);
  }
});
