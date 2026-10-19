import { assertSameOrigin, jsonError, rateLimit } from "@/lib/api-security";
import { accountStorageConfigured, deleteAccount, getAccount } from "@/lib/account-store";
import { cdpAuthConfigured, verifyCdpUser } from "@/lib/cdp-server";

export const runtime = "nodejs";

function bearerToken(req: Request) {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return "";
  return header.slice("Bearer ".length).trim();
}

function looksLikeJwt(token: string) {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
}

async function begin(req: Request) {
  try {
    assertSameOrigin(req);
    rateLimit(req, "account", 30);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request blocked";
    return jsonError(message, message === "Too many requests" ? 429 : 403);
  }

  const token = bearerToken(req);
  if (!token || !looksLikeJwt(token)) return jsonError("Unauthorized", 401);
  if (!cdpAuthConfigured() || !accountStorageConfigured()) {
    return Response.json({ ok: false, configured: false });
  }

  try {
    const identity = await verifyCdpUser(token);
    // A session-bound client can detect a token getter switching identities
    // before its UI cleanup runs. This is a precondition, never authorization:
    // the verified bearer identity remains the only owner used for storage.
    const expectedUserId = req.headers.get("x-coachfi-account-user-id");
    if (expectedUserId !== null && expectedUserId !== identity.userId) {
      return jsonError("Account session changed", 409);
    }
    return { userId: identity.userId, identity };
  } catch (error) {
    console.error("[account] access token rejected", error instanceof Error ? error.message : "invalid token");
    return jsonError("Unauthorized", 401);
  }
}

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
  const auth = await begin(req);
  if (auth instanceof Response) return auth;
  try {
    // Read-only access must not create an account or update identity metadata.
    const record = await getAccount(auth.userId);
    return Response.json({ ok: true, configured: true, ...accountBody(record) });
  } catch (error) {
    console.error("[account GET]", error instanceof Error ? error.message : "read failed");
    return jsonError("Account read failed", 500);
  }
}

export async function PUT(req: Request) {
  const auth = await begin(req);
  if (auth instanceof Response) return auth;

  // A verified owner alone cannot safely overwrite state without an atomic
  // server version precondition. Do not parse or replay the old request body.
  return jsonError("Account writes paused", 503);
}

export async function DELETE(req: Request) {
  const auth = await begin(req);
  if (auth instanceof Response) return auth;
  try {
    await deleteAccount(auth.userId);
    return Response.json({ ok: true, configured: true });
  } catch (error) {
    console.error("[account DELETE]", error instanceof Error ? error.message : "delete failed");
    return jsonError("Account delete failed", 500);
  }
}
