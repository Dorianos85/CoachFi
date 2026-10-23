import { expect, test, type Page } from "@playwright/test";
import { stageLessons } from "../../data/stageLessons";
import { quizQuestions } from "../../data/quizQuestions";
import { getQuestionById } from "../../lib/allQuestions";
import { CONSENT_VERSION } from "../../lib/consent";
import { localeLabels, translations } from "../../lib/i18n";
import { getLocalizedContent } from "../../lib/localizedContent";

type Locale = "pl" | "en";
type Probe = { reads: number; writes: Array<{ key: string; value: string }>; snapshot(): { steps: string | null; tokens: string | null; srs: string | null } };
type FixtureWindow = typeof window & { __emergencyContent: Probe };
const IDS = ["emergency-fund", "emergency-fund-characteristics", "emergency-fund-start"];
const KEYS = ["C", "C", "B"], REWARDS = [25, 25, 20], BALANCES = [150, 175, 195];
const PROGRESS_KEYS = ["coachfi-lesson-steps", "coachfi-tokens", "coachfi-srs"];
const lesson = (page: Page) => page.locator('section[aria-labelledby="stage-lesson-title"]');
const quiz = (page: Page) => page.locator('section[aria-labelledby="quiz-title"] .focus-card').filter({ has: page.locator("legend") });
const WARNING = {
  pl: "Nie udało się potwierdzić zapisu kroku lekcji. Przejście dalej jest zablokowane. Odśwież stronę, aby ponownie odczytać dane lokalne.",
  en: "The lesson step save could not be confirmed. Continuing is blocked. Reload the page to read the local data again.",
};

test.use({ timezoneId: "UTC" });
async function seed(page: Page, locale: Locale, invalidCounter = false) {
  await page.clock.setFixedTime(new Date("2026-01-01T12:00:00.000Z"));
  await page.addInitScript(({ locale, version, invalidCounter }) => {
    if (!sessionStorage.getItem("FIXTURE_emergency_content_seeded")) {
      sessionStorage.setItem("FIXTURE_emergency_content_seeded", "true"); const now = new Date().toISOString();
      localStorage.setItem("coachfi-locale-v1", locale);
      localStorage.setItem("coachfi-user", JSON.stringify({ name: "FIXTURE_EMERGENCY_CONTENT", goal: "education", setupDone: true }));
      localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 }));
      localStorage.setItem("coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now, termsAccepted: true, privacyAccepted: true,
        optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
      localStorage.setItem("coachfi-tokens", "125");
      if (invalidCounter) localStorage.setItem("coachfi-lesson-steps", '{"emergency-fund":4}');
    }
    const nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem;
    const probe: Probe = { reads: 0, writes: [], snapshot: () => ({ steps: nativeGet.call(localStorage, "coachfi-lesson-steps"), tokens: nativeGet.call(localStorage, "coachfi-tokens"), srs: nativeGet.call(localStorage, "coachfi-srs") }) };
    (window as FixtureWindow).__emergencyContent = probe;
    Storage.prototype.getItem = function (key: string) { if (this === localStorage && key === "coachfi-lesson-steps") probe.reads++; return nativeGet.call(this, key); };
    Storage.prototype.setItem = function (key: string, value: string) { if (this === localStorage) probe.writes.push({ key, value }); nativeSet.call(this, key, value); };
  }, { locale, version: CONSENT_VERSION, invalidCounter });
}
async function state(page: Page) {
  return page.evaluate(keys => { const probe = (window as FixtureWindow).__emergencyContent; return { ...probe.snapshot(), reads: probe.reads, progressWrites: probe.writes.filter(write => keys.includes(write.key)) }; }, PROGRESS_KEYS);
}
async function checkpoint(page: Page) {
  return page.evaluate(() => { const probe = (window as FixtureWindow).__emergencyContent; const before = probe.snapshot(); probe.writes.length = 0; return before; });
}
async function assertProgressUnchanged(page: Page, before: { steps: string | null; tokens: string | null; srs: string | null }) {
  const actual = await state(page); expect({ steps: actual.steps, tokens: actual.tokens, srs: actual.srs }).toEqual(before);
  expect(actual.progressWrites).toEqual([]); // Inspect writer observations before any checkpoint/reset.
}
async function assertBalance(page: Page, locale: Locale, expected: number) {
  const card = page.getByRole("heading", { level: 3, name: getLocalizedContent(locale).common.tokens, exact: true }).locator("xpath=../..");
  await expect(card.locator("p.text-5xl")).toHaveCount(1); await expect(card.locator("p.text-5xl")).toHaveText(String(expected)); expect((await state(page)).tokens).toBe(String(expected));
}
async function assertQuestion(page: Page, locale: Locale, index: number) {
  const question = getQuestionById(IDS[index], locale)!; await expect(quiz(page)).toHaveCount(1); await expect(quiz(page).locator("legend")).toHaveText(question.question);
  await expect(quiz(page).locator(`input[name="${IDS[index]}"]`)).toHaveCount(4);
  for (const answer of question.answers) await expect(quiz(page).locator("label").filter({ has: page.locator(`input[name="${IDS[index]}"][value="${answer.id}"]`) })).toContainText(answer.text);
  expect(question.correctAnswer).toBe(KEYS[index]); expect(question.reward).toBe(REWARDS[index]); return question;
}
async function answer(page: Page, locale: Locale, index: number, value: string) {
  await quiz(page).locator(`input[name="${IDS[index]}"][value="${value}"]`).check(); await quiz(page).getByRole("button", { name: translations[locale].quiz.submit, exact: true }).click();
}
async function goThroughLesson(page: Page, locale: Locale, checkReflow = false) {
  const copy = stageLessons["emergency-fund"].copy[locale]!;
  for (let index = 0; index < 3; index++) {
    await expect(lesson(page).getByRole("heading", { level: 1, name: copy.title, exact: true })).toBeVisible();
    await expect(lesson(page).getByRole("heading", { level: 2, name: copy.steps[index].title, exact: true })).toBeVisible();
    await expect(lesson(page).getByText(copy.steps[index].body, { exact: true })).toBeVisible();
    await expect.poll(async () => JSON.parse((await state(page)).steps!)["emergency-fund"]).toBe(index + 1);
    if (checkReflow) expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    if (index < 2) { const next = lesson(page).getByRole("button", { name: copy.next, exact: true }); await expect(next).toBeEnabled(); await next.click(); }
  }
  await expect(lesson(page).getByRole("link", { name: copy.quiz, exact: true })).toHaveAttribute("href", "/quiz?topic=emergency"); return copy;
}
async function switchLocale(page: Page, previous: Locale, next: Locale) {
  await page.locator("header").getByRole("button", { name: `${previous === "pl" ? "Język" : "Language"}: ${localeLabels[previous]}`, exact: true }).click();
  await page.getByRole("option", { name: localeLabels[next], exact: true }).click(); await expect(page.locator("html")).toHaveAttribute("lang", next);
}

test.beforeEach(async ({ context }) => {
  // Actual lessons and quiz only; fresh synthetic guests, no providers, real audio or API traffic.
  await context.route("**/*", route => { const url = new URL(route.request().url());
    return ["127.0.0.1", "localhost"].includes(url.hostname) && !url.pathname.startsWith("/api/") ? route.continue() : route.abort(); });
});
for (const locale of ["pl", "en"] as const) for (const mode of ["three-steps-three-cards", "wrong-retry-locale", "mobile-keyboard", "invalid-step-cache"] as const) {
  test(`${locale} ${mode}: emergency lesson/quiz retain canonical content and honest progress`, async ({ page, context }) => {
    const apiCalls: string[] = []; context.on("request", request => { if (new URL(request.url()).pathname.startsWith("/api/")) apiCalls.push(request.url()); });
    if (mode === "mobile-keyboard") await page.setViewportSize({ width: 375, height: 812 });
    await seed(page, locale, mode === "invalid-step-cache");
    if (mode === "three-steps-three-cards" || mode === "mobile-keyboard") {
      await page.goto("/learn/emergency-fund"); await expect.poll(async () => JSON.parse((await state(page)).steps!)["emergency-fund"]).toBe(1);
      expect((await state(page)).tokens).toBe("125"); await checkpoint(page); // Scope form/progress observations after confirmed shell + first-step initialization.
      const copy = await goThroughLesson(page, locale, mode === "mobile-keyboard"); await lesson(page).getByRole("link", { name: copy.quiz, exact: true }).click(); await expect(page).toHaveURL(/\/quiz\?topic=emergency$/); await assertQuestion(page, locale, 0); await assertBalance(page, locale, 125);
      if (mode === "three-steps-three-cards") {
        for (let index = 0; index < 3; index++) {
          const question = await assertQuestion(page, locale, index); await answer(page, locale, index, KEYS[index]);
          const success = locale === "pl" ? question.explanation : quizQuestions.find(question => question.id === IDS[index])!.successMessage;
          await expect(quiz(page).locator('[aria-live="polite"]')).toHaveText(success); await assertBalance(page, locale, BALANCES[index]);
          if (index < 2) await quiz(page).getByRole("button", { name: translations[locale].quiz.next, exact: true }).click();
        }
        const saved = await checkpoint(page); const cards = JSON.parse(saved.srs!) as Array<{ id: string; repetitions: number }>;
        expect(cards.map(card => card.id)).toEqual(IDS); expect(cards.every(card => card.repetitions === 1)).toBe(true); expect(JSON.parse(saved.steps!)["emergency-fund"]).toBe(3);
        expect(Number(saved.tokens) - 125).toBe(70); expect(REWARDS.reduce((sum, amount) => sum + amount, 0)).toBe(70);
        await expect(page.locator('section[aria-labelledby="quiz-title"]').getByText(locale === "pl" ? "Twój wynik to 100 / 100 - rzuć wyzwanie znajomym!" : "You scored 100 / 100 - challenge your friends!", { exact: true })).toBeVisible();
        await page.reload(); await assertQuestion(page, locale, 0); await assertBalance(page, locale, 195);
        await assertProgressUnchanged(page, saved);
      } else {
        const radio = quiz(page).locator(`input[name="${IDS[0]}"][value="${KEYS[0]}"]`); await radio.focus(); await expect(radio).toBeFocused(); await page.keyboard.press("Space"); await expect(radio).toBeChecked(); await page.keyboard.press("Tab");
        const submit = quiz(page).getByRole("button", { name: translations[locale].quiz.submit, exact: true }); await expect(submit).toBeFocused(); await page.keyboard.press("Enter"); await assertBalance(page, locale, 150);
        expect(JSON.parse((await state(page)).srs!).map((card: { id: string }) => card.id)).toEqual([IDS[0]]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
        await quiz(page).getByRole("button", { name: translations[locale].quiz.next, exact: true }).click(); await assertQuestion(page, locale, 1); await assertBalance(page, locale, 150);
      }
    } else if (mode === "wrong-retry-locale") {
      await page.goto("/quiz?topic=emergency"); const question = await assertQuestion(page, locale, 0); await assertBalance(page, locale, 125); await checkpoint(page);
      await answer(page, locale, 0, "A"); await expect(quiz(page).locator('[aria-live="polite"]')).toHaveText(question.explanation); await assertBalance(page, locale, 125);
      await quiz(page).getByRole("button", { name: translations[locale].quiz.retry, exact: true }).click(); await quiz(page).locator(`input[name="${IDS[0]}"][value="A"]`).check();
      const savedWrong = await checkpoint(page), other = locale === "pl" ? "en" : "pl"; await switchLocale(page, locale, other); await assertQuestion(page, other, 0);
      await expect(quiz(page).locator('input[type="radio"]:checked')).toHaveCount(0); await expect(quiz(page).getByRole("button", { name: translations[other].quiz.submit, exact: true })).toBeDisabled();
      await assertProgressUnchanged(page, savedWrong);
      await answer(page, other, 0, KEYS[0]); await assertBalance(page, other, 150); const saved = await checkpoint(page); expect(JSON.parse(saved.srs!).map((card: { id: string }) => card.id)).toEqual([IDS[0]]);
      await page.reload(); await assertQuestion(page, other, 1); await assertBalance(page, other, 150); await assertProgressUnchanged(page, saved);
    } else {
      await page.goto("/learn/emergency-fund"); await expect(lesson(page).getByRole("alert")).toHaveText(WARNING[locale]); expect((await state(page)).reads).toBeGreaterThan(0);
      expect(await state(page)).toMatchObject({ steps: '{"emergency-fund":4}', tokens: "125", srs: null, progressWrites: [] }); const before = await checkpoint(page);
      const next = lesson(page).getByRole("button", { name: stageLessons["emergency-fund"].copy[locale]!.next, exact: true }); await expect(next).toBeDisabled();
      await next.evaluate(button => button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))); await expect(lesson(page).getByRole("link")).toHaveCount(0); await assertProgressUnchanged(page, before);
      const other = locale === "pl" ? "en" : "pl"; await switchLocale(page, locale, other); await expect(lesson(page).getByRole("alert")).toHaveText(WARNING[other]); await assertProgressUnchanged(page, before);
      await page.reload(); await expect(lesson(page).getByRole("alert")).toHaveText(WARNING[other]); expect((await state(page)).reads).toBeGreaterThan(0);
      expect(await state(page)).toMatchObject({ ...before, progressWrites: [] }); // No recovery/migration promise; fresh view preserves invalid bytes and remains blocked.
    }
    expect(apiCalls).toEqual([]);
  });
}
