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
      "Account data is currently read-only. New progress stays on this device; automatic sync is disabled. Earlier device-only progress is not imported automatically.",
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
      "Dane konta są obecnie dostępne tylko do odczytu. Nowe postępy pozostają na tym urządzeniu; automatyczna synchronizacja jest wyłączona. Wcześniejszy lokalny postęp nie jest importowany automatycznie.",
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
  zh: {
    signIn: "登录",
    signOut: "退出登录",
    signUp: "创建账户",
    account: "账户",
    description:
      "登录后，你的进度会保存在云端并在多台设备间同步。没有账户时，应用仍可在本地使用。",
    tabSignIn: "登录",
    tabSignUp: "注册",
    email: "邮箱",
    password: "密码",
    or: "或",
    magicLink: "通过邮件发送登录链接",
    created: "账户已创建。如需确认，请查看你的收件箱。",
    needEmail: "请输入你的邮箱地址。",
    magicSent: "我们已向你的邮箱发送了登录链接。",
  },
  hi: {
    signIn: "साइन इन करें",
    signOut: "साइन आउट करें",
    signUp: "खाता बनाएं",
    account: "खाता",
    description:
      "साइन इन करने पर आपकी प्रगति क्लाउड में सहेजी जाती है और सभी डिवाइस पर सिंक होती है। खाते के बिना ऐप स्थानीय रूप से चलता रहता है।",
    tabSignIn: "साइन इन",
    tabSignUp: "साइन अप",
    email: "ईमेल",
    password: "पासवर्ड",
    or: "या",
    magicLink: "मुझे साइन-इन लिंक ईमेल करें",
    created: "खाता बन गया। अगर पुष्टि ज़रूरी हो तो अपना इनबॉक्स देखें।",
    needEmail: "अपना ईमेल पता डालें।",
    magicSent: "हमने आपके ईमेल पर साइन-इन लिंक भेज दिया है।",
  },
  "pt-BR": {
    signIn: "Entrar",
    signOut: "Sair",
    signUp: "Criar conta",
    account: "Conta",
    description:
      "Ao entrar, seu progresso fica salvo na nuvem e sincronizado entre dispositivos. Sem conta, o app continua funcionando localmente.",
    tabSignIn: "Entrar",
    tabSignUp: "Cadastrar",
    email: "E-mail",
    password: "Senha",
    or: "ou",
    magicLink: "Enviar link de acesso por e-mail",
    created: "Conta criada. Confira sua caixa de entrada se for preciso confirmar.",
    needEmail: "Digite seu endereço de e-mail.",
    magicSent: "Enviamos um link de acesso para o seu e-mail.",
  },
  tr: {
    signIn: "Giriş yap",
    signOut: "Çıkış yap",
    signUp: "Hesap oluştur",
    account: "Hesap",
    description:
      "Giriş yapınca ilerlemen buluta kaydedilir ve cihazların arasında eşitlenir. Hesap olmadan uygulama yerel olarak çalışmaya devam eder.",
    tabSignIn: "Giriş yap",
    tabSignUp: "Kaydol",
    email: "E-posta",
    password: "Şifre",
    or: "veya",
    magicLink: "Giriş bağlantısını e-postama gönder",
    created: "Hesap oluşturuldu. Onay gerekiyorsa gelen kutunu kontrol et.",
    needEmail: "E-posta adresini gir.",
    magicSent: "E-postana bir giriş bağlantısı gönderdik.",
  },
};

export function AccountButton() {
  const { configured, loading, user, signOutStatus, signInWithPassword, signUp, signInWithMagicLink, signOut } =
    useAuth();
  const { locale } = useLanguage();
  const copy = pickLocalized(accountCopy, locale);
  const logoutCopy = locale === "pl" ? {
    pending: "Trwa wylogowywanie...",
    error: "Nie udało się potwierdzić wylogowania z usługi. Spróbuj ponownie.",
    retry: "Spróbuj wylogować ponownie",
  } : {
    pending: "Signing out...",
    error: "Sign-out from the service could not be confirmed. Try again.",
    retry: "Retry sign-out",
  };
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

  if (signOutStatus === "pending" || signOutStatus === "error") {
    return (
      <div className="flex max-w-xs flex-col items-start gap-2">
        {signOutStatus === "error" ? (
          <p role="alert" className="text-sm font-bold text-attention">{logoutCopy.error}</p>
        ) : null}
        <button
          type="button"
          onClick={() => void signOut()}
          disabled={signOutStatus === "pending"}
          aria-busy={signOutStatus === "pending" || undefined}
          className="flex min-h-10 items-center gap-2 rounded-lg border border-primary/15 bg-white/75 px-3 py-2 text-sm font-bold text-text shadow-sm transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
        >
          <LogOut className="h-4 w-4 text-primary" aria-hidden="true" />
          {signOutStatus === "pending" ? <span role="status">{logoutCopy.pending}</span> : logoutCopy.retry}
        </button>
      </div>
    );
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
        className="cf-press flex min-h-10 items-center gap-2 rounded-button bg-primary px-3 py-2 text-sm font-black text-on-primary transition hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-[length:var(--cfx-ring-width)] focus-visible:ring-focus disabled:opacity-60"
      >
        <UserIcon className="h-4 w-4" aria-hidden="true" />
        {copy.signIn}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-border-subtle bg-surface text-text">
          <DialogHeader>
            <DialogTitle>{tab === "signin" ? copy.signIn : copy.signUp}</DialogTitle>
            <DialogDescription>{copy.description}</DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 rounded-lg bg-primary/5 p-1 text-sm font-bold">
            <button
              type="button"
              onClick={() => setTab("signin")}
              className={`flex-1 rounded-md px-3 py-2 transition ${
                tab === "signin" ? "bg-primary text-on-primary shadow-sm" : "text-muted"
              }`}
            >
              {copy.tabSignIn}
            </button>
            <button
              type="button"
              onClick={() => setTab("signup")}
              className={`flex-1 rounded-md px-3 py-2 transition ${
                tab === "signup" ? "bg-primary text-on-primary shadow-sm" : "text-muted"
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
                className="mt-1 w-full rounded-input border-2 border-border bg-surface px-3 py-2 text-sm font-medium text-text outline-none focus:ring-[length:var(--cfx-ring-width)] focus:ring-focus"
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
                className="mt-1 w-full rounded-input border-2 border-border bg-surface px-3 py-2 text-sm font-medium text-text outline-none focus:ring-[length:var(--cfx-ring-width)] focus:ring-focus"
              />
            </label>

            {error && <p className="text-sm font-bold text-red-600">{error}</p>}
            {message && <p className="text-sm font-bold text-emerald-600">{message}</p>}

            <button
              type="submit"
              disabled={busy}
              className="cf-press w-full rounded-button bg-primary px-4 py-2.5 text-sm font-black text-on-primary transition hover:bg-primary-strong disabled:opacity-60"
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
