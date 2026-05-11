import { Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

import { getOptionalEnv, hasConfiguredEnv } from "@/lib/server-env";

const DEFAULT_SOLANA_RPC = "https://api.devnet.solana.com";
const DEFAULT_ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_ELEVENLABS_MODEL = "eleven_multilingual_v2";

function getDefaultElevenLabsVoiceId() {
  return getOptionalEnv("ELEVENLABS_VOICE_ID") ?? null;
}

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
        model: getOptionalEnv("ELEVENLABS_MODEL_ID") ?? DEFAULT_ELEVENLABS_MODEL,
        defaultVoiceId: getDefaultElevenLabsVoiceId(),
        localeVoiceIds: {
          pl: getOptionalEnv("ELEVENLABS_PL_VOICE_ID") ?? null,
          en: getOptionalEnv("ELEVENLABS_EN_VOICE_ID") ?? null,
          ja: getOptionalEnv("ELEVENLABS_JA_VOICE_ID") ?? null,
        },
        fallback: "Browser speech synthesis",
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
