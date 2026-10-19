import { restorePreC15EnglishRecords, restorePreC15PlainRecords } from "./cycle69-legacy-preservation";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";
import baseline from "../evidence/cycle-6/review-baseline-non-target.json";

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
  "aria-live"?: string; onChange?: () => void; onClick?: () => void; onSubmit?: (event: { preventDefault(): void }) => void };
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
beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); fixture.slot = 0; fixture.locale = "pl";
  fixture.values.clear(); fixture.memos.clear(); fixture.effectDeps.clear(); fixture.effects.length = 0;
  bytes = new Map<string, string>(); const storage = { getItem: (key: string) => bytes.get(key) ?? null,
    setItem: (key: string, value: string) => { bytes.set(key, value); }, removeItem: (key: string) => { bytes.delete(key); } };
  vi.stubGlobal("window", { localStorage: storage, sessionStorage: storage, dispatchEvent: vi.fn() });
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No real network permitted."); }));
  const store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "guest" }).publishReady(); fixture.storage = store.captureCurrentPersonalStorage();
  const { addTokens } = await import("@/lib/tokens");
  reward = vi.fn<(amount: number) => void>(amount => { addTokens(amount, "FIXTURE C6 reward", "FIXTURE local C6", fixture.storage); }); complete = vi.fn<(correctCount: number, totalCount: number) => void>(); const { QuizCard } = await import("@/components/QuizCard");
  render = () => { fixture.slot = 0; return QuizCard({ topic: "mindset", onReward: reward, onComplete: complete }); };
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
const ids = ["net-worth", "lifestyle-inflation", "pay-yourself-first"];
const keys = ["B", "C", "B"], points = [25, 25, 20];
// Historical baseline English fallback observations remain in review-baseline*.json.
describe("independent B06 mindset localization and lifecycle acceptance", () => {
  it.each((["pl", "en"] as const).flatMap(locale => ids.map((id, index) => ({ locale, id, index }))))("actual $locale $id has canonical options, feedback, voice, answer key and reward", async ({ locale, id, index }) => {
    fixture.locale = locale; const { translations } = await import("@/lib/i18n"), t = translations[locale].quiz;
    const { getTopicQuestions } = await import("@/lib/quiz-topic"), { getQuestionById } = await import("@/lib/allQuestions"), { quizQuestions } = await import("@/data/quizQuestions");
    const pool = getTopicQuestions(locale, "mindset"), canonical = getQuestionById(id, locale)!;
    expect(pool.map(q => q.id)).toEqual(ids); expect(pool.map(q => q.correctAnswer)).toEqual(keys); expect(pool.map(q => q.reward)).toEqual(points);
    const question = pool[index]; expect(question.category).toBe(locale === "pl" ? "Nastawienie do pieniędzy" : "Money Mindset");
    expect(question.question).toBe(canonical.question); expect(question.answers).toEqual(canonical.answers);
    expect(question.retryMessage).toBe(canonical.explanation);
    expect(question.successMessage).toBe(locale === "pl" ? canonical.explanation : quizQuestions.find(q => q.id === id)!.successMessage);
    let tree = settle(); for (let i = 0; i < index; i++) { tree = submit(tree, keys[i]); tree = action(tree, t.next); }
    expect(text(nodes(tree).find(element => element.type === "legend"))).toBe(question.question);
    expect(nodes(tree).filter(element => element.props.name === id).map(element => element.props.value)).toEqual(["A", "B", "C", "D"]);
    for (const answer of question.answers) expect(text(tree)).toContain(answer.text);
    const expectedVoice = [question.question, ...question.answers.map(answer => `${answer.id}. ${answer.text}`)].join(" ");
    expect(expectedVoice.length).toBeLessThanOrEqual(500);
    const voices = nodes(tree).filter(element => element.props.text && element.props.locale);
    expect(voices).toHaveLength(2); expect(voices.every(element => element.props.locale === locale && element.props.text === expectedVoice)).toBe(true);
    const beforeWrong = reward.mock.calls.length; tree = submit(tree, "A");
    expect(reward.mock.calls.length).toBe(beforeWrong); expect(text(nodes(tree).find(element => element.props["aria-live"] === "polite"))).toBe(question.retryMessage);
    tree = action(tree, t.retry); tree = submit(tree, keys[index]);
    expect(text(nodes(tree).find(element => element.props["aria-live"] === "polite"))).toBe(question.successMessage);
    expect(reward).toHaveBeenLastCalledWith(points[index]);
    const saved = JSON.parse(fixture.storage.getItem("coachfi-srs")!) as Array<{ id: string; repetitions: number }>;
    expect(saved.find(card => card.id === id)?.repetitions).toBe(1);
    const once = new Map(bytes), beforeRepeat = reward.mock.calls.length;
    nodes(tree).find(element => element.props.onSubmit)!.props.onSubmit!({ preventDefault() {} });
    expect(bytes).toEqual(once); expect(reward.mock.calls.length).toBe(beforeRepeat);
  });

  it("completion/restart/locale change reset transient controls, retain canonical progress, and do not invent another reward", async () => {
    const { translations } = await import("@/lib/i18n"); let tree = settle();
    for (let i = 0; i < 3; i++) { tree = submit(tree, keys[i]); if (i < 2) tree = action(tree, translations.pl.quiz.next); }
    expect(reward.mock.calls.map(([amount]) => amount)).toEqual(points); expect(complete).toHaveBeenCalledExactlyOnceWith(3, 3);
    tree = action(tree, translations.pl.quiz.restart);
    expect(nodes(tree).filter(element => element.props.name === ids[0])).toHaveLength(4);
    nodes(tree).find(element => element.props.value === "A")!.props.onChange!(); settle(); const before = new Map(bytes);
    fixture.locale = "en"; tree = settle();
    expect(nodes(tree).filter(element => element.props.checked === true)).toHaveLength(0);
    expect(text(nodes(tree).find(element => element.type === "legend"))).toContain("net worth");
    expect(bytes).toEqual(before); expect(reward).toHaveBeenCalledTimes(3); expect(complete).toHaveBeenCalledOnce();
  });

  it.each(["guest", "account"])("a captured %s submit cannot write, reward or finish after a new owner", async (kind) => {
    const store = await import("@/lib/product-storage");
    if (kind === "account") { store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A" }).publishReady({ localOnly: true }); fixture.storage = store.captureCurrentPersonalStorage(); }
    let tree = settle(); nodes(tree).find(element => element.props.value === "B")!.props.onChange!(); tree = settle();
    const oldSubmit = nodes(tree).find(element => element.props.onSubmit)!.props.onSubmit!;
    const b = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B" }); b.storage.setItem("coachfi-tokens", "0042"); b.publishReady({ localOnly: true });
    const before = new Map(bytes); fixture.setState.mockClear(); oldSubmit({ preventDefault() {} });
    expect(bytes).toEqual(before); expect(reward).not.toHaveBeenCalled(); expect(complete).not.toHaveBeenCalled(); expect(fixture.setState).not.toHaveBeenCalled();
    expect(store.captureCurrentPersonalStorage().getItem("coachfi-srs")).toBeNull(); expect(fetch).not.toHaveBeenCalled();
  });

  it("prototype or unknown query strings are not topics and safely preserve the four-question plain pool", async () => {
    const { getTopicQuestions, isKnownQuizTopic } = await import("@/lib/quiz-topic"), { getQuizQuestions } = await import("@/lib/localizedQuiz");
    for (const topic of ["__proto__", "constructor", "toString", "unknown", "", undefined]) for (const locale of ["pl", "en"] as const) {
      expect(isKnownQuizTopic(topic)).toBe(false); expect(getTopicQuestions(locale, topic)).toEqual(getQuizQuestions(locale));
      expect(getTopicQuestions(locale, topic)).toHaveLength(4);
    }
  });

  it("nine plain pools outside C11 PL/EN saving, 55 non-mindset/non-saving English records and seven other lesson locales remain unchanged", async () => {
    const { getQuizQuestions } = await import("@/lib/localizedQuiz"), { quizQuestions } = await import("@/data/quizQuestions"), { moneyMindsetLesson } = await import("@/data/moneyMindsetLesson");
    const savingIDs = ["saving-habit", "budget-50-30-20", "high-yield-savings", "dca"];
    for (const [locale, questions] of Object.entries(baseline.plainByLocale)) {
      const actual = restorePreC15PlainRecords(getQuizQuestions(locale as import("@/lib/i18n").Locale), locale as import("@/lib/i18n").Locale);
      expect(actual.map(question => question.id)).toEqual(questions.map(question => question.id));
      const unchanged = (question: { id: string }) => !(locale === "pl" || locale === "en") || question.id !== "saving-habit";
      expect(actual.filter(unchanged)).toEqual(questions.filter(unchanged));
    }
    const unchangedEnglish = (question: { id: string }) => !ids.includes(question.id) && !savingIDs.includes(question.id);
    const actualEnglish = restorePreC15EnglishRecords(quizQuestions).filter(unchangedEnglish), expectedEnglish = baseline.nonMindsetEnglish.filter(unchangedEnglish);
    expect(actualEnglish).toHaveLength(55); expect(expectedEnglish).toHaveLength(55);
    expect(actualEnglish).toEqual(expectedEnglish);
    for (const [locale, lesson] of Object.entries(baseline.otherLessonLocales)) {
      const actual = moneyMindsetLesson[locale as import("@/lib/i18n").Locale]!;
      expect({ title: actual.title, next: actual.next, quiz: actual.quiz, steps: actual.steps }).toEqual(lesson);
    }
  });
});
