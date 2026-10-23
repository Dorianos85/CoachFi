import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

type Effect = () => void | (() => void);
const fixture = vi.hoisted(() => ({ locale: "pl" as import("@/lib/i18n").Locale, slot: 0,
  storage: null as unknown as PersonalStorageHandle, values: new Map<number, unknown>(),
  memos: new Map<number, { deps?: readonly unknown[]; value: unknown }>(),
  effects: [] as Effect[], effectDeps: new Map<number, readonly unknown[] | undefined>(), cleanups: new Map<number, () => void>(),
  setState: vi.fn(), markActive: vi.fn(), stage: "saving-habit", failLessonWrite: false,
}));
const sameDeps = (a?: readonly unknown[], b?: readonly unknown[]) => !!a && !!b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
function memo(factory: () => unknown, deps?: readonly unknown[]) {
  const index = fixture.slot++, previous = fixture.memos.get(index);
  if (!previous || !sameDeps(previous.deps, deps)) fixture.memos.set(index, { deps, value: factory() });
  return fixture.memos.get(index)?.value;
}
function effect(effect: Effect, deps?: readonly unknown[]) {
  const index = fixture.slot++;
  if (!fixture.effectDeps.has(index) || !sameDeps(fixture.effectDeps.get(index), deps)) fixture.effects.push(() => {
    fixture.cleanups.get(index)?.(); fixture.cleanups.delete(index);
    const cleanup = effect(); if (typeof cleanup === "function") fixture.cleanups.set(index, cleanup);
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
    return [fixture.values.get(index), (value: unknown) => { fixture.setState(value);
      fixture.values.set(index, typeof value === "function" ? value(fixture.values.get(index)) : value); }];
  },
}));
vi.mock("@/context/LanguageContext", async () => {
  const { translations } = await import("@/lib/i18n");
  return { useLanguage: () => ({ locale: fixture.locale, t: translations[fixture.locale] }) };
});
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: fixture.storage }) }));
vi.mock("@/context/StreakContext", () => ({ useStreak: () => ({ markActive: fixture.markActive }) }));

vi.mock("next/navigation", () => ({ useParams: () => ({ stage: fixture.stage }), notFound: () => { throw Error("FIXTURE route not found"); } }));
type Props = { children?: unknown; text?: string; locale?: string; name?: string; value?: string; checked?: boolean; href?: string; role?: string; disabled?: boolean;
  "aria-live"?: string; onChange?: () => void; onClick?: () => void; onSubmit?: (event: { preventDefault(): void }) => void };
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
const IDS = ["saving-habit", "budget-50-30-20", "high-yield-savings", "dca"];
const KEYS = ["C", "B", "B", "C"], REWARDS = [25, 25, 20, 30], BALANCES = [150, 175, 195, 225];
let bytes: Map<string, string>, writes: Array<{ key: string; value: string }>, render: () => ReactElement;
let reward = vi.fn<(amount: number) => void>(), complete = vi.fn<(correct: number, total: number) => void>();
function resetHooks() { fixture.cleanups.forEach(callback => callback()); fixture.values.clear(); fixture.memos.clear(); fixture.effectDeps.clear(); fixture.cleanups.clear(); fixture.effects.length = 0; fixture.slot = 0; }
function settle() { let tree = render(); for (let i = 0; i < 8 && fixture.effects.length; i++) { fixture.effects.splice(0).forEach(callback => callback()); tree = render(); } expect(fixture.effects).toHaveLength(0); return tree; }
function action(tree: unknown, label: string) { const node = nodes(tree).find(node => node.props.onClick && text(node) === label); expect(node).toBeDefined(); node!.props.onClick!(); return settle(); }
function submitHandler(tree: unknown) { const form = nodes(tree).find(node => node.props.onSubmit); expect(form).toBeDefined(); return form!.props.onSubmit!; }
function submit(tree: unknown, value: string) { const radio = nodes(tree).find(node => node.props.value === value && node.props.onChange); expect(radio).toBeDefined(); radio!.props.onChange!(); tree = settle(); submitHandler(tree)({ preventDefault() {} }); return settle(); }
const feedback = (tree: unknown) => text(nodes(tree).find(node => node.props["aria-live"] === "polite"));
async function useLesson() {
  resetHooks(); const { default: StageLessonPage } = await import("@/app/learn/[stage]/page");
  const body = StageLessonPage() as ReactElement<{ stage: string }>; expect(typeof body.type).toBe("function");
  render = () => { fixture.slot = 0; return (body.type as (props: { stage: string }) => ReactElement)(body.props); };
}
async function useQuiz() { resetHooks(); const { QuizCard } = await import("@/components/QuizCard"); render = () => { fixture.slot = 0; return QuizCard({ topic: "saving", onReward: reward, onComplete: complete }); }; }
beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z")); resetHooks(); fixture.locale = "pl"; fixture.stage = "saving-habit"; fixture.failLessonWrite = false;
  bytes = new Map([["coachfi-tokens", "125"]]); writes = [];
  const storage = { getItem: (key: string) => bytes.get(key) ?? null, setItem: (key: string, value: string) => { writes.push({ key, value }); if(key === "coachfi-lesson-steps" && fixture.failLessonWrite) { fixture.failLessonWrite=false; throw Error("FIXTURE refused lesson writer"); } bytes.set(key, value); }, removeItem: (key: string) => { bytes.delete(key); } };
  const windowStub = new EventTarget() as EventTarget & { localStorage: typeof storage; sessionStorage: typeof storage };
  Object.assign(windowStub, { localStorage: storage, sessionStorage: storage }); vi.stubGlobal("window", windowStub); vi.stubGlobal("fetch", vi.fn(() => { throw Error("No real network permitted."); }));
  const store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "guest" }).publishReady(); fixture.storage = store.captureCurrentPersonalStorage();
  const captured = fixture.storage, { addTokens } = await import("@/lib/tokens"); reward = vi.fn(amount => { addTokens(amount, "FIXTURE saving quiz", "FIXTURE reviewer", captured); }); complete = vi.fn(); await useQuiz();
});
afterEach(() => { resetHooks(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("independent B06 actual generic saving lesson boundaries", () => {
  it("captured lesson Next cannot record a step in a newly selected owner", async () => {
    await useLesson(); let tree = settle(); const { stageLessons } = await import("@/data/stageLessons"); const oldNext = nodes(tree).find(node => node.props.onClick && text(node) === stageLessons["saving-habit"].copy.pl!.next)!.props.onClick!;
    const store = await import("@/lib/product-storage"); const b = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_SAVING_B" }); b.publishReady({ localOnly: true }); fixture.storage = store.captureCurrentPersonalStorage(); tree = settle();
    const before = new Map(bytes), count = writes.length; fixture.setState.mockClear(); oldNext(); settle(); expect(bytes).toEqual(before); expect(writes).toHaveLength(count); expect(fixture.setState).not.toHaveBeenCalled();
  });
  it("captured Next invoked twice before rerender advances only one lesson step", async () => {
    await useLesson(); let tree = settle(); const { stageLessons } = await import("@/data/stageLessons"); const copy = stageLessons["saving-habit"].copy.pl!, captured = nodes(tree).find(node => node.props.onClick && text(node) === copy.next)!.props.onClick!;
    captured(); captured(); tree = settle(); expect(text(nodes(tree).find(node => node.type === "h2"))).toBe(copy.steps[1].title); expect(JSON.parse(fixture.storage.getItem("coachfi-lesson-steps")!)["saving-habit"]).toBe(2);
  });
  it("prototype route receives controlled notFound rather than crashing lesson copy", async () => {
    fixture.stage = "toString"; await expect((async () => { await useLesson(); return settle(); })()).rejects.toThrow("FIXTURE route not found");
  });
  it("lesson writer refusal is contained, visibly reported and disables Next", async () => {
    await useLesson(); fixture.failLessonWrite = true; let tree: ReactElement | undefined; expect(() => { tree = settle(); }).not.toThrow();
    expect(nodes(tree).filter(node => node.props.role === "alert")).toHaveLength(1); const { stageLessons } = await import("@/data/stageLessons"); const next = nodes(tree).find(node => node.props.onClick && text(node) === stageLessons["saving-habit"].copy.pl!.next); expect(next).toBeDefined(); expect(next!.props.disabled).toBe(true); expect(fixture.storage.getItem("coachfi-lesson-steps")).toBeNull();
  });
});

describe("independent B06 saving PL/EN canonical content and progress", () => {
  it.each((["pl", "en"] as const).flatMap(locale => IDS.map((id, index) => ({ locale, id, index }))))("$locale $id uses canonical text, feedback, voice and existing reward", async ({ locale, id, index }) => {
    fixture.locale = locale; const { translations } = await import("@/lib/i18n"), { getTopicQuestions } = await import("@/lib/quiz-topic"), { getQuestionById } = await import("@/lib/allQuestions"), { quizQuestions } = await import("@/data/quizQuestions");
    const pool = getTopicQuestions(locale, "saving"), canonical = getQuestionById(id, locale)!; expect(pool.map(question => question.id)).toEqual(IDS);
    expect(pool.map(question => question.correctAnswer)).toEqual(KEYS); expect(pool.map(question => question.reward)).toEqual(REWARDS);
    const question = pool[index]; expect(question.question).toBe(canonical.question); expect(question.answers).toEqual(canonical.answers); expect(question.retryMessage).toBe(canonical.explanation);
    expect(question.successMessage).toBe(locale === "pl" ? canonical.explanation : quizQuestions.find(question => question.id === id)!.successMessage);
    if (locale === "pl") expect(question.question).not.toBe(getQuestionById(id, "en")!.question);
    let tree = settle(); for (let i = 0; i < index; i++) { tree = submit(tree, KEYS[i]); tree = action(tree, translations[locale].quiz.next); }
    expect(text(nodes(tree).find(node => node.type === "legend"))).toBe(canonical.question); expect(nodes(tree).filter(node => node.props.name === id).map(node => node.props.value)).toEqual(["A", "B", "C", "D"]);
    const expectedVoice = [canonical.question, ...canonical.answers.map(answer => `${answer.id}. ${answer.text}`)].join(" ");
    const voices = nodes(tree).filter(node => node.props.text && node.props.locale); expect(voices).toHaveLength(2); expect(voices.every(node => node.props.locale === locale && node.props.text === expectedVoice)).toBe(true);
    const beforeWrong = bytes.get("coachfi-tokens"), rewardCount = reward.mock.calls.length; tree = submit(tree, "A"); expect(feedback(tree)).toBe(question.retryMessage); expect(bytes.get("coachfi-tokens")).toBe(beforeWrong); expect(reward).toHaveBeenCalledTimes(rewardCount);
    tree = action(tree, translations[locale].quiz.retry); tree = submit(tree, KEYS[index]); expect(feedback(tree)).toBe(question.successMessage); expect(bytes.get("coachfi-tokens")).toBe(String(BALANCES[index])); expect(reward).toHaveBeenLastCalledWith(REWARDS[index]);
    const cards = JSON.parse(fixture.storage.getItem("coachfi-srs")!) as Array<{ id: string; repetitions: number }>; expect(cards.find(card => card.id === id)?.repetitions).toBe(1);
    const before = new Map(bytes), count = writes.length; submitHandler(tree)({ preventDefault() {} }); expect(bytes).toEqual(before); expect(writes).toHaveLength(count);
  });
  it.each(["pl", "en"] as const)("%s four actual lesson steps record progress and lead to four-question quiz", async locale => {
    fixture.locale = locale; await useLesson(); const { stageLessons } = await import("@/data/stageLessons"); const lesson = stageLessons["saving-habit"], copy = lesson.copy[locale]!; expect(copy.steps).toHaveLength(4); let tree = settle();
    for (let i = 0; i < 4; i++) { expect(text(nodes(tree).find(node => node.type === "h1"))).toBe(copy.title); expect(text(nodes(tree).find(node => node.type === "h2"))).toBe(copy.steps[i].title); expect(text(tree)).toContain(copy.steps[i].body); expect(JSON.parse(fixture.storage.getItem("coachfi-lesson-steps")!)["saving-habit"]).toBe(i + 1); if (i < 3) tree = action(tree, copy.next); }
    expect(nodes(tree).some(node => node.props.href === "/quiz?topic=saving" && text(node) === copy.quiz)).toBe(true); expect(bytes.get("coachfi-tokens")).toBe("125");
    await useQuiz(); tree = settle(); const { translations } = await import("@/lib/i18n"); for (let i = 0; i < 4; i++) { tree = submit(tree, KEYS[i]); if (i < 3) tree = action(tree, translations[locale].quiz.next); }
    expect(bytes.get("coachfi-tokens")).toBe("225"); expect(reward.mock.calls.map(call => call[0])).toEqual(REWARDS); expect(complete).toHaveBeenCalledExactlyOnceWith(4, 4);
    expect(JSON.parse(fixture.storage.getItem("coachfi-srs")!).map((card: { id: string }) => card.id)).toEqual(IDS);
  });
  it("quiz completion restart and locale reset retain progress without another reward or stale selection", async () => {
    const { translations } = await import("@/lib/i18n"); let tree = settle(); for (let i = 0; i < 4; i++) { tree = submit(tree, KEYS[i]); if (i < 3) tree = action(tree, translations.pl.quiz.next); }
    tree = action(tree, translations.pl.quiz.restart); const oldRadio = nodes(tree).find(node => node.props.value === "A")!.props.onChange!; oldRadio(); tree = settle(); const oldSubmit = submitHandler(tree), before = new Map(bytes), count = writes.length;
    fixture.locale = "en"; tree = settle(); fixture.setState.mockClear(); oldSubmit({ preventDefault() {} }); oldRadio(); expect(fixture.setState).not.toHaveBeenCalled(); expect(bytes).toEqual(before); expect(writes).toHaveLength(count);
    expect(nodes(tree).some(node => node.props.checked === true)).toBe(false); expect(reward).toHaveBeenCalledTimes(4); expect(complete).toHaveBeenCalledExactlyOnceWith(4, 4);
  });
  it.each(["guest", "account"] as const)("captured %s quiz submit cannot mutate another owner", async kind => {
    const store = await import("@/lib/product-storage"); if (kind === "account") { store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_SAVING_A" }).publishReady({ localOnly: true }); fixture.storage = store.captureCurrentPersonalStorage(); }
    let tree = settle(); nodes(tree).find(node => node.props.value === "C")!.props.onChange!(); tree = settle(); const old = submitHandler(tree);
    const b = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_SAVING_B" }); b.storage.setItem("coachfi-tokens", "77"); b.publishReady({ localOnly: true }); const before = new Map(bytes), count = writes.length; fixture.setState.mockClear(); old({ preventDefault() {} });
    expect(bytes).toEqual(before); expect(writes).toHaveLength(count); expect(fixture.setState).not.toHaveBeenCalled(); expect(reward).not.toHaveBeenCalled(); expect(complete).not.toHaveBeenCalled(); expect(store.captureCurrentPersonalStorage().getItem("coachfi-srs")).toBeNull();
  });
  it("unknown and prototype query strings retain the current plain pool", async () => {
    const { getTopicQuestions, isKnownQuizTopic } = await import("@/lib/quiz-topic"), { getQuizQuestions } = await import("@/lib/localizedQuiz");
    for (const topic of ["__proto__", "constructor", "toString", "unknown", "", undefined]) for (const locale of ["pl", "en"] as const) { expect(isKnownQuizTopic(topic)).toBe(false); expect(getTopicQuestions(locale, topic)).toEqual(getQuizQuestions(locale)); expect(getTopicQuestions(locale, topic)).toHaveLength(4); }
  });
});

describe("independent extra generic lesson cases", () => {
  it("sign-in progress notify reentry cannot advance the active lesson while saving", async () => {
    await useLesson(); const { stageLessons } = await import("@/data/stageLessons"); const copy = stageLessons["saving-habit"].copy.pl!;
    const originalRender=render; let lastTree: ReactElement | undefined; render=()=>{lastTree=originalRender();return lastTree;};
    let tree=settle(); const { subscribeSignInProgress } = await import("@/lib/signInGate"); let calls=0;
    const unsubscribe=subscribeSignInProgress(()=>{ calls++; unsubscribe(); const currentNext=nodes(lastTree).find(node=>node.props.onClick && text(node)===copy.next); expect(currentNext).toBeDefined(); currentNext!.props.onClick!(); });
    tree=action(tree,copy.next); expect(calls).toBe(1); expect(text(nodes(tree).find(node=>node.type==="h2"))).toBe(copy.steps[1].title);
    expect(JSON.parse(fixture.storage.getItem("coachfi-lesson-steps")!)["saving-habit"]).toBe(2);
  });
  it("last-step refusal blocks quiz link and old Next without replacing preserved progress", async () => {
    await useLesson(); const { stageLessons }=await import("@/data/stageLessons"); const copy=stageLessons["saving-habit"].copy.pl!;
    let tree=settle(); tree=action(tree,copy.next); tree=action(tree,copy.next);
    const captured=nodes(tree).find(node=>node.props.onClick && text(node)===copy.next)!.props.onClick!; fixture.failLessonWrite=true; captured(); tree=settle();
    expect(nodes(tree).filter(node=>node.props.role==="alert")).toHaveLength(1); expect(nodes(tree).some(node=>node.props.href==="/quiz?topic=saving")).toBe(false);
    const blocked=nodes(tree).find(node=>text(node)===copy.quiz && node.props.disabled===true); expect(blocked).toBeDefined();
    expect(JSON.parse(fixture.storage.getItem("coachfi-lesson-steps")!)["saving-habit"]).toBe(3); expect(bytes.get("coachfi-tokens")).toBe("125");
    const before=new Map(bytes),count=writes.length;fixture.setState.mockClear();captured();expect(bytes).toEqual(before);expect(writes).toHaveLength(count);expect(fixture.setState).not.toHaveBeenCalled();
    fixture.locale="en";tree=settle();expect(nodes(tree).some(node=>node.props.href==="/quiz?topic=saving")).toBe(false);expect(bytes).toEqual(before);expect(writes).toHaveLength(count);
  });
});
