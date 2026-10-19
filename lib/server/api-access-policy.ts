import type { OptionalConsentKey } from "@/lib/consent";
import { assertApiOrigin, ApiAccessError } from "@/lib/server/api-access";

// P0 deliberately has no external provider adapter. A key or environment flag
// cannot enable calls. Before enabling: authoritative consent/revocation,
// atomic durable per-user+global quota and a reviewed worst-case cost budget.
// A local Map, an invite code or client counters satisfy none of these gates.
export const EXTERNAL_AI_POLICY = Object.freeze({
  enabled: false,
  durableQuota: false,
  approvedBudget: false,
  authoritativeConsent: false,
});

export async function denyExternalAiUnlessReady(
  req: Request,
  _declaredConsent: unknown,
  _requiredConsent: readonly OptionalConsentKey[],
): Promise<never> {
  assertApiOrigin(req);
  // Static hard-off precedes even CDP authentication: token validation itself
  // contacts an external service. No syntactic token may trigger that call.
  // The separate verifier/declaration helpers grant no access in this release.
  throw new ApiAccessError(
    "EXTERNAL_AI_DISABLED",
    503,
    "External Mila is unavailable. You can continue with local text and lessons.",
  );
}
