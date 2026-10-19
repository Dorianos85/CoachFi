import { deferredFeatureResponse } from "@/lib/server/api-access-scope";

export const runtime = "nodejs";

export async function GET() {
  return deferredFeatureResponse("web3");
}
