import { assertSameOrigin, jsonError } from "@/lib/api-security";
import { getMilaAgentId } from "@/lib/mila-voice";
import { resolveMilaVoice } from "@/lib/server/mila-voice";

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

export async function GET(req: Request) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Forbidden", 403);
  }

  // Widget and read-aloud must use the same verified existing agent.
  const agentId = (await resolveMilaVoice())?.agentId ?? getMilaAgentId();
  if (!agentId) return jsonError("Agent not configured", 503);

  const widgetConfig = await loadWidgetConfig(agentId);
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    return Response.json({ agentId, widgetConfig });
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      { headers: { "xi-api-key": apiKey }, cache: "no-store", signal: AbortSignal.timeout(4000) }
    );

    if (!res.ok) {
      return Response.json({ agentId, widgetConfig });
    }

    const data = await res.json() as { signed_url?: string };
    if (!data.signed_url) return Response.json({ agentId, widgetConfig });

    return Response.json({ signedUrl: data.signed_url, agentId, widgetConfig });
  } catch {
    return Response.json({ agentId, widgetConfig });
  }
}
