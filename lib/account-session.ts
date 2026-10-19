import { startLearningSession, type AccountTokenGetter, type LearningSession, type SignedInAccount } from "@/lib/account-sync";
import { setApiAccessTokenGetter } from "@/lib/client/api-credentials";
import { captureCurrentPersonalStorage } from "@/lib/product-storage";
import { hasUnconfirmedSyncMarker } from "@/lib/sync/local-sync-state";

/** Framework-free effect binding; onReady describes a read-only view, never a sync acknowledgment. */
export function bindAccountSession(user: SignedInAccount, getter: AccountTokenGetter,
  callbacks: { onReady: (lease: LearningSession) => void; onUnavailable?: () => void }) {
  const lease = startLearningSession(user, getter);
  if (!lease.isCurrent()) return lease;
  setApiAccessTokenGetter(async () => {
    if (!lease.isCurrent()) return null;
    const token = await getter();
    return lease.isCurrent() ? token : null;
  });
  void lease.ready.then((status) => {
    if (!lease.isCurrent()) return;
    if (status.status === "ready") {
      try {
        const marker = hasUnconfirmedSyncMarker(captureCurrentPersonalStorage());
        if (!lease.isCurrent()) return;
        if (marker) callbacks.onUnavailable?.();
        else callbacks.onReady(lease);
      } catch {
        if (lease.isCurrent()) callbacks.onUnavailable?.();
      }
    } else if (status.status === "unavailable") callbacks.onUnavailable?.();
  });
  return lease;
}
