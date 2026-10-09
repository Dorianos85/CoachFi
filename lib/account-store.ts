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

export const CERTIFICATE_IDS = ["money-mindset", "saving-habit", "inflation-fighter"] as const;

export type CertificateId = (typeof CERTIFICATE_IDS)[number];
export type CertificateStatus = "owned" | "transferred";

export interface CertificateRecord {
  privyUserId: string;
  certificateId: CertificateId;
  status: CertificateStatus;
  assetAddress: string;
  ownerAddress: string;
  txHash: string | null;
  chainCheckedAt: string | null;
  updatedAt: string;
}

export interface CertificateSave {
  certificateId: CertificateId;
  status: CertificateStatus;
  assetAddress: string;
  ownerAddress: string;
  txHash?: string | null;
  chainCheckedAt?: string | null;
}

type CertificateRow = {
  privy_user_id: string;
  certificate_id: string;
  status: string;
  asset_address: string;
  owner_address: string;
  tx_hash: string | null;
  chain_checked_at: string | null;
  updated_at: string;
};

export async function listCertificates(privyUserId: string) {
  if (process.env.NODE_ENV !== "production") return listSqliteCertificates(privyUserId);
  const supabase = serviceClient();
  if (!supabase) throw new Error("Account storage is not configured");
  return listSupabaseCertificates(supabase, privyUserId);
}

export async function saveCertificate(privyUserId: string, input: CertificateSave) {
  const next = certificateWrite(input);
  if (process.env.NODE_ENV !== "production") return saveSqliteCertificate(privyUserId, next);
  const supabase = serviceClient();
  if (!supabase) throw new Error("Account storage is not configured");
  return saveSupabaseCertificate(supabase, privyUserId, next);
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
    db.prepare("delete from certificates where privy_user_id = ?").run(privyUserId);
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
  const certificateResult = await supabase.from("certificates").delete().eq("privy_user_id", privyUserId);
  if (certificateResult.error) throw new Error(certificateResult.error.message);
  const stateResult = await supabase.from("account_state").delete().eq("privy_user_id", privyUserId);
  if (stateResult.error) throw new Error(stateResult.error.message);
  const accountResult = await supabase.from("accounts").delete().eq("privy_user_id", privyUserId);
  if (accountResult.error) throw new Error(accountResult.error.message);
}

function isCertificateId(value: string): value is CertificateId {
  return (CERTIFICATE_IDS as readonly string[]).includes(value);
}

function isCertificateStatus(value: string): value is CertificateStatus {
  return value === "owned" || value === "transferred";
}

function requiredText(value: string, label: string) {
  const text = value.trim();
  if (!text || text.length > 128) throw new Error(`Invalid ${label}`);
  return text;
}

function optionalText(value: string | null | undefined, label: string) {
  if (value == null) return null;
  const text = value.trim();
  if (!text) return null;
  if (text.length > 128) throw new Error(`Invalid ${label}`);
  return text;
}

function certificateWrite(input: CertificateSave) {
  if (!isCertificateId(input.certificateId)) throw new Error("Invalid certificate");
  if (!isCertificateStatus(input.status)) throw new Error("Invalid certificate status");
  return {
    certificateId: input.certificateId,
    status: input.status,
    assetAddress: requiredText(input.assetAddress, "asset address"),
    ownerAddress: requiredText(input.ownerAddress, "owner address"),
    txHash: input.txHash === undefined ? undefined : optionalText(input.txHash, "transaction hash"),
    chainCheckedAt: input.chainCheckedAt === undefined ? undefined : optionalText(input.chainCheckedAt, "chain check time"),
  };
}

function asCertificateRow(value: unknown): CertificateRow | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<CertificateRow>;
  if (
    typeof row.privy_user_id !== "string" ||
    typeof row.certificate_id !== "string" ||
    typeof row.status !== "string" ||
    typeof row.asset_address !== "string" ||
    typeof row.owner_address !== "string" ||
    typeof row.updated_at !== "string"
  ) {
    return null;
  }
  return {
    privy_user_id: row.privy_user_id,
    certificate_id: row.certificate_id,
    status: row.status,
    asset_address: row.asset_address,
    owner_address: row.owner_address,
    tx_hash: typeof row.tx_hash === "string" ? row.tx_hash : null,
    chain_checked_at: typeof row.chain_checked_at === "string" ? row.chain_checked_at : null,
    updated_at: row.updated_at,
  };
}

function toCertificate(row: CertificateRow): CertificateRecord {
  if (!isCertificateId(row.certificate_id) || !isCertificateStatus(row.status)) {
    throw new Error("Invalid certificate row");
  }
  return {
    privyUserId: row.privy_user_id,
    certificateId: row.certificate_id,
    status: row.status,
    assetAddress: row.asset_address,
    ownerAddress: row.owner_address,
    txHash: row.tx_hash,
    chainCheckedAt: row.chain_checked_at,
    updatedAt: row.updated_at,
  };
}

function listSqliteCertificates(privyUserId: string) {
  const db = getDevDb();
  const rows = db
    .prepare(
      `select privy_user_id, certificate_id, status, asset_address, owner_address, tx_hash, chain_checked_at, updated_at
       from certificates
       where privy_user_id = ?
       order by certificate_id`,
    )
    .all(privyUserId) as unknown[];
  return rows.map((row) => {
    const parsed = asCertificateRow(row);
    if (!parsed) throw new Error("Invalid certificate row");
    return toCertificate(parsed);
  });
}

function saveSqliteCertificate(privyUserId: string, input: ReturnType<typeof certificateWrite>) {
  const db = getDevDb();
  const account = db.prepare("select privy_user_id from accounts where privy_user_id = ?").get(privyUserId);
  if (!account) throw new Error("Account not found");
  const existing = listSqliteCertificates(privyUserId).find((row) => row.certificateId === input.certificateId);
  const updatedAt = new Date().toISOString();
  const txHash = input.txHash === undefined ? existing?.txHash ?? null : input.txHash;
  const chainCheckedAt = input.chainCheckedAt === undefined ? existing?.chainCheckedAt ?? null : input.chainCheckedAt;

  db.prepare(
    `insert into certificates (
       privy_user_id, certificate_id, status, asset_address, owner_address, tx_hash, chain_checked_at, updated_at
     ) values (?, ?, ?, ?, ?, ?, ?, ?)
     on conflict(privy_user_id, certificate_id) do update set
       status = excluded.status,
       asset_address = excluded.asset_address,
       owner_address = excluded.owner_address,
       tx_hash = excluded.tx_hash,
       chain_checked_at = excluded.chain_checked_at,
       updated_at = excluded.updated_at`,
  ).run(
    privyUserId,
    input.certificateId,
    input.status,
    input.assetAddress,
    input.ownerAddress,
    txHash,
    chainCheckedAt,
    updatedAt,
  );

  const saved = listSqliteCertificates(privyUserId).find((row) => row.certificateId === input.certificateId);
  if (!saved) throw new Error("Certificate save did not persist");
  return saved;
}

async function listSupabaseCertificates(supabase: SupabaseClient, privyUserId: string) {
  const { data, error } = await supabase
    .from("certificates")
    .select("privy_user_id, certificate_id, status, asset_address, owner_address, tx_hash, chain_checked_at, updated_at")
    .eq("privy_user_id", privyUserId)
    .order("certificate_id");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const parsed = asCertificateRow(row);
    if (!parsed) throw new Error("Invalid certificate row");
    return toCertificate(parsed);
  });
}

async function saveSupabaseCertificate(
  supabase: SupabaseClient,
  privyUserId: string,
  input: ReturnType<typeof certificateWrite>,
) {
  const account = await getSupabaseAccount(supabase, privyUserId);
  if (!account) throw new Error("Account not found");
  const existing = (await listSupabaseCertificates(supabase, privyUserId)).find(
    (row) => row.certificateId === input.certificateId,
  );
  const updatedAt = new Date().toISOString();
  const txHash = input.txHash === undefined ? existing?.txHash ?? null : input.txHash;
  const chainCheckedAt = input.chainCheckedAt === undefined ? existing?.chainCheckedAt ?? null : input.chainCheckedAt;

  const { error } = await supabase.from("certificates").upsert(
    {
      privy_user_id: privyUserId,
      certificate_id: input.certificateId,
      status: input.status,
      asset_address: input.assetAddress,
      owner_address: input.ownerAddress,
      tx_hash: txHash,
      chain_checked_at: chainCheckedAt,
      updated_at: updatedAt,
    },
    { onConflict: "privy_user_id,certificate_id" },
  );
  if (error) throw new Error(error.message);

  const saved = (await listSupabaseCertificates(supabase, privyUserId)).find(
    (row) => row.certificateId === input.certificateId,
  );
  if (!saved) throw new Error("Certificate save did not persist");
  return saved;
}
