"use client";

import { useCurrentUser, useGetAccessToken, useIsInitialized, useIsSignedIn } from "@coinbase/cdp-hooks";
import { useEffect, useRef } from "react";

import { endLearningSession } from "@/lib/account-sync";
import { bindAccountSession } from "@/lib/account-session";
import { setProgressVisible } from "@/lib/progress-visibility";

export function AccountSync() {
  const { isInitialized } = useIsInitialized();
  const { isSignedIn } = useIsSignedIn();
  const { currentUser } = useCurrentUser();
  const { getAccessToken } = useGetAccessToken();
  const userId = currentUser?.userId;
  const email = currentUser?.authenticationMethods.email?.email;
  const latest = useRef({ isInitialized, isSignedIn, userId, getAccessToken });
  latest.current = { isInitialized, isSignedIn, userId, getAccessToken };

  useEffect(() => {
    if (!isInitialized) return;
    if (!isSignedIn || !userId) {
      void endLearningSession();
      setProgressVisible(true);
      return;
    }
    const getter = async () => {
      const before = latest.current;
      if (!before.isInitialized || !before.isSignedIn || before.userId !== userId) return null;
      const token = await before.getAccessToken();
      const after = latest.current;
      return after.isInitialized && after.isSignedIn && after.userId === userId ? token : null;
    };
    const lease = bindAccountSession({ id: userId, email }, getter, {
      onReady: (owner) => {
        if (!owner.isCurrent()) return;
        setProgressVisible(true);
        window.dispatchEvent(new Event("coachfi-tokens"));
        if (owner.isCurrent()) window.dispatchEvent(new Event("coachfi-learning"));
      },
      // Protected owned data and read-only failures are ordinary local modes.
      // The ownership boundary displays their syncIssue; no sync success is emitted.
      onUnavailable: () => {},
    });
    return () => lease.dispose();
    // The getter delegates to the latest same-owner SDK function. Token refresh
    // must not release the storage lease or discard an owned UI draft.
  }, [userId, isInitialized, isSignedIn]);

  return null;
}
