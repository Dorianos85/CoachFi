import {
  assertSameOrigin,
  jsonError,
  rateLimit,
  readJsonWithLimit,
} from "@/lib/api-security";
import { resolveMilaVoice } from "@/lib/server/mila-voice";

const DEFAULT_MODEL = "eleven_flash_v2_5";
const MAX_TTS_TEXT_LENGTH = 500;

type VoiceLocale = "pl" | "en" | "es" | "fr" | "zh" | "ja" | "hi" | "pt-BR" | "tr";

interface TtsPayload {
  text?: unknown;
  locale?: unknown;
  voiceId?: unknown;
  modelId?: unknown;
}

const LOCALE_TO_LANG: Record<VoiceLocale, string> = {
  pl: "pl",
  en: "en",
  es: "es",
  fr: "fr",
  zh: "zh",
  ja: "ja",
  hi: "hi",
  "pt-BR": "pt",
  tr: "tr",
};

function getEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function isVoiceLocale(value: unknown): value is VoiceLocale {
  return (
    value === "pl" ||
    value === "en" ||
    value === "es" ||
    value === "fr" ||
    value === "zh" ||
    value === "ja" ||
    value === "hi" ||
    value === "pt-BR" ||
    value === "tr"
  );
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
  const apiKey = getEnv("ELEVENLABS_API_KEY");

  if (!apiKey) {
    return Response.json({ error: "Mila voice unavailable" }, { status: 503 });
  }

  // Use the conversation agent's voice for the introduction, read-aloud and replies.
  // A client preference or locale must never silently select another Mila voice.
  const voice = await resolveMilaVoice();
  if (!voice) {
    return Response.json({ error: "Mila voice unavailable" }, { status: 503 });
  }
  // Let the provider validate its configured model; never switch models after a rejection.
  const model = voice.modelId ?? getEnv("ELEVENLABS_MODEL_ID") ?? DEFAULT_MODEL;

  try {
    const query = new URLSearchParams({
      output_format: "mp3_44100_128",
      enable_logging: "false",
    });

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice.voiceId)}/stream?${query}`,
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
          voice_settings: voice.settings,
          ...(locale ? { language_code: LOCALE_TO_LANG[locale] } : {}),
        }),
        signal: AbortSignal.timeout(12000),
      }
    );

    if (!res.ok) {
      console.error("[tts] Provider error", res.status);
      return Response.json({ error: "Mila voice unavailable" }, { status: 502 });
    }

    const audio = await res.arrayBuffer();
    if (audio.byteLength === 0) {
      return Response.json({ error: "Mila voice unavailable" }, { status: 502 });
    }

    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "X-CoachFI-Provider": "elevenlabs",
        "X-CoachFI-Model": model,
        "X-CoachFI-Voice-Id": voice.voiceId,
      },
    });
  } catch {
    console.error("[tts] Provider unavailable");
    return Response.json({ error: "Mila voice unavailable" }, { status: 502 });
  }
}
