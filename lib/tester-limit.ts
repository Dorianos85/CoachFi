const REST_URL = process.env.UPSTASH_REDIS_REST_URL?.trim();
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

export type ConsumeResult = "ok" | "exhausted" | "invalid" | "unconfigured";

const CONSUME_SCRIPT = `
local n = redis.call('GET', KEYS[1])
if not n then return -1 end
n = tonumber(n)
if n <= 0 then return 0 end
redis.call('DECR', KEYS[1])
return 1
`;

function keyFor(code: string) {
  return `coachfi:tester:${code}`;
}

async function redis(command: (string | number)[]): Promise<unknown> {
  const res = await fetch(REST_URL as string, {
    method: "POST",
    headers: { Authorization: `Bearer ${REST_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash error ${res.status}`);
  const data = (await res.json()) as { result?: unknown };
  return data.result;
}

export async function consumeInviteCode(code: string): Promise<ConsumeResult> {
  if (!REST_URL || !REST_TOKEN) return "unconfigured";
  const result = await redis(["EVAL", CONSUME_SCRIPT, 1, keyFor(code)]);
  if (result === 1) return "ok";
  if (result === 0) return "exhausted";
  return "invalid";
}

export async function refundInviteCode(code: string): Promise<void> {
  if (!REST_URL || !REST_TOKEN) return;
  try {
    await redis(["INCR", keyFor(code)]);
  } catch {
    /* best-effort */
  }
}
