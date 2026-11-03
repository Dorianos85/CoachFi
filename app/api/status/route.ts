import { Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

import { jsonError, rateLimit } from "@/lib/api-security";
import { getOptionalEnv, hasConfiguredEnv } from "@/lib/server-env";
import { resolveMilaVoice } from "@/lib/server/mila-voice";

const DEFAULT_SOLANA_RPC = "https://api.devnet.solana.com";
/** Below this the mint wallet cannot pay for many more certificates. */
const MIN_MINT_BALANCE_SOL = 0.05;
const BALANCE_CACHE_MS = 60_000;

let balanceCache: { at: number; funded: boolean | null } | null = null;

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

async function mintWalletFunded(keypair: Keypair) {
  if (balanceCache && Date.now() - balanceCache.at < BALANCE_CACHE_MS) return balanceCache.funded;
  let funded: boolean | null = null;
  try {
    const connection = new Connection(getOptionalEnv("SOLANA_RPC_URL") ?? DEFAULT_SOLANA_RPC, "confirmed");
    const lamports = await connection.getBalance(keypair.publicKey);
    funded = lamports / LAMPORTS_PER_SOL >= MIN_MINT_BALANCE_SOL;
  } catch {
    funded = null;
  }
  balanceCache = { at: Date.now(), funded };
  return funded;
}

/**
 * Public health check. Booleans only: no RPC URL (may embed an API key), no wallet address or
 * balance, no model / voice / agent ids, no table names.
 */
export async function GET(req: Request) {
  try {
    rateLimit(req, "status", 30);
  } catch {
    return jsonError("Too many requests", 429);
  }

  const milaVoice = await resolveMilaVoice();
  const mintKeypair = getMintKeypair();
  const chatConfigured = hasConfiguredEnv("ANTHROPIC_API_KEY") || hasConfiguredEnv("OPENROUTER_API_KEY");

  return Response.json(
    {
      ok: true,
      services: {
        chat: { configured: chatConfigured },
        voice: {
          configured: hasConfiguredEnv("ELEVENLABS_API_KEY"),
          voiceConfigurationResolved: !!milaVoice,
        },
        leaderboard: {
          configured:
            hasConfiguredEnv("NEXT_PUBLIC_SUPABASE_URL") &&
            (hasConfiguredEnv("SUPABASE_SERVICE_ROLE_KEY") || hasConfiguredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")),
        },
        solanaMint: {
          configured: !!mintKeypair,
          funded: mintKeypair ? await mintWalletFunded(mintKeypair) : false,
        },
        sharedRateLimits: {
          configured: hasConfiguredEnv("UPSTASH_REDIS_REST_URL") && hasConfiguredEnv("UPSTASH_REDIS_REST_TOKEN"),
        },
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
