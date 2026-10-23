import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as streakModule from "@/lib/streak";
import type { StreakData } from "@/lib/streak";
import type { PersonalStorageHandle } from "@/lib/product-storage";

const bridges = vi.hoisted(() => ({ cloud: vi.fn(), persist: vi.fn() }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: bridges.cloud }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: bridges.persist }));

const KEY = "coachfi-streak";
const EMPTY = { lastActiveDate: "", currentStreak: 0, longestStreak: 0 };
const HEALTHY = { lastActiveDate: "2026-01-15", currentStreak: 3, longestStreak: 7 };
const HEALTHY_RAW = JSON.stringify(HEALTHY);
type State = { status: "available"; data: StreakData } | { status: "unavailable"; data: null };
type Options = { ssr?: boolean; noOwner?: boolean; stale?: boolean; loseAfterRead?: boolean; deny?: boolean };

function storageFixture(raw: string | null, options: Options = {}) {
  const bytes = new Map<string, string>([["coachfi-tokens", "125"], ["FIXTURE_UNRELATED", "retained"]]);
  if (raw !== null) bytes.set(KEY, raw);
  let current = !options.noOwner && !options.stale;
  let denied = options.deny === true;
  const get = vi.fn((key: string): string | null => {
    if (denied) throw new Error("FIXTURE streak read denied");
    const value = bytes.get(key) ?? null;
    if (options.loseAfterRead) current = false;
    return value;
  });
  const put = vi.fn((_key: string, _value: string): boolean => { throw new Error("FIXTURE read must not write"); });
  const remove = vi.fn((_key: string): boolean => { throw new Error("FIXTURE read must not remove"); });
  const release = vi.fn(() => { throw new Error("FIXTURE read must not release storage"); });
  const storage: PersonalStorageHandle = Object.freeze({
    owner: options.noOwner ? null : Object.freeze({ kind: "guest" as const }), revision: 45, area: "local" as const,
    isCurrent: () => current, getItem: get, setItem: put, removeItem: remove, release,
  });
  return { storage, bytes, get, put, remove, release, allowRead: () => { denied = false; } };
}
function candidateReader(): unknown {
  // Optional namespace access compiles against the old module without inventing
  // an export. Absence is a per-case new-API contract failure, not a load error.
  return (streakModule as unknown as Partial<Record<"readStreakState", unknown>>).readStreakState;
}
function assertUnchanged(f: ReturnType<typeof storageFixture>, before: Map<string, string>) {
  expect(f.bytes).toEqual(before);
  expect(f.bytes.get("coachfi-tokens")).toBe("125");
  expect(f.put).not.toHaveBeenCalled(); expect(f.remove).not.toHaveBeenCalled(); expect(f.release).not.toHaveBeenCalled();
}
function probe(label: string, raw: string | null, expected: State, options: Options = {}) {
  vi.stubGlobal("window", options.ssr ? undefined : new EventTarget());
  // Separate equal-input handles prevent the legacy getter from consuming a
  // one-shot ownership transition or a fault intended for the explicit reader.
  const legacy = storageFixture(raw, options), actual = storageFixture(raw, options);
  const legacyBefore = new Map(legacy.bytes), before = new Map(actual.bytes);
  const legacyData = streakModule.getStreak(legacy.storage);
  const candidate = candidateReader();
  let result: unknown, error: unknown;
  if (typeof candidate === "function") {
    try { result = (candidate as (storage: PersonalStorageHandle) => unknown)(actual.storage); }
    catch (caught) { error = caught; }
  }
  console.log("C45_STREAK_DATA_OBSERVATION " + JSON.stringify({ label, raw, options,
    apiPresent: typeof candidate === "function", legacyData, result,
    error: error instanceof Error ? { name: error.name, message: error.message } : error,
    reads: actual.get.mock.calls.map(call => call[0]), legacyReads: legacy.get.mock.calls.map(call => call[0]),
    rawAfter: actual.bytes.get(KEY) ?? null, tokens: actual.bytes.get("coachfi-tokens"),
    writes: actual.put.mock.calls.length, removes: actual.remove.mock.calls.length, releases: actual.release.mock.calls.length,
    cloudCalls: bridges.cloud.mock.calls.length, persistCalls: bridges.persist.mock.calls.length,
    fetchCalls: vi.mocked(fetch).mock.calls.length }));
  expect(legacyData).toEqual(expected.status === "available" ? expected.data : EMPTY);
  assertUnchanged(legacy, legacyBefore); assertUnchanged(actual, before);
  expect(candidate, "New explicit read result is required; missing export is not a legacy getter defect").toBeTypeOf("function");
  expect(error, "Expected availability result rather than an uncaught read/schema error").toBeUndefined();
  expect(result).toEqual(expected);
  expect(actual.get.mock.calls.map(call => call[0])).toEqual(options.ssr || options.noOwner || options.stale ? [] : [KEY]);
  return result;
}
function available(data: StreakData): State { return { status: "available", data }; }
const UNAVAILABLE: State = { status: "unavailable", data: null };

beforeEach(() => {
  vi.clearAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
  vi.stubGlobal("window", new EventTarget());
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("FIXTURE no network in streak availability review"); }));
});
afterEach(() => {
  expect(fetch).not.toHaveBeenCalled(); expect(bridges.cloud).not.toHaveBeenCalled(); expect(bridges.persist).not.toHaveBeenCalled();
  vi.useRealTimers(); vi.unstubAllGlobals();
});

describe("C45 explicit streak read availability with actual legacy compatibility", () => {
  it("absent bytes are available empty data without creating a record", () => {
    probe("absent", null, available(EMPTY));
  });
  it("canonical stored empty data stays available and retains its own extra member", () => {
    const data = { ...EMPTY, fixtureNote: "retained" };
    probe("canonical-empty", JSON.stringify(data), available(data));
  });
  it("healthy current-day data is available without a streak transition", () => {
    probe("healthy", HEALTHY_RAW, available(HEALTHY));
  });
  it("valid leap-day history retains unknown own proto and constructor members", () => {
    const raw = '{"lastActiveDate":"2024-02-29","currentStreak":2,"longestStreak":7,"__proto__":{"fixture":"own"},"constructor":{"fixture":"kept"},"note":[1,2]}';
    const expected = JSON.parse(raw) as StreakData;
    const result = probe("unknown-own-members", raw, available(expected));
    if (typeof result !== "object" || result === null || !("data" in result) || typeof result.data !== "object" || result.data === null) {
      throw new Error("FIXTURE expected checked available data");
    }
    expect(Object.getPrototypeOf(result.data)).toBe(Object.prototype);
    expect(Object.prototype.hasOwnProperty.call(result.data, "__proto__")).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(result.data, "constructor")).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, "fixture")).toBe(false);
  });
  it("empty and malformed JSON bytes are unavailable rather than an absent record", () => {
    for (const raw of ["", "{FIXTURE_corrupt"]) probe("malformed-json", raw, UNAVAILABLE);
  });
  it("JSON null is unavailable without being rewritten as empty", () => {
    probe("json-null", "null", UNAVAILABLE);
  });
  it("array data is unavailable instead of publishing zero or undefined counters", () => {
    probe("array", "[]", UNAVAILABLE);
  });
  it("a JSON string primitive is unavailable without coercion", () => {
    probe("primitive", '"FIXTURE text"', UNAVAILABLE);
  });
  it("a missing required own field is unavailable without filling a default", () => {
    probe("missing-field", '{"lastActiveDate":"2026-01-15","currentStreak":3}', UNAVAILABLE);
  });
  it("wrong-type fractional and negative counters are unavailable without normalization", () => {
    for (const currentStreak of ["3", 3.5, -1]) {
      probe("invalid-counter", JSON.stringify({ ...HEALTHY, currentStreak }), UNAVAILABLE);
    }
  });
  it("unsafe counters are unavailable without a new business cap", () => {
    probe("unsafe-counter", JSON.stringify({ ...HEALTHY, currentStreak: 9007199254740992, longestStreak: 9007199254740992 }), UNAVAILABLE);
  });
  it("longest below current is unavailable rather than silently repaired", () => {
    probe("longest-below-current", JSON.stringify({ ...HEALTHY, longestStreak: 2 }), UNAVAILABLE);
  });
  it("invalid calendar and nonempty-count empty-date records are unavailable", () => {
    for (const lastActiveDate of ["2025-02-30", ""]) {
      probe("invalid-date", JSON.stringify({ ...HEALTHY, lastActiveDate }), UNAVAILABLE);
    }
  });
  it("future history is unavailable rather than a valid displayed streak", () => {
    probe("future-date", JSON.stringify({ ...HEALTHY, lastActiveDate: "2026-01-16" }), UNAVAILABLE);
  });
  it("server context is unavailable without reading storage", () => {
    probe("server", HEALTHY_RAW, UNAVAILABLE, { ssr: true });
  });
  it("a pending handle with no owner is unavailable without a physical read", () => {
    probe("no-owner", HEALTHY_RAW, UNAVAILABLE, { noOwner: true });
  });
  it("a stale owner handle is unavailable before reading its old bytes", () => {
    probe("stale-owner", HEALTHY_RAW, UNAVAILABLE, { stale: true });
  });
  it("ownership lost after the raw read makes that result unavailable", () => {
    probe("owner-lost-after-read", HEALTHY_RAW, UNAVAILABLE, { loseAfterRead: true });
  });
  it("a denied raw read is unavailable while legacy getter retains its old empty fallback", () => {
    probe("read-denied", HEALTHY_RAW, UNAVAILABLE, { deny: true });
  });
  it("a later successful strict read can recover without a write or replay", () => {
    const f = storageFixture(HEALTHY_RAW, { deny: true }), before = new Map(f.bytes);
    const candidate = candidateReader();
    console.log("C45_STREAK_DATA_RECOVERY " + JSON.stringify({ apiPresent: typeof candidate === "function", raw: HEALTHY_RAW }));
    expect(streakModule.getStreak(f.storage)).toEqual(EMPTY);
    expect(candidate, "New explicit read result is required; no future import is assumed").toBeTypeOf("function");
    if (typeof candidate !== "function") throw new Error("FIXTURE explicit read API absent");
    const read = candidate as (storage: PersonalStorageHandle) => unknown;
    expect(read(f.storage)).toEqual(UNAVAILABLE);
    f.allowRead();
    expect(read(f.storage)).toEqual(available(HEALTHY));
    expect(streakModule.getStreak(f.storage)).toEqual(HEALTHY);
    assertUnchanged(f, before);
    expect(f.get.mock.calls.map(call => call[0])).toEqual([KEY, KEY, KEY, KEY]);
  });
});
