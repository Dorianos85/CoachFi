"use client";

import { useCurrentUser, useGetAccessToken, useIsInitialized, useIsSignedIn } from "@coinbase/cdp-hooks";
import { useEffect } from "react";

import { endLearningSession, stopLearningSync, syncSignedInAccount } from "@/lib/account-sync";
import {
  claimProgressForAccount,
  isAccountProgress,
  releaseAccountProgress,
  setProgressVisible,
} from "@/lib/progress-visibility";

export function AccountSync() {
  const { isInitialized } = useIsInitialized();
  const { isSignedIn } = useIsSignedIn();
  const { currentUser } = useCurrentUser();
  const { getAccessToken } = useGetAccessToken();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isSignedIn || !currentUser) {
      if (isAccountProgress()) {
        // Progress on this device came from an account whose session is gone
        // (expired, or signed out elsewhere): clear it, then start fresh.
        void endLearningSession().finally(() => releaseAccountProgress());
      } else {
        // Anonymous tester: keep and show the progress earned on this device.
        void stopLearningSync();
        setProgressVisible(true);
      }
      return;
    }
    claimProgressForAccount();
    void syncSignedInAccount(
      {
        id: currentUser.userId,
        email: currentUser.authenticationMethods.email?.email,
      },
      getAccessToken,
    )
      .then(() => {
        setProgressVisible(true);
      })
      .catch((error: unknown) => {
        console.error("[account sync]", error instanceof Error ? error.message : error);
      });
  }, [currentUser, getAccessToken, isInitialized, isSignedIn]);

  return null;
}
