import { assertSameOrigin, jsonError } from "@/lib/api-security";
import { getMilaAgentId } from "@/lib/mila-voice";
import { enforceLimits, limitExceededResponse } from "@/lib/ratelimit";
import { aiDisabled, milaTokenRules } from "@/lib/server/limits";
import { resolveMilaVoice } from "@/lib/server/mila-voice";

const NO_STORE = { "Cache-Control": "no-store" };

async function loadWidgetConfig(agentId: string) {
  try {
    const res = await fetch(
      `https://api.us.elevenlabs.io/v1/convai/agents/${encodeURIComponent(agentId)}/widget`,
      { cache: "no-store", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { widget_config?: unknown };
    return data.widget_config ?? null;
  } catch {
    return null;
  }
}

async function getSignedUrl(agentId: string, apiKey: string) {
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${encodeURIComponent(agentId)}`,
      { headers: { "xi-api-key": apiKey }, cache: "no-store", signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) {
      console.error("[mila-token] signed URL request failed", res.status);
      return "";
    }
    const data = (await res.json()) as { signed_url?: unknown };
    return typeof data.signed_url === "string" ? data.signed_url : "";
  } catch {
    console.error("[mila-token] signed URL request failed");
    return "";
  }
}

/**
 * Issues a short-lived ElevenLabs signed URL (valid ~15 minutes, one conversation) for Mila.
 * Anonymous visitors may talk to Mila, so this is protected by shared per-IP and global limits,
 * not by sign-in. The real conversation caps live in the ElevenLabs agent settings
 * (authentication required, host allowlist, concurrency, daily calls, max duration).
 *
 * In production the server never hands out a bare agent id: without a signed URL it answers 503.
 * (The widget still has a client-side `agent-id` fallback; it stops working once agent
 * authentication is enabled in the ElevenLabs dashboard, which is the intended end state.)
 */
export async function GET(req: Request) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Forbidden", 403);
  }

  if (aiDisabled()) return Response.json({ ok: false, error: "Mila voice unavailable" }, { status: 503, headers: NO_STORE });

  const decision = await enforceLimits(milaTokenRules(req));
  if (!decision.ok) return limitExceededResponse(decision, "Mila voice limit reached. Please try again later.");

  // Widget and read-aloud must use the same verified existing agent.
  const agentId = (await resolveMilaVoice())?.agentId ?? getMilaAgentId();
  if (!agentId) return jsonError("Agent not configured", 503);

  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  const [widgetConfig, signedUrl] = await Promise.all([
    loadWidgetConfig(agentId),
    apiKey ? getSignedUrl(agentId, apiKey) : Promise.resolve(""),
  ]);

  if (signedUrl) {
    return Response.json({ signedUrl, agentId, widgetConfig }, { headers: NO_STORE });
  }

  if (process.env.NODE_ENV === "production") {
    // No public-agent fallback from the server in production. widgetConfig is only styling.
    return Response.json(
      { ok: false, error: "Mila voice unavailable", widgetConfig },
      { status: 503, headers: NO_STORE },
    );
  }

  // Local development without an API key: public agent id, as before.
  console.warn("[mila-token] no signed URL (development): returning the public agent id");
  return Response.json({ agentId, widgetConfig }, { headers: NO_STORE });
}
