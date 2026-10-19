import { expect, test, type Locator, type Page } from "@playwright/test";
import { CONSENT_VERSION } from "../../lib/consent";

type Locale = "pl" | "en";
type Write = { area: "local" | "session"; kind: "set" | "remove" | "clear"; key: string; value?: string };
type Raw = { local: Record<string, string | null>; session: Record<string, string | null> };
type Probe = { writes: Write[]; snapshot(): Raw };
type FixtureWindow = typeof window & { __c65ShoppingPrice: Probe };
const ORIGIN = "http://127.0.0.1:43191", NOW = "2026-10-19T12:00:00.000Z";
const KEYS = ["coachfi-consent-v1", "coachfi-mode-v1", "coachfi-user", "coachfi-tokens", "coachfi-srs", "coachfi-lesson-steps",
  "coachfi-streak", "coachfi-learn-manual", "TEST_C65_UNRELATED"];
const COPY = {
  pl: { title: "Zatrzymaj impulsywne zakupy, zanim staną się nawykiem.", audit: "Audyt nieużywanych rzeczy", name: "Nieużywana rzecz",
    value: "Szacowana wartość sprzedaży", add: "Dodaj rzecz", remove: "Usuń", total: "Możliwa gotówka z nieużywanych rzeczy", read: "Odczytaj decyzję coacha",
    price: "Cena", receipt: "Mam paragon albo potwierdzenie zamówienia", decision: "Decyzja coacha", impulse: "Wynik impulsu", returnStatus: "Status zwrotu", error: "Podaj cenę od 0 do" },
  en: { title: "Stop impulse spending before it becomes your habit.", audit: "Unused things audit", name: "Unused thing",
    value: "Estimated sale value", add: "Add item", remove: "Remove", total: "Possible cash from unused things", read: "Read Coach decision",
    price: "Price", receipt: "I still have the receipt or order confirmation", decision: "Coach decision", impulse: "Impulse score", returnStatus: "Return status", error: "Enter a price from 0 to" },
};
const LIMITS = "Two actual /shopping adult-shell mobile Chrome cases PL/EN: current purchase price, return/sell receipt control, blank/subcent/finite-overbound withholding, unused Add/Remove while price invalid, zero recovery and reload. All ten phases gathered before financial assertions. Fresh contexts/fixed synthetic UTCclock/current-version optional-off consent/completed adult synthetic profile/already-today streak; no current profiles. Nine named keys in each physical area byte-preserved with full write journal. Only source-confirmed canonical paired local lswt availability probes outside named keys excepted from arbitrary-remove checks; other-key sets retained, not full storage audit. API/external requests counted and blocked, same-origin assets allowed; API0 not total network0. No voice/audio/provider/auth/account/cloud/real data/other7locale/fullAA/AT/policy-for-counts-or-days/production acceptance. DOM description reference resolution is observed, not screen reader certification. Legacy60percent whole-PLN sell estimate remains unchanged, not a financial recommendation.";

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
      "coachfi-user": ' {"name":"C65 synthetic","goal":"preserve","setupDone":true} ', "coachfi-tokens": "125",
      "coachfi-srs": ' [{"id":"inflation","nextReview":"2026-10-20T12:00:00.000Z","interval":1,"ease":2.5,"repetitions":0}] ',
      "coachfi-lesson-steps": ' {"retirement":2} ', "coachfi-streak": ' {"lastActiveDate":"2026-10-19","currentStreak":3,"longestStreak":7} ',
      "coachfi-learn-manual": ' {"inflation":"completed","C65-future-stage":"started"} ', "TEST_C65_UNRELATED": "local-retained" },
    session: { "coachfi-consent-v1": "C65-session-consent-not-authoritative", "coachfi-mode-v1": "C65-session-mode-not-authoritative",
      "coachfi-user": '{"name":"C65_SESSION","setupDone":true}', "coachfi-tokens": "321", "coachfi-srs": " [] ",
      "coachfi-lesson-steps": ' {"credit":1} ', "coachfi-streak": ' {"lastActiveDate":"2026-10-18","currentStreak":1,"longestStreak":1} ',
      "coachfi-learn-manual": ' {"retirement":"started"} ', "TEST_C65_UNRELATED": "session-retained" },
  };
}
async function seed(page: Page, locale: Locale) {
  await page.clock.setFixedTime(new Date(NOW));
  await page.addInitScript(({ locale, raw, keys }) => {
    const nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem, nativeRemove = Storage.prototype.removeItem,
      nativeClear = Storage.prototype.clear, marker = "FIXTURE_C65_SHOPPING_PRICE_SEEDED", journal = "FIXTURE_C65_SHOPPING_PRICE_JOURNAL";
    if (!nativeGet.call(sessionStorage, marker)) {
      nativeSet.call(sessionStorage, marker, "true"); nativeSet.call(localStorage, "coachfi-locale-v1", locale);
      for (const [key, value] of Object.entries(raw.local)) if (value !== null) nativeSet.call(localStorage, key, value);
      for (const [key, value] of Object.entries(raw.session)) if (value !== null) nativeSet.call(sessionStorage, key, value);
      nativeSet.call(sessionStorage, journal, "[]");
    }
    const probe: Probe = { writes: JSON.parse(nativeGet.call(sessionStorage, journal) || "[]") as Write[],
      snapshot: () => ({ local: Object.fromEntries(keys.map(key => [key, nativeGet.call(localStorage, key)])),
        session: Object.fromEntries(keys.map(key => [key, nativeGet.call(sessionStorage, key)])) }) };
    (window as FixtureWindow).__c65ShoppingPrice = probe;
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
    const probe = (window as FixtureWindow).__c65ShoppingPrice;
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
function shopping(page: Page, locale: Locale) { return page.locator("section").filter({ has: page.getByRole("heading", { name: COPY[locale].title, exact: true }) }).last(); }
function audit(section: Locator, locale: Locale) { return section.locator("div.rounded-card").filter({ hasText: COPY[locale].audit }).last(); }
async function settle(page: Page) { await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))); }
async function frame(page: Page, section: Locator, locale: Locale) {
  const card = audit(section, locale), control = section.getByRole("spinbutton", { name: COPY[locale].price, exact: true });
  return { price: await control.inputValue(), priceAttributes: await control.evaluate(node => {
      const input = node as HTMLInputElement, references = (input.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
      return { ariaInvalid: input.getAttribute("aria-invalid"), descriptionRefs: references.map(id => ({ id,
        matches: Array.from(document.querySelectorAll("[id]")).filter(target => target.id === id).length,
        text: document.getElementById(id)?.textContent ?? "", role: document.getElementById(id)?.getAttribute("role") ?? null })),
        valid: input.validity.valid, badInput: input.validity.badInput, stepMismatch: input.validity.stepMismatch, rangeOverflow: input.validity.rangeOverflow };
    }),
    receipt: await section.getByRole("checkbox", { name: COPY[locale].receipt, exact: true }).isChecked(),
    amounts: await section.locator("p.text-4xl").allTextContents(), alerts: await section.getByRole("alert").allTextContents(),
    decisionLabels: await section.getByText(COPY[locale].decision, { exact: true }).count(), impulse: await section.getByText(COPY[locale].impulse, { exact: true }).count(),
    returnStatus: await section.getByText(COPY[locale].returnStatus, { exact: true }).count(), voices: await section.getByRole("button", { name: new RegExp(COPY[locale].read) }).count(),
    totals: await section.getByText(COPY[locale].total, { exact: true }).locator("..").locator("p.text-xl").allTextContents(),
    rows: await card.getByRole("button", { name: COPY[locale].remove, exact: true }).locator("..").evaluateAll(rows => rows.map(row => ({
      name: row.querySelectorAll("p")[0]?.textContent ?? "", amount: row.querySelectorAll("p")[1]?.textContent ?? "" }))),
    storage: await storage(page), documentFits: await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1) };
}
async function inputPrice(page: Page, section: Locator, locale: Locale, value: string) { await section.getByRole("spinbutton", { name: COPY[locale].price, exact: true }).fill(value); await settle(page); return frame(page, section, locale); }
async function addUnused(page: Page, section: Locator, locale: Locale, name: string, amount: string) {
  const card = audit(section, locale); await card.getByRole("textbox", { name: COPY[locale].name, exact: true }).fill(name);
  await card.getByRole("spinbutton", { name: COPY[locale].value, exact: true }).fill(amount); await card.getByRole("button", { name: COPY[locale].add, exact: true }).click(); await settle(page);
}
function unused(view: Awaited<ReturnType<typeof frame>>, rows: Array<[string, number]>, locale: Locale) {
  expect(view.totals.map(normalize)).toEqual([money(rows.reduce((sum, [, cents]) => sum + cents, 0), locale)]);
  expect(view.rows.map(row => [normalize(row.name), normalize(row.amount)])).toEqual(rows.map(([name, cents]) => [name, money(cents, locale)]));
}
function valid(view: Awaited<ReturnType<typeof frame>>, amountCents: number, locale: Locale) {
  expect(view.priceAttributes.ariaInvalid).not.toBe("true"); expect(view.priceAttributes.descriptionRefs).toEqual([]);
  expect(view.alerts).toEqual([]); expect(view.amounts.map(normalize)).toEqual([money(amountCents, locale)]);
  expect(view.decisionLabels).toBe(1); expect(view.impulse).toBe(1); expect(view.returnStatus).toBe(1); expect(view.voices).toBe(1);
  expect(view.amounts.join(" ")).not.toMatch(/Infinity|NaN|∞/);
}
function invalid(view: Awaited<ReturnType<typeof frame>>, raw: string, locale: Locale) {
  expect(view.price).toBe(raw); expect(view.alerts).toHaveLength(1); expect(normalize(view.alerts[0])).toContain(COPY[locale].error);
  expect(normalize(view.alerts[0])).toContain(money(100000000000000, locale)); expect(view.priceAttributes.ariaInvalid).toBe("true");
  expect(view.priceAttributes.descriptionRefs).toHaveLength(1); const reference = view.priceAttributes.descriptionRefs[0];
  expect(reference.matches).toBe(1); expect(reference.role).toBe("alert"); expect(normalize(reference.text)).toBe(normalize(view.alerts[0]));
  expect(view.amounts).toEqual([]); expect(view.decisionLabels).toBe(0); expect(view.impulse).toBe(0); expect(view.returnStatus).toBe(0); expect(view.voices).toBe(0);
}

for (const locale of ["pl", "en"] as const) test(locale + " actual Shopping price withholds unsupported results and preserves the unused audit", async ({ page, context }, testInfo) => {
  const apiCalls: string[] = [], pageErrors: string[] = [], observations: Record<string, unknown> = {}; let externalBlocked = 0;
  context.on("request", request => { const url = new URL(request.url()); if (url.pathname.startsWith("/api/")) apiCalls.push(url.pathname); });
  page.on("pageerror", error => pageErrors.push(error.message));
  await context.route("**/*", route => { const url = new URL(route.request().url()); if (url.origin === ORIGIN && !url.pathname.startsWith("/api/")) return route.continue(); if (url.origin !== ORIGIN) externalBlocked++; return route.abort(); });
  await page.setViewportSize({ width: 375, height: 812 }); await seed(page, locale);
  try {
    await page.goto("/shopping"); await page.locator(".app-shell > header").waitFor({ state: "visible" }); let section = shopping(page, locale);
    await section.getByRole("spinbutton", { name: COPY[locale].price, exact: true }).waitFor({ state: "visible" }); await settle(page);
    const initial = await frame(page, section, locale); observations.initial = initial;
    await addUnused(page, section, locale, "kept", "0.29"); const returned = await inputPrice(page, section, locale, "0.29"); observations.returnedCent = returned;
    await section.getByRole("checkbox", { name: COPY[locale].receipt, exact: true }).uncheck(); await settle(page); const sold = await frame(page, section, locale); observations.soldCent = sold;
    const blank = await inputPrice(page, section, locale, ""); observations.blank = blank;
    const subcent = await inputPrice(page, section, locale, "0.001"); observations.subcent = subcent;
    const huge = await inputPrice(page, section, locale, "1e308"); observations.huge = huge;
    await addUnused(page, section, locale, "added-while-invalid", "0.01"); const independent = await frame(page, section, locale); observations.unusedWhileInvalid = independent;
    const recovered = await inputPrice(page, section, locale, "0"); observations.recoveredZero = recovered;
    await audit(section, locale).getByRole("button", { name: COPY[locale].remove, exact: true }).first().click(); await settle(page); const removed = await frame(page, section, locale); observations.removed = removed;
    await page.reload(); await page.locator(".app-shell > header").waitFor({ state: "visible" }); section = shopping(page, locale);
    await section.getByRole("spinbutton", { name: COPY[locale].price, exact: true }).waitFor({ state: "visible" }); await settle(page); const reloaded = await frame(page, section, locale); observations.reloaded = reloaded;
    // All ten baseline component/DOM/invalid/independence/recovery frames exist before expected financial assertions.
    invalid(blank, "", locale); invalid(subcent, "0.001", locale); invalid(huge, "1e308", locale); invalid(independent, "1e308", locale);
    valid(initial, 24900, locale); valid(returned, 29, locale); valid(sold, 0, locale); valid(recovered, 0, locale); valid(removed, 0, locale); valid(reloaded, 24900, locale);
    expect(initial.price).toBe("249"); expect(reloaded.price).toBe("249"); expect(initial.receipt).toBe(true); expect(reloaded.receipt).toBe(true);
    expect(sold.receipt).toBe(false); expect(recovered.receipt).toBe(false);
    for (const item of [returned, sold, blank, subcent, huge]) unused(item, [["kept", 29]], locale);
    unused(independent, [["kept", 29], ["added-while-invalid", 1]], locale); unused(recovered, [["kept", 29], ["added-while-invalid", 1]], locale);
    unused(removed, [["added-while-invalid", 1]], locale); unused(initial, [], locale); unused(reloaded, [], locale);
    for (const item of [initial, returned, sold, blank, subcent, huge, independent, recovered, removed, reloaded]) {
      expect(item.storage.raw).toEqual(expectedRaw()); expect(item.storage.monitoredWrites).toEqual([]); expect(item.storage.clears).toEqual([]);
      expect(item.storage.unexpectedRemoves).toEqual([]); expect(item.documentFits).toBe(true);
    }
    expect(apiCalls).toEqual([]); expect(pageErrors).toEqual([]);
  } finally {
    await testInfo.attach("C65 actual shopping price observations", { body: JSON.stringify({ locale, observations, apiCalls, pageErrors, externalBlocked,
      finalStorage: await storage(page).catch(error => ({ unavailable: String(error) })), actualURL: page.url(), limits: LIMITS }), contentType: "application/json" });
  }
});