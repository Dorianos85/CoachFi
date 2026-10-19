import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

type Effect = () => void | (() => void);
const fixture = vi.hoisted(() => ({ storage: null as unknown as PersonalStorageHandle,
  locale: "pl", loaded: false, required: false, index: 0,
  values: new Map<number, unknown>(), refs: new Map<number, { current: unknown }>(),
  deps: new Map<number, readonly unknown[] | undefined>(), effects: [] as Effect[],
}));
// Persistent hook slots and dependency comparison exercise actual page effects.
// This is not React DOM, paint, concurrent rendering or a browser simulation.
vi.mock("react", async (original) => ({ ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = fixture.index++;
    if (!fixture.values.has(index)) fixture.values.set(index, typeof initial === "function" ? initial() : initial);
    return [fixture.values.get(index), (value: unknown) => fixture.values.set(index,
      typeof value === "function" ? value(fixture.values.get(index)) : value)];
  },
  useRef: (initial: unknown) => {
    const index = fixture.index++;
    if (!fixture.refs.has(index)) fixture.refs.set(index, { current: initial });
    return fixture.refs.get(index);
  },
  useEffect: (effect: Effect, deps?: readonly unknown[]) => {
    const index = fixture.index++, prior = fixture.deps.get(index);
    if (!fixture.deps.has(index) || !deps || !prior || deps.some((value, i) => !Object.is(value, prior[i]))) fixture.effects.push(effect);
    fixture.deps.set(index, deps);
  },
}));
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: fixture.storage }) }));
vi.mock("@/context/LanguageContext", () => ({ useLanguage: () => ({ locale: fixture.locale }) }));
vi.mock("@/context/ConsentContext", () => ({ useConsent: () => ({ loaded: fixture.loaded,
  requiredAccepted: fixture.required, openSettings: vi.fn() }) }));
vi.mock("@/components/ui/button", () => ({ Button: () => null }));

type NodeProps = { children?: unknown; name?: string; value?: string; result?: { score: number };
  "data-testid"?: string; onChange?: (event: { target: { value: string } }) => void;
  onSubmit?: (event: { preventDefault(): void }) => void };
function find(node: unknown, match: (props: NodeProps) => boolean): Array<ReactElement<NodeProps>> {
  if (Array.isArray(node)) return node.flatMap((item) => find(item, match));
  if (!node || typeof node !== "object") return [];
  const element = node as ReactElement<NodeProps>;
  if (!element.props) return [];
  return [...(match(element.props) ? [element] : []), ...find(element.props.children, match)];
}
const numbers = ["monthlyIncome", "monthlyExpenses", "savings", "debt", "cashHeld"];
const booleans = ["hasEmergencyFund", "understandsInflation", "hasRetirementPlan", "investsAlready"];
const answers = { monthlyIncome: 4000, monthlyExpenses: 2000, savings: 6000, debt: 0, cashHeld: 0,
  hasEmergencyFund: true, understandsInflation: true, hasRetirementPlan: true, investsAlready: true, mainFinancialGoal: "FIXTURE_LONG_GOAL" };

describe("independent actual HealthCheckPage consent/draft effects", () => {
  let render: () => ReactElement;
  let bytes: Map<string, string>;
  beforeEach(async () => {
    vi.resetModules(); fixture.values.clear(); fixture.refs.clear(); fixture.deps.clear(); fixture.effects.length = 0;
    fixture.locale = "pl"; fixture.loaded = false; fixture.required = false; bytes = new Map();
    const storage = { getItem: (key: string) => bytes.get(key) ?? null,
      setItem: (key: string, value: string) => { bytes.set(key, value); }, removeItem: (key: string) => { bytes.delete(key); } };
    vi.stubGlobal("window", { localStorage: storage, sessionStorage: storage, dispatchEvent: vi.fn(), requestAnimationFrame: vi.fn() });
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No network permitted."); }));
    const store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "guest" }).publishReady();
    fixture.storage = store.captureCurrentPersonalStorage();
    const { default: HealthCheckPage } = await import("@/app/health-check/page");
    render = () => { fixture.index = 0; return HealthCheckPage(); };
  });
  afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
  function settle() {
    let tree = render();
    const effects = fixture.effects.splice(0); effects.forEach((effect) => effect());
    tree = render(); return tree;
  }
  function fields(tree: unknown) { return find(tree, (props) => !!props.name).map((node) => [node.props.name, node.props.value]); }

  it.each(["pl", "en"])("%s preserves complete unsaved zeros on required acceptance, then withdraws fields/result without success", async (locale) => {
    fixture.locale = locale; fixture.loaded = true; let tree = settle();
    for (const name of [...numbers, ...booleans]) {
      const field = find(tree, (props) => props.name === name)[0];
      field.props.onChange?.({ target: { value: numbers.includes(name) ? "0" : "no" } });
      tree = render();
    }
    const before = fields(tree);
    const consent = await import("@/lib/consent");
    consent.writeStoredConsent(consent.createConsentRecord(), fixture.storage); fixture.required = true;
    tree = settle(); expect(fields(tree)).toEqual(before);
    expect(find(tree, (props) => props["data-testid"] === "health-saved-status")).toHaveLength(0);
    find(tree, (props) => !!props.onSubmit)[0].props.onSubmit?.({ preventDefault() {} }); tree = render();
    expect(find(tree, (props) => !!props.result)[0].props.result?.score).toBe(10);
    expect(find(tree, (props) => props["data-testid"] === "health-saved-status")).toHaveLength(1);
    const savedBytes = fixture.storage.getItem("coachfi-health-check");
    consent.clearStoredConsent(fixture.storage); fixture.required = false; tree = settle();
    expect(fields(tree).every(([, value]) => value === "")).toBe(true);
    expect(find(tree, (props) => props["data-testid"] === "health-saved-status" || !!props.result)).toHaveLength(0);
    expect(fixture.storage.getItem("coachfi-health-check")).toBe(savedBytes);
  });

  it("initial loaded owner hydrates its saved result and new B owner resets it to empty", async () => {
    const consent = await import("@/lib/consent"), health = await import("@/lib/healthCheck"), store = await import("@/lib/product-storage");
    consent.writeStoredConsent(consent.createConsentRecord(), fixture.storage); health.saveHealthCheck(answers, fixture.storage);
    fixture.required = true; let tree = settle();
    expect(find(tree, (props) => !!props.result)).toHaveLength(0);
    fixture.loaded = true; tree = settle();
    expect(find(tree, (props) => props.name === "monthlyIncome")[0].props.value).toBe("4000");
    expect(find(tree, (props) => !!props.result)[0].props.result?.score).toBe(98);
    store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B" }).publishReady({ localOnly: true });
    fixture.storage = store.captureCurrentPersonalStorage(); fixture.required = false; tree = settle();
    expect(fields(tree).every(([, value]) => value === "")).toBe(true);
    expect(find(tree, (props) => props["data-testid"] === "health-saved-status" || !!props.result)).toHaveLength(0);
    expect(fixture.storage.getItem("coachfi-health-check")).toBeNull();
  });
});
