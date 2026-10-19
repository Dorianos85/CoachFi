import type { PersonalStorageHandle } from "@/lib/product-storage";

const KEY = "coachfi-agent-ms";
export type AgentTimeStatus = "ready" | "counting" | "unavailable" | "uncertain" | "stopped";
export type AgentTimeSaveStatus = "retryable" | "uncertain" | "stopped";
export class AgentTimeSaveError extends Error {
  readonly status: AgentTimeSaveStatus;
  constructor(status: AgentTimeSaveStatus) {
    super(status === "stopped" ? "Storage session changed" : `Agent time save ${status}`);
    this.name = "AgentTimeSaveError"; this.status = status;
  }
}

function synchronous(value: unknown) {
  if (value === null || (typeof value !== "object" && typeof value !== "function") ||
    typeof (value as { then?: unknown }).then !== "function") return;
  if (value instanceof Promise) void Promise.prototype.then.call(value, undefined, () => undefined);
  throw new Error("Agent time operations must be synchronous");
}
function current(storage: PersonalStorageHandle) {
  try { const result = storage.isCurrent(); synchronous(result); return result === true; } catch { return false; }
}
function scope(storage: PersonalStorageHandle) {
  const owner = storage.owner;
  return JSON.stringify([storage.revision, storage.area, owner?.kind,
    owner?.kind === "account" ? owner.provider : null, owner?.kind === "account" ? owner.userId : null]);
}
function milliseconds(raw: unknown) {
  if (raw === null) return 0;
  if (typeof raw !== "string" || !/^(0|[1-9][0-9]*)$/.test(raw)) throw new Error("Invalid agent time cache");
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("Invalid agent time cache");
  return value;
}
function timestamp(value: unknown): number {
  synchronous(value);
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error("Invalid agent time clock");
  return value;
}

/** One owner-bound RAM timer. It has no durable replay or cross-tab atomicity guarantee. */
export function createAgentTimeController(notify: () => void, clock: () => number = () => Date.now()) {
  let epoch = 0, boundScope: string | null = null, storage: PersonalStorageHandle | null = null;
  let loaded = false, raw: string | null = null, savedMs = 0, since: number | null = null;
  let fault: "unavailable" | "uncertain" | "stopped" | null = null;
  const sources = new Set<string>();
  let busy = false, broadcasting = false;
  let pending: { raw: string | null; ms: number; since: number | null } | null = null;

  function reset() {
    epoch++; boundScope = null; storage = null; loaded = false; raw = null; savedMs = 0;
    since = null; fault = null; sources.clear(); busy = false; pending = null;
  }
  function broadcastSafely() {
    if (broadcasting) return;
    broadcasting = true;
    try { synchronous(notify()); } catch { /* Status notification cannot undo an acknowledgement. */ }
    finally { broadcasting = false; }
  }
  function block(status: "unavailable" | "uncertain" | "stopped", ticket: number) {
    if (ticket !== epoch) return;
    const changed = fault === null || (fault === "unavailable" && status === "uncertain") || status === "stopped" && fault !== "stopped";
    if (changed) fault = status;
    sources.clear(); since = null; pending = null;
    if (changed) broadcastSafely();
  }
  function attach(handle: PersonalStorageHandle) {
    const handleScope = scope(handle);
    if (!current(handle)) {
      if (boundScope === handleScope) block("stopped", epoch);
      throw new AgentTimeSaveError("stopped");
    }
    if (boundScope !== handleScope) { reset(); boundScope = handleScope; }
    storage = handle;
    return epoch;
  }
  function guard(handle: PersonalStorageHandle, ticket: number) {
    if (ticket !== epoch || boundScope !== scope(handle) || !current(handle)) throw new AgentTimeSaveError("stopped");
    if (fault !== null) throw new AgentTimeSaveError(fault === "unavailable" ? "retryable" : fault);
    if (typeof window === "undefined") throw new AgentTimeSaveError("retryable");
  }
  function readRaw(handle: PersonalStorageHandle, ticket: number) {
    guard(handle, ticket);
    const value = handle.getItem(KEY); synchronous(value);
    guard(handle, ticket);
    milliseconds(value);
    return value;
  }
  function preflight(handle: PersonalStorageHandle, ticket: number) {
    const value = readRaw(handle, ticket);
    if (loaded && value !== raw) throw new Error("Agent time cache changed");
    if (!loaded) { raw = value; savedMs = milliseconds(value); loaded = true; }
    return timestamp(clock());
  }
  function total(now: number, base = savedMs, start = since) {
    const elapsed = start === null ? 0 : now - start;
    const result = base + elapsed;
    if (!Number.isSafeInteger(elapsed) || elapsed < 0 || !Number.isSafeInteger(result) || result < 0) throw new Error("Invalid agent time elapsed");
    return result;
  }
  function fail(handle: PersonalStorageHandle, ticket: number, attempted: boolean): never {
    const stopped = ticket !== epoch || boundScope !== scope(handle) || !current(handle);
    block(stopped ? "stopped" : attempted ? "uncertain" : "unavailable", ticket);
    throw new AgentTimeSaveError(stopped ? "stopped" : attempted || fault === "uncertain" ? "uncertain" : fault === "stopped" ? "stopped" : "retryable");
  }
  function project(handle: PersonalStorageHandle) {
    let ticket = epoch;
    try {
      ticket = attach(handle); guard(handle, ticket);
      if (busy) {
        const view = pending;
        if (view !== null) {
          if (readRaw(handle, ticket) !== view.raw) throw new Error("Pending agent time changed");
          const value = total(timestamp(clock()), view.ms, view.since); guard(handle, ticket);
          return { value, status: view.since === null ? "ready" as const : "counting" as const };
        }
        const value = total(timestamp(clock())); guard(handle, ticket);
        return { value, status: since === null ? "ready" as const : "counting" as const };
      }
      const now = preflight(handle, ticket);
      const value = total(now); guard(handle, ticket);
      return { value, status: since === null ? "ready" as const : "counting" as const };
    } catch {
      const stopped = !current(handle) || ticket !== epoch || boundScope !== scope(handle);
      if (boundScope === scope(handle)) block(stopped ? "stopped" : "unavailable", ticket);
      return { value: 0, status: stopped ? "stopped" as const : fault ?? "unavailable" as const };
    }
  }
  function change(source: string | null, handle: PersonalStorageHandle, kind: "begin" | "end" | "checkpoint") {
    let ticket = epoch, attempted = false, ownedBusy = false;
    // Caller input limits are refusals, not storage faults: preserve an existing timer.
    if (kind !== "checkpoint") {
      ticket = attach(handle); guard(handle, ticket);
      if (typeof source !== "string" || source.trim().length === 0 || source.length > 256 ||
        kind === "begin" && !sources.has(source) && sources.size >= 64) throw new AgentTimeSaveError("retryable");
    }
    try {
      ticket = attach(handle); guard(handle, ticket);
      if (busy || broadcasting) return; // Synchronous callbacks cannot replay or nest a mutation.
      busy = true; ownedBusy = true;
      const now = preflight(handle, ticket); const nextMs = total(now);
      guard(handle, ticket);
      const nextSources = new Set(sources);
      let nextSince = since;
      if (kind === "begin") {
        if (nextSources.has(source!)) return;
        if (nextSources.size === 0) nextSince = now;
        nextSources.add(source!);
      } else if (kind === "end") {
        if (!nextSources.delete(source!)) return;
        if (nextSources.size === 0) nextSince = null;
      } else {
        if (since === null) return;
        nextSince = now;
      }
      const persist = since !== null && (kind === "checkpoint" || (kind === "end" && nextSources.size === 0));
      const nextRaw = persist && nextMs !== savedMs ? String(nextMs) : raw;
      if (nextRaw !== raw) {
        guard(handle, ticket); attempted = true;
        const accepted = handle.setItem(KEY, nextRaw!); synchronous(accepted);
        guard(handle, ticket);
        if (accepted !== true || readRaw(handle, ticket) !== nextRaw) throw new Error("Agent time write unconfirmed");
      }
      // Read-only listeners see the pending view; confirmed RAM is adopted after every check.
      pending = { raw: nextRaw, ms: persist ? nextMs : savedMs, since: nextSince };
      guard(handle, ticket); synchronous(notify()); guard(handle, ticket);
      if (readRaw(handle, ticket) !== nextRaw) throw new Error("Agent time changed after notification");
      guard(handle, ticket);
      raw = nextRaw; savedMs = persist ? nextMs : savedMs; since = nextSince;
      sources.clear(); nextSources.forEach((item) => sources.add(item));
    } catch { fail(handle, ticket, attempted); }
    finally { if (ownedBusy && ticket === epoch) { busy = false; pending = null; } }
  }
  return Object.freeze({
    read: (handle: PersonalStorageHandle): number => project(handle).value,
    status: (handle: PersonalStorageHandle): AgentTimeStatus => project(handle).status,
    begin: (source: string, handle: PersonalStorageHandle): void => change(source, handle, "begin"),
    end: (source: string, handle: PersonalStorageHandle): void => change(source, handle, "end"),
    checkpointSafe: (): void => { const handle = storage; if (handle === null) return; try { change(null, handle, "checkpoint"); } catch { /* Background failure is represented by status. */ } },
    tickSafe: (): void => { const handle = storage; if (handle === null) return; project(handle); broadcastSafely(); },
    reset,
    isActive: (): boolean => fault === null && sources.size > 0,
  });
}
