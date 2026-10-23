import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

type AuthCallback = (event: string, session: unknown) => void;
const state = vi.hoisted(() => ({
  effects: [] as Array<() => void | (() => void)>, callbacks: [] as AuthCallback[],
  stateSet: vi.fn(), factory: vi.fn(), configured: vi.fn(() => true), subscribe: vi.fn(), unsubscribe: vi.fn(),
  sdkSignOut: vi.fn<() => Promise<void>>(), sync: vi.fn<() => Promise<boolean>>(), push: vi.fn<() => Promise<void>>(),
  register: vi.fn(), event: vi.fn(),
}));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useEffect: (effect: () => void | (() => void)) => { state.effects.push(effect); },
  useRef: (current: unknown) => ({ current }),
  useState: (initial: unknown) => [initial, state.stateSet],
  useCallback: (callback: unknown) => callback,
}));
vi.mock("@/lib/supabase/client", () => ({ getSupabaseBrowserClient: state.factory, isSupabaseConfigured: state.configured }));
vi.mock("@/lib/sync/cloudSync", () => ({ syncOnLogin: state.sync, pushEntity: state.push }));
vi.mock("@/lib/sync/syncQueue", () => ({ registerCloudPusher: state.register }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
const syncedEvents = () => state.event.mock.calls.filter(([event]) => (event as Event).type === "coachfi-cloud-synced");
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks(); vi.useFakeTimers(); state.effects.length = 0; state.callbacks.length = 0;
  state.sync.mockResolvedValue(true); state.push.mockResolvedValue(undefined); state.sdkSignOut.mockResolvedValue(undefined);
  state.factory.mockReturnValue({ auth: { onAuthStateChange: state.subscribe, signOut: state.sdkSignOut } });
  state.subscribe.mockImplementation((callback: AuthCallback) => {
    state.callbacks.push(callback); return { data: { subscription: { unsubscribe: state.unsubscribe } } };
  });
  const bytes = new Map<string, string>();
  const localStorage = { getItem: (key: string) => bytes.get(key) ?? null,
    setItem: (key: string, value: string) => { bytes.set(key, value); }, removeItem: (key: string) => { bytes.delete(key); } };
  vi.stubGlobal("window", { localStorage, sessionStorage: localStorage, dispatchEvent: state.event });
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No network allowed in hook lifecycle test."); }));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("independent AuthProvider source lifecycle", () => {
  it("disabled render/effect/signOut initializes no Supabase factory, subscription or pusher", async () => {
    const { AuthProvider } = await import("@/context/AuthContext");
    const element = AuthProvider({ enabled: false, children: null }) as ReactElement<{ value: { configured: boolean; loading: boolean; signOut(): Promise<void> } }>;
    state.effects.shift()?.(); await element.props.value.signOut(); await vi.runAllTimersAsync();
    expect(element.props.value.configured).toBe(false); expect(element.props.value.loading).toBe(false);
    expect(state.factory).not.toHaveBeenCalled(); expect(state.configured).not.toHaveBeenCalled();
    expect(state.subscribe).not.toHaveBeenCalled(); expect(state.register).not.toHaveBeenCalled();
    expect(state.sdkSignOut).not.toHaveBeenCalled(); expect(state.sync).not.toHaveBeenCalled();
  });

  it("SDK auth callback returns synchronously and unmount fences its scheduled work", async () => {
    const { AuthProvider } = await import("@/context/AuthContext");
    AuthProvider({ children: null }); const cleanup = state.effects.shift()?.();
    expect(state.callbacks[0]("SIGNED_IN", { user: { id: "synthetic-A" } })).toBeUndefined();
    expect(state.sync).not.toHaveBeenCalled();
    if (cleanup) cleanup();
    const stateCalls = state.stateSet.mock.calls.length;
    state.callbacks[0]("SIGNED_IN", { user: { id: "synthetic-B" } });
    await vi.runAllTimersAsync();
    expect(state.stateSet.mock.calls.length).toBe(stateCalls);
    expect(state.unsubscribe).toHaveBeenCalledOnce(); expect(state.sync).not.toHaveBeenCalled();
    expect(syncedEvents()).toHaveLength(0);
  });

  it("StrictMode-style setup → cleanup → setup discards an old pending read and callback", async () => {
    const oldRead = deferred<boolean>(); state.sync.mockImplementationOnce(() => oldRead.promise);
    const { AuthProvider } = await import("@/context/AuthContext");
    AuthProvider({ children: null }); const cleanupA = state.effects.shift()?.();
    state.callbacks[0]("SIGNED_IN", { user: { id: "synthetic-A" } }); await vi.advanceTimersByTimeAsync(0);
    if (cleanupA) cleanupA();
    AuthProvider({ children: null }); const cleanupB = state.effects.shift()?.();
    state.callbacks[1]("SIGNED_IN", { user: { id: "synthetic-B" } }); await vi.advanceTimersByTimeAsync(0);
    expect(syncedEvents()).toHaveLength(0);
    oldRead.resolve(true); await Promise.resolve(); await Promise.resolve();
    const beforeOldCallback = state.stateSet.mock.calls.length;
    state.callbacks[0]("SIGNED_IN", { user: { id: "synthetic-A" } }); await vi.runAllTimersAsync();
    expect(state.sync).toHaveBeenCalledTimes(2); expect(syncedEvents()).toHaveLength(0);
    expect(state.stateSet.mock.calls.length).toBe(beforeOldCallback);
    if (cleanupB) cleanupB();
  });

  it("signOut fences timers before the SDK promise and its late completion does not clear B", async () => {
    const sdkLogout = deferred<void>(); state.sdkSignOut.mockImplementationOnce(() => sdkLogout.promise);
    const { AuthProvider } = await import("@/context/AuthContext");
    const element = AuthProvider({ children: null }) as ReactElement<{ value: { signOut(): Promise<void> } }>;
    const cleanup = state.effects.shift()?.();
    state.callbacks[0]("SIGNED_IN", { user: { id: "synthetic-A" } });
    const logout = element.props.value.signOut();
    await vi.advanceTimersByTimeAsync(0); expect(state.sync).not.toHaveBeenCalled();
    state.callbacks[0]("SIGNED_IN", { user: { id: "synthetic-B" } }); await vi.advanceTimersByTimeAsync(0);
    const before = { state: state.stateSet.mock.calls.length, pusher: state.register.mock.calls.length };
    sdkLogout.resolve(); await logout;
    expect(state.stateSet.mock.calls.length).toBe(before.state);
    expect(state.register.mock.calls.length).toBe(before.pusher);
    expect(syncedEvents()).toHaveLength(0);
    if (cleanup) cleanup();
  });

  it.each(["TOKEN_REFRESHED", "SIGNED_IN"])("same UID %s retains actual owned local bytes with no upload or rehydration", async (event) => {
    const { AuthProvider } = await import("@/context/AuthContext");
    AuthProvider({ children: null }); const cleanup = state.effects.shift()?.();
    state.callbacks[0]("SIGNED_IN", { user: { id: "synthetic-A" } }); await vi.advanceTimersByTimeAsync(0);
    const store = await import("@/lib/product-storage"), view = store.captureCurrentPersonalStorage();
    expect(view.setItem("coachfi-user", "Synthetic owned new")).toBe(true);
    const pusher = state.register.mock.calls.at(-1)?.[0] as ((entity: "profile") => void) | null;
    expect(pusher).toBeNull();
    state.callbacks[0](event, { user: { id: "synthetic-A" } }); await vi.advanceTimersByTimeAsync(0);
    expect(store.captureCurrentPersonalStorage().getItem("coachfi-user")).toBe("Synthetic owned new");
    expect(view.isCurrent()).toBe(true); expect(view.getItem("coachfi-learning-rev")).toBe("local-unconfirmed-v1");
    expect(state.sync).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(800); expect(state.push).not.toHaveBeenCalled(); expect(syncedEvents()).toHaveLength(0);
    if (cleanup) cleanup();
  });

  it("actual SDK A → SIGNED_OUT → A cannot revive a captured old pusher", async () => {
    const { AuthProvider } = await import("@/context/AuthContext");
    AuthProvider({ children: null }); const cleanup = state.effects.shift()?.();
    state.callbacks[0]("SIGNED_IN", { user: { id: "synthetic-A" } }); await vi.advanceTimersByTimeAsync(0);
    const oldPusher = state.register.mock.calls.at(-1)?.[0] as ((entity: "profile") => void) | null;
    state.callbacks[0]("SIGNED_OUT", null);
    state.callbacks[0]("SIGNED_IN", { user: { id: "synthetic-A" } }); await vi.advanceTimersByTimeAsync(0);
    oldPusher?.("profile"); await vi.runAllTimersAsync();
    expect(state.sync).toHaveBeenCalledTimes(2); expect(state.push).not.toHaveBeenCalled();
    if (cleanup) cleanup();
  });
});
