"use client";

import Script from "next/script";
import { Mic } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ?? "";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "elevenlabs-convai": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "agent-id"?: string;
          variant?: string;
        },
        HTMLElement
      >;
    }
  }
}

export function MilaVoiceFab() {
  if (!AGENT_ID) return null;
  return (
    <>
      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="lazyOnload"
      />
      <elevenlabs-convai agent-id={AGENT_ID} />
    </>
  );
}

export function MilaVoiceAgent({ compact: _compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();
  const va = t.voiceAgent;

  return (
    <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-soft">
      <h2 className="flex items-center gap-2 text-base font-black text-text">
        <Mic className="h-4 w-4 text-primary" aria-hidden="true" />
        {va.title}
      </h2>
      <p className="mt-3 text-sm font-semibold leading-6 text-muted">
        {va.hint}
      </p>
      <div className="mt-4 flex items-center gap-3 rounded-xl bg-primary/5 p-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white">
          <Mic className="h-5 w-5" />
        </div>
        <p className="text-xs font-bold text-text">
          {va.fab}
          <span className="mt-0.5 block text-[11px] font-semibold text-muted">
            {va.poweredBy}
          </span>
        </p>
      </div>
    </div>
  );
}
