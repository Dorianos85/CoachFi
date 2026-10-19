import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

describe("independent account lifecycle review", () => {
  let storage: { get(key: string): string | undefined; set(key: string, value: string): void };
  let rawStorage: Map<string, string>;
  let writes: Mock<(key: string, value: string) => void>;
  let events: Mock<(event: Event) => boolean>;
  let request: Mock<typeof fetch>;
  beforeEach(async () => {
    vi.resetModules();
    rawStorage = new Map();
    writes = vi.fn((key: string, value: string) => { rawStorage.set(key, value); });
    events = vi.fn(() => true);
    const localStorage = {
      getItem: (key: string) => rawStorage.get(key) ?? null,
      setItem: writes,
      removeItem: vi.fn((key: string) => { rawStorage.delete(key); }),
    };
    vi.stubGlobal("localStorage", localStorage);
    vi.stubGlobal("window", { localStorage, sessionStorage: localStorage, dispatchEvent: events,
      addEventListener: vi.fn(), removeEventListener: vi.fn() });
    request = vi.fn<typeof fetch>(() => { throw new Error("Only explicitly stubbed local requests are permitted."); });
    vi.stubGlobal("fetch", request);
    const store = await import("@/lib/product-storage"); store.initializeStorageOwnership(false);
    storage = {
      get: (key) => store.captureCurrentPersonalStorage().getItem(key) ?? undefined,
      set: (key, value) => { if (!store.captureCurrentPersonalStorage().setItem(key, value)) throw new Error("Fixture owner is not ready"); },
    };
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("a pending GET after session stop cannot hydrate old account tokens", async () => {
    const read = deferred<Response>();
    request.mockImplementationOnce(() => read.promise);
    const sync = await import("@/lib/account-sync");
    const running = sync.syncSignedInAccount({ id: "synthetic-A" }, async () => "synthetic-token-A");
    await vi.waitFor(() => expect(request).toHaveBeenCalledOnce());
    const stopped = sync.endLearningSession();
    read.resolve(new Response(JSON.stringify({ ok: true, account: { id: "synthetic-A" }, state: { version: 1, tokens: 777 } }), { status: 200 }));
    await running; await stopped;
    expect(writes.mock.calls.some(([key, value]) => key.endsWith("coachfi-tokens") && value === "777")).toBe(false);
    expect(request).toHaveBeenCalledOnce();
  });

  it("a token resolved after session stop cannot start GET or PUT", async () => {
    const token = deferred<string | null>();
    const sync = await import("@/lib/account-sync");
    const getter = vi.fn(() => token.promise);
    const running = sync.syncSignedInAccount({ id: "synthetic-A" }, getter);
    await vi.waitFor(() => expect(getter).toHaveBeenCalledOnce());
    const stopped = sync.endLearningSession();
    token.resolve("synthetic-token-A");
    await running.catch(() => {}); await stopped;
    expect(request).not.toHaveBeenCalled();
    expect(writes).not.toHaveBeenCalled();
  });

  it("an absent cloud account exposes an empty read-only view without create or guest seed", async () => {
    storage.set("coachfi-tokens", "321"); storage.set("coachfi-learning-rev", "9");
    storage.set("coachfi-user", JSON.stringify({ name: "Synthetic guest", goal: "Guest goal", setupDone: true }));
    storage.set("coachfi-vault", JSON.stringify({ synthetic: "guest vault" }));
    storage.set("coachfi-health-check", "synthetic health"); storage.set("coachfi-consent-v1", "synthetic consent");
    request.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, account: null, state: null }), { status: 200 }));
    const sync = await import("@/lib/account-sync");
    expect(await sync.syncSignedInAccount({ id: "synthetic-A" }, async () => "synthetic-token-A")).toMatchObject({ status: "ready", syncIssue: "read-only" });
    expect(request).toHaveBeenCalledOnce(); expect(request.mock.calls[0][1]?.method).toBe("GET"); expect(request.mock.calls[0][1]?.body).toBeUndefined();
    expect(storage.get("coachfi-tokens")).toBeUndefined(); expect(storage.get("coachfi-learning-rev")).toBeUndefined();
    expect(rawStorage.get("coachfi-tokens")).toBe("321"); expect(rawStorage.get("coachfi-learning-rev")).toBe("9");
    expect(rawStorage.get("coachfi-health-check")).toBe("synthetic health");
    expect(rawStorage.get("coachfi-consent-v1")).toBe("synthetic consent");
  });

  it("GET unavailable does not create an account, and stopping preserves health/consent", async () => {
    storage.set("coachfi-health-check", "synthetic health"); storage.set("coachfi-consent-v1", "synthetic consent");
    request.mockResolvedValueOnce(new Response(JSON.stringify({ ok: false, error: "Synthetic unavailable" }), { status: 500 }));
    const sync = await import("@/lib/account-sync");
    await sync.syncSignedInAccount({ id: "synthetic-A" }, async () => "synthetic-token-A").catch(() => {});
    await sync.endLearningSession();
    expect(request).toHaveBeenCalledOnce();
    expect(storage.get("coachfi-health-check")).toBe("synthetic health");
    expect(storage.get("coachfi-consent-v1")).toBe("synthetic consent");
  });

  it("B can hydrate independently while the old A read is unresolved", async () => {
    const readA = deferred<Response>();
    request.mockImplementationOnce(() => readA.promise);
    request.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, account: { id: "synthetic-B" }, state: { version: 1, tokens: 88 } }), { status: 200 }));
    const sync = await import("@/lib/account-sync");
    const pendingA = sync.syncSignedInAccount({ id: "synthetic-A" }, async () => "synthetic-token-A");
    await vi.waitFor(() => expect(request).toHaveBeenCalledOnce());
    const completeB = sync.syncSignedInAccount({ id: "synthetic-B" }, async () => "synthetic-token-B");
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    await completeB;
    expect(storage.get("coachfi-tokens")).toBe("88");
    readA.resolve(new Response(JSON.stringify({ ok: true, account: { id: "synthetic-A" }, state: { version: 1, tokens: 777 } }), { status: 200 }));
    await pendingA;
    expect(storage.get("coachfi-tokens")).toBe("88");
    expect(writes.mock.calls.some(([key, value]) => key.endsWith("coachfi-tokens") && value === "777")).toBe(false);
    await sync.endLearningSession();
  });

  it("disposed A then explicit logout preserves owned bytes for relogin without resurrecting a flush", async () => {
    request.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, account: { cdpUserId: "synthetic-A" }, state: { version: 1, tokens: 10 } }), { status: 200 }));
    const sync = await import("@/lib/account-sync");
    const leaseA = sync.startLearningSession({ id: "synthetic-A" }, async () => "synthetic-token-A");
    await leaseA.ready; storage.set("coachfi-tokens", "22"); sync.persistLearningState("tokens");
    await Promise.resolve(); expect(request).toHaveBeenCalledOnce();
    leaseA.dispose(); await sync.endLearningSession();
    expect((await import("@/lib/product-storage")).getStorageOwnershipSnapshot().owner).toEqual({ kind: "guest" });
    const getter = vi.fn(async () => "synthetic-token-A"), relogin = sync.startLearningSession({ id: "synthetic-A" }, getter);
    expect(await relogin.ready).toMatchObject({ status: "unavailable", syncIssue: "unconfirmed" });
    expect(storage.get("coachfi-tokens")).toBe("22"); expect(storage.get("coachfi-learning-rev")).toBe("local-unconfirmed-v1");
    expect(getter).not.toHaveBeenCalled(); expect(request).toHaveBeenCalledOnce();
    await sync.endLearningSession();
  });

  it("abort reentrancy cannot clear a new B credential getter after close A", async () => {
    const consent = await import("@/lib/consent");
    storage.set(consent.CONSENT_STORAGE_KEY, JSON.stringify({ version: consent.CONSENT_VERSION, acceptedAt: "2026-10-14T00:00:00.000Z",
      termsAccepted: true, privacyAccepted: true, optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
    request.mockImplementation(async (_url, init) => {
      const id = new Headers(init?.headers).get("x-coachfi-account-user-id");
      return new Response(JSON.stringify({ ok: true, account: { cdpUserId: id }, state: { version: 1, tokens: id === "synthetic-A" ? 10 : 88 } }), { status: 200 });
    });
    const sync = await import("@/lib/account-sync"); const binding = await import("@/lib/account-session");
    const credentials = await import("@/lib/client/api-credentials");
    const leaseA = binding.bindAccountSession({ id: "synthetic-A" }, async () => "synthetic-token-A", { onReady: () => {} });
    await leaseA.ready;
    let leaseB: ReturnType<typeof binding.bindAccountSession> | undefined;
    request.mock.calls[0][1]?.signal?.addEventListener("abort", () => {
      leaseB = binding.bindAccountSession({ id: "synthetic-B" }, async () => "synthetic-token-B", { onReady: () => {} });
    });
    leaseA.dispose(); await leaseB?.ready;
    storage.set(consent.CONSENT_STORAGE_KEY, rawStorage.get(consent.CONSENT_STORAGE_KEY)!);
    expect(leaseB?.isCurrent()).toBe(true);
    expect((await credentials.getApiCredentials([]))?.headers.Authorization).toBe("Bearer synthetic-token-B");
    expect(storage.get("coachfi-tokens")).toBe("88");
    await sync.endLearningSession();
  });

  it("A and B explicit edits retain separate markers without any PUT, flush or acknowledgment", async () => {
    request.mockImplementation(async (_url, init) => {
      const id = new Headers(init?.headers).get("x-coachfi-account-user-id");
      if (init?.method !== "GET") throw new Error("Automatic write must never start");
      const data = { version: 1, tokens: id === "synthetic-A" ? 10 : 88 };
      return new Response(JSON.stringify({ ok: true, account: { cdpUserId: id }, state: data }), { status: 200 });
    });
    const sync = await import("@/lib/account-sync");
    await sync.startLearningSession({ id: "synthetic-A" }, async () => "synthetic-token-A").ready;
    const store = await import("@/lib/product-storage"), viewA = store.captureCurrentPersonalStorage();
    storage.set("coachfi-tokens", "11"); sync.persistLearningState("tokens");
    const b = sync.startLearningSession({ id: "synthetic-B" }, async () => "synthetic-token-B"); await b.ready;
    storage.set("coachfi-tokens", "89"); sync.persistLearningState("tokens");
    sync.persistLearningState("tokens", viewA); await Promise.resolve(); await Promise.resolve();
    expect(storage.get("coachfi-learning-rev")).toBe("local-unconfirmed-v1"); expect(storage.get("coachfi-tokens")).toBe("89");
    expect(rawStorage.get("coachfi-owned:v1:cdp:synthetic-A:coachfi-tokens")).toBe("11");
    expect(rawStorage.get("coachfi-owned:v1:cdp:synthetic-A:coachfi-learning-rev")).toBe("local-unconfirmed-v1");
    expect(viewA.isCurrent()).toBe(false); expect(b.isCurrent()).toBe(true); expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls.every(([, init]) => init?.method === "GET")).toBe(true);
    await sync.endLearningSession();
  });

  it("a response body resolved after A is stopped cannot hydrate over already-ready B", async () => {
    const body = deferred<unknown>(); const responseA = new Response("{}", { status: 200 });
    const json = vi.spyOn(responseA, "json").mockImplementation(() => body.promise);
    request.mockResolvedValueOnce(responseA);
    request.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, account: { cdpUserId: "synthetic-B" }, state: { version: 1, tokens: 88 } }), { status: 200 }));
    const sync = await import("@/lib/account-sync");
    const a = sync.startLearningSession({ id: "synthetic-A" }, async () => "synthetic-token-A");
    await vi.waitFor(() => expect(json).toHaveBeenCalledOnce());
    a.dispose(); const b = sync.startLearningSession({ id: "synthetic-B" }, async () => "synthetic-token-B"); await b.ready;
    body.resolve({ ok: true, account: { cdpUserId: "synthetic-A" }, state: { version: 1, tokens: 777 } });
    expect((await a.ready).status).toBe("stopped");
    expect(storage.get("coachfi-tokens")).toBe("88");
    expect(writes.mock.calls.some(([key, value]) => key.endsWith("coachfi-tokens") && value === "777")).toBe(false);
    await sync.endLearningSession();
  });

  it("no pagehide upload callback exists, and stale end A cannot clear B", async () => {
    request.mockImplementation(async (_url, init) => {
      const id = new Headers(init?.headers).get("x-coachfi-account-user-id");
      return new Response(JSON.stringify({ ok: true, account: { cdpUserId: id }, state: { version: 1, tokens: id === "synthetic-A" ? 10 : 88 } }), { status: 200 });
    });
    const sync = await import("@/lib/account-sync");
    const a = sync.startLearningSession({ id: "synthetic-A" }, async () => "synthetic-token-A"); await a.ready;
    expect((window.addEventListener as unknown as Mock).mock.calls.some(([type]) => type === "pagehide")).toBe(false);
    const b = sync.startLearningSession({ id: "synthetic-B" }, async () => "synthetic-token-B"); await b.ready;
    const before = request.mock.calls.length; await sync.endLearningSession(a); await Promise.resolve();
    expect(request.mock.calls.length).toBe(before); expect(b.isCurrent()).toBe(true);
    expect(storage.get("coachfi-tokens")).toBe("88"); await sync.endLearningSession();
  });

  it("deferred or repeated old name-clear cannot alter B or send an old-identity request", async () => {
    request.mockImplementation(async (_url, init) => {
      const id = new Headers(init?.headers).get("x-coachfi-account-user-id");
      return new Response(JSON.stringify({ ok: true, account: { cdpUserId: id }, state: { version: 1, tokens: 10 } }), { status: 200 });
    });
    const token = deferred<string | null>(); const getter = vi.fn<() => Promise<string | null>>();
    getter.mockResolvedValueOnce("synthetic-token-A").mockImplementationOnce(() => token.promise);
    const sync = await import("@/lib/account-sync");
    const a = sync.startLearningSession({ id: "synthetic-A" }, getter); await a.ready;
    storage.set("coachfi-user", JSON.stringify({ name: "Synthetic A", goal: "", setupDone: true }));
    const removal = sync.clearSignedInName(a); a.dispose();
    await sync.startLearningSession({ id: "synthetic-B" }, async () => "synthetic-token-B").ready;
    storage.set("coachfi-user", JSON.stringify({ name: "Synthetic B", goal: "", setupDone: true }));
    token.resolve("synthetic-token-A"); await removal; await sync.clearSignedInName(a);
    expect(JSON.parse(storage.get("coachfi-user")!).name).toBe("Synthetic B");
    expect(request).toHaveBeenCalledTimes(2); await sync.endLearningSession();
  });

  it("a stopped outer bind cannot overwrite the newer B bridge created in an abort listener", async () => {
    const consent = await import("@/lib/consent");
    storage.set(consent.CONSENT_STORAGE_KEY, JSON.stringify({ version: consent.CONSENT_VERSION, acceptedAt: "2026-10-14T00:00:00.000Z",
      termsAccepted: true, privacyAccepted: true, optional: { aiCoach: false, voice: false, leaderboard: false, blockchain: false } }));
    request.mockImplementation(async (_url, init) => {
      const id = new Headers(init?.headers).get("x-coachfi-account-user-id");
      return new Response(JSON.stringify({ ok: true, account: { cdpUserId: id }, state: { version: 1 } }), { status: 200 });
    });
    const sync = await import("@/lib/account-sync"), binding = await import("@/lib/account-session");
    const credentials = await import("@/lib/client/api-credentials");
    const a = binding.bindAccountSession({ id: "synthetic-A" }, async () => "synthetic-token-A", { onReady: () => {} }); await a.ready;
    let b: ReturnType<typeof binding.bindAccountSession> | undefined;
    request.mock.calls[0][1]?.signal?.addEventListener("abort", () => {
      b = binding.bindAccountSession({ id: "synthetic-B" }, async () => "synthetic-token-B", { onReady: () => {} });
    });
    const getC = vi.fn(async () => "synthetic-token-C");
    const c = binding.bindAccountSession({ id: "synthetic-C" }, getC, { onReady: () => {} });
    await b?.ready; await c.ready;
    storage.set(consent.CONSENT_STORAGE_KEY, rawStorage.get(consent.CONSENT_STORAGE_KEY)!);
    expect(b?.isCurrent()).toBe(true); expect(c.isCurrent()).toBe(false); expect(getC).not.toHaveBeenCalled();
    expect((await credentials.getApiCredentials([]))?.headers.Authorization).toBe("Bearer synthetic-token-B");
    await sync.endLearningSession();
  });

  it("name-clear event disposal fences before starting its deferred token factory", async () => {
    request.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, account: { cdpUserId: "synthetic-A" }, state: { version: 1 } }), { status: 200 }));
    const getter = vi.fn(async () => "synthetic-token-A"); const sync = await import("@/lib/account-sync");
    const a = sync.startLearningSession({ id: "synthetic-A" }, getter); await a.ready;
    storage.set("coachfi-user", JSON.stringify({ name: "Synthetic A", goal: "", setupDone: true }));
    events.mockImplementation((event) => { if (event.type === "coachfi-user") a.dispose(); return true; });
    await sync.clearSignedInName(a);
    expect(getter).toHaveBeenCalledOnce(); expect(request).toHaveBeenCalledOnce();
    await sync.endLearningSession();
  });

  it("disposal settles an uncancellable pending token and tolerates its later rejection", async () => {
    const token = deferred<string | null>(), getter = vi.fn(() => token.promise);
    const sync = await import("@/lib/account-sync");
    const a = sync.startLearningSession({ id: "synthetic-A" }, getter);
    let finished = false; void a.ready.then(() => { finished = true; });
    await vi.waitFor(() => expect(getter).toHaveBeenCalledOnce()); a.dispose();
    await vi.waitFor(() => expect(finished).toBe(true)); expect((await a.ready).status).toBe("stopped");
    token.reject(new Error("Synthetic late SDK rejection")); await Promise.resolve(); await Promise.resolve();
    expect(request).not.toHaveBeenCalled(); await sync.endLearningSession();
  });
});
