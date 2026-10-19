import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

type Effect = () => void | (() => void);
const fixture = vi.hoisted(() => ({ locale: "pl" as import("@/lib/i18n").Locale, slot: 0, dirty: false,
  storage: null as unknown as PersonalStorageHandle, values: new Map<number, unknown>(),
  memos: new Map<number, { deps?: readonly unknown[]; value: unknown }>(),
  effects: [] as Effect[], effectDeps: new Map<number, readonly unknown[] | undefined>(), cleanups: new Map<number, () => void>(),
  setState: vi.fn(), markActive: vi.fn(),
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
      const previous = fixture.values.get(index), next = typeof value === "function" ? value(previous) : value;
      if (!Object.is(previous, next)) fixture.dirty = true; fixture.values.set(index, next); }];
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

const TARGETS = [
  { id: "asset-allocation", key: "B", reward: 25 },
  { id: "rebalancing", key: "B", reward: 25 },
  { id: "fees-ter", key: "B", reward: 30 },
  { id: "invest-prerequisites", key: "B", reward: 30 },
] as const;
const CASES = TARGETS.flatMap(target => (["pl", "en"] as const).map(locale => [target.id, locale, target.key, target.reward] as const));
const PLAIN_IDS = ["inflation-basics", "emergency-fund", "saving-habit", "interest-rates"];
let activeTarget: string = TARGETS[0].id;
type Props = { children?: unknown; text?: string; label?: string; disabled?: boolean; "data-testid"?: string; onClick?: () => void };
type Node = ReactElement<Props>;
function nodes(value: unknown): Node[] { if (Array.isArray(value)) return value.flatMap(nodes); if (!value || typeof value !== "object" || !("props" in value)) return []; const node = value as Node; return [node, ...nodes(node.props.children)]; }
function text(value: unknown): string { if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(text).join(""); return value && typeof value === "object" && "props" in value ? text((value as Node).props.children) : ""; }
function one(tree: unknown, id: string): Node { const found = nodes(tree).filter(node => node.props["data-testid"] === id); expect(found).toHaveLength(1); return found[0]!; }
let bytes: Map<string, string>, writes: Array<{ key: string; value?: string }>, render: () => ReactElement | null;
function resetHooks() { fixture.cleanups.forEach(callback => callback()); fixture.cleanups.clear(); fixture.values.clear(); fixture.memos.clear(); fixture.effectDeps.clear(); fixture.effects.length = 0; fixture.slot = 0; fixture.dirty = false; }
function settle() { for (let turn = 0; turn < 10; turn++) { fixture.slot = 0; fixture.dirty = false; const tree = render(); fixture.effects.splice(0).forEach(callback => callback()); if (!fixture.dirty && !fixture.effects.length) return tree; } throw Error("FIXTURE did not settle within10renders"); }
function cards() { return JSON.parse(bytes.get("coachfi-srs")!) as import("@/lib/srs").SRSCard[]; }
const targetCard = () => cards().find(card => card.id === activeTarget)!;
function observed(name: string, extra: Record<string, unknown>) { console.log("C33_UI_OBSERVATION " + JSON.stringify({ name, target: activeTarget, locale: fixture.locale, rawTokens: bytes.get("coachfi-tokens"), rawSteps: bytes.get("coachfi-lesson-steps"), SRS: targetCard(), writes: [...writes], activityCalls: fixture.markActive.mock.calls.length, ...extra })); }
async function useReview() { const { default: ReviewPage } = await import("@/app/review/page"); render = ReviewPage; }
function questionState(tree: unknown) { const question = text(one(tree, "review-question")), options = ["A", "B", "C", "D"].map(id => text(one(tree, "review-answer-" + id))); const voice = nodes(tree).find(node => node.props.label === "Przeczytaj pytanie")?.props.text; return { question, options, questionVoice: voice }; }
async function seedDue(id: string) {
  activeTarget = id; const { getAllQuestionIds } = await import("@/lib/allQuestions");
  bytes.set("coachfi-srs", JSON.stringify(getAllQuestionIds("en").map(questionId => ({ id: questionId, interval: 6, nextReview: questionId === id ? "2026-01-01" : "2026-12-01", repetitions: 1, easeFactor: 2.5, fixtureUnknown: { source: "C33_SYNTHETIC", retained: true } }))));
}

beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks(); resetHooks(); fixture.locale = "pl"; vi.useFakeTimers(); vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
  bytes = new Map([["coachfi-tokens", "125"], ["coachfi-lesson-steps", '{"retirement":2}']]); writes = [];
  const native = { getItem: (key: string) => bytes.get(key) ?? null, setItem: (key: string, value: string) => { writes.push({ key, value }); bytes.set(key, value); }, removeItem: (key: string) => { writes.push({ key }); bytes.delete(key); } };
  const win = new EventTarget() as EventTarget & { localStorage: typeof native; sessionStorage: typeof native }; Object.assign(win, { localStorage: native, sessionStorage: native }); vi.stubGlobal("window", win); vi.stubGlobal("fetch", vi.fn(() => { throw Error("FIXTURE no external calls"); }));
  const store = await import("@/lib/product-storage"); store.beginStorageOwner({ kind: "guest" }).publishReady(); fixture.storage = store.captureCurrentPersonalStorage();
  await seedDue(TARGETS[0].id);
});
afterEach(() => { expect(fetch).not.toHaveBeenCalled(); resetHooks(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("C33 four existing investing IDs actual Review localization and acknowledged schedules", () => {
  it("four IDs stay unique in bank82 and solely due via Review, outside default/staged quiz pools, with distinct canonical Polish prompts and rationales", async () => {
    const { getAllQuestionIds, getQuestionById, allQuestions } = await import("@/lib/allQuestions"), { getDueIds } = await import("@/lib/srs"), { getTopicQuestions } = await import("@/lib/quiz-topic"), { STAGE_QUESTION_IDS } = await import("@/lib/learningProgress");
    const inventory = [];
    for (const target of TARGETS) {
      await seedDue(target.id); const before = new Map(bytes);
      expect(Object.values(STAGE_QUESTION_IDS).flat()).not.toContain(target.id); expect(allQuestions.filter(question => question.id === target.id)).toHaveLength(1);
      for (const locale of ["pl", "en"] as const) { expect(getAllQuestionIds(locale)).toHaveLength(82); expect(getAllQuestionIds(locale).filter(id => id === target.id)).toHaveLength(1); expect(getQuestionById(target.id, locale)).toMatchObject({ id: target.id, correctAnswer: target.key, reward: target.reward }); expect(getDueIds(getAllQuestionIds(locale), fixture.storage)).toEqual([target.id]); expect(getTopicQuestions(locale).map(question => question.id)).toEqual(PLAIN_IDS); }
      inventory.push({ id: target.id, metadataKey: target.key, metadataReward: target.reward, PL: getQuestionById(target.id, "pl")!, EN: getQuestionById(target.id, "en")! });
      expect(bytes).toEqual(before); expect(writes).toEqual([]);
    }
    observed("bank-and-routing", { inventory, bank: 82, metadataRewardTotal: 110, directReviewReward: 0, defaultPlainIds: PLAIN_IDS });
    for (const item of inventory) { expect.soft(item.PL.question).not.toBe(item.EN.question); expect.soft(item.PL.explanation).not.toBe(item.EN.explanation); }
  });
  it.each(CASES)("%s %s actual correct key renders canonical prompt/options/voice and saves Jan7 acknowledgement without a quiz token reward", async (id, locale, key, reward) => {
    fixture.locale = locale; await seedDue(id); await useReview(); let tree = settle(); const { getQuestionById } = await import("@/lib/allQuestions"), canonical = getQuestionById(id, locale)!, english = getQuestionById(id, "en")!, shown = questionState(tree), before = new Map(bytes), otherCards = cards().filter(card => card.id !== id);
    expect(canonical).toMatchObject({ id, correctAnswer: key, reward }); expect(writes).toEqual([]); expect(shown.question).toBe(canonical.question); expect(shown.options).toEqual(canonical.answers.map(answer => answer.id + answer.text)); expect(shown.questionVoice).toBe(canonical.question); expect(canonical.question.length).toBeLessThanOrEqual(500); expect(one(tree, "review-check").props.disabled).toBe(true);
    one(tree, "review-answer-" + key).props.onClick!(); tree = settle(); expect(one(tree, "review-check").props.disabled).toBe(false); one(tree, "review-check").props.onClick!(); tree = settle(); const explanationVoice = nodes(tree).find(node => node.props.label === "Przeczytaj wyjaśnienie")?.props.text;
    observed("correct-" + id + "-" + locale, { canonical, ...shown, explanationVoice, renderedFeedback: text(tree), metadataReward: reward, directReviewReward: 0 });
    expect(text(tree)).toContain(locale === "pl" ? "✓ Dobrze!" : "✓ Correct!"); expect(text(tree)).toContain(canonical.explanation); expect(explanationVoice).toBe(canonical.explanation); expect(canonical.explanation.length).toBeLessThanOrEqual(500); expect(targetCard()).toMatchObject({ id, repetitions: 2, interval: 6, nextReview: "2026-01-07" }); expect(text(one(tree, "review-saved-date"))).toContain("2026-01-07"); expect(cards()).toHaveLength(82); expect(targetCard()).toMatchObject({ fixtureUnknown: { source: "C33_SYNTHETIC", retained: true } }); expect(cards().filter(card => card.id !== id)).toEqual(otherCards); expect(writes.map(write => write.key)).toEqual(["coachfi-srs"]); expect(bytes.get("coachfi-tokens")).toBe(before.get("coachfi-tokens")); expect(bytes.get("coachfi-lesson-steps")).toBe(before.get("coachfi-lesson-steps")); expect(fixture.markActive).toHaveBeenCalledTimes(1);
    if (locale === "pl") { expect.soft(shown.question).not.toBe(english.question); expect.soft(explanationVoice).not.toBe(english.explanation); }
  });
  it.each(CASES)("%s %s wrong A renders canonical rationale and saves Jan2 acknowledgement without reward or activity credit", async (id, locale, key, reward) => {
    fixture.locale = locale; await seedDue(id); await useReview(); let tree = settle(); const { getQuestionById } = await import("@/lib/allQuestions"), canonical = getQuestionById(id, locale)!, english = getQuestionById(id, "en")!, shown = questionState(tree), before = new Map(bytes), otherCards = cards().filter(card => card.id !== id);
    expect(canonical.correctAnswer).toBe(key); expect(canonical.reward).toBe(reward); expect(key).not.toBe("A"); expect(shown.question).toBe(canonical.question); expect(shown.options).toEqual(canonical.answers.map(answer => answer.id + answer.text)); expect(shown.questionVoice).toBe(canonical.question); expect(canonical.question.length).toBeLessThanOrEqual(500); expect(writes).toEqual([]); one(tree, "review-answer-A").props.onClick!(); tree = settle(); expect(one(tree, "review-check").props.disabled).toBe(false); one(tree, "review-check").props.onClick!(); tree = settle(); const explanationVoice = nodes(tree).find(node => node.props.label === "Przeczytaj wyjaśnienie")?.props.text;
    observed("wrong-" + id + "-" + locale, { canonical, ...shown, explanationVoice, renderedFeedback: text(tree), metadataReward: reward, directReviewReward: 0 });
    expect(text(tree)).toContain(locale === "pl" ? "✗ Jeszcze nie" : "✗ Not quite"); expect(text(tree)).toContain(canonical.explanation); expect(explanationVoice).toBe(canonical.explanation); expect(canonical.explanation.length).toBeLessThanOrEqual(500); expect(targetCard()).toMatchObject({ id, repetitions: 0, interval: 1, nextReview: "2026-01-02" }); expect(text(one(tree, "review-saved-date"))).toContain("2026-01-02"); expect(cards()).toHaveLength(82); expect(targetCard()).toMatchObject({ fixtureUnknown: { source: "C33_SYNTHETIC", retained: true } }); expect(cards().filter(card => card.id !== id)).toEqual(otherCards); expect(writes.map(write => write.key)).toEqual(["coachfi-srs"]); expect(bytes.get("coachfi-tokens")).toBe(before.get("coachfi-tokens")); expect(bytes.get("coachfi-lesson-steps")).toBe(before.get("coachfi-lesson-steps")); expect(fixture.markActive).not.toHaveBeenCalled();
    if (locale === "pl") { expect.soft(shown.question).not.toBe(english.question); expect.soft(explanationVoice).not.toBe(english.explanation); }
  });
});
