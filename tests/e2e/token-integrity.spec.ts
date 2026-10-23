import { expect, test, type Page } from "@playwright/test";
import { quizQuestions } from "../../data/quizQuestions";
import { getQuestionById } from "../../lib/allQuestions";
import { CONSENT_VERSION } from "../../lib/consent";
import { translations } from "../../lib/i18n";
import { getLocalizedContent } from "../../lib/localizedContent";

const alertCopy = {
  pl: "Nie można bezpiecznie zapisać nagrody w lokalnym saldzie punktów. Odpowiedź nie została zapisana. Sprawdź dane lokalne w Ustawieniach.",
  en: "Your local points balance cannot safely accept this reward. This answer was not saved. Check your local data in Settings.",
};

async function seedMalformedGuest(page: Page, locale: "pl" | "en") {
  await page.addInitScript(({ locale, version }) => {
    if (sessionStorage.getItem("FIXTURE_token_integrity_seeded")) return;
    sessionStorage.setItem("FIXTURE_token_integrity_seeded", "true");
    const now = new Date().toISOString();
    localStorage.setItem("coachfi-locale-v1", locale);
    localStorage.setItem("coachfi-user", JSON.stringify({ name: "FIXTURE_TOKEN_INTEGRITY", goal: "education", setupDone: true }));
    localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 }));
    localStorage.setItem("coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now, termsAccepted: true, privacyAccepted: true,
      optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
    localStorage.setItem("coachfi-tokens", "25garbage");
  }, { locale, version: CONSENT_VERSION });
}

async function assertBalanceUI(page: Page, locale: "pl" | "en", expected: number) {
  // The balance belongs to this TokenRewardCard, not an unrelated header text.
  const card = page.getByRole("heading", { level: 3, name: getLocalizedContent(locale).common.tokens, exact: true }).locator("xpath=../..");
  const balance = card.locator("p.text-5xl");
  await expect(balance).toHaveCount(1);
  await expect(balance).toBeVisible();
  await expect(balance).toHaveText(String(expected));
  await expect(page.locator("header").getByText(`${expected} ${translations[locale].common.tokenUnit}`, { exact: true })).toBeVisible();
}

test.beforeEach(async ({ context }) => {
  // Fresh Playwright storage only. No real accounts, provider audio or external requests.
  await context.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
});

for (const locale of ["pl", "en"] as const) {
  test(`${locale}: malformed points reject quiz reward; fixture-only repair permits one valid retry`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await seedMalformedGuest(page, locale);
    await page.goto("/quiz?topic=mindset");
    const question = getQuestionById("net-worth", locale)!;
    const quiz = page.locator(".focus-card").filter({ has: page.locator('input[name="net-worth"]') });
    await expect(quiz).toHaveCount(1);
    await expect(quiz.locator("legend")).toHaveText(question.question);
    await assertBalanceUI(page, locale, 0);
    expect(await page.evaluate(() => localStorage.getItem("coachfi-tokens"))).toBe("25garbage");
    expect(await page.evaluate(() => localStorage.getItem("coachfi-srs"))).toBeNull();

    await quiz.locator('input[value="B"]').check();
    const submit = quiz.getByRole("button", { name: translations[locale].quiz.submit, exact: true });
    await submit.click();
    await expect(quiz.getByRole("alert")).toHaveText(alertCopy[locale]);
    await expect(quiz.locator('[aria-live="polite"]')).toHaveCount(0);
    await expect(quiz.getByRole("button", { name: translations[locale].quiz.next, exact: true })).toHaveCount(0);
    await expect(submit).toBeEnabled();
    await expect(page.getByText(locale === "pl" ? "Twój wynik to 100 / 100 - rzuć wyzwanie znajomym!" : "You scored 100 / 100 - challenge your friends!", { exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("coachfi-tokens"))).toBe("25garbage");
    expect(await page.evaluate(() => localStorage.getItem("coachfi-srs"))).toBeNull();
    await assertBalanceUI(page, locale, 0);

    // Only this fixture repairs its own synthetic bytes. This is not a product repair feature.
    // Independent oracle: canonical starter125 + net-worth reward25 =150.
    await page.evaluate(() => {
      localStorage.setItem("coachfi-tokens", "125");
      window.dispatchEvent(new Event("coachfi-tokens"));
    });
    await submit.click();
    await expect(quiz.getByRole("alert")).toHaveCount(0);
    await expect(quiz.locator('[aria-live="polite"]')).toHaveCount(1);
    await expect(quiz.locator('[aria-live="polite"]')).toHaveText(locale === "pl" ? question.explanation : quizQuestions.find(item => item.id === "net-worth")!.successMessage);
    await expect(quiz.getByRole("button", { name: translations[locale].quiz.next, exact: true })).toBeVisible();
    await expect(submit).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("coachfi-tokens"))).toBe("150");
    await assertBalanceUI(page, locale, 150);
    const cards = await page.evaluate(() => JSON.parse(localStorage.getItem("coachfi-srs")!) as Array<{ id: string; repetitions: number }>);
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ id: "net-worth", repetitions: 1 });
  });
}
