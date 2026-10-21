import { getAccount, listCertificates } from "@/lib/account-store";
import { buildAccountDataExport } from "@/lib/account-export";
import { accountError, accountJson, beginAccountAccess } from "@/lib/server/account-access";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await beginAccountAccess(req);
  if (auth instanceof Response) return auth;
  try {
    const account = await getAccount(auth.userId);
    if (account && account.cdpUserId !== auth.userId) throw new Error("Account owner mismatch");
    // A missing application account is explicit; never create or seed it.
    const certificates = account ? await listCertificates(auth.userId) : [];
    return accountJson(buildAccountDataExport(auth.userId, account, certificates), 200, {
      "Content-Disposition": 'attachment; filename="coachfi-application-data.json"',
    });
  } catch {
    console.error("[account] EXPORT_FAILED");
    return accountError("Account export failed", 500);
  }
}
