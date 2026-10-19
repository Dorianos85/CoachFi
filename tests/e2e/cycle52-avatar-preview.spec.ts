import { expect, test, type Page } from "@playwright/test";
import { CONSENT_VERSION } from "../../lib/consent";

type Locale = "pl" | "en";
const KEYS = ["coachfi-avatar", "coachfi-user", "coachfi-srs", "coachfi-tokens", "coachfi-lesson-steps", "coachfi-streak", "coachfi-learn-manual"] as const;
type Snapshot = Record<(typeof KEYS)[number], string | null>;
type Area = "local" | "session";
type Probe = { reads: Record<Area, Record<string, number>>; writes: Array<{ area: Area; key: string; value?: string; removed?: true }>; snapshot(): Record<Area, Snapshot> };
type FixtureWindow = typeof window & { __c52Avatar: Probe };
const PROFILE = '{"name":"FIXTURE_C52","goal":"education","setupDone":true}';
const CASES = [
  { mode: "healthy", raw: '{"gender":"male","style":"builder","future":{"kept":true}}', gender: "male", style: "builder" },
] as const;
const COPY = {
  pl: { caption: "Podgląd wyglądu", title: "Twój finansowy avatar", warrior: "Wojownik", builder: "Budowniczy", explorer: "Badacz", save: "Zapisz avatar" },
  en: { caption: "Appearance preview", title: "Your Financial Avatar", warrior: "Warrior", builder: "Builder", explorer: "Explorer", save: "Save avatar" },
};
const section = (page: Page) => page.locator('section[aria-labelledby="avatar-title"]');
const preview = (page: Page) => section(page).locator("p.uppercase.tracking-widest");
test.use({ timezoneId: "UTC" });

async function seed(page: Page, locale: Locale, rawAvatar: string) {
  await page.clock.setFixedTime(new Date("2026-01-01T12:00:00.000Z"));
  await page.addInitScript(({ locale, version, keys, rawAvatar, profile }) => {
    if (!sessionStorage.getItem("FIXTURE_C52_AVATAR_SEEDED")) {
      sessionStorage.setItem("FIXTURE_C52_AVATAR_SEEDED", "true");
      const now = new Date().toISOString();
      localStorage.setItem("coachfi-locale-v1", locale); localStorage.setItem("coachfi-user", profile);
      localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 }));
      localStorage.setItem("coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now, termsAccepted: true, privacyAccepted: true,
        optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
      localStorage.setItem("coachfi-avatar", rawAvatar);
      sessionStorage.setItem("coachfi-avatar", '{"gender":"male","style":"explorer"}');
      localStorage.setItem("coachfi-tokens", "125"); localStorage.setItem("coachfi-srs", "[]");
      localStorage.setItem("coachfi-lesson-steps", '{"retirement":2}');
      localStorage.setItem("coachfi-streak", '{"lastActiveDate":"2026-01-01","currentStreak":1,"longestStreak":1}');
    }
    const nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem, nativeRemove = Storage.prototype.removeItem;
    const probe: Probe = { reads: { local: {}, session: {} }, writes: [], snapshot: () => ({
      local: Object.fromEntries(keys.map(key => [key, nativeGet.call(localStorage, key)])) as Snapshot,
      session: Object.fromEntries(keys.map(key => [key, nativeGet.call(sessionStorage, key)])) as Snapshot,
    }) };
    (window as FixtureWindow).__c52Avatar = probe;
    Storage.prototype.getItem = function (key: string) {
      const area = this === localStorage ? "local" : this === sessionStorage ? "session" : null;
      if (area && keys.includes(key as typeof keys[number])) probe.reads[area][key] = (probe.reads[area][key] ?? 0) + 1;
      return nativeGet.call(this, key);
    };
    Storage.prototype.setItem = function (key: string, value: string) {
      const area = this === localStorage ? "local" : this === sessionStorage ? "session" : null;
      if (area && keys.includes(key as typeof keys[number])) probe.writes.push({ area, key, value });
      return nativeSet.call(this, key, value);
    };
    Storage.prototype.removeItem = function (key: string) {
      const area = this === localStorage ? "local" : this === sessionStorage ? "session" : null;
      if (area && keys.includes(key as typeof keys[number])) probe.writes.push({ area, key, removed: true });
      return nativeRemove.call(this, key);
    };
  }, { locale, version: CONSENT_VERSION, keys: KEYS, rawAvatar, profile: PROFILE });
}
async function state(page: Page) {
  return page.evaluate(() => {
    const p = (window as FixtureWindow).__c52Avatar;
    const section = document.querySelector('section[aria-labelledby="avatar-title"]');
    return { snapshot: p.snapshot(), reads: p.reads, writes: [...p.writes], appearanceText: section?.textContent ?? null,
      caption: section?.querySelector("p.mb-4.text-sm.font-black.text-text")?.textContent ?? null };
  });
}
async function assertAppearance(page: Page, locale: Locale) {
  await expect(section(page)).not.toContainText(/\b(?:67|40|80)\s*%|\b62\s*\/\s*100\b/);
  for (const label of ["Saving", "Investing", "Credit", "Financial Shield"]) await expect(section(page).getByText(label, { exact: true })).toHaveCount(0);
  await expect(section(page).locator("p.mb-4.text-sm.font-black.text-text")).toHaveText(COPY[locale].caption);
}
async function ready(page: Page, locale: Locale, style: string, gender: string) {
  await expect(page.locator(".app-shell > header")).toBeVisible(); await expect(section(page)).toBeVisible();
  await assertAppearance(page, locale);
  await expect(section(page).getByRole("heading", { name: COPY[locale].title, exact: true })).toBeVisible();
  await expect(section(page).getByRole("button", { name: COPY[locale].save, exact: true })).toBeEnabled();
  await expect(preview(page)).toHaveText(style);
  await expect(section(page).getByText(gender === "female" ? "👩" : "👨", { exact: true })).toHaveCount(1);
}
for (const item of CASES) for (const locale of ["pl", "en"] as const) {
  test(item.mode + " " + locale + " appearance preview omits static financial claims across load, keyboard selection and reload", async ({ page, context }, testInfo) => {
    const apiCalls: string[] = [], pageErrors: string[] = [];
    context.on("request", request => { const url = new URL(request.url()); if (url.pathname.startsWith("/api/")) apiCalls.push(url.href); });
    page.on("pageerror", error => pageErrors.push(error.message));
    await context.route("**/*", route => {
      const url = new URL(route.request().url());
      return url.origin === "http://127.0.0.1:43191" && !url.pathname.startsWith("/api/") ? route.continue() : route.abort();
    });
    await page.setViewportSize({ width: 375, height: 812 }); await seed(page, locale, item.raw);
    let before: Awaited<ReturnType<typeof state>> | undefined, selected: Awaited<ReturnType<typeof state>> | undefined;
    try {
      await page.goto("/avatar"); await ready(page, locale, COPY[locale][item.style], item.gender);
      before = await state(page); expect(before.reads.local["coachfi-avatar"]).toBeGreaterThan(0);
      expect(before.snapshot.local).toEqual({ "coachfi-avatar": item.raw, "coachfi-user": PROFILE, "coachfi-srs": "[]", "coachfi-tokens": "125",
        "coachfi-lesson-steps": '{"retirement":2}', "coachfi-streak": '{"lastActiveDate":"2026-01-01","currentStreak":1,"longestStreak":1}', "coachfi-learn-manual": null });
      expect(before.snapshot.session).toEqual({ "coachfi-avatar": '{"gender":"male","style":"explorer"}', "coachfi-user": null,
        "coachfi-srs": null, "coachfi-tokens": null, "coachfi-lesson-steps": null, "coachfi-streak": null, "coachfi-learn-manual": null });
      expect(before.writes).toEqual([]);
      const explorer = section(page).getByRole("button", { name: new RegExp(COPY[locale].explorer) });
      await explorer.focus(); await expect(explorer).toBeFocused(); await page.keyboard.press("Space");
      await assertAppearance(page, locale); await expect(preview(page)).toHaveText(COPY[locale].explorer);
      selected = await state(page); expect(selected.snapshot).toEqual(before.snapshot); expect(selected.writes).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
      await page.reload(); await ready(page, locale, COPY[locale][item.style], item.gender);
      const reloaded = await state(page); expect(reloaded.reads.local["coachfi-avatar"]).toBeGreaterThan(0);
      expect(reloaded.snapshot).toEqual(before.snapshot); expect(reloaded.writes).toEqual([]);
      expect(apiCalls).toEqual([]); expect(pageErrors).toEqual([]);
    } finally {
      const final = await state(page).catch(error => ({ unavailable: String(error) }));
      await testInfo.attach("C52 synthetic avatar observations", { body: JSON.stringify({ locale, mode: item.mode, rawAvatar: item.raw,
        expectedCaption: COPY[locale].caption, expectedStyle: COPY[locale][item.style], expectedGender: item.gender, before, selected, final, apiCalls, pageErrors, actualURL: page.url(),
        limits: "Fresh Playwright context, synthetic adult/consent/profile/progress/avatar, no existing browser profile or auth. Actual AvatarPage/useProductStorage/getAvatar/shell, fixed clock and viewport. Appearance caption and absence of the removed static score/stat blocks checked at load/selection/reload; unchanged descriptive prose is outside this claim. Seven keys in both areas tracked for set/remove; probe resets after reload while earlier snapshots retained. Keyboard changes only in-memory selection; Save/voice never activated. No API/provider/audio, durable-save, account/staging or production acceptance." }), contentType: "application/json" });
    }
  });
}
