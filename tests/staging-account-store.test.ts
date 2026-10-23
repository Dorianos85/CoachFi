import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({ database: null as DatabaseSync | null }));
// The production/local file opener remains behind the normal C69 guard. This
// adapter supplies only a fresh, real SQLite :memory: database created below.
vi.mock("@/lib/dev-db", () => ({
  getDevDb: () => {
    if (!fixture.database) throw new Error("No synthetic in-memory database");
    return fixture.database;
  },
}));

const A = "SYNTHETIC_ACCOUNT_A";
const B = "SYNTHETIC_ACCOUNT_B";
const WHEN = "2026-10-21T00:00:00.000Z";
const TABLES = ["accounts", "account_state", "progress", "certificates"] as const;
type Table = typeof TABLES[number];
type Row = Record<string, unknown> & { cdp_user_id: string };
type RequestObservation = { table: Table; method: string; owner: string | null };
let rows: Record<Table, Row[]>;
let requests: RequestObservation[];
let fail: { table: Table; method: string } | null;
let databases: DatabaseSync[];
let store: typeof import("@/lib/account-store");

function account(id = A): Row {
  return { cdp_user_id: id, email: null, display_name: "Synthetic fixture", solana_address: null,
    evm_address: null, auth_provider: null, cdp_created_at: null, last_authenticated_at: null, updated_at: WHEN };
}
function snapshot(id = A): Row {
  return { cdp_user_id: id, state: { version: 1, profile: { setupDone: true }, tokens: id === A ? 5 : 99,
    srs: [{ id: "synthetic-card", interval: 2 }], learnManual: { saving: "started" },
    streak: { currentStreak: 2 } }, updated_at: WHEN };
}
function remoteBytes() { return JSON.stringify(rows); }
function sqlite() {
  const db = new DatabaseSync(":memory:", { enableForeignKeyConstraints: true });
  databases.push(db);
  db.exec(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
  fixture.database = db;
  return db;
}
function seedSqlite(db: DatabaseSync, id = A, withProgress = true) {
  db.prepare("insert into accounts (cdp_user_id, display_name, updated_at) values (?, ?, ?)").run(id, "Synthetic fixture", WHEN);
  db.prepare("insert into account_state (cdp_user_id, state, updated_at) values (?, ?, ?)")
    .run(id, JSON.stringify(snapshot(id).state), WHEN);
  if (withProgress) db.prepare("insert into progress (cdp_user_id, tokens, updated_at) values (?, ?, ?)").run(id, id === A ? 12 : 88, WHEN);
  db.prepare("insert into certificates (cdp_user_id, certificate_id, status, minted, asset_address, owner_address, updated_at) values (?, ?, ?, ?, ?, ?, ?)")
    .run(id, "money-mindset", "owned", 1, "synthetic-asset", "synthetic-owner", WHEN);
}
function sqliteBytes(db: DatabaseSync) {
  return JSON.stringify(TABLES.map(table => ({ table, rows: db.prepare(`select * from ${table} order by cdp_user_id`).all() })));
}
function totalChanges(db: DatabaseSync) { return (db.prepare("select total_changes() as count").get() as { count: number }).count; }

beforeEach(async () => {
  vi.resetModules();
  fixture.database = null;
  databases = []; requests = []; fail = null;
  rows = { accounts: [account(), account(B)], account_state: [snapshot(), snapshot(B)], progress: [], certificates: [] };
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("COACHFI_ACCOUNT_STORE", "supabase");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://synthetic-account-store.invalid");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "synthetic-test-key-never-a-credential");
  // The installed Supabase client serializes every request. Only this synthetic
  // transport returns fixture rows; it never opens a socket or contacts auth.
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    expect(url.origin).toBe("https://synthetic-account-store.invalid");
    expect(url.pathname).toMatch(/^\/rest\/v1\/(accounts|account_state|progress|certificates)$/);
    const table = url.pathname.split("/").at(-1) as Table;
    const method = init?.method ?? (input instanceof Request ? input.method : "GET");
    const owner = url.searchParams.get("cdp_user_id");
    requests.push({ table, method, owner });
    if (fail?.table === table && fail.method === method) return Response.json({ message: "Synthetic storage denied", code: "42501" }, { status: 403 });
    if (method === "GET") {
      expect(owner).toMatch(/^eq\./);
      return Response.json(rows[table].filter(row => `eq.${row.cdp_user_id}` === owner));
    }
    if (method === "DELETE") {
      expect(owner).toMatch(/^eq\./);
      rows[table] = rows[table].filter(row => `eq.${row.cdp_user_id}` !== owner);
      // This transport models the canonical FK contract, not a real PostgreSQL
      // cascade/RLS result. Actual database integration is a separate gate.
      if (table === "accounts") for (const child of TABLES.slice(1)) rows[child] = rows[child].filter(row => `eq.${row.cdp_user_id}` !== owner);
      return new Response(null, { status: 204 });
    }
    // Preserve the baseline's hidden read-upsert so it fails the zero-write
    // oracle instead of failing for an unrelated mock-builder limitation.
    expect(method).toBe("POST"); expect(table).toBe("progress");
    const body = JSON.parse(String(init?.body)) as Row;
    rows.progress = [...rows.progress.filter(row => row.cdp_user_id !== body.cdp_user_id), body];
    return new Response(null, { status: 201 });
  }));
  store = await import("@/lib/account-store");
});
afterEach(() => {
  fixture.database = null;
  for (const db of databases) db.close();
  vi.unstubAllEnvs(); vi.unstubAllGlobals();
});

describe("staging account-store installed SDK read boundary", () => {
  it("missing progress returns snapshot fallback without a hidden write or later recreation", async () => {
    const before = remoteBytes();
    const result = await store.getAccount(A);
    expect(result?.state).toEqual(snapshot().state);
    expect(requests).toEqual(TABLES.slice(0, 3).map(table => ({ table, method: "GET", owner: `eq.${A}` })));
    expect(remoteBytes()).toBe(before);
  });
  it("explicit progress values override snapshot fields while null fields retain fallback", async () => {
    rows.progress = [{ cdp_user_id: A, srs: [], learn_manual: null, tokens: 0, streak: { currentStreak: 8 } }];
    const before = remoteBytes();
    expect((await store.getAccount(A))?.state).toEqual({ ...(snapshot().state as object), srs: [], tokens: 0, streak: { currentStreak: 8 } });
    expect(requests.every(request => request.method === "GET" && request.owner === `eq.${A}`)).toBe(true);
    expect(remoteBytes()).toBe(before);
  });
  it.each([null, { version: 99, tokens: 7 }, "not-json"])("unsupported state %j is not persisted or repaired by a read", async state => {
    rows.account_state = [{ cdp_user_id: A, state, updated_at: WHEN }];
    const before = remoteBytes();
    expect((await store.getAccount(A))?.state).toBeNull();
    expect(requests.every(request => request.method === "GET")).toBe(true);
    expect(remoteBytes()).toBe(before);
  });
  it("a missing account returns null after one owner-filtered read and never seeds it", async () => {
    rows.accounts = [account(B)]; const before = remoteBytes();
    expect(await store.getAccount(A)).toBeNull();
    expect(requests).toEqual([{ table: "accounts", method: "GET", owner: `eq.${A}` }]);
    expect(remoteBytes()).toBe(before);
  });
  it.each(["accounts", "account_state", "progress"] as const)("%s read refusal is an error, never an empty success or repair", async table => {
    fail = { table, method: "GET" }; const before = remoteBytes();
    await expect(store.getAccount(A)).rejects.toThrow("Synthetic storage denied");
    expect(requests.every(request => request.method === "GET" && request.owner === `eq.${A}`)).toBe(true);
    expect(remoteBytes()).toBe(before);
  });
  it("both owners are selected independently without cross-owner state", async () => {
    rows.progress = [{ cdp_user_id: A, tokens: 12 }, { cdp_user_id: B, tokens: 88 }];
    const before = remoteBytes();
    expect((await store.getAccount(A))?.state?.tokens).toBe(12);
    expect((await store.getAccount(B))?.state?.tokens).toBe(88);
    expect(requests.map(request => request.owner)).toEqual([`eq.${A}`, `eq.${A}`, `eq.${A}`, `eq.${B}`, `eq.${B}`, `eq.${B}`]);
    expect(remoteBytes()).toBe(before);
  });
});

describe("staging account-store parent delete SDK contract", () => {
  beforeEach(() => {
    rows.progress = [{ cdp_user_id: A, tokens: 12 }, { cdp_user_id: B, tokens: 88 }];
    rows.certificates = [{ cdp_user_id: A, certificate_id: "money-mindset" }, { cdp_user_id: B, certificate_id: "money-mindset" }];
  });
  it("one parent request selects A exactly; B is preserved and repeated delete remains idempotent", async () => {
    const otherOwner = TABLES.map(table => rows[table].filter(row => row.cdp_user_id === B));
    await store.deleteAccount(A);
    expect(requests).toEqual([{ table: "accounts", method: "DELETE", owner: `eq.${A}` }]);
    expect(TABLES.map(table => rows[table].filter(row => row.cdp_user_id === B))).toEqual(otherOwner);
    expect(TABLES.every(table => rows[table].every(row => row.cdp_user_id !== A))).toBe(true);
    await store.deleteAccount(A);
    expect(requests).toHaveLength(2);
    expect(await store.getAccount(A)).toBeNull();
    expect(rows.accounts).toEqual([account(B)]);
  });
  it("parent deletion refusal does not issue child deletes or claim success", async () => {
    fail = { table: "accounts", method: "DELETE" }; const before = remoteBytes();
    await expect(store.deleteAccount(A)).rejects.toThrow("Synthetic storage denied");
    expect(requests).toEqual([{ table: "accounts", method: "DELETE", owner: `eq.${A}` }]);
    expect(remoteBytes()).toBe(before);
  });
  it("SDK encodes a UID containing query punctuation as one equality value", async () => {
    const id = "SYNTHETIC_A&cdp_user_id=eq.SYNTHETIC_ACCOUNT_B";
    await store.deleteAccount(id);
    expect(requests).toEqual([{ table: "accounts", method: "DELETE", owner: `eq.${id}` }]);
    expect(rows.accounts).toEqual([account(), account(B)]);
  });
});

describe("staging account-store real SQLite memory boundary", () => {
  beforeEach(() => vi.stubEnv("COACHFI_ACCOUNT_STORE", "sqlite"));
  it("a missing progress row falls back without inserting or modifying any initialized database row", async () => {
    const db = sqlite(); seedSqlite(db, A, false); seedSqlite(db, B);
    const before = sqliteBytes(db), changes = totalChanges(db);
    expect((await store.getAccount(A))?.state).toEqual(snapshot().state);
    expect(sqliteBytes(db)).toBe(before); expect(totalChanges(db)).toBe(changes);
  });
  it("actual SQLite progress overlays snapshot values without modifying either owner's rows", async () => {
    const db = sqlite(); seedSqlite(db); seedSqlite(db, B);
    const before = sqliteBytes(db), changes = totalChanges(db);
    expect((await store.getAccount(A))?.state?.tokens).toBe(12);
    expect((await store.getAccount(B))?.state?.tokens).toBe(88);
    expect(sqliteBytes(db)).toBe(before); expect(totalChanges(db)).toBe(changes);
  });
  it("actual transactional deletion removes only A and an absent repeat does not recreate it", async () => {
    const db = sqlite(); seedSqlite(db); seedSqlite(db, B);
    const b = TABLES.map(table => db.prepare(`select * from ${table} where cdp_user_id = ?`).all(B));
    await store.deleteAccount(A); await store.deleteAccount(A);
    expect(await store.getAccount(A)).toBeNull();
    expect(TABLES.map(table => db.prepare(`select * from ${table} where cdp_user_id = ?`).all(B))).toEqual(b);
    expect(TABLES.map(table => (db.prepare(`select count(*) as count from ${table} where cdp_user_id = ?`).get(A) as { count: number }).count)).toEqual([0, 0, 0, 0]);
  });
  it("a real SQLite failure at the parent delete rolls back earlier child deletes", async () => {
    const db = sqlite(); seedSqlite(db); seedSqlite(db, B);
    db.exec(`create trigger synthetic_delete_refusal before delete on accounts begin select raise(abort, 'Synthetic delete refused'); end;`);
    const before = sqliteBytes(db);
    await expect(store.deleteAccount(A)).rejects.toThrow("Synthetic delete refused");
    expect(sqliteBytes(db)).toBe(before);
    expect((await store.getAccount(B))?.state?.tokens).toBe(88);
  });
  it("the actual development opener initializes memory once; later access does not silently backfill", async () => {
    vi.stubEnv("COACHFI_DEV_DB", ":memory:");
    // importActual is limited to the exact native in-memory path. Refuse before
    // invoking the opener on the baseline, where :memory: resolves as a file.
    const actual = await vi.importActual<typeof import("@/lib/dev-db")>("@/lib/dev-db");
    expect(actual.devDbPath()).toBe(":memory:");
    const db = actual.getDevDb(); databases.push(db);
    seedSqlite(db, A, false); seedSqlite(db, B);
    db.prepare("update certificates set minted = 0 where cdp_user_id = ?").run(A);
    const before = sqliteBytes(db), changes = totalChanges(db);
    expect(actual.getDevDb()).toBe(db); expect(actual.getDevDb()).toBe(db);
    fixture.database = db;
    expect((await store.getAccount(A))?.state).toEqual(snapshot().state);
    expect(sqliteBytes(db)).toBe(before); expect(totalChanges(db)).toBe(changes);
  });
});
