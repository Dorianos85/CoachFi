import { expect, test, type Locator, type Page } from "@playwright/test";
import { CONSENT_VERSION } from "../../lib/consent";

type Locale = "pl" | "en";
type Branch = "required-save-handoff" | "optional-close";
type Write = { area: "local" | "session"; kind: "set" | "remove" | "clear"; key: string; value?: string };
type Raw = { local: Record<string, string | null>; session: Record<string, string | null> };
type Probe = { writes: Write[]; snapshot(): Raw; priorTrigger: HTMLElement | null };
type FixtureWindow = typeof window & { __c58Consent: Probe };
const ORIGIN = "http://127.0.0.1:43191";
const NOW = "2026-10-19T12:00:00.000Z";
const LOCAL = ["coachfi-consent-v1", "coachfi-mode-v1", "coachfi-user", "coachfi-tokens", "coachfi-srs", "coachfi-lesson-steps", "coachfi-streak", "TEST_C58_UNRELATED"];
const SESSION = ["coachfi-consent-v1", "coachfi-user", "coachfi-tokens", "coachfi-srs", "TEST_C58_UNRELATED"];
const OPTIONAL_OFF = { aiCoach: false, voice: false, leaderboard: false, blockchain: false };
const NEW_CONSENT = JSON.stringify({ version: CONSENT_VERSION, acceptedAt: NOW, termsAccepted: true, privacyAccepted: true, optional: OPTIONAL_OFF });
const PRESET_CONSENT = "  " + JSON.stringify({ version: CONSENT_VERSION, acceptedAt: NOW, termsAccepted: true, privacyAccepted: true, optional: OPTIONAL_OFF, fixtureExtra: "C58-preserve-raw" }) + "\n";
const PRESET_MODE = ' {"mode":"adult","selectedAt":"2026-10-19T12:00:00.000Z","adultConfirmedAt":"2026-10-19T12:00:00.000Z","adultAgeRequirement":18} ';
const INCOMPLETE_USER = ' {"name":"C58 synthetic","goal":"preserve","setupDone":false,"fixtureExtra":"raw-incomplete"} ';
const COMPLETE_USER = ' {"name":"C58 synthetic","goal":"preserve","setupDone":true,"fixtureExtra":"raw-complete"} ';
const COPY = {
  pl: { trigger: "Zgody", title: "Zasady korzystania z Coach FI", description: "Zgody opcjonalne zaczynają się od wyłączonych. Zewnętrzne AI i rozmowy głosowe są w tej wersji wyłączone; zaznaczenie zgody ich nie uruchamia. Lokalny czat tekstowy jest dostępny.",
    required: "Akceptuję Regulamin i Politykę prywatności", save: "Zapisz ustawienia", close: "Zamknij ustawienia zgód", ageTitle: "Witaj w Coach FI",
    ageDescription: "Ta wersja jest przeznaczona dla osób, które ukończyły 18 lat. Ucz się przez krótkie lekcje, quizy i małe codzienne działania.", age: "Mam ukończone 18 lat.", enter: "Kontynuuj jako osoba dorosła" },
  en: { trigger: "Consents", title: "Coach FI terms of use", description: "Optional permissions start off. External AI and live voice are disabled in this version; selecting permission does not activate them. Local text chat remains available.",
    required: "I accept the Terms and Privacy Policy", save: "Save settings", close: "Close consent settings", ageTitle: "Welcome to Coach FI",
    ageDescription: "This release is for people aged 18 and over. Learn with short lessons, quizzes and small daily actions.", age: "I am at least 18 years old.", enter: "Continue as an adult" },
};
const LIMITS = "Four actual-shell mobile Chrome cases: PL/EN times required modal Save into forced ModeGate and valid-required/adult/setup optional settings Close. The C56 focus and IDREF concerns remain hypotheses until native observations; four passing cases justify no patch. Current consent version, fixed UTC synthetic guest data, fresh browser contexts. The persistent footer trigger is used, not the disappearing banner. Initial focus is captured after the old consent dialog has detached and before keyboard containment probes manipulate focus. Each actual IDREF token, native role-name match, accessible-description matcher result, DOM labels and ARIA snapshot are recorded independently. A dangling reference is distinct from an absent computed description. All observations precede normative assertions. Eight named local/five named session raw keys have exact expected snapshots and scoped write assertions; full set/remove/clear journal retained. All clears and arbitrary/session/unpaired removes fail; only canonical immediate paired source-confirmed local lswt capability probes outside named keys are excepted. Other-key set calls are recorded, not represented as a full storage audit. API requests are counted and blocked, other external requests blocked and counted, not total-network-zero. No AcceptAll, optional opt-in, adult completion, provider, AI or voice action. No screenshot, trace, real profile, screen reader, full AA, desktop, other dialogs/locales, backend consent, real auth, cloud, staging or production acceptance.";
test.use({ timezoneId: "UTC" });

function expectedRaw(branch: Branch): Raw {
  return {
    local: { "coachfi-consent-v1": branch === "optional-close" ? PRESET_CONSENT : null,
      "coachfi-mode-v1": branch === "optional-close" ? PRESET_MODE : null,
      "coachfi-user": branch === "optional-close" ? COMPLETE_USER : INCOMPLETE_USER,
      "coachfi-tokens": "125", "coachfi-srs": ' [ {"id":"inflation","nextReview":"2026-10-20T12:00:00.000Z","interval":1,"ease":2.5,"repetitions":0} ] ',
      "coachfi-lesson-steps": ' {"retirement":2} ', "coachfi-streak": ' {"lastActiveDate":"2026-10-19","currentStreak":3,"longestStreak":7} ', "TEST_C58_UNRELATED": "C58-local-retained" },
    session: { "coachfi-consent-v1": "C58-session-consent-not-authoritative", "coachfi-user": '{"name":"C58_SESSION","goal":"separate","setupDone":true}',
      "coachfi-tokens": "321", "coachfi-srs": " [] ", "TEST_C58_UNRELATED": "C58-session-retained" },
  };
}

async function seed(page: Page, locale: Locale, branch: Branch) {
  await page.clock.setFixedTime(new Date(NOW));
  await page.addInitScript(({ locale, raw, localKeys, sessionKeys }) => {
    const nativeGet = Storage.prototype.getItem, nativeSet = Storage.prototype.setItem, nativeRemove = Storage.prototype.removeItem, nativeClear = Storage.prototype.clear;
    const marker = "FIXTURE_c58_consent_seeded", journal = "FIXTURE_c58_consent_write_journal";
    if (!nativeGet.call(sessionStorage, marker)) {
      nativeSet.call(sessionStorage, marker, "true");
      nativeSet.call(localStorage, "coachfi-locale-v1", locale);
      for (const [key, value] of Object.entries(raw.local)) if (value !== null) nativeSet.call(localStorage, key, value);
      for (const [key, value] of Object.entries(raw.session)) if (value !== null) nativeSet.call(sessionStorage, key, value);
      nativeSet.call(sessionStorage, journal, "[]");
    }
    const probe: Probe = { writes: JSON.parse(nativeGet.call(sessionStorage, journal) || "[]") as Write[], priorTrigger: null,
      snapshot: () => ({ local: Object.fromEntries(localKeys.map(key => [key, nativeGet.call(localStorage, key)])),
        session: Object.fromEntries(sessionKeys.map(key => [key, nativeGet.call(sessionStorage, key)])) }) };
    (window as FixtureWindow).__c58Consent = probe;
    function record(storage: Storage, write: Omit<Write, "area">) {
      probe.writes.push({ area: storage === localStorage ? "local" : "session", ...write });
      nativeSet.call(sessionStorage, journal, JSON.stringify(probe.writes));
    }
    Storage.prototype.setItem = function (key: string, value: string) { record(this, { kind: "set", key: String(key), value: String(value) }); nativeSet.call(this, key, value); };
    Storage.prototype.removeItem = function (key: string) { record(this, { kind: "remove", key: String(key) }); nativeRemove.call(this, key); };
    Storage.prototype.clear = function () { record(this, { kind: "clear", key: "*" }); nativeClear.call(this); };
  }, { locale, raw: expectedRaw(branch), localKeys: LOCAL, sessionKeys: SESSION });
}

async function storageState(page: Page) {
  return page.evaluate(({ localKeys, sessionKeys }) => {
    const probe = (window as FixtureWindow).__c58Consent;
    const monitored = (write: Write) => (write.area === "local" ? localKeys : sessionKeys).includes(write.key);
    // auth-js supportsLocalStorage uses `lswt-${Math.random()}${Math.random()}`, set(key,key), remove(key).
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
      removes: probe.writes.filter(write => write.kind === "remove"), clears: probe.writes.filter(write => write.kind === "clear"),
      monitoredRemoves: probe.writes.filter(write => write.kind === "remove" && monitored(write)), availabilityProbeRemoves, unexpectedRemoves };
  }, { localKeys: LOCAL, sessionKeys: SESSION });
}

async function active(page: Page) {
  return page.evaluate(() => {
    const node = document.activeElement as HTMLElement | null;
    return node ? { tag: node.tagName, id: node.id, role: node.getAttribute("role"), ariaLabel: node.getAttribute("aria-label"),
      text: node.textContent?.trim().slice(0, 200), type: node.getAttribute("type"), checked: node instanceof HTMLInputElement ? node.checked : undefined,
      connected: node.isConnected, insideDialog: !!node.closest('[role="dialog"]') } : null;
  });
}
async function settle(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}
async function visible(modal: Locator) {
  await modal.waitFor({ state: "visible", timeout: 5_000 }).catch(() => undefined);
  return await modal.count() === 1 && await modal.isVisible();
}
async function detached(modal: Locator) {
  await modal.waitFor({ state: "detached", timeout: 5_000 }).catch(() => undefined);
  return await modal.count() === 0;
}

async function tabbableBoundary(page: Page, modal: Locator) {
  const selector = 'button, input, select, textarea, a[href], [tabindex]';
  const endpoints = await modal.evaluate((element, selector) => {
    const list = Array.from(element.querySelectorAll<HTMLElement>(selector)).filter(node => node.tabIndex >= 0 && !node.matches(":disabled") && node.getClientRects().length > 0);
    const describe = (node: HTMLElement | undefined) => node ? { tag: node.tagName, id: node.id, text: node.textContent?.trim(), ariaLabel: node.getAttribute("aria-label"), type: node.getAttribute("type") } : null;
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

async function dialogObservation(page: Page, modal: Locator, title: string, description: string) {
  // No role-name locator gates this observation: a broken computed name remains a final assertion failure.
  const initiallyActive = await active(page);
  const dom = await modal.evaluate(element => {
    const normalize = (value: string | null | undefined) => (value ?? "").replace(/\s+/g, " ").trim();
    const refs = (attribute: string) => ({ attribute, raw: element.getAttribute(attribute), tokens: (element.getAttribute(attribute) ?? "").split(/\s+/).filter(Boolean).map(token => {
      const matches = Array.from(document.querySelectorAll<HTMLElement>("[id]")).filter(node => node.id === token);
      return { token, matchCount: matches.length, targets: matches.map(node => ({ tag: node.tagName, text: normalize(node.textContent),
        visible: node.getClientRects().length > 0 && getComputedStyle(node).visibility !== "hidden", insideDialog: element.contains(node) })) };
    }) });
    const rect = element.getBoundingClientRect();
    return { role: element.getAttribute("role"), ariaModal: element.getAttribute("aria-modal"), dataState: element.getAttribute("data-state"),
      idrefs: [refs("aria-labelledby"), refs("aria-describedby")], headingTexts: Array.from(element.querySelectorAll("h1,h2,h3,[role=heading]")).map(node => normalize(node.textContent)),
      paragraphs: Array.from(element.querySelectorAll("p")).map(node => normalize(node.textContent)),
      geometry: { left: rect.left, right: rect.right, width: rect.width, viewport: innerWidth, documentFits: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1 } };
  });
  let accessibleDescriptionMatches = true, descriptionError: string | null = null;
  try { await expect(modal).toHaveAccessibleDescription(description, { timeout: 1_000 }); }
  catch (error) { accessibleDescriptionMatches = false; descriptionError = String(error); }
  return { initiallyActive, dom, aria: await modal.ariaSnapshot(), roleNameMatches: await page.getByRole("dialog", { name: title, exact: true }).count(),
    headingMatches: await modal.getByRole("heading", { name: title, exact: true }).count(), accessibleDescriptionMatches, descriptionError };
}

function assertDialog(observation: Awaited<ReturnType<typeof dialogObservation>>, title: string, description: string) {
  expect(observation.roleNameMatches, "actual computed dialog name").toBe(1);
  expect(observation.headingMatches, "one semantic dialog title").toBe(1);
  expect(observation.dom.headingTexts.filter(text => text === title)).toHaveLength(1);
  expect(observation.dom.paragraphs.filter(text => text === description)).toHaveLength(1);
  expect(observation.accessibleDescriptionMatches, observation.descriptionError ?? "actual accessible description").toBe(true);
  expect(observation.dom.ariaModal).toBe("true");
  for (const reference of observation.dom.idrefs) {
    expect(reference.tokens.length, reference.attribute + " has a real IDREF").toBeGreaterThan(0);
    for (const token of reference.tokens) {
      expect(token.matchCount, reference.attribute + " token " + token.token + " resolves exactly once").toBe(1);
      expect(token.targets[0]?.text.length, "nonempty IDREF target " + token.token).toBeGreaterThan(0);
      expect(token.targets[0]?.visible).toBe(true);
      expect(token.targets[0]?.insideDialog).toBe(true);
    }
  }
  expect(observation.dom.geometry.documentFits).toBe(true);
  expect(observation.dom.geometry.left).toBeGreaterThanOrEqual(-1);
  expect(observation.dom.geometry.right).toBeLessThanOrEqual(376);
}
function assertBoundary(boundary: Awaited<ReturnType<typeof tabbableBoundary>>) {
  expect(boundary.endpoints.count).toBeGreaterThan(0);
  expect(boundary.lastToFirst, "Tab wraps inside dialog").toBe(true);
  expect(boundary.firstToLast, "Shift+Tab wraps inside dialog").toBe(true);
  expect(boundary.afterTab?.insideDialog).toBe(true);
  expect(boundary.afterShiftTab?.insideDialog).toBe(true);
}

for (const locale of ["pl", "en"] as const) {
  for (const branch of ["required-save-handoff", "optional-close"] as const) {
    test("consent " + locale + " " + branch + " native mobile dialog contract", async ({ page, context }, testInfo) => {
      const copy = COPY[locale], apiCalls: string[] = [], pageErrors: string[] = [], observations: Record<string, unknown> = {};
      let externalBlocked = 0;
      context.on("request", request => { const url = new URL(request.url()); if (url.pathname.startsWith("/api/")) apiCalls.push(url.pathname); });
      page.on("pageerror", error => pageErrors.push(error.message));
      await context.route("**/*", route => { const url = new URL(route.request().url());
        if (url.origin === ORIGIN && !url.pathname.startsWith("/api/")) return route.continue();
        if (url.origin !== ORIGIN) externalBlocked++; return route.abort(); });
      await page.setViewportSize({ width: 375, height: 812 }); await seed(page, locale, branch);
      try {
        await page.goto("/"); await page.locator(".app-shell > header").waitFor({ state: "visible" }); await settle(page);
        const before = await storageState(page), beforeExplicitAction = [before]; observations.before = before;
        const trigger = page.getByRole("button", { name: copy.trigger, exact: true });
        const triggerCount = await trigger.count(); observations.triggerCount = triggerCount;
        if (triggerCount === 1) {
          await trigger.focus();
          observations.priorTrigger = { active: await active(page), focused: await trigger.evaluate(node => {
            (window as FixtureWindow).__c58Consent.priorTrigger = node as HTMLElement;
            return node.isConnected && node === document.activeElement;
          }) };
          await page.keyboard.press("Enter");
        }
        const modal = page.locator('section[role="dialog"]');
        const consentPresent = await visible(modal); observations.consentPresent = consentPresent;
        let consentObservation: Awaited<ReturnType<typeof dialogObservation>> | null = null;
        let consentBoundary: Awaited<ReturnType<typeof tabbableBoundary>> | null = null;
        let checkbox: { checked: boolean; disabled: boolean; labels: string[]; aria: string; namedMatches: number } | null = null;
        let optionalStates: { text: string; pressed: string | null }[] = [], saveInitiallyEnabled = false;
        let oldDetached = false, actionPresent = false, agePresent = false, requiredAfterToggle: boolean | null = null, saveAfterToggleEnabled = false;
        let ageObservation: Awaited<ReturnType<typeof dialogObservation>> | null = null;
        let ageBoundary: Awaited<ReturnType<typeof tabbableBoundary>> | null = null;
        let ageFocus: { active: Awaited<ReturnType<typeof active>>; checkboxFocused: boolean; checked: boolean; enterEnabled: boolean; namedMatches: number } | null = null;
        let restored: { active: Awaited<ReturnType<typeof active>>; priorConnected: boolean; priorIsActive: boolean; openDialogs: number } | null = null;
        if (consentPresent) {
          consentObservation = await dialogObservation(page, modal, copy.title, copy.description); observations.consent = consentObservation;
          const required = modal.locator('input[type="checkbox"]'), save = modal.getByRole("button", { name: copy.save, exact: true });
          checkbox = { ...await required.evaluate(element => { const input = element as HTMLInputElement; return { checked: input.checked, disabled: input.disabled,
            labels: Array.from(input.labels ?? []).map(label => label.textContent?.replace(/\s+/g, " ").trim() ?? "") }; }), aria: await required.ariaSnapshot(),
            namedMatches: await modal.getByRole("checkbox", { name: new RegExp(copy.required) }).count() };
          optionalStates = await modal.locator("button[aria-pressed]").evaluateAll(elements => elements.map(node => ({ text: node.textContent?.trim() ?? "", pressed: node.getAttribute("aria-pressed") })));
          saveInitiallyEnabled = await save.isEnabled();
          const controlsStorage = await storageState(page); beforeExplicitAction.push(controlsStorage);
          observations.consentControls = { checkbox, optionalStates, saveInitiallyEnabled, storage: controlsStorage };
          consentBoundary = await tabbableBoundary(page, modal); observations.consentBoundaries = consentBoundary;
          if (branch === "required-save-handoff") {
            if (!checkbox.disabled) { await required.focus(); await page.keyboard.press("Space"); }
            requiredAfterToggle = await required.isChecked(); saveAfterToggleEnabled = await save.isEnabled();
            actionPresent = await save.count() === 1 && saveAfterToggleEnabled;
            const beforeSaveStorage = await storageState(page); beforeExplicitAction.push(beforeSaveStorage);
            observations.beforeSave = { requiredAfterToggle, saveAfterToggleEnabled, storage: beforeSaveStorage };
            if (actionPresent) { await save.focus(); await page.keyboard.press("Enter"); }
            oldDetached = await detached(modal);
            const age = page.locator('div[role="dialog"][data-state="open"]'); agePresent = await visible(age);
            await settle(page);
            // Capture the unmodified handoff BEFORE either observation or Tab boundary code focuses an element.
            if (agePresent) {
              const ageCheckbox = age.locator('input[type="checkbox"]');
              ageFocus = { active: await active(page), ...await ageCheckbox.evaluate(node => ({ checkboxFocused: node === document.activeElement, checked: (node as HTMLInputElement).checked })),
                enterEnabled: await age.getByRole("button", { name: copy.enter, exact: true }).isEnabled(),
                namedMatches: await age.getByRole("checkbox", { name: copy.age, exact: true }).count() };
              observations.handoffFocusBeforeTab = { oldDetached, agePresent, ...ageFocus };
              ageObservation = await dialogObservation(page, age, copy.ageTitle, copy.ageDescription); observations.ageDialog = ageObservation;
              ageBoundary = await tabbableBoundary(page, age); observations.ageBoundaries = ageBoundary;
            } else observations.handoffFocusBeforeTab = { oldDetached, agePresent, active: await active(page) };
          } else {
            const close = modal.getByRole("button", { name: copy.close, exact: true }); actionPresent = await close.count() === 1;
            if (actionPresent) { await close.focus(); await page.keyboard.press("Enter"); }
            oldDetached = await detached(modal); await settle(page);
            restored = { active: await active(page), ...await page.evaluate(() => {
              const prior = (window as FixtureWindow).__c58Consent.priorTrigger;
              return { priorConnected: !!prior?.isConnected, priorIsActive: prior === document.activeElement,
                openDialogs: document.querySelectorAll('[role="dialog"][data-state="open"]').length };
            }) };
            observations.closeFocusBeforeTab = { oldDetached, actionPresent, ...restored };
          }
        }
        const after = await storageState(page); observations.after = after;
        observations.flow = { actionPresent, oldDetached, agePresent, requiredAfterToggle, saveAfterToggleEnabled };
        observations.networkAtAssertions = { apiCalls: [...apiCalls], pageErrors: [...pageErrors], externalBlocked };
        // Every available name/IDREF/focus/keyboard/control/storage observation above is retained before primary assertions.
        for (const snapshot of beforeExplicitAction) {
          expect(snapshot.local).toEqual(expectedRaw(branch).local); expect(snapshot.session).toEqual(expectedRaw(branch).session);
          expect(snapshot.monitoredWrites).toEqual([]); expect(snapshot.clears).toEqual([]); expect(snapshot.unexpectedRemoves).toEqual([]);
        }
        expect(triggerCount).toBe(1); expect((observations.priorTrigger as { focused: boolean } | undefined)?.focused).toBe(true);
        expect(consentPresent).toBe(true); expect(consentObservation).not.toBeNull(); expect(consentBoundary).not.toBeNull();
        if (consentObservation) assertDialog(consentObservation, copy.title, copy.description);
        expect(consentObservation?.initiallyActive?.insideDialog, "consent dialog initially contains focus").toBe(true);
        if (consentBoundary) assertBoundary(consentBoundary);
        expect(checkbox?.namedMatches).toBe(1); expect(checkbox?.labels.some(label => label.includes(copy.required))).toBe(true);
        expect(checkbox?.checked).toBe(branch === "optional-close"); expect(checkbox?.disabled).toBe(branch === "optional-close");
        expect(saveInitiallyEnabled).toBe(branch === "optional-close");
        expect(optionalStates).toHaveLength(4); expect(optionalStates.map(option => option.pressed)).toEqual(["false", "false", "false", "false"]);
        expect(actionPresent).toBe(true); expect(oldDetached).toBe(true);
        if (branch === "required-save-handoff") {
          expect(requiredAfterToggle).toBe(true); expect(saveAfterToggleEnabled).toBe(true); expect(agePresent).toBe(true);
          expect(ageFocus?.checkboxFocused, "new forced age checkbox owns focus after consent unmount").toBe(true);
          expect(ageFocus?.checked).toBe(false); expect(ageFocus?.enterEnabled).toBe(false); expect(ageFocus?.namedMatches).toBe(1);
          expect(ageObservation).not.toBeNull(); expect(ageBoundary).not.toBeNull();
          if (ageObservation) assertDialog(ageObservation, copy.ageTitle, copy.ageDescription);
          if (ageBoundary) assertBoundary(ageBoundary);
          expect(after.local).toEqual({ ...expectedRaw(branch).local, "coachfi-consent-v1": NEW_CONSENT });
          expect(after.monitoredWrites).toEqual([{ area: "local", kind: "set", key: "coachfi-consent-v1", value: NEW_CONSENT }]);
        } else {
          expect(restored?.priorConnected).toBe(true); expect(restored?.priorIsActive, "same persistent footer trigger regains focus").toBe(true);
          expect(restored?.openDialogs).toBe(0); expect(after.local).toEqual(expectedRaw(branch).local); expect(after.monitoredWrites).toEqual([]);
        }
        expect(after.session).toEqual(expectedRaw(branch).session); expect(after.local["coachfi-tokens"]).toBe("125");
        for (const snapshot of [before, after]) { expect(snapshot.clears).toEqual([]); expect(snapshot.monitoredRemoves).toEqual([]); expect(snapshot.unexpectedRemoves).toEqual([]); }
        expect(apiCalls).toEqual([]); expect(pageErrors).toEqual([]);
      } finally {
        observations.finalAttemptState = await storageState(page).catch(error => ({ unavailable: String(error) }));
        await testInfo.attach("C58 synthetic consent native observations", { body: JSON.stringify({ locale, branch, fixedUTC: NOW, consentVersion: CONSENT_VERSION,
          apiCalls, pageErrors, externalBlocked, observations, limits: LIMITS }), contentType: "application/json" });
      }
    });
  }
}
