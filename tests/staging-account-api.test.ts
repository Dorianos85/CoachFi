import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AccountRecord, CertificateRecord } from "@/lib/account-store";

const CANARY = "SYNTHETIC_CREDENTIAL_NEVER_EXPORT_OR_LOG";
const token = "synthetic.payload.signature";
const owner = "SYNTHETIC_A";
const other = "SYNTHETIC_B";
const at = "2026-10-21T10:00:00.000Z";
const fixture = vi.hoisted(() => ({
  configured: vi.fn(() => true), storageConfigured: vi.fn(() => true),
  verify: vi.fn<() => Promise<{ userId: string }>>(),
  read: vi.fn<(id: string) => Promise<AccountRecord | null>>(),
  certificates: vi.fn<(id: string) => Promise<CertificateRecord[]>>(),
  erase: vi.fn<(id: string) => Promise<void>>(), save: vi.fn(), identity: vi.fn(),
}));
vi.mock("@/lib/cdp-server", () => ({ cdpAuthConfigured: fixture.configured, verifyCdpUser: fixture.verify }));
vi.mock("@/lib/account-store", () => ({
  accountStorageConfigured: fixture.storageConfigured, getAccount: fixture.read,
  listCertificates: fixture.certificates, deleteAccount: fixture.erase,
  saveAccount: fixture.save, saveCdpIdentity: fixture.identity,
}));

function stored(id = owner): AccountRecord {
  return {
    cdpUserId: id, email: CANARY, displayName: CANARY, solanaAddress: CANARY,
    evmAddress: CANARY, authProvider: CANARY, cdpCreatedAt: at,
    lastAuthenticatedAt: at, updatedAt: at,
    state: { version: 1, tokens: 25, profile: { name: CANARY, goal: CANARY, setupDone: true },
      learnManual: { "money-mindset": "completed", [CANARY]: CANARY },
      avatar: { gender: "female", style: "builder", access_token: CANARY },
      challenge: { date: "2026-10-21", refresh_token: CANARY }, vault: { secret: CANARY },
      health: { raw: CANARY } },
    cdp_profile: { access_token: CANARY },
  } as AccountRecord;
}
function certificate(id = owner): CertificateRecord {
  return { cdpUserId: id, certificateId: "money-mindset", status: "owned", minted: true,
    assetAddress: CANARY, ownerAddress: CANARY, txHash: CANARY, chainCheckedAt: at, updatedAt: at };
}
function request(method = "GET", headers: Record<string, string> = {}, path = "/api/account") {
  return new Request(`https://coachfi.test${path}`, { method,
    headers: { authorization: `Bearer ${token}`, "x-coachfi-account-user-id": owner, ...headers } });
}
async function call(method: "GET" | "PUT" | "DELETE" | "EXPORT", req = request(method === "EXPORT" ? "GET" : method)) {
  if (method === "EXPORT") return (await import("@/app/api/account/export/route")).GET(req);
  return (await import("@/app/api/account/route"))[method](req);
}
function privateResponse(response: Response) {
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("pragma")).toBe("no-cache");
}
function noStorage() {
  expect(fixture.read).not.toHaveBeenCalled(); expect(fixture.certificates).not.toHaveBeenCalled();
  expect(fixture.erase).not.toHaveBeenCalled(); expect(fixture.save).not.toHaveBeenCalled();
  expect(fixture.identity).not.toHaveBeenCalled();
}
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks();
  fixture.configured.mockReturnValue(true); fixture.storageConfigured.mockReturnValue(true);
  fixture.verify.mockResolvedValue({ userId: owner }); fixture.read.mockResolvedValue(stored());
  fixture.certificates.mockResolvedValue([certificate()]); fixture.erase.mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No actual provider or outbound calls permitted."); }));
});
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("account private API boundaries (actual routes, synthetic provider/store)", () => {
  it.each(["GET", "PUT", "DELETE"] as const)("%s private success/write-off is never cacheable", async (method) => {
    const response = await call(method); expect(response.status).toBe(method === "PUT" ? 503 : 200);
    privateResponse(response);
  });
  it.each(["GET", "PUT", "DELETE", "EXPORT"] as const)("%s denies missing bearer with no-store before provider/store", async (method) => {
    const response = await call(method, request(method === "EXPORT" ? "GET" : method, { authorization: "" }));
    expect(response.status).toBe(401); privateResponse(response); expect(fixture.verify).not.toHaveBeenCalled(); noStorage();
  });
  it.each(["GET", "EXPORT"] as const)("%s denies oversized JWT before any provider/storage call", async (method) => {
    const response = await call(method, request("GET", { authorization: `Bearer ${"a".repeat(8189)}.b.c` }));
    expect(response.status).toBe(401); privateResponse(response); expect(fixture.verify).not.toHaveBeenCalled(); noStorage();
  });
  it("accepts the exact 8192 character syntactic limit for provider verification", async () => {
    const boundary = `${"a".repeat(8188)}.b.c`;
    expect(boundary).toHaveLength(8192);
    const response = await call("GET", request("GET", { authorization: `Bearer ${boundary}` }));
    expect(response.status).toBe(200); expect(fixture.verify).toHaveBeenCalledExactlyOnceWith(boundary);
    privateResponse(response);
  });
  it.each(["GET", "EXPORT"] as const)("%s denies foreign origin before provider/store", async (method) => {
    const response = await call(method, request("GET", { origin: "https://foreign.test" }));
    expect(response.status).toBe(403); privateResponse(response); expect(fixture.verify).not.toHaveBeenCalled(); noStorage();
  });
  it.each(["GET", "EXPORT"] as const)("%s keeps unconfigured responses private", async (method) => {
    fixture.storageConfigured.mockReturnValue(false);
    const response = await call(method); expect(await response.json()).toEqual({ ok: false, configured: false });
    privateResponse(response); expect(fixture.verify).not.toHaveBeenCalled(); noStorage();
  });
  it.each(["GET", "DELETE", "EXPORT"] as const)("%s rejects a late verified B identity while client still expects A", async (method) => {
    fixture.verify.mockResolvedValue({ userId: other });
    const response = await call(method); expect(response.status).toBe(409); privateResponse(response); noStorage();
  });
  it.each(["GET", "EXPORT"] as const)("%s rejects provider identities without a user ID", async (method) => {
    fixture.verify.mockResolvedValue({ userId: "" });
    const response = await call(method); expect(response.status).toBe(401); privateResponse(response); noStorage();
  });
  it("rejected provider errors never disclose SDK details in response or logs", async () => {
    fixture.verify.mockRejectedValue(new Error(CANARY));
    const response = await call("GET"); expect(response.status).toBe(401); privateResponse(response);
    expect(await response.text()).not.toContain(CANARY);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(CANARY); noStorage();
  });
  it.each(["GET", "DELETE"] as const)("%s storage failure is private and never logs raw storage details", async (method) => {
    if (method === "GET") fixture.read.mockRejectedValue(new Error(CANARY));
    else fixture.erase.mockRejectedValue(new Error(CANARY));
    const response = await call(method); expect(response.status).toBe(500); privateResponse(response);
    expect(await response.text()).not.toContain(CANARY);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(CANARY);
  });
  it("GET fails closed if the store returns a different owner's record", async () => {
    fixture.read.mockResolvedValue(stored(other));
    const response = await call("GET"); expect(response.status).toBe(500); privateResponse(response);
    expect(await response.text()).not.toContain(other);
  });
  it.each(["GET", "EXPORT"] as const)("%s process limiter returns private429 before verification on excess requests", async (method) => {
    for (let index = 0; index < 30; index += 1) await call(method);
    fixture.verify.mockClear(); fixture.read.mockClear(); fixture.certificates.mockClear();
    const response = await call(method); expect(response.status).toBe(429); privateResponse(response);
    expect(fixture.verify).not.toHaveBeenCalled(); noStorage();
  });
  it("DELETE preserves old JSON and states application-data-only without provider revocation", async () => {
    const response = await call("DELETE", request("DELETE", {}, `/api/account?userId=${other}`));
    expect(await response.json()).toEqual({ ok: true, configured: true });
    expect(response.headers.get("x-coachfi-deletion-scope")).toBe("application-records");
    expect(response.headers.get("x-coachfi-provider-identity-deletion")).toBe("not-performed");
    expect(response.headers.get("x-coachfi-provider-session-revocation")).toBe("not-performed");
    expect(fixture.erase).toHaveBeenCalledExactlyOnceWith(owner); privateResponse(response);
    expect(fixture.save).not.toHaveBeenCalled(); expect(fixture.identity).not.toHaveBeenCalled();
  });
});

describe("selected verified-owner application export", () => {
  it("exports only allowlisted product values and certificate facts, never arbitrary stored strings", async () => {
    const response = await call("EXPORT", request("GET", {}, `/api/account/export?userId=${other}`));
    expect(response.status).toBe(200); privateResponse(response);
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="coachfi-application-data.json"');
    const payload = await response.json();
    expect(payload.scope).toBe("selected_verified_owner_application_data");
    expect(payload.consistency).toBe("independent_reads");
    expect(payload.applicationData).toEqual({ "coachfi-tokens": 25, "coachfi-user": { setupDone: true },
      "coachfi-learn-manual": { "money-mindset": "completed" }, "coachfi-avatar": { gender: "female", style: "builder" },
      "coachfi-challenge": { date: "2026-10-21" } });
    expect(payload.certificates).toEqual([{ certificateId: "money-mindset", status: "owned", minted: true }]);
    expect(payload.omitted).toEqual(expect.arrayContaining(["provider_identity_and_sessions", "free_text_and_raw_profiles", "local_device_data"]));
    expect(JSON.stringify(payload)).not.toMatch(new RegExp(`${CANARY}|${owner}|${other}|access_token|refresh_token|cdp_profile`));
    expect(fixture.read).toHaveBeenCalledExactlyOnceWith(owner); expect(fixture.certificates).toHaveBeenCalledExactlyOnceWith(owner);
    expect(fixture.save).not.toHaveBeenCalled(); expect(fixture.identity).not.toHaveBeenCalled(); expect(fixture.erase).not.toHaveBeenCalled();
  });
  it("an absent account exports an explicit empty application view without fetching certificates", async () => {
    fixture.read.mockResolvedValue(null);
    const response = await call("EXPORT"); expect(response.status).toBe(200); privateResponse(response);
    const payload = await response.json(); expect(payload.accountPresent).toBe(false);
    expect(payload.applicationData).toEqual({}); expect(payload.certificates).toEqual([]);
    expect(fixture.certificates).not.toHaveBeenCalled(); expect(fixture.save).not.toHaveBeenCalled(); expect(fixture.identity).not.toHaveBeenCalled();
  });
  it.each(["account", "certificate"] as const)("a mismatched %s owner rejects the entire export", async (source) => {
    if (source === "account") fixture.read.mockResolvedValue(stored(other));
    else fixture.certificates.mockResolvedValue([certificate(other)]);
    const response = await call("EXPORT"); expect(response.status).toBe(500); privateResponse(response);
    expect(await response.text()).not.toMatch(new RegExp(`${other}|${CANARY}`));
  });
  it.each(["account", "certificate"] as const)("%s read failure yields no partial export or raw exception", async (source) => {
    if (source === "account") fixture.read.mockRejectedValue(new Error(CANARY));
    else fixture.certificates.mockRejectedValue(new Error(CANARY));
    const response = await call("EXPORT"); expect(response.status).toBe(500); privateResponse(response);
    expect(await response.json()).toEqual({ ok: false, error: "Account export failed" });
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(CANARY);
    if (source === "account") expect(fixture.certificates).not.toHaveBeenCalled();
  });
  it("invalid nested product and certificate fields cannot enter the projection", async () => {
    const record = stored(); record.state = { version: 1, tokens: -1, srs: CANARY,
      learnManual: { "money-mindset": CANARY }, avatar: { gender: CANARY, style: "builder" } };
    fixture.read.mockResolvedValue(record);
    fixture.certificates.mockResolvedValue([{ ...certificate(), certificateId: CANARY } as unknown as CertificateRecord]);
    const response = await call("EXPORT"); expect(response.status).toBe(200); privateResponse(response);
    const payload = await response.json(); expect(payload.applicationData).toEqual({ "coachfi-learn-manual": {} });
    expect(payload.certificates).toEqual([]); expect(JSON.stringify(payload)).not.toContain(CANARY);
  });
});
