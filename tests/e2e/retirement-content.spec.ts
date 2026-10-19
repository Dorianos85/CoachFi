import { expect, test, type Page } from "@playwright/test";
import { stageLessons } from "../../data/stageLessons";
import { quizQuestions } from "../../data/quizQuestions";
import { getQuestionById } from "../../lib/allQuestions";
import { CONSENT_VERSION } from "../../lib/consent";
import { localeLabels } from "../../lib/i18n";
import { getLocalizedContent } from "../../lib/localizedContent";

type Locale = "pl" | "en";
type Snapshot = { steps: string | null; tokens: string | null; srs: string | null; streak: string | null };
type Probe = { reads: number; writes: Array<{ key: string; value: string }>; snapshot(): Snapshot };
type FixtureWindow = typeof window & { __retirementContent: Probe };
const STAGE = "retirement", IDS = ["retirement-purpose", "retirement-early-start"];
const KEYS = ["B", "C"], REWARDS = [25, 35], BALANCES = [150, 185];
const PROGRESS_KEYS = ["coachfi-lesson-steps", "coachfi-tokens", "coachfi-srs"];
const BAD_STEPS = '{"retirement":3}', TODAY_STREAK = '{"lastActiveDate":"2026-01-01","currentStreak":1,"longestStreak":1}';
const lesson = (page: Page) => page.locator('section[aria-labelledby="stage-lesson-title"]');
const quiz = (page: Page) => page.getByTestId("quiz-card");
const WARNING = {
  pl: "Nie udało się potwierdzić zapisu kroku lekcji. Przejście dalej jest zablokowane. Odśwież stronę, aby ponownie odczytać dane lokalne.",
  en: "The lesson step save could not be confirmed. Continuing is blocked. Reload the page to read the local data again.",
};

test.use({ timezoneId: "UTC" });
async function seed(page: Page, locale: Locale, invalidCounter: boolean) {
  await page.clock.setFixedTime(new Date("2026-01-01T12:00:00.000Z"));
  await page.addInitScript(({ locale, version, invalidCounter, badSteps, streak }) => {
    if (!sessionStorage.getItem("FIXTURE_retirement_content_seeded")) {
      sessionStorage.setItem("FIXTURE_retirement_content_seeded", "true"); const now = new Date().toISOString();
      localStorage.setItem("coachfi-locale-v1", locale);
      localStorage.setItem("coachfi-user", JSON.stringify({ name: "FIXTURE_RETIREMENT_CONTENT", goal: "education", setupDone: true }));
      localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 }));
      localStorage.setItem("coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now, termsAccepted: true, privacyAccepted: true,
        optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
      localStorage.setItem("coachfi-tokens", "125"); localStorage.setItem("coachfi-srs", "[]"); localStorage.setItem("coachfi-streak", streak);
      if (invalidCounter) localStorage.setItem("coachfi-lesson-steps", badSteps);
    }
    const nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem;
    const probe: Probe = { reads: 0, writes: [], snapshot: () => ({ steps: nativeGet.call(localStorage, "coachfi-lesson-steps"), tokens: nativeGet.call(localStorage, "coachfi-tokens"), srs: nativeGet.call(localStorage, "coachfi-srs"), streak: nativeGet.call(localStorage, "coachfi-streak") }) };
    (window as FixtureWindow).__retirementContent = probe;
    Storage.prototype.getItem = function (key: string) { if (this === localStorage && key === "coachfi-lesson-steps") probe.reads++; return nativeGet.call(this, key); };
    Storage.prototype.setItem = function (key: string, value: string) { if (this === localStorage) probe.writes.push({ key, value }); nativeSet.call(this, key, value); };
  }, { locale, version: CONSENT_VERSION, invalidCounter, badSteps: BAD_STEPS, streak: TODAY_STREAK });
}
async function state(page: Page) {
  return page.evaluate(keys => { const probe = (window as FixtureWindow).__retirementContent; return { ...probe.snapshot(), reads: probe.reads, progressWrites: probe.writes.filter(write => keys.includes(write.key)) }; }, PROGRESS_KEYS);
}
async function checkpoint(page: Page) { return page.evaluate(() => { const probe = (window as FixtureWindow).__retirementContent, before = probe.snapshot(); probe.writes.length = 0; return before; }); }
async function unchanged(page: Page, before: Snapshot) {
  const actual = await state(page); expect({ steps: actual.steps, tokens: actual.tokens, srs: actual.srs, streak: actual.streak }).toEqual(before); expect(actual.progressWrites).toEqual([]);
}
async function reflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true); }
async function balance(page: Page, locale: Locale, expected: number) {
  const card = page.locator('section[aria-labelledby="quiz-title"]').getByRole("heading", { level: 3, name: getLocalizedContent(locale).common.tokens, exact: true }).locator("xpath=../..");
  await expect(card.locator("p.text-5xl")).toHaveCount(1); await expect(card.locator("p.text-5xl")).toHaveText(String(expected)); expect((await state(page)).tokens).toBe(String(expected));
}
async function question(page: Page, locale: Locale, index: number) {
  const id = IDS[index]!, canonical = getQuestionById(id, locale)!; expect(canonical.correctAnswer).toBe(KEYS[index]); expect(canonical.reward).toBe(REWARDS[index]);
  await expect(quiz(page)).toHaveCount(1); await expect(quiz(page).locator("legend")).toHaveText(canonical.question); await expect(quiz(page).locator(`input[name="${id}"]`)).toHaveCount(4);
  for (const answer of canonical.answers) await expect(page.getByTestId("quiz-answer-" + answer.id).locator("xpath=..")).toContainText(answer.text);
  await expect(page.getByTestId("quiz-submit")).toBeDisabled(); await reflow(page); return canonical;
}
async function switchLocale(page: Page, previous: Locale, next: Locale) {
  await page.locator("header").getByRole("button", { name: `${previous === "pl" ? "Język" : "Language"}: ${localeLabels[previous]}`, exact: true }).click();
  await page.getByRole("option", { name: localeLabels[next], exact: true }).click(); await expect(page.locator("html")).toHaveAttribute("lang", next);
}

test.beforeEach(async ({ context }) => {
  await context.route("**/*", route => { const url = new URL(route.request().url()); return ["127.0.0.1", "localhost"].includes(url.hostname) && !url.pathname.startsWith("/api/") ? route.continue() : route.abort(); });
});
for (const locale of ["pl", "en"] as const) for (const mode of ["two-steps-two-cards-mobile", "invalid-step-cache"] as const) {
  test(`${locale} ${mode}: retirement content uses the existing lesson and canonical quiz with honest saved progress`, async ({ page, context }, testInfo) => {
    const apiCalls: string[] = [], pageErrors: string[] = []; context.on("request", request => { if (new URL(request.url()).pathname.startsWith("/api/")) apiCalls.push(request.url()); }); page.on("pageerror", error => pageErrors.push(error.message));
    await page.setViewportSize({ width: 375, height: 812 }); await seed(page, locale, mode === "invalid-step-cache");
    try {
      await page.goto("/learn/retirement"); const copy = stageLessons[STAGE].copy[locale]!; expect(copy.steps).toHaveLength(2);
      if (mode === "two-steps-two-cards-mobile") {
        await expect.poll(async () => JSON.parse((await state(page)).steps!)[STAGE]).toBe(1); expect((await state(page)).tokens).toBe("125"); expect((await state(page)).srs).toBe("[]"); await checkpoint(page); // Controlled shell and actual first-step initialization precede the action-write window.
        for (let index = 0; index < 2; index++) {
          const step = copy.steps[index]!; await expect(lesson(page).getByRole("heading", { level: 1, name: copy.title, exact: true })).toBeVisible(); await expect(lesson(page).getByRole("heading", { level: 2, name: step.title, exact: true })).toBeVisible(); await expect(lesson(page).getByText(step.body, { exact: true })).toBeVisible(); await reflow(page);
          await expect.poll(async () => JSON.parse((await state(page)).steps!)[STAGE]).toBe(index + 1);
          if (index < 1) { const next = lesson(page).getByRole("button", { name: copy.next, exact: true }); await expect(next).toBeEnabled(); await next.click(); }
        }
        const link = lesson(page).getByRole("link", { name: copy.quiz, exact: true }); await expect(link).toHaveAttribute("href", "/quiz?topic=retirement"); await link.focus(); await expect(link).toBeFocused(); await page.keyboard.press("Enter"); await expect(page).toHaveURL(/\/quiz\?topic=retirement$/); await balance(page, locale, 125);
        for (let index = 0; index < 2; index++) {
          const canonical = await question(page, locale, index), radio = page.getByTestId("quiz-answer-" + KEYS[index]);
          if (index === 0) { await radio.focus(); await expect(radio).toBeFocused(); await page.keyboard.press("Space"); await expect(radio).toBeChecked(); await page.keyboard.press("Tab"); await expect(page.getByTestId("quiz-submit")).toBeFocused(); await page.keyboard.press("Enter"); }
          else { await radio.check(); await page.getByTestId("quiz-submit").click(); }
          const success = locale === "pl" ? canonical.explanation : quizQuestions.find(question => question.id === IDS[index])!.successMessage;
          await expect(page.getByTestId("quiz-confirmed-feedback")).toHaveText(success); await balance(page, locale, BALANCES[index]!); await reflow(page);
          if (index < 1) { await page.getByTestId("quiz-next").focus(); await expect(page.getByTestId("quiz-next")).toBeFocused(); await page.keyboard.press("Enter"); }
        }
        const saved = await checkpoint(page), cards = JSON.parse(saved.srs!) as Array<{ id: string; repetitions: number; nextReview: string }>;
        expect(cards.map(card => card.id)).toEqual(IDS); expect(cards.every(card => card.repetitions === 1 && card.nextReview === "2026-01-02")).toBe(true); expect(JSON.parse(saved.steps!)[STAGE]).toBe(2); expect(Number(saved.tokens) - 125).toBe(60); expect(REWARDS.reduce((sum, amount) => sum + amount, 0)).toBe(60); expect(saved.streak).toBe(TODAY_STREAK);
        await expect(page.locator('section[aria-labelledby="quiz-title"]').getByText(locale === "pl" ? "Twój wynik to 100 / 100 - rzuć wyzwanie znajomym!" : "You scored 100 / 100 - challenge your friends!", { exact: true })).toBeVisible();
        await page.reload(); await question(page, locale, 0); await balance(page, locale, 185); await unchanged(page, saved); // Quiz reload reads the existing receipts; no new question reward.
      } else {
        await expect(lesson(page).getByRole("alert")).toHaveText(WARNING[locale]); expect((await state(page)).reads).toBeGreaterThan(0); expect(await state(page)).toMatchObject({ steps: BAD_STEPS, tokens: "125", srs: "[]", streak: TODAY_STREAK, progressWrites: [] }); const before = await checkpoint(page);
        const next = lesson(page).getByRole("button", { name: copy.next, exact: true }); await expect(next).toBeDisabled(); await next.evaluate(button => button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))); await expect(lesson(page).getByRole("link")).toHaveCount(0); await unchanged(page, before);
        const other = locale === "pl" ? "en" : "pl"; await switchLocale(page, locale, other); await expect(lesson(page).getByRole("alert")).toHaveText(WARNING[other]); await unchanged(page, before);
        await page.reload(); await expect(lesson(page).getByRole("alert")).toHaveText(WARNING[other]); expect((await state(page)).reads).toBeGreaterThan(0); await unchanged(page, before); // No synthetic repair, rollback or product recovery is implied.
      }
      expect(apiCalls).toEqual([]); expect(pageErrors).toEqual([]);
    } finally {
      const lastState = await state(page).catch(error => ({ unavailable: String(error) })); await testInfo.attach("C25 synthetic observations", { body: JSON.stringify({ locale, mode, apiCalls, pageErrors, state: lastState }), contentType: "application/json" });
    }
  });
}
