import { readJsonWithLimit } from "@/lib/api-security";
import { accessErrorResponse } from "@/lib/server/api-access";
import { denyExternalAiUnlessReady } from "@/lib/server/api-access-policy";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await readJsonWithLimit<{ consent?: unknown }>(req, 4096);
    return await denyExternalAiUnlessReady(req, body?.consent, ["voice"]);
  } catch (error) {
    return accessErrorResponse(error);
  }
}
