import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { AccountTokenGetter } from "@/lib/account-sync";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}
function response(id: string, tokens = 10) {
  return new Response(JSON.stringify({ ok: true, configured: true, account: { cdpUserId: id }, state: { version: 1, tokens } }), { status: 200 });
}
const turn = async () => { for (let n = 0; n < 20; n += 1) await Promise.resolve(); };

describe("account sync session ownership (synthetic author tests)", () => {
  let storage: Map<string, string>;
  let writes: Mock<(key: string, value: string) => void>;
  let removes: Mock<(key: string) => void>;
  let events: Mock<(event: Event) => boolean>;
  let fetchMock: Mock<typeof fetch>;
  let listeners: Map<string, Set<EventListener>>;
  let ownership: typeof import("@/lib/product-storage");
  const currentGet = (key: string) => ownership.getStorageOwnershipSnapshot().status === "ready"
    ? ownership.captureCurrentPersonalStorage().getItem(key) ?? undefined : storage.get(key);
  const currentSet = (key: string, value: string) => ownership.getStorageOwnershipSnapshot().status === "ready"
    ? ownership.captureCurrentPersonalStorage().setItem(key, value) : storage.set(key, value);
  const currentHas = (key: string) => currentGet(key) !== undefined;
  const dataEvents = () => events.mock.calls.filter(([event]) => event.type !== "coachfi-storage-owner");
  beforeEach(async () => {
    vi.resetModules();
    storage = new Map(); listeners = new Map();
    writes = vi.fn((key: string, value: string) => { storage.set(key, value); });
    removes = vi.fn((key: string) => { storage.delete(key); });
    events = vi.fn(() => true);
    const localStorage = { getItem: (key: string) => storage.get(key) ?? null, setItem: writes, removeItem: removes };
    vi.stubGlobal("localStorage", localStorage);
    vi.stubGlobal("window", { localStorage, dispatchEvent: events,
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        const set = listeners.get(type) ?? new Set(); set.add(listener); listeners.set(type, set);
      }),
      removeEventListener: vi.fn((type: string, listener: EventListener) => listeners.get(type)?.delete(listener)) });
    fetchMock = vi.fn<typeof fetch>(() => { throw new Error("No real network: provide a synthetic response."); });
    vi.stubGlobal("fetch", fetchMock);
    ownership = await import("@/lib/product-storage");
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("stop resolves readiness immediately while an uncancellable token stays pending", async () => {
    const token = deferred<string | null>(); const getter = vi.fn(() => token.promise);
    const sync = await import("@/lib/account-sync");
    const lease = sync.startLearningSession({ id: "A" }, getter);
    await vi.waitFor(() => expect(getter).toHaveBeenCalledOnce());
    await sync.stopLearningSync(lease);
    expect((await lease.ready).status).toBe("stopped");
    expect(fetchMock).not.toHaveBeenCalled(); expect(writes).not.toHaveBeenCalled();
    token.resolve("token-A"); await turn();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("late rejected SDK work is consumed after cancellation", async () => {
    const token = deferred<string | null>(); const sync = await import("@/lib/account-sync");
    const lease = sync.startLearningSession({ id: "A" }, () => token.promise);
    await turn(); lease.dispose(); expect((await lease.ready).status).toBe("stopped");
    token.reject(new Error("synthetic late SDK rejection")); await turn();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("delayed JSON parsing cannot hydrate or announce success after logout", async () => {
    const json = deferred<unknown>(); const jsonCall = vi.fn(() => json.promise);
    fetchMock.mockResolvedValueOnce({ ok: true, json: jsonCall } as unknown as Response);
    const sync = await import("@/lib/account-sync");
    const lease = sync.startLearningSession({ id: "A" }, async () => "token-A");
    await vi.waitFor(() => expect(jsonCall).toHaveBeenCalledOnce());
    const signal = fetchMock.mock.calls[0][1]?.signal;
    await sync.endLearningSession(); expect(signal?.aborted).toBe(true);
    expect((await lease.ready).status).toBe("stopped");
    json.resolve({ ok: true, account: { cdpUserId: "A" }, state: { version: 1, tokens: 777 } }); await turn();
    expect(writes).not.toHaveBeenCalled(); expect(dataEvents()).toEqual([]);
  });

  it("A token completion cannot use B's getter or delay B's queue", async () => {
    const tokenA = deferred<string | null>(); const getterB = vi.fn(async () => "token-B");
    fetchMock.mockResolvedValueOnce(response("B", 88));
    const sync = await import("@/lib/account-sync");
    const A = sync.startLearningSession({ id: "A" }, () => tokenA.promise); await turn();
    const B = sync.startLearningSession({ id: "B" }, getterB); await B.ready;
    expect(currentGet("coachfi-tokens")).toBe("88"); expect(getterB).toHaveBeenCalledOnce();
    tokenA.resolve("token-A"); await A.ready; await turn();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get("x-coachfi-account-user-id")).toBe("B");
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get("authorization")).toBe("Bearer token-B");
  });

  it("A logout then A relogin has a new generation and ignores old GET", async () => {
    const oldRead = deferred<Response>(); fetchMock.mockImplementationOnce(() => oldRead.promise).mockResolvedValueOnce(response("A", 33));
    const sync = await import("@/lib/account-sync");
    const A1 = sync.startLearningSession({ id: "A" }, async () => "token-A1");
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce()); await sync.endLearningSession();
    const A2 = sync.startLearningSession({ id: "A" }, async () => "token-A2"); await A2.ready;
    expect(A2.generation).not.toBe(A1.generation);
    oldRead.resolve(response("A", 777)); await A1.ready; await turn();
    expect(currentGet("coachfi-tokens")).toBe("33"); expect(A2.isCurrent()).toBe(true);
  });

  it("fresh login ignores pre-ready mutations and never seeds shared device fields", async () => {
    const read = deferred<Response>();
    for (const [key, value] of Object.entries({ "coachfi-user": '{"name":"guest","goal":"guest goal"}', "coachfi-vault": '{"guest":1}',
      "coachfi-challenge": '{"guest":1}', "coachfi-tokens": "321", "coachfi-srs": '{"guest":1}', "coachfi-health-check": "health", "coachfi-consent-v1": "consent" })) currentSet(key, value);
    fetchMock.mockImplementationOnce(() => read.promise).mockResolvedValueOnce(response("A", 0));
    const sync = await import("@/lib/account-sync"); const lease = sync.startLearningSession({ id: "A" }, async () => "token-A");
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    currentSet("coachfi-tokens", "456"); sync.persistLearningState("tokens");
    expect(currentHas("coachfi-learning-rev")).toBe(false);
    read.resolve(new Response(JSON.stringify({ ok: true, account: null, state: null }), { status: 200 }));
    expect((await lease.ready).status).toBe("ready"); await turn();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][1]?.method).toBe("GET");
    expect(currentHas("coachfi-tokens")).toBe(false);
    expect(storage.get("coachfi-health-check")).toBe("health"); expect(storage.get("coachfi-consent-v1")).toBe("consent");
    expect(storage.get("coachfi-user")).toContain("guest"); expect(storage.get("coachfi-vault")).toContain("guest");
  });

  it.each([
    { body: { configured: false }, status: 200 },
    { body: { ok: false }, status: 500 },
    { body: { ok: true, account: null }, status: 200 },
    { body: { ok: true, account: { cdpUserId: "B" }, state: { version: 1, tokens: 777 } }, status: 200 },
    { body: { ok: true, account: { cdpUserId: "A" }, state: { version: 99 } }, status: 200 },
  ])("unavailable, malformed or mismatched GET preserves local data without auto-create: %j", async ({ body, status }) => {
    currentSet("coachfi-tokens", "17"); currentSet("coachfi-health-check", "health"); currentSet("coachfi-consent-v1", "consent");
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }));
    const sync = await import("@/lib/account-sync"); const lease = sync.startLearningSession({ id: "A" }, async () => "token-A");
    expect((await lease.ready).status).toBe("unavailable"); await sync.endLearningSession();
    expect(fetchMock).toHaveBeenCalledOnce(); expect(writes).not.toHaveBeenCalled();
    expect(currentGet("coachfi-tokens")).toBe("17"); expect(storage.get("coachfi-health-check")).toBe("health");
    expect(storage.get("coachfi-consent-v1")).toBe("consent");
  });

  it("disabled PUT and old success fixtures cannot clear either of two local changes", async () => {
    fetchMock.mockResolvedValueOnce(response("A")).mockResolvedValueOnce(response("A", 20));
    const sync = await import("@/lib/account-sync"); await sync.syncSignedInAccount({ id: "A" }, async () => "token-A");
    currentSet("coachfi-tokens", "20"); sync.persistLearningState("tokens");
    currentSet("coachfi-tokens", "30"); sync.persistLearningState("tokens"); await turn();
    expect(currentGet("coachfi-tokens")).toBe("30");
    expect(currentGet("coachfi-learning-rev")).toBe("local-unconfirmed-v1");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][1]?.method).toBe("GET");
  });

  it("late A GET cannot hydrate, clear B's local marker or publish a stale event", async () => {
    const readA = deferred<Response>();
    fetchMock.mockImplementationOnce(() => readA.promise).mockResolvedValueOnce(response("B", 88));
    const sync = await import("@/lib/account-sync"); const A = sync.startLearningSession({ id: "A" }, async () => "token-A");
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const B = sync.startLearningSession({ id: "B" }, async () => "token-B"); await B.ready;
    const ownedB = ownership.captureCurrentPersonalStorage();
    currentSet("coachfi-tokens", "99"); sync.persistLearningState("tokens", ownedB); await turn();
    const eventCount = events.mock.calls.length;
    readA.resolve(response("A", 777)); await A.ready; await turn();
    await sync.endLearningSession(A); A.dispose();
    expect(currentGet("coachfi-learning-rev")).toBe("local-unconfirmed-v1"); expect(currentGet("coachfi-tokens")).toBe("99");
    expect(events).toHaveBeenCalledTimes(eventCount); expect(B.isCurrent()).toBe(true);
    expect(fetchMock.mock.calls.map(([, init]) => new Headers(init?.headers).get("x-coachfi-account-user-id"))).toEqual(["A", "B"]);
    expect(fetchMock.mock.calls.every(([, init]) => init?.method === "GET")).toBe(true);
  });

  it("same-owner rebind retains exact owned local bytes without another GET or payload replay", async () => {
    fetchMock.mockResolvedValueOnce(response("A"));
    const sync = await import("@/lib/account-sync"); const A1 = sync.startLearningSession({ id: "A" }, async () => "token-1"); await A1.ready;
    const old = ownership.captureCurrentPersonalStorage();
    old.setItem("coachfi-tokens", "00020"); sync.persistLearningState("tokens", old); await turn();
    A1.dispose(); const getter2 = vi.fn(async () => "token-2");
    const A2 = sync.startLearningSession({ id: "A" }, getter2);
    expect(old.setItem("coachfi-tokens", "999")).toBe(false);
    expect((await A2.ready)).toMatchObject({ status: "unavailable", syncIssue: "unconfirmed" });
    expect(currentGet("coachfi-tokens")).toBe("00020");
    expect(currentGet("coachfi-learning-rev")).toBe("local-unconfirmed-v1");
    expect(getter2).not.toHaveBeenCalled(); expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("explicit logout after effect disposal preserves owned local data without replay on relogin", async () => {
    storage.set("coachfi-tokens", "000777");
    fetchMock.mockResolvedValueOnce(response("A"));
    const sync = await import("@/lib/account-sync"); const A = sync.startLearningSession({ id: "A" }, async () => "token-A"); await A.ready;
    currentSet("coachfi-tokens", "22"); sync.persistLearningState("tokens"); await turn();
    A.dispose(); await sync.endLearningSession(); expect(currentGet("coachfi-tokens")).toBe("000777");
    const relogin = sync.startLearningSession({ id: "A" }, async () => "token-A2");
    expect((await relogin.ready).status).toBe("unavailable");
    expect(currentGet("coachfi-tokens")).toBe("22"); expect(fetchMock).toHaveBeenCalledOnce();
    expect(storage.get("coachfi-tokens")).toBe("000777");
  });

  it("explicit stop after disposal preserves owned local learning and never triggers overwrite", async () => {
    fetchMock.mockResolvedValueOnce(response("A", 10));
    const sync = await import("@/lib/account-sync"); const A = sync.startLearningSession({ id: "A" }, async () => "token-A"); await A.ready;
    const owned = ownership.captureCurrentPersonalStorage(); owned.setItem("coachfi-tokens", "123");
    A.dispose(); await sync.stopLearningSync();
    expect(storage.get("coachfi-owned:v1:cdp:A:coachfi-tokens")).toBe("123");
    const next = sync.startLearningSession({ id: "A" }, async () => "token-A2");
    expect((await next.ready).status).toBe("unavailable");
    expect(currentGet("coachfi-tokens")).toBe("123");
    expect(currentGet("coachfi-learning-rev")).toBe("local-unconfirmed-v1"); expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("stop and pagehide send no final snapshot; old captured persistence cannot affect B", async () => {
    fetchMock.mockResolvedValueOnce(response("A")).mockResolvedValueOnce(response("B", 88));
    const sync = await import("@/lib/account-sync"); const A = sync.startLearningSession({ id: "A" }, async () => "token-A"); await A.ready;
    const oldStorage = ownership.captureCurrentPersonalStorage();
    currentSet("coachfi-tokens", "20"); sync.persistLearningState("tokens", oldStorage); await turn();
    expect(listeners.get("pagehide")?.size ?? 0).toBe(0);
    await sync.stopLearningSync();
    const B = sync.startLearningSession({ id: "B" }, async () => "token-B"); await B.ready;
    sync.persistLearningState("tokens", oldStorage);
    for (const callback of listeners.get("pagehide") ?? []) callback(new Event("pagehide"));
    await turn(); expect(fetchMock).toHaveBeenCalledTimes(2); expect(currentGet("coachfi-tokens")).toBe("88");
    expect(oldStorage.setItem("coachfi-tokens", "777")).toBe(false);
    expect(storage.get("coachfi-owned:v1:cdp:A:coachfi-tokens")).toBe("20");
    expect(fetchMock.mock.calls.every(([, init]) => init?.method === "GET")).toBe(true);
  });

  it("local changes retain a durable marker and never retry transport while upload is disabled", async () => {
    fetchMock.mockResolvedValueOnce(response("A")).mockRejectedValueOnce(new Error("synthetic offline"));
    const sync = await import("@/lib/account-sync"); await sync.syncSignedInAccount({ id: "A" }, async () => "token-A");
    currentSet("coachfi-tokens", "20"); sync.persistLearningState("tokens"); await turn();
    expect(currentGet("coachfi-learning-rev")).toBe("local-unconfirmed-v1"); expect(currentGet("coachfi-tokens")).toBe("20");
    currentSet("coachfi-tokens", "30"); sync.persistLearningState("tokens"); await turn();
    expect(currentGet("coachfi-learning-rev")).toBe("local-unconfirmed-v1"); expect(currentGet("coachfi-tokens")).toBe("30");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("an empty remote never auto-creates an account or uploads guest fields", async () => {
    currentSet("coachfi-tokens", "321");
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, account: null, state: null }), { status: 200 }));
    const sync = await import("@/lib/account-sync"); const lease = sync.startLearningSession({ id: "A" }, async () => "token-A");
    expect((await lease.ready)).toMatchObject({ status: "ready", syncIssue: "read-only" });
    expect(currentGet("coachfi-tokens")).toBeUndefined(); expect(storage.get("coachfi-tokens")).toBe("321");
    expect(ownership.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, syncIssue: "read-only", owner: { userId: "A" } });
    expect(fetchMock).toHaveBeenCalledOnce(); expect(fetchMock.mock.calls[0][1]?.method).toBe("GET");
  });

  it("remote name removal is disabled and stale local cleanup cannot clear B", async () => {
    const nameToken = deferred<string | null>(); const getter = vi.fn<AccountTokenGetter>(async () => "token-A");
    fetchMock.mockResolvedValueOnce(response("A")).mockResolvedValueOnce(response("B", 88));
    const sync = await import("@/lib/account-sync"); const A = sync.startLearningSession({ id: "A" }, getter); await A.ready;
    currentSet("coachfi-user", '{"name":"A name","goal":"kept","setupDone":true}');
    getter.mockImplementationOnce(() => nameToken.promise);
    await sync.clearSignedInName(A); expect(getter).toHaveBeenCalledOnce();
    expect(JSON.parse(currentGet("coachfi-user")!)).toEqual({ name: "", goal: "kept", setupDone: true });
    const B = sync.startLearningSession({ id: "B" }, async () => "token-B"); await B.ready;
    currentSet("coachfi-user", '{"name":"B name"}'); nameToken.resolve("late-token-A"); await sync.clearSignedInName(A);
    expect(fetchMock).toHaveBeenCalledTimes(2); expect(currentGet("coachfi-user")).toContain("B name");
    expect(fetchMock.mock.calls.every(([, init]) => init?.method === "GET")).toBe(true);
  });

  it("local name event stopping the lease prevents another token getter or request", async () => {
    fetchMock.mockResolvedValueOnce(response("A")); const getter = vi.fn<AccountTokenGetter>(async () => "token-A");
    const sync = await import("@/lib/account-sync"); const A = sync.startLearningSession({ id: "A" }, getter); await A.ready;
    currentSet("coachfi-user", '{"name":"A name"}');
    events.mockImplementation((event) => { if (event.type === "coachfi-user") A.dispose(); return true; });
    await sync.clearSignedInName(A);
    expect(getter).toHaveBeenCalledOnce(); expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("disabled remote name cleanup never invokes a getter that would synchronously dispose its lease", async () => {
    fetchMock.mockResolvedValueOnce(response("A")); const getter = vi.fn<AccountTokenGetter>(async () => "token-A");
    const sync = await import("@/lib/account-sync"); const A = sync.startLearningSession({ id: "A" }, getter); await A.ready;
    currentSet("coachfi-user", '{"name":"A name"}');
    getter.mockImplementationOnce(async () => { A.dispose(); throw new Error("synthetic forbidden remote getter"); });
    await sync.clearSignedInName(A); await turn();
    expect(getter).toHaveBeenCalledOnce(); expect(A.isCurrent()).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce(); expect(JSON.parse(currentGet("coachfi-user")!).name).toBe("");
  });

  it("only the initial read carries the captured identity; name cleanup has no remote GET/PUT", async () => {
    fetchMock.mockResolvedValueOnce(response("A"));
    const sync = await import("@/lib/account-sync"); const A = sync.startLearningSession({ id: "A" }, async () => "token-A"); await A.ready;
    currentSet("coachfi-user", '{"name":"A name","goal":"kept","setupDone":true}'); await sync.clearSignedInName(A);
    expect(fetchMock.mock.calls.map(([, init]) => new Headers(init?.headers).get("x-coachfi-account-user-id"))).toEqual(["A"]);
    expect(fetchMock.mock.calls[0][1]?.method).toBe("GET");
    expect(JSON.parse(currentGet("coachfi-user")!)).toEqual({ name: "", goal: "kept", setupDone: true });
  });

  it("local logout name cleanup never writes an account and cannot clear active B", async () => {
    fetchMock.mockResolvedValueOnce(response("A")).mockResolvedValueOnce(response("B", 88));
    const sync = await import("@/lib/account-sync"); const A = sync.startLearningSession({ id: "A" }, async () => "token-A"); await A.ready;
    currentSet("coachfi-user", '{"name":"A name","goal":"kept"}'); storage.set("coachfi-health-check", "health"); storage.set("coachfi-consent-v1", "consent");
    const owned = ownership.captureCurrentPersonalStorage();
    await sync.endLearningSession(undefined, owned); await sync.clearSignedInName(undefined, owned);
    expect(fetchMock).toHaveBeenCalledOnce(); expect(currentGet("coachfi-user")).toBeUndefined();
    expect(storage.get("coachfi-health-check")).toBe("health"); expect(storage.get("coachfi-consent-v1")).toBe("consent");
    const B = sync.startLearningSession({ id: "B" }, async () => "token-B"); await B.ready;
    currentSet("coachfi-user", '{"name":"B name"}'); await sync.clearSignedInName();
    expect(currentGet("coachfi-user")).toContain("B name"); expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("a stale effect binding never invokes readiness or unregisters a new binding", async () => {
    const read = deferred<Response>(); fetchMock.mockImplementationOnce(() => read.promise).mockResolvedValueOnce(response("B", 88));
    const binding = await import("@/lib/account-session"); const readyA = vi.fn(); const unavailableA = vi.fn(); const readyB = vi.fn();
    const A = binding.bindAccountSession({ id: "A" }, async () => "token-A", { onReady: readyA, onUnavailable: unavailableA });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce()); A.dispose();
    const B = binding.bindAccountSession({ id: "B" }, async () => "token-B", { onReady: readyB }); await B.ready;
    read.resolve(response("A", 777)); await A.ready; A.dispose(); await turn();
    expect(readyA).not.toHaveBeenCalled(); expect(unavailableA).not.toHaveBeenCalled(); expect(readyB).toHaveBeenCalledOnce(); expect(B.isCurrent()).toBe(true);
  });

  it("abort reentrancy cannot erase B or let the older outer start C overwrite it", async () => {
    const consent = await import("@/lib/consent");
    currentSet(consent.CONSENT_STORAGE_KEY, JSON.stringify({ version: consent.CONSENT_VERSION, acceptedAt: "2026-10-14T00:00:00.000Z",
      termsAccepted: true, privacyAccepted: true, optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
    fetchMock.mockImplementation(async (_url, init) => response(new Headers(init?.headers).get("x-coachfi-account-user-id")!, 88));
    const binding = await import("@/lib/account-session"); const credentials = await import("@/lib/client/api-credentials");
    const visibility = await import("@/lib/progress-visibility");
    const A = binding.bindAccountSession({ id: "A" }, async () => "token-A", { onReady: () => {} }); await A.ready;
    let B: ReturnType<typeof binding.bindAccountSession> | undefined;
    fetchMock.mock.calls[0][1]?.signal?.addEventListener("abort", () => {
      B = binding.bindAccountSession({ id: "B" }, async () => "token-B", { onReady: () => {} });
    });
    const C = binding.bindAccountSession({ id: "C" }, async () => "token-C", { onReady: () => {} }); await B?.ready;
    expect((await C.ready).status).toBe("stopped"); expect(C.isCurrent()).toBe(false); expect(B?.isCurrent()).toBe(true);
    currentSet(consent.CONSENT_STORAGE_KEY, JSON.stringify(consent.createConsentRecord()));
    expect((await credentials.getApiCredentials([]))?.headers.Authorization).toBe("Bearer token-B"); expect(visibility.isProgressVisible()).toBe(true);
    expect(fetchMock.mock.calls.map(([, init]) => new Headers(init?.headers).get("x-coachfi-account-user-id"))).toEqual(["A", "B"]);
  });

  it("cleanup event reentrancy preserves the newer session instead of outer start", async () => {
    fetchMock.mockImplementation(async (_url, init) => response(new Headers(init?.headers).get("x-coachfi-account-user-id")!, 88));
    const sync = await import("@/lib/account-sync"); const A = sync.startLearningSession({ id: "A" }, async () => "token-A"); await A.ready;
    let B: ReturnType<typeof sync.startLearningSession> | undefined;
    let entered = false;
    events.mockImplementation((event) => {
      if (event.type === "coachfi-storage-owner" && !entered) { entered = true; B = sync.startLearningSession({ id: "B" }, async () => "token-B"); }
      return true;
    });
    const C = sync.startLearningSession({ id: "C" }, async () => "token-C"); await B?.ready;
    expect((await C.ready).status).toBe("stopped"); expect(B?.isCurrent()).toBe(true); expect(currentGet("coachfi-tokens")).toBe("88");
  });
});
