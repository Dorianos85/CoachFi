import { getMilaAgentId } from "@/lib/mila-voice";

export interface MilaVoice {
  agentId: string;
  voiceId: string;
  modelId?: string;
  settings: { stability?: number; similarity_boost?: number; speed?: number };
}

const CACHE_MS = 5 * 60 * 1000;
const CONFIG_TIMEOUT_MS = 2000;
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
    // Both IDs already existed in Coach FI. Recover the older owned agent only
    // when the current default cannot be resolved; never choose an arbitrary voice.
    const agentIds = agentId === "agent_7601krc9gaf2eaxr811qgk01epzc"
      ? [agentId, "agent_2301krbsttc8f21ra1h5vge02071"] : [agentId];
    for (const candidateId of agentIds) {
    for (const host of ["api.us.elevenlabs.io", "api.elevenlabs.io"]) {
      try {
        const response = await fetch(
          `https://${host}/v1/convai/agents/${encodeURIComponent(candidateId)}`,
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
          console.warn("[mila-voice] Config unavailable", host, candidateId, response.status, errorCode);
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
          agentId: candidateId, voiceId, settings,
          ...(modelId ? { modelId } : {}),
        };
        cached = { agentId, value, expiresAt: Date.now() + CACHE_MS };
        return value;
      } catch (error) {
        console.warn("[mila-voice] Config request failed", host, error instanceof Error ? error.name : "Error");
      }
    }
    }
    return null;
  })();
  pending = { agentId, promise };
  try {
    return await promise;
  } finally {
    if (pending?.promise === promise) pending = undefined;
  }
}
