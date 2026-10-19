import { sanitizeAccountSnapshot, type AccountSnapshot } from "@/lib/account-snapshot";
import { setApiAccessTokenGetter } from "@/lib/client/api-credentials";
import { setProgressVisible } from "@/lib/progress-visibility";
import { beginStorageOwner, captureCurrentPersonalStorage, subscribeStorageOwnership,
  type PersonalStorageHandle, type StorageOwnerLease } from "@/lib/product-storage";
import { learningStorageWrites, type LearningField } from "@/lib/learning-state";
import { hasUnconfirmedLocalData, hasUnconfirmedSyncMarker } from "@/lib/sync/local-sync-state";

export type AccountTokenGetter = () => Promise<string | null>;
export interface SignedInAccount { id: string; email?: string }
export type LearningSyncIssue = "read-only" | "unconfirmed" | "unavailable";
export interface LearningSyncResult {
  status: "ready" | "stopped" | "unavailable";
  userId: string;
  generation: number;
  syncIssue?: LearningSyncIssue;
}
export interface LearningSession {
  readonly userId: string;
  readonly generation: number;
  readonly ready: Promise<LearningSyncResult>;
  isCurrent(): boolean;
  dispose(): void;
}
interface SessionContext {
  user: SignedInAccount; getter: AccountTokenGetter; generation: number; controller: AbortController;
  storageLease: StorageOwnerLease; syncIssue: LearningSyncIssue;
}
let active: SessionContext | null = null;
let resumable: SessionContext | null = null;
let generation = 0;
const leases = new WeakMap<LearningSession, SessionContext>();
class StoppedSession extends Error {}
const current = (context: SessionContext) => active === context && !context.controller.signal.aborted && context.storageLease.isCurrent();
subscribeStorageOwnership(() => {
  if (active && !active.storageLease.isCurrent()) close(active, false);
});
function fence(context: SessionContext) { if (!current(context)) throw new StoppedSession(); }
/** The SDK may ignore cancellation; discard its result and release our wait immediately. */
function waitForSession<T>(context: SessionContext, factory: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const signal = context.controller.signal;
    const onAbort = () => { signal.removeEventListener("abort", onAbort); reject(new StoppedSession()); };
    if (!current(context)) { reject(new StoppedSession()); return; }
    signal.addEventListener("abort", onAbort, { once: true });
    let pending: Promise<T>;
    try { fence(context); pending = factory(); }
    catch (error) { signal.removeEventListener("abort", onAbort); reject(error); return; }
    pending.then((value) => {
      signal.removeEventListener("abort", onAbort);
      if (current(context)) resolve(value); else reject(new StoppedSession());
    }, (error: unknown) => { signal.removeEventListener("abort", onAbort); reject(error); });
  });
}
function result(context: SessionContext, status: LearningSyncResult["status"]): LearningSyncResult {
  return { status, userId: context.user.id, generation: context.generation,
    ...(status === "stopped" ? {} : { syncIssue: context.syncIssue }) };
}
function protectsLocalData(context: SessionContext, markerOnly = false) {
  fence(context);
  const protectedData = markerOnly ? hasUnconfirmedSyncMarker(context.storageLease.storage) :
    hasUnconfirmedLocalData(context.storageLease.storage);
  fence(context);
  if (protectedData) context.syncIssue = "unconfirmed";
  return protectedData;
}

/** Existing owned learning/markers remain byte-for-byte local; empty owners may read cloud. */
export function startLearningSession(user: SignedInAccount, getter: AccountTokenGetter): LearningSession {
  const epoch = active ? close(active, true) : ++generation;
  // abort/cleanup callbacks can start a newer session synchronously.
  if (generation !== epoch || active) return stoppedLease(user, epoch);
  resumable = null;
  const storageLease = beginStorageOwner({ kind: "account", provider: "cdp", userId: user.id });
  if (generation !== epoch || active || !storageLease.isCurrent()) return stoppedLease(user, epoch);
  const context: SessionContext = {
    user: { ...user }, getter, generation: epoch, controller: new AbortController(),
    storageLease, syncIssue: "read-only",
  };
  active = context;
  setProgressVisible(false);
  const finishUnavailable = () => {
    if (!current(context)) return result(context, "stopped");
    // Also protect a local write that appeared while token/GET/error work was pending.
    try { protectsLocalData(context); }
    catch {
      if (!current(context)) return result(context, "stopped");
      // Blocked storage cannot prove an empty or acknowledged local account.
      context.syncIssue = "unconfirmed";
    }
    if (context.syncIssue !== "unconfirmed") context.syncIssue = "unavailable";
    if (!context.storageLease.publishReady({ localOnly: true, syncIssue: context.syncIssue }) || !current(context)) {
      return result(context, "stopped");
    }
    setProgressVisible(true);
    return result(context, "unavailable");
  };
  // Defer until this lease is installed; all async completions remain fenced.
  const ready = Promise.resolve().then(() => pull(context)).then(
    (status) => status === "unavailable" ? finishUnavailable() : result(context, current(context) ? status : "stopped"),
    (error: unknown) => error instanceof StoppedSession || !current(context) ? result(context, "stopped") : finishUnavailable(),
  );
  const lease: LearningSession = { userId: user.id, generation: context.generation, ready,
    isCurrent: () => current(context), dispose: () => { if (current(context)) close(context, true); } };
  leases.set(lease, context);
  return lease;
}
function stoppedLease(user: SignedInAccount, epoch: number): LearningSession {
  return { userId: user.id, generation: epoch,
    ready: Promise.resolve({ status: "stopped", userId: user.id, generation: epoch }),
    isCurrent: () => false, dispose: () => {} };
}

/** "ready" is a read-only local view, never an upload acknowledgment. */
export function syncSignedInAccount(user: SignedInAccount, getter: AccountTokenGetter) {
  return startLearningSession(user, getter).ready;
}

function close(context: SessionContext, allowSameOwnerResume: boolean) {
  if (active !== context) return generation;
  active = null; const epoch = ++generation;
  // Retain only the detached lease for an explicit logout; no dirty payload replay.
  resumable = allowSameOwnerResume ? context : null;
  setApiAccessTokenGetter(null);
  setProgressVisible(false);
  // All global state is settled before abort listeners can start another identity.
  context.storageLease.release();
  context.controller.abort();
  return epoch;
}
function expectedContext(lease?: LearningSession) { return lease ? leases.get(lease) ?? null : active ?? resumable; }
function discardResume(context: SessionContext): number | null {
  if (active || resumable !== context) return null;
  resumable = null; const epoch = ++generation;
  setApiAccessTokenGetter(null); setProgressVisible(false);
  return epoch;
}

/** Stop is immediate and never schedules a final snapshot/flush. */
export function stopLearningSync(lease?: LearningSession): Promise<void> {
  const context = expectedContext(lease);
  if (context && current(context)) close(context, false);
  else if (context) discardResume(context);
  return Promise.resolve();
}
/** Logout detaches the account and restores untouched guest keys; no automatic deletion. */
export function endLearningSession(lease?: LearningSession, storage?: PersonalStorageHandle): Promise<void> {
  if (storage && !storage.isCurrent()) return Promise.resolve();
  const context = expectedContext(lease);
  if (!context) {
    if (!lease) beginStorageOwner({ kind: "guest" }).publishReady({ localOnly: true });
    return Promise.resolve();
  }
  if (storage && storage.revision !== context.storageLease.revision) return Promise.resolve();
  const epoch = current(context) ? close(context, false) : discardResume(context);
  if (epoch !== null && generation === epoch && !active) beginStorageOwner({ kind: "guest" }).publishReady({ localOnly: true });
  return Promise.resolve();
}

/** Optional current-account local cleanup only; remote name writes are disabled. */
export async function clearSignedInName(lease?: LearningSession, storage = captureCurrentPersonalStorage()) {
  if (!storage.isCurrent() || storage.owner?.kind !== "account") return;
  const context = lease ? leases.get(lease) : null;
  if (lease && (!context || !current(context))) return;
  if (!lease && active) return;
  if (typeof window === "undefined") return;
  try {
    const raw = storage.getItem("coachfi-user");
    if (!raw) return;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value) || !storage.isCurrent()) return;
    if (!storage.setItem("coachfi-user", JSON.stringify({ ...value, name: "" }))) return;
    if (storage.isCurrent()) window.dispatchEvent(new Event("coachfi-user"));
  } catch { console.error("[account sync] local name cleanup failed"); }
}

/** B15 has no automatic upload/replay/ack. Public account writes persist their marker in the adapter. */
export function persistLearningState(_field: LearningField, _storage?: PersonalStorageHandle): void {}

async function pull(context: SessionContext): Promise<LearningSyncResult["status"]> {
  if (protectsLocalData(context)) return "unavailable";
  const token = await waitForSession(context, () => context.getter()); fence(context);
  if (!token) return "unavailable";
  if (protectsLocalData(context)) return "unavailable";
  const remote = await accountRequest(context, token); fence(context);
  if (remote.configured === false) return "unavailable";
  if (remote.ok === false) throw new Error("Account read failed");
  // Another same-owner local writer can arrive while GET is pending.
  if (protectsLocalData(context)) return "unavailable";
  if (!applyLearningState(context, remote.state ?? { version: 1 })) return "unavailable";
  fence(context);
  return protectsLocalData(context, true) ? "unavailable" : "ready";
}

function applyLearningState(context: SessionContext, state: AccountSnapshot): boolean {
  fence(context);
  if (typeof window === "undefined") return false;
  for (const write of learningStorageWrites(state)) {
    // Private hydration does not add a marker itself. Check before each mutation
    // so a reentrant public writer's write-ahead marker stops later hydration.
    if (protectsLocalData(context, true)) return false;
    if (write.value === null ? !context.storageLease.storage.removeItem(write.key) :
      !context.storageLease.storage.setItem(write.key, write.value)) throw new StoppedSession();
    fence(context);
  }
  if (protectsLocalData(context, true)) return false;
  if (!context.storageLease.publishReady({ localOnly: true, syncIssue: "read-only" })) throw new StoppedSession();
  fence(context); setProgressVisible(true);
  for (const type of ["coachfi-tokens", "coachfi-learning"]) {
    if (protectsLocalData(context, true)) return false;
    window.dispatchEvent(new Event(type)); fence(context);
  }
  return !protectsLocalData(context, true);
}

interface AccountPayload { ok?: boolean; configured?: boolean; account?: unknown; state?: AccountSnapshot | null }
/** There is deliberately no PUT method/body path until an atomic server contract is approved. */
async function accountRequest(context: SessionContext, token: string): Promise<AccountPayload> {
  fence(context);
  const response = await waitForSession(context, () => fetch("/api/account", { method: "GET", signal: context.controller.signal,
    headers: { authorization: `Bearer ${token}`, "x-coachfi-account-user-id": context.user.id } }));
  fence(context);
  const payload: unknown = await waitForSession(context, () => response.json()); fence(context);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Malformed account response");
  const record = payload as Record<string, unknown>;
  if (!response.ok || record.ok === false) return { ok: false, configured: record.configured === false ? false : undefined };
  if (record.configured === false) return { configured: false };
  if (!("account" in record && "state" in record)) throw new Error("Incomplete account response");
  const account = record.account;
  if (account && typeof account === "object" && "cdpUserId" in account && account.cdpUserId !== context.user.id) throw new Error("Account session changed");
  const state = record.state === null || record.state === undefined ? null : sanitizeAccountSnapshot(record.state);
  if (record.state !== null && record.state !== undefined && !state) throw new Error("Invalid account state");
  return { ok: true, configured: true, account, state };
}
