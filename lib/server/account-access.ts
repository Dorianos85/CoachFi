import { assertSameOrigin, rateLimit } from "@/lib/api-security";
import { accountStorageConfigured } from "@/lib/account-store";
import { cdpAuthConfigured, verifyCdpUser } from "@/lib/cdp-server";

/** Private account responses must never be retained by HTTP caches. */
export function accountJson(body: unknown, status = 200, extraHeaders?: HeadersInit) {
  const headers = new Headers(extraHeaders);
  headers.set("Cache-Control", "no-store");
  headers.set("Pragma", "no-cache");
  return Response.json(body, { status, headers });
}

export function accountError(message: string, status: number) {
  return accountJson({ ok: false, error: message }, status);
}

/** The expected-owner header is only a precondition; CDP verifies the owner. */
export async function beginAccountAccess(req: Request) {
  try {
    assertSameOrigin(req);
    rateLimit(req, "account", 30);
  } catch (error) {
    const limited = error instanceof Error && error.message === "Too many requests";
    return accountError(limited ? "Too many requests" : "Cross-origin request blocked", limited ? 429 : 403);
  }

  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token || token.length > 8192 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
    return accountError("Unauthorized", 401);
  }
  if (!cdpAuthConfigured() || !accountStorageConfigured()) {
    return accountJson({ ok: false, configured: false });
  }

  try {
    const identity = await verifyCdpUser(token);
    if (typeof identity.userId !== "string" || !identity.userId.trim()) throw new Error("Missing owner");
    const expectedUserId = req.headers.get("x-coachfi-account-user-id");
    if (expectedUserId !== null && expectedUserId !== identity.userId) {
      return accountError("Account session changed", 409);
    }
    return { userId: identity.userId };
  } catch {
    // SDK errors can contain bearer tokens or identity details. Log only a code.
    console.error("[account] AUTH_REJECTED");
    return accountError("Unauthorized", 401);
  }
}
