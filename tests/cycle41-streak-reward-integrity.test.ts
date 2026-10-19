import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";
import type { StreakData } from "@/lib/streak";

type Effect = () => void | (() => void);
type HookFrame = {
  slot: number; dirty: boolean; values: Map<number, unknown>;
  memos: Map<number, { deps?: readonly unknown[]; value: unknown }>;
  effectDeps: Map<number, readonly unknown[] | undefined>;
  effects: Effect[]; cleanups: Map<number, () => void>;
};
const fixture = vi.hoisted(() => ({
  frame: null as unknown as HookFrame, storage: null as unknown as PersonalStorageHandle,
  contexts: new Map<unknown, unknown>(), updates: vi.fn(), cloud: vi.fn(), persist: vi.fn(),
}));
const sameDeps = (a?: readonly unknown[], b?: readonly unknown[]) =>
  !!a && !!b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
function memo(factory: () => unknown, deps?: readonly unknown[]) {
  const frame = fixture.frame, index = frame.slot++, previous = frame.memos.get(index);
  if (!previous || !sameDeps(previous.deps, deps)) frame.memos.set(index, { deps, value: factory() });
  return frame.memos.get(index)?.value;
}

// Persistent lifecycle dispatcher, as in the accepted C39 harness. No provider
// result, useStreak result, markActive callback or writer receipt is substituted.
vi.mock("react", async original => ({ ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const frame = fixture.frame, index = frame.slot++;
    if (!frame.values.has(index)) frame.values.set(index, typeof initial === "function" ? initial() : initial);
    return [frame.values.get(index), (value: unknown) => {
      const previous = frame.values.get(index), next = typeof value === "function" ? value(previous) : value;
      fixture.updates(next); frame.dirty ||= !Object.is(previous, next); frame.values.set(index, next);
    }];
  },
  useMemo: (factory: () => unknown, deps?: readonly unknown[]) => memo(factory, deps),
  useCallback: (callback: unknown, deps?: readonly unknown[]) => memo(() => callback, deps),
  useEffect: (effect: Effect, deps?: readonly unknown[]) => {
    const frame = fixture.frame, index = frame.slot++;
    if (!frame.effectDeps.has(index) || !sameDeps(frame.effectDeps.get(index), deps)) {
      frame.effects.push(() => {
        frame.cleanups.get(index)?.(); frame.cleanups.delete(index);
        const cleanup = effect(); if (typeof cleanup === "function") frame.cleanups.set(index, cleanup);
      });
    }
    frame.effectDeps.set(index, deps);
  },
  useContext: (context: unknown) => {
    if (!fixture.contexts.has(context)) throw new Error("FIXTURE actual StreakProvider context was not mounted");
    return fixture.contexts.get(context);
  },
}));
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: fixture.storage }) }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: fixture.persist }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: fixture.cloud }));

const TODAY = "2026-10-16", YESTERDAY = "2026-10-15", GRACE = "2026-10-14";
const KEY = "coachfi-streak", TOKENS = "coachfi-tokens";
type StreakValue = { streak: StreakData; markActive: () => void };
type Fault = "none" | "deny-first" | "deny-all" | "invalid-first" | "owner-loss-first";
let bytes: Map<string, string>, writes: Array<{ key: string; value?: string }>;
let events: string[], streakReads: number, markReads: number, phase: "mount" | "mark", fault: Fault;
let owners: typeof import("@/lib/product-storage");
let Provider: typeof import("@/context/StreakContext").StreakProvider;
let actualUseStreak: typeof import("@/context/StreakContext").useStreak;
let supplied: StreakValue;

function record(day: string, count: number, extra: Record<string, unknown> = {}) {
  return JSON.stringify({ lastActiveDate: day, currentStreak: count, longestStreak: count, ...extra });
}
function settle(): StreakValue {
  const frame = fixture.frame;
  for (let render = 0; render < 10; render++) {
    frame.slot = 0; frame.dirty = false;
    const element = Provider({ children: null }) as ReactElement<{ value?: StreakValue }>;
    if (!element.props.value) throw new Error("FIXTURE actual provider omitted its context value");
    fixture.contexts.set(element.type, element.props.value);
    supplied = actualUseStreak(); // The real hook consumes exactly the actual provider's returned value.
    frame.effects.splice(0).forEach(effect => effect());
    if (!frame.dirty && frame.effects.length === 0) return supplied;
  }
  throw new Error("FIXTURE StreakProvider failed to settle within10renders");
}
function mount(raw: string | null) {
  if (raw === null) bytes.delete(KEY); else bytes.set(KEY, raw);
  settle();
  expect(writes).toEqual([]);
  expect(bytes.get(TOKENS)).toBe("125");
  expect(streakReads).toBeGreaterThan(0);
  return supplied;
}
function invoke(callback = supplied.markActive) {
  phase = "mark";
  let error: unknown = null;
  try { callback(); } catch (caught) { error = caught; }
  const outcome = { error: error instanceof Error ? { name: error.name, message: error.message } : error };
  settle();
  return outcome;
}
function snapshot(label: string, outcome: ReturnType<typeof invoke>, before: Map<string, string>) {
  console.log("C41_STREAK_DATA_OBSERVATION " + JSON.stringify({
    label, outcome, before: [...before], after: [...bytes], writes: [...writes], events: [...events],
    streakReads, markReads, fault, current: fixture.storage.isCurrent(), providerStreak: supplied.streak,
    cloudKinds: fixture.cloud.mock.calls.map(call => call[0]), persistKinds: fixture.persist.mock.calls.map(call => call[0]),
  }));
}
function unchanged(before: Map<string, string>) {
  expect(bytes).toEqual(before);
  expect(bytes.get(TOKENS)).toBe("125");
  expect(writes).toEqual([]);
  expect(fixture.cloud).not.toHaveBeenCalled();
  expect(fixture.persist).not.toHaveBeenCalled();
}
function streakObject() {
  const raw = bytes.get(KEY); if (typeof raw !== "string") throw new Error("FIXTURE expected saved streak");
  return JSON.parse(raw) as StreakData & Record<string, unknown>;
}

beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks();
  fixture.contexts.clear();
  fixture.frame = { slot: 0, dirty: false, values: new Map(), memos: new Map(), effectDeps: new Map(), effects: [], cleanups: new Map() };
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date(TODAY + "T12:00:00.000Z"));
  bytes = new Map([[TOKENS, "125"], ["FIXTURE_UNRELATED", "retained"]]); writes = []; events = [];
  streakReads = 0; markReads = 0; phase = "mount"; fault = "none";
  const native = {
    getItem: (key: string): string | null => {
      const value = bytes.get(key) ?? null;
      if (key === KEY) {
        streakReads++;
        if (phase === "mark") {
          markReads++;
          if (fault === "deny-all" || (fault === "deny-first" && markReads === 1)) throw new Error("FIXTURE streak read denied during markActive");
          if (fault === "invalid-first" && markReads === 1) return "[]";
          if (fault === "owner-loss-first" && markReads === 1) owners.beginStorageOwner({ kind: "guest" }).publishReady();
        }
      }
      return value;
    },
    setItem: (key: string, value: string) => { writes.push({ key, value }); bytes.set(key, value); },
    removeItem: (key: string) => { writes.push({ key }); bytes.delete(key); },
  };
  const win = new EventTarget() as EventTarget & { localStorage: typeof native; sessionStorage: typeof native };
  Object.assign(win, { localStorage: native, sessionStorage: native });
  const dispatch = win.dispatchEvent.bind(win);
  win.dispatchEvent = event => { events.push(event.type); return dispatch(event); };
  // No Notification object or permission exists. The real notification helpers do not schedule anything.
  vi.stubGlobal("window", win);
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("FIXTURE no network in C41 streak review"); }));
  owners = await import("@/lib/product-storage"); owners.beginStorageOwner({ kind: "guest" }).publishReady();
  fixture.storage = owners.captureCurrentPersonalStorage(); events.length = 0;
  ({ StreakProvider: Provider, useStreak: actualUseStreak } = await import("@/context/StreakContext"));
});
afterEach(() => {
  expect(fetch).not.toHaveBeenCalled();
  fixture.frame.cleanups.forEach(cleanup => cleanup()); fixture.contexts.clear();
  vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks();
});

describe("C41 actual StreakProvider reward integrity", () => {
  it("one denied mark read after healthy today-three mount cannot mint a false fifteen-point bonus", () => {
    const raw = record(TODAY, 3, { fixtureUnknown: "retained" }); mount(raw);
    expect(supplied.streak.currentStreak).toBe(3);
    const before = new Map(bytes); fault = "deny-first";
    const outcome = invoke(); snapshot("one-denied-read-three", outcome, before);
    // A controlled synchronous error is allowed; uncertain data must never authorize a bonus.
    expect(markReads).toBeGreaterThan(0); unchanged(before);
  });

  it("denied first mark read at milestone seven and a healthy retry cannot replay a thirty-five-point bonus", () => {
    mount(record(TODAY, 7)); const before = new Map(bytes); fault = "deny-first";
    const first = invoke(); fault = "none";
    const second = invoke(); snapshot("denied-read-seven-then-retry", second, before);
    console.log("C41_STREAK_FIRST_OUTCOME " + JSON.stringify(first));
    expect(second.error).toBeNull(); unchanged(before);
  });

  it("a transient invalid first snapshot cannot turn an unchanged today-three history into a bonus receipt", () => {
    mount(record(TODAY, 3)); const before = new Map(bytes); fault = "invalid-first";
    const outcome = invoke(); snapshot("transient-invalid-first-snapshot", outcome, before);
    expect(markReads).toBeGreaterThan(0); unchanged(before);
  });

  it("healthy same-day calls and repeats retain exact bytes and zero bonus", () => {
    const raw = ' {"fixtureUnknown":{"retained":true},"lastActiveDate":"2026-10-16","currentStreak":3,"longestStreak":3} ';
    mount(raw); const before = new Map(bytes);
    expect(invoke().error).toBeNull(); const outcome = invoke(); snapshot("healthy-same-day-repeat", outcome, before);
    expect(outcome.error).toBeNull(); expect(bytes.get(KEY)).toBe(raw); unchanged(before);
  });

  it("yesterday two advances to three and grants the existing fifteen points exactly once across repeats", () => {
    mount(record(YESTERDAY, 2, { fixtureUnknown: { retained: true } })); const before = new Map(bytes);
    expect(invoke().error).toBeNull(); expect(invoke().error).toBeNull(); const outcome = invoke();
    snapshot("healthy-two-to-three-repeat", outcome, before);
    expect(outcome.error).toBeNull(); expect(streakObject()).toEqual({ lastActiveDate: TODAY, currentStreak: 3, longestStreak: 3, fixtureUnknown: { retained: true } });
    expect(supplied.streak.currentStreak).toBe(3); expect(bytes.get(TOKENS)).toBe("140");
    expect(writes.map(write => write.key)).toEqual([KEY, TOKENS]);
    expect(fixture.cloud.mock.calls.map(call => call[0])).toEqual(["streak", "reward"]);
    expect(fixture.persist.mock.calls.map(call => call[0])).toEqual(["streak", "tokens"]);
  });

  it("the existing grace day advances two to three with one fifteen-point bonus", () => {
    mount(record(GRACE, 2)); const before = new Map(bytes), outcome = invoke(); snapshot("healthy-grace-two-to-three", outcome, before);
    expect(outcome.error).toBeNull(); expect(streakObject()).toEqual({ lastActiveDate: TODAY, currentStreak: 3, longestStreak: 3 });
    expect(bytes.get(TOKENS)).toBe("140"); expect(writes.map(write => write.key)).toEqual([KEY, TOKENS]);
  });

  it("absent history starts at one with no milestone bonus", () => {
    mount(null); const before = new Map(bytes), outcome = invoke(); snapshot("absent-first-day", outcome, before);
    expect(outcome.error).toBeNull(); expect(streakObject()).toEqual({ lastActiveDate: TODAY, currentStreak: 1, longestStreak: 1 });
    expect(bytes.get(TOKENS)).toBe("125"); expect(writes.map(write => write.key)).toEqual([KEY]);
  });

  it("an ordinary one-to-two advance does not mint a milestone bonus", () => {
    mount(record(YESTERDAY, 1)); const before = new Map(bytes), outcome = invoke(); snapshot("healthy-nonmilestone", outcome, before);
    expect(outcome.error).toBeNull(); expect(streakObject()).toEqual({ lastActiveDate: TODAY, currentStreak: 2, longestStreak: 2 });
    expect(bytes.get(TOKENS)).toBe("125"); expect(writes.map(write => write.key)).toEqual([KEY]);
  });

  it("persistent malformed history after a healthy mount is preserved without a bonus", () => {
    mount(record(TODAY, 3)); bytes.set(KEY, "{FIXTURE_BAD_STREAK"); const before = new Map(bytes), outcome = invoke();
    snapshot("late-malformed-persistent", outcome, before);
    expect(outcome.error).not.toBeNull(); unchanged(before);
  });

  it("persistent denied reads after a healthy mount preserve history and tokens", () => {
    mount(record(TODAY, 3)); const before = new Map(bytes); fault = "deny-all";
    const outcome = invoke(); snapshot("late-read-denied-persistent", outcome, before);
    expect(outcome.error).not.toBeNull(); unchanged(before);
  });

  it("owner loss during the first mark read prevents both streak and token mutations", () => {
    mount(record(YESTERDAY, 2)); const before = new Map(bytes); fault = "owner-loss-first";
    const outcome = invoke(); snapshot("owner-loss-during-read", outcome, before);
    expect(fixture.storage.isCurrent()).toBe(false); unchanged(before);
  });

  it("a captured old-owner callback is inert while a freshly mounted owner still earns its legitimate milestone", () => {
    mount(record(YESTERDAY, 2)); const oldCallback = supplied.markActive;
    owners.beginStorageOwner({ kind: "guest" }).publishReady(); const before = new Map(bytes);
    const oldOutcome = invoke(oldCallback); snapshot("old-owner-callback", oldOutcome, before);
    expect(oldOutcome.error).toBeNull(); unchanged(before);
    fixture.storage = owners.captureCurrentPersonalStorage(); settle();
    const outcome = invoke(); snapshot("new-owner-healthy-milestone", outcome, before);
    expect(outcome.error).toBeNull(); expect(streakObject().currentStreak).toBe(3); expect(bytes.get(TOKENS)).toBe("140");
    expect(writes.map(write => write.key)).toEqual([KEY, TOKENS]);
  });
});
