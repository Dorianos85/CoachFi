import { mkdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { dirname, isAbsolute, join } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_RELATIVE_PATH = join("data", "coachfi.dev.sqlite");

export function devDbPath() {
  const configured = process.env.COACHFI_DEV_DB?.trim();
  if (!configured) return join(process.cwd(), DEFAULT_RELATIVE_PATH);
  return isAbsolute(configured) ? configured : join(process.cwd(), configured);
}

let db: DatabaseSync | null = null;

const IDENTITY_COLUMNS = [
  "solana_address",
  "evm_address",
  "auth_provider",
  "cdp_created_at",
  "last_authenticated_at",
  "cdp_profile",
] as const;

function ensureIdentityColumns(database: DatabaseSync) {
  const names = new Set(
    (database.prepare("pragma table_info(accounts)").all() as Array<{ name: string }>).map((column) => column.name),
  );
  if (!names.has("cdp_user_id")) return;
  for (const name of IDENTITY_COLUMNS) {
    if (!names.has(name)) database.exec(`alter table accounts add column ${name} text`);
  }
}

export function getDevDb() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The SQLite database is for local development only.");
  }
  if (!db) {
    const path = devDbPath();
    mkdirSync(dirname(path), { recursive: true });
    const database = new DatabaseSync(path, { enableForeignKeyConstraints: true });
    database.exec(readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8"));
    db = database;
  }
  ensureIdentityColumns(db);
  return db;
}

const isDirectRun = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const database = getDevDb();
  const tables = database
    .prepare("select name from sqlite_master where type = 'table' order by name")
    .all() as Array<{ name: string }>;
  console.log(`${devDbPath()} tables: ${tables.map((table) => table.name).join(", ")}`);
}
