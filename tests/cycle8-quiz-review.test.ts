import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

type Effect = () => void | (() => void);
const fixture = vi.hoisted(() => ({ locale: "pl" as import("@/lib/i18n").Locale, slot: 0,
  storage: null as unknown as PersonalStorageHandle, values: new Map<number, unknown>(),
  memos: new Map<number, { deps?: readonly unknown[]; value: unknown }>(),
  effects: [] as Effect[], effectDeps: new Map<number, readonly unknown[] | undefined>(), cleanups: new Map<number, () => void>(), setState: vi.fn(),
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
    if (!fixture.effectDeps.has(index) || !sameDeps(fixture.effectDeps.get(index), deps)) fixture.effects.push(() => {
      fixture.cleanups.get(index)?.(); fixture.cleanups.delete(index);
      const cleanup = effect(); if (typeof cleanup === "function") fixture.cleanups.set(index, cleanup);
    });
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
const pageFixture = vi.hoisted(() => ({ markActive: vi.fn() }));
vi.mock("@/context/StreakContext", () => ({ useStreak: () => ({ markActive: pageFixture.markActive }) }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams("topic=mindset") }));

type Props = { children?: unknown; text?: string; name?: string; value?: string; checked?: boolean; disabled?: boolean;
  "aria-live"?: string; role?: string; balance?: number; status?: string;
  onReward?: (amount: number) => void; onComplete?: (correctCount: number, totalCount: number) => void; onPersistenceIssue?: () => void;
  onChange?: () => void; onClick?: () => void; onSubmit?: (event: { preventDefault(): void }) => void };
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
type Fault = "none" | "srs-read" | "srs-set-before" | "token-set-after" | "token-event";
let bytes: Map<string, string>, fault: Fault, writes: Array<{ key: string; value: string }>, reenter: (() => void) | undefined;
let render: () => ReactElement, reward: Mock<(amount: number) => void>, complete: Mock<(correctCount: number, totalCount: number) => void>, issue: Mock<() => void>;
beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); fixture.slot = 0; fixture.locale = "pl";
  fixture.values.clear(); fixture.memos.clear(); fixture.effectDeps.clear(); fixture.cleanups.clear(); fixture.effects.length = 0; pageFixture.markActive.mockReset();
  bytes = new Map([["coachfi-tokens", "125"]]); fault = "none"; writes = []; reenter = undefined;
  const storage = {
    getItem: (key: string) => { if (key === "coachfi-srs" && fault === "srs-read") { fault = "none"; throw new Error("FIXTURE blocked SRS read"); } return bytes.get(key) ?? null; },
    setItem: (key: string, value: string) => {
      writes.push({ key, value });
      if (key === "coachfi-srs" && fault === "srs-set-before") { fault = "none"; throw new Error("FIXTURE refused SRS writer"); }
      bytes.set(key, value);
      if (key === "coachfi-srs" && reenter) { const call = reenter; reenter = undefined; call(); }
      if (key === "coachfi-tokens" && fault === "token-set-after") { fault = "none"; throw new Error("FIXTURE token writer mutated then failed"); }
    }, removeItem: (key: string) => { bytes.delete(key); },
  };
  vi.stubGlobal("window", { localStorage: storage, sessionStorage: storage, location: { reload: vi.fn() }, dispatchEvent: vi.fn((event: Event) => {
    if (event.type === "coachfi-tokens" && fault === "token-event") { fault = "none"; throw new Error("FIXTURE token event failed"); } return true;
  }) });
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No real network permitted."); }));
  const store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "guest" }).publishReady(); fixture.storage = store.captureCurrentPersonalStorage();
  const captured = fixture.storage, { addTokens } = await import("@/lib/tokens");
  reward = vi.fn<(amount: number) => void>(amount => { addTokens(amount, "FIXTURE quiz reward", "FIXTURE review", captured); });
  complete = vi.fn<(correctCount: number, totalCount: number) => void>(); issue = vi.fn<() => void>();
  const { QuizCard } = await import("@/components/QuizCard");
  render = () => { fixture.slot = 0; return QuizCard({ topic: "mindset", onReward: reward, onComplete: complete, onPersistenceIssue: issue }); };
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function settle() {
  let tree = render();
  for (let i = 0; i < 8 && fixture.effects.length; i++) { fixture.effects.splice(0).forEach(effect => effect()); tree = render(); }
  expect(fixture.effects).toHaveLength(0); return tree;
}
function select(tree: unknown, value: string) {
  const radio = nodes(tree).find(node => node.props.value === value && node.props.onChange);
  expect(radio).toBeDefined(); radio!.props.onChange!(); return settle();
}
function submitHandler(tree: unknown) {
  const form = nodes(tree).find(node => node.props.onSubmit);
  expect(form).toBeDefined(); return form!.props.onSubmit!;
}
const alerts = (tree: unknown) => nodes(tree).filter(node => node.props.role === "alert");
const alertMessage = (tree: unknown) => {
  const alert = alerts(tree)[0];
  return alert?.type === "p" ? text(alert) : text(nodes(alert?.props.children).find(node => node.type === "p"));
};
const feedback = (tree: unknown) => nodes(tree).filter(node => node.props["aria-live"] === "polite");
const copy = {
  pl: { retry: "Nie udało się zapisać odpowiedzi. Możesz spróbować ponownie.", uncertain: "Nie udało się potwierdzić pełnego zapisu. Odpowiedź lub punkty mogły zostać zapisane częściowo. Nie ponawiaj tej odpowiedzi. Odśwież stronę, aby odczytać dane lokalne." },
  en: { retry: "Your answer could not be saved. You can try again.", uncertain: "The full save could not be confirmed. Your answer or points may have been partially saved. Do not retry this answer. Reload the page to read your local data." },
};
function noSuccess(tree: unknown) { expect(feedback(tree)).toHaveLength(0); expect(complete).not.toHaveBeenCalled(); }

describe("independent B18 actual quiz failure/epoch gates", () => {
  it.each(["pl", "en"] as const)("%s read fails before mutation; explicit retry saves exactly once", async locale => {
    fixture.locale = locale; let tree = select(settle(), "B"); const before = new Map(bytes); fault = "srs-read";
    submitHandler(tree)({ preventDefault() {} }); tree = settle();
    expect(alertMessage(tree)).toBe(copy[locale].retry); expect(bytes).toEqual(before); expect(writes).toHaveLength(0);
    expect(nodes(tree).filter(node => node.props.onChange).every(node => !node.props.disabled)).toBe(true);
    noSuccess(tree); expect(reward).not.toHaveBeenCalled();
    submitHandler(tree)({ preventDefault() {} }); tree = settle();
    expect(alerts(tree)).toHaveLength(0); expect(feedback(tree)).toHaveLength(1); expect(bytes.get("coachfi-tokens")).toBe("150");
    expect(JSON.parse(bytes.get("coachfi-srs")!)).toMatchObject([{ id: "net-worth", repetitions: 1 }]);
    expect(writes.filter(write => write.key === "coachfi-srs")).toHaveLength(1); expect(reward).toHaveBeenCalledExactlyOnceWith(25);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(["pl", "en"] as const)("%s token writer changes150 then throws; uncertain locks UI and old submit cannot replay", async locale => {
    fixture.locale = locale; let tree = select(settle(), "B"); const captured = submitHandler(tree); fault = "token-set-after";
    captured({ preventDefault() {} }); tree = settle();
    expect(alertMessage(tree)).toBe(copy[locale].uncertain); noSuccess(tree); expect(issue).toHaveBeenCalledOnce();
    expect(bytes.get("coachfi-tokens")).toBe("150"); expect(JSON.parse(bytes.get("coachfi-srs")!)).toMatchObject([{ id: "net-worth", repetitions: 1 }]);
    expect(nodes(tree).filter(node => node.props.onChange).every(node => node.props.disabled === true)).toBe(true);
    const { translations } = await import("@/lib/i18n");
    expect(nodes(tree).find(node => text(node) === translations[locale].quiz.submit)?.props.disabled).toBe(true);
    expect(nodes(tree).find(node => node.props.onSubmit)?.props.onSubmit).toBeDefined();
    const before = new Map(bytes), calls = writes.length; captured({ preventDefault() {} }); submitHandler(tree)({ preventDefault() {} }); tree = settle();
    expect(bytes).toEqual(before); expect(writes).toHaveLength(calls); expect(reward).toHaveBeenCalledExactlyOnceWith(25); noSuccess(tree);
  });

  it("an attempted SRS writer that fails before changing bytes still quarantines the answer", async () => {
    let tree = select(settle(), "B"); fault = "srs-set-before"; submitHandler(tree)({ preventDefault() {} }); tree = settle();
    expect(alertMessage(tree)).toBe(copy.pl.uncertain); expect(bytes.get("coachfi-srs")).toBeUndefined(); expect(bytes.get("coachfi-tokens")).toBe("125");
    expect(writes.filter(write => write.key === "coachfi-srs")).toHaveLength(1); expect(reward).not.toHaveBeenCalled(); noSuccess(tree);
    const count = writes.length; submitHandler(tree)({ preventDefault() {} }); expect(writes).toHaveLength(count);
  });

  it("a later token event error is uncertain despite both local values having changed", async () => {
    let tree = select(settle(), "B"); fault = "token-event"; submitHandler(tree)({ preventDefault() {} }); tree = settle();
    expect(alertMessage(tree)).toBe(copy.pl.uncertain); expect(bytes.get("coachfi-tokens")).toBe("150");
    expect(JSON.parse(bytes.get("coachfi-srs")!)).toMatchObject([{ id: "net-worth", repetitions: 1 }]); noSuccess(tree);
    expect(issue).toHaveBeenCalledOnce(); const count = writes.length; submitHandler(tree)({ preventDefault() {} }); expect(writes).toHaveLength(count);
  });

  it("synchronous reentry and a captured duplicate submit are fenced before extra SRS/reward", async () => {
    let tree = select(settle(), "B"); const captured = submitHandler(tree); reenter = () => captured({ preventDefault() {} });
    captured({ preventDefault() {} }); captured({ preventDefault() {} }); tree = settle();
    expect(alerts(tree)).toHaveLength(0); expect(feedback(tree)).toHaveLength(1); expect(bytes.get("coachfi-tokens")).toBe("150");
    expect(writes.filter(write => write.key === "coachfi-srs")).toHaveLength(1); expect(reward).toHaveBeenCalledExactlyOnceWith(25); expect(complete).not.toHaveBeenCalled();
  });

  it("locale reset invalidates an old ticket even though the same storage owner remains current", async () => {
    let tree = select(settle(), "B"); const oldSubmit = submitHandler(tree); fixture.locale = "en"; tree = settle();
    const before = new Map(bytes); fixture.setState.mockClear(); oldSubmit({ preventDefault() {} });
    expect(bytes).toEqual(before); expect(writes).toHaveLength(0); expect(fixture.setState).not.toHaveBeenCalled(); expect(reward).not.toHaveBeenCalled(); noSuccess(tree);
    expect(nodes(tree).some(node => node.props.checked)).toBe(false);
  });

  it.each(["saved", "uncertain"] as const)("captured %s submit cannot replace the outcome with a preflight error after later cache corruption", async outcome => {
    let tree = select(settle(), "B"); const captured = submitHandler(tree);
    if (outcome === "uncertain") fault = "token-set-after";
    captured({ preventDefault() {} }); tree = settle();
    expect(feedback(tree)).toHaveLength(outcome === "saved" ? 1 : 0);
    if (outcome === "uncertain") expect(alertMessage(tree)).toBe(copy.pl.uncertain);
    bytes.set("coachfi-tokens", "25garbage"); const before = new Map(bytes), count = writes.length;
    fixture.setState.mockClear(); captured({ preventDefault() {} }); tree = settle();
    expect(bytes).toEqual(before); expect(writes).toHaveLength(count);
    if (outcome === "saved") expect(fixture.setState).not.toHaveBeenCalled();
    expect(reward).toHaveBeenCalledExactlyOnceWith(25); expect(complete).not.toHaveBeenCalled();
    expect(feedback(tree)).toHaveLength(outcome === "saved" ? 1 : 0);
    expect(alerts(tree)).toHaveLength(outcome === "saved" ? 0 : 1);
    if (outcome === "uncertain") expect(alertMessage(tree)).toBe(copy.pl.uncertain);
  });

  it("new owner resets uncertain UI while captured old callbacks cannot write to account B", async () => {
    let tree = select(settle(), "B"); const oldSubmit = submitHandler(tree); fault = "token-set-after"; oldSubmit({ preventDefault() {} }); tree = settle();
    expect(alerts(tree)).toHaveLength(1); const store = await import("@/lib/product-storage");
    const b = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B" }); b.storage.setItem("coachfi-tokens", "77"); b.publishReady({ localOnly: true }); fixture.storage = store.captureCurrentPersonalStorage(); tree = settle();
    expect(alerts(tree)).toHaveLength(0); const before = new Map(bytes), count = writes.length; fixture.setState.mockClear(); oldSubmit({ preventDefault() {} });
    expect(bytes).toEqual(before); expect(writes).toHaveLength(count); expect(fixture.setState).not.toHaveBeenCalled(); expect(fixture.storage.getItem("coachfi-tokens")).toBe("77");
    expect(fixture.storage.getItem("coachfi-srs")).toBeNull(); expect(complete).not.toHaveBeenCalled();
  });

  it("layout disposal invalidates a same-owner captured submit before any action", async () => {
    const tree = select(settle(), "B"), captured = submitHandler(tree);
    expect(fixture.cleanups.size).toBeGreaterThan(0); fixture.cleanups.forEach(cleanup => cleanup()); fixture.cleanups.clear();
    fixture.setState.mockClear(); const before = new Map(bytes); captured({ preventDefault() {} });
    expect(bytes).toEqual(before); expect(writes).toHaveLength(0); expect(fixture.setState).not.toHaveBeenCalled(); expect(reward).not.toHaveBeenCalled(); expect(complete).not.toHaveBeenCalled();
  });

  it("last question write failure never invokes completion or replays the third reward", async () => {
    const { translations } = await import("@/lib/i18n"); let tree = settle();
    for (const key of ["B", "C"]) {
      tree = select(tree, key); submitHandler(tree)({ preventDefault() {} }); tree = settle();
      const next = nodes(tree).find(node => node.props.onClick && text(node) === translations.pl.quiz.next);
      expect(next).toBeDefined(); next!.props.onClick!(); tree = settle();
    }
    expect(bytes.get("coachfi-tokens")).toBe("175"); tree = select(tree, "B"); const captured = submitHandler(tree); fault = "token-set-after";
    captured({ preventDefault() {} }); tree = settle(); expect(alertMessage(tree)).toBe(copy.pl.uncertain); noSuccess(tree);
    expect(bytes.get("coachfi-tokens")).toBe("195"); expect(JSON.parse(bytes.get("coachfi-srs")!)).toHaveLength(3);
    expect(reward.mock.calls.map(call => call[0])).toEqual([25, 25, 20]); const before = new Map(bytes), count = writes.length;
    captured({ preventDefault() {} }); expect(bytes).toEqual(before); expect(writes).toHaveLength(count); expect(complete).not.toHaveBeenCalled();
  });

  it("saved feedback rejects an old radio change; captured next advances only once", async () => {
    let tree = settle(); const oldRadio = nodes(tree).find(node => node.props.value === "A")!.props.onChange!;
    tree = select(tree, "B"); submitHandler(tree)({ preventDefault() {} }); tree = settle();
    fixture.setState.mockClear(); oldRadio(); tree = settle();
    expect(fixture.setState).not.toHaveBeenCalled(); expect(feedback(tree)).toHaveLength(1);
    expect(nodes(tree).find(node => node.props.value === "B")?.props.checked).toBe(true);
    const { translations } = await import("@/lib/i18n"), next = nodes(tree).find(node => node.props.onClick && text(node) === translations.pl.quiz.next)!.props.onClick!;
    next(); next(); tree = settle();
    expect(nodes(tree).some(node => node.props.name === "lifestyle-inflation")).toBe(true);
    expect(nodes(tree).some(node => node.props.name === "pay-yourself-first")).toBe(false);
    expect(reward).toHaveBeenCalledExactlyOnceWith(25);
  });

  it("wrong-answer retry creates one new ticket, permits correct save, and old retry cannot erase success", async () => {
    let tree = select(settle(), "A"); submitHandler(tree)({ preventDefault() {} }); tree = settle();
    const { translations } = await import("@/lib/i18n"), retry = nodes(tree).find(node => node.props.onClick && text(node) === translations.pl.quiz.retry)!.props.onClick!;
    retry(); retry(); tree = settle(); expect(nodes(tree).some(node => node.props.checked)).toBe(false);
    tree = select(tree, "B"); submitHandler(tree)({ preventDefault() {} }); tree = settle();
    expect(bytes.get("coachfi-tokens")).toBe("150"); expect(JSON.parse(bytes.get("coachfi-srs")!)).toMatchObject([{ id: "net-worth", repetitions: 1 }]);
    const before = new Map(bytes); fixture.setState.mockClear(); retry(); tree = settle();
    expect(bytes).toEqual(before); expect(fixture.setState).not.toHaveBeenCalled(); expect(feedback(tree)).toHaveLength(1); expect(reward).toHaveBeenCalledExactlyOnceWith(25);
  });
});

async function useActualPage() {
  const { default: Page } = await import("@/app/quiz/page"), { QuizCard } = await import("@/components/QuizCard"), { TokenRewardCard } = await import("@/components/TokenRewardCard");
  const content = Page().props.children as ReactElement;
  render = () => { fixture.slot = 0; return (content.type as unknown as () => ReactElement)(); };
  return { QuizCard, TokenRewardCard };
}

describe("independent actual parent persistence-issue callback", () => {
  it("resyncs only the readable current balance and clears solved/completion; stale callback is inert", async () => {
    const { QuizCard, TokenRewardCard } = await useActualPage();
    let tree = settle(); const card = nodes(tree).find(node => node.type === QuizCard)!;
    card.props.onComplete!(3, 3); card.props.onReward!(25); tree = settle();
    expect(nodes(tree).find(node => node.type === TokenRewardCard)?.props.balance).toBe(150);
    expect(text(tree)).toContain("Twój wynik to 100 / 100");
    fault = "token-set-after"; expect(() => card.props.onReward!(25)).toThrow("FIXTURE token writer");
    const count = writes.length; card.props.onPersistenceIssue!(); tree = settle();
    expect(writes).toHaveLength(count); expect(nodes(tree).find(node => node.type === TokenRewardCard)?.props.balance).toBe(175);
    const { translations } = await import("@/lib/i18n"); expect(nodes(tree).find(node => node.type === TokenRewardCard)?.props.status).toBe(translations.pl.rewards.tokens);
    expect(text(tree)).not.toContain("Twój wynik to 100 / 100");
    expect(window.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: "coachfi-tokens" }));
    const store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B" }).publishReady({ localOnly: true });
    const before = new Map(bytes); fixture.setState.mockClear(); vi.mocked(window.dispatchEvent).mockClear(); card.props.onPersistenceIssue!();
    expect(bytes).toEqual(before); expect(fixture.setState).not.toHaveBeenCalled(); expect(window.dispatchEvent).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });

  it("late markActive throw and a failed refresh event do not publish success or replay the reward", async () => {
    const { QuizCard, TokenRewardCard } = await useActualPage(); let tree = settle();
    const card = nodes(tree).find(node => node.type === QuizCard)!;
    pageFixture.markActive.mockImplementationOnce(() => { throw new Error("FIXTURE late activity failed"); });
    expect(() => card.props.onReward!(25)).toThrow("FIXTURE late activity"); tree = settle();
    expect(bytes.get("coachfi-tokens")).toBe("150");
    expect(nodes(tree).find(node => node.type === TokenRewardCard)?.props.balance).toBe(125);
    fault = "token-event"; const count = writes.length; expect(() => card.props.onPersistenceIssue!()).not.toThrow(); tree = settle();
    expect(nodes(tree).find(node => node.type === TokenRewardCard)?.props.balance).toBe(150);
    const { translations } = await import("@/lib/i18n"); expect(nodes(tree).find(node => node.type === TokenRewardCard)?.props.status).toBe(translations.pl.rewards.tokens);
    expect(writes).toHaveLength(count); expect(text(tree)).not.toContain("Twój wynik to 100 / 100");
  });

  it("markActive owner reentry prevents old reward callback state updates and leaves B untouched", async () => {
    const { QuizCard } = await useActualPage(); const tree = settle(), card = nodes(tree).find(node => node.type === QuizCard)!;
    const store = await import("@/lib/product-storage");
    pageFixture.markActive.mockImplementationOnce(() => {
      const b = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B" }); b.storage.setItem("coachfi-tokens", "77"); b.publishReady({ localOnly: true });
    });
    fixture.setState.mockClear(); card.props.onReward!(25);
    expect(fixture.setState).not.toHaveBeenCalled();
    const current = store.captureCurrentPersonalStorage(); expect(current.getItem("coachfi-tokens")).toBe("77"); expect(current.getItem("coachfi-srs")).toBeNull();
  });
});
