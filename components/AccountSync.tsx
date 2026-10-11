"use client";

import { useCurrentUser, useGetAccessToken, useIsInitialized, useIsSignedIn } from "@coinbase/cdp-hooks";
import { useEffect } from "react";

import { stopLearningSync, syncSignedInAccount } from "@/lib/account-sync";

export function AccountSync() {
  const { isInitialized } = useIsInitialized();
  const { isSignedIn } = useIsSignedIn();
  const { currentUser } = useCurrentUser();
  const { getAccessToken } = useGetAccessToken();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isSignedIn || !currentUser) {
      void stopLearningSync();
      return;
    }
    void syncSignedInAccount(
      {
        id: currentUser.userId,
        email: currentUser.authenticationMethods.email?.email,
      },
      getAccessToken,
    ).catch((error: unknown) => {
      console.error("[account sync]", error instanceof Error ? error.message : error);
    });
  }, [currentUser, getAccessToken, isInitialized, isSignedIn]);

  return null;
}
