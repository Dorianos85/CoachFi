"use client";

import { SectionHeader } from "@/components/SectionHeader";
import { YieldVault } from "@/components/YieldVault";
import { useLanguage } from "@/context/LanguageContext";
import type { Locale } from "@/lib/i18n";

const vaultPageCopy: Record<Locale, { eyebrow: string; title: string; description: string; readText: string }> = {
  pl: {
    eyebrow: "Edukacja DeFi Yield",
    title: "Twoje tokeny pracują dla Ciebie.",
    description:
      "Zdeponuj tokeny Coach FI, wybierz strategię Kamino i obserwuj, jak yield rośnie w czasie. Tak działają vaulty DeFi na Solanie.",
    readText: "Yield vault na Solanie. Złóż depozyt, wybierz strategię i zobacz procent składany w akcji.",
  },
  en: {
    eyebrow: "DeFi Yield Education",
    title: "Your tokens work for you.",
    description:
      "Deposit Coach FI tokens, choose a Kamino strategy and watch yield grow over time. This is how DeFi vaults work on Solana.",
    readText: "Solana yield vault. Make a deposit, choose a strategy and see compound interest in action.",
  },
  ja: {
    eyebrow: "DeFi利回り教育",
    title: "あなたのトークンが働きます。",
    description:
      "Coach FIトークンを預け、Kamino戦略を選び、利回りが時間とともに増える様子を確認します。Solana上のDeFi vaultの仕組みです。",
    readText: "Solanaのyield vault。入金し、戦略を選び、複利の動きを確認します。",
  },
};

export default function VaultPage() {
  const { locale } = useLanguage();
  const copy = vaultPageCopy[locale];

  return (
    <section aria-labelledby="vault-title">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        readText={copy.readText}
      />
      <YieldVault />
    </section>
  );
}
