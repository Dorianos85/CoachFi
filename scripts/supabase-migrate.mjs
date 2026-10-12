import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import tls from "node:tls";

const dryRun = process.argv.includes("--dry-run");
const onVercel = process.argv.includes("--on-vercel");

if (onVercel && process.env.VERCEL_ENV !== "production" && process.env.VERCEL_ENV !== "preview") {
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
  const headers = { authorization: `Bearer ${accessToken}` };
  const region = await projectRegion(projectId, headers);
  const host = (await poolerHostFromApi(projectId, headers)) ?? (await findPoolerHost(projectId, region));
  console.log(`Using database pooler host ${host}`);
  const user = encodeURIComponent(`postgres.${projectId}`);
  const secret = encodeURIComponent(password);
  return `postgresql://${user}:${secret}@${host}:5432/postgres`;
}

async function projectRegion(projectId, headers) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}`, { headers });
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
  return region;
}

async function poolerHostFromApi(projectId, headers) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/config/database/pooler`, {
    headers,
  });
  if (!response.ok) return null;
  const body = await response.json();
  const rows = Array.isArray(body) ? body : [];
  const match =
    rows.find((row) => row?.pool_mode === "session" && typeof row.db_host === "string") ??
    rows.find((row) => typeof row?.db_host === "string");
  return match?.db_host ?? null;
}

async function findPoolerHost(projectId, region) {
  for (const index of [0, 1, 2]) {
    const host = `aws-${index}-${region}.pooler.supabase.com`;
    if (await poolerKnowsProject(host, projectId)) return host;
  }
  console.error("Could not find the Supabase pooler host for this project.");
  process.exit(1);
}

function poolerKnowsProject(host, projectId) {
  return new Promise((resolve) => {
    let settled = false;
    const socket = net.connect({ host, port: 5432, timeout: 8000 });
    const finish = (known) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(known);
    };
    socket.once("connect", () => {
      const request = Buffer.alloc(8);
      request.writeInt32BE(8, 0);
      request.writeInt32BE(80877103, 4);
      socket.write(request);
    });
    socket.once("data", (chunk) => {
      if (chunk.toString("utf8") !== "S") {
        finish(false);
        return;
      }
      const secure = tls.connect({ socket, servername: host, rejectUnauthorized: false });
      let buffer = Buffer.alloc(0);
      secure.once("secureConnect", () => {
        secure.write(startupMessage(`postgres.${projectId}`, "postgres"));
      });
      secure.on("data", (secureChunk) => {
        buffer = Buffer.concat([buffer, secureChunk]);
        const text = buffer.toString("utf8");
        if (text.includes("not found")) finish(false);
        else if (buffer.includes(0x52)) finish(true);
      });
      secure.on("error", () => finish(false));
    });
    socket.on("timeout", () => finish(false));
    socket.on("error", () => finish(false));
  });
}

function startupMessage(user, database) {
  const body = Buffer.concat([
    Buffer.from(`user\0${user}\0`),
    Buffer.from(`database\0${database}\0`),
    Buffer.from([0]),
  ]);
  const message = Buffer.alloc(8 + body.length);
  message.writeInt32BE(message.length, 0);
  message.writeInt32BE(196608, 4);
  body.copy(message, 8);
  return message;
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
