import { isFeatureEnabled, type ProductFeature } from "@/lib/product-scope";

/** Disabled scope is resolved before auth, DB, SDK or provider/RPC calls. */
export function deferredFeatureResponse(feature: ProductFeature) {
  const enabled = isFeatureEnabled(feature);
  // Enabling a UI flag alone must not restore these retired unsafe handlers.
  return Response.json({
    ok: false,
    code: enabled ? "FEATURE_NOT_READY" : "FEATURE_DISABLED",
    error: "This feature is not available in the current release.",
  }, { status: enabled ? 503 : 404, headers: { "Cache-Control": "no-store" } });
}
