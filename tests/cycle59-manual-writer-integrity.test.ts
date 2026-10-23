import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

type Effect = () => void | (() => void);
const fixture = vi.hoisted(() => ({
  locale: "pl" as "pl" | "en", slot: 0, dirty: false,
  values: new Map<number, unknown>(), memos: new Map<number, { deps?: readonly unknown[]; value: unknown }>(),
  deps: new Map<number, readonly unknown[] | undefined>(), effects: [] as Effect[], cleanups: new Map<number, () => void>(),
  notify: vi.fn(), persist: vi.fn(),
}));
const same = (a?: readonly unknown[], b?: readonly unknown[]) => !!a && !!b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
function memo(factory: () => unknown, deps?: readonly unknown[]) {
  const slot = fixture.slot++, previous = fixture.memos.get(slot);
  if (!previous || !same(previous.deps, deps)) fixture.memos.set(slot, { deps, value: factory() });
  return fixture.memos.get(slot)?.value;
}
function effect(callback: Effect, deps?: readonly unknown[]) {
  const slot = fixture.slot++;
  if (!fixture.deps.has(slot) || !same(fixture.deps.get(slot), deps)) fixture.effects.push(() => {
    fixture.cleanups.get(slot)?.(); fixture.cleanups.delete(slot);
    const cleanup = callback(); if (typeof cleanup === "function") fixture.cleanups.set(slot, cleanup);
  });
  fixture.deps.set(slot, deps);
}
vi.mock("react", async original => ({ ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const slot = fixture.slot++;
    if (!fixture.values.has(slot)) fixture.values.set(slot, typeof initial === "function" ? initial() : initial);
    return [fixture.values.get(slot), (value: unknown) => {
      const previous = fixture.values.get(slot), next = typeof value === "function" ? value(previous) : value;
      if (!Object.is(previous, next)) fixture.dirty = true; fixture.values.set(slot, next);
    }];
  },
  useMemo: memo, useCallback: (callback: unknown, deps?: readonly unknown[]) => memo(() => callback, deps),
  useRef: (initial: unknown) => memo(() => ({ current: initial }), []), useEffect: effect, useLayoutEffect: effect,
  // Actual useProductStorage uses this snapshot and its real useMemo capture. No native external-store scheduling is claimed.
  useSyncExternalStore: (_subscribe: unknown, getSnapshot: () => unknown) => getSnapshot(),
}));
vi.mock("@/context/LanguageContext", async () => {
  const { translations } = await import("@/lib/i18n");
  return { useLanguage: () => ({ locale: fixture.locale, t: translations[fixture.locale] }) };
});
vi.mock("framer-motion", () => ({ motion: new Proxy({}, { get: (_, key) => "c59-motion-" + String(key) }) }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: fixture.persist }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: fixture.notify }));

const MANUAL = "coachfi-learn-manual", TARGET = "money-mindset";
const HEALTHY = ' {"inflation":"completed"} ';
const MULTI = ' {"inflation":"completed","saving-habit":"started","C59-future-stage":"completed"} ';
type Trace = { kind: "read" | "denied" | "set" | "remove"; area: "local" | "session"; key: string; value?: string; manualRead?: number };
type Props = { children?: unknown; role?: string; href?: string; disabled?: boolean; value?: number; valueLabel?: string; "data-testid"?: string; onClick?: (event?: { preventDefault(): void }) => void };
type Node = ReactElement<Props>;
let local: Map<string, string>, session: Map<string, string>, trace: Trace[], manualReads: number;
let denyAt: number | null, switchAfterRead: (() => void) | null;
let storage: PersonalStorageHandle, store: typeof import("@/lib/product-storage"), api: typeof import("@/lib/learningProgress");
let reader: typeof import("@/lib/learning-progress-read"), Path: () => ReactElement;
const LIMITS = "Actual markStageStarted/markStageCompleted, strict readStageProgress, legacy getAllStageProgress, real product-storage/useProductStorage and actual ProgressPath handler tree. Synthetic separate local/session Maps. Explicit React state/memo/layout-effect emulator and snapshot-only external-store adapter; locale input and Framer Motion element markers are framework adapters. Only downstream persist/notify are mocked; fetch is a rejecting trap. No actual ReactDOM/Next navigation, native click/default action, layout/accessibility, browser, provider, account session, cloud write or SDK import/execution claim.";

function resetHooks() {
  fixture.cleanups.forEach(cleanup => cleanup()); fixture.cleanups.clear(); fixture.values.clear(); fixture.memos.clear();
  fixture.deps.clear(); fixture.effects.length = 0; fixture.slot = 0; fixture.dirty = false;
}
function settle() {
  for (let frame = 0; frame < 12; frame++) {
    fixture.slot = 0; fixture.dirty = false; const tree = Path(); fixture.effects.splice(0).forEach(run => run());
    if (!fixture.dirty && !fixture.effects.length) return tree;
  }
  throw Error("C59 actual ProgressPath did not settle within twelve explicit frames");
}
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node; return [node, ...nodes(node.props.children)];
}
function text(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(text).join("");
  return value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : "";
}
const tagged = (tree: unknown, id: string) => nodes(tree).filter(node => node.props["data-testid"] === id);
function one(tree: unknown, id: string) { const found = tagged(tree, id); expect(found, "Actual element " + id).toHaveLength(1); return found[0]; }
function stagePercent(tree: unknown, stageId: string) {
  const progress = nodes(one(tree, "progress-stage-" + stageId)).filter(node => typeof node.props.value === "number" && typeof node.props.valueLabel === "string");
  expect(progress, "Actual named Progress input for " + stageId).toHaveLength(1); return progress[0].props.value;
}
const mutations = () => trace.filter(item => item.kind === "set" || item.kind === "remove");
const raw = () => ({ local: [...local], session: [...session] });
function observe(name: string, extra: unknown = {}) {
  console.log("C59_MANUAL_OBSERVATION " + JSON.stringify({ name, locale: fixture.locale, raw: raw(), trace, manualReads,
    notify: fixture.notify.mock.calls, persist: fixture.persist.mock.calls.map(call => ({ entity: call[0], current: (call[1] as PersonalStorageHandle | undefined)?.isCurrent() })), extra, limits: LIMITS }));
}
function physical(values: Map<string, string>, area: "local" | "session") {
  return {
    getItem(key: string) {
      const isManual = area === "local" && key === MANUAL;
      if (isManual) manualReads++;
      const read: Trace = { kind: "read", area, key, ...(isManual ? { manualRead: manualReads } : {}) }; trace.push(read);
      if (isManual && denyAt === manualReads) {
        denyAt = null; trace.push({ kind: "denied", area, key, manualRead: manualReads });
        throw Error("C59 synthetic one-time manual read refusal");
      }
      const value = values.get(key) ?? null;
      if (value !== null) read.value = value;
      if (isManual && switchAfterRead) { const switchOwner = switchAfterRead; switchAfterRead = null; switchOwner(); }
      return value;
    },
    setItem(key: string, value: string) { trace.push({ kind: "set", area, key, value }); values.set(key, value); },
    removeItem(key: string) { trace.push({ kind: "remove", area, key }); values.delete(key); },
  };
}
function attempt(writer: "started" | "completed") {
  let error: unknown = null;
  try { if (writer === "started") api.markStageStarted(TARGET, storage); else api.markStageCompleted(TARGET, storage); }
  catch (cause) { error = cause; }
  return error;
}
function unchanged(before: ReturnType<typeof raw>) {
  expect(raw(), "Refused writer must preserve both physical areas byte for byte").toEqual(before);
  expect(mutations()).toEqual([]); expect(fixture.notify).not.toHaveBeenCalled(); expect(fixture.persist).not.toHaveBeenCalled();
}
function healthyPreservation(before: ReturnType<typeof raw>) {
  expect([...local].filter(([key]) => key !== MANUAL)).toEqual(before.local.filter(([key]) => key !== MANUAL));
  expect([...session]).toEqual(before.session); expect(local.get("coachfi-tokens")).toBe("125");
}

beforeEach(async () => {
  resetHooks(); vi.resetModules(); vi.clearAllMocks(); fixture.locale = "pl";
  manualReads = 0; denyAt = null; switchAfterRead = null; trace = [];
  local = new Map([[MANUAL, HEALTHY], ["coachfi-srs", "[]"], ["coachfi-tokens", "125"],
    ["coachfi-user", ' {"name":"C59 synthetic","setupDone":true} '], ["coachfi-lesson-steps", ' {"retirement":2} '], ["C59_UNRELATED", "retained"]]);
  session = new Map([[MANUAL, ' {"retirement":"completed"} '], ["coachfi-tokens", "321"], ["C59_UNRELATED", "session-retained"]]);
  const win = new EventTarget(); Object.assign(win, { localStorage: physical(local, "local"), sessionStorage: physical(session, "session") });
  vi.stubGlobal("window", win); vi.stubGlobal("fetch", vi.fn(() => { throw Error("C59 unauthorized network"); }));
  store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "guest" }).publishReady(); storage = store.captureCurrentPersonalStorage();
  api = await import("@/lib/learningProgress"); reader = await import("@/lib/learning-progress-read");
  Path = (await import("@/components/ProgressPath")).ProgressPath;
});
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); resetHooks(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("C59 actual manual writer refusal preserves saved progress", () => {
  const faults = ["denied", "malformed", "json-null", "array", "scalar", "invalid-status"] as const;
  for (const writer of ["started", "completed"] as const) it.each(faults)(writer + " refuses %s input without repair or downstream success", fault => {
    if (fault === "denied") denyAt = manualReads + 1;
    else local.set(MANUAL, ({ malformed: "{C59 malformed", "json-null": "null", array: '["C59"]', scalar: "125",
      "invalid-status": '{"inflation":"completed","saving-habit":"C59-invalid"}' } as const)[fault]);
    const before = raw(), error = attempt(writer);
    observe("refusal-" + writer + "-" + fault, { error: error instanceof Error ? error.message : error, before });
    expect(error, "Unavailable or inadmissible manual progress must refuse the write").toBeInstanceOf(Error);
    unchanged(before);
  });
});

describe("C59 healthy existing writer contracts", () => {
  for (const writer of ["started", "completed"] as const) it.each(["absent", "multi-with-future"] as const)(writer + " preserves healthy %s records", mode => {
    if (mode === "absent") local.delete(MANUAL); else local.set(MANUAL, MULTI);
    const before = raw(), error = attempt(writer), expected = mode === "absent" ? {} : JSON.parse(MULTI);
    observe("healthy-" + writer + "-" + mode, { before, error: error instanceof Error ? error.message : error });
    expect(error).toBeNull(); expect(JSON.parse(local.get(MANUAL)!)).toEqual({ ...expected, [TARGET]: writer });
    expect(mutations()).toHaveLength(1); expect(mutations()[0]).toMatchObject({ kind: "set", area: "local", key: MANUAL });
    expect(fixture.notify.mock.calls).toEqual([["stages"]]); expect(fixture.persist).toHaveBeenCalledExactlyOnceWith("learnManual", storage);
    healthyPreservation(before);
  });
  it("started retains both already-started and already-completed raw records as no-ops", () => {
    for (const existing of ["started", "completed"] as const) {
      local.set(MANUAL, ' {"money-mindset":"' + existing + '","inflation":"completed","C59-future-stage":"started"} ');
      trace = []; fixture.notify.mockClear(); fixture.persist.mockClear(); const before = raw(), error = attempt("started");
      observe("existing-start-noop-" + existing, { error: error instanceof Error ? error.message : error, before });
      expect(error).toBeNull(); unchanged(before);
    }
  });
  it("completed retains existing repeat-write and downstream notification semantics", () => {
    local.set(MANUAL, ' {"money-mindset":"completed","inflation":"completed","C59-future-stage":"started"} ');
    const before = raw(), first = attempt("completed"), second = attempt("completed");
    observe("existing-complete-repeat", { first, second, before });
    expect(first).toBeNull(); expect(second).toBeNull(); expect(JSON.parse(local.get(MANUAL)!)).toEqual({ [TARGET]: "completed", inflation: "completed", "C59-future-stage": "started" });
    expect(mutations()).toHaveLength(2); expect(mutations().every(item => item.key === MANUAL && item.kind === "set")).toBe(true);
    expect(fixture.notify.mock.calls).toEqual([["stages"], ["stages"]]); expect(fixture.persist.mock.calls).toEqual([["learnManual", storage], ["learnManual", storage]]);
    healthyPreservation(before);
  });
});

describe("C59 real storage owner transition during writer read", () => {
  it.each(["started", "completed"] as const)("%s cannot continue in a new owner after the physical read", writer => {
    local.set("coachfi-owned:v1:cdp:C59_B:coachfi-learn-manual", ' {"retirement":"completed"} ');
    const before = raw(); switchAfterRead = () => { store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "C59_B" }).publishReady(); };
    const error = attempt(writer);
    observe("owner-switch-" + writer, { error: error instanceof Error ? error.message : error, oldCurrent: storage.isCurrent(), before });
    expect(error).toBeInstanceOf(Error); expect(storage.isCurrent()).toBe(false); unchanged(before);
  });
});

describe("C59 actual ProgressPath refusal between healthy preflight and writer read", () => {
  it.each(["pl", "en"] as const)("%s blocks navigation, shows start issue and read-only retry preserves completion", locale => {
    fixture.locale = locale; let tree = settle();
    expect(tagged(tree, "path-progress-alert")).toHaveLength(0);
    expect(stagePercent(tree, "inflation")).toBe(100);
    const stage = one(tree, "progress-stage-" + TARGET), start = nodes(stage).find(node => typeof node.props.onClick === "function");
    expect(start, "Actual current lesson start handler is present").toBeDefined();
    expect(nodes(stage).some(node => node.props.href === "/learn/money-mindset")).toBe(true);
    // Calibrate only the real strict reader's physical manual reads, independent of mount/setup counts.
    const calibrationBefore = manualReads, preflight = reader.readStageProgress(storage), preflightReads = manualReads - calibrationBefore;
    expect(preflight.find(item => item.stageId === "inflation")?.status).toBe("completed");
    expect(preflightReads).toBeGreaterThan(0);
    const before = raw(), clickStartReads = manualReads, targetRead = clickStartReads + preflightReads + 1;
    trace = []; fixture.notify.mockClear(); fixture.persist.mockClear(); denyAt = targetRead;
    const event = { preventDefault: vi.fn() }; let uncaught: unknown = null;
    try { start!.props.onClick!(event); } catch (error) { uncaught = error; }
    tree = settle(); const refusalTree = tree, retry = tagged(tree, "path-progress-retry")[0];
    const afterRefusal = { raw: raw(), mutations: [...mutations()], notify: fixture.notify.mock.calls.length, persist: fixture.persist.mock.calls.length,
      alert: tagged(tree, "path-progress-alert").map(text), gridCount: tagged(tree, "path-progress-grid").length, prevented: event.preventDefault.mock.calls.length,
      relativeManualReads: trace.filter(item => item.kind === "read" && item.key === MANUAL).map(item => item.manualRead! - clickStartReads),
      manualResults: trace.filter(item => item.kind === "read" && item.key === MANUAL).map(item => ({ relative: item.manualRead! - clickStartReads, value: item.value })),
      denied: trace.filter(item => item.kind === "denied").map(item => item.manualRead), retryPresent: !!retry };
    observe("actual-path-writer-refusal-" + locale, { before, calibration: { preflightReads, clickStartReads, targetRead }, uncaught: uncaught instanceof Error ? uncaught.message : uncaught, afterRefusal });
    if (afterRefusal.alert.length && retry?.props.onClick) { retry.props.onClick(); tree = settle(); }
    observe("actual-path-readonly-retry-" + locale, { afterRetry: { alert: tagged(tree, "path-progress-alert").map(text), gridCount: tagged(tree, "path-progress-grid").length,
        inflationText: tagged(tree, "progress-stage-inflation").map(text), moneyText: tagged(tree, "progress-stage-" + TARGET).map(text) } });
    expect(uncaught).toBeNull(); expect(afterRefusal.raw).toEqual(before); expect(afterRefusal.mutations).toEqual([]);
    expect(afterRefusal.notify).toBe(0); expect(afterRefusal.persist).toBe(0);
    expect(afterRefusal.denied).toEqual([targetRead]);
    expect(afterRefusal.relativeManualReads).toEqual(Array.from({ length: preflightReads + 1 }, (_, i) => i + 1));
    expect(afterRefusal.manualResults.slice(0, preflightReads).every(item => item.value === HEALTHY), "Actual click preflight physical reads remain healthy before the single writer read refusal").toBe(true);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(text(one(refusalTree, "path-progress-alert"))).toContain(locale === "pl" ? "Nie udało się potwierdzić rozpoczęcia lekcji." : "Starting the lesson could not be confirmed.");
    expect(afterRefusal.gridCount).toBe(0); expect(retry).toBeDefined();
    expect(tagged(tree, "path-progress-alert")).toHaveLength(0); expect(tagged(tree, "path-progress-grid")).toHaveLength(1);
    expect(stagePercent(tree, "inflation")).toBe(100); expect(stagePercent(tree, TARGET)).toBe(0); unchanged(before);
  });
});
