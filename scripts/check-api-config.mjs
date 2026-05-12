import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

const ROOT = process.cwd();
const ENV_FILE = resolve(ROOT, ".env.local");
const DEFAULT_SOLANA_RPC = "https://api.devnet.solana.com";

const PLACEHOLDERS = new Set([
  "",
  "empty",
  "placeholder",
  "changeme",
  "change-me",
  "your_key_here",
  "your-api-key",
]);

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  const env = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    env[key] = value;
  }

  return env;
}

function configured(value) {
  if (value === undefined) return false;
  const trimmed = String(value).trim();
  const lower = trimmed.toLowerCase();
  return (
    !PLACEHOLDERS.has(lower) &&
    !lower.startsWith("your_") &&
    !lower.startsWith("your-") &&
    !lower.includes("example") &&
    !lower.includes("xxx") &&
    !lower.endsWith("...")
  );
}

function printService(name, checks) {
  const ok = checks.every((check) => check.ok);
  console.log(`${ok ? "OK" : "TODO"} ${name}`);
  for (const check of checks) {
    console.log(`  ${check.ok ? "OK" : "TODO"} ${check.label}`);
  }
}

async function checkJson(url, options = {}) {
  try {
    const res = await fetch(url, options);
    let data = null;
    try {
      data = await res.json();
    } catch {}
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : "request failed",
    };
  }
}

async function main() {
  const env = parseEnvFile(ENV_FILE);
  if (!existsSync(ENV_FILE)) {
    console.log("TODO .env.local not found. Copy .env.example to .env.local first.");
  }

  printService("Anthropic Claude", [
    { label: "ANTHROPIC_API_KEY", ok: configured(env.ANTHROPIC_API_KEY) },
    { label: `ANTHROPIC_MODEL=${env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001"}`, ok: true },
  ]);

  printService("OpenRouter AI fallback", [
    { label: "OPENROUTER_API_KEY", ok: configured(env.OPENROUTER_API_KEY) },
    { label: `OPENROUTER_MODEL=${env.OPENROUTER_MODEL || "openrouter/auto"}`, ok: true },
    { label: `AI_PROVIDER=${env.AI_PROVIDER || "anthropic first, then openrouter"}`, ok: true },
  ]);

  printService("ElevenLabs TTS", [
    { label: "ELEVENLABS_API_KEY", ok: configured(env.ELEVENLABS_API_KEY) },
    { label: `ELEVENLABS_MODEL_ID=${env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2"}`, ok: true },
    { label: `ELEVENLABS_VOICE_ID=${env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"}`, ok: true },
    { label: `ELEVENLABS_PL_VOICE_ID=${env.ELEVENLABS_PL_VOICE_ID || "optional"}`, ok: true },
    { label: `ELEVENLABS_EN_VOICE_ID=${env.ELEVENLABS_EN_VOICE_ID || "optional"}`, ok: true },
    { label: `ELEVENLABS_JA_VOICE_ID=${env.ELEVENLABS_JA_VOICE_ID || "optional"}`, ok: true },
  ]);

  const agentId = env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "agent_7601krc9gaf2eaxr811qgk01epzc";
  const convaiChecks = [
    { label: `NEXT_PUBLIC_ELEVENLABS_AGENT_ID=${agentId}`, ok: configured(agentId) },
  ];

  if (configured(agentId)) {
    const widgetConfig = await checkJson(
      `https://api.us.elevenlabs.io/v1/convai/agents/${encodeURIComponent(agentId)}/widget`
    );
    convaiChecks.push({
      label: `public widget config reachable (${widgetConfig.status || "network error"})`,
      ok: widgetConfig.ok && !!widgetConfig.data?.widget_config,
    });

    if (configured(env.ELEVENLABS_API_KEY)) {
      const signedUrl = await checkJson(
        `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
        { headers: { "xi-api-key": env.ELEVENLABS_API_KEY } }
      );
      const missingPermission = signedUrl.data?.detail?.status === "missing_permissions";
      convaiChecks.push({
        label: missingPermission
          ? "signed URL optional: API key is missing convai_write permission"
          : `signed URL optional (${signedUrl.status || "network error"})`,
        ok: signedUrl.ok && !!signedUrl.data?.signed_url,
      });
    } else {
      convaiChecks.push({
        label: "signed URL optional: ELEVENLABS_API_KEY not configured",
        ok: false,
      });
    }
  }

  printService("ElevenLabs ConvAI Agent", convaiChecks);

  printService("Supabase leaderboard", [
    { label: "NEXT_PUBLIC_SUPABASE_URL", ok: configured(env.NEXT_PUBLIC_SUPABASE_URL) },
    {
      label: "SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
      ok: configured(env.SUPABASE_SERVICE_ROLE_KEY) || configured(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    },
    { label: `SUPABASE_LEADERBOARD_TABLE=${env.SUPABASE_LEADERBOARD_TABLE || "leaderboard"}`, ok: true },
  ]);

  const solanaChecks = [
    { label: `SOLANA_RPC_URL=${env.SOLANA_RPC_URL || DEFAULT_SOLANA_RPC}`, ok: true },
    { label: "SOLANA_MINT_KEYPAIR", ok: configured(env.SOLANA_MINT_KEYPAIR) },
  ];

  if (configured(env.SOLANA_MINT_KEYPAIR)) {
    try {
      const secret = Uint8Array.from(JSON.parse(env.SOLANA_MINT_KEYPAIR));
      const keypair = Keypair.fromSecretKey(secret);
      const rpc = env.SOLANA_RPC_URL || DEFAULT_SOLANA_RPC;
      const connection = new Connection(rpc, "confirmed");
      const lamports = await connection.getBalance(keypair.publicKey);
      solanaChecks.push({
        label: `mint authority ${keypair.publicKey.toBase58()} balance ${lamports / LAMPORTS_PER_SOL} SOL`,
        ok: lamports > 0,
      });
    } catch (error) {
      solanaChecks.push({
        label: `SOLANA_MINT_KEYPAIR parses correctly (${error instanceof Error ? error.message : "invalid"})`,
        ok: false,
      });
    }
  }

  printService("Solana Devnet mint", solanaChecks);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
