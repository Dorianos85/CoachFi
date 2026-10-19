import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle } from "@/lib/product-storage";

const bridges = vi.hoisted(() => ({ cloud: vi.fn(), persistence: vi.fn() }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: bridges.cloud }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: bridges.persistence }));

const KEY = "coachfi-streak";
const TODAY = "2026-10-16";
const YESTERDAY = "2026-10-15";
type StreakModule = typeof import("@/lib/streak");
let streak: StreakModule;
let network: ReturnType<typeof vi.fn>;

function bytes(date = YESTERDAY, currentStreak = 2, longestStreak = 8): string {
  return JSON.stringify({ lastActiveDate: date, currentStreak, longestStreak });
}

function storageFixture(raw: string | null = null) {
  const values = new Map<string, string>([["FIXTURE_UNRELATED", "preserved"], ["coachfi-tokens", "125"]]);
  if (raw !== null) values.set(KEY, raw);
  let current = true;
  let afterRead: (() => void) | undefined;
  let afterWrite: (() => void) | undefined;
  const get = vi.fn((key: string): string | null => {
    const value = values.get(key) ?? null;
    afterRead?.();
    return value;
  });
  const set = vi.fn((key: string, value: string): boolean => {
    if (!current) return false;
    values.set(key, value);
    afterWrite?.();
    return current;
  });
  const remove = vi.fn((key: string): boolean => {
    if (!current) return false;
    values.delete(key);
    return true;
  });
  const storage: PersonalStorageHandle = {
    owner: { kind: "guest" }, revision: 39, area: "local",
    isCurrent: vi.fn(() => current), getItem: get, setItem: set, removeItem: remove,
    release: () => { current = false; },
  };
  return {
    values, storage, get, set, remove,
    invalidate: () => { current = false; },
    onRead: (hook: () => void) => { afterRead = hook; },
    onWrite: (hook: () => void) => { afterWrite = hook; },
  };
}

function expectNoMutation(h: ReturnType<typeof storageFixture>, original: Map<string, string>): void {
  expect(h.values).toEqual(original);
  expect(h.set).not.toHaveBeenCalled();
  expect(h.remove).not.toHaveBeenCalled();
  expect(bridges.cloud).not.toHaveBeenCalled();
  expect(bridges.persistence).not.toHaveBeenCalled();
  expect(network).not.toHaveBeenCalled();
}

beforeEach(async () => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`));
  vi.stubGlobal("window", {});
  network = vi.fn(() => { throw new Error("C39 synthetic fixture forbids network"); });
  vi.stubGlobal("fetch", network);
  streak = await import("@/lib/streak");
});

afterEach(() => {
  expect(network).not.toHaveBeenCalled();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("C39 author strict streak writer admission", () => {
  const rejected = [
    { kind: "malformed JSON", raw: '{"lastActiveDate":' },
    { kind: "empty raw string", raw: "" },
    { kind: "JSON null", raw: "null" },
    { kind: "array", raw: "[]" },
    { kind: "missing longest field", raw: JSON.stringify({ lastActiveDate: YESTERDAY, currentStreak: 2 }) },
    { kind: "fractional current counter", raw: bytes(YESTERDAY, 2.5, 8) },
    { kind: "negative current counter", raw: bytes(YESTERDAY, -1, 8) },
    { kind: "longest lower than current", raw: bytes(YESTERDAY, 3, 2) },
    { kind: "nonnumeric longest counter", raw: JSON.stringify({ lastActiveDate: YESTERDAY, currentStreak: 2, longestStreak: "8" }) },
    { kind: "impossible calendar date", raw: bytes("2026-02-30", 2, 8) },
    { kind: "future date", raw: bytes("2026-10-17", 2, 8) },
    { kind: "empty date with prior positive counts", raw: bytes("", 0, 8) },
  ] as const;

  it.each(rejected)("preserves $kind bytes and refuses before the first write", ({ raw }) => {
    const h = storageFixture(raw), original = new Map(h.values);
    expect(() => streak.markActiveToday(h.storage)).toThrow();
    expectNoMutation(h, original);
  });

  it("preserves unreadable bytes rather than writing the public reader fallback", () => {
    const h = storageFixture(bytes()), original = new Map(h.values);
    h.get.mockImplementation(() => { throw new Error("FIXTURE_READ_DENIED"); });
    expect(() => streak.markActiveToday(h.storage)).toThrow();
    expectNoMutation(h, original);
  });

  it("refuses a stale owner before reading storage and retains the compatibility error", () => {
    const h = storageFixture(bytes()), original = new Map(h.values);
    h.invalidate();
    expect(() => streak.markActiveToday(h.storage)).toThrow("Storage session changed");
    expect(h.get).not.toHaveBeenCalled();
    expectNoMutation(h, original);
  });

  it("rechecks the owner after the read before attempting a setter", () => {
    const h = storageFixture(bytes()), original = new Map(h.values);
    h.onRead(h.invalidate);
    expect(() => streak.markActiveToday(h.storage)).toThrow("Storage session changed");
    expectNoMutation(h, original);
  });

  it("rejects a safe current counter whose continuation would overflow", () => {
    const h = storageFixture(bytes(YESTERDAY, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER));
    const original = new Map(h.values);
    expect(() => streak.markActiveToday(h.storage)).toThrow();
    expectNoMutation(h, original);
  });

  it("rejects a stored counter already outside the safe integer range", () => {
    const h = storageFixture(bytes(YESTERDAY, 2, Number.MAX_SAFE_INTEGER + 1));
    const original = new Map(h.values);
    expect(() => streak.markActiveToday(h.storage)).toThrow();
    expectNoMutation(h, original);
  });
});

describe("C39 author healthy writer compatibility and bounded failure effects", () => {
  it("starts absent storage at one without awarding tokens directly", () => {
    const h = storageFixture();
    expect(streak.markActiveToday(h.storage)).toEqual({ lastActiveDate: TODAY, currentStreak: 1, longestStreak: 1 });
    expect(h.set).toHaveBeenCalledTimes(1);
    expect(h.values.get("coachfi-tokens")).toBe("125");
    expect(bridges.cloud).toHaveBeenCalledExactlyOnceWith("streak");
    expect(bridges.persistence).toHaveBeenCalledExactlyOnceWith("streak", h.storage);
  });

  it("accepts the existing empty zero-record and retains its unknown members", () => {
    const h = storageFixture('{"lastActiveDate":"","currentStreak":0,"longestStreak":0,"legacyTag":"synthetic"}');
    streak.markActiveToday(h.storage);
    expect(JSON.parse(h.values.get(KEY) ?? "null")).toEqual({
      lastActiveDate: TODAY, currentStreak: 1, longestStreak: 1, legacyTag: "synthetic",
    });
    expect(h.set).toHaveBeenCalledTimes(1);
  });

  it("keeps a healthy same-day raw record byte-exact with no acknowledgement effects", () => {
    const raw = ' { "lastActiveDate" : "2026-10-16", "currentStreak" : 3, "longestStreak" : 8, "legacyTag" : [1,2] }\n';
    const h = storageFixture(raw), original = new Map(h.values);
    expect(streak.markActiveToday(h.storage)).toMatchObject({ lastActiveDate: TODAY, currentStreak: 3, longestStreak: 8 });
    expectNoMutation(h, original);
  });

  it.each([
    { kind: "consecutive day", lastActiveDate: "2026-10-15" },
    { kind: "one forgiven missed day", lastActiveDate: "2026-10-14" },
  ])("retains the existing $kind transition and milestone", ({ lastActiveDate }) => {
    const h = storageFixture(bytes(lastActiveDate, 2, 8));
    const result = streak.markActiveToday(h.storage);
    expect(result).toEqual({ lastActiveDate: TODAY, currentStreak: 3, longestStreak: 8 });
    expect(streak.reachedMilestone(result.currentStreak)).toBe(3);
    expect(h.values.get("coachfi-tokens")).toBe("125");
  });

  it("resets after two missed days without overflowing a safe longest counter", () => {
    const h = storageFixture(bytes("2026-10-13", Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER));
    expect(streak.markActiveToday(h.storage)).toEqual({
      lastActiveDate: TODAY, currentStreak: 1, longestStreak: Number.MAX_SAFE_INTEGER,
    });
    expect(h.set).toHaveBeenCalledTimes(1);
  });

  it("continues across a real leap day using the existing UTC calendar", () => {
    vi.setSystemTime(new Date("2024-03-01T00:30:00Z"));
    const h = storageFixture(bytes("2024-02-29", 4, 4));
    expect(streak.markActiveToday(h.storage)).toEqual({ lastActiveDate: "2024-03-01", currentStreak: 5, longestStreak: 5 });
  });

  it("preserves unknown JSON fields semantically on a valid transition", () => {
    // JSON.parse creates an own data property named __proto__; object-literal
    // prototype syntax would not exercise preservation of those actual bytes.
    const previous: Record<string, unknown> = JSON.parse(
      '{"lastActiveDate":"2026-10-15","currentStreak":4,"longestStreak":8,"legacyTag":{"source":"FIXTURE","values":[null,1,"preserved"]},"constructor":"synthetic-value","__proto__":{"polluted":"FIXTURE"}}',
    );
    const h = storageFixture(JSON.stringify(previous));
    streak.markActiveToday(h.storage);
    const updated: Record<string, unknown> = JSON.parse(h.values.get(KEY) ?? "null");
    expect(updated).toEqual({ ...previous, lastActiveDate: TODAY, currentStreak: 5 });
    expect(Object.prototype.hasOwnProperty.call(updated, "__proto__")).toBe(true);
    expect(Object.getPrototypeOf(updated)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(h.values.get("FIXTURE_UNRELATED")).toBe("preserved");
  });

  it.each(["declined", "throw-before", "write-then-throw"] as const)(
    "propagates the existing %s setter failure without a false acknowledgement", (mode) => {
      const h = storageFixture(bytes()), original = h.values.get(KEY);
      h.set.mockImplementation((key, value) => {
        if (mode === "write-then-throw") h.values.set(key, value);
        if (mode !== "declined") throw new Error("FIXTURE_SETTER_FAILURE");
        return false;
      });
      expect(() => streak.markActiveToday(h.storage)).toThrow();
      expect(h.set).toHaveBeenCalledTimes(1);
      expect(bridges.cloud).not.toHaveBeenCalled();
      expect(bridges.persistence).not.toHaveBeenCalled();
      if (mode === "write-then-throw") {
        expect(JSON.parse(h.values.get(KEY) ?? "null")).toMatchObject({ lastActiveDate: TODAY, currentStreak: 3 });
      } else expect(h.values.get(KEY)).toBe(original);
    },
  );

  it("does not persist after owner loss in the existing notification boundary", () => {
    const h = storageFixture(bytes());
    bridges.cloud.mockImplementationOnce(h.invalidate);
    expect(() => streak.markActiveToday(h.storage)).toThrow("Storage session changed");
    expect(h.set).toHaveBeenCalledTimes(1);
    expect(bridges.persistence).not.toHaveBeenCalled();
  });

  it("propagates notification failure after a write without claiming rollback", () => {
    const h = storageFixture(bytes());
    bridges.cloud.mockImplementationOnce(() => { throw new Error("FIXTURE_NOTIFY_FAILURE"); });
    expect(() => streak.markActiveToday(h.storage)).toThrow("FIXTURE_NOTIFY_FAILURE");
    expect(h.set).toHaveBeenCalledTimes(1);
    expect(JSON.parse(h.values.get(KEY) ?? "null")).toMatchObject({ lastActiveDate: TODAY, currentStreak: 3 });
    expect(bridges.persistence).not.toHaveBeenCalled();
  });
});
