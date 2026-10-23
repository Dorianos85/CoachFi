import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

type Effect = () => void | (() => void);
const fixture = vi.hoisted(() => ({
  locale: "pl" as "pl" | "en", translations: {} as Record<string, unknown>,
  slot: 0, dirty: false, values: new Map<number, unknown>(),
  deps: new Map<number, readonly unknown[] | undefined>(),
  effects: [] as Array<{ slot: number; callback: Effect }>, cleanups: new Map<number, () => void>(),
  notify: vi.fn(),
}));
const same = (a?: readonly unknown[], b?: readonly unknown[]) =>
  !!a && !!b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  const effect = (callback: Effect, deps?: readonly unknown[]) => {
    const slot = fixture.slot++;
    if (!fixture.deps.has(slot) || !same(fixture.deps.get(slot), deps)) fixture.effects.push({ slot, callback });
    fixture.deps.set(slot, deps);
  };
  return { ...actual,
    useState: (initial: unknown) => {
      const slot = fixture.slot++;
      if (!fixture.values.has(slot)) fixture.values.set(slot, typeof initial === "function" ? initial() : initial);
      return [fixture.values.get(slot), (value: unknown) => {
        const old = fixture.values.get(slot), next = typeof value === "function" ? value(old) : value;
        fixture.values.set(slot, next); if (!Object.is(old, next)) fixture.dirty = true;
      }];
    },
    useMemo: (factory: () => unknown, deps?: readonly unknown[]) => {
      const slot = fixture.slot++;
      if (!fixture.values.has(slot) || !same(fixture.deps.get(slot), deps)) fixture.values.set(slot, factory());
      fixture.deps.set(slot, deps); return fixture.values.get(slot);
    },
    useLayoutEffect: effect, useEffect: effect,
    useSyncExternalStore: (_subscribe: unknown, getSnapshot: () => unknown) => getSnapshot(),
  };
});
vi.mock("@/context/LanguageContext", () => ({ useLanguage: () => ({ locale: fixture.locale, t: fixture.translations[fixture.locale] }) }));
vi.mock("@/components/VoiceButton", () => ({ VoiceButton: function VoiceButtonMarker() { return null; } }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: fixture.notify }));

const LIMITS = "Actual home/accessibility components and emitted simulator handlers; real i18n/Intl, strict getHealthCheck, consent and product-storage owner leases. Explicit persistent state/memo/layout-effect emulator; useSyncExternalStore is a snapshot-only adapter. Only the home's pure private simulator/slider/result/chart functions are expanded; other child components and VoiceButton remain unexecuted element markers. Synthetic separate local/session Maps and rejecting fetch. No ReactDOM, browser, native focus/accessibility, provider, audio, real profile, cloud, transaction or deployment acceptance. No scientific validation of the existing score heuristic.";
const PRIVATE_FUNCTIONS = new Set(["DecisionSimulator", "SliderControl", "ResultTile", "GrowthChart"]);
type Tree = { type: unknown; props: Record<string, unknown>; children: Array<Tree | string> };
function expand(node: ReactNode): Array<Tree | string> {
  if (node === null || node === undefined || typeof node === "boolean") return [];
  if (Array.isArray(node)) return node.flatMap(expand);
  if (typeof node === "string" || typeof node === "number") return [String(node)];
  if (!isValidElement(node)) return [];
  const element = node as ReactElement<Record<string, unknown>>;
  if (typeof element.type === "function" && PRIVATE_FUNCTIONS.has(element.type.name))
    return expand((element.type as (props: Record<string, unknown>) => ReactNode)(element.props));
  return [{ type: element.type, props: element.props, children: expand(element.props.children as ReactNode) }];
}
function nodes(tree: Array<Tree | string>, predicate: (node: Tree) => boolean): Tree[] {
  return tree.flatMap(node => typeof node === "string" ? [] : [...(predicate(node) ? [node] : []), ...nodes(node.children, predicate)]);
}
function text(tree: Array<Tree | string>): string {
  return tree.map(node => typeof node === "string" ? node : text(node.children)).join(" ").replace(/\s+/g, " ");
}
function voices(tree: Array<Tree | string>) {
  return nodes(tree, node => typeof node.type === "function" && node.type.name === "VoiceButtonMarker").map(node => node.props);
}
function hooksReset() {
  fixture.cleanups.forEach(cleanup => cleanup()); fixture.cleanups.clear(); fixture.values.clear(); fixture.deps.clear();
  fixture.effects.length = 0; fixture.slot = 0; fixture.dirty = false;
}
function render(Component: () => ReactElement) {
  const frames: Array<{ tree: Array<Tree | string>; text: string; voice: Record<string, unknown>[] }> = [];
  for (let turn = 0; turn < 8; turn++) {
    fixture.slot = 0; fixture.dirty = false;
    const tree = expand(Component()); frames.push({ tree, text: text(tree), voice: voices(tree) });
    for (const { slot, callback } of fixture.effects.splice(0)) {
      fixture.cleanups.get(slot)?.(); fixture.cleanups.delete(slot);
      const cleanup = callback(); if (typeof cleanup === "function") fixture.cleanups.set(slot, cleanup);
    }
    if (!fixture.dirty && fixture.effects.length === 0) return { frames, ...frames[frames.length - 1] };
  }
  throw Error("Finance fixture did not settle within eight explicit effect turns");
}
let store: typeof import("@/lib/product-storage"), Home: () => ReactElement, Accessibility: () => ReactElement;
let local: Map<string, string>, session: Map<string, string>;
let physicalLocal: ReturnType<typeof physical>, physicalSession: ReturnType<typeof physical>;
function physical(map: Map<string, string>) {
  return { getItem: vi.fn((key: string) => map.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { map.set(key, value); }),
    removeItem: vi.fn((key: string) => { map.delete(key); }) };
}
const consent = JSON.stringify({ version: "2026-10-14", acceptedAt: "2026-10-19T00:00:00.000Z", termsAccepted: true, privacyAccepted: true,
  optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } });
const legacyResult = JSON.stringify({ score: 42, createdAt: "2026-10-19T00:00:00.000Z", answers: {
  monthlyIncome: 4000, monthlyExpenses: 2000, savings: 6000, debt: 0, cashHeld: 0,
  hasEmergencyFund: true, understandsInflation: true, hasRetirementPlan: true, investsAlready: true, mainFinancialGoal: "Emergency fund",
} }); // These inputs reach all agreed legacy weights: 60+32+6=98. Cached42 is deliberately untrusted.
function clearWrites() { for (const storage of [physicalLocal, physicalSession]) { storage.setItem.mockClear(); storage.removeItem.mockClear(); } }
function seed(raw: string | null = null, withConsent = true) {
  hooksReset();
  const lease = store.beginStorageOwner({ kind: "guest" });
  if (withConsent) lease.storage.setItem("coachfi-consent-v1", consent);
  else local.delete("coachfi-consent-v1");
  if (raw === null) local.delete("coachfi-health-check"); else lease.storage.setItem("coachfi-health-check", raw);
  lease.storage.setItem("coachfi-srs", "[]"); lease.publishReady({ localOnly: true }); clearWrites();
}
function snapshot() { return JSON.stringify({ local: [...local], session: [...session] }); }
function observe(label: string, rows: unknown) { console.log("RELEASE_FINANCE_OBSERVATION " + JSON.stringify({ locale: fixture.locale, label, rows })); }
function noInventedResult(value: ReturnType<typeof render>) {
  const reading = String(value.voice[0].text);
  expect(reading).toMatch(fixture.locale === "pl" ? /Brak dostępnego wyniku/ : /No financial score is available/);
  expect(value.text).toContain(reading);
  expect(reading).not.toMatch(/42|100|98|completed|ukończ|certificate|certyfikat/i);
}
beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); hooksReset(); fixture.locale = "pl";
  local = new Map([["coachfi-tokens", "125"], ["TEST_RELEASE_UNRELATED", "SYNTHETIC_KEEP"]]); session = new Map();
  physicalLocal = physical(local); physicalSession = physical(session);
  const events = new EventTarget();
  vi.stubGlobal("window", { localStorage: physicalLocal, sessionStorage: physicalSession,
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events) });
  vi.stubGlobal("fetch", vi.fn(() => { throw Error("No network authorized in finance fixture"); }));
  fixture.translations = (await import("@/lib/i18n")).translations;
  store = await import("@/lib/product-storage");
  Home = (await import("@/app/adult/dashboard/page")).default; Accessibility = (await import("@/app/accessibility/page")).default;
  seed();
});
afterEach(() => {
  hooksReset(); expect(fetch).not.toHaveBeenCalled(); expect(fixture.notify).not.toHaveBeenCalled();
  for (const storage of [physicalLocal, physicalSession]) { expect(storage.setItem).not.toHaveBeenCalled(); expect(storage.removeItem).not.toHaveBeenCalled(); }
  expect(local.get("coachfi-tokens")).toBe("125"); expect(local.get("TEST_RELEASE_UNRELATED")).toBe("SYNTHETIC_KEEP");
  vi.unstubAllGlobals();
});
for (const locale of ["pl", "en"] as const) describe(`Release finance actual UI ${locale}`, () => {
  beforeEach(() => { fixture.locale = locale; });
  it("shows PLN scenario assumptions and no unsupported loan saving at the default", () => {
    const before = snapshot(), result = render(Home);
    const section = nodes(result.tree, node => node.props["aria-labelledby"] === "sim-title")[0];
    const scenario = text([section]); observe("default scenario", { text: scenario, voices: result.voice.map(v => v.text) });
    expect(scenario).toMatch(locale === "pl" ? /nominalna.*5,5%.*kapitalizacja miesięczna.*koniec miesiąca/ : /nominal annual.*5\.5%.*monthly compounding.*end-of-month/);
    expect(scenario).toMatch(locale === "pl" ? /Bez opłat, podatku i inflacji/ : /Excludes fees, tax and inflation/);
    expect(scenario).toMatch(locale === "pl" ? /nie jest prognoza|nie jest prognozą|nie jest prognoza ani|To nie jest prognoza/ : /not a forecast or guaranteed return/);
    expect(scenario).toContain(text([new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-US", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(250871)]));
    expect(scenario).not.toMatch(/24[ ,\u00a0\u202f]?192|\$|USD/);
    expect(nodes(result.tree, node => node.type === "input" && node.props.id === "overpayment")).toHaveLength(0);
    expect(scenario).toMatch(locale === "pl" ? /Nie obliczamy.*nadpłaty/ : /savings are not calculated/);
    expect(snapshot()).toBe(before);
  });
  it("keeps hand-independent monthly annuity arithmetic through real slider handlers", () => {
    const before = snapshot(), observations = [];
    let result = render(Home);
    for (const [monthly, years] of [[100, 3], [2500, 30]]) {
      const input = (id: string) => nodes(result.tree, node => node.type === "input" && node.props.id === id)[0];
      (input("monthly-saving").props.onChange as (event: unknown) => void)({ target: { value: String(monthly) } });
      (input("investment-years").props.onChange as (event: unknown) => void)({ target: { value: String(years) } });
      result = render(Home);
      const section = nodes(result.tree, node => node.props["aria-labelledby"] === "sim-title")[0];
      // Sum each individual end-month contribution's remaining compounded periods, independent of the product's closed form.
      const expected = Array.from({ length: years * 12 }, (_, month) => monthly * (1 + .055 / 12) ** month).reduce((a, b) => a + b, 0);
      observations.push({ monthly, years, expected, actual: text([section]) });
    }
    observe("slider scenarios", observations);
    for (const row of observations) expect(row.actual).toContain(text([new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-US", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(row.expected)]));
    expect(snapshot()).toBe(before);
  });
  it("reports unavailable for missing, malformed, denied and unconsented score reads", () => {
    const outcomes = [];
    for (const mode of ["missing", "malformed", "denied", "unconsented"]) {
      seed(mode === "missing" ? null : mode === "malformed" ? "{" : legacyResult, mode !== "unconsented");
      if (mode === "denied") physicalLocal.getItem.mockImplementation(key => { if (key === "coachfi-health-check") throw Error("SYNTHETIC_DENIED"); return local.get(key) ?? null; });
      const before = snapshot(), result = render(Accessibility);
      outcomes.push({ mode, result, before, after: snapshot() }); physicalLocal.getItem.mockImplementation(key => local.get(key) ?? null);
    }
    observe("unavailable scores", outcomes.map(o => ({ mode: o.mode, voice: o.result.voice.map(v => v.text), unchanged: o.before === o.after })));
    for (const outcome of outcomes) { noInventedResult(outcome.result); expect(outcome.after).toBe(outcome.before); }
  });
  it("reads the strict recomputed current result in both visual and speech text", () => {
    seed(legacyResult); const before = snapshot(), result = render(Accessibility); observe("real score", { voice: result.voice.map(v => v.text) });
    const reading = String(result.voice[0].text);
    expect(reading).toContain(locale === "pl" ? "98 na 98" : "98 out of 98");
    expect(reading).not.toContain("42"); expect(result.text).toContain(reading);
    expect(reading).toMatch(locale === "pl" ? /nie naukowa ocena/ : /not a scientific assessment/);
    expect(snapshot()).toBe(before);
  });
  it("clears on consent withdrawal and never displays the retired owner's score", () => {
    seed(legacyResult); const healthy = render(Accessibility);
    local.delete("coachfi-consent-v1"); window.dispatchEvent(new Event("coachfi-consent-change"));
    const withdrawn = render(Accessibility);
    local.set("coachfi-consent-v1", consent); window.dispatchEvent(new Event("coachfi-consent-change"));
    const restored = render(Accessibility);
    const next = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "SYNTHETIC_NEXT_OWNER" }); next.publishReady({ localOnly: true }); clearWrites();
    const retired = render(Accessibility); window.dispatchEvent(new Event("coachfi-health-check")); const afterLate = render(Accessibility);
    observe("scope and withdrawal", { healthy: healthy.voice[0].text, withdrawn: withdrawn.voice[0].text, restored: restored.voice[0].text, retired: retired.frames.map(f => f.voice[0].text), afterLate: afterLate.voice[0].text });
    expect(String(healthy.voice[0].text)).toContain("98"); noInventedResult(withdrawn); expect(String(restored.voice[0].text)).toContain("98");
    for (const frame of retired.frames) expect(String(frame.voice[0].text)).not.toContain("98"); noInventedResult(afterLate);
  });
  it("labels educational demonstration texts identically for visual and spoken use", () => {
    const before = snapshot(), result = render(Accessibility); observe("example readings", result.voice.map(v => v.text));
    expect(result.voice).toHaveLength(3);
    for (const voice of result.voice.slice(1)) {
      const reading = String(voice.text); expect(reading).toMatch(locale === "pl" ? /^Przykładowy tekst edukacyjny/ : /^Example educational reading/);
      expect(result.text).toContain(reading); expect(reading).not.toMatch(/completed the Money Mindset|unlocked your|ukończył|ukończyła|odblokowałeś|odblokowałaś/i);
    }
    expect(snapshot()).toBe(before);
  });
});
console.log("RELEASE_FINANCE_LIMITS " + LIMITS);
