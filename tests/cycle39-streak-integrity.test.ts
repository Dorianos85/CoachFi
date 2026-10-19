import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle } from "@/lib/product-storage";

const bridges = vi.hoisted(() => ({ cloud: vi.fn(), persist: vi.fn() }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: bridges.cloud }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: bridges.persist }));

const KEY = "coachfi-streak";
const TODAY = "2026-10-16", YESTERDAY = "2026-10-15", GRACE = "2026-10-14";
let streak: typeof import("@/lib/streak");
let owners: typeof import("@/lib/product-storage");
let nativeBytes: Map<string, string>;
let nativeGet: ReturnType<typeof vi.fn<(key: string) => string | null>>;
let nativePut: ReturnType<typeof vi.fn<(key: string, value: string) => void>>;
let nativeRemove: ReturnType<typeof vi.fn<(key: string) => void>>;
let afterNativeRead: ((key: string) => void) | null;
let network: ReturnType<typeof vi.fn<typeof fetch>>;

function synthetic(raw: string | null) {
  const bytes = new Map<string, string>([["FIXTURE_UNRELATED", "retained"]]);
  if (raw !== null) bytes.set(KEY, raw);
  let current = true;
  let afterRead: (() => void) | null = null;
  const get = vi.fn((key: string): string | null => {
    const value = bytes.get(key) ?? null;
    afterRead?.();
    return value;
  });
  const put = vi.fn((key: string, value: string): boolean => {
    if (!current) return false;
    bytes.set(key, value);
    return true;
  });
  const remove = vi.fn((key: string): boolean => {
    if (!current) return false;
    bytes.delete(key);
    return true;
  });
  const storage: PersonalStorageHandle = {
    owner: { kind: "guest" }, revision: 39, area: "local", isCurrent: () => current,
    getItem: get, setItem: put, removeItem: remove, release: () => { current = false; },
  };
  return { bytes, storage, get, put, remove, stop: () => { current = false; }, onRead: (f: () => void) => { afterRead = f; } };
}

function invoke(storage: PersonalStorageHandle) {
  let result: import("@/lib/streak").StreakData | undefined;
  let error: unknown = null;
  try { result = streak.markActiveToday(storage); } catch (caught) { error = caught; }
  return { result, error };
}

function observe(name: string, outcome: ReturnType<typeof invoke>, before: Map<string, string>, after: Map<string, string>, writes: unknown[]) {
  console.log("C39_STREAK_DATA_OBSERVATION", JSON.stringify({
    name, result: outcome.result ?? null,
    error: outcome.error instanceof Error ? { name: outcome.error.name, message: outcome.error.message } : outcome.error,
    before: [...before], after: [...after], writes,
    cloudCalls: bridges.cloud.mock.calls.length, persistCalls: bridges.persist.mock.calls.length,
  }));
}

function decoded(bytes: Map<string, string>, key = KEY): Record<string, unknown> {
  const raw = bytes.get(key);
  if (typeof raw !== "string") throw new Error("Fixture expected a written JSON string");
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Fixture expected a written JSON object");
  return value as Record<string, unknown>;
}

function noEffects(state: ReturnType<typeof synthetic>, before: Map<string, string>) {
  expect(state.bytes).toEqual(before);
  expect(state.put).not.toHaveBeenCalled();
  expect(state.remove).not.toHaveBeenCalled();
  expect(bridges.cloud).not.toHaveBeenCalled();
  expect(bridges.persist).not.toHaveBeenCalled();
}

beforeEach(async () => {
  vi.resetModules(); bridges.cloud.mockReset(); bridges.persist.mockReset();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
  nativeBytes = new Map(); afterNativeRead = null;
  nativeGet = vi.fn((key: string) => { const value = nativeBytes.get(key) ?? null; afterNativeRead?.(key); return value; });
  nativePut = vi.fn((key: string, value: string) => { nativeBytes.set(key, value); });
  nativeRemove = vi.fn((key: string) => { nativeBytes.delete(key); });
  const localStorage = { getItem: nativeGet, setItem: nativePut, removeItem: nativeRemove };
  const sessionStorage = { getItem: () => null, setItem: () => { throw new Error("No session writes in this fixture"); }, removeItem: () => { throw new Error("No session writes in this fixture"); } };
  vi.stubGlobal("window", { localStorage, sessionStorage, dispatchEvent: () => true });
  network = vi.fn<typeof fetch>(() => { throw new Error("No network permitted in C39 data review"); });
  vi.stubGlobal("fetch", network);
  owners = await import("@/lib/product-storage");
  streak = await import("@/lib/streak");
});

afterEach(() => {
  expect(network).not.toHaveBeenCalled();
  vi.useRealTimers(); vi.unstubAllGlobals();
});

const invalidCaches = [
  { label: "present empty string", raw: "" },
  { label: "malformed JSON", raw: " {FIXTURE_BAD_STREAK\n" },
  { label: "JSON null", raw: "null" },
  { label: "JSON array", raw: "[]" },
  { label: "JSON number", raw: "42" },
  { label: "missing required own longest count", raw: '{"lastActiveDate":"2026-10-15","currentStreak":2}' },
  { label: "string count", raw: '{"lastActiveDate":"2026-10-15","currentStreak":"2","longestStreak":4}' },
  { label: "fractional count", raw: '{"lastActiveDate":"2026-10-15","currentStreak":1.5,"longestStreak":4}' },
  { label: "negative count", raw: '{"lastActiveDate":"2026-10-15","currentStreak":-1,"longestStreak":4}' },
  { label: "nonfinite parsed number", raw: '{"lastActiveDate":"2026-10-15","currentStreak":1e309,"longestStreak":1e309}' },
  { label: "unsafe integer count", raw: '{"lastActiveDate":"2026-10-15","currentStreak":9007199254740992,"longestStreak":9007199254740992}' },
  { label: "longest below current", raw: '{"lastActiveDate":"2026-10-15","currentStreak":4,"longestStreak":3}' },
  { label: "empty date with positive history", raw: '{"lastActiveDate":"","currentStreak":0,"longestStreak":4}' },
  { label: "nonexistent calendar day", raw: '{"lastActiveDate":"2026-02-30","currentStreak":2,"longestStreak":4}' },
  { label: "noncanonical day", raw: '{"lastActiveDate":"2026-2-03","currentStreak":2,"longestStreak":4}' },
  { label: "future UTC day", raw: '{"lastActiveDate":"2026-10-17","currentStreak":2,"longestStreak":4}' },
] as const;

describe("independent C39 streak write preflight", () => {
  it.each(invalidCaches)("$label is unavailable before any mutation", ({ label, raw }) => {
    const state = synthetic(raw), before = new Map(state.bytes), outcome = invoke(state.storage);
    observe(label, outcome, before, state.bytes, state.put.mock.calls);
    expect(outcome.error).toBeInstanceOf(Error);
    noEffects(state, before);
  });

  it("allows an absent key to start the existing first-day transition", () => {
    const state = synthetic(null), before = new Map(state.bytes), outcome = invoke(state.storage);
    observe("absent", outcome, before, state.bytes, state.put.mock.calls);
    expect(outcome.error).toBeNull();
    expect(outcome.result).toEqual({ lastActiveDate: TODAY, currentStreak: 1, longestStreak: 1 });
    expect(decoded(state.bytes)).toEqual(outcome.result);
    expect(state.put).toHaveBeenCalledTimes(1);
    expect(bridges.cloud).toHaveBeenCalledExactlyOnceWith("streak");
    expect(bridges.persist).toHaveBeenCalledExactlyOnceWith("streak", state.storage);
  });

  it("accepts the stored zero-empty convention without deleting future members", () => {
    const state = synthetic('{"lastActiveDate":"","currentStreak":0,"longestStreak":0,"future":{"tag":"FIXTURE"}}');
    const before = new Map(state.bytes), outcome = invoke(state.storage);
    observe("stored-empty", outcome, before, state.bytes, state.put.mock.calls);
    expect(outcome.error).toBeNull();
    expect(decoded(state.bytes)).toEqual({ lastActiveDate: TODAY, currentStreak: 1, longestStreak: 1, future: { tag: "FIXTURE" } });
  });

  it("same-day nonnegative zero remains a no-op with exact original bytes", () => {
    const raw = ' { "future": ["FIXTURE"], "longestStreak": 4, "currentStreak": 0, "lastActiveDate": "2026-10-16" }\n';
    const state = synthetic(raw), before = new Map(state.bytes), outcome = invoke(state.storage);
    observe("same-day-zero", outcome, before, state.bytes, state.put.mock.calls);
    expect(outcome.error).toBeNull();
    expect(outcome.result).toMatchObject({ currentStreak: 0, longestStreak: 4, lastActiveDate: TODAY });
    noEffects(state, before);
  });

  it("updates known members while preserving own unknown and prototype-named data", () => {
    const raw = '{"lastActiveDate":"2026-10-15","currentStreak":2,"longestStreak":5,"future":[{"enabled":true}],"__proto__":{"FIXTURE_C39":true},"constructor":{"tag":"future"}}';
    const state = synthetic(raw), before = new Map(state.bytes), outcome = invoke(state.storage);
    observe("unknown-members", outcome, before, state.bytes, state.put.mock.calls);
    expect(outcome.error).toBeNull();
    const value = decoded(state.bytes);
    expect(value).toMatchObject({ lastActiveDate: TODAY, currentStreak: 3, longestStreak: 5, future: [{ enabled: true }], constructor: { tag: "future" } });
    expect(Object.hasOwn(value, "__proto__")).toBe(true);
    expect(value["__proto__"]).toEqual({ FIXTURE_C39: true });
    expect(Object.hasOwn(Object.prototype, "FIXTURE_C39")).toBe(false);
  });

  it("retains the writer grace-day transition and existing milestone result", () => {
    const state = synthetic(JSON.stringify({ lastActiveDate: GRACE, currentStreak: 2, longestStreak: 5 }));
    const before = new Map(state.bytes), outcome = invoke(state.storage);
    observe("grace-day", outcome, before, state.bytes, state.put.mock.calls);
    expect(outcome.error).toBeNull();
    expect(outcome.result).toEqual({ lastActiveDate: TODAY, currentStreak: 3, longestStreak: 5 });
    expect(streak.reachedMilestone(outcome.result?.currentStreak ?? -1)).toBe(3);
  });

  it("permits a gap-three reset with safe maximum history instead of imposing a new cap", () => {
    const state = synthetic(JSON.stringify({ lastActiveDate: "2026-10-13", currentStreak: Number.MAX_SAFE_INTEGER, longestStreak: Number.MAX_SAFE_INTEGER }));
    const before = new Map(state.bytes), outcome = invoke(state.storage);
    observe("reset-safe-maximum", outcome, before, state.bytes, state.put.mock.calls);
    expect(outcome.error).toBeNull();
    expect(outcome.result).toEqual({ lastActiveDate: TODAY, currentStreak: 1, longestStreak: Number.MAX_SAFE_INTEGER });
  });

  it("permits same-day safe maximum counts without a write", () => {
    const state = synthetic(JSON.stringify({ lastActiveDate: TODAY, currentStreak: Number.MAX_SAFE_INTEGER, longestStreak: Number.MAX_SAFE_INTEGER }));
    const before = new Map(state.bytes), outcome = invoke(state.storage);
    observe("same-day-safe-maximum", outcome, before, state.bytes, state.put.mock.calls);
    expect(outcome.error).toBeNull();
    expect(outcome.result?.currentStreak).toBe(Number.MAX_SAFE_INTEGER);
    noEffects(state, before);
  });

  it.each([1, 2] as const)("gap %i rejects an unsafe increment before the setter", gap => {
    const state = synthetic(JSON.stringify({ lastActiveDate: gap === 1 ? YESTERDAY : GRACE, currentStreak: Number.MAX_SAFE_INTEGER, longestStreak: Number.MAX_SAFE_INTEGER }));
    const before = new Map(state.bytes), outcome = invoke(state.storage);
    observe("overflow-gap-" + gap, outcome, before, state.bytes, state.put.mock.calls);
    expect(outcome.error).toBeInstanceOf(Error);
    noEffects(state, before);
  });

  it("does not convert a denied read into a new empty streak", () => {
    const state = synthetic(' { "FIXTURE_RETAIN_UNREAD": true }\n');
    state.get.mockImplementation(() => { throw new Error("FIXTURE_READ_DENIED"); });
    const before = new Map(state.bytes), outcome = invoke(state.storage);
    observe("read-denied", outcome, before, state.bytes, state.put.mock.calls);
    expect(outcome.error).toBeInstanceOf(Error);
    noEffects(state, before);
  });

  it("rechecks ownership after reading before attempting a synthetic setter", () => {
    const state = synthetic(JSON.stringify({ lastActiveDate: YESTERDAY, currentStreak: 2, longestStreak: 5 }));
    state.onRead(state.stop);
    const before = new Map(state.bytes), outcome = invoke(state.storage);
    observe("owner-lost-after-read", outcome, before, state.bytes, state.put.mock.calls);
    expect(outcome.error).toBeInstanceOf(Error);
    noEffects(state, before);
  });

  it("actual account namespace updates only its own streak and existing mutation marker", () => {
    nativeBytes.set(KEY, "FIXTURE_GUEST_UNTOUCHED");
    const aKey = "coachfi-owned:v1:cdp:FIXTURE_C39_A:" + KEY;
    const bKey = "coachfi-owned:v1:cdp:FIXTURE_C39_B:" + KEY;
    nativeBytes.set(aKey, JSON.stringify({ lastActiveDate: YESTERDAY, currentStreak: 2, longestStreak: 5, future: "A" }));
    nativeBytes.set(bKey, "FIXTURE_B_UNTOUCHED");
    const lease = owners.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_C39_A" });
    lease.publishReady({ localOnly: true });
    const storage = owners.captureCurrentPersonalStorage(), before = new Map(nativeBytes), outcome = invoke(storage);
    observe("actual-account-healthy", outcome, before, nativeBytes, nativePut.mock.calls);
    expect(outcome.error).toBeNull();
    expect(decoded(nativeBytes, aKey)).toEqual({ lastActiveDate: TODAY, currentStreak: 3, longestStreak: 5, future: "A" });
    expect(nativeBytes.get(KEY)).toBe(before.get(KEY));
    expect(nativeBytes.get(bKey)).toBe(before.get(bKey));
    expect(nativePut.mock.calls.filter(([key]) => key === aKey)).toHaveLength(1);
    expect(nativeRemove).not.toHaveBeenCalled();
  });

  it("actual corrupt account bytes cannot create even a mutation marker", () => {
    const aKey = "coachfi-owned:v1:cdp:FIXTURE_C39_A:" + KEY;
    nativeBytes.set(aKey, " {FIXTURE_ACCOUNT_BAD\n");
    nativeBytes.set(KEY, "FIXTURE_GUEST_UNTOUCHED");
    const lease = owners.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_C39_A" });
    lease.publishReady({ localOnly: true });
    const storage = owners.captureCurrentPersonalStorage(), before = new Map(nativeBytes), outcome = invoke(storage);
    observe("actual-account-corrupt", outcome, before, nativeBytes, nativePut.mock.calls);
    expect(outcome.error).toBeInstanceOf(Error);
    expect(nativeBytes).toEqual(before);
    expect(nativePut).not.toHaveBeenCalled();
    expect(nativeRemove).not.toHaveBeenCalled();
    expect(bridges.cloud).not.toHaveBeenCalled();
    expect(bridges.persist).not.toHaveBeenCalled();
  });

  it("actual account switch during the native getter cannot turn hidden data into absence", () => {
    const aKey = "coachfi-owned:v1:cdp:FIXTURE_C39_A:" + KEY;
    const bKey = "coachfi-owned:v1:cdp:FIXTURE_C39_B:" + KEY;
    nativeBytes.set(aKey, JSON.stringify({ lastActiveDate: YESTERDAY, currentStreak: 2, longestStreak: 5 }));
    nativeBytes.set(bKey, "FIXTURE_B_UNTOUCHED");
    const lease = owners.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_C39_A" });
    lease.publishReady({ localOnly: true });
    const captured = owners.captureCurrentPersonalStorage();
    const attemptedSet = vi.fn((key: string, value: string) => captured.setItem(key, value));
    const storage: PersonalStorageHandle = { ...captured, setItem: attemptedSet };
    let switched = false;
    afterNativeRead = key => {
      if (key !== aKey || switched) return;
      switched = true;
      owners.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_C39_B" }).publishReady({ localOnly: true });
    };
    const before = new Map(nativeBytes), outcome = invoke(storage);
    observe("actual-owner-switch-in-read", outcome, before, nativeBytes, attemptedSet.mock.calls);
    expect(switched).toBe(true);
    expect(outcome.error).toBeInstanceOf(Error);
    expect(attemptedSet).not.toHaveBeenCalled();
    expect(nativePut).not.toHaveBeenCalled();
    expect(nativeRemove).not.toHaveBeenCalled();
    expect(nativeBytes).toEqual(before);
    expect(bridges.cloud).not.toHaveBeenCalled();
    expect(bridges.persist).not.toHaveBeenCalled();
  });
});
