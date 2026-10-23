import { expect, test, type Page } from "@playwright/test";
import { getAllQuestionIds, getQuestionById } from "../../lib/allQuestions";
import { CONSENT_VERSION } from "../../lib/consent";

type Locale = "pl" | "en";
type Snapshot = { srs: string | null; tokens: string | null; steps: string | null; streak: string | null };
type Probe = { reads: number; writes: Array<{ key: string; value?: string; removed?: true }>; snapshot(): Snapshot };
type FixtureWindow = typeof window & { __c54TaxWrapper: Probe };
const TARGET = { id: "tax-advantaged-wrapper", key: "B", reward: 30 } as const;
const PROGRESS_KEYS = ["coachfi-srs", "coachfi-tokens", "coachfi-lesson-steps", "coachfi-streak"];
const section = (page: Page) => page.locator('section[aria-labelledby="review-title"]');
const COPY = { pl: { correct: "✓ Dobrze!", date: "Następna powtórka: 2026-01-07", complete: "Sesja zakończona!", caught: "Wszystko powtórzone!" },
  en: { correct: "✓ Correct!", date: "Next review: 2026-01-07", complete: "Session complete!", caught: "All caught up!" } };
test.use({ timezoneId: "UTC" });

async function seed(page: Page, locale: Locale, target: string) {
  await page.clock.setFixedTime(new Date("2026-01-01T12:00:00.000Z"));
  await page.addInitScript(({ locale, version, ids, target }) => {
    if (!sessionStorage.getItem("FIXTURE_c54_tax_wrapper_seeded")) {
      sessionStorage.setItem("FIXTURE_c54_tax_wrapper_seeded", "true"); const now = new Date().toISOString();
      localStorage.setItem("coachfi-locale-v1", locale); localStorage.setItem("coachfi-user", JSON.stringify({ name: "FIXTURE_C54_US_MATCH", goal: "education", setupDone: true }));
      localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 }));
      localStorage.setItem("coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now, termsAccepted: true, privacyAccepted: true,
        optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
      localStorage.setItem("coachfi-tokens", "125"); localStorage.setItem("coachfi-lesson-steps", '{"retirement":2}');
      localStorage.setItem("coachfi-streak", '{"lastActiveDate":"2026-01-01","currentStreak":1,"longestStreak":1}'); // Real provider's already-today path prevents an unrelated milestone bonus.
      localStorage.setItem("coachfi-srs", JSON.stringify(ids.map(id => ({ id, interval: 6, repetitions: 1, easeFactor: 2.5, nextReview: id === target ? "2026-01-01" : "2026-12-01", fixtureUnknown: { source: "C54_SYNTHETIC", retained: true } }))));
    }
    const nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem, nativeRemove = Storage.prototype.removeItem;
    const probe: Probe = { reads: 0, writes: [], snapshot: () => ({ srs: nativeGet.call(localStorage, "coachfi-srs"), tokens: nativeGet.call(localStorage, "coachfi-tokens"), steps: nativeGet.call(localStorage, "coachfi-lesson-steps"), streak: nativeGet.call(localStorage, "coachfi-streak") }) };
    (window as FixtureWindow).__c54TaxWrapper = probe;
    Storage.prototype.getItem = function (key: string) { if (this === localStorage && key === "coachfi-srs") probe.reads++; return nativeGet.call(this, key); };
    Storage.prototype.setItem = function (key: string, value: string) { if (this === localStorage) probe.writes.push({ key, value }); nativeSet.call(this, key, value); };
    Storage.prototype.removeItem = function (key: string) { if (this === localStorage) probe.writes.push({ key, removed: true }); nativeRemove.call(this, key); };
  }, { locale, version: CONSENT_VERSION, ids: getAllQuestionIds("en"), target });
}
async function state(page: Page) { return page.evaluate(keys => { const p = (window as FixtureWindow).__c54TaxWrapper; return { ...p.snapshot(), reads: p.reads, progressWrites: p.writes.filter(write => keys.includes(write.key)) }; }, PROGRESS_KEYS); }
async function checkpoint(page: Page) { return page.evaluate(() => { const p = (window as FixtureWindow).__c54TaxWrapper, snapshot = p.snapshot(); p.writes.length = 0; return snapshot; }); }
async function unchanged(page: Page, before: Snapshot) { const actual = await state(page); expect({ srs: actual.srs, tokens: actual.tokens, steps: actual.steps, streak: actual.streak }).toEqual(before); expect(actual.progressWrites).toEqual([]); }
async function reflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true); }

test.beforeEach(async ({ context }) => {
  await context.route("**/*", route => { const url = new URL(route.request().url()); return url.origin === "http://127.0.0.1:43191" && !url.pathname.startsWith("/api/") ? route.continue() : route.abort(); });
});
for (const locale of ["pl", "en"] as const) {
  const target = TARGET, answer = locale === "pl" ? "A" : "B", correct = answer === "B";
  test(target.id + " " + locale + " answer " + answer + " actual Review mobile canonical content and acknowledged schedule", async ({ page, context }, testInfo) => {
    const apiCalls: string[] = [], pageErrors: string[] = [];
    context.on("request", request => { if (new URL(request.url()).pathname.startsWith("/api/")) apiCalls.push(request.url()); });
    page.on("pageerror", error => pageErrors.push(error.message));
    await page.setViewportSize({ width: 375, height: 812 }); await seed(page, locale, target.id);
    let before: Snapshot | undefined, afterAnswer: Awaited<ReturnType<typeof state>> | undefined;
    const date = correct ? "2026-01-07" : "2026-01-02";
    try {
      await page.goto("/review"); await expect(page.locator(".app-shell > header")).toBeVisible();
      const canonical = getQuestionById(target.id, locale)!;
      expect(canonical).toMatchObject({ id: target.id, correctAnswer: target.key, reward: target.reward }); expect(getAllQuestionIds(locale)).toHaveLength(82);
      await expect(page.getByTestId("review-question")).toHaveText(canonical.question);
      for (const option of canonical.answers) await expect(page.getByTestId("review-answer-" + option.id)).toContainText(option.text);
      await expect(section(page).getByRole("button", { name: /Przeczytaj pytanie/ })).toHaveCount(1); // Presence only: never invoke audio.
      await expect(page.getByTestId("review-check")).toBeDisabled(); expect((await state(page)).reads).toBeGreaterThan(0);
      expect((await state(page)).progressWrites).toEqual([]); await reflow(page); before = await checkpoint(page);
      const oldCards = JSON.parse(before.srs!) as Array<{ id: string; repetitions: number; interval: number; nextReview: string; fixtureUnknown: { source: string; retained: boolean } }>;
      expect(oldCards).toHaveLength(82); expect(oldCards.filter(card => card.nextReview <= "2026-01-01").map(card => card.id)).toEqual([target.id]);
      expect(before.tokens).toBe("125"); const otherCardsRaw = JSON.stringify(oldCards.filter(card => card.id !== target.id));
      const option = page.getByTestId("review-answer-" + answer);
      await option.focus(); await expect(option).toBeFocused(); await page.keyboard.press("Space");
      const check = page.getByTestId("review-check"); await expect(check).toBeEnabled(); await check.focus(); await expect(check).toBeFocused(); await page.keyboard.press("Enter");
      await expect(page.getByTestId("review-saved-date")).toHaveText((locale === "pl" ? "Następna powtórka: " : "Next review: ") + date);
      await expect(option).toBeDisabled();
      await expect(section(page).getByText(correct ? (locale === "pl" ? "✓ Dobrze!" : "✓ Correct!") : (locale === "pl" ? "✗ Jeszcze nie" : "✗ Not quite"), { exact: true })).toBeVisible();
      await expect(section(page).getByText(canonical.explanation, { exact: true })).toBeVisible();
      await expect(section(page).getByRole("button", { name: /Przeczytaj wyjaśnienie/ })).toHaveCount(1); await reflow(page);
      afterAnswer = await state(page); const cards = JSON.parse(afterAnswer.srs!) as typeof oldCards;
      expect(cards).toHaveLength(82); expect(cards.find(card => card.id === target.id)).toMatchObject({ repetitions: correct ? 2 : 0, interval: correct ? 6 : 1, nextReview: date, fixtureUnknown: { source: "C54_SYNTHETIC", retained: true } });
      expect(JSON.stringify(cards.filter(card => card.id !== target.id))).toBe(otherCardsRaw);
      expect(afterAnswer.tokens).toBe("125"); expect(afterAnswer.steps).toBe(before.steps); expect(afterAnswer.streak).toBe(before.streak);
      expect(afterAnswer.progressWrites.map(write => ({ key: write.key, removed: write.removed ?? false }))).toEqual([{ key: "coachfi-srs", removed: false }]);
      const saved = await checkpoint(page); await page.getByTestId("review-next").focus(); await expect(page.getByTestId("review-next")).toBeFocused(); await page.keyboard.press("Enter");
      await expect(section(page).getByRole("heading", { name: COPY[locale].complete, exact: true })).toBeVisible();
      await expect(section(page).getByText(correct ? "1 / 1" : "0 / 1", { exact: true })).toBeVisible(); await unchanged(page, saved);
      await page.reload(); await expect(section(page).getByText(COPY[locale].caught, { exact: true })).toBeVisible();
      expect((await state(page)).reads).toBeGreaterThan(0); await unchanged(page, saved); await reflow(page);
      expect(apiCalls).toEqual([]); expect(pageErrors).toEqual([]);
    } finally {
      const lastState = await state(page).catch(error => ({ unavailable: String(error) }));
      await testInfo.attach("C54 synthetic tax-wrapper Review observations", { body: JSON.stringify({ id: target.id, locale, answer, correct, date, apiCalls, pageErrors,
        before, afterAnswer, final: lastState, metadataReward: target.reward, directReviewReward: 0,
        limits: "Two cases: Polish wrong A and English correct B, not a full2x2 browser matrix. Actual Review/owner storage/save acknowledgement and StreakProvider; already-today synthetic streak prevents an unrelated bonus. Bank82 total, other81 card objects/serialized order retained;125tokens unchanged. Fresh empty Playwright context, synthetic profile/required consent/deck, fixed UTC clock and375x812. Voice controls present but unclicked; Node fixture separately inspects canonical voice text props. Four progress keys probed for set/remove; earlier snapshots retained across reload probe reset. No real account/plan/auth/session, API/provider/native audio/cloud rights/staging/production proof." }), contentType: "application/json" });
    }
  });
}
