import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

type Effect = () => void | (() => void);
const fixture = vi.hoisted(() => ({
  locale: "pl" as import("@/lib/i18n").Locale,
  storage: null as unknown as PersonalStorageHandle,
  slot: 0, dirty: false,
  values: new Map<number, unknown>(),
  memos: new Map<number, { deps?: readonly unknown[]; value: unknown }>(),
  effectDeps: new Map<number, readonly unknown[] | undefined>(),
  effects: [] as Effect[], cleanups: new Map<number, () => void>(),
  setState: vi.fn(), healthReads: vi.fn(),
}));
const sameDeps = (a?: readonly unknown[], b?: readonly unknown[]) => !!a && !!b && a.length === b.length && a.every((x, i) => Object.is(x, b[i]));
function memo(factory: () => unknown, deps?: readonly unknown[]) {
  const slot = fixture.slot++, old = fixture.memos.get(slot);
  if (!old || !sameDeps(old.deps, deps)) fixture.memos.set(slot, { deps, value: factory() });
  return fixture.memos.get(slot)?.value;
}
function effect(callback: Effect, deps?: readonly unknown[]) {
  const slot = fixture.slot++;
  if (!fixture.effectDeps.has(slot) || !sameDeps(fixture.effectDeps.get(slot), deps)) {
    fixture.effects.push(() => { fixture.cleanups.get(slot)?.(); fixture.cleanups.delete(slot); const cleanup = callback(); if (typeof cleanup === "function") fixture.cleanups.set(slot, cleanup); });
  }
  fixture.effectDeps.set(slot, deps);
}
vi.mock("react", async original => ({ ...await original<typeof import("react")>(),
  useState: (initial: unknown) => { const slot = fixture.slot++; if (!fixture.values.has(slot)) fixture.values.set(slot, typeof initial === "function" ? initial() : initial); return [fixture.values.get(slot), (value: unknown) => { const previous = fixture.values.get(slot), next = typeof value === "function" ? value(previous) : value; fixture.setState(next); if (!Object.is(previous, next)) fixture.dirty = true; fixture.values.set(slot, next); }]; },
  useMemo: memo, useCallback: (callback: unknown, deps?: readonly unknown[]) => memo(() => callback, deps),
  useRef: (initial: unknown) => memo(() => ({ current: initial }), []),
  useEffect: effect, useLayoutEffect: effect,
}));
vi.mock("@/context/LanguageContext", async () => { const { translations } = await import("@/lib/i18n"); return { useLanguage: () => ({ locale: fixture.locale, t: translations[fixture.locale] }) }; });
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: fixture.storage }) }));
// Explicit synthetic answers expose the actual Home lessons metric. This does not
// enable health collection, call its real reader, or claim a real diagnosis.
vi.mock("@/lib/healthCheck", () => ({ getHealthCheck: () => { fixture.healthReads(); return { score: 50, currency: "PLN", answers: { monthlyIncome: 5000, monthlyExpenses: 3000, savings: 9000 } }; } }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: vi.fn() }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: vi.fn() }));

type Props = { children?: unknown; role?: string; value?: number | string; label?: string; valueLabel?: string; href?: string; disabled?: boolean; onClick?: () => void; "data-testid"?: string };
type Node = ReactElement<Props>;
function nodes(value: unknown): Node[] { if (Array.isArray(value)) return value.flatMap(nodes); if (!value || typeof value !== "object" || !("props" in value)) return []; const node = value as Node; return [node, ...nodes(node.props.children)]; }
function text(value: unknown): string { if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(text).join(""); return value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : ""; }
const alerts = (tree: unknown) => nodes(tree).filter(node => node.props.role === "alert");
function lessonMetric(tree: unknown) { return nodes(tree).find(node => node.props.label === (fixture.locale === "pl" ? "Lekcje" : "Lessons")); }
let bytes: Map<string, string>, writes: Array<{ kind: string; key: string; value?: string }>, reads: string[];
let deniedKey: string | null, render: () => ReactElement, Home: () => ReactElement, Path: () => ReactElement;
let Card: unknown, Progress: unknown;
let activeListeners: Map<string, Set<EventListenerOrEventListenerObject>>, registered: Map<string, Array<EventListenerOrEventListenerObject>>;
function resetHooks() { fixture.cleanups.forEach(cleanup => cleanup()); fixture.values.clear(); fixture.memos.clear(); fixture.effectDeps.clear(); fixture.effects.length = 0; fixture.cleanups.clear(); fixture.slot = 0; fixture.dirty = false; }
function settle() { let tree: ReactElement | undefined; for (let i = 0; i < 12; i++) { fixture.dirty = false; fixture.slot = 0; tree = render(); fixture.effects.splice(0).forEach(callback => callback()); if (!fixture.dirty && fixture.effects.length === 0) return tree; } throw Error("FIXTURE component did not settle within12 renders"); }
function mount(component: () => ReactElement) { resetHooks(); render = component; return settle(); }
function capture(component: () => ReactElement) { let tree: unknown, uncaught: string | null = null; try { tree = mount(component); } catch (error) { uncaught = error instanceof Error ? error.message : String(error); } return { tree, uncaught }; }
function cards(tree: unknown) { return nodes(tree).filter(node => node.type === Card); }
function progressValues(tree: unknown) { return nodes(tree).filter(node => node.type === Progress).map(node => ({ value: node.props.value, label: node.props.valueLabel })); }
function snapshot(tree: unknown, extra: Record<string, unknown> = {}) { return { ...extra, locale: fixture.locale, lessonMetric: lessonMetric(tree)?.props.value ?? null, alerts: alerts(tree).map(text), pathCards: cards(tree).length, progress: progressValues(tree), rawSRS: bytes.get("coachfi-srs"), rawManual: bytes.get("coachfi-learn-manual"), reads: [...reads], writes: [...writes], healthMockReads: fixture.healthReads.mock.calls.length }; }
function observe(name: string, value: unknown) { console.log("C20_UI_OBSERVATION " + JSON.stringify({ name, value })); }
function expectUnavailable(tree: unknown) { expect(alerts(tree).length, "Read failure must have a visible unavailable alert").toBeGreaterThan(0); }
const invoke = (listener: EventListenerOrEventListenerObject, event: Event) => typeof listener === "function" ? listener(event) : listener.handleEvent(event);

beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); resetHooks(); fixture.locale = "pl"; deniedKey = null; reads = []; writes = [];
  bytes = new Map([["coachfi-tokens", "125"], ["coachfi-learn-manual", '{"family-plan":"completed"}'], ["coachfi-srs", JSON.stringify(["net-worth", "saving-habit", "FIXTURE_history_unknown"].map(id => ({ id, interval: 6, repetitions: 1, easeFactor: 2.5, nextReview: "2026-12-01" })))]]);
  const native = { getItem: (key: string) => { reads.push(key); if (key === deniedKey) throw Error("FIXTURE read denied:" + key); return bytes.get(key) ?? null; }, setItem: (key: string, value: string) => { writes.push({ kind: "set", key, value }); bytes.set(key, value); }, removeItem: (key: string) => { writes.push({ kind: "remove", key }); bytes.delete(key); } };
  activeListeners = new Map(); registered = new Map();
  const win = { localStorage: native, sessionStorage: native,
    addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => { const current = activeListeners.get(type) ?? new Set(); current.add(listener); activeListeners.set(type, current); const history = registered.get(type) ?? []; history.push(listener); registered.set(type, history); },
    removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => { activeListeners.get(type)?.delete(listener); },
    dispatchEvent: (event: Event) => { for (const listener of [...(activeListeners.get(event.type) ?? [])]) invoke(listener, event); return true; },
  };
  vi.stubGlobal("window", win); vi.stubGlobal("fetch", vi.fn(() => { throw Error("No network/provider in C20 UI baseline"); }));
  const { beginStorageOwner, captureCurrentPersonalStorage } = await import("@/lib/product-storage"); beginStorageOwner({ kind: "guest" }).publishReady(); fixture.storage = captureCurrentPersonalStorage();
  Home = (await import("@/app/page")).default; Path = (await import("@/components/ProgressPath")).ProgressPath;
  Card = (await import("@/components/ui/card")).Card; Progress = (await import("@/components/ui/progress")).Progress;
});
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); resetHooks(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("C20 actual Home and ProgressPath pre-edit integrity baseline", () => {
  it.each(["pl", "en"] as const)("%s healthy distinct known SRS counts and manual completion remain read-only", async locale => {
    fixture.locale = locale; const before = new Map(bytes), { getAllQuestionIds } = await import("@/lib/allQuestions");
    const home = mount(Home); const metric = lessonMetric(home); expect(metric).toBeDefined(); expect(metric!.props.value).toBe(`2/${getAllQuestionIds(locale).length}`); expect(alerts(home)).toHaveLength(0); expect(fixture.healthReads).toHaveBeenCalled();
    const path = mount(Path), all = cards(path); observe("healthy-" + locale, snapshot(path, { homeMetric: metric!.props.value }));
    expect(all).toHaveLength(8); expect(text(all[0])).toContain("1/3"); expect(text(all[1])).toContain("1/4"); expect(text(all[7])).toContain("0/3"); expect(progressValues(path).map(x => x.value)).toEqual([33, 25, 0, 0, 0, 0, 0, 100]); expect(text(all[7])).toContain((await import("@/lib/i18n")).translations[locale].learn.statusCompleted); expect(alerts(path)).toHaveLength(0); expect(reads).toContain("coachfi-srs"); expect(reads).toContain("coachfi-learn-manual"); expect(bytes).toEqual(before); expect(writes).toEqual([]);
  });
  it("Home non-array JSON is contained as unavailable rather than an uncaught array consumer", () => {
    const raw = '{"FIXTURE_future":"not-an-array"}'; bytes.set("coachfi-srs", raw); const result = capture(Home); observe("home-nonarray", snapshot(result.tree, { uncaught: result.uncaught }));
    expect(result.uncaught, "Actual Home read must not crash on valid non-array JSON").toBeNull(); expectUnavailable(result.tree); expect(lessonMetric(result.tree)?.props.value).not.toMatch(/^0\/\d+$/); expect(bytes.get("coachfi-srs")).toBe(raw); expect(writes).toEqual([]);
  });
  it.each(["malformed", "denied"] as const)("Home %s read cannot invent zero lessons", mode => {
    if (mode === "malformed") bytes.set("coachfi-srs", "{FIXTURE_bad_json"); else deniedKey = "coachfi-srs"; const before = new Map(bytes), result = capture(Home); observe("home-" + mode, snapshot(result.tree, { uncaught: result.uncaught }));
    expect(reads).toContain("coachfi-srs"); expect(result.uncaught).toBeNull(); expectUnavailable(result.tree); expect(lessonMetric(result.tree)?.props.value, "Unavailable is not a genuine zero answered count").not.toMatch(/^0\/\d+$/); expect(bytes).toEqual(before); expect(writes).toEqual([]);
  });
  it("Home same-owner storage event after corruption preserves raw and exposes unavailable", () => {
    const healthy = mount(Home); expect(lessonMetric(healthy)?.props.value).toMatch(/^2\/\d+$/); const raw = "{FIXTURE_late_bad_json"; bytes.set("coachfi-srs", raw); let uncaught: string | null = null; try { window.dispatchEvent(new Event("storage")); } catch (error) { uncaught = String(error); } const tree = settle(); observe("home-late-event", snapshot(tree, { uncaught }));
    expect(uncaught).toBeNull(); expectUnavailable(tree); expect(lessonMetric(tree)?.props.value).not.toMatch(/^0\/\d+$/); expect(bytes.get("coachfi-srs")).toBe(raw); expect(writes).toEqual([]);
  });
  it("ProgressPath non-array SRS is contained without an uncaught map", () => {
    const raw = '{"FIXTURE_future":"not-an-array"}'; bytes.set("coachfi-srs", raw); const result = capture(Path); observe("path-nonarray-srs", snapshot(result.tree, { uncaught: result.uncaught }));
    expect(result.uncaught, "Actual ProgressPath read must not crash on non-array SRS").toBeNull(); expectUnavailable(result.tree); expect(bytes.get("coachfi-srs")).toBe(raw); expect(writes).toEqual([]);
  });
  it.each(["malformed", "denied"] as const)("ProgressPath %s SRS read does not publish invented empty stage progress", mode => {
    if (mode === "malformed") bytes.set("coachfi-srs", "{FIXTURE_bad_json"); else deniedKey = "coachfi-srs"; const before = new Map(bytes), result = capture(Path); observe("path-srs-" + mode, snapshot(result.tree, { uncaught: result.uncaught }));
    expect(reads).toContain("coachfi-srs"); expect(result.uncaught).toBeNull(); expectUnavailable(result.tree); expect(nodes(cards(result.tree)).filter(n => n.props.onClick && !n.props.disabled), "Unavailable path must not expose active stage-start callbacks").toHaveLength(0); expect(bytes).toEqual(before); expect(writes).toEqual([]);
  });
  it.each(["array", "denied"] as const)("ProgressPath %s manual cache is unavailable instead of silently discarding saved overrides", mode => {
    if (mode === "array") bytes.set("coachfi-learn-manual", "[]"); else deniedKey = "coachfi-learn-manual"; const before = new Map(bytes), result = capture(Path); observe("path-manual-" + mode, snapshot(result.tree, { uncaught: result.uncaught }));
    expect(reads).toContain("coachfi-learn-manual"); expect(result.uncaught).toBeNull(); expectUnavailable(result.tree); expect(nodes(cards(result.tree)).filter(n => n.props.onClick && !n.props.disabled)).toHaveLength(0); expect(bytes).toEqual(before); expect(writes).toEqual([]);
  });
  it("retained same-owner refresh listener is inert after component cleanup", () => {
    mount(Path); const oldRefresh = registered.get("coachfi-learning")?.at(-1); expect(oldRefresh).toBeDefined(); resetHooks(); expect(activeListeners.get("coachfi-learning")?.size).toBe(0); bytes.set("coachfi-srs", "[]"); const before = new Map(bytes), beforeReads = reads.length; fixture.setState.mockClear(); invoke(oldRefresh!, new Event("coachfi-learning")); observe("path-retained-refresh", { stateUpdates: fixture.setState.mock.calls.length, readsAfterCleanup: reads.length - beforeReads, writes });
    expect(fixture.setState, "Retired view callback must not update state").not.toHaveBeenCalled(); expect(bytes).toEqual(before); expect(writes).toEqual([]);
  });
  it("current start callback preflights late malformed manual bytes before the existing writer or navigation", async () => {
    const tree = mount(Path), start = nodes(cards(tree)[0]).find(node => node.props.onClick); expect(start).toBeDefined();
    const raw = "{FIXTURE_late_bad_manual"; bytes.set("coachfi-learn-manual", raw); const before = new Map(bytes), event = { preventDefault: vi.fn() }; let uncaught: string | null = null;
    try { (start!.props.onClick as (event: { preventDefault: () => void }) => void)(event); } catch (error) { uncaught = String(error); }
    const after = settle(), { persistLearningState } = await import("@/lib/account-sync"), { notifyCloud } = await import("@/lib/sync/syncQueue");
    observe("path-late-manual-start", snapshot(after, { uncaught, navigationPrevented: event.preventDefault.mock.calls.length > 0, persistCalls: vi.mocked(persistLearningState).mock.calls.length, cloudNotifyCalls: vi.mocked(notifyCloud).mock.calls.length, beforeManual: raw }));
    expect(uncaught).toBeNull(); expect(bytes, "Late malformed manual bytes must not be repaired or replaced by stage-start").toEqual(before); expect(writes).toEqual([]); expectUnavailable(after); expect(event.preventDefault).toHaveBeenCalled(); expect(persistLearningState).not.toHaveBeenCalled(); expect(notifyCloud).not.toHaveBeenCalled();
  });
});


const READ_COPY = { pl: "Nie udało się odczytać postępu nauki. Spróbuj odczytać dane ponownie.", en: "Learning progress could not be read. Try reading your data again." };
function tagged(tree: unknown, id: string) { return nodes(tree).filter(node => node.props["data-testid"] === id); }
function oneTagged(tree: unknown, id: string) { const matches = tagged(tree, id); expect(matches).toHaveLength(1); return matches[0]; }
function startCallback(tree: unknown) { const start = nodes(cards(tree)[0]).find(node => node.props.onClick); expect(start).toBeDefined(); return start!.props.onClick as (event: { preventDefault(): void }) => void; }

describe("C20 independent actual progress acceptance append", () => {
  it.each(["pl", "en"] as const)("%s Home strict SRS metric is independent of malformed manual stage cache", locale => {
    fixture.locale = locale; bytes.set("coachfi-learn-manual", "{FIXTURE_manual_unavailable"); const before = new Map(bytes), tree = mount(Home);
    expect(lessonMetric(tree)?.props.value).toBe("2/82"); expect(tagged(tree, "home-progress-alert")).toHaveLength(0); expect(reads).not.toContain("coachfi-learn-manual"); expect(bytes).toEqual(before); expect(writes).toEqual([]);
  });
  it.each(["pl", "en"] as const)("%s Home read-only retry preserves corruption, then old retry and read callbacks retire after recovery and locale", locale => {
    fixture.locale = locale; const valid = bytes.get("coachfi-srs")!; bytes.set("coachfi-srs", "{FIXTURE_unavailable"); const invalid = new Map(bytes); let tree = mount(Home);
    expect(text(oneTagged(tree, "home-progress-alert"))).toContain(READ_COPY[locale]); expect(lessonMetric(tree)?.props.value).toBe("—"); const firstRetry = oneTagged(tree, "home-progress-retry").props.onClick!, oldRead = registered.get("storage")!.at(-1)!;
    firstRetry(); tree = settle(); expect(text(oneTagged(tree, "home-progress-alert"))).toContain(READ_COPY[locale]); expect(bytes).toEqual(invalid); expect(writes).toEqual([]); const recoveryRetry = oneTagged(tree, "home-progress-retry").props.onClick!;
    bytes.set("coachfi-srs", valid); recoveryRetry(); tree = settle(); expect(lessonMetric(tree)?.props.value).toBe("2/82"); expect(tagged(tree, "home-progress-alert")).toHaveLength(0); fixture.locale = locale === "pl" ? "en" : "pl"; tree = settle(); const readCount = reads.length, before = new Map(bytes); fixture.setState.mockClear(); firstRetry(); recoveryRetry(); invoke(oldRead, new Event("storage"));
    expect(fixture.setState).not.toHaveBeenCalled(); expect(reads).toHaveLength(readCount); expect(lessonMetric(tree)?.props.value).toBe("2/82"); expect(bytes).toEqual(before); expect(writes).toEqual([]);
  });
  it.each(["pl", "en"] as const)("%s Path retry remains read-only and stale retries cannot replace a recovered locale view", locale => {
    fixture.locale = locale; const valid = bytes.get("coachfi-learn-manual")!; bytes.set("coachfi-learn-manual", "[]"); const invalid = new Map(bytes); let tree = mount(Path);
    expect(text(oneTagged(tree, "path-progress-alert"))).toContain(READ_COPY[locale]); expect(cards(tree)).toHaveLength(0); const firstRetry = oneTagged(tree, "path-progress-retry").props.onClick!;
    firstRetry(); tree = settle(); expect(cards(tree)).toHaveLength(0); expect(bytes).toEqual(invalid); expect(writes).toEqual([]); const recoveryRetry = oneTagged(tree, "path-progress-retry").props.onClick!; bytes.set("coachfi-learn-manual", valid); recoveryRetry(); tree = settle(); expect(progressValues(tree).map(x => x.value)).toEqual([33, 25, 0, 0, 0, 0, 0, 100]);
    const oldRefresh = registered.get("coachfi-learning")!.at(-1)!; fixture.locale = locale === "pl" ? "en" : "pl"; tree = settle(); const before = new Map(bytes), readCount = reads.length; fixture.setState.mockClear(); firstRetry(); recoveryRetry(); invoke(oldRefresh, new Event("coachfi-learning"));
    expect(fixture.setState).not.toHaveBeenCalled(); expect(reads).toHaveLength(readCount); expect(tagged(tree, "path-progress-alert")).toHaveLength(0); expect(cards(tree)).toHaveLength(8); expect(bytes).toEqual(before); expect(writes).toEqual([]);
  });
  it.each(["pl", "en"] as const)("%s stale locale start cannot mutate while a fresh eligible start preserves manual history", locale => {
    fixture.locale = locale; let tree = mount(Path); const staleStart = startCallback(tree); fixture.locale = locale === "pl" ? "en" : "pl"; tree = settle(); const before = new Map(bytes), count = reads.length, oldEvent = { preventDefault: vi.fn() }; fixture.setState.mockClear(); staleStart(oldEvent);
    expect(oldEvent.preventDefault).toHaveBeenCalled(); expect(fixture.setState).not.toHaveBeenCalled(); expect(reads).toHaveLength(count); expect(bytes).toEqual(before); expect(writes).toEqual([]);
    const event = { preventDefault: vi.fn() }; startCallback(tree)(event); tree = settle(); expect(event.preventDefault).not.toHaveBeenCalled(); expect(JSON.parse(bytes.get("coachfi-learn-manual")!)).toEqual({ "family-plan": "completed", "money-mindset": "started" }); expect(writes).toHaveLength(1); expect(writes[0].key).toBe("coachfi-learn-manual"); expect(bytes.get("coachfi-srs")).toBe(before.get("coachfi-srs")); expect(bytes.get("coachfi-tokens")).toBe("125"); expect(tagged(tree, "path-progress-alert")).toHaveLength(0);
  });
  it("owner revision retires old Home event and Path start but current owner still reads healthy data", async () => {
    mount(Home); const oldHomeRead = registered.get("storage")!.at(-1)!; let tree = mount(Path); const oldStart = startCallback(tree), oldPathRead = registered.get("coachfi-learning")!.at(-1)!; resetHooks();
    const { beginStorageOwner, captureCurrentPersonalStorage } = await import("@/lib/product-storage"); beginStorageOwner({ kind: "guest" }).publishReady(); fixture.storage = captureCurrentPersonalStorage(); const before = new Map(bytes), count = reads.length, event = { preventDefault: vi.fn() }; fixture.setState.mockClear(); invoke(oldHomeRead, new Event("storage")); invoke(oldPathRead, new Event("coachfi-learning")); oldStart(event);
    expect(event.preventDefault).toHaveBeenCalled(); expect(fixture.setState).not.toHaveBeenCalled(); expect(reads).toHaveLength(count); expect(bytes).toEqual(before); expect(writes).toEqual([]); tree = mount(Home); expect(lessonMetric(tree)?.props.value).toBe("2/82"); tree = mount(Path); expect(cards(tree)).toHaveLength(8); expect(writes).toEqual([]);
  });
  it.each(["pl", "en"] as const)("%s existing stage writer failure before mutation blocks navigation without replacing bytes", locale => {
    fixture.locale = locale; const original = fixture.storage; let attempts = 0; fixture.storage = Object.freeze({ ...original, setItem: () => { attempts++; throw Error("FIXTURE native stage write denied"); } }); let tree = mount(Path); const before = new Map(bytes), event = { preventDefault: vi.fn() };
    expect(() => startCallback(tree)(event)).not.toThrow(); tree = settle(); expect(attempts).toBe(1); expect(event.preventDefault).toHaveBeenCalled(); expect(text(oneTagged(tree, "path-progress-alert"))).toContain(locale === "pl" ? "Nie udało się potwierdzić rozpoczęcia lekcji" : "Starting the lesson could not be confirmed"); expect(cards(tree)).toHaveLength(0); expect(bytes).toEqual(before); expect(writes).toEqual([]);
  });
  it.each(["pl", "en"] as const)("%s partial existing stage writer failure is explicit and readonly refresh does not replay the write", locale => {
    fixture.locale = locale; const original = fixture.storage; let attempts = 0; fixture.storage = Object.freeze({ ...original, setItem: (key: string, value: string) => { attempts++; original.setItem(key, value); throw Error("FIXTURE stage write saved then threw"); } }); let tree = mount(Path); const staleStart = startCallback(tree), event = { preventDefault: vi.fn() };
    expect(() => staleStart(event)).not.toThrow(); tree = settle(); expect(event.preventDefault).toHaveBeenCalled(); expect(attempts).toBe(1); expect(writes).toHaveLength(1); expect(JSON.parse(bytes.get("coachfi-learn-manual")!)).toEqual({ "family-plan": "completed", "money-mindset": "started" }); expect(cards(tree)).toHaveLength(0); expect(text(oneTagged(tree, "path-progress-alert"))).toContain(locale === "pl" ? "zapisane częściowo" : "partially saved"); const partial = new Map(bytes); const blocked = { preventDefault: vi.fn() }; staleStart(blocked); expect(blocked.preventDefault).toHaveBeenCalled(); expect(attempts).toBe(1);
    oneTagged(tree, "path-progress-retry").props.onClick!(); tree = settle(); expect(cards(tree)).toHaveLength(8); expect(attempts).toBe(1); expect(bytes).toEqual(partial); expect(writes).toHaveLength(1); const retired = { preventDefault: vi.fn() }; staleStart(retired); expect(retired.preventDefault).toHaveBeenCalled(); expect(attempts).toBe(1); expect(writes).toHaveLength(1);
  });
  it("Path initial pending render exposes no invented zero progress before its actual read effect", () => {
    resetHooks(); render = Path; fixture.slot = 0; const tree = render(); expect(tagged(tree, "path-progress-loading")).toHaveLength(1); expect(cards(tree)).toHaveLength(0); expect(progressValues(tree)).toEqual([]); expect(reads).not.toContain("coachfi-srs"); expect(writes).toEqual([]); const ready = settle(); expect(cards(ready)).toHaveLength(8); expect(progressValues(ready).map(x => x.value)).toEqual([33, 25, 0, 0, 0, 0, 0, 100]);
  });
});