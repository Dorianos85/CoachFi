import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalStorageHandle } from "@/lib/product-storage";
import type { ReactElement } from "react";

// Actual page function and actual financial save; synthetic hook lifecycle,
// not a React DOM/browser assertion. State/effect dependencies survive renders.
const lifecycle = vi.hoisted(() => ({
  cursor: 0, slots: [] as unknown[], deps: new Map<number, readonly unknown[] | undefined>(),
  effects: [] as Array<() => void | (() => void)>, locale: "pl", required: false,
  storage: null as unknown as PersonalStorageHandle,
}));
vi.mock("react", async (original) => ({ ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const slot = lifecycle.cursor++;
    if (!(slot in lifecycle.slots)) lifecycle.slots[slot] = typeof initial === "function" ? initial() : initial;
    return [lifecycle.slots[slot], (next: unknown) => {
      lifecycle.slots[slot] = typeof next === "function" ? next(lifecycle.slots[slot]) : next;
    }];
  },
  useRef: (initial: unknown) => {
    const slot = lifecycle.cursor++;
    if (!(slot in lifecycle.slots)) lifecycle.slots[slot] = { current: initial };
    return lifecycle.slots[slot];
  },
  useEffect: (effect: () => void | (() => void), deps?: readonly unknown[]) => {
    const slot = lifecycle.cursor++; const previous = lifecycle.deps.get(slot);
    if (!lifecycle.deps.has(slot) || !deps || !previous || deps.some((value, index) => !Object.is(value, previous[index]))) lifecycle.effects.push(effect);
    lifecycle.deps.set(slot, deps);
  },
}));
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: lifecycle.storage }) }));
vi.mock("@/context/LanguageContext", () => ({ useLanguage: () => ({ locale: lifecycle.locale }) }));
vi.mock("@/context/ConsentContext", () => ({ useConsent: () => ({ loaded: true, requiredAccepted: lifecycle.required, openSettings: vi.fn() }) }));

type Element = ReactElement<Record<string, unknown>>;
function elements(node: unknown): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as Element; return [element, ...elements(element.props.children)];
}
function field(tree: Element, name: string) {
  const element = elements(tree).find((node) => node.props.name === name);
  if (!element) throw new Error(`Synthetic field not found: ${name}`); return element;
}

describe("health draft consent transition regression (actual page function)", () => {
  beforeEach(async () => {
    vi.resetModules(); lifecycle.cursor = 0; lifecycle.slots = []; lifecycle.deps.clear(); lifecycle.effects = []; lifecycle.required = false;
    const bytes = new Map<string, string>();
    const storage = { getItem: (key: string) => bytes.get(key) ?? null,
      setItem: (key: string, value: string) => { bytes.set(key, value); }, removeItem: (key: string) => { bytes.delete(key); } };
    vi.stubGlobal("window", { localStorage: storage, sessionStorage: storage, dispatchEvent: vi.fn(() => true),
      requestAnimationFrame: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() });
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No unstubbed network permitted."); }));
    const ownership = await import("@/lib/product-storage"); ownership.beginStorageOwner({ kind: "guest" }).publishReady();
    lifecycle.storage = ownership.captureCurrentPersonalStorage();
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  async function pageHarness(locale: string) {
    lifecycle.locale = locale; const { default: Page } = await import("@/app/health-check/page");
    function render() {
      lifecycle.cursor = 0; let tree = Page() as Element;
      const effects = lifecycle.effects.splice(0); effects.forEach((effect) => effect());
      if (effects.length) { lifecycle.cursor = 0; tree = Page() as Element; }
      return tree;
    }
    function edit(tree: Element, name: string, value: string) {
      (field(tree, name).props.onChange as (event: { target: { value: string } }) => void)({ target: { value } });
      return render();
    }
    async function grant() {
      const consent = await import("@/lib/consent"); consent.writeStoredConsent(consent.createConsentRecord(), lifecycle.storage);
      lifecycle.required = true;
    }
    function submit(tree: Element) {
      const form = elements(tree).find((node) => node.type === "form")!;
      (form.props.onSubmit as (event: { preventDefault: () => void }) => void)({ preventDefault: vi.fn() }); return render();
    }
    return { render, edit, grant, submit };
  }

  it.each(["pl", "en"])("%s preserves zero/no draft on required acceptance and saves score10", async (locale) => {
    const page = await pageHarness(locale); let tree = page.render();
    for (const name of ["monthlyIncome", "monthlyExpenses", "savings", "debt", "cashHeld"]) tree = page.edit(tree, name, "0");
    for (const name of ["hasEmergencyFund", "understandsInflation", "hasRetirementPlan", "investsAlready"]) tree = page.edit(tree, name, "no");
    await page.grant(); tree = page.render();
    expect(field(tree, "monthlyIncome").props.value).toBe("0"); expect(field(tree, "investsAlready").props.value).toBe("no");
    tree = page.submit(tree);
    const { getHealthCheck } = await import("@/lib/healthCheck"); expect(getHealthCheck(lifecycle.storage)?.score).toBe(10);
    expect(elements(tree).some((node) => (node.props.result as { score?: number } | undefined)?.score === 10)).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(["pl", "en"])("%s optional settings preserve edits, while required withdrawal clears draft/card", async (locale) => {
    const page = await pageHarness(locale); await page.grant(); let tree = page.render();
    for (const name of ["monthlyIncome", "monthlyExpenses", "savings", "debt", "cashHeld"]) tree = page.edit(tree, name, "0");
    for (const name of ["hasEmergencyFund", "understandsInflation", "hasRetirementPlan", "investsAlready"]) tree = page.edit(tree, name, "no");
    tree = page.submit(tree);
    expect(elements(tree).some((node) => (node.props.result as { score?: number } | undefined)?.score === 10)).toBe(true);
    const savedBytes = lifecycle.storage.getItem("coachfi-health-check");
    tree = page.edit(tree, "monthlyIncome", "1234");
    tree = page.edit(tree, "mainFinancialGoal", "FIXTURE_DRAFT");
    const consent = await import("@/lib/consent");
    consent.writeStoredConsent(consent.createConsentRecord({ voice: true }), lifecycle.storage); tree = page.render();
    expect(field(tree, "monthlyIncome").props.value).toBe("1234"); expect(field(tree, "mainFinancialGoal").props.value).toBe("FIXTURE_DRAFT");
    consent.clearStoredConsent(lifecycle.storage); lifecycle.required = false; tree = page.render();
    expect(field(tree, "monthlyIncome").props.value).toBe(""); expect(field(tree, "mainFinancialGoal").props.value).toBe("");
    expect(elements(tree).some((node) => node.props.result !== undefined)).toBe(false);
    expect(lifecycle.storage.getItem("coachfi-health-check")).toBe(savedBytes);
    await page.grant(); tree = page.render(); expect(field(tree, "monthlyIncome").props.value).toBe("");
    expect(elements(tree).some((node) => node.props.result !== undefined)).toBe(false);
  });
});
