"use client";

import { CDPReactProvider } from "@coinbase/cdp-react/components/CDPReactProvider";
import { useEffect } from "react";

import { AccountSync } from "@/components/AccountSync";
import { SignInGate } from "@/components/SignInGate";
import { ProductScopeBoundary } from "@/components/ProductScopeBoundary";
import { LanguageProvider } from "@/context/LanguageContext";
import { StreakProvider } from "@/context/StreakContext";
import { VoiceProvider } from "@/context/VoiceContext";
import { ConsentProvider } from "@/context/ConsentContext";
import { ModeProvider } from "@/context/ModeContext";
import { AuthProvider } from "@/context/AuthContext";
import { setProgressVisible } from "@/lib/progress-visibility";
import { initializeStorageOwnership } from "@/lib/product-storage";

const cdpProjectId = process.env.NEXT_PUBLIC_CDP_PROJECT_ID?.trim() ?? "";

export function Providers({ children }: { children: React.ReactNode }) {
  initializeStorageOwnership(Boolean(cdpProjectId ||
    (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)));
  useEffect(() => {
    if (!cdpProjectId) setProgressVisible(true);
  }, []);

  const personalContent = (
    <ProductScopeBoundary>
      <ConsentProvider>
        <ModeProvider>
          <StreakProvider>
            <VoiceProvider>
              {cdpProjectId && <SignInGate />}
              {children}
            </VoiceProvider>
          </StreakProvider>
        </ModeProvider>
      </ConsentProvider>
    </ProductScopeBoundary>
  );
  return (
    <LanguageProvider>
      <AuthProvider enabled={!cdpProjectId}>
        {cdpProjectId ? (
          <CDPReactProvider
            config={{
              projectId: cdpProjectId,
              appName: "Coach FI",
              authMethods: ["email", "oauth:google", "oauth:apple", "oauth:x", "oauth:telegram"],
              solana: { createOnLogin: false },
            }}
          >
            <AccountSync />
            {personalContent}
          </CDPReactProvider>
        ) : personalContent}
      </AuthProvider>
    </LanguageProvider>
  );
}
