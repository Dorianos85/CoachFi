import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pushEntity, syncOnLogin } from "@/lib/sync/cloudSync";
import { beginStorageOwner } from "@/lib/product-storage";

const local = vi.hoisted(() => ({
  getUser: vi.fn(() => ({ name: "Synthetic local", goal: "education", setupDone: true })),
  saveUser: vi.fn(), getAvatar: vi.fn(() => ({ gender: "neutral", style: "classic" })), saveAvatar: vi.fn(),
  getAllCards: vi.fn(() => []), saveCards: vi.fn(),
}));
vi.mock("@/lib/user", () => ({ getUser: local.getUser, saveUser: local.saveUser }));
vi.mock("@/lib/avatar", () => ({ getAvatar: local.getAvatar, saveAvatar: local.saveAvatar, DEFAULT_AVATAR: { gender: "female", style: "warrior" } }));
vi.mock("@/lib/srs", () => ({ getAllCards: local.getAllCards, saveCards: local.saveCards }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
type QueryResult = { data: unknown; error: { message: string } | null };

describe("independent cloud reconciliation fences", () => {
  let storage: Map<string, string>;
  const setItem = vi.fn<(key: string, value: string) => void>();
  const dispatch = vi.fn<(event: Event) => boolean>();
  beforeEach(() => {
    vi.clearAllMocks();
    storage = new Map([["coachfi-tokens", "321"]]);
    setItem.mockImplementation((key, value) => { storage.set(key, value); });
    const localStorage = { getItem: (key: string) => storage.get(key) ?? null, setItem,
      removeItem: (key: string) => { storage.delete(key); } };
    vi.stubGlobal("localStorage", localStorage);
    vi.stubGlobal("window", { localStorage, sessionStorage: localStorage, dispatchEvent: dispatch });
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No real network allowed."); }));
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  function lease() {
    const abort = new AbortController();
    const owned = beginStorageOwner({ kind: "account", provider: "supabase", userId: "synthetic-A" });
    const guard = { userId: "synthetic-A", signal: abort.signal, storage: owned.storage,
      isCurrent: () => !abort.signal.aborted && owned.isCurrent() };
    dispatch.mockClear(); // Ownership transition is distinct from hydration/success events.
    return { guard, abort, owned };
  }
  function fakeDb(results: Record<string, Promise<QueryResult>>) {
    const writes = vi.fn(async (_payload: unknown) => ({ data: null, error: null }));
    const from = vi.fn((table: string) => {
      const result = results[table] ?? Promise.resolve({ data: null, error: null });
      const query = {
        select: vi.fn(() => query), eq: vi.fn(() => query), is: vi.fn(() => query),
        maybeSingle: vi.fn(() => query), abortSignal: vi.fn(() => query),
        upsert: writes, insert: writes,
        then: result.then.bind(result),
      };
      return query;
    });
    return { db: { from } as unknown as Parameters<typeof syncOnLogin>[0], from, writes };
  }

  it("GET errors are not empty accounts and cannot seed unknown remote state", async () => {
    const failed = Promise.resolve<QueryResult>({ data: null, error: { message: "Synthetic unavailable read" } });
    const state = fakeDb(Object.fromEntries(["profiles", "srs_cards", "stage_progress", "streaks", "reward_balances"].map((table) => [table, failed])));
    const { guard } = lease();
    await syncOnLogin(state.db, "synthetic-A", guard).catch(() => {});
    expect(state.writes).not.toHaveBeenCalled();
    expect(local.saveUser).not.toHaveBeenCalled();
    expect(local.saveCards).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("deferred old reads cannot hydrate or create writes after invalidation", async () => {
    const read = deferred<QueryResult>();
    const state = fakeDb(Object.fromEntries(["profiles", "srs_cards", "stage_progress", "streaks", "reward_balances"].map((table) => [table, read.promise])));
    const { guard, abort } = lease();
    const running = syncOnLogin(state.db, "synthetic-A", guard);
    await Promise.resolve(); abort.abort();
    read.resolve({ data: null, error: null }); await running.catch(() => {});
    expect(state.writes).not.toHaveBeenCalled();
    expect(local.saveCards).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("a mismatched or disposed guard cannot even initialize a query", async () => {
    const state = fakeDb({}); const { guard, abort } = lease();
    await syncOnLogin(state.db, "synthetic-B", guard);
    await pushEntity(state.db, "synthetic-B", "reward", { amount: 5, reason: "synthetic" }, guard);
    abort.abort();
    await syncOnLogin(state.db, "synthetic-A", guard);
    await pushEntity(state.db, "synthetic-A", "profile", undefined, guard);
    expect(state.from).not.toHaveBeenCalled();
    expect(local.getUser).not.toHaveBeenCalled();
  });

  it("health remains hard-off before DB, payload and local-storage access even with a valid lease", async () => {
    const read = vi.fn(() => { throw new Error("Forbidden metadata access"); });
    const db = new Proxy({}, { get: read }) as Parameters<typeof pushEntity>[0];
    const payload = new Proxy({}, { get: read, ownKeys: read });
    const { guard } = lease();
    await pushEntity(db, "synthetic-A", "healthCheck", payload, guard);
    expect(read).not.toHaveBeenCalled(); expect(setItem).not.toHaveBeenCalled();
  });

  it("empty cloud hydration never uploads guest device data and preserves local health/consent", async () => {
    storage.set("coachfi-health-check", "synthetic local health record");
    storage.set("coachfi-consent-v1", "synthetic local consent record");
    storage.set("coachfi-streak", JSON.stringify({ currentStreak: 99, longestStreak: 99, lastActiveDate: "2026-10-14" }));
    storage.set("coachfi-learn-manual", JSON.stringify({ "guest-stage": "completed" }));
    const none = Promise.resolve<QueryResult>({ data: null, error: null });
    const rows = Promise.resolve<QueryResult>({ data: [], error: null });
    const state = fakeDb({ profiles: none, srs_cards: rows, stage_progress: rows, streaks: none, reward_balances: none });
    const { guard } = lease();
    const result = await syncOnLogin(state.db, "synthetic-A", guard);
    expect(result).toBe(true);
    expect(state.writes).not.toHaveBeenCalled();
    expect(storage.get("coachfi-health-check")).toBe("synthetic local health record");
    expect(storage.get("coachfi-consent-v1")).toBe("synthetic local consent record");
    expect(JSON.parse(guard.storage.getItem("coachfi-srs")!)).toEqual([]);
    expect(JSON.parse(guard.storage.getItem("coachfi-learn-manual")!)).toEqual({});
    expect(guard.storage.getItem("coachfi-tokens")).toBe("0");
    expect(storage.get("coachfi-tokens")).toBe("321");
  });

});
