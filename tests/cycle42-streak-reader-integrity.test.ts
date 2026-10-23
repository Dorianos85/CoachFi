import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle } from "@/lib/product-storage";

const bridges = vi.hoisted(() => ({ cloud: vi.fn(), persist: vi.fn() }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: bridges.cloud }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: bridges.persist }));

const KEY = "coachfi-streak", TODAY = "2026-10-16";
const FALLBACK = { lastActiveDate: "", currentStreak: 0, longestStreak: 0 };
const HEALTHY = '{"lastActiveDate":"2026-10-16","currentStreak":3,"longestStreak":5}';
let actualGetStreak: typeof import("@/lib/streak").getStreak;

function fixture(raw: string | null) {
  const bytes = new Map([["coachfi-tokens", "125"], ["FIXTURE_UNRELATED", "retained"]]);
  if (raw !== null) bytes.set(KEY, raw);
  let current = true, denied = false, loseAfterRead = false;
  const get = vi.fn((key: string) => {
    if (denied) throw new Error("FIXTURE read denied");
    const value = bytes.get(key) ?? null;
    if (loseAfterRead) current = false;
    return value;
  });
  const put = vi.fn((_key: string, _value: string): boolean => { throw new Error("FIXTURE display reader must not write"); });
  const remove = vi.fn((_key: string): boolean => { throw new Error("FIXTURE display reader must not remove"); });
  const release = vi.fn(() => { current = false; });
  const storage: PersonalStorageHandle = Object.freeze({
    owner: Object.freeze({ kind: "guest" as const }), revision: 42, area: "local" as const,
    isCurrent: () => current, getItem: get, setItem: put, removeItem: remove, release,
  });
  return { bytes, storage, get, put, remove, release, stop: () => { current = false; },
    deny: () => { denied = true; }, loseAfterRead: () => { loseAfterRead = true; } };
}
function observe(label: string, state: ReturnType<typeof fixture>, before: Map<string, string>) {
  let value: unknown, error: unknown = null;
  try { value = actualGetStreak(state.storage); } catch (caught) { error = caught; }
  console.log("C42_READER_DATA_OBSERVATION " + JSON.stringify({
    label, value, error: error instanceof Error ? { name: error.name, message: error.message } : error,
    before: [...before], after: [...state.bytes], current: state.storage.isCurrent(), reads: state.get.mock.calls,
    writes: state.put.mock.calls, removes: state.remove.mock.calls, releases: state.release.mock.calls.length,
    cloudCalls: bridges.cloud.mock.calls.length, persistCalls: bridges.persist.mock.calls.length,
  }));
  return { value, error };
}
function readOnly(state: ReturnType<typeof fixture>, before: Map<string, string>, expectedReads = 1) {
  expect(state.bytes).toEqual(before);
  expect(state.get).toHaveBeenCalledTimes(expectedReads);
  if (expectedReads > 0) expect(state.get).toHaveBeenCalledWith(KEY);
  expect(state.put).not.toHaveBeenCalled(); expect(state.remove).not.toHaveBeenCalled();
  expect(state.release).not.toHaveBeenCalled();
  expect(bridges.cloud).not.toHaveBeenCalled(); expect(bridges.persist).not.toHaveBeenCalled();
}

const malformedShapes = [
  { label: "literal JSON null", raw: "null" },
  { label: "array", raw: "[]" },
  { label: "number primitive", raw: "42" },
  { label: "boolean primitive", raw: "false" },
  { label: "missing required own longest field", raw: '{"lastActiveDate":"2026-10-16","currentStreak":3}' },
  { label: "numeric date field", raw: '{"lastActiveDate":42,"currentStreak":3,"longestStreak":3}' },
  { label: "string counter", raw: '{"lastActiveDate":"2026-10-16","currentStreak":"3","longestStreak":3}' },
  { label: "fractional counter", raw: '{"lastActiveDate":"2026-10-16","currentStreak":1.5,"longestStreak":3}' },
  { label: "negative counter", raw: '{"lastActiveDate":"2026-10-16","currentStreak":-1,"longestStreak":3}' },
  { label: "unsafe integer counter", raw: '{"lastActiveDate":"2026-10-16","currentStreak":9007199254740992,"longestStreak":9007199254740992}' },
  { label: "nonfinite parsed counter", raw: '{"lastActiveDate":"2026-10-16","currentStreak":1e309,"longestStreak":1e309}' },
  { label: "longest smaller than current", raw: '{"lastActiveDate":"2026-10-16","currentStreak":4,"longestStreak":3}' },
  { label: "nonexistent calendar date", raw: '{"lastActiveDate":"2026-02-30","currentStreak":3,"longestStreak":3}' },
  { label: "noncanonical calendar date", raw: '{"lastActiveDate":"2026-2-03","currentStreak":3,"longestStreak":3}' },
  { label: "future UTC date", raw: '{"lastActiveDate":"2026-10-17","currentStreak":3,"longestStreak":3}' },
  { label: "empty date with positive history", raw: '{"lastActiveDate":"","currentStreak":0,"longestStreak":3}' },
] as const;

beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date(TODAY + "T12:00:00.000Z"));
  vi.stubGlobal("window", new EventTarget());
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("FIXTURE no network in C42 reader review"); }));
  ({ getStreak: actualGetStreak } = await import("@/lib/streak"));
});
afterEach(() => {
  expect(fetch).not.toHaveBeenCalled();
  vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks();
});

describe("C42 actual public streak reader safe display shape", () => {
  it.each(malformedShapes)("$label returns the existing in-memory fallback and preserves raw bytes", sample => {
    const state = fixture(sample.raw), before = new Map(state.bytes), outcome = observe(sample.label, state, before);
    expect(outcome.error).toBeNull(); expect(outcome.value).toEqual(FALLBACK); readOnly(state, before);
  });

  it("absent key retains the existing empty display convention without writing it", () => {
    const state = fixture(null), before = new Map(state.bytes), outcome = observe("absent", state, before);
    expect(outcome.error).toBeNull(); expect(outcome.value).toEqual(FALLBACK); readOnly(state, before);
  });

  it("invalid JSON retains the historical parse fallback and exact corrupt bytes", () => {
    const state = fixture("{FIXTURE_BAD_JSON"), before = new Map(state.bytes), outcome = observe("invalid JSON control", state, before);
    expect(outcome.error).toBeNull(); expect(outcome.value).toEqual(FALLBACK); readOnly(state, before);
  });

  it("present empty string retains the historical fallback without repair", () => {
    const state = fixture(""), before = new Map(state.bytes), outcome = observe("empty raw control", state, before);
    expect(outcome.error).toBeNull(); expect(outcome.value).toEqual(FALLBACK); readOnly(state, before);
  });

  it("valid history preserves unknown own JSON members including proto and constructor safely", () => {
    const raw = '{"lastActiveDate":"2026-10-16","currentStreak":3,"longestStreak":5,"future":{"kept":true},"__proto__":{"C42polluted":true},"constructor":{"own":"retained"}}';
    const state = fixture(raw), before = new Map(state.bytes), outcome = observe("valid unknown own fields", state, before);
    expect(outcome.error).toBeNull();
    expect(outcome.value).toMatchObject({ lastActiveDate: TODAY, currentStreak: 3, longestStreak: 5, future: { kept: true } });
    expect(Object.getOwnPropertyDescriptor(outcome.value, "__proto__")?.value).toEqual({ C42polluted: true });
    expect(Object.getOwnPropertyDescriptor(outcome.value, "constructor")?.value).toEqual({ own: "retained" });
    expect(Object.getPrototypeOf(outcome.value)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).C42polluted).toBeUndefined(); readOnly(state, before);
  });

  it("canonical stored empty zero record preserves its unknown fields", () => {
    const state = fixture('{"lastActiveDate":"","currentStreak":0,"longestStreak":0,"future":"kept"}');
    const before = new Map(state.bytes), outcome = observe("canonical empty zero", state, before);
    expect(outcome.error).toBeNull(); expect(outcome.value).toEqual({ ...FALLBACK, future: "kept" }); readOnly(state, before);
  });

  it("valid nonempty date and zero current with safe maximum longest introduce no new minimum or cap", () => {
    const state = fixture('{"lastActiveDate":"2026-10-15","currentStreak":0,"longestStreak":9007199254740991}');
    const before = new Map(state.bytes), outcome = observe("valid zero current safe maximum", state, before);
    expect(outcome.error).toBeNull();
    expect(outcome.value).toEqual({ lastActiveDate: "2026-10-15", currentStreak: 0, longestStreak: Number.MAX_SAFE_INTEGER }); readOnly(state, before);
  });

  it("denied read retains the historical fallback without mutation or implicit retry", () => {
    const state = fixture(HEALTHY); state.deny();
    const before = new Map(state.bytes), outcome = observe("read denied control", state, before);
    expect(outcome.error).toBeNull(); expect(outcome.value).toEqual(FALLBACK); readOnly(state, before);
  });

  it("server-side preguard returns the existing fallback without touching storage", () => {
    const state = fixture(HEALTHY); vi.stubGlobal("window", undefined);
    const before = new Map(state.bytes), outcome = observe("SSR control", state, before);
    expect(outcome.error).toBeNull(); expect(outcome.value).toEqual(FALLBACK); readOnly(state, before, 0);
  });

  it("stale-owner preguard returns the existing fallback without reading another scope", () => {
    const state = fixture(HEALTHY); state.stop();
    const before = new Map(state.bytes), outcome = observe("stale owner control", state, before);
    expect(outcome.error).toBeNull(); expect(outcome.value).toEqual(FALLBACK); readOnly(state, before, 0);
  });

  it("owner loss during the single read cannot publish the stale snapshot", () => {
    const state = fixture(HEALTHY); state.loseAfterRead();
    const before = new Map(state.bytes), outcome = observe("owner loss after read", state, before);
    expect(outcome.error).toBeNull(); expect(outcome.value).toEqual(FALLBACK); readOnly(state, before);
  });
});
