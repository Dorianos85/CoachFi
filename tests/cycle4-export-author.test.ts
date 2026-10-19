import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

describe("B14 current-owner export and deletion", () => {
  let local: Map<string, string>, session: Map<string, string>;
  let onRead: (() => void) | undefined;
  beforeEach(() => {
    vi.resetModules(); local = new Map(); session = new Map(); onRead = undefined;
    const storage = (values: Map<string, string>) => ({
      getItem: (key: string) => { const value = values.get(key) ?? null; onRead?.(); return value; },
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
    });
    vi.stubGlobal("window", { localStorage: storage(local), sessionStorage: storage(session),
      dispatchEvent: vi.fn(() => true), addEventListener: vi.fn(), removeEventListener: vi.fn() });
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No network in this fixture"); }));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("exports only one account from both areas, excludes guest, other accounts and identity", async () => {
    const store = await import("@/lib/product-storage");
    const data = await import("@/lib/data-export");
    local.set("coachfi-tokens", "321"); session.set("coachfi-tokens", "654");
    local.set("coachfi-locale-v1", "pl");
    local.set("coachfi-auth", "FIXTURE_AUTH"); session.set("cdp-session", "FIXTURE_AUTH");
    const a = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A" });
    a.storage.setItem("coachfi-tokens", "111"); a.publishReady();
    const b = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B" });
    b.storage.setItem("coachfi-tokens", "88"); b.sessionStorage.setItem("coachfi-tokens", "99");
    b.storage.setItem("coachfi-user", JSON.stringify({ setupDone: true, name: "FIXTURE_NAME", goal: "FIXTURE_GOAL" }));
    b.publishReady();
    const payload = data.buildOwnedLocalDataExport(store.captureCurrentPersonalStorage(), store.captureCurrentPersonalStorage("session"));
    expect(payload.ownerKind).toBe("account"); expect(payload.version).toBe(2);
    expect(payload.localStorage).toEqual({ "coachfi-tokens": 88, "coachfi-user": { setupDone: true }, "coachfi-locale-v1": "pl" });
    expect(payload.sessionStorage).toEqual({ "coachfi-tokens": 99 });
    expect(JSON.stringify(payload)).not.toMatch(/FIXTURE_|coachfi-owned|userId|access_token/);
    expect(local.get("coachfi-tokens")).toBe("321"); expect(session.get("coachfi-tokens")).toBe("654");
  });

  it("rejects pending/stale handles and a change while collecting values", async () => {
    const store = await import("@/lib/product-storage"), data = await import("@/lib/data-export");
    const a = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A" });
    const pending = store.captureCurrentPersonalStorage();
    expect(() => data.buildOwnedLocalDataExport(pending, store.captureCurrentPersonalStorage("session"))).toThrow();
    a.publishReady(); const old = store.captureCurrentPersonalStorage(), oldSession = store.captureCurrentPersonalStorage("session");
    onRead = () => { onRead = undefined; store.beginStorageOwner({ kind: "guest" }).publishReady(); };
    expect(() => data.buildOwnedLocalDataExport(old, oldSession)).toThrow("Storage owner changed");
    expect(() => data.buildOwnedLocalDataExport(old, oldSession)).toThrow();
  });

  it("invalidates work before deletion and removes all 18 personal keys in both areas only for current account", async () => {
    const store = await import("@/lib/product-storage"), data = await import("@/lib/data-export");
    for (const key of store.PERSONAL_STORAGE_KEYS) { local.set(key, "FIXTURE_GUEST"); session.set(key, "FIXTURE_GUEST"); }
    local.set("coachfi-locale-v1", "pl"); local.set("coachfi-accessibility-v1", "FIXTURE_PREF");
    local.set("coachfi-auth", "FIXTURE_AUTH");
    const a = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A" });
    for (const key of store.PERSONAL_STORAGE_KEYS) { a.storage.setItem(key, "FIXTURE_A"); a.sessionStorage.setItem(key, "FIXTURE_A"); } a.publishReady();
    const b = store.beginStorageOwner({ kind: "account", provider: "supabase", userId: "FIXTURE_A" });
    for (const key of store.PERSONAL_STORAGE_KEYS) { b.storage.setItem(key, "FIXTURE_B"); b.sessionStorage.setItem(key, "FIXTURE_B"); } b.publishReady();
    const captured = store.captureCurrentPersonalStorage(); let callbackWasPending = false;
    store.subscribeStorageOwnership(() => { callbackWasPending = store.getStorageOwnershipSnapshot().status === "pending" && !captured.isCurrent(); });
    expect(data.deleteLocalProductData(captured)).toBe(true); expect(callbackWasPending).toBe(true);
    expect([...local.values()]).not.toContain("FIXTURE_B"); expect([...session.values()]).not.toContain("FIXTURE_B");
    expect([...local.values()].filter(value => value === "FIXTURE_A")).toHaveLength(18);
    expect([...session.values()].filter(value => value === "FIXTURE_A")).toHaveLength(18);
    for (const key of store.PERSONAL_STORAGE_KEYS) { expect(local.get(key)).toBe("FIXTURE_GUEST"); expect(session.get(key)).toBe("FIXTURE_GUEST"); }
    expect(local.get("coachfi-auth")).toBe("FIXTURE_AUTH"); expect(local.get("coachfi-locale-v1")).toBe("pl");
    expect(local.get("coachfi-accessibility-v1")).toBe("FIXTURE_PREF");
    expect(data.deleteLocalProductData(captured)).toBe(false);
  });

  it("guest deletion leaves account data and preferences intact", async () => {
    const store = await import("@/lib/product-storage"), data = await import("@/lib/data-export");
    const a = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A" });
    a.storage.setItem("coachfi-user", "FIXTURE_A"); a.publishReady();
    local.set("coachfi-locale-v1", "pl");
    store.beginStorageOwner({ kind: "guest" }).publishReady();
    const guest = store.captureCurrentPersonalStorage(); guest.setItem("coachfi-user", "FIXTURE_GUEST");
    expect(data.deleteLocalProductData(guest)).toBe(true);
    expect(local.has("coachfi-user")).toBe(false); expect([...local.values()]).toContain("FIXTURE_A");
    expect(local.get("coachfi-locale-v1")).toBe("pl");
  });
});
