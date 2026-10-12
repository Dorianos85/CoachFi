"use client";
import { useGetAccessToken, useIsInitialized, useIsSignedIn } from "@coinbase/cdp-hooks";
import { useState } from "react";
import { requestSignIn } from "@/lib/signInGate";

export function AdminCdpLogin({ onToken }: { onToken: (token: string) => Promise<void> }) {
  const { isInitialized } = useIsInitialized();
  const { isSignedIn } = useIsSignedIn();
  const { getAccessToken } = useGetAccessToken();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function open() {
    if (!isSignedIn) { requestSignIn(); return; }
    setBusy(true); setError("");
    try { const token = await getAccessToken(); if (!token) throw new Error("Brak sesji."); await onToken(token); }
    catch { setError("Nie udało się zweryfikować sesji CDP."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-3"><button disabled={!isInitialized || busy} type="button" onClick={() => void open()} className="rounded-xl bg-primary px-5 py-3 font-bold text-white disabled:opacity-40">{isSignedIn ? "Otwórz panel przez konto Coach FI" : "Zaloguj kontem Coach FI"}</button>{error && <p role="alert">{error}</p>}</div>;
}
