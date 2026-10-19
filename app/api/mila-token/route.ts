import { readJsonWithLimit } from "@/lib/api-security";
import { accessErrorResponse } from "@/lib/server/api-access";
import { denyExternalAiUnlessReady } from "@/lib/server/api-access-policy";

export const runtime = "nodejs";

/** GET must never issue a reusable provider credential or public agent fallback. */
export async function GET() {
  return Response.json({ ok: false, code: "METHOD_NOT_ALLOWED", error: "Use POST." }, {
    status: 405,
    headers: { Allow: "POST", "Cache-Control": "no-store" },
  });
}

export async function POST(req: Request) {
  try {
    const body = await readJsonWithLimit<{ consent?: unknown }>(req, 2048);
    return await denyExternalAiUnlessReady(req, body?.consent, ["aiCoach", "voice"]);
  } catch (error) {
    return accessErrorResponse(error);
  }
}
