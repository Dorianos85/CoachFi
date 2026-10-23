import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

type Effect = () => void | (() => void);
const fixture = vi.hoisted(() => ({ locale: "pl" as import("@/lib/i18n").Locale, slot: 0, dirty: false,
  storage: null as unknown as PersonalStorageHandle, values: new Map<number, unknown>(),
  memos: new Map<number, { deps?: readonly unknown[]; value: unknown }>(),
  effects: [] as Effect[], effectDeps: new Map<number, readonly unknown[] | undefined>(), cleanups: new Map<number, () => void>(),
  stage: "retirement", markActive: vi.fn(),
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
    return [fixture.values.get(index), (value: unknown) => {
      const previous = fixture.values.get(index), next = typeof value === "function" ? value(previous) : value;
      if (!Object.is(previous, next)) fixture.dirty = true; fixture.values.set(index, next);
    }];
  },
}));
vi.mock("@/context/LanguageContext", async () => {
  const { translations } = await import("@/lib/i18n");
  return { useLanguage: () => ({ locale: fixture.locale, t: translations[fixture.locale] }) };
});
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: fixture.storage }) }));
vi.mock("@/context/StreakContext", () => ({ useStreak: () => ({ markActive: fixture.markActive }) }));
vi.mock("@/lib/account-sync", () => ({ persistLearningState: vi.fn() }));
vi.mock("@/lib/sync/syncQueue", () => ({ notifyCloud: vi.fn() }));
vi.mock("next/navigation", () => ({ useParams: () => ({ stage: fixture.stage }), notFound: () => { throw Error("FIXTURE missing route"); } }));

const STAGE = "retirement", TOPIC = "retirement";
const IDS = ["retirement-purpose", "retirement-early-start"];
const KEYS = ["B", "C"], REWARDS = [25, 35], BALANCES = [150, 185];
type Props = { children?: unknown; text?: string; locale?: string; name?: string; value?: string; href?: string; disabled?: boolean; role?: string;
  "data-testid"?: string; "aria-live"?: string; onChange?: () => void; onClick?: () => void; onSubmit?: (event: { preventDefault(): void }) => void };
type Node = ReactElement<Props>;
function nodes(value: unknown): Node[] { if (Array.isArray(value)) return value.flatMap(nodes); if (!value || typeof value !== "object" || !("props" in value)) return []; const node = value as Node; return [node, ...nodes(node.props.children)]; }
function text(value: unknown): string { if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(text).join(""); return value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : ""; }
function one(tree: unknown, id: string): Node { const found = nodes(tree).filter(node => node.props["data-testid"] === id); expect(found).toHaveLength(1); return found[0]!; }
let bytes: Map<string, string>, writes: Array<{ key: string; value?: string }>, render: () => ReactElement | null;
let reward = vi.fn<(amount: number) => void>(), complete = vi.fn<(correct: number, total: number) => void>();
function resetHooks() { fixture.cleanups.forEach(callback => callback()); fixture.cleanups.clear(); fixture.values.clear(); fixture.memos.clear(); fixture.effectDeps.clear(); fixture.effects.length = 0; fixture.slot = 0; fixture.dirty = false; }
function settle() { for (let turn = 0; turn < 12; turn++) { fixture.slot = 0; fixture.dirty = false; const tree = render(); fixture.effects.splice(0).forEach(callback => callback()); if (!fixture.dirty && !fixture.effects.length) return tree; } throw Error("FIXTURE did not settle within12 renders"); }
function click(tree: unknown, id: string) { const button = one(tree, id); expect(button.props.disabled).not.toBe(true); expect(button.props.onClick).toBeTypeOf("function"); button.props.onClick!(); return settle(); }
function submit(tree: unknown, answer: string) { const radio = one(tree, "quiz-answer-" + answer); expect(radio.props.disabled).not.toBe(true); radio.props.onChange!(); tree = settle(); expect(one(tree, "quiz-submit").props.disabled).toBe(false); const form = nodes(tree).find(node => node.props.onSubmit); expect(form).toBeDefined(); form!.props.onSubmit!({ preventDefault() {} }); return settle(); }
const feedback = (tree: unknown) => text(one(tree, "quiz-confirmed-feedback"));
function observed(name: string, extra: Record<string, unknown>) { console.log("C25_UI_OBSERVATION " + JSON.stringify({ name, locale: fixture.locale, rawTokens: bytes.get("coachfi-tokens"), rawSRS: bytes.get("coachfi-srs"), rawSteps: bytes.get("coachfi-lesson-steps"), writes: [...writes], ...extra })); }
async function useQuiz() { resetHooks(); const { QuizCard } = await import("@/components/QuizCard"); render = () => QuizCard({ topic: TOPIC, onReward: reward, onComplete: complete }); }
async function useLesson() { resetHooks(); const { default: StageLessonPage } = await import("@/app/learn/[stage]/page"); const body = StageLessonPage() as ReactElement<{ stage: string }>; expect(typeof body.type).toBe("function"); render = () => (body.type as (props: { stage: string }) => ReactElement)(body.props); }

beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); resetHooks(); fixture.locale = "pl"; fixture.stage = STAGE; vi.useFakeTimers(); vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
  bytes = new Map([["coachfi-tokens", "125"], ["coachfi-srs", "[]"]]); writes = [];
  const native = { getItem: (key: string) => bytes.get(key) ?? null, setItem: (key: string, value: string) => { writes.push({ key, value }); bytes.set(key, value); }, removeItem: (key: string) => { writes.push({ key }); bytes.delete(key); } };
  const win = new EventTarget() as EventTarget & { localStorage: typeof native; sessionStorage: typeof native }; Object.assign(win, { localStorage: native, sessionStorage: native }); vi.stubGlobal("window", win); vi.stubGlobal("fetch", vi.fn(() => { throw Error("FIXTURE no external calls"); }));
  const store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "guest" }).publishReady(); fixture.storage = store.captureCurrentPersonalStorage();
  const captured = fixture.storage, { addTokens } = await import("@/lib/tokens"); reward = vi.fn(amount => { addTokens(amount, "FIXTURE retirement quiz", "FIXTURE reviewer", captured); }); complete = vi.fn();
});
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); resetHooks(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("C25 actual retirement route, lesson and canonical PLEN consumer baseline", () => {
  it("two existing IDs retain order BC and60 reward while PLEN retirement resolves their canonical language", async () => {
    const { getTopicQuestions } = await import("@/lib/quiz-topic"), { getQuestionById, getAllQuestionIds, allQuestions } = await import("@/lib/allQuestions"), { STAGE_QUESTION_IDS } = await import("@/lib/learningProgress");
    const before = new Map(bytes); expect(STAGE_QUESTION_IDS[STAGE]).toEqual(IDS); expect(REWARDS.reduce((sum, value) => sum + value, 0)).toBe(60);
    const routing = [];
    for (const locale of ["pl", "en"] as const) {
      const pool = getTopicQuestions(locale, TOPIC); expect(pool.map(question => question.id)).toEqual(IDS); expect(pool.map(question => question.correctAnswer)).toEqual(KEYS); expect(pool.map(question => question.reward)).toEqual(REWARDS);
      for (const [index, id] of IDS.entries()) { expect(getAllQuestionIds(locale)).toHaveLength(82); expect(getAllQuestionIds(locale).filter(value => value === id)).toHaveLength(1); expect(allQuestions.filter(question => question.id === id)).toHaveLength(1); expect(getQuestionById(id, locale)).toMatchObject({ id, correctAnswer: KEYS[index], reward: REWARDS[index] }); }
      routing.push({ locale, actual: pool.map(q => ({ id: q.id, question: q.question, answers: q.answers, retryMessage: q.retryMessage })), canonical: IDS.map(id => getQuestionById(id, locale)) });
    }
    expect(bytes).toEqual(before); expect(writes).toEqual([]); observed("routing-inventory", { routing });
    for (const locale of ["pl", "en"] as const) for (const question of getTopicQuestions(locale, TOPIC)) {
      const canonical = getQuestionById(question.id, locale)!;
      expect.soft({ question: question.question, answers: question.answers, explanation: question.retryMessage }, locale + "/" + question.id).toEqual({ question: canonical.question, answers: canonical.answers, explanation: canonical.explanation });
    }
  });
  it.each(["pl", "en"] as const)("%s actual QuizCard renders two canonical questions and complete voices, wrongA/retryB then60points and two SRS acknowledgements", async locale => {
    fixture.locale = locale; await useQuiz(); let tree = settle(); const { getTopicQuestions } = await import("@/lib/quiz-topic"), { getQuestionById, getAllQuestionIds } = await import("@/lib/allQuestions"), { getAllCards, getDueIds } = await import("@/lib/srs"), { getAllStageProgress } = await import("@/lib/learningProgress");
    const pool = getTopicQuestions(locale, TOPIC), displayed = [];
    expect(pool).toHaveLength(2); expect(pool[0]!.correctAnswer).toBe("B");
    tree = submit(tree, "A"); const wrongFeedback = feedback(tree); expect(wrongFeedback).toBe(pool[0]!.retryMessage); expect(bytes.get("coachfi-tokens")).toBe("125"); expect(reward).not.toHaveBeenCalled(); expect(complete).not.toHaveBeenCalled(); expect(getAllCards(fixture.storage)).toHaveLength(1); expect(getAllCards(fixture.storage)[0]).toMatchObject({ id: IDS[0], repetitions: 0, nextReview: "2026-01-02" }); tree = click(tree, "quiz-retry");
    for (const [index, question] of pool.entries()) {
      const shown = text(nodes(tree).find(node => node.type === "legend")), wholeVoice = [question.question, ...question.answers.map(answer => answer.id + ". " + answer.text)].join(" ");
      expect(shown).toBe(question.question); expect(nodes(tree).filter(node => node.props.name === IDS[index]).map(node => node.props.value)).toEqual(["A", "B", "C", "D"]); for (const answer of question.answers) expect(text(tree)).toContain(answer.text);
      const voices = nodes(tree).filter(node => node.props.text && node.props.locale); expect(wholeVoice.length).toBeLessThanOrEqual(500); expect(voices).toHaveLength(2); expect(voices.every(node => node.props.text === wholeVoice && node.props.locale === locale)).toBe(true);
      tree = submit(tree, KEYS[index]!); expect(feedback(tree)).toBe(question.successMessage); expect(bytes.get("coachfi-tokens")).toBe(String(BALANCES[index])); displayed.push({ id: question.id, question: shown, answers: question.answers, wholeVoice, success: feedback(tree), canonical: getQuestionById(question.id, locale) }); if (index < 1) tree = click(tree, "quiz-next");
    }
    expect(reward.mock.calls.map(call => call[0])).toEqual(REWARDS); expect(complete).toHaveBeenCalledExactlyOnceWith(2, 2); expect(bytes.get("coachfi-tokens")).toBe("185"); expect(bytes.has("coachfi-lesson-steps")).toBe(false);
    expect(getAllCards(fixture.storage).map(card => card.id)).toEqual(IDS); expect(getAllCards(fixture.storage).every(card => card.repetitions === 1 && card.nextReview === "2026-01-02")).toBe(true); expect(getAllStageProgress(fixture.storage).find(stage => stage.stageId === STAGE)).toMatchObject({ answeredCount: 2, totalCount: 2, progressPct: 100 });
    vi.setSystemTime(new Date("2026-01-02T12:00:00.000Z")); expect(getDueIds(getAllQuestionIds(locale), fixture.storage).filter(id => IDS.includes(id))).toEqual(IDS); observed("two-correct-" + locale, { wrongFeedback, displayed, rewardCalls: reward.mock.calls, completeCalls: complete.mock.calls });
    for (const item of displayed) { expect.soft(item.question, locale + "/" + item.id).toBe(item.canonical!.question); expect.soft(item.answers, locale + "/" + item.id).toEqual(item.canonical!.answers); }
  });
  it.each(["pl", "en"] as const)("%s actual two lesson steps save1through2 and link to retirement without inventing quiz completion", async locale => {
    fixture.locale = locale; await useLesson(); const { stageLessons } = await import("@/data/stageLessons"), { getAllStageProgress } = await import("@/lib/learningProgress"); const copy = stageLessons[STAGE].copy[locale]!; expect(copy.steps).toHaveLength(2); let tree = settle(); const displayed = [];
    for (let index = 0; index < 2; index++) {
      const step = copy.steps[index]!; expect(text(nodes(tree).find(node => node.type === "h1"))).toBe(copy.title); expect(text(nodes(tree).find(node => node.type === "h2"))).toBe(step.title); expect(text(tree)).toContain(step.body); expect(JSON.parse(bytes.get("coachfi-lesson-steps")!)[STAGE]).toBe(index + 1); displayed.push(step);
      if (index < 1) { const next = nodes(tree).find(node => node.props.onClick && text(node) === copy.next); expect(next).toBeDefined(); expect(next!.props.disabled).not.toBe(true); next!.props.onClick!(); tree = settle(); }
    }
    expect(nodes(tree).some(node => node.props.href === "/quiz?topic=retirement" && text(node) === copy.quiz)).toBe(true); expect(bytes.get("coachfi-tokens")).toBe("125"); expect(bytes.get("coachfi-srs")).toBe("[]"); expect(getAllStageProgress(fixture.storage).find(stage => stage.stageId === STAGE)).toMatchObject({ answeredCount: 0, totalCount: 2, progressPct: 0 }); expect(reward).not.toHaveBeenCalled(); observed("two-lesson-steps-" + locale, { displayed, savedStepFraction: "2/2", quizStageProgressPct: 0 });
  });
  it.each(["pl", "en"] as const)("%s invalid retirement step3 preserves bytes and blocks Next without a false quiz completion", async locale => {
    fixture.locale = locale; const badRaw = '{"retirement":3}'; bytes.set("coachfi-lesson-steps", badRaw); const before = new Map(bytes); await useLesson(); let tree = settle();
    const expected = locale === "pl" ? "Nie udało się potwierdzić zapisu kroku lekcji. Przejście dalej jest zablokowane. Odśwież stronę, aby ponownie odczytać dane lokalne." : "The lesson step save could not be confirmed. Continuing is blocked. Reload the page to read the local data again.";
    const alerts = nodes(tree).filter(node => node.props.role === "alert"); expect(alerts).toHaveLength(1); expect(text(alerts[0])).toBe(expected); expect(bytes).toEqual(before); expect(writes).toEqual([]); expect(reward).not.toHaveBeenCalled(); expect(complete).not.toHaveBeenCalled();
    const next = nodes(tree).find(node => node.props.onClick); expect(next).toBeDefined(); expect(next!.props.disabled).toBe(true); next!.props.onClick!(); tree = settle(); expect(bytes).toEqual(before); expect(writes).toEqual([]); expect(nodes(tree).some(node => node.props.href === "/quiz?topic=retirement")).toBe(false); expect(nodes(tree).filter(node => node.props.role === "alert")).toHaveLength(1); observed("invalid-step3-" + locale, { rawPreserved: bytes.get("coachfi-lesson-steps"), nextDisabled: true, questionReward: 0 });
  });
});
