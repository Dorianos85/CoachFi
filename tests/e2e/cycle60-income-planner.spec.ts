import { expect, test, type Locator, type Page } from "@playwright/test";
import { CONSENT_VERSION } from "../../lib/consent";

type Locale = "pl" | "en";
type Write = { area: "local" | "session"; kind: "set" | "remove" | "clear"; key: string; value?: string };
type Raw = { local: Record<string, string | null>; session: Record<string, string | null> };
type Probe = { writes: Write[]; snapshot(): Raw };
type FixtureWindow = typeof window & { __c60Income: Probe };
const ORIGIN = "http://127.0.0.1:43191", NOW = "2026-10-19T12:00:00.000Z";
const KEYS = ["coachfi-consent-v1", "coachfi-mode-v1", "coachfi-user", "coachfi-tokens", "coachfi-srs", "coachfi-lesson-steps",
  "coachfi-streak", "coachfi-learn-manual", "TEST_C60_UNRELATED"];
const COPY = {
  pl: { title: "Model 6 słoików Ekera", label: "Miesięczny dochód", read: "Odczytaj podział dochodu",
    jars: ["Wydatki konieczne", "Edukacja", "Długoterminowe wydatki", "Przyjemności", "Inwestycje", "Pomoc innym"] },
  en: { title: "Eker 6 jar model", label: "Monthly income", read: "Read income split",
    jars: ["Necessities", "Education", "Long-term spending", "Fun", "Investing", "Giving"] },
};
const LIMITS = "Two actual /learn adult-shell mobile Chrome cases, PL and EN, with native number input10 then0.03 then0.001 and reload. Every phase is collected before normative assertions. Current-version optional-off consent, completed adult profile and already-today streak are synthetic, with fresh contexts and fixed UTC clock. Nine named keys in both physical areas are byte-preserved and tracked for set/remove; full set/remove/clear journal retained. Only source-confirmed canonical immediate paired local lswt availability probes outside named keys are excepted from arbitrary-remove checks. Other-key sets are recorded, not a full storage audit. API requests counted and blocked, external requests blocked and counted; not total network zero. No Save, stage navigation, voice/audio/provider, auth, account, cloud, real profile, screenshot/trace, screen reader/full AA, other locales, Kids, financial-advice, staging or production acceptance. Node separately inspects generated voice props; this browser does not.";

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
      "coachfi-user": ' {"name":"C60 synthetic","goal":"preserve","setupDone":true} ', "coachfi-tokens": "125",
      "coachfi-srs": ' [{"id":"inflation","nextReview":"2026-10-20T12:00:00.000Z","interval":1,"ease":2.5,"repetitions":0}] ',
      "coachfi-lesson-steps": ' {"retirement":2} ', "coachfi-streak": ' {"lastActiveDate":"2026-10-19","currentStreak":3,"longestStreak":7} ',
      "coachfi-learn-manual": ' {"inflation":"completed","C60-future-stage":"started"} ', "TEST_C60_UNRELATED": "local-retained" },
    session: { "coachfi-consent-v1": "C60-session-consent-not-authoritative", "coachfi-mode-v1": "C60-session-mode-not-authoritative",
      "coachfi-user": '{"name":"C60_SESSION","setupDone":true}', "coachfi-tokens": "321", "coachfi-srs": " [] ",
      "coachfi-lesson-steps": ' {"credit":1} ', "coachfi-streak": ' {"lastActiveDate":"2026-10-18","currentStreak":1,"longestStreak":1} ',
      "coachfi-learn-manual": ' {"retirement":"started"} ', "TEST_C60_UNRELATED": "session-retained" },
  };
}
async function seed(page: Page, locale: Locale) {
  await page.clock.setFixedTime(new Date(NOW));
  await page.addInitScript(({ locale, raw, keys }) => {
    const nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem, nativeRemove = Storage.prototype.removeItem,
      nativeClear = Storage.prototype.clear, marker = "FIXTURE_C60_INCOME_SEEDED", journal = "FIXTURE_C60_INCOME_JOURNAL";
    if (!nativeGet.call(sessionStorage, marker)) {
      nativeSet.call(sessionStorage, marker, "true"); nativeSet.call(localStorage, "coachfi-locale-v1", locale);
      for (const [key, value] of Object.entries(raw.local)) if (value !== null) nativeSet.call(localStorage, key, value);
      for (const [key, value] of Object.entries(raw.session)) if (value !== null) nativeSet.call(sessionStorage, key, value);
      nativeSet.call(sessionStorage, journal, "[]");
    }
    const probe: Probe = { writes: JSON.parse(nativeGet.call(sessionStorage, journal) || "[]") as Write[],
      snapshot: () => ({ local: Object.fromEntries(keys.map(key => [key, nativeGet.call(localStorage, key)])),
        session: Object.fromEntries(keys.map(key => [key, nativeGet.call(sessionStorage, key)])) }) };
    (window as FixtureWindow).__c60Income = probe;
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
    const probe = (window as FixtureWindow).__c60Income;
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
function planner(page: Page, locale: Locale) {
  return page.locator("section").filter({ has: page.getByRole("heading", { name: COPY[locale].title, exact: true }) }).last();
}
async function settle(page: Page) { await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))); }
async function frame(page: Page, section: Locator, locale: Locale) {
  const input = section.getByRole("spinbutton", { name: new RegExp("^" + COPY[locale].label) });
  return { input: await input.inputValue(), inputValidity: await input.evaluate(node => ({ valid: (node as HTMLInputElement).validity.valid,
    stepMismatch: (node as HTMLInputElement).validity.stepMismatch, badInput: (node as HTMLInputElement).validity.badInput })),
    headings: await section.getByRole("heading", { level: 2 }).allTextContents(),
    totals: await section.locator("p.text-3xl").allTextContents(), alerts: await section.getByRole("alert").allTextContents(),
    voices: await section.getByRole("button", { name: new RegExp(COPY[locale].read) }).count(),
    rows: await section.locator("article").evaluateAll(articles => articles.map(article => ({
      title: article.querySelector("h3")?.textContent?.trim() ?? "", amount: article.querySelector("p")?.textContent ?? "",
      percent: Array.from(article.querySelectorAll("span")).map(node => node.textContent?.trim() ?? "").find(value => /^\d+%$/.test(value)) ?? "",
    }))), storage: await storage(page),
    documentFits: await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1) };
}
function valid(observation: Awaited<ReturnType<typeof frame>>, cents: number, shares: number[], locale: Locale) {
  expect(observation.headings).toEqual([COPY[locale].title]); expect(observation.alerts).toEqual([]);
  expect(observation.totals.map(normalize)).toEqual([money(cents, locale)]);
  expect(observation.rows.map(row => row.title)).toEqual(COPY[locale].jars);
  expect(observation.rows.map(row => row.percent)).toEqual(["55%", "10%", "10%", "10%", "10%", "5%"]);
  expect(observation.rows.map(row => normalize(row.amount))).toEqual(shares.map(value => money(value, locale)));
  expect(shares.reduce((sum, value) => sum + value, 0)).toBe(cents); expect(observation.voices).toBe(1);
}

for (const locale of ["pl", "en"] as const) test(locale + " actual Learn planner conserves PLN cents and refuses unsupported precision", async ({ page, context }, testInfo) => {
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
    await page.goto("/learn"); await page.locator(".app-shell > header").waitFor({ state: "visible" });
    let section = planner(page, locale), control = section.getByRole("spinbutton", { name: new RegExp("^" + COPY[locale].label) });
    await control.waitFor({ state: "visible" }); await settle(page);
    const initial = await frame(page, section, locale); observations.initial = initial;
    await control.fill("10"); await settle(page); const ten = await frame(page, section, locale); observations.ten = ten;
    await control.fill("0.03"); await settle(page); const three = await frame(page, section, locale); observations.threeCents = three;
    await control.fill("0.001"); await settle(page); const invalid = await frame(page, section, locale); observations.invalidPrecision = invalid;
    await page.reload(); await page.locator(".app-shell > header").waitFor({ state: "visible" });
    section = planner(page, locale); control = section.getByRole("spinbutton", { name: new RegExp("^" + COPY[locale].label) });
    await control.waitFor({ state: "visible" }); await settle(page); const reloaded = await frame(page, section, locale); observations.reloaded = reloaded;
    // All baseline counterexamples, invalid-state evidence and reload controls exist before the first financial assertion.
    valid(ten, 1000, [550, 100, 100, 100, 100, 50], locale); valid(three, 3, [2, 1, 0, 0, 0, 0], locale);
    expect(invalid.input).toBe("0.001"); expect(invalid.alerts).toHaveLength(1); expect(normalize(invalid.alerts[0]).length).toBeGreaterThan(10);
    expect(invalid.totals).toEqual([]); expect(invalid.rows).toEqual([]); expect(invalid.voices).toBe(0);
    valid(initial, 500000, [275000, 50000, 50000, 50000, 50000, 25000], locale);
    expect(initial.input).toBe("5000"); valid(reloaded, 500000, [275000, 50000, 50000, 50000, 50000, 25000], locale); expect(reloaded.input).toBe("5000");
    for (const item of [initial, ten, three, invalid, reloaded]) {
      expect(item.storage.raw).toEqual(expectedRaw()); expect(item.storage.monitoredWrites).toEqual([]);
      expect(item.storage.clears).toEqual([]); expect(item.storage.unexpectedRemoves).toEqual([]); expect(item.documentFits).toBe(true);
    }
    expect(apiCalls).toEqual([]); expect(pageErrors).toEqual([]);
  } finally {
    await testInfo.attach("C60 actual income planner observations", { body: JSON.stringify({ locale, observations, apiCalls, pageErrors,
      externalBlocked, finalStorage: await storage(page).catch(error => ({ unavailable: String(error) })), actualURL: page.url(), limits: LIMITS }), contentType: "application/json" });
  }
});
