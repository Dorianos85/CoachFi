import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle } from "@/lib/product-storage";

const bridges = vi.hoisted(() => ({ cloud: vi.fn(), persist: vi.fn() }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: bridges.cloud }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: bridges.persist }));

const KEY = "coachfi-streak";
const TODAY = "2026-10-16";
const YESTERDAY = "2026-10-15";
let streak: typeof import("@/lib/streak");
let network: ReturnType<typeof vi.fn>;

function raw(date = YESTERDAY, currentStreak = 2, longestStreak = 5): string {
  return JSON.stringify({ lastActiveDate: date, currentStreak, longestStreak });
}

function fixture(initial: string | null) {
  const values = new Map<string, string>([["coachfi-tokens", "125"], ["FIXTURE_UNRELATED", "retained"]]);
  if (initial !== null) values.set(KEY, initial);
  let current = true;
  let afterRead: (() => void) | undefined;
  const order: string[] = [];
  const get = vi.fn((key: string): string | null => {
    order.push("read");
    const value = values.get(key) ?? null;
    afterRead?.();
    return value;
  });
  const put = vi.fn((key: string, value: string): boolean => {
    order.push("write");
    if (!current) return false;
    values.set(key, value);
    return true;
  });
  const remove = vi.fn(() => { throw new Error("C41 writer must not remove data"); });
  const storage: PersonalStorageHandle = {
    owner: { kind: "guest" }, revision: 41, area: "local",
    isCurrent: () => current, getItem: get, setItem: put, removeItem: remove,
    release: () => { current = false; },
  };
  bridges.cloud.mockImplementation(() => { order.push("notify"); });
  bridges.persist.mockImplementation(() => { order.push("persist"); });
  return { values, storage, order, get, put, remove,
    stop: () => { current = false; }, onRead: (callback: () => void) => { afterRead = callback; } };
}

function noMutation(state: ReturnType<typeof fixture>, before: Map<string, string>): void {
  expect(state.values).toEqual(before);
  expect(state.put).not.toHaveBeenCalled();
  expect(state.remove).not.toHaveBeenCalled();
  expect(bridges.cloud).not.toHaveBeenCalled();
  expect(bridges.persist).not.toHaveBeenCalled();
}

beforeEach(async () => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`));
  vi.stubGlobal("window", {});
  network = vi.fn(() => { throw new Error("C41 author fixture forbids provider/network calls"); });
  vi.stubGlobal("fetch", network);
  // This import exists before implementation. No planned companion export is
  // imported or fabricated in the pre-change compatibility baseline.
  streak = await import("@/lib/streak");
});

afterEach(() => {
  expect(network).not.toHaveBeenCalled();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("C41 existing public streak API compatibility across receipt extraction", () => {
  it("returns the existing data shape after one strict read and the existing ordered effects", () => {
    const state = fixture(raw());
    const result = streak.markActiveToday(state.storage);
    expect(result).toEqual({ lastActiveDate: TODAY, currentStreak: 3, longestStreak: 5 });
    expect(Object.keys(result).sort()).toEqual(["currentStreak", "lastActiveDate", "longestStreak"]);
    expect(state.get).toHaveBeenCalledExactlyOnceWith(KEY);
    expect(state.order).toEqual(["read", "write", "notify", "persist"]);
    expect(bridges.persist).toHaveBeenCalledExactlyOnceWith("streak", state.storage);
    expect(state.values.get("coachfi-tokens")).toBe("125");
  });

  it("keeps an already-counted milestone byte-exact with one read and no mutation or acknowledgement", () => {
    const initial = ' { "lastActiveDate" : "2026-10-16", "currentStreak" : 3, "longestStreak" : 5 }\n';
    const state = fixture(initial), before = new Map(state.values);
    expect(streak.markActiveToday(state.storage)).toEqual({ lastActiveDate: TODAY, currentStreak: 3, longestStreak: 5 });
    expect(state.get).toHaveBeenCalledExactlyOnceWith(KEY);
    noMutation(state, before);
  });

  it("does not confuse existing unknown data and advanced member names with an outer receipt", () => {
    const initial = { lastActiveDate: YESTERDAY, currentStreak: 2, longestStreak: 5,
      data: { marker: "FIXTURE_UNKNOWN" }, advanced: "FIXTURE_UNKNOWN", future: [1, null] };
    const state = fixture(JSON.stringify(initial));
    expect(streak.markActiveToday(state.storage)).toEqual({ ...initial, lastActiveDate: TODAY, currentStreak: 3 });
    expect(JSON.parse(state.values.get(KEY) ?? "null")).toEqual({ ...initial, lastActiveDate: TODAY, currentStreak: 3 });
    expect(state.get).toHaveBeenCalledTimes(1);
  });

  it("retains the first activity data result for absent storage", () => {
    const state = fixture(null);
    expect(streak.markActiveToday(state.storage)).toEqual({ lastActiveDate: TODAY, currentStreak: 1, longestStreak: 1 });
    expect(state.get).toHaveBeenCalledTimes(1);
    expect(state.put).toHaveBeenCalledTimes(1);
    expect(state.values.get("coachfi-tokens")).toBe("125");
  });

  it("retains the existing grace-day transition and milestone", () => {
    const state = fixture(raw("2026-10-14"));
    const result = streak.markActiveToday(state.storage);
    expect(result).toEqual({ lastActiveDate: TODAY, currentStreak: 3, longestStreak: 5 });
    expect(streak.reachedMilestone(result.currentStreak)).toBe(3);
    expect(state.get).toHaveBeenCalledTimes(1);
  });

  it("retains the gap-three reset and existing longest history", () => {
    const state = fixture(raw("2026-10-13", 7, 10));
    expect(streak.markActiveToday(state.storage)).toEqual({ lastActiveDate: TODAY, currentStreak: 1, longestStreak: 10 });
    expect(state.get).toHaveBeenCalledTimes(1);
  });

  it("propagates a transient strict read denial without silently retrying or returning fallback data", () => {
    const state = fixture(raw(TODAY, 3)), before = new Map(state.values);
    state.get.mockImplementationOnce(() => { throw new Error("FIXTURE_TRANSIENT_READ"); });
    expect(() => streak.markActiveToday(state.storage)).toThrow("FIXTURE_TRANSIENT_READ");
    expect(state.get).toHaveBeenCalledTimes(1);
    noMutation(state, before);
  });

  it("still rejects malformed stored bytes before any write", () => {
    const state = fixture('{"lastActiveDate":'), before = new Map(state.values);
    expect(() => streak.markActiveToday(state.storage)).toThrow();
    expect(state.get).toHaveBeenCalledTimes(1);
    noMutation(state, before);
  });

  it("retains the stale-owner error before any data read", () => {
    const state = fixture(raw()), before = new Map(state.values);
    state.stop();
    expect(() => streak.markActiveToday(state.storage)).toThrow("Storage session changed");
    expect(state.get).not.toHaveBeenCalled();
    noMutation(state, before);
  });

  it("retains the owner check after the one strict read", () => {
    const state = fixture(raw()), before = new Map(state.values);
    state.onRead(state.stop);
    expect(() => streak.markActiveToday(state.storage)).toThrow("Storage session changed");
    expect(state.get).toHaveBeenCalledTimes(1);
    noMutation(state, before);
  });

  it("does not return a successful public result when the setter declines", () => {
    const state = fixture(raw()), before = new Map(state.values);
    state.put.mockReturnValueOnce(false);
    expect(() => streak.markActiveToday(state.storage)).toThrow("Storage session changed");
    expect(state.values).toEqual(before);
    expect(bridges.cloud).not.toHaveBeenCalled();
    expect(bridges.persist).not.toHaveBeenCalled();
  });

  it("propagates a write-then-throw while preserving the explicitly possible partial write", () => {
    const state = fixture(raw());
    state.put.mockImplementationOnce((key, value) => {
      state.values.set(key, value);
      throw new Error("FIXTURE_WRITE_AFTER");
    });
    expect(() => streak.markActiveToday(state.storage)).toThrow("FIXTURE_WRITE_AFTER");
    expect(JSON.parse(state.values.get(KEY) ?? "null")).toMatchObject({ currentStreak: 3, lastActiveDate: TODAY });
    expect(bridges.cloud).not.toHaveBeenCalled();
    expect(bridges.persist).not.toHaveBeenCalled();
  });

  it("propagates notification failure after the write instead of returning a data result", () => {
    const state = fixture(raw());
    bridges.cloud.mockImplementationOnce(() => { throw new Error("FIXTURE_NOTIFY_AFTER"); });
    expect(() => streak.markActiveToday(state.storage)).toThrow("FIXTURE_NOTIFY_AFTER");
    expect(state.put).toHaveBeenCalledTimes(1);
    expect(bridges.persist).not.toHaveBeenCalled();
  });

  it("propagates persistence failure after the previous boundaries instead of returning success", () => {
    const state = fixture(raw());
    bridges.persist.mockImplementationOnce(() => { throw new Error("FIXTURE_PERSIST_AFTER"); });
    expect(() => streak.markActiveToday(state.storage)).toThrow("FIXTURE_PERSIST_AFTER");
    expect(state.put).toHaveBeenCalledTimes(1);
    expect(bridges.cloud).toHaveBeenCalledExactlyOnceWith("streak");
    expect(bridges.persist).toHaveBeenCalledExactlyOnceWith("streak", state.storage);
  });
});
