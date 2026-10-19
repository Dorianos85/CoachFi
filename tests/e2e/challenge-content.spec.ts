import { expect, test, type Page } from "@playwright/test";
import { challengeQuestions } from "../../data/challengeQuestions";
import { getQuestionById } from "../../lib/allQuestions";
import { CONSENT_VERSION } from "../../lib/consent";
import { translations } from "../../lib/i18n";

type Locale = "pl" | "en";
type Snapshot = { tokens: string | null; marker: string | null; srs: string | null; steps: string | null; streak: string | null };
type Probe = { reads: number; writes: Array<{ key: string; value: string }>; snapshot(): Snapshot };
type FixtureWindow = typeof window & { __challengeContent: Probe };
const FIXED_TIME = "2026-01-14T12:00:00.000Z", TODAY = "2026-01-14", TARGET = "c15";
const fixed = new Date(FIXED_TIME), dayIndex = Math.floor((fixed.getTime() - Date.UTC(fixed.getUTCFullYear(), 0, 0)) / 86400000), expectedDaily = challengeQuestions[dayIndex % challengeQuestions.length]!;
const KEYS = ["coachfi-tokens", "coachfi-challenge", "coachfi-srs", "coachfi-lesson-steps", "coachfi-streak"];
const section = (page: Page) => page.locator('section[aria-labelledby="challenge-title"]');
const card = (page: Page) => section(page).getByTestId("daily-challenge-question");
const escapeRegex = (text: string) => text.replace(/[.*+?^$\x7b\x7d()|[\]\\]/g, "\\$&");
test.use({ timezoneId: "UTC" });
async function seed(page: Page, locale: Locale) {
  await page.clock.setFixedTime(new Date(FIXED_TIME));
  await page.addInitScript(({ locale, version, today }) => {
    if (!sessionStorage.getItem("FIXTURE_c27_daily_seeded")) {
      sessionStorage.setItem("FIXTURE_c27_daily_seeded", "true"); const now = new Date().toISOString();
      localStorage.setItem("coachfi-locale-v1", locale); localStorage.setItem("coachfi-user", JSON.stringify({ name: "FIXTURE_C27_DAILY", goal: "education", setupDone: true }));
      localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 }));
      localStorage.setItem("coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now, termsAccepted: true, privacyAccepted: true, optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
      localStorage.setItem("coachfi-tokens", "125"); localStorage.removeItem("coachfi-challenge"); localStorage.setItem("coachfi-lesson-steps", '{"retirement":2}');
      localStorage.setItem("coachfi-srs", '[{"id":"poland-compound-gap","interval":6,"nextReview":"2026-02-01","repetitions":1,"easeFactor":2.5}]');
      localStorage.setItem("coachfi-streak", JSON.stringify({ lastActiveDate: today, currentStreak: 1, longestStreak: 1 })); // Existing real provider already-today path avoids unrelated milestone rewards.
    }
    const nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem;
    const probe: Probe = { reads: 0, writes: [], snapshot: () => ({ tokens: nativeGet.call(localStorage, "coachfi-tokens"), marker: nativeGet.call(localStorage, "coachfi-challenge"), srs: nativeGet.call(localStorage, "coachfi-srs"), steps: nativeGet.call(localStorage, "coachfi-lesson-steps"), streak: nativeGet.call(localStorage, "coachfi-streak") }) };
    (window as FixtureWindow).__challengeContent = probe;
    Storage.prototype.getItem = function (key: string) { if (this === localStorage && key === "coachfi-challenge") probe.reads++; return nativeGet.call(this, key); };
    Storage.prototype.setItem = function (key: string, value: string) { if (this === localStorage) probe.writes.push({ key, value }); nativeSet.call(this, key, value); };
  }, { locale, version: CONSENT_VERSION, today: TODAY });
}
async function state(page: Page) { return page.evaluate(keys => { const p = (window as FixtureWindow).__challengeContent; return { ...p.snapshot(), reads: p.reads, progressWrites: p.writes.filter(w => keys.includes(w.key)) }; }, KEYS); }
async function checkpoint(page: Page) { return page.evaluate(() => { const p = (window as FixtureWindow).__challengeContent, before = p.snapshot(); p.writes.length = 0; return before; }); }
async function reflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true); }
async function unchanged(page: Page, before: Snapshot) { const actual = await state(page); expect({ tokens: actual.tokens, marker: actual.marker, srs: actual.srs, steps: actual.steps, streak: actual.streak }).toEqual(before); expect(actual.progressWrites).toEqual([]); }
test.beforeEach(async ({ context }) => { await context.route("**/*", route => { const u = new URL(route.request().url()); return ["127.0.0.1", "localhost"].includes(u.hostname) && !u.pathname.startsWith("/api/") ? route.continue() : route.abort(); }); });
for (const locale of ["pl", "en"] as const) {
  test(locale + " actual c15 daily challenge: mobile keyboard C confirms175 and Jan14 completion; reload earns no new points", async ({ page, context }, testInfo) => {
    const apiCalls: string[] = [], pageErrors: string[] = []; context.on("request", request => { if (new URL(request.url()).pathname.startsWith("/api/")) apiCalls.push(request.url()); }); page.on("pageerror", error => pageErrors.push(error.message));
    await page.setViewportSize({ width: 375, height: 812 }); await seed(page, locale);
    try {
      expect(dayIndex).toBe(14); expect(expectedDaily).toMatchObject({ id: TARGET, correctAnswer: "C", reward: 50 }); const canonical = getQuestionById(TARGET, locale)!;
      await page.goto("/challenge"); await expect(card(page).getByText(canonical.question, { exact: true })).toBeVisible();
      for (const a of canonical.answers) await expect(card(page).getByRole("button", { name: new RegExp("^" + a.id + "\\s*" + escapeRegex(a.text) + "$") })).toBeVisible();
      const submit = card(page).getByRole("button", { name: translations[locale].challenge.answerButton, exact: true }); await expect(submit).toBeDisabled(); expect((await state(page)).reads).toBeGreaterThan(0); expect((await state(page)).progressWrites).toEqual([]); await reflow(page); const before = await checkpoint(page); expect(before.tokens).toBe("125"); expect(before.marker).toBeNull();
      const correct = canonical.answers.find(a => a.id === "C")!; const choice = card(page).getByRole("button", { name: new RegExp("^C\\s*" + escapeRegex(correct.text) + "$") }); await choice.focus(); await expect(choice).toBeFocused(); await page.keyboard.press("Space"); await expect(submit).toBeEnabled(); await submit.focus(); await expect(submit).toBeFocused(); await page.keyboard.press("Enter");
      await expect(section(page).getByText(translations[locale].challenge.completedTitle, { exact: true })).toBeVisible(); await expect(section(page).getByTestId("daily-challenge-earned")).toContainText("+50"); await expect(card(page)).toHaveCount(0); await expect(section(page).getByRole("alert")).toHaveCount(0); await reflow(page);
      const actual = await state(page); expect(actual.tokens).toBe("175"); expect(JSON.parse(actual.marker!)).toEqual({ date: TODAY }); expect(actual.srs).toBe(before.srs); expect(actual.steps).toBe(before.steps); expect(actual.streak).toBe(before.streak); expect(actual.progressWrites.map(w => w.key)).toEqual(["coachfi-tokens", "coachfi-challenge"]); const saved = await checkpoint(page);
      await page.reload(); await expect(section(page).getByText(translations[locale].challenge.completedTitle, { exact: true })).toBeVisible(); await expect(section(page).getByTestId("daily-challenge-earned")).toHaveCount(0); await expect(card(page)).toHaveCount(0); expect((await state(page)).reads).toBeGreaterThan(0); await unchanged(page, saved); await reflow(page); expect(apiCalls).toEqual([]); expect(pageErrors).toEqual([]);
    } finally { const lastState = await state(page).catch(error => ({ unavailable: String(error) })); await testInfo.attach("C27 synthetic observations", { body: JSON.stringify({ locale, fixedTime: FIXED_TIME, expectedDailyId: TARGET, apiCalls, pageErrors, state: lastState }), contentType: "application/json" }); }
  });
}
