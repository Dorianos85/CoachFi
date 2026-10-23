import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1", NEXT_PUBLIC_APP_URL: "http://127.0.0.1:43191" };
// Empty process variables take precedence over .env files. Never load cloud secrets
// for synthetic local tests, even when a developer has configured a real account.
for (const name of [
  "ANTHROPIC_API_KEY", "OPENROUTER_API_KEY", "ELEVENLABS_API_KEY",
  "NEXT_PUBLIC_ELEVENLABS_AGENT_ID", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN",
  "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ACCESS_TOKEN", "SUPABASE_DB_PASSWORD", "SUPABASE_PROJECT_ID",
  "SOLANA_RPC_URL", "SOLANA_MINT_KEYPAIR", "NEXT_PUBLIC_CDP_PROJECT_ID",
  "CDP_API_KEY_ID", "CDP_API_KEY_SECRET", "NEXT_PUBLIC_DEV_MINT_RECIPIENT",
]) env[name] = "";

const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", "43191"], {
  env, stdio: "inherit", windowsHide: true,
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
