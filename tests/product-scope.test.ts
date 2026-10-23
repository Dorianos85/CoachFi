import { describe, expect, it, vi } from "vitest";
import { hasAdultConfirmation, isFeatureEnabled, isRouteEnabled } from "@/lib/product-scope";

describe("adult release scope", () => {
  it("keeps every deferred feature disabled despite public environment overrides", () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_KIDS", "true");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_WEB3", "true");
    try {
      for (const feature of ["kids", "web3", "marketplace", "leaderboard"] as const) expect(isFeatureEnabled(feature)).toBe(false);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("blocks direct and nested deferred routes with query/hash suffixes", () => {
    for (const route of ["/kids", "/kids/lesson", "/vault/", "/partner?segment=school", "/achievement?score=100", "/marketplace#offer", "/leaderboard"]) expect(isRouteEnabled(route)).toBe(false);
    for (const route of ["/", "/learn", "/learn/family-plan", "/quiz?topic=saving", "/rewards", "/accessibility", "/health-check", "/privacy", "/kidscopy"]) expect(isRouteEnabled(route)).toBe(true);
  });

  it("requires a complete canonical adult self-declaration and rejects legacy/malformed records", () => {
    const now = new Date().toISOString();
    const valid = { mode: "adult", selectedAt: now, adultConfirmedAt: now, adultAgeRequirement: 18 };
    expect(hasAdultConfirmation(valid)).toBe(true);
    for (const record of [null, [], { ...valid, mode: "kids" }, { ...valid, adultAgeRequirement: undefined }, { ...valid, adultConfirmedAt: undefined }, { ...valid, selectedAt: "invalid" }, { ...valid, adultConfirmedAt: "2026-01-01" }, { ...valid, selectedAt: new Date(Date.now() + 120_000).toISOString() }, { ...valid, adultConfirmedAt: new Date(Date.now() - 60_000).toISOString() }, { ...valid, guardian: true }]) expect(hasAdultConfirmation(record)).toBe(false);
  });

});
