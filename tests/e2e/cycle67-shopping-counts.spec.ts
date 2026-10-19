import { expect, test, type Locator, type Page } from "@playwright/test";
import { CONSENT_VERSION } from "../../lib/consent";

type Locale = "pl" | "en";
type Write = { area: "local" | "session"; kind: "set" | "remove" | "clear"; key: string; value?: string };
type Raw = { local: Record<string, string | null>; session: Record<string, string | null> };
type Probe = { writes: Write[]; snapshot(): Raw };
type FixtureWindow = typeof window & { __c67ShoppingCounts: Probe };
const ORIGIN = "http://127.0.0.1:43191", NOW = "2026-10-19T12:00:00.000Z";
const KEYS = ["coachfi-consent-v1", "coachfi-mode-v1", "coachfi-user", "coachfi-tokens", "coachfi-srs", "coachfi-lesson-steps",
  "coachfi-streak", "coachfi-learn-manual", "TEST_C67_UNRELATED"];
const COPY = {
  pl: { title: "Zatrzymaj impulsywne zakupy, zanim staną się nawykiem.", audit: "Audyt nieużywanych rzeczy", name: "Nieużywana rzecz",
    value: "Szacowana wartość sprzedaży", add: "Dodaj rzecz", remove: "Usuń", total: "Możliwa gotówka z nieużywanych rzeczy", read: "Odczytaj decyzję coacha",
    used: "Ile razy użyte?", window: "Okno zwrotu w dniach", usedError: "Podaj liczbę użyć równą 0 lub większą.", windowError: "Podaj okno zwrotu wynoszące co najmniej 1 dzień.", titles: { return: "Zwróć, jeśli regulamin na to pozwala", sell: "Sprzedaj i zamień bałagan na gotówkę", pause: "Odczekaj przed decyzją", keep: "Zostaw, ale używaj świadomie" }, days: "Dni od zakupu", daysError: "Podaj liczbę dni od zakupu równą 0 lub większą.", open: "Zwrot może być jeszcze możliwy", closed: "Zwrot prawdopodobnie zamknięty", price: "Cena", receipt: "Mam paragon albo potwierdzenie zamówienia", decision: "Decyzja coacha", impulse: "Wynik impulsu", returnStatus: "Status zwrotu", error: "Podaj cenę od 0 do" },
  en: { title: "Stop impulse spending before it becomes your habit.", audit: "Unused things audit", name: "Unused thing",
    value: "Estimated sale value", add: "Add item", remove: "Remove", total: "Possible cash from unused things", read: "Read Coach decision",
    used: "How many times have you used it?", window: "Return window in days", usedError: "Enter the number of uses as a number of 0 or more.", windowError: "Enter a return window of at least 1 day.", titles: { return: "Return it if the policy allows it", sell: "Sell it and turn clutter into cash", pause: "Pause before deciding", keep: "Keep it, but use it intentionally" }, days: "Days since purchase", daysError: "Enter the days since purchase as a number of 0 or more.", open: "Return may still be possible", closed: "Return is probably closed", price: "Price", receipt: "I still have the receipt or order confirmation", decision: "Coach decision", impulse: "Impulse score", returnStatus: "Return status", error: "Enter a price from 0 to" },
};
const LIMITS = "Two actual /shopping adult-shell PLEN mobile Chrome cases. Twelve phases cover window14-to-blank versus explicit1 and used2/need4/regret1/triggerneed keep41-to-blank versus explicit0 pause55, recovery/bothunknown/audit/fractions/hugefinite/reload. Allframes beforefinancialasserts. ActualRange native focus+End+ArrowLeft and Home, actualselectOption need; these specific keys only, no blanketkeyboard/AT claim. Fresh fixedUTC syntheticadult/currentconsentoptional-off/completedprofile/already-todaystreak.9namedkeys×2raw preserved/fulljournal, only exactsourceconfirmed immediatepairedcanonical local lswt availabilityprobes excepted; other-key sets recorded/not fullstorageaudit. API/externalblocked/count0 expected, sameoriginassets allowed/API0 notnetwork0. No voiceclick/audio/provider/auth/cloud/realprofile/other7locale/fullAA/legalfinancialmodel validation. Nodeexotic hex/nonfinite/underflow notnative representability acceptance. Existing41/55 and60percent policy merely preserved.";

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
      "coachfi-user": ' {"name":"C67 synthetic","goal":"preserve","setupDone":true} ', "coachfi-tokens": "125",
      "coachfi-srs": ' [{"id":"inflation","nextReview":"2026-10-20T12:00:00.000Z","interval":1,"ease":2.5,"repetitions":0}] ',
      "coachfi-lesson-steps": ' {"retirement":2} ', "coachfi-streak": ' {"lastActiveDate":"2026-10-19","currentStreak":3,"longestStreak":7} ',
      "coachfi-learn-manual": ' {"inflation":"completed","C67-future-stage":"started"} ', "TEST_C67_UNRELATED": "local-retained" },
    session: { "coachfi-consent-v1": "C67-session-consent-not-authoritative", "coachfi-mode-v1": "C67-session-mode-not-authoritative",
      "coachfi-user": '{"name":"C67_SESSION","setupDone":true}', "coachfi-tokens": "321", "coachfi-srs": " [] ",
      "coachfi-lesson-steps": ' {"credit":1} ', "coachfi-streak": ' {"lastActiveDate":"2026-10-18","currentStreak":1,"longestStreak":1} ',
      "coachfi-learn-manual": ' {"retirement":"started"} ', "TEST_C67_UNRELATED": "session-retained" },
  };
}
async function seed(page: Page, locale: Locale) {
  await page.clock.setFixedTime(new Date(NOW));
  await page.addInitScript(({ locale, raw, keys }) => {
    const nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem, nativeRemove = Storage.prototype.removeItem,
      nativeClear = Storage.prototype.clear, marker = "FIXTURE_C67_SHOPPING_COUNTS_SEEDED", journal = "FIXTURE_C67_SHOPPING_COUNTS_JOURNAL";
    if (!nativeGet.call(sessionStorage, marker)) {
      nativeSet.call(sessionStorage, marker, "true"); nativeSet.call(localStorage, "coachfi-locale-v1", locale);
      for (const [key, value] of Object.entries(raw.local)) if (value !== null) nativeSet.call(localStorage, key, value);
      for (const [key, value] of Object.entries(raw.session)) if (value !== null) nativeSet.call(sessionStorage, key, value);
      nativeSet.call(sessionStorage, journal, "[]");
    }
    const probe: Probe = { writes: JSON.parse(nativeGet.call(sessionStorage, journal) || "[]") as Write[],
      snapshot: () => ({ local: Object.fromEntries(keys.map(key => [key, nativeGet.call(localStorage, key)])),
        session: Object.fromEntries(keys.map(key => [key, nativeGet.call(sessionStorage, key)])) }) };
    (window as FixtureWindow).__c67ShoppingCounts = probe;
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
    const probe = (window as FixtureWindow).__c67ShoppingCounts;
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
type FieldKey = "price" | "days" | "used" | "window";
type RawInputs = Record<FieldKey, string>;
function control(section: Locator, locale: Locale, key: FieldKey) { return section.getByRole("spinbutton", { name: COPY[locale][key], exact: true }); }
async function attributes(input: Locator) {
  return input.evaluate(node => { const field = node as HTMLInputElement, ids = (field.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
    return { min: field.getAttribute("min"), max: field.getAttribute("max"), step: field.getAttribute("step"), ariaInvalid: field.getAttribute("aria-invalid"), valid: field.validity.valid, stepMismatch: field.validity.stepMismatch,
      descriptionRefs: ids.map(id => ({ id, matches: Array.from(document.querySelectorAll("[id]")).filter(target => target.id === id).length, text: document.getElementById(id)?.textContent ?? "", role: document.getElementById(id)?.getAttribute("role") ?? null })) };
  });
}
async function frame(page: Page, section: Locator, locale: Locale) {
  const card = audit(section, locale), metric = async (label: string) => section.getByText(label, { exact: true }).locator("..").locator("p.text-xl").allTextContents();
  const inputs = {} as Record<FieldKey, { raw: string; attributes: Awaited<ReturnType<typeof attributes>> }>;
  for (const key of ["price", "days", "used", "window"] as const) inputs[key] = { raw: await control(section, locale, key).inputValue(), attributes: await attributes(control(section, locale, key)) };
  const headings = await section.locator("h3").allTextContents();
  return { inputs, ranges: await section.locator('input[type="range"]').evaluateAll(nodes => nodes.map(node => (node as HTMLInputElement).value)), trigger: await section.getByRole("combobox").inputValue(),
    receipt: await section.getByRole("checkbox", { name: COPY[locale].receipt, exact: true }).isChecked(),
    amounts: await section.locator("p.text-4xl").allTextContents(), alerts: await section.getByRole("alert").allTextContents(), decisionLabels: await section.getByText(COPY[locale].decision, { exact: true }).count(), decisionTitles: headings.filter(title => Object.values(COPY[locale].titles).includes(title)),
    impulseValues: await metric(COPY[locale].impulse), returnValues: await metric(COPY[locale].returnStatus), voices: await section.getByRole("button", { name: new RegExp(COPY[locale].read) }).count(), totals: await metric(COPY[locale].total),
    rows: await card.getByRole("button", { name: COPY[locale].remove, exact: true }).locator("..").evaluateAll(rows => rows.map(row => ({ name: row.querySelectorAll("p")[0]?.textContent ?? "", amount: row.querySelectorAll("p")[1]?.textContent ?? "" }))),
    storage: await storage(page), documentFits: await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1) };
}
async function input(page: Page, section: Locator, locale: Locale, key: FieldKey, raw: string) { await control(section, locale, key).fill(raw); await settle(page); return frame(page, section, locale); }
async function addUnused(page: Page, section: Locator, locale: Locale) {
  const card = audit(section, locale); await card.getByRole("textbox", { name: COPY[locale].name, exact: true }).fill("kept"); await card.getByRole("spinbutton", { name: COPY[locale].value, exact: true }).fill("0.29"); await card.getByRole("button", { name: COPY[locale].add, exact: true }).click(); await settle(page);
}
function unused(view: Awaited<ReturnType<typeof frame>>, rows: Array<[string, number]>, locale: Locale) {
  expect(view.totals.map(normalize)).toEqual([money(rows.reduce((sum, [, cents]) => sum + cents, 0), locale)]);
  expect(view.rows.map(row => [normalize(row.name), normalize(row.amount)])).toEqual(rows.map(([name, cents]) => [name, money(cents, locale)]));
}
function supported(view: Awaited<ReturnType<typeof frame>>, amountCents: number, decision: "return" | "sell" | "pause" | "keep", score: number, open: boolean, locale: Locale) {
  Object.values(view.inputs).forEach(input => { expect(input.attributes.ariaInvalid).not.toBe("true"); expect(input.attributes.descriptionRefs).toEqual([]); });
  expect(view.alerts).toEqual([]); expect(view.amounts.map(normalize)).toEqual([money(amountCents, locale)]); expect(view.decisionLabels).toBe(1); expect(view.decisionTitles).toEqual([COPY[locale].titles[decision]]);
  expect(view.impulseValues.map(normalize)).toEqual([score + "/100"]); expect(view.returnValues.map(normalize)).toEqual([COPY[locale][open ? "open" : "closed"]]); expect(view.voices).toBe(1);
}
function unsupported(view: Awaited<ReturnType<typeof frame>>, bad: Array<"used" | "window">, locale: Locale) {
  for (const key of ["price", "days", "used", "window"] as const) {
    const field = view.inputs[key];
    if ((bad as FieldKey[]).includes(key)) {
      expect(field.raw).toBe(""); expect(field.attributes.ariaInvalid).toBe("true"); expect(field.attributes.descriptionRefs).toHaveLength(1); const ref = field.attributes.descriptionRefs[0];
      expect(ref.matches).toBe(1); expect(ref.role).toBe("alert"); expect(normalize(ref.text)).toBe(COPY[locale][key === "used" ? "usedError" : "windowError"]);
    } else { expect(field.attributes.ariaInvalid).not.toBe("true"); expect(field.attributes.descriptionRefs).toEqual([]); }
  }
  expect(view.alerts).toHaveLength(bad.length); expect(new Set(bad.flatMap(key => view.inputs[key].attributes.descriptionRefs.map(ref => ref.id))).size).toBe(bad.length);
  expect(view.amounts).toEqual([]); expect(view.decisionLabels).toBe(0); expect(view.decisionTitles).toEqual([]); expect(view.impulseValues).toEqual([]); expect(view.returnValues).toEqual([]); expect(view.voices).toBe(0);
}
for (const locale of ["pl", "en"] as const) test(locale + " actual Shopping unknown window and uses do not invent a supported decision", async ({ page, context }, testInfo) => {
  const apiCalls: string[] = [], pageErrors: string[] = [], observations: Record<string, unknown> = {}; let externalBlocked = 0;
  context.on("request", request => { const url = new URL(request.url()); if (url.pathname.startsWith("/api/")) apiCalls.push(url.pathname); }); page.on("pageerror", error => pageErrors.push(error.message));
  await context.route("**/*", route => { const url = new URL(route.request().url()); if (url.origin === ORIGIN && !url.pathname.startsWith("/api/")) return route.continue(); if (url.origin !== ORIGIN) externalBlocked++; return route.abort(); });
  await page.setViewportSize({ width: 375, height: 812 }); await seed(page, locale);
  try {
    await page.goto("/shopping"); await page.locator(".app-shell > header").waitFor({ state: "visible" }); let section = shopping(page, locale); await control(section, locale, "window").waitFor({ state: "visible" }); await settle(page);
    const initial = await frame(page, section, locale); observations.initial = initial;
    const windowBlank = await input(page, section, locale, "window", ""); observations.windowBlank = windowBlank;
    const windowOne = await input(page, section, locale, "window", "1"); observations.windowOne = windowOne;
    const windowRestored = await input(page, section, locale, "window", "14"); observations.windowRestored = windowRestored;
    const ranges = section.locator('input[type="range"]'); await ranges.nth(0).focus(); await ranges.nth(0).press("End"); await ranges.nth(0).press("ArrowLeft"); await ranges.nth(1).focus(); await ranges.nth(1).press("Home"); await section.getByRole("combobox").selectOption("need");
    const keep = await input(page, section, locale, "used", "2"); observations.keep41 = keep;
    const usedBlank = await input(page, section, locale, "used", ""); observations.usedBlank = usedBlank;
    const zero = await input(page, section, locale, "used", "0"); observations.explicitZero55 = zero;
    const keepRecovered = await input(page, section, locale, "used", "2"); observations.keepRecovered = keepRecovered;
    await input(page, section, locale, "used", ""); await input(page, section, locale, "window", ""); await addUnused(page, section, locale); const both = await frame(page, section, locale); observations.bothUnknownWithAudit = both;
    await input(page, section, locale, "used", "0.5"); const fraction = await input(page, section, locale, "window", "1.5"); observations.fraction = fraction;
    await input(page, section, locale, "used", "1e308"); await input(page, section, locale, "window", "1e308"); await audit(section, locale).getByRole("button", { name: COPY[locale].remove, exact: true }).click(); await settle(page); const huge = await frame(page, section, locale); observations.largeFiniteRemoved = huge;
    await page.reload(); await page.locator(".app-shell > header").waitFor({ state: "visible" }); section = shopping(page, locale); await control(section, locale, "window").waitFor({ state: "visible" }); await settle(page); const reloaded = await frame(page, section, locale); observations.reloaded = reloaded;
    // Both original counterexamples and all12frames exist before primary unknown-count assertions.
    unsupported(windowBlank, ["window"], locale); unsupported(usedBlank, ["used"], locale); unsupported(both, ["used", "window"], locale);
    supported(initial, 24900, "return", 100, true, locale); supported(windowOne, 14900, "sell", 100, false, locale); supported(windowRestored, 24900, "return", 100, true, locale);
    supported(keep, 14900, "keep", 41, true, locale); supported(zero, 14900, "pause", 55, true, locale); supported(keepRecovered, 14900, "keep", 41, true, locale); supported(fraction, 14900, "keep", 49, false, locale); supported(huge, 14900, "keep", 41, true, locale); supported(reloaded, 24900, "return", 100, true, locale);
    expect(keep.ranges).toEqual(["4", "1"]); expect(keep.trigger).toBe("need"); expect(keepRecovered.ranges).toEqual(["4", "1"]); expect(keepRecovered.trigger).toBe("need");
    expect(initial.inputs.used.raw).toBe("0"); expect(initial.inputs.window.raw).toBe("14"); expect(reloaded.inputs.used.raw).toBe("0"); expect(reloaded.inputs.window.raw).toBe("14"); expect(reloaded.inputs.days.raw).toBe("3"); expect(reloaded.inputs.price.raw).toBe("249");
    for (const key of ["used", "window"] as const) { expect(fraction.inputs[key].attributes.step).toBe("any"); expect(fraction.inputs[key].attributes.max).toBeNull(); expect(fraction.inputs[key].attributes.stepMismatch).toBe(false); expect(huge.inputs[key].raw).toBe("1e308"); }
    unused(both, [["kept", 29]], locale); unused(fraction, [["kept", 29]], locale);
    for (const item of [initial, windowBlank, windowOne, windowRestored, keep, usedBlank, zero, keepRecovered, huge, reloaded]) unused(item, [], locale);
    for (const item of [initial, windowBlank, windowOne, windowRestored, keep, usedBlank, zero, keepRecovered, both, fraction, huge, reloaded]) { expect(item.storage.raw).toEqual(expectedRaw()); expect(item.storage.monitoredWrites).toEqual([]); expect(item.storage.clears).toEqual([]); expect(item.storage.unexpectedRemoves).toEqual([]); expect(item.documentFits).toBe(true); }
    expect(apiCalls).toEqual([]); expect(pageErrors).toEqual([]);
  } finally {
    await testInfo.attach("C67 actual shopping count observations", { body: JSON.stringify({ locale, observations, apiCalls, pageErrors, externalBlocked, finalStorage: await storage(page).catch(error => ({ unavailable: String(error) })), actualURL: page.url(), limits: LIMITS }), contentType: "application/json" });
  }
});
