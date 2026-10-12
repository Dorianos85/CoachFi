import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const dryRun = process.argv.includes("--dry-run");
const productionOnly = process.argv.includes("--if-production");

if (productionOnly && process.env.VERCEL_ENV !== "production") {
  process.exit(0);
}

loadLocalEnv(".env.local");

const projectId = required("SUPABASE_PROJECT_ID");
const password = required("SUPABASE_DB_PASSWORD");
const accessToken = required("SUPABASE_ACCESS_TOKEN");
const dbUrl = await poolerUrl(projectId, password, accessToken);

const pushArgs = ["db", "push", "--db-url", dbUrl, "--yes"];
if (dryRun) pushArgs.push("--dry-run");
process.exit(runSupabase(pushArgs));

async function poolerUrl(projectId, password, accessToken) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    console.error("Could not read the Supabase project region.");
    process.exit(1);
  }
  const project = await response.json();
  const region = typeof project.region === "string" ? project.region : "";
  if (!region) {
    console.error("The Supabase project response did not include a region.");
    process.exit(1);
  }
  const user = encodeURIComponent(`postgres.${projectId}`);
  const secret = encodeURIComponent(password);
  return `postgresql://${user}:${secret}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
}

function runSupabase(args) {
  const result = spawnSync("npx", ["--yes", "supabase", ...args], {
    stdio: "inherit",
    env: process.env,
  });
  return result.status ?? 1;
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing ${name}. Set it in .env.local, or in the Vercel project environment for production.`);
    process.exit(1);
  }
  return value;
}

function loadLocalEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}
