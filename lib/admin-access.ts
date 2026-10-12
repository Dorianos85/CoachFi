import { createClient } from "@supabase/supabase-js";
import { getOptionalEnv } from "@/lib/server-env";
import { cdpAuthConfigured, verifyCdpUser } from "@/lib/cdp-server";

export function adminEmailAllowed(email: string | undefined) {
  const allowed = (getOptionalEnv("COACHFI_ADMIN_EMAILS") ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  return Boolean(email && allowed.includes(email.trim().toLowerCase()));
}

export function adminServiceClient() {
  const url = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = getOptionalEnv("SUPABASE_SECRET_KEY") ?? getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

export async function requireAdmin(req: Request) {
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return { response: Response.json({ error: "Authentication required" }, { status: 401 }) };
  const client = adminServiceClient();
  if (!client) return { response: Response.json({ error: "Admin database is not configured" }, { status: 503 }) };
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    if (cdpAuthConfigured()) {
      try {
        const identity = await verifyCdpUser(token);
        if (adminEmailAllowed(identity.email ?? undefined)) return { client, user: { id: identity.userId } };
        return { response: Response.json({ error: "Administrator access required" }, { status: 403 }) };
      } catch { /* A token must be verified by one of the configured identity providers. */ }
    }
    return { response: Response.json({ error: "Invalid session" }, { status: 401 }) };
  }
  if (!data.user.email_confirmed_at || !adminEmailAllowed(data.user.email)) {
    return { response: Response.json({ error: "Administrator access required" }, { status: 403 }) };
  }
  return { client, user: data.user };
}
