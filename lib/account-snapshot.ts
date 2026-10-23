import { ACCOUNT_GATES } from "@/lib/accountGates";

const MAX_SNAPSHOT_CHARS = 262_144;

export interface AccountSnapshot {
  version: 1;
  profile?: {
    name?: string;
    goal?: string;
    setupDone?: boolean;
  };
  srs?: unknown;
  learnManual?: unknown;
  streak?: unknown;
  tokens?: number;
  avatar?: unknown;
  vault?: unknown;
  challenge?: unknown;
  health?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function sanitizeAccountSnapshot(value: unknown): AccountSnapshot | null {
  if (!isRecord(value) || value.version !== 1) return null;

  const next: Record<string, unknown> = { version: 1 };
  if (isRecord(value.profile)) {
    const profile: Record<string, unknown> = {};
    if (typeof value.profile.name === "string") profile.name = value.profile.name.trim().slice(0, 80);
    if (typeof value.profile.goal === "string") profile.goal = value.profile.goal.trim().slice(0, 200);
    if (typeof value.profile.setupDone === "boolean") profile.setupDone = value.profile.setupDone;
    next.profile = profile;
  }

  for (const key of ["srs", "learnManual", "streak", "avatar", "vault", "challenge"] as const) {
    if (key in value) next[key] = value[key];
  }

  if (typeof value.tokens === "number" && Number.isFinite(value.tokens)) {
    next.tokens = Math.max(0, Math.min(1_000_000_000, Math.trunc(value.tokens)));
  }

  if (ACCOUNT_GATES.persistHealth && "health" in value) {
    next.health = value.health;
  }

  try {
    const encoded = JSON.stringify(next);
    if (encoded.length > MAX_SNAPSHOT_CHARS) return null;
    return JSON.parse(encoded) as AccountSnapshot;
  } catch {
    return null;
  }
}
