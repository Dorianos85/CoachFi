import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONSENT_VERSION } from "@/lib/consent";
import { authenticateApiUser, validateDeclaredConsent } from "@/lib/server/api-access";
import { EXTERNAL_AI_POLICY } from "@/lib/server/api-access-policy";
import { POST as chat } from "@/app/api/chat/route";
import { POST as tts } from "@/app/api/tts/route";
import { GET as oldToken, POST as token } from "@/app/api/mila-token/route";
import { GET as leaderboardRead, POST as leaderboardWrite } from "@/app/api/leaderboard/route";
import { POST as mint } from "@/app/api/mint-nft/route";
import { GET as certificatesRead, POST as certificatesWrite } from "@/app/api/certificates/route";
import { GET as vault } from "@/app/api/vault/route";

const auth = vi.hoisted(() => ({
  configured: vi.fn(() => true),
  verify: vi.fn(async () => ({ userId: "verified-cdp-user" })),
}));
vi.mock("@/lib/cdp-server", () => ({ cdpAuthConfigured: auth.configured, verifyCdpUser: auth.verify }));

function consent(overrides: Record<string, unknown> = {}) {
  return {
    version: CONSENT_VERSION, acceptedAt: new Date().toISOString(),
    termsAccepted: true, privacyAccepted: true,
    optional: { aiCoach: true, voice: true, leaderboard: false, blockchain: false },
    ...overrides,
  };
}
function req(body: unknown, bearer: string | null = "good.payload.signature", headers: HeadersInit = {}) {
  const all = new Headers(headers);
  all.set("content-type", "application/json");
  if (bearer) all.set("authorization", "Bearer " + bearer);
  return new Request("https://coachfi.example/api/test", { method: "POST", headers: all, body: JSON.stringify(body) });
}
let outbound: ReturnType<typeof vi.fn>;
beforeEach(() => {
  auth.configured.mockReset().mockReturnValue(true);
  auth.verify.mockReset().mockResolvedValue({ userId: "verified-cdp-user" });
  outbound = vi.fn(() => { throw new Error("An outbound call must not occur in P0 tests."); });
  vi.stubGlobal("fetch", outbound);
});
afterEach(() => {
  expect(outbound).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("verified identity and declared consent", () => {
  it("uses only the identity returned by CDP", async () => {
    const user = await authenticateApiUser(req({}, "good.payload.signature", { "x-user-id": "someone-else", "x-coachfi-user": "admin" }));
    expect(user.userId).toBe("verified-cdp-user");
    expect(auth.verify).toHaveBeenCalledWith("good.payload.signature");
  });
  it("does not trust identity or literal consent headers without Bearer", async () => {
    await expect(authenticateApiUser(req({}, null, { "x-user-id": "admin", "x-coachfi-consent": "voice" }))).rejects.toMatchObject({ code: "AUTH_REQUIRED", status: 401 });
    expect(auth.verify).not.toHaveBeenCalled();
  });
  it("rejects malformed and invalid tokens without exposing SDK errors", async () => {
    await expect(authenticateApiUser(req({}, "not-jwt"))).rejects.toMatchObject({ code: "AUTH_REQUIRED", status: 401 });
    auth.verify.mockRejectedValueOnce(new Error("synthetic private SDK details"));
    await expect(authenticateApiUser(req({}))).rejects.toMatchObject({ code: "AUTH_INVALID", status: 401, message: "Sign-in verification failed." });
  });
  it("fails closed when verifier configuration is unavailable", async () => {
    auth.configured.mockReturnValue(false);
    await expect(authenticateApiUser(req({}))).rejects.toMatchObject({ code: "AUTH_UNAVAILABLE", status: 503 });
    expect(auth.verify).not.toHaveBeenCalled();
  });
  it("does not accept a literal header instead of a consent record", async () => {
    expect(() => validateDeclaredConsent(undefined, ["voice"])).toThrow("Current consent");
    expect(auth.verify).not.toHaveBeenCalled();
  });
  it.each([
    consent({ version: "2026-05-10" }),
    consent({ optional: { aiCoach: true, voice: false, leaderboard: false, blockchain: false } }),
    consent({ optional: { aiCoach: true, voice: "false", leaderboard: false, blockchain: false } }),
    consent({ privacyAccepted: false }),
    consent({ acceptedAt: "invalid" }),
  ])("rejects stale, withdrawn or malformed declarations", async (declared) => {
    expect(() => validateDeclaredConsent(declared, ["aiCoach", "voice"])).toThrow();
    expect(auth.verify).not.toHaveBeenCalled();
  });
  it("requires both AI and voice for conversation but voice alone for TTS", () => {
    const voiceOnly = consent({ optional: { aiCoach: false, voice: true, leaderboard: false, blockchain: false } });
    expect(() => validateDeclaredConsent(voiceOnly, ["voice"])).not.toThrow();
    expect(() => validateDeclaredConsent(voiceOnly, ["voice", "aiCoach"])).toThrow();
  });
});

describe("external AI is fail-closed without durable quota, budget and consent authority", () => {
  const handlers: Array<[string, (r: Request) => Promise<Response>, unknown]> = [
    ["external chat", chat, { mode: "external", message: "saving", consent: consent() }],
    ["tts", tts, { text: "Hi", consent: consent() }],
    ["conversation", token, { consent: consent() }],
  ];
  it.each(handlers)("%s never calls providers even with credentials and valid declared consent", async (_, handler, body) => {
    vi.stubEnv("ANTHROPIC_API_KEY", "synthetic-not-a-real-key");
    vi.stubEnv("ELEVENLABS_API_KEY", "synthetic-not-a-real-key");
    vi.stubEnv("COACHFI_EXTERNAL_AI_ENABLED", "true");
    vi.stubEnv("COACHFI_GLOBAL_AI_BUDGET", "100");
    const response = await handler(req(body));
    expect(response.status).toBe(503);
    expect((await response.json()).code).toBe("EXTERNAL_AI_DISABLED");
    expect(auth.verify).not.toHaveBeenCalled();
  });
  it("denies across freshly loaded policy instances instead of pretending a Map is durable", async () => {
    expect(EXTERNAL_AI_POLICY.enabled).toBe(false);
    const first = await token(req({ consent: consent() }));
    vi.resetModules();
    const secondHandler = (await import("@/app/api/mila-token/route")).POST;
    const second = await secondHandler(req({ consent: consent() }));
    expect(first.status).toBe(503);
    expect(second.status).toBe(503);
    expect(await first.json()).not.toHaveProperty("signedUrl");
    expect(await second.json()).not.toHaveProperty("agentId");
    expect(auth.verify).not.toHaveBeenCalled();
  });
  it.each([null, "not-jwt", "forged.payload.signature"])("denies before verifier for Bearer %s", async (bearer) => {
    auth.verify.mockRejectedValue(new Error("Verifier must not be reached"));
    for (const handler of [tts, token]) {
      const response = await handler(req({ consent: consent() }, bearer));
      expect(response.status).toBe(503);
      expect((await response.json()).code).toBe("EXTERNAL_AI_DISABLED");
    }
    expect(auth.verify).not.toHaveBeenCalled();
  });
  it("retired GET token path never emits provider credentials", async () => {
    const response = await oldToken();
    expect(response.status).toBe(405);
    expect(await response.json()).not.toHaveProperty("signedUrl");
    expect(auth.verify).not.toHaveBeenCalled();
  });
  it("rejects Unicode bodies beyond the byte cap", async () => {
    const response = await tts(req({ text: "🙂".repeat(2000), consent: consent() }));
    expect(response.status).toBe(413);
    expect(auth.verify).not.toHaveBeenCalled();
  });
  it("rejects spoofed cross-origin requests before authentication", async () => {
    const response = await token(req({ consent: consent() }, "good.payload.signature", { origin: "https://evil.example", host: "evil.example" }));
    expect(response.status).toBe(403);
    expect(auth.verify).not.toHaveBeenCalled();
  });
});

describe("public local chat remains useful without external processing", () => {
  it("gives Polish local text without a token, history transmission or SDK verification", async () => {
    const response = await chat(req({ message: "oszczędzanie", locale: "pl", history: [{ content: "synthetic private details" }] }, null));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-coachfi-external-ai")).toBe("disabled");
    expect(response.headers.get("x-coachfi-provider")).toBe("local");
    const text = await response.text();
    expect(text).toContain("podstawowe potrzeby");
    expect(text).not.toContain("private details");
    expect(auth.verify).not.toHaveBeenCalled();
  });
  it("cannot upgrade the default/local path by spoofing identity or consent headers", async () => {
    const response = await chat(req({ message: "inflation" }, null, { "x-coachfi-consent": "ai-coach", "x-user-id": "admin" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-coachfi-provider")).toBe("local");
    expect(auth.verify).not.toHaveBeenCalled();
  });
});

describe("adult release excludes leaderboard and all Web3 endpoint methods", () => {
  const handlers: Array<[string, (r: Request) => Promise<Response>]> = [
    ["leaderboard GET", leaderboardRead], ["leaderboard POST", leaderboardWrite],
    ["mint POST", mint], ["certificates GET", certificatesRead],
    ["certificates POST", certificatesWrite], ["vault GET", vault],
  ];
  it.each(handlers)("%s returns disabled before auth, store or provider access", async (_, handler) => {
    const response = await handler(req({ name: "Someone", score: 100, consent: consent() }));
    expect(response.status).toBe(404);
    expect((await response.json()).code).toBe("FEATURE_DISABLED");
    expect(auth.verify).not.toHaveBeenCalled();
  });
});
