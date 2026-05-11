"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Facebook, Link2, MessageCircle, Share2, Twitter } from "lucide-react";
import { useState } from "react";

import { useLanguage } from "@/context/LanguageContext";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface SocialShareProps {
  text: string;
  url: string;
  title?: string;
  compact?: boolean;
}

const PLATFORMS = [
  {
    id: "twitter",
    label: "X / Twitter",
    icon: Twitter,
    color: "hover:bg-black hover:text-white border-black/10",
    getUrl: (text: string, url: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: Facebook,
    color: "hover:bg-[#1877F2] hover:text-white border-[#1877F2]/20",
    getUrl: (_: string, url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    color: "hover:bg-[#25D366] hover:text-white border-[#25D366]/20",
    getUrl: (text: string, url: string) => `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`,
  },
];

const COPY: Record<Locale, { title: string; more: string; copy: string; copied: string; shareOn: string }> = {
  en: { title: "Share and challenge friends", more: "More options", copy: "Copy link", copied: "Copied!", shareOn: "Share on" },
  pl: { title: "Udostępnij i rzuć wyzwanie", more: "Więcej opcji", copy: "Kopiuj link", copied: "Skopiowano!", shareOn: "Udostępnij na" },
  ja: { title: "共有して挑戦", more: "その他", copy: "リンクをコピー", copied: "コピーしました", shareOn: "共有先" },
};

export function SocialShare({ text, url, title, compact = false }: SocialShareProps) {
  const { locale } = useLanguage();
  const copy = COPY[locale];
  const [copied, setCopied] = useState(false);

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: title ?? "Coach FI", text, url });
      } catch {
        // User cancelled sharing.
      }
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard can be blocked by browser permissions.
    }
  }

  function openPlatform(platformUrl: string) {
    window.open(platformUrl, "_blank", "width=600,height=400,noopener,noreferrer");
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.id}
            type="button"
            onClick={() => openPlatform(platform.getUrl(text, url))}
            aria-label={`${copy.shareOn} ${platform.label}`}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full border bg-white text-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              platform.color
            )}
          >
            <platform.icon className="h-4 w-4" aria-hidden="true" />
          </button>
        ))}
        <button
          type="button"
          onClick={copyLink}
          aria-label={copy.copy}
          className="grid h-9 w-9 place-items-center rounded-full border border-primary/10 bg-white text-muted transition hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <Check className="h-4 w-4 text-success" />
              </motion.span>
            ) : (
              <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <Link2 className="h-4 w-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-soft">
      <div className="flex items-center gap-2 text-sm font-black text-text">
        <Share2 className="h-4 w-4 text-primary" />
        {copy.title}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.id}
            type="button"
            onClick={() => openPlatform(platform.getUrl(text, url))}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-bold text-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              platform.color
            )}
          >
            <platform.icon className="h-5 w-5" aria-hidden="true" />
            {platform.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        {"share" in navigator && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="flex-1 rounded-xl border border-primary/15 bg-primary/5 px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Share2 className="mr-1.5 inline h-4 w-4" />
            {copy.more}
          </button>
        )}
        <button
          type="button"
          onClick={copyLink}
          className={cn(
            "flex-1 rounded-xl border px-4 py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            copied
              ? "border-success bg-success/10 text-success"
              : "border-primary/15 bg-primary/5 text-primary hover:bg-primary hover:text-white"
          )}
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {copy.copied}
              </motion.span>
            ) : (
              <motion.span key="cp" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Link2 className="mr-1.5 inline h-4 w-4" />
                {copy.copy}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
}
