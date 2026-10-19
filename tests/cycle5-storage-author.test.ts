import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("B15 write-ahead local preservation (synthetic author cases)", () => {
  let api: typeof import("@/lib/product-storage");
  let sync: typeof import("@/lib/sync/local-sync-state");
  let values: Map<string, string>;
  let writes: string[];
  let put: ReturnType<typeof vi.fn<(key: string, value: string) => void>>;
  let get: ReturnType<typeof vi.fn<(key: string) => string | null>>;
  const key = (name: string, provider = "cdp", id = "SYNTHETIC_A") => `coachfi-owned:v1:${provider}:${id}:${name}`;
  beforeEach(async () => {
    vi.resetModules(); values = new Map(); writes = [];
    get = vi.fn(name => values.get(name) ?? null);
    put = vi.fn((name, value) => { writes.push(name); values.set(name, value); });
    const storage = { getItem: get, setItem: put, removeItem: (name: string) => { writes.push(name); values.delete(name); } };
    const target = new EventTarget();
    vi.stubGlobal("window", { localStorage: storage, sessionStorage: storage,
      dispatchEvent: target.dispatchEvent.bind(target), addEventListener: target.addEventListener.bind(target),
      removeEventListener: target.removeEventListener.bind(target) });
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Network forbidden"); }));
    api = await import("@/lib/product-storage"); sync = await import("@/lib/sync/local-sync-state");
  });
  afterEach(() => { vi.unstubAllGlobals(); });
  function ready(provider: "cdp" | "supabase" = "cdp") {
    const lease = api.beginStorageOwner({ kind: "account", provider, userId: "SYNTHETIC_A" });
    lease.publishReady({ localOnly: true, syncIssue: "read-only" });
    return { lease, view: api.captureCurrentPersonalStorage() };
  }
  it("markers precede tracked writes and readiness metadata does not invalidate a captured view", () => {
    const { view } = ready(); const revision = view.revision;
    expect(view.setItem("coachfi-tokens", "0037")).toBe(true);
    expect(writes).toEqual([key("coachfi-learning-rev"), key("coachfi-tokens")]);
    expect(values.get(key("coachfi-learning-rev"))).toBe("local-unconfirmed-v1");
    expect(api.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", revision, localOnly: true, syncIssue: "unconfirmed" });
    expect(view.isCurrent()).toBe(true); expect(view.getItem("coachfi-tokens")).toBe("0037");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("marker quota leaves the main value unchanged and never announces confirmed save", () => {
    const { view } = ready(); values.set(key("coachfi-tokens"), "0010");
    put.mockImplementationOnce(() => { throw new DOMException("marker quota", "QuotaExceededError"); });
    expect(() => view.setItem("coachfi-tokens", "99")).toThrow("marker quota");
    expect(values.get(key("coachfi-tokens"))).toBe("0010"); expect(writes).toEqual([]);
    expect(api.getStorageOwnershipSnapshot().syncIssue).toBe("read-only");
  });
  it("main value quota leaves an unconfirmed marker and previous exact bytes", () => {
    const { view } = ready(); values.set(key("coachfi-tokens"), " 0010 ");
    put.mockImplementationOnce((name, value) => { writes.push(name); values.set(name, value); });
    put.mockImplementationOnce(() => { throw new DOMException("value quota", "QuotaExceededError"); });
    expect(() => view.setItem("coachfi-tokens", "99")).toThrow("value quota");
    expect(values.get(key("coachfi-tokens"))).toBe(" 0010 "); expect(sync.hasUnconfirmedLocalData(view)).toBe(true);
    expect(values.get(key("coachfi-learning-rev"))).toBe("local-unconfirmed-v1");
  });
  it.each(["", "001", "{malformed", "local-unconfirmed-v1"])("preserves existing marker bytes %j", marker => {
    const { view } = ready(); values.set(key("coachfi-learning-rev"), marker);
    expect(view.setItem("coachfi-streak", "{SYNTHETIC}")).toBe(true);
    expect(values.get(key("coachfi-learning-rev"))).toBe(marker); expect(writes).toEqual([key("coachfi-streak")]);
    expect(sync.hasUnconfirmedSyncMarker(view)).toBe(true);
  });
  it("tracked removal records a marker first and survives a cold module start", async () => {
    const { view } = ready("supabase"); values.set(key("coachfi-user", "supabase"), "SYNTHETIC");
    expect(view.removeItem("coachfi-user")).toBe(true);
    expect(writes).toEqual([key("coachfi-learning-rev", "supabase"), key("coachfi-user", "supabase")]);
    vi.resetModules(); api = await import("@/lib/product-storage"); sync = await import("@/lib/sync/local-sync-state");
    const cold = ready("supabase"); expect(sync.hasUnconfirmedLocalData(cold.view)).toBe(true);
    expect(cold.view.getItem("coachfi-user")).toBeNull();
  });
  it("private hydration, guest, session and health writes do not create a cloud marker", () => {
    const lease = api.beginStorageOwner({ kind: "account", provider: "supabase", userId: "SYNTHETIC_A" });
    lease.storage.setItem("coachfi-user", "SYNTHETIC PRIVATE"); lease.publishReady({ localOnly: true, syncIssue: "read-only" });
    api.captureCurrentPersonalStorage().setItem("coachfi-health-check", "SYNTHETIC HEALTH");
    api.captureCurrentPersonalStorage("session").setItem("coachfi-tokens", "5");
    expect(values.has(key("coachfi-learning-rev", "supabase"))).toBe(false);
    api.beginStorageOwner({ kind: "guest" }).publishReady({ localOnly: true });
    api.captureCurrentPersonalStorage().setItem("coachfi-tokens", "7");
    expect(values.has("coachfi-learning-rev")).toBe(false);
  });
  it("all ten mirrored Supabase keys are protected; CDP profile and device prefs are excluded", () => {
    const { view } = ready("supabase");
    for (const name of sync.SUPABASE_SYNC_KEYS) {
      values.delete(key("coachfi-learning-rev", "supabase")); view.setItem(name, "SYNTHETIC");
      expect(values.get(key("coachfi-learning-rev", "supabase"))).toBe("local-unconfirmed-v1");
    }
    expect(sync.SUPABASE_SYNC_KEYS).toHaveLength(10);
    const cdp = ready().view; cdp.setItem("coachfi-user", "SYNTHETIC LOCAL PROFILE");
    expect(values.has(key("coachfi-learning-rev"))).toBe(false);
    expect(cdp.setItem("coachfi-locale-v1", "pl")).toBe(false);
  });
  it("a retained hydration lease cannot bypass the marker after the view becomes ready", () => {
    const { lease } = ready("supabase");
    expect(lease.storage.setItem("coachfi-user", "SYNTHETIC POST-READY EDIT")).toBe(true);
    expect(writes).toEqual([key("coachfi-learning-rev", "supabase"), key("coachfi-user", "supabase")]);
    expect(api.getStorageOwnershipSnapshot().syncIssue).toBe("unconfirmed");
  });
  it("owner reentry while reading or writing the marker stops the main mutation", () => {
    let { view } = ready();
    get.mockImplementationOnce(() => { api.beginStorageOwner({ kind: "guest" }).publishReady(); return null; });
    expect(view.setItem("coachfi-tokens", "99")).toBe(false); expect(writes).toEqual([]);
    ({ view } = ready());
    put.mockImplementationOnce((name, value) => {
      writes.push(name); values.set(name, value); api.beginStorageOwner({ kind: "guest" }).publishReady();
    });
    expect(view.setItem("coachfi-tokens", "99")).toBe(false);
    expect(writes).toEqual([key("coachfi-learning-rev")]); expect(values.has(key("coachfi-tokens"))).toBe(false);
  });
  it("metadata listener reentry cannot claim success or redirect the completed own write", () => {
    const { view } = ready(); const stop = api.subscribeStorageOwnership(() => {
      if (api.getStorageOwnershipSnapshot().syncIssue === "unconfirmed") {
        stop(); api.beginStorageOwner({ kind: "guest" }).publishReady();
      }
    });
    expect(view.setItem("coachfi-tokens", "99")).toBe(false);
    expect(values.get(key("coachfi-tokens"))).toBe("99"); expect(values.has("coachfi-tokens")).toBe(false);
  });
  it("helper treats existing empty/malformed own cache as protected, never guest or another UID", () => {
    const { view } = ready(); values.set("coachfi-tokens", "GUEST"); values.set(key("coachfi-tokens", "cdp", "SYNTHETIC_B"), "OTHER");
    expect(sync.hasUnconfirmedLocalData(view)).toBe(false);
    values.set(key("coachfi-srs"), ""); expect(sync.hasUnconfirmedLocalData(view)).toBe(true);
    values.set(key("coachfi-srs"), "{malformed"); expect(sync.hasUnconfirmedLocalData(view)).toBe(true);
    expect(sync.AUTOMATIC_ACCOUNT_WRITES_ENABLED).toBe(false);
  });
  it("read errors and stale handles fail closed rather than classify cache as empty", () => {
    const { view } = ready(); get.mockImplementationOnce(() => { throw new DOMException("blocked read", "SecurityError"); });
    expect(() => sync.hasUnconfirmedLocalData(view)).toThrow("blocked read");
    api.beginStorageOwner({ kind: "guest" }).publishReady();
    expect(() => sync.hasUnconfirmedLocalData(view)).toThrow("Storage session changed");
  });
});
