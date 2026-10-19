import { expect, test, type Page } from "@playwright/test";
import { CONSENT_VERSION } from "../../lib/consent";

type Locale = "pl" | "en";
const KEYS = ["coachfi-user", "coachfi-srs", "coachfi-tokens", "coachfi-lesson-steps", "coachfi-streak", "coachfi-learn-manual"] as const;
type Snapshot = Record<(typeof KEYS)[number], string | null>;
type Probe = { reads: Record<string, number>; writes: Array<{ key: string; value?: string; removed?: true }>; denials: number; snapshot(): Snapshot };
type FixtureWindow = typeof window & { __c45Availability: Probe };
const HEALTHY = '{"lastActiveDate":"2026-01-01","currentStreak":3,"longestStreak":3}';
const PROFILE = '{"name":"FIXTURE_C45","goal":"education","setupDone":true}';
const CASES = [
  { mode: "badnull", raw: "null", denied: false, expectedStatus: "unavailable" },
  { mode: "read-denied", raw: HEALTHY, denied: true, expectedStatus: "unavailable" },
  { mode: "healthy3", raw: HEALTHY, denied: false, expectedStatus: "available" },
] as const;
const COPY = { pl: { available: "3 dni serii", unavailable: "Seria nauki jest niedostępna" },
  en: { available: "3 day streak", unavailable: "Learning streak unavailable" } };
const section = (page: Page) => page.locator('section[aria-labelledby="quiz-title"]');
test.use({ timezoneId: "UTC" });

async function seed(page: Page, locale: Locale, rawStreak: string, denied: boolean) {
  await page.clock.setFixedTime(new Date("2026-01-01T12:00:00.000Z"));
  await page.addInitScript(({ locale, version, keys, rawStreak, denied, profileRaw }) => {
    if (!sessionStorage.getItem("FIXTURE_C45_STREAK_SEEDED")) {
      sessionStorage.setItem("FIXTURE_C45_STREAK_SEEDED", "true");
      const now = new Date().toISOString();
      localStorage.setItem("coachfi-locale-v1", locale);
      localStorage.setItem("coachfi-user", profileRaw);
      localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 }));
      localStorage.setItem("coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now, termsAccepted: true, privacyAccepted: true,
        optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
      localStorage.setItem("coachfi-tokens", "125");
      localStorage.setItem("coachfi-srs", "[]");
      localStorage.setItem("coachfi-lesson-steps", '{"retirement":2}');
      localStorage.setItem("coachfi-streak", rawStreak);
    }
    const nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem, nativeRemove = Storage.prototype.removeItem;
    const probe: Probe = { reads: {}, writes: [], denials: 0, snapshot: () => Object.fromEntries(keys.map(key => [key, nativeGet.call(localStorage, key)])) as Snapshot };
    (window as FixtureWindow).__c45Availability = probe;
    Storage.prototype.getItem = function (key: string) {
      if (this === localStorage && keys.includes(key as typeof keys[number])) probe.reads[key] = (probe.reads[key] ?? 0) + 1;
      if (this === localStorage && key === "coachfi-streak" && denied) { probe.denials++; throw new DOMException("FIXTURE_C45_STREAK_READ_DENIED", "SecurityError"); }
      return nativeGet.call(this, key);
    };
    Storage.prototype.setItem = function (key: string, value: string) {
      if (this === localStorage && keys.includes(key as typeof keys[number])) probe.writes.push({ key, value });
      return nativeSet.call(this, key, value);
    };
    Storage.prototype.removeItem = function (key: string) {
      if (this === localStorage && keys.includes(key as typeof keys[number])) probe.writes.push({ key, removed: true });
      return nativeRemove.call(this, key);
    };
  }, { locale, version: CONSENT_VERSION, keys: KEYS, rawStreak, denied, profileRaw: PROFILE });
}
async function state(page: Page) {
  return page.evaluate(() => {
    const p = (window as FixtureWindow).__c45Availability;
    return { snapshot: p.snapshot(), reads: p.reads, progressWrites: [...p.writes], denials: p.denials,
      badgeLabels: [...document.querySelectorAll('.app-shell > header [aria-label]')].map(node => node.getAttribute("aria-label") ?? "")
        .filter(label => /streak|serii|Seria nauki/i.test(label)) };
  });
}
async function readyQuiz(page: Page) {
  await expect(page.locator(".app-shell > header")).toBeVisible();
  await expect(section(page)).toBeVisible();
  const card = page.getByTestId("quiz-card"); await expect(card).toBeVisible();
  await expect(card.getByRole("radio")).toHaveCount(4);
  for (const id of ["A", "B", "C", "D"]) await expect(page.getByTestId("quiz-answer-" + id)).toBeEnabled();
  await expect(page.getByTestId("quiz-submit")).toBeDisabled();
  await expect(page.getByTestId("quiz-confirmed-feedback")).toHaveCount(0);
}


async function assertBadge(page: Page, expectedStatus: "available" | "unavailable", expectedLabel: string) {
  const header = page.locator(".app-shell > header"), target = header.getByLabel(expectedLabel, { exact: true });
  await expect(target).toHaveCount(1); await expect(target).toBeVisible();
  if (expectedStatus === "unavailable") {
    await expect(header.getByLabel(/^\d+ (?:dni serii|day streak)$/)).toHaveCount(0);
    await expect(target).not.toContainText(/[0-9]|🏆|🔥|⚡/);
    await expect(target).not.toHaveAttribute("title", /Następny cel|Next milestone|Kamień milowy|Milestone:/);
  }
}

for (const item of CASES) for (const locale of ["pl", "en"] as const) {
  test(item.mode + " " + locale + " streak availability keeps the actual shell and quiz interactive without mutations", async ({ page, context }, testInfo) => {
    const apiCalls: string[] = [], pageErrors: string[] = [];
    context.on("request", request => { const url = new URL(request.url()); if (url.pathname.startsWith("/api/")) apiCalls.push(url.href); });
    page.on("pageerror", error => pageErrors.push(error.message));
    await context.route("**/*", route => {
      const url = new URL(route.request().url());
      return url.origin === "http://127.0.0.1:43191" && !url.pathname.startsWith("/api/") ? route.continue() : route.abort();
    });
    const expectedStatus = item.expectedStatus, expectedLabel = COPY[locale][expectedStatus];
    await page.setViewportSize({ width: 375, height: 812 }); await seed(page, locale, item.raw, item.denied);
    let before: Awaited<ReturnType<typeof state>> | undefined, afterSelection: Awaited<ReturnType<typeof state>> | undefined;
    try {
      await page.goto("/quiz"); await readyQuiz(page); await assertBadge(page, expectedStatus, expectedLabel);
      before = await state(page);
      expect(before.reads["coachfi-srs"]).toBeGreaterThan(0);
      expect(before.reads["coachfi-user"]).toBeGreaterThan(0);
      expect(before.snapshot).toEqual({ "coachfi-user": PROFILE, "coachfi-srs": "[]", "coachfi-tokens": "125", "coachfi-lesson-steps": '{"retirement":2}',
        "coachfi-streak": item.raw, "coachfi-learn-manual": null });
      expect(before.progressWrites).toEqual([]); expect(before.badgeLabels).toContain(expectedLabel);
      if (item.denied) expect(before.denials).toBeGreaterThan(0);
      const first = page.getByTestId("quiz-answer-A"); await first.focus(); await expect(first).toBeFocused();
      await page.keyboard.press("Space"); await expect(first).toBeChecked();
      await expect(page.getByTestId("quiz-submit")).toBeEnabled(); // Do not submit or earn points in a render test.
      await assertBadge(page, expectedStatus, expectedLabel); afterSelection = await state(page); expect(afterSelection.snapshot).toEqual(before.snapshot); expect(afterSelection.progressWrites).toEqual([]);
      await expect(page.getByTestId("quiz-confirmed-feedback")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      await page.reload(); await readyQuiz(page); await assertBadge(page, expectedStatus, expectedLabel);
      const reloaded = await state(page); expect(reloaded.reads["coachfi-srs"]).toBeGreaterThan(0);
      expect(reloaded.reads["coachfi-user"]).toBeGreaterThan(0);
      expect(reloaded.snapshot).toEqual(before.snapshot); expect(reloaded.progressWrites).toEqual([]); expect(reloaded.badgeLabels).toContain(expectedLabel);
      if (item.denied) expect(reloaded.denials).toBeGreaterThan(0);
      expect(apiCalls).toEqual([]); expect(pageErrors).toEqual([]);
    } finally {
      const final = await state(page).catch(error => ({ unavailable: String(error) }));
      await testInfo.attach("C45 synthetic streak availability observations", { body: JSON.stringify({ mode: item.mode, locale,
        expectedStatus, expectedLabel, actualURL: page.url(), apiCalls, pageErrors, before, afterSelection, final,
        badgeLabels: { before: before?.badgeLabels ?? [], afterSelection: afterSelection?.badgeLabels ?? [],
          final: "badgeLabels" in final ? final.badgeLabels : [] },
        limits: "Six tracked keys: profile and five progress keys. Probe is recreated after reload; earlier snapshots retained. Denial affects only native current streak reads; snapshots bypass it. No repair writes, submit, award, real notification, SDK or production claim. Loading before effects is covered only by the separate Node lifecycle fixture." }), contentType: "application/json" });
    }
  });
}
