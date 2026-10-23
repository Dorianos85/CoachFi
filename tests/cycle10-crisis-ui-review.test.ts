import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

type Effect = () => void | (() => void);
const fixture = vi.hoisted(() => ({ locale: "pl" as import("@/lib/i18n").Locale, slot: 0,
  storage: null as unknown as PersonalStorageHandle, values: new Map<number, unknown>(),
  memos: new Map<number, { deps?: readonly unknown[]; value: unknown }>(), effects: [] as Effect[],
  effectDeps: new Map<number, readonly unknown[] | undefined>(), cleanups: new Map<number, () => void>(), setState: vi.fn(),
}));
const sameDeps = (a?: readonly unknown[], b?: readonly unknown[]) => !!a && !!b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
function memo(factory: () => unknown, deps?: readonly unknown[]) {
  const index = fixture.slot++, previous = fixture.memos.get(index);
  if (!previous || !sameDeps(previous.deps, deps)) fixture.memos.set(index, { deps, value: factory() });
  return fixture.memos.get(index)?.value;
}
function effect(callback: Effect, deps?: readonly unknown[]) {
  const index = fixture.slot++;
  if (!fixture.effectDeps.has(index) || !sameDeps(fixture.effectDeps.get(index), deps)) fixture.effects.push(() => {
    fixture.cleanups.get(index)?.(); fixture.cleanups.delete(index);
    const cleanup = callback(); if (typeof cleanup === "function") fixture.cleanups.set(index, cleanup);
  });
  fixture.effectDeps.set(index, deps);
}
vi.mock("react", async original => ({ ...await original<typeof import("react")>(),
  useMemo: (factory: () => unknown, deps?: readonly unknown[]) => memo(factory, deps),
  useCallback: (callback: unknown, deps?: readonly unknown[]) => memo(() => callback, deps),
  useRef: (initial: unknown) => memo(() => ({ current: initial }), []),
  useEffect: (callback: Effect, deps?: readonly unknown[]) => effect(callback, deps),
  useLayoutEffect: (callback: Effect, deps?: readonly unknown[]) => effect(callback, deps),
  useState: (initial: unknown) => {
    const index = fixture.slot++; if (!fixture.values.has(index)) fixture.values.set(index, typeof initial === "function" ? initial() : initial);
    return [fixture.values.get(index), (value: unknown) => { fixture.setState(value);
      fixture.values.set(index, typeof value === "function" ? value(fixture.values.get(index)) : value); }];
  },
}));
vi.mock("@/context/LanguageContext", () => ({ useLanguage: () => ({ locale: fixture.locale }) }));
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: fixture.storage }) }));
type Props = { children?: unknown; role?: string; disabled?: boolean; onClick?: () => void; "data-testid"?: string;
  step?: { id: string; title: string; body: string }; done?: boolean; onDone?: () => void };
function nodes(node: unknown): Array<ReactElement<Props>> {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as ReactElement<Props>; return [element, ...nodes(element.props.children)];
}
function text(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join("");
  return node && typeof node === "object" && "props" in node ? text((node as ReactElement<Props>).props.children) : "";
}
const IDS = ["write-close-person", "call-creditor", "book-free-legal", "contact-mops", "sell-unused"] as const;
const KEY = "coachfi-crisis-actions";
type Fault = "none" | "actions-read" | "token-read" | "token-after" | "marker-before" | "marker-after";
let bytes: Map<string, string>, writes: Array<{ key: string; value: string }>, fault: Fault, reenter: (() => void) | undefined;
let render: () => ReactElement;
const alerts = (tree: unknown) => nodes(tree).filter(node => node.props.role === "alert");
const message = (tree: unknown) => { const alert = alerts(tree)[0]; return alert?.type === "p" ? text(alert) : text(nodes(alert?.props.children).find(node => node.type === "p")); };
const copy = {
  pl: { unavailable: "Nie można odczytać zapisanych działań. Nowe oznaczenia i punkty są zablokowane. Sprawdź odczyt ponownie.",
    retry: "Nie udało się zapisać działania. Nie przyznano nowych punktów. Możesz spróbować ponownie.",
    uncertain: "Nie udało się potwierdzić pełnego zapisu. Oznaczenie działania lub punkty mogły zostać zapisane częściowo. Nie ponawiaj tego działania. Pozostałe oznaczenia są zablokowane w tym widoku." },
  en: { unavailable: "Saved actions could not be read. New action marks and points are blocked. Check the data again.",
    retry: "The action could not be saved. No new points were awarded. You can try again.",
    uncertain: "The full save could not be confirmed. The action mark or points may have been partially saved. Do not retry this action. Other action marks are blocked in this view." },
};
function action(tree: unknown, id: string) {
  const node = nodes(tree).find(node => node.props.step?.id === id && node.props.onDone); expect(node).toBeDefined(); return node!;
}
function button(tree: unknown, id: string) {
  const node = action(tree, id); expect(typeof node.type).toBe("function");
  // Execute the real pure ActionStep; do not replace its disabled or done-label behavior.
  const row = (node.type as (props: Props) => unknown)(node.props);
  const result = nodes(row).find(node => node.props.onClick); expect(result).toBeDefined(); return result!;
}
function settle() {
  let tree = render();
  for (let i = 0; i < 8 && fixture.effects.length; i++) { fixture.effects.splice(0).forEach(callback => callback()); tree = render(); }
  expect(fixture.effects).toHaveLength(0); expect(nodes(tree).filter(node => node.props.step && node.props.onDone)).toHaveLength(5); return tree;
}
function doneIds(tree: unknown) { return IDS.filter(id => action(tree, id).props.done === true); }
function invoke(tree: unknown, id: string) { action(tree, id).props.onDone!(); return settle(); }
function allLocked(tree: unknown) { for (const id of IDS) expect(button(tree, id).props.disabled).toBe(true); }

beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
  fixture.locale = "pl"; fixture.slot = 0; fixture.values.clear(); fixture.memos.clear(); fixture.effectDeps.clear(); fixture.cleanups.clear(); fixture.effects.length = 0;
  bytes = new Map([["coachfi-tokens", "125"]]); writes = []; fault = "none"; reenter = undefined;
  const storage = { getItem: (key: string) => {
    if ((key === KEY && fault === "actions-read") || (key === "coachfi-tokens" && fault === "token-read")) { fault = "none"; throw new Error("FIXTURE read refused before writer"); }
    return bytes.get(key) ?? null;
  }, setItem: (key: string, value: string) => {
    writes.push({ key, value }); if (key === KEY && fault === "marker-before") { fault = "none"; throw new Error("FIXTURE marker refused before bytes"); }
    bytes.set(key, value); if (key === "coachfi-tokens" && reenter) { const callback = reenter; reenter = undefined; callback(); }
    if ((key === KEY && fault === "marker-after") || (key === "coachfi-tokens" && fault === "token-after")) { fault = "none"; throw new Error("FIXTURE writer changed bytes then threw"); }
  }, removeItem: (key: string) => { bytes.delete(key); } };
  const windowStub = new EventTarget() as EventTarget & { localStorage: typeof storage; sessionStorage: typeof storage };
  Object.assign(windowStub, { localStorage: storage, sessionStorage: storage }); vi.stubGlobal("window", windowStub);
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No real network permitted."); }));
  const store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "guest" }).publishReady(); fixture.storage = store.captureCurrentPersonalStorage();
  const { default: CrisisPage } = await import("@/app/crisis/page"); render = () => { fixture.slot = 0; return CrisisPage(); };
});
afterEach(() => { fixture.cleanups.forEach(callback => callback()); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("independent B20 actual CrisisPage and pure ActionStep gates", () => {
  it.each(IDS)("%s completion appears only after one confirmed15-point reward", async id => {
    let tree = settle(); const old = action(tree, id).props.onDone!; tree = invoke(tree, id);
    expect(alerts(tree)).toHaveLength(0); expect(doneIds(tree)).toEqual([id]); expect(button(tree, id).props.disabled).toBe(true);
    expect(bytes.get("coachfi-tokens")).toBe("140"); expect(JSON.parse(bytes.get(KEY)!)).toEqual([id]);
    const count = writes.length, before = new Map(bytes); fixture.setState.mockClear(); old();
    expect(bytes).toEqual(before); expect(writes).toHaveLength(count); expect(fixture.setState).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it.each(["pl", "en"] as const)("%s sequential distinct actions preserve all prior ids and correct balance", async locale => {
    fixture.locale = locale; let tree = settle(); tree = invoke(tree, IDS[0]); tree = invoke(tree, IDS[1]);
    expect(doneIds(tree)).toEqual(IDS.slice(0, 2)); expect(JSON.parse(bytes.get(KEY)!)).toEqual(IDS.slice(0, 2)); expect(bytes.get("coachfi-tokens")).toBe("155");
    expect(writes.filter(value => value.key === "coachfi-tokens")).toEqual([{ key: "coachfi-tokens", value: "140" }, { key: "coachfi-tokens", value: "155" }]);
    const { CRISIS_COPY } = await import("@/lib/crisisCopy"); expect(text(button(tree, IDS[0]))).toBe(CRISIS_COPY[locale]!.firstDay.done);
    expect(button(tree, IDS[2]).props.disabled).not.toBe(true);
  });
  it.each(["pl", "en"] as const)("%s read denial before writes allows explicit retry without false done", async locale => {
    fixture.locale = locale; let tree = settle(); fault = "actions-read"; tree = invoke(tree, IDS[0]);
    expect(alerts(tree)).toHaveLength(1); expect(doneIds(tree)).toHaveLength(0); expect(writes).toHaveLength(0); expect(bytes.get("coachfi-tokens")).toBe("125");
    expect(message(tree)).toBe(copy[locale].retry);
    expect(button(tree, IDS[0]).props.disabled).not.toBe(true); tree = invoke(tree, IDS[0]);
    expect(alerts(tree)).toHaveLength(0); expect(doneIds(tree)).toEqual([IDS[0]]); expect(bytes.get("coachfi-tokens")).toBe("140");
    expect(writes.filter(value => value.key === "coachfi-tokens")).toHaveLength(1);
  });
  it.each(["pl", "en"] as const)("%s reward write-then-throw quarantines all five actions and old callbacks", async locale => {
    fixture.locale = locale; let tree = settle(); const oldCallbacks = IDS.map(id => action(tree, id).props.onDone!); fault = "token-after"; tree = invoke(tree, IDS[0]);
    expect(alerts(tree)).toHaveLength(1); expect(doneIds(tree)).toHaveLength(0); expect(bytes.get("coachfi-tokens")).toBe("140"); allLocked(tree);
    expect(message(tree)).toBe(copy[locale].uncertain);
    const before = new Map(bytes), count = writes.length; oldCallbacks.forEach(callback => callback()); for (const id of IDS) action(tree, id).props.onDone!(); tree = settle();
    expect(bytes).toEqual(before); expect(writes).toHaveLength(count); expect(doneIds(tree)).toHaveLength(0); allLocked(tree);
  });
  it.each(["pl", "en"] as const)("%s attempted marker refusal globally quarantines without false completion", async locale => {
    fixture.locale = locale; let tree = settle(); fault = "marker-before"; tree = invoke(tree, IDS[0]);
    expect(alerts(tree)).toHaveLength(1); expect(doneIds(tree)).toHaveLength(0); allLocked(tree); expect(writes.filter(value => value.key === KEY)).toHaveLength(1);
    expect(message(tree)).toBe(copy[locale].uncertain);
    const before = new Map(bytes), count = writes.length; for (const id of IDS) action(tree, id).props.onDone!(); expect(bytes).toEqual(before); expect(writes).toHaveLength(count);
  });
  it.each(["pl", "en"] as const)("%s malformed points are preserved and reject before either writer", async locale => {
    fixture.locale = locale; bytes.set("coachfi-tokens", "25garbage"); let tree = settle(); tree = invoke(tree, IDS[0]);
    expect(alerts(tree)).toHaveLength(1); expect(doneIds(tree)).toHaveLength(0); expect(bytes.get("coachfi-tokens")).toBe("25garbage"); expect(bytes.has(KEY)).toBe(false); expect(writes).toHaveLength(0);
    expect(message(tree)).toBe(copy[locale].retry);
  });
  it.each(["{}", "null", "123", '["unknown"]', '["write-close-person",1]', '["write-close-person","write-close-person"]'])("malformed cache %s is unavailable and never guessed empty", async raw => {
    bytes.set(KEY, raw); const tree = settle(); expect(alerts(tree)).toHaveLength(1); expect(doneIds(tree)).toHaveLength(0); allLocked(tree);
    expect(message(tree)).toBe(copy.pl.unavailable);
    for (const id of IDS) action(tree, id).props.onDone!(); expect(bytes.get(KEY)).toBe(raw); expect(bytes.get("coachfi-tokens")).toBe("125"); expect(writes).toHaveLength(0);
  });
  it("locale change does not clear global quarantine or permit a different action", async () => {
    let tree = settle(); fault = "token-after"; tree = invoke(tree, IDS[0]); fixture.locale = "en"; tree = settle();
    expect(alerts(tree)).toHaveLength(1); allLocked(tree); const before = new Map(bytes), count = writes.length;
    expect(message(tree)).toBe(copy.en.uncertain);
    for (const id of IDS) action(tree, id).props.onDone!(); expect(bytes).toEqual(before); expect(writes).toHaveLength(count); expect(doneIds(settle())).toHaveLength(0);
  });
  it("fresh cache includes externally recorded known action before adding another", async () => {
    let tree = settle(); bytes.set(KEY, JSON.stringify([IDS[4]])); tree = invoke(tree, IDS[0]);
    expect(new Set(JSON.parse(bytes.get(KEY)!))).toEqual(new Set([IDS[4], IDS[0]])); expect(doneIds(tree)).toEqual([IDS[0], IDS[4]]); expect(bytes.get("coachfi-tokens")).toBe("140");
  });
  it("all five distinct confirmed actions end with five markers and200points", async () => {
    let tree = settle(); for (const id of IDS) tree = invoke(tree, id);
    expect(doneIds(tree)).toEqual([...IDS]); expect(JSON.parse(bytes.get(KEY)!)).toEqual([...IDS]); expect(bytes.get("coachfi-tokens")).toBe("200"); allLocked(tree);
    expect(writes.filter(value => value.key === "coachfi-tokens")).toHaveLength(5);
  });
  it("owner replacement rejects old callbacks and preserves synthetic B bytes", async () => {
    const tree = settle(), old = IDS.map(id => action(tree, id).props.onDone!); const store = await import("@/lib/product-storage");
    const b = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B20_B" }); b.storage.setItem("coachfi-tokens", "77"); b.publishReady({ localOnly: true }); fixture.storage = store.captureCurrentPersonalStorage(); settle();
    const before = new Map(bytes), count = writes.length; fixture.setState.mockClear(); old.forEach(callback => callback());
    expect(bytes).toEqual(before); expect(writes).toHaveLength(count); expect(fixture.setState).not.toHaveBeenCalled(); expect(fixture.storage.getItem("coachfi-tokens")).toBe("77"); expect(fixture.storage.getItem(KEY)).toBeNull();
  });
  it("component disposal invalidates all captured handlers before writes", async () => {
    const tree = settle(), old = IDS.map(id => action(tree, id).props.onDone!); fixture.cleanups.forEach(callback => callback()); fixture.cleanups.clear(); fixture.setState.mockClear();
    old.forEach(callback => callback()); expect(writes).toHaveLength(0); expect(fixture.setState).not.toHaveBeenCalled(); expect(bytes.get("coachfi-tokens")).toBe("125");
  });
  it("in-flight reentry cannot record a second distinct action during the first reward", async () => {
    let tree = settle(); reenter = action(tree, IDS[1]).props.onDone; tree = invoke(tree, IDS[0]);
    expect(doneIds(tree)).toEqual([IDS[0]]); expect(JSON.parse(bytes.get(KEY)!)).toEqual([IDS[0]]); expect(bytes.get("coachfi-tokens")).toBe("140");
    expect(writes.filter(value => value.key === "coachfi-tokens")).toHaveLength(1);
  });
});
