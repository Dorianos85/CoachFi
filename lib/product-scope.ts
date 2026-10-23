/** Current release: financial learning for adults. Deferred features stay off. */
export type ProductFeature = "kids" | "web3" | "marketplace" | "leaderboard";

const FEATURES: Readonly<Record<ProductFeature, boolean>> = Object.freeze({
  kids: false,
  web3: false,
  marketplace: false,
  leaderboard: false,
});

export function isFeatureEnabled(feature: ProductFeature): boolean {
  return FEATURES[feature] === true;
}

/** Validate a local self-declaration; this does not verify someone's age. */
export function hasAdultConfirmation(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.mode !== "adult" || record.adultAgeRequirement !== 18) return false;
  if (Object.keys(record).some((key) => !["mode", "selectedAt", "adultConfirmedAt", "adultAgeRequirement"].includes(key))) return false;
  const timestamp = (candidate: unknown) => {
    if (typeof candidate !== "string") return null;
    const date = new Date(candidate);
    const time = date.getTime();
    return Number.isFinite(time) && time > 0 && time <= Date.now() + 60_000 && date.toISOString() === candidate ? time : null;
  };
  const selectedAt = timestamp(record.selectedAt);
  const confirmedAt = timestamp(record.adultConfirmedAt);
  return selectedAt !== null && confirmedAt !== null && confirmedAt >= selectedAt;
}

const DEFERRED_ROUTES: Readonly<Record<string, ProductFeature>> = Object.freeze({
  "/kids": "kids",
  "/vault": "web3",
  "/achievement": "web3",
  "/partner": "marketplace",
  "/marketplace": "marketplace",
  "/leaderboard": "leaderboard",
});

/** Only paths in the release scope may mount interactive route content. */
export function isRouteEnabled(href: string): boolean {
  const pathname = href.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  const feature = Object.entries(DEFERRED_ROUTES).find(([route]) => pathname === route || pathname.startsWith(`${route}/`))?.[1];
  return feature ? isFeatureEnabled(feature) : true;
}
