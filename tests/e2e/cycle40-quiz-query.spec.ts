import { expect, test, type Page } from "@playwright/test";
import { CONSENT_VERSION } from "../../lib/consent";

type Locale = "pl" | "en";
const KEYS = ["coachfi-srs", "coachfi-tokens", "coachfi-lesson-steps", "coachfi-streak", "coachfi-learn-manual"] as const;
type Snapshot = Record<(typeof KEYS)[number], string | null>;
type Probe = { reads: Record<string, number>; writes: Array<{ key: string; value: string }>; snapshot(): Snapshot };
type FixtureWindow = typeof window & { __c40Query: Probe };
const CASES = [
  { mode: "percent", from: "%" },
  { mode: "double-encoded-literal", from: "%2F" },
  { mode: "unicode-plus-literal-markup", from: "Żółć + <em>C40</em>" },
] as const;
const COPY = {
  pl: { accepted: "Wyzwanie przyjęte!", scored: (name: string) => `${name} zdobył(a) 7 pkt - pobijesz ten wynik?` },
  en: { accepted: "Challenge accepted!", scored: (name: string) => `${name} scored 7 pts - can you beat them?` },
};
const section = (page: Page) => page.locator('section[aria-labelledby="quiz-title"]');
test.use({ timezoneId: "UTC" });

async function seed(page: Page, locale: Locale) {
  await page.clock.setFixedTime(new Date("2026-01-01T12:00:00.000Z"));
  await page.addInitScript(({ locale, version, keys }) => {
    if (!sessionStorage.getItem("FIXTURE_C40_QUERY_SEEDED")) {
      sessionStorage.setItem("FIXTURE_C40_QUERY_SEEDED", "true");
      const now = new Date().toISOString();
      localStorage.setItem("coachfi-locale-v1", locale);
      localStorage.setItem("coachfi-user", JSON.stringify({ name: "FIXTURE_C40_QUERY", goal: "education", setupDone: true }));
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
    (window as FixtureWindow).__c40Query = probe;
    Storage.prototype.getItem = function (key: string) {
      if (this === localStorage && keys.includes(key as typeof keys[number])) probe.reads[key] = (probe.reads[key] ?? 0) + 1;
      return nativeGet.call(this, key);
    };
    Storage.prototype.setItem = function (key: string, value: string) {
      if (this === localStorage && keys.includes(key as typeof keys[number])) probe.writes.push({ key, value });
      return nativeSet.call(this, key, value);
    };
  }, { locale, version: CONSENT_VERSION, keys: KEYS });
}
async function state(page: Page) {
  return page.evaluate(() => {
    const p = (window as FixtureWindow).__c40Query;
    return { snapshot: p.snapshot(), reads: p.reads, progressWrites: [...p.writes] };
  });
}
async function readyQuiz(page: Page, locale: Locale, from: string) {
  const view = section(page);
  const title = view.getByText(COPY[locale].accepted, { exact: true });
  await expect(title).toBeVisible();
  const banner = title.locator("..");
  await expect(banner.getByText(COPY[locale].scored(from), { exact: true })).toBeVisible();
  await expect(banner.locator("em")).toHaveCount(0); // Name remains literal text, including this bounded markup probe.
  const card = page.getByTestId("quiz-card"); await expect(card).toBeVisible();
  await expect(card.getByRole("radio")).toHaveCount(4);
  for (const id of ["A", "B", "C", "D"]) await expect(page.getByTestId("quiz-answer-" + id)).toBeEnabled();
  await expect(page.getByTestId("quiz-submit")).toBeDisabled();
  await expect(page.getByTestId("quiz-confirmed-feedback")).toHaveCount(0);
  return banner;
}

for (const item of CASES) for (const locale of ["pl", "en"] as const) {
  test(item.mode + " " + locale + " query name renders once and leaves an interactive read-only quiz", async ({ page, context }, testInfo) => {
    const apiCalls: string[] = [], pageErrors: string[] = [];
    context.on("request", request => { const url = new URL(request.url()); if (url.pathname.startsWith("/api/")) apiCalls.push(url.href); });
    page.on("pageerror", error => pageErrors.push(error.message));
    await context.route("**/*", route => {
      const url = new URL(route.request().url());
      return url.origin === "http://127.0.0.1:43191" && !url.pathname.startsWith("/api/") ? route.continue() : route.abort();
    });
    await page.setViewportSize({ width: 375, height: 812 }); await seed(page, locale);
    const query = new URLSearchParams({ from: item.from, score: "7" });
    let before: Awaited<ReturnType<typeof state>> | undefined, afterSelection: Awaited<ReturnType<typeof state>> | undefined;
    try {
      await page.goto("/quiz?" + query.toString());
      const nativeValue = await page.evaluate(() => new URL(window.location.href).searchParams.get("from"));
      expect(nativeValue).toBe(item.from); // Native URLSearchParams is the actual browser decoding boundary.
      await readyQuiz(page, locale, item.from);
      before = await state(page);
      expect(before.reads["coachfi-srs"]).toBeGreaterThan(0);
      expect(before.snapshot).toEqual({ "coachfi-srs": "[]", "coachfi-tokens": "125", "coachfi-lesson-steps": '{"retirement":2}',
        "coachfi-streak": '{"lastActiveDate":"2026-01-01","currentStreak":1,"longestStreak":1}', "coachfi-learn-manual": null });
      expect(before.progressWrites).toEqual([]);
      const first = page.getByTestId("quiz-answer-A"); await first.focus(); await expect(first).toBeFocused();
      await page.keyboard.press("Space"); await expect(first).toBeChecked();
      await expect(page.getByTestId("quiz-submit")).toBeEnabled(); // Do not submit or earn points in a render test.
      afterSelection = await state(page); expect(afterSelection.snapshot).toEqual(before.snapshot); expect(afterSelection.progressWrites).toEqual([]);
      await expect(page.getByTestId("quiz-confirmed-feedback")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      await page.reload(); await readyQuiz(page, locale, item.from);
      expect(await page.evaluate(() => new URL(window.location.href).searchParams.get("from"))).toBe(item.from);
      const reloaded = await state(page); expect(reloaded.reads["coachfi-srs"]).toBeGreaterThan(0);
      expect(reloaded.snapshot).toEqual(before.snapshot); expect(reloaded.progressWrites).toEqual([]);
      expect(apiCalls).toEqual([]); expect(pageErrors).toEqual([]);
    } finally {
      const final = await state(page).catch(error => ({ unavailable: String(error) }));
      await testInfo.attach("C40 synthetic query observations", { body: JSON.stringify({ mode: item.mode, locale,
        expectedFrom: item.from, actualURL: page.url(), apiCalls, pageErrors, before, afterSelection, final,
        limits: "Five progress keys only. Probe is recreated after reload; both earlier snapshots are retained. No submit, question award, audio, SDK or production claim." }), contentType: "application/json" });
    }
  });
}
