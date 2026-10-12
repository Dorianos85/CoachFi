"use client";

import { useState } from "react";
import { LogOut, User as UserIcon } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { pickLocalized, type LocalizedMap } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Tab = "signin" | "signup";

interface AccountCopy {
  signIn: string;
  signOut: string;
  signUp: string;
  account: string;
  description: string;
  tabSignIn: string;
  tabSignUp: string;
  email: string;
  password: string;
  or: string;
  magicLink: string;
  created: string;
  needEmail: string;
  magicSent: string;
}

const accountCopy: LocalizedMap<AccountCopy> = {
  en: {
    signIn: "Sign in",
    signOut: "Sign out",
    signUp: "Create account",
    account: "Account",
    description:
      "Signing in saves your progress in the cloud and syncs it across devices. Without an account the app keeps working locally.",
    tabSignIn: "Sign in",
    tabSignUp: "Sign up",
    email: "Email",
    password: "Password",
    or: "or",
    magicLink: "Email me a sign-in link",
    created: "Account created. Check your inbox if confirmation is required.",
    needEmail: "Enter your email address.",
    magicSent: "We sent a sign-in link to your email.",
  },
  pl: {
    signIn: "Zaloguj",
    signOut: "Wyloguj",
    signUp: "Załóż konto",
    account: "Konto",
    description:
      "Logowanie zapisuje Twój postęp w chmurze i synchronizuje go między urządzeniami. Bez logowania aplikacja działa lokalnie jak dotychczas.",
    tabSignIn: "Logowanie",
    tabSignUp: "Rejestracja",
    email: "E-mail",
    password: "Hasło",
    or: "lub",
    magicLink: "Wyślij link logowania na e-mail",
    created: "Konto utworzone. Sprawdź skrzynkę, jeśli wymagane jest potwierdzenie e-mail.",
    needEmail: "Podaj adres e-mail.",
    magicSent: "Wysłaliśmy link logowania na podany adres e-mail.",
  },
  es: {
    signIn: "Iniciar sesión",
    signOut: "Cerrar sesión",
    signUp: "Crear cuenta",
    account: "Cuenta",
    description:
      "Iniciar sesión guarda tu progreso en la nube y lo sincroniza entre dispositivos. Sin cuenta, la app sigue funcionando localmente.",
    tabSignIn: "Iniciar sesión",
    tabSignUp: "Registrarse",
    email: "Correo electrónico",
    password: "Contraseña",
    or: "o",
    magicLink: "Enviarme un enlace de acceso",
    created: "Cuenta creada. Revisa tu correo si se requiere confirmación.",
    needEmail: "Introduce tu correo electrónico.",
    magicSent: "Te enviamos un enlace de acceso por correo.",
  },
  fr: {
    signIn: "Se connecter",
    signOut: "Se déconnecter",
    signUp: "Créer un compte",
    account: "Compte",
    description:
      "La connexion enregistre votre progression dans le cloud et la synchronise entre appareils. Sans compte, l'application continue de fonctionner en local.",
    tabSignIn: "Connexion",
    tabSignUp: "Inscription",
    email: "E-mail",
    password: "Mot de passe",
    or: "ou",
    magicLink: "M'envoyer un lien de connexion",
    created: "Compte créé. Vérifiez votre boîte mail si une confirmation est requise.",
    needEmail: "Saisissez votre adresse e-mail.",
    magicSent: "Nous avons envoyé un lien de connexion à votre e-mail.",
  },
  ja: {
    signIn: "ログイン",
    signOut: "ログアウト",
    signUp: "アカウント作成",
    account: "アカウント",
    description:
      "ログインすると進捗がクラウドに保存され、デバイス間で同期されます。ログインしなくてもアプリはローカルで動作します。",
    tabSignIn: "ログイン",
    tabSignUp: "新規登録",
    email: "メールアドレス",
    password: "パスワード",
    or: "または",
    magicLink: "ログインリンクをメールで送る",
    created: "アカウントを作成しました。確認が必要な場合はメールをご確認ください。",
    needEmail: "メールアドレスを入力してください。",
    magicSent: "ログインリンクをメールで送信しました。",
  },
};

export function AccountButton() {
  const { configured, loading, user, signInWithPassword, signUp, signInWithMagicLink, signOut } =
    useAuth();
  const { locale } = useLanguage();
  const copy = pickLocalized(accountCopy, locale);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hide entirely if Supabase isn't configured — app stays local-only.
  if (!configured) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const fn = tab === "signin" ? signInWithPassword : signUp;
    const { error: err } = await fn(email.trim(), password);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    if (tab === "signup") {
      setMessage(copy.created);
    } else {
      setOpen(false);
    }
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      setError(copy.needEmail);
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    const { error: err } = await signInWithMagicLink(email.trim());
    setBusy(false);
    if (err) setError(err);
    else setMessage(copy.magicSent);
  }

  if (user) {
    return (
      <button
        type="button"
        onClick={() => void signOut()}
        title={user.email ?? copy.account}
        className="hidden min-h-10 items-center gap-2 rounded-lg border border-primary/15 bg-white/75 px-3 py-2 text-sm font-bold text-text shadow-sm transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:flex"
      >
        <LogOut className="h-4 w-4 text-primary" aria-hidden="true" />
        {copy.signOut}
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={loading}
        className="flex min-h-10 items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-black text-white shadow-glow transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
      >
        <UserIcon className="h-4 w-4" aria-hidden="true" />
        {copy.signIn}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-primary/20 bg-[#151522] text-text">
          <DialogHeader>
            <DialogTitle>{tab === "signin" ? copy.signIn : copy.signUp}</DialogTitle>
            <DialogDescription>{copy.description}</DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 rounded-lg bg-primary/5 p-1 text-sm font-bold">
            <button
              type="button"
              onClick={() => setTab("signin")}
              className={`flex-1 rounded-md px-3 py-2 transition ${
                tab === "signin" ? "bg-primary text-white shadow-sm" : "text-muted"
              }`}
            >
              {copy.tabSignIn}
            </button>
            <button
              type="button"
              onClick={() => setTab("signup")}
              className={`flex-1 rounded-md px-3 py-2 transition ${
                tab === "signup" ? "bg-primary text-white shadow-sm" : "text-muted"
              }`}
            >
              {copy.tabSignUp}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-sm font-bold text-text">
              {copy.email}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="mt-1 w-full rounded-lg border border-primary/25 bg-[#12121d] px-3 py-2 text-sm font-medium text-text outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="block text-sm font-bold text-text">
              {copy.password}
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={tab === "signin" ? "current-password" : "new-password"}
                className="mt-1 w-full rounded-lg border border-primary/25 bg-[#12121d] px-3 py-2 text-sm font-medium text-text outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            {error && <p className="text-sm font-bold text-red-600">{error}</p>}
            {message && <p className="text-sm font-bold text-emerald-600">{message}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-black text-white shadow-glow transition hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "..." : tab === "signin" ? copy.signIn : copy.signUp}
            </button>
          </form>

          <div className="flex items-center gap-3 text-xs font-bold uppercase text-muted">
            <span className="h-px flex-1 bg-primary/10" />
            {copy.or}
            <span className="h-px flex-1 bg-primary/10" />
          </div>

          <button
            type="button"
            onClick={() => void handleMagicLink()}
            disabled={busy}
            className="w-full rounded-lg border border-primary/25 bg-transparent px-4 py-2.5 text-sm font-bold text-text transition hover:bg-primary/10 disabled:opacity-60"
          >
            {copy.magicLink}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
