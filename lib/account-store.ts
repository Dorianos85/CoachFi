import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getDevDb } from "@/lib/dev-db";
import { sanitizeAccountSnapshot, type AccountSnapshot } from "@/lib/account-snapshot";
import { getOptionalEnv } from "@/lib/server-env";

export interface AccountRecord {
  cdpUserId: string;
  email: string | null;
  displayName: string | null;
  solanaAddress: string | null;
  evmAddress: string | null;
  authProvider: string | null;
  cdpCreatedAt: string | null;
  lastAuthenticatedAt: string | null;
  updatedAt: string;
  state: AccountSnapshot | null;
}

export type CdpIdentitySave = {
  email: string | null;
  name: string | null;
  solanaAddress: string | null;
  evmAddress: string | null;
  authProvider: string | null;
  cdpCreatedAt: string | null;
  lastAuthenticatedAt: string | null;
  profileJson: string;
};

export interface AccountSave {
  state: AccountSnapshot;
  email?: string | null;
  displayName?: string | null;
}

type AccountRow = {
  cdp_user_id: string;
  email: string | null;
  display_name: string | null;
  solana_address: string | null;
  evm_address: string | null;
  auth_provider: string | null;
  cdp_created_at: string | null;
  last_authenticated_at: string | null;
  updated_at: string;
};

const ACCOUNT_COLUMNS =
  "cdp_user_id, email, display_name, solana_address, evm_address, auth_provider, cdp_created_at, last_authenticated_at, updated_at";

type StateRow = {
  state: unknown;
  updated_at: string;
};

export function accountStorageConfigured() {
  if (process.env.NODE_ENV !== "production") return true;
  return Boolean(getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") && getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

export async function getAccount(cdpUserId: string) {
  if (process.env.NODE_ENV !== "production") return getSqliteAccount(cdpUserId);
  const supabase = serviceClient();
  if (!supabase) throw new Error("Account storage is not configured");
  return getSupabaseAccount(supabase, cdpUserId);
}

export async function saveAccount(cdpUserId: string, input: AccountSave) {
  if (process.env.NODE_ENV !== "production") return saveSqliteAccount(cdpUserId, input);
  const supabase = serviceClient();
  if (!supabase) throw new Error("Account storage is not configured");
  return saveSupabaseAccount(supabase, cdpUserId, input);
}

export async function saveCdpIdentity(cdpUserId: string, identity: CdpIdentitySave) {
  if (process.env.NODE_ENV !== "production") {
    saveSqliteIdentity(cdpUserId, identity);
    return;
  }
  const supabase = serviceClient();
  if (!supabase) throw new Error("Account storage is not configured");
  await saveSupabaseIdentity(supabase, cdpUserId, identity);
}

export async function deleteAccount(cdpUserId: string) {
  if (process.env.NODE_ENV !== "production") {
    deleteSqliteAccount(cdpUserId);
    return;
  }
  const supabase = serviceClient();
  if (!supabase) throw new Error("Account storage is not configured");
  await deleteSupabaseAccount(supabase, cdpUserId);
}

export const CERTIFICATE_IDS = ["money-mindset", "saving-habit", "inflation-fighter"] as const;

export type CertificateId = (typeof CERTIFICATE_IDS)[number];
export type CertificateStatus = "owned" | "transferred";

export interface CertificateRecord {
  cdpUserId: string;
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
  cdp_user_id: string;
  certificate_id: string;
  status: string;
  asset_address: string;
  owner_address: string;
  tx_hash: string | null;
  chain_checked_at: string | null;
  updated_at: string;
};

export async function listCertificates(cdpUserId: string) {
  if (process.env.NODE_ENV !== "production") return listSqliteCertificates(cdpUserId);
  const supabase = serviceClient();
  if (!supabase) throw new Error("Account storage is not configured");
  return listSupabaseCertificates(supabase, cdpUserId);
}

export async function saveCertificate(cdpUserId: string, input: CertificateSave) {
  const next = certificateWrite(input);
  if (process.env.NODE_ENV !== "production") return saveSqliteCertificate(cdpUserId, next);
  const supabase = serviceClient();
  if (!supabase) throw new Error("Account storage is not configured");
  return saveSupabaseCertificate(supabase, cdpUserId, next);
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
  if (typeof row.cdp_user_id !== "string" || typeof row.updated_at !== "string") return null;
  return {
    cdp_user_id: row.cdp_user_id,
    email: typeof row.email === "string" ? row.email : null,
    display_name: typeof row.display_name === "string" ? row.display_name : null,
    solana_address: typeof row.solana_address === "string" ? row.solana_address : null,
    evm_address: typeof row.evm_address === "string" ? row.evm_address : null,
    auth_provider: typeof row.auth_provider === "string" ? row.auth_provider : null,
    cdp_created_at: typeof row.cdp_created_at === "string" ? row.cdp_created_at : null,
    last_authenticated_at: typeof row.last_authenticated_at === "string" ? row.last_authenticated_at : null,
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
    cdpUserId: account.cdp_user_id,
    email: account.email,
    displayName: account.display_name,
    solanaAddress: account.solana_address,
    evmAddress: account.evm_address,
    authProvider: account.auth_provider,
    cdpCreatedAt: account.cdp_created_at,
    lastAuthenticatedAt: account.last_authenticated_at,
    updatedAt: stateUpdatedAt ?? account.updated_at,
    state: readState(state),
  };
}

function getSqliteAccount(cdpUserId: string): AccountRecord | null {
  const db = getDevDb();
  const account = asAccountRow(
    db.prepare(`select ${ACCOUNT_COLUMNS} from accounts where cdp_user_id = ?`).get(cdpUserId),
  );
  if (!account) return null;
  const stateRow = db.prepare("select state, updated_at from account_state where cdp_user_id = ?").get(cdpUserId) as
    | StateRow
    | undefined;
  return toRecord(account, stateRow?.state ?? null, stateRow?.updated_at);
}

function saveSqliteAccount(cdpUserId: string, input: AccountSave): AccountRecord {
  const db = getDevDb();
  const existing = getSqliteAccount(cdpUserId);
  const updatedAt = new Date().toISOString();
  const email = input.email === undefined ? existing?.email ?? null : input.email;
  const displayName = input.displayName === undefined ? existing?.displayName ?? null : input.displayName;
  const state = JSON.stringify(input.state);

  db.exec("begin immediate");
  try {
    db.prepare(
      `insert into accounts (cdp_user_id, email, display_name, updated_at)
       values (?, ?, ?, ?)
       on conflict(cdp_user_id) do update set
         email = excluded.email,
         display_name = excluded.display_name,
         updated_at = excluded.updated_at`,
    ).run(cdpUserId, email, displayName, updatedAt);
    db.prepare(
      `insert into account_state (cdp_user_id, state, updated_at)
       values (?, ?, ?)
       on conflict(cdp_user_id) do update set
         state = excluded.state,
         updated_at = excluded.updated_at`,
    ).run(cdpUserId, state, updatedAt);
    db.exec("commit");
  } catch (error) {
    db.exec("rollback");
    throw error;
  }

  const saved = getSqliteAccount(cdpUserId);
  if (!saved) throw new Error("Account save did not persist");
  return saved;
}

function saveSqliteIdentity(cdpUserId: string, identity: CdpIdentitySave) {
  const db = getDevDb();
  db.prepare(
    `insert into accounts (
       cdp_user_id, email, display_name, solana_address, evm_address, auth_provider,
       cdp_created_at, last_authenticated_at, cdp_profile
     ) values (?, ?, ?, ?, ?, ?, ?, ?, ?)
     on conflict(cdp_user_id) do update set
       email = coalesce(excluded.email, accounts.email),
       display_name = coalesce(nullif(accounts.display_name, ''), excluded.display_name),
       solana_address = coalesce(excluded.solana_address, accounts.solana_address),
       evm_address = coalesce(excluded.evm_address, accounts.evm_address),
       auth_provider = coalesce(excluded.auth_provider, accounts.auth_provider),
       cdp_created_at = coalesce(excluded.cdp_created_at, accounts.cdp_created_at),
       last_authenticated_at = coalesce(excluded.last_authenticated_at, accounts.last_authenticated_at),
       cdp_profile = excluded.cdp_profile`,
  ).run(
    cdpUserId,
    identity.email,
    identity.name,
    identity.solanaAddress,
    identity.evmAddress,
    identity.authProvider,
    identity.cdpCreatedAt,
    identity.lastAuthenticatedAt,
    identity.profileJson,
  );
}

function deleteSqliteAccount(cdpUserId: string) {
  const db = getDevDb();
  db.exec("begin immediate");
  try {
    db.prepare("delete from certificates where cdp_user_id = ?").run(cdpUserId);
    db.prepare("delete from account_state where cdp_user_id = ?").run(cdpUserId);
    db.prepare("delete from accounts where cdp_user_id = ?").run(cdpUserId);
    db.exec("commit");
  } catch (error) {
    db.exec("rollback");
    throw error;
  }
}

async function getSupabaseAccount(supabase: SupabaseClient, cdpUserId: string): Promise<AccountRecord | null> {
  const { data, error } = await supabase
    .from("accounts")
    .select(ACCOUNT_COLUMNS)
    .eq("cdp_user_id", cdpUserId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const account = asAccountRow(data);
  if (!account) return null;

  const stateResult = await supabase
    .from("account_state")
    .select("state, updated_at")
    .eq("cdp_user_id", cdpUserId)
    .maybeSingle();
  if (stateResult.error) throw new Error(stateResult.error.message);
  const stateRow = stateResult.data as StateRow | null;
  return toRecord(account, stateRow?.state ?? null, stateRow?.updated_at);
}

async function saveSupabaseAccount(supabase: SupabaseClient, cdpUserId: string, input: AccountSave) {
  const existing = await getSupabaseAccount(supabase, cdpUserId);
  const updatedAt = new Date().toISOString();
  const email = input.email === undefined ? existing?.email ?? null : input.email;
  const displayName = input.displayName === undefined ? existing?.displayName ?? null : input.displayName;

  const accountResult = await supabase.from("accounts").upsert(
    {
      cdp_user_id: cdpUserId,
      email,
      display_name: displayName,
      updated_at: updatedAt,
    },
    { onConflict: "cdp_user_id" },
  );
  if (accountResult.error) throw new Error(accountResult.error.message);

  const stateResult = await supabase.from("account_state").upsert(
    {
      cdp_user_id: cdpUserId,
      state: input.state,
      updated_at: updatedAt,
    },
    { onConflict: "cdp_user_id" },
  );
  if (stateResult.error) throw new Error(stateResult.error.message);

  const saved = await getSupabaseAccount(supabase, cdpUserId);
  if (!saved) throw new Error("Account save did not persist");
  return saved;
}

async function saveSupabaseIdentity(supabase: SupabaseClient, cdpUserId: string, identity: CdpIdentitySave) {
  const existing = await getSupabaseAccount(supabase, cdpUserId);
  const result = await supabase.from("accounts").upsert(
    {
      cdp_user_id: cdpUserId,
      email: identity.email ?? existing?.email ?? null,
      display_name: existing?.displayName || identity.name,
      solana_address: identity.solanaAddress ?? existing?.solanaAddress ?? null,
      evm_address: identity.evmAddress ?? existing?.evmAddress ?? null,
      auth_provider: identity.authProvider ?? existing?.authProvider ?? null,
      cdp_created_at: identity.cdpCreatedAt ?? existing?.cdpCreatedAt ?? null,
      last_authenticated_at: identity.lastAuthenticatedAt ?? existing?.lastAuthenticatedAt ?? null,
      cdp_profile: JSON.parse(identity.profileJson) as unknown,
    },
    { onConflict: "cdp_user_id" },
  );
  if (result.error) throw new Error(result.error.message);
}

async function deleteSupabaseAccount(supabase: SupabaseClient, cdpUserId: string) {
  const certificateResult = await supabase.from("certificates").delete().eq("cdp_user_id", cdpUserId);
  if (certificateResult.error) throw new Error(certificateResult.error.message);
  const stateResult = await supabase.from("account_state").delete().eq("cdp_user_id", cdpUserId);
  if (stateResult.error) throw new Error(stateResult.error.message);
  const accountResult = await supabase.from("accounts").delete().eq("cdp_user_id", cdpUserId);
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
    typeof row.cdp_user_id !== "string" ||
    typeof row.certificate_id !== "string" ||
    typeof row.status !== "string" ||
    typeof row.asset_address !== "string" ||
    typeof row.owner_address !== "string" ||
    typeof row.updated_at !== "string"
  ) {
    return null;
  }
  return {
    cdp_user_id: row.cdp_user_id,
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
    cdpUserId: row.cdp_user_id,
    certificateId: row.certificate_id,
    status: row.status,
    assetAddress: row.asset_address,
    ownerAddress: row.owner_address,
    txHash: row.tx_hash,
    chainCheckedAt: row.chain_checked_at,
    updatedAt: row.updated_at,
  };
}

function listSqliteCertificates(cdpUserId: string) {
  const db = getDevDb();
  const rows = db
    .prepare(
      `select cdp_user_id, certificate_id, status, asset_address, owner_address, tx_hash, chain_checked_at, updated_at
       from certificates
       where cdp_user_id = ?
       order by certificate_id`,
    )
    .all(cdpUserId) as unknown[];
  return rows.map((row) => {
    const parsed = asCertificateRow(row);
    if (!parsed) throw new Error("Invalid certificate row");
    return toCertificate(parsed);
  });
}

function saveSqliteCertificate(cdpUserId: string, input: ReturnType<typeof certificateWrite>) {
  const db = getDevDb();
  const account = db.prepare("select cdp_user_id from accounts where cdp_user_id = ?").get(cdpUserId);
  if (!account) throw new Error("Account not found");
  const existing = listSqliteCertificates(cdpUserId).find((row) => row.certificateId === input.certificateId);
  const updatedAt = new Date().toISOString();
  const txHash = input.txHash === undefined ? existing?.txHash ?? null : input.txHash;
  const chainCheckedAt = input.chainCheckedAt === undefined ? existing?.chainCheckedAt ?? null : input.chainCheckedAt;

  db.prepare(
    `insert into certificates (
       cdp_user_id, certificate_id, status, asset_address, owner_address, tx_hash, chain_checked_at, updated_at
     ) values (?, ?, ?, ?, ?, ?, ?, ?)
     on conflict(cdp_user_id, certificate_id) do update set
       status = excluded.status,
       asset_address = excluded.asset_address,
       owner_address = excluded.owner_address,
       tx_hash = excluded.tx_hash,
       chain_checked_at = excluded.chain_checked_at,
       updated_at = excluded.updated_at`,
  ).run(
    cdpUserId,
    input.certificateId,
    input.status,
    input.assetAddress,
    input.ownerAddress,
    txHash,
    chainCheckedAt,
    updatedAt,
  );

  const saved = listSqliteCertificates(cdpUserId).find((row) => row.certificateId === input.certificateId);
  if (!saved) throw new Error("Certificate save did not persist");
  return saved;
}

async function listSupabaseCertificates(supabase: SupabaseClient, cdpUserId: string) {
  const { data, error } = await supabase
    .from("certificates")
    .select("cdp_user_id, certificate_id, status, asset_address, owner_address, tx_hash, chain_checked_at, updated_at")
    .eq("cdp_user_id", cdpUserId)
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
  cdpUserId: string,
  input: ReturnType<typeof certificateWrite>,
) {
  const account = await getSupabaseAccount(supabase, cdpUserId);
  if (!account) throw new Error("Account not found");
  const existing = (await listSupabaseCertificates(supabase, cdpUserId)).find(
    (row) => row.certificateId === input.certificateId,
  );
  const updatedAt = new Date().toISOString();
  const txHash = input.txHash === undefined ? existing?.txHash ?? null : input.txHash;
  const chainCheckedAt = input.chainCheckedAt === undefined ? existing?.chainCheckedAt ?? null : input.chainCheckedAt;

  const { error } = await supabase.from("certificates").upsert(
    {
      cdp_user_id: cdpUserId,
      certificate_id: input.certificateId,
      status: input.status,
      asset_address: input.assetAddress,
      owner_address: input.ownerAddress,
      tx_hash: txHash,
      chain_checked_at: chainCheckedAt,
      updated_at: updatedAt,
    },
    { onConflict: "cdp_user_id,certificate_id" },
  );
  if (error) throw new Error(error.message);

  const saved = (await listSupabaseCertificates(supabase, cdpUserId)).find(
    (row) => row.certificateId === input.certificateId,
  );
  if (!saved) throw new Error("Certificate save did not persist");
  return saved;
}
