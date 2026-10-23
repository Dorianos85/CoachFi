import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createConsentRecord, CONSENT_STORAGE_KEY } from "../consent";
import { beginStorageOwner } from "../product-storage";
import { getApiCredentials, setApiAccessTokenGetter } from "./api-credentials";

let stored: string | null;
beforeEach(() => {
  stored = JSON.stringify(createConsentRecord({ aiCoach: true, voice: true }));
  vi.stubGlobal("window", {
    localStorage: { getItem: (key: string) => key === CONSENT_STORAGE_KEY ? stored : null },
    dispatchEvent: vi.fn(() => true),
  });
  // Resolve the synthetic guest scope before exercising the credential fence.
  beginStorageOwner({ kind: "guest" }).publishReady({ localOnly: true });
});
afterEach(() => { setApiAccessTokenGetter(null); vi.unstubAllGlobals(); });

describe("ephemeral CDP credential bridge", () => {
  it("returns synthetic credentials only for the current explicit purpose", async () => {
    const getter = vi.fn(async () => "synthetic-cdp-access-token");
    setApiAccessTokenGetter(getter);
    const result = await getApiCredentials(["voice", "aiCoach"]);
    expect(result?.headers.Authorization).toBe("Bearer synthetic-cdp-access-token");
    expect(result?.consent.optional.voice).toBe(true);
    expect(stored).not.toContain("synthetic-cdp-access-token");
  });

  it.each([false, "false", "true", undefined])("does not even obtain a token for invalid optional grant %s", async (voice) => {
    const getter = vi.fn(async () => "synthetic-token");
    setApiAccessTokenGetter(getter);
    stored = JSON.stringify({ ...createConsentRecord(), optional: { voice } });
    expect(await getApiCredentials(["voice"])).toBeNull();
    expect(getter).not.toHaveBeenCalled();
  });

  it("fails closed for signed-out clients", async () => {
    setApiAccessTokenGetter(null);
    expect(await getApiCredentials(["voice"])).toBeNull();
  });

  it.each(["revoke", "logout", "abort"])("rejects a credential arriving after %s", async (action) => {
    let finish!: (token: string) => void;
    setApiAccessTokenGetter(() => new Promise((resolve) => { finish = resolve; }));
    const controller = new AbortController();
    const pending = getApiCredentials(["voice"], controller.signal);
    if (action === "revoke") stored = JSON.stringify(createConsentRecord());
    if (action === "logout") setApiAccessTokenGetter(null);
    if (action === "abort") controller.abort();
    finish("synthetic-late-token");
    expect(await pending).toBeNull();
  });

  it("rejects header injection and SDK getter errors", async () => {
    setApiAccessTokenGetter(async () => "synthetic\r\nInjected: true");
    expect(await getApiCredentials(["voice"])).toBeNull();
    setApiAccessTokenGetter(async () => { throw new Error("synthetic SDK error"); });
    expect(await getApiCredentials(["voice"])).toBeNull();
  });

  it("rejects an old token after logout/login re-registers the same SDK callback", async () => {
    let finish!: (token: string) => void;
    const stableGetter = () => new Promise<string>((resolve) => { finish = resolve; });
    setApiAccessTokenGetter(stableGetter);
    const pending = getApiCredentials(["voice"]);
    setApiAccessTokenGetter(null);
    setApiAccessTokenGetter(stableGetter);
    finish("synthetic-old-account-token");
    expect(await pending).toBeNull();
  });
});
