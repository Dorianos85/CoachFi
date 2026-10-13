import { assertSameOrigin, jsonError } from "@/lib/api-security";

const DEFAULT_AGENT_ID = "agent_7601krc9gaf2eaxr811qgk01epzc";

async function loadWidgetConfig(agentId: string) {
  try {
    const res = await fetch(
      `https://api.us.elevenlabs.io/v1/convai/agents/${encodeURIComponent(agentId)}/widget`,
      { cache: "no-store", headers: { Accept: "application/json" } }
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

  const agentId = (process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ?? DEFAULT_AGENT_ID).trim();
  if (!agentId) return jsonError("Agent not configured", 503);

  const widgetConfig = await loadWidgetConfig(agentId);
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    return Response.json({ agentId, widgetConfig });
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      { headers: { "xi-api-key": apiKey }, cache: "no-store" }
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
