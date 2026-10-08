import { assertSameOrigin, jsonError, rateLimit, readJsonWithLimit, sanitizeDisplayName } from "@/lib/api-security";
import { accountStorageConfigured, deleteAccount, getAccount, saveAccount } from "@/lib/account-store";
import { sanitizeAccountSnapshot } from "@/lib/account-snapshot";
import { privyAuthConfigured, verifyPrivyUserId } from "@/lib/privy-server";

export const runtime = "nodejs";

const ACCOUNT_BODY_LIMIT = 300_000;

function bearerToken(req: Request) {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return "";
  return header.slice("Bearer ".length).trim();
}

function looksLikeJwt(token: string) {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
}

function sanitizeEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > 320 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return null;
  return email;
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
  if (!privyAuthConfigured() || !accountStorageConfigured()) {
    return Response.json({ ok: false, configured: false });
  }

  try {
    return { userId: await verifyPrivyUserId(token) };
  } catch (error) {
    console.error("[account] access token rejected", error instanceof Error ? error.message : "invalid token");
    return jsonError("Unauthorized", 401);
  }
}

function accountBody(record: Awaited<ReturnType<typeof getAccount>>) {
  if (!record) return { account: null, state: null };
  return {
    account: {
      privyUserId: record.privyUserId,
      email: record.email,
      displayName: record.displayName,
      updatedAt: record.updatedAt,
    },
    state: record.state,
  };
}

export async function GET(req: Request) {
  const auth = await begin(req);
  if (auth instanceof Response) return auth;
  try {
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

  let body: { email?: unknown; displayName?: unknown; state?: unknown };
  try {
    body = await readJsonWithLimit(req, ACCOUNT_BODY_LIMIT);
  } catch (error) {
    const message = error instanceof Error && error.message === "Payload too large" ? "Payload too large" : "Invalid payload";
    return jsonError(message, 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) return jsonError("Invalid payload", 400);
  const state = sanitizeAccountSnapshot(body.state);
  if (!state) return jsonError("Invalid account snapshot", 400);

  let email: string | null | undefined;
  if ("email" in body && body.email != null) {
    email = sanitizeEmail(body.email);
    if (!email) return jsonError("Invalid email", 400);
  }

  let displayName: string | null | undefined;
  if ("displayName" in body && body.displayName != null) {
    displayName = sanitizeDisplayName(body.displayName, "") || null;
    if (!displayName) return jsonError("Invalid display name", 400);
  }

  try {
    const record = await saveAccount(auth.userId, { state, email, displayName });
    return Response.json({ ok: true, configured: true, ...accountBody(record) });
  } catch (error) {
    console.error("[account PUT]", error instanceof Error ? error.message : "write failed");
    return jsonError("Account save failed", 500);
  }
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
