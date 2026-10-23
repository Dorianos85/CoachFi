import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { ReactElement } from "react";

const ui = vi.hoisted(() => ({ locale: "pl", snapshot: null as import("@/lib/product-storage").StorageOwnershipSnapshot | null }));
vi.mock("@/context/LanguageContext", () => ({ useLanguage: () => ({ locale: ui.locale }) }));
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ snapshot: ui.snapshot }) }));
function renderedText(node: unknown): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(renderedText).join("");
  if (node && typeof node === "object" && "props" in node) return renderedText((node as ReactElement<{ children?: unknown }>).props.children);
  return "";
}

type QueryResult = { data: unknown; error: { message: string } | null };
interface FixtureQuery {
  select(): FixtureQuery; eq(): FixtureQuery; is(): FixtureQuery; abortSignal(): FixtureQuery;
  maybeSingle(): FixtureQuery; upsert(): FixtureQuery;
  then(done: (value: QueryResult) => unknown, fail?: (reason: unknown) => unknown): Promise<unknown>;
}

// Historical baseline risk reproductions remain in review-baseline*.json.
// Acceptance covers preservation and hard-off, not implemented CAS/replay.
describe("independent B15 read-only cold resume and integrity acceptance", () => {
  let bytes: Map<string, string>, request: Mock<typeof fetch>;
  let cleanup: (() => void) | undefined;
  let beforeWrite: ((key: string) => void) | undefined, afterMutation: ((key: string) => void) | undefined;
  beforeEach(() => {
    vi.resetModules(); bytes = new Map(); cleanup = beforeWrite = afterMutation = undefined;
    const storage = { getItem: (key: string) => bytes.get(key) ?? null,
      setItem: (key: string, value: string) => { beforeWrite?.(key); bytes.set(key, value); afterMutation?.(key); },
      removeItem: (key: string) => { bytes.delete(key); afterMutation?.(key); } };
    vi.stubGlobal("window", { localStorage: storage, sessionStorage: storage, dispatchEvent: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn() });
    request = vi.fn<typeof fetch>(() => { throw new Error("No unstubbed network allowed."); }); vi.stubGlobal("fetch", request);
  });
  afterEach(() => { cleanup?.(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
  function response(tokens: number) {
    return new Response(JSON.stringify({ ok: true, account: { cdpUserId: "FIXTURE_A" }, state: { version: 1, tokens } }), { status: 200 });
  }
  async function microtasks() { for (let i = 0; i < 12; i++) await Promise.resolve(); }

  it("cold CDP resume preserves unconfirmed own progress without starting token or transport", async () => {
    request.mockResolvedValueOnce(response(10));
    const sync = await import("@/lib/account-sync"), store = await import("@/lib/product-storage");
    const a = sync.startLearningSession({ id: "FIXTURE_A" }, async () => "FIXTURE_TOKEN_A"); cleanup = () => a.dispose(); await a.ready;
    const current = store.captureCurrentPersonalStorage(); current.setItem("coachfi-tokens", "99"); sync.persistLearningState("tokens", current);
    await microtasks();
    expect(request).toHaveBeenCalledOnce();
    expect(current.getItem("coachfi-tokens")).toBe("99"); expect(current.getItem("coachfi-learning-rev")).toBe("local-unconfirmed-v1");
    const originalBytes = new Map(bytes);
    a.dispose(); cleanup = undefined; vi.resetModules(); // Same physical strings; RAM/session queue is lost.
    const coldSync = await import("@/lib/account-sync"), coldStore = await import("@/lib/product-storage");
    const getter = vi.fn(async () => "FIXTURE_TOKEN_A");
    const coldA = coldSync.startLearningSession({ id: "FIXTURE_A" }, getter); cleanup = () => coldA.dispose();
    expect(await coldA.ready).toMatchObject({ status: "unavailable", syncIssue: "unconfirmed" });
    expect(coldStore.captureCurrentPersonalStorage().getItem("coachfi-tokens")).toBe("99");
    expect(bytes).toEqual(originalBytes); expect(getter).not.toHaveBeenCalled(); expect(request).toHaveBeenCalledOnce();
    expect(coldStore.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, syncIssue: "unconfirmed" });
    expect(request.mock.calls.some(([, init]) => init?.method === "PUT")).toBe(false);
  });

  it("local progress cannot overwrite a newer remote value while automatic GET/PUT/replay is disabled", async () => {
    request.mockResolvedValueOnce(response(10));
    const sync = await import("@/lib/account-sync"), store = await import("@/lib/product-storage");
    const a = sync.startLearningSession({ id: "FIXTURE_A" }, async () => "FIXTURE_TOKEN_A"); cleanup = () => a.dispose(); await a.ready;
    const current = store.captureCurrentPersonalStorage(); current.setItem("coachfi-tokens", "11"); sync.persistLearningState("tokens", current);
    request.mockResolvedValue(response(50)); // A modeled remote change must not be overwritten or even re-read automatically.
    await microtasks();
    expect(request).toHaveBeenCalledOnce(); expect(request.mock.calls[0][1]?.method).toBe("GET");
    expect(current.getItem("coachfi-learning-rev")).toBe("local-unconfirmed-v1");
    expect(current.getItem("coachfi-tokens")).toBe("11");
    expect(store.getStorageOwnershipSnapshot()).toMatchObject({ localOnly: true, syncIssue: "unconfirmed" });
  });

  function cloudDb() {
    const from = vi.fn((table: string) => {
      const data = table === "profiles" ? { name: "FIXTURE_CLOUD_OLD", goal: "education", onboarding_done: true }
        : ["srs_cards", "stage_progress"].includes(table) ? [] : table === "reward_balances" ? { balance: 10 } : null;
      let write = false;
      const query: FixtureQuery = { select: () => query, eq: () => query, is: () => query, abortSignal: () => query, maybeSingle: () => query,
        upsert: () => { write = true; return query; },
        then: (done, fail) =>
          Promise.resolve<QueryResult>({ data: write ? null : data, error: write ? { message: "FIXTURE_OFFLINE_WRITE" } : null }).then(done, fail) };
      return query;
    });
    return { from };
  }
  it("cold Supabase controller retains own edited profile and direct push cannot start database work", async () => {
    const cloud = await import("@/lib/sync/cloudSync"), store = await import("@/lib/product-storage");
    const queries = cloudDb(), db = queries as unknown as Parameters<typeof cloud.syncOnLogin>[0];
    const owned = store.beginStorageOwner({ kind: "account", provider: "supabase", userId: "FIXTURE_A" });
    const abort = new AbortController();
    const guard = { userId: "FIXTURE_A", signal: abort.signal, storage: owned.storage, isCurrent: () => owned.isCurrent() };
    expect(await cloud.syncOnLogin(db, "FIXTURE_A", guard)).toBe(true); owned.publishReady({ localOnly: true, syncIssue: "read-only" });
    const user = await import("@/lib/user"); user.saveUser({ name: "FIXTURE_OWN_NEW", goal: "own edited goal", setupDone: true }, store.captureCurrentPersonalStorage());
    await cloud.pushEntity(db, "FIXTURE_A", "profile", undefined, guard);
    expect(queries.from).toHaveBeenCalledTimes(5); const originalBytes = new Map(bytes);
    expect(user.getUser().name).toBe("FIXTURE_OWN_NEW"); owned.release(); vi.resetModules();
    const coldCloud = await import("@/lib/sync/cloudSync"), coldStore = await import("@/lib/product-storage");
    const { createSessionSyncController } = await import("@/lib/sync/session-sync");
    const hydrate = vi.fn((session: Parameters<typeof coldCloud.syncOnLogin>[2]) => coldCloud.syncOnLogin(db, "FIXTURE_A", session));
    const register = vi.fn(), success = vi.fn(), push = vi.fn(async () => {});
    const controller = createSessionSyncController({ sync: hydrate, push, registerPusher: register, onSynced: success }); cleanup = () => controller.dispose();
    controller.start("FIXTURE_A");
    const coldUser = await import("@/lib/user"); expect(coldUser.getUser().name).toBe("FIXTURE_OWN_NEW");
    expect(hydrate).not.toHaveBeenCalled(); expect(queries.from).toHaveBeenCalledTimes(5); expect(bytes).toEqual(originalBytes);
    expect(coldStore.getStorageOwnershipSnapshot()).toMatchObject({ localOnly: true, syncIssue: "unconfirmed" });
    expect(success).not.toHaveBeenCalled(); expect(push).not.toHaveBeenCalled(); expect(register.mock.calls.every(([pusher]) => pusher === null)).toBe(true);
    expect(request).not.toHaveBeenCalled();
  });

  it.each(["set", "remove"])("marker quota prevents primary %s and cannot report success", async (operation) => {
    const store = await import("@/lib/product-storage"), a = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A" });
    a.storage.setItem("coachfi-tokens", "0077"); a.publishReady({ localOnly: true, syncIssue: "read-only" });
    const view = store.captureCurrentPersonalStorage(), originalBytes = new Map(bytes), success = vi.fn();
    beforeWrite = (key) => { if (key.endsWith(":coachfi-learning-rev")) throw new DOMException("Synthetic marker quota", "QuotaExceededError"); };
    expect(() => { const ok = operation === "set" ? view.setItem("coachfi-tokens", "88") : view.removeItem("coachfi-tokens"); if (ok) success(); }).toThrow("marker quota");
    expect(bytes).toEqual(originalBytes); expect(success).not.toHaveBeenCalled(); expect(request).not.toHaveBeenCalled();
  });

  it("retained private ready handles mark set and silent remove; cold marker prevents restoring deleted values", async () => {
    const store = await import("@/lib/product-storage"), a = store.beginStorageOwner({ kind: "account", provider: "supabase", userId: "FIXTURE_A" });
    a.storage.setItem("coachfi-user", "FIXTURE_INITIAL"); a.publishReady({ localOnly: true, syncIssue: "read-only" });
    const epoch = store.getStorageOwnershipSnapshot().revision;
    expect(a.storage.setItem("coachfi-user", "FIXTURE_EDIT")).toBe(true);
    expect(a.storage.getItem("coachfi-learning-rev")).toBe("local-unconfirmed-v1");
    expect(store.getStorageOwnershipSnapshot()).toMatchObject({ revision: epoch, status: "ready", syncIssue: "unconfirmed" });
    expect(a.storage.removeItem("coachfi-user")).toBe(true); expect(a.storage.getItem("coachfi-user")).toBeNull();
    expect(a.storage.getItem("coachfi-learning-rev")).toBe("local-unconfirmed-v1"); a.release(); vi.resetModules();
    const coldStore = await import("@/lib/product-storage"), cloud = await import("@/lib/sync/cloudSync");
    const cold = coldStore.beginStorageOwner({ kind: "account", provider: "supabase", userId: "FIXTURE_A" }), queries = cloudDb();
    expect(await cloud.syncOnLogin(queries as unknown as Parameters<typeof cloud.syncOnLogin>[0], "FIXTURE_A", {
      userId: "FIXTURE_A", signal: new AbortController().signal, storage: cold.storage, isCurrent: () => cold.isCurrent(),
    })).toBe(false); expect(queries.from).not.toHaveBeenCalled();
  });

  it("reentry at write-ahead marker preserves old primary bytes and never redirects to B", async () => {
    const store = await import("@/lib/product-storage"), a = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A" });
    a.storage.setItem("coachfi-tokens", "0017"); a.publishReady(); const view = store.captureCurrentPersonalStorage();
    afterMutation = (key) => { if (!key.endsWith(":coachfi-learning-rev")) return; afterMutation = undefined;
      store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B" }).publishReady({ localOnly: true }); };
    expect(view.setItem("coachfi-tokens", "88")).toBe(false);
    expect(bytes.get("coachfi-owned:v1:cdp:FIXTURE_A:coachfi-tokens")).toBe("0017");
    expect(bytes.get("coachfi-owned:v1:cdp:FIXTURE_A:coachfi-learning-rev")).toBe("local-unconfirmed-v1");
    expect(store.captureCurrentPersonalStorage().getItem("coachfi-tokens")).toBeNull(); expect(request).not.toHaveBeenCalled();
  });

  it("value quota retains a conservative marker and cold resume never hydrates it away", async () => {
    const store = await import("@/lib/product-storage"), a = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A" }); a.publishReady();
    beforeWrite = (key) => { if (key.endsWith(":coachfi-tokens")) throw new DOMException("Synthetic value quota", "QuotaExceededError"); };
    expect(() => store.captureCurrentPersonalStorage().setItem("coachfi-tokens", "99")).toThrow("value quota");
    expect(bytes.get("coachfi-owned:v1:cdp:FIXTURE_A:coachfi-learning-rev")).toBe("local-unconfirmed-v1");
    beforeWrite = undefined; a.release(); vi.resetModules(); const sync = await import("@/lib/account-sync"), getter = vi.fn(async () => "FIXTURE_TOKEN_A");
    const cold = sync.startLearningSession({ id: "FIXTURE_A" }, getter); cleanup = () => cold.dispose();
    expect(await cold.ready).toMatchObject({ status: "unavailable", syncIssue: "unconfirmed" }); expect(getter).not.toHaveBeenCalled(); expect(request).not.toHaveBeenCalled();
  });

  it("independent RAM scopes sharing synthetic bytes fence an edit while GET is pending", async () => {
    let resolve!: (value: Response) => void; request.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    const sync = await import("@/lib/account-sync"), storeA = await import("@/lib/product-storage");
    const a = sync.startLearningSession({ id: "FIXTURE_A" }, async () => "FIXTURE_TOKEN_A"); cleanup = () => a.dispose();
    await vi.waitFor(() => expect(request).toHaveBeenCalledOnce()); vi.resetModules(); const storeB = await import("@/lib/product-storage");
    storeB.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A" }).publishReady({ localOnly: true });
    storeB.captureCurrentPersonalStorage().setItem("coachfi-tokens", "0099"); const originalBytes = new Map(bytes);
    resolve(response(10)); expect(await a.ready).toMatchObject({ status: "unavailable", syncIssue: "unconfirmed" });
    expect(bytes).toEqual(originalBytes); expect(storeA.captureCurrentPersonalStorage().getItem("coachfi-tokens")).toBe("0099"); expect(request).toHaveBeenCalledOnce();
  });

  it("a same-owner write during first private hydration mutation blocks subsequent remote values", async () => {
    const storeOther = await import("@/lib/product-storage");
    storeOther.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A" }).publishReady({ localOnly: true });
    const otherView = storeOther.captureCurrentPersonalStorage(); vi.resetModules();
    const sync = await import("@/lib/account-sync"); request.mockResolvedValueOnce(response(10));
    afterMutation = (key) => { if (!key.endsWith(":coachfi-srs")) return; afterMutation = undefined; otherView.setItem("coachfi-tokens", "0099"); };
    const a = sync.startLearningSession({ id: "FIXTURE_A" }, async () => "FIXTURE_TOKEN_A"); cleanup = () => a.dispose();
    expect(await a.ready).toMatchObject({ status: "unavailable", syncIssue: "unconfirmed" });
    expect(bytes.get("coachfi-owned:v1:cdp:FIXTURE_A:coachfi-tokens")).toBe("0099"); expect(request).toHaveBeenCalledOnce();
  });

  it("fresh cloud reads expose read-only view without upload callback, pusher or payload access", async () => {
    const cloud = await import("@/lib/sync/cloudSync"), { createSessionSyncController } = await import("@/lib/sync/session-sync"), store = await import("@/lib/product-storage");
    const queries = cloudDb(), db = queries as unknown as Parameters<typeof cloud.syncOnLogin>[0];
    const register = vi.fn(), success = vi.fn(), push = vi.fn(async () => {});
    const controller = createSessionSyncController({ sync: (session) => cloud.syncOnLogin(db, session.userId, session), push, registerPusher: register, onSynced: success }); cleanup = () => controller.dispose();
    controller.start("FIXTURE_A"); await vi.waitFor(() => expect(store.getStorageOwnershipSnapshot().status).toBe("ready"));
    expect(queries.from).toHaveBeenCalledTimes(5); expect(store.getStorageOwnershipSnapshot()).toMatchObject({ localOnly: true, syncIssue: "read-only" });
    const poison = new Proxy({}, { get: () => { throw new Error("Forbidden payload access"); } });
    await cloud.pushEntity(db, "FIXTURE_A", "profile", poison, controller.getCurrent() ?? undefined);
    const queue = await import("@/lib/sync/syncQueue"); const queuePusher = vi.fn(); queue.registerCloudPusher(queuePusher); queue.notifyCloud("reward", poison);
    expect(queries.from).toHaveBeenCalledTimes(5); expect(push).not.toHaveBeenCalled(); expect(queuePusher).not.toHaveBeenCalled(); expect(success).not.toHaveBeenCalled();
    expect(register.mock.calls.every(([pusher]) => pusher === null)).toBe(true); expect(request).not.toHaveBeenCalled();
  });

  it.each(["get-error", "no-token", "unconfigured"])("empty CDP %s exposes unavailable, never the claim that account data was read", async (failure) => {
    if (failure !== "no-token") request.mockResolvedValueOnce(new Response(JSON.stringify({ ok: false,
      ...(failure === "unconfigured" ? { configured: false } : {}) }), { status: failure === "get-error" ? 503 : 200 }));
    const sync = await import("@/lib/account-sync"), store = await import("@/lib/product-storage");
    const a = sync.startLearningSession({ id: "FIXTURE_A" }, async () => failure === "no-token" ? null : "FIXTURE_TOKEN_A"); cleanup = () => a.dispose();
    expect(await a.ready).toMatchObject({ status: "unavailable", syncIssue: "unavailable" });
    expect(store.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, syncIssue: "unavailable" });
    ui.snapshot = store.getStorageOwnershipSnapshot();
    const { ProductScopeBoundary } = await import("@/components/ProductScopeBoundary");
    for (const locale of ["pl", "en"]) {
      ui.locale = locale;
      expect(renderedText(ProductScopeBoundary({ children: null }))).toBe(locale === "pl"
        ? "Dane tego konta są dostępne lokalnie. Synchronizacja jest obecnie niedostępna."
        : "This account's data is available locally. Sync is currently unavailable.");
    }
    expect(bytes.size).toBe(0); expect(request).toHaveBeenCalledTimes(failure === "no-token" ? 0 : 1);
    expect(request.mock.calls.every(([, init]) => init?.method === "GET")).toBe(true);
  });
});
