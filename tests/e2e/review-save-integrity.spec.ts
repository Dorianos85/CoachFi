import { expect, test, type Page } from "@playwright/test";
import { CONSENT_VERSION } from "../../lib/consent";
import { getAllQuestionIds, getQuestionById } from "../../lib/allQuestions";
import { localeLabels } from "../../lib/i18n";

type Locale = "pl" | "en";
type Mode = "healthy-duplicate-mobile" | "malformed-read" | "prewrite-retry" | "partial-write-quarantine";
type Fault = "none" | "deny-read" | "write-then-throw";
type Snapshot = { srs: string | null; tokens: string | null; steps: string | null; streak: string | null };
type Probe = { fault: Fault; reads: number; writes: Array<{ key: string; value: string }>; snapshot(): Snapshot };
type FixtureWindow = typeof window & { __reviewIntegrity: Probe };
const TARGET = "emergency-first-milestone";
const PROGRESS_KEYS = ["coachfi-srs", "coachfi-tokens", "coachfi-lesson-steps", "coachfi-streak"];
const BAD_RAW = '{"unexpected":"not an SRS array"}';
const COPY = {
  pl: { read: "Nie udało się odczytać danych powtórek. Nie zmieniono zapisanych danych. Spróbuj ponownie.", retry: "Spróbuj ponownie",
    retryable: "Odpowiedź nie została zapisana. Sprawdź dostęp do danych i spróbuj ponownie.",
    uncertain: "Nie udało się potwierdzić zapisu odpowiedzi. Ta sesja jest zablokowana, aby nie powtórzyć zapisu. Odśwież stronę i ponownie odczytaj dane lokalne.",
    date: "Następna powtórka: 2026-01-07", complete: "Sesja zakończona!", caught: "Wszystko powtórzone!" },
  en: { read: "Review data could not be read. Saved data was not changed. Try again.", retry: "Try again",
    retryable: "The answer was not saved. Check data access and try again.",
    uncertain: "The answer save could not be confirmed. This session is blocked to avoid repeating the write. Reload the page to read local data again.",
    date: "Next review: 2026-01-07", complete: "Session complete!", caught: "All caught up!" },
};
const section = (page: Page) => page.locator('section[aria-labelledby="review-title"]');
test.use({ timezoneId: "UTC" });
async function seed(page: Page, locale: Locale, malformed: boolean) {
  await page.clock.setFixedTime(new Date("2026-01-01T12:00:00.000Z"));
  await page.addInitScript(({ locale, version, malformed, ids, target, badRaw }) => {
    if (!sessionStorage.getItem("FIXTURE_review_integrity_seeded")) {
      sessionStorage.setItem("FIXTURE_review_integrity_seeded", "true"); const now = new Date().toISOString();
      localStorage.setItem("coachfi-locale-v1", locale);
      localStorage.setItem("coachfi-user", JSON.stringify({ name: "FIXTURE_REVIEW_INTEGRITY", goal: "education", setupDone: true }));
      localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 }));
      localStorage.setItem("coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now, termsAccepted: true, privacyAccepted: true,
        optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
      localStorage.setItem("coachfi-tokens", "125"); localStorage.setItem("coachfi-lesson-steps", '{"emergency-fund":3}');
      // Real provider remains active. Already-today streak prevents an independent milestone bonus.
      localStorage.setItem("coachfi-streak", '{"lastActiveDate":"2026-01-01","currentStreak":1,"longestStreak":1}');
      localStorage.setItem("coachfi-srs", malformed ? badRaw : JSON.stringify(ids.map(id => ({ id, interval: 6,
        nextReview: id === target ? "2026-01-01" : "2026-12-01", repetitions: 1, easeFactor: 2.5 }))));
    }
    const nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem;
    const probe: Probe = { fault: "none", reads: 0, writes: [], snapshot: () => ({ srs: nativeGet.call(localStorage, "coachfi-srs"),
      tokens: nativeGet.call(localStorage, "coachfi-tokens"), steps: nativeGet.call(localStorage, "coachfi-lesson-steps"), streak: nativeGet.call(localStorage, "coachfi-streak") }) };
    (window as FixtureWindow).__reviewIntegrity = probe;
    Storage.prototype.getItem = function (key: string) {
      if (this === localStorage && key === "coachfi-srs") { probe.reads++; if (probe.fault === "deny-read") throw new DOMException("FIXTURE denied Review read", "SecurityError"); }
      return nativeGet.call(this, key);
    };
    Storage.prototype.setItem = function (key: string, value: string) {
      if (this === localStorage) probe.writes.push({ key, value }); nativeSet.call(this, key, value);
      if (this === localStorage && key === "coachfi-srs" && probe.fault === "write-then-throw") throw new DOMException("FIXTURE Review writer threw after saving", "QuotaExceededError");
    };
  }, { locale, version: CONSENT_VERSION, malformed, ids: getAllQuestionIds("en"), target: TARGET, badRaw: BAD_RAW });
}
async function state(page: Page) {
  return page.evaluate(keys => { const probe = (window as FixtureWindow).__reviewIntegrity; return { ...probe.snapshot(), reads: probe.reads,
    progressWrites: probe.writes.filter(write => keys.includes(write.key)) }; }, PROGRESS_KEYS);
}
async function checkpoint(page: Page) {
  return page.evaluate(() => { const probe = (window as FixtureWindow).__reviewIntegrity, before = probe.snapshot(); probe.writes.length = 0; return before; });
}
async function fault(page: Page, value: Fault) { await page.evaluate(value => { (window as FixtureWindow).__reviewIntegrity.fault = value; }, value); }
async function unchanged(page: Page, before: Snapshot) {
  const actual = await state(page); expect({ srs: actual.srs, tokens: actual.tokens, steps: actual.steps, streak: actual.streak }).toEqual(before);
  expect(actual.progressWrites).toEqual([]);
}
async function assertQuestion(page: Page, locale: Locale) {
  const question = getQuestionById(TARGET, locale)!; await expect(page.getByTestId("review-question")).toHaveText(question.question);
  for (const answer of question.answers) await expect(page.getByTestId('review-answer-' + answer.id)).toContainText(answer.text);
  await expect(page.getByTestId("review-check")).toBeDisabled(); expect((await state(page)).reads).toBeGreaterThan(0);
  expect((await state(page)).tokens).toBe("125"); return question;
}
async function noPublishedAnswer(page: Page) {
  await expect(page.getByTestId("review-saved-date")).toHaveCount(0); await expect(page.getByTestId("review-next")).toHaveCount(0);
  await expect(section(page).getByRole("heading", { name: /^(Sesja zakończona!|Session complete!)$/, exact: true })).toHaveCount(0);
}
async function switchLocale(page: Page, previous: Locale, next: Locale) {
  await page.locator("header").getByRole("button", { name: (previous === "pl" ? "Język" : "Language") + ": " + localeLabels[previous], exact: true }).click();
  await page.getByRole("option", { name: localeLabels[next], exact: true }).click(); await expect(page.locator("html")).toHaveAttribute("lang", next);
}
function targetCard(raw: string | null) { return (JSON.parse(raw!) as Array<{ id: string; repetitions: number; interval: number; nextReview: string }>).find(card => card.id === TARGET)!; }

test.beforeEach(async ({ context }) => {
  await context.route("**/*", route => { const url = new URL(route.request().url());
    return ["127.0.0.1", "localhost"].includes(url.hostname) && !url.pathname.startsWith("/api/") ? route.continue() : route.abort(); });
});
for (const locale of ["pl", "en"] as const) for (const mode of ["healthy-duplicate-mobile", "malformed-read", "prewrite-retry", "partial-write-quarantine"] as const) {
  test(locale + " " + mode + ": Review publishes only acknowledged schedules and preserves honest failure state", async ({ page, context }) => {
    const apiCalls: string[] = [], pageErrors: string[] = [];
    context.on("request", request => { if (new URL(request.url()).pathname.startsWith("/api/")) apiCalls.push(request.url()); });
    page.on("pageerror", error => pageErrors.push(error.message));
    if (mode === "healthy-duplicate-mobile") await page.setViewportSize({ width: 375, height: 812 });
    await seed(page, locale, mode === "malformed-read"); await page.goto("/review");
    if (mode === "malformed-read") {
      await expect(page.getByTestId("review-load-alert")).toHaveText(COPY[locale].read); expect((await state(page)).reads).toBeGreaterThan(0);
      const initial = await state(page); expect(initial.srs).toBe(BAD_RAW); expect(initial.progressWrites).toEqual([]); const before = await checkpoint(page);
      await expect(page.getByTestId("review-card")).toHaveCount(0); await noPublishedAnswer(page);
      await section(page).getByRole("button", { name: COPY[locale].retry, exact: true }).click(); await expect(page.getByTestId("review-load-alert")).toHaveText(COPY[locale].read); await unchanged(page, before);
      const other = locale === "pl" ? "en" : "pl"; await switchLocale(page, locale, other); await expect(page.getByTestId("review-load-alert")).toHaveText(COPY[other].read); await unchanged(page, before);
      await page.reload(); await expect(page.getByTestId("review-load-alert")).toHaveText(COPY[other].read); expect((await state(page)).reads).toBeGreaterThan(0); await unchanged(page, before);
    } else {
      await assertQuestion(page, locale); expect((await state(page)).progressWrites).toEqual([]); const before = await checkpoint(page); // Begin action observations only after confirmed guest shell and actual card initialization.
      if (mode === "healthy-duplicate-mobile") {
        const answer = page.getByTestId("review-answer-B"); await answer.focus(); await expect(answer).toBeFocused(); await page.keyboard.press("Space");
        const check = page.getByTestId("review-check"); await expect(check).toBeEnabled();
        // Two native activations of the same eligible DOM button. Captured React closure admission is separately tested in actual-component units.
        await check.evaluate(button => { button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); });
        await expect(page.getByTestId("review-saved-date")).toHaveText(COPY[locale].date); await expect(page.getByTestId("review-answer-B")).toBeDisabled();
        const saved = await state(page); expect(targetCard(saved.srs)).toMatchObject({ repetitions: 2, interval: 6, nextReview: "2026-01-07" }); expect(saved.tokens).toBe("125"); expect(saved.steps).toBe(before.steps); expect(saved.streak).toBe(before.streak);
        expect(saved.progressWrites.map(write => write.key)).toEqual(["coachfi-srs"]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
        const next = page.getByTestId("review-next"); await next.focus(); await expect(next).toBeFocused(); await page.keyboard.press("Enter");
        await expect(section(page).getByRole("heading", { name: COPY[locale].complete, exact: true })).toBeVisible(); await expect(section(page).getByText("1 / 1", { exact: true })).toBeVisible();
        expect((await state(page)).progressWrites.map(write => write.key)).toEqual(["coachfi-srs"]);
      } else if (mode === "prewrite-retry") {
        await page.getByTestId("review-answer-B").click(); await expect(page.getByTestId("review-check")).toBeEnabled(); await fault(page, "deny-read"); const priorReads = (await state(page)).reads;
        await page.getByTestId("review-check").click(); await expect(page.getByTestId("review-save-alert")).toHaveText(COPY[locale].retryable); expect((await state(page)).reads).toBeGreaterThan(priorReads);
        await expect(page.getByTestId("review-check")).toBeEnabled(); await noPublishedAnswer(page); await unchanged(page, before);
        await fault(page, "none"); await page.getByTestId("review-check").click(); await expect(page.getByTestId("review-saved-date")).toHaveText(COPY[locale].date); await expect(page.getByTestId("review-save-alert")).toHaveCount(0);
        const saved = await state(page); expect(targetCard(saved.srs)).toMatchObject({ repetitions: 2, nextReview: "2026-01-07" }); expect(saved.tokens).toBe("125"); expect(saved.steps).toBe(before.steps); expect(saved.progressWrites.map(write => write.key)).toEqual(["coachfi-srs"]);
      } else {
        await page.getByTestId("review-answer-B").click(); await expect(page.getByTestId("review-check")).toBeEnabled(); await fault(page, "write-then-throw"); await page.getByTestId("review-check").click();
        await expect(page.getByTestId("review-save-alert")).toHaveText(COPY[locale].uncertain); await expect(page.getByTestId("review-card")).toHaveCount(0); await noPublishedAnswer(page);
        const partial = await state(page); expect(targetCard(partial.srs)).toMatchObject({ repetitions: 2, nextReview: "2026-01-07" }); expect(partial.tokens).toBe("125"); expect(partial.steps).toBe(before.steps); expect(partial.streak).toBe(before.streak); expect(partial.progressWrites.map(write => write.key)).toEqual(["coachfi-srs"]);
        const partialSnapshot = await checkpoint(page); await fault(page, "none"); const other = locale === "pl" ? "en" : "pl"; await switchLocale(page, locale, other);
        await expect(page.getByTestId("review-save-alert")).toHaveText(COPY[other].uncertain); await expect(page.getByTestId("review-check")).toHaveCount(0); await expect(page.getByTestId("review-answer-B")).toHaveCount(0); await noPublishedAnswer(page); await unchanged(page, partialSnapshot);
        // A fresh document reads this particular already-future card. This is not a general cross-reload exactly-once or rollback guarantee.
        await page.reload(); await expect(section(page).getByText(COPY[other].caught, { exact: true })).toBeVisible(); await expect(page.getByTestId("review-card")).toHaveCount(0); await noPublishedAnswer(page); await unchanged(page, partialSnapshot);
      }
    }
    expect(apiCalls).toEqual([]); expect(pageErrors).toEqual([]);
  });
}
