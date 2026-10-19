#!/usr/bin/env node
import { readFileSync, existsSync, appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomInt } from "node:crypto";

const ROOT = process.cwd();
const ENV_FILE = resolve(ROOT, ".env.local");

// Avoid visually ambiguous characters (0/O, 1/I/L) so codes are easy to
// read aloud and retype.
const CODE_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const DEFAULT_COUNT = 10;
const DEFAULT_PREFIX = "CFI";
const DEFAULT_TTL_DAYS = 30;

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

function parseArgs(argv) {
  const args = { count: DEFAULT_COUNT, prefix: DEFAULT_PREFIX, ttlDays: DEFAULT_TTL_DAYS, out: null };

  for (const arg of argv) {
    const [rawKey, rawValue] = arg.replace(/^--/, "").split("=");
    if (rawKey === "count") args.count = Number(rawValue);
    else if (rawKey === "prefix") args.prefix = (rawValue ?? DEFAULT_PREFIX).toUpperCase();
    else if (rawKey === "ttl-days") args.ttlDays = Number(rawValue);
    else if (rawKey === "out") args.out = rawValue;
  }

  if (!Number.isInteger(args.count) || args.count <= 0) {
    throw new Error("Invalid --count value (must be a positive integer)");
  }
  if (!Number.isFinite(args.ttlDays) || args.ttlDays <= 0) {
    throw new Error("Invalid --ttl-days value (must be a positive number)");
  }
  if (!/^[A-Z0-9]{1,10}$/.test(args.prefix)) {
    throw new Error("Invalid --prefix value (A-Z0-9, max 10 chars)");
  }

  return args;
}

function generateCode(prefix) {
  let suffix = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    suffix += CODE_CHARSET[randomInt(CODE_CHARSET.length)];
  }
  return `${prefix}-${suffix}`;
}

async function pipeline(restUrl, restToken, commands) {
  const res = await fetch(`${restUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${restToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });

  if (!res.ok) {
    throw new Error(`Upstash pipeline error ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

async function main() {
  const fileEnv = parseEnvFile(ENV_FILE);
  const restUrl = (process.env.UPSTASH_REDIS_REST_URL ?? fileEnv.UPSTASH_REDIS_REST_URL)?.trim();
  const restToken = (process.env.UPSTASH_REDIS_REST_TOKEN ?? fileEnv.UPSTASH_REDIS_REST_TOKEN)?.trim();

  if (!restUrl || !restToken) {
    console.error(
      "Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN. Set them in .env.local or the environment."
    );
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  const ttlSeconds = Math.round(args.ttlDays * 24 * 60 * 60);

  const codes = new Set();
  while (codes.size < args.count) {
    codes.add(generateCode(args.prefix));
  }
  const codeList = [...codes];

  // One conversation per code: value "1" is decremented to 0 by
  // lib/tester-limit.ts on first (and only) successful signed-URL fetch.
  // NX guards against overwriting an existing, still-live code on collision.
  const commands = codeList.map((code) => ["SET", `coachfi:tester:${code}`, "1", "EX", ttlSeconds, "NX"]);

  const BATCH_SIZE = 50;
  const results = [];
  for (let i = 0; i < commands.length; i += BATCH_SIZE) {
    const batch = commands.slice(i, i + BATCH_SIZE);
    const batchResults = await pipeline(restUrl, restToken, batch);
    results.push(...batchResults);
  }

  const seeded = [];
  for (let i = 0; i < codeList.length; i += 1) {
    if (results[i]?.result === "OK") {
      seeded.push(codeList[i]);
    } else {
      console.warn(`Skipped ${codeList[i]}: key already existed or Upstash rejected it.`);
    }
  }

  console.log(`Seeded ${seeded.length}/${args.count} invite code(s), 1 conversation each, TTL ${args.ttlDays}d:\n`);
  for (const code of seeded) {
    console.log(code);
  }

  if (args.out) {
    const outPath = resolve(ROOT, args.out);
    appendFileSync(outPath, `${seeded.join("\n")}\n`, "utf8");
    console.log(`\nAppended to ${outPath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
