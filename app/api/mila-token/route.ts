import { assertSameOrigin, jsonError, rateLimit, requireConsentHeader } from "@/lib/api-security";

const DEFAULT_AGENT_ID = "agent_7601krc9gaf2eaxr811qgk01epzc";

export async function GET(req: Request) {
  try {
    assertSameOrigin(req);
    requireConsentHeader(req, "ai-coach");
    rateLimit(req, "voice-session", 10);
  } catch {
    return jsonError("Forbidden", 403);
  }

  const persona = new URL(req.url).searchParams.get("persona") === "milosz" ? "milosz" : "mila";
  const agentId = (persona === "milosz" ? process.env.ELEVENLABS_MILOSZ_AGENT_ID ?? process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ?? DEFAULT_AGENT_ID : process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ?? DEFAULT_AGENT_ID).trim();
  if (!agentId) return jsonError("Agent not configured", 503);

  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    return Response.json({ agentId });
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      { headers: { "xi-api-key": apiKey }, cache: "no-store" }
    );

    if (!res.ok) {
      return Response.json({ agentId });
    }

    const data = await res.json() as { signed_url?: string };
    if (!data.signed_url) return Response.json({ agentId });

    return Response.json({ signedUrl: data.signed_url });
  } catch {
    return Response.json({ agentId });
  }
}
