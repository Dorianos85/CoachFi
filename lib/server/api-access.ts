import { assertSameOrigin } from "@/lib/api-security";
import { CONSENT_VERSION, type OptionalConsentKey } from "@/lib/consent";

export class ApiAccessError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string) {
    super(message);
    this.name = "ApiAccessError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Request intent only: not an authoritative stored consent or revocation ledger. */
export function validateDeclaredConsent(value: unknown, required: readonly OptionalConsentKey[]) {
  if (
    !isRecord(value) || value.version !== CONSENT_VERSION ||
    value.termsAccepted !== true || value.privacyAccepted !== true ||
    !isRecord(value.optional) || typeof value.acceptedAt !== "string"
  ) {
    throw new ApiAccessError("CONSENT_REQUIRED", 403, "Current consent is required.");
  }
  const acceptedAt = Date.parse(value.acceptedAt);
  if (!Number.isFinite(acceptedAt) || acceptedAt > Date.now() + 60_000) {
    throw new ApiAccessError("CONSENT_REQUIRED", 403, "Current consent is required.");
  }
  const optional = value.optional;
  for (const key of ["aiCoach", "voice", "leaderboard", "blockchain"] as const) {
    if (typeof optional[key] !== "boolean") {
      throw new ApiAccessError("CONSENT_REQUIRED", 403, "Current consent is required.");
    }
  }
  if (required.some((key) => optional[key] !== true)) {
    throw new ApiAccessError("CONSENT_REQUIRED", 403, "This optional feature is not enabled.");
  }
}

export function assertApiOrigin(req: Request) {
  try {
    assertSameOrigin(req);
  } catch {
    throw new ApiAccessError("ORIGIN_BLOCKED", 403, "Request origin is not allowed.");
  }
}

/** All identity comes from the existing CDP verifier, never client identity headers. */
export async function authenticateApiUser(req: Request) {
  assertApiOrigin(req);
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(header);
  if (!match || match[1].length > 8192) {
    throw new ApiAccessError("AUTH_REQUIRED", 401, "Sign in to use this feature.");
  }
  // Loading the provider SDK is deferred to this explicit verifier. Static
  // hard-off routes never import or initialize it as part of an API denial.
  const { cdpAuthConfigured, verifyCdpUser } = await import("@/lib/cdp-server");
  if (!cdpAuthConfigured()) {
    throw new ApiAccessError("AUTH_UNAVAILABLE", 503, "Sign-in verification is unavailable.");
  }
  try {
    const identity = await verifyCdpUser(match[1]);
    if (!identity.userId) throw new Error("Missing verified identity");
    return identity;
  } catch {
    // Do not return/log rejected tokens, SDK exceptions or user profile contents.
    throw new ApiAccessError("AUTH_INVALID", 401, "Sign-in verification failed.");
  }
}

export function accessErrorResponse(error: unknown) {
  if (error instanceof ApiAccessError) {
    return Response.json({ ok: false, code: error.code, error: error.message }, {
      status: error.status,
      headers: { "Cache-Control": "no-store" },
    });
  }
  const tooLarge = error instanceof Error && error.message === "Payload too large";
  return Response.json({ ok: false, code: tooLarge ? "BODY_TOO_LARGE" : "INVALID_REQUEST", error: tooLarge ? "Request body is too large." : "Invalid request." }, {
    status: tooLarge ? 413 : 400,
    headers: { "Cache-Control": "no-store" },
  });
}
