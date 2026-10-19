import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionSyncController, type SyncSession } from "@/lib/sync/session-sync";
import type { SyncEntity } from "@/lib/sync/syncQueue";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
type Pusher = (entity: SyncEntity, payload?: unknown) => void;

describe("independent sync generation and callback review", () => {
  beforeEach(() => {
    const data = new Map<string, string>();
    const storage = { getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } };
    vi.stubGlobal("window", { localStorage: storage, sessionStorage: storage, dispatchEvent: vi.fn() });
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No network allowed."); }));
  });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  function setup(sync: (session: SyncSession) => Promise<boolean> = async () => true) {
    vi.useFakeTimers();
    let pusher: Pusher | null = null;
    const registerPusher = vi.fn((next: Pusher | null) => { pusher = next; });
    const push = vi.fn(async (_session: SyncSession, _entity: SyncEntity, _payload?: unknown) => {});
    const onSynced = vi.fn();
    const hydrate = vi.fn(sync);
    const controller = createSessionSyncController({ sync: hydrate, push, registerPusher, onSynced, debounceMs: 800 });
    return { controller, hydrate, push, onSynced, registerPusher, pusher: () => pusher };
  }

  it("invalidating before the deferred SDK callback prevents sync from starting", async () => {
    const state = setup();
    const lease = state.controller.start("synthetic-A");
    expect(state.hydrate).not.toHaveBeenCalled();
    state.controller.invalidate();
    expect(lease?.signal.aborted).toBe(true);
    expect(lease?.isCurrent()).toBe(false);
    await vi.runAllTimersAsync();
    expect(state.hydrate).not.toHaveBeenCalled();
    expect(state.pusher()).toBeNull();
    expect(state.onSynced).not.toHaveBeenCalled();
  });

  it.each(["synthetic-B", "synthetic-A"])("A → %s cannot commit the old deferred hydration", async (nextUser) => {
    const readA = deferred<boolean>();
    let readCount = 0;
    const state = setup(async () => ++readCount === 1 ? readA.promise : true);
    const first = state.controller.start("synthetic-A");
    await vi.advanceTimersByTimeAsync(0);
    const second = state.controller.start(nextUser);
    expect(first?.signal.aborted).toBe(true);
    expect(first?.isCurrent()).toBe(false);
    expect(second?.isCurrent()).toBe(true);
    await vi.advanceTimersByTimeAsync(0);
    const commitsBeforeOldRead = state.onSynced.mock.calls.length;
    readA.resolve(true); await Promise.resolve(); await Promise.resolve();
    expect(state.onSynced.mock.calls.length).toBe(commitsBeforeOldRead);
    expect(state.hydrate).toHaveBeenCalledTimes(2);
    state.controller.dispose();
  });

  it("A → logout → A creates a fresh lease even when identity and callbacks repeat", async () => {
    const state = setup();
    const old = state.controller.start("synthetic-A");
    state.controller.start(null);
    const fresh = state.controller.start("synthetic-A");
    expect(old?.isCurrent()).toBe(false);
    expect(old?.signal.aborted).toBe(true);
    expect(fresh).not.toBe(old);
    expect(fresh?.isCurrent()).toBe(true);
    await vi.runAllTimersAsync();
    expect(state.hydrate).toHaveBeenCalledOnce();
    state.controller.dispose();
  });

  it("read-only A and B never install a pusher or schedule debounced writes", async () => {
    const state = setup();
    state.controller.start("synthetic-A"); await vi.advanceTimersByTimeAsync(0);
    const oldPusher = state.pusher();
    expect(oldPusher).toBeNull();
    oldPusher?.("profile");
    state.controller.start("synthetic-B");
    oldPusher?.("reward", { amount: 5, reason: "synthetic" });
    await vi.runAllTimersAsync();
    expect(state.push).not.toHaveBeenCalled();
    expect(state.registerPusher.mock.calls.every(([value]) => value === null)).toBe(true);
    expect(state.onSynced).not.toHaveBeenCalled();
    state.controller.dispose();
  });

  it("disposal fences a pending read and every later callback/start", async () => {
    const read = deferred<boolean>();
    const state = setup(() => read.promise);
    const lease = state.controller.start("synthetic-A"); await vi.advanceTimersByTimeAsync(0);
    state.controller.dispose();
    read.resolve(true); await Promise.resolve(); await Promise.resolve();
    expect(lease?.signal.aborted).toBe(true);
    expect(state.onSynced).not.toHaveBeenCalled();
    expect(state.pusher()).toBeNull();
    expect(state.controller.start("synthetic-B")).toBeNull();
    await vi.runAllTimersAsync();
    expect(state.hydrate).toHaveBeenCalledOnce();
  });

  it.each(["false", "throw"])("failed hydration %s never installs write pusher or emits success", async (failure) => {
    const state = setup(async () => { if (failure === "throw") throw new Error("Synthetic GET failure"); return false; });
    state.controller.start("synthetic-A"); await vi.runAllTimersAsync();
    expect(state.pusher()).toBeNull();
    expect(state.onSynced).not.toHaveBeenCalled();
    state.controller.dispose();
  });

  it("current reward/profile notifications cannot schedule automatic uploads or acknowledge them", async () => {
    const state = setup();
    state.controller.start("synthetic-A"); await vi.advanceTimersByTimeAsync(0);
    expect(state.pusher()).toBeNull();
    const queue = await import("@/lib/sync/syncQueue"), attempted = vi.fn();
    queue.registerCloudPusher(attempted);
    queue.notifyCloud("reward", { amount: 1, reason: "first" });
    queue.notifyCloud("reward", { amount: 2, reason: "second" });
    queue.notifyCloud("profile", { version: 1 }); queue.notifyCloud("profile", { version: 2 });
    await vi.advanceTimersByTimeAsync(799);
    expect(state.push).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(state.push).not.toHaveBeenCalled(); expect(attempted).not.toHaveBeenCalled(); expect(state.onSynced).not.toHaveBeenCalled();
    state.controller.dispose();
  });
});
