import { requireAdmin } from "@/lib/admin-access";
import { rateLimit } from "@/lib/api-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    rateLimit(req, "admin-overview", 20);
    const access = await requireAdmin(req);
    if (access.response) return access.response;
    const db = access.client;
    const raw = Number(new URL(req.url).searchParams.get("page") ?? 1);
    const page = Number.isFinite(raw) ? Math.min(10000, Math.max(1, Math.floor(raw))) : 1;
    const offset = (page - 1) * 25;
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const [accounts, active, progress, certificates, legacy] = await Promise.all([
      db.from("coachfi_accounts").select("cdp_user_id,email,display_name,auth_provider,created_at,last_authenticated_at,updated_at", { count: "exact" }).order("updated_at", { ascending: false }).range(offset, offset + 24),
      db.from("coachfi_accounts").select("cdp_user_id", { count: "exact", head: true }).gte("last_authenticated_at", since),
      db.from("coachfi_progress").select("cdp_user_id", { count: "exact", head: true }),
      db.from("coachfi_certificates").select("cdp_user_id", { count: "exact", head: true }).not("chain_checked_at", "is", null),
      db.from("profiles").select("id,name,created_at,updated_at", { count: "exact" }).order("updated_at", { ascending: false }).range(offset, offset + 24),
    ]);
    for (const result of [accounts, active, progress, certificates, legacy]) if (result.error) throw result.error;
    return Response.json({
      page, pageSize: 25,
      metrics: { accounts: accounts.count ?? 0, active7Days: active.count ?? 0, learningProfiles: progress.count ?? 0, chainCheckedCertificates: certificates.count ?? 0, legacyProfiles: legacy.count ?? 0 },
      accounts: accounts.data ?? [], legacyProfiles: legacy.data ?? [],
      note: "CDP accounts and earlier profiles are separate; totals must not be added as unique users.",
    }, { headers: { "Cache-Control": "private, no-store", Vary: "Authorization" } });
  } catch (error) {
    const limited = error instanceof Error && error.message === "Too many requests";
    return Response.json({ error: limited ? "Too many requests" : "Admin data unavailable" }, { status: limited ? 429 : 500, headers: { "Cache-Control": "no-store" } });
  }
}
