import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ModeRecord } from "@/context/ModeContext";

type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
type ModeValue = {
  loaded: boolean; modeRecord: ModeRecord | null; settingsOpen: boolean;
  selectAdultMode(): unknown; openSettings(): void;
};
const fixture = vi.hoisted(() => ({
  locale: "pl" as "pl" | "en", pathname: "/adult", frame: "provider", cursor: 0, changed: false,
  frames: new Map<string, Slot[]>(), effects: [] as Array<() => void>, mode: null as ModeValue | null,
  notify: vi.fn<(entity: import("@/lib/sync/syncQueue").SyncEntity, payload?: unknown) => void>(),
}));
vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  const cell = () => {
    const slots = fixture.frames.get(fixture.frame)!;
    const index = fixture.cursor++;
    return slots[index] ?? (slots[index] = {});
  };
  const changed = (a?: readonly unknown[], b?: readonly unknown[]) =>
    !a || !b || a.length !== b.length || a.some((value, index) => !Object.is(value, b[index]));
  const memo = (factory: () => unknown, deps: readonly unknown[]) => {
    const slot = cell();
    if (changed(slot.deps, deps)) { slot.value = factory(); slot.deps = deps; }
    return slot.value;
  };
  return { ...actual,
    useState: (initial: unknown) => {
      const slot = cell();
      if (!("value" in slot)) slot.value = typeof initial === "function" ? initial() : initial;
      return [slot.value, (next: unknown) => {
        const value = typeof next === "function" ? next(slot.value) : next;
        fixture.changed ||= !Object.is(slot.value, value); slot.value = value;
      }];
    },
    useMemo: memo, useRef: (initial: unknown) => memo(() => ({ current: initial }), []),
    useContext: () => fixture.mode,
    useEffect: (effect: () => void | (() => void), deps?: readonly unknown[]) => {
      const slot = cell();
      if (changed(slot.deps, deps)) {
        slot.deps = deps;
        fixture.effects.push(() => { slot.cleanup?.(); slot.cleanup = effect() || undefined; });
      }
    },
    useSyncExternalStore: (_subscribe: unknown, get: () => unknown) => get(),
  };
});
vi.mock("@/context/LanguageContext", () => ({ useLanguage: () => ({ locale: fixture.locale }) }));
vi.mock("@/context/ConsentContext", () => ({ useConsent: () => ({ loaded: true, requiredAccepted: true }) }));
vi.mock("next/navigation", () => ({ usePathname: () => fixture.pathname }));
vi.mock("@/components/ui/button", () => ({ Button: "button" }));
vi.mock("@radix-ui/react-dialog", () => Object.fromEntries(["Root", "Portal", "Overlay", "Content", "Title", "Description", "Close"]
  .map(name => [name, "age-" + name])));
vi.mock("@/lib/sync/syncQueue", async original => {
  const actual = await original<typeof import("@/lib/sync/syncQueue")>();
  return { ...actual, notifyCloud: fixture.notify.mockImplementation(actual.notifyCloud) };
});

type Props = { children?: unknown; role?: string; open?: boolean; checked?: boolean; disabled?: boolean;
  onClick?: () => void; onChange?: (event: { target: { checked: boolean } }) => void;
  onOpenChange?: (open: boolean) => void; onEscapeKeyDown?: (event: { preventDefault(): void }) => void;
  onInteractOutside?: (event: { preventDefault(): void }) => void };
type Node = ReactElement<Props>;
const MODE_KEY = "coachfi-mode-v1";
const LEGACY = '{"mode":"adult","selectedAt":"legacy"}';
const PRIVATE_ERROR = "SYNTHETIC_PRIVATE_STORAGE_DETAIL";
const ERROR_COPY = {
  pl: "Nie udało się potwierdzić zapisu deklaracji 18+ na tym urządzeniu. Spróbuj ponownie.",
  en: "Your 18+ declaration could not be confirmed as saved on this device. Please try again.",
};
const LIMITS = "Actual ModeProvider, ModeGate, useProductStorage, product-storage and strict adult-record validator; synthetic local/session Maps and throwing physical setter. Persistent hook scheduler and Radix/Button element adapters, with explicit required-consent/locale/path stubs. Not native modal/focus/AT, real age verification, Auth, cloud, staging or production acceptance.";
let store: typeof import("@/lib/product-storage");
let Provider: typeof import("@/context/ModeContext").ModeProvider;
let Gate: typeof import("@/components/ModeGate").ModeGate;
let isConfirmed: typeof import("@/lib/product-scope").hasAdultConfirmation;
let local: Map<string, string>, session: Map<string, string>;
let writes: Array<{ area: string; key: string; value: string }>;
let writeMode: ((key: string, value: string) => void) | null;
let fetchSpy: ReturnType<typeof vi.fn>;
const bytes = () => ({ local: [...local], session: [...session] });
function frame(name: string) {
  fixture.frame = name; fixture.cursor = 0;
  if (!fixture.frames.has(name)) fixture.frames.set(name, []);
}
function provider(): ModeValue {
  for (let pass = 0; pass < 6; pass++) {
    frame("provider"); fixture.changed = false;
    const node = Provider({ children: null }) as ReactElement<{ value: ModeValue }>;
    fixture.mode = node.props.value;
    for (const effect of fixture.effects.splice(0)) effect();
    if (!fixture.changed) return fixture.mode;
  }
  throw new Error("Age confirmation provider fixture did not settle");
}
function render(): Node { provider(); frame("gate"); return Gate({}) as Node; }
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.type === "age-Root" && node.props.open === false ? null : node.props.children)];
}
function text(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(text).join("");
  return value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : "";
}
function checkbox(tree = render()) { return nodes(tree).find(node => node.type === "input")!; }
function confirm(tree = render()) { return nodes(tree).find(node => node.type === "button" && typeof node.props.onClick === "function")!; }
function checked() { checkbox().props.onChange!({ target: { checked: true } }); }
function root(tree = render()) { return nodes(tree).find(node => node.type === "age-Root")!; }
const alerts = (tree: Node) => nodes(tree).filter(node => node.props.role === "alert").map(text);

beforeEach(async () => {
  vi.resetModules(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-22T10:00:00.000Z"));
  fixture.frames.clear(); fixture.effects.length = 0; fixture.mode = null; fixture.changed = false;
  fixture.locale = "pl"; fixture.pathname = "/adult"; fixture.notify.mockReset();
  local = new Map([[MODE_KEY, LEGACY], ["coachfi-consent-v1", "SYNTHETIC_REQUIRED_CONSENT"],
    ["coachfi-tokens", "00025"], ["coachfi-locale-v1", "pl"], ["unrelated", "SYNTHETIC_CANARY"]]);
  session = new Map([["unrelated-session", "SYNTHETIC_SESSION"]]); writes = []; writeMode = null;
  const physical = (values: Map<string, string>, area: string) => ({
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      writes.push({ area, key, value });
      if (area === "local" && key.endsWith(MODE_KEY) && writeMode) writeMode(key, value);
      else values.set(key, value);
    },
    removeItem: () => { throw new Error("No removal is permitted by this age-confirmation fixture"); },
    clear: () => { throw new Error("No storage clear is permitted by this age-confirmation fixture"); },
  });
  vi.stubGlobal("window", Object.assign(new EventTarget(), { localStorage: physical(local, "local"), sessionStorage: physical(session, "session") }));
  fetchSpy = vi.fn(() => { throw new Error("No network authorized in age-confirmation tests"); });
  vi.stubGlobal("fetch", fetchSpy);
  store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "guest" }).publishReady({ localOnly: true });
  Provider = (await import("@/context/ModeContext")).ModeProvider;
  Gate = (await import("@/components/ModeGate")).ModeGate;
  isConfirmed = (await import("@/lib/product-scope")).hasAdultConfirmation;
});
afterEach(() => {
  for (const slots of fixture.frames.values()) for (const slot of slots) slot.cleanup?.();
  expect(fetchSpy).not.toHaveBeenCalled(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks();
});

describe.each(["pl", "en"] as const)("recoverable age confirmation %s", locale => {
  it.each(["/adult", "/family"])("%s retains the 18+ gate on a physical quota failure and retries explicitly", pathname => {
    fixture.locale = locale; fixture.pathname = pathname;
    expect(provider().loaded).toBe(true); expect(provider().modeRecord).toBeNull();
    checked(); const before = bytes();
    writeMode = () => { throw new DOMException(PRIVATE_ERROR, "QuotaExceededError"); };
    expect(() => confirm().props.onClick!()).not.toThrow();
    const failed = render();
    expect(alerts(failed)).toEqual([ERROR_COPY[locale]]);
    expect(text(failed)).not.toContain(PRIVATE_ERROR);
    expect(root(failed).props.open).toBe(true); expect(checkbox(failed).props.checked).toBe(true);
    expect(provider().modeRecord).toBeNull(); expect(fixture.notify).not.toHaveBeenCalled(); expect(bytes()).toEqual(before);
    const content = nodes(failed).find(node => node.type === "age-Content")!;
    const preventDefault = vi.fn<() => void>();
    content.props.onEscapeKeyDown!({ preventDefault }); content.props.onInteractOutside!({ preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(2);
    root(failed).props.onOpenChange!(false); expect(root().props.open).toBe(true);
    writeMode = null; expect(() => confirm().props.onClick!()).not.toThrow();
    const accepted = provider(), finalTree = render();
    expect(isConfirmed(accepted.modeRecord)).toBe(true); expect(root(finalTree).props.open).toBe(false);
    expect(alerts(finalTree)).toEqual([]); expect(fixture.notify).toHaveBeenCalledExactlyOnceWith("profile");
    expect(JSON.parse(local.get(MODE_KEY)!)).toEqual(accepted.modeRecord);
    expect(bytes()).toEqual({ local: before.local.map(([key, value]) => [key, key === MODE_KEY ? local.get(key)! : value]), session: before.session });
    expect(writes.map(write => [write.area, write.key])).toEqual([["local", MODE_KEY], ["local", MODE_KEY]]);
    expect(LIMITS).toContain("Not native modal/focus/AT");
  });
});

describe("adult confirmation provider refusals", () => {
  it("does not write or progress before the separate 18+ checkbox is checked", () => {
    const before = bytes(), button = confirm(); expect(button.props.disabled).toBe(true);
    button.props.onClick!(); expect(provider().modeRecord).toBeNull(); expect(writes).toEqual([]);
    expect(bytes()).toEqual(before); expect(alerts(render())).toEqual([]); expect(fixture.notify).not.toHaveBeenCalled();
  });
  it("returns explicit false for a thrown storage SecurityError, keeping the record and settings intact", () => {
    provider().openSettings(); provider(); const before = bytes();
    writeMode = () => { throw new DOMException(PRIVATE_ERROR, "SecurityError"); };
    expect(provider().selectAdultMode()).toBe(false);
    expect(provider()).toMatchObject({ modeRecord: null, settingsOpen: true });
    expect(bytes()).toEqual(before); expect(fixture.notify).not.toHaveBeenCalled();
  });
  it("a retained callback refuses a later owner's scope without writes or state adoption", () => {
    const old = provider();
    store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "SYNTHETIC_AGE_OWNER_B" }).publishReady({ localOnly: true });
    const before = bytes(); expect(old.selectAdultMode()).toBe(false);
    expect(bytes()).toEqual(before); expect(writes).toEqual([]); expect(provider().modeRecord).toBeNull();
    expect(fixture.notify).not.toHaveBeenCalled();
  });
  it("a write that changes owners is refused even if the old namespace received bytes", () => {
    checked();
    writeMode = (key, value) => {
      local.set(key, value);
      store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "SYNTHETIC_AGE_OWNER_B" }).publishReady({ localOnly: true });
    };
    expect(() => confirm().props.onClick!()).not.toThrow();
    expect(provider().modeRecord).toBeNull(); expect(root().props.open).toBe(true);
    expect(alerts(render())).toEqual([ERROR_COPY.pl]); expect(fixture.notify).not.toHaveBeenCalled();
    expect(local.get("coachfi-owned:v1:cdp:SYNTHETIC_AGE_OWNER_B:" + MODE_KEY)).toBeUndefined();
    expect(writes).toHaveLength(1); expect(writes[0].key).toBe(MODE_KEY);
  });
});
