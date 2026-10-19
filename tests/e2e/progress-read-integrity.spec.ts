import { expect, test, type Page } from "@playwright/test";
import { CONSENT_VERSION } from "../../lib/consent";
import { localeLabels, translations } from "../../lib/i18n";
import { moneyMindsetLesson } from "../../data/moneyMindsetLesson";

type Locale = "pl" | "en";
type Mode = "healthy-mobile-start" | "nonarray-home-and-path" | "denied-read-recovery" | "late-manual-start";
type Snapshot = { srs: string | null; manual: string | null; tokens: string | null; steps: string | null; streak: string | null };
type Probe = { fault: "none" | "srs-read-denied"; srsReads: number; manualReads: number; writes: Array<{ key: string; value: string }>; snapshot(): Snapshot; nativeSet(key: string, value: string): void };
type FixtureWindow = typeof window & { __progressRead: Probe };
const BAD_SRS = '{"FIXTURE_future":"not-an-array"}', BAD_MANUAL = "{FIXTURE_late_manual";
const PROGRESS_KEYS = ["coachfi-srs", "coachfi-learn-manual", "coachfi-tokens", "coachfi-lesson-steps", "coachfi-streak"];
const stage = (page: Page, id = "money-mindset") => page.getByTestId("progress-stage-" + id);
test.use({ timezoneId: "UTC" });

async function seed(page: Page, locale: Locale, mode: Mode) {
  await page.clock.setFixedTime(new Date("2026-01-01T12:00:00.000Z"));
  await page.addInitScript(({ locale, mode, version, badSrs }) => {
    if (!sessionStorage.getItem("FIXTURE_progress_read_seeded")) {
      sessionStorage.setItem("FIXTURE_progress_read_seeded", "true"); const now = new Date().toISOString();
      localStorage.setItem("coachfi-locale-v1", locale);
      localStorage.setItem("coachfi-user", JSON.stringify({ name: "FIXTURE_PROGRESS_READ", goal: "education", setupDone: true }));
      localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 }));
      localStorage.setItem("coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now, termsAccepted: true, privacyAccepted: true, optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
      localStorage.setItem("coachfi-srs", mode === "nonarray-home-and-path" ? badSrs : JSON.stringify([{ id: "net-worth", interval: 6, repetitions: 1, easeFactor: 2.5, nextReview: "2026-12-01" }]));
      localStorage.setItem("coachfi-learn-manual", '{"family-plan":"completed"}'); localStorage.setItem("coachfi-tokens", "125");
      localStorage.setItem("coachfi-streak", '{"lastActiveDate":"2026-01-01","currentStreak":1,"longestStreak":1}');
      // No Health Check answers, feature flag, optional AI/voice or real profile data.
    }
    const nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem;
    const probe: Probe = { fault: mode === "denied-read-recovery" ? "srs-read-denied" : "none", srsReads: 0, manualReads: 0, writes: [],
      snapshot: () => ({ srs: nativeGet.call(localStorage, "coachfi-srs"), manual: nativeGet.call(localStorage, "coachfi-learn-manual"), tokens: nativeGet.call(localStorage, "coachfi-tokens"), steps: nativeGet.call(localStorage, "coachfi-lesson-steps"), streak: nativeGet.call(localStorage, "coachfi-streak") }),
      nativeSet: (key, value) => nativeSet.call(localStorage, key, value),
    }; (window as FixtureWindow).__progressRead = probe;
    Storage.prototype.getItem = function (key: string) { if (this === localStorage && key === "coachfi-srs") { probe.srsReads++; if (probe.fault === "srs-read-denied") throw new DOMException("FIXTURE SRS read denied", "SecurityError"); } if (this === localStorage && key === "coachfi-learn-manual") probe.manualReads++; return nativeGet.call(this, key); };
    Storage.prototype.setItem = function (key: string, value: string) { if (this === localStorage) probe.writes.push({ key, value }); nativeSet.call(this, key, value); };
  }, { locale, mode, version: CONSENT_VERSION, badSrs: BAD_SRS });
}
async function state(page: Page) { return page.evaluate(keys => { const probe = (window as FixtureWindow).__progressRead; return { ...probe.snapshot(), srsReads: probe.srsReads, manualReads: probe.manualReads, progressWrites: probe.writes.filter(write => keys.includes(write.key)) }; }, PROGRESS_KEYS); }
async function checkpoint(page: Page) { return page.evaluate(() => { const probe = (window as FixtureWindow).__progressRead, before = probe.snapshot(); probe.writes.length = 0; return before; }); }
async function unchanged(page: Page, before: Snapshot) { const actual = await state(page); expect({ srs: actual.srs, manual: actual.manual, tokens: actual.tokens, steps: actual.steps, streak: actual.streak }).toEqual(before); expect(actual.progressWrites).toEqual([]); }
async function switchLocale(page: Page, from: Locale, to: Locale) { await page.locator("header").getByRole("button", { name: (from === "pl" ? "Język" : "Language") + ": " + localeLabels[from], exact: true }).click(); await page.getByRole("option", { name: localeLabels[to], exact: true }).click(); await expect(page.locator("html")).toHaveAttribute("lang", to); }
async function readyPath(page: Page, locale: Locale) { await expect(page.getByTestId("path-progress-grid")).toBeVisible(); await expect(page.getByTestId("path-progress-grid").locator('[data-testid^="progress-stage-"]')).toHaveCount(8); await expect(stage(page)).toContainText("1/3"); await expect(stage(page).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "33"); await expect(stage(page, "family-plan")).toContainText(translations[locale].learn.statusCompleted); await expect(stage(page, "family-plan").getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100"); await expect(page.getByTestId("path-progress-alert")).toHaveCount(0); }

test.beforeEach(async ({ context }) => { await context.route("**/*", route => { const u = new URL(route.request().url()); return ["127.0.0.1", "localhost"].includes(u.hostname) && !u.pathname.startsWith("/api/") ? route.continue() : route.abort(); }); });
for (const locale of ["pl", "en"] as const) for (const mode of ["healthy-mobile-start", "nonarray-home-and-path", "denied-read-recovery", "late-manual-start"] as const) {
  test(`${locale} ${mode}: Home and learning path expose honest read status`, async ({ page, context }) => {
    const apiCalls: string[] = [], pageErrors: string[] = []; context.on("request", request => { if (new URL(request.url()).pathname.startsWith("/api/")) apiCalls.push(request.url()); }); page.on("pageerror", error => pageErrors.push(error.message));
    await page.setViewportSize(mode === "healthy-mobile-start" ? { width: 375, height: 812 } : { width: 1280, height: 800 }); await seed(page, locale, mode);
    if (mode === "nonarray-home-and-path") {
      await page.goto("/"); await expect(page.getByTestId("home-progress-alert")).toBeVisible(); expect((await state(page)).srsReads).toBeGreaterThan(0); expect((await state(page)).srs).toBe(BAD_SRS); expect((await state(page)).progressWrites).toEqual([]); const before = await checkpoint(page);
      await page.getByTestId("home-progress-retry").click(); await expect(page.getByTestId("home-progress-alert")).toBeVisible(); await unchanged(page, before);
      await page.goto("/learn"); await expect(page.getByTestId("path-progress-alert")).toBeVisible(); expect((await state(page)).srsReads).toBeGreaterThan(0); await expect(page.getByTestId("path-progress-grid")).toHaveCount(0); await unchanged(page, before);
      const other = locale === "pl" ? "en" : "pl"; await switchLocale(page, locale, other); await expect(page.getByTestId("path-progress-alert")).toBeVisible(); await page.getByTestId("path-progress-retry").click(); await unchanged(page, before); await page.reload(); await expect(page.getByTestId("path-progress-alert")).toBeVisible(); await unchanged(page, before);
      // Home remains health-off/demo. This proves containment/status, not the unit-only synthetic-health counter.
    } else if (mode === "denied-read-recovery") {
      await page.goto("/"); await expect(page.getByTestId("home-progress-alert")).toBeVisible(); expect((await state(page)).srsReads).toBeGreaterThan(0); expect((await state(page)).progressWrites).toEqual([]); const before = await checkpoint(page);
      await page.getByTestId("home-progress-retry").click(); await expect(page.getByTestId("home-progress-alert")).toBeVisible(); await unchanged(page, before);
      await page.evaluate(() => { (window as FixtureWindow).__progressRead.fault = "none"; }); await page.getByTestId("home-progress-retry").click(); await expect(page.getByTestId("home-progress-alert")).toHaveCount(0); await unchanged(page, before);
      await page.goto("/learn"); await expect(page.getByTestId("path-progress-alert")).toBeVisible(); expect((await state(page)).srsReads).toBeGreaterThan(0); await expect(page.getByTestId("path-progress-grid")).toHaveCount(0); await unchanged(page, before);
      await page.evaluate(() => { (window as FixtureWindow).__progressRead.fault = "none"; }); await page.getByTestId("path-progress-retry").click(); await readyPath(page, locale); await unchanged(page, before);
    } else {
      await page.goto("/learn"); await readyPath(page, locale); const initial = await state(page); expect(initial.srsReads).toBeGreaterThan(0); expect(initial.manualReads).toBeGreaterThan(0); expect(initial.progressWrites).toEqual([]); const before = await checkpoint(page), link = stage(page).getByRole("link", { name: new RegExp(translations[locale].learn.continueLesson) }); await expect(link).toHaveAttribute("href", "/learn/money-mindset");
      if (mode === "late-manual-start") {
        await page.evaluate(raw => { (window as FixtureWindow).__progressRead.nativeSet("coachfi-learn-manual", raw); }, BAD_MANUAL); const corrupt = { ...before, manual: BAD_MANUAL }; await link.click(); await expect(page).toHaveURL(/\/learn$/); await expect(page.getByTestId("path-progress-alert")).toBeVisible(); await expect(page.getByTestId("path-progress-grid")).toHaveCount(0); await unchanged(page, corrupt);
        const other = locale === "pl" ? "en" : "pl"; await switchLocale(page, locale, other); await page.getByTestId("path-progress-retry").click(); await expect(page.getByTestId("path-progress-alert")).toBeVisible(); await unchanged(page, corrupt);
      } else {
        await link.focus(); await expect(link).toBeFocused(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true); await page.keyboard.press("Enter"); await expect(page).toHaveURL(/\/learn\/money-mindset$/); await expect(page.locator('section[aria-labelledby="money-mindset-lesson-title"]')).toBeVisible();
        const saved = await state(page); expect(JSON.parse(saved.manual!)).toEqual({ "family-plan": "completed", "money-mindset": "started" }); expect(saved.srs).toBe(before.srs); expect(saved.tokens).toBe("125"); expect(saved.streak).toBe(before.streak); expect(saved.progressWrites.filter(w => w.key === "coachfi-learn-manual")).toEqual([{ key: "coachfi-learn-manual", value: saved.manual }]); expect(saved.progressWrites.every(w => ["coachfi-learn-manual", "coachfi-lesson-steps"].includes(w.key))).toBe(true);
        // Path start writes the existing manual marker. Entering the existing lesson may separately write its first step.
        await expect(page.getByRole("heading", { level: 1, name: moneyMindsetLesson[locale]!.title, exact: true })).toBeVisible();
      }
    }
    expect(apiCalls).toEqual([]); expect(pageErrors).toEqual([]);
  });
}
