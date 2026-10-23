import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

type Locale = "pl" | "en";
type Effect = () => void | (() => void);
type Frame = { slot: number; values: Map<number, unknown>; memos: Map<number, { deps?: readonly unknown[]; value: unknown }>;
  deps: Map<number, readonly unknown[] | undefined>; effects: Array<{ slot: number; effect: Effect }>; cleanups: Map<number, () => void>; updates: number };
type AuthValue = { configured: boolean; loading: boolean; user: { id: string; email?: string } | null; session: unknown;
  signOut(): Promise<unknown>; signOutStatus?: "idle" | "pending" | "error"; [key: string]: unknown };
type Outcome = { call: number; kind: "fulfilled" | "rejected"; value?: unknown; reason?: string };
const fixture = vi.hoisted(() => ({ locale: "pl" as Locale, current: "provider", frames: new Map<string, Frame>(),
  auth: null as AuthValue | null, factory: vi.fn(), configured: vi.fn(), sdk: vi.fn<() => Promise<{ error: { message: string } | null }>>(),
  subscribe: vi.fn(), unsubscribe: vi.fn(), callbacks: [] as Array<(event: string, session: unknown) => void>,
  hydrate: vi.fn(), register: vi.fn(), calls: [] as Array<Promise<unknown>>, outcomes: [] as Outcome[],
}));
const same = (a?: readonly unknown[], b?: readonly unknown[]) => !!a && !!b && a.length === b.length && a.every((item, i) => Object.is(item, b[i]));
function frame(): Frame {
  let value = fixture.frames.get(fixture.current);
  if (!value) { value = { slot: 0, values: new Map(), memos: new Map(), deps: new Map(), effects: [], cleanups: new Map(), updates: 0 }; fixture.frames.set(fixture.current, value); }
  return value;
}
function memo(factory: () => unknown, deps?: readonly unknown[]) {
  const state = frame(), slot = state.slot++, prior = state.memos.get(slot);
  if (!prior || !same(prior.deps, deps)) state.memos.set(slot, { deps, value: factory() });
  return state.memos.get(slot)?.value;
}
function effect(callback: Effect, deps?: readonly unknown[]) {
  const state = frame(), slot = state.slot++;
  if (!state.deps.has(slot) || !same(state.deps.get(slot), deps)) state.effects.push({ slot, effect: callback });
  state.deps.set(slot, deps);
}
vi.mock("react", async original => ({ ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const state = frame(), slot = state.slot++;
    if (!state.values.has(slot)) state.values.set(slot, typeof initial === "function" ? initial() : initial);
    return [state.values.get(slot), (next: unknown) => { state.updates++; state.values.set(slot, typeof next === "function" ? next(state.values.get(slot)) : next); }];
  },
  useMemo: memo, useCallback: (callback: unknown, deps?: readonly unknown[]) => memo(() => callback, deps),
  useRef: (initial: unknown) => memo(() => ({ current: initial }), []), useEffect: effect, useLayoutEffect: effect,
  useContext: () => fixture.auth, useSyncExternalStore: (_subscribe: unknown, snapshot: () => unknown) => snapshot(),
}));
// Whole application SDK-client module replaced: no createClient or installed SDK runtime is imported/initialized.
vi.mock("@/lib/supabase/client", () => ({ getSupabaseBrowserClient: fixture.factory, isSupabaseConfigured: fixture.configured }));
// Real session-sync controller and product-storage are retained; only downstream cloud/queue adapters are replaced.
vi.mock("@/lib/sync/cloudSync", () => ({ syncOnLogin: fixture.hydrate }));
vi.mock("@/lib/sync/syncQueue", () => ({ registerCloudPusher: fixture.register }));
vi.mock("@/context/LanguageContext", async () => {
  const { translations } = await import("@/lib/i18n");
  return { useLanguage: () => ({ locale: fixture.locale, t: translations[fixture.locale] }) };
});
vi.mock("@/components/ui/dialog", () => Object.fromEntries(["Dialog", "DialogContent", "DialogDescription", "DialogHeader", "DialogTitle"]
  .map(key => [key, "c61-" + key])));

type Props = { children?: unknown; value?: AuthValue; type?: string; role?: string; title?: string; disabled?: boolean; open?: boolean;
  "aria-busy"?: boolean | "true" | "false"; onClick?: () => unknown };
type Node = ReactElement<Props>;
type Trace = { area: "local" | "session"; kind: "read" | "set" | "remove"; key: string; value?: string };
const A = "C61-synthetic-A", B = "C61-synthetic-B", DETAIL = "C61_PRIVATE_PROVIDER_DETAIL";
const COPY = {
  pl: { out: "Wyloguj", signIn: "Zaloguj", pending: "Trwa wylogowywanie...", retry: "Spróbuj wylogować ponownie",
    error: "Nie udało się potwierdzić wylogowania z usługi. Spróbuj ponownie." },
  en: { out: "Sign out", signIn: "Sign in", pending: "Signing out...", retry: "Retry sign-out",
    error: "Sign-out from the service could not be confirmed. Try again." },
};
const LIMITS = "Conditional configured-Supabase application path only. Actual AuthProvider/useAuth/AccountButton and real createSessionSyncController/product-storage/local-sync-state. Explicit persistent per-component React state/memo/ref/effect emulator and context-value bridge; Dialog primitives are unexecuted markers. SDK-client module fully replaced by an auth emitter and deferred Promise<{error}>; no SDK initialization/import/runtime, server revocation, native browser, provider, real auth/session/profile, cloud, storage-auth removal or deployment acceptance. Downstream hydration and pusher registration adapters are mocked. A pass-through signOut promise observer returns the same original promise and only attaches fulfillment/rejection recording, preventing old void UI handlers from creating unhandled baseline rejections; no result override or fake writer. Synthetic separate physical Maps and real ownership leases. All observations collected before normative assertions where failure/retry branches differ; retries occur only through an actually present retry element.";
let Provider: typeof import("@/context/AuthContext").AuthProvider, Button: typeof import("@/components/AccountButton").AccountButton;
let store: typeof import("@/lib/product-storage"), local: Map<string, string>, session: Map<string, string>, trace: Trace[], events: string[];
let enabled: boolean, buttonMounted: boolean, providerMounted: boolean, rawAuth: AuthValue;
type Metadata = { auth: { configured: boolean; loading: boolean; userId: string | null; status?: string };
  owner: unknown; raw: { local: Array<[string, string]>; session: Array<[string, string]> }; writes: Trace[]; sdkCalls: number };
let treeMetadata: WeakMap<object, Metadata>;
let client: { auth: { onAuthStateChange: typeof fixture.subscribe; signOut: typeof fixture.sdk } };
const key = (id: string, name: string) => "coachfi-owned:v1:supabase:" + encodeURIComponent(id) + ":" + name;
function deferred<T>() { let resolve!: (value: T) => void, reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  // Framework adapter: closed controlled Dialog content is not an observed UI branch; no native modal behavior is inferred.
  return [node, ...nodes(node.type === "c61-Dialog" && node.props.open === false ? null : node.props.children)];
}
function text(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(text).join("");
  if (!value || typeof value !== "object" || !("props" in value)) return "";
  const node = value as Node;
  return node.type === "c61-Dialog" && node.props.open === false ? "" : text(node.props.children);
}
function flush(state: Frame) { for (const item of state.effects.splice(0)) { state.cleanups.get(item.slot)?.(); state.cleanups.delete(item.slot);
  const cleanup = item.effect(); if (typeof cleanup === "function") state.cleanups.set(item.slot, cleanup); } }
function stop(name: string) { const state = fixture.frames.get(name); state?.cleanups.forEach(cleanup => cleanup()); state?.cleanups.clear(); }
function observePromise(promise: Promise<unknown>) {
  const call = fixture.calls.push(promise);
  void promise.then(value => { fixture.outcomes.push({ call, kind: "fulfilled", value }); },
    error => { fixture.outcomes.push({ call, kind: "rejected", reason: error instanceof Error ? error.message : String(error) }); });
  return promise;
}
function renderProvider() {
  fixture.current = "provider"; frame().slot = 0;
  const element = Provider({ children: null, enabled }) as ReactElement<{ value: AuthValue }>;
  rawAuth = element.props.value;
  const actualSignOut = rawAuth.signOut;
  fixture.auth = { ...rawAuth, signOut: () => observePromise(actualSignOut()) };
  flush(frame());
}
function settle(): Node | null {
  let tree: Node | null = null;
  for (let pass = 0; pass < 3; pass++) {
    if (providerMounted) renderProvider();
    if (buttonMounted) { fixture.current = "button"; frame().slot = 0; tree = Button() as Node | null; flush(frame());
      if (tree) treeMetadata.set(tree, metadata()); }
  }
  return tree;
}
const raw = () => ({ local: [...local], session: [...session] });
const writes = () => trace.filter(item => item.kind !== "read");
function metadata(): Metadata { return { auth: { configured: rawAuth.configured, loading: rawAuth.loading,
  userId: rawAuth.user?.id ?? null, status: rawAuth.signOutStatus }, owner: store.getStorageOwnershipSnapshot(),
  raw: raw(), writes: [...writes()], sdkCalls: fixture.sdk.mock.calls.length }; }
function view(tree: Node | null) { return { null: tree === null, text: text(tree), buttons: nodes(tree).filter(node => node.type === "button").map(node => ({
  text: text(node), title: node.props.title, disabled: node.props.disabled, busy: node.props["aria-busy"] })),
  alerts: nodes(tree).filter(node => node.props.role === "alert").map(text), statuses: nodes(tree).filter(node => node.props.role === "status").map(text),
  ...(tree ? treeMetadata.get(tree) ?? metadata() : metadata()) };
}
function observe(name: string, data: unknown) { console.log("C61_LOGOUT_OBSERVATION " + JSON.stringify({ name, locale: fixture.locale, data,
  outcomes: fixture.outcomes, physicalTrace: trace, events, pusherCalls: fixture.register.mock.calls.length, limits: LIMITS })); }
function button(tree: Node | null, label: string) { return nodes(tree).filter(node => node.type === "button" && text(node) === label); }
function invoke(node: Node | undefined) { if (!node?.props.onClick) return false; node.props.onClick(); return true; }
function currentPromise() { const promise = fixture.calls.at(-1); if (!promise) throw Error("C61 actual signOut promise was not observed"); return promise; }
function completed(call: number) { return fixture.outcomes.find(outcome => outcome.call === call); }
function outcome(call: number, error: "unconfirmed" | "cancelled" | null) { expect(completed(call)).toMatchObject({ kind: "fulfilled", value: { error } }); }
function preserve(before: ReturnType<typeof raw>) { expect(raw()).toEqual(before); expect(writes()).toEqual([]);
  expect(events.filter(event => event !== "coachfi-storage-owner")).toEqual([]); expect(fetch).not.toHaveBeenCalled(); }
function pending(tree: Node | null) { const observed = view(tree); expect(observed.auth.status).toBe("pending");
  expect(observed.statuses).toEqual([COPY[fixture.locale].pending]); expect(observed.buttons.some(item => item.disabled === true && (item.busy === true || item.busy === "true"))).toBe(true); }
function failed(tree: Node | null) { const observed = view(tree); expect(observed.auth.status).toBe("error");
  expect(observed.alerts).toEqual([COPY[fixture.locale].error]); expect(button(tree, COPY[fixture.locale].retry)).toHaveLength(1);
  expect(observed.text).not.toContain(DETAIL); expect(observed.statuses).toEqual([]); }
function emit(event: string, id: string | null) { const callback = fixture.callbacks.at(-1); if (!callback) throw Error("C61 actual provider subscription missing");
  return callback(event, id ? { user: { id, email: id + "@synthetic.invalid" } } : null); }
async function start(options: { enabled?: boolean; client?: boolean; login?: boolean } = {}) {
  if (providerMounted) stop("provider"); if (buttonMounted) stop("button");
  fixture.frames.clear(); fixture.calls.length = 0; fixture.outcomes.length = 0; fixture.callbacks.length = 0;
  enabled = options.enabled ?? true; providerMounted = true; buttonMounted = true;
  fixture.factory.mockReturnValue(options.client === false ? null : client); fixture.configured.mockReturnValue(options.client !== false);
  store.beginStorageOwner({ kind: "guest" }).publishReady({ localOnly: true }); settle();
  if (options.login !== false && enabled && options.client !== false) { emit("SIGNED_IN", A); await vi.advanceTimersByTimeAsync(0); settle();
    // Synthetic fixture setup after the no-op read adapter; no claim of actual cloud hydration or writer success.
    local.set(key(A, "coachfi-tokens"), "125"); session.set(key(A, "coachfi-tokens"), "251"); }
  trace = []; events = []; fixture.sdk.mockClear(); fixture.register.mockClear(); fixture.hydrate.mockClear();
  return settle();
}
async function finish(gate: ReturnType<typeof deferred<{ error: { message: string } | null }>>, mode: "returned-error" | "thrown" | "success") {
  if (mode === "thrown") gate.reject(new Error(DETAIL)); else gate.resolve({ error: mode === "success" ? null : { message: DETAIL } });
  await Promise.allSettled([...fixture.calls]); await Promise.resolve(); return settle();
}
function physical(data: Map<string, string>, area: "local" | "session") { return {
  getItem(name: string) { trace.push({ area, kind: "read", key: name }); return data.get(name) ?? null; },
  setItem(name: string, value: string) { trace.push({ area, kind: "set", key: name, value }); data.set(name, value); },
  removeItem(name: string) { trace.push({ area, kind: "remove", key: name }); data.delete(name); },
}; }

beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); vi.useFakeTimers(); fixture.locale = "pl"; fixture.frames.clear(); fixture.callbacks.length = 0;
  fixture.calls.length = 0; fixture.outcomes.length = 0; trace = []; events = []; providerMounted = false; buttonMounted = false; treeMetadata = new WeakMap();
  local = new Map([["coachfi-tokens", "125"], ["coachfi-user", ' {"name":"C61 synthetic guest","setupDone":true} '],
    ["coachfi-auth", "C61_SYNTHETIC_AUTH_BYTES_NOT_A_SESSION"], [key(B, "coachfi-tokens"), "321"], ["C61_UNRELATED", "local-retained"]]);
  session = new Map([["coachfi-tokens", "251"], [key(B, "coachfi-tokens"), "432"], ["C61_UNRELATED", "session-retained"]]);
  const target = new EventTarget(), originalDispatch = target.dispatchEvent.bind(target);
  Object.assign(target, { localStorage: physical(local, "local"), sessionStorage: physical(session, "session"),
    location: { origin: "http://synthetic.invalid" }, dispatchEvent: (event: Event) => { events.push(event.type); return originalDispatch(event); } });
  vi.stubGlobal("window", target); vi.stubGlobal("fetch", vi.fn(() => { throw Error("C61 network forbidden"); }));
  fixture.hydrate.mockResolvedValue(true); fixture.sdk.mockResolvedValue({ error: null });
  fixture.subscribe.mockImplementation((callback: (event: string, session: unknown) => void) => {
    fixture.callbacks.push(callback); return { data: { subscription: { unsubscribe: fixture.unsubscribe } } };
  });
  client = { auth: { onAuthStateChange: fixture.subscribe, signOut: fixture.sdk } };
  store = await import("@/lib/product-storage"); Provider = (await import("@/context/AuthContext")).AuthProvider;
  Button = (await import("@/components/AccountButton")).AccountButton;
});
afterEach(() => { if (buttonMounted) stop("button"); if (providerMounted) stop("provider");
  expect(fetch).not.toHaveBeenCalled(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("C61 actual provider logout outcome and owner fence", () => {
  for (const mode of ["returned-error", "thrown", "success"] as const) it(mode + " returns an honest outcome after immediate local guest detachment", async () => {
    await start(); const before = raw(), old = store.captureCurrentPersonalStorage(), gate = deferred<{ error: { message: string } | null }>();
    fixture.sdk.mockReturnValue(gate.promise); fixture.auth!.signOut(); const immediate = view(settle()), after = view(await finish(gate, mode));
    observe("provider-" + mode, { immediate, after, oldHandleCurrent: old.isCurrent() });
    expect(immediate.auth.userId).toBeNull(); expect(immediate.owner).toMatchObject({ status: "ready", owner: { kind: "guest" } });
    expect(immediate.auth.status).toBe("pending"); expect(old.isCurrent()).toBe(false);
    outcome(1, mode === "success" ? null : "unconfirmed"); expect(after.auth.status).toBe(mode === "success" ? "idle" : "error");
    expect(fixture.sdk.mock.calls).toEqual([[]]); preserve(before);
  });
  it("disabled provider and actual AccountButton initialize no auth adapter", async () => {
    const tree = await start({ enabled: false, login: false });
    const before = raw(); fixture.auth!.signOut(); await currentPromise().catch(() => undefined); const after = settle();
    observe("disabled", { before: view(tree), after: view(after) }); expect(after).toBeNull(); outcome(1, "unconfirmed");
    expect(fixture.factory).not.toHaveBeenCalled(); expect(fixture.configured).not.toHaveBeenCalled(); expect(fixture.subscribe).not.toHaveBeenCalled();
    expect(fixture.sdk).not.toHaveBeenCalled(); preserve(before);
  });
  it("unconfigured null-client path does not invent a confirmed remote logout", async () => {
    await start({ client: false, login: false }); const before = raw(); fixture.auth!.signOut(); await currentPromise().catch(() => undefined);
    const after = view(settle()); observe("no-client", after); expect(after.null).toBe(true); expect(after.auth.configured).toBe(false);
    outcome(1, "unconfirmed"); expect(fixture.sdk).not.toHaveBeenCalled(); preserve(before);
  });
  it("fences scheduled account work synchronously before waiting for SDK result", async () => {
    await start({ login: false }); emit("SIGNED_IN", A); const before = raw(), account = store.getStorageOwnershipSnapshot();
    const gate = deferred<{ error: { message: string } | null }>(); fixture.sdk.mockReturnValue(gate.promise); fixture.auth!.signOut();
    const immediate = store.getStorageOwnershipSnapshot(); await vi.advanceTimersByTimeAsync(0); const reads = fixture.hydrate.mock.calls.length;
    await finish(gate, "success"); observe("synchronous-fence", { account, immediate, hydrationCalls: reads });
    expect(account.owner).toMatchObject({ kind: "account", userId: A }); expect(immediate).toMatchObject({ status: "ready", owner: { kind: "guest" } });
    expect(reads).toBe(0); outcome(1, null); preserve(before);
  });
  it("late A results cannot clear a subsequent B or new-generation A owner or publish stale status", async () => {
    const observations = [];
    for (const nextId of [A, B]) for (const mode of ["returned-error", "thrown", "success"] as const) {
      await start(); const before = raw(), gate = deferred<{ error: { message: string } | null }>(); fixture.sdk.mockReturnValue(gate.promise);
      fixture.auth!.signOut(); emit("SIGNED_IN", nextId); await vi.advanceTimersByTimeAsync(0); const next = store.captureCurrentPersonalStorage();
      const beforeLate = view(settle()), registers = fixture.register.mock.calls.length, afterLate = view(await finish(gate, mode));
      observations.push({ mode, nextId, beforeLate, afterLate, outcome: completed(1), nextHandleCurrent: next.isCurrent(), registersBefore: registers,
        registersAfter: fixture.register.mock.calls.length, rawBefore: before, rawAfter: raw(), writes: writes() });
    }
    observe("late-A-new-generation", observations);
    observations.forEach(item => { expect(item.outcome).toMatchObject({ kind: "fulfilled", value: { error: "cancelled" } });
      expect(item.nextHandleCurrent).toBe(true); expect(item.afterLate.auth).toMatchObject({ userId: item.nextId, status: "idle" });
      expect(item.registersAfter).toBe(item.registersBefore); expect(item.rawAfter).toEqual(item.rawBefore); expect(item.writes).toEqual([]); });
  });
  it("unmounted actual provider cancels late results without async state writes or revived owner", async () => {
    const observations = [];
    for (const mode of ["returned-error", "thrown", "success"] as const) {
      await start(); const before = raw(), gate = deferred<{ error: { message: string } | null }>(); fixture.sdk.mockReturnValue(gate.promise); fixture.auth!.signOut();
      stop("button"); stop("provider"); buttonMounted = false; providerMounted = false;
      const updates = fixture.frames.get("provider")!.updates, owner = store.getStorageOwnershipSnapshot(); await finish(gate, mode);
      observations.push({ mode, updatesBefore: updates, updatesAfter: fixture.frames.get("provider")!.updates, ownerBefore: owner,
        ownerAfter: store.getStorageOwnershipSnapshot(), outcome: completed(1), rawBefore: before, rawAfter: raw(), writes: writes() });
    }
    observe("unmount", observations);
    observations.forEach(item => { expect(item.outcome).toMatchObject({ kind: "fulfilled", value: { error: "cancelled" } });
      expect(item.updatesAfter).toBe(item.updatesBefore); expect(item.ownerAfter).toBe(item.ownerBefore);
      expect(item.rawAfter).toEqual(item.rawBefore); expect(item.writes).toEqual([]); });
  });
});

describe("C61 actual AccountButton PL/EN pending, failure and recovery", () => {
  for (const locale of ["pl", "en"] as const) {
    for (const mode of ["returned-error", "thrown"] as const) it(locale + " " + mode + " keeps localized failure after guest detach and actual retry recovers", async () => {
      fixture.locale = locale; let tree = await start(); const before = raw(), gate = deferred<{ error: { message: string } | null }>();
      fixture.sdk.mockReturnValue(gate.promise); const oldClick = button(tree, COPY[locale].out)[0]; const invoked = invoke(oldClick);
      const firstOwner = store.getStorageOwnershipSnapshot(); if (mode === "returned-error") invoke(oldClick);
      const duplicateOwner = store.getStorageOwnershipSnapshot(), pendingTree = settle(), pendingView = view(pendingTree), pendingCalls = fixture.sdk.mock.calls.length;
      tree = await finish(gate, mode); const errorTree = tree, errorView = view(tree), errorOutcome = completed(1);
      const retryGate = deferred<{ error: { message: string } | null }>(); fixture.sdk.mockReturnValue(retryGate.promise);
      const retryInvoked = invoke(button(tree, COPY[locale].retry)[0]); const retryPendingTree = settle();
      if (retryInvoked) tree = await finish(retryGate, "success"); else tree = settle();
      observe("ui-" + mode, { invoked, firstOwner, duplicateOwner, pendingView, pendingCalls, errorView, errorOutcome,
        retryInvoked, retryPending: view(retryPendingTree), afterRetry: view(tree) });
      expect(invoked).toBe(true); pending(pendingTree); expect(pendingCalls).toBe(1); expect(duplicateOwner).toBe(firstOwner);
      expect(errorOutcome).toMatchObject({ kind: "fulfilled", value: { error: "unconfirmed" } }); failed(errorTree);
      expect(retryInvoked).toBe(true); pending(retryPendingTree); expect(view(tree).auth.status).toBe("idle"); expect(view(tree).alerts).toEqual([]);
      expect(button(tree, COPY[locale].signIn)).toHaveLength(1); expect(fixture.sdk.mock.calls).toEqual([[], []]); preserve(before);
    });
    it(locale + " successful SDK null-session event confirms logout without stale pending or error", async () => {
      fixture.locale = locale; let tree = await start(); const before = raw(), gate = deferred<{ error: { message: string } | null }>(); fixture.sdk.mockReturnValue(gate.promise);
      const invoked = invoke(button(tree, COPY[locale].out)[0]); const pendingTree = settle(); emit("SIGNED_OUT", null); const afterEvent = view(settle());
      tree = await finish(gate, "success"); observe("ui-success-null-event", { invoked, pending: view(pendingTree), afterEvent, after: view(tree) });
      expect(invoked).toBe(true); pending(pendingTree); outcome(1, null); expect(view(tree).auth).toMatchObject({ userId: null, status: "idle" });
      expect(view(tree).alerts).toEqual([]); expect(view(tree).statuses).toEqual([]); expect(button(tree, COPY[locale].signIn)).toHaveLength(1); preserve(before);
    });
    it(locale + " a newer B login retires old A error feedback and preserves current B account UI", async () => {
      fixture.locale = locale; let tree = await start(); const before = raw(), gate = deferred<{ error: { message: string } | null }>(); fixture.sdk.mockReturnValue(gate.promise);
      invoke(button(tree, COPY[locale].out)[0]); const pendingTree = settle(); emit("SIGNED_IN", B); await vi.advanceTimersByTimeAsync(0);
      const b = store.captureCurrentPersonalStorage(), beforeLate = view(settle()); tree = await finish(gate, "returned-error");
      observe("ui-new-B", { pending: view(pendingTree), beforeLate, afterLate: view(tree), bCurrent: b.isCurrent() });
      pending(pendingTree); outcome(1, "cancelled"); expect(b.isCurrent()).toBe(true); expect(view(tree).auth).toMatchObject({ userId: B, status: "idle" });
      expect(view(tree).alerts).toEqual([]); expect(button(tree, COPY[locale].retry)).toHaveLength(0);
      expect(button(tree, COPY[locale].out)[0]?.props.title).toBe(B + "@synthetic.invalid"); preserve(before);
    });
    it(locale + " disabling the provider during logout hides AccountButton and suppresses late failure", async () => {
      fixture.locale = locale; let tree = await start(); const before = raw(), gate = deferred<{ error: { message: string } | null }>(); fixture.sdk.mockReturnValue(gate.promise);
      invoke(button(tree, COPY[locale].out)[0]); const pendingTree = settle(); enabled = false; const disabledTree = settle();
      const updates = fixture.frames.get("provider")!.updates; tree = await finish(gate, "returned-error");
      observe("ui-disabled-pending", { pending: view(pendingTree), disabled: view(disabledTree), after: view(tree), updatesBefore: updates, updatesAfter: fixture.frames.get("provider")!.updates });
      pending(pendingTree); expect(disabledTree).toBeNull(); expect(tree).toBeNull(); outcome(1, "cancelled");
      expect(fixture.frames.get("provider")!.updates).toBe(updates); preserve(before);
    });
  }
});
