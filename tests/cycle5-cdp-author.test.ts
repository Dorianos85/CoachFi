import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { AccountSnapshot } from "@/lib/account-snapshot";

const drain = async () => { for (let n = 0; n < 50; n += 1) await Promise.resolve(); };
const response = (state: AccountSnapshot | null, status = 200) => new Response(JSON.stringify({
  ok: status < 400, configured: true, account: { cdpUserId: "FIXTURE_A" }, state,
}), { status });
const ownedKey = (key: string) => `coachfi-owned:v1:cdp:FIXTURE_A:${key}`;
const MARKER = "local-unconfirmed-v1";
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; }); return { promise, resolve };
}

describe("B15 CDP read-only cold-resume acceptance (synthetic, no network)", () => {
  let local: Map<string, string>;
  let target: EventTarget;
  let fetchMock: Mock<typeof fetch>;
  let ownership: typeof import("@/lib/product-storage");
  let sync: typeof import("@/lib/account-sync");
  let afterPhysicalWrite: ((key: string) => void) | undefined;

  const setupWindow = () => {
    target = new EventTarget();
    const store = (map: Map<string, string>) => ({ getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => { map.set(key, value); afterPhysicalWrite?.(key); },
      removeItem: (key: string) => { map.delete(key); } });
    vi.stubGlobal("window", { localStorage: store(local), sessionStorage: store(new Map()),
      dispatchEvent: target.dispatchEvent.bind(target), addEventListener: target.addEventListener.bind(target),
      removeEventListener: target.removeEventListener.bind(target) });
  };
  const coldReload = async () => {
    await sync.stopLearningSync(); vi.resetModules(); setupWindow();
    ownership = await import("@/lib/product-storage");
    sync = await import("@/lib/account-sync");
  };
  const start = async (getter = vi.fn(async () => "FIXTURE_TOKEN_A")) => {
    const lease = sync.startLearningSession({ id: "FIXTURE_A" }, getter);
    return { lease, result: await lease.ready, getter };
  };

  beforeEach(async () => {
    vi.resetModules(); local = new Map(); afterPhysicalWrite = undefined; setupWindow();
    vi.stubEnv("NEXT_PUBLIC_CDP_PROJECT_ID", ""); vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    fetchMock = vi.fn<typeof fetch>(() => { throw new Error("No real transport: configure a synthetic response."); });
    vi.stubGlobal("fetch", fetchMock);
    ownership = await import("@/lib/product-storage");
    sync = await import("@/lib/account-sync");
  });
  afterEach(async () => {
    afterPhysicalWrite = undefined; await sync.stopLearningSync();
    vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks();
  });

  it("CDP-B15-01: cold reload retains owned20, pending bytes and guest/health without GET or PUT", async () => {
    local.set("coachfi-tokens", "000777"); local.set("coachfi-health-check", "FIXTURE_GUEST_HEALTH_RAW");
    fetchMock.mockResolvedValueOnce(response({ version: 1, tokens: 10 }));
    await start(); const own = ownership.captureCurrentPersonalStorage();
    own.setItem("coachfi-health-check", "FIXTURE_ACCOUNT_HEALTH_RAW");
    own.setItem("coachfi-tokens", "20"); sync.persistLearningState("tokens", own); await drain();
    expect(local.get(ownedKey("coachfi-learning-rev"))).toBe(MARKER);
    expect(fetchMock).toHaveBeenCalledOnce();
    await coldReload(); const resumed = await start();
    expect(resumed.result).toMatchObject({ status: "unavailable", syncIssue: "unconfirmed" });
    expect(resumed.getter).not.toHaveBeenCalled();
    expect(ownership.captureCurrentPersonalStorage().getItem("coachfi-tokens")).toBe("20");
    expect(local.get(ownedKey("coachfi-learning-rev"))).toBe(MARKER);
    expect(local.get("coachfi-tokens")).toBe("000777");
    expect(local.get("coachfi-health-check")).toBe("FIXTURE_GUEST_HEALTH_RAW");
    expect(local.get(ownedKey("coachfi-health-check"))).toBe("FIXTURE_ACCOUNT_HEALTH_RAW");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("CDP-B15-02: local-only reward remains owned15 with a durable marker after cold resume", async () => {
    local.set(ownedKey("coachfi-tokens"), "10");
    expect((await start()).result).toMatchObject({ status: "unavailable", syncIssue: "unconfirmed" });
    const { addTokens } = await import("@/lib/tokens");
    expect(addTokens(5, "FIXTURE_REASON", "FIXTURE_SOURCE", ownership.captureCurrentPersonalStorage())).toBe(15);
    await drain(); expect(local.get(ownedKey("coachfi-tokens"))).toBe("15");
    expect(local.get(ownedKey("coachfi-learning-rev"))).toBe(MARKER);
    await coldReload(); expect((await start()).result.status).toBe("unavailable");
    expect(local.get(ownedKey("coachfi-tokens"))).toBe("15");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("CDP-B15-03: configured PUT failure cannot matter because no automatic PUT is attempted", async () => {
    fetchMock.mockImplementation(async (_input, init) => init?.method === "GET" ?
      response({ version: 1, tokens: 10 }) : response(null, 503));
    await start(); const own = ownership.captureCurrentPersonalStorage();
    own.setItem("coachfi-tokens", "25"); sync.persistLearningState("tokens", own); await drain();
    expect(local.get(ownedKey("coachfi-learning-rev"))).toBe(MARKER);
    await coldReload(); expect((await start()).result.status).toBe("unavailable");
    expect(local.get(ownedKey("coachfi-tokens"))).toBe("25");
    expect(local.get(ownedKey("coachfi-learning-rev"))).toBe(MARKER);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][1]?.method).toBe("GET");
  });

  it.each(["GET_503", "PUT_409"])("CDP-B15-04: warm owned resume stays unconfirmed and performs no %s", async (failure) => {
    fetchMock.mockResolvedValueOnce(response({ version: 1, tokens: 10 }));
    const { lease } = await start(); const own = ownership.captureCurrentPersonalStorage();
    own.setItem("coachfi-tokens", "30"); sync.persistLearningState("tokens", own); await drain(); lease.dispose();
    fetchMock.mockImplementation(async () => response(null, failure === "GET_503" ? 503 : 409));
    const resumed = await start();
    expect(resumed.result).toMatchObject({ status: "unavailable", syncIssue: "unconfirmed" });
    expect(resumed.getter).not.toHaveBeenCalled();
    expect(ownership.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, syncIssue: "unconfirmed" });
    expect(local.get(ownedKey("coachfi-tokens"))).toBe("30");
    expect(local.get(ownedKey("coachfi-learning-rev"))).toBe(MARKER);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("CDP-B15-05: no success echo can clear the pending marker while writes are disabled", async () => {
    fetchMock.mockImplementation(async (_input, init) => response({ version: 1, tokens: init?.method === "PUT" ? 999 : 10 }));
    await start(); const own = ownership.captureCurrentPersonalStorage();
    own.setItem("coachfi-tokens", "40"); sync.persistLearningState("tokens", own); await drain();
    expect(local.get(ownedKey("coachfi-tokens"))).toBe("40");
    expect(local.get(ownedKey("coachfi-learning-rev"))).toBe(MARKER);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("CDP-B15-06: local changes cannot overwrite another remote writer's sibling field", async () => {
    let remote: AccountSnapshot = { version: 1, tokens: 10, learnManual: { "FIXTURE_STAGE": "started" } };
    fetchMock.mockImplementation(async (_input, init) => {
      if (init?.method === "GET") return response(remote);
      remote = JSON.parse(String(init?.body)).state as AccountSnapshot; return response(remote);
    });
    await start(); const own = ownership.captureCurrentPersonalStorage();
    remote = { ...remote, learnManual: { "FIXTURE_STAGE": "completed" } };
    own.setItem("coachfi-tokens", "50"); sync.persistLearningState("tokens", own); await drain();
    expect(remote).toEqual({ version: 1, tokens: 10, learnManual: { "FIXTURE_STAGE": "completed" } });
    expect(local.get(ownedKey("coachfi-tokens"))).toBe("50");
    expect(local.get(ownedKey("coachfi-learning-rev"))).toBe(MARKER);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("CDP-B15-07: existing owned cache is protected before even requesting a token", async () => {
    local.set(ownedKey("coachfi-tokens"), "60"); const getter = vi.fn(async () => "FIXTURE_TOKEN_A");
    expect((await start(getter)).result).toMatchObject({ status: "unavailable", syncIssue: "unconfirmed" });
    expect(ownership.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, syncIssue: "unconfirmed" });
    expect(local.get(ownedKey("coachfi-tokens"))).toBe("60");
    expect(getter).not.toHaveBeenCalled(); expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["coachfi-learning-rev", "1"], ["coachfi-learning-rev", ""], ["coachfi-learning-rev", "{ malformed"],
    ["coachfi-srs", "RAW INVALID SRS"], ["coachfi-learn-manual", "{}"],
    ["coachfi-tokens", "00020"], ["coachfi-streak", " RAW STREAK\n"],
  ])("protects exact legacy/malformed/cache bytes %s=%s without parsing or replay", async (key, raw) => {
    local.set(ownedKey(key), raw); const bytes = new Map(local);
    const resumed = await start();
    expect(resumed.result).toMatchObject({ status: "unavailable", syncIssue: "unconfirmed" });
    expect(new Map(local)).toEqual(bytes);
    expect(fetchMock).not.toHaveBeenCalled(); expect(resumed.getter).not.toHaveBeenCalled();
  });

  it("fresh null remote yields a local read-only view without account create", async () => {
    fetchMock.mockResolvedValueOnce(response(null)); const fresh = await start();
    expect(fresh.result).toMatchObject({ status: "ready", syncIssue: "read-only" });
    expect(ownership.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, syncIssue: "read-only" });
    expect(local.has(ownedKey("coachfi-learning-rev"))).toBe(false);
    expect(fetchMock).toHaveBeenCalledOnce(); expect(fetchMock.mock.calls[0][1]?.method).toBe("GET");
  });

  it("fresh GET409 is unavailable, with no readable-cloud promise, write or acknowledgment", async () => {
    fetchMock.mockResolvedValueOnce(response(null, 409));
    expect((await start()).result).toMatchObject({ status: "unavailable", syncIssue: "unavailable" });
    expect(ownership.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, syncIssue: "unavailable" });
    expect(local.size).toBe(0); expect(fetchMock).toHaveBeenCalledOnce();
  });

  it.each(["no token", "GET503", "not configured"])("fresh %s exposes unavailable rather than claiming a cloud read", async (failure) => {
    const getter = vi.fn(async () => failure === "no token" ? null : "FIXTURE_TOKEN_A");
    if (failure === "GET503") fetchMock.mockResolvedValueOnce(response(null, 503));
    if (failure === "not configured") fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ configured: false }), { status: 200 }));
    const lease = sync.startLearningSession({ id: "FIXTURE_A" }, getter);
    expect(await lease.ready).toMatchObject({ status: "unavailable", syncIssue: "unavailable" });
    expect(ownership.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, syncIssue: "unavailable" });
    expect(local.size).toBe(0); expect(fetchMock).toHaveBeenCalledTimes(failure === "no token" ? 0 : 1);
  });

  it("local cache and marker arriving during GET stop hydration and view-ready callback", async () => {
    const read = deferred<Response>(); fetchMock.mockImplementationOnce(() => read.promise);
    const { bindAccountSession } = await import("@/lib/account-session");
    const onReady = vi.fn(), onUnavailable = vi.fn();
    const lease = bindAccountSession({ id: "FIXTURE_A" }, async () => "FIXTURE_TOKEN_A", { onReady, onUnavailable });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    local.set(ownedKey("coachfi-tokens"), "00099"); local.set(ownedKey("coachfi-learning-rev"), MARKER);
    read.resolve(response({ version: 1, tokens: 10 }));
    expect(await lease.ready).toMatchObject({ status: "unavailable", syncIssue: "unconfirmed" }); await drain();
    expect(local.get(ownedKey("coachfi-tokens"))).toBe("00099");
    expect(local.get(ownedKey("coachfi-learning-rev"))).toBe(MARKER);
    expect(onReady).not.toHaveBeenCalled(); expect(onUnavailable).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("a marker during private hydration stops the next mutation without claiming rollback", async () => {
    fetchMock.mockResolvedValueOnce(response({ version: 1, srs: { fixture: true }, tokens: 10 }));
    afterPhysicalWrite = (key) => {
      if (key === ownedKey("coachfi-srs")) {
        local.set(ownedKey("coachfi-tokens"), "00088"); local.set(ownedKey("coachfi-learning-rev"), MARKER);
      }
    };
    expect((await start()).result).toMatchObject({ status: "unavailable", syncIssue: "unconfirmed" });
    expect(local.get(ownedKey("coachfi-srs"))).toBe('{"fixture":true}');
    expect(local.get(ownedKey("coachfi-tokens"))).toBe("00088");
    expect(local.get(ownedKey("coachfi-learning-rev"))).toBe(MARKER);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("a current public write at ready publication does not emit view-ready success", async () => {
    fetchMock.mockResolvedValueOnce(response({ version: 1, tokens: 10 }));
    const { bindAccountSession } = await import("@/lib/account-session");
    let wrote = false;
    const stop = ownership.subscribeStorageOwnership(() => {
      if (!wrote && ownership.getStorageOwnershipSnapshot().status === "ready") {
        wrote = true; ownership.captureCurrentPersonalStorage().setItem("coachfi-tokens", "70");
      }
    });
    const onReady = vi.fn(), onUnavailable = vi.fn();
    const lease = bindAccountSession({ id: "FIXTURE_A" }, async () => "FIXTURE_TOKEN_A", { onReady, onUnavailable });
    expect((await lease.ready).status).toBe("unavailable"); await drain(); stop();
    expect(local.get(ownedKey("coachfi-tokens"))).toBe("70");
    expect(local.get(ownedKey("coachfi-learning-rev"))).toBe(MARKER);
    expect(onReady).not.toHaveBeenCalled(); expect(onUnavailable).toHaveBeenCalledOnce();
  });

  it("blocked storage resolves unavailable/unconfirmed without token, GET, hydration or writes", async () => {
    local.set(ownedKey("coachfi-tokens"), "00081");
    local.set(ownedKey("coachfi-learning-rev"), "LEGACY_RAW");
    const bytes = new Map(local);
    const writes = vi.spyOn(window.localStorage, "setItem");
    const removes = vi.spyOn(window.localStorage, "removeItem");
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new DOMException("FIXTURE_STORAGE_BLOCKED", "SecurityError");
    });
    const resumed = await start();
    expect(resumed.result).toMatchObject({ status: "unavailable", syncIssue: "unconfirmed" });
    expect(ownership.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, syncIssue: "unconfirmed" });
    expect(local).toEqual(bytes); expect(writes).not.toHaveBeenCalled(); expect(removes).not.toHaveBeenCalled();
    expect(resumed.getter).not.toHaveBeenCalled(); expect(fetchMock).not.toHaveBeenCalled();
  });
});
