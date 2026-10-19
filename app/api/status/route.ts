export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Local release policy only. Never probes providers, RPC, auth or secret config. */
export async function GET() {
  return Response.json({
    ok: true,
    scope: "local_release_policy",
    externalProbesPerformed: false,
    services: {
      chat: {
        status: "local_only",
        externalEnabled: false,
        endpoint: "/api/chat",
        provider: "predefined_local_examples",
      },
      voice: {
        status: "external_disabled",
        externalEnabled: false,
        endpoint: "/api/tts",
        fallback: "Text or click-to-read with a matching local device voice.",
      },
      leaderboard: {
        status: "deferred",
        enabled: false,
        endpoint: "/api/leaderboard",
      },
      solanaMint: {
        status: "deferred",
        enabled: false,
        endpoint: "/api/mint-nft",
      },
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
