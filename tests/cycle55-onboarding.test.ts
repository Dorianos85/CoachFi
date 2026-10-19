import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

type Effect = () => void | (() => void);
const fixture = vi.hoisted(() => ({ locale: "pl" as "pl" | "en", slot: 0, dirty: false,
  storage: null as unknown as PersonalStorageHandle, values: new Map<number, unknown>(),
  memos: new Map<number, { deps?: readonly unknown[]; value: unknown }>(), effects: [] as Effect[],
  deps: new Map<number, readonly unknown[] | undefined>(), cleanups: new Map<number, () => void>(), notify: vi.fn(),
}));
const same = (a?: readonly unknown[], b?: readonly unknown[]) => !!a && !!b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
function memo(factory: () => unknown, deps?: readonly unknown[]) {
  const index = fixture.slot++, previous = fixture.memos.get(index);
  if (!previous || !same(previous.deps, deps)) fixture.memos.set(index, { deps, value: factory() });
  return fixture.memos.get(index)?.value;
}
function effect(callback: Effect, deps?: readonly unknown[]) {
  const index = fixture.slot++;
  if (!fixture.deps.has(index) || !same(fixture.deps.get(index), deps)) fixture.effects.push(() => {
    fixture.cleanups.get(index)?.(); fixture.cleanups.delete(index);
    const cleanup = callback(); if (typeof cleanup === "function") fixture.cleanups.set(index, cleanup);
  });
  fixture.deps.set(index, deps);
}
vi.mock("react", async original => ({ ...await original<typeof import("react")>(),
  useMemo: (factory: () => unknown, deps?: readonly unknown[]) => memo(factory, deps),
  useCallback: (callback: unknown, deps?: readonly unknown[]) => memo(() => callback, deps),
  useRef: (initial: unknown) => memo(() => ({ current: initial }), []),
  useId: () => { const index = fixture.slot++; return "c55-node-id-" + index; },
  useEffect: (callback: Effect, deps?: readonly unknown[]) => effect(callback, deps),
  useLayoutEffect: (callback: Effect, deps?: readonly unknown[]) => effect(callback, deps),
  useState: (initial: unknown) => {
    const index = fixture.slot++;
    if (!fixture.values.has(index)) fixture.values.set(index, typeof initial === "function" ? initial() : initial);
    return [fixture.values.get(index), (value: unknown) => {
      const previous = fixture.values.get(index), next = typeof value === "function" ? value(previous) : value;
      if (!Object.is(previous, next)) fixture.dirty = true; fixture.values.set(index, next);
    }];
  },
}));
// These primitives are element markers only. No native Radix, DOM, focus or portal behavior is simulated here.
vi.mock("@radix-ui/react-dialog", () => ({ Root: "c55-root", Portal: "c55-portal", Overlay: "c55-overlay",
  Content: "c55-content", Title: "c55-title", Description: "c55-description", Close: "c55-close" }));
vi.mock("framer-motion", () => ({ AnimatePresence: "c55-presence", motion: new Proxy({}, { get: (_, key) => "c55-motion-" + String(key) }) }));
vi.mock("@/context/LanguageContext", async () => {
  const { translations } = await import("@/lib/i18n");
  return { useLanguage: () => ({ locale: fixture.locale, t: translations[fixture.locale] }) };
});
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: fixture.storage }) }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: fixture.notify }));

type Props = { children?: unknown; role?: string; open?: boolean; id?: string; htmlFor?: string; value?: string;
  placeholder?: string; maxLength?: number; disabled?: boolean; "aria-label"?: string; "aria-labelledby"?: string;
  onClick?: () => void; onOpenChange?: (open: boolean) => void;
  onChange?: (event: { target: { value: string } }) => void; onKeyDown?: (event: { key: string; preventDefault: () => void }) => void };
type Node = ReactElement<Props>;
function nodes(value: unknown, visible = true): Node[] {
  if (Array.isArray(value)) return value.flatMap(item => nodes(item, visible));
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  if (visible && (node.type as unknown) === "c55-root" && node.props.open === false) return [node];
  return [node, ...nodes(node.props.children, visible)];
}
function text(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(text).join("");
  return value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : "";
}
const kind = (node: Node, type: string) => (node.type as unknown) === type;
const openDialog = (tree: unknown) => nodes(tree).find(node => kind(node, "c55-content") || node.props.role === "dialog");
function input(tree: unknown) { const found = nodes(tree).find(node => kind(node, "input")); if (!found) throw Error("C55 actual name input absent"); return found; }
function control(tree: unknown, label: string) {
  const found = nodes(tree).find(node => typeof node.props.onClick === "function" && text(node.props.children) === label);
  if (!found) throw Error("C55 actual control absent: " + label); return found;
}
let bytes: Map<string, string>, session: Map<string, string>;
let trace: Array<{ kind: "read" | "write" | "denied" | "remove"; area: "local" | "session"; key: string; value?: string }>;
let denyWrite = false, events = 0, enabled = true;
let done: ReturnType<typeof vi.fn<() => void>>, render: () => ReactElement | null;
let copy: typeof import("@/lib/i18n").translations.pl.onboarding;
function resetHooks() { fixture.cleanups.forEach(callback => callback()); fixture.cleanups.clear(); fixture.values.clear(); fixture.memos.clear(); fixture.deps.clear(); fixture.effects.length = 0; fixture.slot = 0; fixture.dirty = false; }
function settle() {
  for (let frame = 0; frame < 10; frame++) {
    fixture.slot = 0; fixture.dirty = false; const tree = render(); fixture.effects.splice(0).forEach(callback => callback());
    if (!fixture.dirty && !fixture.effects.length) return tree;
  }
  throw Error("C55 actual Onboarding did not settle in ten explicit frames");
}
const mutations = () => trace.filter(item => item.kind !== "read");
function physical(values: Map<string, string>, area: "local" | "session") {
  return { getItem: (key: string) => { trace.push({ kind: "read", area, key }); return values.get(key) ?? null; },
    setItem: (key: string, value: string) => {
      if (denyWrite && area === "local" && key === "coachfi-user") { trace.push({ kind: "denied", area, key, value }); throw Error("C55 synthetic write denial"); }
      trace.push({ kind: "write", area, key, value }); values.set(key, value);
    }, removeItem: (key: string) => { trace.push({ kind: "remove", area, key }); values.delete(key); } };
}
const LIMITS = "Actual Onboarding/getUser/saveUser/product-storage owner handles and physical write result. Explicit React state/memo/effect emulator, ten-frame bound; language/storage-hook inputs and downstream cloud notifier mocked. Framer Motion/Radix are unexecuted tree markers. Controlled Root false is treated as not visible; a Radix Close request is forwarded to the actual Root.onOpenChange callback. No native title computation, portal, trap, focus, animation, ReactDOM/hydration or readback guarantee is claimed; Chrome separately checks native behavior. No audio/network/provider/account.";
function observe(phase: string, tree: unknown, extra: unknown = {}) {
  const dialog = openDialog(tree), root = nodes(tree).find(node => kind(node, "c55-root"));
  const field = nodes(tree).find(node => kind(node, "input"));
  const titles = nodes(tree).filter(node => kind(node, "c55-title")).map(node => text(node));
  const labels = nodes(tree).filter(node => kind(node, "label")).map(node => ({ text: text(node), htmlFor: node.props.htmlFor }));
  const snapshot = { phase, locale: fixture.locale, open: !!dialog, rootOpen: root?.props.open, titles, labels,
    field: field ? { id: field.props.id, value: field.props.value, placeholder: field.props.placeholder, maxLength: field.props.maxLength } : null,
    visibleText: dialog ? text(dialog) : "", local: [...bytes], session: [...session], mutations: mutations(), events,
    onDoneCalls: done.mock.calls.length, cloudCalls: fixture.notify.mock.calls, extra, limits: LIMITS };
  console.log("C55_ONBOARDING_OBSERVATION " + JSON.stringify(snapshot)); return snapshot;
}
async function start(locale: "pl" | "en") {
  fixture.locale = locale; copy = (await import("@/lib/i18n")).translations[locale].onboarding; return settle();
}
function stepTwo(tree: unknown) {
  input(tree).props.onChange!({ target: { value: "  C55 synthetic  " } }); tree = settle();
  const preventDefault = vi.fn(); input(tree).props.onKeyDown!({ key: "Enter", preventDefault }); tree = settle();
  const goals = nodes(tree).filter(node => kind(node, "button") && copy.goals.includes(text(node.props.children)));
  const goalStates = goals.map(node => ({ text: text(node), ariaPressed: (node.props as Props & { "aria-pressed"?: boolean })["aria-pressed"] }));
  console.log("C55_ONBOARDING_KEYBOARD_OBSERVATION " + JSON.stringify({ locale: fixture.locale, preventDefaultCalls: preventDefault.mock.calls.length, goalStates, mutations: mutations(),
    limits: "Actual input handler and state tree; explicit emulator does not perform native default activation. Native v2 regression is separately preserved in browser raw. No claim these new assertions ran on old Node source." }));
  expect(preventDefault).toHaveBeenCalledTimes(1); expect(goals).toHaveLength(6); expect(goalStates.map(goal => goal.ariaPressed)).toEqual(Array(6).fill(false)); expect(mutations()).toEqual([]);
  return tree as ReactElement | null;
}
function prepared(action: "finish" | "skip", tree: unknown) {
  if (action === "finish") { tree = stepTwo(tree); control(tree, copy.goals[0]!).props.onClick!(); tree = settle(); }
  return { tree, handler: control(tree, action === "finish" ? copy.finish : copy.skip).props.onClick! };
}
function preserved(before: Map<string, string>, beforeSession: Map<string, string>) {
  expect([...bytes].filter(([key]) => key !== "coachfi-user")).toEqual([...before].filter(([key]) => key !== "coachfi-user"));
  expect(session).toEqual(beforeSession); expect(bytes.get("coachfi-tokens")).toBe("125");
}
beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); resetHooks(); fixture.locale = "pl"; denyWrite = false; events = 0; enabled = true; done = vi.fn<() => void>();
  bytes = new Map([["coachfi-user", '{"name":"","goal":"","setupDone":false,"fixtureUnknown":"C55-preserved-until-explicit-save"}'],
    ["coachfi-tokens", "125"], ["coachfi-srs", "[]"], ["coachfi-lesson-steps", '{"retirement":2}'],
    ["coachfi-streak", '{"lastActiveDate":"2026-01-01","currentStreak":1,"longestStreak":1}'], ["TEST_C55_UNRELATED", "retained"]]);
  session = new Map([["coachfi-user", '{"name":"C55_SESSION","goal":"separate","setupDone":true}'], ["coachfi-tokens", "321"]]); trace = [];
  const win = new EventTarget(); Object.assign(win, { localStorage: physical(bytes, "local"), sessionStorage: physical(session, "session") });
  win.addEventListener("coachfi-user", () => events++); vi.stubGlobal("window", win);
  vi.stubGlobal("document", { activeElement: null });
  vi.stubGlobal("HTMLElement", class C55Element {});
  vi.stubGlobal("fetch", vi.fn(() => { throw Error("C55 network is unauthorized"); }));
  const store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "guest" }).publishReady(); fixture.storage = store.captureCurrentPersonalStorage();
  const { OnboardingModal } = await import("@/components/OnboardingModal"); render = () => OnboardingModal({ enabled, onDone: done });
});
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); resetHooks(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

for (const locale of ["pl", "en"] as const) describe("C55 actual Onboarding " + locale, () => {
  it("connects each step title and a persistent name label without changing the input contract", async () => {
    let tree = await start(locale); const first = observe("step1-wiring", tree), field = input(tree);
    const association = nodes(tree).some(node => kind(node, "label") && !!field.props.id && node.props.htmlFor === field.props.id && text(node) === copy.step1Placeholder);
    tree = stepTwo(tree); const second = observe("step2-wiring", tree, { first, association });
    expect(first.titles).toEqual([copy.step1Title]); expect(second.titles).toEqual([copy.step2Title]);
    expect(nodes(tree).some(node => kind(node, "c55-content") && nodes(node).some(child => kind(child, "c55-title")))).toBe(true);
    expect(association).toBe(true); expect(field.props.placeholder).toBe(copy.step1Placeholder); expect(field.props.maxLength).toBe(32);
    expect(mutations()).toEqual([]); expect(done).not.toHaveBeenCalled(); expect(events).toBe(0);
  });
  it("visible Close and controlled dismissal are state-only and incomplete reload reopens", async () => {
    let tree = await start(locale); const before = new Map(bytes), beforeSession = new Map(session);
    const closeName = locale === "pl" ? "Zamknij wprowadzenie" : "Close onboarding";
    const close = nodes(tree).find(node => text(node.props.children) === closeName && (kind(node, "c55-close") || typeof node.props.onClick === "function"));
    const root = nodes(tree).find(node => kind(node, "c55-root"));
    const present = !!close;
    if (close?.props.onClick) close.props.onClick(); else if (close && root?.props.onOpenChange) root.props.onOpenChange(false);
    tree = settle(); const closed = observe("state-only-close", tree, { closeName, present });
    resetHooks(); tree = settle(); const reopens = !!openDialog(tree); observe("incomplete-remount", tree, { reopens });
    // A controlled false request is also how native Escape reaches the component; native keys are tested only in Chrome.
    nodes(tree).find(node => kind(node, "c55-root"))?.props.onOpenChange?.(false); tree = settle();
    observe("state-only-controlled-false", tree);
    expect(present).toBe(true); expect(closed.open).toBe(false); expect(reopens).toBe(true); expect(openDialog(tree)).toBeUndefined();
    expect(bytes).toEqual(before); expect(session).toEqual(beforeSession); expect(mutations()).toEqual([]); expect(done).not.toHaveBeenCalled();
    expect(fixture.notify).not.toHaveBeenCalled(); expect(events).toBe(0);
  });
  for (const action of ["finish", "skip"] as const) {
    it(action + " reports success only after the existing acknowledged profile save and retains progress", async () => {
      let tree = await start(locale); const before = new Map(bytes), beforeSession = new Map(session), ready = prepared(action, tree);
      expect(mutations()).toEqual([]); ready.handler(); tree = settle(); observe(action + "-success", tree);
      const profile = { name: action === "finish" ? "C55 synthetic" : "", goal: action === "finish" ? copy.goals[0] : "", setupDone: true };
      expect(bytes.get("coachfi-user")).toBe(JSON.stringify(profile)); expect(mutations()).toEqual([{ kind: "write", area: "local", key: "coachfi-user", value: JSON.stringify(profile) }]);
      expect(done).toHaveBeenCalledTimes(1); expect(events).toBe(1); expect(fixture.notify).toHaveBeenCalledExactlyOnceWith("profile"); expect(openDialog(tree)).toBeUndefined();
      preserved(before, beforeSession); resetHooks(); tree = settle(); observe(action + "-completed-remount", tree); expect(openDialog(tree)).toBeUndefined(); expect(mutations()).toHaveLength(1);
    });
    it(action + " write denial keeps the actual dialog and localized error without a success callback", async () => {
      let tree = await start(locale); const before = new Map(bytes), beforeSession = new Map(session), ready = prepared(action, tree);
      denyWrite = true; ready.handler(); tree = settle(); observe(action + "-denied", tree);
      expect(openDialog(tree)).toBeDefined(); const alerts = nodes(tree).filter(node => node.props.role === "alert"); expect(alerts).toHaveLength(1);
      expect(text(alerts[0])).toBe(locale === "pl" ? "Nie udało się zapisać danych lokalnych. Spróbuj ponownie." : "Local data could not be saved. Please try again.");
      expect(bytes).toEqual(before); expect(session).toEqual(beforeSession); expect(mutations().map(item => item.kind)).toEqual(["denied"]);
      expect(done).not.toHaveBeenCalled(); expect(events).toBe(0); expect(fixture.notify).not.toHaveBeenCalled();
    });
    it(action + " captured retired-owner handler cannot mutate the later scope or call onDone", async () => {
      let tree = await start(locale); const ready = prepared(action, tree), old = fixture.storage;
      const store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "guest" }).publishReady();
      bytes.set("coachfi-user", '{"name":"C55_LATER_SCOPE","goal":"retained","setupDone":false}'); const before = new Map(bytes), beforeSession = new Map(session);
      expect(old.isCurrent()).toBe(false); ready.handler(); tree = settle(); observe(action + "-retired-owner", tree, { oldRevision: old.revision, currentRevision: store.getStorageOwnershipSnapshot().revision });
      expect(bytes).toEqual(before); expect(session).toEqual(beforeSession); expect(mutations()).toEqual([]); expect(done).not.toHaveBeenCalled(); expect(events).toBe(0); expect(fixture.notify).not.toHaveBeenCalled();
    });
  }
  it("disabled and already-complete mount controls remain closed without writes", async () => {
    enabled = false; let tree = await start(locale); const disabled = observe("disabled-mount", tree); resetHooks(); enabled = true;
    bytes.set("coachfi-user", '{"name":"C55_COMPLETED","goal":"education","setupDone":true}'); tree = settle(); const completed = observe("already-complete-mount", tree);
    expect(disabled.open).toBe(false); expect(completed.open).toBe(false); expect(mutations()).toEqual([]); expect(done).not.toHaveBeenCalled(); expect(events).toBe(0);
  });
});
