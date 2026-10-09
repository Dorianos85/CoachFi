import type { User } from "@privy-io/react-auth";

import type { AccountSnapshot } from "@/lib/account-snapshot";
import {
  LEARNING_FIELDS,
  LEARNING_STORAGE_KEYS,
  learningStorageWrites,
  mergeLearningFields,
  type LearningField,
  type LocalLearningFields,
} from "@/lib/learning-state";

const REV_KEY = "coachfi-learning-rev";

type TokenGetter = () => Promise<string | null>;

let session: TokenGetter | null = null;
let chain: Promise<void> = Promise.resolve();
let pullQueued = false;
let flushQueued = false;
let pagehideBound = false;
const dirty = new Set<LearningField>();

export function setLearningSyncSession(getter: TokenGetter | null) {
  session = getter;
  if (getter) ensurePagehide();
}

export function stopLearningSync() {
  const getter = session;
  session = null;
  if (!getter) return Promise.resolve();
  return enqueue(() => flushWith(getter));
}

export function syncSignedInAccount(user: User, getAccessToken: TokenGetter) {
  setLearningSyncSession(getAccessToken);
  if (pullQueued) return chain;
  pullQueued = true;
  return enqueue(async () => {
    pullQueued = false;
    await pullOrCreate(user);
  });
}

export function persistLearningState(field: LearningField) {
  if (!session || typeof window === "undefined") return;
  dirty.add(field);
  window.localStorage.setItem(REV_KEY, String(readRev() + 1));
  if (flushQueued) return;
  flushQueued = true;
  void enqueue(async () => {
    flushQueued = false;
    const getter = session;
    if (!getter) return;
    await flushWith(getter);
  });
}

function enqueue(task: () => Promise<void>) {
  const run = chain.then(task, task);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function ensurePagehide() {
  if (pagehideBound || typeof window === "undefined") return;
  pagehideBound = true;
  window.addEventListener("pagehide", () => {
    const getter = session;
    if (!getter || readRev() === 0) return;
    void enqueue(() => flushWith(getter));
  });
}

async function pullOrCreate(user: User) {
  const getter = session;
  if (!getter) return;
  const token = await getter();
  if (!token) return;

  const seen = readRev();
  const current = await accountRequest(token, "GET");
  if (current.configured === false) {
    console.error("[account sync] accounts are not configured");
    return;
  }
  if (current.ok === false) throw new Error(current.error || "Account read failed");

  if (!current.account || !current.state) {
    await uploadSnapshot(user, token);
    if (readRev() === seen) clearUnsynced();
    return;
  }

  const changedDuringRead = readRev() !== seen || dirty.size > 0;
  if (changedDuringRead) {
    applyLearningState(current.state, dirty);
    await flushWith(getter);
    return;
  }

  if (readRev() > 0) {
    await flushWith(getter);
    return;
  }

  applyLearningState(current.state);
}

async function uploadSnapshot(user: User, token: string) {
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

async function flushWith(getter: TokenGetter) {
  const seen = readRev();
  const fields = fieldsToPush();
  if (fields.length === 0) return;

  const token = await getter();
  if (!token) return;
  const current = await accountRequest(token, "GET");
  if (current.configured === false) {
    console.error("[account sync] accounts are not configured");
    return;
  }
  if (current.ok === false) {
    console.error("[account sync] progress save skipped", current.error || "Account read failed");
    return;
  }
  if (!current.account || !current.state) return;

  const next = mergeLearningFields(current.state, readLocalLearning(), fields);
  const saved = await accountRequest(token, "PUT", { state: next });
  if (saved.ok === false) {
    console.error("[account sync] progress save failed", saved.error || "Account save failed");
    return;
  }
  if (readRev() === seen) clearUnsynced();
  console.info("[account sync] progress saved", fields.join(","));
}

function fieldsToPush(): LearningField[] {
  if (dirty.size > 0) return LEARNING_FIELDS.filter((field) => dirty.has(field));
  if (readRev() > 0) return [...LEARNING_FIELDS];
  return [];
}

function applyLearningState(state: AccountSnapshot, skip: Set<LearningField> = new Set()) {
  if (typeof window === "undefined") return;
  let tokensChanged = false;
  let learningChanged = false;
  for (const write of learningStorageWrites(state)) {
    if (skip.has(write.field)) continue;
    if (write.value === null) window.localStorage.removeItem(write.key);
    else window.localStorage.setItem(write.key, write.value);
    learningChanged = true;
    if (write.field === "tokens") tokensChanged = true;
  }
  if (tokensChanged) window.dispatchEvent(new Event("coachfi-tokens"));
  if (tokensChanged || learningChanged) window.dispatchEvent(new Event("coachfi-learning"));
}

function readLocalLearning(): LocalLearningFields {
  if (typeof window === "undefined") {
    return { srsPresent: false, learnManualPresent: false, tokensPresent: false };
  }
  const srs = readStored(LEARNING_STORAGE_KEYS.srs);
  const learnManual = readStored(LEARNING_STORAGE_KEYS.learnManual);
  const tokensRaw = window.localStorage.getItem(LEARNING_STORAGE_KEYS.tokens);
  const tokens = tokensRaw === null ? undefined : Number(tokensRaw);
  return {
    srs,
    learnManual,
    tokens,
    srsPresent: srs !== undefined,
    learnManualPresent: learnManual !== undefined,
    tokensPresent: tokensRaw !== null && Number.isFinite(tokens),
  };
}

function readRev() {
  if (typeof window === "undefined") return 0;
  const value = Number(window.localStorage.getItem(REV_KEY));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function clearUnsynced() {
  dirty.clear();
  if (typeof window !== "undefined") window.localStorage.removeItem(REV_KEY);
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

  const local = readLocalLearning();
  if (local.srsPresent) snapshot.srs = local.srs;
  if (local.learnManualPresent) snapshot.learnManual = local.learnManual;
  if (local.tokensPresent && typeof local.tokens === "number") snapshot.tokens = local.tokens;

  const streak = readStored("coachfi-streak");
  const avatar = readStored("coachfi-avatar");
  const vault = readStored("coachfi-vault");
  const challenge = readStored("coachfi-challenge");
  if (streak !== undefined) snapshot.streak = streak;
  if (avatar !== undefined) snapshot.avatar = avatar;
  if (vault !== undefined) snapshot.vault = vault;
  if (challenge !== undefined) snapshot.challenge = challenge;
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

type AccountPayload = {
  ok?: boolean;
  configured?: boolean;
  account?: unknown;
  state?: AccountSnapshot | null;
  error?: string;
};

async function accountRequest(token: string, method: "GET" | "PUT", body?: unknown): Promise<AccountPayload> {
  const response = await fetch("/api/account", {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = (await response.json()) as AccountPayload;
  if (!response.ok) {
    return { ok: false, configured: payload.configured, error: payload.error || `Account ${method} failed` };
  }
  return payload;
}
