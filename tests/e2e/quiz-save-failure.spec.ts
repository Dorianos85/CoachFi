import { expect, test, type Page } from "@playwright/test";
import { getQuestionById } from "../../lib/allQuestions";
import { CONSENT_VERSION } from "../../lib/consent";
import { translations } from "../../lib/i18n";
import { getLocalizedContent } from "../../lib/localizedContent";

type FaultMode = "none" | "srs-read" | "token-set-after";
type FaultState = { mode: FaultMode; triggered: number; writes: Array<{ key: string; value: string }> };
type FixtureWindow = typeof window & { __quizSaveFault: FaultState };
const copy = {
  pl: { retry: "Nie udało się zapisać odpowiedzi. Możesz spróbować ponownie.", uncertain: "Nie udało się potwierdzić pełnego zapisu. Odpowiedź lub punkty mogły zostać zapisane częściowo. Nie ponawiaj tej odpowiedzi. Odśwież stronę, aby odczytać dane lokalne.", reload: "Odśwież stronę" },
  en: { retry: "Your answer could not be saved. You can try again.", uncertain: "The full save could not be confirmed. Your answer or points may have been partially saved. Do not retry this answer. Reload the page to read your local data.", reload: "Reload page" },
};
async function seed(page: Page, locale: "pl" | "en") {
  await page.addInitScript(({ locale, version }) => {
    if (sessionStorage.getItem("FIXTURE_quiz_save_seeded")) return;
    sessionStorage.setItem("FIXTURE_quiz_save_seeded", "true");
    const now = new Date().toISOString();
    localStorage.setItem("coachfi-locale-v1", locale);
    localStorage.setItem("coachfi-user", JSON.stringify({ name: "FIXTURE_QUIZ_SAVE", goal: "education", setupDone: true }));
    localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 }));
    localStorage.setItem("coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now, termsAccepted: true, privacyAccepted: true,
      optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
    localStorage.setItem("coachfi-tokens", "125");
    const qa = window as FixtureWindow; qa.__quizSaveFault = { mode: "none", triggered: 0, writes: [] };
    const nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key: string) {
      if (this === localStorage && key === "coachfi-srs" && qa.__quizSaveFault.mode === "srs-read") {
        qa.__quizSaveFault.mode = "none"; qa.__quizSaveFault.triggered++;
        throw new DOMException("FIXTURE one blocked SRS read", "SecurityError");
      }
      return nativeGet.call(this, key);
    };
    Storage.prototype.setItem = function (key: string, value: string) {
      if (this === localStorage) qa.__quizSaveFault.writes.push({ key, value });
      nativeSet.call(this, key, value);
      if (this === localStorage && key === "coachfi-tokens" && qa.__quizSaveFault.mode === "token-set-after") {
        qa.__quizSaveFault.mode = "none"; qa.__quizSaveFault.triggered++;
        throw new DOMException("FIXTURE token changed before exception", "QuotaExceededError");
      }
    };
  }, { locale, version: CONSENT_VERSION });
}
async function arm(page: Page, mode: FaultMode) {
  await page.evaluate(mode => { const fault = (window as FixtureWindow).__quizSaveFault; fault.mode = mode; fault.writes = []; fault.triggered = 0; }, mode);
}
async function balances(page: Page, locale: "pl" | "en", value: number) {
  const card = page.getByRole("heading", { level: 3, name: getLocalizedContent(locale).common.tokens, exact: true }).locator("xpath=../..");
  const number = card.locator("p.text-5xl"); await expect(number).toHaveCount(1); await expect(number).toHaveText(String(value));
  await expect(page.locator("header").getByText(`${value} ${translations[locale].common.tokenUnit}`, { exact: true })).toBeVisible();
}
async function start(page: Page, locale: "pl" | "en") {
  await page.setViewportSize({ width: 1280, height: 900 }); await seed(page, locale); await page.goto("/quiz?topic=mindset");
  const quiz = page.locator(".focus-card").filter({ has: page.locator('input[name="net-worth"]') });
  await expect(quiz).toHaveCount(1); await expect(quiz.locator("legend")).toHaveText(getQuestionById("net-worth", locale)!.question);
  await balances(page, locale, 125); await quiz.locator('input[value="B"]').check(); return quiz;
}
test.beforeEach(async ({ context }) => {
  // Only fresh synthetic storage, no real accounts/audio/provider requests.
  await context.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
});
for (const locale of ["pl", "en"] as const) {
  test(`${locale}: read failure before writer allows explicit retry exactly once`, async ({ page }) => {
    const quiz = await start(page, locale), submit = quiz.getByRole("button", { name: translations[locale].quiz.submit, exact: true });
    await arm(page, "srs-read"); await submit.click();
    await expect(quiz.getByRole("alert")).toHaveText(copy[locale].retry); await expect(submit).toBeEnabled();
    await expect(quiz.locator('[aria-live="polite"]')).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("coachfi-srs"))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem("coachfi-tokens"))).toBe("125");
    expect(await page.evaluate(() => (window as FixtureWindow).__quizSaveFault)).toMatchObject({ triggered: 1, writes: [] });
    await balances(page, locale, 125);
    await submit.click(); await expect(quiz.getByRole("alert")).toHaveCount(0); await expect(quiz.locator('[aria-live="polite"]')).toHaveCount(1);
    await balances(page, locale, 150); expect(await page.evaluate(() => localStorage.getItem("coachfi-tokens"))).toBe("150");
    const cards = await page.evaluate(() => JSON.parse(localStorage.getItem("coachfi-srs")!) as Array<{ id: string; repetitions: number }>);
    expect(cards).toHaveLength(1); expect(cards[0]).toMatchObject({ id: "net-worth", repetitions: 1 });
    const writes = await page.evaluate(() => (window as FixtureWindow).__quizSaveFault.writes);
    expect(writes.filter(write => write.key === "coachfi-srs")).toHaveLength(1); expect(writes.filter(write => write.key === "coachfi-tokens")).toEqual([{ key: "coachfi-tokens", value: "150" }]);
    await expect(submit).toHaveCount(0);
  });

  test(`${locale}: write-then-throw locks answer and reload reads partial progress without replay`, async ({ page }) => {
    const quiz = await start(page, locale), submit = quiz.getByRole("button", { name: translations[locale].quiz.submit, exact: true });
    await arm(page, "token-set-after"); await submit.click();
    await expect(quiz.getByRole("alert")).toHaveCount(1); await expect(quiz.getByRole("alert").locator("p")).toHaveText(copy[locale].uncertain); await expect(submit).toBeDisabled();
    for (const radio of await quiz.getByRole("radio").all()) await expect(radio).toBeDisabled();
    await expect(quiz.locator('[aria-live="polite"]')).toHaveCount(0);
    await expect(quiz.getByRole("button", { name: translations[locale].quiz.next, exact: true })).toHaveCount(0);
    await expect(page.getByText(locale === "pl" ? "Twój wynik to 100 / 100 - rzuć wyzwanie znajomym!" : "You scored 100 / 100 - challenge your friends!", { exact: true })).toHaveCount(0);
    await balances(page, locale, 150);
    const before = await page.evaluate(() => ({ tokens: localStorage.getItem("coachfi-tokens"), srs: localStorage.getItem("coachfi-srs"), fault: (window as FixtureWindow).__quizSaveFault }));
    expect(before.tokens).toBe("150"); expect(JSON.parse(before.srs!)).toMatchObject([{ id: "net-worth", repetitions: 1 }]); expect(before.fault.triggered).toBe(1);
    expect(before.fault.writes.filter(write => write.key === "coachfi-srs")).toHaveLength(1);
    expect(before.fault.writes.filter(write => write.key === "coachfi-tokens")).toEqual([{ key: "coachfi-tokens", value: "150" }]);
    // Native form dispatch also cannot bypass the controller's synchronous blocked gate.
    await quiz.locator("form").evaluate(form => { form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
    expect(await page.evaluate(() => ({ tokens: localStorage.getItem("coachfi-tokens"), srs: localStorage.getItem("coachfi-srs"), fault: (window as FixtureWindow).__quizSaveFault }))).toEqual(before);
    await quiz.getByRole("button", { name: copy[locale].reload, exact: true }).click();
    await expect(page.locator("legend")).toHaveText(getQuestionById("lifestyle-inflation", locale)!.question);
    await balances(page, locale, 150);
    expect(await page.evaluate(() => localStorage.getItem("coachfi-tokens"))).toBe(before.tokens);
    expect(await page.evaluate(() => localStorage.getItem("coachfi-srs"))).toBe(before.srs);
    const reloadedQuiz = page.locator(".focus-card").filter({ has: page.locator('input[name="lifestyle-inflation"]') });
    await expect(reloadedQuiz).toHaveCount(1);
    await expect(reloadedQuiz.getByRole("alert")).toHaveCount(0);
  });
}
