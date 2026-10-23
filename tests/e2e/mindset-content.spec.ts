import { expect, test, type Page } from "@playwright/test";
import { moneyMindsetLesson } from "../../data/moneyMindsetLesson";
import { quizQuestions } from "../../data/quizQuestions";
import { getQuestionById } from "../../lib/allQuestions";
import { CONSENT_VERSION } from "../../lib/consent";
import { translations } from "../../lib/i18n";
import { getLocalizedContent } from "../../lib/localizedContent";

// Fresh isolated browser contexts only. No actual login, provider audio or network.
const ids = ["net-worth", "lifestyle-inflation", "pay-yourself-first"];
const keys = ["B", "C", "B"], points = [25, 25, 20];
// Independent documented oracle: unchanged starter125 + rewards25/25/20.
// A fresh missing storage key is not a zero balance; no production helper is imported.
const STARTER_BALANCE = 125, EXPECTED_BALANCES = [150, 175, 195];
type SpeechState = { calls: Array<{ text: string; lang: string; local: boolean }> };
async function seed(page: Page, locale: "pl" | "en", voice = false) {
  await page.addInitScript(({ locale, voice, version }) => {
    if (sessionStorage.getItem("FIXTURE_mindset_seeded")) return;
    sessionStorage.setItem("FIXTURE_mindset_seeded", "true");
    const now = new Date().toISOString();
    localStorage.setItem("coachfi-locale-v1", locale);
    localStorage.setItem("coachfi-user", JSON.stringify({ name: "FIXTURE_MINDSET", goal: "education", setupDone: true }));
    localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 }));
    localStorage.setItem("coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now, termsAccepted: true, privacyAccepted: true,
      optional: { aiCoach: false, voice, leaderboard: false, blockchain: false } }));
  }, { locale, voice, version: CONSENT_VERSION });
}
async function mockLocalSpeech(page: Page) {
  await page.addInitScript(() => {
    const qa = window as typeof window & { __mindsetSpeech: SpeechState }; qa.__mindsetSpeech = { calls: [] };
    class FixtureUtterance {
      voice: { lang: string; localService: boolean } | null = null; lang = "";
      onstart: (() => void) | null = null; onend: (() => void) | null = null; onerror: (() => void) | null = null;
      constructor(public text: string) {}
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: FixtureUtterance });
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
      getVoices: () => [{ lang: "pl-PL", localService: true }, { lang: "en-US", localService: true }], cancel: () => {},
      speak: (utterance: FixtureUtterance) => { qa.__mindsetSpeech.calls.push({ text: utterance.text, lang: utterance.lang,
        local: utterance.voice?.localService === true }); utterance.onstart?.(); },
    } });
  });
}
async function assertQuestion(page: Page, locale: "pl" | "en", index: number) {
  const question = getQuestionById(ids[index], locale)!;
  await expect(page.locator("legend")).toHaveText(question.question);
  const radios = page.locator(`input[name="${ids[index]}"]`); await expect(radios).toHaveCount(4);
  for (const answer of question.answers) await expect(page.locator("label").filter({ has: page.locator(`input[name="${question.id}"][value="${answer.id}"]`) })).toContainText(answer.text);
  return question;
}
async function answer(page: Page, locale: "pl" | "en", index: number, value: string) {
  await page.locator(`input[name="${ids[index]}"][value="${value}"]`).check();
  await page.getByRole("button", { name: translations[locale].quiz.submit, exact: true }).click();
}
async function assertBalanceUI(page: Page, locale: "pl" | "en", value: number) {
  // CardTitle is h3 inside CardHeader; its parent card owns this p balance.
  const card = page.getByRole("heading", { level: 3, name: getLocalizedContent(locale).common.tokens, exact: true }).locator("xpath=../..");
  const balance = card.locator("p.text-5xl");
  await expect(balance).toHaveCount(1); await expect(balance).toBeVisible(); await expect(balance).toHaveText(String(value));
}
test.beforeEach(async ({ context }) => {
  await context.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
});

for (const locale of ["pl", "en"] as const) {
  test(`${locale}: lesson3 -> mindset3, retry, local speech text, rewards and restart`, async ({ page }) => {
    await seed(page, locale, true); await mockLocalSpeech(page); const lesson = moneyMindsetLesson[locale]!, t = translations[locale].quiz;
    await page.goto("/learn/money-mindset");
    for (let i = 0; i < 3; i++) {
      await expect(page.getByRole("heading", { name: lesson.title, level: 1, exact: true })).toBeVisible();
      await expect(page.getByRole("heading", { name: lesson.steps[i].title, level: 2, exact: true })).toBeVisible();
      await expect(page.getByText(lesson.steps[i].body, { exact: true })).toBeVisible();
      if (i < 2) await page.getByRole("button", { name: lesson.next, exact: true }).click();
    }
    await page.getByRole("link", { name: lesson.quiz, exact: true }).click(); await expect(page).toHaveURL(/\/quiz\?topic=mindset$/);
    await assertBalanceUI(page, locale, STARTER_BALANCE);
    expect(await page.evaluate(() => localStorage.getItem("coachfi-tokens"))).toBeNull();
    for (let i = 0; i < 3; i++) {
      const question = await assertQuestion(page, locale, i);
      const read = page.locator("fieldset").getByRole("button", { name: new RegExp(getLocalizedContent(locale).voice.readQuestion) });
      await read.click(); await expect.poll(() => page.evaluate(() => (window as typeof window & { __mindsetSpeech: SpeechState }).__mindsetSpeech.calls.length)).toBe(i + 1);
      const call = await page.evaluate(() => (window as typeof window & { __mindsetSpeech: SpeechState }).__mindsetSpeech.calls.at(-1)!);
      expect(call.text).toBe([question.question, ...question.answers.map(option => `${option.id}. ${option.text}`)].join(" "));
      expect(call.lang).toMatch(new RegExp(`^${locale}(?:-|$)`)); expect(call.local).toBe(true); await read.click(); // Stop the synthetic playback.
      if (i === 0) {
        const beforeWrong = await page.evaluate(() => localStorage.getItem("coachfi-tokens"));
        await answer(page, locale, i, "A"); await expect(page.getByText(question.explanation, { exact: true })).toBeVisible();
        expect(await page.evaluate(() => localStorage.getItem("coachfi-tokens"))).toBe(beforeWrong);
        await assertBalanceUI(page, locale, STARTER_BALANCE);
        await page.getByRole("button", { name: t.retry, exact: true }).click();
      }
      await answer(page, locale, i, keys[i]);
      const success = locale === "pl" ? question.explanation : quizQuestions.find(item => item.id === ids[i])!.successMessage;
      await expect(page.getByText(success, { exact: true })).toBeVisible();
      await expect.poll(() => page.evaluate(() => Number(localStorage.getItem("coachfi-tokens")))).toBe(EXPECTED_BALANCES[i]);
      await assertBalanceUI(page, locale, EXPECTED_BALANCES[i]);
      if (i < 2) await page.getByRole("button", { name: t.next, exact: true }).click();
    }
    const cards = await page.evaluate(() => JSON.parse(localStorage.getItem("coachfi-srs")!) as Array<{ id: string; repetitions: number }>);
    expect(cards.map(card => card.id).sort()).toEqual([...ids].sort()); expect(cards.every(card => card.repetitions === 1)).toBe(true);
    await expect(page.getByText(locale === "pl" ? "Twój wynik to 100 / 100 - rzuć wyzwanie znajomym!" : "You scored 100 / 100 - challenge your friends!", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: t.restart, exact: true }).click(); await assertQuestion(page, locale, 0);
    await expect(page.getByRole("button", { name: t.submit, exact: true })).toBeDisabled();
    const finalBalance = await page.evaluate(() => Number(localStorage.getItem("coachfi-tokens")));
    expect(finalBalance).toBe(195); expect(finalBalance - STARTER_BALANCE).toBe(points.reduce((sum, value) => sum + value, 0));
    expect(finalBalance - STARTER_BALANCE).toBe(70); await assertBalanceUI(page, locale, finalBalance);
  });

  test(`${locale}: language change, reload and lesson return retain progress without a stale selection`, async ({ page }) => {
    await seed(page, locale); await page.goto("/quiz?topic=mindset"); await assertQuestion(page, locale, 0);
    await assertBalanceUI(page, locale, STARTER_BALANCE);
    await page.locator('input[name="net-worth"][value="A"]').check(); const other = locale === "pl" ? "en" : "pl";
    await page.getByRole("button", { name: /^(Język|Language):/ }).click(); await page.getByRole("option", { name: other === "pl" ? "Polski" : "English", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", other); await assertQuestion(page, other, 0);
    await expect(page.getByRole("button", { name: translations[other].quiz.submit, exact: true })).toBeDisabled();
    expect(await page.evaluate(() => localStorage.getItem("coachfi-srs"))).toBeNull();
    await page.reload(); await assertQuestion(page, other, 0); await answer(page, other, 0, "B");
    const first = await page.evaluate(() => localStorage.getItem("coachfi-srs"));
    await page.goto("/learn/money-mindset"); await expect(page.getByRole("heading", { name: moneyMindsetLesson[other]!.title, exact: true })).toBeVisible();
    await page.goto("/quiz?topic=mindset"); await assertQuestion(page, other, 1);
    expect(await page.evaluate(() => localStorage.getItem("coachfi-srs"))).toBe(first);
    expect(await page.evaluate(() => Number(localStorage.getItem("coachfi-tokens")))).toBe(150); await assertBalanceUI(page, other, 150);
  });

  test(`${locale}: narrow viewport presents long lesson/answers and keyboard submits the correct radio`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); await seed(page, locale); await page.goto("/learn/money-mindset");
    for (let i = 0; i < 3; i++) {
      await expect(page.getByText(moneyMindsetLesson[locale]!.steps[i].body, { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      if (i < 2) await page.getByRole("button", { name: moneyMindsetLesson[locale]!.next, exact: true }).click();
    }
    await page.goto("/quiz?topic=mindset"); const question = await assertQuestion(page, locale, 0);
    await assertBalanceUI(page, locale, STARTER_BALANCE);
    const radio = page.locator('input[name="net-worth"][value="B"]'); await radio.focus(); await expect(radio).toBeFocused();
    await page.keyboard.press("Space"); await expect(radio).toBeChecked(); await page.keyboard.press("Tab");
    const submit = page.getByRole("button", { name: translations[locale].quiz.submit, exact: true }); await expect(submit).toBeFocused(); await page.keyboard.press("Enter");
    await expect(page.getByText(locale === "pl" ? question.explanation : quizQuestions.find(item => item.id === "net-worth")!.successMessage, { exact: true })).toBeVisible();
    expect(await page.evaluate(() => Number(localStorage.getItem("coachfi-tokens")))).toBe(150); await assertBalanceUI(page, locale, 150);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  });
}
