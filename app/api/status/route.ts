import { Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

import { getOptionalEnv, hasConfiguredEnv } from "@/lib/server-env";
import { getMilaAgentId } from "@/lib/mila-voice";
import { resolveMilaVoice } from "@/lib/server/mila-voice";

const DEFAULT_SOLANA_RPC = "https://api.devnet.solana.com";
const DEFAULT_ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

function getMintKeypair() {
  const raw = getOptionalEnv("SOLANA_MINT_KEYPAIR");
  if (!raw) return null;

  try {
    const secret = Uint8Array.from(JSON.parse(raw) as number[]);
    return Keypair.fromSecretKey(secret);
  } catch {
    return null;
  }
}

export async function GET() {
  const milaVoice = await resolveMilaVoice();
  const mintKeypair = getMintKeypair();
  const mintAuthority = mintKeypair?.publicKey.toBase58() ?? null;
  let mintAuthorityBalanceSol: number | null = null;
  const solanaRpcUrl = getOptionalEnv("SOLANA_RPC_URL") ?? DEFAULT_SOLANA_RPC;

  if (mintKeypair) {
    try {
      const connection = new Connection(solanaRpcUrl, "confirmed");
      const lamports = await connection.getBalance(mintKeypair.publicKey);
      mintAuthorityBalanceSol = lamports / LAMPORTS_PER_SOL;
    } catch {
      mintAuthorityBalanceSol = null;
    }
  }

  return Response.json({
    ok: true,
    services: {
      chat: {
        configured: hasConfiguredEnv("ANTHROPIC_API_KEY"),
        provider: "Anthropic",
        endpoint: "/api/chat",
        model: getOptionalEnv("ANTHROPIC_MODEL") ?? DEFAULT_ANTHROPIC_MODEL,
      },
      voice: {
        configured: hasConfiguredEnv("ELEVENLABS_API_KEY"),
        provider: "ElevenLabs",
        endpoint: "/api/tts",
        agentId: milaVoice?.agentId ?? getMilaAgentId(),
        voiceConfigurationResolved: !!milaVoice,
        model: milaVoice?.modelId ?? null,
        defaultVoiceId: milaVoice?.voiceId ?? null,
        voiceSource: "Mila agent configuration or verified agent-bound snapshot",
        fallback: "Visible text; no alternate voice",
      },
      leaderboard: {
        configured:
          hasConfiguredEnv("NEXT_PUBLIC_SUPABASE_URL") &&
          (hasConfiguredEnv("SUPABASE_SERVICE_ROLE_KEY") ||
            hasConfiguredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")),
        provider: "Supabase",
        endpoint: "/api/leaderboard",
        table: getOptionalEnv("SUPABASE_LEADERBOARD_TABLE") ?? "leaderboard",
      },
      solanaMint: {
        configured: !!mintAuthority,
        provider: "Solana Devnet + Metaplex Core",
        endpoint: "/api/mint-nft",
        rpcUrl: solanaRpcUrl,
        mintAuthority,
        mintAuthorityBalanceSol,
      },
    },
  });
}
