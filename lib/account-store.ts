import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getDevDb } from "@/lib/dev-db";
import { sanitizeAccountSnapshot, type AccountSnapshot } from "@/lib/account-snapshot";
import { getOptionalEnv } from "@/lib/server-env";

export interface AccountRecord {
  privyUserId: string;
  email: string | null;
  displayName: string | null;
  updatedAt: string;
  state: AccountSnapshot | null;
}

export interface AccountSave {
  state: AccountSnapshot;
  email?: string | null;
  displayName?: string | null;
}

type AccountRow = {
  privy_user_id: string;
  email: string | null;
  display_name: string | null;
  updated_at: string;
};

type StateRow = {
  state: unknown;
  updated_at: string;
};

export function accountStorageConfigured() {
  if (process.env.NODE_ENV !== "production") return true;
  return Boolean(getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") && getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

export async function getAccount(privyUserId: string) {
  if (process.env.NODE_ENV !== "production") return getSqliteAccount(privyUserId);
  const supabase = serviceClient();
  if (!supabase) throw new Error("Account storage is not configured");
  return getSupabaseAccount(supabase, privyUserId);
}

export async function saveAccount(privyUserId: string, input: AccountSave) {
  if (process.env.NODE_ENV !== "production") return saveSqliteAccount(privyUserId, input);
  const supabase = serviceClient();
  if (!supabase) throw new Error("Account storage is not configured");
  return saveSupabaseAccount(supabase, privyUserId, input);
}

export async function deleteAccount(privyUserId: string) {
  if (process.env.NODE_ENV !== "production") {
    deleteSqliteAccount(privyUserId);
    return;
  }
  const supabase = serviceClient();
  if (!supabase) throw new Error("Account storage is not configured");
  await deleteSupabaseAccount(supabase, privyUserId);
}

function serviceClient() {
  const url = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function asAccountRow(value: unknown): AccountRow | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<AccountRow>;
  if (typeof row.privy_user_id !== "string" || typeof row.updated_at !== "string") return null;
  return {
    privy_user_id: row.privy_user_id,
    email: typeof row.email === "string" ? row.email : null,
    display_name: typeof row.display_name === "string" ? row.display_name : null,
    updated_at: row.updated_at,
  };
}

function readState(value: unknown): AccountSnapshot | null {
  if (typeof value === "string") {
    try {
      return sanitizeAccountSnapshot(JSON.parse(value) as unknown);
    } catch {
      return null;
    }
  }
  return sanitizeAccountSnapshot(value);
}

function toRecord(account: AccountRow, state: unknown, stateUpdatedAt?: string): AccountRecord {
  return {
    privyUserId: account.privy_user_id,
    email: account.email,
    displayName: account.display_name,
    updatedAt: stateUpdatedAt ?? account.updated_at,
    state: readState(state),
  };
}

function getSqliteAccount(privyUserId: string): AccountRecord | null {
  const db = getDevDb();
  const account = asAccountRow(
    db.prepare("select privy_user_id, email, display_name, updated_at from accounts where privy_user_id = ?").get(privyUserId),
  );
  if (!account) return null;
  const stateRow = db.prepare("select state, updated_at from account_state where privy_user_id = ?").get(privyUserId) as
    | StateRow
    | undefined;
  return toRecord(account, stateRow?.state ?? null, stateRow?.updated_at);
}

function saveSqliteAccount(privyUserId: string, input: AccountSave): AccountRecord {
  const db = getDevDb();
  const existing = getSqliteAccount(privyUserId);
  const updatedAt = new Date().toISOString();
  const email = input.email === undefined ? existing?.email ?? null : input.email;
  const displayName = input.displayName === undefined ? existing?.displayName ?? null : input.displayName;
  const state = JSON.stringify(input.state);

  db.exec("begin immediate");
  try {
    db.prepare(
      `insert into accounts (privy_user_id, email, display_name, updated_at)
       values (?, ?, ?, ?)
       on conflict(privy_user_id) do update set
         email = excluded.email,
         display_name = excluded.display_name,
         updated_at = excluded.updated_at`,
    ).run(privyUserId, email, displayName, updatedAt);
    db.prepare(
      `insert into account_state (privy_user_id, state, updated_at)
       values (?, ?, ?)
       on conflict(privy_user_id) do update set
         state = excluded.state,
         updated_at = excluded.updated_at`,
    ).run(privyUserId, state, updatedAt);
    db.exec("commit");
  } catch (error) {
    db.exec("rollback");
    throw error;
  }

  const saved = getSqliteAccount(privyUserId);
  if (!saved) throw new Error("Account save did not persist");
  return saved;
}

function deleteSqliteAccount(privyUserId: string) {
  const db = getDevDb();
  db.exec("begin immediate");
  try {
    db.prepare("delete from account_state where privy_user_id = ?").run(privyUserId);
    db.prepare("delete from accounts where privy_user_id = ?").run(privyUserId);
    db.exec("commit");
  } catch (error) {
    db.exec("rollback");
    throw error;
  }
}

async function getSupabaseAccount(supabase: SupabaseClient, privyUserId: string): Promise<AccountRecord | null> {
  const { data, error } = await supabase
    .from("accounts")
    .select("privy_user_id, email, display_name, updated_at")
    .eq("privy_user_id", privyUserId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const account = asAccountRow(data);
  if (!account) return null;

  const stateResult = await supabase
    .from("account_state")
    .select("state, updated_at")
    .eq("privy_user_id", privyUserId)
    .maybeSingle();
  if (stateResult.error) throw new Error(stateResult.error.message);
  const stateRow = stateResult.data as StateRow | null;
  return toRecord(account, stateRow?.state ?? null, stateRow?.updated_at);
}

async function saveSupabaseAccount(supabase: SupabaseClient, privyUserId: string, input: AccountSave) {
  const existing = await getSupabaseAccount(supabase, privyUserId);
  const updatedAt = new Date().toISOString();
  const email = input.email === undefined ? existing?.email ?? null : input.email;
  const displayName = input.displayName === undefined ? existing?.displayName ?? null : input.displayName;

  const accountResult = await supabase.from("accounts").upsert(
    {
      privy_user_id: privyUserId,
      email,
      display_name: displayName,
      updated_at: updatedAt,
    },
    { onConflict: "privy_user_id" },
  );
  if (accountResult.error) throw new Error(accountResult.error.message);

  const stateResult = await supabase.from("account_state").upsert(
    {
      privy_user_id: privyUserId,
      state: input.state,
      updated_at: updatedAt,
    },
    { onConflict: "privy_user_id" },
  );
  if (stateResult.error) throw new Error(stateResult.error.message);

  const saved = await getSupabaseAccount(supabase, privyUserId);
  if (!saved) throw new Error("Account save did not persist");
  return saved;
}

async function deleteSupabaseAccount(supabase: SupabaseClient, privyUserId: string) {
  const stateResult = await supabase.from("account_state").delete().eq("privy_user_id", privyUserId);
  if (stateResult.error) throw new Error(stateResult.error.message);
  const accountResult = await supabase.from("accounts").delete().eq("privy_user_id", privyUserId);
  if (accountResult.error) throw new Error(accountResult.error.message);
}
