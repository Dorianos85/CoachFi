import type { User } from "@privy-io/react-auth";

import type { AccountSnapshot } from "@/lib/account-snapshot";

const inflight = new Map<string, Promise<void>>();

export function syncSignedInAccount(user: User, getAccessToken: () => Promise<string | null>) {
  const existing = inflight.get(user.id);
  if (existing) return existing;
  const run = saveIfMissing(user, getAccessToken).finally(() => {
    inflight.delete(user.id);
  });
  inflight.set(user.id, run);
  return run;
}

async function saveIfMissing(user: User, getAccessToken: () => Promise<string | null>) {
  const token = await getAccessToken();
  if (!token) return;

  const current = await accountRequest(token, "GET");
  if (current.configured === false) {
    console.error("[account sync] accounts are not configured");
    return;
  }
  if (current.ok === false) throw new Error(current.error || "Account read failed");
  if (current.account) return;

  const payload = accountPayload(user);
  let saved = await accountRequest(token, "PUT", payload);
  if (saved.ok === false && saved.error === "Invalid display name") {
    const { displayName: _ignoredName, ...withoutName } = payload;
    saved = await accountRequest(token, "PUT", withoutName);
  } else if (saved.ok === false && saved.error === "Invalid email") {
    const { email: _ignoredEmail, ...withoutEmail } = payload;
    saved = await accountRequest(token, "PUT", withoutEmail);
  }
  if (saved.ok === false) throw new Error(saved.error || "Account save failed");
  console.info("[account sync] saved", user.id);
}

function accountPayload(user: User) {
  const email = firstEmail(user);
  const displayName = firstName(user);
  return {
    ...(email ? { email } : {}),
    ...(displayName ? { displayName } : {}),
    state: localSnapshot(displayName),
  };
}

function firstEmail(user: User) {
  return usableEmail(user.google?.email) || usableEmail(user.email?.address) || usableEmail(user.linkedin?.email) || usableEmail(user.apple?.email);
}

function firstName(user: User) {
  const name = user.google?.name || user.twitter?.name || user.linkedin?.name || user.github?.name || readProfileName();
  const trimmed = name?.trim() ?? "";
  return trimmed || undefined;
}

function usableEmail(value: string | null | undefined) {
  if (!value) return undefined;
  const email = value.trim().toLowerCase();
  if (!email || email.length > 320 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return undefined;
  return email;
}

function localSnapshot(displayName: string | undefined): AccountSnapshot {
  const profile = readRecord("coachfi-user");
  const snapshot: AccountSnapshot = { version: 1 };
  const name = typeof profile?.name === "string" && profile.name.trim() ? profile.name.trim() : displayName;
  const goal = typeof profile?.goal === "string" ? profile.goal : undefined;
  const setupDone = typeof profile?.setupDone === "boolean" ? profile.setupDone : undefined;
  if (name || goal || setupDone !== undefined) {
    snapshot.profile = {
      ...(name ? { name } : {}),
      ...(goal !== undefined ? { goal } : {}),
      ...(setupDone !== undefined ? { setupDone } : {}),
    };
  }

  const srs = readStored("coachfi-srs");
  const learnManual = readStored("coachfi-learn-manual");
  const streak = readStored("coachfi-streak");
  const avatar = readStored("coachfi-avatar");
  const vault = readStored("coachfi-vault");
  const challenge = readStored("coachfi-challenge");
  if (srs !== undefined) snapshot.srs = srs;
  if (learnManual !== undefined) snapshot.learnManual = learnManual;
  if (streak !== undefined) snapshot.streak = streak;
  if (avatar !== undefined) snapshot.avatar = avatar;
  if (vault !== undefined) snapshot.vault = vault;
  if (challenge !== undefined) snapshot.challenge = challenge;

  const tokensRaw = window.localStorage.getItem("coachfi-tokens");
  if (tokensRaw !== null) {
    const tokens = Number(tokensRaw);
    if (Number.isFinite(tokens)) snapshot.tokens = tokens;
  }
  return snapshot;
}

function readProfileName() {
  const profile = readRecord("coachfi-user");
  return typeof profile?.name === "string" ? profile.name : "";
}

function readRecord(key: string) {
  const value = readStored(key);
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function readStored(key: string) {
  if (typeof window === "undefined") return undefined;
  const raw = window.localStorage.getItem(key);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

async function accountRequest(token: string, method: "GET" | "PUT", body?: unknown) {
  const response = await fetch("/api/account", {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = (await response.json()) as {
    ok?: boolean;
    configured?: boolean;
    account?: unknown;
    error?: string;
  };
  if (!response.ok) {
    return { ok: false as const, configured: payload.configured, error: payload.error || `Account ${method} failed` };
  }
  return payload;
}
