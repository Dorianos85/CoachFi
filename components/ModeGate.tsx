"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Baby, ShieldCheck, UserRoundCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useConsent } from "@/context/ConsentContext";
import { useLanguage } from "@/context/LanguageContext";
import { useMode } from "@/context/ModeContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";

const COPY: LocalizedMap<{
  eyebrow: string;
  title: string;
  intro: string;
  adultTitle: string;
  adultBody: string;
  adultConfirm: string;
  adultButton: string;
  kidsTitle: string;
  kidsBody: string;
  parentName: string;
  parentConfirm: string;
  kidsButton: string;
  close: string;
  required: string;
}> = {
  en: {
    eyebrow: "Choose mode",
    title: "Who is using Coach FI?",
    intro: "Coach FI separates adult learning from Kids Mode so children do not see wallets, leaderboards or free-form AI coaching.",
    adultTitle: "Adult Mode",
    adultBody: "Full financial education, Mila AI Coach, daily challenges, coins, rewards and optional certificates.",
    adultConfirm: "I am an adult or I am using the app as a responsible guardian.",
    adultButton: "Enter Adult Mode",
    kidsTitle: "Kids Mode with parent consent",
    kidsBody: "Safe lessons, stars, saving jar and predefined voice narration. No wallet, no public leaderboard and no free-form AI advice.",
    parentName: "Parent or guardian name",
    parentConfirm: "I am the parent or legal guardian and I consent to this child using Kids Mode on this device.",
    kidsButton: "Enter Kids Mode",
    close: "Close mode selector",
    required: "Required",
  },
  pl: {
    eyebrow: "Wybór trybu",
    title: "Kto korzysta z Coach FI?",
    intro: "Coach FI oddziela naukę dorosłych od Kids Mode, żeby dziecko nie widziało portfela, rankingów ani swobodnego coachingu AI.",
    adultTitle: "Tryb dorosły",
    adultBody: "Pełna edukacja finansowa, Mila AI Coach, wyzwania dnia, coiny, nagrody i opcjonalne certyfikaty.",
    adultConfirm: "Mam 18 lat lub korzystam z aplikacji jako odpowiedzialny opiekun.",
    adultButton: "Wejdź w tryb dorosły",
    kidsTitle: "Kids Mode za zgodą rodzica",
    kidsBody: "Bezpieczne lekcje, gwiazdki, słoik oszczędzania i gotowe narracje głosowe. Bez portfela, publicznego rankingu i swobodnych porad AI.",
    parentName: "Imię rodzica lub opiekuna",
    parentConfirm: "Jestem rodzicem lub opiekunem prawnym i wyrażam zgodę na korzystanie z Kids Mode na tym urządzeniu.",
    kidsButton: "Wejdź w Kids Mode",
    close: "Zamknij wybór trybu",
    required: "Wymagane",
  },
  ja: {
    eyebrow: "Mode",
    title: "Who is using Coach FI?",
    intro: "Kids Mode is separated from adult learning.",
    adultTitle: "Adult Mode",
    adultBody: "Full financial education, Mila AI Coach, daily challenges, coins, rewards and optional certificates.",
    adultConfirm: "I am an adult or responsible guardian.",
    adultButton: "Enter Adult Mode",
    kidsTitle: "Kids Mode with parent consent",
    kidsBody: "Safe lessons with stars and predefined voice narration. No wallet, leaderboard or free-form AI advice.",
    parentName: "Parent or guardian name",
    parentConfirm: "I am the parent or legal guardian and I consent to Kids Mode on this device.",
    kidsButton: "Enter Kids Mode",
    close: "Close mode selector",
    required: "Required",
  },
};

export function ModeGate() {
  const router = useRouter();
  const { locale } = useLanguage();
  const copy = pickLocalized(COPY, locale);
  const { loaded: consentLoaded, requiredAccepted } = useConsent();
  const {
    loaded: modeLoaded,
    modeRecord,
    settingsOpen,
    selectAdultMode,
    selectKidsMode,
    closeSettings,
  } = useMode();
  const [adultChecked, setAdultChecked] = useState(false);
  const [parentName, setParentName] = useState("");
  const [parentChecked, setParentChecked] = useState(false);

  const forcedOpen = consentLoaded && requiredAccepted && modeLoaded && !modeRecord;
  const open = forcedOpen || settingsOpen;

  function enterAdult() {
    if (!adultChecked) return;
    selectAdultMode();
    router.push("/");
  }

  function enterKids() {
    if (!parentChecked || parentName.trim().length < 2) return;
    selectKidsMode(parentName);
    router.push("/kids");
  }

  function close() {
    if (forcedOpen) return;
    closeSettings();
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-3 sm:p-4">
          <motion.div
            className="absolute inset-0 bg-slate-950/58 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="mode-gate-title"
            className="relative z-10 flex max-h-[calc(100vh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-primary/15 bg-white text-text shadow-2xl"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            {!forcedOpen && (
              <button
                type="button"
                onClick={close}
                className="absolute right-4 top-4 z-10 rounded-lg p-2 text-muted transition hover:bg-primary/10 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={copy.close}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            )}

            <div className="shrink-0 border-b border-primary/10 p-5 pr-14">
              <p className="text-xs font-black uppercase text-primary">{copy.eyebrow}</p>
              <h2 id="mode-gate-title" className="mt-1 text-2xl font-black leading-tight text-text">
                {copy.title}
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-muted">{copy.intro}</p>
            </div>

            <div className="grid min-h-0 gap-4 overflow-y-auto p-5 md:grid-cols-2">
              <div className="rounded-lg border border-primary/10 bg-primary/5 p-5">
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-primary text-white">
                  <UserRoundCheck className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-xl font-black text-text">{copy.adultTitle}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-muted">{copy.adultBody}</p>
                <label className="mt-5 flex items-start gap-3 rounded-lg border border-primary/15 bg-white p-3 text-sm font-bold leading-6">
                  <input
                    type="checkbox"
                    checked={adultChecked}
                    onChange={(event) => setAdultChecked(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-primary/30 text-primary focus:ring-primary"
                  />
                  <span>{copy.adultConfirm}</span>
                </label>
                <Button type="button" className="mt-4 w-full" disabled={!adultChecked} onClick={enterAdult}>
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  {copy.adultButton}
                </Button>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-amber-300 text-text">
                  <Baby className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-xl font-black text-text">{copy.kidsTitle}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-muted">{copy.kidsBody}</p>
                <label className="mt-5 block text-sm font-black text-text">
                  {copy.parentName} <span className="text-red-600">({copy.required})</span>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(event) => setParentName(event.target.value)}
                    maxLength={48}
                    className="mt-2 min-h-12 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-base font-bold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </label>
                <label className="mt-3 flex items-start gap-3 rounded-lg border border-amber-300 bg-white p-3 text-sm font-bold leading-6">
                  <input
                    type="checkbox"
                    checked={parentChecked}
                    onChange={(event) => setParentChecked(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-amber-400 text-primary focus:ring-primary"
                  />
                  <span>{copy.parentConfirm}</span>
                </label>
                <Button
                  type="button"
                  variant="accent"
                  className="mt-4 w-full"
                  disabled={!parentChecked || parentName.trim().length < 2}
                  onClick={enterKids}
                >
                  <Baby className="h-4 w-4" aria-hidden="true" />
                  {copy.kidsButton}
                </Button>
              </div>
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}
