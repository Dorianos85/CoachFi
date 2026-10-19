import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

type HookSlot = { value?: unknown; setter?: (next: unknown) => void; ref?: { current: unknown };
  callback?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
const fixture = vi.hoisted(() => ({ storage: null as unknown as PersonalStorageHandle,
  effects: [] as Array<() => void>, layouts: [] as Array<() => void>, slots: [] as HookSlot[],
  stateSet: vi.fn(), cursor: 0, dirty: false }));
function sameDependencies(before: readonly unknown[] | undefined, after: readonly unknown[] | undefined) {
  return before !== undefined && after !== undefined && before.length === after.length && before.every((value, index) => Object.is(value, after[index]));
}
function registerEffect(effect: () => void | (() => void), deps: readonly unknown[] | undefined, layout: boolean) {
  const index = fixture.cursor++, previous = fixture.slots[index];
  if (previous && sameDependencies(previous.deps, deps)) return;
  const slot = previous ?? {}; fixture.slots[index] = slot; slot.deps = deps;
  (layout ? fixture.layouts : fixture.effects).push(() => {
    slot.cleanup?.(); const cleanup = effect(); slot.cleanup = typeof cleanup === "function" ? cleanup : undefined;
  });
}
vi.mock("react", async (original) => ({ ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = fixture.cursor++;
    if (!fixture.slots[index]) {
      const slot: HookSlot = { value: typeof initial === "function" ? (initial as () => unknown)() : initial };
      slot.setter = (next: unknown) => {
        fixture.stateSet(next);
        const value = typeof next === "function" ? (next as (previous: unknown) => unknown)(slot.value) : next;
        if (!Object.is(value, slot.value)) { slot.value = value; fixture.dirty = true; }
      };
      fixture.slots[index] = slot;
    }
    const slot = fixture.slots[index]; return [slot.value, slot.setter];
  },
  useRef: (initial: unknown) => {
    const index = fixture.cursor++; if (!fixture.slots[index]) fixture.slots[index] = { ref: { current: initial } };
    return fixture.slots[index].ref;
  },
  useEffect: (effect: () => void | (() => void), deps?: readonly unknown[]) => registerEffect(effect, deps, false),
  useLayoutEffect: (effect: () => void | (() => void), deps?: readonly unknown[]) => registerEffect(effect, deps, true),
  useCallback: (callback: unknown, deps?: readonly unknown[]) => {
    const index = fixture.cursor++, previous = fixture.slots[index];
    if (!previous || !sameDependencies(previous.deps, deps)) fixture.slots[index] = { callback, deps };
    return fixture.slots[index].callback;
  },
}));
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: fixture.storage }) }));
vi.mock("@/context/LanguageContext", () => ({ useLanguage: () => ({ locale: "pl", t: { coach: {
  eyebrow: "", title: "", description: "", placeholder: "", send: "", quickActions: "" } } }) }));
vi.mock("@/context/ConsentContext", () => ({ useConsent: () => ({ hasOptionalConsent: () => false, openSettings: vi.fn() }) }));
vi.mock("@/context/VoiceContext", () => ({ useVoice: () => ({ isPlaying: false, currentText: "", stop: vi.fn() }) }));
vi.mock("@/components/ui/button", () => ({ Button: () => null }));

function submit(node: unknown): ((event: { preventDefault(): void }) => void) | undefined {
  if (Array.isArray(node)) return node.map(submit).find(Boolean);
  if (!node || typeof node !== "object") return;
  const element = node as ReactElement<{ onSubmit?: (event: { preventDefault(): void }) => void; children?: unknown }>;
  return element.props?.onSubmit ?? submit(element.props?.children);
}

function inputChange(node: unknown): ((event: { target: { value: string } }) => void) | undefined {
  if (Array.isArray(node)) return node.map(inputChange).find(Boolean);
  if (!node || typeof node !== "object") return;
  const element = node as ReactElement<{ onChange?: (event: { target: { value: string } }) => void; children?: unknown }>;
  return element.type === "input" ? element.props.onChange : inputChange(element.props?.children);
}
function mountPage(Page: () => ReactElement) {
  let tree: ReactElement;
  const render = () => { fixture.cursor = 0; fixture.dirty = false; tree = Page(); };
  const settle = () => {
    for (let attempt = 0; attempt < 20; attempt++) {
      const layouts = fixture.layouts.splice(0); layouts.forEach(effect => effect());
      const effects = fixture.effects.splice(0); effects.forEach(effect => effect());
      if (fixture.dirty) { render(); continue; }
      if (fixture.layouts.length === 0 && fixture.effects.length === 0) return tree!;
    }
    throw new Error("FIXTURE_DID_NOT_SETTLE");
  };
  render(); settle();
  return {
    draft: (value: string) => {
      const change = inputChange(tree); expect(change).toBeTypeOf("function"); change?.({ target: { value } });
      if (fixture.dirty) render(); return settle();
    },
    settle: () => { if (fixture.dirty) render(); return settle(); },
    unmount: () => { [...fixture.slots].reverse().forEach(slot => slot.cleanup?.()); },
  };
}

describe("independent actual CoachPage stale owner callback", () => {
  beforeEach(() => {
    vi.resetModules(); vi.clearAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-14T12:00:00.000Z"));
    fixture.effects.length = 0; fixture.layouts.length = 0; fixture.slots.length = 0; fixture.cursor = 0; fixture.dirty = false;
    const data = new Map<string, string>(), bus = new EventTarget();
    const localStorage = { getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } };
    vi.stubGlobal("window", { localStorage, sessionStorage: localStorage,
      addEventListener: bus.addEventListener.bind(bus), removeEventListener: bus.removeEventListener.bind(bus), dispatchEvent: bus.dispatchEvent.bind(bus) });
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No network allowed."); }));
  });
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("retained A submit cannot open/credit B conversation or produce old state after owner changed", async () => {
    const store = await import("@/lib/product-storage");
    store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A" }).publishReady();
    fixture.storage = store.captureCurrentPersonalStorage();
    const { default: CoachPage } = await import("@/app/coach/page");
    const mounted = mountPage(CoachPage);
    const oldSubmit = submit(mounted.draft("FIXTURE_PRIVATE_A_TEXT")); expect(oldSubmit).toBeTypeOf("function");
    store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B" }).publishReady();
    fixture.stateSet.mockClear(); oldSubmit?.({ preventDefault() {} });
    await vi.advanceTimersByTimeAsync(100);
    const gate = await import("@/lib/signInGate");
    expect(gate.getAgentConversationMs(store.captureCurrentPersonalStorage())).toBe(0);
    expect(fixture.stateSet).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
    mounted.unmount();
  });
  it("current eligible submit calibration starts actual local reply and timer before owner loss", async () => {
    const store = await import("@/lib/product-storage");
    store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A" }).publishReady();
    fixture.storage = store.captureCurrentPersonalStorage();
    const { default: CoachPage } = await import("@/app/coach/page");
    const mounted = mountPage(CoachPage), activeSubmit = submit(mounted.draft("FIXTURE_PRIVATE_A_TEXT"));
    expect(activeSubmit).toBeTypeOf("function"); fixture.stateSet.mockClear(); activeSubmit?.({ preventDefault() {} });
    const gate = await import("@/lib/signInGate");
    expect(gate.getAgentConversationStatus(fixture.storage)).toBe("counting");
    await vi.advanceTimersByTimeAsync(650); mounted.settle();
    expect(gate.getAgentConversationMs(fixture.storage)).toBe(650);
    const messages = fixture.slots[0].value as Array<{ role: string; text: string; streaming?: boolean }>;
    expect(messages.some(message => message.role === "user" && message.text === "FIXTURE_PRIVATE_A_TEXT")).toBe(true);
    expect(messages.some(message => message.role === "coach" && message.streaming && message.text.length > 0)).toBe(true);
    expect(fixture.stateSet).toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled(); mounted.unmount();
  });

});
