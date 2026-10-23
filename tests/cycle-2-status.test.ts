import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const blocked = vi.hoisted(() => ({ initialize: vi.fn(), call: vi.fn(() => {
  throw new Error("Unexpected external or configuration access in status.");
}) }));
vi.mock("@/lib/server/mila-voice", () => {
  blocked.initialize("voice"); return { resolveMilaVoice: blocked.call };
});
vi.mock("@/lib/server-env", () => {
  blocked.initialize("secret_config"); return { getOptionalEnv: blocked.call, hasConfiguredEnv: blocked.call };
});
vi.mock("@/lib/mila-voice", () => {
  blocked.initialize("agent_config"); return { getMilaAgentId: blocked.call };
});
vi.mock("@solana/web3.js", () => {
  blocked.initialize("rpc"); return { Connection: blocked.call, Keypair: { fromSecretKey: blocked.call }, LAMPORTS_PER_SOL: 1e9 };
});
vi.mock("@/lib/cdp-server", () => {
  blocked.initialize("cdp"); return { cdpAuthConfigured: blocked.call, verifyCdpUser: blocked.call };
});

let outbound: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.resetModules(); blocked.initialize.mockClear(); blocked.call.mockClear();
  outbound = vi.fn(() => { throw new Error("No outbound status probe is allowed."); });
  vi.stubGlobal("fetch", outbound);
});
afterEach(() => {
  expect(blocked.initialize).not.toHaveBeenCalled();
  expect(blocked.call).not.toHaveBeenCalled();
  expect(outbound).not.toHaveBeenCalled();
  vi.unstubAllEnvs(); vi.unstubAllGlobals();
});

describe("status exposes only static local release policy", () => {
  it("works anonymously without configuration or external probes", async () => {
    const { GET } = await import("../app/api/status/route");
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ ok: true, scope: "local_release_policy", externalProbesPerformed: false,
      services: { chat: { status: "local_only", externalEnabled: false },
        voice: { status: "external_disabled", externalEnabled: false },
        leaderboard: { enabled: false }, solanaMint: { enabled: false } } });
  });

  it("synthetic configured secrets, keypair, agent and RPC cannot enable probes or appear in output", async () => {
    const marker = "SYNTHETIC_PRIVATE_CONFIGURATION";
    for (const name of ["ANTHROPIC_API_KEY", "ELEVENLABS_API_KEY", "ELEVENLABS_MILA_VOICE_CONFIG", "NEXT_PUBLIC_ELEVENLABS_AGENT_ID",
      "SOLANA_MINT_KEYPAIR", "SOLANA_RPC_URL", "SUPABASE_SERVICE_ROLE_KEY", "CDP_API_KEY_SECRET"]) vi.stubEnv(name, marker);
    const { GET } = await import("../app/api/status/route");
    const response = await GET(); const text = await response.text();
    expect(response.status).toBe(200);
    expect(text).not.toContain(marker);
    const result = JSON.parse(text);
    expect(result.services.voice).not.toHaveProperty("agentId");
    expect(result.services.voice).not.toHaveProperty("defaultVoiceId");
    expect(result.services.solanaMint).not.toHaveProperty("rpcUrl");
    expect(result.services.solanaMint).not.toHaveProperty("mintAuthority");
    expect(result.services.solanaMint).not.toHaveProperty("mintAuthorityBalanceSol");
    expect(result.services.leaderboard).not.toHaveProperty("table");
  });

  it("fresh imports and repeated requests retain local-only behavior", async () => {
    let prior: unknown;
    for (let i = 0; i < 3; i++) {
      vi.resetModules();
      const { GET } = await import("../app/api/status/route");
      const result = await (await GET()).json();
      if (i > 0) expect(result).toEqual(prior);
      prior = result;
    }
  });
});
