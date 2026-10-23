import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

type Effect = () => void | (() => void);
const fixture = vi.hoisted(() => ({ locale: "pl" as import("@/lib/i18n").Locale, slot: 0,
  storage: null as unknown as PersonalStorageHandle, values: new Map<number, unknown>(),
  memos: new Map<number, { deps?: readonly unknown[]; value: unknown }>(),
  effects: [] as Effect[], effectDeps: new Map<number, readonly unknown[] | undefined>(), setState: vi.fn(),
}));
const sameDeps = (a?: readonly unknown[], b?: readonly unknown[]) => !!a && !!b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
vi.mock("react", async (original) => ({ ...await original<typeof import("react")>(),
  useMemo: (factory: () => unknown, deps?: readonly unknown[]) => {
    const index = fixture.slot++, previous = fixture.memos.get(index);
    if (!previous || !sameDeps(previous.deps, deps)) fixture.memos.set(index, { deps, value: factory() });
    return fixture.memos.get(index)?.value;
  },
  useLayoutEffect: (effect: Effect, deps?: readonly unknown[]) => {
    const index = fixture.slot++;
    if (!fixture.effectDeps.has(index) || !sameDeps(fixture.effectDeps.get(index), deps)) fixture.effects.push(effect);
    fixture.effectDeps.set(index, deps);
  },
  useState: (initial: unknown) => {
    const index = fixture.slot++;
    if (!fixture.values.has(index)) fixture.values.set(index, typeof initial === "function" ? initial() : initial);
    return [fixture.values.get(index), (value: unknown) => { fixture.setState(value);
      fixture.values.set(index, typeof value === "function" ? value(fixture.values.get(index)) : value); }];
  },
}));
vi.mock("@/context/LanguageContext", async () => {
  const { translations } = await import("@/lib/i18n");
  return { useLanguage: () => ({ locale: fixture.locale, t: translations[fixture.locale] }) };
});
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: fixture.storage }) }));

type Props = { children?: unknown; text?: string; locale?: string; name?: string; value?: string; checked?: boolean;
  "aria-live"?: string; role?: string; onChange?: () => void; onClick?: () => void; onSubmit?: (event: { preventDefault(): void }) => void };
function nodes(node: unknown): Array<ReactElement<Props>> {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as ReactElement<Props>; return [element, ...nodes(element.props.children)];
}
function text(node: unknown): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(text).join("");
  return node && typeof node === "object" && "props" in node ? text((node as ReactElement<Props>).props.children) : "";
}
let bytes: Map<string, string>, render: () => ReactElement, reward: Mock<(amount: number) => void>, complete: Mock<(correctCount: number, totalCount: number) => void>;
let withReward: boolean;
beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); fixture.slot = 0; fixture.locale = "pl";
  withReward = true;
  fixture.values.clear(); fixture.memos.clear(); fixture.effectDeps.clear(); fixture.effects.length = 0;
  bytes = new Map<string, string>(); const storage = { getItem: (key: string) => bytes.get(key) ?? null,
    setItem: (key: string, value: string) => { bytes.set(key, value); }, removeItem: (key: string) => { bytes.delete(key); } };
  vi.stubGlobal("window", { localStorage: storage, sessionStorage: storage, dispatchEvent: vi.fn() });
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No real network permitted."); }));
  const store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "guest" }).publishReady(); fixture.storage = store.captureCurrentPersonalStorage();
  const captured = fixture.storage, { addTokens } = await import("@/lib/tokens");
  reward = vi.fn<(amount: number) => void>((amount) => { addTokens(amount, "FIXTURE quiz reward", "FIXTURE review", captured); });
  complete = vi.fn<(correctCount: number, totalCount: number) => void>(); const { QuizCard } = await import("@/components/QuizCard");
  render = () => { fixture.slot = 0; return QuizCard({ topic: "mindset", onReward: withReward ? reward : undefined, onComplete: complete }); };
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function settle() {
  let tree = render();
  for (let i = 0; i < 8 && fixture.effects.length; i++) { const effects = fixture.effects.splice(0); effects.forEach(effect => effect()); tree = render(); }
  expect(fixture.effects).toHaveLength(0); return tree;
}
function action(tree: unknown, label: string) {
  const element = nodes(tree).find(element => element.props.onClick && text(element) === label);
  expect(element, `action ${label}`).toBeDefined(); element!.props.onClick!(); return settle();
}
function submit(tree: unknown, value: string) {
  const radio = nodes(tree).find(element => element.props.value === value && element.props.onChange);
  expect(radio).toBeDefined(); radio!.props.onChange!(); tree = settle();
  nodes(tree).find(element => element.props.onSubmit)!.props.onSubmit!({ preventDefault() {} }); return settle();
}

const alertCopy = {
  pl: "Nie można bezpiecznie zapisać nagrody w lokalnym saldzie punktów. Odpowiedź nie została zapisana. Sprawdź dane lokalne w Ustawieniach.",
  en: "Your local points balance cannot safely accept this reward. This answer was not saved. Check your local data in Settings.",
};
const alerts = (tree: unknown) => nodes(tree).filter(element => element.props.role === "alert");
const feedback = (tree: unknown) => nodes(tree).filter(element => element.props["aria-live"] === "polite");
const rawCases = ["25garbage", "", String(Number.MAX_SAFE_INTEGER)];

describe("independent B17 actual quiz reward preflight", () => {
  it.each((["pl", "en"] as const).flatMap(locale => rawCases.map(raw => ({ locale, raw }))))("$locale rejects raw '$raw' before SRS/reward/completion and retains bytes", async ({ locale, raw }) => {
    fixture.locale = locale; fixture.storage.setItem("coachfi-tokens", raw); const before = new Map(bytes);
    const tree = submit(settle(), "B");
    expect(alerts(tree)).toHaveLength(1); expect(text(alerts(tree)[0])).toBe(alertCopy[locale]);
    expect(bytes).toEqual(before); expect(fixture.storage.getItem("coachfi-srs")).toBeNull();
    expect(reward).not.toHaveBeenCalled(); expect(complete).not.toHaveBeenCalled(); expect(feedback(tree)).toHaveLength(0);
    expect(nodes(tree).find(element => element.props.onSubmit)).toBeDefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(["pl", "en"] as const)("%s valid retry after fixture-only repair grants25 once and clears alert", async (locale) => {
    fixture.locale = locale; fixture.storage.setItem("coachfi-tokens", "25garbage"); let tree = submit(settle(), "B");
    expect(alerts(tree)).toHaveLength(1); fixture.storage.setItem("coachfi-tokens", "125");
    nodes(tree).find(element => element.props.onSubmit)!.props.onSubmit!({ preventDefault() {} }); tree = settle();
    expect(alerts(tree)).toHaveLength(0); expect(fixture.storage.getItem("coachfi-tokens")).toBe("150");
    expect(JSON.parse(fixture.storage.getItem("coachfi-srs")!)).toMatchObject([{ id: "net-worth", repetitions: 1 }]);
    expect(reward).toHaveBeenCalledExactlyOnceWith(25); expect(complete).not.toHaveBeenCalled(); expect(feedback(tree)).toHaveLength(1);
    const before = new Map(bytes); nodes(tree).find(element => element.props.onSubmit)!.props.onSubmit!({ preventDefault() {} });
    expect(bytes).toEqual(before); expect(reward).toHaveBeenCalledOnce();
  });

  it("locale/selection reset clears the alert; a wrong answer may persist SRS without any reward", async () => {
    fixture.storage.setItem("coachfi-tokens", "25garbage"); let tree = submit(settle(), "B"); expect(alerts(tree)).toHaveLength(1);
    fixture.locale = "en"; tree = settle(); expect(alerts(tree)).toHaveLength(0);
    expect(nodes(tree).some(element => element.props.checked === true)).toBe(false);
    tree = submit(tree, "B"); expect(text(alerts(tree)[0])).toBe(alertCopy.en);
    nodes(tree).find(element => element.props.value === "A")!.props.onChange!(); tree = settle(); expect(alerts(tree)).toHaveLength(0);
    nodes(tree).find(element => element.props.onSubmit)!.props.onSubmit!({ preventDefault() {} }); tree = settle();
    expect(feedback(tree)).toHaveLength(1); expect(fixture.storage.getItem("coachfi-tokens")).toBe("25garbage");
    expect(JSON.parse(fixture.storage.getItem("coachfi-srs")!)).toMatchObject([{ id: "net-worth", repetitions: 0 }]);
    expect(reward).not.toHaveBeenCalled(); expect(complete).not.toHaveBeenCalled();
  });

  it("a new owner resets alert and an old captured valid submit cannot write or credit B", async () => {
    fixture.storage.setItem("coachfi-tokens", "25garbage"); let tree = submit(settle(), "B"); expect(alerts(tree)).toHaveLength(1);
    fixture.storage.setItem("coachfi-tokens", "125"); const oldSubmit = nodes(tree).find(element => element.props.onSubmit)!.props.onSubmit!;
    const store = await import("@/lib/product-storage"), b = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B" });
    b.storage.setItem("coachfi-tokens", "77"); b.publishReady({ localOnly: true }); fixture.storage = store.captureCurrentPersonalStorage(); tree = settle();
    expect(alerts(tree)).toHaveLength(0); const before = new Map(bytes); fixture.setState.mockClear(); oldSubmit({ preventDefault() {} });
    expect(bytes).toEqual(before); expect(fixture.setState).not.toHaveBeenCalled(); expect(reward).not.toHaveBeenCalled(); expect(complete).not.toHaveBeenCalled();
    expect(fixture.storage.getItem("coachfi-tokens")).toBe("77"); expect(fixture.storage.getItem("coachfi-srs")).toBeNull();
  });

  it("maximum safe balance boundary is accepted only when the25 reward still fits exactly", async () => {
    fixture.storage.setItem("coachfi-tokens", String(Number.MAX_SAFE_INTEGER - 25)); const tree = submit(settle(), "B");
    expect(alerts(tree)).toHaveLength(0); expect(feedback(tree)).toHaveLength(1);
    expect(fixture.storage.getItem("coachfi-tokens")).toBe(String(Number.MAX_SAFE_INTEGER)); expect(reward).toHaveBeenCalledExactlyOnceWith(25);
  });

  it("a card with no reward callback can record correct learning without touching malformed points", async () => {
    withReward = false; fixture.storage.setItem("coachfi-tokens", "25garbage"); const tree = submit(settle(), "B");
    expect(alerts(tree)).toHaveLength(0); expect(feedback(tree)).toHaveLength(1);
    expect(fixture.storage.getItem("coachfi-tokens")).toBe("25garbage");
    expect(JSON.parse(fixture.storage.getItem("coachfi-srs")!)).toMatchObject([{ id: "net-worth", repetitions: 1 }]); expect(reward).not.toHaveBeenCalled();
  });
});
