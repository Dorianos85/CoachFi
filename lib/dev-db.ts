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
  ensureProgressTables(db);
  return db;
}

function ensureProgressTables(database: DatabaseSync) {
  const tables = new Set(
    (database.prepare("select name from sqlite_master where type = 'table'").all() as Array<{ name: string }>).map(
      (table) => table.name,
    ),
  );
  if (!tables.has("certificates")) return;
  const certificateColumns = new Set(
    (database.prepare("pragma table_info(certificates)").all() as Array<{ name: string }>).map((column) => column.name),
  );
  if (!certificateColumns.has("minted")) {
    database.exec("alter table certificates add column minted integer not null default 0");
  }
  database.exec("update certificates set minted = 1 where status = 'owned' and ifnull(minted, 0) = 0");
  database.exec(`
    insert into progress (cdp_user_id, srs, learn_manual, tokens, streak)
    select cdp_user_id,
           json_extract(state, '$.srs'),
           json_extract(state, '$.learnManual'),
           json_extract(state, '$.tokens'),
           json_extract(state, '$.streak')
    from account_state
    where cdp_user_id not in (select cdp_user_id from progress)
      and (
        json_extract(state, '$.srs') is not null
        or json_extract(state, '$.learnManual') is not null
        or json_extract(state, '$.tokens') is not null
        or json_extract(state, '$.streak') is not null
      )
  `);
}

const isDirectRun = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const database = getDevDb();
  const tables = database
    .prepare("select name from sqlite_master where type = 'table' order by name")
    .all() as Array<{ name: string }>;
  console.log(`${devDbPath()} tables: ${tables.map((table) => table.name).join(", ")}`);
}
