import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle, StorageOwner } from "@/lib/product-storage";

// Only writer-only dependencies are mocked. The sanitizer, owned export builder,
// strict reader, owner leases and captured storage handles are actual modules.
const writerEffects = vi.hoisted(() => ({ persist: vi.fn(), notify: vi.fn() }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: writerEffects.persist }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: writerEffects.notify }));

const DAY = "2026-10-16";
const NOW = "2026-10-17T12:00:00.000Z";
const PRIVATE = "TEST_C48_PRIVATE_NOT_PRODUCT_DATA";
const valid = (currentStreak = 3, longestStreak = 7) => ({
  lastActiveDate: DAY, currentStreak, longestStreak,
});
const malformed = [
  { name: "fractional current", value: valid(1.5, 4) },
  { name: "fractional longest", value: valid(2, 4.5) },
  { name: "longest below current", value: valid(4, 3) },
] as const;

let store: typeof import("@/lib/product-storage");
let data: typeof import("@/lib/data-export");
let streak: typeof import("@/lib/streak");
let local: Map<string, string>;
let session: Map<string, string>;
let physicalLocal: ReturnType<typeof physicalStorage>;
let physicalSession: ReturnType<typeof physicalStorage>;
let onRead: ((area: "local" | "session", key: string) => void) | undefined;
let outbound: ReturnType<typeof vi.fn>;

function physicalStorage(values: Map<string, string>, area: "local" | "session") {
  return {
    getItem: vi.fn((key: string) => {
      const value = values.get(key) ?? null;
      onRead?.(area, key);
      return value;
    }),
    setItem: vi.fn((key: string, value: string) => { values.set(key, value); }),
    removeItem: vi.fn((key: string) => { values.delete(key); }),
  };
}

function snapshot() {
  return { local: [...local.entries()], session: [...session.entries()] };
}

function clearWritesAndReads() {
  for (const storage of [physicalLocal, physicalSession]) {
    storage.getItem.mockClear();
    storage.setItem.mockClear();
    storage.removeItem.mockClear();
  }
}

function seedOwner(
  localValues: Record<string, unknown>,
  sessionValues: Record<string, unknown> = {},
  owner: StorageOwner = { kind: "guest" },
) {
  const lease = store.beginStorageOwner(owner);
  for (const [values, handle] of [[localValues, lease.storage], [sessionValues, lease.sessionStorage]] as const) {
    for (const [key, value] of Object.entries(values)) {
      expect(handle.setItem(key, JSON.stringify(value))).toBe(true);
    }
  }
  expect(lease.publishReady()).toBe(true);
  clearWritesAndReads();
  return {
    local: store.captureCurrentPersonalStorage(),
    session: store.captureCurrentPersonalStorage("session"),
  };
}

function traced(handle: PersonalStorageHandle) {
  return { ...handle, getItem: vi.fn((key: string) => handle.getItem(key)) };
}

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
  writerEffects.persist.mockClear();
  writerEffects.notify.mockClear();
  local = new Map();
  session = new Map();
  onRead = undefined;
  physicalLocal = physicalStorage(local, "local");
  physicalSession = physicalStorage(session, "session");
  vi.stubGlobal("window", {
    localStorage: physicalLocal,
    sessionStorage: physicalSession,
    dispatchEvent: vi.fn(() => true),
  });
  outbound = vi.fn(() => { throw new Error("No network is authorized in C48 fixtures"); });
  vi.stubGlobal("fetch", outbound);
  store = await import("@/lib/product-storage");
  data = await import("@/lib/data-export");
  streak = await import("@/lib/streak");
});

afterEach(() => {
  expect(outbound).not.toHaveBeenCalled();
  expect(writerEffects.persist).not.toHaveBeenCalled();
  expect(writerEffects.notify).not.toHaveBeenCalled();
  for (const storage of [physicalLocal, physicalSession]) {
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  }
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("C48 selected streak sanitizer and actual strict reader", () => {
  it.each(malformed)("omits $name already rejected by actual reader", ({ value }) => {
    const handles = seedOwner({ "coachfi-streak": value });
    const before = snapshot();
    const original = structuredClone(value);
    expect(streak.readStreakState(handles.local)).toEqual({ status: "unavailable", data: null });
    const clean = data.sanitizeProductValue("coachfi-streak", value);
    expect(value).toEqual(original);
    expect(snapshot()).toEqual(before);
    expect(clean).toBeUndefined();
  });

  it.each([
    { name: "dated zero counters", value: valid(0, 0) },
    { name: "existing inclusive export cap", value: valid(100000, 100000) },
  ])("keeps $name without coercion or rounding", ({ value }) => {
    const handles = seedOwner({ "coachfi-streak": value });
    const before = snapshot();
    expect(streak.readStreakState(handles.local)).toEqual({ status: "available", data: value });
    expect(data.sanitizeProductValue("coachfi-streak", value)).toEqual(value);
    expect(snapshot()).toEqual(before);
  });

  it("rebuilds only the healthy selected fields and does not mutate unknown raw fields", () => {
    const value = { ...valid(), identity: { access_token: PRIVATE }, extra: PRIVATE };
    const original = structuredClone(value);
    expect(data.sanitizeProductValue("coachfi-streak", value)).toEqual(valid());
    expect(value).toEqual(original);
  });

  it("preserves export cap rather than widening it to every strict-reader integer", () => {
    const value = valid(100001, 100001);
    const handles = seedOwner({ "coachfi-streak": value });
    const before = snapshot();
    expect(streak.readStreakState(handles.local)).toEqual({ status: "available", data: value });
    expect(data.sanitizeProductValue("coachfi-streak", value)).toBeUndefined();
    expect(snapshot()).toEqual(before);
  });

  it("preserves the existing export calendar policy without claiming full reader equivalence", () => {
    const value = { ...valid(), lastActiveDate: "2027-01-01" };
    const handles = seedOwner({ "coachfi-streak": value });
    const before = snapshot();
    expect(streak.readStreakState(handles.local)).toEqual({ status: "unavailable", data: null });
    expect(data.sanitizeProductValue("coachfi-streak", value)).toEqual(value);
    expect(snapshot()).toEqual(before);
  });

  it("preserves omission of the empty-date sentinel although strict reader accepts it", () => {
    const value = { lastActiveDate: "", currentStreak: 0, longestStreak: 0 };
    const handles = seedOwner({ "coachfi-streak": value });
    const before = snapshot();
    expect(streak.readStreakState(handles.local)).toEqual({ status: "available", data: value });
    expect(data.sanitizeProductValue("coachfi-streak", value)).toBeUndefined();
    expect(snapshot()).toEqual(before);
  });

  it("continues omitting an invalid calendar date without repairing stored bytes", () => {
    const value = { ...valid(), lastActiveDate: "2026-02-30" };
    const handles = seedOwner({ "coachfi-streak": value });
    const before = snapshot();
    expect(streak.readStreakState(handles.local)).toEqual({ status: "unavailable", data: null });
    expect(data.sanitizeProductValue("coachfi-streak", value)).toBeUndefined();
    expect(snapshot()).toEqual(before);
  });
});

describe("C48 actual current-owner selected export", () => {
  const ownedCases = malformed.flatMap(item => (["local", "session"] as const).map(area => ({ ...item, area })));

  it.each(ownedCases)("omits $name in $area while preserving the healthy other area and selected fields", ({ value, area }) => {
    local.set("coachfi-locale-v1", "pl");
    session.set("coachfi-locale-v1", "en");
    local.set("cdp-session", PRIVATE);
    session.set("unknown-product-key", PRIVATE);
    const handles = seedOwner({
      "coachfi-streak": area === "local" ? value : { ...valid(), identity: PRIVATE },
      "coachfi-tokens": 125,
      "coachfi-user": { setupDone: true, name: PRIVATE, goal: PRIVATE },
      "coachfi-lesson-steps": { inflation: 2, identity: PRIVATE },
    }, {
      "coachfi-streak": area === "session" ? value : { ...valid(), identity: PRIVATE },
      "coachfi-tokens": 9,
      "coachfi-user": { setupDone: false, refresh_token: PRIVATE },
    }, { kind: "account", provider: "cdp", userId: PRIVATE });
    const before = snapshot();
    expect(streak.readStreakState(handles[area])).toEqual({ status: "unavailable", data: null });
    const localHandle = traced(handles.local), sessionHandle = traced(handles.session);
    const payload = data.buildOwnedLocalDataExport(localHandle, sessionHandle);
    expect(payload.version).toBe(2);
    expect(payload.ownerKind).toBe("account");
    expect(payload.scope).toBe("selected_current_owner_local_product_data");
    expect(payload.exportedAt).toBe(NOW);
    expect(payload.devicePreferencesIncluded).toEqual(["locale"]);
    expect(payload.localStorage["coachfi-tokens"]).toBe(125);
    expect(payload.sessionStorage["coachfi-tokens"]).toBe(9);
    expect(payload.localStorage["coachfi-user"]).toEqual({ setupDone: true });
    expect(payload.sessionStorage["coachfi-user"]).toEqual({ setupDone: false });
    expect(payload.localStorage["coachfi-lesson-steps"]).toEqual({ inflation: 2 });
    expect(payload.localStorage["coachfi-locale-v1"]).toBe("pl");
    expect(payload.sessionStorage["coachfi-locale-v1"]).toBe("en");
    expect(localHandle.getItem.mock.calls.map(([key]) => key)).toEqual([...data.LOCAL_PRODUCT_KEYS]);
    expect(sessionHandle.getItem.mock.calls.map(([key]) => key)).toEqual([...data.LOCAL_PRODUCT_KEYS]);
    expect(JSON.stringify(payload)).not.toMatch(/TEST_C48_PRIVATE|coachfi-owned|userId|access_token|refresh_token/);
    const invalidArea = area === "local" ? payload.localStorage : payload.sessionStorage;
    const healthyArea = area === "local" ? payload.sessionStorage : payload.localStorage;
    expect(healthyArea["coachfi-streak"]).toEqual(valid());
    expect(snapshot()).toEqual(before);
    expect(invalidArea).not.toHaveProperty("coachfi-streak");
  });

  it("rejects mixed and stale owner handles before physical collection", () => {
    const first = seedOwner({ "coachfi-streak": valid() }, {}, { kind: "account", provider: "cdp", userId: "TEST_C48_A" });
    const second = seedOwner({ "coachfi-streak": valid() }, {}, { kind: "account", provider: "cdp", userId: "TEST_C48_B" });
    const before = snapshot();
    expect(() => data.buildOwnedLocalDataExport(first.local, second.session)).toThrow("Storage owner changed");
    expect(() => data.buildOwnedLocalDataExport(first.local, first.session)).toThrow("Storage owner changed");
    expect(physicalLocal.getItem).not.toHaveBeenCalled();
    expect(physicalSession.getItem).not.toHaveBeenCalled();
    expect(snapshot()).toEqual(before);
  });

  it("rejects owner change during streak collection without returning a partial old-owner export", () => {
    const handles = seedOwner({ "coachfi-streak": valid(), "coachfi-tokens": 125 }, {},
      { kind: "account", provider: "cdp", userId: "TEST_C48_A" });
    const before = snapshot();
    let changed = false;
    onRead = (area, key) => {
      if (area === "local" && key.endsWith(":coachfi-streak")) {
        onRead = undefined;
        changed = true;
        store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "TEST_C48_B" }).publishReady();
      }
    };
    expect(() => data.buildOwnedLocalDataExport(handles.local, handles.session)).toThrow("Storage owner changed");
    expect(changed).toBe(true);
    expect(handles.local.isCurrent()).toBe(false);
    expect(snapshot()).toEqual(before);
  });
});
