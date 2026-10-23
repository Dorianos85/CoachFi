import { expect, test, type Page } from "@playwright/test";
import { CONSENT_VERSION } from "../../lib/consent";
import { localeLabels } from "../../lib/i18n";
import { stageLessons } from "../../data/stageLessons";
import { moneyMindsetLesson } from "../../data/moneyMindsetLesson";

type Locale = "pl" | "en";
type Kind = "generic" | "mindset";
type FaultMode = "malformed" | "read-denial";
type Fault = { reads: number; writes: Array<{ key: string; value: string }>; raw(): string | null };
type FixtureWindow = typeof window & { __lessonStepIntegrity: Fault };
const KEY = "coachfi-lesson-steps";
const RAW = { malformed: '{"future-course":1}', "read-denial": '{"money-mindset":2,"saving-habit":3}' };
const FAILURE = {
  pl: "Nie udało się potwierdzić zapisu kroku lekcji. Przejście dalej jest zablokowane. Odśwież stronę, aby ponownie odczytać dane lokalne.",
  en: "The lesson step save could not be confirmed. Continuing is blocked. Reload the page to read the local data again.",
};
test.use({ timezoneId: "UTC" });
async function seed(page: Page, locale: Locale, mode: FaultMode) {
  await page.clock.setFixedTime(new Date("2026-01-01T12:00:00.000Z"));
  await page.addInitScript(({ locale, version, mode, raw }) => {
    if (!sessionStorage.getItem("FIXTURE_lesson_step_seeded")) {
      sessionStorage.setItem("FIXTURE_lesson_step_seeded", "true"); const now = new Date().toISOString();
      localStorage.setItem("coachfi-locale-v1", locale);
      localStorage.setItem("coachfi-user", JSON.stringify({ name: "FIXTURE_LESSON_STEP", goal: "education", setupDone: true }));
      localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 }));
      localStorage.setItem("coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now, termsAccepted: true, privacyAccepted: true,
        optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
      localStorage.setItem("coachfi-tokens", "125"); localStorage.setItem("coachfi-lesson-steps", raw);
    }
    const nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem;
    const fault: Fault = { reads: 0, writes: [], raw: () => nativeGet.call(localStorage, "coachfi-lesson-steps") };
    (window as FixtureWindow).__lessonStepIntegrity = fault;
    Storage.prototype.getItem = function (key: string) {
      if (this === localStorage && key === "coachfi-lesson-steps") {
        fault.reads++; if (mode === "read-denial") throw new DOMException("FIXTURE denied lesson-step read", "SecurityError");
      }
      return nativeGet.call(this, key);
    };
    Storage.prototype.setItem = function (key: string, value: string) {
      if (this === localStorage) fault.writes.push({ key, value }); nativeSet.call(this, key, value);
    };
  }, { locale, version: CONSENT_VERSION, mode, raw: RAW[mode] });
}
const route = (kind: Kind) => kind === "generic" ? "/learn/saving-habit" : "/learn/money-mindset";
const section = (page: Page, kind: Kind) => page.locator(kind === "generic" ? 'section[aria-labelledby="stage-lesson-title"]' : 'section[aria-labelledby="money-mindset-lesson-title"]');
const copy = (kind: Kind, locale: Locale) => kind === "generic" ? stageLessons["saving-habit"].copy[locale]! : moneyMindsetLesson[locale]!;
async function state(page: Page) {
  return page.evaluate(() => { const fault = (window as FixtureWindow).__lessonStepIntegrity; return { raw: fault.raw(), tokens: localStorage.getItem("coachfi-tokens"), reads: fault.reads,
    relevantWrites: fault.writes.filter(write => ["coachfi-lesson-steps", "coachfi-tokens"].includes(write.key)) }; });
}
async function switchLocale(page: Page, previous: Locale, next: Locale) {
  await page.locator("header").getByRole("button", { name: `${previous === "pl" ? "Język" : "Language"}: ${localeLabels[previous]}`, exact: true }).click();
  await page.getByRole("option", { name: localeLabels[next], exact: true }).click();
}
test.beforeEach(async ({ context }) => {
  // Only fresh synthetic local storage. No actual credentials, audio, providers or external browser traffic.
  await context.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
});
for (const locale of ["pl", "en"] as const) for (const kind of ["generic", "mindset"] as const) for (const mode of ["malformed", "read-denial"] as const) {
  test(`${locale} ${kind}: ${mode} preserves counters and locks navigation through locale and fresh view`, async ({ page }) => {
    await seed(page, locale, mode); await page.goto(route(kind));
    await expect(section(page, kind).getByRole("heading", { level: 2, name: copy(kind, locale).steps[0].title, exact: true })).toBeVisible();
    await expect(section(page, kind).getByRole("alert")).toHaveText(FAILURE[locale]);
    expect((await state(page)).reads).toBeGreaterThan(0);
    let next = section(page, kind).getByRole("button", { name: copy(kind, locale).next, exact: true }); await expect(next).toBeDisabled();
    expect(await state(page)).toMatchObject({ raw: RAW[mode], tokens: "125", relevantWrites: [] });
    await next.evaluate(button => button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })));
    await expect(section(page, kind).getByRole("heading", { level: 2, name: copy(kind, locale).steps[0].title, exact: true })).toBeVisible();
    expect(await state(page)).toMatchObject({ raw: RAW[mode], tokens: "125", relevantWrites: [] });
    const other = locale === "pl" ? "en" : "pl"; await switchLocale(page, locale, other);
    await expect(section(page, kind).getByRole("alert")).toHaveText(FAILURE[other]);
    next = section(page, kind).getByRole("button", { name: copy(kind, other).next, exact: true }); await expect(next).toBeDisabled();
    await next.evaluate(button => button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })));
    expect(await state(page)).toMatchObject({ raw: RAW[mode], tokens: "125", relevantWrites: [] });
    // No synthetic repair, product retry or migration: another view must still preserve invalid/unavailable bytes.
    await page.reload(); await expect(section(page, kind).getByRole("alert")).toHaveText(FAILURE[other]);
    await expect(section(page, kind).getByRole("button", { name: copy(kind, other).next, exact: true })).toBeDisabled();
    await expect(section(page, kind).getByRole("link", { name: copy(kind, other).quiz, exact: true })).toHaveCount(0);
    expect(await state(page)).toMatchObject({ raw: RAW[mode], tokens: "125", relevantWrites: [] });
  });
}
