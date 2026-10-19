import { expect, test, type Page } from "@playwright/test";
import { CONSENT_VERSION } from "../../lib/consent";

type Locale = "pl" | "en";
const KEYS = ["coachfi-user", "coachfi-srs", "coachfi-tokens", "coachfi-lesson-steps", "coachfi-streak", "coachfi-learn-manual"] as const;
type Snapshot = Record<(typeof KEYS)[number], string | null>;
type Probe = { reads: Record<string, number>; writes: Array<{ key: string; value?: string; removed?: true }>; snapshot(): Snapshot };
type FixtureWindow = typeof window & { __c46Milestone: Probe };
const PROFILE = '{"name":"FIXTURE_C46","goal":"education","setupDone":true}';
const CASES = [{ mode: "milestone66", count: 66 }, { mode: "healthy3", count: 3 }] as const;
const COPY = {
  pl: { milestone66: "Kamień milowy: 66 dni! Doceniaj swoją regularność. 🏆", healthy3: "Kamień milowy: 3 dni! 🏆", label: (count: number) => `${count} dni serii` },
  en: { milestone66: "Milestone: 66 days! Celebrate your consistency. 🏆", healthy3: "Milestone: 3 days! 🏆", label: (count: number) => `${count} day streak` },
};
const section = (page: Page) => page.locator('section[aria-labelledby="quiz-title"]');
test.use({ timezoneId: "UTC" });

async function seed(page: Page, locale: Locale, rawStreak: string) {
  await page.clock.setFixedTime(new Date("2026-01-01T12:00:00.000Z"));
  await page.addInitScript(({ locale, version, keys, rawStreak, profileRaw }) => {
    if (!sessionStorage.getItem("FIXTURE_C46_STREAK_SEEDED")) {
      sessionStorage.setItem("FIXTURE_C46_STREAK_SEEDED", "true");
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
    const probe: Probe = { reads: {}, writes: [], snapshot: () => Object.fromEntries(keys.map(key => [key, nativeGet.call(localStorage, key)])) as Snapshot };
    (window as FixtureWindow).__c46Milestone = probe;
    Storage.prototype.getItem = function (key: string) {
      if (this === localStorage && keys.includes(key as typeof keys[number])) probe.reads[key] = (probe.reads[key] ?? 0) + 1;
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
  }, { locale, version: CONSENT_VERSION, keys: KEYS, rawStreak, profileRaw: PROFILE });
}
async function state(page: Page) {
  return page.evaluate(() => {
    const p = (window as FixtureWindow).__c46Milestone;
    const badges = [...document.querySelectorAll('.app-shell > header [aria-label]')]
      .filter(node => /^\d+ (?:dni serii|day streak)$/.test(node.getAttribute("aria-label") ?? ""));
    return { snapshot: p.snapshot(), reads: p.reads, progressWrites: [...p.writes],
      badgeLabels: badges.map(node => node.getAttribute("aria-label") ?? ""),
      badgeTitles: badges.map(node => node.closest("[title]")?.getAttribute("title") ?? "") };
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
async function assertBadge(page: Page, expectedLabel: string, expectedTitle: string, count: number) {
  const target = page.locator(".app-shell > header").getByLabel(expectedLabel, { exact: true });
  await expect(target).toHaveCount(1); await expect(target).toBeVisible();
  await expect(target).toContainText(String(count));
  await expect(target.locator("..")).toHaveAttribute("title", expectedTitle);
}

for (const item of CASES) for (const locale of ["pl", "en"] as const) {
  test(item.mode + " " + locale + " milestone title preserves the actual shell and quiz without mutations", async ({ page, context }, testInfo) => {
    const apiCalls: string[] = [], pageErrors: string[] = [];
    context.on("request", request => { const url = new URL(request.url()); if (url.pathname.startsWith("/api/")) apiCalls.push(url.href); });
    page.on("pageerror", error => pageErrors.push(error.message));
    await context.route("**/*", route => {
      const url = new URL(route.request().url());
      return url.origin === "http://127.0.0.1:43191" && !url.pathname.startsWith("/api/") ? route.continue() : route.abort();
    });
    const expectedLabel = COPY[locale].label(item.count), expectedTitle = COPY[locale][item.mode];
    const raw = JSON.stringify({ lastActiveDate: "2026-01-01", currentStreak: item.count, longestStreak: item.count });
    await page.setViewportSize({ width: 375, height: 812 }); await seed(page, locale, raw);
    let before: Awaited<ReturnType<typeof state>> | undefined, afterSelection: Awaited<ReturnType<typeof state>> | undefined;
    try {
      await page.goto("/quiz"); await readyQuiz(page); await assertBadge(page, expectedLabel, expectedTitle, item.count);
      before = await state(page);
      for (const key of ["coachfi-srs", "coachfi-user", "coachfi-streak"]) expect(before.reads[key]).toBeGreaterThan(0);
      expect(before.snapshot).toEqual({ "coachfi-user": PROFILE, "coachfi-srs": "[]", "coachfi-tokens": "125", "coachfi-lesson-steps": '{"retirement":2}',
        "coachfi-streak": raw, "coachfi-learn-manual": null });
      expect(before.progressWrites).toEqual([]); expect(before.badgeLabels).toEqual([expectedLabel]); expect(before.badgeTitles).toEqual([expectedTitle]);
      const first = page.getByTestId("quiz-answer-A"); await first.focus(); await expect(first).toBeFocused();
      await page.keyboard.press("Space"); await expect(first).toBeChecked();
      await expect(page.getByTestId("quiz-submit")).toBeEnabled(); // Render/selection test: do not submit or earn points.
      await assertBadge(page, expectedLabel, expectedTitle, item.count); afterSelection = await state(page);
      expect(afterSelection.snapshot).toEqual(before.snapshot); expect(afterSelection.progressWrites).toEqual([]);
      expect(afterSelection.badgeLabels).toEqual([expectedLabel]); expect(afterSelection.badgeTitles).toEqual([expectedTitle]);
      await expect(page.getByTestId("quiz-confirmed-feedback")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      await page.reload(); await readyQuiz(page); await assertBadge(page, expectedLabel, expectedTitle, item.count);
      const reloaded = await state(page);
      for (const key of ["coachfi-srs", "coachfi-user", "coachfi-streak"]) expect(reloaded.reads[key]).toBeGreaterThan(0);
      expect(reloaded.snapshot).toEqual(before.snapshot); expect(reloaded.progressWrites).toEqual([]);
      expect(reloaded.badgeLabels).toEqual([expectedLabel]); expect(reloaded.badgeTitles).toEqual([expectedTitle]);
      expect(apiCalls).toEqual([]); expect(pageErrors).toEqual([]);
    } finally {
      const final = await state(page).catch(error => ({ unavailable: String(error) }));
      await testInfo.attach("C46 synthetic streak milestone observations", { body: JSON.stringify({ locale, mode: item.mode, count: item.count,
        expectedTitle, expectedLabel,
        badgeTitles: { before: before?.badgeTitles ?? [], afterSelection: afterSelection?.badgeTitles ?? [], final: "badgeTitles" in final ? final.badgeTitles : [] },
        badgeLabels: { before: before?.badgeLabels ?? [], afterSelection: afterSelection?.badgeLabels ?? [], final: "badgeLabels" in final ? final.badgeLabels : [] },
        before, afterSelection, final, apiCalls, pageErrors, actualURL: page.url(),
        limits: "Synthetic adult/consent/profile/progress only. Six tracked keys cover profile and five progress keys, both set and remove; probes reset on reload, earlier snapshots retained. Actual AppNavigation/StreakProvider/Badge and QuizCard, fixed clock, no submit/award/API/real notification/SDK or production claim. DOM title attribute is checked, not a native OS tooltip visual." }), contentType: "application/json" });
    }
  });
}
