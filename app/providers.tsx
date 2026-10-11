"use client";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { PrivyProvider } from "@privy-io/react-auth";
import { clusterApiUrl } from "@solana/web3.js";
import { useMemo } from "react";

import { AccountSync } from "@/components/AccountSync";
import { SignInGate } from "@/components/SignInGate";
import { LanguageProvider } from "@/context/LanguageContext";
import { StreakProvider } from "@/context/StreakContext";
import { VoiceProvider } from "@/context/VoiceContext";
import { ConsentProvider } from "@/context/ConsentContext";

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim() ?? "";

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
            {privyAppId ? (
              <PrivyProvider
                appId={privyAppId}
                config={{
                  embeddedWallets: {
                    solana: {
                      createOnLogin: "users-without-wallets",
                    },
                  },
                }}
              >
                <AccountSync />
                <SignInGate />
                {solanaWallets}
              </PrivyProvider>
            ) : (
              solanaWallets
            )}
          </VoiceProvider>
        </StreakProvider>
      </ConsentProvider>
    </LanguageProvider>
  );
}
