"use client";

import { Activity, ShieldCheck, Volume2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MilaAvatar } from "@/components/MilaAvatar";
import { useLanguage } from "@/context/LanguageContext";
import type { Locale } from "@/lib/i18n";

const COPY: Record<
  Locale,
  { online: string; title: string; desc: string; voice: string; certificates: string }
> = {
  en: {
    online: "AI coach online",
    title: "Meet Mila",
    desc: "A calm voice-first coach for financial habits, confidence and proof-of-progress.",
    voice: "Voice",
    certificates: "Certificates",
  },
  pl: {
    online: "Coach AI online",
    title: "Poznaj Miłę",
    desc: "Spokojna coachka voice-first od nawyków finansowych, pewności i dowodu postępu.",
    voice: "Głos",
    certificates: "Certyfikaty",
  },
  ja: {
    online: "AI コーチオンライン",
    title: "Mila に会う",
    desc: "金融習慣、自信、進捗証明を支える音声優先コーチ。",
    voice: "音声",
    certificates: "証明書",
  },
};

export function CoachAvatar() {
  const { locale } = useLanguage();
  const copy = COPY[locale];

  return (
    <Card className="overflow-hidden border-primary/10 bg-white/90">
      <CardContent className="p-0">
        <div className="relative px-6 pb-6 pt-7">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/10 to-transparent" aria-hidden="true" />

          <div className="relative flex flex-col items-center text-center">
            <Badge variant="success" className="mb-4">
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.online}
            </Badge>

            <MilaAvatar size="lg" className="mx-auto" />

            <h2 className="mt-4 text-3xl font-black leading-tight text-text">{copy.title}</h2>
            <p className="mt-2 max-w-xs text-sm font-semibold leading-6 text-muted">
              {copy.desc}
            </p>

            <div className="mt-5 w-full rounded-lg border border-primary/10 bg-primary/5 px-4 py-3">
              <div className="flex items-center justify-center gap-4 text-xs font-black uppercase tracking-normal text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  {copy.voice}
                </span>
                <span className="h-4 w-px bg-primary/15" aria-hidden="true" />
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  {copy.certificates}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
