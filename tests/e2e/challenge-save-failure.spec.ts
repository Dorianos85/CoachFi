import { expect, test, type Page } from "@playwright/test";
import { challengeQuestions } from "../../data/challengeQuestions";
import { getQuestionById } from "../../lib/allQuestions";
import { CONSENT_VERSION } from "../../lib/consent";
import { localeLabels, translations } from "../../lib/i18n";

type Locale = "pl" | "en";
type FaultMode = "none" | "challenge-read" | "marker-after";
type FaultState = { mode: FaultMode; triggered: number; writes: Array<{ key: string; value: string }> };
type FixtureWindow = typeof window & { __dailySaveFault: FaultState };
const FIXED_TIME = "2026-01-01T12:00:00.000Z";
// Fixed browser UTC January 1: floor((Jan1 noon - Dec31 midnight)/day) = 1.
// Read the existing question by that deterministic index, independent of host date.
const daily = challengeQuestions[1];
const copy = {
  pl: { earned: "Punkty zdobyte podczas tej sesji", check: "Sprawdź odczyt ponownie",
    unavailable: "Nie można odczytać danych wyzwania. Nie przyznano nowych punktów. Sprawdź odczyt ponownie.",
    retry: "Nie udało się zapisać odpowiedzi. Nie przyznano nowych punktów. Możesz spróbować ponownie.",
    uncertain: "Nie udało się potwierdzić pełnego zapisu. Punkty lub ukończenie wyzwania mogły zostać zapisane częściowo. Nie ponawiaj tej odpowiedzi. Zmiana języka nie odblokuje ponowienia." },
  en: { earned: "Points earned during this session", check: "Check the data again",
    unavailable: "The challenge data could not be read. No new points were awarded. Check the data again.",
    retry: "Your answer could not be saved. No new points were awarded. You can try again.",
    uncertain: "The full save could not be confirmed. Points or challenge completion may have been partially saved. Do not retry this answer. Changing the language will not unlock another attempt." },
};
test.use({ timezoneId: "UTC" });
async function seed(page: Page, locale: Locale, malformedMarker = false) {
  await page.clock.setFixedTime(new Date(FIXED_TIME));
  await page.addInitScript(({ locale, version, malformedMarker }) => {
    if (!sessionStorage.getItem("FIXTURE_daily_save_seeded")) {
      sessionStorage.setItem("FIXTURE_daily_save_seeded", "true");
      const now = new Date().toISOString();
      localStorage.setItem("coachfi-locale-v1", locale);
      localStorage.setItem("coachfi-user", JSON.stringify({ name: "FIXTURE_DAILY_SAVE", goal: "education", setupDone: true }));
      localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 }));
      localStorage.setItem("coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now, termsAccepted: true, privacyAccepted: true,
        optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
      localStorage.setItem("coachfi-tokens", "125");
      if (malformedMarker) localStorage.setItem("coachfi-challenge", "{broken");
    }
    const state = window as FixtureWindow; state.__dailySaveFault = { mode: "none", triggered: 0, writes: [] };
    const nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key: string) {
      if (this === localStorage && key === "coachfi-challenge" && state.__dailySaveFault.mode === "challenge-read") {
        state.__dailySaveFault.mode = "none"; state.__dailySaveFault.triggered++;
        throw new DOMException("FIXTURE refused challenge read", "SecurityError");
      }
      return nativeGet.call(this, key);
    };
    Storage.prototype.setItem = function (key: string, value: string) {
      if (this === localStorage) state.__dailySaveFault.writes.push({ key, value });
      nativeSet.call(this, key, value);
      if (this === localStorage && key === "coachfi-challenge" && state.__dailySaveFault.mode === "marker-after") {
        state.__dailySaveFault.mode = "none"; state.__dailySaveFault.triggered++;
        throw new DOMException("FIXTURE marker changed before exception", "QuotaExceededError");
      }
    };
  }, { locale, version: CONSENT_VERSION, malformedMarker });
}
const section = (page: Page) => page.locator('section[aria-labelledby="challenge-title"]');
const card = (page: Page) => section(page).getByTestId("daily-challenge-question");
async function arm(page: Page, mode: FaultMode) {
  await page.evaluate(mode => { const state = (window as FixtureWindow).__dailySaveFault; state.mode = mode; state.writes = []; state.triggered = 0; }, mode);
}
const state = (page: Page) => page.evaluate(() => ({ tokens: localStorage.getItem("coachfi-tokens"), marker: localStorage.getItem("coachfi-challenge"), fault: (window as FixtureWindow).__dailySaveFault }));
async function choose(page: Page, locale: Locale, id = daily.correctAnswer, keyboard = false) {
  const question = getQuestionById(daily.id, locale)!;
  await expect(card(page).getByText(question.question, { exact: true })).toBeVisible();
  const answer = card(page).getByRole("button", { name: new RegExp(`^${id}\\s*`) });
  await expect(answer).toHaveCount(1);
  if (keyboard) { await answer.focus(); await expect(answer).toBeFocused(); await page.keyboard.press("Space"); }
  else await answer.click();
  return card(page).getByRole("button", { name: translations[locale].challenge.answerButton, exact: true });
}
async function noSuccess(page: Page, locale: Locale) {
  await expect(section(page).getByText(translations[locale].challenge.completedTitle, { exact: true })).toHaveCount(0);
  await expect(section(page).getByTestId("daily-challenge-earned")).toHaveCount(0);
  await expect(section(page).getByText(translations[locale].challenge.correctBanner, { exact: true })).toHaveCount(0);
}
async function switchLocale(page: Page, previous: Locale, next: Locale) {
  await page.locator("header").getByRole("button", { name: `${previous === "pl" ? "Język" : "Language"}: ${localeLabels[previous]}`, exact: true }).click();
  await page.getByRole("option", { name: localeLabels[next], exact: true }).click();
}
test.beforeEach(async ({ context }) => {
  // Fresh synthetic guest contexts; abort all non-local browser requests.
  await context.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
});

for (const locale of ["pl", "en"] as const) {
  test(`${locale}: mobile keyboard wrong leaves bytes untouched; fresh view correct saves once`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); await seed(page, locale); await page.goto("/challenge"); await arm(page, "none");
    const wrong = daily.answers.find(answer => answer.id !== daily.correctAnswer)!.id;
    let submit = await choose(page, locale, wrong, true); await submit.focus(); await page.keyboard.press("Enter");
    await expect(section(page).getByText(translations[locale].challenge.wrongBanner, { exact: true })).toBeVisible(); await noSuccess(page, locale);
    expect(await state(page)).toMatchObject({ tokens: "125", marker: null });
    expect((await state(page)).fault.writes.filter(value => ["coachfi-tokens", "coachfi-challenge"].includes(value.key))).toHaveLength(0);
    // Current contract is bounded to one view; this reload is an explicit fresh synthetic view.
    await page.reload(); await arm(page, "none"); submit = await choose(page, locale, daily.correctAnswer, true); await submit.focus(); await page.keyboard.press("Enter");
    await expect(section(page).getByText(translations[locale].challenge.completedTitle, { exact: true })).toBeVisible();
    await expect(section(page).getByTestId("daily-challenge-earned")).toContainText(copy[locale].earned);
    await expect(section(page).getByTestId("daily-challenge-earned")).toContainText("+50");
    const saved = await state(page); expect(saved.tokens).toBe("175"); expect(JSON.parse(saved.marker!)).toEqual({ date: "2026-01-01" });
    expect(saved.fault.writes.filter(value => value.key === "coachfi-tokens")).toEqual([{ key: "coachfi-tokens", value: "175" }]);
    expect(saved.fault.writes.filter(value => value.key === "coachfi-challenge")).toHaveLength(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.reload(); await expect(section(page).getByText(translations[locale].challenge.completedTitle, { exact: true })).toBeVisible();
    expect(await state(page)).toMatchObject({ tokens: saved.tokens, marker: saved.marker }); await expect(section(page).getByTestId("daily-challenge-earned")).toHaveCount(0);
  });

  test(`${locale}: malformed marker blocks guessing; malformed points reject before writes after fixture-only repair`, async ({ page }) => {
    await seed(page, locale, true); await page.goto("/challenge");
    await expect(section(page).getByRole("alert").locator("p")).toHaveText(copy[locale].unavailable); await noSuccess(page, locale);
    for (const answer of await card(page).getByRole("button").all()) {
      if ((await answer.innerText()).match(/^[A-D]/)) await expect(answer).toBeDisabled();
    }
    await section(page).getByRole("button", { name: copy[locale].check, exact: true }).click();
    expect(await state(page)).toMatchObject({ tokens: "125", marker: "{broken" });
    // This repairs only fixture bytes. The app never repairs or overwrites malformed cache.
    await page.evaluate(() => { localStorage.removeItem("coachfi-challenge"); localStorage.setItem("coachfi-tokens", "25garbage"); });
    await section(page).getByRole("button", { name: copy[locale].check, exact: true }).click(); await arm(page, "none");
    let submit = await choose(page, locale); await submit.click(); await noSuccess(page, locale);
    await expect(section(page).getByRole("alert").locator("p")).toHaveText(copy[locale].retry);
    expect(await state(page)).toMatchObject({ tokens: "25garbage", marker: null });
    expect((await state(page)).fault.writes).toHaveLength(0); await expect(submit).toBeEnabled();
    await page.evaluate(() => localStorage.setItem("coachfi-tokens", "125")); await arm(page, "none"); await submit.click();
    await expect(section(page).getByText(translations[locale].challenge.completedTitle, { exact: true })).toBeVisible(); expect((await state(page)).tokens).toBe("175");
  });

  test(`${locale}: pre-writer read failure permits explicit retry without false success`, async ({ page }) => {
    await seed(page, locale); await page.goto("/challenge"); const submit = await choose(page, locale); await arm(page, "challenge-read"); await submit.click();
    await expect(section(page).getByRole("alert").locator("p")).toHaveText(copy[locale].retry); await noSuccess(page, locale); await expect(submit).toBeEnabled();
    expect(await state(page)).toMatchObject({ tokens: "125", marker: null, fault: { triggered: 1, writes: [] } });
    await submit.click(); await expect(section(page).getByRole("alert")).toHaveCount(0);
    await expect(section(page).getByText(translations[locale].challenge.completedTitle, { exact: true })).toBeVisible();
    const saved = await state(page); expect(saved.tokens).toBe("175"); expect(JSON.parse(saved.marker!)).toEqual({ date: "2026-01-01" });
    expect(saved.fault.writes.filter(value => value.key === "coachfi-tokens")).toHaveLength(1);
    expect(saved.fault.writes.filter(value => value.key === "coachfi-challenge")).toHaveLength(1);
  });

  test(`${locale}: marker write-then-throw quarantines across locale; fresh view reads persisted completion`, async ({ page }) => {
    await seed(page, locale); await page.goto("/challenge"); const submit = await choose(page, locale); await arm(page, "marker-after"); await submit.click();
    await expect(section(page).getByRole("alert").locator("p")).toHaveText(copy[locale].uncertain); await noSuccess(page, locale); await expect(submit).toBeDisabled();
    const partial = await state(page); expect(partial.tokens).toBe("175"); expect(JSON.parse(partial.marker!)).toEqual({ date: "2026-01-01" }); expect(partial.fault.triggered).toBe(1);
    expect(partial.fault.writes.filter(value => value.key === "coachfi-tokens")).toHaveLength(1); expect(partial.fault.writes.filter(value => value.key === "coachfi-challenge")).toHaveLength(1);
    const other = locale === "pl" ? "en" : "pl"; await switchLocale(page, locale, other);
    await expect(section(page).getByRole("alert").locator("p")).toHaveText(copy[other].uncertain); await noSuccess(page, other);
    const currentSubmit = card(page).getByRole("button", { name: translations[other].challenge.answerButton, exact: true }); await expect(currentSubmit).toBeDisabled();
    // Programmatic dispatch bypasses disabled native click but cannot bypass controller quarantine.
    await currentSubmit.evaluate(button => button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })));
    const after = await state(page); expect(after.tokens).toBe(partial.tokens); expect(after.marker).toBe(partial.marker);
    expect(after.fault.writes.filter(value => ["coachfi-tokens", "coachfi-challenge"].includes(value.key))).toEqual(partial.fault.writes.filter(value => ["coachfi-tokens", "coachfi-challenge"].includes(value.key)));
    await page.reload(); await expect(section(page).getByText(translations[other].challenge.completedTitle, { exact: true })).toBeVisible();
    expect(await state(page)).toMatchObject({ tokens: partial.tokens, marker: partial.marker }); await expect(section(page).getByTestId("daily-challenge-earned")).toHaveCount(0);
    await expect(section(page).getByRole("alert")).toHaveCount(0);
  });
}
