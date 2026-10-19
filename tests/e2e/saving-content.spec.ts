import { expect, test, type Page } from "@playwright/test";
import { stageLessons } from "../../data/stageLessons";
import { quizQuestions } from "../../data/quizQuestions";
import { getQuestionById } from "../../lib/allQuestions";
import { CONSENT_VERSION } from "../../lib/consent";
import { localeLabels, translations } from "../../lib/i18n";
import { getLocalizedContent } from "../../lib/localizedContent";

type Locale = "pl" | "en";
const IDS = ["saving-habit", "budget-50-30-20", "high-yield-savings", "dca"];
const KEYS = ["C", "B", "B", "C"], REWARDS = [25, 25, 20, 30], BALANCES = [150, 175, 195, 225];
// Independent unchanged numeric contract: starter125 + rewards25/25/20/30 =225.
test.use({ timezoneId: "UTC" });
async function seed(page: Page, locale: Locale, failLessonWrite = false) {
  await page.clock.setFixedTime(new Date("2026-01-01T12:00:00.000Z"));
  await page.addInitScript(({ locale, version, failLessonWrite }) => {
    const initial = !sessionStorage.getItem("FIXTURE_saving_seeded");
    if (initial) {
      sessionStorage.setItem("FIXTURE_saving_seeded", "true"); const now = new Date().toISOString(); localStorage.setItem("coachfi-locale-v1", locale);
      localStorage.setItem("coachfi-user", JSON.stringify({ name: "FIXTURE_SAVING", goal: "education", setupDone: true }));
      localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 }));
      localStorage.setItem("coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now, termsAccepted: true, privacyAccepted: true,
        optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } })); localStorage.setItem("coachfi-tokens", "125");
    }
    const state = { blocked: initial && failLessonWrite, triggered: 0, writes: [] as Array<{ key: string; value: string }> };
    (window as typeof window & { __savingLessonFault: typeof state }).__savingLessonFault = state;
    const nativeSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (this === localStorage) state.writes.push({ key, value });
      if (this === localStorage && key === "coachfi-lesson-steps" && state.blocked) { state.blocked = false; state.triggered++; throw new DOMException("FIXTURE lesson step writer refused", "QuotaExceededError"); }
      nativeSet.call(this, key, value);
    };
  }, { locale, version: CONSENT_VERSION, failLessonWrite });
}
const lessonSection = (page: Page) => page.locator('section[aria-labelledby="stage-lesson-title"]');
const quiz = (page: Page) => page.locator(".focus-card").filter({ has: page.locator("legend") });
async function assertBalance(page: Page, locale: Locale, value: number) {
  const card = page.getByRole("heading", { level: 3, name: getLocalizedContent(locale).common.tokens, exact: true }).locator("xpath=../..");
  const number = card.locator("p.text-5xl"); await expect(number).toHaveCount(1); await expect(number).toHaveText(String(value));
}
async function assertQuestion(page: Page, locale: Locale, index: number) {
  const question = getQuestionById(IDS[index], locale)!; await expect(quiz(page)).toHaveCount(1); await expect(quiz(page).locator("legend")).toHaveText(question.question);
  await expect(quiz(page).locator(`input[name="${question.id}"]`)).toHaveCount(4);
  for (const answer of question.answers) await expect(quiz(page).locator("label").filter({ has: page.locator(`input[name="${question.id}"][value="${answer.id}"]`) })).toContainText(answer.text);
  return question;
}
async function answer(page: Page, locale: Locale, index: number, value: string) {
  await quiz(page).locator(`input[name="${IDS[index]}"][value="${value}"]`).check(); await quiz(page).getByRole("button", { name: translations[locale].quiz.submit, exact: true }).click();
}
async function switchLocale(page: Page, previous: Locale, next: Locale) {
  await page.locator("header").getByRole("button", { name: `${previous === "pl" ? "Język" : "Language"}: ${localeLabels[previous]}`, exact: true }).click();
  await page.getByRole("option", { name: localeLabels[next], exact: true }).click(); await expect(page.locator("html")).toHaveAttribute("lang", next);
}
test.beforeEach(async ({ context }) => {
  // Fresh guest only; no actual login, real audio, AI or non-local browser traffic.
  await context.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
});
for (const locale of ["pl", "en"] as const) {
  test(`${locale}: failed lesson-step writer blocks navigation and fresh reload reads synthetic local data`, async ({ page }) => {
    await seed(page, locale, true); await page.goto("/learn/saving-habit"); const copy = stageLessons["saving-habit"].copy[locale]!;
    const failure = locale === "pl" ? "Nie udało się potwierdzić zapisu kroku lekcji. Przejście dalej jest zablokowane. Odśwież stronę, aby ponownie odczytać dane lokalne." : "The lesson step save could not be confirmed. Continuing is blocked. Reload the page to read the local data again.";
    await expect(lessonSection(page).getByRole("alert")).toHaveText(failure); const next = lessonSection(page).getByRole("button", { name: copy.next, exact: true }); await expect(next).toBeDisabled();
    expect(await page.evaluate(() => localStorage.getItem("coachfi-lesson-steps"))).toBeNull(); expect(await page.evaluate(() => localStorage.getItem("coachfi-tokens"))).toBe("125");
    const before = await page.evaluate(() => (window as typeof window & { __savingLessonFault: { triggered: number; writes: Array<{ key: string; value: string }> } }).__savingLessonFault);
    expect(before.triggered).toBe(1); expect(before.writes.filter(value => value.key === "coachfi-lesson-steps")).toHaveLength(1);
    await next.evaluate(button => button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })));
    await expect(lessonSection(page).getByRole("heading", { level: 2, name: copy.steps[0].title, exact: true })).toBeVisible();
    expect(await page.evaluate(() => (window as typeof window & { __savingLessonFault: unknown }).__savingLessonFault)).toEqual(before);
    // Explicit fresh view reads local data; no product retry CTA or reward is asserted.
    await page.reload(); await expect(lessonSection(page).getByRole("alert")).toHaveCount(0); await expect(lessonSection(page).getByRole("button", { name: copy.next, exact: true })).toBeEnabled();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("coachfi-lesson-steps")!)["saving-habit"])).toBe(1); expect(await page.evaluate(() => localStorage.getItem("coachfi-tokens"))).toBe("125");
    await lessonSection(page).getByRole("button", { name: copy.next, exact: true }).click(); await expect(lessonSection(page).getByRole("heading", { level: 2, name: copy.steps[1].title, exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("coachfi-lesson-steps")!)["saving-habit"])).toBe(2);
  });
  test(`${locale}: four lesson steps -> four canonical questions, rewards and retained progress`, async ({ page }) => {
    await seed(page, locale); await page.goto("/learn/saving-habit"); const copy = stageLessons["saving-habit"].copy[locale]!;
    for (let i = 0; i < 4; i++) {
      await expect(lessonSection(page).getByRole("heading", { level: 1, name: copy.title, exact: true })).toBeVisible();
      await expect(lessonSection(page).getByRole("heading", { level: 2, name: copy.steps[i].title, exact: true })).toBeVisible();
      await expect(lessonSection(page).getByText(copy.steps[i].body, { exact: true })).toBeVisible();
      await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("coachfi-lesson-steps")!)["saving-habit"])).toBe(i + 1);
      if (i < 3) await lessonSection(page).getByRole("button", { name: copy.next, exact: true }).click();
    }
    await lessonSection(page).getByRole("link", { name: copy.quiz, exact: true }).click(); await expect(page).toHaveURL(/\/quiz\?topic=saving$/); await assertBalance(page, locale, 125);
    for (let i = 0; i < 4; i++) {
      const question = await assertQuestion(page, locale, i); await answer(page, locale, i, KEYS[i]);
      const success = locale === "pl" ? question.explanation : quizQuestions.find(question => question.id === IDS[i])!.successMessage;
      await expect(quiz(page).locator('[aria-live="polite"]')).toHaveText(success); await assertBalance(page, locale, BALANCES[i]);
      expect(await page.evaluate(() => localStorage.getItem("coachfi-tokens"))).toBe(String(BALANCES[i]));
      if (i < 3) await quiz(page).getByRole("button", { name: translations[locale].quiz.next, exact: true }).click();
    }
    const saved = await page.evaluate(() => ({ srs: localStorage.getItem("coachfi-srs"), tokens: localStorage.getItem("coachfi-tokens"), steps: localStorage.getItem("coachfi-lesson-steps") }));
    const cards = JSON.parse(saved.srs!) as Array<{ id: string; repetitions: number }>; expect(cards.map(card => card.id)).toEqual(IDS); expect(cards.every(card => card.repetitions === 1)).toBe(true);
    expect(Number(saved.tokens) - 125).toBe(REWARDS.reduce((sum, value) => sum + value, 0)); expect(Number(saved.tokens)).toBe(225);
    await page.reload(); await assertQuestion(page, locale, 0); await assertBalance(page, locale, 225);
    expect(await page.evaluate(() => ({ srs: localStorage.getItem("coachfi-srs"), tokens: localStorage.getItem("coachfi-tokens"), steps: localStorage.getItem("coachfi-lesson-steps") }))).toEqual(saved);
  });
  test(`${locale}: wrong feedback, retry and language reset preserve exact local progress`, async ({ page }) => {
    await seed(page, locale); await page.goto("/quiz?topic=saving"); const question = await assertQuestion(page, locale, 0);
    await answer(page, locale, 0, "A"); await expect(quiz(page).locator('[aria-live="polite"]')).toHaveText(question.explanation); await assertBalance(page, locale, 125);
    expect(await page.evaluate(() => localStorage.getItem("coachfi-tokens"))).toBe("125");
    await quiz(page).getByRole("button", { name: translations[locale].quiz.retry, exact: true }).click(); await quiz(page).locator(`input[name="${IDS[0]}"][value="A"]`).check();
    const other = locale === "pl" ? "en" : "pl", before = await page.evaluate(() => localStorage.getItem("coachfi-srs")); await switchLocale(page, locale, other); await assertQuestion(page, other, 0);
    await expect(quiz(page).getByRole("button", { name: translations[other].quiz.submit, exact: true })).toBeDisabled(); expect(await page.evaluate(() => localStorage.getItem("coachfi-srs"))).toBe(before);
    await answer(page, other, 0, "C"); await assertBalance(page, other, 150); const saved = await page.evaluate(() => ({ srs: localStorage.getItem("coachfi-srs"), tokens: localStorage.getItem("coachfi-tokens") }));
    await page.goto("/learn/saving-habit"); await expect(lessonSection(page).getByRole("heading", { level: 1, name: stageLessons["saving-habit"].copy[other]!.title, exact: true })).toBeVisible();
    await page.goto("/quiz?topic=saving"); await assertQuestion(page, other, 1); await assertBalance(page, other, 150); expect(await page.evaluate(() => ({ srs: localStorage.getItem("coachfi-srs"), tokens: localStorage.getItem("coachfi-tokens") }))).toEqual(saved);
  });
  test(`${locale}: mobile lesson reflow, keyboard radio and controlled prototype lesson route`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); await seed(page, locale); await page.goto("/learn/saving-habit"); const copy = stageLessons["saving-habit"].copy[locale]!;
    for (let i = 0; i < 4; i++) { await expect(lessonSection(page).getByText(copy.steps[i].body, { exact: true })).toBeVisible(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true); if (i < 3) await lessonSection(page).getByRole("button", { name: copy.next, exact: true }).click(); }
    await page.goto("/quiz?topic=saving"); const question = await assertQuestion(page, locale, 0); const radio = quiz(page).locator(`input[name="${IDS[0]}"][value="C"]`);
    await radio.focus(); await expect(radio).toBeFocused(); await page.keyboard.press("Space"); await expect(radio).toBeChecked(); await page.keyboard.press("Tab");
    const submit = quiz(page).getByRole("button", { name: translations[locale].quiz.submit, exact: true }); await expect(submit).toBeFocused(); await page.keyboard.press("Enter");
    await expect(quiz(page).locator('[aria-live="polite"]')).toHaveText(locale === "pl" ? question.explanation : quizQuestions.find(question => question.id === IDS[0])!.successMessage); await assertBalance(page, locale, 150);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    const before = await page.evaluate(() => ({ tokens: localStorage.getItem("coachfi-tokens"), srs: localStorage.getItem("coachfi-srs"), steps: localStorage.getItem("coachfi-lesson-steps") }));
    await page.goto("/learn/toString"); await expect(page.getByRole("heading", { name: "404", exact: true })).toBeVisible(); await expect(lessonSection(page)).toHaveCount(0);
    expect(await page.evaluate(() => ({ tokens: localStorage.getItem("coachfi-tokens"), srs: localStorage.getItem("coachfi-srs"), steps: localStorage.getItem("coachfi-lesson-steps") }))).toEqual(before);
  });
}
