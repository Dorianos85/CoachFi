import { getMilaAgentId } from "@/lib/mila-voice";

export interface MilaVoice {
  agentId: string;
  voiceId: string;
  modelId?: string;
  settings: { stability?: number; similarity_boost?: number; speed?: number };
}

const CACHE_MS = 5 * 60 * 1000;
const CONFIG_TIMEOUT_MS = 2000;
let cached: { configKey: string; value: MilaVoice; expiresAt: number } | undefined;
let pending: { configKey: string; promise: Promise<MilaVoice | null> } | undefined;

/** Explicit fallback copied from this exact agent's dashboard; never an unrelated default voice. */
export function parsePinnedMilaVoice(raw: string | undefined, agentId: string): MilaVoice | null {
  if (!raw || raw.length > 2048) return null;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    if (data.agentId !== agentId || !/^agent_[a-zA-Z0-9]+$/.test(agentId)) return null;
    if (typeof data.voiceId !== "string" || !/^[a-zA-Z0-9]{10,80}$/.test(data.voiceId)) return null;
    if (typeof data.modelId !== "string" || !/^eleven_[a-z0-9_]+$/.test(data.modelId)) return null;
    if (typeof data.verifiedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(data.verifiedAt)) return null;
    const verifiedAt = Date.parse(data.verifiedAt);
    if (!Number.isFinite(verifiedAt) || verifiedAt <= 0 || verifiedAt > Date.now() + 5 * 60 * 1000) return null;
    if (new Date(verifiedAt).toISOString().slice(0, 19) !== data.verifiedAt.slice(0, 19)) return null;
    const settings = data.settings as Record<string, unknown> | undefined;
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
    const { stability, similarity_boost, speed } = settings;
    if (typeof stability !== "number" || !Number.isFinite(stability) || stability < 0 || stability > 1) return null;
    if (typeof similarity_boost !== "number" || !Number.isFinite(similarity_boost) || similarity_boost < 0 || similarity_boost > 1) return null;
    if (typeof speed !== "number" || !Number.isFinite(speed) || speed < 0.7 || speed > 1.2) return null;
    return { agentId, voiceId: data.voiceId, modelId: data.modelId, settings: { stability, similarity_boost, speed } };
  } catch {
    return null;
  }
}

/** Read only voice fields; agent prompts, transcripts and credentials never leave the server. */
export async function resolveMilaVoice(): Promise<MilaVoice | null> {
  const agentId = getMilaAgentId();
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!agentId || !apiKey) return null;
  const rawPinnedConfig = process.env.ELEVENLABS_MILA_VOICE_CONFIG;
  const configKey = JSON.stringify([agentId, rawPinnedConfig ?? ""]);
  const pinnedVoice = parsePinnedMilaVoice(rawPinnedConfig, agentId);
  if (cached?.configKey === configKey && cached.expiresAt > Date.now()) return cached.value;
  if (pending?.configKey === configKey) return pending.promise;

  const promise = (async () => {
    // Stay on the explicitly configured agent across regions and failures.
    for (const host of ["api.us.elevenlabs.io", "api.elevenlabs.io"]) {
      try {
        const response = await fetch(
          `https://${host}/v1/convai/agents/${encodeURIComponent(agentId)}`,
          {
            headers: { "xi-api-key": apiKey, Accept: "application/json" },
            cache: "no-store",
            signal: AbortSignal.timeout(CONFIG_TIMEOUT_MS),
          }
        );
        if (!response.ok) {
          const errorBody = await response.json().catch(() => null) as { detail?: { status?: unknown } } | null;
          const errorCode = typeof errorBody?.detail?.status === "string" && /^[a-z_]+$/i.test(errorBody.detail.status)
            ? errorBody.detail.status : "unknown";
          console.warn("[mila-voice] Config unavailable", host, agentId, response.status, errorCode);
          continue;
        }
        const data = await response.json() as {
          conversation_config?: { tts?: { voice_id?: unknown; model_id?: unknown; stability?: unknown; similarity_boost?: unknown; speed?: unknown } };
        };
        const tts = data.conversation_config?.tts;
        const voiceId = typeof tts?.voice_id === "string" ? tts.voice_id.trim() : "";
        if (!voiceId) {
          console.warn("[mila-voice] Config missing voice", host, response.status);
          continue;
        }
        const modelId = typeof tts?.model_id === "string" ? tts.model_id.trim() : "";
        const settings: MilaVoice["settings"] = {};
        for (const key of ["stability", "similarity_boost", "speed"] as const) {
          if (typeof tts?.[key] === "number" && Number.isFinite(tts[key])) settings[key] = tts[key];
        }
        const value: MilaVoice = {
          agentId, voiceId, settings,
          ...(modelId ? { modelId } : {}),
        };
        cached = { configKey, value, expiresAt: Date.now() + CACHE_MS };
        return value;
      } catch (error) {
        console.warn("[mila-voice] Config request failed", host, error instanceof Error ? error.name : "Error");
      }
    }
    if (pinnedVoice) {
      cached = { configKey, value: pinnedVoice, expiresAt: Date.now() + CACHE_MS };
      return pinnedVoice;
    }
    return null;
  })();
  pending = { configKey, promise };
  try {
    return await promise;
  } finally {
    if (pending?.promise === promise) pending = undefined;
  }
}
