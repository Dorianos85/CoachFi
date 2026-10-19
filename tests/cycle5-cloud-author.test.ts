import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SyncSession } from "@/lib/sync/session-sync";

// The other provider's persistence boundary is outside this Supabase audit.
// Its production persistLearningState is a no-op for Supabase-owned handles.
vi.mock("@/lib/account-sync", () => ({ persistLearningState: vi.fn() }));

type Reply = { data: unknown; error: { message: string } | null };
type Call = { table: string; operation: "select" | "upsert" | "insert"; payload?: unknown;
  options?: unknown; filters: Array<[string, unknown]>; signal?: AbortSignal };
type RecordValue = Record<string, unknown>;
const UID = "FIXTURE_SUPABASE_A";
const ownedKey = (key: string) => `coachfi-owned:v1:supabase:${UID}:${key}`;
const clone = <T>(value: T): T => value === undefined ? value : JSON.parse(JSON.stringify(value)) as T;
const ok = (data: unknown = null): Reply => ({ data, error: null });
const error = (): Reply => ({ data: null, error: { message: "FIXTURE_OFFLINE" } });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

/** Mock transport only. Production controller, queries, helpers and storage adapter are imported below. */
class FixtureQuery implements PromiseLike<Reply> {
  private operation: Call["operation"] = "select";
  private payload?: unknown;
  private options?: unknown;
  private filters: Call["filters"] = [];
  private signal?: AbortSignal;
  constructor(private table: string, private transport: (call: Call) => Promise<Reply>) {}
  select(_columns?: string) { return this; }
  eq(key: string, value: unknown) { this.filters.push([key, value]); return this; }
  is(key: string, value: unknown) { this.filters.push([key, value]); return this; }
  abortSignal(signal: AbortSignal) { this.signal = signal; return this; }
  maybeSingle() { return this; }
  upsert(payload: unknown, options?: unknown) {
    this.operation = "upsert"; this.payload = clone(payload); this.options = clone(options); return this;
  }
  insert(payload: unknown) { this.operation = "insert"; this.payload = clone(payload); return this; }
  then<TResult1 = Reply, TResult2 = never>(
    onfulfilled?: ((value: Reply) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.transport({ table: this.table, operation: this.operation, payload: this.payload,
      options: this.options, filters: [...this.filters], signal: this.signal }).then(onfulfilled, onrejected);
  }
}

// Acceptance of the bounded write-off/preservation contract only; baseline evidence is retained separately.
describe("B15 Supabase write-off author acceptance (synthetic transport, no auth or DB)", () => {
  let bytes: Map<string, string>;
  let calls: Call[];
  let rows: Map<string, unknown>;
  let ledger: RecordValue[];
  let offlineReads: boolean;
  let failWrites: boolean;
  let quotaKey: string | null;
  let writeHook: ((call: Call) => Promise<Reply>) | null;
  let readHook: ((call: Call) => Promise<Reply>) | null;
  let disposers: Array<() => void>;
  let network: ReturnType<typeof vi.fn<typeof fetch>>;
  beforeEach(() => {
    vi.resetModules(); vi.useFakeTimers(); bytes = new Map(); calls = []; ledger = []; disposers = [];
    offlineReads = false; failWrites = false; quotaKey = null; writeHook = null; readHook = null;
    rows = new Map<string, unknown>([
      ["profiles", { name: "FIXTURE_CLOUD_OLD", goal: "cloud goal", onboarding_done: true,
        avatar_gender: "female", avatar_style: "explorer", voice_id: "FIXTURE_VOICE" }],
      ["srs_cards", [{ question_id: "FIXTURE_CARD_OLD", interval_days: 1, repetitions: 1,
        ease_factor: "2.50", next_review: "2026-10-15" }]],
      ["stage_progress", [{ stage_id: "money-mindset", status: "started" }]],
      ["streaks", { last_active_date: "2026-10-13", current_streak: 2, longest_streak: 3 }],
      ["reward_balances", { balance: 80 }],
    ]);
    const localStorage = { getItem: (key: string) => bytes.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (key === quotaKey) throw new Error("FIXTURE_QUOTA");
        bytes.set(key, value);
      }, removeItem: (key: string) => { bytes.delete(key); } };
    const session = new Map<string, string>();
    const sessionStorage = { getItem: (key: string) => session.get(key) ?? null,
      setItem: (key: string, value: string) => { session.set(key, value); },
      removeItem: (key: string) => { session.delete(key); } };
    vi.stubGlobal("window", { localStorage, sessionStorage, dispatchEvent: vi.fn(() => true),
      addEventListener: vi.fn(), removeEventListener: vi.fn() });
    network = vi.fn<typeof fetch>(() => { throw new Error("No real network permitted in B15 baseline."); });
    vi.stubGlobal("fetch", network);
  });
  afterEach(() => {
    for (const dispose of disposers) dispose();
    expect(network).not.toHaveBeenCalled();
    vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks();
  });

  const writes = () => calls.filter((call) => call.operation !== "select");
  async function settle() { for (let i = 0; i < 20; i++) await Promise.resolve(); }
  async function harness() {
    const [controllerModule, cloud, queue, storage, user, srs, tokens, learning] = await Promise.all([
      import("@/lib/sync/session-sync"), import("@/lib/sync/cloudSync"), import("@/lib/sync/syncQueue"),
      import("@/lib/product-storage"), import("@/lib/user"), import("@/lib/srs"), import("@/lib/tokens"),
      import("@/lib/learningProgress"),
    ]);
    const transport = async (call: Call): Promise<Reply> => {
      calls.push(call);
      if (call.operation === "select") return readHook ? readHook(call) : offlineReads ? error() : ok(clone(rows.get(call.table) ?? null));
      if (writeHook) return writeHook(call);
      if (failWrites) return error();
      if (call.table === "profiles") rows.set(call.table, clone(call.payload));
      if (call.table === "reward_ledger") ledger.push(clone(call.payload as RecordValue));
      return ok();
    };
    const db = { from: (table: string) => new FixtureQuery(table, transport) } as unknown as Parameters<typeof cloud.syncOnLogin>[0];
    const synced = vi.fn<(session: SyncSession) => void>();
    const controller = controllerModule.createSessionSyncController({
      sync: (session) => cloud.syncOnLogin(db, session.userId, session),
      push: (session, entity, payload) => cloud.pushEntity(db, session.userId, entity, payload, session),
      registerPusher: queue.registerCloudPusher, onSynced: synced,
    });
    disposers.push(() => controller.dispose());
    const start = async () => {
      const session = controller.start(UID);
      await vi.advanceTimersByTimeAsync(0); await settle();
      return session;
    };
    return { controller, start, cloud, queue, storage, user, srs, tokens, learning, synced, db };
  }
  async function cold(h: Awaited<ReturnType<typeof harness>>) {
    h.controller.dispose(); vi.resetModules();
    const resumed = await harness(); await resumed.start(); return resumed;
  }
  function newProfile(name = "FIXTURE_OWN_NEW") { return { name, goal: "own edited goal", setupDone: true }; }

  it("preserves own offline profile/cards/tokens/stage bytes on cold resume with no cloud attempts or acknowledgement", async () => {
    const guest = ' {"name":"FIXTURE_GUEST_RAW"}\n'; bytes.set("coachfi-user", guest);
    bytes.set("coachfi-tokens", "00321"); bytes.set("coachfi-health-check", "FIXTURE_GUEST_HEALTH_BYTES");
    offlineReads = true; const h = await harness(); const session = await h.start();
    expect(h.storage.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, syncIssue: "unavailable" });
    expect(session?.signal.aborted).toBe(true); expect(h.synced).not.toHaveBeenCalled();
    const current = h.storage.captureCurrentPersonalStorage(); h.user.saveUser(newProfile(), current);
    h.srs.saveCards([{ id: "FIXTURE_CARD_NEW", interval: 6, repetitions: 2, easeFactor: 2.6, nextReview: "2026-10-20" }], current);
    expect(h.tokens.addTokens(7, "FIXTURE_LOCAL_REWARD", "app", current)).toBe(132);
    h.learning.markStageCompleted("money-mindset", current);
    const saved = new Map(bytes); const before = calls.length;
    await vi.advanceTimersByTimeAsync(60_000); expect(writes()).toHaveLength(0);
    offlineReads = false; const resumed = await cold(h);
    expect(bytes).toEqual(saved); expect(calls).toHaveLength(before);
    const restored = resumed.storage.captureCurrentPersonalStorage();
    expect(resumed.user.getUser(restored).name).toBe("FIXTURE_OWN_NEW");
    expect(resumed.srs.getAllCards(restored).map((card) => card.id)).toEqual(["FIXTURE_CARD_NEW"]);
    expect(resumed.tokens.getTokenBalance(restored)).toBe(132);
    expect(JSON.parse(String(restored.getItem("coachfi-learn-manual")))).toEqual({ "money-mindset": "completed" });
    expect(resumed.storage.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, syncIssue: "unconfirmed" });
    expect(bytes.get("coachfi-user")).toBe(guest); expect(bytes.get("coachfi-tokens")).toBe("00321");
    expect(bytes.get("coachfi-health-check")).toBe("FIXTURE_GUEST_HEALTH_BYTES");
    expect(writes()).toHaveLength(0); expect(resumed.synced).not.toHaveBeenCalled();
  });

  it("fresh empty cloud may hydrate five reads with read-only status, no guest seed, pusher or success callback", async () => {
    const guest = ' {"name":"FIXTURE_GUEST_RAW"}\n'; bytes.set("coachfi-user", guest);
    rows.set("profiles", null); rows.set("srs_cards", []); rows.set("stage_progress", []);
    rows.set("streaks", null); rows.set("reward_balances", null);
    const h = await harness(); await h.start(); const current = h.storage.captureCurrentPersonalStorage();
    expect(h.user.getUser(current)).toEqual({ name: "", goal: "", setupDone: false });
    expect(h.srs.getAllCards(current)).toEqual([]); expect(h.tokens.getTokenBalance(current)).toBe(0);
    expect(calls).toHaveLength(5); expect(calls.every((call) => call.operation === "select")).toBe(true);
    expect(calls.every((call) => call.signal === h.controller.getCurrent()?.signal)).toBe(true);
    expect(h.storage.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, syncIssue: "read-only" });
    expect(bytes.get("coachfi-user")).toBe(guest); expect(writes()).toHaveLength(0); expect(h.synced).not.toHaveBeenCalled();
    expect(current.getItem("coachfi-learning-rev")).toBeNull();
  });

  it("fresh account reads are never treated as acknowledgement; explicit edits remain local across cold resume", async () => {
    const h = await harness(); await h.start(); const current = h.storage.captureCurrentPersonalStorage();
    expect(h.user.getUser(current).name).toBe("FIXTURE_CLOUD_OLD"); expect(calls).toHaveLength(5);
    h.user.saveUser(newProfile(), current); const saved = new Map(bytes);
    expect(current.getItem("coachfi-learning-rev")).toBe("local-unconfirmed-v1");
    expect(h.storage.getStorageOwnershipSnapshot()).toMatchObject({ localOnly: true, syncIssue: "unconfirmed" });
    await vi.advanceTimersByTimeAsync(60_000); expect(calls).toHaveLength(5); expect(writes()).toHaveLength(0);
    const resumed = await cold(h); expect(bytes).toEqual(saved); expect(calls).toHaveLength(5);
    expect(resumed.user.getUser().name).toBe("FIXTURE_OWN_NEW"); expect(h.synced).not.toHaveBeenCalled();
    expect(resumed.synced).not.toHaveBeenCalled();
  });

  it.each(["coachfi-user", "coachfi-avatar", "coachfi-voice", "coachfi-mode-v1", "coachfi-srs",
    "coachfi-learn-manual", "coachfi-streak", "coachfi-tokens", "coachfi-challenge", "coachfi-consent-v1"])(
    "existing own %s bytes block even read initialization and are preserved without parsing", async (key) => {
      bytes.set(ownedKey(key), key === "coachfi-voice" ? "" : ` FIXTURE_MALFORMED_${key}\n`);
      const saved = new Map(bytes); const h = await harness(); const session = await h.start();
      expect(bytes).toEqual(saved); expect(calls).toEqual([]); expect(session?.signal.aborted).toBe(true);
      expect(h.storage.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, syncIssue: "unconfirmed" });
      expect(h.synced).not.toHaveBeenCalled();
    });

  it.each(["", "7", "false", "{not json", "local-unconfirmed-v1"])(
    "every existing marker %j blocks reads and is retained exactly", async (marker) => {
      bytes.set(ownedKey("coachfi-learning-rev"), marker); const saved = new Map(bytes);
      const h = await harness(); await h.start(); expect(bytes).toEqual(saved); expect(calls).toEqual([]);
      expect(h.storage.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, syncIssue: "unconfirmed" });
      expect(h.synced).not.toHaveBeenCalled();
    });

  it("own health and other nonmirrored local bytes neither suppress fresh read nor leave the device", async () => {
    bytes.set(ownedKey("coachfi-health-check"), "FIXTURE_HEALTH_RAW");
    bytes.set(ownedKey("coachfi-vault"), "FIXTURE_VAULT_RAW");
    const h = await harness(); await h.start();
    expect(calls).toHaveLength(5); expect(writes()).toHaveLength(0);
    expect(bytes.get(ownedKey("coachfi-health-check"))).toBe("FIXTURE_HEALTH_RAW");
    expect(bytes.get(ownedKey("coachfi-vault"))).toBe("FIXTURE_VAULT_RAW");
    expect(calls.some((call) => call.table === "health_checks")).toBe(false); expect(h.synced).not.toHaveBeenCalled();
  });

  it("rechecks cache introduced while GET is pending before any hydration or callback", async () => {
    const read = deferred<Reply>(); readHook = (call) => call.table === "profiles" ? read.promise : Promise.resolve(ok(clone(rows.get(call.table))));
    const h = await harness(); const session = await h.start(); expect(calls).toHaveLength(5);
    const local = ' {"name":"FIXTURE_DURING_GET"}\n';
    expect(session?.storage.setItem("coachfi-user", local)).toBe(true); // Private test handle, deliberately no public marker.
    read.resolve(ok(rows.get("profiles"))); await settle();
    expect(bytes.get(ownedKey("coachfi-user"))).toBe(local); expect(bytes.has(ownedKey("coachfi-avatar"))).toBe(false);
    expect(h.storage.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, syncIssue: "unconfirmed" });
    expect(h.synced).not.toHaveBeenCalled(); expect(writes()).toHaveLength(0);
  });

  it.each(["coachfi-user", "coachfi-learning"])("marker introduced at %s event stops every later private mutation", async (stopAt) => {
    const dispatch = vi.mocked(window.dispatchEvent);
    dispatch.mockImplementation((event) => {
      if (event.type === stopAt) {
        bytes.set(ownedKey("coachfi-learning-rev"), "FIXTURE_UNCONFIRMED_AT_EVENT");
        bytes.set(ownedKey("coachfi-tokens"), "132");
      }
      return true;
    });
    const h = await harness(); await h.start();
    expect(bytes.get(ownedKey("coachfi-learning-rev"))).toBe("FIXTURE_UNCONFIRMED_AT_EVENT");
    expect(bytes.get(ownedKey("coachfi-tokens"))).toBe("132");
    if (stopAt === "coachfi-user") expect(bytes.has(ownedKey("coachfi-avatar"))).toBe(false);
    expect(h.storage.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, syncIssue: "unconfirmed" });
    expect(h.synced).not.toHaveBeenCalled(); expect(writes()).toHaveLength(0);
  });

  it.each(["profile", "srs", "stages", "streak", "reward", "challenge", "healthCheck", "consent"] as const)(
    "direct %s push hard-off precedes DB/payload/guard reads", async (entity) => {
      const h = await harness(); const forbidden = vi.fn(() => { throw new Error("Forbidden property access"); });
      const db = new Proxy({}, { get: forbidden }) as Parameters<typeof h.cloud.pushEntity>[0];
      const payload = new Proxy({}, { get: forbidden, ownKeys: forbidden });
      const session = new Proxy({}, { get: forbidden }) as SyncSession;
      await expect(h.cloud.pushEntity(db, UID, entity, payload, session)).resolves.toBeUndefined();
      expect(forbidden).not.toHaveBeenCalled(); expect(calls).toEqual([]);
    });

  it("cannot register a cloud pusher or replay reward/consent through the old queue", async () => {
    const h = await harness(); await h.start(); const pusher = vi.fn(); h.queue.registerCloudPusher(pusher);
    for (const entity of ["profile", "srs", "stages", "streak", "reward", "challenge", "healthCheck", "consent"] as const) {
      h.queue.notifyCloud(entity, { amount: 7, reason: "FIXTURE_REPLAY" });
    }
    await vi.advanceTimersByTimeAsync(60_000); expect(pusher).not.toHaveBeenCalled();
    expect(writes()).toHaveLength(0); expect(h.synced).not.toHaveBeenCalled();
  });

  it("failed reads publish unavailable without clearing own nonmirrored bytes or emitting success", async () => {
    bytes.set(ownedKey("coachfi-health-check"), "FIXTURE_HEALTH_RAW"); const saved = new Map(bytes);
    offlineReads = true; const h = await harness(); const session = await h.start();
    expect(bytes).toEqual(saved); expect(calls).toHaveLength(5); expect(session?.signal.aborted).toBe(true);
    expect(h.storage.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, syncIssue: "unavailable" });
    expect(h.synced).not.toHaveBeenCalled(); expect(writes()).toHaveLength(0);
  });

  it("quota after a partial fresh read emits no acknowledgement; cold resume preserves the partial bytes", async () => {
    quotaKey = ownedKey("coachfi-avatar"); const h = await harness(); await h.start();
    expect(h.storage.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true, syncIssue: "unconfirmed" });
    expect(h.user.getUser().name).toBe("FIXTURE_CLOUD_OLD"); expect(bytes.has(ownedKey("coachfi-avatar"))).toBe(false);
    expect(h.synced).not.toHaveBeenCalled(); const partial = new Map(bytes); quotaKey = null;
    const resumed = await cold(h); expect(bytes).toEqual(partial); expect(calls).toHaveLength(5);
    expect(resumed.synced).not.toHaveBeenCalled(); expect(writes()).toHaveLength(0);
  });

  it("empty snapshots and local removal cannot erase or acknowledge remote rows", async () => {
    const h = await harness(); const session = await h.start(); const current = h.storage.captureCurrentPersonalStorage();
    h.srs.saveCards([], current); expect(current.removeItem("coachfi-learn-manual")).toBe(true);
    h.queue.notifyCloud("stages"); await vi.advanceTimersByTimeAsync(60_000);
    await h.cloud.pushEntity(h.db, UID, "srs", undefined, session ?? undefined);
    await h.cloud.pushEntity(h.db, UID, "stages", undefined, session ?? undefined);
    expect(writes()).toHaveLength(0); expect(rows.get("stage_progress")).toEqual([{ stage_id: "money-mindset", status: "started" }]);
    expect(h.srs.getAllCards(current)).toEqual([]); expect(current.getItem("coachfi-learning-rev")).toBe("local-unconfirmed-v1");
    expect(h.synced).not.toHaveBeenCalled();
  });
});
