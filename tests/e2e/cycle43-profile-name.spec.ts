import { expect, test, type Page } from "@playwright/test";
import { CONSENT_VERSION } from "../../lib/consent";

type Locale = "pl" | "en";
const KEYS = ["coachfi-user", "coachfi-srs", "coachfi-tokens", "coachfi-lesson-steps", "coachfi-streak", "coachfi-learn-manual"] as const;
type Snapshot = Record<(typeof KEYS)[number], string | null>;
type Probe = { reads: Record<string, number>; writes: Array<{ key: string; value: string }>; snapshot(): Snapshot };
type FixtureWindow = typeof window & { __c43Profile: Probe };
const CASES = [
  { mode: "null-name", name: null },
  { mode: "object-trim-spoof", name: { trim: "spoof" } },
  { mode: "healthy-unicode-name", name: " Łucja 🌱 " },
] as const;
const profileRaw = (name: unknown) => JSON.stringify({ name, goal: "education", setupDone: true, fixtureC43: { retained: true } });
const section = (page: Page) => page.locator('section[aria-labelledby="quiz-title"]');
test.use({ timezoneId: "UTC" });

async function seed(page: Page, locale: Locale, expectedProfileRaw: string) {
  await page.clock.setFixedTime(new Date("2026-01-01T12:00:00.000Z"));
  await page.addInitScript(({ locale, version, keys, expectedProfileRaw }) => {
    if (!sessionStorage.getItem("FIXTURE_C43_PROFILE_SEEDED")) {
      sessionStorage.setItem("FIXTURE_C43_PROFILE_SEEDED", "true");
      const now = new Date().toISOString();
      localStorage.setItem("coachfi-locale-v1", locale);
      localStorage.setItem("coachfi-user", expectedProfileRaw);
      localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 }));
      localStorage.setItem("coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now, termsAccepted: true, privacyAccepted: true,
        optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
      localStorage.setItem("coachfi-tokens", "125");
      localStorage.setItem("coachfi-srs", "[]");
      localStorage.setItem("coachfi-lesson-steps", '{"retirement":2}');
      localStorage.setItem("coachfi-streak", '{"lastActiveDate":"2026-01-01","currentStreak":1,"longestStreak":1}');
    }
    const nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem;
    const probe: Probe = { reads: {}, writes: [], snapshot: () => Object.fromEntries(keys.map(key => [key, nativeGet.call(localStorage, key)])) as Snapshot };
    (window as FixtureWindow).__c43Profile = probe;
    Storage.prototype.getItem = function (key: string) {
      if (this === localStorage && keys.includes(key as typeof keys[number])) probe.reads[key] = (probe.reads[key] ?? 0) + 1;
      return nativeGet.call(this, key);
    };
    Storage.prototype.setItem = function (key: string, value: string) {
      if (this === localStorage && keys.includes(key as typeof keys[number])) probe.writes.push({ key, value });
      return nativeSet.call(this, key, value);
    };
  }, { locale, version: CONSENT_VERSION, keys: KEYS, expectedProfileRaw });
}
async function state(page: Page) {
  return page.evaluate(() => {
    const p = (window as FixtureWindow).__c43Profile;
    return { snapshot: p.snapshot(), reads: p.reads, progressWrites: [...p.writes] };
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

for (const item of CASES) for (const locale of ["pl", "en"] as const) {
  test(item.mode + " " + locale + " profile keeps the actual shell and quiz interactive without mutations", async ({ page, context }, testInfo) => {
    const apiCalls: string[] = [], pageErrors: string[] = [];
    context.on("request", request => { const url = new URL(request.url()); if (url.pathname.startsWith("/api/")) apiCalls.push(url.href); });
    page.on("pageerror", error => pageErrors.push(error.message));
    await context.route("**/*", route => {
      const url = new URL(route.request().url());
      return url.origin === "http://127.0.0.1:43191" && !url.pathname.startsWith("/api/") ? route.continue() : route.abort();
    });
    const expectedProfileRaw = profileRaw(item.name);
    await page.setViewportSize({ width: 375, height: 812 }); await seed(page, locale, expectedProfileRaw);
    let before: Awaited<ReturnType<typeof state>> | undefined, afterSelection: Awaited<ReturnType<typeof state>> | undefined;
    try {
      await page.goto("/quiz"); await readyQuiz(page);
      before = await state(page);
      expect(before.reads["coachfi-srs"]).toBeGreaterThan(0);
      expect(before.reads["coachfi-user"]).toBeGreaterThan(0);
      expect(before.snapshot).toEqual({ "coachfi-user": expectedProfileRaw, "coachfi-srs": "[]", "coachfi-tokens": "125", "coachfi-lesson-steps": '{"retirement":2}',
        "coachfi-streak": '{"lastActiveDate":"2026-01-01","currentStreak":1,"longestStreak":1}', "coachfi-learn-manual": null });
      expect(before.progressWrites).toEqual([]);
      const first = page.getByTestId("quiz-answer-A"); await first.focus(); await expect(first).toBeFocused();
      await page.keyboard.press("Space"); await expect(first).toBeChecked();
      await expect(page.getByTestId("quiz-submit")).toBeEnabled(); // Do not submit or earn points in a render test.
      afterSelection = await state(page); expect(afterSelection.snapshot).toEqual(before.snapshot); expect(afterSelection.progressWrites).toEqual([]);
      await expect(page.getByTestId("quiz-confirmed-feedback")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      await page.reload(); await readyQuiz(page);
      const reloaded = await state(page); expect(reloaded.reads["coachfi-srs"]).toBeGreaterThan(0);
      expect(reloaded.reads["coachfi-user"]).toBeGreaterThan(0);
      expect(reloaded.snapshot).toEqual(before.snapshot); expect(reloaded.progressWrites).toEqual([]);
      expect(apiCalls).toEqual([]); expect(pageErrors).toEqual([]);
    } finally {
      const final = await state(page).catch(error => ({ unavailable: String(error) }));
      await testInfo.attach("C43 synthetic profile observations", { body: JSON.stringify({ mode: item.mode, locale,
        expectedProfileRaw, actualURL: page.url(), apiCalls, pageErrors, before, afterSelection, final,
        limits: "Six tracked keys: profile and five progress keys. Probe is recreated after reload; both earlier snapshots retained. No visible local name exists before quiz completion; no invented name assertion. No submit, award, audio, SDK or production claim." }), contentType: "application/json" });
    }
  });
}
