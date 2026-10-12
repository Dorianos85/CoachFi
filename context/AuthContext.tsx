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
import { pushEntity, syncOnLogin } from "@/lib/sync/cloudSync";
import { registerCloudPusher, type SyncEntity } from "@/lib/sync/syncQueue";

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  user: User | null;
  session: Session | null;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  configured: false,
  loading: true,
  user: null,
  session: null,
  signInWithPassword: async () => ({ error: "Auth not configured" }),
  signUp: async () => ({ error: "Auth not configured" }),
  signInWithMagicLink: async () => ({ error: "Auth not configured" }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabaseBrowserClient();
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const user = session?.user ?? null;

  // Debounce timers per entity so rapid local writes coalesce into one push.
  const timers = useRef<Partial<Record<SyncEntity, ReturnType<typeof setTimeout>>>>({});

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    // Register the pusher: mirror local changes to the cloud for the current user.
    const installPusher = (userId: string) => {
      registerCloudPusher((entity, payload) => {
        // Rewards are deltas — never debounce/coalesce them.
        if (entity === "reward") {
          void pushEntity(supabase, userId, entity, payload).catch(() => {});
          return;
        }
        clearTimeout(timers.current[entity]);
        timers.current[entity] = setTimeout(() => {
          void pushEntity(supabase, userId, entity, payload).catch(() => {});
        }, 800);
      });
    };

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setLoading(false);

      const uid = nextSession?.user?.id;
      if (uid) {
        installPusher(uid);
        try {
          await syncOnLogin(supabase, uid);
          // Contexts/components listen for this (plus "coachfi-tokens" dispatched
          // during reconcile) and re-read localStorage — no full page reload.
          window.dispatchEvent(new Event("coachfi-cloud-synced"));
        } catch {
          // Sync failures keep the app working in local-only mode.
        }
      } else {
        registerCloudPusher(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
      registerCloudPusher(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: "Auth not configured" };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    [supabase]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return { error: "Auth not configured" };
      const { error } = await supabase.auth.signUp({ email, password });
      return { error: error?.message ?? null };
    },
    [supabase]
  );

  const signInWithMagicLink = useCallback(
    async (email: string) => {
      if (!supabase) return { error: "Auth not configured" };
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      return { error: error?.message ?? null };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    registerCloudPusher(null);
    setSession(null);
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{
        configured,
        loading,
        user,
        session,
        signInWithPassword,
        signUp,
        signInWithMagicLink,
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
