import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";
import type { ConsentRecord, OptionalConsentKey } from "@/lib/consent";

// Only React scheduling and visual leaves are adapted. ConsentManager, the
// provider callbacks, consent validation and owner-bound storage remain real.
type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
type Actions = {
  consent: ConsentRecord | null; requiredAccepted: boolean; settingsOpen: boolean;
  openSettings(): void;
  acceptRequired(optional: Record<OptionalConsentKey, boolean>, storage?: PersonalStorageHandle): void;
  updateOptional(optional: Record<OptionalConsentKey, boolean>, storage?: PersonalStorageHandle): void;
};
const fixture = vi.hoisted(() => ({
  frames: new Map<string, Slot[]>(), active: "", cursor: 0,
  effects: [] as Array<() => void>, locale: "en", storage: null as unknown as PersonalStorageHandle,
  actions: null as unknown as Actions, forbiddenSdk: vi.fn(),
}));
vi.mock("react", async (original) => {
  const actual = await original<typeof import("react")>();
  const slot = () => {
    const frame = fixture.frames.get(fixture.active)!;
    const index = fixture.cursor++;
    return frame[index] ?? (frame[index] = {});
  };
  const changed = (old: readonly unknown[] | undefined, next: readonly unknown[] | undefined) =>
    !old || !next || old.length !== next.length || next.some((value, index) => !Object.is(value, old[index]));
  return { ...actual,
    useState: (initial: unknown) => {
      const cell = slot();
      if (!("value" in cell)) cell.value = typeof initial === "function" ? initial() : initial;
      return [cell.value, (next: unknown) => {
        cell.value = typeof next === "function" ? next(cell.value) : next;
      }];
    },
    useMemo: (create: () => unknown, deps: readonly unknown[]) => {
      const cell = slot();
      if (changed(cell.deps, deps)) { cell.value = create(); cell.deps = deps; }
      return cell.value;
    },
    useRef: (initial: unknown) => {
      const cell = slot();
      if (!("value" in cell)) cell.value = { current: initial };
      return cell.value;
    },
    useEffect: (effect: () => void | (() => void), deps?: readonly unknown[]) => {
      const cell = slot();
      if (changed(cell.deps, deps)) {
        cell.deps = deps;
        fixture.effects.push(() => { cell.cleanup?.(); cell.cleanup = effect() || undefined; });
      }
    },
  };
});
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: fixture.storage }) }));
vi.mock("@/context/ConsentContext", () => ({ useConsent: () => fixture.actions }));
vi.mock("@/context/LanguageContext", () => ({ useLanguage: () => ({ locale: fixture.locale }) }));
vi.mock("@/components/ui/button", () => ({ Button: "button" }));
vi.mock("next/link", () => ({ default: "a" }));
vi.mock("framer-motion", () => ({ AnimatePresence: "release-presence", motion: { div: "div", section: "section" } }));
vi.mock("@radix-ui/react-dialog", () => ({ Root: "release-dialog", Portal: "release-portal", Overlay: "release-overlay",
  Content: "release-content", Title: "release-title", Description: "release-description" }));
vi.mock("lucide-react", () => Object.fromEntries(
  ["BadgeCheck", "Bot", "Database", "FileText", "ShieldCheck", "Trophy", "Volume2", "X"].map((name) => [name, "release-icon"])));
vi.mock("@/lib/cdp-server", () => {
  fixture.forbiddenSdk();
  throw new Error("No provider SDK import is authorized in this fixture.");
});

const OFF = { aiCoach: false, voice: false, leaderboard: false, blockchain: false };
let local: Map<string, string>, session: Map<string, string>;
let store: typeof import("@/lib/product-storage"), consent: typeof import("@/lib/consent");
let manager: typeof import("@/components/ConsentManager");
let provider: typeof import("@/context/ConsentContext");
let cloudPush: ReturnType<typeof vi.fn<() => void>>, outbound: ReturnType<typeof vi.fn<() => never>>;
let denyWrite = false;

function run<T>(name: string, render: () => T): T {
  if (!fixture.frames.has(name)) fixture.frames.set(name, []);
  fixture.active = name; fixture.cursor = 0;
  const tree = render();
  for (const effect of fixture.effects.splice(0)) effect();
  return tree;
}
function renderProvider() {
  for (let pass = 0; pass < 2; pass++) {
    fixture.actions = run("provider", () =>
      (provider.ConsentProvider({ children: null }) as ReactElement<{ value: Actions }>).props.value);
  }
}
type Node = ReactElement<Record<string, unknown>>;
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}
function text(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(text).join("");
  return value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : "";
}
function renderManager() {
  run("manager", () => manager.ConsentManager());
  return run("manager", () => manager.ConsentManager());
}
function click(tree: unknown, label: string) {
  const button = nodes(tree).find((node) => node.type === "button" && text(node.props.children) === label);
  expect(button, label).toBeDefined();
  expect(button!.props.disabled).not.toBe(true);
  (button!.props.onClick as () => void)();
}

beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); fixture.frames.clear(); fixture.effects.length = 0;
  local = new Map(); session = new Map(); denyWrite = false;
  const physical = (values: Map<string, string>) => ({
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { if (denyWrite) throw new Error("Synthetic denied write"); values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  });
  vi.stubGlobal("window", Object.assign(new EventTarget(), { localStorage: physical(local), sessionStorage: physical(session) }));
  outbound = vi.fn(() => { throw new Error("No network authorized."); }); vi.stubGlobal("fetch", outbound);
  store = await import("@/lib/product-storage");
  const lease = store.beginStorageOwner({ kind: "guest" }); lease.publishReady({ localOnly: true });
  fixture.storage = store.captureCurrentPersonalStorage();
  consent = await import("@/lib/consent");
  provider = await vi.importActual<typeof import("@/context/ConsentContext")>("@/context/ConsentContext");
  manager = await import("@/components/ConsentManager");
  cloudPush = vi.fn<() => void>(); (await import("@/lib/sync/syncQueue")).registerCloudPusher(cloudPush);
});
afterEach(() => {
  for (const frame of fixture.frames.values()) for (const cell of frame) cell.cleanup?.();
  expect(outbound).not.toHaveBeenCalled(); expect(cloudPush).not.toHaveBeenCalled();
  expect(fixture.forbiddenSdk).not.toHaveBeenCalled(); vi.unstubAllGlobals(); vi.unstubAllEnvs();
});

describe.each(["pl", "en"])("PR19 actual consent controls %s", (locale) => {
  const labels = locale === "pl" ? { required: "Akceptuj wymagane", save: "Zapisz ustawienia" }
    : { required: "Accept required", save: "Save settings" };

  it("required-only replaces ambiguous legacy opt-ins with four explicit false values", () => {
    fixture.locale = locale;
    const legacy = { ...consent.createConsentRecord({ aiCoach: true, voice: true }), version: "2026-05-01" };
    local.set(consent.CONSENT_STORAGE_KEY, JSON.stringify(legacy));
    renderProvider(); expect(fixture.actions.requiredAccepted).toBe(false);
    click(renderManager(), labels.required); renderProvider();
    expect(consent.readStoredConsent(fixture.storage)?.optional).toEqual(OFF);
    expect(fixture.actions.requiredAccepted).toBe(true);
    expect(consent.hasConsentFor(consent.readStoredConsent(fixture.storage), ["aiCoach", "voice"])).toBe(false);
  });

  it("settings start off and save only the selected purpose, with synchronous withdrawal", () => {
    fixture.locale = locale; renderProvider(); fixture.actions.openSettings(); renderProvider();
    let tree = renderManager();
    const choices = nodes(tree).filter((node) => node.type === "button" && "aria-pressed" in node.props);
    expect(choices.map((node) => node.props["aria-pressed"])).toEqual([false, false, false, false]);
    (choices[1].props.onClick as () => void)();
    const required = nodes(tree).find((node) => node.props.type === "checkbox")!;
    (required.props.onChange as (event: { target: { checked: boolean } }) => void)({ target: { checked: true } });
    click(renderManager(), labels.save); renderProvider();
    expect(consent.readStoredConsent(fixture.storage)?.optional).toEqual({ ...OFF, voice: true });
    fixture.actions.openSettings(); renderProvider(); tree = renderManager();
    const seenAtChange: boolean[] = [];
    window.addEventListener(consent.CONSENT_CHANGED_EVENT, () => {
      seenAtChange.push(consent.hasConsentFor(consent.readStoredConsent(fixture.storage), ["voice"]));
    });
    const voice = nodes(tree).filter((node) => node.type === "button" && "aria-pressed" in node.props)[1];
    (voice.props.onClick as () => void)(); click(renderManager(), labels.save);
    expect(seenAtChange).toEqual([false]);
    expect(consent.readStoredConsent(fixture.storage)?.optional).toEqual(OFF);
  });

  it("a denied write keeps acceptance false and exposes the existing retryable alert", () => {
    fixture.locale = locale; renderProvider(); denyWrite = true;
    click(renderManager(), labels.required); renderProvider();
    expect(fixture.actions.requiredAccepted).toBe(false);
    expect(local.has(consent.CONSENT_STORAGE_KEY)).toBe(false);
    expect(nodes(renderManager()).filter((node) => node.props.role === "alert")).toHaveLength(1);
  });

  it("an old required-only handler cannot save into a newly active owner", () => {
    fixture.locale = locale; renderProvider(); const oldTree = renderManager();
    store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "SYNTHETIC_NEXT_OWNER" }).publishReady({ localOnly: true });
    const before = [...local]; click(oldTree, labels.required);
    expect([...local]).toEqual(before);
  });
});

it("actual provider rejects an old callback even when supplied a new owner's valid handle", () => {
  renderProvider(); const oldActions = fixture.actions;
  const lease = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "SYNTHETIC_B" }); lease.publishReady({ localOnly: true });
  const next = store.captureCurrentPersonalStorage(); const before = [...local];
  expect(() => oldActions.acceptRequired(OFF, next)).toThrow("scope changed");
  expect([...local]).toEqual(before);
});

it("editing optional choices cannot reaccept separately withdrawn required terms", () => {
  consent.writeStoredConsent(consent.createConsentRecord(), fixture.storage); renderProvider();
  consent.clearStoredConsent(fixture.storage); const before = [...local];
  fixture.actions.updateOptional({ ...OFF, voice: true });
  expect(consent.readStoredConsent(fixture.storage)).toBeNull(); expect([...local]).toEqual(before);
});

it("even an all-purpose record and an environment flag cannot enable external AI", async () => {
  vi.stubEnv("COACHFI_EXTERNAL_AI_ENABLED", "true");
  const { denyExternalAiUnlessReady, EXTERNAL_AI_POLICY } = await import("@/lib/server/api-access-policy");
  const record = consent.createConsentRecord({ aiCoach: true, voice: true, leaderboard: true, blockchain: true });
  const request = new Request("https://coachfi.example/api/chat", { headers: { origin: "https://coachfi.example" } });
  await expect(denyExternalAiUnlessReady(request, record, ["aiCoach", "voice"]))
    .rejects.toMatchObject({ code: "EXTERNAL_AI_DISABLED", status: 503 });
  expect(EXTERNAL_AI_POLICY.enabled).toBe(false);
});
