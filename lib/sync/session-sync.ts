import type { SyncEntity } from "@/lib/sync/syncQueue";
import { beginStorageOwner, subscribeStorageOwnership, type PersonalStorageHandle, type StorageOwnerLease, type SyncIssue } from "@/lib/product-storage";
import { hasUnconfirmedLocalData } from "@/lib/sync/local-sync-state";

export interface SyncSession {
  readonly userId: string;
  readonly signal: AbortSignal;
  readonly storage: PersonalStorageHandle;
  isCurrent(): boolean;
}

type Pusher = (entity: SyncEntity, payload?: unknown) => void;
interface SessionSyncOptions {
  sync: (session: SyncSession) => Promise<boolean>;
  push: (session: SyncSession, entity: SyncEntity, payload?: unknown) => Promise<void>;
  registerPusher: (pusher: Pusher | null) => void;
  onSynced: (session: SyncSession) => void;
  debounceMs?: number;
}

/** A local lifecycle fence, not server authorization or a transaction rollback. */
export function createSessionSyncController(options: SessionSyncOptions) {
  let generation = 0;
  let disposed = false;
  let current: { session: SyncSession; abort: AbortController; storageLease: StorageOwnerLease } | null = null;
  const timers = new Map<SyncEntity | "login", ReturnType<typeof setTimeout>>();

  const invalidate = () => {
    const revision = ++generation;
    const prior = current;
    current = null;
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
    options.registerPusher(null);
    prior?.storageLease.release();
    prior?.abort.abort();
    return revision;
  };
  const unsubscribe = subscribeStorageOwnership(() => {
    if (current && !current.storageLease.isCurrent()) invalidate();
  });

  const start = (userId: string | null): SyncSession | null => {
    if (disposed) return null;
    const revision = invalidate();
    // Abort listeners may reenter start; the later generation wins.
    if (disposed || revision !== generation) return null;
    if (!userId) {
      beginStorageOwner({ kind: "guest" }).publishReady({ localOnly: true });
      return null;
    }
    const storageLease = beginStorageOwner({ kind: "account", provider: "supabase", userId });
    if (disposed || revision !== generation || !storageLease.isCurrent()) return null;
    const abort = new AbortController();
    const session: SyncSession = {
      userId, signal: abort.signal, storage: storageLease.storage,
      isCurrent: () => !disposed && generation === revision && current?.session === session && storageLease.isCurrent(),
    };
    current = { session, abort, storageLease };
    const localOnly = (syncIssue: SyncIssue) => {
      if (!session.isCurrent()) return;
      abort.abort();
      if (session.isCurrent()) storageLease.publishReady({ localOnly: true, syncIssue });
    };
    const failedReadIssue = (): SyncIssue => {
      try { return hasUnconfirmedLocalData(session.storage) ? "unconfirmed" : "unavailable"; }
      catch { return "unavailable"; }
    };
    // Existing own bytes have no durable acknowledgement provenance. Preserve
    // them without even starting reads; guest namespaces are never inspected.
    try {
      if (hasUnconfirmedLocalData(session.storage)) {
        localOnly("unconfirmed");
        return session;
      }
    } catch {
      localOnly("unavailable");
      return session;
    }
    // A macrotask lets onAuthStateChange release the SDK lock first.
    timers.set("login", setTimeout(() => {
      timers.delete("login");
      if (!session.isCurrent()) return;
      void (async () => {
        try {
          const synced = await options.sync(session);
          if (!session.isCurrent()) return;
          if (!synced) { localOnly(failedReadIssue()); return; }
          // Hydration is an initial read, not acknowledgement of local changes.
          // No automatic pusher, retries or cloud-success event are installed.
          localOnly("read-only");
        } catch {
          // Abort remaining reads; do not emit success or install a pusher.
          localOnly(failedReadIssue());
        }
      })();
    }, 0));
    return session;
  };

  return {
    start,
    getCurrent: () => current?.session.isCurrent() ? current.session : null,
    invalidate: () => { invalidate(); },
    dispose: () => { disposed = true; unsubscribe(); invalidate(); },
  };
}
