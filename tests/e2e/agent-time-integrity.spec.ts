import { expect, test, type Page } from "@playwright/test";
import { CONSENT_VERSION } from "../../lib/consent";
import { localeLabels, translations } from "../../lib/i18n";
import { getLocalizedContent } from "../../lib/localizedContent";

type Locale = "pl" | "en";
type Mode = "malformed" | "read-denial" | "pagehide-writer" | "healthy";
type Fault = { reads: number; deniedWrites: number; writeFault: boolean; writes: Array<{ key: string; value: string }>; raw(): string | null };
type FixtureWindow = typeof window & { __agentTimeIntegrity: Fault };
const KEY = "coachfi-agent-ms";
const WARNING = {
  pl: "Nie udało się potwierdzić naliczania czasu rozmowy. Licznik w tej rozmowie jest wstrzymany. Lokalne przykłady edukacyjne są nadal dostępne.",
  en: "Conversation time could not be confirmed. The timer is paused for this conversation. Local educational examples are still available.",
};
const chat = (page: Page) => page.locator('section[aria-labelledby="coach-title"]');
const messages = (page: Page) => chat(page).locator('[aria-label="Coach chat"]');
const input = (page: Page, locale: Locale) => chat(page).getByRole("textbox", { name: translations[locale].coach.placeholder, exact: true });

test.use({ timezoneId: "UTC" });
async function seed(page: Page, locale: Locale, mode: Mode) {
  await page.clock.install({ time: new Date("2026-01-01T12:00:00.000Z") });
  // Pause before navigation, with a future minute to avoid installation wall time races.
  await page.clock.pauseAt(new Date("2026-01-01T12:01:00.000Z"));
  await page.addInitScript(({ locale, version, mode }) => {
    if (!sessionStorage.getItem("FIXTURE_agent_time_seeded")) {
      sessionStorage.setItem("FIXTURE_agent_time_seeded", "true"); const now = new Date().toISOString();
      localStorage.setItem("coachfi-locale-v1", locale);
      localStorage.setItem("coachfi-user", JSON.stringify({ name: "FIXTURE_AGENT_TIME", goal: "education", setupDone: true }));
      localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 }));
      localStorage.setItem("coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now, termsAccepted: true, privacyAccepted: true,
        optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
      localStorage.setItem("coachfi-tokens", "125"); localStorage.setItem("coachfi-agent-ms", mode === "malformed" ? "bad-time" : "100");
    }
    const nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem;
    const fault: Fault = { reads: 0, deniedWrites: 0, writeFault: false, writes: [], raw: () => nativeGet.call(localStorage, "coachfi-agent-ms") };
    (window as FixtureWindow).__agentTimeIntegrity = fault;
    Storage.prototype.getItem = function (key: string) {
      if (this === localStorage && key === "coachfi-agent-ms") {
        fault.reads++; if (mode === "read-denial") throw new DOMException("FIXTURE denied duration read", "SecurityError");
      }
      return nativeGet.call(this, key);
    };
    Storage.prototype.setItem = function (key: string, value: string) {
      if (this === localStorage) fault.writes.push({ key, value });
      if (this === localStorage && key === "coachfi-agent-ms" && fault.writeFault) {
        fault.deniedWrites++; throw new DOMException("FIXTURE denied duration writer", "QuotaExceededError");
      }
      nativeSet.call(this, key, value);
    };
  }, { locale, version: CONSENT_VERSION, mode });
}
async function state(page: Page) {
  return page.evaluate(() => { const fault = (window as FixtureWindow).__agentTimeIntegrity; return { raw: fault.raw(), reads: fault.reads,
    tokens: localStorage.getItem("coachfi-tokens"), deniedWrites: fault.deniedWrites, relevantWrites: fault.writes.filter(write => ["coachfi-agent-ms", "coachfi-tokens"].includes(write.key)) }; });
}
async function send(page: Page, locale: Locale, text: string) {
  await input(page, locale).fill(text); await input(page, locale).press("Enter");
  await page.clock.runFor(15000);
  await expect(input(page, locale)).toBeEnabled(); await expect(messages(page).getByText(text, { exact: true })).toBeVisible();
}
async function switchLocale(page: Page, previous: Locale, next: Locale) {
  await page.locator("header").getByRole("button", { name: `${previous === "pl" ? "Język" : "Language"}: ${localeLabels[previous]}`, exact: true }).click();
  await page.clock.runFor(500); await page.getByRole("option", { name: localeLabels[next], exact: true }).click(); await page.clock.runFor(500);
}

test.beforeEach(async ({ context }) => {
  // Fresh synthetic guest only. Abort providers and the chat API even if a regression tries to call it.
  await context.route("**/*", route => {
    const url = new URL(route.request().url());
    return ["127.0.0.1", "localhost"].includes(url.hostname) && url.pathname !== "/api/chat" ? route.continue() : route.abort();
  });
});
for (const locale of ["pl", "en"] as const) for (const mode of ["malformed", "read-denial", "pagehide-writer", "healthy"] as const) {
  test(`${locale} ${mode}: local education remains available with honest duration outcome`, async ({ page, context }) => {
    const chatCalls: string[] = [];
    context.on("request", request => { if (new URL(request.url()).pathname === "/api/chat") chatCalls.push(request.url()); });
    if (mode === "healthy") await page.setViewportSize({ width: 375, height: 812 });
    await seed(page, locale, mode); await page.goto("/coach"); await page.clock.runFor(1000);
    await expect(chat(page).getByTestId("mila-provider-disabled")).toBeVisible(); await expect(input(page, locale)).toBeVisible();
    const start = await page.evaluate(() => Date.now()); await send(page, locale, "FIXTURE_FIRST_LOCAL_QUESTION");
    await expect(messages(page).getByText(getLocalizedContent(locale).coach.fallback, { exact: true })).toHaveCount(1);
    expect((await state(page)).reads).toBeGreaterThan(0);
    if (mode === "healthy") {
      await expect(chat(page).getByTestId("coach-time-warning")).toHaveCount(0);
      await send(page, locale, "FIXTURE_SECOND_LOCAL_QUESTION");
      await expect(messages(page).getByText(getLocalizedContent(locale).coach.fallback, { exact: true })).toHaveCount(2);
      const end = await page.evaluate(() => { window.dispatchEvent(new Event("pagehide")); return Date.now(); });
      expect(await state(page)).toMatchObject({ raw: String(100 + end - start), tokens: "125", deniedWrites: 0 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      await page.reload(); await page.clock.runFor(1000); await expect(chat(page).getByTestId("coach-time-warning")).toHaveCount(0);
      expect(await state(page)).toMatchObject({ raw: String(100 + end - start), tokens: "125", relevantWrites: [] });
    } else if (mode === "pagehide-writer") {
      await input(page, locale).fill("FIXTURE_RETAINED_DRAFT"); const previousMessages = await messages(page).textContent();
      await page.evaluate(() => { (window as FixtureWindow).__agentTimeIntegrity.writeFault = true; window.dispatchEvent(new Event("pagehide")); });
      await expect(chat(page).getByTestId("coach-time-warning")).toHaveText(WARNING[locale]);
      await expect(input(page, locale)).toHaveValue("FIXTURE_RETAINED_DRAFT"); expect(await messages(page).textContent()).toBe(previousMessages);
      expect(await state(page)).toMatchObject({ raw: "100", tokens: "125", deniedWrites: 1 });
      await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
      await send(page, locale, "FIXTURE_SECOND_LOCAL_QUESTION"); await expect(messages(page).getByText(getLocalizedContent(locale).coach.fallback, { exact: true })).toHaveCount(2);
      expect(await state(page)).toMatchObject({ raw: "100", tokens: "125", deniedWrites: 1 });
      const other = locale === "pl" ? "en" : "pl"; await switchLocale(page, locale, other);
      await expect(chat(page).getByTestId("coach-time-warning")).toHaveText(WARNING[other]);
      expect(await state(page)).toMatchObject({ raw: "100", tokens: "125", deniedWrites: 1 });
    } else {
      await expect(chat(page).getByTestId("coach-time-warning")).toHaveText(WARNING[locale]);
      expect(await state(page)).toMatchObject({ raw: mode === "malformed" ? "bad-time" : "100", tokens: "125", relevantWrites: [] });
      await input(page, locale).fill("FIXTURE_LOCALE_DRAFT"); const other = locale === "pl" ? "en" : "pl"; await switchLocale(page, locale, other);
      await expect(chat(page).getByTestId("coach-time-warning")).toHaveText(WARNING[other]); await expect(input(page, other)).toHaveValue("FIXTURE_LOCALE_DRAFT");
      await send(page, other, "FIXTURE_ANOTHER_LOCAL_QUESTION"); await expect(messages(page).getByText(getLocalizedContent(other).coach.fallback, { exact: true })).toHaveCount(1);
      expect(await state(page)).toMatchObject({ raw: mode === "malformed" ? "bad-time" : "100", tokens: "125", relevantWrites: [] });
    }
    expect(chatCalls).toEqual([]);
  });
}
