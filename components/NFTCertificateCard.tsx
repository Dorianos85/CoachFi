"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function NFTCertificateCard({
  title,
  status,
  description,
  icon: Icon,
  statusVariant,
  userName,
  dateIssued,
  onMint,
  txHash,
}: {
  title: string;
  status: string;
  description: string;
  icon: LucideIcon;
  statusVariant?: "success" | "accent" | "muted";
  userName?: string;
  dateIssued?: string;
  onMint?: () => void;
  txHash?: string;
}) {
  const isMinted = statusVariant === "success" || status.toLowerCase() === "minted";
  const isReady = statusVariant === "accent" || status.toLowerCase() === "ready";

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border-2 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow",
      isMinted ? "border-[#9945FF]/30" : isReady ? "border-primary/25" : "border-primary/10"
    )}>
      {/* Certificate header gradient */}
      <div className={cn(
        "relative px-6 py-5",
        isMinted
          ? "bg-gradient-to-r from-[#9945FF]/10 via-[#14F195]/10 to-[#9945FF]/10"
          : "bg-gradient-to-r from-primary/8 to-accent/8"
      )}>
        {/* Decorative corner lines */}
        <div className="pointer-events-none absolute inset-3 rounded-xl border border-dashed border-current/10" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "grid h-12 w-12 place-items-center rounded-xl shadow-sm",
              isMinted ? "bg-gradient-to-br from-[#9945FF] to-[#14F195] text-white" : "bg-primary/10 text-primary"
            )}>
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                Certificate of Achievement
              </p>
              <p className="mt-0.5 font-black text-text">{title}</p>
            </div>
          </div>

          {isMinted && (
            <div className="flex items-center gap-1 rounded-full bg-[#9945FF]/10 px-2.5 py-1">
              <svg className="h-3 w-3" viewBox="0 0 397 311" fill="none" aria-hidden="true">
                <path d="M64.6 237.9a11 11 0 0 1 7.8-3.2h317.4c4.9 0 7.4 5.9 3.9 9.4l-62.7 62.7a11 11 0 0 1-7.8 3.2H5.8c-4.9 0-7.4-5.9-3.9-9.4l62.7-62.7zm0-164.7A11 11 0 0 1 72.4 70h317.4c4.9 0 7.4 5.9 3.9 9.4l-62.7 62.7a11 11 0 0 1-7.8 3.2H5.8c-4.9 0-7.4-5.9-3.9-9.4L64.6 73.2zM330 3.2A11 11 0 0 0 322.2 0H4.8C-.1 0-2.6 5.9.9 9.4l62.7 62.7a11 11 0 0 0 7.8 3.2h317.4c4.9 0 7.4-5.9 3.9-9.4L330 3.2z" fill="#9945FF"/>
              </svg>
              <span className="text-[10px] font-black text-[#9945FF]">On-chain</span>
            </div>
          )}
        </div>
      </div>

      {/* Certificate body */}
      <div className="px-6 py-4">
        {/* Recipient */}
        {userName && (
          <div className="mb-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">This certifies that</p>
            <p className="mt-0.5 text-lg font-black text-text">{userName}</p>
            <p className="text-xs font-semibold text-muted">has successfully completed</p>
          </div>
        )}

        <p className="text-xs font-semibold leading-5 text-muted">{description}</p>

        {/* Divider with seal */}
        <div className="relative my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-primary/10" />
          <div className={cn(
            "grid h-8 w-8 place-items-center rounded-full border-2 text-xs font-black",
            isMinted ? "border-[#9945FF]/40 text-[#9945FF]" : "border-primary/20 text-primary"
          )}>
            FI
          </div>
          <div className="h-px flex-1 bg-primary/10" />
        </div>

        {/* Footer: status + date + Solana */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black",
              isMinted ? "bg-[#9945FF]/10 text-[#9945FF]" :
              isReady ? "bg-accent/15 text-amber-700" :
              "bg-primary/8 text-muted"
            )}>
              {isMinted && (
                <svg className="h-2.5 w-2.5" viewBox="0 0 397 311" fill="none">
                  <path d="M64.6 237.9a11 11 0 0 1 7.8-3.2h317.4c4.9 0 7.4 5.9 3.9 9.4l-62.7 62.7a11 11 0 0 1-7.8 3.2H5.8c-4.9 0-7.4-5.9-3.9-9.4l62.7-62.7zm0-164.7A11 11 0 0 1 72.4 70h317.4c4.9 0 7.4 5.9 3.9 9.4l-62.7 62.7a11 11 0 0 1-7.8 3.2H5.8c-4.9 0-7.4-5.9-3.9-9.4L64.6 73.2zM330 3.2A11 11 0 0 0 322.2 0H4.8C-.1 0-2.6 5.9.9 9.4l62.7 62.7a11 11 0 0 0 7.8 3.2h317.4c4.9 0 7.4-5.9 3.9-9.4L330 3.2z" fill="currentColor"/>
                </svg>
              )}
              {status}
            </span>
            {dateIssued && (
              <p className="mt-1 text-[10px] text-muted">{dateIssued}</p>
            )}
          </div>

          {txHash && (
            <a
              href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-[#9945FF] hover:underline"
            >
              View on Solana ↗
            </a>
          )}

          {onMint && isReady && (
            <button
              type="button"
              onClick={onMint}
              className="rounded-lg bg-gradient-to-r from-[#9945FF] to-[#14F195] px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:opacity-90"
            >
              Mint NFT
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
