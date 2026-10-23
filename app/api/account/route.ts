import { deleteAccount, getAccount } from "@/lib/account-store";
import { accountError, accountJson, beginAccountAccess } from "@/lib/server/account-access";

export const runtime = "nodejs";

function accountBody(record: Awaited<ReturnType<typeof getAccount>>) {
  if (!record) return { account: null, state: null };
  return {
    account: {
      cdpUserId: record.cdpUserId,
      email: record.email,
      displayName: record.displayName,
      solanaAddress: record.solanaAddress,
      evmAddress: record.evmAddress,
      authProvider: record.authProvider,
      cdpCreatedAt: record.cdpCreatedAt,
      lastAuthenticatedAt: record.lastAuthenticatedAt,
      updatedAt: record.updatedAt,
    },
    state: record.state,
  };
}

export async function GET(req: Request) {
  const auth = await beginAccountAccess(req);
  if (auth instanceof Response) return auth;
  try {
    // Read-only access must not create an account or update identity metadata.
    const record = await getAccount(auth.userId);
    if (record && record.cdpUserId !== auth.userId) throw new Error("Account owner mismatch");
    return accountJson({ ok: true, configured: true, ...accountBody(record) });
  } catch {
    console.error("[account] READ_FAILED");
    return accountError("Account read failed", 500);
  }
}

export async function PUT(req: Request) {
  const auth = await beginAccountAccess(req);
  if (auth instanceof Response) return auth;

  // A verified owner alone cannot safely overwrite state without an atomic
  // server version precondition. Do not parse or replay the old request body.
  return accountError("Account writes paused", 503);
}

export async function DELETE(req: Request) {
  const auth = await beginAccountAccess(req);
  if (auth instanceof Response) return auth;
  try {
    await deleteAccount(auth.userId);
    // This deletes application records, not the external identity or sessions.
    // Preserve the existing JSON contract while making that scope explicit.
    return accountJson({ ok: true, configured: true }, 200, {
      "X-Coachfi-Deletion-Scope": "application-records",
      "X-Coachfi-Provider-Identity-Deletion": "not-performed",
      "X-Coachfi-Provider-Session-Revocation": "not-performed",
    });
  } catch {
    console.error("[account] DELETE_FAILED");
    return accountError("Account delete failed", 500);
  }
}
