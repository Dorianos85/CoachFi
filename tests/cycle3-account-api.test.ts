import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PUT, DELETE } from "@/app/api/account/route";

const stubs = vi.hoisted(() => ({
  configured: vi.fn(() => true),
  storageConfigured: vi.fn(() => true),
  verify: vi.fn(async () => ({ userId: "synthetic-A" })),
  getAccount: vi.fn(async () => ({
    cdpUserId: "synthetic-A", state: { version: 1, tokens: 5 },
  })),
  saveAccount: vi.fn(async () => undefined),
  saveIdentity: vi.fn(async () => undefined),
  deleteAccount: vi.fn(async () => undefined),
}));
vi.mock("@/lib/cdp-server", () => ({
  cdpAuthConfigured: stubs.configured, verifyCdpUser: stubs.verify,
}));
vi.mock("@/lib/account-store", () => ({
  accountStorageConfigured: stubs.storageConfigured,
  getAccount: stubs.getAccount, saveAccount: stubs.saveAccount,
  saveCdpIdentity: stubs.saveIdentity, deleteAccount: stubs.deleteAccount,
}));

const methods = ["GET", "PUT", "DELETE"] as const;
const handlers = { GET, PUT, DELETE };
const bearer = "synthetic.payload.signature";
function request(method: typeof methods[number], expectedId?: string, token: string | null = bearer, extra: HeadersInit = {}) {
  const headers = new Headers(extra);
  if (token !== null) headers.set("authorization", `Bearer ${token}`);
  if (expectedId !== undefined) headers.set("x-coachfi-account-user-id", expectedId);
  if (method === "PUT") headers.set("content-type", "application/json");
  return new Request("https://coachfi.example/api/account", {
    method, headers,
    ...(method === "PUT" ? { body: JSON.stringify({
      state: { version: 1, tokens: 11 }, userId: "body-spoof",
    }) } : {}),
  });
}
function noStorage() {
  expect(stubs.getAccount).not.toHaveBeenCalled();
  expect(stubs.saveAccount).not.toHaveBeenCalled();
  expect(stubs.saveIdentity).not.toHaveBeenCalled();
  expect(stubs.deleteAccount).not.toHaveBeenCalled();
}
const outbound = vi.fn(() => { throw new Error("Outbound calls are forbidden in this synthetic test."); });
beforeEach(() => {
  vi.clearAllMocks();
  stubs.configured.mockReturnValue(true);
  stubs.storageConfigured.mockReturnValue(true);
  stubs.verify.mockResolvedValue({ userId: "synthetic-A" });
  vi.stubGlobal("fetch", outbound);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  expect(outbound).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("account session identity precondition", () => {
  it.each(methods)("rejects mismatched %s before all storage operations", async (method) => {
    const response = await handlers[method](request(method, "synthetic-B"));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ ok: false, error: "Account session changed" });
    expect(stubs.verify).toHaveBeenCalledWith(bearer);
    noStorage();
  });
  it.each(methods)("cannot authorize %s using only a matching header", async (method) => {
    const response = await handlers[method](request(method, "synthetic-A", null));
    expect(response.status).toBe(401);
    expect(stubs.verify).not.toHaveBeenCalled();
    noStorage();
  });
  it("rejects the late token identity even when the client still expects the earlier user", async () => {
    let resolveIdentity!: (value: { userId: string }) => void;
    stubs.verify.mockImplementationOnce(() => new Promise((resolve) => { resolveIdentity = resolve; }));
    const pending = PUT(request("PUT", "synthetic-A"));
    resolveIdentity({ userId: "synthetic-B" });
    expect((await pending).status).toBe(409);
    noStorage();
  });
  it("B15 pauses matching authenticated PUT before any unversioned account write", async () => {
    const response = await PUT(request("PUT", "synthetic-A"));
    expect(response.status).toBe(503); expect(await response.json()).toEqual({ ok: false, error: "Account writes paused" });
    expect(stubs.verify).toHaveBeenCalledWith(bearer); noStorage();
  });
  it("retains verified-owner behavior for an older client without this optional header", async () => {
    expect((await GET(request("GET"))).status).toBe(200);
    expect(stubs.getAccount).toHaveBeenCalledWith("synthetic-A");
    expect(stubs.saveIdentity).not.toHaveBeenCalled(); expect(stubs.saveAccount).not.toHaveBeenCalled();
  });
  it("still rejects an invalid bearer even when the header agrees", async () => {
    stubs.verify.mockRejectedValueOnce(new Error("Synthetic verification failure"));
    expect((await GET(request("GET", "synthetic-A"))).status).toBe(401);
    noStorage();
  });
  it("does not bypass configuration guards with the expected identity header", async () => {
    stubs.storageConfigured.mockReturnValue(false);
    const response = await GET(request("GET", "synthetic-A"));
    expect(await response.json()).toEqual({ ok: false, configured: false });
    expect(stubs.verify).not.toHaveBeenCalled();
    noStorage();
  });
  it("does not bypass same-origin checks with a matching bearer and identity", async () => {
    const response = await PUT(request("PUT", "synthetic-A", bearer, { origin: "https://other.example" }));
    expect(response.status).toBe(403);
    expect(stubs.verify).not.toHaveBeenCalled();
    noStorage();
  });
});
