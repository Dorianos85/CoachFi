import { jsonError } from "@/lib/api-security";
import { cdpAuthConfigured, verifyCdpUser, type CdpIdentity } from "@/lib/cdp-server";

/** Same Bearer-token rules as /api/account and /api/certificates. */
export function bearerToken(req: Request) {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return "";
  const token = header.slice("Bearer ".length).trim();
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token) ? token : "";
}

/**
 * Verifies the Coinbase CDP access token (cdp.endUser.validateAccessToken) and returns the
 * signed-in identity, or a ready 401/503 Response.
 */
export async function requireCdpUser(req: Request): Promise<CdpIdentity | Response> {
  if (!cdpAuthConfigured()) return jsonError("Sign-in is not configured", 503);
  const token = bearerToken(req);
  if (!token) return jsonError("Sign in required", 401);
  try {
    return await verifyCdpUser(token);
  } catch (error) {
    console.error("[auth] access token rejected", error instanceof Error ? error.message : "invalid token");
    return jsonError("Sign in required", 401);
  }
}
