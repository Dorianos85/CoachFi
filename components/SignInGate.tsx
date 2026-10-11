"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { isSignInRequiredNow, subscribeSignInProgress } from "@/lib/signInGate";

const copy = {
  en: {
    title: "Sign in to continue",
    body: "This is as far as Coach FI goes without an account. Sign in with email to keep going.",
    action: "Sign in",
  },
  pl: {
    title: "Zaloguj się, żeby iść dalej",
    body: "Tu kończy się Coach FI bez konta. Zaloguj się mailem, żeby kontynuować.",
    action: "Zaloguj się",
  },
  ja: {
    title: "続けるにはログイン",
    body: "アカウントなしで使える範囲はここまでです。メールでログインして続けてください。",
    action: "ログイン",
  },
} as const;

export function SignInGate() {
  const { ready, authenticated, login } = usePrivy();
  const { locale } = useLanguage();
  const text = copy[locale];
  const [required, setRequired] = useState(false);
  const prompted = useRef(false);

  useEffect(() => subscribeSignInProgress(() => setRequired(isSignInRequiredNow())), []);

  useEffect(() => {
    setRequired(isSignInRequiredNow());
  }, []);

  useEffect(() => {
    if (!required || authenticated) {
      prompted.current = false;
      return;
    }
    if (!ready || prompted.current) return;
    prompted.current = true;
    login();
  }, [authenticated, login, ready, required]);

  if (!ready || authenticated || !required) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] grid place-items-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-in-gate-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft">
        <h2 id="sign-in-gate-title" className="text-2xl font-black text-text">
          {text.title}
        </h2>
        <p className="mt-3 text-base font-semibold leading-7 text-muted">{text.body}</p>
        <Button type="button" size="lg" className="mt-6 w-full" onClick={() => login()}>
          {text.action}
        </Button>
      </div>
    </div>
  );
}
