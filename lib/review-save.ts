import type { PersonalStorageHandle, StorageOwner } from "@/lib/product-storage";
import { createQuizSaveController } from "@/lib/quiz-save";
import type { SRSCard } from "@/lib/srs";

export type ReviewSaveStatus = "saved" | "retryable" | "uncertain" | "stopped" | "ignored";
export interface ReviewSaveResult { readonly status: ReviewSaveStatus }
export interface ReviewSaveContext {
  readonly locale: string;
  readonly questionId: string;
  readonly session: number;
}
declare const reviewTicketBrand: unique symbol;
export interface ReviewSaveTicket { readonly [reviewTicketBrand]: true }
export interface ReviewSaveController {
  begin(storage: PersonalStorageHandle, context: ReviewSaveContext): ReviewSaveTicket;
  retire(ticket?: ReviewSaveTicket): void;
  current(ticket: ReviewSaveTicket, storage: PersonalStorageHandle): boolean;
  isOpen(ticket: ReviewSaveTicket, storage: PersonalStorageHandle): boolean;
  issue(storage: PersonalStorageHandle): "uncertain" | null;
  run(ticket: ReviewSaveTicket, storage: PersonalStorageHandle,
    record: (tracedStorage: PersonalStorageHandle) => void, activity?: () => void): ReviewSaveResult;
}

interface Scope { readonly owner: StorageOwner; readonly revision: number }
// Only uncertain scopes are retained. Do not evict a quarantine to make a retry possible.
const quarantined: Scope[] = [];
const inFlightScopes: Scope[] = [];
const MAX_QUARANTINED_SCOPES = 64;
let quarantineCapacityReached = false;
const outcome = (status: ReviewSaveStatus): ReviewSaveResult => Object.freeze({ status });
function ownerCurrent(storage: PersonalStorageHandle): boolean {
  try { return storage.isCurrent() === true; } catch { return false; }
}
function scopeOf(storage: PersonalStorageHandle): Scope | null {
  try {
    const owner = storage.owner, revision = storage.revision;
    if (!Number.isSafeInteger(revision) || revision < 0 || !owner) return null;
    if (owner.kind === "guest") return { owner: Object.freeze({ kind: "guest" }), revision };
    if (owner.kind === "account" && (owner.provider === "cdp" || owner.provider === "supabase") &&
      typeof owner.userId === "string" && owner.userId.length > 0) {
      return { owner: Object.freeze({ kind: "account", provider: owner.provider, userId: owner.userId }), revision };
    }
  } catch { /* An unavailable identity cannot authorize a write. */ }
  return null;
}
function sameScope(a: Scope, b: Scope): boolean {
  return a.revision === b.revision && a.owner.kind === b.owner.kind && (a.owner.kind === "guest" ||
    (b.owner.kind === "account" && a.owner.provider === b.owner.provider && a.owner.userId === b.owner.userId));
}
function blocked(scope: Scope | null): boolean {
  return quarantineCapacityReached || (scope !== null && quarantined.some(item => sameScope(item, scope)));
}
function quarantine(scope: Scope) {
  if (blocked(scope)) return;
  if (quarantined.length >= MAX_QUARANTINED_SCOPES) { quarantineCapacityReached = true; return; }
  quarantined.push(scope);
}
function validContext(context: ReviewSaveContext): boolean {
  return typeof context?.locale === "string" && context.locale.length > 0 && context.locale.length <= 32 &&
    typeof context.questionId === "string" && context.questionId.length > 0 && context.questionId.length <= 256 &&
    Number.isSafeInteger(context.session) && context.session >= 0;
}
function synchronousRead(value: unknown): string | null {
  if (value === null || typeof value === "string") return value;
  if (value instanceof Promise) void Promise.prototype.then.call(value, undefined, () => undefined);
  throw new Error("Review storage must return a synchronous string or null");
}
function validateCards(raw: string | null): SRSCard[] {
  if (raw === null) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Review cards must be an array");
  const ids = new Set<string>();
  for (const card of parsed) {
    if (!card || typeof card !== "object" || Array.isArray(card) ||
      !["id", "interval", "repetitions", "easeFactor", "nextReview"].every(key => Object.prototype.hasOwnProperty.call(card, key)) ||
      typeof card.id !== "string" || card.id.trim().length === 0 || ids.has(card.id) ||
      !Number.isSafeInteger(card.interval) || card.interval < 0 ||
      !Number.isSafeInteger(card.repetitions) || card.repetitions < 0 ||
      typeof card.easeFactor !== "number" || !Number.isFinite(card.easeFactor) || card.easeFactor < 1.3 ||
      typeof card.nextReview !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(card.nextReview)) {
      throw new Error("Review card schema is unavailable");
    }
    const day = new Date(card.nextReview + "T00:00:00.000Z");
    if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== card.nextReview) {
      throw new Error("Review card date is unavailable");
    }
    ids.add(card.id);
  }
  return parsed as SRSCard[];
}

/** Strict read only: unknown bytes are unavailable, never an empty-deck repair. */
export function readReviewCards(storage: PersonalStorageHandle): SRSCard[] {
  if (typeof window === "undefined" || !ownerCurrent(storage)) throw new Error("Storage session changed");
  const raw = synchronousRead(storage.getItem("coachfi-srs"));
  if (!ownerCurrent(storage)) throw new Error("Storage session changed");
  return validateCards(raw);
}

/** Local UI admission and RAM quarantine; neither rollback nor cross-reload exactly-once. */
export function createReviewSaveController(): ReviewSaveController {
  interface Attempt {
    readonly ticket: ReviewSaveTicket;
    readonly storage: PersonalStorageHandle;
    readonly scope: Scope | null;
    readonly valid: boolean;
    readonly delegate: ReturnType<typeof createQuizSaveController>;
    committed: boolean;
  }
  let active: Attempt | null = null;
  let inFlight = false;
  function current(attempt: Attempt, storage: PersonalStorageHandle): boolean {
    return active === attempt && attempt.valid && attempt.storage === storage && ownerCurrent(storage) &&
      active === attempt && attempt.scope !== null && (() => {
        const scope = scopeOf(storage);
        return scope !== null && sameScope(scope, attempt.scope);
      })() && active === attempt;
  }
  function find(ticket: ReviewSaveTicket): Attempt | null {
    return active?.ticket === ticket ? active : null;
  }
  return Object.freeze({
    begin(storage: PersonalStorageHandle, context: ReviewSaveContext) {
      const ticket = Object.freeze({}) as ReviewSaveTicket;
      let valid = false;
      try { valid = validContext(context); } catch { /* Invalid input stays closed. */ }
      active = { ticket, storage, scope: scopeOf(storage), valid, delegate: createQuizSaveController(), committed: false };
      return ticket;
    },
    retire(ticket?: ReviewSaveTicket) {
      if (ticket === undefined || active?.ticket === ticket) active = null;
    },
    current(ticket: ReviewSaveTicket, storage: PersonalStorageHandle) {
      const attempt = find(ticket);
      return attempt !== null && current(attempt, storage);
    },
    isOpen(ticket: ReviewSaveTicket, storage: PersonalStorageHandle) {
      const attempt = find(ticket);
      return attempt !== null && !inFlight && !attempt.committed && !blocked(attempt.scope) &&
        !inFlightScopes.some(scope => attempt.scope !== null && sameScope(scope, attempt.scope)) && current(attempt, storage);
    },
    issue(storage: PersonalStorageHandle) { return blocked(scopeOf(storage)) ? "uncertain" as const : null; },
    run(ticket: ReviewSaveTicket, storage: PersonalStorageHandle,
      record: (tracedStorage: PersonalStorageHandle) => void, activity?: () => void) {
      const attempt = find(ticket);
      if (!attempt || inFlight || attempt.committed) return outcome("ignored");
      inFlight = true;
      if (!current(attempt, storage)) { inFlight = false; return outcome("ignored"); }
      const boundScope = attempt.scope;
      if (blocked(boundScope)) { inFlight = false; return outcome("uncertain"); }
      if (!boundScope || inFlightScopes.some(scope => sameScope(scope, boundScope))) { inFlight = false; return outcome("ignored"); }
      if (inFlightScopes.length >= 64) { inFlight = false; return outcome("retryable"); }
      inFlightScopes.push(boundScope);
      let running = true, mutationAttempted = false, writtenCards: string | null = null;
      const requireCurrent = () => {
        if (!running || !current(attempt, storage)) throw new Error("Storage session changed");
      };
      try {
        const fenced: PersonalStorageHandle = Object.freeze({
          owner: storage.owner, revision: storage.revision, area: storage.area,
          isCurrent: () => running && current(attempt, storage),
          getItem(key: string) {
            requireCurrent();
            const value = synchronousRead(storage.getItem(key));
            requireCurrent();
            if (key === "coachfi-srs") validateCards(value);
            return value;
          },
          setItem(key: string, value: string) {
            mutationAttempted = true;
            requireCurrent();
            if (key === "coachfi-srs") validateCards(value);
            const written: unknown = storage.setItem(key, value);
            if (written !== true) {
              if (written instanceof Promise) void Promise.prototype.then.call(written, undefined, () => undefined);
              throw new Error("Review storage write was not acknowledged synchronously");
            }
            requireCurrent();
            if (key === "coachfi-srs") {
              const confirmed = synchronousRead(storage.getItem(key));
              requireCurrent();
              validateCards(confirmed);
              if (confirmed !== value) throw new Error("Review card write was not confirmed");
              writtenCards = value;
            }
            return true;
          },
          removeItem(key: string) {
            mutationAttempted = true;
            requireCurrent();
            const removed: unknown = storage.removeItem(key);
            if (removed !== true) {
              if (removed instanceof Promise) void Promise.prototype.then.call(removed, undefined, () => undefined);
              throw new Error("Review storage removal was not acknowledged synchronously");
            }
            requireCurrent();
            return true;
          },
          release() { requireCurrent(); storage.release(); requireCurrent(); },
        });
        const result = attempt.delegate.run(attempt.delegate.version(), fenced, record, activity);
        const viewCurrent = current(attempt, storage);
        if (result.status === "saved" && viewCurrent) {
          if (writtenCards === null || fenced.getItem("coachfi-srs") !== writtenCards) {
            throw new Error("Review card acknowledgement changed before completion");
          }
          requireCurrent();
          attempt.committed = true;
          return outcome("saved");
        }
        if (mutationAttempted || result.status === "uncertain") {
          if (attempt.scope) quarantine(attempt.scope);
          return outcome(ownerCurrent(storage) ? "uncertain" : "stopped");
        }
        if (!viewCurrent) return outcome(ownerCurrent(storage) ? "ignored" : "stopped");
        return outcome(result.status === "ignored" ? "ignored" : "retryable");
      } catch {
        if (mutationAttempted) {
          if (attempt.scope) quarantine(attempt.scope);
          return outcome(ownerCurrent(storage) ? "uncertain" : "stopped");
        }
        return outcome(current(attempt, storage) ? "retryable" : ownerCurrent(storage) ? "ignored" : "stopped");
      } finally {
        running = false; inFlight = false;
        const index = inFlightScopes.indexOf(boundScope);
        if (index >= 0) inFlightScopes.splice(index, 1);
      }
    },
  });
}
