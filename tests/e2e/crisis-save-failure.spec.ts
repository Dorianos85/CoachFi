import { expect, test, type Page } from "@playwright/test";
import { CONSENT_VERSION } from "../../lib/consent";
import { CRISIS_COPY } from "../../lib/crisisCopy";
import { localeLabels } from "../../lib/i18n";

type Locale = "pl" | "en";
type FaultMode = "none" | "actions-read" | "token-after";
type FaultState = { mode: FaultMode; triggered: number; writes: Array<{ key: string; value: string }> };
type FixtureWindow = typeof window & { __crisisSaveFault: FaultState };
const IDS = ["write-close-person", "call-creditor", "book-free-legal", "contact-mops", "sell-unused"] as const;
const KEY = "coachfi-crisis-actions";
const copy = {
  pl: { check: "Sprawdź odczyt ponownie", unavailable: "Nie można odczytać zapisanych działań. Nowe oznaczenia i punkty są zablokowane. Sprawdź odczyt ponownie.",
    retry: "Nie udało się zapisać działania. Nie przyznano nowych punktów. Możesz spróbować ponownie.",
    uncertain: "Nie udało się potwierdzić pełnego zapisu. Oznaczenie działania lub punkty mogły zostać zapisane częściowo. Nie ponawiaj tego działania. Pozostałe oznaczenia są zablokowane w tym widoku." },
  en: { check: "Check the data again", unavailable: "Saved actions could not be read. New action marks and points are blocked. Check the data again.",
    retry: "The action could not be saved. No new points were awarded. You can try again.",
    uncertain: "The full save could not be confirmed. The action mark or points may have been partially saved. Do not retry this action. Other action marks are blocked in this view." },
};
test.use({ timezoneId: "UTC" });
async function seed(page: Page, locale: Locale, malformed = false) {
  await page.clock.setFixedTime(new Date("2026-01-01T12:00:00.000Z"));
  await page.addInitScript(({ locale, version, malformed }) => {
    if (!sessionStorage.getItem("FIXTURE_crisis_save_seeded")) {
      sessionStorage.setItem("FIXTURE_crisis_save_seeded", "true"); const now = new Date().toISOString();
      localStorage.setItem("coachfi-locale-v1", locale);
      localStorage.setItem("coachfi-user", JSON.stringify({ name: "FIXTURE_CRISIS_SAVE", goal: "education", setupDone: true }));
      localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 }));
      localStorage.setItem("coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now, termsAccepted: true, privacyAccepted: true,
        optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
      localStorage.setItem("coachfi-tokens", "125"); if (malformed) localStorage.setItem("coachfi-crisis-actions", '["unknown"]');
    }
    const fixture = window as FixtureWindow; fixture.__crisisSaveFault = { mode: "none", triggered: 0, writes: [] };
    const nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key: string) {
      if (this === localStorage && key === "coachfi-crisis-actions" && fixture.__crisisSaveFault.mode === "actions-read") {
        fixture.__crisisSaveFault.mode = "none"; fixture.__crisisSaveFault.triggered++; throw new DOMException("FIXTURE read denial before mutation", "SecurityError");
      }
      return nativeGet.call(this, key);
    };
    Storage.prototype.setItem = function (key: string, value: string) {
      if (this === localStorage) fixture.__crisisSaveFault.writes.push({ key, value }); nativeSet.call(this, key, value);
      if (this === localStorage && key === "coachfi-tokens" && fixture.__crisisSaveFault.mode === "token-after") {
        fixture.__crisisSaveFault.mode = "none"; fixture.__crisisSaveFault.triggered++; throw new DOMException("FIXTURE reward changed before exception", "QuotaExceededError");
      }
    };
  }, { locale, version: CONSENT_VERSION, malformed });
}
const section = (page: Page) => page.locator('section[aria-labelledby="crisis-title"]');
const row = (page: Page, id: string) => section(page).getByTestId(`crisis-action-${id}`);
const action = (page: Page, id: string) => row(page, id).getByRole("button");
const state = (page: Page) => page.evaluate(() => ({ tokens: localStorage.getItem("coachfi-tokens"), actions: localStorage.getItem("coachfi-crisis-actions"), fault: (window as FixtureWindow).__crisisSaveFault }));
async function arm(page: Page, mode: FaultMode) { await page.evaluate(mode => { const fault = (window as FixtureWindow).__crisisSaveFault; fault.mode = mode; fault.triggered = 0; fault.writes = []; }, mode); }
async function assertBalance(page: Page, value: number) {
  const balance = section(page).getByTestId("crisis-balance").locator("p.text-4xl"); await expect(balance).toHaveCount(1); await expect(balance).toHaveText(String(value));
}
async function noDone(page: Page, locale: Locale) {
  for (const id of IDS) await expect(action(page, id)).not.toHaveText(CRISIS_COPY[locale]!.firstDay.done);
}
async function allLocked(page: Page) { for (const id of IDS) await expect(action(page, id)).toBeDisabled(); }
async function start(page: Page, locale: Locale, malformed = false) {
  await seed(page, locale, malformed); await page.goto("/crisis");
  for (const id of IDS) await expect(row(page, id)).toHaveCount(1);
}
async function switchLocale(page: Page, previous: Locale, next: Locale) {
  await page.locator("header").getByRole("button", { name: `${previous === "pl" ? "Język" : "Language"}: ${localeLabels[previous]}`, exact: true }).click();
  await page.getByRole("option", { name: localeLabels[next], exact: true }).click();
}
test.beforeEach(async ({ context }) => {
  // These tests only mark synthetic local data. They never activate help links, phone calls, copied letters or providers.
  await context.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
});
for (const locale of ["pl", "en"] as const) {
  test(`${locale}: mobile keyboard confirms two distinct actions once and reload retains both`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); await start(page, locale); await assertBalance(page, 125); await arm(page, "none");
    for (const id of IDS.slice(0, 2)) { const button = action(page, id); await expect(button).toBeEnabled(); await button.focus(); await expect(button).toBeFocused(); await page.keyboard.press("Space"); await expect(button).toHaveText(CRISIS_COPY[locale]!.firstDay.done); await expect(button).toBeDisabled(); }
    await assertBalance(page, 155); const saved = await state(page); expect(saved.tokens).toBe("155"); expect(JSON.parse(saved.actions!)).toEqual(IDS.slice(0, 2));
    expect(saved.fault.writes.filter(value => value.key === "coachfi-tokens")).toEqual([{ key: "coachfi-tokens", value: "140" }, { key: "coachfi-tokens", value: "155" }]);
    expect(saved.fault.writes.filter(value => value.key === KEY).map(value => JSON.parse(value.value))).toEqual([[IDS[0]], IDS.slice(0, 2)]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.reload(); await assertBalance(page, 155); expect(await state(page)).toMatchObject({ tokens: saved.tokens, actions: saved.actions });
    for (const id of IDS.slice(0, 2)) await expect(action(page, id)).toHaveText(CRISIS_COPY[locale]!.firstDay.done);
    await expect(action(page, IDS[2])).toBeEnabled(); await expect(section(page).getByRole("alert")).toHaveCount(0);
  });
  test(`${locale}: malformed actions block all marks; malformed points reject before writers after fixture-only repair`, async ({ page }) => {
    await start(page, locale, true); await expect(section(page).getByRole("alert")).toContainText(copy[locale].unavailable); await allLocked(page); await noDone(page, locale);
    await section(page).getByRole("button", { name: copy[locale].check, exact: true }).click(); expect(await state(page)).toMatchObject({ tokens: "125", actions: '["unknown"]' });
    // Only this synthetic fixture repairs its own bytes. The product never erases or normalizes unknown data.
    await page.evaluate(() => { localStorage.removeItem("coachfi-crisis-actions"); localStorage.setItem("coachfi-tokens", "25garbage"); });
    await section(page).getByRole("button", { name: copy[locale].check, exact: true }).click(); await arm(page, "none"); await action(page, IDS[0]).click();
    await expect(section(page).getByRole("alert")).toContainText(copy[locale].retry); await noDone(page, locale); expect(await state(page)).toMatchObject({ tokens: "25garbage", actions: null, fault: { writes: [] } });
    await expect(action(page, IDS[0])).toBeEnabled(); await page.evaluate(() => localStorage.setItem("coachfi-tokens", "125")); await arm(page, "none"); await action(page, IDS[0]).click();
    await expect(action(page, IDS[0])).toHaveText(CRISIS_COPY[locale]!.firstDay.done); await assertBalance(page, 140); expect(JSON.parse((await state(page)).actions!)).toEqual([IDS[0]]);
  });
  test(`${locale}: unavailable pre-writer read permits an explicit retry without false done`, async ({ page }) => {
    await start(page, locale); await arm(page, "actions-read"); await action(page, IDS[0]).click();
    await expect(section(page).getByRole("alert")).toContainText(copy[locale].retry); await noDone(page, locale); await expect(action(page, IDS[0])).toBeEnabled();
    expect(await state(page)).toMatchObject({ tokens: "125", actions: null, fault: { triggered: 1, writes: [] } }); await assertBalance(page, 125);
    await action(page, IDS[0]).click(); await expect(section(page).getByRole("alert")).toHaveCount(0); await expect(action(page, IDS[0])).toHaveText(CRISIS_COPY[locale]!.firstDay.done);
    const saved = await state(page); expect(saved.tokens).toBe("140"); expect(JSON.parse(saved.actions!)).toEqual([IDS[0]]); await assertBalance(page, 140);
    expect(saved.fault.writes.filter(value => value.key === "coachfi-tokens")).toHaveLength(1); expect(saved.fault.writes.filter(value => value.key === KEY)).toHaveLength(1);
  });
  test(`${locale}: reward write-then-throw quarantines all actions across language and fresh view reads remaining data`, async ({ page }) => {
    await start(page, locale); await arm(page, "token-after"); await action(page, IDS[0]).click();
    await expect(section(page).getByRole("alert")).toContainText(copy[locale].uncertain); await allLocked(page); await noDone(page, locale); await assertBalance(page, 140);
    const partial = await state(page); expect(partial.tokens).toBe("140"); expect(JSON.parse(partial.actions!)).toEqual([IDS[0]]); expect(partial.fault.triggered).toBe(1);
    expect(partial.fault.writes.filter(value => value.key === "coachfi-tokens")).toHaveLength(1); expect(partial.fault.writes.filter(value => value.key === KEY)).toHaveLength(1);
    const other = locale === "pl" ? "en" : "pl"; await switchLocale(page, locale, other); await expect(section(page).getByRole("alert")).toContainText(copy[other].uncertain); await allLocked(page); await noDone(page, other);
    for (const id of IDS) await action(page, id).evaluate(button => button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })));
    const after = await state(page); expect(after.tokens).toBe(partial.tokens); expect(after.actions).toBe(partial.actions);
    expect(after.fault.writes.filter(value => [KEY, "coachfi-tokens"].includes(value.key))).toEqual(partial.fault.writes.filter(value => [KEY, "coachfi-tokens"].includes(value.key)));
    // This is an explicit fresh view with a persisted known marker, not durable recovery or replay.
    await page.reload(); await assertBalance(page, 140); await expect(action(page, IDS[0])).toHaveText(CRISIS_COPY[other]!.firstDay.done); await expect(action(page, IDS[1])).toBeEnabled();
    expect(await state(page)).toMatchObject({ tokens: partial.tokens, actions: partial.actions }); await expect(section(page).getByRole("alert")).toHaveCount(0);
  });
}
