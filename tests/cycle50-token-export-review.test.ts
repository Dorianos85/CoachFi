import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle, StorageOwner } from "@/lib/product-storage";

// Actual sanitizer, collector, builder, token reads and owner leases. Only the
// token writers' downstream persist/notify dependencies are replaced.
const writerEffects = vi.hoisted(() => ({ persist: vi.fn(), notify: vi.fn() }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: writerEffects.persist }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: writerEffects.notify }));

const NOW = "2026-10-18T20:00:00.000Z";
const PRIVATE = "TEST_C50_PRIVATE_NOT_PRODUCT_DATA";
const KEY = "coachfi-tokens";
const fractions = [0.5, 125.5, 999999999.5] as const;
const healthy = [0, 125, 1000000000] as const;
const owners: Array<{ name: string; owner: StorageOwner }> = [
  { name: "guest", owner: { kind: "guest" } },
  { name: "current account", owner: { kind: "account", provider: "cdp", userId: PRIVATE } },
];
const healthyStreak = { lastActiveDate: "2026-10-16", currentStreak: 3, longestStreak: 7 };

let store: typeof import("@/lib/product-storage");
let data: typeof import("@/lib/data-export");
let tokens: typeof import("@/lib/tokens");
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

function clearPhysicalCalls() {
  for (const storage of [physicalLocal, physicalSession]) {
    storage.getItem.mockClear();
    storage.setItem.mockClear();
    storage.removeItem.mockClear();
  }
}

function seedOwnerRaw(
  localValues: Record<string, string>,
  sessionValues: Record<string, string> = {},
  owner: StorageOwner = { kind: "guest" },
) {
  const lease = store.beginStorageOwner(owner);
  for (const [values, handle] of [[localValues, lease.storage], [sessionValues, lease.sessionStorage]] as const) {
    for (const [key, raw] of Object.entries(values)) expect(handle.setItem(key, raw)).toBe(true);
  }
  expect(lease.publishReady()).toBe(true);
  clearPhysicalCalls();
  return { local: store.captureCurrentPersonalStorage(), session: store.captureCurrentPersonalStorage("session") };
}

function traced(handle: PersonalStorageHandle) {
  return { ...handle, getItem: vi.fn((key: string) => handle.getItem(key)) };
}

function seedUnselectedNamespaces() {
  local.set(KEY, "321");
  session.set(KEY, "654");
  seedOwnerRaw({ [KEY]: "888" }, { [KEY]: "999" },
    { kind: "account", provider: "cdp", userId: "TEST_C50_OTHER_ACCOUNT" });
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
  outbound = vi.fn(() => { throw new Error("No network is authorized in C50 fixtures"); });
  vi.stubGlobal("fetch", outbound);
  store = await import("@/lib/product-storage");
  data = await import("@/lib/data-export");
  tokens = await import("@/lib/tokens");
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

describe("C50 token value admission with actual token read oracle", () => {
  it.each(fractions)("omits fractional numeric balance %s already rejected by token reads", (value) => {
    const handles = seedOwnerRaw({ [KEY]: String(value) });
    const before = snapshot();
    // Zero alone could mean a valid zero; eligibility distinguishes invalid raw.
    expect(tokens.getTokenBalance(handles.local)).toBe(0);
    expect(tokens.canAwardTokens(0, handles.local)).toBe(false);
    const clean = data.sanitizeProductValue(KEY, value);
    expect(snapshot()).toEqual(before);
    expect(clean).toBeUndefined();
  });

  it.each(healthy)("keeps canonical whole numeric balance %s without coercion", (value) => {
    const handles = seedOwnerRaw({ [KEY]: String(value) });
    const before = snapshot();
    expect(tokens.getTokenBalance(handles.local)).toBe(value);
    expect(tokens.canAwardTokens(0, handles.local)).toBe(true);
    expect(data.sanitizeProductValue(KEY, value)).toBe(value);
    expect(snapshot()).toEqual(before);
  });

  it("preserves rejection of negatives, nonfinite numbers and nonnumeric input types", () => {
    const rejected: unknown[] = [-1, -0.5, NaN, Infinity, -Infinity, "125", null, undefined, true, false, {}, []];
    for (const value of rejected) {
      const original = structuredClone(value);
      expect(data.sanitizeProductValue(KEY, value)).toBeUndefined();
      expect(value).toEqual(original);
    }
  });

  it("keeps the existing export cap although the token reader accepts larger safe integers", () => {
    for (const value of [1000000001, Number.MAX_SAFE_INTEGER]) {
      const handles = seedOwnerRaw({ [KEY]: String(value) });
      const before = snapshot();
      expect(tokens.getTokenBalance(handles.local)).toBe(value);
      expect(tokens.canAwardTokens(0, handles.local)).toBe(true);
      expect(data.sanitizeProductValue(KEY, value)).toBeUndefined();
      expect(data.collectProductStorage(handles.local)).not.toHaveProperty(KEY);
      expect(snapshot()).toEqual(before);
    }
  });
});

describe("C50 actual selected collector", () => {
  it.each(fractions)("omits fractional raw balance %s and preserves unrelated selected values", (value) => {
    const handles = seedOwnerRaw({
      [KEY]: String(value),
      "coachfi-user": JSON.stringify({ setupDone: true, name: PRIVATE }),
      "coachfi-streak": JSON.stringify(healthyStreak),
    });
    local.set("coachfi-locale-v1", "pl");
    local.set("coachfi-auth", PRIVATE);
    const before = snapshot();
    const handle = traced(handles.local);
    const payload = data.collectProductStorage(handle);
    expect(handle.getItem.mock.calls.map(([key]) => key)).toEqual([...data.LOCAL_PRODUCT_KEYS]);
    expect(snapshot()).toEqual(before);
    expect(payload).toEqual({
      "coachfi-user": { setupDone: true },
      "coachfi-streak": healthyStreak,
      "coachfi-locale-v1": "pl",
    });
  });

  it("preserves existing JSON integer representations without claiming raw-reader equivalence", () => {
    for (const raw of ["125.0", "1.25e2", " 125 "]) {
      const handles = seedOwnerRaw({ [KEY]: raw });
      const before = snapshot();
      expect(tokens.getTokenBalance(handles.local)).toBe(0);
      expect(tokens.canAwardTokens(0, handles.local)).toBe(false);
      expect(data.collectProductStorage(handles.local)).toEqual({ [KEY]: 125 });
      expect(snapshot()).toEqual(before);
    }
  });

  it("propagates denied token reads instead of returning a fabricated empty selected export", () => {
    const handles = seedOwnerRaw({ [KEY]: "125" });
    const before = snapshot();
    const denied = new Error("TEST_C50_STORAGE_DENIED");
    onRead = (area, key) => { if (area === "local" && key === KEY) throw denied; };
    expect(() => data.collectProductStorage(handles.local)).toThrow(denied);
    expect(snapshot()).toEqual(before);
  });
});

describe("C50 actual paired current-owner builder", () => {
  const ownedFractions = owners.flatMap(owner => fractions.flatMap(value =>
    (["local", "session"] as const).map(area => ({ ...owner, value, area }))));

  it.each(ownedFractions)("omits $value from $name $area only; no guest or other-account fallback", ({ owner, value, area }) => {
    seedUnselectedNamespaces();
    local.set("coachfi-locale-v1", "pl");
    session.set("coachfi-locale-v1", "en");
    local.set("coachfi-auth", PRIVATE);
    session.set("cdp-session", PRIVATE);
    session.set("unknown-product-key", PRIVATE);
    const handles = seedOwnerRaw({
      [KEY]: String(area === "local" ? value : 125),
      "coachfi-user": JSON.stringify({ setupDone: true, name: PRIVATE, goal: PRIVATE }),
      "coachfi-lesson-steps": JSON.stringify({ inflation: 2, identity: PRIVATE }),
      "coachfi-streak": JSON.stringify(healthyStreak),
    }, {
      [KEY]: String(area === "session" ? value : 9),
      "coachfi-user": JSON.stringify({ setupDone: false, refresh_token: PRIVATE }),
    }, owner);
    const before = snapshot();
    expect(tokens.getTokenBalance(handles[area])).toBe(0);
    expect(tokens.canAwardTokens(0, handles[area])).toBe(false);
    const localHandle = traced(handles.local), sessionHandle = traced(handles.session);
    const payload = data.buildOwnedLocalDataExport(localHandle, sessionHandle);
    expect(localHandle.getItem.mock.calls.map(([key]) => key)).toEqual([...data.LOCAL_PRODUCT_KEYS]);
    expect(sessionHandle.getItem.mock.calls.map(([key]) => key)).toEqual([...data.LOCAL_PRODUCT_KEYS]);
    expect(snapshot()).toEqual(before);
    expect(JSON.stringify(payload)).not.toMatch(/TEST_C50_|coachfi-owned|userId|access_token|refresh_token/);
    expect(payload).toEqual({
      version: 2,
      ownerKind: owner.kind,
      exportedAt: NOW,
      scope: "selected_current_owner_local_product_data",
      devicePreferencesIncluded: ["locale"],
      omitted: ["authentication_and_sessions", "unknown_keys_and_fields", "free_text_profile_and_goals"],
      localStorage: {
        ...(area === "session" ? { [KEY]: 125 } : {}),
        "coachfi-user": { setupDone: true },
        "coachfi-lesson-steps": { inflation: 2 },
        "coachfi-streak": healthyStreak,
        "coachfi-locale-v1": "pl",
      },
      sessionStorage: {
        ...(area === "local" ? { [KEY]: 9 } : {}),
        "coachfi-user": { setupDone: false },
        "coachfi-locale-v1": "en",
      },
    });
  });

  const ownedHealthy = owners.flatMap(owner => healthy.map(value => ({ ...owner, value })));
  it.each(ownedHealthy)("keeps canonical $value in both $name areas with no writes", ({ owner, value }) => {
    seedUnselectedNamespaces();
    const handles = seedOwnerRaw({ [KEY]: String(value) }, { [KEY]: String(value) }, owner);
    const before = snapshot();
    const payload = data.buildOwnedLocalDataExport(handles.local, handles.session);
    expect(payload.ownerKind).toBe(owner.kind);
    expect(payload.localStorage).toEqual({ [KEY]: value });
    expect(payload.sessionStorage).toEqual({ [KEY]: value });
    expect(snapshot()).toEqual(before);
  });

  it("rejects pending, mixed, stale and reversed-area handles before physical collection", () => {
    store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "TEST_C50_A" });
    const pendingLocal = store.captureCurrentPersonalStorage(), pendingSession = store.captureCurrentPersonalStorage("session");
    expect(() => data.buildOwnedLocalDataExport(pendingLocal, pendingSession)).toThrow("Storage owner changed");
    const first = seedOwnerRaw({ [KEY]: "125" }, {}, { kind: "account", provider: "cdp", userId: "TEST_C50_A" });
    const second = seedOwnerRaw({ [KEY]: "9" }, {}, { kind: "account", provider: "cdp", userId: "TEST_C50_B" });
    const before = snapshot();
    expect(() => data.buildOwnedLocalDataExport(first.local, second.session)).toThrow("Storage owner changed");
    expect(() => data.buildOwnedLocalDataExport(first.local, first.session)).toThrow("Storage owner changed");
    expect(() => data.buildOwnedLocalDataExport(second.session, second.local)).toThrow("Storage owner changed");
    expect(physicalLocal.getItem).not.toHaveBeenCalled();
    expect(physicalSession.getItem).not.toHaveBeenCalled();
    expect(snapshot()).toEqual(before);
  });

  it("rejects an owner change during token collection without returning a partial old-owner export", () => {
    const handles = seedOwnerRaw({ [KEY]: "125" }, { [KEY]: "9" },
      { kind: "account", provider: "cdp", userId: "TEST_C50_A" });
    const before = snapshot();
    let changed = false;
    onRead = (area, key) => {
      if (area === "local" && key.endsWith(":" + KEY)) {
        onRead = undefined;
        changed = true;
        store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "TEST_C50_B" }).publishReady();
      }
    };
    expect(() => data.buildOwnedLocalDataExport(handles.local, handles.session)).toThrow("Storage owner changed");
    expect(changed).toBe(true);
    expect(handles.local.isCurrent()).toBe(false);
    expect(snapshot()).toEqual(before);
  });
});
