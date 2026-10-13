import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const voiceConfig = {
  conversation_config: { tts: { voice_id: "mila-canonical", model_id: "eleven_turbo_v2_5", stability: 0.65, similarity_boost: 0.8, speed: 0.95 } },
};

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("ELEVENLABS_API_KEY", "qa-only-not-a-real-key");
  vi.stubEnv("NEXT_PUBLIC_ELEVENLABS_AGENT_ID", "qa-mila-agent");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Mila canonical voice", () => {
  it("recovers the earlier existing Coach FI agent and keeps its verified identity", async () => {
    vi.stubEnv("NEXT_PUBLIC_ELEVENLABS_AGENT_ID", "agent_7601krc9gaf2eaxr811qgk01epzc");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ detail: { status: "document_not_found" } }, { status: 404 }))
      .mockResolvedValueOnce(Response.json({ detail: { status: "document_not_found" } }, { status: 404 }))
      .mockResolvedValueOnce(Response.json(voiceConfig));
    vi.stubGlobal("fetch", fetchMock);
    const { resolveMilaVoice } = await import("./mila-voice");
    const voice = await resolveMilaVoice();
    expect(voice?.agentId).toBe("agent_2301krbsttc8f21ra1h5vge02071");
    expect(voice?.voiceId).toBe("mila-canonical");
    expect(fetchMock.mock.calls[2][0]).toContain("agent_2301krbsttc8f21ra1h5vge02071");
    expect(await resolveMilaVoice()).toEqual(voice);
    expect(fetchMock).toHaveBeenCalledTimes(3);
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
