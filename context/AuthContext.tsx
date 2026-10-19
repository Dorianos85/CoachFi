"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { syncOnLogin } from "@/lib/sync/cloudSync";
import { registerCloudPusher } from "@/lib/sync/syncQueue";
import { createSessionSyncController } from "@/lib/sync/session-sync";
import { getStorageOwnershipSnapshot } from "@/lib/product-storage";

export type SignOutResult = { error: "unconfirmed" | "cancelled" | null };
type SignOutStatus = "idle" | "pending" | "error";
type SignOutAttempt = {
  controller: ReturnType<typeof createSessionSyncController>;
  guest: ReturnType<typeof getStorageOwnershipSnapshot> | null;
};

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  user: User | null;
  session: Session | null;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOutStatus: SignOutStatus;
  signOut: () => Promise<SignOutResult>;
}

const AuthContext = createContext<AuthContextValue>({
  configured: false,
  loading: true,
  user: null,
  session: null,
  signInWithPassword: async () => ({ error: "Auth not configured" }),
  signUp: async () => ({ error: "Auth not configured" }),
  signInWithMagicLink: async () => ({ error: "Auth not configured" }),
  signOutStatus: "idle",
  signOut: async () => ({ error: "unconfirmed" }),
});

export function AuthProvider({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const supabase = enabled ? getSupabaseBrowserClient() : null;
  const configured = enabled && isSupabaseConfigured();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [signOutStatus, setSignOutStatus] = useState<SignOutStatus>("idle");
  const currentSession = enabled ? session : null;
  const user = currentSession?.user ?? null;
  const sync = useRef<ReturnType<typeof createSessionSyncController> | null>(null);
  const signOutAttempt = useRef<SignOutAttempt | null>(null);

  useEffect(() => {
    signOutAttempt.current = null;
    setSignOutStatus("idle");
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    const controller = createSessionSyncController({
      sync: (guard) => syncOnLogin(supabase, guard.userId, guard),
      push: async () => {}, // Automatic account writes are disabled in B15.
      registerPusher: registerCloudPusher,
      onSynced: () => {}, // Initial hydration must not announce an account save.
    });
    sync.current = controller;
    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      const uid = nextSession?.user?.id ?? null;
      const existing = controller.getCurrent();
      // The SDK also emits SIGNED_IN on focus. A still-current same-owner
      // refresh must not discard pending explicit local changes.
      const sameOwnerRefresh = uid && existing?.userId === uid &&
        (event === "TOKEN_REFRESHED" || event === "SIGNED_IN");
      const guard = sameOwnerRefresh ? existing : controller.start(uid);
      if (uid && !guard?.isCurrent()) return;
      if (!uid) {
        const view = getStorageOwnershipSnapshot();
        if (view.status !== "ready" || view.owner?.kind !== "guest") return;
        const attempt = signOutAttempt.current;
        if (attempt?.controller === controller) attempt.guest = view;
        else setSignOutStatus("idle");
      } else {
        signOutAttempt.current = null;
        setSignOutStatus("idle");
      }
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      controller.dispose();
      if (sync.current === controller) {
        sync.current = null;
        signOutAttempt.current = null;
      }
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const controller = sync.current;
      if (!supabase || !controller) return { error: "Auth not configured" };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (sync.current !== controller) return { error: "Sign-in cancelled" };
      return { error: error?.message ?? null };
    },
    [supabase]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      const controller = sync.current;
      if (!supabase || !controller) return { error: "Auth not configured" };
      const { error } = await supabase.auth.signUp({ email, password });
      if (sync.current !== controller) return { error: "Sign-in cancelled" };
      return { error: error?.message ?? null };
    },
    [supabase]
  );

  const signInWithMagicLink = useCallback(
    async (email: string) => {
      const controller = sync.current;
      if (!supabase || !controller) return { error: "Auth not configured" };
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (sync.current !== controller) return { error: "Sign-in cancelled" };
      return { error: error?.message ?? null };
    },
    [supabase]
  );

  const signOut = useCallback(async (): Promise<SignOutResult> => {
    const controller = sync.current;
    if (!supabase || !controller) return { error: "unconfirmed" };
    if (signOutAttempt.current) return { error: "cancelled" };
    const attempt: SignOutAttempt = { controller, guest: null };
    signOutAttempt.current = attempt;
    setSignOutStatus("pending");
    const finish = (error: "unconfirmed" | null): SignOutResult => {
      if (sync.current !== controller || signOutAttempt.current !== attempt) return { error: "cancelled" };
      signOutAttempt.current = null;
      if (attempt.guest && getStorageOwnershipSnapshot() !== attempt.guest) {
        setSignOutStatus("idle");
        return { error: "cancelled" };
      }
      setSignOutStatus(error ? "error" : "idle");
      return { error };
    };
    try {
      // Fence local work before awaiting the SDK; never restore the old owner.
      controller.start(null);
      if (sync.current !== controller || signOutAttempt.current !== attempt) return { error: "cancelled" };
      const guest = getStorageOwnershipSnapshot();
      if (guest.status !== "ready" || guest.owner?.kind !== "guest") return finish("unconfirmed");
      attempt.guest = guest;
      setSession(null);
      if (getStorageOwnershipSnapshot() !== guest) return finish("unconfirmed");
      const { error } = await supabase.auth.signOut();
      return finish(error ? "unconfirmed" : null);
    } catch {
      return finish("unconfirmed");
    }
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{
        configured,
        loading: enabled ? loading : false,
        user,
        session: currentSession,
        signInWithPassword,
        signUp,
        signInWithMagicLink,
        signOutStatus: enabled ? signOutStatus : "idle",
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
