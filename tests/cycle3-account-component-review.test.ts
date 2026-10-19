import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AccountTokenGetter, LearningSession, LearningSyncResult, SignedInAccount } from "@/lib/account-sync";

const state = vi.hoisted(() => ({
  effects: [] as Array<() => void | (() => void)>, userId: "synthetic-A", initialized: true, signedIn: true,
  getter: vi.fn<() => Promise<string | null>>(),
  start: vi.fn<(user: SignedInAccount, getter: AccountTokenGetter) => LearningSession>(),
  end: vi.fn<() => Promise<void>>(), visible: vi.fn(), hide: vi.fn(), events: vi.fn(),
  ref: null as { current: unknown } | null,
}));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useEffect: (effect: () => void | (() => void)) => { state.effects.push(effect); },
  useRef: (initial: unknown) => state.ref ??= { current: initial },
}));
vi.mock("@coinbase/cdp-hooks", () => ({
  useIsInitialized: () => ({ isInitialized: state.initialized }), useIsSignedIn: () => ({ isSignedIn: state.signedIn }),
  useCurrentUser: () => ({ currentUser: state.userId ? { userId: state.userId, authenticationMethods: {} } : null }),
  useGetAccessToken: () => ({ getAccessToken: state.getter }),
}));
// Actual AccountSync and bindAccountSession are exercised. Only the SDK/session
// input is controlled; no real SDK component is rendered or account contacted.
vi.mock("@/lib/account-sync", () => ({ startLearningSession: state.start, endLearningSession: state.end }));
vi.mock("@/lib/progress-visibility", () => ({ setProgressVisible: state.visible, hideSavedProgress: state.hide }));

function lease(userId: string, generation: number) {
  let resolve!: (value: LearningSyncResult) => void;
  let active = true;
  const ready = new Promise<LearningSyncResult>((done) => { resolve = done; });
  const value: LearningSession = { userId, generation, ready, isCurrent: () => active, dispose: () => { active = false; } };
  return { value, complete: () => resolve({ status: "ready", userId, generation }) };
}
beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); state.effects.length = 0; state.ref = null;
  state.initialized = true; state.signedIn = true; state.userId = "synthetic-A";
  state.getter.mockResolvedValue("synthetic-token"); state.end.mockResolvedValue(undefined);
  const data = new Map<string, string>(), localStorage = {
    getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); },
  };
  vi.stubGlobal("window", { localStorage, sessionStorage: localStorage, dispatchEvent: state.events });
  // Fixture establishes a ready empty owned view before measuring completion events.
  const store = await import("@/lib/product-storage");
  store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "synthetic-A" }).publishReady({ localOnly: true, syncIssue: "read-only" });
  state.events.mockClear();
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No network permitted in component lifecycle fixture."); }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("independent actual AccountSync completion lifecycle", () => {
  it("component cleanup fences its actual ready.then callback before visibility/events", async () => {
    const a = lease("synthetic-A", 1); state.start.mockReturnValueOnce(a.value);
    const { AccountSync } = await import("@/components/AccountSync");
    AccountSync(); const cleanup = state.effects.shift()?.(); if (cleanup) cleanup();
    a.complete(); await a.value.ready; await Promise.resolve();
    expect(state.visible).not.toHaveBeenCalled(); expect(state.events).not.toHaveBeenCalled();
  });

  it("A cleanup → B read-only ready → A late completion cannot announce another view or hide B", async () => {
    const a = lease("synthetic-A", 1), b = lease("synthetic-B", 2);
    state.start.mockReturnValueOnce(a.value).mockReturnValueOnce(b.value);
    const { AccountSync } = await import("@/components/AccountSync");
    AccountSync(); const cleanupA = state.effects.shift()?.(); if (cleanupA) cleanupA();
    const store = await import("@/lib/product-storage");
    store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "synthetic-B" }).publishReady({ localOnly: true, syncIssue: "read-only" });
    state.events.mockClear(); // Ownership setup is complete before measuring the ready callback.
    state.userId = "synthetic-B"; AccountSync(); const cleanupB = state.effects.shift()?.();
    b.complete(); await b.value.ready; await Promise.resolve();
    expect(state.visible).toHaveBeenCalledOnce(); expect(state.visible).toHaveBeenCalledWith(true);
    expect(state.events.mock.calls.map(([event]) => (event as Event).type)).toEqual(["coachfi-tokens", "coachfi-learning"]);
    a.complete(); await a.value.ready; await Promise.resolve();
    expect(state.visible).toHaveBeenCalledOnce(); expect(state.events).toHaveBeenCalledTimes(2);
    if (cleanupB) cleanupB();
  });

  it("signed-out component explicitly restores guest visibility without starting auth work", async () => {
    state.signedIn = false; state.userId = "";
    const { AccountSync } = await import("@/components/AccountSync");
    AccountSync(); state.effects.shift()?.();
    expect(state.end).toHaveBeenCalledOnce(); expect(state.hide).not.toHaveBeenCalled();
    expect(state.start).not.toHaveBeenCalled(); expect(state.getter).not.toHaveBeenCalled();
    expect(state.visible).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("actual captured SDK token wrapper rejects A after a B render before effect cleanup", async () => {
    let resolve!: (value: string | null) => void;
    state.getter.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    const a = lease("synthetic-A", 1); state.start.mockReturnValueOnce(a.value);
    const { AccountSync } = await import("@/components/AccountSync");
    AccountSync(); const cleanup = state.effects.shift()?.();
    const capturedGetter = state.start.mock.calls[0][1]; const pending = capturedGetter();
    state.userId = "synthetic-B"; AccountSync(); // React has rendered B; cleanup is deliberately deferred.
    resolve("FIXTURE_TOKEN_A"); expect(await pending).toBeNull();
    expect(state.start).toHaveBeenCalledOnce();
    if (cleanup) cleanup();
  });
});
