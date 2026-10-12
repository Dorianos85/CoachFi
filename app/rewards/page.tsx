"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import type { WalletName } from "@solana/wallet-adapter-base";
import { useGetAccessToken, useIsInitialized, useIsSignedIn, useSignOut, useSolanaAddress } from "@coinbase/cdp-hooks";
import { BadgeCheck, ExternalLink, Loader2, Lock, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { NFTCertificateCard } from "@/components/NFTCertificateCard";
import { SectionHeader } from "@/components/SectionHeader";
import { TokenRewardCard } from "@/components/TokenRewardCard";
import { VoiceButton } from "@/components/VoiceButton";
import { Button } from "@/components/ui/button";
import { useConsent } from "@/context/ConsentContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/context/LanguageContext";
import { certificates } from "@/data/certificates";
import {
  CERTIFICATE_STAGE_IDS,
  certificateCardLabel,
  type CertificateCardId,
} from "@/lib/certificate-cards";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import { getAllStageProgress, type StageProgress } from "@/lib/learningProgress";
import { createMockTransactionHash, wait } from "@/lib/solanaMock";
import { clearSignedInName, endLearningSession } from "@/lib/account-sync";
import { hideSavedProgress } from "@/lib/progress-visibility";
import { requestSignIn } from "@/lib/signInGate";
import { getTokenBalance } from "@/lib/tokens";
import { getDisplayName, getUser } from "@/lib/user";
import { getVoiceDemoLanguage, getVoiceDemoLocale, voiceDemoScripts } from "@/lib/voiceDemoScripts";

type MintStep = "idle" | "preparing" | "signing" | "confirming" | "done";

const phantomWalletEnabled = false;
const cdpProjectId = process.env.NEXT_PUBLIC_CDP_PROJECT_ID?.trim() ?? "";
const devMintRecipient = process.env.NEXT_PUBLIC_DEV_MINT_RECIPIENT?.trim() ?? "";
const mintImmediately = process.env.NODE_ENV === "development";

const rewardsCopy: LocalizedMap<
  {
    readText: (tokens: number) => string;
    walletTitle: string;
    walletHelp: string;
    embeddedHelp: string;
    embeddedLogin: string;
    embeddedLogout: string;
    mintDescription: string;
    consentRequired: string;
    certificateVoiceLabel: string;
    proofNote: string;
    dialogTitle: string;
    dialogDescription: string;
    transactionHash: string;
    explorer: string;
    dialogFootnote: string;
    mintSteps: Record<MintStep, string>;
    statusLabels: Record<"minted" | "ready" | "locked" | "transferred", string>;
    certificates: Array<{
      title: string;
      description: string;
    }>;
  }
> = {
  pl: {
    readText: (tokens) => `Nagrody. Masz ${tokens} punktów Coach FI. Certyfikaty pokazują postęp w edukacji finansowej.`,
    walletTitle: "Portfel Solana Devnet",
    walletHelp: "Połącz portfel, aby przypisać certyfikat do swojego adresu na Devnet.",
    embeddedHelp: "Ten adres jest właścicielem certyfikatu na Devnet.",
    embeddedLogin: "Zaloguj się",
    embeddedLogout: "Wyloguj",
    mintDescription: 'Zmintuj certyfikat "Saving Habit" na Solana Devnet jako dowód postępu.',
    consentRequired:
      "Zgoda blockchain jest wymagana, ponieważ adres portfela i metadane certyfikatu mogą być publiczne.",
    certificateVoiceLabel: "Odtwórz wiadomość certyfikatu",
    proofNote:
      "Certyfikaty są dowodem edukacji, a nie produktem inwestycyjnym. Nie są przeznaczone do odsprzedaży z zyskiem i oznaczają tylko osobisty etap nauki.",
    dialogTitle: "Certyfikat zmintowany na Solana Devnet",
    dialogDescription: 'Twój certyfikat "Saving Habit" został zapisany on-chain.',
    transactionHash: "Hash transakcji",
    explorer: "Zobacz w Solana Explorer (Devnet)",
    dialogFootnote: "Ten certyfikat oznacza postęp w edukacji finansowej, nie produkt inwestycyjny.",
    mintSteps: {
      idle: "",
      preparing: "Przygotowywanie metadanych...",
      signing: "Oczekiwanie na podpis portfela...",
      confirming: "Potwierdzanie na Devnet...",
      done: "Certyfikat zmintowany!",
    },
    statusLabels: {
      minted: "Zmintowany",
      ready: "Gotowy",
      locked: "Zablokowany",
      transferred: "Przekazany",
    },
    certificates: [
      {
        title: "Certyfikat Money Mindset",
        description: "Dowód ukończenia pierwszej lekcji o nastawieniu do pieniędzy.",
      },
      {
        title: "Certyfikat Saving Habit",
        description: "Odblokowuje się po quizie o nawyku oszczędzania i 3-dniowej serii.",
      },
      {
        title: "Certyfikat Inflation Fighter",
        description: "Zdobywany po ukończeniu kalkulatora inflacji i quizu.",
      },
    ],
  },
  en: {
    readText: (tokens) => `Rewards. You have ${tokens} Coach FI Points. Certificates are proof of financial education progress.`,
    walletTitle: "Solana Devnet wallet",
    walletHelp: "Connect a wallet to associate your certificate with your address on Devnet.",
    embeddedHelp: "This address owns your certificate on Devnet.",
    embeddedLogin: "Sign in",
    embeddedLogout: "Log out",
    mintDescription: 'Mint your "Saving Habit" certificate on Solana Devnet as proof of progress.',
    consentRequired:
      "Blockchain consent is required because wallet address and certificate metadata can become public.",
    certificateVoiceLabel: "Play certificate message",
    proofNote:
      "Certificates are proof of education, not investment products. They cannot be resold for profit and represent only your personal learning milestone.",
    dialogTitle: "Certificate minted on Solana Devnet",
    dialogDescription: 'Your "Saving Habit" certificate has been recorded on-chain.',
    transactionHash: "Transaction hash",
    explorer: "View on Solana Explorer (Devnet)",
    dialogFootnote: "This certificate represents your financial education progress, not an investment product.",
    mintSteps: {
      idle: "",
      preparing: "Preparing metadata...",
      signing: "Waiting for wallet signature...",
      confirming: "Confirming on Devnet...",
      done: "Certificate minted!",
    },
    statusLabels: {
      minted: "Minted",
      ready: "Ready",
      locked: "Locked",
      transferred: "Transferred",
    },
    certificates: [
      {
        title: "Money Mindset certificate",
        description: "Proof that you completed the first mindset lesson.",
      },
      {
        title: "Saving Habit certificate",
        description: "Unlocks after the saving habit quiz and 3-day streak.",
      },
      {
        title: "Inflation Fighter certificate",
        description: "Earned after completing the inflation calculator and quiz.",
      },
    ],
  },
  ja: {
    readText: (tokens) => `報酬。Coach FIポイントは${tokens}です。証明書は金融教育の進捗を示します。`,
    walletTitle: "Solana Devnetウォレット",
    walletHelp: "ウォレットを接続して、証明書をDevnet上のアドレスに関連付けます。",
    embeddedHelp: "このアドレスがDevnet上の証明書の所有者です。",
    embeddedLogin: "ログイン",
    embeddedLogout: "ログアウト",
    mintDescription: '進捗の証明として、Solana Devnetで「Saving Habit」証明書をミントします。',
    consentRequired: "ウォレットアドレスと証明書メタデータが公開される可能性があるため、ブロックチェーン同意が必要です。",
    certificateVoiceLabel: "証明書メッセージを再生",
    proofNote:
      "証明書は教育の証明であり、投資商品ではありません。利益目的で再販売するものではなく、個人の学習マイルストーンを表します。",
    dialogTitle: "Solana Devnetで証明書をミントしました",
    dialogDescription: "あなたの「Saving Habit」証明書がオンチェーンに記録されました。",
    transactionHash: "トランザクションハッシュ",
    explorer: "Solana Explorerで表示 (Devnet)",
    dialogFootnote: "この証明書は金融教育の進捗を表し、投資商品ではありません。",
    mintSteps: {
      idle: "",
      preparing: "メタデータを準備中...",
      signing: "ウォレット署名を待機中...",
      confirming: "Devnetで確認中...",
      done: "証明書をミントしました!",
    },
    statusLabels: {
      minted: "ミント済み",
      ready: "準備完了",
      locked: "ロック中",
      transferred: "譲渡済み",
    },
    certificates: [
      {
        title: "Money Mindset 証明書",
        description: "最初のお金のマインドセットレッスンを完了した証明です。",
      },
      {
        title: "Saving Habit 証明書",
        description: "貯蓄習慣クイズと3日連続達成後に解除されます。",
      },
      {
        title: "Inflation Fighter 証明書",
        description: "インフレ計算機とクイズを完了すると獲得できます。",
      },
    ],
  },
};

export default function RewardsPage() {
  const { locale, t } = useLanguage();
  const copy = pickLocalized(rewardsCopy, locale);
  const { hasOptionalConsent, openSettings } = useConsent();
  const voiceLocale = getVoiceDemoLocale(locale);
  const voiceLanguage = getVoiceDemoLanguage(voiceLocale);
  const certificateVoiceText = voiceDemoScripts[voiceLocale].certificateUnlock;
  const { connected, connecting, publicKey, select, connect, disconnect, wallets } = useWallet();
  const [embeddedAddress, setEmbeddedAddress] = useState<string | null>(null);
  const [mintStep, setMintStep] = useState<MintStep>("idle");
  const [mintDialogOpen, setMintDialogOpen] = useState(false);
  const [mockTxHash, setMockTxHash] = useState("");
  const [mintError, setMintError] = useState("");
  const [tokenBalance, setTokenBalance] = useState(0);
  const [stageProgress, setStageProgress] = useState<StageProgress[]>([]);
  const [savedCertificates, setSavedCertificates] = useState<SavedCertificate[]>([]);
  const accessToken = useRef<(() => Promise<string | null>) | null>(null);
  const localizedCertificates = certificates.map((certificate, index) => {
    const text = copy.certificates[index];
    const stageId = CERTIFICATE_STAGE_IDS[certificate.id];
    const stage = stageProgress.find((item) => item.stageId === stageId);
    const row = savedCertificates.find((item) => item.certificateId === certificate.id) ?? null;
    const label = certificateCardLabel(
      stage?.status === "completed",
      row?.status ?? null,
      certificate.id === "saving-habit",
    );
    return {
      ...certificate,
      title: text?.title ?? certificate.title,
      description: text?.description ?? certificate.description,
      status: copy.statusLabels[label],
      statusVariant: label === "minted" ? "success" as const : label === "ready" ? "accent" as const : "muted" as const,
      txHash: row?.txHash || undefined,
      assetAddress: row?.assetAddress,
    };
  });

  useEffect(() => {
    const refresh = () => {
      setTokenBalance(getTokenBalance());
      setStageProgress(getAllStageProgress());
    };
    refresh();
    window.addEventListener("coachfi-tokens", refresh);
    window.addEventListener("coachfi-learning", refresh);
    return () => {
      window.removeEventListener("coachfi-tokens", refresh);
      window.removeEventListener("coachfi-learning", refresh);
    };
  }, []);

  async function handleMintCertificate() {
    if (!hasOptionalConsent("blockchain")) {
      openSettings();
      return;
    }

    setMintError("");
    setMintStep(mintImmediately ? "confirming" : "preparing");
    if (!mintImmediately) {
      await wait(400);
      setMintStep("signing");
    }

    const phantomAddress =
      phantomWalletEnabled && connected && publicKey ? publicKey.toBase58() : null;
    const ownerAddress = phantomAddress ?? embeddedAddress ?? (mintImmediately ? devMintRecipient : "");

    if (ownerAddress) {
      // Attempt real on-chain mint via API
      try {
        setMintStep("confirming");
        const userName = getDisplayName(getUser());
        const res = await fetch("/api/mint-nft", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CoachFI-Consent": "blockchain",
          },
          body: JSON.stringify({
            recipientAddress: ownerAddress,
            certificateName: "Saving Habit",
            userName,
            score: 42,
          }),
        });
        const json = (await res.json()) as {
          ok: boolean; txHash?: string; assetAddress?: string; explorerUrl?: string; fallback?: boolean; error?: string;
        };

        if (json.ok && json.txHash) {
          setMockTxHash(json.txHash);
          setMintStep("done");
          setMintDialogOpen(true);
          const token = await accessToken.current?.();
          if (token) {
            const saved = await syncCertificates(token, {
              certificateId: "saving-habit",
              assetAddress: typeof json.assetAddress === "string" ? json.assetAddress : "",
              txHash: json.txHash,
            });
            if (saved) setSavedCertificates(saved);
          }
          return;
        }
        if (mintImmediately) {
          setMintStep("idle");
          setMintError(json.error || "Mint failed");
          return;
        }
        // Server returned fallback — fall through to mock
      } catch {
        if (mintImmediately) {
          setMintStep("idle");
          setMintError("Mint request failed");
          return;
        }
      }
    }

    // Fallback: simulated mint (no wallet or API not configured)
    if (!mintImmediately) {
      await wait(800);
      setMintStep("confirming");
      await wait(1000);
    }
    const hash = createMockTransactionHash();
    setMockTxHash(hash);
    setMintStep("done");
    setMintDialogOpen(true);
  }

  const isMinting = mintStep !== "idle" && mintStep !== "done";

  return (
    <section aria-labelledby="rewards-title">
      <SectionHeader
        eyebrow={t.rewards.eyebrow}
        title={t.rewards.title}
        description={t.rewards.description}
        readText={copy.readText(tokenBalance)}
      />

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        {/* Left panel */}
        <div className="grid gap-4">
          <TokenRewardCard balance={tokenBalance} status={t.rewards.tokens} />

          {(phantomWalletEnabled || cdpProjectId) && (
            <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-soft">
              <p className="mb-3 text-sm font-bold text-muted">{copy.walletTitle}</p>
              {phantomWalletEnabled && (
                <>
                  <PhantomConnectButton
                    connected={connected}
                    connecting={connecting}
                    publicKey={publicKey?.toBase58()}
                    onConnect={async () => {
                      const phantom = wallets.find((w) => w.adapter.name === "Phantom");
                      if (!phantom) {
                        window.open("https://phantom.com/download", "_blank");
                        return;
                      }
                      select("Phantom" as WalletName);
                      try { await connect(); } catch { /* user rejected */ }
                    }}
                    onDisconnect={disconnect}
                  />
                  {!connected && (
                    <p className="mt-2 text-xs font-semibold text-muted">{copy.walletHelp}</p>
                  )}
                </>
              )}
              {cdpProjectId && (
                <SavedCertificateLoader onCertificates={setSavedCertificates} accessToken={accessToken} />
              )}
              {cdpProjectId && (
                <EmbeddedWalletCard
                  help={copy.embeddedHelp}
                  loginLabel={copy.embeddedLogin}
                  logoutLabel={copy.embeddedLogout}
                  hasConsent={hasOptionalConsent("blockchain")}
                  onNeedConsent={openSettings}
                  onAddress={setEmbeddedAddress}
                />
              )}
            </div>
          )}

          {/* Mint button with step display */}
          <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-soft">
            <h2 className="text-base font-black text-text">{t.rewards.mint}</h2>
            <p className="mt-1 text-sm text-muted">{copy.mintDescription}</p>
            {!hasOptionalConsent("blockchain") && (
              <p className="mt-3 rounded-lg bg-primary/5 p-3 text-xs font-semibold leading-5 text-muted">
                {copy.consentRequired}
              </p>
            )}
            {mintError && (
              <p className="mt-3 rounded-lg bg-destructive/10 p-3 text-xs font-semibold leading-5 text-text" role="alert">
                {mintError}
              </p>
            )}

            <Button
              type="button"
              size="lg"
              className="mt-4 w-full"
              onClick={handleMintCertificate}
              disabled={isMinting}
            >
              {isMinting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  {copy.mintSteps[mintStep]}
                </>
              ) : mintStep === "done" ? (
                <>
                  <BadgeCheck className="h-5 w-5" aria-hidden="true" />
                  {t.rewards.minted}
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                  {t.rewards.mint}
                </>
              )}
            </Button>

            {/* Step progress indicator */}
            <AnimatePresence>
              {isMinting && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  {(["preparing", "signing", "confirming"] as MintStep[]).map((step, i) => {
                    const steps: MintStep[] = ["preparing", "signing", "confirming"];
                    const currentIdx = steps.indexOf(mintStep);
                    const stepIdx = steps.indexOf(step);
                    const done = stepIdx < currentIdx;
                    const active = stepIdx === currentIdx;
                    return (
                      <div key={step} className="flex items-center gap-3 py-1.5">
                        <span
                          className={
                            done
                              ? "grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success text-white"
                              : active
                                ? "grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-white"
                                : "h-5 w-5 shrink-0 rounded-full border-2 border-primary/20"
                          }
                        >
                          {done && <BadgeCheck className="h-3 w-3" />}
                          {active && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                        </span>
                        <span
                          className={`text-xs font-bold ${active ? "text-text" : done ? "text-success" : "text-muted"}`}
                        >
                          {copy.mintSteps[step]}
                        </span>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Certificate grid */}
        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-black text-text">{t.rewards.certificatesTitle}</h2>
            <VoiceButton
              text={certificateVoiceText}
              label={copy.certificateVoiceLabel}
              locale={voiceLocale}
              speechLang={voiceLanguage.speechLang}
              variant="pill"
              className="w-fit"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {localizedCertificates.map((certificate) => (
              <NFTCertificateCard key={certificate.title} {...certificate} />
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-primary/10 bg-primary/5 p-4">
            <p className="flex items-center gap-2 text-xs font-bold text-muted">
              <Lock className="h-3.5 w-3.5 text-primary" />
              {copy.proofNote}
            </p>
          </div>
        </div>
      </div>

      {/* Mint success dialog */}
      <Dialog open={mintDialogOpen} onOpenChange={setMintDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-success" />
              {copy.dialogTitle}
            </DialogTitle>
            <DialogDescription>{copy.dialogDescription}</DialogDescription>
          </DialogHeader>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-success/30 bg-success/10 p-4"
          >
            <p className="text-xs font-black uppercase text-muted">{copy.transactionHash}</p>
            <p className="mt-1.5 break-all font-mono text-sm font-bold text-text">
              {mockTxHash}
            </p>
          </motion.div>

          <motion.a
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            href={`https://explorer.solana.com/tx/${mockTxHash}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-white transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            {copy.explorer}
          </motion.a>

          <p className="text-center text-xs font-semibold text-muted">{copy.dialogFootnote}</p>
        </DialogContent>
      </Dialog>
    </section>
  );
}

type SavedCertificate = {
  certificateId: CertificateCardId;
  status: "owned" | "transferred";
  assetAddress: string;
  txHash: string | null;
};

function readSavedCertificate(value: unknown): SavedCertificate | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<SavedCertificate>;
  if (
    (row.certificateId !== "money-mindset" && row.certificateId !== "saving-habit" && row.certificateId !== "inflation-fighter") ||
    (row.status !== "owned" && row.status !== "transferred") ||
    typeof row.assetAddress !== "string" ||
    !row.assetAddress
  ) {
    return null;
  }
  return {
    certificateId: row.certificateId,
    status: row.status,
    assetAddress: row.assetAddress,
    txHash: typeof row.txHash === "string" && row.txHash ? row.txHash : null,
  };
}

function SavedCertificateLoader({
  onCertificates,
  accessToken,
}: {
  onCertificates: (rows: SavedCertificate[]) => void;
  accessToken: { current: (() => Promise<string | null>) | null };
}) {
  const { isInitialized } = useIsInitialized();
  const { isSignedIn } = useIsSignedIn();
  const { getAccessToken } = useGetAccessToken();

  useEffect(() => {
    accessToken.current = getAccessToken;
  });

  useEffect(() => {
    if (!isInitialized) return;
    if (!isSignedIn) {
      onCertificates([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const token = await accessToken.current?.();
      if (!token || cancelled) return;
      const saved = await syncCertificates(token);
      if (!cancelled && saved) onCertificates(saved);
    })();
    return () => {
      cancelled = true;
    };
  }, [isInitialized, isSignedIn, onCertificates]);

  return null;
}

async function syncCertificates(
  token: string,
  hint?: { certificateId?: string; assetAddress?: string; txHash?: string },
) {
  try {
    const response = await fetch("/api/certificates", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        ...(hint?.certificateId ? { certificateId: hint.certificateId } : {}),
        ...(hint?.assetAddress ? { assetAddress: hint.assetAddress } : {}),
        ...(hint?.txHash ? { txHash: hint.txHash } : {}),
      }),
    });
    const json = (await response.json()) as { ok?: boolean; certificates?: unknown; error?: string };
    if (!response.ok || json.ok === false || !Array.isArray(json.certificates)) {
      console.error("[certificates]", json.error || "Certificate sync failed");
      return null;
    }
    return json.certificates.map(readSavedCertificate).filter((row) => row !== null);
  } catch (error) {
    console.error("[certificates]", error instanceof Error ? error.message : error);
    return null;
  }
}

function EmbeddedWalletCard({
  help,
  loginLabel,
  logoutLabel,
  hasConsent,
  onNeedConsent,
  onAddress,
}: {
  help: string;
  loginLabel: string;
  logoutLabel: string;
  hasConsent: boolean;
  onNeedConsent: () => void;
  onAddress: (address: string | null) => void;
}) {
  const { isInitialized } = useIsInitialized();
  const { isSignedIn } = useIsSignedIn();
  const { solanaAddress } = useSolanaAddress();
  const { signOut } = useSignOut();
  const { getAccessToken } = useGetAccessToken();
  const address = isSignedIn ? solanaAddress : null;

  useEffect(() => {
    onAddress(address);
  }, [address, onAddress]);

  if (isSignedIn && !address) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-primary/15 px-4 py-3 text-sm font-bold text-muted">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      </div>
    );
  }

  if (isSignedIn && address) {
    return (
      <div className="grid gap-2">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-success" />
            <span className="truncate font-mono text-xs font-bold text-text">
              {address.slice(0, 14)}…{address.slice(-6)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              hideSavedProgress();
              void clearSignedInName(getAccessToken)
                .then(() => endLearningSession())
                .finally(() => signOut());
            }}
            className="shrink-0 rounded-lg border border-primary/20 px-3 py-2.5 text-xs font-bold text-muted transition hover:border-destructive/40 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {logoutLabel}
          </button>
        </div>
        <p className="text-xs font-semibold text-muted">{help}</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={!isInitialized}
      onClick={() => {
        if (!hasConsent) {
          onNeedConsent();
          return;
        }
        requestSignIn();
      }}
      className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-primary px-4 py-3 text-sm font-black text-white transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
    >
      {!isInitialized && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {loginLabel}
    </button>
  );
}

function PhantomConnectButton({
  connected,
  connecting,
  publicKey,
  onConnect,
  onDisconnect,
}: {
  connected: boolean;
  connecting: boolean;
  publicKey?: string;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-success" />
          <span className="truncate font-mono text-xs font-bold text-text">
            {publicKey.slice(0, 14)}…{publicKey.slice(-6)}
          </span>
        </div>
        <button
          type="button"
          onClick={onDisconnect}
          className="shrink-0 rounded-lg border border-primary/20 px-3 py-2.5 text-xs font-bold text-muted transition hover:border-destructive/40 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={connecting}
      onClick={onConnect}
      className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#AB9FF2] px-4 py-3 text-sm font-black text-white transition hover:bg-[#9B8FE2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AB9FF2] disabled:opacity-60"
    >
      {connecting ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <PhantomLogo />
      )}
      {connecting ? "Connecting…" : "Connect Phantom"}
    </button>
  );
}

function PhantomLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 128 128" fill="none" aria-hidden="true">
      <rect width="128" height="128" rx="24" fill="white" fillOpacity="0.25" />
      <path
        d="M110.6 64c0 25.7-20.9 46.6-46.6 46.6S17.4 89.7 17.4 64 38.3 17.4 64 17.4 110.6 38.3 110.6 64z"
        fill="white"
        fillOpacity="0.3"
      />
      <path
        d="M88 55.4H77.5c-1.2-8.7-8.7-15.4-17.7-15.4C49.3 40 40 49.3 40 60.8c0 11.5 9.3 20.8 20.8 20.8 5 0 9.6-1.8 13.1-4.8H88c-4.2 8.5-13 14.3-23.2 14.3C48.2 91.1 36 78.9 36 63.8 36 48.7 48.2 36.5 63.3 36.5c7.4 0 14.2 3 19.1 7.8H88v11.1z"
        fill="white"
      />
    </svg>
  );
}
