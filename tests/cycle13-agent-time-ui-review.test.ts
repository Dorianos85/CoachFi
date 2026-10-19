import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

type Effect = () => void | (() => void);
const fixture = vi.hoisted(() => ({ locale: "pl" as import("@/lib/i18n").Locale, slot: 0,
  storage: null as unknown as PersonalStorageHandle, values: new Map<number, unknown>(),
  memos: new Map<number, { deps?: readonly unknown[]; value: unknown }>(),
  effects: [] as Effect[], effectDeps: new Map<number, readonly unknown[] | undefined>(), cleanups: new Map<number, () => void>(),
  denyAgentRead: false, denyAgentWrite: false, stopVoice: vi.fn(), openSettings: vi.fn(),
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
    const index = fixture.slot++;
    if (!fixture.values.has(index)) fixture.values.set(index, typeof initial === "function" ? initial() : initial);
    return [fixture.values.get(index), (value: unknown) => fixture.values.set(index, typeof value === "function" ? value(fixture.values.get(index)) : value)];
  },
}));
vi.mock("@/context/LanguageContext", async () => {
  const { translations } = await import("@/lib/i18n");
  return { useLanguage: () => ({ locale: fixture.locale, t: translations[fixture.locale] }) };
});
vi.mock("@/context/ConsentContext", () => ({ useConsent: () => ({ hasOptionalConsent: () => false, openSettings: fixture.openSettings }) }));
vi.mock("@/context/VoiceContext", () => ({ useVoice: () => ({ isPlaying: false, currentText: "", stop: fixture.stopVoice }) }));
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: fixture.storage }) }));
vi.mock("@/lib/client/api-credentials", () => ({ getApiCredentials: vi.fn(() => { throw Error("External credentials forbidden in fixture"); }) }));

type Props = { children?: unknown; role?: string; value?: string; disabled?: boolean; "aria-label"?: string; "data-testid"?: string;
  onClick?: () => void; onSubmit?: (event: { preventDefault(): void }) => void; onChange?: (event: { target: { value: string } }) => void };
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
const KEY = "coachfi-agent-ms";
let bytes: Map<string, string>, writes: Array<{ key: string; value: string }>, render: () => ReactElement;
function resetHooks() {
  for (const cleanup of fixture.cleanups.values()) { try { cleanup(); } catch { /* a tested old cleanup failure is preserved in its assertion */ } }
  fixture.values.clear(); fixture.memos.clear(); fixture.effectDeps.clear(); fixture.cleanups.clear(); fixture.effects.length = 0; fixture.slot = 0;
}
function settle() {
  let tree = render(); for (let i = 0; i < 8 && fixture.effects.length; i++) { fixture.effects.splice(0).forEach(callback => callback()); tree = render(); }
  expect(fixture.effects).toHaveLength(0); return tree;
}
async function copy() { return (await import("@/lib/localizedContent")).getLocalizedContent(fixture.locale).coach; }
function quick(tree: unknown, label: string) { const button = nodes(tree).find(node => node.props.onClick && text(node) === label); expect(button).toBeDefined(); return button!.props.onClick!; }
async function finishLocal() { await vi.advanceTimersByTimeAsync(15000); return settle(); }
beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z")); resetHooks(); fixture.locale = "pl"; fixture.denyAgentRead = false; fixture.denyAgentWrite = false;
  bytes = new Map([[KEY, "100"], ["coachfi-tokens", "125"]]); writes = [];
  const storage = { getItem: (key: string) => { if (key === KEY && fixture.denyAgentRead) throw Error("FIXTURE agent-time read denial"); return bytes.get(key) ?? null; },
    setItem: (key: string, value: string) => { writes.push({ key, value }); if (key === KEY && fixture.denyAgentWrite) throw Error("FIXTURE agent-time write denial"); bytes.set(key, value); }, removeItem: (key: string) => bytes.delete(key) };
  const windowStub = new EventTarget(); Object.assign(windowStub, { localStorage: storage, sessionStorage: storage }); vi.stubGlobal("window", windowStub);
  vi.stubGlobal("fetch", vi.fn(() => { throw Error("No real network permitted"); }));
  const store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "guest" }).publishReady(); fixture.storage = store.captureCurrentPersonalStorage();
  const { default: CoachPage } = await import("@/app/coach/page"); render = () => { fixture.slot = 0; return CoachPage(); };
});
afterEach(() => { resetHooks(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("independent B22 actual CoachPage failure boundaries", () => {
  it("begin timer reader refusal is contained while a local answer still completes", async () => {
    let tree = settle(); const localized = await copy(), label = localized.quickActions[0]; fixture.denyAgentRead = true;
    expect(() => quick(tree, label)()).not.toThrow(); tree = await finishLocal();
    expect(nodes(tree).filter(node => node.props.role === "alert")).toHaveLength(1);
    expect(text(tree)).toContain(localized.quickReplies[label] ?? localized.fallback);
    expect(bytes.get(KEY)).toBe("100"); expect(writes).toHaveLength(0); expect(fetch).not.toHaveBeenCalled();
  });
  it("end timer writer refusal during component cleanup does not escape", async () => {
    const tree = settle(), localized = await copy(); quick(tree, localized.quickActions[0])(); await vi.advanceTimersByTimeAsync(1000); fixture.denyAgentWrite = true;
    const cleanups = [...fixture.cleanups.values()]; fixture.cleanups.clear(); expect(() => cleanups.forEach(callback => callback())).not.toThrow();
    expect(bytes.get(KEY)).toBe("100"); expect(fetch).not.toHaveBeenCalled();
  });
});

const WARNING={pl:"Nie udało się potwierdzić naliczania czasu rozmowy. Licznik w tej rozmowie jest wstrzymany. Lokalne przykłady edukacyjne są nadal dostępne.",en:"Conversation time could not be confirmed. The timer is paused for this conversation. Local educational examples are still available."};
const LOCALES=["pl","en"] as const;
function warning(tree:unknown){const alert=nodes(tree).find(node=>node.props.role==="alert");expect(alert).toBeDefined();expect(alert!.props["data-testid"]).toBe("coach-time-warning");return text(alert);}
function inputNode(tree:unknown){const input=nodes(tree).find(node=>node.type==="input"&&node.props.onChange);expect(input).toBeDefined();return input!;}
function draft(tree:unknown,value:string){inputNode(tree).props.onChange!({target:{value}});return settle();}
function formSend(tree:unknown){const form=nodes(tree).find(node=>node.props.onSubmit);expect(form).toBeDefined();form!.props.onSubmit!({preventDefault(){}});return settle();}
function chatText(tree:unknown){return text(nodes(tree).find(node=>node.props["aria-label"]==="Coach chat"));}
function pagehide(){window.dispatchEvent(new Event("pagehide"));}
const agentWrites=()=>writes.filter(write=>write.key===KEY);

describe("independent B22 actual CoachPage local response with truthful timer failure",()=>{
 it.each(LOCALES.flatMap(locale=>["bad-time","1.5","9007199254740992"].map(raw=>({locale,raw}))))("$locale malformed duration $raw preserves bytes and still replies locally",async({locale,raw})=>{
  fixture.locale=locale;bytes.set(KEY,raw);let tree=settle();const localized=await copy(),label=localized.quickActions[0];quick(tree,label)();tree=await finishLocal();expect(warning(tree)).toBe(WARNING[locale]);expect(chatText(tree)).toContain(label);expect(chatText(tree)).toContain(localized.quickReplies[label]??localized.fallback);expect(inputNode(tree).props.disabled).toBe(false);expect(bytes.get(KEY)).toBe(raw);expect(agentWrites()).toHaveLength(0);expect(bytes.get("coachfi-tokens")).toBe("125");expect(fetch).not.toHaveBeenCalled();
 });
 it.each(LOCALES)("%s denied timer read preserves a typed local question and allows another answer",async locale=>{
  fixture.locale=locale;fixture.denyAgentRead=true;let tree=settle();tree=draft(tree,"FIXTURE_DENIED_FIRST");tree=formSend(tree);tree=await finishLocal();expect(warning(tree)).toBe(WARNING[locale]);expect(chatText(tree)).toContain("FIXTURE_DENIED_FIRST");expect(chatText(tree)).toContain((await copy()).fallback);tree=draft(tree,"FIXTURE_DENIED_SECOND");tree=formSend(tree);tree=await finishLocal();expect(chatText(tree)).toContain("FIXTURE_DENIED_FIRST");expect(chatText(tree)).toContain("FIXTURE_DENIED_SECOND");expect(inputNode(tree).props.disabled).toBe(false);expect(bytes.get(KEY)).toBe("100");expect(agentWrites()).toHaveLength(0);expect(fetch).not.toHaveBeenCalled();
 });
 it.each(LOCALES)("%s pagehide writer fault preserves draft/messages, quarantines timer and permits more local replies",async locale=>{
  fixture.locale=locale;let tree=settle();const localized=await copy();quick(tree,localized.quickActions[0])();tree=await finishLocal();tree=draft(tree,"FIXTURE_RETAINED_DRAFT");const messages=chatText(tree);fixture.denyAgentWrite=true;expect(()=>pagehide()).not.toThrow();tree=settle();expect(warning(tree)).toBe(WARNING[locale]);expect(inputNode(tree).props.value).toBe("FIXTURE_RETAINED_DRAFT");expect(chatText(tree)).toBe(messages);expect(bytes.get(KEY)).toBe("100");expect(agentWrites()).toHaveLength(1);
  const attempted=agentWrites().length;expect(()=>pagehide()).not.toThrow();tree=formSend(tree);tree=await finishLocal();expect(chatText(tree)).toContain("FIXTURE_RETAINED_DRAFT");expect(chatText(tree)).toContain(localized.fallback);expect(warning(tree)).toBe(WARNING[locale]);expect(agentWrites()).toHaveLength(attempted);expect(bytes.get(KEY)).toBe("100");expect(fetch).not.toHaveBeenCalled();
 });
 it.each(LOCALES)("%s healthy two local replies use a single elapsed clock and explicit pagehide acknowledgement",async locale=>{
  fixture.locale=locale;let tree=settle();const start=Date.now();tree=draft(tree,"FIXTURE_HEALTHY_FIRST");tree=formSend(tree);tree=await finishLocal();tree=draft(tree,"FIXTURE_HEALTHY_SECOND");tree=formSend(tree);tree=await finishLocal();expect(nodes(tree).filter(node=>node.props.role==="alert")).toHaveLength(0);expect(chatText(tree)).toContain("FIXTURE_HEALTHY_FIRST");expect(chatText(tree)).toContain("FIXTURE_HEALTHY_SECOND");pagehide();expect(bytes.get(KEY)).toBe(String(100+Date.now()-start));expect(bytes.get("coachfi-tokens")).toBe("125");expect(fetch).not.toHaveBeenCalled();
 });
 it.each(LOCALES)("%s locale does not clear paused timer even after synthetic bytes become valid",async locale=>{
  fixture.locale=locale;bytes.set(KEY,"bad-time");let tree=settle();quick(tree,(await copy()).quickActions[0])();tree=await finishLocal();expect(warning(tree)).toBe(WARNING[locale]);tree=draft(tree,"FIXTURE_LOCALE_DRAFT");bytes.set(KEY,"100");fixture.locale=locale==="pl"?"en":"pl";tree=settle();expect(warning(tree)).toBe(WARNING[fixture.locale as "pl"|"en"]);expect(inputNode(tree).props.value).toBe("FIXTURE_LOCALE_DRAFT");quick(tree,(await copy()).quickActions[0])();tree=await finishLocal();pagehide();expect(bytes.get(KEY)).toBe("100");expect(agentWrites()).toHaveLength(0);
 });
 it("captured old-locale quick action cannot publish stale local content",async()=>{
  let tree=settle();const captured=quick(tree,(await copy()).quickActions[0]);fixture.locale="en";tree=settle();const previous=chatText(tree),before=new Map(bytes),count=writes.length;captured();tree=await finishLocal();expect(chatText(tree)).toBe(previous);expect(bytes).toEqual(before);expect(writes).toHaveLength(count);expect(fetch).not.toHaveBeenCalled();
 });
 it("captured old-owner action cannot start timer or local work for the new owner",async()=>{
  let tree=settle();const captured=quick(tree,(await copy()).quickActions[0]);const store=await import("@/lib/product-storage"),lease=store.beginStorageOwner({kind:"account",provider:"cdp",userId:"FIXTURE_C13_B"});lease.publishReady({localOnly:true});fixture.storage=store.captureCurrentPersonalStorage();tree=settle();const previous=chatText(tree),before=new Map(bytes),count=writes.length;captured();tree=await finishLocal();expect(chatText(tree)).toBe(previous);expect(bytes).toEqual(before);expect(writes).toHaveLength(count);expect(fetch).not.toHaveBeenCalled();
 });
 it("owner replacement removes previous local chat history and unsent draft",async()=>{
  let tree=settle();tree=draft(tree,"FIXTURE_OWNER_A_MESSAGE");tree=formSend(tree);tree=await finishLocal();tree=draft(tree,"FIXTURE_OWNER_A_DRAFT");const store=await import("@/lib/product-storage"),lease=store.beginStorageOwner({kind:"account",provider:"cdp",userId:"FIXTURE_C13_B"});lease.publishReady({localOnly:true});fixture.storage=store.captureCurrentPersonalStorage();tree=settle();expect(chatText(tree)).not.toContain("FIXTURE_OWNER_A_MESSAGE");expect(inputNode(tree).props.value).toBe("");expect(fetch).not.toHaveBeenCalled();
 });
 it("duplicate captured quick action publishes only one user message and one local reply",async()=>{
  const tree=settle(),localized=await copy(),label=localized.quickActions[0],captured=quick(tree,label);captured();captured();const final=await finishLocal();expect(chatText(final).split(label).length-1).toBe(1);expect(chatText(final).split(localized.quickReplies[label]??localized.fallback).length-1).toBe(1);expect(fetch).not.toHaveBeenCalled();
 });
});

describe("independent B22 same-owner remount timer quarantine",()=>{
 it.each(LOCALES)("%s remount does not unlock unavailable timer while local replies remain usable",async locale=>{
  fixture.locale=locale;bytes.set(KEY,"bad-time");let tree=settle();quick(tree,(await copy()).quickActions[0])();tree=await finishLocal();expect(warning(tree)).toBe(WARNING[locale]);
  resetHooks();bytes.set(KEY,"100");tree=settle();quick(tree,(await copy()).quickActions[0])();tree=await finishLocal();expect(warning(tree)).toBe(WARNING[locale]);expect(chatText(tree)).toContain((await copy()).fallback);pagehide();expect(bytes.get(KEY)).toBe("100");expect(agentWrites()).toHaveLength(0);expect(fetch).not.toHaveBeenCalled();
 });
});
