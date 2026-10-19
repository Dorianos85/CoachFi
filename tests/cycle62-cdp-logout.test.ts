import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

type Locale = "pl" | "en";
type Effect = () => void | (() => void);
type Frame = { slot: number; values: Map<number, unknown>; memos: Map<number, { deps?: readonly unknown[]; value: unknown }>;
  deps: Map<number, readonly unknown[] | undefined>; effects: Array<{ slot: number; effect: Effect }>; cleanups: Map<number, () => void>; updates: number };
type Outcome = { call: number; kind: "fulfilled" | "rejected"; reason?: string };
const fixture = vi.hoisted(() => ({ locale: "pl" as Locale, current: "header", frames: new Map<string, Frame>(), initialized: true,
  signedIn: true, userId: "C62-synthetic-A", sdk: vi.fn<() => Promise<void>>(), getter: vi.fn<() => Promise<string | null>>(),
  notify: vi.fn(), calls: [] as Array<Promise<void>>, outcomes: [] as Outcome[], signIn: vi.fn() }));
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
  useSyncExternalStore: (_subscribe: unknown, snapshot: () => unknown) => snapshot(),
}));
function observePromise(promise: Promise<void>) {
  const call = fixture.calls.push(promise);
  // Attach an observer without replacing the original promise or its outcome. Old void callers therefore do not create an unhandled fixture rejection.
  void promise.then(() => { fixture.outcomes.push({ call, kind: "fulfilled" }); },
    error => { fixture.outcomes.push({ call, kind: "rejected", reason: error instanceof Error ? error.message : String(error) }); });
  return promise;
}
vi.mock("@coinbase/cdp-hooks", () => ({
  useIsInitialized: () => ({ isInitialized: fixture.initialized }), useIsSignedIn: () => ({ isSignedIn: fixture.signedIn }),
  useCurrentUser: () => ({ currentUser: fixture.signedIn ? { userId: fixture.userId, authenticationMethods: {} } : null }),
  useGetAccessToken: () => ({ getAccessToken: fixture.getter }), useSignOut: () => ({ signOut: () => observePromise(fixture.sdk()) }),
}));
vi.mock("@/context/LanguageContext", async () => {
  const { translations } = await import("@/lib/i18n");
  return { useLanguage: () => ({ locale: fixture.locale, t: translations[fixture.locale] }) };
});
vi.mock("@/context/ConsentContext", () => ({ useConsent: () => ({ requiredAccepted: true, openSettings: () => {} }) }));
vi.mock("@/context/ModeContext", () => ({ useMode: () => ({ loaded: true, modeRecord: { mode: "adult" }, isKidsMode: false, openSettings: () => {} }) }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: fixture.notify }));
vi.mock("@/lib/signInGate", () => ({ requestSignIn: fixture.signIn }));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("next/link", () => ({ default: "c62-Link" }));
vi.mock("framer-motion", () => ({ motion: { div: "c62-motion-div", main: "c62-motion-main" } }));
// Shallow AppNavigation extraction does not execute these sibling components or shell effects.
vi.mock("@/components/AccessibilityToggle", () => ({ AccessibilityToggle: "c62-AccessibilityToggle" }));
vi.mock("@/components/ConsentManager", () => ({ ConsentManager: "c62-ConsentManager" }));
vi.mock("@/components/LanguageSwitcher", () => ({ LanguageSwitcher: "c62-LanguageSwitcher" }));
vi.mock("@/components/AccountButton", () => ({ AccountButton: "c62-AccountButton" }));
vi.mock("@/components/ModeGate", () => ({ ModeGate: "c62-ModeGate" }));
vi.mock("@/components/ScopeUnavailable", () => ({ ScopeUnavailable: "c62-ScopeUnavailable" }));
vi.mock("@/components/Logo", () => ({ Logo: "c62-Logo" }));
vi.mock("@/components/NotificationBanner", () => ({ NotificationBanner: "c62-NotificationBanner" }));
vi.mock("@/components/OnboardingModal", () => ({ OnboardingModal: "c62-OnboardingModal" }));
vi.mock("@/components/StreakBadge", () => ({ StreakBadge: "c62-StreakBadge" }));

type Props = { children?: unknown; role?: string; disabled?: boolean; "aria-busy"?: boolean | "true" | "false"; onClick?: () => unknown };
type Node = ReactElement<Props>;
type Trace = { area: "local" | "session"; kind: "read" | "set" | "remove"; key: string; value?: string };
type Metadata = { initialized: boolean; signedIn: boolean; userId: string; owner: unknown; raw: ReturnType<typeof raw>; writes: Trace[]; sdkCalls: number; updates: number };
const A = "C62-synthetic-A", B = "C62-synthetic-B", DETAIL = "C62_PRIVATE_PROVIDER_DETAIL";
const COPY = {
  pl: { out: "Wyloguj", signIn: "Zaloguj", pending: "Trwa wylogowywanie...", retry: "Spróbuj wylogować ponownie",
    error: "Nie udało się zakończyć wylogowania. Spróbuj ponownie." },
  en: { out: "Sign out", signIn: "Sign in", pending: "Signing out...", retry: "Retry sign-out",
    error: "Sign-out could not be completed. Try again." },
};
const LIMITS = "Conditional CDP header branch only. Actual AppNavigation shallow tree extracts its unexported HeaderAccount function; actual HeaderAccount, useProductStorage, account-sync and product-storage execute with synthetic Maps and real learning/owner leases. Explicit persistent per-component React state/memo/ref/effect emulator with three render/effect passes and historical WeakMap snapshots; this is not native React/browser acceptance. AppNavigation shell effects and sibling components do not execute. CDP hooks are fully replaced by controlled values and deferred Promise<void>; same original promise gets a passive fulfillment/rejection observer, never a result override. No installed SDK initialization/runtime, real account/config/provider/network/audio/cloud/auth-policy execution. Installed CDP core catches remote logout errors: mocked rejection is an allowed local SDK boundary outcome, not a simulated remote revocation failure. SDK fulfillment alone never proves remote revocation. Actual AccountSync signed-out composition is represented explicitly by real endLearningSession(), not by silently assuming an unchanged guest revision. No local-auth removal or durable writes.";
let Header: (props: { locale: Locale }) => unknown, store: typeof import("@/lib/product-storage"), sync: typeof import("@/lib/account-sync");
let local: Map<string, string>, session: Map<string, string>, trace: Trace[], events: string[], mounted: boolean, treeMetadata: WeakMap<object, Metadata>;
const key = (id: string, name: string) => "coachfi-owned:v1:cdp:" + encodeURIComponent(id) + ":" + name;
const raw = () => ({ local: [...local], session: [...session] });
const writes = () => trace.filter(item => item.kind !== "read");
function deferred() { let resolve!: () => void, reject!: (error: unknown) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  void promise.catch(() => {}); // A fenced attempt may never consume this synthetic gate; keep its original promise and outcome.
  return { promise, resolve, reject }; }
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node; return [node, ...nodes(node.props.children)];
}
function text(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(text).join("");
  return value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : "";
}
function flush(state: Frame) { for (const item of state.effects.splice(0)) { state.cleanups.get(item.slot)?.(); state.cleanups.delete(item.slot);
  const cleanup = item.effect(); if (typeof cleanup === "function") state.cleanups.set(item.slot, cleanup); } }
function stop() { fixture.frames.get("header")?.cleanups.forEach(cleanup => cleanup()); fixture.frames.get("header")?.cleanups.clear(); mounted = false; }
function metadata(): Metadata { return { initialized: fixture.initialized, signedIn: fixture.signedIn, userId: fixture.userId,
  owner: store.getStorageOwnershipSnapshot(), raw: raw(), writes: [...writes()], sdkCalls: fixture.sdk.mock.calls.length,
  updates: fixture.frames.get("header")?.updates ?? 0 }; }
function settle(): Node | null {
  if (!mounted) return null;
  let tree: Node | null = null;
  for (let pass = 0; pass < 3; pass++) { fixture.current = "header"; frame().slot = 0; tree = Header({ locale: fixture.locale }) as Node | null; flush(frame());
    if (tree) treeMetadata.set(tree, metadata()); }
  return tree;
}
function view(tree: Node | null) { return { null: tree === null, text: text(tree), buttons: nodes(tree).filter(node => node.type === "button").map(node => ({
  text: text(node), disabled: node.props.disabled, busy: node.props["aria-busy"] })), alerts: nodes(tree).filter(node => node.props.role === "alert").map(text),
  statuses: nodes(tree).filter(node => node.props.role === "status").map(text), ...(tree ? treeMetadata.get(tree) ?? metadata() : metadata()) }; }
function observe(name: string, data: unknown) { console.log("C62_LOGOUT_OBSERVATION " + JSON.stringify({ name, locale: fixture.locale, data,
  outcomes: fixture.outcomes, physicalTrace: trace, events, limits: LIMITS })); }
function button(tree: Node | null, label: string) { return nodes(tree).filter(node => node.type === "button" && text(node) === label); }
function invoke(node: Node | undefined) { if (!node?.props.onClick) return false; node.props.onClick(); return true; }
function pending(tree: Node | null) { const observed = view(tree); expect(observed.statuses).toEqual([COPY[fixture.locale].pending]);
  expect(observed.buttons.some(item => item.disabled === true && (item.busy === true || item.busy === "true"))).toBe(true); expect(observed.alerts).toEqual([]); }
function failed(tree: Node | null) { const observed = view(tree); expect(observed.alerts).toEqual([COPY[fixture.locale].error]);
  expect(button(tree, COPY[fixture.locale].retry)).toHaveLength(1); expect(observed.statuses).toEqual([]); expect(observed.text).not.toContain(DETAIL); }
function preserve(before: ReturnType<typeof raw>) { expect(raw()).toEqual(before); expect(writes()).toEqual([]);
  expect(fixture.notify).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled(); expect(fixture.getter).not.toHaveBeenCalled(); }
async function owner(id: string) { fixture.userId = id; fixture.signedIn = true;
  const lease = sync.startLearningSession({ id }, fixture.getter); await lease.ready; return store.captureCurrentPersonalStorage(); }
async function start() {
  if (mounted) stop(); fixture.frames.delete("header"); fixture.calls.length = 0; fixture.outcomes.length = 0;
  fixture.initialized = true; await owner(A); mounted = true;
  fixture.sdk.mockClear(); fixture.sdk.mockResolvedValue(undefined); fixture.getter.mockClear(); fixture.notify.mockClear(); trace = []; events = [];
  return settle();
}
async function finish(gate: ReturnType<typeof deferred>, mode: "reject" | "resolve") {
  await Promise.resolve(); await Promise.resolve(); // allow the actual awaited local-detach boundary to reach the SDK adapter
  if (mode === "reject") gate.reject(new Error(DETAIL)); else gate.resolve();
  await Promise.allSettled([...fixture.calls]); await Promise.resolve(); await Promise.resolve(); return settle();
}
function physical(data: Map<string, string>, area: "local" | "session") { return {
  getItem(name: string) { trace.push({ area, kind: "read", key: name }); return data.get(name) ?? null; },
  setItem(name: string, value: string) { trace.push({ area, kind: "set", key: name, value }); data.set(name, value); },
  removeItem(name: string) { trace.push({ area, kind: "remove", key: name }); data.delete(name); },
}; }

beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); fixture.frames.clear(); fixture.calls.length = 0; fixture.outcomes.length = 0;
  fixture.locale = "pl"; fixture.current = "extract"; fixture.initialized = true; fixture.signedIn = true; fixture.userId = A;
  mounted = false; trace = []; events = []; treeMetadata = new WeakMap();
  local = new Map([["coachfi-tokens", "125"], ["coachfi-user", ' {"name":"C62 synthetic guest","setupDone":true} '],
    ["coachfi-auth", "C62_SYNTHETIC_AUTH_BYTES_NOT_A_SESSION"], [key(A, "coachfi-tokens"), "345"], [key(B, "coachfi-tokens"), "456"], ["C62_UNRELATED", "local-retained"]]);
  session = new Map([["coachfi-tokens", "251"], [key(A, "coachfi-tokens"), "543"], [key(B, "coachfi-tokens"), "654"], ["C62_UNRELATED", "session-retained"]]);
  const target = new EventTarget(), dispatch = target.dispatchEvent.bind(target);
  Object.assign(target, { localStorage: physical(local, "local"), sessionStorage: physical(session, "session"), location: { origin: "http://synthetic.invalid" },
    dispatchEvent: (event: Event) => { events.push(event.type); return dispatch(event); } });
  vi.stubGlobal("window", target); vi.stubGlobal("fetch", vi.fn(() => { throw Error("C62 network forbidden"); }));
  vi.stubEnv("NEXT_PUBLIC_CDP_PROJECT_ID", "C62_SYNTHETIC_PUBLIC_SELECTOR_NOT_REAL_CONFIG"); fixture.getter.mockResolvedValue(null); fixture.sdk.mockResolvedValue(undefined);
  store = await import("@/lib/product-storage"); sync = await import("@/lib/account-sync");
  const { AppNavigation } = await import("@/components/AppNavigation");
  // Invoke the real outer component once to obtain its actual nested function, never a copied logout handler or new product export.
  const shell = AppNavigation({ children: null });
  const matches = nodes(shell).filter(node => typeof node.type === "function" && node.type.name === "HeaderAccount");
  if (matches.length !== 1) throw Error("C62 actual conditional HeaderAccount element unavailable");
  Header = matches[0].type as (props: { locale: Locale }) => unknown;
  fixture.frames.delete("extract"); // queued shell effects deliberately never execute
});
afterEach(async () => { if (mounted) stop(); await sync.stopLearningSync(); expect(fetch).not.toHaveBeenCalled(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("C62 actual conditional CDP header logout local outcome PL/EN", () => {
  for (const locale of ["pl", "en"] as const) {
    it(locale + " immediately detaches and blocks same-turn and post-render pending duplicates", async () => {
      fixture.locale = locale; const tree = await start(), before = raw(), account = store.captureCurrentPersonalStorage(), gate = deferred(); fixture.sdk.mockReturnValue(gate.promise);
      const captured = button(tree, COPY[locale].out)[0], invoked = invoke(captured), immediate = store.getStorageOwnershipSnapshot();
      invoke(captured); const sameTurn = store.getStorageOwnershipSnapshot(); await Promise.resolve(); await Promise.resolve(); const pendingTree = settle();
      const pendingAction = nodes(pendingTree).find(node => node.type === "button" && node.props.onClick);
      invoke(pendingAction); const afterDuplicate = store.getStorageOwnershipSnapshot(), calls = fixture.sdk.mock.calls.length, after = await finish(gate, "resolve");
      observe("pending-duplicates", { invoked, immediate, sameTurn, afterDuplicate, accountCurrent: account.isCurrent(), pending: view(pendingTree), calls, after: view(after) });
      expect(invoked).toBe(true); expect(immediate).toMatchObject({ status: "ready", owner: { kind: "guest" } }); expect(account.isCurrent()).toBe(false);
      pending(pendingTree); expect(calls).toBe(1); expect(sameTurn).toBe(immediate); expect(afterDuplicate).toBe(immediate); expect(fixture.sdk.mock.calls).toEqual([[]]); preserve(before);
    });
    it(locale + " rejected SDK promise shows generic feedback and only an actual retry starts again", async () => {
      fixture.locale = locale; let tree = await start(); const before = raw(), gate = deferred(); fixture.sdk.mockReturnValue(gate.promise);
      const invoked = invoke(button(tree, COPY[locale].out)[0]), pendingTree = settle(), failedTree = await finish(gate, "reject"), errorView = view(failedTree);
      const retryGate = deferred(); fixture.sdk.mockReturnValue(retryGate.promise); const retryInvoked = invoke(button(failedTree, COPY[locale].retry)[0]);
      const retryPending = settle(); if (retryInvoked) tree = await finish(retryGate, "resolve"); else tree = settle();
      observe("rejection-retry", { invoked, pending: view(pendingTree), error: errorView, retryInvoked, retryPending: view(retryPending), after: view(tree) });
      expect(invoked).toBe(true); pending(pendingTree); failed(failedTree); expect(retryInvoked).toBe(true); pending(retryPending);
      expect(view(tree).alerts).toEqual([]); expect(view(tree).statuses).toEqual([]); expect(fixture.sdk.mock.calls).toEqual([[], []]); preserve(before);
    });
    it(locale + " fulfilled SDK promise clears pending without inventing signed-out state", async () => {
      fixture.locale = locale; const tree = await start(), before = raw(), gate = deferred(); fixture.sdk.mockReturnValue(gate.promise);
      invoke(button(tree, COPY[locale].out)[0]); const pendingTree = settle(), after = await finish(gate, "resolve");
      observe("fulfilled-local-outcome", { pending: view(pendingTree), after: view(after) });
      pending(pendingTree); expect(fixture.signedIn).toBe(true); expect(view(after).statuses).toEqual([]); expect(view(after).alerts).toEqual([]);
      expect(button(after, COPY[locale].out)).toHaveLength(1); expect(button(after, COPY[locale].signIn)).toHaveLength(0); preserve(before);
    });
    it(locale + " SDK signed-out pending keeps feedback only while its exact guest scope survives", async () => {
      fixture.locale = locale; const observations = [];
      for (const composeAccountSync of [false, true]) for (const mode of ["reject", "resolve"] as const) {
        const tree = await start(), before = raw(), gate = deferred(); fixture.sdk.mockReturnValue(gate.promise); invoke(button(tree, COPY[locale].out)[0]);
        const pendingTree = settle(); await Promise.resolve(); await Promise.resolve(); fixture.signedIn = false;
        if (composeAccountSync) await sync.endLearningSession(); // real AccountSync signed-out effect's ownership action
        const guest = store.captureCurrentPersonalStorage(), afterEvent = settle(), after = await finish(gate, mode);
        observations.push({ composeAccountSync, mode, pending: view(pendingTree), afterEvent: view(afterEvent), after: view(after), guestCurrent: guest.isCurrent(), rawBefore: before, rawAfter: raw(), writes: [...writes()] });
      }
      observe("signed-out-pending-composition", observations);
      observations.forEach(item => { expect(item.pending.statuses).toEqual([COPY[locale].pending]); expect(item.guestCurrent).toBe(true);
        if (item.composeAccountSync) { expect(item.after.alerts).toEqual([]); expect(item.after.statuses).toEqual([]); }
        else { expect(item.afterEvent.statuses).toEqual([COPY[locale].pending]); expect(item.after.alerts).toEqual(item.mode === "reject" ? [COPY[locale].error] : []); }
        expect(item.after.statuses).toEqual([]); expect(item.rawAfter).toEqual(item.rawBefore); expect(item.writes).toEqual([]); });
      expect(fetch).not.toHaveBeenCalled(); expect(fixture.notify).not.toHaveBeenCalled();
    });
    it(locale + " late logout cannot publish feedback into new-generation A or B owner", async () => {
      fixture.locale = locale; const observations = [];
      for (const nextId of [A, B]) for (const mode of ["reject", "resolve"] as const) for (const timing of ["before-SDK", "after-SDK"] as const) {
        const tree = await start(), before = raw(), gate = deferred(); fixture.sdk.mockReturnValue(gate.promise); invoke(button(tree, COPY[locale].out)[0]);
        const pendingTree = settle(); if (timing === "after-SDK") { await Promise.resolve(); await Promise.resolve(); }
        const callsBeforeOwnerChange = fixture.sdk.mock.calls.length, next = await owner(nextId), beforeLate = settle(), after = await finish(gate, mode);
        observations.push({ nextId, mode, timing, callsBeforeOwnerChange, callsAfter: fixture.sdk.mock.calls.length, pending: view(pendingTree), beforeLate: view(beforeLate), after: view(after), nextCurrent: next.isCurrent(), rawBefore: before, rawAfter: raw(), writes: [...writes()] });
      }
      observe("late-new-A-or-B", observations);
      observations.forEach(item => { expect(item.pending.statuses).toEqual([COPY[locale].pending]); expect(item.nextCurrent).toBe(true);
        expect(item.callsBeforeOwnerChange).toBe(item.timing === "after-SDK" ? 1 : 0); expect(item.callsAfter).toBe(item.callsBeforeOwnerChange);
        expect(item.after.owner).toMatchObject({ status: "ready", owner: { kind: "account", provider: "cdp", userId: item.nextId } });
        expect(item.beforeLate.statuses).toEqual([]); expect(item.after.statuses).toEqual([]); expect(item.after.alerts).toEqual([]);
        expect(item.rawAfter).toEqual(item.rawBefore); expect(item.writes).toEqual([]); });
      expect(fetch).not.toHaveBeenCalled(); expect(fixture.notify).not.toHaveBeenCalled();
    });
    it(locale + " unmount retires deferred settlement without state writes or owner restoration", async () => {
      fixture.locale = locale; const observations = [];
      for (const mode of ["reject", "resolve"] as const) {
        const tree = await start(), before = raw(), gate = deferred(); fixture.sdk.mockReturnValue(gate.promise); invoke(button(tree, COPY[locale].out)[0]);
        const pendingTree = settle(); await Promise.resolve(); await Promise.resolve(); const callsBeforeUnmount = fixture.sdk.mock.calls.length;
        stop(); const updates = fixture.frames.get("header")!.updates, ownerBefore = store.getStorageOwnershipSnapshot(); await finish(gate, mode);
        observations.push({ mode, callsBeforeUnmount, pending: view(pendingTree), updatesBefore: updates, updatesAfter: fixture.frames.get("header")!.updates,
          ownerBefore, ownerAfter: store.getStorageOwnershipSnapshot(), rawBefore: before, rawAfter: raw(), writes: [...writes()] });
      }
      observe("unmount", observations);
      observations.forEach(item => { expect(item.pending.statuses).toEqual([COPY[locale].pending]); expect(item.callsBeforeUnmount).toBe(1); expect(item.updatesAfter).toBe(item.updatesBefore);
        expect(item.ownerAfter).toBe(item.ownerBefore); expect(item.rawAfter).toEqual(item.rawBefore); expect(item.writes).toEqual([]); });
    });
    it(locale + " captured retired account callback cannot detach a newer A or B owner", async () => {
      fixture.locale = locale; const observations = [];
      for (const nextId of [A, B]) {
        const tree = await start(), before = raw(), captured = button(tree, COPY[locale].out)[0], next = await owner(nextId), beforeClick = store.getStorageOwnershipSnapshot(); settle();
        const invoked = invoke(captured); await Promise.allSettled([...fixture.calls]); const after = settle();
        observations.push({ nextId, invoked, beforeClick, after: view(after), nextCurrent: next.isCurrent(), sdkCalls: fixture.sdk.mock.calls.length, rawBefore: before, rawAfter: raw(), writes: [...writes()] });
      }
      observe("retired-callback", observations);
      observations.forEach(item => { expect(item.invoked).toBe(true); expect(item.nextCurrent).toBe(true); expect(item.after.owner).toBe(item.beforeClick);
        expect(item.sdkCalls).toBe(0); expect(item.rawAfter).toEqual(item.rawBefore); expect(item.writes).toEqual([]); });
    });
    it(locale + " signed-out initialization controls never call logout or invent authentication", async () => {
      fixture.locale = locale; await start(); fixture.signedIn = false; await sync.endLearningSession(); const before = raw();
      fixture.initialized = false; const uninitialized = settle(); fixture.initialized = true; const initialized = settle();
      observe("signed-out-controls", { uninitialized: view(uninitialized), initialized: view(initialized) });
      expect(button(uninitialized, COPY[locale].signIn)[0]?.props.disabled).toBe(true); expect(button(initialized, COPY[locale].signIn)[0]?.props.disabled).toBe(false);
      expect(button(initialized, COPY[locale].out)).toHaveLength(0); expect(view(initialized).alerts).toEqual([]); expect(view(initialized).statuses).toEqual([]);
      expect(fixture.sdk).not.toHaveBeenCalled(); expect(fixture.signIn).not.toHaveBeenCalled(); preserve(before);
    });
  }
});
