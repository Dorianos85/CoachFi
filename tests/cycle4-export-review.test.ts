import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("independent scoped export provenance and reentrancy", () => {
  let local: Map<string, string>, session: Map<string, string>;
  let beforeRead: (() => void) | undefined;
  beforeEach(() => {
    vi.resetModules(); local = new Map(); session = new Map(); beforeRead = undefined;
    const storage = (data: Map<string, string>) => ({ getItem: (key: string) => { beforeRead?.(); return data.get(key) ?? null; },
      setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } });
    vi.stubGlobal("window", { localStorage: storage(local), sessionStorage: storage(session), dispatchEvent: vi.fn(() => true) });
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No network allowed."); }));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("one-owner export excludes guest session and rejects a mixed A-local/B-session pair", async () => {
    const store = await import("@/lib/product-storage"), data = await import("@/lib/data-export");
    local.set("coachfi-tokens", "321"); session.set("coachfi-tokens", "777"); local.set("coachfi-locale-v1", "pl");
    const a = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A_PRIVATE_UID" });
    a.storage.setItem("coachfi-tokens", "88"); a.sessionStorage.setItem("coachfi-user", JSON.stringify({ name: "FIXTURE_NAME_PRIVATE", goal: "FIXTURE_GOAL_PRIVATE", setupDone: true })); a.publishReady();
    const localA = store.captureCurrentPersonalStorage(), sessionA = store.captureCurrentPersonalStorage("session");
    const payload = data.buildOwnedLocalDataExport(localA, sessionA);
    expect(payload.ownerKind).toBe("account"); expect(payload.localStorage["coachfi-tokens"]).toBe(88);
    expect(payload.localStorage["coachfi-locale-v1"]).toBe("pl"); expect(payload.sessionStorage).not.toHaveProperty("coachfi-tokens");
    expect(payload.sessionStorage["coachfi-user"]).toEqual({ setupDone: true });
    const text = JSON.stringify(payload);
    expect(text).not.toContain("FIXTURE_A_PRIVATE_UID"); expect(text).not.toContain("FIXTURE_NAME_PRIVATE"); expect(text).not.toContain("FIXTURE_GOAL_PRIVATE");
    store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B" }).publishReady();
    expect(() => data.buildOwnedLocalDataExport(localA, store.captureCurrentPersonalStorage("session"))).toThrow("owner changed");
    expect(local.get("coachfi-tokens")).toBe("321"); expect(session.get("coachfi-tokens")).toBe("777");
  });

  it("owner change inside physical collection rejects the export instead of returning partial stale data", async () => {
    const store = await import("@/lib/product-storage"), data = await import("@/lib/data-export");
    const a = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A" });
    a.storage.setItem("coachfi-tokens", "88"); a.publishReady();
    const localA = store.captureCurrentPersonalStorage(), sessionA = store.captureCurrentPersonalStorage("session");
    beforeRead = () => { beforeRead = undefined; store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B" }).publishReady(); };
    expect(() => data.buildOwnedLocalDataExport(localA, sessionA)).toThrow("owner changed");
    expect(store.getStorageOwnershipSnapshot().owner).toEqual({ kind: "account", provider: "cdp", userId: "FIXTURE_B" });
    expect(store.captureCurrentPersonalStorage().getItem("coachfi-tokens")).toBeNull();
  });
});
