import { sanitizeDisplayName } from "@/lib/api-security";

// Names that would let a player impersonate the product or its staff.
const RESERVED_NAMES = /\b(coach\s*-?\s*fi|coachfi|coachfiai|mila|admin|administrator|moderator|support|official)\b/i;
const MIN_NAME_LENGTH = 2;

/** Escapes LIKE/ILIKE wildcards so a name only matches itself (case-insensitively). */
export function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** Sanitised public leaderboard name, or "" when it is too short or reserved. */
export function leaderboardName(value: unknown) {
  const name = sanitizeDisplayName(value, "");
  if (name.length < MIN_NAME_LENGTH || RESERVED_NAMES.test(name)) return "";
  return name;
}
