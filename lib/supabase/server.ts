import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { getOptionalEnv } from "@/lib/server-env";

/**
 * Server-side Supabase client for API routes. Prefers the service-role key
 * (bypasses RLS — needed for trusted server writes such as the leaderboard
 * upsert and billing/mint webhooks) and falls back to the anon key for
 * read-only access. Returns null when Supabase env vars are absent.
 */
export function getSupabaseAdminClient(): SupabaseClient<Database> | null {
  const url = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key =
    getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY") ?? getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !key) return null;

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const hasServiceRoleKey = (): boolean =>
  getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY") !== undefined;
