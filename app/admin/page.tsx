"use client";

import { createClient } from "@supabase/supabase-js";
import { useRef, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AdminCdpLogin } from "@/components/AdminCdpLogin";

type Overview = {
  page: number; pageSize: number;
  metrics: { accounts: number; active7Days: number; learningProfiles: number; chainCheckedCertificates: number; legacyProfiles: number };
  accounts: { cdp_user_id: string; email: string | null; display_name: string | null; auth_provider: string | null; updated_at: string }[];
  legacyProfiles: { id: string; name: string | null; updated_at: string }[];
};

export default function AdminPage() {
  const client = useRef<SupabaseClient | null>(null);
  const token = useRef("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load(page: number) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/overview?page=${page}`, { headers: { Authorization: `Bearer ${token.current}` }, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) { token.current = ""; setData(null); }
        throw new Error(response.status === 403 ? "To konto nie ma dostępu administratora." : response.status === 401 ? "Sesja wygasła. Zaloguj się ponownie." : "Baza danych nie jest jeszcze skonfigurowana lub jest niedostępna.");
      }
      setData(result as Overview);
    } catch (err) { setError(err instanceof Error ? err.message : "Nie udało się pobrać danych."); }
    finally { setBusy(false); }
  }

  async function signIn(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) { setError("Logowanie administratora wymaga konfiguracji Supabase."); setBusy(false); return; }
    client.current ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    try {
      const result = await client.current.auth.signInWithPassword({ email, password });
      setPassword("");
      if (result.error || !result.data.session) { setError("Nieprawidłowe dane logowania administratora."); return; }
      token.current = result.data.session.access_token;
      await load(1);
    } catch { setError("Nie udało się połączyć logowania. Spróbuj ponownie."); }
    finally { setPassword(""); setBusy(false); }
  }

  async function logout() {
    await client.current?.auth.signOut({ scope: "local" }); token.current = ""; setData(null); setPassword(""); setError("");
  }

  const date = (value: string) => new Date(value).toLocaleString("pl-PL");
  const lastPage = data ? Math.max(1, Math.ceil(Math.max(data.metrics.accounts, data.metrics.legacyProfiles) / data.pageSize)) : 1;
  return <section className="space-y-6" aria-labelledby="admin-title">
    <div className="flex items-center justify-between gap-4"><div><h1 id="admin-title" className="text-3xl font-black">Coach FI · Admin</h1><p className="mt-2 text-muted">Użytkownicy i stan platformy</p></div>{data && <button onClick={() => void logout()} className="rounded-xl border p-3 font-bold">Wyloguj</button>}</div>
    {error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-800">{error}</p>}
    {!data ? <form onSubmit={(event) => void signIn(event)} className="max-w-md space-y-4 rounded-2xl border bg-white p-6">
      {process.env.NEXT_PUBLIC_CDP_PROJECT_ID && <AdminCdpLogin onToken={async (value) => { token.current = value; await load(1); }} />}
      <p className="text-sm text-muted">Alternatywnie użyj zatwierdzonego konta administratora Supabase. Dostęp wymaga Twojego adresu na serwerowej liście administratorów.</p>
      <label className="block font-bold">Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border p-3" /></label>
      <label className="block font-bold">Hasło<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border p-3" /></label>
      <button disabled={busy} className="rounded-xl bg-primary px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "Ładowanie…" : "Zaloguj do panelu"}</button>
    </form> : <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[["Konta CDP", data.metrics.accounts], ["Aktywni · 7 dni", data.metrics.active7Days], ["Zapisany postęp", data.metrics.learningProfiles], ["Certyfikaty sprawdzone on-chain", data.metrics.chainCheckedCertificates], ["Wcześniejsze profile", data.metrics.legacyProfiles]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border bg-white p-5"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>)}</div>
      <p className="text-sm text-muted">Konta CDP i wcześniejsze profile są osobnymi zbiorami. Ich suma nie oznacza liczby unikalnych użytkowników. Panel jest tylko do odczytu.</p>
      <div className="overflow-x-auto rounded-2xl border bg-white p-5"><h2 className="mb-4 text-xl font-bold">Konta CDP</h2><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Użytkownik</th><th className="p-3">Email</th><th className="p-3">Logowanie</th><th className="p-3">Aktualizacja</th></tr></thead><tbody>{data.accounts.map((account) => <tr key={account.cdp_user_id} className="border-t"><td className="p-3">{account.display_name || "Bez nazwy"}</td><td className="p-3">{account.email || "—"}</td><td className="p-3">{account.auth_provider || "—"}</td><td className="p-3">{date(account.updated_at)}</td></tr>)}</tbody></table>{!data.accounts.length && <p className="p-3 text-muted">Brak kont CDP na tej stronie. Konta zapisują się po skonfigurowanym logowaniu.</p>}</div>
      <div className="rounded-2xl border bg-white p-5"><h2 className="mb-4 text-xl font-bold">Wcześniejsze profile</h2><ul className="divide-y">{data.legacyProfiles.map((profile) => <li key={profile.id} className="flex justify-between gap-3 py-3"><span>{profile.name || "Bez nazwy"}</span><span className="text-sm text-muted">{date(profile.updated_at)}</span></li>)}</ul></div>
      <div className="flex items-center gap-3"><button disabled={busy || data.page <= 1} onClick={() => void load(data.page - 1)} className="rounded-lg border p-3 disabled:opacity-40">Poprzednia</button><span>Strona {data.page} / {lastPage}</span><button disabled={busy || data.page >= lastPage} onClick={() => void load(data.page + 1)} className="rounded-lg border p-3 disabled:opacity-40">Następna</button><button disabled={busy} onClick={() => void load(data.page)} className="rounded-lg border p-3">Odśwież</button></div>
    </>}
  </section>;
}
