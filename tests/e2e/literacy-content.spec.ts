import { expect, test, type Page } from "@playwright/test";
import { getAllQuestionIds, getQuestionById } from "../../lib/allQuestions";
import { CONSENT_VERSION } from "../../lib/consent";

type Locale = "pl" | "en";
type Snapshot = { srs: string | null; tokens: string | null; steps: string | null; streak: string | null };
type Probe = { reads: number; writes: Array<{ key: string; value: string }>; snapshot(): Snapshot };
type FixtureWindow = typeof window & { __literacyContent: Probe };
const TARGET = "poland-compound-gap", PROGRESS_KEYS = ["coachfi-srs", "coachfi-tokens", "coachfi-lesson-steps", "coachfi-streak"];
const section = (page: Page) => page.locator('section[aria-labelledby="review-title"]');
const COPY = { pl: { correct: "✓ Dobrze!", date: "Następna powtórka: 2026-01-07", complete: "Sesja zakończona!", caught: "Wszystko powtórzone!" },
  en: { correct: "✓ Correct!", date: "Next review: 2026-01-07", complete: "Session complete!", caught: "All caught up!" } };
test.use({ timezoneId: "UTC" });

async function seed(page: Page, locale: Locale) {
  await page.clock.setFixedTime(new Date("2026-01-01T12:00:00.000Z"));
  await page.addInitScript(({ locale, version, ids, target }) => {
    if (!sessionStorage.getItem("FIXTURE_literacy_content_seeded")) {
      sessionStorage.setItem("FIXTURE_literacy_content_seeded", "true"); const now = new Date().toISOString();
      localStorage.setItem("coachfi-locale-v1", locale); localStorage.setItem("coachfi-user", JSON.stringify({ name: "FIXTURE_LITERACY_CONTENT", goal: "education", setupDone: true }));
      localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 }));
      localStorage.setItem("coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now, termsAccepted: true, privacyAccepted: true,
        optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
      localStorage.setItem("coachfi-tokens", "125"); localStorage.setItem("coachfi-lesson-steps", '{"retirement":2}');
      localStorage.setItem("coachfi-streak", '{"lastActiveDate":"2026-01-01","currentStreak":1,"longestStreak":1}'); // Real provider's already-today path prevents an unrelated milestone bonus.
      localStorage.setItem("coachfi-srs", JSON.stringify(ids.map(id => ({ id, interval: 6, repetitions: 1, easeFactor: 2.5, nextReview: id === target ? "2026-01-01" : "2026-12-01" }))));
    }
    const nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem;
    const probe: Probe = { reads: 0, writes: [], snapshot: () => ({ srs: nativeGet.call(localStorage, "coachfi-srs"), tokens: nativeGet.call(localStorage, "coachfi-tokens"), steps: nativeGet.call(localStorage, "coachfi-lesson-steps"), streak: nativeGet.call(localStorage, "coachfi-streak") }) };
    (window as FixtureWindow).__literacyContent = probe;
    Storage.prototype.getItem = function (key: string) { if (this === localStorage && key === "coachfi-srs") probe.reads++; return nativeGet.call(this, key); };
    Storage.prototype.setItem = function (key: string, value: string) { if (this === localStorage) probe.writes.push({ key, value }); nativeSet.call(this, key, value); };
  }, { locale, version: CONSENT_VERSION, ids: getAllQuestionIds("en"), target: TARGET });
}
async function state(page: Page) { return page.evaluate(keys => { const p = (window as FixtureWindow).__literacyContent; return { ...p.snapshot(), reads: p.reads, progressWrites: p.writes.filter(write => keys.includes(write.key)) }; }, PROGRESS_KEYS); }
async function checkpoint(page: Page) { return page.evaluate(() => { const p = (window as FixtureWindow).__literacyContent, snapshot = p.snapshot(); p.writes.length = 0; return snapshot; }); }
async function unchanged(page: Page, before: Snapshot) { const actual = await state(page); expect({ srs: actual.srs, tokens: actual.tokens, steps: actual.steps, streak: actual.streak }).toEqual(before); expect(actual.progressWrites).toEqual([]); }
async function reflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true); }

test.beforeEach(async ({ context }) => {
  await context.route("**/*", route => { const url = new URL(route.request().url()); return ["127.0.0.1", "localhost"].includes(url.hostname) && !url.pathname.startsWith("/api/") ? route.continue() : route.abort(); });
});
for (const locale of ["pl", "en"] as const) {
  test(locale + " literacy Review mobile: canonical copy and acknowledged C schedule without a question reward", async ({ page, context }, testInfo) => {
    const apiCalls: string[] = [], pageErrors: string[] = []; context.on("request", request => { if (new URL(request.url()).pathname.startsWith("/api/")) apiCalls.push(request.url()); }); page.on("pageerror", error => pageErrors.push(error.message));
    await page.setViewportSize({ width: 375, height: 812 }); await seed(page, locale);
    try {
      await page.goto("/review"); const canonical = getQuestionById(TARGET, locale)!; expect(canonical).toMatchObject({ id: TARGET, correctAnswer: "C", reward: 30 }); expect(getAllQuestionIds(locale)).toHaveLength(82);
      await expect(page.getByTestId("review-question")).toHaveText(canonical.question); for (const answer of canonical.answers) await expect(page.getByTestId("review-answer-" + answer.id)).toContainText(answer.text);
      await expect(page.getByTestId("review-check")).toBeDisabled(); expect((await state(page)).reads).toBeGreaterThan(0); expect((await state(page)).progressWrites).toEqual([]); await reflow(page); const before = await checkpoint(page); // Confirm actual guest/card initialization before the action-write window.
      const oldCards = JSON.parse(before.srs!) as Array<{ id: string; repetitions: number; interval: number; nextReview: string }>;
      expect(oldCards.filter(card => card.nextReview <= "2026-01-01").map(card => card.id)).toEqual([TARGET]); expect(before.tokens).toBe("125");
      await page.getByTestId("review-answer-C").focus(); await expect(page.getByTestId("review-answer-C")).toBeFocused(); await page.keyboard.press("Space");
      const check = page.getByTestId("review-check"); await expect(check).toBeEnabled(); await check.focus(); await expect(check).toBeFocused(); await page.keyboard.press("Enter");
      await expect(page.getByTestId("review-saved-date")).toHaveText(COPY[locale].date); await expect(page.getByTestId("review-answer-C")).toBeDisabled(); await expect(section(page).getByText(COPY[locale].correct, { exact: true })).toBeVisible(); await expect(section(page).getByText(canonical.explanation, { exact: true })).toBeVisible(); await reflow(page);
      const actual = await state(page), cards = JSON.parse(actual.srs!) as typeof oldCards;
      expect(cards.find(card => card.id === TARGET)).toMatchObject({ repetitions: 2, interval: 6, nextReview: "2026-01-07" }); expect(cards.filter(card => card.id !== TARGET)).toEqual(oldCards.filter(card => card.id !== TARGET));
      expect(actual.tokens).toBe("125"); expect(actual.steps).toBe(before.steps); expect(actual.streak).toBe(before.streak); expect(actual.progressWrites.map(write => write.key)).toEqual(["coachfi-srs"]); // Metadata C30 is not a direct Review token award.
      const saved = await checkpoint(page); await page.getByTestId("review-next").focus(); await expect(page.getByTestId("review-next")).toBeFocused(); await page.keyboard.press("Enter");
      await expect(section(page).getByRole("heading", { name: COPY[locale].complete, exact: true })).toBeVisible(); await expect(section(page).getByText("1 / 1", { exact: true })).toBeVisible(); await unchanged(page, saved);
      await page.reload(); await expect(section(page).getByText(COPY[locale].caught, { exact: true })).toBeVisible(); expect((await state(page)).reads).toBeGreaterThan(0); await unchanged(page, saved); await reflow(page);
      expect(apiCalls).toEqual([]); expect(pageErrors).toEqual([]);
    } finally {
      const lastState = await state(page).catch(error => ({ unavailable: String(error) })); await testInfo.attach("C26 synthetic observations", { body: JSON.stringify({ locale, apiCalls, pageErrors, state: lastState, metadataReward: 30, directReviewReward: 0 }), contentType: "application/json" });
    }
  });
}
