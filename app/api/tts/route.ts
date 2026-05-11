import {
  assertSameOrigin,
  jsonError,
  rateLimit,
  readJsonWithLimit,
} from "@/lib/api-security";

const DEFAULT_MODEL = "eleven_multilingual_v2";
const MAX_TTS_TEXT_LENGTH = 500;

type VoiceLocale = "pl" | "en" | "ja";

interface TtsPayload {
  text?: unknown;
  locale?: unknown;
  voiceId?: unknown;
  modelId?: unknown;
}

const LOCALE_TO_LANG: Record<VoiceLocale, string> = {
  pl: "pl",
  en: "en",
  ja: "ja",
};

const LOCALE_VOICE_ENV: Record<VoiceLocale, string> = {
  pl: "ELEVENLABS_PL_VOICE_ID",
  en: "ELEVENLABS_EN_VOICE_ID",
  ja: "ELEVENLABS_JA_VOICE_ID",
};

function getEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function isVoiceLocale(value: unknown): value is VoiceLocale {
  return value === "pl" || value === "en" || value === "ja";
}

function getLocaleVoiceId(locale?: VoiceLocale) {
  if (!locale) return undefined;
  return getEnv(LOCALE_VOICE_ENV[locale]);
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    rateLimit(req, "tts", 30);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request blocked";
    return jsonError(message, message === "Too many requests" ? 429 : 403);
  }

  let payload: TtsPayload;
  try {
    payload = await readJsonWithLimit<TtsPayload>(req, 1600);
  } catch {
    return jsonError("Invalid payload", 400);
  }

  if (typeof payload.text !== "string") {
    return Response.json({ error: "Text is required" }, { status: 400 });
  }

  const text = payload.text.trim();
  if (!text) {
    return Response.json({ error: "Text is required" }, { status: 400 });
  }

  if (text.length > MAX_TTS_TEXT_LENGTH) {
    return Response.json({ error: "Text must be 500 characters or fewer" }, { status: 400 });
  }

  const locale = isVoiceLocale(payload.locale) ? payload.locale : undefined;
  const selectedVoiceId =
    optionalString(payload.voiceId) ??
    getLocaleVoiceId(locale) ??
    getEnv("ELEVENLABS_VOICE_ID");
  const model = optionalString(payload.modelId) ?? getEnv("ELEVENLABS_MODEL_ID") ?? DEFAULT_MODEL;
  const apiKey = getEnv("ELEVENLABS_API_KEY");

  if (!apiKey) {
    return Response.json({ error: "ELEVENLABS_API_KEY not set", fallback: true }, { status: 503 });
  }

  if (!selectedVoiceId) {
    return Response.json({ error: "ElevenLabs voice ID not configured", fallback: true }, { status: 503 });
  }

  try {
    const query = new URLSearchParams({
      output_format: "mp3_44100_128",
      enable_logging: "false",
    });

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}/stream?${query}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: model,
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          ...(locale ? { language_code: LOCALE_TO_LANG[locale] } : {}),
        }),
      }
    );

    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      console.error("[tts]", res.status, msg.slice(0, 280));
      return Response.json({ error: "ElevenLabs API error", fallback: true }, { status: 502 });
    }

    const audio = await res.arrayBuffer();
    if (audio.byteLength === 0) {
      return Response.json({ error: "Empty audio response", fallback: true }, { status: 502 });
    }

    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "X-CoachFI-Provider": "elevenlabs",
        "X-CoachFI-Model": model,
      },
    });
  } catch (err) {
    console.error("[tts]", err);
    return Response.json({ error: "TTS failed", fallback: true }, { status: 500 });
  }
}
