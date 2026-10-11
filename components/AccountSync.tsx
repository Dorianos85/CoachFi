"use client";

import { useCurrentUser, useGetAccessToken, useIsInitialized, useIsSignedIn } from "@coinbase/cdp-hooks";
import { useEffect } from "react";

import { endLearningSession, syncSignedInAccount } from "@/lib/account-sync";
import { hideSavedProgress, setProgressVisible } from "@/lib/progress-visibility";

export function AccountSync() {
  const { isInitialized } = useIsInitialized();
  const { isSignedIn } = useIsSignedIn();
  const { currentUser } = useCurrentUser();
  const { getAccessToken } = useGetAccessToken();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isSignedIn || !currentUser) {
      hideSavedProgress();
      void endLearningSession();
      return;
    }
    void syncSignedInAccount(
      {
        id: currentUser.userId,
        email: currentUser.authenticationMethods.email?.email,
      },
      getAccessToken,
    )
      .then(() => {
        setProgressVisible(true);
        window.dispatchEvent(new Event("coachfi-tokens"));
        window.dispatchEvent(new Event("coachfi-learning"));
      })
      .catch((error: unknown) => {
        console.error("[account sync]", error instanceof Error ? error.message : error);
      });
  }, [currentUser, getAccessToken, isInitialized, isSignedIn]);

  return null;
}
