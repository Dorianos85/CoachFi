import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("independent B14 storage reentrancy review", () => {
  let local: Map<string, string>, session: Map<string, string>;
  let readEffect: (() => void) | undefined, writeEffect: (() => void) | undefined;
  let removeEffect: (() => void) | undefined;
  let reads = 0, writes = 0, removes = 0;
  beforeEach(() => {
    vi.resetModules(); local = new Map(); session = new Map();
    readEffect = writeEffect = removeEffect = undefined; reads = writes = removes = 0;
    const storage = (map: Map<string, string>) => ({
      getItem: (key: string) => { reads++; const value = map.get(key) ?? null; readEffect?.(); return value; },
      setItem: (key: string, value: string) => { writes++; map.set(key, value); writeEffect?.(); },
      removeItem: (key: string) => { removes++; map.delete(key); removeEffect?.(); },
    });
    vi.stubGlobal("window", { localStorage: storage(local), sessionStorage: storage(session), dispatchEvent: vi.fn(() => true) });
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No network allowed."); }));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("configured pending reads do not inspect guest bytes; private hydration stays hidden until ready", async () => {
    const store = await import("@/lib/product-storage");
    local.set("coachfi-user", "FIXTURE_GUEST_PRIVATE"); store.initializeStorageOwnership(true);
    const pending = store.captureCurrentPersonalStorage();
    expect(pending.getItem("coachfi-user")).toBeNull();
    expect(pending.setItem("coachfi-user", "FIXTURE_FORBIDDEN")).toBe(false);
    expect(reads).toBe(0); expect(writes).toBe(0);
    const a = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A" });
    a.storage.setItem("coachfi-user", "FIXTURE_A_PRIVATE");
    expect(store.captureCurrentPersonalStorage().getItem("coachfi-user")).toBeNull();
    expect(a.publishReady()).toBe(true);
    expect(store.captureCurrentPersonalStorage().getItem("coachfi-user")).toBe("FIXTURE_A_PRIVATE");
    expect(local.get("coachfi-user")).toBe("FIXTURE_GUEST_PRIVATE");
  });

  it("reentrant identity switch during physical reads/writes discards old values and never redirects to B", async () => {
    const store = await import("@/lib/product-storage");
    const a = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A" });
    a.storage.setItem("coachfi-user", "FIXTURE_A_PRIVATE"); a.publishReady();
    const oldView = store.captureCurrentPersonalStorage();
    let b: ReturnType<typeof store.beginStorageOwner> | undefined;
    readEffect = () => { readEffect = undefined; b = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B" }); b.publishReady(); };
    expect(oldView.getItem("coachfi-user")).toBeNull();
    expect(b?.storage.getItem("coachfi-user")).toBeNull();
    const viewB = store.captureCurrentPersonalStorage();
    writeEffect = () => { writeEffect = undefined; store.beginStorageOwner({ kind: "account", provider: "supabase", userId: "FIXTURE_B" }).publishReady(); };
    expect(viewB.setItem("coachfi-user", "FIXTURE_B_OLD_DRAFT")).toBe(false);
    expect(store.captureCurrentPersonalStorage().getItem("coachfi-user")).toBeNull();
    // The old physical write may have completed. False does not promise rollback.
    expect([...local.values()]).toContain("FIXTURE_B_OLD_DRAFT");
    expect(oldView.setItem("coachfi-user", "FIXTURE_A_LATE")).toBe(false);
    expect([...local.values()]).not.toContain("FIXTURE_A_LATE");
  });

  it("delete reserves pending before callbacks, and reentrant B prevents deletion or false success", async () => {
    const store = await import("@/lib/product-storage");
    local.set("coachfi-user", "FIXTURE_GUEST");
    const a = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A" });
    a.storage.setItem("coachfi-user", "FIXTURE_A"); a.sessionStorage.setItem("coachfi-user", "FIXTURE_A_SESSION"); a.publishReady();
    const viewA = store.captureCurrentPersonalStorage();
    let duringStatus: string | undefined, staleWrite: boolean | undefined;
    const unsubscribe = store.subscribeStorageOwnership(() => {
      if (store.getStorageOwnershipSnapshot().status !== "pending") return;
      unsubscribe(); duringStatus = store.getStorageOwnershipSnapshot().status;
      staleWrite = viewA.setItem("coachfi-user", "FIXTURE_STALE_DURING_DELETE");
      store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B" }).publishReady();
    });
    expect(store.eraseCurrentPersonalData(viewA)).toBe(false);
    expect(duringStatus).toBe("pending"); expect(staleWrite).toBe(false); expect(removes).toBe(0);
    expect(local.get("coachfi-user")).toBe("FIXTURE_GUEST");
    expect([...local.values()]).toContain("FIXTURE_A"); expect([...session.values()]).toContain("FIXTURE_A_SESSION");
    expect(store.getStorageOwnershipSnapshot().owner).toEqual({ kind: "account", provider: "cdp", userId: "FIXTURE_B" });
  });

  it("quota/partial-delete exceptions remain failure with no guest or other-account removal", async () => {
    const store = await import("@/lib/product-storage");
    local.set("coachfi-user", "FIXTURE_GUEST"); local.set("coachfi-auth", "FIXTURE_SDK_KEEP");
    const a = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A" });
    a.storage.setItem("coachfi-user", "FIXTURE_A"); a.publishReady();
    const viewA = store.captureCurrentPersonalStorage();
    writeEffect = () => { throw new DOMException("Synthetic quota", "QuotaExceededError"); };
    expect(() => viewA.setItem("coachfi-avatar", "FIXTURE_AVATAR")).toThrow("Synthetic quota");
    writeEffect = undefined;
    removeEffect = () => { throw new Error("Synthetic blocked removal"); };
    expect(() => store.eraseCurrentPersonalData(viewA)).toThrow("Synthetic blocked removal");
    expect(store.getStorageOwnershipSnapshot().status).toBe("pending"); expect(viewA.isCurrent()).toBe(false);
    expect(store.getStorageOwnershipSnapshot().failure).toBe("erase-failed");
    expect(store.captureCurrentPersonalStorage().getItem("coachfi-user")).toBeNull();
    expect(local.get("coachfi-user")).toBe("FIXTURE_GUEST"); expect(local.get("coachfi-auth")).toBe("FIXTURE_SDK_KEEP");
  });

  it("late deletion failure after reentrant B never attaches A error state to B", async () => {
    const store = await import("@/lib/product-storage");
    const a = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A" });
    a.storage.setItem("coachfi-user", "FIXTURE_A"); a.publishReady();
    const oldA = store.captureCurrentPersonalStorage();
    removeEffect = () => {
      removeEffect = undefined;
      store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B" }).publishReady();
      throw new Error("Synthetic A removal failed after B");
    };
    expect(() => store.eraseCurrentPersonalData(oldA)).toThrow("after B");
    expect(store.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", owner: { userId: "FIXTURE_B" } });
    expect(store.getStorageOwnershipSnapshot().failure).toBeUndefined();
  });
});
