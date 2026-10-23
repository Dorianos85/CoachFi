import { isAccountSyncKey, LOCAL_SYNC_MARKER_KEY, LOCAL_SYNC_MARKER_VALUE } from "@/lib/sync/local-sync-state";

export type SyncIssue = "unconfirmed" | "read-only" | "unavailable";
export const PERSONAL_STORAGE_KEYS = [
  "coachfi-user", "coachfi-avatar", "coachfi-voice", "coachfi-health-check", "coachfi-consent-v1", "coachfi-mode-v1",
  "coachfi-srs", "coachfi-learn-manual", "coachfi-tokens", "coachfi-streak", "coachfi-learning-rev",
  "coachfi-lesson-steps", "coachfi-agent-ms", "coachfi-challenge", "coachfi-crisis-actions",
  "coachfi-family-plan-actions-v1", "coachfi-vault", "coachfi-agent-text-only",
] as const;
export const DEVICE_STORAGE_KEYS = ["coachfi-locale-v1", "coachfi-accessibility-v1"] as const;
export type PersonalKey = (typeof PERSONAL_STORAGE_KEYS)[number];
export type StorageOwner = { readonly kind: "guest" } |
  { readonly kind: "account"; readonly provider: "cdp" | "supabase"; readonly userId: string };
export interface StorageOwnershipSnapshot {
  readonly status: "pending" | "ready";
  readonly owner: StorageOwner | null;
  readonly revision: number;
  readonly localOnly: boolean;
  readonly syncIssue?: SyncIssue;
  readonly failure?: "erase-failed";
}
export interface PersonalStorageHandle {
  readonly owner: StorageOwner | null;
  readonly revision: number;
  readonly area: "local" | "session";
  isCurrent(): boolean;
  getItem(key: string): string | null;
  setItem(key: string, value: string): boolean;
  removeItem(key: string): boolean;
  release(): void;
}
export interface StorageOwnerLease {
  readonly owner: StorageOwner;
  readonly revision: number;
  readonly storage: PersonalStorageHandle;
  readonly sessionStorage: PersonalStorageHandle;
  isCurrent(): boolean;
  publishReady(options?: { localOnly: boolean; syncIssue?: SyncIssue }): boolean;
  release(): void;
}
export const STORAGE_OWNER_CHANGED_EVENT = "coachfi-storage-owner";
const PERSONAL = new Set<string>(PERSONAL_STORAGE_KEYS);
const DEVICE = new Set<string>(DEVICE_STORAGE_KEYS);
const SERVER_SNAPSHOT: StorageOwnershipSnapshot = Object.freeze({ status: "pending", owner: null, revision: 0, localOnly: true });
let snapshot = SERVER_SNAPSHOT;
let initialized = false;
const listeners = new Set<() => void>();
interface HandleInfo { owner: StorageOwner | null; revision: number; allowPending: boolean; released: boolean }
const handles = new WeakMap<PersonalStorageHandle, HandleInfo>();

export function getStorageOwnershipSnapshot() { return snapshot; }
export function getStorageOwnershipServerSnapshot() { return SERVER_SNAPSHOT; }
export function subscribeStorageOwnership(listener: () => void) {
  listeners.add(listener); return () => { listeners.delete(listener); };
}
function announce() {
  for (const listener of [...listeners]) listener();
  if (typeof window !== "undefined") window.dispatchEvent(new Event(STORAGE_OWNER_CHANGED_EVENT));
}
function sameOwner(a: StorageOwner | null, b: StorageOwner | null) {
  return a !== null && b !== null && a.kind === b.kind && (a.kind === "guest" ||
    (b.kind === "account" && a.provider === b.provider && a.userId === b.userId));
}
function current(info: HandleInfo) {
  return !info.released && snapshot.revision === info.revision && sameOwner(snapshot.owner, info.owner) &&
    (info.allowPending || snapshot.status === "ready");
}
export function assertCurrentPersonalStorage(handle: PersonalStorageHandle): void {
  if (!handle.isCurrent()) throw new Error("Storage session changed");
}
function releaseScope(info: HandleInfo) {
  if (!current(info)) { info.released = true; return; }
  info.released = true;
  snapshot = Object.freeze({ status: "pending", owner: null, revision: snapshot.revision + 1, localOnly: true });
  announce();
}
function physicalKey(owner: StorageOwner, key: string) {
  return owner.kind === "guest" ? key : `coachfi-owned:v1:${owner.provider}:${encodeURIComponent(owner.userId)}:${key}`;
}
function storageFor(area: "local" | "session") {
  return typeof window === "undefined" ? null : area === "local" ? window.localStorage : window.sessionStorage;
}
function trackLocalMutation(info: HandleInfo, area: "local" | "session", key: string, storage: Storage) {
  if ((info.allowPending && snapshot.status === "pending") || area !== "local" || info.owner?.kind !== "account" ||
    !isAccountSyncKey(info.owner.provider, key)) return true;
  const markerKey = physicalKey(info.owner, LOCAL_SYNC_MARKER_KEY);
  const marker = storage.getItem(markerKey);
  if (!current(info)) return false;
  // Do not replace old revision bytes: their meaning and acknowledgement are unknown.
  if (marker === null) storage.setItem(markerKey, LOCAL_SYNC_MARKER_VALUE);
  return current(info);
}
function publishLocalMutation(info: HandleInfo, area: "local" | "session", key: string) {
  if (!current(info)) return false;
  if (!(info.allowPending && snapshot.status === "pending") && area === "local" && info.owner?.kind === "account" &&
    isAccountSyncKey(info.owner.provider, key) && (snapshot.localOnly !== true || snapshot.syncIssue !== "unconfirmed")) {
    snapshot = Object.freeze({ ...snapshot, localOnly: true, syncIssue: "unconfirmed" });
    announce();
  }
  return current(info);
}
function makeHandle(info: HandleInfo, area: "local" | "session"): PersonalStorageHandle {
  const handle: PersonalStorageHandle = Object.freeze({
    owner: info.owner, revision: info.revision, area,
    isCurrent: () => current(info),
    getItem: (key: string) => {
      if (!current(info) || !info.owner || (!PERSONAL.has(key) && !DEVICE.has(key))) return null;
      const storage = storageFor(area);
      if (!storage || !current(info)) return null;
      const value = storage.getItem(DEVICE.has(key) ? key : physicalKey(info.owner, key));
      return current(info) ? value : null;
    },
    setItem: (key: string, value: string) => {
      if (!current(info) || !info.owner || !PERSONAL.has(key)) return false;
      const storage = storageFor(area);
      if (!storage || !current(info)) return false;
      if (!trackLocalMutation(info, area, key, storage)) return false;
      storage.setItem(physicalKey(info.owner, key), value);
      return publishLocalMutation(info, area, key);
    },
    removeItem: (key: string) => {
      if (!current(info) || !info.owner || !PERSONAL.has(key)) return false;
      const storage = storageFor(area);
      if (!storage || !current(info)) return false;
      if (!trackLocalMutation(info, area, key, storage)) return false;
      storage.removeItem(physicalKey(info.owner, key));
      return publishLocalMutation(info, area, key);
    },
    // Releasing a captured view cannot release a later owner.
    release: () => { releaseScope(info); },
  });
  handles.set(handle, info); return handle;
}

/** No SDK or product-value read: unknown configured auth must resolve first. */
export function initializeStorageOwnership(authConfigured: boolean) {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  if (!authConfigured) beginStorageOwner({ kind: "guest" }).publishReady({ localOnly: true });
}
function lazyGuestWithoutConfiguredAuth() {
  if (initialized || typeof window === "undefined") return;
  const configured = !!process.env.NEXT_PUBLIC_CDP_PROJECT_ID?.trim() ||
    !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  initializeStorageOwnership(configured);
}
export function captureCurrentPersonalStorage(area: "local" | "session" = "local"): PersonalStorageHandle {
  lazyGuestWithoutConfiguredAuth();
  return makeHandle({ owner: snapshot.owner, revision: snapshot.revision, allowPending: false, released: false }, area);
}
export function beginStorageOwner(owner: StorageOwner): StorageOwnerLease {
  if (owner.kind !== "guest" && (owner.kind !== "account" || !owner.userId ||
    (owner.provider !== "supabase" && owner.provider !== "cdp"))) throw new Error("Invalid storage owner");
  const boundOwner: StorageOwner = Object.freeze({ ...owner });
  const revision = snapshot.revision + 1;
  const info: HandleInfo = { owner: boundOwner, revision, allowPending: true, released: false };
  const lease: StorageOwnerLease = Object.freeze({
    owner: boundOwner, revision, storage: makeHandle(info, "local"), sessionStorage: makeHandle(info, "session"),
    isCurrent: () => current(info),
    publishReady: (options?: { localOnly: boolean; syncIssue?: SyncIssue }) => {
      if (!current(info)) return false;
      snapshot = Object.freeze({ status: "ready", owner: boundOwner, revision,
        localOnly: boundOwner.kind === "guest" || options?.localOnly === true,
        ...(boundOwner.kind === "account" && options?.syncIssue ? { syncIssue: options.syncIssue } : {}) });
      announce(); return current(info);
    },
    release: () => { releaseScope(info); },
  });
  if (typeof window === "undefined") { info.released = true; return lease; }
  initialized = true;
  snapshot = Object.freeze({ status: "pending", owner: boundOwner, revision, localOnly: true });
  announce(); return lease;
}

/** Delete exact captured namespace in both areas; never switch to guest or touch auth/prefs. */
export function eraseCurrentPersonalData(expectedReadyHandle: PersonalStorageHandle): boolean {
  const info = handles.get(expectedReadyHandle);
  if (!info || !current(info) || snapshot.status !== "ready" || !info.owner) return false;
  const owner = info.owner;
  const revision = snapshot.revision + 1;
  const reserved = () => snapshot.revision === revision && snapshot.status === "pending" && sameOwner(snapshot.owner, owner);
  snapshot = Object.freeze({ status: "pending", owner, revision, localOnly: true });
  announce();
  if (!reserved()) return false;
  try {
    for (const area of ["local", "session"] as const) {
      const storage = storageFor(area);
      if (!reserved()) return false;
      if (!storage) throw new Error("Product storage unavailable");
      for (const key of PERSONAL_STORAGE_KEYS) {
        if (!reserved()) return false;
        storage.removeItem(physicalKey(owner, key));
        if (!reserved()) return false;
      }
    }
  } catch (error) {
    if (reserved()) {
      snapshot = Object.freeze({ ...snapshot, failure: "erase-failed" });
      announce();
    }
    throw error;
  }
  return reserved();
}
