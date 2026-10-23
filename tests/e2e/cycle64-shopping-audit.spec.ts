import { expect, test, type Locator, type Page } from "@playwright/test";
import { CONSENT_VERSION } from "../../lib/consent";

type Locale = "pl" | "en";
type Write = { area: "local" | "session"; kind: "set" | "remove" | "clear"; key: string; value?: string };
type Raw = { local: Record<string, string | null>; session: Record<string, string | null> };
type Probe = { writes: Write[]; snapshot(): Raw };
type FixtureWindow = typeof window & { __c64Shopping: Probe };
const ORIGIN = "http://127.0.0.1:43191", NOW = "2026-10-19T12:00:00.000Z";
const KEYS = ["coachfi-consent-v1", "coachfi-mode-v1", "coachfi-user", "coachfi-tokens", "coachfi-srs", "coachfi-lesson-steps",
  "coachfi-streak", "coachfi-learn-manual", "TEST_C64_UNRELATED"];
const COPY = {
  pl: { title: "Zatrzymaj impulsywne zakupy, zanim staną się nawykiem.", audit: "Audyt nieużywanych rzeczy", name: "Nieużywana rzecz",
    value: "Szacowana wartość sprzedaży", add: "Dodaj rzecz", remove: "Usuń", total: "Możliwa gotówka z nieużywanych rzeczy", read: "Odczytaj decyzję coacha",
    error: "Podaj nazwę rzeczy i dodatnią kwotę z dokładnością do grosza." },
  en: { title: "Stop impulse spending before it becomes your habit.", audit: "Unused things audit", name: "Unused thing",
    value: "Estimated sale value", add: "Add item", remove: "Remove", total: "Possible cash from unused things", read: "Read Coach decision",
    error: "Enter an item name and a positive amount in steps of 0.01." },
};
const LIMITS = "Two actual /shopping adult-shell mobile Chrome cases, PL and EN, using real name/value inputs and Add/Remove handlers. All eight phases are collected before financial assertions, including two finite1e308 entries that overflow the old total. Fixed synthetic UTC clock, current-version optional-off consent, completed adult profile and already-today streak; fresh contexts, no current profiles. Nine named keys in both physical areas byte-preserved and tracked, full set/remove/clear journal retained. Only source-confirmed canonical immediate paired local lswt probes outside named keys are excepted from arbitrary-remove checks; other-key sets recorded, not a full storage audit. API requests counted and blocked, external requests blocked/counted, not total network zero. No Save, voice/audio/provider action, SDK/auth/account, cloud, real data, screenshot/trace, screen reader/full AA, other seven locales, Kids, financial-advice, staging or production acceptance. Node separately inspects voice props and synthetic captured-closure/same-clock behavior; native actions here are sequential with fixed clock.";

test.use({ timezoneId: "UTC" });
const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
const money = (cents: number, locale: Locale) => normalize(new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-US", {
  style: "currency", currency: "PLN", minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(cents / 100));
function expectedRaw(): Raw {
  return {
    local: { "coachfi-consent-v1": " " + JSON.stringify({ version: CONSENT_VERSION, acceptedAt: NOW, termsAccepted: true, privacyAccepted: true,
      optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }) + " ",
      "coachfi-mode-v1": ' {"mode":"adult","selectedAt":"2026-10-19T12:00:00.000Z","adultConfirmedAt":"2026-10-19T12:00:00.000Z","adultAgeRequirement":18} ',
      "coachfi-user": ' {"name":"C64 synthetic","goal":"preserve","setupDone":true} ', "coachfi-tokens": "125",
      "coachfi-srs": ' [{"id":"inflation","nextReview":"2026-10-20T12:00:00.000Z","interval":1,"ease":2.5,"repetitions":0}] ',
      "coachfi-lesson-steps": ' {"retirement":2} ', "coachfi-streak": ' {"lastActiveDate":"2026-10-19","currentStreak":3,"longestStreak":7} ',
      "coachfi-learn-manual": ' {"inflation":"completed","C64-future-stage":"started"} ', "TEST_C64_UNRELATED": "local-retained" },
    session: { "coachfi-consent-v1": "C64-session-consent-not-authoritative", "coachfi-mode-v1": "C64-session-mode-not-authoritative",
      "coachfi-user": '{"name":"C64_SESSION","setupDone":true}', "coachfi-tokens": "321", "coachfi-srs": " [] ",
      "coachfi-lesson-steps": ' {"credit":1} ', "coachfi-streak": ' {"lastActiveDate":"2026-10-18","currentStreak":1,"longestStreak":1} ',
      "coachfi-learn-manual": ' {"retirement":"started"} ', "TEST_C64_UNRELATED": "session-retained" },
  };
}
async function seed(page: Page, locale: Locale) {
  await page.clock.setFixedTime(new Date(NOW));
  await page.addInitScript(({ locale, raw, keys }) => {
    const nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem, nativeRemove = Storage.prototype.removeItem,
      nativeClear = Storage.prototype.clear, marker = "FIXTURE_C64_SHOPPING_SEEDED", journal = "FIXTURE_C64_SHOPPING_JOURNAL";
    if (!nativeGet.call(sessionStorage, marker)) {
      nativeSet.call(sessionStorage, marker, "true"); nativeSet.call(localStorage, "coachfi-locale-v1", locale);
      for (const [key, value] of Object.entries(raw.local)) if (value !== null) nativeSet.call(localStorage, key, value);
      for (const [key, value] of Object.entries(raw.session)) if (value !== null) nativeSet.call(sessionStorage, key, value);
      nativeSet.call(sessionStorage, journal, "[]");
    }
    const probe: Probe = { writes: JSON.parse(nativeGet.call(sessionStorage, journal) || "[]") as Write[],
      snapshot: () => ({ local: Object.fromEntries(keys.map(key => [key, nativeGet.call(localStorage, key)])),
        session: Object.fromEntries(keys.map(key => [key, nativeGet.call(sessionStorage, key)])) }) };
    (window as FixtureWindow).__c64Shopping = probe;
    function record(storage: Storage, entry: Omit<Write, "area">) {
      probe.writes.push({ area: storage === localStorage ? "local" : "session", ...entry });
      nativeSet.call(sessionStorage, journal, JSON.stringify(probe.writes));
    }
    Storage.prototype.setItem = function (key: string, value: string) {
      record(this, { kind: "set", key: String(key), value: String(value) }); nativeSet.call(this, key, value);
    };
    Storage.prototype.removeItem = function (key: string) { record(this, { kind: "remove", key: String(key) }); nativeRemove.call(this, key); };
    Storage.prototype.clear = function () { record(this, { kind: "clear", key: "*" }); nativeClear.call(this); };
  }, { locale, raw: expectedRaw(), keys: KEYS });
}
async function storage(page: Page) {
  return page.evaluate(keys => {
    const probe = (window as FixtureWindow).__c64Shopping;
    function availabilityKey(key: string) {
      if (!key.startsWith("lswt-")) return false;
      const body = key.slice(5); if (body.length < 2 || body.length > 64) return false;
      const part = (raw: string) => { const value = Number(raw); return raw.length > 0 && Number.isFinite(value) && value >= 0 && value < 1 && String(value) === raw; };
      for (let split = 1; split < body.length; split++) if (part(body.slice(0, split)) && part(body.slice(split))) return true;
      return false;
    }
    const unexpectedRemoves: Write[] = [], availabilityProbeRemoves: Write[] = [], paired = new Set<number>();
    probe.writes.forEach((write, i) => {
      if (write.kind !== "remove") return;
      const prior = probe.writes[i - 1], allowed = write.area === "local" && !keys.includes(write.key) && availabilityKey(write.key)
        && prior?.kind === "set" && prior.area === "local" && prior.key === write.key && prior.value === write.key && !paired.has(i - 1);
      if (allowed) { paired.add(i - 1); availabilityProbeRemoves.push(write); } else unexpectedRemoves.push(write);
    });
    return { raw: probe.snapshot(), writes: [...probe.writes], monitoredWrites: probe.writes.filter(write => keys.includes(write.key)),
      clears: probe.writes.filter(write => write.kind === "clear"), unexpectedRemoves, availabilityProbeRemoves };
  }, KEYS);
}
function shopping(page: Page, locale: Locale) {
  return page.locator("section").filter({ has: page.getByRole("heading", { name: COPY[locale].title, exact: true }) }).last();
}
function audit(section: Locator, locale: Locale) {
  return section.locator("div.rounded-card").filter({ hasText: COPY[locale].audit }).last();
}
async function settle(page: Page) { await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))); }
async function frame(page: Page, section: Locator, locale: Locale) {
  const card = audit(section, locale), input = card.getByRole("spinbutton", { name: COPY[locale].value, exact: true });
  return { name: await card.getByRole("textbox", { name: COPY[locale].name, exact: true }).inputValue(), input: await input.inputValue(),
    inputValidity: await input.evaluate(node => ({ valid: (node as HTMLInputElement).validity.valid,
      stepMismatch: (node as HTMLInputElement).validity.stepMismatch, badInput: (node as HTMLInputElement).validity.badInput,
      rangeOverflow: (node as HTMLInputElement).validity.rangeOverflow })),
    totals: await section.getByText(COPY[locale].total, { exact: true }).locator("..").locator("p.text-xl").allTextContents(),
    alerts: await card.getByRole("alert").allTextContents(),
    rows: await card.getByRole("button", { name: COPY[locale].remove, exact: true }).locator("..").evaluateAll(rows => rows.map(row => ({
      name: row.querySelectorAll("p")[0]?.textContent ?? "", amount: row.querySelectorAll("p")[1]?.textContent ?? "" }))),
    purchase: await section.locator("p.text-4xl").allTextContents(),
    voices: await section.getByRole("button", { name: new RegExp(COPY[locale].read) }).count(), storage: await storage(page),
    documentFits: await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1) };
}
async function add(page: Page, section: Locator, locale: Locale, name: string, value: string) {
  const card = audit(section, locale);
  await card.getByRole("textbox", { name: COPY[locale].name, exact: true }).fill(name);
  await card.getByRole("spinbutton", { name: COPY[locale].value, exact: true }).fill(value);
  await card.getByRole("button", { name: COPY[locale].add, exact: true }).click(); await settle(page);
  return frame(page, section, locale);
}
function valid(observation: Awaited<ReturnType<typeof frame>>, rows: Array<[string, number]>, locale: Locale) {
  const total = rows.reduce((sum, [, cents]) => sum + cents, 0);
  expect(Number.isSafeInteger(total)).toBe(true); expect(total).toBeLessThanOrEqual(100000000000000);
  expect(observation.totals.map(normalize)).toEqual([money(total, locale)]);
  expect(observation.rows.map(row => [normalize(row.name), normalize(row.amount)])).toEqual(rows.map(([name, cents]) => [name, money(cents, locale)]));
  expect(observation.purchase.map(normalize)).toEqual([money(24900, locale)]); expect(observation.voices).toBe(1);
  expect(observation.totals.join(" ") + observation.rows.map(row => row.amount).join(" ")).not.toMatch(/Infinity|NaN|∞/);
}
function refusal(observation: Awaited<ReturnType<typeof frame>>, name: string, value: string, locale: Locale) {
  expect(observation.name).toBe(name); expect(observation.input).toBe(value); expect(observation.alerts).toHaveLength(1);
  expect(normalize(observation.alerts[0])).toContain(COPY[locale].error);
  expect(normalize(observation.alerts[0])).toContain(money(100000000000000, locale));
}

for (const locale of ["pl", "en"] as const) test(locale + " actual Shopping audit preserves PLN cents and refuses finite-input overflow without losing rows", async ({ page, context }, testInfo) => {
  const apiCalls: string[] = [], pageErrors: string[] = [], observations: Record<string, unknown> = {}; let externalBlocked = 0;
  context.on("request", request => { const url = new URL(request.url()); if (url.pathname.startsWith("/api/")) apiCalls.push(url.pathname); });
  page.on("pageerror", error => pageErrors.push(error.message));
  await context.route("**/*", route => {
    const url = new URL(route.request().url());
    if (url.origin === ORIGIN && !url.pathname.startsWith("/api/")) return route.continue();
    if (url.origin !== ORIGIN) externalBlocked++; return route.abort();
  });
  await page.setViewportSize({ width: 375, height: 812 }); await seed(page, locale);
  try {
    await page.goto("/shopping"); await page.locator(".app-shell > header").waitFor({ state: "visible" });
    let section = shopping(page, locale), card = audit(section, locale);
    await card.getByRole("spinbutton", { name: COPY[locale].value, exact: true }).waitFor({ state: "visible" }); await settle(page);
    const initial = await frame(page, section, locale); observations.initial = initial;
    const first = await add(page, section, locale, "cent-a", "0.29"); observations.first = first;
    const two = await add(page, section, locale, "cent-b", "0.01"); observations.two = two;
    const precision = await add(page, section, locale, "rejected-precision", "0.001"); observations.invalidPrecision = precision;
    const hugeFirst = await add(page, section, locale, "huge-a", "1e308"); observations.hugeFirst = hugeFirst;
    const hugeSecond = await add(page, section, locale, "huge-b", "1e308"); observations.hugeSecond = hugeSecond;
    await card.getByRole("button", { name: COPY[locale].remove, exact: true }).first().click(); await settle(page);
    const removed = await frame(page, section, locale); observations.removed = removed;
    await page.reload(); await page.locator(".app-shell > header").waitFor({ state: "visible" }); section = shopping(page, locale); card = audit(section, locale);
    await card.getByRole("spinbutton", { name: COPY[locale].value, exact: true }).waitFor({ state: "visible" }); await settle(page);
    const reloaded = await frame(page, section, locale); observations.reloaded = reloaded;
    // All actual baseline arithmetic/overflow/refusal/remove/reload observations exist before any expected financial assertion.
    valid(first, [["cent-a", 29]], locale); valid(two, [["cent-a", 29], ["cent-b", 1]], locale);
    for (const rejected of [precision, hugeFirst, hugeSecond]) valid(rejected, [["cent-a", 29], ["cent-b", 1]], locale);
    refusal(precision, "rejected-precision", "0.001", locale); refusal(hugeFirst, "huge-a", "1e308", locale); refusal(hugeSecond, "huge-b", "1e308", locale);
    valid(removed, [["cent-b", 1]], locale); expect(removed.alerts).toEqual([]);
    for (const empty of [initial, reloaded]) { valid(empty, [], locale); expect(empty.name).toBe(""); expect(empty.input).toBe("80"); expect(empty.alerts).toEqual([]); }
    for (const item of [initial, first, two, precision, hugeFirst, hugeSecond, removed, reloaded]) {
      expect(item.storage.raw).toEqual(expectedRaw()); expect(item.storage.monitoredWrites).toEqual([]);
      expect(item.storage.clears).toEqual([]); expect(item.storage.unexpectedRemoves).toEqual([]); expect(item.documentFits).toBe(true);
    }
    expect(apiCalls).toEqual([]); expect(pageErrors).toEqual([]);
  } finally {
    await testInfo.attach("C64 actual shopping audit observations", { body: JSON.stringify({ locale, observations, apiCalls, pageErrors,
      externalBlocked, finalStorage: await storage(page).catch(error => ({ unavailable: String(error) })), actualURL: page.url(), limits: LIMITS }), contentType: "application/json" });
  }
});