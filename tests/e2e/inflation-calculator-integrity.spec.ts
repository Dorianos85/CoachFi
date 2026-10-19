import { expect, test, type Page } from "@playwright/test";
import { CONSENT_VERSION } from "../../lib/consent";
import { localeLabels } from "../../lib/i18n";

type Locale = "pl" | "en";
type StorageProbe = { writes: Array<{ key: string; value: string }>; snapshot(): Record<string, string> };
type FixtureWindow = typeof window & { __inflationIntegrity: StorageProbe };
const FIELDS = ["amount", "years", "rate", "contribution", "return"] as const;
const area = (page: Page) => page.getByTestId("inflation-calculator");
const field = (page: Page, name: typeof FIELDS[number]) => area(page).getByTestId("inflation-input-" + name);
const money = (locale: Locale, value: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "PLN", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

test.use({ timezoneId: "UTC" });
async function seed(page: Page, locale: Locale) {
  await page.clock.setFixedTime(new Date("2026-01-01T12:00:00.000Z"));
  await page.addInitScript(({ locale, version }) => {
    if (!sessionStorage.getItem("FIXTURE_inflation_seeded")) {
      sessionStorage.setItem("FIXTURE_inflation_seeded", "true"); const now = new Date().toISOString();
      localStorage.setItem("coachfi-locale-v1", locale);
      localStorage.setItem("coachfi-user", JSON.stringify({ name: "FIXTURE_INFLATION", goal: "education", setupDone: true }));
      localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 }));
      localStorage.setItem("coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now, termsAccepted: true, privacyAccepted: true,
        optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
      localStorage.setItem("coachfi-tokens", "125"); localStorage.setItem("coachfi-agent-ms", "100");
      localStorage.setItem("coachfi-lesson-steps", '{"saving-habit":1}');
    }
    const nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem;
    const probe: StorageProbe = { writes: [], snapshot: () => Object.fromEntries(Object.keys(localStorage).map(key => [key, nativeGet.call(localStorage, key)!])) };
    (window as FixtureWindow).__inflationIntegrity = probe;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (this === localStorage) probe.writes.push({ key, value }); nativeSet.call(this, key, value);
    };
  }, { locale, version: CONSENT_VERSION });
}
async function checkpoint(page: Page) {
  return page.evaluate(() => { const probe = (window as FixtureWindow).__inflationIntegrity; probe.writes.length = 0; return probe.snapshot(); });
}
async function assertStorage(page: Page, before: Record<string, string>, changedLocale?: Locale) {
  const actual = await page.evaluate(() => { const probe = (window as FixtureWindow).__inflationIntegrity; return { values: probe.snapshot(), writes: probe.writes }; });
  expect(actual.values).toEqual(changedLocale ? { ...before, "coachfi-locale-v1": changedLocale } : before);
  expect(actual.writes.filter(write => !changedLocale || write.key !== "coachfi-locale-v1")).toEqual([]);
}
async function assertReloadInitialization(page: Page, before: Record<string, string>) {
  const actual = await page.evaluate(() => { const probe = (window as FixtureWindow).__inflationIntegrity; return { values: probe.snapshot(), writes: probe.writes }; });
  expect(actual.values).toEqual(before); // Every durable byte and key still matches the pre-reload snapshot.
  const accessibilityKey = "coachfi-accessibility-v1";
  expect(before[accessibilityKey]).toBe('{"highContrast":false,"textScale":"normal"}');
  expect(actual.writes).toHaveLength(2);
  expect(actual.writes.filter(write => write.key === accessibilityKey)).toEqual([{ key: accessibilityKey, value: before[accessibilityKey] }]);
  const probes = actual.writes.filter(write => write.key.startsWith("lswt-")); expect(probes).toHaveLength(1);
  const probe = probes[0]; expect(probe.value).toBe(probe.key);
  // Existing auth-js support check concatenates exactly two Math.random() number strings.
  const randomParts = /^lswt-(0(?:\.[0-9]+)?|[1-9](?:\.[0-9]+)?e-[1-9][0-9]*)(0(?:\.[0-9]+)?|[1-9](?:\.[0-9]+)?e-[1-9][0-9]*)$/.exec(probe.key);
  expect(randomParts).not.toBeNull();
  for (const part of [randomParts![1], randomParts![2]]) { expect(Number(part)).toBeGreaterThanOrEqual(0); expect(Number(part)).toBeLessThan(1); expect(String(Number(part))).toBe(part); }
  expect(Object.hasOwn(actual.values, probe.key)).toBe(false); expect(Object.hasOwn(before, probe.key)).toBe(false);
  // Exactly two writes with one of each allowed class above rejects every other write, without broad ignores.
}
async function setInputs(page: Page, values: readonly string[]) {
  expect(values).toHaveLength(5); for (const [index, name] of FIELDS.entries()) await field(page, name).fill(values[index]);
}
async function assertSuppressed(page: Page) {
  await expect(area(page).getByRole("alert")).toHaveCount(1); await expect(area(page).getByTestId("inflation-error")).toBeVisible();
  for (const id of ["inflation-results", "inflation-chart", "inflation-summary"]) await expect(area(page).getByTestId(id)).toHaveCount(0);
  // The current calculator has only speech buttons, including the SectionHeader reader.
  await expect(area(page).getByRole("button")).toHaveCount(0);
}
async function assertTable(page: Page, locale: Locale, values: readonly number[]) {
  const table = area(page).getByTestId("inflation-summary"); await expect(table).toBeVisible();
  await expect(table.locator("thead th")).toHaveCount(2); await expect(table.locator("tbody th[scope=row]")).toHaveCount(3);
  const cells = table.locator("tbody td"); await expect(cells).toHaveCount(3);
  for (const [index, value] of values.entries()) await expect(cells.nth(index)).toHaveText(money(locale, value));
  await expect(area(page).getByTestId("inflation-real-value")).toHaveText(money(locale, values[0]));
}
async function switchLocale(page: Page, previous: Locale, next: Locale) {
  await page.locator("header").getByRole("button", { name: `${previous === "pl" ? "Język" : "Language"}: ${localeLabels[previous]}`, exact: true }).click();
  await page.getByRole("option", { name: localeLabels[next], exact: true }).click(); await expect(page.locator("html")).toHaveAttribute("lang", next);
}

test.beforeEach(async ({ context }) => {
  // Fresh synthetic guest, local calculator only; never invoke providers, real audio or API endpoints.
  await context.route("**/*", route => { const url = new URL(route.request().url());
    return ["127.0.0.1", "localhost"].includes(url.hostname) && !url.pathname.startsWith("/api/") ? route.continue() : route.abort(); });
});
for (const locale of ["pl", "en"] as const) for (const mode of ["mobile-equal-contributions", "invalid-restore", "nominal-loss", "overflow-locale"] as const) {
  test(`${locale} ${mode}: transparent calculator values and no financial-state mutation`, async ({ page, context }) => {
    const apiCalls: string[] = []; context.on("request", request => { if (new URL(request.url()).pathname.startsWith("/api/")) apiCalls.push(request.url()); });
    if (mode === "mobile-equal-contributions") await page.setViewportSize({ width: 375, height: 812 });
    await seed(page, locale); await page.goto("/inflation"); await expect(area(page).getByTestId("inflation-summary")).toBeVisible();
    const initialChart = area(page).getByTestId("inflation-chart");
    const mainSurface = initialChart.locator(".recharts-wrapper > svg.recharts-surface");
    await expect(mainSurface).toHaveCount(1); await expect(mainSurface).toBeVisible();
    const initialCurves = initialChart.locator(".recharts-line-curve"); await expect(initialCurves).toHaveCount(3);
    for (let index = 0; index < 3; index++) await expect(initialCurves.nth(index)).toHaveAttribute("d", /\S/);
    const before = await checkpoint(page); await expect(field(page, "contribution")).toHaveValue("2400"); await expect(field(page, "return")).toHaveValue("5.5");
    await expect(area(page).getByTestId("inflation-active-assumptions")).toContainText(money(locale, 2400));
    if (mode === "mobile-equal-contributions") {
      // Keyboard Tab traverses the five explicitly labelled input fields in their visual order.
      await field(page, "amount").focus(); await page.keyboard.press("ControlOrMeta+A"); await page.keyboard.type("1000"); await page.keyboard.press("Tab"); await expect(field(page, "years")).toBeFocused();
      for (const [index, raw] of ["2", "10", "100", "10"].entries()) {
        const input = field(page, FIELDS[index + 1]); await expect(input).toBeFocused(); await page.keyboard.press("ControlOrMeta+A"); await page.keyboard.type(raw); if (index < 3) await page.keyboard.press("Tab");
      }
      // Independent hand recurrence: nominal balances1000→1200→1420; inflation1.21.
      await assertTable(page, locale, [100000 / 121, 120000 / 121, 142000 / 121]);
      await expect(area(page).getByTestId("inflation-change")).toHaveText(money(locale, 100000 / 121 - 1000));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      await assertStorage(page, before); await page.reload(); await expect(field(page, "amount")).toHaveValue("20000"); await expect(field(page, "contribution")).toHaveValue("2400");
      await expect(area(page).getByTestId("inflation-summary")).toBeVisible(); await assertReloadInitialization(page, before);
      const reloaded = await checkpoint(page); expect(reloaded).toEqual(before); // Reset only after all initializer bytes/writes were checked.
      await field(page, "amount").fill("1000.5"); await expect(field(page, "amount")).toHaveValue("1000.5");
      await expect(area(page).getByTestId("inflation-real-value")).toHaveText(money(locale, 1000.5 / (1.07 ** 5)));
      await assertStorage(page, before);
    } else if (mode === "invalid-restore") {
      for (const [name, invalid, valid] of [["amount", "", "20000"], ["years", "5.5", "5"], ["amount", "1,000.00", "20000"], ["contribution", "-1", "2400"], ["return", "1e2", "5.5"]] as const) {
        await field(page, name).fill(invalid); await expect(field(page, name)).toHaveValue(invalid); await expect(field(page, name)).toHaveAttribute("aria-invalid", "true"); await assertSuppressed(page);
        await field(page, name).fill(valid); await expect(area(page).getByRole("alert")).toHaveCount(0); await expect(area(page).getByTestId("inflation-summary")).toBeVisible();
      }
      await setInputs(page, ["1000,5", "1", "0", "0", "0"]); await assertTable(page, locale, [1000.5, 1000.5, 1000.5]); await assertStorage(page, before);
    } else if (mode === "nominal-loss") {
      await setInputs(page, ["1000", "2", "0", "0", "-50"]); await assertTable(page, locale, [1000, 1000, 250]);
      await expect(area(page).getByTestId("inflation-change")).toHaveText(money(locale, 0));
      await field(page, "rate").fill("-10"); await assertTable(page, locale, [100000 / 81, 100000 / 81, 25000 / 81]);
      await expect(area(page).getByTestId("inflation-change")).toHaveText(money(locale, 100000 / 81 - 1000)); await assertStorage(page, before);
    } else {
      await setInputs(page, ["1000000000000", "2", "0", "0", "100"]); await assertSuppressed(page);
      const previousAlert = await area(page).getByRole("alert").textContent(); const next = locale === "pl" ? "en" : "pl"; await switchLocale(page, locale, next);
      await assertSuppressed(page); expect(await area(page).getByRole("alert").textContent()).not.toBe(previousAlert);
      for (const [index, name] of FIELDS.entries()) await expect(field(page, name)).toHaveValue(["1000000000000", "2", "0", "0", "100"][index]);
      await field(page, "amount").fill("1000"); await assertTable(page, next, [1000, 1000, 4000]); await assertStorage(page, before, next);
    }
    expect(apiCalls).toEqual([]);
  });
}
