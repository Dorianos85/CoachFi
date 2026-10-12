"use client";

import { useIsInitialized, useIsSignedIn, useSignInWithEmail, useSignInWithOAuth, useVerifyEmailOTP } from "@coinbase/cdp-hooks";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { dismissSignInRequest, isSignInRequested, isSignInRequiredNow, subscribeSignInProgress } from "@/lib/signInGate";

const copy = {
  en: {
    title: "Sign in to continue",
    body: "This is as far as Coach FI goes without an account. Sign in to keep going.",
    or: "or",
    email: "Email",
    code: "Code from the email",
    send: "Send code",
    action: "Sign in",
    sending: "Sending...",
    checking: "Checking...",
    close: "Close",
  },
  pl: {
    title: "Zaloguj się, żeby iść dalej",
    body: "Tu kończy się Coach FI bez konta. Zaloguj się, żeby kontynuować.",
    or: "albo",
    email: "Email",
    code: "Kod z maila",
    send: "Wyślij kod",
    action: "Zaloguj się",
    sending: "Wysyłanie...",
    checking: "Sprawdzanie...",
    close: "Zamknij",
  },
  ja: {
    title: "続けるにはログイン",
    body: "アカウントなしで使える範囲はここまでです。ログインして続けてください。",
    or: "または",
    email: "メール",
    code: "メールのコード",
    send: "コードを送る",
    action: "ログイン",
    sending: "送信中...",
    checking: "確認中...",
    close: "閉じる",
  },
} as const;

function SocialIcon({ id }: { id: "google" | "apple" | "x" | "telegram" }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", "aria-hidden": true as const, className: "shrink-0" };
  if (id === "google") {
    return (
      <svg {...common}>
        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
        <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.3 7.4 24 12 24z" />
        <path fill="#FBBC05" d="M5.4 14.4A7.2 7.2 0 0 1 5 12c0-1 .2-1.7.4-2.4V6.5H1.4A12 12 0 0 0 0 12c0 1.9.5 3.7 1.4 5.5l4-3.1z" />
        <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.1 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.5l4 3.1C6.3 6.8 8.9 4.8 12 4.8z" />
      </svg>
    );
  }
  if (id === "apple") {
    return (
      <svg {...common}>
        <path
          fill="currentColor"
          d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.2c.7-1 1.2-2 1.5-3.1-3.9-1.5-3.8-5.3-3.8-5.3zM14.3 6.2c.6-.8 1.1-1.9.9-3-1 .1-2.1.6-2.8 1.4-.6.7-1.2 1.8-.9 2.9 1.1.1 2.1-.5 2.8-1.3z"
        />
      </svg>
    );
  }
  if (id === "x") {
    return (
      <svg {...common}>
        <path
          fill="currentColor"
          d="M14.7 10.3 22.4 1.5h-1.8l-6.7 7.6L8.7 1.5H2l8.1 11.5L2 22.5h1.8l7.1-8.1 5.7 8.1H22l-7.3-12.2zm-2.5 2.9-.8-1.2L4.5 2.9h2.8l5.3 7.4.8 1.2 6.9 9.6h-2.8l-5.3-7.9z"
        />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path
        fill="#2AABEE"
        d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.8 8.2-1.9 8.8c-.1.6-.5.8-1 .5l-2.8-2.1-1.3 1.3c-.1.2-.3.3-.6.3l.2-2.8 5.2-4.7c.2-.2 0-.3-.3-.1l-6.4 4-2.8-.9c-.6-.2-.6-.6.1-.9l10.7-4.1c.5-.2 1 .1.9.7z"
      />
    </svg>
  );
}

const socialProviders = [
  { id: "google", label: "Google" },
  { id: "apple", label: "Apple" },
  { id: "x", label: "X" },
  { id: "telegram", label: "Telegram" },
] as const;

export function SignInGate() {
  const { isInitialized } = useIsInitialized();
  const { isSignedIn } = useIsSignedIn();
  const { signInWithEmail } = useSignInWithEmail();
  const { signInWithOAuth } = useSignInWithOAuth();
  const { verifyEmailOTP } = useVerifyEmailOTP();
  const { locale } = useLanguage();
  const text = copy[locale];
  const [required, setRequired] = useState(false);
  const [opened, setOpened] = useState(false);
  const [email, setEmail] = useState("");
  const [flowId, setFlowId] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState<"send" | "verify" | (typeof socialProviders)[number]["id"] | null>(null);
  const [error, setError] = useState("");

  useEffect(
    () =>
      subscribeSignInProgress(() => {
        setRequired(isSignInRequiredNow());
        setOpened(isSignInRequested());
      }),
    [],
  );

  useEffect(() => {
    setRequired(isSignInRequiredNow());
    setOpened(isSignInRequested());
  }, []);

  useEffect(() => {
    if (isSignedIn) dismissSignInRequest();
  }, [isSignedIn]);

  if (!isInitialized || isSignedIn || (!required && !opened)) return null;

  async function startSocial(provider: (typeof socialProviders)[number]["id"]) {
    if (busy) return;
    setBusy(provider);
    setError("");
    try {
      await signInWithOAuth(provider);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
      setBusy(null);
    }
  }

  async function sendCode() {
    const nextEmail = email.trim();
    if (!nextEmail || busy) return;
    setBusy("send");
    setError("");
    try {
      const result = await signInWithEmail({ email: nextEmail });
      setFlowId(result.flowId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send the code.");
    } finally {
      setBusy(null);
    }
  }

  async function verifyCode() {
    const nextOtp = otp.trim();
    if (!flowId || !nextOtp || busy) return;
    setBusy("verify");
    setError("");
    try {
      await verifyEmailOTP({ flowId, otp: nextOtp });
      dismissSignInRequest();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[10000] grid place-items-center bg-text/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-in-gate-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft">
        <h2 id="sign-in-gate-title" className="text-2xl font-black text-text">
          {text.title}
        </h2>
        <p className="mt-3 text-base font-semibold leading-7 text-muted">{text.body}</p>
        {flowId ? null : (
          <div className="mt-6 grid gap-2">
            {socialProviders.map((provider) => (
              <Button
                key={provider.id}
                type="button"
                size="lg"
                variant="outline"
                className="w-full justify-start gap-3"
                disabled={busy !== null}
                onClick={() => void startSocial(provider.id)}
              >
                <SocialIcon id={provider.id} />
                {provider.label}
              </Button>
            ))}
            <p className="py-1 text-center text-sm font-bold text-muted">{text.or}</p>
          </div>
        )}
        {flowId ? (
          <label className="mt-6 block text-sm font-bold text-text">
            {text.code}
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-input border-2 border-border px-4 text-base font-semibold"
            />
          </label>
        ) : (
          <label className="mt-6 block text-sm font-bold text-text">
            {text.email}
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-input border-2 border-border px-4 text-base font-semibold"
            />
          </label>
        )}
        {error ? (
          <p className="mt-3 text-sm font-semibold text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          size="lg"
          className="mt-6 w-full"
          disabled={busy !== null}
          onClick={() => {
            if (flowId) void verifyCode();
            else void sendCode();
          }}
        >
          {busy === "send" ? text.sending : busy === "verify" ? text.checking : flowId ? text.action : text.send}
        </Button>
        {!required ? (
          <button
            type="button"
            className="mt-3 w-full text-sm font-bold text-muted"
            onClick={() => dismissSignInRequest()}
          >
            {text.close}
          </button>
        ) : null}
      </div>
    </div>
  );
}
