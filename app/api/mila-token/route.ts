import { assertSameOrigin, jsonError } from "@/lib/api-security";

export async function GET(req: Request) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Forbidden", 403);
  }

  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID?.trim();
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
