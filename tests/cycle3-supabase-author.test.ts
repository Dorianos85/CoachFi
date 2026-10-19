import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { AuthProvider } from "@/context/AuthContext";
import { DEFAULT_AVATAR } from "@/lib/avatar";
import { saveUser } from "@/lib/user";
import { createConsentRecord } from "@/lib/consent";
import { pushEntity, syncOnLogin } from "@/lib/sync/cloudSync";
import { createSessionSyncController, type SyncSession } from "@/lib/sync/session-sync";
import * as queue from "@/lib/sync/syncQueue";
import type { SyncEntity } from "@/lib/sync/syncQueue";
import { beginStorageOwner, captureCurrentPersonalStorage, getStorageOwnershipSnapshot, STORAGE_OWNER_CHANGED_EVENT, type PersonalStorageHandle } from "@/lib/product-storage";

type AuthCallback = (event: string, session: unknown) => void;
const hooks = vi.hoisted(() => ({
  effects: [] as Array<() => void | (() => void)>, callbacks: [] as AuthCallback[],
  stateSet: vi.fn(), factory: vi.fn(), configured: vi.fn(() => true),
  subscribe: vi.fn(), unsubscribe: vi.fn(), signOut: vi.fn<() => Promise<void>>(),
  persistLearning: vi.fn(),
}));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useEffect: (effect: () => void | (() => void)) => { hooks.effects.push(effect); },
  useRef: (current: unknown) => ({ current }),
  useState: (initial: unknown) => [initial, hooks.stateSet],
  useCallback: (callback: unknown) => callback,
}));
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: hooks.factory, isSupabaseConfigured: hooks.configured,
}));
// Hydration must not enter the other auth owner's persistence boundary.
vi.mock("@/lib/account-sync", () => ({ persistLearningState: hooks.persistLearning }));

type Result = { data: unknown; error: unknown };
interface FakeQuery extends PromiseLike<Result> {
  select(...args: unknown[]): FakeQuery;
  eq(...args: unknown[]): FakeQuery;
  is(...args: unknown[]): FakeQuery;
  maybeSingle(): PromiseLike<Result>;
  upsert(payload: unknown): FakeQuery;
  insert(payload: unknown): FakeQuery;
  abortSignal(signal: AbortSignal): FakeQuery;
}
type Pusher = (entity: SyncEntity, payload?: unknown) => void;
const USER_A = "synthetic-supabase-A";
const USER_B = "synthetic-supabase-B";
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
function result(data: unknown = null, error: unknown = null): Promise<Result> {
  return Promise.resolve({ data, error });
}
function lease(userId = USER_A) {
  const abort = new AbortController();
  const owner = beginStorageOwner({ kind: "account", provider: "supabase", userId });
  // Initial cloud hydration owns a pending private handle; ready handles are
  // public local edits and intentionally create a write-ahead marker in B15.
  privateReadStorage = owner.storage;
  cleanups.push(owner.release); dispatch.mockClear();
  const guard: SyncSession = { userId, signal: abort.signal, storage: owner.storage, isCurrent: () => !abort.signal.aborted && owner.isCurrent() };
  return { guard, abort };
}
function fakeDatabase(overrides: Record<string, Promise<Result>> = {}) {
  const reads = { profiles: result(), srs_cards: result([]), stage_progress: result([]),
    streaks: result(), reward_balances: result(), ...overrides } as Record<string, Promise<Result>>;
  const writes: Array<{ table: string; operation: string; payload: unknown }> = [];
  const signals: AbortSignal[] = [];
  const from = vi.fn((table: string) => {
    let completion = reads[table] ?? result();
    const write = (operation: string, payload: unknown): FakeQuery => {
      writes.push({ table, operation, payload }); completion = result(); return query;
    };
    const query: FakeQuery = {
      select: vi.fn(() => query), eq: vi.fn(() => query), is: vi.fn(() => query),
      // A terminal result intentionally exposes no transform methods.
      maybeSingle: vi.fn(() => completion),
      upsert: vi.fn((payload: unknown) => write("upsert", payload)),
      insert: vi.fn((payload: unknown) => write("insert", payload)),
      abortSignal: vi.fn((signal: AbortSignal) => { signals.push(signal); return query; }),
      then: (fulfilled, rejected) => completion.then(fulfilled, rejected),
    };
    return query;
  });
  return { db: { from } as unknown as Parameters<typeof syncOnLogin>[0], from, writes, signals };
}

let storage: Map<string, string>;
let setItem: ReturnType<typeof vi.fn<(key: string, value: string) => void>>;
let events: EventTarget;
let dispatch: ReturnType<typeof vi.fn<(event: Event) => boolean>>;
let cleanups: Array<() => void>;
let privateReadStorage: PersonalStorageHandle | null;
beforeEach(() => {
  vi.clearAllMocks(); vi.useFakeTimers(); hooks.effects.length = 0; hooks.callbacks.length = 0;
  cleanups = []; privateReadStorage = null; storage = new Map(); events = new EventTarget();
  setItem = vi.fn((key: string, value: string) => { storage.set(key, value); });
  const localStorage = { getItem: (key: string) => storage.get(key) ?? null, setItem,
    removeItem: (key: string) => { storage.delete(key); } };
  dispatch = vi.fn((event: Event) => events.dispatchEvent(event));
  vi.stubGlobal("localStorage", localStorage);
  vi.stubGlobal("window", { localStorage, dispatchEvent: dispatch, location: { origin: "http://localhost" } });
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Real network is forbidden in synthetic author tests"); }));
  beginStorageOwner({ kind: "guest" }).publishReady({ localOnly: true }); dispatch.mockClear();
  queue.registerCloudPusher(null);
  hooks.signOut.mockResolvedValue(undefined);
  hooks.subscribe.mockImplementation((callback: AuthCallback) => {
    hooks.callbacks.push(callback); return { data: { subscription: { unsubscribe: hooks.unsubscribe } } };
  });
});
const owned = (key: string) => (privateReadStorage?.isCurrent() ? privateReadStorage : captureCurrentPersonalStorage()).getItem(key);
const dataEvents = () => dispatch.mock.calls.map(([event]) => event.type).filter((type) => type !== STORAGE_OWNER_CHANGED_EVENT);
afterEach(() => {
  for (const cleanup of cleanups) cleanup();
  queue.registerCloudPusher(null); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks();
});
function mount(db: Parameters<typeof syncOnLogin>[0], enabled = true) {
  hooks.factory.mockReturnValue({ ...db, auth: { onAuthStateChange: hooks.subscribe, signOut: hooks.signOut } });
  const element = AuthProvider({ children: null, enabled }) as ReactElement<{ value: {
    configured: boolean; loading: boolean; session: unknown; user: unknown; signOut(): Promise<void>;
  } }>;
  const cleanup = hooks.effects.shift()?.();
  if (cleanup) cleanups.push(cleanup);
  return { value: element.props.value, callback: hooks.callbacks.at(-1), cleanup };
}
function controller(sync: (guard: SyncSession) => Promise<boolean> = async () => true) {
  let pusher: Pusher | null = null;
  const push = vi.fn(async (_guard: SyncSession, _entity: SyncEntity, _payload?: unknown) => {});
  const onSynced = vi.fn();
  const instance = createSessionSyncController({ sync, push, registerPusher: (next) => { pusher = next; }, onSynced });
  cleanups.push(instance.dispose);
  return { instance, push, onSynced, pusher: () => pusher };
}

describe("Supabase author: session controller", () => {
  it("defers sync beyond the auth callback and cancels work before its timer starts", async () => {
    const hydrate = vi.fn(async () => true);
    const state = controller(hydrate); const guard = state.instance.start(USER_A);
    expect(hydrate).not.toHaveBeenCalled(); state.instance.invalidate();
    await vi.runAllTimersAsync();
    expect(guard?.signal.aborted).toBe(true); expect(hydrate).not.toHaveBeenCalled();
    expect(state.pusher()).toBeNull(); expect(state.onSynced).not.toHaveBeenCalled();
  });

  it.each(["switch", "logout", "unmount"])("%s clears pending debounce and makes captured reward callbacks inert", async (action) => {
    const state = controller(); state.instance.start(USER_A); await vi.advanceTimersByTimeAsync(0);
    const old = state.pusher(); old?.("profile");
    if (action === "switch") state.instance.start(USER_B);
    else if (action === "logout") state.instance.start(null);
    else state.instance.dispose();
    old?.("reward", { amount: 50, reason: "synthetic late callback" });
    await vi.runAllTimersAsync(); expect(state.push).not.toHaveBeenCalled();
  });

  it("A → logout → A never revives the old lease or old read result", async () => {
    const oldRead = deferred<boolean>(); let first = true;
    const state = controller(async () => { if (first) { first = false; return oldRead.promise; } return true; });
    const old = state.instance.start(USER_A); await vi.advanceTimersByTimeAsync(0);
    state.instance.start(null); const fresh = state.instance.start(USER_A); await vi.advanceTimersByTimeAsync(0);
    oldRead.resolve(true); await Promise.resolve(); await Promise.resolve();
    expect(old?.signal.aborted).toBe(true); expect(fresh).not.toBe(old); expect(fresh?.isCurrent()).toBe(true);
    expect(state.onSynced).not.toHaveBeenCalled();
    expect(getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, syncIssue: "read-only" });
  });

  it.each([false, "throw"])("failed hydration %s aborts the current lease and never reports success", async (failure) => {
    const state = controller(async () => { if (failure === "throw") throw new Error("Synthetic failure"); return false; });
    const guard = state.instance.start(USER_A); await vi.runAllTimersAsync();
    expect(guard?.signal.aborted).toBe(true); expect(state.instance.getCurrent()).toBe(guard);
    expect(getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, owner: { userId: USER_A } });
    expect(state.pusher()).toBeNull(); expect(state.onSynced).not.toHaveBeenCalled();
  });

  it("fresh controller installs neither reward nor ordinary-change pusher when writes are disabled", async () => {
    const state = controller(); state.instance.start(USER_A); await vi.advanceTimersByTimeAsync(0);
    const current = state.pusher(); current?.("reward", { amount: 1 }); current?.("reward", { amount: 2 });
    current?.("profile", "first"); current?.("profile", "latest"); current?.("healthCheck", "never upload");
    await vi.advanceTimersByTimeAsync(800);
    expect(current).toBeNull(); expect(state.push).not.toHaveBeenCalled(); expect(state.onSynced).not.toHaveBeenCalled();
  });
});

describe("Supabase author: guarded cloud-only hydration", () => {
  it("missing, mismatched and aborted guards cannot initialize queries or inspect local state", async () => {
    const state = fakeDatabase(); const { guard, abort } = lease();
    expect(await syncOnLogin(state.db, USER_A)).toBe(false);
    expect(await syncOnLogin(state.db, USER_B, guard)).toBe(false);
    await pushEntity(state.db, USER_B, "profile", undefined, guard); abort.abort();
    expect(await syncOnLogin(state.db, USER_A, guard)).toBe(false);
    await pushEntity(state.db, USER_A, "reward", { amount: 5 }, guard);
    expect(state.from).not.toHaveBeenCalled(); expect(setItem).not.toHaveBeenCalled();
  });

  it("health hard-off precedes database, payload and guard getters", async () => {
    const forbidden = vi.fn(() => { throw new Error("Forbidden property access"); });
    const db = new Proxy({}, { get: forbidden }) as Parameters<typeof pushEntity>[0];
    const payload = new Proxy({}, { get: forbidden, ownKeys: forbidden });
    const guard = new Proxy({}, { get: forbidden }) as SyncSession;
    await pushEntity(db, USER_A, "healthCheck", payload, guard); expect(forbidden).not.toHaveBeenCalled();
  });

  it("late ignored-abort reads never hydrate, emit or seed a previous identity", async () => {
    const read = deferred<Result>();
    const state = fakeDatabase(Object.fromEntries(["profiles", "srs_cards", "stage_progress", "streaks", "reward_balances"]
      .map((table) => [table, read.promise])));
    const { guard, abort } = lease(); const running = syncOnLogin(state.db, USER_A, guard);
    expect(state.signals).toHaveLength(5); expect(state.signals.every((signal) => signal === guard.signal)).toBe(true);
    abort.abort(); read.resolve({ data: null, error: null }); expect(await running).toBe(false);
    expect(setItem).not.toHaveBeenCalled(); expect(dataEvents()).toEqual([]); expect(state.writes).toEqual([]);
  });

  it("the last failed query after four successful reads produces no partial hydration or empty-account seed", async () => {
    const last = deferred<Result>(); const state = fakeDatabase({ reward_balances: last.promise,
      profiles: result({ name: "Synthetic cloud", onboarding_done: true }) });
    const { guard } = lease(); const running = syncOnLogin(state.db, USER_A, guard);
    const failed = expect(running).rejects.toThrow("Cloud sync unavailable");
    await Promise.resolve(); expect(setItem).not.toHaveBeenCalled();
    last.resolve({ data: null, error: { message: "Synthetic GET unavailable" } }); await failed;
    expect(setItem).not.toHaveBeenCalled(); expect(dataEvents()).toEqual([]); expect(state.writes).toEqual([]);
  });

  it("an early read failure aborts outstanding queries through the controller and their late data stays inert", async () => {
    const late = deferred<Result>();
    const state = fakeDatabase({ profiles: result(null, { message: "Synthetic profile failure" }), reward_balances: late.promise });
    const session = controller((guard) => syncOnLogin(state.db, guard.userId, guard));
    const guard = session.instance.start(USER_A); await vi.advanceTimersByTimeAsync(0);
    expect(guard?.signal.aborted).toBe(true); expect(session.pusher()).toBeNull();
    late.resolve({ data: { balance: 90 }, error: null }); await Promise.resolve(); await Promise.resolve();
    expect(setItem).not.toHaveBeenCalled(); expect(session.onSynced).not.toHaveBeenCalled(); expect(state.writes).toEqual([]);
  });

  it("fresh empty owned namespace reads defaults without changing guest bytes or uploading", async () => {
    storage.set("coachfi-user", JSON.stringify({ name: "Synthetic guest", goal: "guest goal", setupDone: true }));
    storage.set("coachfi-srs", JSON.stringify([{ id: "guest" }]));
    storage.set("coachfi-learn-manual", JSON.stringify({ guest: "completed" }));
    storage.set("coachfi-streak", JSON.stringify({ currentStreak: 100 }));
    storage.set("coachfi-tokens", "999"); storage.set("coachfi-health-check", "synthetic diagnosis");
    storage.set("coachfi-consent-v1", "synthetic consent"); storage.set("coachfi-mode-v1", "synthetic mode");
    const state = fakeDatabase(); const { guard } = lease();
    expect(await syncOnLogin(state.db, USER_A, guard)).toBe(true);
    expect(JSON.parse(owned("coachfi-user")!)).toEqual({ name: "", goal: "", setupDone: false });
    expect(JSON.parse(owned("coachfi-avatar")!)).toEqual(DEFAULT_AVATAR);
    expect(JSON.parse(owned("coachfi-srs")!)).toEqual([]);
    expect(JSON.parse(owned("coachfi-learn-manual")!)).toEqual({});
    expect(JSON.parse(owned("coachfi-streak")!)).toEqual({ lastActiveDate: "", currentStreak: 0, longestStreak: 0 });
    expect(owned("coachfi-tokens")).toBe("0"); expect(owned("coachfi-voice")).toBe("");
    expect(storage.get("coachfi-health-check")).toBe("synthetic diagnosis");
    expect(storage.get("coachfi-consent-v1")).toBe("synthetic consent"); expect(storage.get("coachfi-mode-v1")).toBe("synthetic mode");
    expect(state.writes).toEqual([]); expect(hooks.persistLearning).not.toHaveBeenCalled();
  });

  it("learning listeners see all authoritative cards, stages and streak values without guest merging", async () => {
    storage.set("coachfi-learn-manual", JSON.stringify({ guest: "completed" }));
    const state = fakeDatabase({ profiles: result({ name: "Synthetic account", avatar_gender: "male", avatar_style: "explorer", voice_id: "synthetic-voice" }),
      srs_cards: result([{ question_id: "cloud-q", interval_days: 2, repetitions: 1, ease_factor: "2.5", next_review: "2026-10-16" }]),
      stage_progress: result([{ stage_id: "cloud-stage", status: "started" }]),
      streaks: result({ last_active_date: "2026-10-14", current_streak: 2, longest_streak: 5 }), reward_balances: result({ balance: "7" }) });
    const observed: unknown[] = [];
    events.addEventListener("coachfi-learning", () => observed.push({
      cards: JSON.parse(owned("coachfi-srs")!), stages: JSON.parse(owned("coachfi-learn-manual")!),
      streak: JSON.parse(owned("coachfi-streak")!),
    }));
    const { guard } = lease(); expect(await syncOnLogin(state.db, USER_A, guard)).toBe(true);
    expect(observed).toEqual([{ cards: [{ id: "cloud-q", interval: 2, repetitions: 1, easeFactor: 2.5, nextReview: "2026-10-16" }],
      stages: { "cloud-stage": "started" }, streak: { lastActiveDate: "2026-10-14", currentStreak: 2, longestStreak: 5 } }]);
    expect(JSON.parse(owned("coachfi-avatar")!)).toEqual({ gender: "male", style: "explorer" });
    expect(owned("coachfi-voice")).toBe("synthetic-voice"); expect(owned("coachfi-tokens")).toBe("7");
    expect(state.writes).toEqual([]); expect(hooks.persistLearning).not.toHaveBeenCalled();
  });

  it("unrecognized cloud avatar fields use the existing product defaults", async () => {
    const state = fakeDatabase({ profiles: result({ avatar_gender: "foreign", avatar_style: "foreign" }) });
    const { guard } = lease(); await syncOnLogin(state.db, USER_A, guard);
    expect(JSON.parse(owned("coachfi-avatar")!)).toEqual(DEFAULT_AVATAR);
  });

  it("reentrant profile listeners invalidate before any following avatar, voice or learning write", async () => {
    const { guard, abort } = lease(); events.addEventListener("coachfi-user", () => abort.abort());
    const state = fakeDatabase({ profiles: result({ name: "Synthetic A" }) });
    expect(await syncOnLogin(state.db, USER_A, guard)).toBe(false);
    expect(setItem.mock.calls.map(([key]) => key.split(":").at(-1))).toEqual(["coachfi-user"]);
    expect(dataEvents()).toEqual(["coachfi-user"]); expect(state.writes).toEqual([]);
  });

  it("reentrant learning listeners stop subsequent token writes and success", async () => {
    const { guard, abort } = lease(); events.addEventListener("coachfi-learning", () => abort.abort());
    const state = fakeDatabase({ reward_balances: result({ balance: 80 }) });
    expect(await syncOnLogin(state.db, USER_A, guard)).toBe(false);
    expect(storage.has("coachfi-tokens")).toBe(false);
    expect(dispatch.mock.calls.map(([event]) => event.type)).not.toContain("coachfi-tokens");
  });
});

describe("Supabase author: actual AuthProvider callback with actual sync functions", () => {
  it("disabled Supabase performs no factory, configuration, subscription, pusher or network initialization", async () => {
    const state = fakeDatabase(); const register = vi.spyOn(queue, "registerCloudPusher");
    const provider = mount(state.db, false); await provider.value.signOut(); await vi.runAllTimersAsync();
    expect(provider.value).toMatchObject({ configured: false, loading: false, session: null, user: null });
    expect(hooks.factory).not.toHaveBeenCalled(); expect(hooks.configured).not.toHaveBeenCalled();
    expect(hooks.subscribe).not.toHaveBeenCalled(); expect(register).not.toHaveBeenCalled();
    expect(hooks.signOut).not.toHaveBeenCalled(); expect(state.from).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });

  it.each(["TOKEN_REFRESHED", "SIGNED_IN"])("%s same UID preserves the local owned value with no push or new read", async (event) => {
    const state = fakeDatabase({ profiles: result({ name: "Synthetic cloud old", onboarding_done: true }) });
    const provider = mount(state.db);
    expect(provider.callback?.("SIGNED_IN", { user: { id: USER_A } })).toBeUndefined();
    expect(state.from).not.toHaveBeenCalled(); await vi.advanceTimersByTimeAsync(0);
    expect(JSON.parse(owned("coachfi-user")!).name).toBe("Synthetic cloud old");
    saveUser({ name: "Synthetic owned new", goal: "owned", setupDone: true });
    provider.callback?.(event, { user: { id: USER_A }, access_token: "FIXTURE_replacement-token" });
    await vi.advanceTimersByTimeAsync(799);
    expect(state.from).toHaveBeenCalledTimes(5); expect(state.writes).toEqual([]);
    expect(JSON.parse(owned("coachfi-user")!).name).toBe("Synthetic owned new");
    await vi.advanceTimersByTimeAsync(1);
    expect(state.writes).toEqual([]); expect(state.from).toHaveBeenCalledTimes(5);
    expect(getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, syncIssue: "unconfirmed" });
    expect(dataEvents()).not.toContain("coachfi-cloud-synced"); expect(fetch).not.toHaveBeenCalled();
  });

  it("SIGNED_OUT → same UID preserves unconfirmed bytes without rehydration or cloud writes", async () => {
    const state = fakeDatabase({ profiles: result({ name: "Synthetic cloud authoritative" }) });
    const provider = mount(state.db); provider.callback?.("SIGNED_IN", { user: { id: USER_A } });
    await vi.advanceTimersByTimeAsync(0); const oldSignal = state.signals[0];
    saveUser({ name: "Synthetic pending old", goal: "", setupDone: true });
    provider.callback?.("SIGNED_OUT", null); provider.callback?.("SIGNED_IN", { user: { id: USER_A } });
    await vi.runAllTimersAsync(); expect(oldSignal.aborted).toBe(true); expect(state.signals).toHaveLength(5);
    expect(state.from).toHaveBeenCalledTimes(5); expect(state.writes).toEqual([]);
    expect(JSON.parse(owned("coachfi-user")!).name).toBe("Synthetic pending old");
    expect(getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, syncIssue: "unconfirmed" });
  });

  it("signOut fences before the deferred SDK await and its result does not clear a subsequent B lease", async () => {
    const logout = deferred<void>(); hooks.signOut.mockReturnValueOnce(logout.promise);
    const state = fakeDatabase(); const provider = mount(state.db);
    provider.callback?.("SIGNED_IN", { user: { id: USER_A } });
    const pending = provider.value.signOut(); await vi.advanceTimersByTimeAsync(0);
    expect(state.from).not.toHaveBeenCalled(); provider.callback?.("SIGNED_IN", { user: { id: USER_B } });
    await vi.advanceTimersByTimeAsync(0); const currentHandle = captureCurrentPersonalStorage();
    logout.resolve(); await pending; expect(currentHandle.isCurrent()).toBe(true);
    saveUser({ name: "Synthetic current B", goal: "", setupDone: true }); await vi.advanceTimersByTimeAsync(800);
    expect(state.writes).toEqual([]); expect(JSON.parse(owned("coachfi-user")!).name).toBe("Synthetic current B");
    expect(getStorageOwnershipSnapshot()).toMatchObject({ owner: { userId: USER_B }, localOnly: true, syncIssue: "unconfirmed" });
  });

  it("unmount rejects a late ignored-abort read and never emits cloud success", async () => {
    const read = deferred<Result>(); const state = fakeDatabase({ profiles: read.promise });
    const provider = mount(state.db); provider.callback?.("SIGNED_IN", { user: { id: USER_A } });
    await vi.advanceTimersByTimeAsync(0); provider.cleanup?.();
    read.resolve({ data: { name: "Synthetic stale A" }, error: null }); await Promise.resolve(); await Promise.resolve();
    expect(state.signals.every((signal) => signal.aborted)).toBe(true); expect(setItem).not.toHaveBeenCalled();
    expect(dataEvents()).toEqual([]); expect(state.writes).toEqual([]);
    expect(hooks.unsubscribe).toHaveBeenCalledOnce(); cleanups.length = 0;
  });
});

describe("installed Supabase/PostgREST SDK contract with synthetic custom fetch only", () => {
  const sdkRows: Record<string, unknown[]> = {
    profiles: [{ name: "Synthetic SDK profile", goal: "synthetic education", onboarding_done: true,
      avatar_gender: "female", avatar_style: "builder", voice_id: "synthetic-voice" }],
    srs_cards: [{ question_id: "synthetic-sdk-q", interval_days: 3, repetitions: 1, ease_factor: "2.5", next_review: "2026-10-17" }],
    stage_progress: [{ stage_id: "synthetic-sdk-stage", status: "completed" }],
    streaks: [{ last_active_date: "2026-10-14", current_streak: 2, longest_streak: 4 }],
    reward_balances: [{ balance: "9" }],
  };
  function installedClient(reply?: (table: string, init: RequestInit | undefined) => Promise<Response>) {
    const requests: Array<{ url: URL; init: RequestInit | undefined }> = [];
    const syntheticFetch = vi.fn<typeof fetch>(async (input, init) => {
      const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
      if (url.origin !== "https://synthetic-sdk.invalid" || !url.pathname.startsWith("/rest/v1/")) {
        throw new DOMException("Unexpected synthetic SDK request", "AbortError");
      }
      requests.push({ url, init });
      const table = url.pathname.split("/").at(-1)!;
      if (reply) return reply(table, init);
      if (init?.method === "GET") return new Response(JSON.stringify(sdkRows[table] ?? []), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
      return new Response(null, { status: 201 });
    });
    const db = createClient<Database>("https://synthetic-sdk.invalid", "synthetic-public-test-key", {
      // Bypass real auth: only PostgREST serialization/transport is under test.
      accessToken: async () => "synthetic-test-token",
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      global: { fetch: syntheticFetch },
    });
    return { db, requests, syntheticFetch };
  }

  it("real scalar/list read builders preserve shapes and exact signal; direct writes send zero SDK requests", async () => {
    const state = installedClient(); const { guard } = lease();
    expect(await syncOnLogin(state.db, USER_A, guard)).toBe(true);
    expect(state.requests).toHaveLength(5);
    expect(state.requests.every(({ init }) => init?.method === "GET" && init.signal === guard.signal)).toBe(true);
    const profile = state.requests.find(({ url }) => url.pathname.endsWith("/profiles"));
    expect(profile?.url.searchParams.get("id")).toBe(`eq.${USER_A}`);
    const balance = state.requests.find(({ url }) => url.pathname.endsWith("/reward_balances"));
    expect(balance?.url.searchParams.get("user_id")).toBe(`eq.${USER_A}`);
    expect(balance?.url.searchParams.get("child_id")).toBe("is.null");
    expect(JSON.parse(owned("coachfi-user")!)).toEqual({ name: "Synthetic SDK profile", goal: "synthetic education", setupDone: true });
    expect(JSON.parse(owned("coachfi-srs")!)).toEqual([{ id: "synthetic-sdk-q", interval: 3, repetitions: 1,
      easeFactor: 2.5, nextReview: "2026-10-17" }]);
    expect(owned("coachfi-tokens")).toBe("9");
    guard.storage.setItem("coachfi-consent-v1", JSON.stringify(createConsentRecord()));
    for (const entity of ["profile", "srs", "stages", "streak", "consent"] as const) {
      await pushEntity(state.db, USER_A, entity, undefined, guard);
    }
    await pushEntity(state.db, USER_A, "reward", { amount: 3, reason: "synthetic" }, guard);
    await pushEntity(state.db, USER_A, "challenge", { questionId: "synthetic-sdk-q", isCorrect: true, reward: 1 }, guard);
    const writes = state.requests.slice(5);
    expect(writes).toEqual([]); expect(state.syntheticFetch).toHaveBeenCalledTimes(5); expect(fetch).not.toHaveBeenCalled();
  });

  it("real SDK cardinality/error processing never turns an error response into empty-account hydration", async () => {
    const state = installedClient(async (table) => new Response(JSON.stringify(table === "profiles"
      ? [{ name: "Synthetic duplicate 1" }, { name: "Synthetic duplicate 2" }] : []), {
        status: 200, headers: { "Content-Type": "application/json" },
      }));
    const { guard } = lease();
    await expect(syncOnLogin(state.db, USER_A, guard)).rejects.toThrow("Cloud sync unavailable");
    expect(setItem).not.toHaveBeenCalled(); expect(dataEvents()).toEqual([]);
    expect(state.requests).toHaveLength(5); expect(fetch).not.toHaveBeenCalled();
  });

  it("real SDK carries abort to a deferred synthetic transport and the response cannot hydrate", async () => {
    const read = deferred<Response>();
    const state = installedClient(async (table) => table === "profiles" ? read.promise : new Response("[]", {
      status: 200, headers: { "Content-Type": "application/json" },
    }));
    const { guard, abort } = lease(); const running = syncOnLogin(state.db, USER_A, guard);
    // fetchWithAuth resolves its synthetic token before invoking custom fetch.
    await vi.waitFor(() => expect(state.requests).toHaveLength(5));
    expect(state.requests.every(({ init }) => init?.signal === guard.signal)).toBe(true);
    abort.abort(); expect(state.requests.every(({ init }) => init?.signal?.aborted)).toBe(true);
    read.resolve(new Response(JSON.stringify(sdkRows.profiles), { status: 200, headers: { "Content-Type": "application/json" } }));
    expect(await running).toBe(false); expect(setItem).not.toHaveBeenCalled(); expect(dataEvents()).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });
});
