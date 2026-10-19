"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

let browserClient: SupabaseClient<Database> | null = null;

/**
 * Singleton Supabase client for the browser. Uses the public anon key and
 * persists the auth session in localStorage so RLS-protected reads/writes
 * work once a user is signed in. Returns null when env vars are absent so the
 * app keeps its graceful localStorage-only fallback.
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  if (!browserClient) {
    browserClient = createClient<Database>(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "coachfi-auth",
      },
    });
  }
  return browserClient;
}

export const isSupabaseConfigured = (): boolean =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
