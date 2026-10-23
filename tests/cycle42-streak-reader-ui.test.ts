import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";
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
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: fixture.storage }) }));
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
type StreakValue = { streak: StreakData; streakStatus: "available" | "unavailable" | "loading"; markActive: () => void };
const NOW = "2026-01-01T12:00:00.000Z";
const HEALTHY = { lastActiveDate: "2026-01-01", currentStreak: 3, longestStreak: 3 };
const EMPTY = { lastActiveDate: "", currentStreak: 0, longestStreak: 0 };
const CASES = [
  { label: "stored JSON null", raw: "null", expected: EMPTY, status: "unavailable" },
  { label: "stored JSON array", raw: "[]", expected: EMPTY, status: "unavailable" },
  { label: "healthy today three", raw: JSON.stringify(HEALTHY), expected: HEALTHY, status: "available" },
] as const;
const COPY = {
  pl: { unavailable: "Seria nauki jest niedostępna", zeroAria: "0 dni serii", threeAria: "3 dni serii",
    zeroTitle: "0-dniowa seria • Następny cel: 3 dni", threeTitle: "Kamień milowy: 3 dni! 🏆" },
  en: { unavailable: "Learning streak unavailable", zeroAria: "0 day streak", threeAria: "3 day streak",
    zeroTitle: "0-day streak • Next milestone: 3 days", threeTitle: "Milestone: 3 days! 🏆" },
};
let bytes: Map<string, string>, writes: Array<{ key: string; value?: string }>, reads: string[];
let listeners: Map<string, Set<EventListenerOrEventListenerObject>>;
let provider: (props: { children: null }) => ReactElement, badge: (props: { compact: boolean }) => ReactElement;
let supplied: StreakValue;
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
  cleanup(); fixture.contexts.clear(); fixture.frames = [frame("StreakProvider"), frame("StreakBadge")];
}
function settle() {
  for (let turn = 0; turn < 12; turn++) {
    for (const owner of fixture.frames) { owner.slot = 0; owner.dirty = false; }
    fixture.active = fixture.frames[0]!; const element = provider({ children: null }) as Node;
    fixture.contexts.set(element.type, element.props.value); supplied = element.props.value as StreakValue;
    fixture.active = fixture.frames[1]!; const tree = badge({ compact: false });
    for (const owner of fixture.frames) owner.layout.splice(0).forEach(callback => callback());
    for (const owner of fixture.frames) owner.effects.splice(0).forEach(callback => callback());
    if (!fixture.frames.some(owner => owner.dirty || owner.layout.length || owner.effects.length)) return tree;
  }
  throw Error("FIXTURE actual provider/badge did not settle within12renders");
}
function badgeState(tree: unknown) {
  return { providerStreak: supplied?.streak, text: text(tree),
    labels: nodes(tree).filter(node => node.props["aria-label"] !== undefined).map(node => node.props["aria-label"]),
    titles: nodes(tree).filter(node => node.props.title !== undefined).map(node => node.props.title),
    listenerCounts: Object.fromEntries([...listeners].map(([key, values]) => [key, values.size])),
    streakReads: reads.filter(key => key === "coachfi-streak").length };
}
function assertBadge(tree: unknown, expected: StreakData, locale: "pl" | "en", status: "available" | "unavailable") {
  expect(supplied.streak).toEqual(expected);
  expect(supplied.streakStatus).toBe(status);
  const state = badgeState(tree), copy = COPY[locale];
  expect(state.labels).toEqual([status === "unavailable" ? copy.unavailable : expected.currentStreak === 0 ? copy.zeroAria : copy.threeAria]);
  expect(state.titles).toEqual([status === "unavailable" ? copy.unavailable : expected.currentStreak === 0 ? copy.zeroTitle : copy.threeTitle]);
  expect(state.text).not.toMatch(/undefined|NaN/);
}

beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); resetHooks(); fixture.locale = "pl";
  vi.useFakeTimers(); vi.setSystemTime(new Date(NOW));
  vi.stubEnv("NEXT_PUBLIC_CDP_PROJECT_ID", ""); vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  bytes = new Map([["coachfi-streak", JSON.stringify(HEALTHY)], ["coachfi-tokens", "125"],
    ["coachfi-lesson-steps", '{"retirement":2}'], ["coachfi-srs", '[{"id":"C42_UNKNOWN_HISTORY","nextReview":"2026-12-01"}]']]);
  writes = []; reads = []; listeners = new Map();
  const native = {
    getItem: (key: string) => { reads.push(key); return bytes.get(key) ?? null; },
    setItem: (key: string, value: string) => { writes.push({ key, value }); bytes.set(key, value); },
    removeItem: (key: string) => { writes.push({ key }); bytes.delete(key); },
  };
  const win = new EventTarget() as EventTarget & { localStorage: typeof native; sessionStorage: typeof native };
  const add = win.addEventListener.bind(win), remove = win.removeEventListener.bind(win);
  Object.assign(win, { localStorage: native, sessionStorage: native,
    addEventListener: (type: string, callback: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) => {
      if (callback) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type)!.add(callback); }
      add(type, callback, options);
    },
    removeEventListener: (type: string, callback: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions) => {
      if (callback) listeners.get(type)?.delete(callback); remove(type, callback, options);
    },
  }); vi.stubGlobal("window", win); // No Notification API or real browser profile.
  vi.stubGlobal("fetch", vi.fn(() => { throw Error("FIXTURE no SDK/provider/cloud/network"); }));
  const storage = await import("@/lib/product-storage");
  storage.beginStorageOwner({ kind: "guest" }).publishReady(); fixture.storage = storage.captureCurrentPersonalStorage();
  provider = (await import("@/context/StreakContext")).StreakProvider;
  badge = (await import("@/components/StreakBadge")).StreakBadge;
});
afterEach(() => {
  expect(fetch).not.toHaveBeenCalled(); cleanup(); fixture.contexts.clear();
  vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks();
});

describe("C42 actual StreakProvider and actual StreakBadge display admission", () => {
  for (const item of CASES) it.each(["pl", "en"] as const)("%s " + item.label + " has safe legacy display with no mutation and real refresh cleanup", locale => {
    fixture.locale = locale; bytes.set("coachfi-streak", item.raw);
    const original = Object.fromEntries(bytes), stages: Array<Record<string, unknown>> = [];
    let tree: unknown, mountError: unknown;
    try {
      try { tree = settle(); } catch (error) { mountError = error; }
      stages.push({ stage: "mount", error: mountError instanceof Error ? mountError.message : mountError ? String(mountError) : null,
        ...badgeState(tree) });
      expect(mountError).toBeUndefined(); assertBadge(tree, item.expected, locale, item.status);
      expect(reads.filter(key => key === "coachfi-streak").length).toBeGreaterThan(0);
      expect(listeners.get("coachfi-learning")?.size).toBe(1); expect(listeners.get("coachfi-cloud-synced")?.size).toBe(1);
      expect(Object.fromEntries(bytes)).toEqual(original); expect(writes).toEqual([]);
      const readsBefore = reads.length;
      window.dispatchEvent(new Event("coachfi-learning")); tree = settle();
      stages.push({ stage: "learning-refresh", ...badgeState(tree) });
      expect(reads.length).toBeGreaterThan(readsBefore); assertBadge(tree, item.expected, locale, item.status);
      expect(Object.fromEntries(bytes)).toEqual(original); expect(writes).toEqual([]);
      cleanup(); const readsAfterCleanup = reads.length, updatesAfterCleanup = fixture.updates.mock.calls.length;
      window.dispatchEvent(new Event("coachfi-learning")); window.dispatchEvent(new Event("coachfi-cloud-synced"));
      expect(reads).toHaveLength(readsAfterCleanup); expect(fixture.updates).toHaveBeenCalledTimes(updatesAfterCleanup);
      expect(listeners.get("coachfi-learning")?.size).toBe(0); expect(listeners.get("coachfi-cloud-synced")?.size).toBe(0);
      expect(Object.fromEntries(bytes)).toEqual(original); expect(writes).toEqual([]);
      stages.push({ stage: "after-cleanup", ...badgeState(tree) });
    } finally {
      console.log("C42_UI_OBSERVATION " + JSON.stringify({ locale, label: item.label, expected: item.expected, stages,
        rawStreak: bytes.get("coachfi-streak"), tokens: bytes.get("coachfi-tokens"), writes, reads,
        rawAllPreserved: JSON.stringify(Object.fromEntries(bytes)) === JSON.stringify(original),
        limits: "Actual components/useStreak and notifications, synthetic hook/context lifecycle and motion-tag adapter. Legacy numeric fallback is retained for compatibility; malformed stored data must render unavailable. No browser or absent-history inference." }));
    }
  });
});
