import { expect, test, type Locator, type Page } from "@playwright/test";
import { CONSENT_VERSION } from "../../lib/consent";

type Locale = "pl" | "en";
type Write = { area: "local" | "session"; kind: "set" | "remove"; key: string; value?: string };
type Probe = { writes: Write[]; snapshot(): { local: Record<string, string | null>; session: Record<string, string | null> } };
type FixtureWindow = typeof window & { __c55Onboarding: Probe };
const ORIGIN = "http://127.0.0.1:43191";
const LOCAL = ["coachfi-user", "coachfi-tokens", "coachfi-srs", "coachfi-lesson-steps", "coachfi-streak", "TEST_C55_UNRELATED"];
const SESSION = ["coachfi-user", "coachfi-tokens", "TEST_C55_UNRELATED"];
const INCOMPLETE = '{"name":"","goal":"","setupDone":false,"fixtureUnknown":"C55-preserved-until-explicit-save"}';
const COPY = {
  pl: { title1: "Witaj w Coach FI", title2: "Jaki jest Twój główny cel finansowy?", label: "Twoje imię", close: "Zamknij wprowadzenie",
    next: "Dalej", finish: "Zaczynamy", skip: "Pomiń teraz", goal: "Oszczędzać więcej co miesiąc", mode: "Zmień tryb" },
  en: { title1: "Welcome to Coach FI 👋", title2: "What's your main financial goal?", label: "Your name", close: "Close onboarding",
    next: "Continue", finish: "Let's go!", skip: "Skip for now", goal: "Save more money each month", mode: "Change mode" },
};
const LIMITS = "Two actual-shell mobile Chrome cases: PL real required-only consent/adult setup then Finish; EN synthetic required consent/adult already set then Skip, not a full2x2 matrix. Fresh Playwright contexts, synthetic guest bytes, fixed UTC clock. Real Radix/DOM focus and keyboard; programmatic names recorded with Playwright ARIA snapshots and role-name matches, persistent label by actual DOM association after typing. Missing baseline Close skips only its unavailable action; observations and remaining Escape/reload/success flow still run and final assertions fail honestly. Six named local keys and three named session keys retain raw snapshots; trace records all product set/remove calls across reload in a test-only session journal. Full removes retained: only source-confirmed local lswt availability probes with canonical two-random-number key and immediate equal-key/value set-remove pairing are excepted outside named keys; monitored or other/unpaired/session removes fail. No screen reader, fullWCAGAA, other locale/dialog, real profile/auth/account, audio/voice/provider/cloud rights/staging/production acceptance.";
test.use({ timezoneId: "UTC" });

async function seed(page: Page, locale: Locale) {
  await page.clock.setFixedTime(new Date("2026-01-01T12:00:00.000Z"));
  await page.addInitScript(({ locale, version, incomplete, localKeys, sessionKeys }) => {
    const nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem, nativeRemove = Storage.prototype.removeItem;
    const marker = "FIXTURE_c55_onboarding_seeded", journal = "FIXTURE_c55_onboarding_write_journal";
    if (!nativeGet.call(sessionStorage, marker)) {
      nativeSet.call(sessionStorage, marker, "true"); const now = new Date().toISOString();
      nativeSet.call(localStorage, "coachfi-locale-v1", locale); nativeSet.call(localStorage, "coachfi-user", incomplete);
      nativeSet.call(localStorage, "coachfi-tokens", "125"); nativeSet.call(localStorage, "coachfi-srs", "[]");
      nativeSet.call(localStorage, "coachfi-lesson-steps", '{"retirement":2}');
      nativeSet.call(localStorage, "coachfi-streak", '{"lastActiveDate":"2026-01-01","currentStreak":1,"longestStreak":1}');
      nativeSet.call(localStorage, "TEST_C55_UNRELATED", "retained");
      nativeSet.call(sessionStorage, "coachfi-user", '{"name":"C55_SESSION","goal":"separate","setupDone":true}');
      nativeSet.call(sessionStorage, "coachfi-tokens", "321"); nativeSet.call(sessionStorage, "TEST_C55_UNRELATED", "session-retained");
      if (locale === "en") {
        nativeSet.call(localStorage, "coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 }));
        nativeSet.call(localStorage, "coachfi-consent-v1", JSON.stringify({ version, acceptedAt: now, termsAccepted: true, privacyAccepted: true,
          optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
      }
      nativeSet.call(sessionStorage, journal, "[]");
    }
    const probe: Probe = { writes: JSON.parse(nativeGet.call(sessionStorage, journal) || "[]") as Write[],
      snapshot: () => ({ local: Object.fromEntries(localKeys.map(key => [key, nativeGet.call(localStorage, key)])),
        session: Object.fromEntries(sessionKeys.map(key => [key, nativeGet.call(sessionStorage, key)])) }) };
    (window as FixtureWindow).__c55Onboarding = probe;
    function record(storage: Storage, write: Omit<Write, "area">) {
      probe.writes.push({ area: storage === localStorage ? "local" : "session", ...write });
      nativeSet.call(sessionStorage, journal, JSON.stringify(probe.writes));
    }
    Storage.prototype.setItem = function (key: string, value: string) { record(this, { kind: "set", key, value }); nativeSet.call(this, key, value); };
    Storage.prototype.removeItem = function (key: string) { record(this, { kind: "remove", key }); nativeRemove.call(this, key); };
  }, { locale, version: CONSENT_VERSION, incomplete: INCOMPLETE, localKeys: LOCAL, sessionKeys: SESSION });
}
async function state(page: Page) {
  return page.evaluate(({ localKeys, sessionKeys }) => {
    const probe = (window as FixtureWindow).__c55Onboarding;
    const monitored = (write: Write) => (write.area === "local" ? localKeys : sessionKeys).includes(write.key);
    // Installed auth-js supportsLocalStorage: key=`lswt-${Math.random()}${Math.random()}`, set(key,key), remove(key).
    // String(Number(part)) equality admits actual JS decimal/exponent forms, excluding arbitrary prefix matches.
    function availabilityKey(key: string) {
      if (!key.startsWith("lswt-")) return false;
      const body = key.slice(5); if (body.length < 2 || body.length > 64) return false;
      const part = (value: string) => { const number = Number(value); return value.length > 0 && Number.isFinite(number) && number >= 0 && number < 1 && String(number) === value; };
      for (let split = 1; split < body.length; split++) if (part(body.slice(0, split)) && part(body.slice(split))) return true;
      return false;
    }
    const availabilityProbeRemoves: Write[] = [], unexpectedRemoves: Write[] = [], pairedSetIndices = new Set<number>();
    probe.writes.forEach((write, index) => {
      if (write.kind !== "remove") return;
      const previous = probe.writes[index - 1];
      const paired = write.area === "local" && !localKeys.includes(write.key) && !sessionKeys.includes(write.key) && availabilityKey(write.key)
        && previous?.kind === "set" && previous.area === "local" && previous.key === write.key && previous.value === write.key && !pairedSetIndices.has(index - 1);
      if (paired) { pairedSetIndices.add(index - 1); availabilityProbeRemoves.push(write); } else unexpectedRemoves.push(write);
    });
    return { ...probe.snapshot(), writes: [...probe.writes], monitoredWrites: probe.writes.filter(monitored),
      removes: probe.writes.filter(write => write.kind === "remove"), monitoredRemoves: probe.writes.filter(write => write.kind === "remove" && monitored(write)),
      availabilityProbeRemoves, unexpectedRemoves };
  }, { localKeys: LOCAL, sessionKeys: SESSION });
}
async function active(page: Page) {
  return page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    return element ? { tag: element.tagName, id: element.id, role: element.getAttribute("role"), ariaLabel: element.getAttribute("aria-label"),
      text: element.textContent?.trim().slice(0, 160), placeholder: element.getAttribute("placeholder"), value: element instanceof HTMLInputElement ? element.value : undefined,
      connected: element.isConnected, insideDialog: !!element.closest('[role="dialog"]') } : null;
  });
}
const dialog = (page: Page, title: string) => page.getByRole("dialog").filter({ hasText: title });
async function tabbableBoundary(page: Page, modal: Locator) {
  const selector = 'button, input, select, textarea, a[href], [tabindex]';
  const endpoints = await modal.evaluate((element, selector) => {
    const list = Array.from(element.querySelectorAll<HTMLElement>(selector)).filter(node => node.tabIndex >= 0 && !node.matches(":disabled") && node.getClientRects().length > 0);
    const describe = (node: HTMLElement | undefined) => node ? { tag: node.tagName, id: node.id, text: node.textContent?.trim(), label: node.getAttribute("aria-label"), placeholder: node.getAttribute("placeholder") } : null;
    list.at(-1)?.focus(); return { count: list.length, first: describe(list[0]), last: describe(list.at(-1)) };
  }, selector);
  await page.keyboard.press("Tab"); const afterTab = await active(page);
  const lastToFirst = await modal.evaluate((element, selector) => {
    const list = Array.from(element.querySelectorAll<HTMLElement>(selector)).filter(node => node.tabIndex >= 0 && !node.matches(":disabled") && node.getClientRects().length > 0);
    const wrapped = !!list.length && document.activeElement === list[0]; list[0]?.focus(); return wrapped;
  }, selector);
  await page.keyboard.press("Shift+Tab"); const afterShiftTab = await active(page);
  const firstToLast = await modal.evaluate((element, selector) => {
    const list = Array.from(element.querySelectorAll<HTMLElement>(selector)).filter(node => node.tabIndex >= 0 && !node.matches(":disabled") && node.getClientRects().length > 0);
    return !!list.length && document.activeElement === list.at(-1);
  }, selector);
  return { endpoints, afterTab, lastToFirst, afterShiftTab, firstToLast };
}
async function stepObservation(page: Page, locale: Locale, step: 1 | 2) {
  const copy = COPY[locale], title = step === 1 ? copy.title1 : copy.title2, modal = dialog(page, title);
  await modal.waitFor({ state: "visible" });
  const initiallyActive = await active(page), aria = await modal.ariaSnapshot();
  const roleNameMatches = await page.getByRole("dialog", { name: title, exact: true }).count();
  const goalStates = step === 2 ? await modal.locator("button[aria-pressed]").evaluateAll(elements => elements.map(element => ({
    text: element.textContent?.trim(), ariaPressed: element.getAttribute("aria-pressed"), active: element === document.activeElement,
  }))) : undefined;
  const initialExpectedFocus = step === 1 ? await modal.locator('input[type="text"]').evaluate(node => node === document.activeElement)
    : await modal.getByRole("button", { name: copy.goal, exact: true }).evaluate(node => node === document.activeElement);
  let field: { id: string; labels: string[]; value: string; placeholder: string; labelVisible: boolean; aria: string } | undefined;
  if (step === 1) {
    const input = modal.locator('input[type="text"]'); await input.fill("  C55 synthetic  ");
    field = { ...await input.evaluate(element => { const node = element as HTMLInputElement; return { id: node.id, labels: Array.from(node.labels ?? []).map(label => label.textContent?.trim() ?? ""),
      value: node.value, placeholder: node.placeholder, labelVisible: Array.from(node.labels ?? []).some(label => label.getClientRects().length > 0 && getComputedStyle(label).visibility !== "hidden") }; }), aria: await input.ariaSnapshot() };
  }
  const boundaries = await tabbableBoundary(page, modal);
  const geometry = await modal.evaluate(element => { const rect = element.getBoundingClientRect(); return { left: rect.left, right: rect.right, width: rect.width,
    viewport: innerWidth, documentFits: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1 }; });
  return { step, title, aria, roleNameMatches, initiallyActive, initialExpectedFocus, goalStates, field, boundaries, geometry, storage: await state(page) };
}
async function moveToStepTwo(page: Page, locale: Locale) {
  const copy = COPY[locale], field = dialog(page, copy.title1).locator('input[type="text"]');
  await field.fill("  C55 synthetic  "); await field.focus(); await page.keyboard.press("Enter");
  await dialog(page, copy.title2).getByRole("button", { name: copy.goal, exact: true }).waitFor({ state: "visible" });
}
async function modeFocused(page: Page, locale: Locale) {
  return page.getByRole("button", { name: COPY[locale].mode, exact: true, includeHidden: true }).evaluate(node => node.isConnected && node === document.activeElement);
}
async function reloadIncomplete(page: Page, locale: Locale) {
  await page.reload(); const modal = dialog(page, COPY[locale].title1); await modal.locator('input[type="text"]').waitFor({ state: "visible" });
  return { visible: await modal.isVisible(), active: await active(page), storage: await state(page) };
}

for (const locale of ["pl", "en"] as const) {
  test("onboarding " + locale + (locale === "pl" ? " actual consent adult and Finish" : " preset consent adult and Skip") + " native mobile dialog contract", async ({ page, context }, testInfo) => {
    const copy = COPY[locale], apiCalls: string[] = [], pageErrors: string[] = []; let externalBlocked = 0;
    const observations: Record<string, unknown> = {};
    context.on("request", request => { const url = new URL(request.url()); if (url.pathname.startsWith("/api/")) apiCalls.push(url.pathname); });
    page.on("pageerror", error => pageErrors.push(error.message));
    await context.route("**/*", route => { const url = new URL(route.request().url());
      if (url.origin === ORIGIN && !url.pathname.startsWith("/api/")) return route.continue();
      if (url.origin !== ORIGIN) externalBlocked++; return route.abort(); });
    await page.setViewportSize({ width: 375, height: 812 }); await seed(page, locale);
    try {
      await page.goto("/"); await page.locator(".app-shell > header").waitFor({ state: "visible" });
      if (locale === "pl") {
        const accept = page.getByRole("button", { name: "Akceptuj wymagane", exact: true }); await accept.focus(); await page.keyboard.press("Enter");
        const age = page.getByRole("dialog", { name: "Witaj w Coach FI", exact: true }); await age.waitFor({ state: "visible" });
        const adult = age.getByRole("checkbox", { name: "Mam ukończone 18 lat.", exact: true }); await adult.focus(); await page.keyboard.press("Space");
        const enter = age.getByRole("button", { name: "Kontynuuj jako osoba dorosła", exact: true }); await enter.focus(); await page.keyboard.press("Enter");
      }
      const firstModal = dialog(page, copy.title1); await firstModal.locator('input[type="text"]').waitFor({ state: "visible" });
      const before = await state(page); observations.before = before;
      const first = await stepObservation(page, locale, 1); observations.step1 = first;
      // A missing baseline Close is an observed failure, not a locator/setup exception.
      const close = firstModal.getByRole("button", { name: copy.close, exact: true }), closePresent = await close.count() === 1;
      if (closePresent) { await close.focus(); await page.keyboard.press("Enter"); await firstModal.waitFor({ state: "hidden", timeout: 2_000 }).catch(() => undefined); }
      const closeResult = { present: closePresent, closed: !await firstModal.isVisible(), active: await active(page), modeFocused: await modeFocused(page, locale), storage: await state(page) };
      observations.close = closeResult;
      observations.afterCloseReload = await reloadIncomplete(page, locale);
      await moveToStepTwo(page, locale); const second = await stepObservation(page, locale, 2); observations.step2 = second;
      // Pointer target is the outer overlay, never a background navigation/control or a submit button.
      await page.mouse.click(1, 1); const outside = { remainedOpen: await dialog(page, copy.title2).isVisible(), storage: await state(page) }; observations.outside = outside;
      await dialog(page, copy.title2).getByRole("button", { name: copy.goal, exact: true }).focus(); await page.keyboard.press("Escape");
      await dialog(page, copy.title2).waitFor({ state: "hidden", timeout: 2_000 }).catch(() => undefined);
      const escaped = { closed: !await dialog(page, copy.title2).isVisible(), active: await active(page), modeFocused: await modeFocused(page, locale), storage: await state(page) };
      observations.escape = escaped;
      const reopened = await reloadIncomplete(page, locale); observations.afterEscapeReload = reopened;
      const beforeSuccess = await state(page); observations.beforeExplicitSuccess = beforeSuccess;
      if (locale === "pl") {
        await moveToStepTwo(page, locale); const goal = dialog(page, copy.title2).getByRole("button", { name: copy.goal, exact: true });
        await goal.focus(); await page.keyboard.press("Space"); const finish = dialog(page, copy.title2).getByRole("button", { name: copy.finish, exact: true });
        await finish.focus(); await page.keyboard.press("Enter");
      } else { const skip = dialog(page, copy.title1).getByRole("button", { name: copy.skip, exact: true }); await skip.focus(); await page.keyboard.press("Enter"); }
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      const success = { modeFocused: await modeFocused(page, locale), active: await active(page), storage: await state(page) }; observations.success = success;
      await page.reload(); await page.locator(".app-shell > header").waitFor({ state: "visible" });
      const final = await state(page), completedReopens = await dialog(page, copy.title1).isVisible(); observations.completedReload = { reopens: completedReopens, storage: final };
      const policy = await page.evaluate(() => ({ consent: JSON.parse(localStorage.getItem("coachfi-consent-v1")!), mode: JSON.parse(localStorage.getItem("coachfi-mode-v1")!) })); observations.policy = policy;
      // All native observations above exist before the first accessibility assertion.
      for (const step of [first, second]) {
        if (step.step === 2) { expect(step.goalStates).toHaveLength(6); expect(step.goalStates?.map(goal => goal.ariaPressed)).toEqual(Array(6).fill("false")); }
        expect(step.roleNameMatches, "actual computed dialog name at step " + step.step).toBe(1); expect(step.initialExpectedFocus, "native initial focus at step " + step.step).toBe(true);
        expect(step.boundaries.endpoints.count).toBeGreaterThan(1); expect(step.boundaries.lastToFirst, "Tab wraps step " + step.step).toBe(true);
        expect(step.boundaries.firstToLast, "Shift+Tab wraps step " + step.step).toBe(true);
        expect(step.boundaries.afterTab?.insideDialog).toBe(true); expect(step.boundaries.afterShiftTab?.insideDialog).toBe(true);
        expect(step.geometry.documentFits).toBe(true); expect(step.geometry.left).toBeGreaterThanOrEqual(-1); expect(step.geometry.right).toBeLessThanOrEqual(376);
      }
      expect(first.field?.labels).toEqual([copy.label]); expect(first.field?.labelVisible).toBe(true); expect(first.field?.id).not.toBe("");
      expect(first.field?.value).toBe("  C55 synthetic  "); expect(first.field?.aria).toContain(copy.label); // Placeholder fallback may already name baseline; no empty-name assertion.
      expect(closeResult.present).toBe(true); expect(closeResult.closed).toBe(true); expect(closeResult.modeFocused).toBe(true);
      expect(escaped.closed).toBe(true); expect(escaped.modeFocused).toBe(true); expect(reopened.visible).toBe(true); expect(outside.remainedOpen).toBe(true);
      for (const snapshot of [before, first.storage, second.storage, closeResult.storage, outside.storage, escaped.storage, reopened.storage, beforeSuccess]) {
        expect(snapshot.local).toEqual(before.local); expect(snapshot.session).toEqual(before.session); expect(snapshot.monitoredWrites).toEqual([]); expect(snapshot.monitoredRemoves).toEqual([]); expect(snapshot.unexpectedRemoves).toEqual([]);
      }
      const profile = { name: locale === "pl" ? "C55 synthetic" : "", goal: locale === "pl" ? copy.goal : "", setupDone: true };
      for (const snapshot of [success.storage, final]) {
        expect(snapshot.local).toEqual({ ...before.local, "coachfi-user": JSON.stringify(profile) }); expect(snapshot.session).toEqual(before.session);
        expect(snapshot.monitoredWrites).toEqual([{ area: "local", kind: "set", key: "coachfi-user", value: JSON.stringify(profile) }]); expect(snapshot.monitoredRemoves).toEqual([]); expect(snapshot.unexpectedRemoves).toEqual([]); expect(snapshot.local["coachfi-tokens"]).toBe("125");
      }
      expect(success.modeFocused).toBe(true); expect(completedReopens).toBe(false);
      expect(policy.mode).toMatchObject({ mode: "adult", adultAgeRequirement: 18 }); expect(policy.consent).toMatchObject({ version: CONSENT_VERSION, termsAccepted: true, privacyAccepted: true,
        optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } });
      expect(apiCalls).toEqual([]); expect(pageErrors).toEqual([]);
    } finally {
      observations.finalAttemptState = await state(page).catch(error => ({ unavailable: String(error) }));
      await testInfo.attach("C55 synthetic onboarding native observations", { body: JSON.stringify({ locale, branch: locale === "pl" ? "actual consent/adult then Finish" : "preset consent/adult then Skip",
        apiCalls, pageErrors, externalBlocked, observations, limits: LIMITS }), contentType: "application/json" });
    }
  });
}
