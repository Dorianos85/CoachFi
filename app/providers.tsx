"use client";

import { CDPReactProvider } from "@coinbase/cdp-react/components/CDPReactProvider";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { clusterApiUrl } from "@solana/web3.js";
import { useMemo } from "react";

import { AccountSync } from "@/components/AccountSync";
import { SignInGate } from "@/components/SignInGate";
import { LanguageProvider } from "@/context/LanguageContext";
import { StreakProvider } from "@/context/StreakContext";
import { VoiceProvider } from "@/context/VoiceContext";
import { ConsentProvider } from "@/context/ConsentContext";

const cdpProjectId = process.env.NEXT_PUBLIC_CDP_PROJECT_ID?.trim() ?? "";

export function Providers({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => clusterApiUrl(WalletAdapterNetwork.Devnet), []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  const solanaWallets = (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );

  return (
    <LanguageProvider>
      <ConsentProvider>
        <StreakProvider>
          <VoiceProvider>
            {cdpProjectId ? (
              <CDPReactProvider
                config={{
                  projectId: cdpProjectId,
                  appName: "Coach FI",
                  authMethods: ["email", "oauth:google", "oauth:apple", "oauth:x", "oauth:telegram"],
                  solana: { createOnLogin: true },
                }}
              >
                <AccountSync />
                <SignInGate />
                {solanaWallets}
              </CDPReactProvider>
            ) : (
              solanaWallets
            )}
          </VoiceProvider>
        </StreakProvider>
      </ConsentProvider>
    </LanguageProvider>
  );
}
