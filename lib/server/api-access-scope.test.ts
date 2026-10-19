import { beforeEach, describe, expect, it, vi } from "vitest";
import { deferredFeatureResponse } from "@/lib/server/api-access-scope";

const feature = vi.hoisted(() => vi.fn(() => false));
vi.mock("@/lib/product-scope", () => ({ isFeatureEnabled: feature }));
beforeEach(() => feature.mockReset().mockReturnValue(false));

describe("deferred API features", () => {
  it("reports the adult scope as disabled", async () => {
    const response = deferredFeatureResponse("web3");
    expect(response.status).toBe(404);
    expect((await response.json()).code).toBe("FEATURE_DISABLED");
  });
  it("cannot restore an unsafe handler through a future feature flag alone", async () => {
    feature.mockReturnValue(true);
    const response = deferredFeatureResponse("leaderboard");
    expect(response.status).toBe(503);
    expect((await response.json()).code).toBe("FEATURE_NOT_READY");
  });
});
