import { assertSameOrigin, jsonError } from "@/lib/api-security";
import { consumeInviteCode, refundInviteCode } from "@/lib/tester-limit";

const DEFAULT_AGENT_ID = "agent_7601krc9gaf2eaxr811qgk01epzc";

function normalizeCode(raw: string | null): string | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  return /^[A-Z0-9-]{4,40}$/.test(code) ? code : null;
}

export async function GET(req: Request) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Forbidden", 403);
  }

  const agentId = (process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ?? DEFAULT_AGENT_ID).trim();
  if (!agentId) return jsonError("Agent not configured", 503);

  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) return jsonError("Voice agent not configured", 503);

  const code = normalizeCode(new URL(req.url).searchParams.get("code"));
  if (!code) return jsonError("Missing or invalid invite code", 400);

  const consumed = await consumeInviteCode(code);
  if (consumed === "unconfigured") return jsonError("Voice access is not available right now", 503);
  if (consumed === "invalid") return jsonError("Invalid invite code", 403);
  if (consumed === "exhausted") return jsonError("You've already used your voice session", 429);

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      { headers: { "xi-api-key": apiKey }, cache: "no-store" }
    );
    if (!res.ok) throw new Error(`signed_url ${res.status}`);
    const data = (await res.json()) as { signed_url?: string };
    if (!data.signed_url) throw new Error("no signed_url");
    return Response.json({ signedUrl: data.signed_url });
  } catch {
    await refundInviteCode(code);
    return jsonError("Could not start voice session, please try again", 503);
  }
}
