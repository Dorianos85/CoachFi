"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";

import { stopLearningSync, syncSignedInAccount } from "@/lib/account-sync";

export function AccountSync() {
  const { ready, authenticated, user, getAccessToken } = usePrivy();

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) {
      void stopLearningSync();
      return;
    }
    void syncSignedInAccount(user, getAccessToken).catch((error: unknown) => {
      console.error("[account sync]", error instanceof Error ? error.message : error);
    });
  }, [authenticated, getAccessToken, ready, user]);

  return null;
}
