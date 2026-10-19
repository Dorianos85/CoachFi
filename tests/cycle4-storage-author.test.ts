import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("B14 storage ownership synthetic author cases", () => {
  let api: typeof import("@/lib/product-storage");
  let local: Map<string, string>, session: Map<string, string>;
  let target: EventTarget;
  let get: ReturnType<typeof vi.fn<(key: string) => string | null>>;
  let put: ReturnType<typeof vi.fn<(key: string, value: string) => void>>;
  let remove: ReturnType<typeof vi.fn<(key: string) => void>>;
  beforeEach(async () => {
    vi.resetModules(); vi.useFakeTimers(); local = new Map(); session = new Map(); target = new EventTarget();
    vi.stubEnv("NEXT_PUBLIC_CDP_PROJECT_ID", ""); vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", ""); vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    get = vi.fn((key) => local.get(key) ?? null);
    put = vi.fn((key, value) => { local.set(key, value); }); remove = vi.fn((key) => { local.delete(key); });
    const localStorage = { getItem: get, setItem: put, removeItem: remove };
    const sessionStorage = { getItem: (key: string) => session.get(key) ?? null,
      setItem: (key: string, value: string) => { session.set(key, value); }, removeItem: (key: string) => { session.delete(key); } };
    vi.stubGlobal("window", { localStorage, sessionStorage,
      dispatchEvent: (event: Event) => target.dispatchEvent(event),
      addEventListener: target.addEventListener.bind(target), removeEventListener: target.removeEventListener.bind(target) });
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No network permitted in B14 fixtures"); }));
    api = await import("@/lib/product-storage");
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
  const account = (id: string, provider: "cdp" | "supabase" = "cdp") => api.beginStorageOwner({ kind: "account", provider, userId: id });

  it("SSR snapshot is one stable pending object and initialization does not mutate server account state", () => {
    vi.stubGlobal("window", undefined);
    const initial = api.getStorageOwnershipServerSnapshot(); api.initializeStorageOwnership(false);
    expect(api.getStorageOwnershipServerSnapshot()).toBe(initial);
    expect(api.getStorageOwnershipSnapshot()).toBe(initial);
    expect(api.captureCurrentPersonalStorage().isCurrent()).toBe(false); expect(get).not.toHaveBeenCalled();
  });
  it("configured unknown auth fails closed without reading or writing guest values", () => {
    local.set("coachfi-user", "SYNTHETIC PRIVATE GUEST"); api.initializeStorageOwnership(true);
    const view = api.captureCurrentPersonalStorage(); expect(view.isCurrent()).toBe(false);
    expect(view.getItem("coachfi-user")).toBeNull(); expect(view.getItem("coachfi-locale-v1")).toBeNull();
    expect(view.setItem("coachfi-tokens", "9")).toBe(false); expect(view.removeItem("coachfi-user")).toBe(false);
    expect(get).not.toHaveBeenCalled(); expect(put).not.toHaveBeenCalled(); expect(remove).not.toHaveBeenCalled();
  });
  it("unconfigured lazy bootstrap uses guest and preserves exact raw strings/absent/empty", () => {
    local.set("coachfi-user", ' { "name" : "SYNTHETIC_GUEST" } \n'); local.set("coachfi-tokens", "00125"); local.set("coachfi-avatar", "");
    const view = api.captureCurrentPersonalStorage(); expect(view.owner).toEqual({ kind: "guest" });
    expect(view.getItem("coachfi-user")).toBe(local.get("coachfi-user")); expect(view.getItem("coachfi-tokens")).toBe("00125");
    expect(view.getItem("coachfi-avatar")).toBe(""); expect(view.getItem("coachfi-health-check")).toBeNull();
    expect(api.getStorageOwnershipSnapshot().localOnly).toBe(true); expect(put).not.toHaveBeenCalled();
  });
  it("private account hydration stays hidden until publish and never changes guest bytes", () => {
    local.set("coachfi-user", "SYNTHETIC GUEST RAW"); const A = account("A");
    expect(A.storage.setItem("coachfi-user", "SYNTHETIC A RAW")).toBe(true);
    expect(api.captureCurrentPersonalStorage().getItem("coachfi-user")).toBeNull();
    expect(local.get("coachfi-user")).toBe("SYNTHETIC GUEST RAW");
    expect(A.publishReady({ localOnly: false })).toBe(true);
    expect(api.captureCurrentPersonalStorage().getItem("coachfi-user")).toBe("SYNTHETIC A RAW");
  });
  it("guest → A → B → guest retains every personal raw key and isolates accounts", () => {
    for (const key of api.PERSONAL_STORAGE_KEYS) local.set(key, ` SYNTHETIC:${key}\n`);
    const guestBytes = new Map(local); const A = account("A"); A.storage.setItem("coachfi-tokens", "10"); A.publishReady();
    const viewA = api.captureCurrentPersonalStorage(); const B = account("B");
    expect(B.storage.getItem("coachfi-tokens")).toBeNull(); B.storage.setItem("coachfi-tokens", "20"); B.publishReady();
    expect(viewA.getItem("coachfi-tokens")).toBeNull(); expect(viewA.setItem("coachfi-tokens", "99")).toBe(false);
    api.beginStorageOwner({ kind: "guest" }).publishReady();
    for (const [key, value] of guestBytes) expect(api.captureCurrentPersonalStorage().getItem(key)).toBe(value);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("provider identity is part of the namespace even when UID strings are equal", () => {
    const cdp = account("A", "cdp"); cdp.storage.setItem("coachfi-user", "CDP A"); cdp.publishReady();
    const supabase = account("A", "supabase"); expect(supabase.storage.getItem("coachfi-user")).toBeNull();
    supabase.storage.setItem("coachfi-user", "SUPABASE A"); supabase.publishReady();
    const cdpAgain = account("A", "cdp"); expect(cdpAgain.storage.getItem("coachfi-user")).toBe("CDP A");
  });
  it("stale release cannot affect B and current release fences all views to pending", () => {
    const A = account("A"); A.publishReady(); const old = api.captureCurrentPersonalStorage();
    const B = account("B"); B.publishReady(); const before = api.getStorageOwnershipSnapshot();
    A.release(); old.release(); expect(api.getStorageOwnershipSnapshot()).toBe(before);
    const current = api.captureCurrentPersonalStorage(); current.release();
    expect(api.getStorageOwnershipSnapshot().status).toBe("pending"); expect(current.isCurrent()).toBe(false);
  });
  it("device reads are guarded, device writes and unknown/auth keys are rejected", () => {
    local.set("coachfi-locale-v1", "pl"); local.set("coachfi-auth", "SYNTHETIC AUTH SENTINEL");
    const A = account("A"); A.publishReady(); const view = api.captureCurrentPersonalStorage();
    expect(view.getItem("coachfi-locale-v1")).toBe("pl"); expect(view.getItem("coachfi-auth")).toBeNull();
    expect(view.setItem("coachfi-locale-v1", "en")).toBe(false); expect(view.removeItem("coachfi-auth")).toBe(false);
    expect(local.get("coachfi-auth")).toBe("SYNTHETIC AUTH SENTINEL");
  });
  it("a getter reentering B cannot return A's private value", () => {
    const A = account("A"); A.storage.setItem("coachfi-user", "A PRIVATE"); A.publishReady(); const old = api.captureCurrentPersonalStorage();
    get.mockImplementationOnce((key) => { const value = local.get(key) ?? null; account("B").publishReady(); return value; });
    expect(old.getItem("coachfi-user")).toBeNull(); expect(api.captureCurrentPersonalStorage().getItem("coachfi-user")).toBeNull();
  });
  it("a write accepted before reentry returns false and never redirects into B", () => {
    const A = account("A"); A.publishReady(); const old = api.captureCurrentPersonalStorage();
    put.mockImplementationOnce((key, value) => { local.set(key, value); account("B").publishReady(); });
    expect(old.setItem("coachfi-tokens", "10")).toBe(false);
    expect(api.captureCurrentPersonalStorage().getItem("coachfi-tokens")).toBeNull();
  });
  it("quota propagates without false saved result or guest loss", () => {
    local.set("coachfi-tokens", "00125"); const A = account("A"); A.publishReady();
    put.mockImplementationOnce(() => { throw new DOMException("Synthetic quota", "QuotaExceededError"); });
    expect(() => api.captureCurrentPersonalStorage().setItem("coachfi-tokens", "10")).toThrow("Synthetic quota");
    expect(local.get("coachfi-tokens")).toBe("00125");
  });
  it("delete removes only18 current personal keys in each area, keeping guest, prefs, SDK and B", () => {
    local.set("coachfi-tokens", "00125"); local.set("coachfi-auth", "SYNTHETIC SDK"); local.set("coachfi-locale-v1", "pl");
    const B = account("B"); B.storage.setItem("coachfi-tokens", "20"); B.publishReady();
    const beforeB = new Map(local); const A = account("A");
    for (const key of api.PERSONAL_STORAGE_KEYS) { A.storage.setItem(key, "A"); A.sessionStorage.setItem(key, "A SESSION"); }
    A.publishReady(); expect(api.eraseCurrentPersonalData(api.captureCurrentPersonalStorage())).toBe(true);
    expect(local).toEqual(beforeB); expect(session.size).toBe(0); expect(remove).toHaveBeenCalledTimes(18);
    expect(api.getStorageOwnershipSnapshot()).toMatchObject({ status: "pending", owner: { kind: "account", userId: "A" } });
  });
  it("delete announces pending first and reentrant B prevents any removal", () => {
    const A = account("A"); A.publishReady(); const current = api.captureCurrentPersonalStorage();
    const unsubscribe = api.subscribeStorageOwnership(() => {
      if (api.getStorageOwnershipSnapshot().status === "pending" && api.getStorageOwnershipSnapshot().owner?.kind === "account") {
        unsubscribe(); account("B").publishReady();
      }
    });
    expect(api.eraseCurrentPersonalData(current)).toBe(false); expect(remove).not.toHaveBeenCalled();
    expect(api.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", owner: { userId: "B" } });
  });
  it("partial delete quota stays pending with ephemeral failure and never restores ready or guest", () => {
    const A = account("A"); A.storage.setItem("coachfi-user", "A"); A.publishReady();
    remove.mockImplementationOnce(() => { throw new DOMException("Synthetic blocked removal", "SecurityError"); });
    expect(() => api.eraseCurrentPersonalData(api.captureCurrentPersonalStorage())).toThrow("Synthetic blocked removal");
    expect(api.getStorageOwnershipSnapshot()).toMatchObject({ status: "pending", failure: "erase-failed", owner: { userId: "A" } });
  });
  it("stale learning/daily/vault setters throw before persistence or reward notification", async () => {
    const A = account("A"); A.publishReady(); const old = api.captureCurrentPersonalStorage(); account("B").publishReady();
    const tokens = await import("@/lib/tokens"), srs = await import("@/lib/srs"), progress = await import("@/lib/learningProgress");
    const streak = await import("@/lib/streak"), gate = await import("@/lib/signInGate"), challenge = await import("@/data/challengeQuestions");
    put.mockClear(); remove.mockClear();
    for (const mutate of [() => tokens.addTokens(1, "SYNTHETIC", "test", old), () => srs.recordAnswer("SYNTHETIC", true, old),
      () => progress.markStageCompleted("saving-habit", old), () => streak.markActiveToday(old),
      () => gate.recordLessonStep("saving-habit", 1, old), () => challenge.markChallengeCompleted(old)]) {
      expect(mutate).toThrow("Storage session changed");
    }
    expect(put).not.toHaveBeenCalled(); expect(remove).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it("agent clock cache and pagehide cannot transfer guest elapsed time into another owner", async () => {
    local.set("coachfi-agent-ms", "7"); api.initializeStorageOwnership(false);
    const gate = await import("@/lib/signInGate"); const guest = api.captureCurrentPersonalStorage();
    gate.beginAgentConversation("SYNTHETIC", guest); await vi.advanceTimersByTimeAsync(50);
    expect(gate.getAgentConversationMs(guest)).toBe(57);
    account("A").publishReady({ localOnly: true }); target.dispatchEvent(new Event("pagehide"));
    expect(gate.getAgentConversationMs()).toBe(0); expect(local.get("coachfi-agent-ms")).toBe("7");
    expect(() => gate.endAgentConversation("SYNTHETIC", guest)).toThrow("Storage session changed");
  });
});
