import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const voiceConfig = {
  conversation_config: { tts: { voice_id: "mila-canonical", model_id: "eleven_turbo_v2_5", stability: 0.65, similarity_boost: 0.8, speed: 0.95 } },
};

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("ELEVENLABS_API_KEY", "qa-only-not-a-real-key");
  vi.stubEnv("NEXT_PUBLIC_ELEVENLABS_AGENT_ID", "qa-mila-agent");
  vi.stubEnv("ELEVENLABS_MILA_VOICE_CONFIG", "");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Mila canonical voice", () => {
  const pinnedConfig = () => ({
    agentId: "agent_7601krc9gaf2eaxr811qgk01epzc",
    voiceId: "tnSpp4vdxKPjI9w0GnoV",
    modelId: "eleven_multilingual_v2",
    settings: { stability: 0.5, similarity_boost: 0.8, speed: 1.09 },
    verifiedAt: new Date(Date.now() - 1000).toISOString(),
  });

  it("uses the dashboard-verified current voice after API 404 without changing agents", async () => {
    const config = pinnedConfig();
    vi.stubEnv("NEXT_PUBLIC_ELEVENLABS_AGENT_ID", config.agentId);
    vi.stubEnv("ELEVENLABS_MILA_VOICE_CONFIG", JSON.stringify(config));
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(Response.json({}, { status: 404 })));
    vi.stubGlobal("fetch", fetchMock);
    const { resolveMilaVoice } = await import("./mila-voice");
    const voice = await resolveMilaVoice();
    expect(voice).toEqual({ agentId: config.agentId, voiceId: config.voiceId, modelId: config.modelId, settings: config.settings });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.every(([url]) => String(url).includes(config.agentId))).toBe(true);
    expect(await resolveMilaVoice()).toEqual(voice);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects a pinned voice bound to a different agent", async () => {
    const { parsePinnedMilaVoice } = await import("./mila-voice");
    expect(parsePinnedMilaVoice(JSON.stringify(pinnedConfig()), "agent_otheragent")).toBeNull();
  });

  it("rejects malformed identifiers, models, settings and verification timestamps", async () => {
    const { parsePinnedMilaVoice } = await import("./mila-voice");
    const config = pinnedConfig();
    const invalid = [
      { ...config, voiceId: "../not-a-voice" },
      { ...config, modelId: "not-a-provider-model" },
      { ...config, settings: { ...config.settings, stability: 1.1 } },
      { ...config, settings: { ...config.settings, similarity_boost: -0.1 } },
      { ...config, settings: { ...config.settings, speed: 2 } },
      { ...config, verifiedAt: "not-a-date" },
      { ...config, verifiedAt: "2026-02-30T12:00:00Z" },
      { ...config, verifiedAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() },
    ];
    expect(parsePinnedMilaVoice("{", config.agentId)).toBeNull();
    expect(parsePinnedMilaVoice("[]", config.agentId)).toBeNull();
    for (const value of invalid) expect(parsePinnedMilaVoice(JSON.stringify(value), config.agentId)).toBeNull();
  });

  it("keeps the verified native Hope voice and model for the first and following TTS after config 404", async () => {
    const config = pinnedConfig();
    vi.stubEnv("NEXT_PUBLIC_ELEVENLABS_AGENT_ID", config.agentId);
    vi.stubEnv("ELEVENLABS_MILA_VOICE_CONFIG", JSON.stringify(config));
    const fetchMock = vi.fn().mockImplementation((url: string) => Promise.resolve(
      url.includes("/convai/agents/")
        ? Response.json({}, { status: 404 })
        : new Response(new Uint8Array([73, 68, 51]), { headers: { "Content-Type": "audio/mpeg" } })
    ));
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("../../app/api/tts/route");
    for (const locale of ["pl", "en"]) {
      const response = await POST(new Request("http://localhost:3000/api/tts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "QA speech", locale, voiceId: "other-voice", modelId: "other-model" }),
      }));
      expect(response.status).toBe(200);
      expect(response.headers.get("X-CoachFI-Voice-Id")).toBe(config.voiceId);
      expect(response.headers.get("X-CoachFI-Model")).toBe(config.modelId);
    }
    const ttsCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes("/text-to-speech/"));
    expect(ttsCalls).toHaveLength(2);
    for (const [url, init] of ttsCalls) {
      expect(url).toContain(`/text-to-speech/${config.voiceId}/`);
      const payload = JSON.parse((init as RequestInit).body as string);
      expect(payload.model_id).toBe(config.modelId);
      expect(payload.voice_settings).toEqual(config.settings);
    }
  });

  it("does not silently recover a different agent when the configured agent is inaccessible", async () => {
    vi.stubEnv("NEXT_PUBLIC_ELEVENLABS_AGENT_ID", "agent_7601krc9gaf2eaxr811qgk01epzc");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ detail: { status: "document_not_found" } }, { status: 404 }))
      .mockResolvedValueOnce(Response.json({ detail: { status: "document_not_found" } }, { status: 404 }))
      .mockResolvedValueOnce(Response.json(voiceConfig));
    vi.stubGlobal("fetch", fetchMock);
    const { resolveMilaVoice } = await import("./mila-voice");
    expect(await resolveMilaVoice()).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.every(([url]) => String(url).includes("agent_7601krc9gaf2eaxr811qgk01epzc"))).toBe(true);
  });

  it("tries the global region when the US region cannot find the configured agent", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ detail: { status: "document_not_found" } }, { status: 404 }))
      .mockResolvedValueOnce(Response.json(voiceConfig));
    vi.stubGlobal("fetch", fetchMock);
    const { resolveMilaVoice } = await import("./mila-voice");
    expect((await resolveMilaVoice())?.agentId).toBe("qa-mila-agent");
    expect(fetchMock.mock.calls[1][0]).toBe("https://api.elevenlabs.io/v1/convai/agents/qa-mila-agent");
  });

  it("reads the agent voice and reuses its identity and settings for subsequent speech", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(voiceConfig));
    vi.stubGlobal("fetch", fetchMock);
    const { resolveMilaVoice } = await import("./mila-voice");
    const first = await resolveMilaVoice();
    const next = await resolveMilaVoice();
    expect(first).toEqual({ agentId: "qa-mila-agent", voiceId: "mila-canonical", modelId: "eleven_turbo_v2_5", settings: { stability: 0.65, similarity_boost: 0.8, speed: 0.95 } });
    expect(next).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.us.elevenlabs.io/v1/convai/agents/qa-mila-agent");
  });

  it("shares simultaneous config requests instead of racing voice selections", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(voiceConfig));
    vi.stubGlobal("fetch", fetchMock);
    const { resolveMilaVoice } = await import("./mila-voice");
    const result = await Promise.all([resolveMilaVoice(), resolveMilaVoice(), resolveMilaVoice()]);
    expect(result.every((voice) => voice?.voiceId === "mila-canonical")).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not substitute a default voice when the configured agent has no voice", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ conversation_config: { tts: {} } })));
    const { resolveMilaVoice } = await import("./mila-voice");
    expect(await resolveMilaVoice()).toBeNull();
  });

  it("does not send a config request without the provider credential", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { resolveMilaVoice } = await import("./mila-voice");
    expect(await resolveMilaVoice()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not reuse the previous agent voice after changing the configured agent", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json(voiceConfig))
      .mockResolvedValueOnce(Response.json({ conversation_config: { tts: { voice_id: "mila-next" } } }));
    vi.stubGlobal("fetch", fetchMock);
    const { resolveMilaVoice } = await import("./mila-voice");
    expect((await resolveMilaVoice())?.voiceId).toBe("mila-canonical");
    vi.stubEnv("NEXT_PUBLIC_ELEVENLABS_AGENT_ID", "qa-next-agent");
    expect((await resolveMilaVoice())?.voiceId).toBe("mila-next");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("TTS ignores client voice overrides and emits the same provider voice for two languages", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/convai/agents/")) return Promise.resolve(Response.json(voiceConfig));
      return Promise.resolve(new Response(new Uint8Array([73, 68, 51]), { headers: { "Content-Type": "audio/mpeg" } }));
    });
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("../../app/api/tts/route");
    for (const locale of ["pl", "en"]) {
      const response = await POST(new Request("http://localhost:3000/api/tts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "QA speech", locale, voiceId: "other-voice", modelId: "other-model" }),
      }));
      expect(response.status).toBe(200);
      expect(response.headers.get("X-CoachFI-Voice-Id")).toBe("mila-canonical");
      expect(response.headers.get("X-CoachFI-Model")).toBe("eleven_turbo_v2_5");
    }
    const ttsCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes("/text-to-speech/"));
    expect(ttsCalls).toHaveLength(2);
    for (const [url, init] of ttsCalls) {
      expect(url).toContain("/text-to-speech/mila-canonical/");
      const payload = JSON.parse((init as RequestInit).body as string);
      expect(payload.model_id).toBe("eleven_turbo_v2_5");
      expect(payload.voice_settings).toEqual({ stability: 0.65, similarity_boost: 0.8, speed: 0.95 });
    }
  });

  it("a rejected native model fails visibly without retrying another model", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({
        conversation_config: { tts: { voice_id: "mila-canonical", model_id: "unknown-conversation-model" } },
      }))
      .mockResolvedValueOnce(Response.json({ error: "unsupported model" }, { status: 422 }));
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("../../app/api/tts/route");
    const response = await POST(new Request("http://localhost:3000/api/tts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "QA speech", locale: "pl" }),
    }));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Mila voice unavailable" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const sent = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
    expect(sent.model_id).toBe("unknown-conversation-model");
  });
});
