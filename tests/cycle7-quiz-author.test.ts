import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

type LayoutEffect = () => void | (() => void);
const fixture = vi.hoisted(() => ({ locale: "pl" as "pl" | "en", slot: 0, values: new Map<number, unknown>(),
  allowed: false, calls: [] as string[], current: true, revision: 0, bytes: new Map<string, string>(),
  storage: null as unknown as PersonalStorageHandle,
  memos: new Map<number, { deps?: readonly unknown[]; value: unknown }>(),
  effectDeps: new Map<number, readonly unknown[] | undefined>(), effects: [] as LayoutEffect[], cleanups: new Map<number, () => void>() }));
const sameDeps = (a?: readonly unknown[], b?: readonly unknown[]) => !!a && !!b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
vi.mock("react", async original => ({ ...await original<typeof import("react")>(),
  useMemo: (factory: () => unknown, deps?: readonly unknown[]) => {
    const slot = fixture.slot++, previous = fixture.memos.get(slot);
    if (!previous || !sameDeps(previous.deps, deps)) fixture.memos.set(slot, { deps, value: factory() });
    return fixture.memos.get(slot)?.value;
  },
  useLayoutEffect: (effect: LayoutEffect, deps?: readonly unknown[]) => {
    const slot = fixture.slot++;
    if (!fixture.effectDeps.has(slot) || !sameDeps(fixture.effectDeps.get(slot), deps)) fixture.effects.push(() => {
      fixture.cleanups.get(slot)?.(); fixture.cleanups.delete(slot);
      const cleanup = effect(); if (typeof cleanup === "function") fixture.cleanups.set(slot, cleanup);
    });
    fixture.effectDeps.set(slot, deps);
  },
  useState: (initial: unknown) => {
    const slot = fixture.slot++;
    if (!fixture.values.has(slot)) fixture.values.set(slot, typeof initial === "function" ? initial() : initial);
    return [fixture.values.get(slot), (next: unknown) => fixture.values.set(slot, typeof next === "function" ? next(fixture.values.get(slot)) : next)];
  },
}));
vi.mock("@/context/LanguageContext", async () => {
  const { translations } = await import("@/lib/i18n");
  return { useLanguage: () => ({ locale: fixture.locale, t: translations[fixture.locale] }) };
});
vi.mock("@/lib/tokens", async original => {
  const actual = await original<typeof import("@/lib/tokens")>();
  return { ...actual, canAwardTokens: vi.fn((amount: number, storage: PersonalStorageHandle) => {
    if (amount > 0) { fixture.calls.push("preflight"); return fixture.allowed && actual.canAwardTokens(amount, storage); }
    return actual.canAwardTokens(amount, storage); // Schema reads are not another reward-admission event.
  }) };
});
vi.mock("@/lib/srs", async original => {
  const actual = await original<typeof import("@/lib/srs")>();
  return { ...actual, recordAnswer: vi.fn((id: string, correct: boolean, storage: PersonalStorageHandle) => {
    fixture.calls.push("srs"); return actual.recordAnswer(id, correct, storage);
  }) };
});
vi.mock("@/lib/account-sync", () => ({ persistLearningState: vi.fn() }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: vi.fn() }));
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: fixture.storage }) }));

let persistLegacyReward: typeof import("@/lib/tokens").addTokens;
// The original callback remains a one-argument observer; actual addTokens models its parent award.
function renderQuizCard(actualQuizCard: typeof import("@/components/QuizCard").QuizCard, props: Parameters<typeof actualQuizCard>[0]) {
  const parentProps = props.onReward ? { ...props, onReward: (amount: number) => {
    persistLegacyReward(amount, "FIXTURE C7 parent reward", "FIXTURE C7", fixture.storage);
    props.onReward!(amount);
  } } : props;
  const draw = () => { fixture.slot = 0; return actualQuizCard(parentProps); };
  let tree = draw();
  for (let attempt = 0; attempt < 8 && fixture.effects.length; attempt++) {
    fixture.effects.splice(0).forEach(effect => effect()); tree = draw();
  }
  if (fixture.effects.length) throw new Error("FIXTURE C7 layout did not settle");
  return tree;
}

type Props = { children?: unknown; role?: string; name?: string; value?: string; disabled?: boolean;
  onChange?: () => void; onSubmit?: (event: { preventDefault(): void }) => void };
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
beforeEach(async () => { fixture.cleanups.forEach(cleanup => cleanup());
  fixture.locale = "pl"; fixture.slot = 0; fixture.values.clear(); fixture.calls.length = 0;
  fixture.memos.clear(); fixture.effectDeps.clear(); fixture.effects.length = 0; fixture.cleanups.clear();
  fixture.allowed = false; fixture.current = true; fixture.revision++; fixture.bytes.clear(); fixture.bytes.set("coachfi-tokens", "125"); vi.clearAllMocks();
  fixture.storage = Object.freeze({ owner: Object.freeze({ kind: "guest" as const }), revision: fixture.revision, area: "local" as const,
    isCurrent: () => fixture.current, getItem: (key: string) => fixture.bytes.get(key) ?? null,
    setItem: (key: string, value: string) => { fixture.bytes.set(key, value); return true; },
    removeItem: (key: string) => { fixture.bytes.delete(key); return true; }, release: () => {} });
  vi.stubGlobal("window", new EventTarget());
  vi.stubGlobal("fetch", () => { throw new Error("No real network permitted"); });
  ({ addTokens: persistLegacyReward } = await import("@/lib/tokens"));
});
afterEach(() => { fixture.cleanups.forEach(cleanup => cleanup()); fixture.cleanups.clear(); vi.unstubAllGlobals(); });

describe("B17 quiz author handler checks (mocked preflight/SRS, no lifecycle or storage claims)", () => {
  it.each(["pl", "en"] as const)("%s rejects unsafe reward before SRS and gives an alert without success", async locale => {
    fixture.locale = locale; const { QuizCard } = await import("@/components/QuizCard");
    const reward = vi.fn<(amount: number) => void>(), complete = vi.fn<(correctCount: number, totalCount: number) => void>();
    const render = () => { fixture.slot = 0; return renderQuizCard(QuizCard, { topic: "mindset", onReward: reward, onComplete: complete }); };
    let tree = render(); nodes(tree).find(node => node.props.name === "net-worth" && node.props.value === "B")!.props.onChange!();
    tree = render(); nodes(tree).find(node => node.type === "form")!.props.onSubmit!({ preventDefault() {} }); tree = render();
    expect(fixture.calls).toEqual(["preflight"]); expect(reward).not.toHaveBeenCalled(); expect(complete).not.toHaveBeenCalled();
    const alert = nodes(tree).find(node => node.props.role === "alert"); expect(alert).toBeDefined();
    expect(text(alert)).toContain(locale === "pl" ? "Odpowiedź nie została zapisana" : "This answer was not saved");
    expect(nodes(tree).filter(node => node.props.name === "net-worth").every(node => node.props.disabled === false)).toBe(true);
    const { getTopicQuestions } = await import("@/lib/quiz-topic");
    expect(text(tree)).not.toContain(getTopicQuestions(locale, "mindset")[0].successMessage);
  });
  it("valid preflight precedes SRS and reward; a repeated submitted handler earns nothing", async () => {
    fixture.allowed = true; const { QuizCard } = await import("@/components/QuizCard");
    const reward = vi.fn<(amount: number) => void>(() => { fixture.calls.push("reward"); });
    const render = () => { fixture.slot = 0; return renderQuizCard(QuizCard, { topic: "mindset", onReward: reward }); };
    let tree = render(); nodes(tree).find(node => node.props.name === "net-worth" && node.props.value === "B")!.props.onChange!();
    tree = render(); const submit = nodes(tree).find(node => node.type === "form")!.props.onSubmit!; submit({ preventDefault() {} });
    tree = render(); nodes(tree).find(node => node.type === "form")!.props.onSubmit!({ preventDefault() {} });
    expect(fixture.calls).toEqual(["preflight", "srs", "reward"]); expect(reward).toHaveBeenCalledTimes(1); expect(reward).toHaveBeenCalledWith(25);
  });
  it("wrong answers preserve knowledge retry without probing or granting a reward", async () => {
    const { QuizCard } = await import("@/components/QuizCard"); const reward = vi.fn<(amount: number) => void>();
    const render = () => { fixture.slot = 0; return renderQuizCard(QuizCard, { topic: "mindset", onReward: reward }); };
    let tree = render(); nodes(tree).find(node => node.props.name === "net-worth" && node.props.value === "A")!.props.onChange!();
    tree = render(); nodes(tree).find(node => node.type === "form")!.props.onSubmit!({ preventDefault() {} }); tree = render();
    expect(fixture.calls).toEqual(["srs"]); expect(reward).not.toHaveBeenCalled();
    expect(nodes(tree).some(node => node.props.role === "alert")).toBe(false);
  });
});
