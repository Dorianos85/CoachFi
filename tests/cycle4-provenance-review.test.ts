import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

// Independent acceptance replacements for four reproduced B14 baseline risks.
// Historical behaviour and hashes remain in evidence/cycle-4/review-baseline.json.
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

describe("independent B14 provenance acceptance", () => {
  let bytes: Map<string, string>;
  let local: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  let request: Mock<typeof fetch>;
  let stop: (() => Promise<void>) | undefined;
  beforeEach(async () => {
    vi.resetModules();
    bytes = new Map(); stop = undefined;
    local = {
      getItem: (key) => bytes.get(key) ?? null,
      setItem: (key, value) => { bytes.set(key, value); },
      removeItem: (key) => { bytes.delete(key); },
    };
    vi.stubGlobal("localStorage", local);
    vi.stubGlobal("window", { localStorage: local, sessionStorage: { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() }, dispatchEvent: vi.fn(() => true),
      addEventListener: vi.fn(), removeEventListener: vi.fn() });
    request = vi.fn<typeof fetch>(() => { throw new Error("No unstubbed request is permitted."); });
    vi.stubGlobal("fetch", request);
    const store = await import("@/lib/product-storage"); store.initializeStorageOwnership(false);
  });
  afterEach(async () => { await stop?.(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  function remote(tokens: number, uid = "FIXTURE_A") {
    return new Response(JSON.stringify({ ok: true, account: { cdpUserId: uid },
      state: { version: 1, tokens } }), { status: 200 });
  }
  async function seedDeviceDiagnosis() {
    const consent = await import("@/lib/consent");
    const health = await import("@/lib/healthCheck");
    bytes.set(consent.CONSENT_STORAGE_KEY, JSON.stringify(consent.createConsentRecord({ voice: true })));
    bytes.set("coachfi-user", JSON.stringify({ name: "FIXTURE_PERSON_A", goal: "FIXTURE_A_GOAL", setupDone: true }));
    const value = health.saveHealthCheck({ monthlyIncome: 1234, monthlyExpenses: 1000,
      savings: 3000, debt: 0, cashHeld: 0, hasEmergencyFund: true,
      understandsInflation: true, hasRetirementPlan: false, investsAlready: false,
      mainFinancialGoal: "FIXTURE_LOCAL_GOAL" });
    return { consent, health, value, user: await import("@/lib/user") };
  }

  it("preserves exact guest learning/profile bytes through private account hydration and actual logout-name cleanup", async () => {
    const guest = new Map([
      ["coachfi-tokens", "00321"], ["coachfi-srs", " []\n"],
      ["coachfi-learn-manual", "{ \"budget\":\"started\" }"],
      ["coachfi-streak", "{\"current\":2,\"longest\":2,\"lastDay\":\"2026-10-13\"}"],
      ["coachfi-user", "{ \"name\":\"FIXTURE_GUEST_NAME\",\"goal\":\"FIXTURE_GOAL\",\"setupDone\":true }\n"],
    ]);
    for (const [key, value] of guest) bytes.set(key, value);
    const pending = deferred<Response>(); request.mockImplementationOnce(() => pending.promise);
    const sync = await import("@/lib/account-sync"); stop = sync.endLearningSession;
    const lease = sync.startLearningSession({ id: "FIXTURE_A" }, async () => "FIXTURE_TOKEN_A");
    await vi.waitFor(() => expect(request).toHaveBeenCalledOnce());
    for (const [key, value] of guest) expect(bytes.get(key)).toBe(value);
    pending.resolve(remote(88)); expect((await lease.ready).status).toBe("ready");
    const store = await import("@/lib/product-storage"), accountView = store.captureCurrentPersonalStorage();
    expect(accountView.getItem("coachfi-tokens")).toBe("88");
    for (const [key, value] of guest) expect(bytes.get(key)).toBe(value);
    await sync.endLearningSession(undefined, accountView);
    await sync.clearSignedInName(undefined, accountView);
    for (const [key, value] of guest) expect(bytes.get(key)).toBe(value);
    expect(store.getStorageOwnershipSnapshot().owner).toEqual({ kind: "guest" });
    expect(store.captureCurrentPersonalStorage().getItem("coachfi-tokens")).toBe("00321");
    expect(request).toHaveBeenCalledOnce(); // No automatic upload/seed is asserted here.
  });

  it("B failed login has its own local-only view without guest or A profile/diagnosis/consent", async () => {
    const device = await seedDeviceDiagnosis();
    const originalHealth = bytes.get("coachfi-health-check");
    const originalConsent = bytes.get(device.consent.CONSENT_STORAGE_KEY);
    request.mockResolvedValueOnce(remote(17));
    const sync = await import("@/lib/account-sync"); stop = sync.endLearningSession;
    expect((await sync.startLearningSession({ id: "FIXTURE_A" }, async () => "FIXTURE_TOKEN_A").ready).status).toBe("ready");
    const store = await import("@/lib/product-storage"), aView = store.captureCurrentPersonalStorage();
    device.user.saveUser({ name: "FIXTURE_ACCOUNT_A", goal: "FIXTURE_ACCOUNT_A_GOAL", setupDone: true }, aView);
    device.consent.writeStoredConsent(device.consent.createConsentRecord({ voice: true }), aView);
    device.health.saveHealthCheck({ ...device.value.answers, monthlyIncome: 4321 }, aView);
    const pendingB = deferred<Response>(); request.mockImplementationOnce(() => pendingB.promise);
    const b = sync.startLearningSession({ id: "FIXTURE_B" }, async () => "FIXTURE_TOKEN_B");
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(device.user.getUser().name).toBe("");
    expect(device.health.getHealthCheck()).toBeNull(); expect(device.consent.readStoredConsent()).toBeNull();
    pendingB.resolve(new Response(JSON.stringify({ ok: false }), { status: 500 }));
    expect((await b.ready).status).toBe("unavailable");
    expect(device.user.getUser().goal).toBe("");
    expect(device.health.getHealthCheck()).toBeNull();
    expect(device.consent.hasConsentFor(device.consent.readStoredConsent(), ["voice"])).toBe(false);
    expect(store.getStorageOwnershipSnapshot()).toMatchObject({ status: "ready", localOnly: true,
      owner: { kind: "account", provider: "cdp", userId: "FIXTURE_B" } });
    expect(bytes.get("coachfi-health-check")).toBe(originalHealth);
    expect(bytes.get(device.consent.CONSENT_STORAGE_KEY)).toBe(originalConsent);
    expect(request.mock.calls.every(([, init]) => init?.method === "GET")).toBe(true);
  });

  it("selected owned export includes only B data with provenance and sanitizes free text/SDK keys", async () => {
    const device = await seedDeviceDiagnosis(); request.mockResolvedValueOnce(remote(88, "FIXTURE_B"));
    const sync = await import("@/lib/account-sync"); stop = sync.endLearningSession;
    await sync.startLearningSession({ id: "FIXTURE_B" }, async () => "FIXTURE_TOKEN_B").ready;
    const store = await import("@/lib/product-storage"), viewB = store.captureCurrentPersonalStorage();
    device.consent.writeStoredConsent(device.consent.createConsentRecord(), viewB);
    device.health.saveHealthCheck({ ...device.value.answers, monthlyIncome: 4321 }, viewB);
    device.user.saveUser({ name: "FIXTURE_PERSON_B", goal: "FIXTURE_B_GOAL", setupDone: true }, viewB);
    bytes.set("FIXTURE_sdk_credential", "FIXTURE_NEVER_EXPORTED");
    const data = await import("@/lib/data-export");
    const result = data.buildOwnedLocalDataExport(viewB, store.captureCurrentPersonalStorage("session"));
    expect(result.scope).toBe("selected_current_owner_local_product_data"); expect(result.ownerKind).toBe("account");
    expect(result.localStorage["coachfi-tokens"]).toBe(88);
    expect((result.localStorage["coachfi-health-check"] as { answers: { monthlyIncome: number } }).answers.monthlyIncome).toBe(4321);
    expect(result.localStorage["coachfi-user"]).toEqual({ setupDone: true });
    expect(result).not.toHaveProperty("owner");
    expect(JSON.stringify(result)).not.toContain("FIXTURE_NEVER_EXPORTED");
    expect(JSON.stringify(result)).not.toContain("FIXTURE_PERSON_A");
    expect(JSON.stringify(result)).not.toContain("FIXTURE_PERSON_B");
  });

  it("owned deletion removes an unconfirmed marker, aborts its lease and retains guest/SDK data without replay", async () => {
    const device = await seedDeviceDiagnosis(); request.mockResolvedValueOnce(remote(88, "FIXTURE_B"));
    const sync = await import("@/lib/account-sync"); stop = sync.endLearningSession;
    const b = sync.startLearningSession({ id: "FIXTURE_B" }, async () => "FIXTURE_TOKEN_B"); await b.ready;
    const store = await import("@/lib/product-storage"), viewB = store.captureCurrentPersonalStorage();
    viewB.setItem("coachfi-tokens", "99"); sync.persistLearningState("tokens", viewB);
    await Promise.resolve(); expect(request).toHaveBeenCalledOnce();
    expect(viewB.getItem("coachfi-learning-rev")).toBe("local-unconfirmed-v1");
    const originalProfile = bytes.get("coachfi-user"), originalHealth = bytes.get("coachfi-health-check"), originalConsent = bytes.get(device.consent.CONSENT_STORAGE_KEY);
    bytes.set("coachfi-unknown-FIXTURE", "FIXTURE_KEEP");
    bytes.set("FIXTURE_sdk_credential", "FIXTURE_KEEP");
    const data = await import("@/lib/data-export"); expect(data.deleteLocalProductData(viewB)).toBe(true);
    expect(b.isCurrent()).toBe(false); expect(request.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(bytes.has("coachfi-owned:v1:cdp:FIXTURE_B:coachfi-learning-rev")).toBe(false);
    expect(bytes.has("coachfi-owned:v1:cdp:FIXTURE_B:coachfi-tokens")).toBe(false);
    expect(store.getStorageOwnershipSnapshot().status).toBe("pending");
    expect(bytes.get("coachfi-user")).toBe(originalProfile);
    expect(bytes.get("coachfi-health-check")).toBe(originalHealth);
    expect(bytes.get(device.consent.CONSENT_STORAGE_KEY)).toBe(originalConsent);
    expect(bytes.get("FIXTURE_sdk_credential")).toBe("FIXTURE_KEEP");
    expect(bytes.get("coachfi-unknown-FIXTURE")).toBe("FIXTURE_KEEP");
    sync.persistLearningState("tokens", viewB); expect(viewB.setItem("coachfi-tokens", "777")).toBe(false);
    await Promise.resolve(); await Promise.resolve();
    expect(bytes.has("coachfi-owned:v1:cdp:FIXTURE_B:coachfi-learning-rev")).toBe(false);
    expect(request).toHaveBeenCalledOnce(); expect(request.mock.calls.some(([, init]) => init?.method === "PUT")).toBe(false);
  });
});
