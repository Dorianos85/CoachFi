"use client";

import Link from "next/link";
import { Mic } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useConsent } from "@/context/ConsentContext";
import { useLanguage } from "@/context/LanguageContext";
import { useVoice } from "@/context/VoiceContext";
import { getUser } from "@/lib/user";

export function MilaVoiceFab() {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const { loaded, requiredAccepted } = useConsent();
  const { persona } = useVoice();
  const [setupDone, setSetupDone] = useState(false);
  useEffect(() => {
    const refresh = () => setSetupDone(getUser().setupDone);
    refresh();
    window.addEventListener("coachfi-user", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("coachfi-user", refresh); window.removeEventListener("storage", refresh); };
  }, []);
  if (!loaded || !requiredAccepted || !setupDone || pathname === "/coach" || pathname === "/kids") return null;
  return <Link href="/coach" className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-bold text-white shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300"><Mic aria-hidden="true" className="h-5 w-5" />{locale === "pl" ? "Zacznij rozmowę" : locale === "ja" ? "会話を始める" : "Start conversation"}<span className="sr-only"> — {persona === "milosz" ? "Miłosz" : "Mila"}</span></Link>;
}

export function MilaVoiceAgent({ compact: _compact = false }: { compact?: boolean }) {
  const { locale } = useLanguage();
  return <Link href="/coach" className="flex items-center gap-3 rounded-2xl border border-primary/15 bg-white p-5 font-bold text-primary"><Mic aria-hidden="true" className="h-5 w-5" />{locale === "pl" ? "Zacznij rozmowę" : locale === "ja" ? "会話を始める" : "Start conversation"}</Link>;
}
