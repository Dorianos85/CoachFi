import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  verify: vi.fn(async () => ({ userId: "FIXTURE_A" })),
  read: vi.fn(async () => ({ cdpUserId: "FIXTURE_A", state: { version: 1, tokens: 50 } })),
  identityWrite: vi.fn(), accountWrite: vi.fn(), erase: vi.fn(async () => undefined),
}));
vi.mock("@/lib/cdp-server", () => ({ cdpAuthConfigured: () => true, verifyCdpUser: fixture.verify }));
vi.mock("@/lib/account-store", () => ({ accountStorageConfigured: () => true, getAccount: fixture.read,
  saveCdpIdentity: fixture.identityWrite, saveAccount: fixture.accountWrite, deleteAccount: fixture.erase }));

const methods = ["GET", "PUT", "DELETE"] as const;
const token = "FIXTURE_HEADER.FIXTURE_PAYLOAD.FIXTURE_SIGNATURE";
function request(method: typeof methods[number], headers: Record<string, string> = {}, body?: string) {
  return new Request("https://coachfi.test/api/account", { method,
    headers: { authorization: `Bearer ${token}`, "x-coachfi-account-user-id": "FIXTURE_A", ...headers },
    ...(body === undefined ? {} : { body }) });
}
function noStorage() {
  expect(fixture.read).not.toHaveBeenCalled(); expect(fixture.accountWrite).not.toHaveBeenCalled();
  expect(fixture.identityWrite).not.toHaveBeenCalled(); expect(fixture.erase).not.toHaveBeenCalled();
}
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks(); fixture.verify.mockResolvedValue({ userId: "FIXTURE_A" });
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No network or actual provider permitted."); }));
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("independent B15 account API read-only boundary", () => {
  it("verified GET reads only its owner without the former identity side-effect", async () => {
    const { GET } = await import("@/app/api/account/route");
    const response = await GET(request("GET")); expect(response.status).toBe(200);
    expect((await response.json()).state.tokens).toBe(50);
    expect(fixture.verify).toHaveBeenCalledWith(token); expect(fixture.read).toHaveBeenCalledExactlyOnceWith("FIXTURE_A");
    expect(fixture.identityWrite).not.toHaveBeenCalled(); expect(fixture.accountWrite).not.toHaveBeenCalled(); expect(fixture.erase).not.toHaveBeenCalled();
  });

  it.each([JSON.stringify({ state: { version: 1, tokens: 99 }, userId: "FIXTURE_B" }), "not-json", ""])("PUT cannot reinstate unversioned writes even with body %s", async (body) => {
    const { PUT } = await import("@/app/api/account/route");
    const response = await PUT(request("PUT", { "content-type": "application/json" }, body));
    expect(response.status).toBe(503); expect((await response.json()).ok).toBe(false);
    expect(fixture.verify).toHaveBeenCalledExactlyOnceWith(token); noStorage();
  });

  it.each(methods)("%s expected UID is not bearer authorization", async (method) => {
    const route = await import("@/app/api/account/route");
    const response = await route[method](request(method, { authorization: "" }));
    expect(response.status).toBe(401); expect(fixture.verify).not.toHaveBeenCalled(); noStorage();
  });

  it.each(methods)("%s rejects token identity mismatch before storage or the write-off response", async (method) => {
    fixture.verify.mockResolvedValueOnce({ userId: "FIXTURE_B" });
    const route = await import("@/app/api/account/route");
    const response = await route[method](request(method)); expect(response.status).toBe(409);
    expect(fixture.verify).toHaveBeenCalledOnce(); noStorage();
  });

  it.each(methods)("%s keeps same-origin enforcement before token verification", async (method) => {
    const route = await import("@/app/api/account/route");
    const response = await route[method](request(method, { origin: "https://foreign.test" }));
    expect(response.status).toBe(403); expect(fixture.verify).not.toHaveBeenCalled(); noStorage();
  });

  it("explicit DELETE remains bound to verified owner and is not an automatic cache cleanup", async () => {
    const { DELETE } = await import("@/app/api/account/route");
    const response = await DELETE(request("DELETE")); expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, configured: true });
    expect(fixture.erase).toHaveBeenCalledExactlyOnceWith("FIXTURE_A");
    expect(fixture.read).not.toHaveBeenCalled(); expect(fixture.accountWrite).not.toHaveBeenCalled(); expect(fixture.identityWrite).not.toHaveBeenCalled();
  });
});
