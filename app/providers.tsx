"use client";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletContext,
  WalletProvider,
  type WalletContextState,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { clusterApiUrl } from "@solana/web3.js";
import { useEffect, useMemo, useState } from "react";

import { LanguageProvider } from "@/context/LanguageContext";
import { StreakProvider } from "@/context/StreakContext";
import { VoiceProvider } from "@/context/VoiceContext";
import { ConsentProvider } from "@/context/ConsentContext";
import { ModeProvider } from "@/context/ModeContext";
import { AuthProvider } from "@/context/AuthContext";

const missingWalletProvider = () => Promise.reject(new Error("Solana wallet provider is still loading."));

const walletFallback: WalletContextState = {
  autoConnect: false,
  wallets: [],
  wallet: null,
  publicKey: null,
  connecting: false,
  connected: false,
  disconnecting: false,
  select: () => {},
  connect: missingWalletProvider,
  disconnect: missingWalletProvider,
  sendTransaction: missingWalletProvider as WalletContextState["sendTransaction"],
  signTransaction: undefined,
  signAllTransactions: undefined,
  signMessage: undefined,
  signIn: undefined,
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ConsentProvider>
          <ModeProvider>
            <StreakProvider>
              <VoiceProvider>
                <SolanaWalletProviders>{children}</SolanaWalletProviders>
              </VoiceProvider>
            </StreakProvider>
          </ModeProvider>
        </ConsentProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

function SolanaWalletProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const endpoint = useMemo(() => clusterApiUrl(WalletAdapterNetwork.Devnet), []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <WalletContext.Provider value={walletFallback}>{children}</WalletContext.Provider>;
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
