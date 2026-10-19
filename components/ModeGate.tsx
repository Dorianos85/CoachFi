"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ShieldCheck, UserRoundCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { useConsent } from "@/context/ConsentContext";
import { useLanguage } from "@/context/LanguageContext";
import { useMode } from "@/context/ModeContext";

const COPY = {
  en: {
    eyebrow: "Adult learning",
    title: "Welcome to Coach FI",
    intro: "This release is for people aged 18 and over. Learn with short lessons, quizzes and small daily actions.",
    confirm: "I am at least 18 years old.",
    enter: "Continue as an adult",
    close: "Close age confirmation",
  },
  pl: {
    eyebrow: "Nauka dla dorosłych",
    title: "Witaj w Coach FI",
    intro: "Ta wersja jest przeznaczona dla osób, które ukończyły 18 lat. Ucz się przez krótkie lekcje, quizy i małe codzienne działania.",
    confirm: "Mam ukończone 18 lat.",
    enter: "Kontynuuj jako osoba dorosła",
    close: "Zamknij potwierdzenie wieku",
  },
};

export function ModeGate({ returnFocusRef }: { returnFocusRef?: RefObject<HTMLButtonElement | null> }) {
  const router = useRouter();
  const { locale } = useLanguage();
  const copy = locale === "pl" ? COPY.pl : COPY.en;
  const { loaded: consentLoaded, requiredAccepted } = useConsent();
  const { loaded: modeLoaded, modeRecord, settingsOpen, selectAdultMode, closeSettings } = useMode();
  const [adultChecked, setAdultChecked] = useState(false);
  const previousFocus = useRef<HTMLElement | null>(null);
  const forcedOpen = consentLoaded && requiredAccepted && modeLoaded && !modeRecord;
  const open = forcedOpen || settingsOpen;

  function enterAdult() {
    if (!adultChecked) return;
    selectAdultMode();
    setAdultChecked(false);
    router.push("/");
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !forcedOpen) {
          setAdultChecked(false);
          closeSettings();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1200] bg-slate-950/58 backdrop-blur-sm" />
        <Dialog.Content
          aria-modal="true"
          className="fixed left-1/2 top-1/2 z-[1201] max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-primary/15 bg-white p-5 text-text shadow-2xl focus:outline-none"
          onEscapeKeyDown={(event) => { if (forcedOpen) event.preventDefault(); }}
          onInteractOutside={(event) => { if (forcedOpen) event.preventDefault(); }}
          onOpenAutoFocus={() => {
            previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          }}
          onCloseAutoFocus={(event) => {
            if (document.querySelector('[role="dialog"][data-state="open"]')) {
              event.preventDefault();
              return;
            }
            const target = returnFocusRef?.current ?? previousFocus.current;
            if (target?.isConnected) {
              event.preventDefault();
              target.focus();
            }
          }}
        >
          {!forcedOpen && (
            <Dialog.Close className="absolute right-4 top-4 rounded-lg p-2 text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={copy.close}>
              <X className="h-5 w-5" aria-hidden="true" />
            </Dialog.Close>
          )}
          <p className="pr-10 text-xs font-black uppercase text-primary">{copy.eyebrow}</p>
          <Dialog.Title className="mt-1 pr-10 text-2xl font-black leading-tight">{copy.title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm font-semibold leading-6 text-muted">{copy.intro}</Dialog.Description>
          <UserRoundCheck className="mt-5 h-8 w-8 text-primary" aria-hidden="true" />
          <label className="mt-5 flex items-start gap-3 rounded-lg border border-primary/15 p-3 text-sm font-bold leading-6">
            <input type="checkbox" checked={adultChecked} onChange={(event) => setAdultChecked(event.target.checked)} className="mt-1 h-4 w-4 focus:ring-primary" />
            <span>{copy.confirm}</span>
          </label>
          <Button type="button" className="mt-4 w-full" disabled={!adultChecked} onClick={enterAdult}>
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {copy.enter}
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
