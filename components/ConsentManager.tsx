"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, Bot, Database, FileText, ShieldCheck, Trophy, Volume2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useConsent } from "@/context/ConsentContext";
import { useLanguage } from "@/context/LanguageContext";
import { DEFAULT_OPTIONAL_CONSENTS, type OptionalConsentKey } from "@/lib/consent";
import type { Locale } from "@/lib/i18n";

const OPTION_ICONS: Record<OptionalConsentKey, typeof Bot> = {
  aiCoach: Bot,
  voice: Volume2,
  leaderboard: Trophy,
  blockchain: Database,
};

type ConsentCopy = {
  close: string;
  eyebrow: string;
  title: string;
  intro: string;
  requiredTitle: string;
  requiredDesc: string;
  terms: string;
  privacy: string;
  optionalTitle: string;
  footer: string;
  requiredHint: string;
  save: string;
  acceptRequired: string;
  acceptAll: string;
  options: Record<OptionalConsentKey, { title: string; description: string }>;
};

const consentCopy: Record<Locale, ConsentCopy> = {
  en: {
    close: "Close consent settings",
    eyebrow: "Data safety",
    title: "Coach FI terms of use",
    intro: "Minimum data stays on this device. External features are enabled with separate optional consent.",
    requiredTitle: "I accept the Terms and Privacy Policy",
    requiredDesc: "This consent is required to use the app. Documents are available here:",
    terms: "Terms",
    privacy: "Privacy",
    optionalTitle: "Optional consents",
    footer: "You can change consents in the app footer. Withdrawing consent does not automatically delete data already stored by external providers or on public blockchain.",
    requiredHint: "Select the required consent or choose Accept all.",
    save: "Save settings",
    acceptRequired: "Accept required",
    acceptAll: "Accept all",
    options: {
      aiCoach: {
        title: "AI Coach Mila",
        description: "Send coach chat text and Conversational AI agent context through secure server or widget integrations.",
      },
      voice: {
        title: "ElevenLabs voice",
        description: "Use ElevenLabs for click-to-play speech and the optional voice agent after you start it. Browser voice is used when TTS is unavailable.",
      },
      leaderboard: {
        title: "Global leaderboard",
        description: "Publish display name, score and streak in the Supabase leaderboard.",
      },
      blockchain: {
        title: "NFT certificates",
        description: "Store wallet address and certificate metadata on public Solana Devnet.",
      },
    },
  },
  pl: {
    close: "Zamknij ustawienia zgód",
    eyebrow: "Bezpieczeństwo danych",
    title: "Zasady korzystania z Coach FI",
    intro: "Minimum danych zostaje na tym urządzeniu. Funkcje zewnętrzne włączasz osobnymi zgodami.",
    requiredTitle: "Akceptuję Regulamin i Politykę prywatności",
    requiredDesc: "To jest wymagana zgoda na korzystanie z aplikacji. Dokumenty są dostępne tutaj:",
    terms: "Regulamin",
    privacy: "Prywatność",
    optionalTitle: "Zgody opcjonalne",
    footer: "Możesz zmienić zgody w stopce aplikacji. Wycofanie zgody nie usuwa automatycznie danych zapisanych już u zewnętrznych dostawców lub na publicznym blockchainie.",
    requiredHint: "Zaznacz wymaganą zgodę albo kliknij Akceptuj wszystko.",
    save: "Zapisz ustawienia",
    acceptRequired: "Akceptuj wymagane",
    acceptAll: "Akceptuj wszystko",
    options: {
      aiCoach: {
        title: "AI Coach Mila",
        description: "Wysyłanie tekstu czatu i kontekstu agenta głosowego przez bezpieczny endpoint lub widget.",
      },
      voice: {
        title: "Głos ElevenLabs",
        description: "Odczyt tekstu po kliknięciu i opcjonalny agent głosowy po jego uruchomieniu. Głos przeglądarki działa, gdy TTS jest niedostępny.",
      },
      leaderboard: {
        title: "Ranking globalny",
        description: "Publikacja nazwy wyświetlanej, wyniku i serii w tabeli wyników Supabase.",
      },
      blockchain: {
        title: "Certyfikaty NFT",
        description: "Zapis adresu portfela i metadanych certyfikatu na publicznej sieci Solana Devnet.",
      },
    },
  },
  ja: {
    close: "同意設定を閉じる",
    eyebrow: "データ安全",
    title: "Coach FI 利用規約",
    intro: "最小限のデータはこの端末に残ります。外部機能には個別の同意が必要です。",
    requiredTitle: "利用規約とプライバシーポリシーに同意します",
    requiredDesc: "アプリ利用に必要な同意です。文書はこちら：",
    terms: "規約",
    privacy: "プライバシー",
    optionalTitle: "任意の同意",
    footer: "同意はフッターで変更できます。撤回しても外部サービスや公開ブロックチェーン上の既存データは自動削除されません。",
    requiredHint: "必須同意を選択するか、すべて承認してください。",
    save: "保存",
    acceptRequired: "必須を承認",
    acceptAll: "すべて承認",
    options: {
      aiCoach: { title: "AI コーチ Mila", description: "チャット本文と音声エージェントの文脈を安全なサーバーまたはウィジェット経由で送信します。" },
      voice: { title: "ElevenLabs 音声", description: "クリック後の読み上げと、ユーザーが開始した音声エージェントに ElevenLabs を使います。TTS が使えない場合はブラウザ音声を使います。" },
      leaderboard: { title: "グローバルランキング", description: "表示名、スコア、連続記録を Supabase に公開します。" },
      blockchain: { title: "NFT 証明書", description: "ウォレットと証明書メタデータを Solana Devnet に保存します。" },
    },
  },
};

const optionKeys: OptionalConsentKey[] = ["aiCoach", "voice", "leaderboard", "blockchain"];

export function ConsentManager() {
  const {
    consent,
    loaded,
    requiredAccepted,
    settingsOpen,
    closeSettings,
    acceptRequired,
    updateOptional,
  } = useConsent();
  const { locale } = useLanguage();
  const copy = consentCopy[locale];
  const mustShow = loaded && !requiredAccepted;
  const open = mustShow || settingsOpen;
  const [requiredChecked, setRequiredChecked] = useState(false);
  const [optional, setOptional] = useState(DEFAULT_OPTIONAL_CONSENTS);

  useEffect(() => {
    if (!open) return;
    setRequiredChecked(requiredAccepted);
    setOptional(consent?.optional ?? DEFAULT_OPTIONAL_CONSENTS);
  }, [consent, open, requiredAccepted]);

  const allOptional = useMemo(
    () => ({
      aiCoach: true,
      voice: true,
      leaderboard: true,
      blockchain: true,
    }),
    []
  );

  function toggle(key: OptionalConsentKey) {
    setOptional((current) => ({ ...current, [key]: !current[key] }));
  }

  function saveCurrent() {
    if (!requiredAccepted && !requiredChecked) return;
    if (requiredAccepted) updateOptional(optional);
    else acceptRequired(optional);
  }

  function acceptAll() {
    if (requiredAccepted) updateOptional(allOptional);
    else acceptRequired(allOptional);
  }

  if (!loaded) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4">
          <motion.div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="consent-title"
            className="relative z-10 flex max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-primary/15 bg-white text-text shadow-2xl"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            {requiredAccepted && (
              <button
                type="button"
                onClick={closeSettings}
                className="absolute right-4 top-4 z-10 rounded-lg p-2 text-muted transition hover:bg-primary/10 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={copy.close}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            )}

            <div className="shrink-0 border-b border-primary/10 p-4 pr-12 md:p-5 md:pr-14">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary text-white">
                  <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase text-primary">{copy.eyebrow}</p>
                  <h2 id="consent-title" className="mt-1 text-xl font-black leading-tight text-text md:text-2xl">
                    {copy.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{copy.intro}</p>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5">
              <div className="rounded-lg border border-primary/15 bg-primary/5 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={requiredChecked}
                    disabled={requiredAccepted}
                    onChange={(event) => setRequiredChecked(event.target.checked)}
                    className="mt-1 h-5 w-5 accent-primary"
                  />
                  <span>
                    <span className="block text-sm font-black text-text">{copy.requiredTitle}</span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-muted">
                      {copy.requiredDesc}{" "}
                      <Link href="/terms" className="font-black text-primary underline">
                        {copy.terms}
                      </Link>{" "}
                      /{" "}
                      <Link href="/privacy" className="font-black text-primary underline">
                        {copy.privacy}
                      </Link>
                      .
                    </span>
                  </span>
                </label>
              </div>

              <div className="mt-5">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
                  <h3 className="text-base font-black text-text">{copy.optionalTitle}</h3>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {optionKeys.map((key) => {
                    const Icon = OPTION_ICONS[key];
                    const option = copy.options[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggle(key)}
                        className="rounded-lg border border-primary/12 bg-white p-4 text-left transition hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <span className="flex items-start gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-3">
                              <span className="font-black text-text">{option.title}</span>
                              <span
                                className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition ${
                                  optional[key] ? "bg-primary" : "bg-slate-300"
                                }`}
                                aria-hidden="true"
                              >
                                <span
                                  className={`block h-5 w-5 rounded-full bg-white transition ${
                                    optional[key] ? "translate-x-5" : ""
                                  }`}
                                />
                              </span>
                            </span>
                            <span className="mt-1 block text-xs font-semibold leading-5 text-muted">
                              {option.description}
                            </span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 rounded-lg bg-slate-50 p-4 text-xs font-semibold leading-5 text-muted">
                {copy.footer}
              </div>
            </div>

            <div className="shrink-0 border-t border-primary/10 bg-white p-3 md:p-4">
              {!requiredAccepted && !requiredChecked && (
                <p className="mb-2 text-xs font-semibold leading-5 text-muted">{copy.requiredHint}</p>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={saveCurrent}
                  disabled={!requiredAccepted && !requiredChecked}
                  className="w-full sm:w-auto"
                >
                  <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                  {requiredAccepted ? copy.save : copy.acceptRequired}
                </Button>
                <Button type="button" onClick={acceptAll} className="w-full sm:w-auto">
                  {copy.acceptAll}
                </Button>
              </div>
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}
