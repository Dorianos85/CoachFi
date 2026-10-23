import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const DEADLINE_MS = 30_000;
const PHASES = ["token", "GET", "body"] as const;
type Phase = (typeof PHASES)[number];
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const payload = (id = "A", tokens = 77) => ({ ok: true, configured: true,
  account: { cdpUserId: id }, state: { version: 1, tokens } });
const response = (id = "A", tokens = 77) => new Response(JSON.stringify(payload(id, tokens)), { status: 200 });

describe("CDP initial read has one bounded deadline (synthetic transport)", () => {
  let local: Map<string, string>, session: Map<string, string>, events: string[];
  let storage: typeof import("@/lib/product-storage");
  let sync: typeof import("@/lib/account-sync");
  let request: ReturnType<typeof vi.fn<typeof fetch>>;
  const ownKey = (id: string, key: string) => `coachfi-owned:v1:cdp:${id}:${key}`;

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date", "performance"] });
    local = new Map([["coachfi-user", "SYNTHETIC GUEST"],
      [ownKey("B", "coachfi-tokens"), "42"]]);
    session = new Map(); events = [];
    const target = new EventTarget();
    const store = (map: Map<string, string>) => ({ getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => { map.set(key, value); },
      removeItem: (key: string) => { map.delete(key); } });
    vi.stubGlobal("window", { localStorage: store(local), sessionStorage: store(session),
      dispatchEvent: (event: Event) => { events.push(event.type); return target.dispatchEvent(event); },
      addEventListener: target.addEventListener.bind(target), removeEventListener: target.removeEventListener.bind(target) });
    vi.stubEnv("NEXT_PUBLIC_CDP_PROJECT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", ""); vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    request = vi.fn<typeof fetch>(async () => response()); vi.stubGlobal("fetch", request);
    storage = await import("@/lib/product-storage"); sync = await import("@/lib/account-sync");
  });
  afterEach(async () => {
    await sync.stopLearningSync();
    vi.restoreAllMocks(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs();
  });

  async function stalled(phase: Phase) {
    const token = deferred<string | null>(); const http = deferred<Response>(); const body = deferred<unknown>();
    const reply = response(); const json = vi.spyOn(reply, "json");
    const getter = vi.fn<() => Promise<string | null>>(async () => "SYNTHETIC_TOKEN_A");
    if (phase === "token") getter.mockReturnValue(token.promise);
    if (phase === "GET") request.mockReturnValueOnce(http.promise);
    if (phase === "body") { json.mockReturnValue(body.promise); request.mockResolvedValueOnce(reply); }
    const lease = sync.startLearningSession({ id: "A" }, getter);
    const results: Awaited<typeof lease.ready>[] = [];
    void lease.ready.then(value => { results.push(value); });
    await vi.advanceTimersByTimeAsync(0);
    expect(getter).toHaveBeenCalledOnce();
    expect(request).toHaveBeenCalledTimes(phase === "token" ? 0 : 1);
    if (phase === "body") expect(json).toHaveBeenCalledOnce();
    expect(storage.getStorageOwnershipSnapshot()).toMatchObject({ status: "pending", owner: { userId: "A" } });
    const complete = () => {
      if (phase === "token") token.resolve("SYNTHETIC_LATE_TOKEN_A");
      else if (phase === "GET") http.resolve(reply);
      else body.resolve(payload());
    };
    const fail = () => {
      const error = new Error("SYNTHETIC_LATE_READ_FAILURE");
      if (phase === "token") token.reject(error);
      else if (phase === "GET") http.reject(error);
      else body.reject(error);
    };
    return { lease, results, complete, fail, json };
  }
  function noForeignWrites() {
    expect(local.get("coachfi-user")).toBe("SYNTHETIC GUEST");
    expect(local.get(ownKey("B", "coachfi-tokens"))).toBe("42");
    expect(request.mock.calls.every(([, init]) => init?.method === "GET")).toBe(true);
  }

  it.each(PHASES)("bounded initial %s phase recovers at 30s and ignores its late result", async phase => {
    const { lease, results, complete, json } = await stalled(phase);
    await vi.advanceTimersByTimeAsync(DEADLINE_MS - 1);
    expect(results).toEqual([]); expect(storage.getStorageOwnershipSnapshot().status).toBe("pending");
    await vi.advanceTimersByTimeAsync(1);
    expect(results).toEqual([{ status: "unavailable", userId: "A", generation: lease.generation, syncIssue: "unavailable" }]);
    expect(storage.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true,
      syncIssue: "unavailable", owner: { kind: "account", provider: "cdp", userId: "A" } });
    expect(lease.isCurrent()).toBe(true); expect(vi.getTimerCount()).toBe(0);
    const before = [...local]; const eventCount = events.length;
    complete(); await vi.advanceTimersByTimeAsync(0);
    expect([...local]).toEqual(before); expect(events.length).toBe(eventCount);
    expect(request).toHaveBeenCalledTimes(phase === "token" ? 0 : 1);
    if (phase === "GET") expect(json).not.toHaveBeenCalled();
    noForeignWrites();
  });

  it.each(PHASES)("owner change aborts pending %s immediately without a later timeout touching B", async phase => {
    const { lease: A, results, complete } = await stalled(phase);
    const B = sync.startLearningSession({ id: "B" }, async () => "SYNTHETIC_TOKEN_B");
    await vi.advanceTimersByTimeAsync(0);
    expect(results).toEqual([{ status: "stopped", userId: "A", generation: A.generation }]);
    expect((await B.ready).status).toBe("unavailable"); // Preserve B's existing local bytes.
    const before = storage.getStorageOwnershipSnapshot(); const bytes = [...local]; const count = events.length;
    complete(); await vi.advanceTimersByTimeAsync(DEADLINE_MS);
    expect(storage.getStorageOwnershipSnapshot()).toBe(before); expect([...local]).toEqual(bytes);
    expect(events.length).toBe(count); expect(B.isCurrent()).toBe(true); expect(A.isCurrent()).toBe(false);
    expect(vi.getTimerCount()).toBe(0); noForeignWrites();
  });

  it.each(PHASES)("dispose aborts pending %s immediately and retires its timer", async phase => {
    const { lease, results, complete } = await stalled(phase);
    lease.dispose(); await vi.advanceTimersByTimeAsync(0);
    expect(results).toEqual([{ status: "stopped", userId: "A", generation: lease.generation }]);
    const before = storage.getStorageOwnershipSnapshot(); const bytes = [...local]; const count = events.length;
    expect(before).toMatchObject({ status: "pending", owner: null });
    expect(vi.getTimerCount()).toBe(0);
    complete(); await vi.advanceTimersByTimeAsync(DEADLINE_MS);
    expect(storage.getStorageOwnershipSnapshot()).toBe(before); expect([...local]).toEqual(bytes);
    expect(events.length).toBe(count); noForeignWrites();
  });

  it("timeout preserves data introduced by another local writer while the read was pending", async () => {
    const { lease, results, complete } = await stalled("token");
    // Physical Map mutation represents a second same-owner tab, not an allowed pending UI handle.
    local.set(ownKey("A", "coachfi-tokens"), "23");
    local.set(ownKey("A", "coachfi-learning-rev"), "local-unconfirmed-v1");
    const bytes = [...local];
    await vi.advanceTimersByTimeAsync(DEADLINE_MS);
    expect(results).toEqual([{ status: "unavailable", userId: "A", generation: lease.generation, syncIssue: "unconfirmed" }]);
    expect(storage.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true,
      syncIssue: "unconfirmed", owner: { userId: "A" } });
    complete(); await vi.advanceTimersByTimeAsync(0);
    expect([...local]).toEqual(bytes); expect(request).not.toHaveBeenCalled();
    expect(lease.isCurrent()).toBe(true); expect(vi.getTimerCount()).toBe(0); noForeignWrites();
  });

  it("one total 30s budget spans token, GET and body instead of restarting per phase", async () => {
    const token = deferred<string | null>(), http = deferred<Response>(), body = deferred<unknown>();
    const reply = response(); vi.spyOn(reply, "json").mockReturnValue(body.promise);
    request.mockReturnValueOnce(http.promise);
    const lease = sync.startLearningSession({ id: "A" }, () => token.promise);
    const results: Awaited<typeof lease.ready>[] = []; void lease.ready.then(value => { results.push(value); });
    await vi.advanceTimersByTimeAsync(10_000); token.resolve("SYNTHETIC_TOKEN_A");
    await vi.advanceTimersByTimeAsync(0); expect(request).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(10_000); http.resolve(reply);
    await vi.advanceTimersByTimeAsync(0); expect(reply.json).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(9_999); expect(results).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    expect(results).toEqual([{ status: "unavailable", userId: "A", generation: lease.generation, syncIssue: "unavailable" }]);
    const before = [...local]; body.resolve(payload()); await vi.advanceTimersByTimeAsync(0);
    expect([...local]).toEqual(before); expect(vi.getTimerCount()).toBe(0); noForeignWrites();
  });

  it("a body resolved just before the total deadline is accepted and cancels the timer", async () => {
    const { lease, complete } = await stalled("body");
    await vi.advanceTimersByTimeAsync(DEADLINE_MS - 1); complete();
    await vi.advanceTimersByTimeAsync(0);
    expect((await lease.ready).status).toBe("ready"); expect(vi.getTimerCount()).toBe(0);
    const before = storage.getStorageOwnershipSnapshot(); await vi.advanceTimersByTimeAsync(1);
    expect(storage.getStorageOwnershipSnapshot()).toBe(before);
    expect(storage.captureCurrentPersonalStorage().getItem("coachfi-tokens")).toBe("77"); noForeignWrites();
  });

  it("an already expired body completion cannot win before the delayed timer callback runs", async () => {
    const { lease, results, complete } = await stalled("body");
    // Monotonic observation moves ahead while the timer callback is still queued.
    vi.spyOn(performance, "now").mockReturnValue(performance.now() + DEADLINE_MS);
    complete(); await vi.advanceTimersByTimeAsync(0);
    expect(results).toEqual([{ status: "unavailable", userId: "A", generation: lease.generation, syncIssue: "unavailable" }]);
    expect(storage.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true,
      syncIssue: "unavailable", owner: { userId: "A" } });
    expect(local.has(ownKey("A", "coachfi-tokens"))).toBe(false);
    expect(vi.getTimerCount()).toBe(0); noForeignWrites();
  });

  it("a token failure permits a bounded retry whose late rejection is handled without state drift", async () => {
    const lease = sync.startLearningSession({ id: "A" }, () => { throw new Error("SYNTHETIC_FAILURE"); });
    await vi.advanceTimersByTimeAsync(0);
    expect(await lease.ready).toMatchObject({ status: "unavailable", syncIssue: "unavailable" });
    expect(storage.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, owner: { userId: "A" } });
    expect(lease.isCurrent()).toBe(true); expect(request).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    const { lease: retry, results, fail } = await stalled("token");
    expect(lease.isCurrent()).toBe(false);
    await vi.advanceTimersByTimeAsync(DEADLINE_MS);
    expect(results).toEqual([{ status: "unavailable", userId: "A", generation: retry.generation, syncIssue: "unavailable" }]);
    const before = storage.getStorageOwnershipSnapshot(), bytes = [...local], count = events.length;
    fail(); await vi.advanceTimersByTimeAsync(0);
    expect(storage.getStorageOwnershipSnapshot()).toBe(before); expect([...local]).toEqual(bytes);
    expect(events.length).toBe(count); expect(retry.isCurrent()).toBe(true);
    expect(vi.getTimerCount()).toBe(0); noForeignWrites();
  });
});
