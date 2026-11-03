import { ipSubject, limitFromEnv, userSubject, type LimitRule } from "@/lib/ratelimit";

/**
 * Per-endpoint budgets. Every number can be overridden with the env var named next to it
 * (documented in .env.example). Windows: MIN = 60 s, HOUR = 3600 s, DAY = 86 400 s (UTC-aligned).
 */
const MIN = 60;
const HOUR = 3_600;
const DAY = 86_400;
const YEAR = 365 * DAY;

/** Emergency kill switch for every paid AI call (chat → canned text, TTS/voice → 503). */
export function aiDisabled() {
  const value = process.env.COACHFI_AI_DISABLED?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

export function chatRules(req: Request): LimitRule[] {
  const ip = ipSubject(req);
  return [
    { name: "chat:ip:min", subject: ip, limit: limitFromEnv("LIMIT_CHAT_PER_MIN_IP", 6), windowSec: MIN },
    { name: "chat:ip:day", subject: ip, limit: limitFromEnv("LIMIT_CHAT_PER_DAY_IP", 60), windowSec: DAY },
    { name: "chat:global:day", subject: "global", limit: limitFromEnv("LIMIT_CHAT_PER_DAY_GLOBAL", 3_000), windowSec: DAY },
  ];
}

export function ttsRules(req: Request, characters: number): LimitRule[] {
  const ip = ipSubject(req);
  return [
    { name: "tts:ip:min", subject: ip, limit: limitFromEnv("LIMIT_TTS_PER_MIN_IP", 20), windowSec: MIN },
    {
      name: "tts:ip:chars",
      subject: ip,
      limit: limitFromEnv("LIMIT_TTS_CHARS_PER_DAY_IP", 10_000),
      windowSec: DAY,
      cost: characters,
    },
    {
      name: "tts:global:chars",
      subject: "global",
      limit: limitFromEnv("LIMIT_TTS_CHARS_PER_DAY_GLOBAL", 100_000),
      windowSec: DAY,
      cost: characters,
    },
  ];
}

export function milaTokenRules(req: Request): LimitRule[] {
  const ip = ipSubject(req);
  return [
    { name: "mila:ip:hour", subject: ip, limit: limitFromEnv("LIMIT_MILA_TOKEN_PER_HOUR_IP", 30), windowSec: HOUR },
    { name: "mila:ip:day", subject: ip, limit: limitFromEnv("LIMIT_MILA_TOKEN_PER_DAY_IP", 100), windowSec: DAY },
    { name: "mila:global:day", subject: "global", limit: limitFromEnv("LIMIT_MILA_TOKEN_PER_DAY_GLOBAL", 1_500), windowSec: DAY },
  ];
}

/** Split so the per-certificate and budget rules can be refunded when the mint itself fails. */
export function mintRules(req: Request, userId: string, certificateId: string) {
  const user = userSubject(userId);
  const refundable: LimitRule[] = [
    { name: `mint:user:${certificateId}`, subject: user, limit: limitFromEnv("LIMIT_MINT_PER_CERTIFICATE_USER", 1), windowSec: YEAR },
    { name: "mint:user:day", subject: user, limit: limitFromEnv("LIMIT_MINT_PER_DAY_USER", 3), windowSec: DAY },
    { name: "mint:global:day", subject: "global", limit: limitFromEnv("LIMIT_MINT_PER_DAY_GLOBAL", 100), windowSec: DAY },
  ];
  const attempts: LimitRule[] = [
    { name: "mint:ip:hour", subject: ipSubject(req), limit: limitFromEnv("LIMIT_MINT_PER_HOUR_IP", 5), windowSec: HOUR },
  ];
  return { refundable, all: [...attempts, ...refundable] };
}

export function leaderboardWriteRules(req: Request): LimitRule[] {
  const ip = ipSubject(req);
  return [
    { name: "lb:ip:hour", subject: ip, limit: limitFromEnv("LIMIT_LEADERBOARD_WRITES_PER_HOUR_IP", 12), windowSec: HOUR },
    {
      name: "lb:global:day",
      subject: "global",
      limit: limitFromEnv("LIMIT_LEADERBOARD_WRITES_PER_DAY_GLOBAL", 3_000),
      windowSec: DAY,
    },
  ];
}
