import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

type Effect = () => void | (() => void);
const fixture = vi.hoisted(() => ({ locale: "pl" as import("@/lib/i18n").Locale, slot: 0,
  storage: null as unknown as PersonalStorageHandle, values: new Map<number, unknown>(),
  memos: new Map<number, { deps?: readonly unknown[]; value: unknown }>(),
  effects: [] as Effect[], effectDeps: new Map<number, readonly unknown[] | undefined>(), cleanups: new Map<number, () => void>(),
  setState: vi.fn(), markActive: vi.fn(), stage: "emergency-fund", failLessonWrite: false,
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
const IDS = ["emergency-fund", "emergency-fund-characteristics", "emergency-fund-start"];
const KEYS = ["C", "C", "B"], REWARDS = [25, 25, 20], BALANCES = [150, 175, 195];
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
async function useQuiz() { resetHooks(); const { QuizCard } = await import("@/components/QuizCard"); render = () => { fixture.slot = 0; return QuizCard({ topic: "emergency", onReward: reward, onComplete: complete }); }; }
beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z")); resetHooks(); fixture.locale = "pl"; fixture.stage = "emergency-fund"; fixture.failLessonWrite = false;
  bytes = new Map([["coachfi-tokens", "125"]]); writes = [];
  const storage = { getItem: (key: string) => bytes.get(key) ?? null, setItem: (key: string, value: string) => { writes.push({ key, value }); if(key === "coachfi-lesson-steps" && fixture.failLessonWrite) { fixture.failLessonWrite=false; throw Error("FIXTURE refused lesson writer"); } bytes.set(key, value); }, removeItem: (key: string) => { bytes.delete(key); } };
  const windowStub = new EventTarget() as EventTarget & { localStorage: typeof storage; sessionStorage: typeof storage };
  Object.assign(windowStub, { localStorage: storage, sessionStorage: storage }); vi.stubGlobal("window", windowStub); vi.stubGlobal("fetch", vi.fn(() => { throw Error("No real network permitted."); }));
  const store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "guest" }).publishReady(); fixture.storage = store.captureCurrentPersonalStorage();
  const captured = fixture.storage, { addTokens } = await import("@/lib/tokens"); reward = vi.fn(amount => { addTokens(amount, "FIXTURE emergency quiz", "FIXTURE reviewer", captured); }); complete = vi.fn(); await useQuiz();
});
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); resetHooks(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("independent C17 before-edit actual emergency resolver/lesson and SRS baseline", () => {
  it.each(["emergency-fund-characteristics", "emergency-fund-start"])("PL %s returns canonical Polish content instead of English bank fallback", async id => {
    const { getTopicQuestions } = await import("@/lib/quiz-topic"), { getQuestionById } = await import("@/lib/allQuestions"), { quizQuestions } = await import("@/data/quizQuestions");
    const pool = getTopicQuestions("pl", "emergency"); expect(pool.map(question => question.id)).toEqual(IDS);
    expect(pool.map(question => question.correctAnswer)).toEqual(KEYS); expect(pool.map(question => question.reward)).toEqual(REWARDS);
    const actual = pool.find(question => question.id === id)!, canonical = getQuestionById(id, "pl")!, english = quizQuestions.find(question => question.id === id)!;
    expect(canonical).toBeDefined(); expect(english).toBeDefined();
    let tree = settle(); const { translations } = await import("@/lib/i18n"); const index = IDS.indexOf(id);
    for (let previous = 0; previous < index; previous++) { tree = submit(tree, KEYS[previous]); tree = action(tree, translations.pl.quiz.next); }
    expect(text(nodes(tree).find(node => node.type === "legend"))).toBe(actual.question);
    expect(nodes(tree).filter(node => node.props.name === id).map(node => node.props.value)).toEqual(["A", "B", "C", "D"]);
    expect(actual.question, "Actual EnglishBankReference=" + String(actual === english)).toBe(canonical.question);
    expect(actual.answers).toEqual(canonical.answers); expect(actual.retryMessage).toBe(canonical.explanation); expect(actual.question).not.toBe(english.question);
  });
  it.each(["pl", "en"] as const)("%s actual generic emergency lesson renders three authored steps and saves step1to3 without reward", async locale => {
    fixture.locale = locale; await useLesson(); const { stageLessons } = await import("@/data/stageLessons"), lesson = stageLessons["emergency-fund"], copy = lesson.copy[locale]!;
    expect(copy.steps).toHaveLength(3); let tree = settle();
    for (let index = 0; index < 3; index++) {
      expect(text(nodes(tree).find(node => node.type === "h1"))).toBe(copy.title); expect(text(nodes(tree).find(node => node.type === "h2"))).toBe(copy.steps[index].title); expect(text(tree)).toContain(copy.steps[index].body);
      expect(JSON.parse(fixture.storage.getItem("coachfi-lesson-steps")!)["emergency-fund"]).toBe(index + 1); expect(bytes.get("coachfi-tokens")).toBe("125"); if (index < 2) tree = action(tree, copy.next);
    }
    expect(nodes(tree).some(node => node.props.href === "/quiz?topic=emergency" && text(node) === copy.quiz)).toBe(true); expect(nodes(tree).filter(node => node.props.role === "alert")).toHaveLength(0);
  });
  it("three existing STAGE IDs are unique and canonical PLEN with original order, keys and70 total reward", async () => {
    const { getQuestionById, getAllQuestionIds, allQuestions } = await import("@/lib/allQuestions"), { STAGE_QUESTION_IDS } = await import("@/lib/learningProgress"), { quizQuestions } = await import("@/data/quizQuestions");
    expect(STAGE_QUESTION_IDS["emergency-fund"]).toEqual(IDS); expect(REWARDS.reduce((sum, reward) => sum + reward, 0)).toBe(70);
    for (const locale of ["pl", "en"] as const) for (const [index, id] of IDS.entries()) {
      const question = getQuestionById(id, locale); expect(question, locale + "/" + id).toBeDefined(); expect(question).toMatchObject({id,correctAnswer:KEYS[index],reward:REWARDS[index]});
      expect(question!.answers.map(answer => answer.id)).toEqual(["A", "B", "C", "D"]); expect(getAllQuestionIds(locale)).toContain(id); expect(allQuestions.filter(question => question.id === id)).toHaveLength(1);
      expect(quizQuestions.find(question => question.id === id)).toMatchObject({id,correctAnswer:KEYS[index],reward:REWARDS[index]});
    }
  });
  it.each(["pl", "en"] as const)("%s actual existing QuizCard saves three emergency SRS cards and70points; nextday canonical due lookup retains all three", async locale => {
    fixture.locale = locale; let tree = settle(); const { getTopicQuestions } = await import("@/lib/quiz-topic"), { translations } = await import("@/lib/i18n"); const pool = getTopicQuestions(locale, "emergency");
    expect(pool.map(question => question.id)).toEqual(IDS);
    for (let index = 0; index < 3; index++) {
      expect(text(nodes(tree).find(node => node.type === "legend"))).toBe(pool[index].question); tree = submit(tree, KEYS[index]); expect(feedback(tree)).toBe(pool[index].successMessage);
      expect(bytes.get("coachfi-tokens")).toBe(String(BALANCES[index])); if (index < 2) tree = action(tree, translations[locale].quiz.next);
    }
    expect(reward.mock.calls.map(call => call[0])).toEqual(REWARDS); expect(complete).toHaveBeenCalledExactlyOnceWith(3,3); expect(bytes.get("coachfi-tokens")).toBe("195");
    const { getAllCards, getDueIds } = await import("@/lib/srs"), { getAllQuestionIds, getQuestionById } = await import("@/lib/allQuestions"), { getAllStageProgress } = await import("@/lib/learningProgress");
    expect(getAllCards(fixture.storage).map(card => card.id)).toEqual(IDS); expect(getAllCards(fixture.storage).every(card => card.repetitions === 1)).toBe(true);
    expect(getAllStageProgress(fixture.storage).find(stage => stage.stageId === "emergency-fund")).toMatchObject({answeredCount:3,totalCount:3,progressPct:100});
    vi.setSystemTime(new Date("2026-01-02T12:00:00.000Z")); const due = getDueIds(getAllQuestionIds(locale), fixture.storage); expect(due.filter(id => IDS.includes(id))).toEqual(IDS); expect(IDS.every(id => getQuestionById(id, locale) !== undefined)).toBe(true);
  });
});


describe("independent C17 actual emergency PLEN content and existing save-guard acceptance", () => {
  it.each((["pl", "en"] as const).flatMap(locale => IDS.map((id, index) => ({ locale, id, index }))))("$locale $id renders canonical authored prompts/options/whole voice, wrong/retry feedback and existing reward", async ({ locale, id, index }) => {
    fixture.locale = locale;
    const { translations } = await import("@/lib/i18n"), { getTopicQuestions } = await import("@/lib/quiz-topic"), { getQuestionById } = await import("@/lib/allQuestions"), { quizQuestions } = await import("@/data/quizQuestions");
    const { default: metadata } = await import("@/docs/coachfi/cycle-17/content-metadata.json");
    const pool = getTopicQuestions(locale, "emergency"), canonical = getQuestionById(id, locale)!, question = pool[index];
    const reviewed = metadata.questions.find(question => question.id === id); expect(reviewed).toBeDefined(); if (!reviewed) throw Error("FIXTURE missing reviewed question");
    expect(pool.map(question => question.id)).toEqual(IDS); expect(pool.map(question => question.correctAnswer)).toEqual(KEYS); expect(pool.map(question => question.reward)).toEqual(REWARDS);
    expect(canonical.question).toBe(reviewed.copy[locale].question); expect(canonical.answers).toEqual(reviewed.copy[locale].answers); expect(canonical.explanation).toBe(reviewed.copy[locale].retryMessage);
    expect(question.question).toBe(canonical.question); expect(question.answers).toEqual(canonical.answers); expect(question.retryMessage).toBe(canonical.explanation);
    expect(question.successMessage).toBe(locale === "pl" ? canonical.explanation : quizQuestions.find(question => question.id === id)!.successMessage);
    if (locale === "pl") expect(question.question).not.toBe(getQuestionById(id, "en")!.question);
    let tree = settle(); for (let previous = 0; previous < index; previous++) { tree = submit(tree, KEYS[previous]); tree = action(tree, translations[locale].quiz.next); }
    expect(text(nodes(tree).find(node => node.type === "legend"))).toBe(canonical.question); expect(nodes(tree).filter(node => node.props.name === id).map(node => node.props.value)).toEqual(["A", "B", "C", "D"]);
    for (const answer of canonical.answers) expect(text(tree)).toContain(answer.text);
    const expectedVoice = [canonical.question, ...canonical.answers.map(answer => answer.id + ". " + answer.text)].join(" "); expect(expectedVoice.length).toBeLessThanOrEqual(500);
    const voices = nodes(tree).filter(node => node.props.text && node.props.locale); expect(voices).toHaveLength(2); expect(voices.every(node => node.props.text === expectedVoice && node.props.locale === locale)).toBe(true);
    const beforeWrong = bytes.get("coachfi-tokens"), count = reward.mock.calls.length;
    tree = submit(tree, "A"); expect(feedback(tree)).toBe(question.retryMessage); expect(bytes.get("coachfi-tokens")).toBe(beforeWrong); expect(reward).toHaveBeenCalledTimes(count);
    tree = action(tree, translations[locale].quiz.retry); tree = submit(tree, KEYS[index]); expect(feedback(tree)).toBe(question.successMessage); expect(bytes.get("coachfi-tokens")).toBe(String(BALANCES[index])); expect(reward).toHaveBeenLastCalledWith(REWARDS[index]);
    const cards = JSON.parse(fixture.storage.getItem("coachfi-srs")!) as Array<{ id: string; repetitions: number }>; expect(cards.find(card => card.id === id)?.repetitions).toBe(1);
    const saved = new Map(bytes), written = writes.length; submitHandler(tree)({ preventDefault() {} }); expect(bytes).toEqual(saved); expect(writes).toHaveLength(written);
  });
  it.each(["pl", "en"] as const)("%s actual three lesson steps display reviewed copy and lead to all three canonical cards for70 points", async locale => {
    fixture.locale = locale; await useLesson();
    const { stageLessons } = await import("@/data/stageLessons"), { default: metadata } = await import("@/docs/coachfi/cycle-17/content-metadata.json");
    const copy = stageLessons["emergency-fund"].copy[locale]!; let tree = settle(); expect(metadata.steps.map(step => step.question_id)).toEqual(IDS);
    for (let step = 0; step < 3; step++) {
      const reviewed = metadata.steps[step]; expect(reviewed).toBeDefined(); if (!reviewed) throw Error("FIXTURE missing reviewed step");
      expect(text(nodes(tree).find(node => node.type === "h2"))).toBe(reviewed.copy[locale].title); expect(text(tree)).toContain(reviewed.copy[locale].body);
      expect(JSON.parse(fixture.storage.getItem("coachfi-lesson-steps")!)["emergency-fund"]).toBe(step + 1); if (step < 2) tree = action(tree, copy.next);
    }
    expect(nodes(tree).some(node => node.props.href === "/quiz?topic=emergency")).toBe(true); expect(bytes.get("coachfi-tokens")).toBe("125");
    await useQuiz(); tree = settle(); const { translations } = await import("@/lib/i18n");
    for (let question = 0; question < 3; question++) { tree = submit(tree, KEYS[question]); expect(bytes.get("coachfi-tokens")).toBe(String(BALANCES[question])); if (question < 2) tree = action(tree, translations[locale].quiz.next); }
    expect(reward.mock.calls.map(call => call[0])).toEqual(REWARDS); expect(complete).toHaveBeenCalledExactlyOnceWith(3,3); expect(Number(bytes.get("coachfi-tokens")) - 125).toBe(70);
    const cards = JSON.parse(fixture.storage.getItem("coachfi-srs")!) as Array<{id:string;repetitions:number}>; expect(cards.map(card => card.id)).toEqual(IDS); expect(cards.every(card => card.repetitions === 1)).toBe(true);
    expect(JSON.parse(fixture.storage.getItem("coachfi-lesson-steps")!)["emergency-fund"]).toBe(3);
  });
  it("PL-to-EN invalidates eligible old emergency submit/radio, clears selection and permits only the current correct answer", async () => {
    const { translations } = await import("@/lib/i18n"), { getQuestionById } = await import("@/lib/allQuestions"); let tree = submit(settle(), "A"); expect(bytes.get("coachfi-tokens")).toBe("125");
    tree = action(tree, translations.pl.quiz.retry); nodes(tree).find(node => node.props.value === "C" && node.props.onChange)!.props.onChange!(); tree = settle();
    const oldSubmit = submitHandler(tree), oldRadio = nodes(tree).find(node => node.props.value === "C")!.props.onChange!, before = new Map(bytes), written = writes.length;
    expect(nodes(tree).some(node => node.props.value === "C" && node.props.checked)).toBe(true);
    const eligible = nodes(tree).filter(node => (node.props as Props & {type?:string}).type === "submit" && text(node) === translations.pl.quiz.submit); expect(eligible).toHaveLength(1); expect(eligible[0].props.disabled).toBe(false);
    fixture.locale = "en"; tree = settle(); fixture.setState.mockClear(); oldSubmit({preventDefault(){}}); oldRadio();
    expect(fixture.setState).not.toHaveBeenCalled(); expect(bytes).toEqual(before); expect(writes).toHaveLength(written); expect(nodes(tree).some(node => node.props.checked)).toBe(false);
    expect(text(nodes(tree).find(node => node.type === "legend"))).toBe(getQuestionById(IDS[0], "en")!.question); tree = submit(tree, "C"); expect(bytes.get("coachfi-tokens")).toBe("150"); expect(reward).toHaveBeenCalledExactlyOnceWith(25); expect(complete).not.toHaveBeenCalled();
  });
  it.each(["pl", "en"] as const)("%s last-step writer refusal preserves step2, blocks quiz and remains blocked across language change and stale Next", async locale => {
    fixture.locale = locale; await useLesson(); const { stageLessons } = await import("@/data/stageLessons"); const copy = stageLessons["emergency-fund"].copy[locale]!;
    let tree = action(settle(), copy.next);
    const oldNext = nodes(tree).find(node => node.props.onClick && text(node) === copy.next)!.props.onClick!; fixture.failLessonWrite = true; oldNext(); tree = settle();
    expect(nodes(tree).filter(node => node.props.role === "alert")).toHaveLength(1); expect(JSON.parse(fixture.storage.getItem("coachfi-lesson-steps")!)["emergency-fund"]).toBe(2); expect(bytes.get("coachfi-tokens")).toBe("125");
    expect(nodes(tree).some(node => node.props.href === "/quiz?topic=emergency")).toBe(false); expect(nodes(tree).some(node => node.props.disabled && text(node) === copy.quiz)).toBe(true);
    const before = new Map(bytes), written = writes.length; fixture.locale = locale === "pl" ? "en" : "pl"; tree = settle(); oldNext(); settle();
    expect(bytes).toEqual(before); expect(writes).toHaveLength(written); expect(nodes(tree).filter(node => node.props.role === "alert")).toHaveLength(1);
  });
  it.each(["pl", "en"] as const)("%s invalid emergency-fund4 raw counter remains byte-exact and refuses all writes and navigation across locale", async locale => {
    fixture.locale = locale; const raw = '{"emergency-fund":4}'; bytes.set("coachfi-lesson-steps", raw); const before = new Map(bytes), written = writes.length; await useLesson(); let tree = settle();
    expect(nodes(tree).filter(node => node.props.role === "alert")).toHaveLength(1); const { stageLessons } = await import("@/data/stageLessons");
    const next = nodes(tree).find(node => node.props.onClick && text(node) === stageLessons["emergency-fund"].copy[locale]!.next)!; expect(next.props.disabled).toBe(true); next.props.onClick!(); tree = settle();
    expect(bytes).toEqual(before); expect(writes).toHaveLength(written); expect(fixture.storage.getItem("coachfi-lesson-steps")).toBe(raw);
    fixture.locale = locale === "pl" ? "en" : "pl"; tree = settle(); expect(nodes(tree).filter(node => node.props.role === "alert")).toHaveLength(1); expect(bytes).toEqual(before); expect(writes).toHaveLength(written);
  });
  it("eligible current emergency submit cannot reward or save SRS after a synthetic owner switch", async () => {
    let tree = settle(); nodes(tree).find(node => node.props.value === "C" && node.props.onChange)!.props.onChange!(); tree = settle();
    const oldSubmit = submitHandler(tree); expect(nodes(tree).some(node => node.props.value === "C" && node.props.checked)).toBe(true); const { translations } = await import("@/lib/i18n");
    const submitButtons = nodes(tree).filter(node => (node.props as Props & {type?:string}).type === "submit" && text(node) === translations.pl.quiz.submit); expect(submitButtons).toHaveLength(1); expect(submitButtons[0].props.disabled).toBe(false);
    const store = await import("@/lib/product-storage"), next = store.beginStorageOwner({kind:"account",provider:"cdp",userId:"FIXTURE_EMERGENCY_OTHER"}); next.storage.setItem("coachfi-tokens", "77"); next.publishReady({localOnly:true});
    const before = new Map(bytes), written = writes.length; fixture.setState.mockClear(); oldSubmit({preventDefault(){}});
    expect(bytes).toEqual(before); expect(writes).toHaveLength(written); expect(fixture.setState).not.toHaveBeenCalled(); expect(reward).not.toHaveBeenCalled(); expect(complete).not.toHaveBeenCalled(); expect(store.captureCurrentPersonalStorage().getItem("coachfi-srs")).toBeNull();
  });
});
