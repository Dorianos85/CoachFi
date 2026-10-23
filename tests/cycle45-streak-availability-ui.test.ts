import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle, StorageOwnershipSnapshot } from "@/lib/product-storage";
import type { StreakData } from "@/lib/streak";

type Effect = () => void | (() => void);
type Frame = {
  name: string; slot: number; dirty: boolean;
  values: Map<number, unknown>;
  memos: Map<number, { deps?: readonly unknown[]; value: unknown }>;
  effectDeps: Map<number, readonly unknown[] | undefined>;
  layout: Effect[]; effects: Effect[]; cleanups: Map<number, () => void>;
};
const fixture = vi.hoisted(() => ({
  locale: "pl" as "pl" | "en", storage: null as unknown as PersonalStorageHandle,
  snapshot: null as unknown as StorageOwnershipSnapshot,
  active: null as unknown as Frame, frames: [] as Frame[],
  contexts: new Map<unknown, unknown>(), updates: vi.fn(),
}));
function frame(name: string): Frame {
  return { name, slot: 0, dirty: false, values: new Map(), memos: new Map(),
    effectDeps: new Map(), layout: [], effects: [], cleanups: new Map() };
}
const sameDeps = (a?: readonly unknown[], b?: readonly unknown[]) =>
  !!a && !!b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
function memo(factory: () => unknown, deps?: readonly unknown[]) {
  const owner = fixture.active, index = owner.slot++, previous = owner.memos.get(index);
  if (!previous || !sameDeps(previous.deps, deps)) owner.memos.set(index, { deps, value: factory() });
  return owner.memos.get(index)?.value;
}
function effect(callback: Effect, deps: readonly unknown[] | undefined, layout: boolean) {
  const owner = fixture.active, index = owner.slot++;
  if (!owner.effectDeps.has(index) || !sameDeps(owner.effectDeps.get(index), deps)) {
    (layout ? owner.layout : owner.effects).push(() => {
      owner.cleanups.get(index)?.(); owner.cleanups.delete(index);
      const cleanup = callback(); if (typeof cleanup === "function") owner.cleanups.set(index, cleanup);
    });
  }
  owner.effectDeps.set(index, deps);
}
vi.mock("react", async original => ({ ...await original<typeof import("react")>(),
  useMemo: (factory: () => unknown, deps?: readonly unknown[]) => memo(factory, deps),
  useCallback: (callback: unknown, deps?: readonly unknown[]) => memo(() => callback, deps),
  useRef: (initial: unknown) => memo(() => ({ current: initial }), []),
  useLayoutEffect: (callback: Effect, deps?: readonly unknown[]) => effect(callback, deps, true),
  useEffect: (callback: Effect, deps?: readonly unknown[]) => effect(callback, deps, false),
  useContext: (context: unknown) => {
    if (!fixture.contexts.has(context)) throw Error("FIXTURE missing actual provider context");
    return fixture.contexts.get(context);
  },
  useState: (initial: unknown) => {
    const owner = fixture.active, index = owner.slot++;
    if (!owner.values.has(index)) owner.values.set(index, typeof initial === "function" ? initial() : initial);
    return [owner.values.get(index), (value: unknown) => {
      fixture.updates(owner.name);
      const previous = owner.values.get(index), next = typeof value === "function" ? value(previous) : value;
      if (!Object.is(previous, next)) owner.dirty = true;
      owner.values.set(index, next);
    }];
  },
}));
vi.mock("@/context/LanguageContext", () => ({ useLanguage: () => ({ locale: fixture.locale }) }));
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: fixture.storage, snapshot: fixture.snapshot }) }));
// External bridges only. StreakProvider, useStreak, StreakBadge, notifications,
// streak and owner handles are actual. Motion is a non-DOM tag adapter below.
vi.mock("@/lib/account-sync", () => ({ persistLearningState: vi.fn() }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: vi.fn() }));

// Keep actual StreakBadge content/useStreak. Animation tags become plain
// React element tags; this is neither ReactDOM nor a framer-motion runtime test.
vi.mock("framer-motion", async () => ({ motion: { div: "div", span: "span" },
  AnimatePresence: (await import("react")).Fragment }));

type Props = { children?: unknown; value?: unknown; title?: string; "aria-label"?: string };
type Node = ReactElement<Props>;
type StreakValue = { streak: StreakData; streakStatus?: string; markActive: () => void };
type Views = { compact: unknown; full: unknown };
const NOW = "2026-01-01T12:00:00.000Z";
const HEALTHY = { lastActiveDate: "2026-01-01", currentStreak: 3, longestStreak: 3 };
const HEALTHY_SEVEN = { lastActiveDate: "2026-01-01", currentStreak: 7, longestStreak: 7 };
const COPY = {
  pl: { loading: "Sprawdzanie serii nauki…", unavailable: "Seria nauki jest niedostępna", zero: "0 dni serii", three: "3 dni serii", seven: "7 dni serii" },
  en: { loading: "Checking learning streak…", unavailable: "Learning streak unavailable", zero: "0 day streak", three: "3 day streak", seven: "7 day streak" },
};
let bytes: Map<string, string>, writes: Array<{ key: string; value?: string }>, reads: string[];
let listeners: Map<string, Set<EventListenerOrEventListenerObject>>;
let readDenied: boolean, readFailure: Error, notificationCalls: string[];
let fixtureChanges: Array<{ key: string; before: string | null; after: string | null; reason: string }>;
let provider: (props: { children: null }) => ReactElement, badge: (props: { compact: boolean }) => ReactElement;
let supplied: StreakValue, ownerApi: typeof import("@/lib/product-storage");
let stages: Array<Record<string, unknown>>, caseLabel: string;
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
function cleanup() {
  for (const owner of fixture.frames) { owner.cleanups.forEach(value => value()); owner.cleanups.clear(); }
}
function resetHooks() {
  cleanup(); fixture.contexts.clear(); fixture.frames = [frame("StreakProvider"), frame("CompactBadge"), frame("FullBadge")];
}
function renderOnly(): Views {
  for (const owner of fixture.frames) { owner.slot = 0; owner.dirty = false; }
  fixture.active = fixture.frames[0]!; const element = provider({ children: null }) as Node;
  fixture.contexts.set(element.type, element.props.value); supplied = element.props.value as StreakValue;
  fixture.active = fixture.frames[1]!; const compact = badge({ compact: true });
  fixture.active = fixture.frames[2]!; const full = badge({ compact: false });
  return { compact, full };
}
function settle(): Views {
  for (let turn = 0; turn < 16; turn++) {
    const views = renderOnly();
    for (const owner of fixture.frames) owner.layout.splice(0).forEach(callback => callback());
    for (const owner of fixture.frames) owner.effects.splice(0).forEach(callback => callback());
    if (!fixture.frames.some(owner => owner.dirty || owner.layout.length || owner.effects.length)) return views;
  }
  throw Error("FIXTURE actual provider/badges did not settle within16renders");
}
function viewState(tree: unknown) {
  return { text: text(tree), labels: nodes(tree).filter(node => node.props["aria-label"] !== undefined).map(node => node.props["aria-label"]),
    titles: nodes(tree).filter(node => node.props.title !== undefined).map(node => node.props.title) };
}
function capture(stage: string, views: Views) {
  const state = { stage, providerStatus: supplied?.streakStatus, providerStreak: supplied?.streak,
    views: { compact: viewState(views.compact), full: viewState(views.full) },
    revision: fixture.snapshot.revision, current: fixture.storage.isCurrent(), streakReads: reads.filter(k => k === "coachfi-streak").length,
    scheduledTimers: vi.getTimerCount(), listenerCounts: Object.fromEntries([...listeners].map(([k,v]) => [k,v.size])) };
  stages.push(state); return state;
}
function fixtureRaw(raw: string | null, reason: string) {
  const before = bytes.get("coachfi-streak") ?? null;
  if (raw === null) bytes.delete("coachfi-streak"); else bytes.set("coachfi-streak", raw);
  fixtureChanges.push({ key: "coachfi-streak", before, after: raw, reason }); // Test input repair, not a product writer.
}
function assertAvailable(views: Views, count: 0 | 3 | 7) {
  expect(supplied.streak.currentStreak).toBe(count);
  const expected = count === 0 ? COPY[fixture.locale].zero : count === 3 ? COPY[fixture.locale].three : COPY[fixture.locale].seven;
  for (const tree of [views.compact, views.full]) {
    const s = viewState(tree); expect(s.labels).toEqual([expected]);
    expect(s.text).not.toMatch(/undefined|NaN/); expect(s.labels.join(" ")).not.toContain(COPY[fixture.locale].unavailable);
  }
}
function assertUnknown(views: Views, status: "loading" | "unavailable") {
  const expected = COPY[fixture.locale][status];
  for (const tree of [views.compact, views.full]) {
    const s = viewState(tree), description = [s.text, ...s.labels, ...s.titles].join(" ");
    expect(description).toContain(expected); expect(s.labels.some(label => /^\d+ (?:dni serii|day streak)$/.test(label ?? ""))).toBe(false);
    expect(s.text).not.toMatch(/[0-9]|🏆|🔥|⚡|undefined|NaN/);
    expect(s.titles.join(" ")).not.toMatch(/Następny cel|Next milestone|Kamień milowy|Milestone:/);
  }
  expect(supplied.streak).toEqual({ lastActiveDate: "", currentStreak: 0, longestStreak: 0 });
}
function assertReadOnly(original: Record<string, string>) {
  expect(Object.fromEntries(bytes)).toEqual(original); expect(bytes.get("coachfi-tokens")).toBe("125"); expect(writes).toEqual([]);
}
function prepare(label: string, locale: "pl" | "en") { caseLabel = label; fixture.locale = locale; }

beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); resetHooks(); fixture.locale = "pl";
  vi.useFakeTimers(); vi.setSystemTime(new Date(NOW));
  vi.stubEnv("NEXT_PUBLIC_CDP_PROJECT_ID", ""); vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  bytes = new Map([["coachfi-streak", JSON.stringify(HEALTHY)], ["coachfi-tokens", "125"], ["coachfi-user", '{"name":"FIXTURE_C45"}'],
    ["coachfi-lesson-steps", '{"retirement":2}'], ["coachfi-srs", '[{"id":"C45_UNKNOWN_HISTORY","nextReview":"2026-12-01"}]']]);
  writes = []; reads = []; listeners = new Map(); readDenied = false; readFailure = Error("FIXTURE_C45_NATIVE_STREAK_READ_DENIED");
  notificationCalls = []; fixtureChanges = []; stages = []; caseLabel = "before-case";
  const native = {
    getItem: (key: string) => { reads.push(key); if (key === "coachfi-streak" && readDenied) throw readFailure; return bytes.get(key) ?? null; },
    setItem: (key: string, value: string) => { writes.push({ key, value }); bytes.set(key, value); },
    removeItem: (key: string) => { writes.push({ key }); bytes.delete(key); },
  };
  class SyntheticNotification {
    static permission = "granted";
    constructor(title: string) { notificationCalls.push(title); }
  }
  const win = new EventTarget() as EventTarget & { localStorage: typeof native; sessionStorage: typeof native; Notification: typeof SyntheticNotification };
  const add = win.addEventListener.bind(win), remove = win.removeEventListener.bind(win);
  Object.assign(win, { localStorage: native, sessionStorage: native, Notification: SyntheticNotification,
    addEventListener: (type: string, callback: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) => {
      if (callback) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type)!.add(callback); } add(type, callback, options);
    },
    removeEventListener: (type: string, callback: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions) => {
      if (callback) listeners.get(type)?.delete(callback); remove(type, callback, options);
    },
  });
  vi.stubGlobal("window", win); vi.stubGlobal("Notification", SyntheticNotification);
  vi.stubGlobal("fetch", vi.fn(() => { throw Error("FIXTURE no SDK/provider/cloud/network"); }));
  ownerApi = await import("@/lib/product-storage"); ownerApi.beginStorageOwner({ kind: "guest" }).publishReady();
  fixture.storage = ownerApi.captureCurrentPersonalStorage(); fixture.snapshot = ownerApi.getStorageOwnershipSnapshot();
  provider = (await import("@/context/StreakContext")).StreakProvider; badge = (await import("@/components/StreakBadge")).StreakBadge;
});
afterEach(() => {
  cleanup(); const readsAfter = reads.length, updatesAfter = fixture.updates.mock.calls.length;
  window.dispatchEvent(new Event("coachfi-learning")); window.dispatchEvent(new Event("coachfi-cloud-synced"));
  expect(reads).toHaveLength(readsAfter); expect(fixture.updates).toHaveBeenCalledTimes(updatesAfter);
  expect(listeners.get("coachfi-learning")?.size ?? 0).toBe(0); expect(listeners.get("coachfi-cloud-synced")?.size ?? 0).toBe(0);
  expect(vi.getTimerCount()).toBe(0); expect(notificationCalls).toEqual([]); expect(writes).toEqual([]); expect(fetch).not.toHaveBeenCalled();
  console.log("C45_UI_OBSERVATION " + JSON.stringify({ locale: fixture.locale, label: caseLabel, stages,
    rawAll: Object.fromEntries(bytes), tokens: bytes.get("coachfi-tokens"), productWrites: writes, fixtureChanges, reads, notificationCalls,
    limits: "Actual provider/useStreak/badges/notifications/owner handles; persistent lifecycle and motion-tag adapter, not ReactDOM. Synthetic Notification granted observes fake timers only. Test input changes are separate from product writes." }));
  fixture.contexts.clear(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks();
});

describe("C45 actual StreakProvider and badge availability", () => {
  it.each(["pl", "en"] as const)("%s real empty history remains an available zero", locale => {
    prepare("real-empty", locale); fixtureRaw(null, "initial missing key"); const original = Object.fromEntries(bytes);
    const views = settle(); capture("available-empty", views); assertAvailable(views, 0); assertReadOnly(original);
  });
  it.each(["pl", "en"] as const)("%s healthy today three remains visible with calibrated reminder", locale => {
    prepare("healthy-three", locale); const original = Object.fromEntries(bytes);
    const views = settle(); capture("available-three", views); assertAvailable(views, 3); expect(vi.getTimerCount()).toBe(1); assertReadOnly(original);
  });
  for (const sample of [{ label: "read-exception", raw: JSON.stringify(HEALTHY), denied: true },
    { label: "JSON-null", raw: "null", denied: false }, { label: "malformed-JSON", raw: "{FIXTURE_C45_BAD", denied: false }]) {
    it.each(["pl", "en"] as const)("%s " + sample.label + " is unavailable rather than an invented zero", locale => {
      prepare(sample.label, locale); fixtureRaw(sample.raw, "initial synthetic input"); readDenied = sample.denied; const original = Object.fromEntries(bytes);
      const views = settle(); capture("unavailable", views); assertUnknown(views, "unavailable"); expect(vi.getTimerCount()).toBe(0); assertReadOnly(original);
    });
  }
  it.each(["pl", "en"] as const)("%s initial render before effects is loading without an invented count", locale => {
    prepare("initial-loading", locale); const original = Object.fromEntries(bytes);
    const initial = renderOnly(); capture("before-effects", initial); assertUnknown(initial, "loading"); expect(reads).not.toContain("coachfi-streak");
    const settled = settle(); capture("after-effects", settled); assertAvailable(settled, 3); assertReadOnly(original);
  });
  it.each(["pl", "en"] as const)("%s a real new owner revision hides the old count before refresh effects", locale => {
    prepare("new-revision-loading", locale); const old = settle(); capture("old-revision-three", old); assertAvailable(old, 3);
    const previous = fixture.storage; fixtureRaw(null, "new revision synthetic empty history");
    ownerApi.beginStorageOwner({ kind: "guest" }).publishReady(); fixture.storage = ownerApi.captureCurrentPersonalStorage(); fixture.snapshot = ownerApi.getStorageOwnershipSnapshot();
    expect(previous.isCurrent()).toBe(false); const original = Object.fromEntries(bytes);
    const initial = renderOnly(); capture("new-revision-before-effects", initial); assertUnknown(initial, "loading");
    const settled = settle(); capture("new-revision-after-effects", settled); assertAvailable(settled, 0); assertReadOnly(original);
  });
  it.each(["pl", "en"] as const)("%s failed strict activity becomes unavailable and existing refresh can read repaired input", locale => {
    prepare("activity-failure-refresh-repair", locale); const initial = settle(); capture("healthy-before-fault", initial); assertAvailable(initial, 3);
    fixtureRaw("{FIXTURE_C45_BAD", "synthetic corruption without refresh"); readDenied = true; const corrupt = Object.fromEntries(bytes);
    let caught: unknown; try { supplied.markActive(); } catch (error) { caught = error; }
    expect(caught).toBe(readFailure); const failed = settle(); capture("after-strict-failure", failed); assertUnknown(failed, "unavailable");
    expect(vi.getTimerCount()).toBe(0); assertReadOnly(corrupt);
    readDenied = false; fixtureRaw(JSON.stringify(HEALTHY_SEVEN), "explicit fixture repair, not a product write"); const repaired = Object.fromEntries(bytes);
    window.dispatchEvent(new Event("coachfi-learning")); const refreshed = settle(); capture("healthy-after-existing-refresh", refreshed); assertAvailable(refreshed, 7); assertReadOnly(repaired);
  });
});
