import { expect, test, type Locator, type Page } from "@playwright/test";
import { PERSONAL_STORAGE_KEYS } from "../../lib/product-storage";

type Locale = "pl" | "en";
type Write = { area: "local" | "session"; kind: "set" | "remove" | "clear"; key: string; value?: string };
type Probe = { writes: Write[]; snapshot(): Record<string, string | null> };
type FixtureWindow = typeof window & { __adultFamilyQA: Probe };
const COPY = {
  pl: { start: "Zacznij dla siebie", consents: "Zgody", required: "Akceptuj wymagane", age: "Mam ukończone 18 lat.",
    enter: "Kontynuuj jako osoba dorosła", nav: "Ścieżki nauki", adultNav: "Dla dorosłych", familyNav: "Dla rodziny",
    adultRead: "Przeczytałem lekcję", adultPlan: "Wybieram ten plan", familyGoal: /^Potrzeba czy zachcianka\?/,
    familyOther: /^Wspólny mały cel/, familyRead: "Oznaczam materiał jako przeczytany", familySubmit: "Sprawdź odpowiedź",
    familyPlan: "Wybieram ten plan na później", familyProgress: "Postęp ścieżki rodzinnej" },
  en: { start: "Start for yourself", consents: "Consents", required: "Accept required", age: "I am at least 18 years old.",
    enter: "Continue as an adult", nav: "Learning paths", adultNav: "For adults", familyNav: "For families",
    adultRead: "I have read the lesson", adultPlan: "Choose this plan", familyGoal: /^Need or want\?/,
    familyOther: /^A small shared goal/, familyRead: "I mark this material as read", familySubmit: "Check answer",
    familyPlan: "I choose this plan for later", familyProgress: "Family path progress" },
};

async function prepare(page: Page, locale: Locale) {
  await page.clock.setFixedTime(new Date("2026-10-20T12:00:00.000Z"));
  await page.addInitScript(({ locale, keys }) => {
    const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
    const remove = Storage.prototype.removeItem, clear = Storage.prototype.clear;
    const marker = "FIXTURE_ADULT_FAMILY_SEEDED", journal = "FIXTURE_ADULT_FAMILY_WRITES";
    if (!get.call(sessionStorage, marker)) {
      set.call(sessionStorage, marker, "true");
      set.call(localStorage, "coachfi-locale-v1", locale);
      set.call(sessionStorage, journal, "[]");
    }
    const probe: Probe = { writes: JSON.parse(get.call(sessionStorage, journal) || "[]"),
      snapshot: () => Object.fromEntries(keys.flatMap(key => [[`local:${key}`, get.call(localStorage, key)], [`session:${key}`, get.call(sessionStorage, key)]])) };
    (window as FixtureWindow).__adultFamilyQA = probe;
    const record = (storage: Storage, item: Omit<Write, "area">) => {
      probe.writes.push({ area: storage === localStorage ? "local" : "session", ...item });
      set.call(sessionStorage, journal, JSON.stringify(probe.writes));
    };
    Storage.prototype.setItem = function (key: string, value: string) {
      record(this, { kind: "set", key: String(key), value: String(value) }); set.call(this, key, value);
    };
    Storage.prototype.removeItem = function (key: string) { record(this, { kind: "remove", key: String(key) }); remove.call(this, key); };
    Storage.prototype.clear = function () { record(this, { kind: "clear", key: "*" }); clear.call(this); };
  }, { locale, keys: [...PERSONAL_STORAGE_KEYS] });
}
async function snapshot(page: Page) {
  return page.evaluate(() => {
    const probe = (window as FixtureWindow).__adultFamilyQA;
    return { raw: probe.snapshot(), writes: [...probe.writes] };
  });
}
async function fits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
}
async function progress(locator: Locator, count: number) { await expect(locator).toHaveAttribute("value", String(count)); }
async function keyboardActivate(locator: Locator, key = "Space") {
  await locator.focus(); await expect(locator).toBeFocused(); await locator.press(key);
}
async function switchPath(page: Page, locale: Locale, segment: "adult" | "family") {
  await page.getByRole("navigation", { name: COPY[locale].nav, exact: true })
    .getByRole("link", { name: COPY[locale][segment === "adult" ? "adultNav" : "familyNav"], exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${segment}$`));
}

for (const locale of ["pl", "en"] as const) test(`${locale}: real mobile routes keep two RAM paths isolated and preserve privacy boundaries`, async ({ page, context }, testInfo) => {
  const copy = COPY[locale], api: string[] = [], external: string[] = [], pageErrors: string[] = [];
  const origin = new URL(testInfo.project.use.baseURL as string).origin;
  context.on("request", request => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/")) api.push(url.pathname);
    if (url.origin !== origin) external.push(url.origin + url.pathname);
  });
  page.on("pageerror", error => pageErrors.push(error.message));
  await context.route("**/*", route => {
    const url = new URL(route.request().url());
    return url.origin === origin && !url.pathname.startsWith("/api/") ? route.continue() : route.abort();
  });
  await page.setViewportSize({ width: 375, height: 812 }); await prepare(page, locale);
  const observed: Record<string, unknown> = {};
  try {
    await page.goto("/"); await expect(page.getByTestId("audience-home")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("link", { name: copy.start, exact: true })).toBeVisible();
    expect(Object.values((await snapshot(page)).raw).every(value => value === null)).toBe(true);
    const consents = page.getByRole("button", { name: copy.consents, exact: true });
    await keyboardActivate(consents, "Enter");
    const consentDialog = page.getByRole("dialog"); await expect(consentDialog).toBeVisible();
    await expect(consentDialog.locator('button[aria-pressed="false"]')).toHaveCount(4);
    await page.keyboard.press("Escape"); await expect(consentDialog).toHaveCount(0); await expect(consents).toBeFocused();
    await fits(page); await page.screenshot({ path: testInfo.outputPath("home-mobile.png"), fullPage: true });

    await keyboardActivate(page.getByRole("link", { name: copy.start, exact: true }), "Enter");
    await expect(page).toHaveURL(/\/adult$/);
    const adult = page.getByTestId("adult-path"), adultProgress = adult.locator("progress");
    await progress(adultProgress, 0);
    await expect(adult.locator('input[name="adult-goal"]').first()).toBeDisabled();
    await page.getByRole("button", { name: copy.required, exact: true }).click();
    const ageDialog = page.getByRole("dialog"); await expect(ageDialog).toBeVisible();
    await ageDialog.getByRole("checkbox", { name: copy.age, exact: true }).check();
    await keyboardActivate(ageDialog.getByRole("button", { name: copy.enter, exact: true }), "Enter");
    await expect(page.getByRole("dialog")).toHaveCount(0); await expect(page).toHaveURL(/\/adult$/);
    await expect(page.locator("footer").getByRole("button", { name: locale === "pl" ? "Potwierdzenie wieku 18+" : "Age confirmation 18+", exact: true })).toBeFocused();
    const baseline = await snapshot(page); observed.afterExplicitConsentAndAge = baseline;
    const consent = JSON.parse(baseline.raw["local:coachfi-consent-v1"]!);
    expect(consent.optional).toEqual({ aiCoach: false, voice: false, leaderboard: false, blockchain: false });
    expect(JSON.parse(baseline.raw["local:coachfi-mode-v1"]!).mode).toBe("adult");
    await expect(adult.locator('input[name="adult-answer"]')).toHaveCount(0);
    await keyboardActivate(adult.locator('input[name="adult-goal"][value="budget"]'));
    await progress(adultProgress, 1); await expect(adult.locator('input[name="adult-answer"]')).toHaveCount(0);
    await keyboardActivate(adult.getByRole("button", { name: copy.adultRead, exact: true }), "Enter");
    await progress(adultProgress, 2);
    await keyboardActivate(adult.locator('input[name="adult-answer"][value="a"]'));
    await progress(adultProgress, 2); await expect(adult.getByRole("button", { name: copy.adultPlan, exact: true })).toHaveCount(0);
    await keyboardActivate(adult.locator('input[name="adult-answer"][value="b"]'));
    await progress(adultProgress, 3); await keyboardActivate(adult.getByRole("button", { name: copy.adultPlan, exact: true }), "Enter");
    await progress(adultProgress, 4); await fits(page);
    await page.screenshot({ path: testInfo.outputPath("adult-complete-mobile.png"), fullPage: true });

    await switchPath(page, locale, "family");
    const family = page.locator('[data-learning-path="family"]'), familyProgress = family.locator("progress");
    await expect(family).toBeVisible(); await progress(familyProgress, 0);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator('a[href="/health-check"], a[href="/coach"], a[href="/adult/dashboard"]')).toHaveCount(0);
    await expect(family.locator('input:not([type="radio"]), textarea, select')).toHaveCount(0);
    await keyboardActivate(family.getByRole("button", { name: copy.familyGoal }), "Enter");
    await progress(familyProgress, 1); await expect(family.locator('input[name="family-answer"]')).toHaveCount(0);
    await keyboardActivate(family.getByRole("button", { name: copy.familyRead, exact: true }), "Enter");
    await progress(familyProgress, 2); await family.locator('input[name="family-answer"][value="a"]').check();
    await keyboardActivate(family.getByRole("button", { name: copy.familySubmit, exact: true }), "Enter");
    await progress(familyProgress, 2); await expect(family.getByRole("button", { name: copy.familyPlan, exact: true })).toHaveCount(0);
    await family.locator('input[name="family-answer"][value="b"]').check();
    await keyboardActivate(family.getByRole("button", { name: copy.familySubmit, exact: true }), "Enter");
    await progress(familyProgress, 3); await keyboardActivate(family.getByRole("button", { name: copy.familyPlan, exact: true }), "Enter");
    await progress(familyProgress, 4); await fits(page);
    await page.screenshot({ path: testInfo.outputPath("family-complete-mobile.png"), fullPage: true });
    await switchPath(page, locale, "adult"); await progress(page.getByTestId("adult-path").locator("progress"), 4);
    await keyboardActivate(page.locator('input[name="adult-goal"][value="reserve"]'));
    await progress(page.getByTestId("adult-path").locator("progress"), 1);
    await switchPath(page, locale, "family"); await progress(page.locator('[data-learning-path="family"] progress'), 4);
    await keyboardActivate(page.locator('[data-learning-path="family"]').getByRole("button", { name: copy.familyOther }), "Enter");
    await progress(page.locator('[data-learning-path="family"] progress'), 1);
    await switchPath(page, locale, "adult"); await progress(page.getByTestId("adult-path").locator("progress"), 1);
    await page.reload(); await progress(page.getByTestId("adult-path").locator("progress"), 0);
    await switchPath(page, locale, "family"); await progress(page.locator('[data-learning-path="family"] progress'), 0);
    const final = await snapshot(page); observed.final = final;
    expect(final.raw).toEqual(baseline.raw);
    expect(final.writes.slice(baseline.writes.length).filter(write => write.kind === "clear" || PERSONAL_STORAGE_KEYS.includes(write.key as typeof PERSONAL_STORAGE_KEYS[number]))).toEqual([]);
    await page.setViewportSize({ width: 1280, height: 900 }); await fits(page);
    await page.screenshot({ path: testInfo.outputPath("family-desktop.png"), fullPage: true });
    expect(api).toEqual([]); expect(external).toEqual([]); expect(pageErrors).toEqual([]);
  } finally {
    await testInfo.attach("bounded-observations", { body: JSON.stringify({ locale, api, external, pageErrors, observed,
      limitations: "Fresh synthetic Chrome context. Actual Next UI; two languages; mobile375 and finaldesktop1280; selected native keyboard activation and consent Escape/focus only. Same-origin non-API assets allowed. No real account, child data, provider call, speech, screenreader, fullWCAG or production acceptance." }, null, 2), contentType: "application/json" });
  }
});

for (const locale of ["pl", "en"] as const) test(`${locale}: direct family entry requires explicit adult-led privacy readiness`, async ({ page, context }, testInfo) => {
  const api: string[] = [], external: string[] = [], pageErrors: string[] = [];
  const origin = new URL(testInfo.project.use.baseURL as string).origin;
  context.on("request", request => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/")) api.push(url.pathname);
    if (url.origin !== origin) external.push(url.origin + url.pathname);
  });
  page.on("pageerror", error => pageErrors.push(error.message));
  await context.route("**/*", route => {
    const url = new URL(route.request().url());
    return url.origin === origin && !url.pathname.startsWith("/api/") ? route.continue() : route.abort();
  });
  await page.setViewportSize({ width: 375, height: 812 }); await prepare(page, locale);
  try {
    await page.goto("/family"); const family = page.locator('[data-learning-path="family"]');
    await expect(family).toBeVisible(); await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(family.getByRole("button", { name: COPY[locale].familyGoal })).toBeDisabled();
    await progress(family.locator("progress"), 0);
    expect(Object.values((await snapshot(page)).raw).every(value => value === null)).toBe(true);
    await expect(family.locator("input, textarea, select")).toHaveCount(0);
    await fits(page); await page.screenshot({ path: testInfo.outputPath("family-direct-before-consent.png"), fullPage: true });
    await page.getByRole("button", { name: COPY[locale].required, exact: true }).click();
    const dialog = page.getByRole("dialog"); await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(locale === "pl" ? "rodzic lub opiekun" : "parent or guardian");
    const confirm = locale === "pl" ? "Mam ukończone 18 lat i prowadzę wspólną aktywność." : "I am at least 18 and will lead the shared activity.";
    const enter = locale === "pl" ? "Kontynuuj jako dorosły prowadzący" : "Continue as the adult leading";
    await expect(dialog.getByRole("button", { name: enter, exact: true })).toBeDisabled();
    await dialog.getByRole("checkbox", { name: confirm, exact: true }).check();
    await keyboardActivate(dialog.getByRole("button", { name: enter, exact: true }), "Enter");
    await expect(page.getByRole("dialog")).toHaveCount(0); await expect(page).toHaveURL(/\/family$/);
    await expect(page.locator("footer").getByRole("button", { name: locale === "pl" ? "Potwierdzenie wieku 18+" : "Age confirmation 18+", exact: true })).toBeFocused();
    await keyboardActivate(family.getByRole("button", { name: COPY[locale].familyGoal }), "Enter");
    await progress(family.locator("progress"), 1);
    const raw = (await snapshot(page)).raw;
    expect(JSON.parse(raw["local:coachfi-consent-v1"]!).optional).toEqual({ aiCoach: false, voice: false, leaderboard: false, blockchain: false });
    expect(JSON.parse(raw["local:coachfi-mode-v1"]!).mode).toBe("adult");
    expect(raw["local:coachfi-user"]).toBeNull();
    expect(api).toEqual([]); expect(external).toEqual([]); expect(pageErrors).toEqual([]);
  } finally {
    await testInfo.attach("direct-family-observations", { body: JSON.stringify({ locale, api, external, pageErrors, storage: await snapshot(page),
      limitations: "Fresh synthetic Chrome context, direct family route, mobile375, explicit native consent and adult-led self-declaration. No verified age, child identity, real account, provider or production acceptance." }, null, 2), contentType: "application/json" });
  }
});
