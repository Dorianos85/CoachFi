import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const response = (id: string, tokens = 10) => new Response(JSON.stringify({ ok: true, configured: true,
  account: { cdpUserId: id }, state: { version: 1, tokens } }), { status: 200 });

describe("B14 ownership retained under B15 read-only transports (synthetic)", () => {
  let local: Map<string, string>, session: Map<string, string>, target: EventTarget;
  let storage: typeof import("@/lib/product-storage");
  beforeEach(async () => {
    vi.resetModules(); vi.useFakeTimers(); local = new Map(); session = new Map(); target = new EventTarget();
    const store = (map: Map<string, string>) => ({ getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => { map.set(key, value); }, removeItem: (key: string) => { map.delete(key); } });
    vi.stubGlobal("window", { localStorage: store(local), sessionStorage: store(session),
      dispatchEvent: target.dispatchEvent.bind(target), addEventListener: target.addEventListener.bind(target),
      removeEventListener: target.removeEventListener.bind(target) });
    vi.stubEnv("NEXT_PUBLIC_CDP_PROJECT_ID", ""); vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", ""); vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Synthetic transport must be configured"); }));
    storage = await import("@/lib/product-storage");
  });
  afterEach(async () => {
    const sync = await import("@/lib/account-sync"); await sync.stopLearningSync();
    vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs();
  });

  it("CDP hydration/logout/name cleanup preserves raw guest profile, health and all learning strings", async () => {
    for (const key of storage.PERSONAL_STORAGE_KEYS) local.set(key, ` SYNTHETIC RAW ${key}\n`);
    const guest = new Map(local); const fetchMock = vi.fn<typeof fetch>(async () => response("A", 10)); vi.stubGlobal("fetch", fetchMock);
    const sync = await import("@/lib/account-sync"); const lease = sync.startLearningSession({ id: "A" }, async () => "FIXTURE_TOKEN_A");
    expect(storage.getStorageOwnershipSnapshot().status).toBe("pending");
    expect((await lease.ready).status).toBe("ready");
    const bound = storage.captureCurrentPersonalStorage(); expect(bound.getItem("coachfi-tokens")).toBe("10");
    await sync.endLearningSession(undefined, bound); await sync.clearSignedInName(undefined, bound);
    expect(storage.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, owner: { kind: "guest" } });
    for (const [key, value] of guest) expect(local.get(key)).toBe(value);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it.each(["no token", "GET error"])("CDP %s makes known account local-only without showing guest or another account", async (failure) => {
    local.set("coachfi-user", "SYNTHETIC GUEST");
    const A = storage.beginStorageOwner({ kind: "account", provider: "cdp", userId: "A" }); A.storage.setItem("coachfi-user", "SYNTHETIC A"); A.publishReady();
    const B = storage.beginStorageOwner({ kind: "account", provider: "cdp", userId: "B" }); B.storage.setItem("coachfi-user", "SYNTHETIC B CACHE"); B.publishReady();
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ ok: false }), { status: 503 })); vi.stubGlobal("fetch", fetchMock);
    const sync = await import("@/lib/account-sync"); const lease = sync.startLearningSession({ id: "B" }, async () => failure === "no token" ? null : "FIXTURE_TOKEN_B");
    expect((await lease.ready).status).toBe("unavailable");
    expect(storage.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, owner: { userId: "B" } });
    const own = storage.captureCurrentPersonalStorage(); expect(own.getItem("coachfi-user")).toBe("SYNTHETIC B CACHE");
    own.setItem("coachfi-tokens", "42"); sync.persistLearningState("tokens", own); await vi.runAllTimersAsync();
    expect(fetchMock).toHaveBeenCalledTimes(failure === "no token" ? 0 : 1); expect(local.get("coachfi-user")).toBe("SYNTHETIC GUEST");
  });

  it("delete aborts the read-only CDP lease and prevents stale writes or any flush resurrection", async () => {
    local.set("coachfi-tokens", "00125");
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(response("A", 10));
    vi.stubGlobal("fetch", fetchMock); const sync = await import("@/lib/account-sync");
    const lease = sync.startLearningSession({ id: "A" }, async () => "FIXTURE_TOKEN_A"); await lease.ready;
    const owned = storage.captureCurrentPersonalStorage(); owned.setItem("coachfi-tokens", "20"); sync.persistLearningState("tokens", owned);
    await vi.runAllTimersAsync(); expect(fetchMock).toHaveBeenCalledOnce();
    expect(owned.getItem("coachfi-learning-rev")).toBe("local-unconfirmed-v1");
    expect(storage.eraseCurrentPersonalData(owned)).toBe(true); expect(lease.isCurrent()).toBe(false);
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(owned.setItem("coachfi-tokens", "999")).toBe(false);
    sync.persistLearningState("tokens", owned); await vi.runAllTimersAsync();
    expect(fetchMock).toHaveBeenCalledOnce(); expect(local.get("coachfi-tokens")).toBe("00125");
    expect([...local.keys()].some((key) => key.startsWith("coachfi-owned:"))).toBe(false);
    expect(storage.getStorageOwnershipSnapshot()).toMatchObject({ status: "pending", owner: { userId: "A" } });
  });

  it("Supabase cached account stays local-only before hydration and leaves pusher/success off", async () => {
    const A = storage.beginStorageOwner({ kind: "account", provider: "supabase", userId: "A" });
    A.storage.setItem("coachfi-user", "SYNTHETIC ACCOUNT CACHE"); A.publishReady(); local.set("coachfi-user", "SYNTHETIC GUEST");
    const hydrate = vi.fn(async () => false); let pusher: unknown = null; const push = vi.fn(async () => {}); const success = vi.fn();
    const { createSessionSyncController } = await import("@/lib/sync/session-sync");
    const controller = createSessionSyncController({ sync: hydrate, push,
      registerPusher: (next) => { pusher = next; }, onSynced: success });
    const guard = controller.start("A"); await vi.runAllTimersAsync(); expect(hydrate).not.toHaveBeenCalled();
    expect(guard?.signal.aborted).toBe(true); expect(controller.getCurrent()).toBe(guard); expect(pusher).toBeNull();
    expect(storage.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, syncIssue: "unconfirmed", owner: { provider: "supabase", userId: "A" } });
    expect(storage.captureCurrentPersonalStorage().getItem("coachfi-user")).toBe("SYNTHETIC ACCOUNT CACHE"); expect(success).not.toHaveBeenCalled();
    controller.start(null); expect(storage.captureCurrentPersonalStorage().getItem("coachfi-user")).toBe("SYNTHETIC GUEST"); controller.dispose();
  });

  it("external delete invalidates read-only Supabase lease with no debounce or reward pusher", async () => {
    const { createSessionSyncController } = await import("@/lib/sync/session-sync");
    const push = vi.fn(async () => {}), success = vi.fn(); let pusher: ((entity: "profile" | "reward", payload?: unknown) => void) | null = null;
    const register = vi.fn((next: typeof pusher) => { pusher = next; });
    const controller = createSessionSyncController({ sync: async () => true, push,
      registerPusher: register, onSynced: success });
    const guard = controller.start("A"); await vi.advanceTimersByTimeAsync(0);
    expect(pusher).toBeNull(); expect(register.mock.calls.every(([next]) => next === null)).toBe(true);
    const current = storage.captureCurrentPersonalStorage(); current.setItem("coachfi-user", "SYNTHETIC A CURRENT");
    expect(storage.eraseCurrentPersonalData(current)).toBe(true);
    expect(guard?.isCurrent()).toBe(false); expect(guard?.signal.aborted).toBe(true);
    expect(current.setItem("coachfi-user", "SYNTHETIC STALE")).toBe(false);
    await vi.runAllTimersAsync(); expect(push).not.toHaveBeenCalled(); expect(success).not.toHaveBeenCalled();
    expect([...local.keys()].some(key => key.startsWith("coachfi-owned:"))).toBe(false); controller.dispose();
  });

  it("logout reentry cannot replace B with guest or clear B's fields", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>(async (_input, init) => response(new Headers(init?.headers).get("x-coachfi-account-user-id")!, 10)));
    const sync = await import("@/lib/account-sync"); const A = sync.startLearningSession({ id: "A" }, async () => "FIXTURE_TOKEN_A"); await A.ready;
    const view = storage.captureCurrentPersonalStorage(); let B: ReturnType<typeof sync.startLearningSession> | undefined;
    let reentered = false;
    const unsubscribe = storage.subscribeStorageOwnership(() => {
      if (!reentered && storage.getStorageOwnershipSnapshot().status === "pending") {
        reentered = true; B = sync.startLearningSession({ id: "B" }, async () => "FIXTURE_TOKEN_B");
      }
    });
    await sync.endLearningSession(undefined, view); await B?.ready; unsubscribe();
    expect(storage.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", owner: { userId: "B" } });
    const before = storage.getStorageOwnershipSnapshot(); await sync.clearSignedInName(undefined, view);
    expect(storage.getStorageOwnershipSnapshot()).toBe(before); expect(B?.isCurrent()).toBe(true);
  });
});
