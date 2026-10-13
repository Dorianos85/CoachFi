import { getMilaAgentId } from "@/lib/mila-voice";

export interface MilaVoice {
  voiceId: string;
  modelId?: string;
  settings: { stability?: number; similarity_boost?: number; speed?: number };
}

const CACHE_MS = 5 * 60 * 1000;
const CONFIG_TIMEOUT_MS = 4000;
let cached: { agentId: string; value: MilaVoice; expiresAt: number } | undefined;
let pending: { agentId: string; promise: Promise<MilaVoice | null> } | undefined;

/** Read only voice fields; agent prompts, transcripts and credentials never leave the server. */
export async function resolveMilaVoice(): Promise<MilaVoice | null> {
  const agentId = getMilaAgentId();
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!agentId || !apiKey) return null;
  if (cached?.agentId === agentId && cached.expiresAt > Date.now()) return cached.value;
  if (pending?.agentId === agentId) return pending.promise;

  const promise = (async () => {
    try {
      const response = await fetch(
        `https://api.us.elevenlabs.io/v1/convai/agents/${encodeURIComponent(agentId)}`,
        {
          headers: { "xi-api-key": apiKey, Accept: "application/json" },
          cache: "no-store",
          signal: AbortSignal.timeout(CONFIG_TIMEOUT_MS),
        }
      );
      if (!response.ok) return null;
      const data = await response.json() as {
        conversation_config?: { tts?: { voice_id?: unknown; model_id?: unknown; stability?: unknown; similarity_boost?: unknown; speed?: unknown } };
      };
      const tts = data.conversation_config?.tts;
      const voiceId = typeof tts?.voice_id === "string" ? tts.voice_id.trim() : "";
      if (!voiceId) return null;
      const modelId = typeof tts?.model_id === "string" ? tts.model_id.trim() : "";
      const settings: MilaVoice["settings"] = {};
      for (const key of ["stability", "similarity_boost", "speed"] as const) {
        if (typeof tts?.[key] === "number" && Number.isFinite(tts[key])) settings[key] = tts[key];
      }
      const value: MilaVoice = {
        voiceId, settings,
        ...(modelId ? { modelId } : {}),
      };
      cached = { agentId, value, expiresAt: Date.now() + CACHE_MS };
      return value;
    } catch {
      return null;
    }
  })();
  pending = { agentId, promise };
  try {
    return await promise;
  } finally {
    if (pending?.promise === promise) pending = undefined;
  }
}
